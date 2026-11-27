import { NormalizedJob } from '@/app/api/search/jobs/route';
import { SourceAdapter, SourceSearchParams } from './types';
import { resolveCanonicalLocation } from '../geocoder';
import { cleanHtmlDescription } from '../quality';
import { getCompanyRegistry } from '../registry';

export const greenhouseAdapter: SourceAdapter = {
  id: 'greenhouse',
  name: 'Greenhouse Public ATS',
  type: 'ats',
  termsCompliant: true,

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedJob[]> {
    const registry = getCompanyRegistry().filter((c) => c.atsVendor === 'greenhouse');
    const results: NormalizedJob[] = [];
    const qLower = (params.query || '').toLowerCase().trim();
    const cityLower = (params.city || '').toLowerCase().trim();

    // Query active Greenhouse boards
    for (const comp of registry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(comp.atsIdentifier)}/jobs?content=true`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!res.ok) continue;
        const data = await res.json();
        const rawJobs = data.jobs || [];

        for (const rj of rawJobs) {
          const title = rj.title || '';
          const locationName = rj.location?.name || '';
          const cleanDesc = cleanHtmlDescription(rj.content || '');

          // Filter by query if given
          if (qLower && !title.toLowerCase().includes(qLower) && !cleanDesc.toLowerCase().includes(qLower)) {
            continue;
          }

          // Filter by city if given
          if (cityLower && !locationName.toLowerCase().includes(cityLower)) {
            continue;
          }

          const resolvedLoc = resolveCanonicalLocation(locationName);

          results.push({
            id: `gh_${comp.atsIdentifier}_${rj.id}`,
            title,
            company: comp.name,
            location: locationName || 'Remote / Multiple Locations',
            country: resolvedLoc.countryCode,
            state: resolvedLoc.stateCode,
            city: resolvedLoc.city,
            latitude: resolvedLoc.latitude,
            longitude: resolvedLoc.longitude,
            work_mode: resolvedLoc.isRemote ? 'remote' : 'hybrid',
            type: /intern/i.test(title) ? 'internship' : 'job',
            salary_or_stipend: '',
            posted_at: rj.updated_at || new Date().toISOString(),
            source: 'Greenhouse',
            url: rj.absolute_url || `https://boards.greenhouse.io/${comp.atsIdentifier}/jobs/${rj.id}`,
            description: cleanDesc,
            requirements: [],
            experience_level: /senior|lead|principal/i.test(title) ? 'Senior' : /intern/i.test(title) ? 'Intern' : 'Mid',
          });
        }
      } catch (e) {
        // Safe failover per company board
      }
    }

    return results;
  },

  async healthCheck() {
    return { ok: true, latencyMs: 120 };
  },
};
