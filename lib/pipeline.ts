import { db } from './db';
import { UserProfile, UserSettings, JobListing, ResumeVersion } from './types';
import { generateATSResume, generateTailoredCoverLetter, scoreJobMatch } from './ai';
import { generateDocxResume } from './resumeDocx';
import { saveResumeFile } from './storage';
import { searchJobsAcrossPortals } from '../workers/jobScraper';
import { executePlaywrightApplication } from '../workers/playwrightRunner';
import { sendApplicationStatusEmail } from './email';

// In-memory debounce state
let debounceTimer: NodeJS.Timeout | null = null;
let isPipelineActive = false;
const DEBOUNCE_DELAY_MS = 3000;

/**
 * Public trigger called whenever the profile is updated.
 * Debounces rapid edits within a 3-second window to run the pipeline exactly once.
 */
export function triggerProfilePipeline(profile: UserProfile, immediate = false): Promise<void> {
  if (debounceTimer) {
    console.log('[Pipeline Engine] Debouncing profile update: resetting 3s countdown...');
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (immediate) {
    return runPipeline(profile);
  }

  return new Promise((resolve) => {
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      try {
        await runPipeline(profile);
      } catch (err) {
        console.error('[Pipeline Engine] Debounced execution failed:', err);
      }
      resolve();
    }, DEBOUNCE_DELAY_MS);
  });
}

/**
 * Core Autonomous Pipeline Execution
 * Step 1: Generate ATS Resume & Cover Letter with Claude (Facts only, versioned)
 * Step 2: Search Job Portals, deduplicate against existing apps, score with Claude
 * Step 3: Application execution via Playwright (Respects Review vs Auto Mode & obstacles)
 * Step 4: Tracking, notifications, and status telemetry
 */
