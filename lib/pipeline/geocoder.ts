import { Country, State, City } from 'country-state-city';
import type { ICountry, IState, ICity } from 'country-state-city';

export interface CanonicalLocation {
  raw: string;
  countryCode: string;       // lowercase ISO alpha-2 e.g. "in", "us" or "remote"
  countryName: string;       // e.g. "India", "United States"
  stateCode?: string;         // lowercase code e.g. "tn", "ca"
  stateName?: string;         // e.g. "Tamil Nadu", "California"
  city?: string;              // Normalized capitalized name e.g. "Madurai"
  canonicalId: string;        // e.g. "in-tn-madurai", "in-tn-coimbatore", "remote"
  latitude?: number;
  longitude?: number;
  isRemote: boolean;
  isUnresolved: boolean;
}

// Comprehensive aliases table for cities, states, and countries
const CITY_ALIASES: Record<string, { city: string; stateCode: string; countryCode: string; lat: number; lng: number }> = {
  // India - Tamil Nadu
  madurai: { city: 'Madurai', stateCode: 'tn', countryCode: 'in', lat: 9.9252, lng: 78.1198 },
  madura: { city: 'Madurai', stateCode: 'tn', countryCode: 'in', lat: 9.9252, lng: 78.1198 },
  'madurai district': { city: 'Madurai', stateCode: 'tn', countryCode: 'in', lat: 9.9252, lng: 78.1198 },
  'elcot madurai': { city: 'Madurai', stateCode: 'tn', countryCode: 'in', lat: 9.9252, lng: 78.1198 },
  coimbatore: { city: 'Coimbatore', stateCode: 'tn', countryCode: 'in', lat: 11.0168, lng: 76.9558 },
  kovai: { city: 'Coimbatore', stateCode: 'tn', countryCode: 'in', lat: 11.0168, lng: 76.9558 },
  cbe: { city: 'Coimbatore', stateCode: 'tn', countryCode: 'in', lat: 11.0168, lng: 76.9558 },
  chennai: { city: 'Chennai', stateCode: 'tn', countryCode: 'in', lat: 13.0827, lng: 80.2707 },
  madras: { city: 'Chennai', stateCode: 'tn', countryCode: 'in', lat: 13.0827, lng: 80.2707 },
  trichy: { city: 'Tiruchirappalli', stateCode: 'tn', countryCode: 'in', lat: 10.7905, lng: 78.7047 },
  tiruchirappalli: { city: 'Tiruchirappalli', stateCode: 'tn', countryCode: 'in', lat: 10.7905, lng: 78.7047 },
  salem: { city: 'Salem', stateCode: 'tn', countryCode: 'in', lat: 11.6643, lng: 78.1460 },
  tirunelveli: { city: 'Tirunelveli', stateCode: 'tn', countryCode: 'in', lat: 8.7139, lng: 77.7567 },
  
  // India - Other Major Tech Hubs
  bengaluru: { city: 'Bengaluru', stateCode: 'ka', countryCode: 'in', lat: 12.9716, lng: 77.5946 },
  bangalore: { city: 'Bengaluru', stateCode: 'ka', countryCode: 'in', lat: 12.9716, lng: 77.5946 },
  blr: { city: 'Bengaluru', stateCode: 'ka', countryCode: 'in', lat: 12.9716, lng: 77.5946 },
  mysuru: { city: 'Mysuru', stateCode: 'ka', countryCode: 'in', lat: 12.2958, lng: 76.6394 },
  mysore: { city: 'Mysuru', stateCode: 'ka', countryCode: 'in', lat: 12.2958, lng: 76.6394 },
  hyderabad: { city: 'Hyderabad', stateCode: 'tg', countryCode: 'in', lat: 17.3850, lng: 78.4867 },
  secunderabad: { city: 'Hyderabad', stateCode: 'tg', countryCode: 'in', lat: 17.4399, lng: 78.4983 },
  mumbai: { city: 'Mumbai', stateCode: 'mh', countryCode: 'in', lat: 19.0760, lng: 72.8777 },
  bombay: { city: 'Mumbai', stateCode: 'mh', countryCode: 'in', lat: 19.0760, lng: 72.8777 },
  pune: { city: 'Pune', stateCode: 'mh', countryCode: 'in', lat: 18.5204, lng: 73.8567 },
  delhi: { city: 'Delhi', stateCode: 'dl', countryCode: 'in', lat: 28.7041, lng: 77.1025 },
  'new delhi': { city: 'New Delhi', stateCode: 'dl', countryCode: 'in', lat: 28.6139, lng: 77.2090 },
  noida: { city: 'Noida', stateCode: 'up', countryCode: 'in', lat: 28.5355, lng: 77.3910 },
  gurgaon: { city: 'Gurugram', stateCode: 'hr', countryCode: 'in', lat: 28.4595, lng: 77.0266 },
  gurugram: { city: 'Gurugram', stateCode: 'hr', countryCode: 'in', lat: 28.4595, lng: 77.0266 },
  kochi: { city: 'Kochi', stateCode: 'kl', countryCode: 'in', lat: 9.9312, lng: 76.2673 },
  cochin: { city: 'Kochi', stateCode: 'kl', countryCode: 'in', lat: 9.9312, lng: 76.2673 },
  thiruvananthapuram: { city: 'Thiruvananthapuram', stateCode: 'kl', countryCode: 'in', lat: 8.5241, lng: 76.9366 },
  trivandrum: { city: 'Thiruvananthapuram', stateCode: 'kl', countryCode: 'in', lat: 8.5241, lng: 76.9366 },
  ahmedabad: { city: 'Ahmedabad', stateCode: 'gj', countryCode: 'in', lat: 23.0225, lng: 72.5714 },
  kolkata: { city: 'Kolkata', stateCode: 'wb', countryCode: 'in', lat: 22.5726, lng: 88.3639 },

  // United States
  sf: { city: 'San Francisco', stateCode: 'ca', countryCode: 'us', lat: 37.7749, lng: -122.4194 },
  'san francisco': { city: 'San Francisco', stateCode: 'ca', countryCode: 'us', lat: 37.7749, lng: -122.4194 },
  'san jose': { city: 'San Jose', stateCode: 'ca', countryCode: 'us', lat: 37.3382, lng: -121.8863 },
  'mountain view': { city: 'Mountain View', stateCode: 'ca', countryCode: 'us', lat: 37.3861, lng: -122.0839 },
  'los angeles': { city: 'Los Angeles', stateCode: 'ca', countryCode: 'us', lat: 34.0522, lng: -118.2437 },
  'san diego': { city: 'San Diego', stateCode: 'ca', countryCode: 'us', lat: 32.7157, lng: -117.1611 },
  seattle: { city: 'Seattle', stateCode: 'wa', countryCode: 'us', lat: 47.6062, lng: -122.3321 },
  bellevue: { city: 'Bellevue', stateCode: 'wa', countryCode: 'us', lat: 47.6101, lng: -122.2015 },
  nyc: { city: 'New York', stateCode: 'ny', countryCode: 'us', lat: 40.7128, lng: -74.0060 },
  'new york': { city: 'New York', stateCode: 'ny', countryCode: 'us', lat: 40.7128, lng: -74.0060 },
  austin: { city: 'Austin', stateCode: 'tx', countryCode: 'us', lat: 30.2672, lng: -97.7431 },
  dallas: { city: 'Dallas', stateCode: 'tx', countryCode: 'us', lat: 32.7767, lng: -96.7970 },
  houston: { city: 'Houston', stateCode: 'tx', countryCode: 'us', lat: 29.7604, lng: -95.3698 },
  boston: { city: 'Boston', stateCode: 'ma', countryCode: 'us', lat: 42.3601, lng: -71.0589 },
  cambridge: { city: 'Cambridge', stateCode: 'ma', countryCode: 'us', lat: 42.3736, lng: -71.1097 },
  chicago: { city: 'Chicago', stateCode: 'il', countryCode: 'us', lat: 41.8781, lng: -87.6298 },

  // United Kingdom
  london: { city: 'London', stateCode: 'eng', countryCode: 'gb', lat: 51.5074, lng: -0.1278 },
  manchester: { city: 'Manchester', stateCode: 'eng', countryCode: 'gb', lat: 53.4808, lng: -2.2426 },
  birmingham: { city: 'Birmingham', stateCode: 'eng', countryCode: 'gb', lat: 52.4862, lng: -1.8904 },
  edinburgh: { city: 'Edinburgh', stateCode: 'sct', countryCode: 'gb', lat: 55.9533, lng: -3.1883 },
  glasgow: { city: 'Glasgow', stateCode: 'sct', countryCode: 'gb', lat: 55.8642, lng: -4.2518 },

  // Canada
  toronto: { city: 'Toronto', stateCode: 'on', countryCode: 'ca', lat: 43.6532, lng: -79.3832 },
  ottawa: { city: 'Ottawa', stateCode: 'on', countryCode: 'ca', lat: 45.4215, lng: -75.6972 },
  waterloo: { city: 'Waterloo', stateCode: 'on', countryCode: 'ca', lat: 43.4643, lng: -80.5204 },
  vancouver: { city: 'Vancouver', stateCode: 'bc', countryCode: 'ca', lat: 49.2827, lng: -123.1207 },
  montreal: { city: 'Montreal', stateCode: 'qc', countryCode: 'ca', lat: 45.5017, lng: -73.5673 },

  // Germany
  munich: { city: 'Munich', stateCode: 'by', countryCode: 'de', lat: 48.1351, lng: 11.5820 },
  münchen: { city: 'Munich', stateCode: 'by', countryCode: 'de', lat: 48.1351, lng: 11.5820 },
  berlin: { city: 'Berlin', stateCode: 'be', countryCode: 'de', lat: 52.5200, lng: 13.4050 },
  frankfurt: { city: 'Frankfurt', stateCode: 'he', countryCode: 'de', lat: 50.1109, lng: 8.6821 },
  hamburg: { city: 'Hamburg', stateCode: 'hh', countryCode: 'de', lat: 53.5511, lng: 9.9937 },

  // Australia
  sydney: { city: 'Sydney', stateCode: 'nsw', countryCode: 'au', lat: -33.8688, lng: 151.2093 },
  melbourne: { city: 'Melbourne', stateCode: 'vic', countryCode: 'au', lat: -37.8136, lng: 144.9631 },
  brisbane: { city: 'Brisbane', stateCode: 'qld', countryCode: 'au', lat: -27.4698, lng: 153.0251 },

  // Singapore
  singapore: { city: 'Singapore', stateCode: '', countryCode: 'sg', lat: 1.3521, lng: 103.8198 },

  // Japan
  tokyo: { city: 'Tokyo', stateCode: '13', countryCode: 'jp', lat: 35.6762, lng: 139.6503 },
  osaka: { city: 'Osaka', stateCode: '27', countryCode: 'jp', lat: 34.6937, lng: 135.5023 },

  // UAE
  dubai: { city: 'Dubai', stateCode: 'du', countryCode: 'ae', lat: 25.2048, lng: 55.2708 },
  'abu dhabi': { city: 'Abu Dhabi', stateCode: 'az', countryCode: 'ae', lat: 24.4539, lng: 54.3773 },

  // France
  paris: { city: 'Paris', stateCode: 'idf', countryCode: 'fr', lat: 48.8566, lng: 2.3522 },

  // Netherlands
  amsterdam: { city: 'Amsterdam', stateCode: 'nh', countryCode: 'nl', lat: 52.3676, lng: 4.9041 },
};

