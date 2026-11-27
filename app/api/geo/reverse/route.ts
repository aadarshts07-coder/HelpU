import { NextRequest, NextResponse } from 'next/server';
import { State, Country } from 'country-state-city';
import { calculateDistanceKm } from '@/lib/locations';

export interface ResolvedGeoLocation {
  country: string;
  countryCode: string; // lowercase, e.g. 'in', 'us'
  state: string;
  stateCode: string;   // lowercase, e.g. 'tn', 'ca'
  city: string;
  label: string;
  lat: number;
  lng: number;
  approximate?: boolean;
}

// In-memory 24-hour cache keyed by 2-decimal rounded coordinates
interface CacheEntry {
  data: ResolvedGeoLocation;
  cachedAt: number;
}

const geoCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Local curated tech hubs for zero-latency, reliable reverse matching
const LOCAL_HUBS = [
  { city: 'Coimbatore', state: 'Tamil Nadu', stateCode: 'tn', country: 'India', countryCode: 'in', lat: 11.0168, lng: 76.9558 },
  { city: 'Madurai', state: 'Tamil Nadu', stateCode: 'tn', country: 'India', countryCode: 'in', lat: 9.9252, lng: 78.1198 },
  { city: 'Chennai', state: 'Tamil Nadu', stateCode: 'tn', country: 'India', countryCode: 'in', lat: 13.0827, lng: 80.2707 },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu', stateCode: 'tn', country: 'India', countryCode: 'in', lat: 10.7905, lng: 78.7047 },
  { city: 'Salem', state: 'Tamil Nadu', stateCode: 'tn', country: 'India', countryCode: 'in', lat: 11.6643, lng: 78.1460 },
  { city: 'Bengaluru', state: 'Karnataka', stateCode: 'ka', country: 'India', countryCode: 'in', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', state: 'Telangana', stateCode: 'tg', country: 'India', countryCode: 'in', lat: 17.3850, lng: 78.4867 },
  { city: 'Mumbai', state: 'Maharashtra', stateCode: 'mh', country: 'India', countryCode: 'in', lat: 19.0760, lng: 72.8777 },
  { city: 'Pune', state: 'Maharashtra', stateCode: 'mh', country: 'India', countryCode: 'in', lat: 18.5204, lng: 73.8567 },
  { city: 'Delhi', state: 'Delhi', stateCode: 'dl', country: 'India', countryCode: 'in', lat: 28.7041, lng: 77.1025 },
  { city: 'San Francisco', state: 'California', stateCode: 'ca', country: 'United States', countryCode: 'us', lat: 37.7749, lng: -122.4194 },
  { city: 'San Jose', state: 'California', stateCode: 'ca', country: 'United States', countryCode: 'us', lat: 37.3382, lng: -121.8863 },
  { city: 'Seattle', state: 'Washington', stateCode: 'wa', country: 'United States', countryCode: 'us', lat: 47.6062, lng: -122.3321 },
  { city: 'New York', state: 'New York', stateCode: 'ny', country: 'United States', countryCode: 'us', lat: 40.7128, lng: -74.0060 },
  { city: 'London', state: 'England', stateCode: 'eng', country: 'United Kingdom', countryCode: 'gb', lat: 51.5074, lng: -0.1278 },
  { city: 'Toronto', state: 'Ontario', stateCode: 'on', country: 'Canada', countryCode: 'ca', lat: 43.6532, lng: -79.3832 },
  { city: 'Berlin', state: 'Berlin', stateCode: 'be', country: 'Germany', countryCode: 'de', lat: 52.5200, lng: 13.4050 },
  { city: 'Sydney', state: 'New South Wales', stateCode: 'nsw', country: 'Australia', countryCode: 'au', lat: -33.8688, lng: 151.2093 },
  { city: 'Singapore', state: 'Central', stateCode: 'sg', country: 'Singapore', countryCode: 'sg', lat: 1.3521, lng: 103.8198 },
];

function resolveStateCode(stateName: string, countryCode: string): string {
  const normState = (stateName || '').trim().toLowerCase();
  const cUpper = (countryCode || '').toUpperCase();

  // Common India abbreviations
  if (cUpper === 'IN') {
    if (normState.includes('tamil nadu')) return 'tn';
    if (normState.includes('karnataka')) return 'ka';
    if (normState.includes('telangana')) return 'tg';
    if (normState.includes('maharashtra')) return 'mh';
    if (normState.includes('delhi')) return 'dl';
    if (normState.includes('kerala')) return 'kl';
    if (normState.includes('andhra')) return 'ap';
    if (normState.includes('uttar pradesh')) return 'up';
    if (normState.includes('haryana')) return 'hr';
  }

  // Lookup in country-state-city
  const states = State.getStatesOfCountry(cUpper);
  const found = states.find(
    (s) =>
      s.name.toLowerCase() === normState ||
      normState.includes(s.name.toLowerCase()) ||
      s.isoCode.toLowerCase() === normState
  );

  return found ? found.isoCode.toLowerCase() : '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { lat, lng, ipFallback } = body;

    // Check if IP fallback was requested without coordinates
    if ((lat === undefined || lng === undefined) && ipFallback) {
      const clientIp =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        '';

      console.log('[API /geo/reverse] Executing IP approximate fallback for client IP');

      // If client IP is local or not available, fallback to profile default
      if (!clientIp || clientIp.startsWith('127.') || clientIp === '::1' || clientIp.startsWith('192.168.')) {
        return NextResponse.json({
          success: true,
          location: {
            country: 'India',
            countryCode: 'in',
            state: 'Tamil Nadu',
            stateCode: 'tn',
            city: 'Coimbatore',
            label: 'Coimbatore, Tamil Nadu, India (approximate)',
            lat: 11.02,
            lng: 76.96,
            approximate: true,
          },
        });
      }

      // External IP query
      try {
        const ipRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          signal: AbortSignal.timeout(3000),
        });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.city) {
            const cCode = (ipData.country_code || 'in').toLowerCase();
            const sCode = resolveStateCode(ipData.region || '', cCode);
            return NextResponse.json({
              success: true,
              location: {
                country: ipData.country_name || 'India',
                countryCode: cCode,
                state: ipData.region || '',
                stateCode: sCode,
                city: ipData.city || '',
                label: `${ipData.city}, ${ipData.region ? ipData.region + ', ' : ''}${ipData.country_name || ''} (approximate)`,
                lat: Number(Number(ipData.latitude || 0).toFixed(2)),
                lng: Number(Number(ipData.longitude || 0).toFixed(2)),
                approximate: true,
              },
            });
          }
        }
      } catch {
        // Fallback gracefully
      }

      return NextResponse.json({
        success: true,
        location: {
          country: 'India',
          countryCode: 'in',
          state: 'Tamil Nadu',
          stateCode: 'tn',
          city: 'Coimbatore',
          label: 'Coimbatore, Tamil Nadu, India (approximate)',
          lat: 11.02,
          lng: 76.96,
          approximate: true,
        },
      });
    }

    const nLat = Number(lat);
    const nLng = Number(lng);

    if (isNaN(nLat) || isNaN(nLng) || nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) {
      return NextResponse.json(
        { error: 'Valid numerical latitude and longitude are required' },
        { status: 400 }
      );
    }

    // PRIVACY: Round coordinates to 2 decimal places (~1.1 km accuracy)
    const roundedLat = Number(nLat.toFixed(2));
    const roundedLng = Number(nLng.toFixed(2));
    const cacheKey = `${roundedLat},${roundedLng}`;

    // 1. Check in-memory 24h cache
    const cached = geoCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        fromCache: true,
        location: cached.data,
      });
    }

    // 2. High-speed local tech hub match (within 25km radius)
    for (const hub of LOCAL_HUBS) {
      const dist = calculateDistanceKm(roundedLat, roundedLng, hub.lat, hub.lng);
      if (dist <= 25) {
        const locationResult: ResolvedGeoLocation = {
          country: hub.country,
          countryCode: hub.countryCode,
          state: hub.state,
          stateCode: hub.stateCode,
          city: hub.city,
          label: `${hub.city}, ${hub.state}, ${hub.country}`,
          lat: roundedLat,
          lng: roundedLng,
        };

        geoCache.set(cacheKey, { data: locationResult, cachedAt: Date.now() });

        console.log(`[API /geo/reverse] Local hub matched: ${locationResult.label} for ~(${roundedLat}, ${roundedLng})`);
        return NextResponse.json({
          success: true,
          location: locationResult,
        });
      }
    }

    // 3. OpenStreetMap Nominatim reverse geocoding
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&zoom=14&addressdetails=1`;
      const nomRes = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'HELP-U-JobPlatform/1.0 (contact: support@helpu.app)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        const address = nomData.address || {};

        const city =
          address.city ||
          address.town ||
          address.village ||
          address.suburb ||
          address.municipality ||
          address.county ||
          '';

        const state = address.state || address.region || address.province || '';
        const country = address.country || '';
        const countryCode = (address.country_code || '').toLowerCase();
        const stateCode = resolveStateCode(state, countryCode);

        const parts = [city, state, country].filter(Boolean);
        const label = parts.length > 0 ? parts.join(', ') : `Near (${roundedLat}, ${roundedLng})`;

        const locationResult: ResolvedGeoLocation = {
          country,
          countryCode,
          state,
          stateCode,
          city,
          label,
          lat: roundedLat,
          lng: roundedLng,
        };

        geoCache.set(cacheKey, { data: locationResult, cachedAt: Date.now() });

        console.log(`[API /geo/reverse] Nominatim resolved: ${label} for ~(${roundedLat}, ${roundedLng})`);
        return NextResponse.json({
          success: true,
          location: locationResult,
        });
      }
    } catch (err) {
      console.warn('[API /geo/reverse] Nominatim lookup timed out or failed:', err);
    }

    // 4. Fallback if reverse geocoding provider fails: return coordinates with friendly label
    const fallbackLocation: ResolvedGeoLocation = {
      country: '',
      countryCode: '',
      state: '',
      stateCode: '',
      city: '',
      label: `Near your location (${roundedLat}, ${roundedLng})`,
      lat: roundedLat,
      lng: roundedLng,
    };

    return NextResponse.json({
      success: true,
      fallback: true,
      location: fallbackLocation,
    });
  } catch (err) {
    console.error('[API /geo/reverse] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error while resolving coordinates' },
      { status: 500 }
    );
  }
}
