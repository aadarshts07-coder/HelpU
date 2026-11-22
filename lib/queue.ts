import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { JobListing, UserProfile, UserSettings, ApplicationRecord } from './types';
import { executePlaywrightApplication } from '../workers/playwrightRunner';
import { db } from './db';
import { sendApplicationStatusEmail } from './email';

let applicationQueue: Queue | null = null;
let redisConnection: IORedis | null = null;

function getQueue(): Queue | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl || redisUrl.trim() === '') {
    return null;
  }

  if (!applicationQueue) {
    try {
      redisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
      applicationQueue = new Queue('helpu-applications', { connection: redisConnection });
    } catch (err) {
      console.warn('Redis connection failed, queue will fallback to direct async execution:', err);
      return null;
    }
  }
  return applicationQueue;
}

export interface ApplicationJobData {
  job: JobListing;
  profile: UserProfile;
  settings: UserSettings;
}

/**
 * Triggers an application for a specific job.
 * Enqueues into BullMQ or processes directly with real-time status updates.
 */
export async function queueJobApplication(job: JobListing): Promise<ApplicationRecord> {
  const profile = await db.getProfile();
  const settings = await db.getSettings();

  // Check daily application limit
  const metrics = await db.getMetrics();
  if (metrics.dailyApplicationsCount >= settings.dailyApplicationLimit) {
    throw new Error(`Daily application limit (${settings.dailyApplicationLimit}) reached. Increase limit in Settings to apply for more jobs today.`);
  }

  // Check company blacklist
  const isBlacklisted = settings.blacklistedCompanies.some(c => 
    c.toLowerCase().trim() === job.company.toLowerCase().trim()
  );
  if (isBlacklisted) {
    throw new Error(`Company "${job.company}" is in your blacklist.`);
  }

  // Check match score against threshold
  if (job.matchScore < settings.jobMatchThreshold) {
    throw new Error(`Job match score (${job.matchScore}%) is below your minimum threshold (${settings.jobMatchThreshold}%).`);
  }

  // Create initial ApplicationRecord
  const initialRecord: ApplicationRecord = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    location: job.location,
    portal: job.portal,
    applyUrl: job.applyUrl,
    matchScore: job.matchScore,
    status: 'Pending review',
    statusReason: 'Application worker queued and starting automated submission process...',
    screenshots: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.saveApplication(initialRecord);

  // Try queueing to BullMQ
  const queue = getQueue();
  if (queue) {
    try {
      await queue.add('submit-application', { job, profile, settings });
      console.log(`[Queue] Added job ${job.id} to BullMQ queue`);
    } catch (err) {
      console.warn('[Queue] Failed to add to BullMQ, executing directly:', err);
      // Fall through to direct execution
      processApplicationDirectly(initialRecord, job, profile, settings);
    }
  } else {
    // Process directly asynchronously without blocking API response
    processApplicationDirectly(initialRecord, job, profile, settings);
  }

  return initialRecord;
}

async function processApplicationDirectly(
  record: ApplicationRecord,
  job: JobListing,
  profile: UserProfile,
  settings: UserSettings
) {
  try {
    const result = await executePlaywrightApplication(job, profile, settings);

    const updated = await db.saveApplication({
      ...record,
      status: result.status,
      statusReason: result.statusReason,
      screenshots: result.screenshots,
      requiresAttentionReason: result.requiresAttentionReason,
      questionsAnswered: result.questionsAnswered,
      appliedAt: result.status === 'Applied' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });

    // In-app notification
    let notifType: 'success' | 'warning' | 'error' | 'info' = 'info';
    if (result.status === 'Applied') notifType = 'success';
    if (result.status === 'Needs manual action') notifType = 'warning';
    if (result.status === 'Failed') notifType = 'error';

    await db.addNotification({
      title: `Application ${result.status}: ${job.company}`,
      message: `${job.title} at ${job.company} — ${result.statusReason}`,
      type: notifType,
      actionUrl: '/tracker',
      jobId: job.id,
    });

    // Email notification if enabled
    if (settings.emailNotifications) {
      await sendApplicationStatusEmail({
        to: settings.notificationEmail || profile.email,
        application: updated,
        reason: result.statusReason,
      });
    }
  } catch (err: any) {
    console.error('Direct application execution error:', err);
    await db.updateApplicationStatus(record.id, 'Failed', err.message || 'Worker processing error');
  }
}
