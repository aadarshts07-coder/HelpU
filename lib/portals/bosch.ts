import { NormalizedJob } from '@/app/api/search/jobs/route';
import { PortalAdapter, PortalSearchParams } from './types';
import { detectJobType, detectExperienceLevel, detectWorkMode, matchesClientFilters } from './utils';

export const boschAdapter: PortalAdapter = {
  id: 'bosch',
  name: 'Bosch Careers',
  baseUrl: 'https://careers.smartrecruiters.com/BoschGroup',

  async fetchJobs(params: PortalSearchParams): Promise<NormalizedJob[]> {
    const query = params.query || (params.type === 'internship' ? 'intern' : '');
    const limit = params.limit ? Math.min(params.limit * 3, 50) : 30;

    const url = new URL('https://api.smartrecruiters.com/v1/companies/BoschGroup/postings');
    if (query) url.searchParams.set('q', query);
    url.searchParams.set('limit', limit.toString());

    if (params.countries && params.countries.length > 0) {
      const realCountryCodes = params.countries.filter((c) => c !== 'remote');
      if (realCountryCodes.length === 1) {
        url.searchParams.set('country', realCountryCodes[0].toLowerCase());
      }
    }

    let attempts = 0;
    let res: Response | null = null;

    while (attempts < 2) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        res = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
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
    const rawJobs = data?.content || [];

    const normalized: NormalizedJob[] = rawJobs.map((j: any) => {
      const city = j.location?.city || '';
      const region = j.location?.region || '';
      const country = j.location?.country || '';
      const location = [city, region, country].filter(Boolean).join(', ') || 'Global';

      const type = detectJobType(j.name || '', '');
      const workMode = detectWorkMode(location, j.name || '');
      const experienceLevel = detectExperienceLevel(j.name || '');

      const applyUrl = `https://jobs.smartrecruiters.com/BoschGroup/${j.id}`;

      return {
        id: `bosch_${j.id || Math.random().toString(36).substring(2, 9)}`,
        title: j.name || 'Bosch Opportunity',
        company: 'Bosch Group',
        location,
        work_mode: workMode,
        type,
        salary_or_stipend: 'Competitive Corporate Compensation',
        posted_at: j.releasedDate ? new Date(j.releasedDate).toISOString() : new Date().toISOString(),
        source: 'Bosch' as any,
        url: applyUrl,
        description: `Official Bosch career opportunity: ${j.name}. Department: ${j.department?.label || 'Engineering / Mobility'}. Location: ${location}.`,
        requirements: [
          j.department?.label ? `Department: ${j.department.label}` : 'Mobility & Industrial Technology',
          `Job ID: ${j.id}`,
        ],
        experience_level: experienceLevel,
        is_paid: type === 'internship' ? true : undefined,
        duration: type === 'internship' ? '3 to 6 months' : undefined,
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
