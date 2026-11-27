import fs from 'fs';
import path from 'path';
import { NormalizedJob } from '@/app/api/search/jobs/route';
import { resolveCanonicalLocation } from './geocoder';
import { generateJobFingerprint, deduplicateJobs } from './deduplicator';
import { calculateDistanceKm } from '@/lib/locations';

const JOBS_STORAGE_FILE = path.join(process.cwd(), 'data', 'jobs-index.json');
const REPORTS_STORAGE_FILE = path.join(process.cwd(), 'data', 'job-reports.json');
const ALERTS_STORAGE_FILE = path.join(process.cwd(), 'data', 'job-alerts.json');

export interface StoredJob extends NormalizedJob {
  canonicalLocationId: string;
  fingerprint: string;
  isExpired: boolean;
  lastVerifiedAt: string;
}

export interface JobQueryFilters {
  query?: string;
  country?: string;
  state?: string;
  city?: string;
  workMode?: string;
  experienceLevel?: string;
  type?: string;
  userLat?: number | null;
  userLng?: number | null;
  radius?: number;
  includeRemote?: boolean;
  sort?: 'relevant' | 'newest' | 'nearest';
  page?: number;
  limit?: number;
}

let inMemoryJobsCache: StoredJob[] | null = null;

export function loadAllJobsFromStore(): StoredJob[] {
  if (inMemoryJobsCache) return inMemoryJobsCache;

  try {
    if (fs.existsSync(JOBS_STORAGE_FILE)) {
      const raw = fs.readFileSync(JOBS_STORAGE_FILE, 'utf8');
      inMemoryJobsCache = JSON.parse(raw);
      return inMemoryJobsCache || [];
    }
  } catch (err) {
    console.error('Failed to read jobs-index.json', err);
  }

  inMemoryJobsCache = [];
  return [];
}