const STATE_ALIASES: Record<string, { code: string; name: string; countryCode: string }> = {
  'tamil nadu': { code: 'tn', name: 'Tamil Nadu', countryCode: 'in' },
  tamilnadu: { code: 'tn', name: 'Tamil Nadu', countryCode: 'in' },
  tn: { code: 'tn', name: 'Tamil Nadu', countryCode: 'in' },
  karnataka: { code: 'ka', name: 'Karnataka', countryCode: 'in' },
  ka: { code: 'ka', name: 'Karnataka', countryCode: 'in' },
  telangana: { code: 'tg', name: 'Telangana', countryCode: 'in' },
  tg: { code: 'tg', name: 'Telangana', countryCode: 'in' },
  maharashtra: { code: 'mh', name: 'Maharashtra', countryCode: 'in' },
  mh: { code: 'mh', name: 'Maharashtra', countryCode: 'in' },
  delhi: { code: 'dl', name: 'Delhi', countryCode: 'in' },
  dl: { code: 'dl', name: 'Delhi', countryCode: 'in' },
  kerala: { code: 'kl', name: 'Kerala', countryCode: 'in' },
  kl: { code: 'kl', name: 'Kerala', countryCode: 'in' },
  gujarat: { code: 'gj', name: 'Gujarat', countryCode: 'in' },
  'west bengal': { code: 'wb', name: 'West Bengal', countryCode: 'in' },
  california: { code: 'ca', name: 'California', countryCode: 'us' },
  ca: { code: 'ca', name: 'California', countryCode: 'us' },
  texas: { code: 'tx', name: 'Texas', countryCode: 'us' },
  tx: { code: 'tx', name: 'Texas', countryCode: 'us' },
  washington: { code: 'wa', name: 'Washington', countryCode: 'us' },
  wa: { code: 'wa', name: 'Washington', countryCode: 'us' },
  'new york': { code: 'ny', name: 'New York', countryCode: 'us' },
  ny: { code: 'ny', name: 'New York', countryCode: 'us' },
  massachusetts: { code: 'ma', name: 'Massachusetts', countryCode: 'us' },
  illinois: { code: 'il', name: 'Illinois', countryCode: 'us' },
  ontario: { code: 'on', name: 'Ontario', countryCode: 'ca' },
  'british columbia': { code: 'bc', name: 'British Columbia', countryCode: 'ca' },
  bavaria: { code: 'by', name: 'Bavaria', countryCode: 'de' },
  bayern: { code: 'by', name: 'Bavaria', countryCode: 'de' },
  berlin: { code: 'be', name: 'Berlin', countryCode: 'de' },
  'new south wales': { code: 'nsw', name: 'New South Wales', countryCode: 'au' },
  victoria: { code: 'vic', name: 'Victoria', countryCode: 'au' },
  england: { code: 'eng', name: 'England', countryCode: 'gb' },
  scotland: { code: 'sct', name: 'Scotland', countryCode: 'gb' },
};

