import { Country, State, City } from 'country-state-city';
import type { ICountry, IState, ICity } from 'country-state-city';

export interface StructuredLocation {
  raw: string;
  countryCode?: string; // 2-letter uppercase ISO (e.g. 'US', 'IN', 'GB') or 'REMOTE'
  countryName?: string;
  stateCode?: string;   // ISO or abbreviation ('CA', 'TN', 'KA', 'ENG', etc.)
  stateName?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isRemote?: boolean;
}

export interface LocationOption {
  code: string;
  name: string;
  count?: number;
  countryCode?: string;
  stateCode?: string;
  latitude?: number;
  longitude?: number;
  isRemote?: boolean;
}

// Popular Countries highlighted at top
export const POPULAR_COUNTRY_CODES = ['US', 'IN', 'GB', 'CA', 'DE', 'AU', 'SG', 'AE', 'NL'];

// Localized nomenclature for Level 2 administrative divisions
export function getStateTermForCountry(countryCode: string = ''): string {
  const code = countryCode.toUpperCase().trim();
  if (code === 'CA') return 'Provinces';
  if (code === 'GB') return 'Regions / Countries';
  if (code === 'IE') return 'Counties';
  if (['FR', 'IT', 'ES', 'NZ', 'CL', 'PH'].includes(code)) return 'Regions';
  if (code === 'AU') return 'States & Territories';
  return 'States / Regions';
}

// Common aliases dictionary
const CITY_ALIASES: Record<string, string> = {
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  madras: 'Chennai',
  gurgaon: 'Gurugram',
  nyc: 'New York',
  'new york city': 'New York',
  sf: 'San Francisco',
  'sf bay area': 'San Francisco',
  'bay area': 'San Francisco',
  la: 'Los Angeles',
  dc: 'Washington',
  'washington dc': 'Washington',
};

export const STATE_ALIASES: Record<string, { code: string; name: string; country: string }> = {
  // US
  ca: { code: 'CA', name: 'California', country: 'US' },
  california: { code: 'CA', name: 'California', country: 'US' },
  ny: { code: 'NY', name: 'New York', country: 'US' },
  'new york': { code: 'NY', name: 'New York', country: 'US' },
  tx: { code: 'TX', name: 'Texas', country: 'US' },
  texas: { code: 'TX', name: 'Texas', country: 'US' },
  wa: { code: 'WA', name: 'Washington', country: 'US' },
  washington: { code: 'WA', name: 'Washington', country: 'US' },
  md: { code: 'MD', name: 'Maryland', country: 'US' },
  maryland: { code: 'MD', name: 'Maryland', country: 'US' },
  ma: { code: 'MA', name: 'Massachusetts', country: 'US' },
  massachusetts: { code: 'MA', name: 'Massachusetts', country: 'US' },
  il: { code: 'IL', name: 'Illinois', country: 'US' },
  illinois: { code: 'IL', name: 'Illinois', country: 'US' },
  va: { code: 'VA', name: 'Virginia', country: 'US' },
  virginia: { code: 'VA', name: 'Virginia', country: 'US' },
  nc: { code: 'NC', name: 'North Carolina', country: 'US' },
  'north carolina': { code: 'NC', name: 'North Carolina', country: 'US' },
  ga: { code: 'GA', name: 'Georgia', country: 'US' },
  georgia: { code: 'GA', name: 'Georgia', country: 'US' },
  co: { code: 'CO', name: 'Colorado', country: 'US' },
  colorado: { code: 'CO', name: 'Colorado', country: 'US' },
  // India
  tn: { code: 'TN', name: 'Tamil Nadu', country: 'IN' },
  'tamil nadu': { code: 'TN', name: 'Tamil Nadu', country: 'IN' },
  tamilnadu: { code: 'TN', name: 'Tamil Nadu', country: 'IN' },
  ka: { code: 'KA', name: 'Karnataka', country: 'IN' },
  karnataka: { code: 'KA', name: 'Karnataka', country: 'IN' },
  mh: { code: 'MH', name: 'Maharashtra', country: 'IN' },
  maharashtra: { code: 'MH', name: 'Maharashtra', country: 'IN' },
  dl: { code: 'DL', name: 'Delhi', country: 'IN' },
  delhi: { code: 'DL', name: 'Delhi', country: 'IN' },
  ts: { code: 'TG', name: 'Telangana', country: 'IN' },
  telangana: { code: 'TG', name: 'Telangana', country: 'IN' },
  hyderabad: { code: 'TG', name: 'Telangana', country: 'IN' },
  up: { code: 'UP', name: 'Uttar Pradesh', country: 'IN' },
  'uttar pradesh': { code: 'UP', name: 'Uttar Pradesh', country: 'IN' },
  hr: { code: 'HR', name: 'Haryana', country: 'IN' },
  haryana: { code: 'HR', name: 'Haryana', country: 'IN' },
  kl: { code: 'KL', name: 'Kerala', country: 'IN' },
  kerala: { code: 'KL', name: 'Kerala', country: 'IN' },
  // UK
  england: { code: 'ENG', name: 'England', country: 'GB' },
  scotland: { code: 'SCT', name: 'Scotland', country: 'GB' },
  wales: { code: 'WLS', name: 'Wales', country: 'GB' },
};

