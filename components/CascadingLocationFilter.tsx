'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Globe,
  Check,
  Compass,
  Sliders,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  Building,
  MapPinned
} from 'lucide-react';
import CountryFlag from './CountryFlag';
import { getCountryByCode, getCountryName } from '@/lib/countries';
import { POPULAR_COUNTRY_CODES, getStateTermForCountry, getStateName, LocationOption } from '@/lib/locations';
import { useGeolocation } from '@/hooks/useGeolocation';

export interface CascadingLocationFilterProps {
  selectedCountries: string[];
  selectedStates: string[];
  selectedCities: string[];
  userLat?: number | null;
  userLng?: number | null;
  radius?: number;
  includeRemote?: boolean;
  userLocationLabel?: string;
  facets?: {
    countries?: Record<string, number>;
    states?: Record<string, number>;
    cities?: Record<string, number>;
  };
  onFilterChange: (updates: {
    countries?: string[];
    states?: string[];
    cities?: string[];
    lat?: number | null;
    lng?: number | null;
    radius?: number;
    includeRemote?: boolean;
    locationLabel?: string;
  }) => void;
  onClearAll?: () => void;
}

export default function CascadingLocationFilter({
  selectedCountries = [],
  selectedStates = [],
  selectedCities = [],
  userLat = null,
  userLng = null,
  radius = 50,
  includeRemote = true,
  userLocationLabel = '',
  facets = {},
  onFilterChange,
  onClearAll,
}: CascadingLocationFilterProps) {
  // Accordion open/collapse states
  const [countriesOpen, setCountriesOpen] = useState(true);
  const [statesOpen, setStatesOpen] = useState(true);
  const [citiesOpen, setCitiesOpen] = useState(true);
  const [nearMeOpen, setNearMeOpen] = useState(true);
  const [allCountriesExpanded, setAllCountriesExpanded] = useState(false);

  // Search queries for each level
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Sort preferences per level: 'count' | 'alpha'
  const [countrySort, setCountrySort] = useState<'count' | 'alpha'>('count');
  const [stateSort, setStateSort] = useState<'count' | 'alpha'>('count');
  const [citySort, setCitySort] = useState<'count' | 'alpha'>('count');

  // Loaded datasets cache
  const [allCountriesList, setAllCountriesList] = useState<LocationOption[]>([]);
  const [popularCountriesList, setPopularCountriesList] = useState<LocationOption[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<Record<string, { states: LocationOption[]; term: string }>>({});
  const [citiesByState, setCitiesByState] = useState<Record<string, LocationOption[]>>({});
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Geolocation hook & reverse geocoding state
  const {
    status: geoStatus,
    coords: geoCoords,
    permissionState,
    error: geoErrorDetails,
    isLocating,
    requestLocation,
    reset: resetGeo,
  } = useGeolocation();
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [reverseGeoSuccessMsg, setReverseGeoSuccessMsg] = useState<string | null>(null);
  const [profileLocation, setProfileLocation] = useState<string | null>(null);

  // 1. Initial Load: Countries Dataset
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/api/locations/countries');
        if (res.ok) {
          const data = await res.json();
          setPopularCountriesList(data.popular || []);
          setAllCountriesList(data.all || []);
        }
      } catch (err) {
        console.error('Failed to load countries dataset', err);
      }
    }
    loadCountries();
  }, []);

  // 2. Fetch Profile Location from /api/profile
  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.location) {
            setProfileLocation(data.profile.location);
          }
        }
      } catch (e) {
        // silent fallback
      }
    }
    checkProfile();
  }, []);

  // 3. Lazy Load States for Selected Countries
  useEffect(() => {
    const countriesToFetch = selectedCountries.filter(
      (c) => c !== 'remote' && !statesByCountry[c]
    );

    if (countriesToFetch.length === 0) return;

    let mounted = true;
    async function fetchStates() {
      setLoadingStates(true);
      try {
        const newStates: Record<string, { states: LocationOption[]; term: string }> = {};
        for (const c of countriesToFetch) {
          const res = await fetch(`/api/locations/states?country=${encodeURIComponent(c)}`);
          if (res.ok) {
            const data = await res.json();
            newStates[c] = {
              states: data.states || [],
              term: data.term || getStateTermForCountry(c),
            };
          }
        }
        if (mounted) {
          setStatesByCountry((prev) => ({ ...prev, ...newStates }));
        }
      } catch (err) {
        console.error('Failed to fetch states', err);
      } finally {
        if (mounted) setLoadingStates(false);
      }
    }

    fetchStates();
    return () => {
      mounted = false;
    };
  }, [selectedCountries, statesByCountry]);

  // 4. Lazy Load Cities for Selected States
  useEffect(() => {
    // Pairs of country + state
    const pairsToFetch: { country: string; state: string }[] = [];
    selectedCountries.forEach((c) => {
      const countryStates = statesByCountry[c]?.states || [];
      countryStates.forEach((st) => {
        if (selectedStates.includes(st.code) && !citiesByState[`${c}:${st.code}`]) {
          pairsToFetch.push({ country: c, state: st.code });
        }
      });
    });

    // Also check single-level countries without states (e.g. Singapore)
    selectedCountries.forEach((c) => {
      if (c !== 'remote') {
        const hasStates = (statesByCountry[c]?.states || []).length > 0;
        if (!hasStates && statesByCountry[c] && !citiesByState[`${c}:all`]) {
          pairsToFetch.push({ country: c, state: '' });
        }
      }
    });

    if (pairsToFetch.length === 0) return;

    let mounted = true;
    async function fetchCities() {
      setLoadingCities(true);
      try {
        const newCities: Record<string, LocationOption[]> = {};
        for (const pair of pairsToFetch) {
          const url = pair.state
            ? `/api/locations/cities?country=${encodeURIComponent(pair.country)}&state=${encodeURIComponent(pair.state)}`
            : `/api/locations/cities?country=${encodeURIComponent(pair.country)}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const key = pair.state ? `${pair.country}:${pair.state}` : `${pair.country}:all`;
            newCities[key] = data.cities || [];
          }
        }
        if (mounted) {
          setCitiesByState((prev) => ({ ...prev, ...newCities }));
        }
      } catch (err) {
        console.error('Failed to fetch cities', err);
      } finally {
        if (mounted) setLoadingCities(false);
      }
    }

    fetchCities();
    return () => {
      mounted = false;
    };
  }, [selectedCountries, selectedStates, statesByCountry, citiesByState]);

  // ----------------------------------------------------------------
  // Handlers for Country Selection
  // ----------------------------------------------------------------
  const toggleCountry = (code: string) => {
    const norm = code.toLowerCase().trim();
    const isSelected = selectedCountries.includes(norm);
    let nextCountries: string[];

    if (isSelected) {
      nextCountries = selectedCountries.filter((c) => c !== norm);
      // Deselecting parent removes its selected children automatically
      const countryStateCodes = (statesByCountry[norm]?.states || []).map((s) => s.code);
      const nextStates = selectedStates.filter((s) => !countryStateCodes.includes(s));
      
      // Clean up cities corresponding to this country's states
      const cleanedCityKeys = Object.keys(citiesByState).filter((k) => k.startsWith(`${norm}:`));
      const cityCodesToRemove = new Set<string>();
      cleanedCityKeys.forEach((k) => {
        citiesByState[k]?.forEach((ct) => cityCodesToRemove.add(ct.code));
      });
      const nextCities = selectedCities.filter((c) => !cityCodesToRemove.has(c));

      onFilterChange({
        countries: nextCountries,
        states: nextStates,
        cities: nextCities,
      });
    } else {
      nextCountries = [...selectedCountries, norm];
      onFilterChange({
        countries: nextCountries,
      });
    }
  };

  // ----------------------------------------------------------------
  // Handlers for State Selection
  // ----------------------------------------------------------------
  const toggleState = (stateCode: string, countryCode: string) => {
    const norm = stateCode.toLowerCase().trim();
    const isSelected = selectedStates.includes(norm);
    let nextStates: string[];

    if (isSelected) {
      nextStates = selectedStates.filter((s) => s !== norm);
      // Clean up cities corresponding to this state
      const cityList = citiesByState[`${countryCode}:${norm}`] || [];
      const cityCodes = new Set(cityList.map((c) => c.code));
      const nextCities = selectedCities.filter((c) => !cityCodes.has(c));

      onFilterChange({
        states: nextStates,
        cities: nextCities,
      });
    } else {
      nextStates = [...selectedStates, norm];
      onFilterChange({
        states: nextStates,
      });
    }
  };

  // ----------------------------------------------------------------
  // Handlers for City Selection
  // ----------------------------------------------------------------
  const toggleCity = (cityCode: string) => {
    const norm = cityCode.toLowerCase().trim();
    const isSelected = selectedCities.includes(norm);
    const nextCities = isSelected
      ? selectedCities.filter((c) => c !== norm)
      : [...selectedCities, norm];

    onFilterChange({
      cities: nextCities,
    });
  };

  // ----------------------------------------------------------------
  // Browser Geolocation ("Use my precise location") & Reverse Geocode
  // ----------------------------------------------------------------
  const handleUseMyLocation = async () => {
    setReverseGeoSuccessMsg(null);
    const coords = await requestLocation();
    if (!coords) return;

    setIsReverseGeocoding(true);
    try {
      const res = await fetch('/api/geo/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coords.latitude,
          lng: coords.longitude,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.location) {
          const loc = data.location;
          const targetCountries = loc.countryCode ? [loc.countryCode.toLowerCase()] : selectedCountries;
          const targetStates = loc.stateCode ? [loc.stateCode.toLowerCase()] : selectedStates;
          const targetCities = loc.city ? [loc.city.toLowerCase().replace(/\s+/g, '-')] : selectedCities;

          onFilterChange({
            lat: loc.lat,
            lng: loc.lng,
            radius: radius || 50,
            locationLabel: loc.label || `Near (${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)})`,
            countries: targetCountries,
            states: targetStates,
            cities: targetCities,
          });

          setReverseGeoSuccessMsg(`Using your location: ${loc.label}`);
          return;
        }
      }
    } catch (err) {
      console.warn('[CascadingLocationFilter] Reverse geocoding failed:', err);
    } finally {
      setIsReverseGeocoding(false);
    }

    // Fallback: use rounded coordinates for radius search
    const roundedLat = Number(coords.latitude.toFixed(2));
    const roundedLng = Number(coords.longitude.toFixed(2));
    onFilterChange({
      lat: roundedLat,
      lng: roundedLng,
      radius: radius || 50,
      locationLabel: `Near your location (${roundedLat}, ${roundedLng})`,
    });
    setReverseGeoSuccessMsg(`Using your location: Near (${roundedLat}, ${roundedLng})`);
  };

  const handleUseIpLocation = async () => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch('/api/geo/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipFallback: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.location) {
          const loc = data.location;
          onFilterChange({
            lat: loc.lat,
            lng: loc.lng,
            radius: radius || 50,
            locationLabel: loc.label,
            countries: loc.countryCode ? [loc.countryCode.toLowerCase()] : selectedCountries,
            states: loc.stateCode ? [loc.stateCode.toLowerCase()] : selectedStates,
            cities: loc.city ? [loc.city.toLowerCase().replace(/\s+/g, '-')] : selectedCities,
          });
          setReverseGeoSuccessMsg(`Using approximate location: ${loc.label}`);
          resetGeo();
        }
      }
    } catch (err) {
      console.warn('[CascadingLocationFilter] IP fallback failed:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleClearMyLocation = () => {
    setReverseGeoSuccessMsg(null);
    resetGeo();
    onFilterChange({
      lat: null,
      lng: null,
      locationLabel: '',
    });
  };

  // ----------------------------------------------------------------
  // Profile Location Shortcut ("Apply Profile Location")
  // ----------------------------------------------------------------
  const handleApplyProfileLocation = () => {
    if (!profileLocation) return;
    const lower = profileLocation.toLowerCase();

    // Determine matching country
    let targetCountry = 'in'; // default for project context (e.g. Coimbatore, Tamil Nadu, India)
    if (lower.includes('united states') || lower.includes('ca') || lower.includes('usa')) {
      targetCountry = 'us';
    } else if (lower.includes('united kingdom') || lower.includes('uk') || lower.includes('london')) {
      targetCountry = 'gb';
    } else if (lower.includes('india')) {
      targetCountry = 'in';
    }

    // Determine state
    let targetState: string | undefined = undefined;
    if (lower.includes('tamil nadu') || lower.includes('coimbatore') || lower.includes('chennai')) {
      targetState = 'tn';
    } else if (lower.includes('karnataka') || lower.includes('bengaluru') || lower.includes('bangalore')) {
      targetState = 'ka';
    } else if (lower.includes('california')) {
      targetState = 'ca';
    }

    // Determine city
    let targetCity: string | undefined = undefined;
    if (lower.includes('coimbatore')) targetCity = 'coimbatore';
    else if (lower.includes('chennai')) targetCity = 'chennai';
    else if (lower.includes('bengaluru') || lower.includes('bangalore')) targetCity = 'bengaluru';
    else if (lower.includes('san francisco')) targetCity = 'san-francisco';

    onFilterChange({
      countries: [targetCountry],
      states: targetState ? [targetState] : [],
      cities: targetCity ? [targetCity] : [],
      locationLabel: profileLocation,
    });
  };

  // ----------------------------------------------------------------
  // Filtered & Sorted Datasets
  // ----------------------------------------------------------------
  // Country Lists
  const countryCounts = facets.countries || {};
  const stateCounts = facets.states || {};
  const cityCounts = facets.cities || {};

  const filteredPopularCountries = useMemo(() => {
    const q = countrySearch.toLowerCase().trim();
    let list = popularCountriesList.length > 0
      ? popularCountriesList
      : POPULAR_COUNTRY_CODES.map((code) => ({
          code: code.toLowerCase(),
          name: getCountryName(code),
        }));

    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (countrySort === 'count') {
        const cA = countryCounts[a.code] || 0;
        const cB = countryCounts[b.code] || 0;
        if (cB !== cA) return cB - cA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [countrySearch, countrySort, popularCountriesList, countryCounts]);

  const filteredAllCountries = useMemo(() => {
    const q = countrySearch.toLowerCase().trim();
    let list = allCountriesList;
    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (countrySort === 'count') {
        const cA = countryCounts[a.code] || 0;
        const cB = countryCounts[b.code] || 0;
        if (cB !== cA) return cB - cA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [countrySearch, countrySort, allCountriesList, countryCounts]);

  // Selected States list & available states
  const activeStatesByCountry = useMemo(() => {
    const q = stateSearch.toLowerCase().trim();
    const result: { countryCode: string; countryName: string; term: string; states: LocationOption[] }[] = [];

    for (const c of selectedCountries) {
      if (c === 'remote') continue;
      const data = statesByCountry[c];
      if (!data) continue;

      let list = data.states;
      if (q) {
        list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
      }

      const sorted = [...list].sort((a, b) => {
        if (stateSort === 'count') {
          const cA = stateCounts[a.code] || 0;
          const cB = stateCounts[b.code] || 0;
          if (cB !== cA) return cB - cA;
        }
        return a.name.localeCompare(b.name);
      });

      result.push({
        countryCode: c,
        countryName: getCountryName(c),
        term: data.term || 'States / Regions',
        states: sorted,
      });
    }

    return result;
  }, [selectedCountries, statesByCountry, stateSearch, stateSort, stateCounts]);

  // Selected Cities list & available cities
  const activeCitiesByGroup = useMemo(() => {
    const q = citySearch.toLowerCase().trim();
    const result: { groupLabel: string; cities: LocationOption[] }[] = [];

    // Group by Country:State
    Object.entries(citiesByState).forEach(([key, cities]) => {
      const [cCode, sCode] = key.split(':');
      if (!selectedCountries.includes(cCode)) return;

      // Only show if either no state division exists or this state is selected
      if (sCode !== 'all' && !selectedStates.includes(sCode)) return;

      const stateName = statesByCountry[cCode]?.states.find((s) => s.code === sCode)?.name || sCode.toUpperCase();
      const groupLabel = sCode === 'all'
        ? `Cities in ${getCountryName(cCode)}`
        : `${stateName} (${getCountryName(cCode)})`;

      let list = cities;
      if (q) {
        list = list.filter((ct) => ct.name.toLowerCase().includes(q));
      }

      const sorted = [...list].sort((a, b) => {
        if (citySort === 'count') {
          const cA = cityCounts[a.code] || 0;
          const cB = cityCounts[b.code] || 0;
          if (cB !== cA) return cB - cA;
        }
        return a.name.localeCompare(b.name);
      });

      if (sorted.length > 0) {
        result.push({ groupLabel, cities: sorted });
      }
    });

    return result;
  }, [citiesByState, selectedCountries, selectedStates, statesByCountry, citySearch, citySort, cityCounts]);

  const hasActiveLocationFilter =
    selectedCountries.length > 0 ||
    selectedStates.length > 0 ||
    selectedCities.length > 0 ||
    userLat !== null;

  return (
    <div className="space-y-4 pt-2">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO CARD: FIND JOBS NEAR ME (GEOLOCATION & RADIUS)        */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-3.5 shadow-xs transition-all hover:border-indigo-200">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Navigation className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Find Jobs Near Me</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                  GPS
                </span>
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNearMeOpen(!nearMeOpen)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Toggle Near Me Section"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${nearMeOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {nearMeOpen && (
          <div className="space-y-3 pt-1">
            {/* Active GPS Position or Geolocation Button */}
            {userLat !== null && userLng !== null ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-100/60 border border-indigo-200 text-xs">
                <div className="flex items-center gap-2 text-indigo-950 font-semibold truncate">
                  <MapPinned className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">
                    {userLocationLabel || `Near (${userLat.toFixed(2)}, ${userLng.toFixed(2)})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearMyLocation}
                  className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold shrink-0 ml-1.5 underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isLocating || isReverseGeocoding}
                  className="w-full py-2 px-3 bg-white hover:bg-indigo-50/70 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-60"
                >
                  {isLocating || isReverseGeocoding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Detecting your location…</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                      <span>Use My Precise Location</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  Used only to find nearby jobs. We don't store your exact position.
                </p>
              </div>
            )}

            {/* State-specific Geolocation Feedback */}
            {reverseGeoSuccessMsg && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[11px] truncate">{reverseGeoSuccessMsg}</span>
              </div>
            )}

            {geoStatus === 'denied' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px]">Location permission denied</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Click the 🔒 in the address bar → Site settings → Location → Allow, then press Try again.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-2xs transition-colors"
                  >
                    Try again
                  </button>
                  {profileLocation && (
                    <button
                      type="button"
                      onClick={handleApplyProfileLocation}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 font-semibold text-[10px] transition-colors"
                    >
                      Use my profile location
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCountriesOpen(true)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 font-semibold text-[10px] transition-colors"
                  >
                    Choose manually
                  </button>
                </div>
              </div>
            )}

            {geoStatus === 'unavailable' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px]">Position unavailable</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      We couldn't determine your position. Check that location services are on in your device settings.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-2xs transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={handleUseIpLocation}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 font-semibold text-[10px] transition-colors"
                  >
                    Use approximate location
                  </button>
                </div>
              </div>
            )}

            {geoStatus === 'timeout' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px]">Request timed out</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Took too long to find you.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-2xs transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={handleUseIpLocation}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 font-semibold text-[10px] transition-colors"
                  >
                    Use approximate location
                  </button>
                </div>
              </div>
            )}

            {(geoStatus === 'insecure' || geoStatus === 'unsupported') && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {geoStatus === 'insecure'
                      ? 'Geolocation requires a secure connection (HTTPS or localhost). Please select your country & city manually below.'
                      : 'Geolocation is not supported by your browser. Please select your country & city manually below.'}
                  </p>
                </div>
              </div>
            )}

            {/* Profile Saved Location One-Click Apply */}
            {profileLocation && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={handleApplyProfileLocation}
                  title={`Apply profile location: ${profileLocation}`}
                  className="w-full text-left p-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200 hover:border-indigo-300 transition-all text-xs flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[11px] text-slate-500 shrink-0">Profile location:</span>
                    <strong
                      className="text-slate-800 truncate text-[11px] font-semibold block"
                      title={profileLocation}
                    >
                      {profileLocation}
                    </strong>
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                    Apply
                  </span>
                </button>
              </div>
            )}

            {/* Radius Selector Pills */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold mb-1.5">
                <span>Distance Radius:</span>
                <span className="text-indigo-600 font-bold">{radius > 0 ? `${radius} km` : 'Any distance'}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-[11px] font-bold">
                {[10, 25, 50, 100, 0].map((r) => {
                  const isActive = (radius || 0) === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onFilterChange({ radius: r })}
                      className={`py-1 rounded-lg transition-all text-center border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {r === 0 ? 'Any' : `${r}k`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Include Remote Jobs Toggle */}
            <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer pt-1 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-600">Include Remote jobs</span>
              <input
                type="checkbox"
                checked={includeRemote}
                onChange={(e) => onFilterChange({ includeRemote: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CASCADING LEVEL 1: COUNTRIES                              */}
      {/* ------------------------------------------------------------- */}
      <div className="border-t border-slate-100 pt-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setCountriesOpen(!countriesOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-slate-900 transition-colors focus:outline-hidden"
          >
            <span>Countries</span>
            {selectedCountries.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {selectedCountries.length}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${countriesOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCountrySort((s) => (s === 'count' ? 'alpha' : 'count'))}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              title={`Sorting by ${countrySort === 'count' ? 'Job Count' : 'Alphabetical'}. Click to toggle.`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{countrySort === 'count' ? 'By Count' : 'A-Z'}</span>
            </button>
            {selectedCountries.length > 0 && (
              <button
                type="button"
                onClick={() => onFilterChange({ countries: [], states: [], cities: [] })}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {countriesOpen && (
          <div className="space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country or code…"
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
              />
              {countrySearch && (
                <button
                  type="button"
                  onClick={() => setCountrySearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Popular Countries Grid */}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
              {filteredPopularCountries.map((c) => {
                const isSelected = selectedCountries.includes(c.code);
                const count = countryCounts[c.code] ?? (c.code === 'remote' ? 4 : 0);
                const isZero = count === 0;

                return (
                  <label
                    key={c.code}
                    className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all border text-xs ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold'
                        : isZero
                        ? 'bg-transparent border-transparent opacity-50 hover:opacity-80 text-slate-500'
                        : 'bg-transparent border-transparent hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCountry(c.code)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <CountryFlag code={c.code} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full shrink-0 ml-1 ${
                        isSelected
                          ? 'bg-indigo-200/80 text-indigo-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* All Countries Expandable Dropdown */}
            {allCountriesList.length > 0 && !countrySearch && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setAllCountriesExpanded(!allCountriesExpanded)}
                  className="w-full py-1 text-center text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>{allCountriesExpanded ? 'Collapse All Countries' : `View All Countries (${allCountriesList.length})`}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${allCountriesExpanded ? 'rotate-180' : ''}`} />
                </button>

                {allCountriesExpanded && (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar mt-1.5 pt-1.5 border-t border-slate-100">
                    {filteredAllCountries.map((c) => {
                      const isSelected = selectedCountries.includes(c.code);
                      const count = countryCounts[c.code] ?? 0;
                      return (
                        <label
                          key={c.code}
                          className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all border text-xs ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold'
                              : 'bg-transparent border-transparent hover:bg-slate-100/70 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCountry(c.code)}
                              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <CountryFlag code={c.code} className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{c.name}</span>
                          </div>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 shrink-0 ml-1">
                            {count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CASCADING LEVEL 2: STATES / REGIONS (SMOOTH EXPAND)        */}
      {/* ------------------------------------------------------------- */}
      {selectedCountries.filter((c) => c !== 'remote').length > 0 && (
        <div className="border-t border-slate-100 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setStatesOpen(!statesOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-slate-900 transition-colors focus:outline-hidden"
            >
              <span>States / Regions</span>
              {selectedStates.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {selectedStates.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${statesOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStateSort((s) => (s === 'count' ? 'alpha' : 'count'))}
                className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                title={`Sorting by ${stateSort === 'count' ? 'Job Count' : 'Alphabetical'}`}
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{stateSort === 'count' ? 'By Count' : 'A-Z'}</span>
              </button>
              {selectedStates.length > 0 && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ states: [], cities: [] })}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {statesOpen && (
            <div className="space-y-2.5">
              {/* State Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  placeholder="Filter states/provinces…"
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
                />
                {stateSearch && (
                  <button
                    type="button"
                    onClick={() => setStateSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {loadingStates ? (
                <div className="flex items-center gap-2 py-3 text-xs text-slate-500 justify-center">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Loading regions…</span>
                </div>
              ) : activeStatesByCountry.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">
                  Selected countries do not require state-level divisions (e.g. Singapore). Proceed to cities below.
                </p>
              ) : (
                <div className="space-y-3 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
                  {activeStatesByCountry.map((group) => (
                    <div key={group.countryCode} className="space-y-1">
                      {/* Parent Country Header */}
                      <div className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <CountryFlag code={group.countryCode} className="w-3 h-3" />
                        <span>
                          {group.countryName} ({group.term})
                        </span>
                      </div>

                      {group.states.map((st) => {
                        const isSelected = selectedStates.includes(st.code);
                        const count = stateCounts[st.code] ?? 0;
                        const isZero = count === 0;

                        return (
                          <label
                            key={st.code}
                            className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all border text-xs ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold'
                                : isZero
                                ? 'bg-transparent border-transparent opacity-50 hover:opacity-80 text-slate-500'
                                : 'bg-transparent border-transparent hover:bg-slate-100/70 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleState(st.code, group.countryCode)}
                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span className="truncate">{st.name}</span>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full shrink-0 ml-1 ${
                                isSelected
                                  ? 'bg-indigo-200/80 text-indigo-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {count}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. CASCADING LEVEL 3: CITIES (SMOOTH EXPAND)                  */}
      {/* ------------------------------------------------------------- */}
      {(selectedStates.length > 0 ||
        selectedCountries.some((c) => c !== 'remote' && (statesByCountry[c]?.states || []).length === 0)) && (
        <div className="border-t border-slate-100 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setCitiesOpen(!citiesOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-slate-900 transition-colors focus:outline-hidden"
            >
              <span>Cities</span>
              {selectedCities.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {selectedCities.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${citiesOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCitySort((s) => (s === 'count' ? 'alpha' : 'count'))}
                className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                title={`Sorting by ${citySort === 'count' ? 'Job Count' : 'Alphabetical'}`}
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{citySort === 'count' ? 'By Count' : 'A-Z'}</span>
              </button>
              {selectedCities.length > 0 && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ cities: [] })}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {citiesOpen && (
            <div className="space-y-2.5">
              {/* City Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Filter cities…"
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
                />
                {citySearch && (
                  <button
                    type="button"
                    onClick={() => setCitySearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {loadingCities ? (
                <div className="flex items-center gap-2 py-3 text-xs text-slate-500 justify-center">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Loading cities…</span>
                </div>
              ) : activeCitiesByGroup.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">
                  No cities found for selected state filters.
                </p>
              ) : (
                <div className="space-y-3 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
                  {activeCitiesByGroup.map((group) => (
                    <div key={group.groupLabel} className="space-y-1">
                      <div className="px-1 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {group.groupLabel}
                      </div>
                      {group.cities.map((ct) => {
                        const isSelected = selectedCities.includes(ct.code);
                        const count = cityCounts[ct.code] ?? 0;
                        const isZero = count === 0;

                        return (
                          <label
                            key={ct.code}
                            className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all border text-xs ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold'
                                : isZero
                                ? 'bg-transparent border-transparent opacity-50 hover:opacity-80 text-slate-500'
                                : 'bg-transparent border-transparent hover:bg-slate-100/70 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCity(ct.code)}
                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span className="truncate">{ct.name}</span>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full shrink-0 ml-1 ${
                                isSelected
                                  ? 'bg-indigo-200/80 text-indigo-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {count}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. SUMMARY ACTION: RESET LOCATION FILTERS                     */}
      {/* ------------------------------------------------------------- */}
      {hasActiveLocationFilter && onClearAll && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onClearAll}
            className="w-full py-1.5 px-3 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/60 rounded-xl transition-all border border-indigo-100 flex items-center justify-center gap-1.5"
          >
            <span>Reset All Location Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
