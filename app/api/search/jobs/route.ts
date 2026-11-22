import { NextResponse } from 'next/server';
import { fetchFromRegisteredPortals, PORTAL_REGISTRY } from '@/lib/portals/registry';
import { extractCountryCodeFromLocation } from '@/lib/countries';

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  country?: string; // detected ISO alpha-2 country code
  work_mode: 'remote' | 'hybrid' | 'onsite';
  type: 'job' | 'internship';
  salary_or_stipend: string;
  posted_at: string;
  source: 'freehire' | 'FreeHire' | 'Cisco' | 'Red Hat' | 'Bosch' | 'Pricol' | 'LinkedIn' | 'Indeed' | 'Naukri' | 'Greenhouse' | 'Lever' | 'Direct Career Page';
  url: string;
  description: string;
  requirements: string[];
  experience_level: 'Intern' | 'Entry' | 'Mid' | 'Senior';
  is_paid?: boolean;
  duration?: string;
  requires_manual_login?: boolean;
}

// Curated baseline database spanning major tech platforms
const GENERAL_JOB_DATABASE: NormalizedJob[] = [
  {
    id: 'gen_job_001',
    title: 'Senior Full Stack Engineer',
    company: 'Vercel',
    location: 'Remote (US/Global)',
    work_mode: 'remote',
    type: 'job',
    salary_or_stipend: '$165,000 - $215,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    source: 'Direct Career Page',
    url: 'https://vercel.com/careers',
    description: 'Lead the architecture of next-generation developer tooling, frontend edge networks, and serverless runtime platforms. Work with Next.js, React Server Components, TypeScript, and high-concurrency microservices.',
    requirements: ['5+ years full-stack TypeScript/Node.js experience', 'Deep knowledge of React Server Components and Next.js', 'Experience with cloud infrastructure and edge computing'],
    experience_level: 'Senior',
  },
  {
    id: 'gen_job_002',
    title: 'Software Engineer Intern — Summer 2026',
    company: 'Google',
    location: 'Mountain View, CA / Remote',
    work_mode: 'hybrid',
    type: 'internship',
    salary_or_stipend: '$55 - $65 / hr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    source: 'LinkedIn',
    url: 'https://careers.google.com/jobs',
    description: 'Join Google for an immersive 12-week software engineering internship. Work on high-impact systems spanning Search, Cloud, Android, or YouTube. Collaborate with senior mentors on distributed systems.',
    requirements: ['Currently pursuing a BS/MS/PhD in Computer Science or related STEM field', 'Proficiency in Python, Java, C++, or Go', 'Solid understanding of data structures and algorithms'],
    experience_level: 'Intern',
    is_paid: true,
    duration: '12 weeks (3 months)',
  },
  {
    id: 'gen_job_003',
    title: 'Frontend Developer (React / TypeScript)',
    company: 'Shopify',
    location: 'Remote',
    work_mode: 'remote',
    type: 'job',
    salary_or_stipend: '$135,000 - $175,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    source: 'Indeed',
    url: 'https://www.shopify.com/careers',
    description: 'Empower over 1.7 million merchants worldwide by crafting lightning-fast, accessible merchant dashboards and storefront checkout experiences using React, TypeScript, GraphQL, and Tailwind CSS.',
    requirements: ['3+ years modern frontend development with React & TypeScript', 'Track record of building responsive, accessible web interfaces', 'Familiarity with GraphQL and state management'],
    experience_level: 'Mid',
  },
  {
    id: 'gen_job_004',
    title: 'Machine Learning & AI Intern',
    company: 'Anthropic',
    location: 'San Francisco, CA / Remote',
    work_mode: 'remote',
    type: 'internship',
    salary_or_stipend: '$60 - $75 / hr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    source: 'Greenhouse',
    url: 'https://www.anthropic.com/careers',
    description: 'Participate in cutting-edge AI safety research and model development. Work alongside frontier researchers evaluating large language model capabilities, interpretability, and fine-tuning pipelines.',
    requirements: ['Strong programming skills in Python and PyTorch', 'Familiarity with transformer architectures and LLM training dynamics', 'Curiosity and passion for AI safety and alignment'],
    experience_level: 'Intern',
    is_paid: true,
    duration: '14 weeks (3.5 months)',
  },
  {
    id: 'gen_job_005',
    title: 'Backend Platform Engineer',
    company: 'Stripe',
    location: 'Seattle, WA (Hybrid)',
    work_mode: 'hybrid',
    type: 'job',
    salary_or_stipend: '$170,000 - $220,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    source: 'Direct Career Page',
    url: 'https://stripe.com/jobs',
    description: 'Architect mission-critical financial APIs handling hundreds of billions of dollars annually. Build fault-tolerant distributed ledger pipelines and high-availability database infrastructure.',
    requirements: ['4+ years backend systems engineering in Ruby, Go, Java, or Node.js', 'Experience with distributed transactions, idempotency, and SQL databases', 'Strong focus on system reliability and low latency'],
    experience_level: 'Mid',
  },
  {
    id: 'gen_job_006',
    title: 'Frontend Engineering Intern',
    company: 'Figma',
    location: 'San Francisco, CA (Hybrid)',
    work_mode: 'hybrid',
    type: 'internship',
    salary_or_stipend: '$52 - $62 / hr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    source: 'Lever',
    url: 'https://www.figma.com/careers',
    description: 'Work with the Figma canvas engineering team to push the boundaries of browser rendering, WebAssembly, and collaborative real-time web applications.',
    requirements: ['Pursuing degree in Computer Science, HCI, or equivalent', 'Proficiency in JavaScript/TypeScript and canvas/WebGL APIs', 'Strong eye for user interaction and design'],
    experience_level: 'Intern',
    is_paid: true,
    duration: '12 weeks (3 months)',
  },
  {
    id: 'gen_job_007',
    title: 'Lead Full Stack Engineer',
    company: 'Razorpay',
    location: 'Bengaluru, India (Hybrid)',
    work_mode: 'hybrid',
    type: 'job',
    salary_or_stipend: '₹38,00,000 - ₹55,00,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    source: 'Naukri',
    url: 'https://razorpay.com/jobs',
    description: 'Build India’s fastest-growing fintech infrastructure. Lead a squad of engineers developing instant payment settlement engines, banking integrations, and developer SDKs.',
    requirements: ['5+ years developing large scale distributed applications', 'Expertise in Node.js, Go, React, and MySQL/PostgreSQL', 'Proven team mentorship and architecture skills'],
    experience_level: 'Senior',
  },
  {
    id: 'gen_job_008',
    title: 'Cloud DevOps & Site Reliability Engineer',
    company: 'Databricks',
    location: 'Remote (US/Canada)',
    work_mode: 'remote',
    type: 'job',
    salary_or_stipend: '$160,000 - $205,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    source: 'LinkedIn',
    url: 'https://careers.databricks.com',
    description: 'Manage petabyte-scale Kubernetes clusters running Apache Spark and AI model workloads. Build automated Terraform infrastructure and resilient CI/CD pipelines across AWS, Azure, and GCP.',
    requirements: ['Experience managing Kubernetes in high-scale production', 'Infrastructure as Code proficiency with Terraform', 'Strong scripting skills in Python, Go, or Bash'],
    experience_level: 'Senior',
  },
];

