import { NormalizedJob } from '@/app/api/search/jobs/route';
import { PortalAdapter, PortalConfig, PortalSearchParams } from './types';
import { ciscoAdapter } from './cisco';
import { redhatAdapter } from './redhat';
import { boschAdapter } from './bosch';
import { pricolAdapter } from './pricol';
import { freehireAdapter } from './freehire';
import { BRAND } from '@/lib/config/brand';

export const PORTAL_REGISTRY: Record<string, PortalConfig> = {
  freehire: {
    id: 'freehire',
    name: BRAND.portalName,
    baseUrl: 'https://freehire.me',
    adapter: freehireAdapter,
    requiresManualLogin: false, // Direct ATS career links
  },
  cisco: {
    id: 'cisco',
    name: 'Cisco Careers',
    baseUrl: 'https://jobs.cisco.com',
    adapter: ciscoAdapter,
    requiresManualLogin: true, // Cisco uses Workday candidate login for submissions
  },
  redhat: {
    id: 'redhat',
    name: 'Red Hat Careers',
    baseUrl: 'https://redhat.com/en/jobs',
    adapter: redhatAdapter,
    requiresManualLogin: true, // Workday application login
  },
  bosch: {
    id: 'bosch',
    name: 'Bosch Careers',
    baseUrl: 'https://careers.smartrecruiters.com/BoschGroup',
    adapter: boschAdapter,
    requiresManualLogin: false, // SmartRecruiters 1-click apply compatible
  },
  pricol: {
    id: 'pricol',
    name: 'Pricol Careers',
    baseUrl: 'https://pricol.com/careers',
    adapter: pricolAdapter,
    requiresManualLogin: false, // Direct application portal form
  },
};

// 15-minute query cache for portal responses
const portalCache = new Map<string, { jobs: NormalizedJob[]; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function fetchFromRegisteredPortals(
  portalId: string = 'all',
  params: PortalSearchParams
): Promise<{ jobs: NormalizedJob[]; errors: Record<string, string> }> {
  const normPortalId = portalId.toLowerCase().trim();
  const cacheKey = JSON.stringify({ portalId: normPortalId, ...params });

  const cached = portalCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { jobs: cached.jobs, errors: {} };
  }

  const errors: Record<string, string> = {};
  let combinedJobs: NormalizedJob[] = [];

  // Single portal selected
  if (PORTAL_REGISTRY[normPortalId]) {
    const config = PORTAL_REGISTRY[normPortalId];
    try {
      combinedJobs = await config.adapter.fetchJobs(params);
    } catch (err: any) {
      console.error(`Error querying portal ${normPortalId}:`, err);
      errors[normPortalId] = err.message || 'Failed to fetch jobs from official portal.';
    }
  } else {
    // "All Portals": Fan-out parallel queries across all registered company portals
    const portalEntries = Object.values(PORTAL_REGISTRY);

    const results = await Promise.allSettled(
      portalEntries.map(async (p) => {
        try {
          return await p.adapter.fetchJobs(params);
        } catch (err: any) {
          errors[p.id] = err.message;
          return [];
        }
      })
    );

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'fulfilled') {
        combinedJobs.push(...res.value);
      } else {
        const portalName = portalEntries[i].id;
        errors[portalName] = res.reason?.message || 'Request timed out';
      }
    }
  }

  // Deduplicate by company + title + location key
  const seen = new Set<string>();
  const deduplicated = combinedJobs.filter((job) => {
    const key = `${job.company.toLowerCase().trim()}_${job.title.toLowerCase().trim()}_${(job.location || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Cache successful result
  portalCache.set(cacheKey, {
    jobs: deduplicated,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return { jobs: deduplicated, errors };
}