const COUNTRY_ALIASES: Record<string, { code: string; name: string }> = {
  india: { code: 'in', name: 'India' },
  in: { code: 'in', name: 'India' },
  'united states': { code: 'us', name: 'United States' },
  usa: { code: 'us', name: 'United States' },
  us: { code: 'us', name: 'United States' },
  'united kingdom': { code: 'gb', name: 'United Kingdom' },
  uk: { code: 'gb', name: 'United Kingdom' },
  gb: { code: 'gb', name: 'United Kingdom' },
  canada: { code: 'ca', name: 'Canada' },
  ca: { code: 'ca', name: 'Canada' },
  germany: { code: 'de', name: 'Germany' },
  de: { code: 'de', name: 'Germany' },
  australia: { code: 'au', name: 'Australia' },
  au: { code: 'au', name: 'Australia' },
  singapore: { code: 'sg', name: 'Singapore' },
  sg: { code: 'sg', name: 'Singapore' },
  'united arab emirates': { code: 'ae', name: 'United Arab Emirates' },
  uae: { code: 'ae', name: 'United Arab Emirates' },
  japan: { code: 'jp', name: 'Japan' },
  jp: { code: 'jp', name: 'Japan' },
  france: { code: 'fr', name: 'France' },
  fr: { code: 'fr', name: 'France' },
  netherlands: { code: 'nl', name: 'Netherlands' },
  nl: { code: 'nl', name: 'Netherlands' },
};

