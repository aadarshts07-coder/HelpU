export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedInUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  targetJobTitles: string[];
  preferredLocations: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  workPreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  workAuthorization: string; // e.g. "US Citizen", "Authorized to work"
  industries?: string[];
  updatedAt: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
  grade?: string;
  highlights?: string[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface SkillItem {
  id: string;
  category: 'Technical' | 'Frameworks' | 'Tools' | 'Soft Skills' | 'Other';
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
  repoUrl?: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Conversational' | 'Basic';
}

export interface ResumeVersion {
  id: string;
  version: number;
  label: string; // "v1", "v2"
  resumeData: any;
  coverLetter: string;
  pdfUrl?: string;
  docxUrl?: string;
  createdAt: string;
  targetRole: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  applyUrl: string;
  portal: 'LinkedIn' | 'Indeed' | 'Naukri' | 'Greenhouse' | 'Lever' | 'CareerPage';
  matchScore: number;
  matchReasons: string[];
  missingSkills: string[];
  isBlacklisted?: boolean;
  postedAt: string;
  discoveredAt: string;
}

export type ApplicationStatus = 
  | 'Found'
  | 'Tailored'
  | 'Awaiting Review'
  | 'Pending review'
  | 'Applied'
  | 'Failed'
  | 'Interview'
  | 'Rejected'
  | 'Needs attention'
  | 'Needs manual action';

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  portal: string;
  applyUrl: string;
  matchScore: number;
  status: ApplicationStatus;
  statusReason?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
  screenshots: string[]; // URLs or base64
  tailoredResumeVersion?: string; // "v1", "v2"
  tailoredResumeId?: string;
  coverLetter?: string;
  questionsAnswered?: { question: string; answer: string }[];
  requiresAttentionReason?: 'CAPTCHA_DETECTED' | 'LOGIN_REQUIRED' | 'UNKNOWN_QUESTION' | 'USER_REVIEW_REQUIRED' | 'FILE_UPLOAD_FAILED';
}

export interface UserSettings {
  dailyApplicationLimit: number; // default 20
  jobMatchThreshold: number; // default 75
  reviewMode: 'auto_submit' | 'ask_before_submitting';
  isPaused: boolean; // Master switch: false = Active, true = Paused
  blacklistedCompanies: string[];
  blacklistedKeywords: string[];
  consentGiven: boolean;
  consentTimestamp?: string;
  emailNotifications: boolean;
  notificationEmail: string;
  portalCredentials: {
    linkedin?: { username: string; encryptedPassword?: string };
    indeed?: { username: string; encryptedPassword?: string };
    naukri?: { username: string; encryptedPassword?: string };
  };
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  jobId?: string;
}

export interface DashboardMetrics {
  applicationsSent: number;
  successRate: number;
  pendingReview: number;
  needsManualAction: number;
  interviewsReceived: number;
  dailyApplicationsCount: number;
  dailyLimit: number;
  averageMatchScore: number;
}

export interface PipelineStatus {
  isRunning: boolean;
  currentStep: 'idle' | 'generating_resume' | 'searching_jobs' | 'matching_scoring' | 'applying' | 'completed' | 'paused' | 'error';
  stepProgress: number; // 0 to 100
  message: string;
  lastRunAt: string | null;
  resumeVersionLabel: string | null;
  jobsFoundCount: number;
  jobsAppliedCount: number;
  error: string | null;
}

export type UserAccountStatus = 'UNVERIFIED' | 'ACTIVE' | 'SUSPENDED';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  status: UserAccountStatus;
  emailVerified: string | null; // ISO timestamp
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: string | null; // ISO timestamp
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // AES-256 encrypted
  backupCodes?: string[]; // SHA-256 hashed recovery codes
  lastLoginAt?: string;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationToken {
  id: string;
  userId: string;
  email: string;
  tokenHash: string; // SHA-256 of 32-byte crypto token
  otpHash?: string; // SHA-256 of 6-digit numeric OTP
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'MAGIC_LINK';
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface SecurityAuditLog {
  id: string;
  userId?: string;
  email: string;
  event: 
    | 'SIGNUP' 
    | 'LOGIN_SUCCESS' 
    | 'LOGIN_FAILURE' 
    | 'EMAIL_VERIFIED' 
    | 'PASSWORD_RESET_REQUEST' 
    | 'PASSWORD_RESET_SUCCESS' 
    | 'PASSWORD_CHANGED' 
    | '2FA_ENABLED' 
    | '2FA_DISABLED' 
    | 'ACCOUNT_LOCKED'
    | 'TOKEN_RESENT';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface GoalActionStep {
  id: string;
  text: string;
  phase?: 'week_1_2' | 'week_3_6' | 'week_7_plus';
}

export interface GoalGapCard {
  id: string;
  category: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  resumeNow: string;
  goalNeeds: string;
  whyItMatters: string;
  actionSteps: GoalActionStep[];
}

export interface RecommendedCertification {
  certKey: string;
  closesGaps: number[];
  whyForGoal: string;
  roadmapPhase: 'quickWins' | 'buildProof' | 'polish';
  tags: ('best_roi' | 'fastest' | 'free' | 'most_requested' | 'stretch')[];
  readinessBonus: number;
  catalogEntry?: {
    key: string;
    name: string;
    issuer: string;
    level: 'Foundational' | 'Associate' | 'Professional' | 'Specialty';
    exam_code: string | null;
    category: string;
    cost_usd_min: number;
    cost_usd_max: number;
    is_free: boolean;
    study_weeks: number;
    validity_years: number | null;
    difficulty: 1 | 2 | 3 | 4 | 5;
    official_url: string;
    common_employers: string[];
    skills: string[];
    aliases: string[];
    last_verified_at: string;
  };
  openJobsMentionCount?: number;
  userStatus?: 'not_started' | 'studying' | 'booked' | 'earned';
  targetDate?: string;
  earnedDate?: string;
  credentialUrl?: string;
  matchScoreBefore?: number;
  matchScoreAfter?: number;
  evidence?: {
    certKey: string;
    totalMentionCount: number;
    hiringNowCount: number;
    historicalCount: number;
    lastCheckedAt: string;
    topEmployers: {
      company: string;
      openRolesCount: number;
      sampleRoles: {
        title: string;
        company: string;
        location: string;
        url: string;
        source: string;
        isRecent: boolean;
        postedAt?: string;
      }[];
    }[];
    sampleRoles: {
      title: string;
      company: string;
      location: string;
      url: string;
      source: string;
      isRecent: boolean;
      postedAt?: string;
    }[];
  };
}

export interface GoalCertificationRecord {
  id: string;
  user_id: string;
  analysis_id: string;
  cert_key: string;
  status: 'not_started' | 'studying' | 'booked' | 'earned';
  target_date?: string | null;
  earned_date?: string | null;
  credential_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalRoadmapPhase {
  phaseId: 'week_1_2' | 'week_3_6' | 'week_7_plus';
  title: string;
  subtitle: string;
  items: string[];
}

export interface GoalAnalysisResult {
  readinessScore: number;
  summary: string;
  stats: {
    gapsFound: number;
    highImpactCount: number;
    timelineMonths: number;
  };
  gaps: GoalGapCard[];
  roadmap: GoalRoadmapPhase[];
  certifications?: RecommendedCertification[];
}

export interface GoalAnalysisRecord {
  id: string;
  user_id: string;
  goal: string;
  timeline: string;
  result: GoalAnalysisResult;
  completed_steps: string[];
  created_at: string;
}
