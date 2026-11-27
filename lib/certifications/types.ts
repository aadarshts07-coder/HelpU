import { z } from 'zod';

export type CertificationLevel = 'Foundational' | 'Associate' | 'Professional' | 'Specialty';

export interface DiscoveredCertification {
  key: string;
  name: string;
  issuer: string;
  level: CertificationLevel;
  exam_code: string | null;
  category: string;
  skills: string[];
  aliases: string[];
  cost_usd_min: number;
  cost_usd_max: number;
  cost_currency: string;
  is_free: boolean;
  study_weeks: number;
  validity_years: number | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
  official_url: string;
  source_name: string;
  source_url: string;
  fetched_at: string;
  last_verified_at: string;
  confidence: number; // 0.0 - 1.0
  common_employers?: string[];
}

export const DiscoveredCertificationSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(2),
  issuer: z.string().min(1),
  level: z.enum(['Foundational', 'Associate', 'Professional', 'Specialty']),
  exam_code: z.string().nullable(),
  category: z.string().default('Software Engineering'),
  skills: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  cost_usd_min: z.number().nonnegative().default(0),
  cost_usd_max: z.number().nonnegative().default(0),
  cost_currency: z.string().default('USD'),
  is_free: z.boolean().default(false),
  study_weeks: z.number().positive().default(4),
  validity_years: z.number().nullable().default(3),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(3),
  official_url: z.string().url(),
  source_name: z.string().default('Official Catalog'),
  source_url: z.string().default(''),
  fetched_at: z.string().default(() => new Date().toISOString()),
  last_verified_at: z.string().default(() => new Date().toISOString()),
  confidence: z.number().min(0).max(1).default(0.95),
  common_employers: z.array(z.string()).optional(),
});

export interface GoalUnderstanding {
  roleFamily: string;
  level: string;
  requiredSkills: string[];
  keywords: string[];
  certAliases: string[];
}

export const GoalUnderstandingSchema = z.object({
  roleFamily: z.string().min(1),
  level: z.string().min(1),
  requiredSkills: z.array(z.string()).min(1),
  keywords: z.array(z.string()).default([]),
  certAliases: z.array(z.string()).default([]),
});

export interface SampleRole {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  isRecent: boolean; // Seen within last 14 days
  postedAt?: string;
}

export interface EmployerEvidenceItem {
  company: string;
  openRolesCount: number;
  sampleRoles: SampleRole[];
}

export interface EmployerEvidenceSummary {
  certKey: string;
  totalMentionCount: number;
  hiringNowCount: number;
  historicalCount: number;
  lastCheckedAt: string;
  topEmployers: EmployerEvidenceItem[];
  sampleRoles: SampleRole[];
}

export interface CertJobMentionRecord {
  id: string;
  cert_key: string;
  company: string;
  job_title: string;
  location: string;
  url: string;
  source: string;
  matches_goal: boolean;
  first_seen: string;
  last_seen: string;
}

export interface RankedCertification extends DiscoveredCertification {
  relevanceScore: number;
  marketDemandScore: number;
  rankScore: number;
  tags: ('best_roi' | 'free' | 'fastest' | 'most_requested' | 'stretch')[];
  pathOrder: number; // 1 = Foundational, 2 = Associate, 3 = Professional, 4 = Specialty
  whyForGoal: string;
  closesGaps: number[];
  readinessBonus: number;
  userStatus?: 'not_started' | 'studying' | 'exam_booked' | 'earned';
  targetDate?: string | null;
  earnedDate?: string | null;
  matchScoreBefore?: number;
  matchScoreAfter?: number;
  evidence?: EmployerEvidenceSummary;
}

export interface DiscoverRequest {
  goal: string;
  timeline?: string;
  skills?: string[];
  resumeText?: string;
}

export interface DiscoverResponse {
  success: boolean;
  goal: string;
  understanding: GoalUnderstanding;
  totalFound: number;
  totalCompaniesHiring: number;
  certifications: RankedCertification[];
  spotlightCert: RankedCertification | null;
  cached: boolean;
  lastUpdatedAt: string;
}