// In-memory query cache (15 minutes)
const globalSearchCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get('q') || '').trim();
    const type = (searchParams.get('type') || 'all').toLowerCase();
    const location = (searchParams.get('location') || '').toLowerCase().trim();
    const countriesParam = (searchParams.get('countries') || '').toLowerCase().trim();
    const countries = countriesParam ? countriesParam.split(',').map((c) => c.trim()).filter(Boolean) : [];
    const mode = (searchParams.get('mode') || 'all').toLowerCase();
    const level = (searchParams.get('level') || 'all').toLowerCase();
    const posted = (searchParams.get('posted') || 'all').toLowerCase();
    const source = (searchParams.get('source') || 'all').toLowerCase().trim();
    const paid = (searchParams.get('paid') || 'all').toLowerCase();
    const duration = (searchParams.get('duration') || '').toLowerCase();
    const sort = (searchParams.get('sort') || 'relevant').toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

    const cacheKey = JSON.stringify({ q, type, location, countries, mode, level, posted, source, paid, duration, sort, page, limit });
    const cached = globalSearchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data);
    }

    let allResults: NormalizedJob[] = [];
    let portalErrors: Record<string, string> = {};

    // 1. Check if a dedicated company portal was requested
    if (PORTAL_REGISTRY[source]) {
      const { jobs, errors } = await fetchFromRegisteredPortals(source, {
        query: q,
        location,
        countries,
        workMode: mode,
        experienceLevel: level,
        datePosted: posted,
        type: type as any,
        page,
        limit,
      });
      allResults = jobs;
      portalErrors = errors;
    } else {
      // 2. "All Portals" or generic aggregator: Fetch in parallel from company portals + baseline listings
      const { jobs: companyJobs, errors } = await fetchFromRegisteredPortals('all', {
        query: q,
        location,
        countries,
        workMode: mode,
        experienceLevel: level,
        datePosted: posted,
        type: type as any,
        page,
        limit,
      });

      portalErrors = errors;

      // Filter baseline database
      let baselineFiltered = [...GENERAL_JOB_DATABASE];

      if (source !== 'all') {
        baselineFiltered = baselineFiltered.filter((job) =>
          job.source.toLowerCase().includes(source)
        );
      }

      if (q) {
        const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
        baselineFiltered = baselineFiltered.filter((job) => {
          const text = `${job.title} ${job.company} ${job.location} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
          return tokens.every((token) => text.includes(token));
        });
      }

      if (type !== 'all') {
        if (type === 'internship' || type === 'internships') {
          baselineFiltered = baselineFiltered.filter((job) => job.type === 'internship');
        } else if (type === 'job' || type === 'jobs') {
          baselineFiltered = baselineFiltered.filter((job) => job.type === 'job');
        }
      }

      if (location) {
        if (location === 'remote') {
          baselineFiltered = baselineFiltered.filter(
            (job) => job.work_mode === 'remote' || job.location.toLowerCase().includes('remote')
          );
        } else {
          baselineFiltered = baselineFiltered.filter((job) => job.location.toLowerCase().includes(location));
        }
      }

      if (mode !== 'all') {
        baselineFiltered = baselineFiltered.filter((job) => job.work_mode === mode);
      }

      if (level !== 'all') {
        baselineFiltered = baselineFiltered.filter((job) => job.experience_level.toLowerCase() === level);
      }

      if (posted !== 'all') {
        const now = Date.now();
        const cutoffMap: Record<string, number> = {
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
        };
        const cutoff = cutoffMap[posted];
        if (cutoff) {
          baselineFiltered = baselineFiltered.filter((job) => {
            const jobTime = new Date(job.posted_at).getTime();
            return now - jobTime <= cutoff;
          });
        }
      }

      // Combine direct company results with baseline results
      allResults = [...companyJobs, ...baselineFiltered];
    }

    // Deduplication check: Merge identical company + title + location listings
    const seen = new Set<string>();
    const deduplicated = allResults.map((job) => ({
      ...job,
      country: job.country || extractCountryCodeFromLocation(job.location) || undefined,
    })).filter((job) => {
      const key = `${job.company.toLowerCase().trim()}_${job.title.toLowerCase().trim()}_${(job.location || '').toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Country Filtering
    let countryFiltered = deduplicated;
    if (countries.length > 0) {
      const countrySet = new Set(countries.map((c) => c.toLowerCase()));
      const wantsRemoteWorldwide = countrySet.has('remote') || countrySet.has('worldwide');

      countryFiltered = countryFiltered.filter((job) => {
        const detectedCountry = job.country || extractCountryCodeFromLocation(job.location);

        // If "Remote – Worldwide" is requested, admit remote jobs without geographic boundaries
        if (wantsRemoteWorldwide && (job.work_mode === 'remote' || (job.location || '').toLowerCase().includes('remote'))) {
          return true;
        }

        // Direct matching on detected country code
        if (detectedCountry && countrySet.has(detectedCountry)) {
          return true;
        }

        // Text matching fallback against job location string
        const locLower = (job.location || '').toLowerCase();
        for (const code of countrySet) {
          if (code !== 'remote' && locLower.includes(code)) {
            return true;
          }
        }

        // Keep jobs where location is explicitly unknown rather than silently discarding
        if (!job.location || locLower.includes('unknown') || locLower.includes('flexible')) {
          return true;
        }

        return false;
      });
    }

    // Internship compensation filter
    let finalFiltered = countryFiltered;
    if (paid !== 'all') {
      if (paid === 'paid') {
        finalFiltered = finalFiltered.filter((j) => j.type === 'internship' && j.is_paid !== false);
      } else if (paid === 'unpaid') {
        finalFiltered = finalFiltered.filter((j) => j.type === 'internship' && j.is_paid === false);
      }
    }

    if (duration) {
      finalFiltered = finalFiltered.filter((j) => j.duration && j.duration.toLowerCase().includes(duration));
    }

    // Sort results
    if (sort === 'newest') {
      finalFiltered.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
    } else {
      // Relevance sorting
      if (q) {
        finalFiltered.sort((a, b) => {
          const aTitleMatch = a.title.toLowerCase().includes(q.toLowerCase()) ? 1 : 0;
          const bTitleMatch = b.title.toLowerCase().includes(q.toLowerCase()) ? 1 : 0;
          return bTitleMatch - aTitleMatch;
        });
      }
    }

    // Pagination
    const total = finalFiltered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = finalFiltered.slice(startIndex, startIndex + limit);

    const responsePayload = {
      jobs: paginated,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
      portalWarnings: Object.keys(portalErrors).length > 0 ? portalErrors : undefined,
    };

    globalSearchCache.set(cacheKey, {
      data: responsePayload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to execute multi-portal search', message: error.message },
      { status: 500 }
    );
  }
}