/**
 * Returns the human-readable full state name (e.g. "Tamil Nadu" for "TN" or "California" for "CA").
 */
export function getStateName(stateCode: string = '', countryCode?: string): string {
  const code = (stateCode || '').trim();
  if (!code) return '';
  const lower = code.toLowerCase();
  if (STATE_ALIASES[lower]?.name) {
    return STATE_ALIASES[lower].name;
  }
  if (countryCode) {
    const s = State.getStateByCodeAndCountry(code.toUpperCase(), countryCode.toUpperCase());
    if (s?.name) return s.name;
  }
  for (const c of ['IN', 'US', 'GB', 'CA', 'DE', 'AU']) {
    const s = State.getStateByCodeAndCountry(code.toUpperCase(), c);
    if (s?.name) return s.name;
  }
  return code.toUpperCase();
}

const COUNTRY_ALIASES: Record<string, { code: string; name: string }> = {
  us: { code: 'US', name: 'United States' },
  usa: { code: 'US', name: 'United States' },
  'united states': { code: 'US', name: 'United States' },
  america: { code: 'US', name: 'United States' },
  in: { code: 'IN', name: 'India' },
  india: { code: 'IN', name: 'India' },
  uk: { code: 'GB', name: 'United Kingdom' },
  gb: { code: 'GB', name: 'United Kingdom' },
  'united kingdom': { code: 'GB', name: 'United Kingdom' },
  'great britain': { code: 'GB', name: 'United Kingdom' },
  ca: { code: 'CA', name: 'Canada' },
  canada: { code: 'CA', name: 'Canada' },
  de: { code: 'DE', name: 'Germany' },
  germany: { code: 'DE', name: 'Germany' },
  deutschland: { code: 'DE', name: 'Germany' },
  au: { code: 'AU', name: 'Australia' },
  australia: { code: 'AU', name: 'Australia' },
  sg: { code: 'SG', name: 'Singapore' },
  singapore: { code: 'SG', name: 'Singapore' },
  ae: { code: 'AE', name: 'United Arab Emirates' },
  uae: { code: 'AE', name: 'United Arab Emirates' },
  'united arab emirates': { code: 'AE', name: 'United Arab Emirates' },
  nl: { code: 'NL', name: 'Netherlands' },
  netherlands: { code: 'NL', name: 'Netherlands' },
  holland: { code: 'NL', name: 'Netherlands' },
};

// Great-circle Haversine formula
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normalizes free-form raw location string into structured fields:
 * countryCode, stateCode, city, latitude, longitude, isRemote.
 */
