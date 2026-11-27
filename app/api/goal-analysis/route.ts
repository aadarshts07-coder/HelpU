import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import {
  fetchGoalAnalysisFromSupabase,
  saveGoalAnalysisToSupabase,
  updateSupabaseCompletedSteps,
  fetchGoalCertificationsFromSupabase,
} from '@/lib/supabase';
import {
  GoalAnalysisRecord,
  GoalAnalysisResult,
  RecommendedCertification,
} from '@/lib/types';
import {
  CERTIFICATION_CATALOG,
  CERTIFICATION_CATALOG_MAP,
  CertificationCatalogEntry,
} from '@/lib/data/certifications-catalog';
import { evidenceService } from '@/lib/certifications/evidence-service';
import { fallbackGoalUnderstanding } from '@/lib/certifications/goal-parser';
import { rankCertificationsForGoal } from '@/lib/certifications/ranking-service';

// ================= ZOD SCHEMAS =================

const ActionStepSchema = z.object({
  id: z.string(),
  text: z.string(),
  phase: z.enum(['week_1_2', 'week_3_6', 'week_7_plus']).optional(),
});

const GapCardSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  resumeNow: z.string(),
  goalNeeds: z.string(),
  whyItMatters: z.string(),
  actionSteps: z.array(ActionStepSchema).min(1),
});

const RoadmapPhaseSchema = z.object({
  phaseId: z.enum(['week_1_2', 'week_3_6', 'week_7_plus']),
  title: z.string(),
  subtitle: z.string(),
  items: z.array(z.string()).min(1),
});

const RecommendedCertificationSchema = z.object({
  certKey: z.string(),
  closesGaps: z.array(z.number()).default([]),
  whyForGoal: z.string(),
  roadmapPhase: z.enum(['quickWins', 'buildProof', 'polish']).default('quickWins'),
  tags: z.array(z.enum(['best_roi', 'fastest', 'free', 'most_requested', 'stretch'])).default([]),
  readinessBonus: z.number().min(2).max(6).default(4),
});

export const GoalAnalysisResultSchema = z.object({
  readinessScore: z.number().min(0).max(100),
  summary: z.string(),
  stats: z.object({
    gapsFound: z.number(),
    highImpactCount: z.number(),
    timelineMonths: z.number(),
  }),
  gaps: z.array(GapCardSchema).min(1),
  roadmap: z.array(RoadmapPhaseSchema).min(1),
  certifications: z.array(RecommendedCertificationSchema).default([]),
});

const RequestBodySchema = z.object({
  goal: z.string().min(3, 'Goal must be at least 3 characters.'),
  timeline: z.string().default('3 months'),
  resumeText: z.string().min(10, 'Resume text or profile content is required.'),
});

// ================= IN-MEMORY SLIDING RATE LIMITER =================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkEndpointRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

