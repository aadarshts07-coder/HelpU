import fs from 'fs';
import path from 'path';
import {
  UserProfile,
  JobListing,
  ApplicationRecord,
  UserSettings,
  InAppNotification,
  DashboardMetrics,
  ResumeVersion,
  PipelineStatus,
  UserAccount,
  VerificationToken,
  SecurityAuditLog,
  GoalAnalysisRecord,
  GoalCertificationRecord
} from './types';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
let inMemoryFallback: DatabaseStore | null = null;
let lastMtimeMs = 0;

interface DatabaseStore {
  profile: UserProfile;
  jobs: JobListing[];
  applications: ApplicationRecord[];
  settings: UserSettings;
  notifications: InAppNotification[];
  resumeVersions: ResumeVersion[];
  pipelineStatus: PipelineStatus;
  users: UserAccount[];
  verificationTokens: VerificationToken[];
  auditLogs: SecurityAuditLog[];
  goalAnalyses?: GoalAnalysisRecord[];
  goalCertifications?: GoalCertificationRecord[];
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_demo_101',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 382-9014',
  location: 'San Francisco, CA',
  linkedInUrl: 'https://linkedin.com/in/alexmorgan-dev',
  githubUrl: 'https://github.com/alexmorgandev',
  portfolioUrl: 'https://alexmorgan.dev',
  summary: 'Full-stack software engineer with 4+ years of experience specializing in TypeScript, Next.js, React, Node.js, and cloud native architectures. Proven track record of scaling high-traffic SaaS applications and leading cross-functional teams to deliver reliable, modern web products.',
  education: [
    {
      id: 'edu_1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2017',
      endDate: '2021',
      current: false,
      grade: '3.8 GPA',
      highlights: ['Dean\'s Honors List', 'Focus on Distributed Systems and Human-Computer Interaction'],
    },
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'TechFlow Solutions',
      position: 'Senior Full Stack Engineer',
      location: 'San Francisco, CA (Hybrid)',
      startDate: '2022-03',
      endDate: '',
      current: true,
      description: 'Architecting scalable enterprise cloud applications.',
      highlights: [
        'Spearheaded migration of legacy monolith to Next.js and serverless Node.js, slashing page latency by 45%.',
        'Built automated CI/CD deployment pipelines handling 2M+ monthly active requests with 99.99% uptime.',
        'Mentored 4 junior engineers and standardized TypeScript coding practices across the organization.',
      ],
    },
    {
      id: 'exp_2',
      company: 'Vanguard Labs',
      position: 'Software Engineer',
      location: 'San Jose, CA',
      startDate: '2021-06',
      endDate: '2022-02',
      current: false,
      description: 'Frontend and API development for fintech analytics platform.',
      highlights: [
        'Developed interactive real-time financial dashboards utilizing React, Tailwind CSS, and WebSockets.',
        'Engineered resilient PostgreSQL database schemas and optimized indexing, reducing slow query times by 60%.',
      ],
    },
  ],
  skills: [
    { id: 'sk_1', category: 'Technical', name: 'TypeScript', level: 'Expert' },
    { id: 'sk_2', category: 'Technical', name: 'JavaScript (ES6+)', level: 'Expert' },
    { id: 'sk_3', category: 'Technical', name: 'Node.js', level: 'Advanced' },
    { id: 'sk_4', category: 'Technical', name: 'Python', level: 'Intermediate' },
    { id: 'sk_5', category: 'Frameworks', name: 'Next.js', level: 'Expert' },
    { id: 'sk_6', category: 'Frameworks', name: 'React', level: 'Expert' },
    { id: 'sk_7', category: 'Frameworks', name: 'Tailwind CSS', level: 'Expert' },
    { id: 'sk_8', category: 'Frameworks', name: 'Express', level: 'Advanced' },
    { id: 'sk_9', category: 'Tools', name: 'PostgreSQL', level: 'Advanced' },
    { id: 'sk_10', category: 'Tools', name: 'Docker', level: 'Intermediate' },
    { id: 'sk_11', category: 'Tools', name: 'Git & GitHub Actions', level: 'Advanced' },
    { id: 'sk_12', category: 'Tools', name: 'AWS (S3, Lambda)', level: 'Intermediate' },
    { id: 'sk_13', category: 'Soft Skills', name: 'Agile / Scrum Leadership', level: 'Advanced' },
    { id: 'sk_14', category: 'Soft Skills', name: 'Cross-functional Communication', level: 'Expert' },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'CloudPulse — Real-Time Kubernetes Observability',
      description: 'Distributed microservices monitoring dashboard displaying live metrics, anomalies, and logs.',
      techStack: ['Next.js', 'Go', 'Docker', 'Prometheus', 'Tailwind CSS'],
      liveUrl: 'https://cloudpulse-demo.app',
      repoUrl: 'https://github.com/alexmorgandev/cloudpulse',
      bullets: [
        'Built full-stack observability dashboard serving 500+ container metrics per second.',
        'Engineered sub-millisecond alerting engine using WebSocket push notifications.',
      ],
    },
    {
      id: 'proj_2',
      title: 'ResumeAI — Automated Candidate Matching Platform',
      description: 'NLP-driven tool comparing developer resumes against open technical job descriptions.',
      techStack: ['React', 'Python', 'FastAPI', 'PostgreSQL'],
      liveUrl: 'https://resumeai.dev',
      repoUrl: 'https://github.com/alexmorgandev/resume-ai',
      bullets: [
        'Analyzed 10,000+ job postings to extract high-frequency ATS skills and match metrics.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert_1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      issueDate: '2023-04',
      expirationDate: '2026-04',
      credentialId: 'AWS-CSA-991283',
    },
  ],
  languages: [
    { id: 'lang_1', name: 'English', proficiency: 'Native' },
    { id: 'lang_2', name: 'Spanish', proficiency: 'Conversational' },
  ],
  targetJobTitles: ['Senior Full Stack Engineer', 'Full Stack Developer', 'Frontend Engineer', 'Software Engineer'],
  preferredLocations: ['San Francisco, CA', 'Remote', 'New York, NY'],
  salaryRange: {
    min: 135000,
    max: 185000,
    currency: 'USD',
  },
  workPreference: 'remote',
  workAuthorization: 'US Citizen / Authorized to work without sponsorship',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: UserSettings = {
  dailyApplicationLimit: 20,
  jobMatchThreshold: 70,
  reviewMode: 'ask_before_submitting',
  isPaused: false,
  blacklistedCompanies: ['Revature', 'CyberCoders'],
  blacklistedKeywords: ['unpaid', 'cleared secret', 'intern'],
  consentGiven: true,
  consentTimestamp: new Date().toISOString(),
  emailNotifications: true,
  notificationEmail: 'alex.morgan@example.com',
  portalCredentials: {
    linkedin: { username: 'alex.morgan@example.com' },
    indeed: { username: 'alex.morgan@example.com' },
    naukri: { username: 'alex.morgan@example.com' },
  },
};

