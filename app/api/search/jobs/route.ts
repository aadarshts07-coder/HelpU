import { NextResponse } from 'next/server';
import { fetchFromRegisteredPortals, PORTAL_REGISTRY } from '@/lib/portals/registry';
import { extractCountryCodeFromLocation } from '@/lib/countries';
import { normalizeLocation, calculateDistanceKm } from '@/lib/locations';
import { resolveCanonicalLocation } from '@/lib/pipeline/geocoder';
import { aggregateJobsFromAllSources } from '@/lib/pipeline/aggregator';
import { getEmployerDirectJobs } from '@/app/api/jobs/direct/route';
import { loadAllJobsFromStore } from '@/lib/pipeline/store';

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  country?: string; // detected ISO alpha-2 country code
  state?: string;   // detected state code (e.g. 'ca', 'tn')
  city?: string;    // detected city name
  latitude?: number;
  longitude?: number;
  distance_km?: number;
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

// Curated baseline database spanning major tech hubs and platforms
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
    location: 'Bengaluru, Karnataka, India (Hybrid)',
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
  {
    id: 'gen_job_009',
    title: 'Embedded Automotive Software Engineer',
    company: 'Bosch Global Software',
    location: 'Coimbatore, Tamil Nadu, India',
    work_mode: 'onsite',
    type: 'job',
    salary_or_stipend: '₹14,00,000 - ₹22,00,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
    source: 'Bosch',
    url: 'https://careers.smartrecruiters.com/BoschGroup',
    description: 'Develop AUTOSAR compliant embedded software for next-generation electric mobility and body control units. Work with hardware-in-the-loop (HIL) simulators, CAN/LIN protocols, and safety-critical RTOS.',
    requirements: ['3+ years in Embedded C/C++ development for automotive microcontrollers', 'Hands-on experience with AUTOSAR stack and CANoe/CANalyzer', 'Knowledge of ISO 26262 functional safety'],
    experience_level: 'Mid',
  },
  {
    id: 'gen_job_010',
    title: 'IoT Telematics Firmware Engineer',
    company: 'Pricol Limited',
    location: 'Coimbatore, Tamil Nadu, India',
    work_mode: 'onsite',
    type: 'job',
    salary_or_stipend: '₹10,00,000 - ₹16,00,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    source: 'Pricol',
    url: 'https://pricol.com/careers',
    description: 'Engineer connected vehicle telematics control units (TCUs) and digital clusters. Integrate GPS, cellular IoT (4G/LTE-M), and BLE protocols for commercial two-wheelers and passenger vehicles.',
    requirements: ['2+ years firmware design on ARM Cortex-M or ESP32 platforms', 'Proficiency in MQTT, CoAP, and secure firmware-over-the-air (FOTA) updates', 'Strong debugging skills with oscilloscopes and logic analyzers'],
    experience_level: 'Mid',
  },
  {
    id: 'gen_job_011',
    title: 'Senior Frontend Engineer (React / TypeScript)',
    company: 'Zoho Corporation',
    location: 'Chennai, Tamil Nadu, India',
    work_mode: 'hybrid',
    type: 'job',
    salary_or_stipend: '₹22,00,000 - ₹34,00,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    source: 'Naukri',
    url: 'https://zoho.com/careers',
    description: 'Build enterprise-grade collaboration applications used by over 100 million users. Optimize virtualized lists, WebSocket state synchronization, and accessible keyboard navigation in React.',
    requirements: ['4+ years engineering complex Single Page Applications', 'Mastery of modern JavaScript/TypeScript and web performance metrics', 'Experience mentoring junior frontend developers'],
    experience_level: 'Senior',
  },
  {
    id: 'gen_job_012',
    title: 'Cloud Infrastructure & Kubernetes Engineer',
    company: 'Cisco Systems',
    location: 'San Jose, CA (United States)',
    work_mode: 'hybrid',
    type: 'job',
    salary_or_stipend: '$155,000 - $195,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    source: 'Cisco',
    url: 'https://jobs.cisco.com',
    description: 'Architect multi-cloud networking fabrics and cloud-native container platforms for ThousandEyes and Cisco DNA Spaces. Deploy microservices across AWS, GCP, and bare-metal Kubernetes.',
    requirements: ['3+ years in cloud infrastructure, Docker, and Kubernetes orchestration', 'Strong scripting skills in Go or Python', 'Experience with Terraform and CI/CD pipelines'],
    experience_level: 'Mid',
  },
  {
    id: 'gen_job_013',
    title: 'Distributed Systems Platform Engineer',
    company: 'Bloomberg',
    location: 'New York, NY (United States)',
    work_mode: 'hybrid',
    type: 'job',
    salary_or_stipend: '$175,000 - $230,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    source: 'LinkedIn',
    url: 'https://careers.bloomberg.com',
    description: 'Design ultra-low-latency real-time market data streaming engines. Handle hundreds of billions of financial ticks daily with microsecond consistency using modern C++ and Kafka.',
    requirements: ['4+ years building high-throughput distributed systems in C++ or Java', 'Deep understanding of TCP/IP networking, memory models, and cache coherency', 'BS or MS in Computer Science'],
    experience_level: 'Senior',
  },
  {
    id: 'gen_job_014',
    title: 'Full Stack Product Engineer',
    company: 'Monzo Bank',
    location: 'London, England, United Kingdom',
    work_mode: 'hybrid',
    type: 'job',
    salary_or_stipend: '£85,000 - £115,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    source: 'Direct Career Page',
    url: 'https://monzo.com/careers',
    description: 'Build user-delighting banking experiences for millions of Monzo customers. Work across Go microservices running on Kubernetes and cross-platform frontend interfaces.',
    requirements: ['Experience with Go, backend microservices, and React/React Native', 'Passion for consumer product design and financial accessibility', 'Strong collaborative communication'],
    experience_level: 'Mid',
  },
  {
    id: 'gen_job_015',
    title: 'Software Development Engineer',
    company: 'Amazon',
    location: 'Toronto, Ontario, Canada',
    work_mode: 'hybrid',
    type: 'job',
    salary_or_stipend: 'CA$130,000 - CA$170,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
    source: 'Indeed',
    url: 'https://amazon.jobs',
    description: 'Build tier-1 fulfillment routing algorithms and customer order orchestration pipelines powering Amazon.ca and Prime delivery networks in Canada.',
    requirements: ['3+ years professional software development experience in Java, C++, or Python', 'Experience with AWS services (DynamoDB, SQS, Lambda, ECS)', 'Strong problem-solving and algorithmic skills'],
    experience_level: 'Mid',
  },
  {
    id: 'gen_job_016',
    title: 'AI Solutions Engineer',
    company: 'Grab',
    location: 'Singapore',
    work_mode: 'onsite',
    type: 'job',
    salary_or_stipend: 'SG$95,000 - SG$135,000 / yr',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    source: 'Direct Career Page',
    url: 'https://grab.careers',
    description: 'Develop intelligent dispatch and geospatial routing systems serving over 180 million Southeast Asian users. Deploy machine learning models on high-concurrency microservice architectures.',
    requirements: ['2+ years experience in Python, Go, and production ML pipelines', 'Solid foundation in algorithms, geospatial data, and distributed caching', 'Bachelor degree in Computer Science or related'],
    experience_level: 'Mid',
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
    
    // Cascading Location parameters
    const countriesParam = (searchParams.get('countries') || '').toLowerCase().trim();
    const countries = countriesParam ? countriesParam.split(',').map((c) => c.trim()).filter(Boolean) : [];
    
    const statesParam = (searchParams.get('states') || '').toLowerCase().trim();
    const states = statesParam ? statesParam.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const citiesParam = (searchParams.get('cities') || '').toLowerCase().trim();
    const cities = citiesParam ? citiesParam.split(',').map((c) => c.trim()).filter(Boolean) : [];

    // Distance & Geolocation parameters
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const userLat = latParam !== null && latParam !== '' ? parseFloat(latParam) : null;
    const userLng = lngParam !== null && lngParam !== '' ? parseFloat(lngParam) : null;
    const radius = Math.max(0, parseInt(searchParams.get('radius') || '0', 10)); // 0 = any distance
    const includeRemote = searchParams.get('include_remote') !== 'false'; // default true

    const mode = (searchParams.get('mode') || 'all').toLowerCase();
    const level = (searchParams.get('level') || 'all').toLowerCase();
    const posted = (searchParams.get('posted') || 'all').toLowerCase();
    const source = (searchParams.get('source') || 'all').toLowerCase().trim();
    const paid = (searchParams.get('paid') || 'all').toLowerCase();
    const duration = (searchParams.get('duration') || '').toLowerCase();
    const sort = (searchParams.get('sort') || 'relevant').toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

    const cacheKey = JSON.stringify({
      q,
      type,
      location,
      countries,
      states,
      cities,
      userLat,
      userLng,
      radius,
      includeRemote,
      mode,
      level,
      posted,
      source,
      paid,
      duration,
      sort,
      page,
      limit,
    });

    const cached = globalSearchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data);
    }

    let allResults: NormalizedJob[] = [];
    let portalErrors: Record<string, string> = {};

    // 1. Fetch from Portal Registry or Aggregator
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
      // "All Portals" or generic aggregator: Fetch in parallel from company portals + baseline listings
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

      // Ingest from multi-source aggregator (ATS boards, Remotive, regional feeds)
      const { jobs: multiSourceJobs } = await aggregateJobsFromAllSources({
        query: q,
        country: countries[0] || (location.length === 2 ? location : undefined),
        state: states[0],
        city: cities[0] || (location.length > 2 ? location : undefined),
        workMode: mode as any,
        limit: 50,
      });

      // Ingest from employer direct postings & local feeds
      const employerDirectJobs = getEmployerDirectJobs();

      // Ingest all verified jobs collected across countries, states, and cities
      const storedPipelineJobs = loadAllJobsFromStore();

      // Combine direct company results with baseline results, multi-source pipelines, and stored global jobs
      allResults = [...companyJobs, ...baselineFiltered, ...multiSourceJobs, ...employerDirectJobs, ...storedPipelineJobs];
    }

    // 2. Location Normalization & Deduplication
    const seen = new Set<string>();
    const deduplicatedAndEnriched: NormalizedJob[] = [];

    for (const job of allResults) {
      const key = `${job.company.toLowerCase().trim()}_${job.title.toLowerCase().trim()}_${(job.location || '').toLowerCase().trim()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Structure and normalize the location string with canonical resolution
      const canonical = resolveCanonicalLocation(job.location);
      const structured = normalizeLocation(job.location);
      const detectedCountry = (canonical.countryCode && canonical.countryCode !== 'unknown' ? canonical.countryCode : job.country || structured.countryCode || extractCountryCodeFromLocation(job.location) || '').toLowerCase();
      const detectedState = (canonical.stateCode || structured.stateCode || '').toLowerCase();
      const detectedCity = canonical.city || structured.city || undefined;
      const latitude = canonical.latitude || structured.latitude || job.latitude;
      const longitude = canonical.longitude || structured.longitude || job.longitude;

      let distance_km: number | undefined = undefined;
      if (userLat !== null && userLng !== null && latitude !== undefined && longitude !== undefined) {
        distance_km = calculateDistanceKm(userLat, userLng, latitude, longitude);
      }

      deduplicatedAndEnriched.push({
        ...job,
        country: detectedCountry || undefined,
        state: detectedState || undefined,
        city: detectedCity,
        latitude,
        longitude,
        distance_km,
      });
    }

    // 3. Global Filters (Keywords Query, Type, Mode, Experience Level, Date Posted, Source Portal, Location text)
    let filteredList = deduplicatedAndEnriched;

    // A. Keywords Search Query (Searches title, company, location, description, requirements, tags with word boundary matching)
    if (q) {
      const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
      const tokenRegexes = tokens.map((t) => {
        const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Word boundary matching prevents false positives (e.g. "sify" in "classify", "cisco" in "san francisco")
        return new RegExp(`\\b${escaped}`, 'i');
      });

      filteredList = filteredList.filter((job) => {
        const searchable = [
          job.title,
          job.company,
          job.location,
          job.city || '',
          job.state || '',
          job.country || '',
          job.description || '',
          (job.requirements || []).join(' '),
          job.work_mode || '',
          job.type || '',
          job.experience_level || '',
          job.source || '',
        ].join(' ');

        return tokenRegexes.every((regex) => regex.test(searchable));
      });
    }

    // B. Job vs Internship Filter
    if (type !== 'all') {
      if (type === 'internship' || type === 'internships') {
        filteredList = filteredList.filter((job) => job.type === 'internship');
      } else if (type === 'job' || type === 'jobs') {
        filteredList = filteredList.filter((job) => job.type === 'job');
      }
    }

    // C. Work Mode (Remote / Hybrid / On-site)
    if (mode !== 'all') {
      filteredList = filteredList.filter((job) => {
        const m = (job.work_mode || '').toLowerCase();
        if (mode === 'remote') return m === 'remote' || (job.location || '').toLowerCase().includes('remote');
        if (mode === 'hybrid') return m === 'hybrid';
        if (mode === 'onsite') return m === 'onsite' || m === 'on-site';
        return true;
      });
    }

    // D. Experience Level
    if (level !== 'all') {
      filteredList = filteredList.filter((job) => (job.experience_level || '').toLowerCase() === level.toLowerCase());
    }

    // E. Date Posted Cutoff
    if (posted !== 'all') {
      const now = Date.now();
      const cutoffMap: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const cutoff = cutoffMap[posted];
      if (cutoff) {
        filteredList = filteredList.filter((job) => {
          const jobTime = new Date(job.posted_at).getTime();
          return now - jobTime <= cutoff;
        });
      }
    }

    // F. Source Portal Filter
    if (source !== 'all') {
      filteredList = filteredList.filter((job) =>
        (job.source || '').toLowerCase().includes(source.toLowerCase())
      );
    }

    // G. Free-form Location Text query (e.g. from searchbar or URL ?location=)
    if (location && location !== 'all') {
      const locLower = location.toLowerCase();
      if (locLower === 'remote') {
        filteredList = filteredList.filter(
          (job) => job.work_mode === 'remote' || (job.location || '').toLowerCase().includes('remote')
        );
      } else {
        filteredList = filteredList.filter(
          (job) =>
            (job.location || '').toLowerCase().includes(locLower) ||
            (job.city || '').toLowerCase().includes(locLower) ||
            (job.state || '').toLowerCase().includes(locLower) ||
            (job.country || '').toLowerCase().includes(locLower)
        );
      }
    }

    // 4. Cascading Location Filter Logic (Countries, States, Cities, Radius)
    // A. Country Filtering
    if (countries.length > 0) {
      const countrySet = new Set(countries.map((c) => c.toLowerCase()));
      const wantsRemoteWorldwide = countrySet.has('remote') || countrySet.has('worldwide');

      filteredList = filteredList.filter((job) => {
        const cCode = job.country?.toLowerCase();

        if (wantsRemoteWorldwide && (job.work_mode === 'remote' || (job.location || '').toLowerCase().includes('remote'))) {
          return true;
        }

        if (cCode && countrySet.has(cCode)) {
          return true;
        }

        const locLower = (job.location || '').toLowerCase();
        for (const code of countries) {
          if (code !== 'remote' && locLower.includes(code)) {
            return true;
          }
        }

        if (!job.location || locLower.includes('unknown') || locLower.includes('flexible')) {
          return true;
        }

        return false;
      });
    }

    // B. State / Region Filtering
    if (states.length > 0) {
      const stateSet = new Set(states.map((s) => s.toLowerCase()));
      filteredList = filteredList.filter((job) => {
        const sCode = job.state?.toLowerCase();
        if (sCode && stateSet.has(sCode)) {
          return true;
        }
        const locLower = (job.location || '').toLowerCase();
        for (const st of states) {
          if (locLower.includes(st)) {
            return true;
          }
        }
        // Remote jobs bypass state filter if user chose include_remote
        if (includeRemote && (job.work_mode === 'remote' || locLower.includes('remote'))) {
          return true;
        }
        return false;
      });
    }

    // C. City Filtering
    if (cities.length > 0) {
      const citySet = new Set(cities.map((c) => c.toLowerCase().replace(/[-_]/g, ' ')));
      filteredList = filteredList.filter((job) => {
        const jCity = (job.city || '').toLowerCase().replace(/[-_]/g, ' ');
        if (jCity && citySet.has(jCity)) {
          return true;
        }
        const locLower = (job.location || '').toLowerCase();
        for (const ct of cities) {
          if (locLower.includes(ct.toLowerCase().replace(/[-_]/g, ' '))) {
            return true;
          }
        }
        // Remote jobs bypass city filter if user chose include_remote
        if (includeRemote && (job.work_mode === 'remote' || locLower.includes('remote'))) {
          return true;
        }
        return false;
      });
    }

    // D. Distance Radius Filter (when user coordinates are provided and radius > 0)
    if (userLat !== null && userLng !== null && radius > 0) {
      filteredList = filteredList.filter((job) => {
        if (job.distance_km !== undefined && job.distance_km <= radius) {
          return true;
        }
        if (includeRemote && (job.work_mode === 'remote' || (job.location || '').toLowerCase().includes('remote'))) {
          return true;
        }
        return false;
      });
    }

    // 4. Internship compensation & duration filter
    if (paid !== 'all') {
      if (paid === 'paid') {
        filteredList = filteredList.filter((j) => j.type === 'internship' && j.is_paid !== false);
      } else if (paid === 'unpaid') {
        filteredList = filteredList.filter((j) => j.type === 'internship' && j.is_paid === false);
      }
    }

    if (duration) {
      filteredList = filteredList.filter((j) => j.duration && j.duration.toLowerCase().includes(duration));
    }

    // 5. Compute Facets for active counts in filters
    const facets = {
      countries: {} as Record<string, number>,
      states: {} as Record<string, number>,
      cities: {} as Record<string, number>,
    };

    for (const job of filteredList) {
      if (job.country) {
        facets.countries[job.country] = (facets.countries[job.country] || 0) + 1;
      }
      if (job.state) {
        facets.states[job.state] = (facets.states[job.state] || 0) + 1;
      }
      if (job.city) {
        const cityKey = job.city.toLowerCase().replace(/\s+/g, '-');
        facets.cities[cityKey] = (facets.cities[cityKey] || 0) + 1;
      }
    }

    // Also populate baseline facets from deduplicated pool so zero-count items don't vanish
    for (const job of deduplicatedAndEnriched) {
      if (job.country && !(job.country in facets.countries)) {
        facets.countries[job.country] = 0;
      }
      if (job.state && !(job.state in facets.states)) {
        facets.states[job.state] = 0;
      }
      if (job.city) {
        const cityKey = job.city.toLowerCase().replace(/\s+/g, '-');
        if (!(cityKey in facets.cities)) {
          facets.cities[cityKey] = 0;
        }
      }
    }

    // 6. Sort results
    if (sort === 'nearest' && userLat !== null && userLng !== null) {
      filteredList.sort((a, b) => {
        const distA = a.distance_km ?? 999999;
        const distB = b.distance_km ?? 999999;
        return distA - distB;
      });
    } else if (sort === 'newest') {
      filteredList.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
    } else {
      // Relevance sorting with smart scoring (exact title match > partial title > company > description)
      if (q) {
        const qLower = q.toLowerCase().trim();
        const tokens = qLower.split(/\s+/).filter(Boolean);

        filteredList.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          const aTitle = (a.title || '').toLowerCase();
          const bTitle = (b.title || '').toLowerCase();
          const aCompany = (a.company || '').toLowerCase();
          const bCompany = (b.company || '').toLowerCase();

          // Full title match
          if (aTitle === qLower) scoreA += 50;
          if (bTitle === qLower) scoreB += 50;

          // Substring query in title
          if (aTitle.includes(qLower)) scoreA += 30;
          if (bTitle.includes(qLower)) scoreB += 30;

          // Company match
          if (aCompany.includes(qLower)) scoreA += 25;
          if (bCompany.includes(qLower)) scoreB += 25;

          // Word tokens
          for (const t of tokens) {
            const rx = new RegExp(`\\b${t}`, 'i');
            if (rx.test(aTitle)) scoreA += 15;
            if (rx.test(bTitle)) scoreB += 15;
            if (rx.test(aCompany)) scoreA += 10;
            if (rx.test(bCompany)) scoreB += 10;
          }

          return scoreB - scoreA;
        });
      }
    }

    // 7. Pagination
    const total = filteredList.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = filteredList.slice(startIndex, startIndex + limit);

    // 8. No-Dead-Ends Fallback Cascade
    let fallbackJobs: NormalizedJob[] = [];
    let fallbackInfo: {
      hasFallback: boolean;
      scope: 'radius' | 'state' | 'country' | 'remote' | 'none';
      message: string;
      originalTarget: string;
    } | undefined = undefined;

    if (total === 0 && (cities.length > 0 || states.length > 0 || countries.length > 0 || userLat !== null)) {
      const qTokens = q ? q.toLowerCase().split(/\s+/).filter(Boolean) : [];
      const queryMatchedPool = qTokens.length > 0
        ? deduplicatedAndEnriched.filter((j) => {
            const text = `${j.title} ${j.company} ${j.location} ${j.description} ${(j.requirements || []).join(' ')}`.toLowerCase();
            return qTokens.every((t) => text.includes(t));
          })
        : [];
      const pool = queryMatchedPool.length > 0 ? queryMatchedPool : deduplicatedAndEnriched;

      // Priority 1: Within 100km radius
      if (userLat !== null && userLng !== null) {
        const radiusMatches = pool.filter(
          (j) => j.distance_km !== undefined && j.distance_km <= 100
        );
        if (radiusMatches.length > 0) {
          fallbackJobs = radiusMatches.slice(0, 10);
          fallbackInfo = {
            hasFallback: true,
            scope: 'radius',
            message: `No exact matches in your selected area, but here are ${radiusMatches.length} openings within 100 km`,
            originalTarget: cities[0] || 'selected location',
          };
        }
      }

      // Priority 2: In same state / region
      if (fallbackJobs.length === 0 && states.length > 0) {
        const stateSet = new Set(states.map((s) => s.toLowerCase()));
        const stateMatches = pool.filter(
          (j) => (j.state && stateSet.has(j.state.toLowerCase())) || j.work_mode === 'remote'
        );
        if (stateMatches.length > 0) {
          fallbackJobs = stateMatches.slice(0, 10);
          fallbackInfo = {
            hasFallback: true,
            scope: 'state',
            message: `No exact matches in ${cities.join(', ') || 'selected city'}, but found ${stateMatches.length} opportunities across ${states.join(', ').toUpperCase()} & Remote`,
            originalTarget: cities[0] || 'selected city',
          };
        }
      }

      // Priority 3: In same country or nationwide
      if (fallbackJobs.length === 0 && countries.length > 0) {
        const countrySet = new Set(countries.map((c) => c.toLowerCase()));
        const countryMatches = pool.filter(
          (j) => (j.country && countrySet.has(j.country.toLowerCase())) || j.work_mode === 'remote'
        );
        if (countryMatches.length > 0) {
          fallbackJobs = countryMatches.slice(0, 10);
          fallbackInfo = {
            hasFallback: true,
            scope: 'country',
            message: `No openings in ${cities[0] || states[0] || 'this city'}, but found ${countryMatches.length} openings nationwide & Remote Worldwide`,
            originalTarget: cities[0] || states[0] || 'selected location',
          };
        }
      }

      // Priority 4: Remote Worldwide fallback
      if (fallbackJobs.length === 0) {
        const remoteMatches = pool.filter(
          (j) => j.work_mode === 'remote' || (j.location || '').toLowerCase().includes('remote')
        );
        if (remoteMatches.length > 0) {
          fallbackJobs = remoteMatches.slice(0, 8);
          fallbackInfo = {
            hasFallback: true,
            scope: 'remote',
            message: `No local listings found yet, but here are ${remoteMatches.length} open Remote positions you can apply to today`,
            originalTarget: cities[0] || states[0] || 'your location',
          };
        }
      }
    }

    const responsePayload = {
      jobs: paginated,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
      facets,
      fallbackJobs: fallbackJobs.length > 0 ? fallbackJobs : undefined,
      fallbackInfo,
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
