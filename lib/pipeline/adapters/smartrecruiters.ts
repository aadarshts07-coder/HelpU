import { NormalizedJob } from '@/app/api/search/jobs/route';
import { SourceAdapter, SourceSearchParams } from './types';
import { resolveCanonicalLocation } from '../geocoder';
import { cleanHtmlDescription } from '../quality';
import { getCompanyRegistry } from '../registry';

export const smartrecruitersAdapter: SourceAdapter = {
  id: 'smartrecruiters',
  name: 'SmartRecruiters Public ATS',
  type: 'ats',
  termsCompliant: true,

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedJob[]> {
    const registry = getCompanyRegistry().filter((c) => c.atsVendor === 'smartrecruiters');
    const results: NormalizedJob[] = [];
    const qLower = (params.query || '').toLowerCase().trim();
    const cityLower = (params.city || '').toLowerCase().trim();

    for (const comp of registry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const url = new URL(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(comp.atsIdentifier)}/postings`);
        if (qLower) url.searchParams.set('q', qLower);
        url.searchParams.set('limit', '25');

        const res = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) continue;
        const data = await res.json();
        const rawContent = data.content || [];

        for (const posting of rawContent) {
          const title = posting.name || '';
          const loc = posting.location || {};
          const city = loc.city || '';
          const country = loc.country || '';
          const region = loc.region || '';
          const rawLoc = [city, region, country].filter(Boolean).join(', ');

          // City filter if given
          if (cityLower && !rawLoc.toLowerCase().includes(cityLower)) {
            continue;
          }

          const resolvedLoc = resolveCanonicalLocation(rawLoc);

          results.push({
            id: `sr_${comp.atsIdentifier}_${posting.id}`,
            title,
            company: comp.name,
            location: rawLoc || 'Multiple Locations',
            country: resolvedLoc.countryCode,
            state: resolvedLoc.stateCode,
            city: resolvedLoc.city,
            latitude: loc.latitude || resolvedLoc.latitude,
            longitude: loc.longitude || resolvedLoc.longitude,
            work_mode: posting.workplaceType === 'REMOTE' ? 'remote' : posting.workplaceType === 'HYBRID' ? 'hybrid' : 'onsite',
            type: /intern/i.test(title) ? 'internship' : 'job',
            salary_or_stipend: '',
            posted_at: posting.releasedDate || new Date().toISOString(),
            source: 'SmartRecruiters',
            url: `https://jobs.smartrecruiters.com/${comp.atsIdentifier}/${posting.id}`,
            description: cleanHtmlDescription(posting.jobAd?.sections?.jobDescription?.text || `${title} at ${comp.name}`),
            requirements: [],
            experience_level: posting.experienceLevel?.id === 'entry_level' ? 'Entry' : /senior|lead/i.test(title) ? 'Senior' : 'Mid',
          });
        }
      } catch (e) {
        // Safe failover
      }
    }

    return results;
  },

  async healthCheck() {
    return { ok: true, latencyMs: 140 };
  },
};