const INITIAL_JOBS: JobListing[] = [
  {
    id: 'job_101',
    title: 'Senior Full Stack Engineer',
    company: 'Stripe',
    location: 'Remote, US',
    description: 'We are seeking a Senior Full Stack Engineer to join our Global Payments team. You will build highly reliable, developer-friendly interfaces and robust APIs handling millions of transactions. Stack: TypeScript, React, Node.js, PostgreSQL, Distributed Systems.',
    salary: '$160,000 - $195,000',
    applyUrl: 'https://stripe.com/jobs/senior-full-stack-engineer',
    portal: 'LinkedIn',
    matchScore: 94,
    matchReasons: ['Exact title match', 'TypeScript, React & Node.js align directly with your core stack', 'Remote role matches your preferred preference'],
    missingSkills: ['Ruby'],
    postedAt: '2 hours ago',
    discoveredAt: new Date().toISOString(),
  },
  {
    id: 'job_102',
    title: 'Full Stack Developer',
    company: 'Vercel',
    location: 'Remote',
    description: 'Help us build the Web. Looking for a talented Full Stack Developer to enhance Next.js developer experiences, dashboard workflows, and edge infrastructure. Strong experience with Next.js, React, Tailwind CSS, and cloud platforms required.',
    salary: '$150,000 - $180,000',
    applyUrl: 'https://vercel.com/careers/full-stack-developer',
    portal: 'Indeed',
    matchScore: 98,
    matchReasons: ['Next.js & Tailwind CSS are your highest-ranked skills', 'Remote work matches preference', 'Salary range aligns with your target'],
    missingSkills: [],
    postedAt: '5 hours ago',
    discoveredAt: new Date().toISOString(),
  },
  {
    id: 'job_103',
    title: 'Software Engineer - Frontend & APIs',
    company: 'Airbnb',
    location: 'San Francisco, CA (Hybrid)',
    description: 'Join the Guest Experience team to craft performant, accessible web experiences. Requirements: 3+ years experience with modern JavaScript/TypeScript, React, GraphQL, and design systems.',
    salary: '$155,000 - $185,000',
    applyUrl: 'https://careers.airbnb.com/positions/software-engineer',
    portal: 'Greenhouse',
    matchScore: 88,
    matchReasons: ['Location in San Francisco matches your target areas', 'React & TypeScript expertise directly match requirements'],
    missingSkills: ['GraphQL'],
    postedAt: '1 day ago',
    discoveredAt: new Date().toISOString(),
  },
  {
    id: 'job_104',
    title: 'Senior Backend Engineer',
    company: 'DataDog',
    location: 'New York, NY',
    description: 'Seeking backend engineers to scale distributed metric ingestion pipelines. Required: Go, C++, Linux kernel performance, Kubernetes, low-level networking.',
    salary: '$170,000 - $210,000',
    applyUrl: 'https://careers.datadoghq.com/backend',
    portal: 'Lever',
    matchScore: 58,
    matchReasons: ['Location matches preferred areas'],
    missingSkills: ['C++', 'Linux Kernel', 'Go'],
    postedAt: '3 days ago',
    discoveredAt: new Date().toISOString(),
  },
];

