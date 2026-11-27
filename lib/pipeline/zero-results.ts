import fs from 'fs';
import path from 'path';

export interface ZeroResultRecord {
  query: string;
  country: string;
  state: string;
  city: string;
  resultCount: number;
  timestamp: string;
}

const LOG_FILE = path.join(process.cwd(), 'data', 'zero-results.json');
let inMemoryZeroLogs: ZeroResultRecord[] = [];

export function logZeroResultSearch(record: ZeroResultRecord): void {
  inMemoryZeroLogs.push(record);
  if (inMemoryZeroLogs.length > 500) {
    inMemoryZeroLogs.shift();
  }

  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOG_FILE, JSON.stringify(inMemoryZeroLogs, null, 2), 'utf8');
  } catch (e) {
    // Fail silently in read-only / restricted environments
  }
}

export function getZeroResultLogs(): ZeroResultRecord[] {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, 'utf8');
      inMemoryZeroLogs = JSON.parse(raw);
    }
  } catch (e) {
    // fallback to memory
  }
  return inMemoryZeroLogs;
}

export function getZeroResultHotspots(): { location: string; query: string; count: number; lastSearched: string }[] {
  const logs = getZeroResultLogs();
  const map = new Map<string, { location: string; query: string; count: number; lastSearched: string }>();

  for (const log of logs) {
    const locParts = [log.city, log.state, log.country].filter(Boolean).join(', ') || 'Global';
    const key = `${locParts.toLowerCase()}__${log.query.toLowerCase()}`;

    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (new Date(log.timestamp) > new Date(existing.lastSearched)) {
        existing.lastSearched = log.timestamp;
      }
    } else {
      map.set(key, {
        location: locParts,
        query: log.query || 'Any Role',
        count: 1,
        lastSearched: log.timestamp,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
