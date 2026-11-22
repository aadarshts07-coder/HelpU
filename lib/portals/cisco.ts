import { NormalizedJob } from '@/app/api/search/jobs/route';
import { PortalAdapter, PortalSearchParams } from './types';
import { detectJobType, detectExperienceLevel, detectWorkMode, matchesClientFilters } from './utils';

export const ciscoAdapter: PortalAdapter = {
  id: 'cisco',
  name: 'Cisco Careers',
  baseUrl: 'https://jobs.cisco.com',

  async fetchJobs(params: PortalSearchParams): Promise<NormalizedJob[]> {
    const query = params.query || (params.type === 'internship' ? 'intern' : '');
    const limit = params.limit ? Math.min(params.limit * 3, 50) : 30;

    const payload = {
      lang: 'en_global',
      deviceType: 'desktop',
      country: 'global',
      pageName: 'search-results',
      ddoKey: 'refineSearch',
      sortBy: '',
      from: 0,
      jobs: true,
      counts: true,
      all_fields: ['category', 'country', 'state', 'city', 'type'],
      size: limit,
      clearAll: false,
      keywords: query,
      global: true,
      refNum: 'CISCISGLOBAL',
    };

    let attempts = 0;
    let res: Response | null = null;

    while (attempts < 2) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        res = await fetch('https://careers.cisco.com/widgets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        if (res.ok) break;
      } catch (err) {
        attempts++;
        if (attempts >= 2) throw err;
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (!res || !res.ok) {
      return [];
    }

    const data = await res.json();
    const rawJobs = data?.refineSearch?.data?.jobs || [];

    const normalized: NormalizedJob[] = rawJobs.map((j: any) => {
      const location = [j.city, j.state, j.country].filter(Boolean).join(', ') || 'Global';
      const type = detectJobType(j.title, j.descriptionTeaser || '');
      const workMode = detectWorkMode(location, j.title);
      const experienceLevel = detectExperienceLevel(j.title);

      const applyUrl = j.applyUrl
        ? j.applyUrl
        : `https://jobs.cisco.com/jobs/ProjectDetail/${encodeURIComponent(j.title?.replace(/\s+/g, '-'))}/${j.jobId}`;

      return {
        id: `cisco_${j.jobId || Math.random().toString(36).substring(2, 9)}`,
        title: j.title || 'Career Opportunity',
        company: 'Cisco Systems',
        location,
        work_mode: workMode,
        type,
        salary_or_stipend: j.salary || 'Competitive / Market Standard',
        posted_at: j.postedDate ? new Date(j.postedDate).toISOString() : new Date().toISOString(),
        source: 'Cisco' as any,
        url: applyUrl,
        description: j.descriptionTeaser || `Official Cisco career opportunity for ${j.title}. Category: ${j.category || 'Engineering'}.`,
        requirements: j.category ? [`Category: ${j.category}`, `Requisition ID: ${j.jobId}`] : [`Requisition ID: ${j.jobId}`],
        experience_level: experienceLevel,
        is_paid: type === 'internship' ? true : undefined,
        duration: type === 'internship' ? '12 weeks / Summer Internship' : undefined,
      };
    });

    return normalized.filter((job) =>
      matchesClientFilters(job, {
        query: params.query,
        location: params.location,
        workMode: params.workMode,
        experienceLevel: params.experienceLevel,
        type: params.type,
        datePosted: params.datePosted,
        countries: params.countries,
      })
    );
  },
};