const INITIAL_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'app_201',
    jobId: 'job_102',
    jobTitle: 'Full Stack Developer',
    company: 'Vercel',
    location: 'Remote',
    portal: 'Indeed',
    applyUrl: 'https://vercel.com/careers/full-stack-developer',
    matchScore: 98,
    status: 'Applied',
    statusReason: 'Application submitted successfully via automated Playwright worker. Tailored resume & cover letter uploaded.',
    appliedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    screenshots: [
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
    ],
    questionsAnswered: [
      { question: 'Why are you passionate about Next.js?', answer: 'I have built and scaled production web applications with Next.js for over 3 years, experiencing firsthand how its SSR and edge routing revolutionize developer velocity.' },
      { question: 'Are you authorized to work in the US without sponsorship?', answer: 'Yes' },
    ],
  },
  {
    id: 'app_202',
    jobId: 'job_101',
    jobTitle: 'Senior Full Stack Engineer',
    company: 'Stripe',
    location: 'Remote, US',
    portal: 'LinkedIn',
    applyUrl: 'https://stripe.com/jobs/senior-full-stack-engineer',
    matchScore: 94,
    status: 'Pending review',
    statusReason: 'Form populated with profile data. Automation paused for user review per your "Ask me before submitting" preference.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    screenshots: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    ],
    requiresAttentionReason: 'USER_REVIEW_REQUIRED',
  },
  {
    id: 'app_203',
    jobId: 'job_103',
    jobTitle: 'Software Engineer - Frontend & APIs',
    company: 'Airbnb',
    location: 'San Francisco, CA (Hybrid)',
    portal: 'Greenhouse',
    applyUrl: 'https://careers.airbnb.com/positions/software-engineer',
    matchScore: 88,
    status: 'Needs manual action',
    statusReason: 'Cloudflare Turnstile verification challenge detected on form submission page. Automation safely paused to protect your account.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    screenshots: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    ],
    requiresAttentionReason: 'CAPTCHA_DETECTED',
  },
  {
    id: 'app_204',
    jobId: 'job_105',
    jobTitle: 'Lead Software Architect',
    company: 'Linear',
    location: 'Remote',
    portal: 'Direct Career Page',
    applyUrl: 'https://linear.app/careers/lead-architect',
    matchScore: 91,
    status: 'Interview',
    statusReason: 'Recruiter response received! Initial screening scheduled.',
    appliedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    screenshots: [],
  },
];

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif_1',
    title: 'Recruiter Interview Scheduled',
    message: 'Linear has progressed your application to the technical interview stage!',
    type: 'success',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    read: false,
    actionUrl: '/tracker',
  },
  {
    id: 'notif_2',
    title: 'Action Required: CAPTCHA Detected',
    message: 'Airbnb application form encountered a Cloudflare Turnstile verification. Click to complete and proceed.',
    type: 'warning',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    read: false,
    actionUrl: '/tracker',
    jobId: 'job_103',
  },
  {
    id: 'notif_3',
    title: 'Application Ready for 1-Click Review',
    message: 'Stripe Senior Full Stack Engineer application is filled and ready for your sign-off.',
    type: 'info',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: true,
    actionUrl: '/tracker',
    jobId: 'job_101',
  },
  {
    id: 'notif_4',
    title: 'Application Successfully Submitted',
    message: 'Vercel Full Stack Developer application submitted with tailored ATS resume.',
    type: 'success',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: true,
    actionUrl: '/tracker',
  },
];

