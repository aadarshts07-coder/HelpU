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