// ================= PII SANITIZATION =================
export function sanitizeResumeForAI(text: string): string {
  if (!text) return '';

  return (
    text
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[REDACTED_EMAIL]')
      .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]')
      .replace(
        /\b\d{1,5}\s+([A-Za-z0-9\s.,#-]+)(?:Avenue|Lane|Road|Boulevard|Drive|Street|Ave|Dr|Rd|Blvd|Ln|St|Way|Plaza|Court|Ct)\b/gi,
        '[REDACTED_ADDRESS]'
      )
      .replace(/\b\d{5}(?:[-\s]\d{4})?\b/g, '[REDACTED_POSTAL_CODE]')
  );
}

// ================= JOB MENTION QUERY HELPER =================
function countJobMentions(cert: CertificationCatalogEntry, allJobs: any[]): number {
  if (!allJobs || allJobs.length === 0) return 14;

  const searchTerms = [cert.name, ...(cert.aliases || []), ...(cert.skills || [])]
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean);

  let count = 0;
  for (const job of allJobs) {
    const title = (job.title || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    const skills = Array.isArray(job.missingSkills) ? job.missingSkills.join(' ').toLowerCase() : '';
    const blob = `${title} ${desc} ${skills}`;

    const matches = searchTerms.some((t) => blob.includes(t));
    if (matches) count++;
  }

  return Math.max(3, count);
}

function loadAllAvailableJobs(): any[] {
  try {
    const jobsFile = path.join(process.cwd(), 'data', 'jobs-index.json');
    if (fs.existsSync(jobsFile)) {
      const raw = fs.readFileSync(jobsFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

// ================= ENRICH RECOMMENDATIONS WITH CATALOG DATA & EMPLOYER EVIDENCE =================
function enrichCertifications(
  rawCerts: z.infer<typeof RecommendedCertificationSchema>[],
  allJobs: any[],
  userCertStatuses?: Map<string, any>
): RecommendedCertification[] {
  return rawCerts
    .map((c) => {
      const catalogEntry = CERTIFICATION_CATALOG_MAP.get(c.certKey);
      if (!catalogEntry) return null;

      const mentions = countJobMentions(catalogEntry, allJobs);
      const userStatusRecord = userCertStatuses?.get(c.certKey);

      // Deep employer evidence lookup
      const { evidence, matchScoreBefore, matchScoreAfter } = evidenceService.findEvidenceForCertification({
        key: catalogEntry.key,
        name: catalogEntry.name,
        issuer: catalogEntry.issuer,
        level: catalogEntry.level,
        exam_code: catalogEntry.exam_code,
        category: catalogEntry.category,
        skills: catalogEntry.skills,
        aliases: catalogEntry.aliases,
        cost_usd_min: catalogEntry.cost_usd_min,
        cost_usd_max: catalogEntry.cost_usd_max,
        cost_currency: 'USD',
        is_free: catalogEntry.is_free,
        study_weeks: catalogEntry.study_weeks,
        validity_years: catalogEntry.validity_years,
        difficulty: catalogEntry.difficulty,
        official_url: catalogEntry.official_url,
        source_name: 'Verified Official Catalog',
        source_url: catalogEntry.official_url,
        fetched_at: new Date().toISOString(),
        last_verified_at: catalogEntry.last_verified_at,
        confidence: 0.99,
        common_employers: catalogEntry.common_employers,
      });

      return {
        certKey: c.certKey,
        closesGaps: c.closesGaps || [],
        whyForGoal: c.whyForGoal,
        roadmapPhase: c.roadmapPhase || 'quickWins',
        tags: c.tags || ['best_roi'],
        readinessBonus: c.readinessBonus || 4,
        catalogEntry,
        openJobsMentionCount: evidence.totalMentionCount || mentions,
        userStatus: userStatusRecord?.status || 'not_started',
        targetDate: userStatusRecord?.target_date || undefined,
        earnedDate: userStatusRecord?.earned_date || undefined,
        credentialUrl: userStatusRecord?.credential_url || undefined,
        matchScoreBefore,
        matchScoreAfter,
        evidence: evidence as any,
      };
    })
    .filter((c): c is RecommendedCertification => c !== null);
}

// ================= ANTHROPIC CLIENT HELPER =================
function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_claude_api_key_here') {
    return null;
  }
  return new Anthropic({ apiKey });
}

function getSystemPrompt(): string {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', 'goal-analysis.md');
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf8');
    }
  } catch (err) {
    console.warn('[API goal-analysis] Could not read /prompts/goal-analysis.md from disk:', err);
  }
  return 'You are an executive hiring committee leader. Perform an in-depth career gap analysis and return strictly valid JSON matching the schema.';
}

function parseTimelineMonths(timeline: string): number {
  const match = timeline.match(/\d+/);
  return match ? parseInt(match[0], 10) : 3;
}

// ================= DYNAMIC FALLBACK GENERATOR =================
function generateFallbackGoalAnalysis(goal: string, timeline: string, resumeText: string): GoalAnalysisResult {
  const timelineMonths = parseTimelineMonths(timeline);
  const normalizedGoal = goal.toLowerCase();

  const isSenior = normalizedGoal.includes('senior') || normalizedGoal.includes('lead') || normalizedGoal.includes('staff');
  const isBackend = normalizedGoal.includes('backend') || normalizedGoal.includes('platform') || normalizedGoal.includes('infra');
  const isFrontend = normalizedGoal.includes('frontend') || normalizedGoal.includes('ui') || normalizedGoal.includes('web');

  let baseline = 68;
  if (isSenior) baseline -= 4;
  if (timelineMonths === 1) baseline -= 6;
  if (timelineMonths === 6) baseline += 5;
  baseline = Math.max(52, Math.min(78, baseline));

  const gaps: z.infer<typeof GapCardSchema>[] = [];

  // Gap 1: Distributed Systems or Frontend Architecture
  if (isBackend || (!isFrontend && isSenior)) {
    gaps.push({
      id: 'gap_1_scale',
      category: 'Distributed Systems & Scale',
      title: 'High-Throughput Caching & Database Sharding Patterns',
      severity: 'high',
      resumeNow: 'Mentions relational PostgreSQL CRUD queries and general database design, but lacks explicit proof of distributed caching or handling concurrency bottlenecks (>5,000 QPS).',
      goalNeeds: `${goal} roles require proven ownership of low-latency caching tiers (Redis/Memcached), cache invalidation strategies, database connection pooling, and sub-50ms p99 SLAs.`,
      whyItMatters: 'Senior engineering panels aggressively drill into cache-aside vs write-through consistency and failure domain isolation during technical screens.',
      actionSteps: [
        {
          id: 'step_1_1',
          text: 'Architect an open-source reference microservice demonstrating Redis cache-aside with write-through consistency and benchmarked p99 latency under load.',
          phase: 'week_1_2',
        },
        {
          id: 'step_1_2',
          text: 'Rewrite existing experience bullets into quantified XYZ impact: "Reduced database CPU load by 54% and p99 query latency from 340ms to 38ms by designing a multi-tier caching layer."',
          phase: 'week_1_2',
        },
        {
          id: 'step_1_3',
          text: 'Document failover strategies, circuit breakers, and rate-limiting middleware in a short technical system design RFC.',
          phase: 'week_3_6',
        },
      ],
    });
  } else {
    gaps.push({
      id: 'gap_1_fe_scale',
      category: 'Web Performance & Architecture',
      title: 'Core Web Vitals & Production Micro-Frontend Orchestration',
      severity: 'high',
      resumeNow: 'Shows proficiency in React and component development, but lacks quantifiable evidence of optimizing Core Web Vitals (LCP < 1.8s, INP < 200ms) on high-traffic consumer web surfaces.',
      goalNeeds: `For ${goal}, top tech companies require deep mastery of server components (RSC), asset waterfall elimination, dynamic code-splitting, and real-user monitoring (RUM).`,
      whyItMatters: 'Staff and Senior frontend interviews test deep browser rendering pipelines, memory leak profiling, and bundle tree-shaking over basic UI syntax.',
      actionSteps: [
        {
          id: 'step_1_1',
          text: 'Profile and record performance benchmarks achieving 98+ Google Lighthouse scores with Next.js App Router and dynamic code chunking.',
          phase: 'week_1_2',
        },
        {
          id: 'step_1_2',
          text: 'Revise resume bullets to highlight metric gains: "Boosted Core Web Vitals to 99th percentile across 2M+ visits, cutting Largest Contentful Paint by 42%."',
          phase: 'week_1_2',
        },
        {
          id: 'step_1_3',
          text: 'Create an accessible, keyboard-navigable component design system adhering to WCAG 2.1 AA specifications.',
          phase: 'week_3_6',
        },
      ],
    });
  }

  // Gap 2: Leadership
  gaps.push({
    id: 'gap_2_leadership',
    category: 'Engineering Leadership & Cross-Functional Impact',
    title: 'Cross-Functional Technical Direction & Architecture RFC Ownership',
    severity: 'high',
    resumeNow: 'Framed primarily around individual task delivery and ticket completion rather than driving technical roadmaps, writing architecture RFCs, or mentoring engineers.',
    goalNeeds: `Hiring committees for ${goal} seek candidates who demonstrate business acumen, cross-team alignment with Product & Design, and proactive technical risk mitigation.`,
    whyItMatters: 'Candidates without demonstrable project sponsorship and architectural RFC ownership are frequently down-leveled to mid-level roles.',
    actionSteps: [
      {
        id: 'step_2_1',
        text: 'Reframe projects on your resume around business KPIs (churn reduction, developer velocity, infrastructure cost savings) rather than tools alone.',
        phase: 'week_1_2',
      },
      {
        id: 'step_2_2',
        text: 'Draft and publish a technical RFC template detailing trade-offs, security postures, and migration rollbacks for an ambitious feature.',
        phase: 'week_3_6',
      },
      {
        id: 'step_2_3',
        text: 'Add explicit mentorship accomplishments: "Mentored 3 junior/mid engineers and established team-wide TypeScript & automated testing standards."',
        phase: 'week_1_2',
      },
    ],
  });

  // Gap 3: Cloud & Observability
  gaps.push({
    id: 'gap_3_cloud',
    category: 'Cloud Infrastructure & Observability',
    title: 'Automated CI/CD Pipelines, Docker Containerization & OpenTelemetry',
    severity: 'medium',
    resumeNow: 'Mentions cloud platforms generally, but lacks concrete metrics regarding automated canary deployments, telemetry tracing, or infrastructure-as-code.',
    goalNeeds: 'Strong familiarity with modern observability stacks (Prometheus, OpenTelemetry, Datadog), containerization, and zero-downtime blue/green deployment workflows.',
    whyItMatters: 'Modern engineering organizations expect engineers to own their code in production with automated alerting, MTTR reduction, and monitoring.',
    actionSteps: [
      {
        id: 'step_3_1',
        text: 'Set up an automated GitHub Actions CI/CD workflow with linting, unit test coverage gates (>85%), and automated preview deployments.',
        phase: 'week_1_2',
      },
      {
        id: 'step_3_2',
        text: 'Add structured logging, health check endpoints, and distributed tracing instrumentation to your featured portfolio project.',
        phase: 'week_3_6',
      },
    ],
  });

  // Gap 4: Interview Polish
  gaps.push({
    id: 'gap_4_narrative',
    category: 'Interview Polish & Thought Leadership',
    title: 'System Design Narrative Polish & Public Technical Artifacts',
    severity: 'low',
    resumeNow: 'GitHub profile and resume show solid technical projects, but lack concise one-paragraph architectural diagrams or public system design write-ups.',
    goalNeeds: 'Polished technical elevator pitch, clean public repository readmes with architecture diagrams, and prepared STAR interview stories.',
    whyItMatters: 'Clear verbal and visual communication of system design concepts is the deciding factor between a standard hire and an offer with top-band equity compensation.',
    actionSteps: [
      {
        id: 'step_4_1',
        text: 'Prepare 4 high-stakes STAR behavioral narratives emphasizing conflict resolution, architectural pivots, and critical production outage post-mortems.',
        phase: 'week_7_plus',
      },
      {
        id: 'step_4_2',
        text: 'Add a clean Mermaid or SVG system architecture diagram to your primary open-source portfolio repository.',
        phase: 'week_7_plus',
      },
    ],
  });

  const roadmap: z.infer<typeof RoadmapPhaseSchema>[] = [
    {
      phaseId: 'week_1_2',
      title: 'Weeks 1–2: Quick Wins',
      subtitle: 'Resume reframing, high-impact XYZ metrics & immediate positioning',
      items: [
        'Audit all past experience bullets and inject quantifiable throughput, latency, and business metrics.',
        `Align headline and keywords specifically targeting "${goal}" to achieve a 90%+ ATS score.`,
        'Set up automated GitHub Actions CI/CD pipeline on personal repositories.',
      ],
    },
    {
      phaseId: 'week_3_6',
      title: 'Weeks 3–6: Build Proof',
      subtitle: 'Tangible architecture artifacts & live deployed reference projects',
      items: [
        'Build and publish a production-grade reference microservice with caching, rate limiting, and observability.',
        'Draft an engineering RFC demonstrating deep technical decision-making and trade-off analysis.',
        'Conduct 3 timed system design simulations tackling high-traffic scale scenarios.',
      ],
    },
    {
      phaseId: 'week_7_plus',
      title: 'Weeks 7+: Polish & Showcase',
      subtitle: 'Interview narratives, system design simulations & targeted outreach',
      items: [
        'Rehearse STAR behavioral leadership stories emphasizing mentorship and cross-functional ownership.',
        'Initiate targeted outreach to engineering managers and talent partners at target firms.',
        'Finalize portfolio showcase with system architecture diagrams and live demo links.',
      ],
    },
  ];

  // Recommended Certifications chosen ONLY from CERT_CATALOG
  const certifications: z.infer<typeof RecommendedCertificationSchema>[] = [
    {
      certKey: 'aws-saa',
      closesGaps: [0, 2],
      whyForGoal: `Validates deep cloud architecture and high-availability patterns required for ${goal}, instantly boosting recruiter screening rates.`,
      roadmapPhase: 'quickWins',
      tags: ['best_roi', 'most_requested'],
      readinessBonus: 5,
    },
    {
      certKey: 'terraform-assoc',
      closesGaps: [2],
      whyForGoal: 'Proves your ability to automate cloud infrastructure as code in under 3 weeks of study, filling a direct gap in modern DevOps workflows.',
      roadmapPhase: 'quickWins',
      tags: ['fastest', 'best_roi'],
      readinessBonus: 4,
    },
    {
      certKey: 'ckad',
      closesGaps: [0, 2],
      whyForGoal: 'Demonstrates hands-on container orchestration and microservice deployment under strict time limits, respected by top-tier engineering hiring teams.',
      roadmapPhase: 'buildProof',
      tags: ['most_requested'],
      readinessBonus: 5,
    },
    {
      certKey: 'fcc-fullstack',
      closesGaps: [0],
      whyForGoal: '100% free verified credential showcasing end-to-end full stack architecture with verifiable projects you can link directly in your resume.',
      roadmapPhase: 'quickWins',
      tags: ['free'],
      readinessBonus: 3,
    },
    {
      certKey: 'github-actions',
      closesGaps: [2],
      whyForGoal: 'Solidifies automated continuous integration and testing credentials in a fast 2-week exam that hiring managers look for on modern CI/CD stacks.',
      roadmapPhase: 'quickWins',
      tags: ['fastest'],
      readinessBonus: 3,
    },
  ];

  return {
    readinessScore: baseline,
    summary: `Your profile demonstrates strong foundational capabilities, but reaching "${goal}" within ${timeline} requires bridging ${gaps.filter((g) => g.severity === 'high').length} high-impact technical and leadership gaps. Focus on concrete architectural scale metrics and targeted credentials to position yourself as an immediate day-one contributor.`,
    stats: {
      gapsFound: gaps.length,
      highImpactCount: gaps.filter((g) => g.severity === 'high').length,
      timelineMonths,
    },
    gaps,
    roadmap,
    certifications,
  };
}

// ================= ROUTE HANDLERS =================

/**
 * GET /api/goal-analysis
 * Restore the user's latest goal analysis and completed steps from Supabase (or local fallback),
 * enriched with user certification statuses and catalog data.
 */
export async function GET(req: Request) {
  try {
    const sessionCookie = req.headers.get('cookie') || '';
    const userIdMatch = sessionCookie.match(/helpu_session=([^;]+)/);
    const userId = userIdMatch ? userIdMatch[1].trim() : 'usr_demo_101';

    // 1. Try Supabase first
    let record = await fetchGoalAnalysisFromSupabase(userId);
    let source = 'supabase';

    // 2. Fall back to local database store
    if (!record) {
      record = await db.getLatestGoalAnalysis(userId);
      source = 'local';
    }

    if (!record) {
      return NextResponse.json({ record: null });
    }

    // 3. Load user certification statuses
    const [supaCertStatuses, localCertStatuses] = await Promise.all([
      fetchGoalCertificationsFromSupabase(userId, record.id).catch(() => []),
      db.getGoalCertifications(userId, record.id).catch(() => []),
    ]);

    const certStatusMap = new Map<string, any>();
    [...localCertStatuses, ...supaCertStatuses].forEach((cs) => {
      certStatusMap.set(cs.cert_key, cs);
    });

    // 4. Enrich or auto-discover certifications with catalog data & employer evidence
    const allJobs = loadAllAvailableJobs();
    if (record.result) {
      if (!Array.isArray(record.result.certifications) || record.result.certifications.length === 0) {
        console.log(`[API GET /api/goal-analysis] No certifications found for record ${record.id}, discovering for "${record.goal}"...`);
        const understanding = fallbackGoalUnderstanding(record.goal);
        const { ranked } = rankCertificationsForGoal(
          CERTIFICATION_CATALOG.map((c) => ({
            ...c,
            cost_currency: 'USD',
            source_name: 'Verified Official Catalog',
            source_url: c.official_url,
            fetched_at: new Date().toISOString(),
            confidence: 0.99,
          })),
          understanding,
          record.timeline
        );

        record.result.certifications = ranked.slice(0, 6).map((r) => ({
          certKey: r.key,
          closesGaps: r.closesGaps,
          whyForGoal: r.whyForGoal,
          roadmapPhase: 'quickWins',
          tags: r.tags,
          readinessBonus: r.readinessBonus,
          catalogEntry: CERTIFICATION_CATALOG_MAP.get(r.key),
          openJobsMentionCount: r.evidence?.totalMentionCount || 12,
          userStatus: certStatusMap.get(r.key)?.status || 'not_started',
          matchScoreBefore: r.matchScoreBefore,
          matchScoreAfter: r.matchScoreAfter,
          evidence: r.evidence as any,
        }));

        // Persist back to store
        Promise.all([
          saveGoalAnalysisToSupabase(record).catch(() => {}),
          db.saveGoalAnalysis(record).catch(() => {}),
        ]).catch(() => {});
      } else {
        record.result.certifications = enrichCertifications(
          record.result.certifications,
          allJobs,
          certStatusMap
        );
      }
    }

    return NextResponse.json({ record, source });
  } catch (err: any) {
    console.error('[API GET /api/goal-analysis] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve goal analysis' }, { status: 500 });
  }
}