const DEFAULT_PIPELINE_STATUS: PipelineStatus = {
  isRunning: false,
  currentStep: 'idle',
  stepProgress: 0,
  message: 'Pipeline ready. Saving profile will trigger resume generation, job search, and auto-apply.',
  lastRunAt: null,
  resumeVersionLabel: null,
  jobsFoundCount: 0,
  jobsAppliedCount: 0,
  error: null,
};

function ensureDataStore(): DatabaseStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const stats = fs.statSync(DB_FILE);
      if (inMemoryFallback && stats.mtimeMs <= lastMtimeMs) {
        return inMemoryFallback;
      }

      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const store = JSON.parse(raw);
      let mutated = false;
      if (!Array.isArray(store.resumeVersions)) {
        store.resumeVersions = [];
        mutated = true;
      }
      if (!store.pipelineStatus) {
        store.pipelineStatus = DEFAULT_PIPELINE_STATUS;
        mutated = true;
      }
      if (!Array.isArray(store.users)) {
        const existingEmail = (store.profile?.email || 'alex.morgan@example.com').toLowerCase().trim();
        const existingName = store.profile?.name || 'Alex Morgan';
        store.users = [
          {
            id: store.profile?.id || 'usr_demo_101',
            email: existingEmail,
            name: existingName,
            status: 'ACTIVE',
            emailVerified: new Date().toISOString(),
            passwordHash: 'scrypt$16384$8$1$e1f82c40c5f94a28b072da3f829db712$e58b86e00171a4f0bb4e16d0be9788e2cb6b404d0f622f6d2e6750da57f078d103b4e28400494cf0bf75da898e09f58ea969a572c67623910cbe7781b4d081f9',
            failedLoginAttempts: 0,
            lockedUntil: null,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
        mutated = true;
      }
      if (!Array.isArray(store.verificationTokens)) {
        store.verificationTokens = [];
        mutated = true;
      }
      if (!Array.isArray(store.auditLogs)) {
        store.auditLogs = [];
        mutated = true;
      }
      if (!Array.isArray(store.goalAnalyses)) {
        store.goalAnalyses = [];
        mutated = true;
      }
      if (!Array.isArray(store.goalCertifications)) {
        store.goalCertifications = [];
        mutated = true;
      }
      if (mutated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
        try {
          lastMtimeMs = fs.statSync(DB_FILE).mtimeMs;
        } catch {
          lastMtimeMs = Date.now();
        }
      } else {
        lastMtimeMs = stats.mtimeMs;
      }
      inMemoryFallback = store;
      return store;
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Check if project root data/store.json exists to copy from
    const seedFile = path.join(process.cwd(), 'data', 'store.json');
    let initialData: DatabaseStore;
    if (fs.existsSync(seedFile) && seedFile !== DB_FILE) {
      try {
        initialData = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
      } catch {
        initialData = {
          profile: DEFAULT_PROFILE,
          jobs: INITIAL_JOBS,
          applications: INITIAL_APPLICATIONS,
          settings: DEFAULT_SETTINGS,
          notifications: INITIAL_NOTIFICATIONS,
          resumeVersions: [],
          pipelineStatus: DEFAULT_PIPELINE_STATUS,
          users: [],
          verificationTokens: [],
          auditLogs: [],
        };
      }
    } else {
      initialData = {
        profile: DEFAULT_PROFILE,
        jobs: INITIAL_JOBS,
        applications: INITIAL_APPLICATIONS,
        settings: DEFAULT_SETTINGS,
        notifications: INITIAL_NOTIFICATIONS,
        resumeVersions: [],
        pipelineStatus: DEFAULT_PIPELINE_STATUS,
        users: [],
        verificationTokens: [],
        auditLogs: [],
      };
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    try {
      lastMtimeMs = fs.statSync(DB_FILE).mtimeMs;
    } catch {
      lastMtimeMs = Date.now();
    }
    inMemoryFallback = initialData;
    return initialData;
  } catch (err) {
    console.warn('[DB Engine] Disk store access limited or read-only, using memory store:', err);
    if (!inMemoryFallback) {
      inMemoryFallback = {
        profile: DEFAULT_PROFILE,
        jobs: INITIAL_JOBS,
        applications: INITIAL_APPLICATIONS,
        settings: DEFAULT_SETTINGS,
        notifications: INITIAL_NOTIFICATIONS,
        resumeVersions: [],
        pipelineStatus: DEFAULT_PIPELINE_STATUS,
        users: [],
        verificationTokens: [],
        auditLogs: [],
      };
    }
    return inMemoryFallback;
  }
}

function writeDataStore(store: DatabaseStore) {
  inMemoryFallback = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
    try {
      lastMtimeMs = fs.statSync(DB_FILE).mtimeMs;
    } catch {
      lastMtimeMs = Date.now();
    }
  } catch (err) {
    console.warn('[DB Engine] Could not persist to disk (serverless/read-only mode active):', err);
  }
}

