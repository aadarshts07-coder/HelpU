import { NormalizedJob } from '@/app/api/search/jobs/route';
import { PortalAdapter, PortalSearchParams } from './types';
import { detectJobType, detectExperienceLevel, detectWorkMode, matchesClientFilters } from './utils';

export const pricolAdapter: PortalAdapter = {
  id: 'pricol',
  name: 'Pricol Careers',
  baseUrl: 'https://pricol.com/careers',

  async fetchJobs(params: PortalSearchParams): Promise<NormalizedJob[]> {
    const query = params.query || (params.type === 'internship' ? 'intern' : '');
    const limit = params.limit ? Math.min(params.limit * 3, 20) : 15;

    const url = new URL('https://pricol.com/wp-json/wp/v2/jobs');
    if (query) url.searchParams.set('search', query);
    url.searchParams.set('per_page', limit.toString());

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

    const rawJobs = await res.json();
    if (!Array.isArray(rawJobs)) {
      return [];
    }

    const normalized: NormalizedJob[] = rawJobs.map((j: any) => {
      // Decode HTML entities in title
      const rawTitle = j.title?.rendered || 'Engineering Position';
      const cleanTitle = rawTitle
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<[^>]*>/g, '')
        .trim();

      const rawExcerpt = j.excerpt?.rendered || j.content?.rendered || '';
      const cleanDescription = rawExcerpt.replace(/<[^>]*>/g, '').trim() ||
        `Official career opportunity at Pricol Limited: ${cleanTitle}. Automotive technology and precision engineered systems.`;

      const location = 'Coimbatore, Tamil Nadu / India Plants';
      const type = detectJobType(cleanTitle, cleanDescription);
      const workMode = detectWorkMode(location, cleanTitle);
      const experienceLevel = detectExperienceLevel(cleanTitle);

      const applyUrl = j.link || `https://pricol.com/jobs/${j.slug || j.id}/`;

      return {
        id: `pricol_${j.id || Math.random().toString(36).substring(2, 9)}`,
        title: cleanTitle,
        company: 'Pricol Limited',
        location,
        work_mode: workMode,
        type,
        salary_or_stipend: 'Standard Automotive Industry Compensation',
        posted_at: j.date ? new Date(j.date).toISOString() : new Date().toISOString(),
        source: 'Pricol' as any,
        url: applyUrl,
        description: cleanDescription,
        requirements: ['Automotive / Mechanical / Embedded Systems', `Post ID: ${j.id}`],
        experience_level: experienceLevel,
        is_paid: type === 'internship' ? true : undefined,
        duration: type === 'internship' ? 'Graduate Apprenticeship / 6 Months' : undefined,
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