/**
 * Resolves any free-form location text into a CanonicalLocation object
 * with strict case-insensitivity, alias resolution, and geo coordinates.
 */
export function resolveCanonicalLocation(rawText: string = ''): CanonicalLocation {
  const raw = String(rawText || '').trim();
  const lower = raw.toLowerCase();

  const isRemote =
    lower.includes('remote') ||
    lower.includes('worldwide') ||
    lower.includes('work from home') ||
    lower.includes('wfh') ||
    lower.includes('anywhere');

  if (!raw || lower === 'remote' || lower === 'worldwide' || lower === 'anywhere') {
    return {
      raw,
      countryCode: 'remote',
      countryName: 'Remote – Worldwide',
      canonicalId: 'remote',
      isRemote: true,
      isUnresolved: false,
    };
  }

  // 1. Direct match in City Aliases table
  for (const [alias, data] of Object.entries(CITY_ALIASES)) {
    // Word boundary or token inclusion check
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(lower)) {
      const stateObj = State.getStateByCodeAndCountry(data.stateCode.toUpperCase(), data.countryCode.toUpperCase());
      const countryObj = Country.getCountryByCode(data.countryCode.toUpperCase());
      const canonicalId = data.stateCode
        ? `${data.countryCode}-${data.stateCode}-${data.city.toLowerCase().replace(/\s+/g, '-')}`
        : `${data.countryCode}-${data.city.toLowerCase().replace(/\s+/g, '-')}`;

      return {
        raw,
        countryCode: data.countryCode,
        countryName: countryObj?.name || 'India',
        stateCode: data.stateCode,
        stateName: stateObj?.name || data.stateCode.toUpperCase(),
        city: data.city,
        canonicalId,
        latitude: data.lat,
        longitude: data.lng,
        isRemote,
        isUnresolved: false,
      };
    }
  }

  // 2. Tokenized parsing (e.g. "Madurai, Tamil Nadu, India")
  const tokens = lower
    .replace(/[()]/g, ' ')
    .split(/[,/|•·-]/)
    .map((t) => t.trim())
    .filter(Boolean);

  let detectedCountryCode = '';
  let detectedCountryName = '';
  let detectedStateCode = '';
  let detectedStateName = '';
  let detectedCity = '';
  let lat: number | undefined;
  let lng: number | undefined;

  // A. Check tokens for country
  for (const token of tokens) {
    if (COUNTRY_ALIASES[token]) {
      detectedCountryCode = COUNTRY_ALIASES[token].code;
      detectedCountryName = COUNTRY_ALIASES[token].name;
      break;
    }
    const directC = Country.getCountryByCode(token.toUpperCase());
    if (directC) {
      detectedCountryCode = directC.isoCode.toLowerCase();
      detectedCountryName = directC.name;
      break;
    }
  }

  // B. Check tokens for state
  for (const token of tokens) {
    if (STATE_ALIASES[token]) {
      const st = STATE_ALIASES[token];
      detectedStateCode = st.code;
      detectedStateName = st.name;
      if (!detectedCountryCode) {
        detectedCountryCode = st.countryCode;
        detectedCountryName = COUNTRY_ALIASES[st.countryCode]?.name || '';
      }
      break;
    }
  }

  // C. Check dataset for city within resolved country/state
  if (tokens.length > 0) {
    const candidate = tokens[0].replace(/\b(remote|hybrid|onsite)\b/gi, '').trim();
    if (candidate) {
      if (CITY_ALIASES[candidate]) {
        const match = CITY_ALIASES[candidate];
        detectedCity = match.city;
        detectedStateCode = detectedStateCode || match.stateCode;
        detectedCountryCode = detectedCountryCode || match.countryCode;
        lat = match.lat;
        lng = match.lng;
      } else {
        detectedCity = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }
  }

  // Resolve missing country/state names
  if (detectedCountryCode && !detectedCountryName) {
    const cObj = Country.getCountryByCode(detectedCountryCode.toUpperCase());
    detectedCountryName = cObj?.name || detectedCountryCode.toUpperCase();
  }

  if (detectedCountryCode && detectedStateCode && !detectedStateName) {
    const sObj = State.getStateByCodeAndCountry(detectedStateCode.toUpperCase(), detectedCountryCode.toUpperCase());
    detectedStateName = sObj?.name || detectedStateCode.toUpperCase();
  }

  // Fallback to Country or State lat/long if not set
  if (lat === undefined && detectedCountryCode && detectedStateCode) {
    const sObj = State.getStateByCodeAndCountry(detectedStateCode.toUpperCase(), detectedCountryCode.toUpperCase());
    if (sObj?.latitude && sObj?.longitude) {
      lat = parseFloat(sObj.latitude);
      lng = parseFloat(sObj.longitude);
    }
  }

  const parts = [detectedCountryCode || 'unknown'];
  if (detectedStateCode) parts.push(detectedStateCode);
  if (detectedCity) parts.push(detectedCity.toLowerCase().replace(/\s+/g, '-'));
  const canonicalId = parts.join('-');

  return {
    raw,
    countryCode: detectedCountryCode || (isRemote ? 'remote' : 'unknown'),
    countryName: detectedCountryName || (isRemote ? 'Remote – Worldwide' : 'Global / Flexible'),
    stateCode: detectedStateCode || undefined,
    stateName: detectedStateName || undefined,
    city: detectedCity || undefined,
    canonicalId,
    latitude: lat,
    longitude: lng,
    isRemote,
    isUnresolved: !detectedCountryCode && !isRemote,
  };
}

/**
 * Normalizes a job search query string into canonical comparison tokens
 */
export function normalizeQueryTokens(q: string = ''): string[] {
  return q
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}