export const db = {
  getProfile: async (): Promise<UserProfile> => {
    const store = ensureDataStore();
    return store.profile;
  },

  updateProfile: async (updated: Partial<UserProfile>): Promise<UserProfile> => {
    const store = ensureDataStore();
    store.profile = {
      ...store.profile,
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    writeDataStore(store);
    return store.profile;
  },

  getSettings: async (): Promise<UserSettings> => {
    const store = ensureDataStore();
    return store.settings;
  },

  updateSettings: async (updated: Partial<UserSettings>): Promise<UserSettings> => {
    const store = ensureDataStore();
    store.settings = {
      ...store.settings,
      ...updated,
    };
    writeDataStore(store);
    return store.settings;
  },

  getJobs: async (): Promise<JobListing[]> => {
    const store = ensureDataStore();
    return store.jobs;
  },

  saveJobs: async (newJobs: JobListing[]): Promise<JobListing[]> => {
    const store = ensureDataStore();
    // Merge by id or title+company
    const existingIds = new Set(store.jobs.map(j => j.id));
    const toAdd = newJobs.filter(j => !existingIds.has(j.id));
    store.jobs = [...toAdd, ...store.jobs];
    writeDataStore(store);
    return store.jobs;
  },

  getApplications: async (): Promise<ApplicationRecord[]> => {
    const store = ensureDataStore();
    return store.applications;
  },

  getApplicationById: async (id: string): Promise<ApplicationRecord | undefined> => {
    const store = ensureDataStore();
    return store.applications.find(a => a.id === id);
  },

  saveApplication: async (app: ApplicationRecord): Promise<ApplicationRecord> => {
    const store = ensureDataStore();
    const idx = store.applications.findIndex(a => a.id === app.id);
    if (idx >= 0) {
      store.applications[idx] = {
        ...store.applications[idx],
        ...app,
        updatedAt: new Date().toISOString(),
      };
    } else {
      store.applications.unshift({
        ...app,
        createdAt: app.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    writeDataStore(store);
    return app;
  },

  updateApplicationStatus: async (
    id: string,
    status: ApplicationRecord['status'],
    reason?: string
  ): Promise<ApplicationRecord | null> => {
    const store = ensureDataStore();
    const idx = store.applications.findIndex(a => a.id === id);
    if (idx >= 0) {
      store.applications[idx].status = status;
      if (reason) store.applications[idx].statusReason = reason;
      if (status === 'Applied' && !store.applications[idx].appliedAt) {
        store.applications[idx].appliedAt = new Date().toISOString();
      }
      store.applications[idx].updatedAt = new Date().toISOString();
      writeDataStore(store);
      return store.applications[idx];
    }
    return null;
  },

  getNotifications: async (): Promise<InAppNotification[]> => {
    const store = ensureDataStore();
    return store.notifications;
  },

  addNotification: async (notif: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>): Promise<InAppNotification> => {
    const store = ensureDataStore();
    const item: InAppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    store.notifications.unshift(item);
    writeDataStore(store);
    return item;
  },

  markNotificationRead: async (id: string): Promise<void> => {
    const store = ensureDataStore();
    const notif = store.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      writeDataStore(store);
    }
  },

  markAllNotificationsRead: async (): Promise<void> => {
    const store = ensureDataStore();
    store.notifications.forEach(n => (n.read = true));
    writeDataStore(store);
  },

  getMetrics: async (): Promise<DashboardMetrics> => {
    const store = ensureDataStore();
    const apps = store.applications;
    const settings = store.settings;

    const appliedCount = apps.filter(a => a.status === 'Applied' || a.status === 'Interview' || a.status === 'Offer').length;
    const pendingCount = apps.filter(a => a.status === 'Pending review').length;
    const actionCount = apps.filter(a => a.status === 'Needs manual action').length;
    const interviewCount = apps.filter(a => a.status === 'Interview').length;

    // Today's applications
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyCount = apps.filter(a => a.appliedAt && a.appliedAt.startsWith(todayStr)).length;

    const totalResolved = apps.filter(a => a.status === 'Applied' || a.status === 'Failed' || a.status === 'Interview').length;
    const successRate = totalResolved > 0 ? Math.round((appliedCount / totalResolved) * 100) : 85;

    const avgScore = apps.length > 0
      ? Math.round(apps.reduce((acc, curr) => acc + curr.matchScore, 0) / apps.length)
      : 88;

    return {
      applicationsSent: appliedCount,
      successRate,
      pendingReview: pendingCount,
      needsManualAction: actionCount,
      interviewsReceived: interviewCount,
      dailyApplicationsCount: dailyCount,
      dailyLimit: settings.dailyApplicationLimit,
      averageMatchScore: avgScore,
    };
  },

  getResumeVersions: async (): Promise<ResumeVersion[]> => {
    const store = ensureDataStore();
    return store.resumeVersions || [];
  },

  getLatestResumeVersion: async (): Promise<ResumeVersion | null> => {
    const store = ensureDataStore();
    if (!store.resumeVersions || store.resumeVersions.length === 0) return null;
    return store.resumeVersions[store.resumeVersions.length - 1];
  },

  saveResumeVersion: async (version: ResumeVersion): Promise<ResumeVersion> => {
    const store = ensureDataStore();
    if (!store.resumeVersions) store.resumeVersions = [];
    const idx = store.resumeVersions.findIndex(v => v.id === version.id || v.version === version.version);
    if (idx >= 0) {
      store.resumeVersions[idx] = version;
    } else {
      store.resumeVersions.push(version);
    }
    writeDataStore(store);
    return version;
  },

  getPipelineStatus: async (): Promise<PipelineStatus> => {
    const store = ensureDataStore();
    return store.pipelineStatus || DEFAULT_PIPELINE_STATUS;
  },

  updatePipelineStatus: async (patch: Partial<PipelineStatus>): Promise<PipelineStatus> => {
    const store = ensureDataStore();
    store.pipelineStatus = {
      ...(store.pipelineStatus || DEFAULT_PIPELINE_STATUS),
      ...patch,
    };
    writeDataStore(store);
    return store.pipelineStatus;
  },

  exportAllUserData: async (): Promise<DatabaseStore> => {
    return ensureDataStore();
  },

  deleteAllUserData: async (): Promise<void> => {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    // Reinitialize empty
    ensureDataStore();
  },

  // --- Security & User Account Methods ---
  getUserByEmail: async (email: string): Promise<UserAccount | null> => {
    const store = ensureDataStore();
    const normalized = (email || '').toLowerCase().trim();
    const user = (store.users || []).find((u) => u.email.toLowerCase().trim() === normalized);
    return user || null;
  },

  getUserById: async (id: string): Promise<UserAccount | null> => {
    const store = ensureDataStore();
    const user = (store.users || []).find((u) => u.id === id);
    return user || null;
  },

  createUser: async (userData: Omit<UserAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserAccount> => {
    const store = ensureDataStore();
    if (!store.users) store.users = [];
    const now = new Date().toISOString();
    const newUser: UserAccount = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    store.users.push(newUser);
    writeDataStore(store);
    return newUser;
  },

  updateUser: async (id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> => {
    const store = ensureDataStore();
    if (!store.users) store.users = [];
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const updated: UserAccount = {
      ...store.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.users[idx] = updated;
    writeDataStore(store);
    return updated;
  },

  createVerificationToken: async (tokenData: Omit<VerificationToken, 'id' | 'createdAt'>): Promise<VerificationToken> => {
    const store = ensureDataStore();
    if (!store.verificationTokens) store.verificationTokens = [];
    // Invalidate prior unused tokens of the same type for this user
    store.verificationTokens = store.verificationTokens.map((t) => {
      if (t.userId === tokenData.userId && t.type === tokenData.type && !t.usedAt) {
        return { ...t, usedAt: new Date().toISOString() };
      }
      return t;
    });

    const newToken: VerificationToken = {
      ...tokenData,
      id: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    store.verificationTokens.push(newToken);
    writeDataStore(store);
    return newToken;
  },

  findVerificationToken: async (tokenHash: string, type: VerificationToken['type']): Promise<VerificationToken | null> => {
    const store = ensureDataStore();
    const now = new Date().toISOString();
    const token = (store.verificationTokens || []).find(
      (t) => t.tokenHash === tokenHash && t.type === type && !t.usedAt && t.expiresAt > now
    );
    return token || null;
  },

  findOtpToken: async (email: string, otpHash: string, type: VerificationToken['type']): Promise<VerificationToken | null> => {
    const store = ensureDataStore();
    const now = new Date().toISOString();
    const normalized = (email || '').toLowerCase().trim();
    const token = (store.verificationTokens || []).find(
      (t) => t.email.toLowerCase().trim() === normalized && t.otpHash === otpHash && t.type === type && !t.usedAt && t.expiresAt > now
    );
    return token || null;
  },

  consumeToken: async (id: string): Promise<void> => {
    const store = ensureDataStore();
    if (!store.verificationTokens) return;
    const token = store.verificationTokens.find((t) => t.id === id);
    if (token) {
      token.usedAt = new Date().toISOString();
      writeDataStore(store);
    }
  },

  invalidateUserTokens: async (userId: string, type?: VerificationToken['type']): Promise<void> => {
    const store = ensureDataStore();
    if (!store.verificationTokens) return;
    const now = new Date().toISOString();
    store.verificationTokens = store.verificationTokens.map((t) => {
      if (t.userId === userId && (!type || t.type === type) && !t.usedAt) {
        return { ...t, usedAt: now };
      }
      return t;
    });
    writeDataStore(store);
  },

  recordAuditLog: async (logData: Omit<SecurityAuditLog, 'id' | 'createdAt'>): Promise<void> => {
    const store = ensureDataStore();
    if (!store.auditLogs) store.auditLogs = [];
    const newLog: SecurityAuditLog = {
      ...logData,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    store.auditLogs.push(newLog);
    // Keep max 500 audit log entries in storage
    if (store.auditLogs.length > 500) {
      store.auditLogs = store.auditLogs.slice(-500);
    }
    writeDataStore(store);
  },

  getAuditLogs: async (userId?: string): Promise<SecurityAuditLog[]> => {
    const store = ensureDataStore();
    if (!userId) return store.auditLogs || [];
    return (store.auditLogs || []).filter((l) => l.userId === userId);
  },

  getLatestGoalAnalysis: async (userId: string): Promise<GoalAnalysisRecord | null> => {
    const store = ensureDataStore();
    const list = store.goalAnalyses || [];
    const userRecords = list.filter((r) => r.user_id === userId || !userId);
    if (userRecords.length === 0) return null;
    // Sort descending by created_at
    userRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return userRecords[0];
  },

  saveGoalAnalysis: async (record: GoalAnalysisRecord): Promise<void> => {
    const store = ensureDataStore();
    if (!store.goalAnalyses) store.goalAnalyses = [];
    const existingIdx = store.goalAnalyses.findIndex((r) => r.id === record.id);
    if (existingIdx >= 0) {
      store.goalAnalyses[existingIdx] = record;
    } else {
      store.goalAnalyses.unshift(record);
    }
    // Keep max 50 goal analyses in local store
    if (store.goalAnalyses.length > 50) {
      store.goalAnalyses = store.goalAnalyses.slice(0, 50);
    }
    writeDataStore(store);
  },

  updateGoalCompletedSteps: async (id: string, completedSteps: string[]): Promise<boolean> => {
    const store = ensureDataStore();
    if (!store.goalAnalyses) return false;
    const item = store.goalAnalyses.find((r) => r.id === id);
    if (item) {
      item.completed_steps = completedSteps;
      writeDataStore(store);
      return true;
    }
    return false;
  },

  getGoalCertifications: async (userId: string, analysisId?: string): Promise<GoalCertificationRecord[]> => {
    const store = ensureDataStore();
    const list = store.goalCertifications || [];
    return list.filter((r) => (r.user_id === userId || !userId) && (!analysisId || r.analysis_id === analysisId));
  },

  upsertGoalCertification: async (record: GoalCertificationRecord): Promise<void> => {
    const store = ensureDataStore();
    if (!store.goalCertifications) store.goalCertifications = [];
    const idx = store.goalCertifications.findIndex(
      (c) => c.user_id === record.user_id && c.cert_key === record.cert_key && c.analysis_id === record.analysis_id
    );
    if (idx >= 0) {
      store.goalCertifications[idx] = {
        ...store.goalCertifications[idx],
        ...record,
        updated_at: new Date().toISOString(),
      };
    } else {
      store.goalCertifications.push(record);
    }
    writeDataStore(store);
  },

  addCertificationToProfile: async (
    userId: string,
    cert: { name: string; issuer: string; issueDate: string; url?: string }
  ): Promise<void> => {
    const store = ensureDataStore();
    if (!store.profile) return;
    if (!store.profile.certifications) store.profile.certifications = [];

    // Check if certification with same name already exists
    const exists = store.profile.certifications.some(
      (c) => c.name.toLowerCase().trim() === cert.name.toLowerCase().trim()
    );
    if (!exists) {
      const newCertItem = {
        id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: cert.name,
        issuer: cert.issuer,
        issueDate: cert.issueDate,
        url: cert.url || '',
      };
      store.profile.certifications.unshift(newCertItem);
      store.profile.updatedAt = new Date().toISOString();
      writeDataStore(store);
    }
  },
};
