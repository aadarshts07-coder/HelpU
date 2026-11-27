import { NormalizedJob } from '@/app/api/search/jobs/route';
import { SourceAdapter, SourceSearchParams } from './adapters/types';
import { greenhouseAdapter } from './adapters/greenhouse';
import { smartrecruitersAdapter } from './adapters/smartrecruiters';
import { remotiveAdapter } from './adapters/remotive';
import { adzunaAdapter } from './adapters/adzuna';
import { resolveCanonicalLocation } from './geocoder';
import { validateJobQuality } from './quality';
import { deduplicateJobs } from './deduplicator';
import { logZeroResultSearch } from './zero-results';

export const REGISTERED_SOURCE_ADAPTERS: SourceAdapter[] = [
  greenhouseAdapter,
  smartrecruitersAdapter,
  remotiveAdapter,
  adzunaAdapter,
];

// In-memory query cache (15 minutes)
const aggregationCache = new Map<string, { jobs: NormalizedJob[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

export async function aggregateJobsFromAllSources(params: SourceSearchParams): Promise<{
  jobs: NormalizedJob[];
  sourceStats: Record<string, number>;
}> {
  const cacheKey = JSON.stringify(params);
  const cached = aggregationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      jobs: cached.jobs,
      sourceStats: {},
    };
  }

  // 1. Run all eligible adapters concurrently
  const adapterPromises = REGISTERED_SOURCE_ADAPTERS.map(async (adapter) => {
    try {
      const jobs = await adapter.fetchJobs(params);
      return { adapterId: adapter.id, jobs };
    } catch (err) {
      console.warn(`Adapter ${adapter.id} failed:`, err);
      return { adapterId: adapter.id, jobs: [] };
    }
  });

  const adapterResults = await Promise.allSettled(adapterPromises);
  const rawJobs: NormalizedJob[] = [];
  const sourceStats: Record<string, number> = {};

  for (const res of adapterResults) {
    if (res.status === 'fulfilled') {
      const { adapterId, jobs } = res.value;
      sourceStats[adapterId] = jobs.length;
      rawJobs.push(...jobs);
    }
  }

  // 2. Normalization & Quality Filtering
  const cleanJobs: NormalizedJob[] = [];
  for (const job of rawJobs) {
    // Quality validation
    const quality = validateJobQuality(job.title, job.company, job.description, job.url);
    if (!quality.isValid) continue;

    // Location normalization
    const loc = resolveCanonicalLocation(job.location);

    cleanJobs.push({
      ...job,
      country: loc.countryCode,
      state: loc.stateCode,
      city: loc.city,
      latitude: loc.latitude || job.latitude,
      longitude: loc.longitude || job.longitude,
      description: quality.cleanDescription,
    });
  }

  // 3. Deduplication
  const deduplicated = deduplicateJobs(cleanJobs);

  // 4. Log Zero-Result demand if no jobs found
  if (deduplicated.length === 0 && (params.query || params.city || params.state)) {
    logZeroResultSearch({
      query: params.query || '',
      country: params.country || '',
      state: params.state || '',
      city: params.city || '',
      resultCount: 0,
      timestamp: new Date().toISOString(),
    });
  }

  // Cache results
  aggregationCache.set(cacheKey, {
    jobs: deduplicated,
    timestamp: Date.now(),
  });

  return {
    jobs: deduplicated,
    sourceStats,
  };
}
