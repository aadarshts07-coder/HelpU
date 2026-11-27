import fs from 'fs';
import path from 'path';
import { DiscoverResponse } from './types';

interface CacheEntry {
  key: string;
  response: DiscoverResponse;
  savedAt: number;
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'certifications-cache.json');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const memoryCache = new Map<string, CacheEntry>();

function loadDiskCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const data: Record<string, CacheEntry> = JSON.parse(raw);
      for (const [k, v] of Object.entries(data)) {
        memoryCache.set(k, v);
      }
    }
  } catch {}
}

function saveDiskCache() {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj: Record<string, CacheEntry> = {};
    memoryCache.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {}
}

loadDiskCache();

export function getCachedCertifications(
  cacheKey: string
): { response: DiscoverResponse | null; isStale: boolean } {
  const entry = memoryCache.get(cacheKey);
  if (!entry) return { response: null, isStale: false };

  const now = Date.now();
  const isStale = now - entry.savedAt > SEVEN_DAYS_MS;
  return { response: entry.response, isStale };
}

export function setCachedCertifications(cacheKey: string, response: DiscoverResponse): void {
  memoryCache.set(cacheKey, {
    key: cacheKey,
    response,
    savedAt: Date.now(),
  });
  saveDiskCache();
}