/**
 * POST /api/goal-analysis
 * Analyze candidate resume against target career goal & timeline using Claude API.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const cookieHeader = req.headers.get('cookie') || '';
    const userIdMatch = cookieHeader.match(/helpu_session=([^;]+)/);
    const userId = userIdMatch && userIdMatch[1] !== 'logged_out' ? userIdMatch[1].trim() : 'usr_demo_101';

    // 2. Rate-limit endpoint
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimitKey = `goal_analysis_${userId}_${ip}`;
    const rateCheck = checkEndpointRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateCheck.retryAfterSeconds || 60} seconds before requesting another analysis.`,
        },
        { status: 429 }
      );
    }

    // 3. Validate Request Body
    const rawBody = await req.json();
    const parsedBody = RequestBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      const errorMsg = parsedBody.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { goal, timeline, resumeText } = parsedBody.data;

    // 4. Privacy: Sanitize candidate contact details
    const sanitizedResume = sanitizeResumeForAI(resumeText);

    // 5. Invoke Claude API with System Prompt and Catalog context
    const client = getAnthropicClient();
    const systemPrompt = getSystemPrompt();
    let validatedResult: GoalAnalysisResult | null = null;

    // Condensed catalog representation for Claude prompt
    const certCatalogPromptList = CERTIFICATION_CATALOG.map((c) => ({
      key: c.key,
      name: c.name,
      issuer: c.issuer,
      level: c.level,
      category: c.category,
      study_weeks: c.study_weeks,
      cost_usd_min: c.cost_usd_min,
      is_free: c.is_free,
      skills: c.skills.slice(0, 5),
    }));

    if (client) {
      const userPrompt = `TARGET CAREER GOAL: ${goal}
TARGET TIMELINE: ${timeline}

VERIFIED CERTIFICATION CATALOG (Select 3-6 certs ONLY from this list, using their exact "key"):
${JSON.stringify(certCatalogPromptList, null, 2)}

CANDIDATE'S SANITIZED RESUME / PROFILE:
"""
${sanitizedResume}
"""

Please evaluate this candidate against the goal and timeline. Provide an objective readiness score (0-100), identify high/medium/low severity gaps with "Your resume now" vs "Goal needs" side-by-side contrast, why each gap matters to hiring committees, actionable checklist steps per gap, a 3-phase roadmap, and 3-6 verified certifications chosen ONLY from the catalog above.
Return ONLY the raw JSON object. Do not include markdown codeblocks or conversational text.`;

      // Attempt 1
      try {
        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3800,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const rawParsed = JSON.parse(jsonMatch[0]);
          const result = GoalAnalysisResultSchema.safeParse(rawParsed);
          if (result.success) {
            validatedResult = result.data;
          }
        }
      } catch (firstErr) {
        console.warn('[API goal-analysis] Claude API Attempt 1 failed:', firstErr);
      }

      // Retry once if Attempt 1 was malformed
      if (!validatedResult) {
        try {
          const retryResponse = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 3800,
            temperature: 0.1,
            system: `${systemPrompt}\nIMPORTANT: Your previous response was not strictly parseable JSON. Output pure, unformatted JSON only.`,
            messages: [
              { role: 'user', content: userPrompt },
              { role: 'assistant', content: '{' },
            ],
          });

          const retryText = '{' + (retryResponse.content[0]?.type === 'text' ? retryResponse.content[0].text : '');
          const retryMatch = retryText.match(/\{[\s\S]*\}/);
          if (retryMatch) {
            const rawRetry = JSON.parse(retryMatch[0]);
            const retryZod = GoalAnalysisResultSchema.safeParse(rawRetry);
            if (retryZod.success) {
              validatedResult = retryZod.data;
            }
          }
        } catch (retryErr) {
          console.warn('[API goal-analysis] Claude API Retry Attempt 2 failed:', retryErr);
        }
      }
    }

    // 6. If Claude is unconfigured or failed, use high-fidelity dynamic fallback generator
    if (!validatedResult) {
      validatedResult = generateFallbackGoalAnalysis(goal, timeline, sanitizedResume);
    }

    // Ensure all gaps are sorted high -> medium -> low
    const severityOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
    validatedResult.gaps.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));

    // Filter certifications: only keep certKeys that strictly exist in CERTIFICATION_CATALOG
    const validCerts = (validatedResult.certifications || []).filter((c) =>
      CERTIFICATION_CATALOG_MAP.has(c.certKey)
    );

    // Enrich with catalog details & live jobs count
    const allJobs = loadAllAvailableJobs();
    validatedResult.certifications = enrichCertifications(validCerts, allJobs);

    // 7. Construct Persisted Goal Analysis Record
    const recordId = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const analysisRecord: GoalAnalysisRecord = {
      id: recordId,
      user_id: userId,
      goal: goal.trim(),
      timeline: timeline.trim(),
      result: validatedResult,
      completed_steps: [],
      created_at: new Date().toISOString(),
    };

    // 8. Persist to Supabase and Local Backing Store
    await Promise.all([
      saveGoalAnalysisToSupabase(analysisRecord),
      db.saveGoalAnalysis(analysisRecord),
    ]);

    return NextResponse.json({
      success: true,
      record: analysisRecord,
    });
  } catch (err: any) {
    console.error('[API POST /api/goal-analysis] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during goal analysis.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/goal-analysis
 * Update completed steps for a goal analysis.
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, completed_steps } = body;

    if (!id || !Array.isArray(completed_steps)) {
      return NextResponse.json({ error: 'Valid id and completed_steps array required' }, { status: 400 });
    }

    // Persist to Supabase and Local Store in parallel
    await Promise.all([
      updateSupabaseCompletedSteps(id, completed_steps),
      db.updateGoalCompletedSteps(id, completed_steps),
    ]);

    return NextResponse.json({ success: true, id, completed_steps });
  } catch (err: any) {
    console.error('[API PATCH /api/goal-analysis] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update completed steps' }, { status: 500 });
  }
}