export function saveJobsToStore(newJobs: NormalizedJob[]): { savedCount: number; duplicateCount: number } {
  const currentJobs = loadAllJobsFromStore();
  const existingFpMap = new Map<string, StoredJob>();

  for (const j of currentJobs) {
    existingFpMap.set(j.fingerprint, j);
  }

  let savedCount = 0;
  let duplicateCount = 0;

  for (const incoming of newJobs) {
    const loc = resolveCanonicalLocation(incoming.location);
    const fp = (incoming as any).fingerprint || generateJobFingerprint(incoming.title, incoming.company, loc.canonicalId);

    if (existingFpMap.has(fp)) {
      duplicateCount++;
      // Update last verified
      const existing = existingFpMap.get(fp)!;
      existing.lastVerifiedAt = new Date().toISOString();
      if (incoming.description && incoming.description.length > (existing.description || '').length) {
        existing.description = incoming.description;
      }
    } else {
      const stored: StoredJob = {
        ...incoming,
        country: loc.countryCode,
        state: loc.stateCode,
        city: loc.city,
        latitude: loc.latitude || incoming.latitude,
        longitude: loc.longitude || incoming.longitude,
        canonicalLocationId: loc.canonicalId,
        fingerprint: fp,
        isExpired: false,
        lastVerifiedAt: new Date().toISOString(),
      };
      existingFpMap.set(fp, stored);
      savedCount++;
    }
  }

  inMemoryJobsCache = Array.from(existingFpMap.values());

  try {
    const dir = path.dirname(JOBS_STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(JOBS_STORAGE_FILE, JSON.stringify(inMemoryJobsCache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to persist jobs-index.json', e);
  }

  return { savedCount, duplicateCount };
}

export function searchStoredJobs(filters: JobQueryFilters): {
  jobs: StoredJob[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    countries: Record<string, number>;
    states: Record<string, number>;
    cities: Record<string, number>;
  };
} {
  const all = loadAllJobsFromStore().filter((j) => !j.isExpired);
  let filtered = all;

  const q = (filters.query || '').toLowerCase().trim();
  const country = (filters.country || '').toLowerCase().trim();
  const state = (filters.state || '').toLowerCase().trim();
  const city = (filters.city || '').toLowerCase().trim();
  const workMode = (filters.workMode || 'all').toLowerCase();
  const expLevel = (filters.experienceLevel || 'all').toLowerCase();
  const type = (filters.type || 'all').toLowerCase();
  const radius = filters.radius || 0;
  const includeRemote = filters.includeRemote !== false;
  const userLat = filters.userLat ?? null;
  const userLng = filters.userLng ?? null;
  const sort = filters.sort || 'relevant';
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, filters.limit || 10);

  // 1. Text Query Filter
  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean);
    filtered = filtered.filter((j) => {
      const text = `${j.title} ${j.company} ${j.location} ${j.description} ${j.requirements.join(' ')}`.toLowerCase();
      return tokens.every((t) => text.includes(t));
    });
  }

  // 2. Type Filter
  if (type !== 'all') {
    filtered = filtered.filter((j) => j.type === type);
  }

  // 3. Work Mode Filter
  if (workMode !== 'all') {
    filtered = filtered.filter((j) => j.work_mode === workMode);
  }

  // 4. Experience Level
  if (expLevel !== 'all') {
    filtered = filtered.filter((j) => j.experience_level.toLowerCase() === expLevel);
  }

  // 5. Country Filter
  if (country && country !== 'all') {
    filtered = filtered.filter((j) => {
      if (country === 'remote' && (j.work_mode === 'remote' || j.location.toLowerCase().includes('remote'))) {
        return true;
      }
      return (j.country || '').toLowerCase() === country;
    });
  }

  // 6. State Filter
  if (state && state !== 'all') {
    filtered = filtered.filter((j) => {
      if (includeRemote && (j.work_mode === 'remote' || j.location.toLowerCase().includes('remote'))) {
        return true;
      }
      return (j.state || '').toLowerCase() === state;
    });
  }

  // 7. City Filter
  if (city && city !== 'all') {
    const normCity = city.toLowerCase().replace(/[-_]/g, ' ');
    filtered = filtered.filter((j) => {
      if (includeRemote && (j.work_mode === 'remote' || j.location.toLowerCase().includes('remote'))) {
        return true;
      }
      const jCity = (j.city || '').toLowerCase().replace(/[-_]/g, ' ');
      const rawLoc = j.location.toLowerCase();
      return jCity === normCity || jCity.includes(normCity) || rawLoc.includes(normCity);
    });
  }

  // 8. Distance calculation & Radius Filter
  if (userLat !== null && userLng !== null) {
    filtered = filtered.map((j) => {
      if (j.latitude !== undefined && j.longitude !== undefined) {
        return {
          ...j,
          distance_km: calculateDistanceKm(userLat, userLng, j.latitude, j.longitude),
        };
      }
      return j;
    });

    if (radius > 0) {
      filtered = filtered.filter((j) => {
        if (j.distance_km !== undefined && j.distance_km <= radius) {
          return true;
        }
        if (includeRemote && (j.work_mode === 'remote' || j.location.toLowerCase().includes('remote'))) {
          return true;
        }
        return false;
      });
    }
  }

  // 9. Facets Calculation
  const facets = {
    countries: {} as Record<string, number>,
    states: {} as Record<string, number>,
    cities: {} as Record<string, number>,
  };

  for (const j of filtered) {
    if (j.country) {
      facets.countries[j.country] = (facets.countries[j.country] || 0) + 1;
    }
    if (j.state) {
      facets.states[j.state] = (facets.states[j.state] || 0) + 1;
    }
    if (j.city) {
      const cityKey = j.city.toLowerCase().replace(/\s+/g, '-');
      facets.cities[cityKey] = (facets.cities[cityKey] || 0) + 1;
    }
  }

  // 10. Sorting
  if (sort === 'nearest' && userLat !== null && userLng !== null) {
    filtered.sort((a, b) => (a.distance_km ?? 999999) - (b.distance_km ?? 999999));
  } else if (sort === 'newest') {
    filtered.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
  } else if (q) {
    filtered.sort((a, b) => {
      const aMatch = a.title.toLowerCase().includes(q) ? 1 : 0;
      const bMatch = b.title.toLowerCase().includes(q) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  // 11. Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    jobs: paginated,
    total,
    page,
    totalPages,
    facets,
  };
}

export function recordJobReport(report: { jobId: string; reason: string; details?: string; email?: string }): boolean {
  try {
    let reports = [];
    if (fs.existsSync(REPORTS_STORAGE_FILE)) {
      reports = JSON.parse(fs.readFileSync(REPORTS_STORAGE_FILE, 'utf8'));
    }
    reports.push({
      id: `rep_${Date.now()}`,
      ...report,
      createdAt: new Date().toISOString(),
      resolved: false,
    });
    fs.writeFileSync(REPORTS_STORAGE_FILE, JSON.stringify(reports, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

export function createJobAlert(alert: { email: string; query: string; location: string }): boolean {
  try {
    let alerts = [];
    if (fs.existsSync(ALERTS_STORAGE_FILE)) {
      alerts = JSON.parse(fs.readFileSync(ALERTS_STORAGE_FILE, 'utf8'));
    }
    alerts.push({
      id: `alt_${Date.now()}`,
      ...alert,
      createdAt: new Date().toISOString(),
      active: true,
    });
    fs.writeFileSync(ALERTS_STORAGE_FILE, JSON.stringify(alerts, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

export function getJobReports(): any[] {
  try {
    if (fs.existsSync(REPORTS_STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(REPORTS_STORAGE_FILE, 'utf8'));
    }
  } catch (e) {
    // fallback
  }
  return [];
}

export function getJobAlerts(): any[] {
  try {
    if (fs.existsSync(ALERTS_STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(ALERTS_STORAGE_FILE, 'utf8'));
    }
  } catch (e) {
    // fallback
  }
  return [];
}