export function normalizeLocation(rawLoc: string = ''): StructuredLocation {
  const raw = String(rawLoc || '').trim();
  const lower = raw.toLowerCase();

  const isRemote =
    lower.includes('remote') ||
    lower.includes('worldwide') ||
    lower.includes('anywhere') ||
    lower.includes('work from home') ||
    lower.includes('wfh');

  const result: StructuredLocation = {
    raw,
    isRemote,
  };

  if (!raw || raw === 'Remote' || raw === 'Worldwide') {
    if (isRemote) {
      result.countryCode = 'REMOTE';
      result.countryName = 'Remote – Worldwide';
    }
    return result;
  }

  // Tokenize by commas, slashes, hyphens, and parenthesis
  const cleaned = raw.replace(/[()]/g, ' ').replace(/\s+/g, ' ');
  const tokens = cleaned
    .split(/[,/|•·-]/)
    .map((t) => t.trim())
    .filter(Boolean);

  // 1. Detect Country
  for (const token of tokens) {
    const tLower = token.toLowerCase();
    if (COUNTRY_ALIASES[tLower]) {
      result.countryCode = COUNTRY_ALIASES[tLower].code;
      result.countryName = COUNTRY_ALIASES[tLower].name;
      break;
    }
    const directCountry = Country.getCountryByCode(token.toUpperCase());
    if (directCountry) {
      result.countryCode = directCountry.isoCode;
      result.countryName = directCountry.name;
      break;
    }
  }

  // Fallback country detection from raw text
  if (!result.countryCode) {
    for (const [alias, info] of Object.entries(COUNTRY_ALIASES)) {
      if (lower.includes(alias)) {
        result.countryCode = info.code;
        result.countryName = info.name;
        break;
      }
    }
  }

  // 2. Detect State / Region
  for (const token of tokens) {
    const tLower = token.toLowerCase();
    if (STATE_ALIASES[tLower]) {
      const s = STATE_ALIASES[tLower];
      result.stateCode = s.code;
      result.stateName = s.name;
      if (!result.countryCode) {
        result.countryCode = s.country;
        result.countryName = COUNTRY_ALIASES[s.country.toLowerCase()]?.name;
      }
      break;
    }

    if (result.countryCode && result.countryCode !== 'REMOTE') {
      const states = State.getStatesOfCountry(result.countryCode);
      const match = states.find(
        (st) => st.name.toLowerCase() === tLower || st.isoCode.toLowerCase() === tLower
      );
      if (match) {
        result.stateCode = match.isoCode;
        result.stateName = match.name;
        break;
      }
    }
  }

  // 3. Detect City
  const candidateCity = tokens[0]?.replace(/\b(remote|hybrid|onsite|summer \d+)\b/gi, '').trim();
  if (candidateCity) {
    const resolvedCity = CITY_ALIASES[candidateCity.toLowerCase()] || candidateCity;
    result.city = resolvedCity;
  }

  // 4. Resolve Coordinates if available in dataset
  if (result.countryCode && result.countryCode !== 'REMOTE') {
    if (result.city) {
      let cities: ICity[] = [];
      if (result.stateCode) {
        cities = City.getCitiesOfState(result.countryCode, result.stateCode);
      }
      if (cities.length === 0) {
        cities = City.getCitiesOfCountry(result.countryCode) || [];
      }

      const matchCity = cities.find(
        (c) => c.name.toLowerCase() === result.city?.toLowerCase()
      );

      if (matchCity && matchCity.latitude && matchCity.longitude) {
        result.latitude = parseFloat(matchCity.latitude);
        result.longitude = parseFloat(matchCity.longitude);
      }
    }

    // Fallback to Country or State lat/long if city coordinate not found
    if (!result.latitude && result.stateCode) {
      const stateObj = State.getStateByCodeAndCountry(result.stateCode, result.countryCode);
      if (stateObj?.latitude && stateObj?.longitude) {
        result.latitude = parseFloat(stateObj.latitude);
        result.longitude = parseFloat(stateObj.longitude);
      }
    }

    if (!result.latitude && result.countryCode) {
      const countryObj = Country.getCountryByCode(result.countryCode);
      if (countryObj?.latitude && countryObj?.longitude) {
        result.latitude = parseFloat(countryObj.latitude);
        result.longitude = parseFloat(countryObj.longitude);
      }
    }
  }

  return result;
}

/**
 * Returns available countries with popular ones sorted first
 */
export function getCountriesDataset(): { popular: LocationOption[]; all: LocationOption[] } {
  const allRaw = Country.getAllCountries();
  const all: LocationOption[] = allRaw.map((c) => ({
    code: c.isoCode.toLowerCase(),
    name: c.name,
    latitude: c.latitude ? parseFloat(c.latitude) : undefined,
    longitude: c.longitude ? parseFloat(c.longitude) : undefined,
  }));

  const popularMap = new Set(POPULAR_COUNTRY_CODES.map((c) => c.toLowerCase()));
  const popular: LocationOption[] = all.filter((c) => popularMap.has(c.code));

  // Add Remote Worldwide as a special primary option
  popular.push({
    code: 'remote',
    name: 'Remote – Worldwide',
    isRemote: true,
  });

  return { popular, all };
}

/**
 * Returns states for given country code (e.g. 'US', 'IN')
 */
export function getStatesDataset(countryCode: string): LocationOption[] {
  if (!countryCode || countryCode === 'remote') return [];
  const states = State.getStatesOfCountry(countryCode.toUpperCase());
  return states.map((s) => ({
    code: s.isoCode.toLowerCase(),
    name: s.name,
    countryCode: countryCode.toLowerCase(),
    latitude: s.latitude ? parseFloat(s.latitude) : undefined,
    longitude: s.longitude ? parseFloat(s.longitude) : undefined,
  }));
}

/**
 * Returns cities for given country and state
 */
export function getCitiesDataset(countryCode: string, stateCode?: string): LocationOption[] {
  if (!countryCode || countryCode === 'remote') return [];
  let cities: ICity[] = [];
  if (stateCode) {
    cities = City.getCitiesOfState(countryCode.toUpperCase(), stateCode.toUpperCase());
  } else {
    cities = City.getCitiesOfCountry(countryCode.toUpperCase()) || [];
  }

  // Deduplicate cities by name
  const seen = new Set<string>();
  const uniqueCities: LocationOption[] = [];

  for (const c of cities) {
    const key = c.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCities.push({
        code: c.name.toLowerCase().replace(/\s+/g, '-'),
        name: c.name,
        countryCode: countryCode.toLowerCase(),
        stateCode: stateCode?.toLowerCase(),
        latitude: c.latitude ? parseFloat(c.latitude) : undefined,
        longitude: c.longitude ? parseFloat(c.longitude) : undefined,
      });
    }
  }

  return uniqueCities;
}
