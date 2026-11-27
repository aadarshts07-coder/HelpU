import { NormalizedJob } from '@/app/api/search/jobs/route';
import { SourceAdapter, SourceSearchParams } from './types';
import { resolveCanonicalLocation } from '../geocoder';
import { cleanHtmlDescription } from '../quality';

export const remotiveAdapter: SourceAdapter = {
  id: 'remotive',
  name: 'Remotive Open Remote API',
  type: 'remote_feed',
  termsCompliant: true,

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedJob[]> {
    // Only query Remotive if looking for remote or generic query
    if (params.city && params.city !== 'remote') {
      return [];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = new URL('https://remotive.com/api/remote-jobs');
      if (params.query) url.searchParams.set('search', params.query);
      url.searchParams.set('limit', '20');

      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return [];
      const data = await res.json();
      const jobs = data.jobs || [];

      return jobs.map((j: any) => {
        const rawLoc = j.candidate_required_location || 'Remote (Worldwide)';
        const resolved = resolveCanonicalLocation(rawLoc);

        return {
          id: `rem_${j.id}`,
          title: j.title,
          company: j.company_name,
          location: rawLoc,
          country: resolved.countryCode,
          state: resolved.stateCode,
          city: resolved.city,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          work_mode: 'remote',
          type: /intern/i.test(j.title) ? 'internship' : 'job',
          salary_or_stipend: j.salary || '',
          posted_at: j.publication_date || new Date().toISOString(),
          source: 'Direct Career Page',
          url: j.url,
          description: cleanHtmlDescription(j.description),
          requirements: j.tags || [],
          experience_level: /senior|lead/i.test(j.title) ? 'Senior' : /junior|entry/i.test(j.title) ? 'Entry' : 'Mid',
        };
      });
    } catch (e) {
      return [];
    }
  },

  async healthCheck() {
    return { ok: true, latencyMs: 180 };
  },
};