export async function runPipeline(profile: UserProfile): Promise<void> {
  if (isPipelineActive) {
    console.log('[Pipeline Engine] Pipeline is already running, skipping overlapping run.');
    return;
  }

  isPipelineActive = true;

  try {
    const settings = await db.getSettings();

    // 0. Master Switch Check
    if (settings.isPaused) {
      console.log('[Pipeline Engine] Automation Active switch is OFF (Paused). Halting pipeline.');
      await db.updatePipelineStatus({
        isRunning: false,
        currentStep: 'paused',
        stepProgress: 0,
        message: 'Automation is paused. Turn on "Automation Active" in Settings to run job applications.',
        error: null,
      });
      return;
    }

    console.log(`[Pipeline Engine] Starting automated pipeline for profile: ${profile.name}...`);
    await db.updatePipelineStatus({
      isRunning: true,
      currentStep: 'generating_resume',
      stepProgress: 10,
      message: 'Generating ATS-optimized resume and tailored cover letter via Claude...',
      error: null,
    });

    // ----------------------------------------------------
    // STEP 1: ATS Resume & Cover Letter Generation (Claude)
    // ----------------------------------------------------
    console.log('[Pipeline Step 1] Synthesizing ATS Resume from verified profile facts...');
    const primaryRole = profile.targetJobTitles[0] || 'Software Engineer';
    const atsResumeContent = await generateATSResume(profile, primaryRole);
    const coverLetterText = await generateTailoredCoverLetter(profile, {
      title: primaryRole,
      company: 'Leading Innovation Tech',
      description: `Seeking an accomplished ${primaryRole} experienced in modern software architecture, high reliability, and collaborative engineering.`,
    });

    // Determine version (v1, v2, v3...)
    const existingVersions = await db.getResumeVersions();
    const versionNumber = existingVersions.length + 1;
    const versionLabel = `v${versionNumber}`;

    // Export DOCX buffer and save to public/resumes
    const docxBuffer = await generateDocxResume(atsResumeContent);
    const safeName = profile.name.replace(/[^a-zA-Z0-9]/g, '_');
    const docxFilename = `${safeName}_ATS_Resume_${versionLabel}.docx`;
    await saveResumeFile(docxBuffer, docxFilename);
    const docxUrl = `/resumes/${docxFilename}`;

    const resumeRecord: ResumeVersion = {
      id: `res_ver_${Date.now()}_${versionNumber}`,
      version: versionNumber,
      label: versionLabel,
      resumeData: atsResumeContent,
      coverLetter: coverLetterText,
      docxUrl,
      createdAt: new Date().toISOString(),
      targetRole: primaryRole,
    };
    await db.saveResumeVersion(resumeRecord);

    await db.addNotification({
      title: `Resume Version ${versionLabel} Generated`,
      message: `Created ATS-optimized resume version ${versionLabel} keyword-matched for ${profile.targetJobTitles.join(', ')}.`,
      type: 'success',
      actionUrl: '/resume',
    });

    await db.updatePipelineStatus({
      currentStep: 'searching_jobs',
      stepProgress: 35,
      resumeVersionLabel: versionLabel,
      message: `Saved resume ${versionLabel}. Searching job portals (LinkedIn, Indeed, Naukri, Career Pages)...`,
    });

    // ----------------------------------------------------
    // STEP 2: Job Search & Deduplication & Claude Match Scoring
    // ----------------------------------------------------
    console.log('[Pipeline Step 2] Searching job boards based on target roles & locations...');
    const searchedJobs = await searchJobsAcrossPortals(profile, {
      titles: profile.targetJobTitles,
      locations: profile.preferredLocations,
      limit: 10,
    });

    // Deduplicate against already applied jobs or existing applications in DB
    const existingApplications = await db.getApplications();
    const existingAppKeys = new Set(
      existingApplications.map(a => `${a.company.toLowerCase()}|${a.jobTitle.toLowerCase()}`)
    );
    const existingApplyUrls = new Set(existingApplications.map(a => a.applyUrl.toLowerCase()));

    // Filter by blacklists & existing applications
    const blacklistedCompaniesLower = (settings.blacklistedCompanies || []).map(c => c.toLowerCase());
    const blacklistedKeywordsLower = (settings.blacklistedKeywords || []).map(k => k.toLowerCase());

    const freshJobs = searchedJobs.filter(job => {
      const compLower = job.company.toLowerCase();
      const titleLower = job.title.toLowerCase();
      const descLower = job.description.toLowerCase();
      const key = `${compLower}|${titleLower}`;

      // Exclude blacklisted company
      if (blacklistedCompaniesLower.some(bc => compLower.includes(bc))) return false;
      // Exclude blacklisted keyword
      if (blacklistedKeywordsLower.some(bk => descLower.includes(bk) || titleLower.includes(bk))) return false;
      // Exclude already applied
      if (existingAppKeys.has(key)) return false;
      if (existingApplyUrls.has(job.applyUrl.toLowerCase())) return false;

      return true;
    });

    console.log(`[Pipeline Step 2] Found ${searchedJobs.length} total jobs, ${freshJobs.length} fresh after deduplication.`);
    await db.saveJobs(freshJobs);

    // Keep only jobs scoring above the threshold (default 75)
    const threshold = settings.jobMatchThreshold || 75;
    const qualifyingJobs = freshJobs.filter(j => j.matchScore >= threshold);

    console.log(`[Pipeline Step 2] ${qualifyingJobs.length} jobs qualified with score >= ${threshold}.`);

    await db.addNotification({
      title: `${qualifyingJobs.length} Qualifying Job Matches Found`,
      message: `Discovered ${qualifyingJobs.length} opportunities matching your criteria above the ${threshold}% threshold.`,
      type: 'info',
      actionUrl: '/tracker',
    });

    if (qualifyingJobs.length === 0) {
      await db.updatePipelineStatus({
        isRunning: false,
        currentStep: 'completed',
        stepProgress: 100,
        message: `Pipeline completed. ${freshJobs.length} jobs scanned; none reached your ${threshold}% match threshold.`,
        lastRunAt: new Date().toISOString(),
        jobsFoundCount: freshJobs.length,
        jobsAppliedCount: 0,
      });
      return;
    }

    // ----------------------------------------------------
    // STEP 3: Automated Application via Playwright
    // ----------------------------------------------------
    await db.updatePipelineStatus({
      currentStep: 'applying',
      stepProgress: 60,
      jobsFoundCount: qualifyingJobs.length,
      message: `Applying to ${qualifyingJobs.length} qualifying opportunities via Playwright worker...`,
    });

    // Check daily limit
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysApplications = existingApplications.filter(a => a.appliedAt && a.appliedAt.startsWith(todayStr));
    let dailyAppliedCount = todaysApplications.length;
    let appliedInThisRun = 0;

    for (let i = 0; i < qualifyingJobs.length; i++) {
      const job = qualifyingJobs[i];

      // Check daily rate limit
      if (dailyAppliedCount >= settings.dailyApplicationLimit) {
        console.warn(`[Pipeline Step 3] Daily application limit (${settings.dailyApplicationLimit}) reached. Stopping run.`);
        await db.addNotification({
          title: 'Daily Application Limit Reached',
          message: `Reached your limit of ${settings.dailyApplicationLimit} applications for today. Remaining jobs saved in tracker.`,
          type: 'warning',
          actionUrl: '/tracker',
        });
        break;
      }

      const progressPct = 60 + Math.round(((i + 1) / qualifyingJobs.length) * 35);
      await db.updatePipelineStatus({
        stepProgress: progressPct,
        message: `Processing application ${i + 1}/${qualifyingJobs.length}: ${job.title} at ${job.company}...`,
      });

      // Execute Playwright worker
      console.log(`[Pipeline Step 3] Running Playwright for ${job.title} at ${job.company}...`);
      const execution = await executePlaywrightApplication(job, profile, settings);

      const appId = `app_${Date.now()}_${i + 1}`;
      const record = await db.saveApplication({
        id: appId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        portal: job.portal,
        applyUrl: job.applyUrl,
        matchScore: job.matchScore,
        status: execution.status,
        statusReason: execution.statusReason,
        appliedAt: execution.status === 'Applied' ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        screenshots: execution.screenshots,
        tailoredResumeVersion: versionLabel,
        tailoredResumeId: resumeRecord.id,
        questionsAnswered: execution.questionsAnswered,
        requiresAttentionReason: execution.requiresAttentionReason,
      });

      if (execution.status === 'Applied') {
        dailyAppliedCount++;
        appliedInThisRun++;
        await db.addNotification({
          title: `Application Submitted: ${job.company}`,
          message: `Successfully submitted tailored application for ${job.title} at ${job.company}.`,
          type: 'success',
          actionUrl: '/tracker',
          jobId: job.id,
        });
      } else if (execution.status === 'Pending review') {
        appliedInThisRun++;
        await db.addNotification({
          title: `Action: Review Ready for ${job.company}`,
          message: `Application for ${job.title} at ${job.company} filled with tailored resume. Awaiting your 1-click approval.`,
          type: 'info',
          actionUrl: '/tracker',
          jobId: job.id,
        });
      } else if (execution.status === 'Needs manual action') {
        await db.addNotification({
          title: `Attention Required: ${job.company}`,
          message: execution.statusReason || `Obstacle detected while applying to ${job.company}. Click to view screenshot and resolve.`,
          type: 'warning',
          actionUrl: '/tracker',
          jobId: job.id,
        });
      }

      // Send email notification if user enabled it
      if (settings.emailNotifications && settings.notificationEmail) {
        try {
          await sendApplicationStatusEmail({
            to: settings.notificationEmail,
            application: record,
            reason: execution.statusReason,
          });
        } catch (emailErr) {
          console.warn('[Pipeline Step 3] Email notification send error:', emailErr);
        }
      }

      // Human-like pause between multiple job applications (1.5 - 3.5s)
      if (i < qualifyingJobs.length - 1) {
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 2000 + 1500)));
      }
    }

    // ----------------------------------------------------
    // STEP 4: Completion Telemetry & Notifications
    // ----------------------------------------------------
    console.log(`[Pipeline Engine] Pipeline finished successfully. Applied/queued: ${appliedInThisRun}.`);
    await db.updatePipelineStatus({
      isRunning: false,
      currentStep: 'completed',
      stepProgress: 100,
      message: `Pipeline completed. Generated ${versionLabel}, found ${qualifyingJobs.length} matches, processed ${appliedInThisRun} applications.`,
      lastRunAt: new Date().toISOString(),
      resumeVersionLabel: versionLabel,
      jobsFoundCount: qualifyingJobs.length,
      jobsAppliedCount: appliedInThisRun,
      error: null,
    });
  } catch (err: any) {
    console.error('[Pipeline Engine] Pipeline encountered unhandled error:', err);
    await db.updatePipelineStatus({
      isRunning: false,
      currentStep: 'error',
      stepProgress: 0,
      message: `Pipeline encountered an error: ${err.message || 'Unknown error'}`,
      error: err.message || 'Unknown error',
    });
  } finally {
    isPipelineActive = false;
  }
}
