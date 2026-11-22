'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  MapPin,
  Building2,
  DollarSign,
  ExternalLink,
  Bookmark,
  PlusCircle,
  Sparkles,
  RefreshCw,
  Clock,
  Briefcase,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  Globe
} from 'lucide-react';
import { NormalizedJob } from '../api/search/jobs/route';
import { BRAND, getPortalSourceLabel } from '@/lib/config/brand';
import CountryFlag from '@/components/CountryFlag';
import CountrySidebarFilter from '@/components/CountrySidebarFilter';
import { getCountryByCode, getCountryName, EU_COUNTRY_CODES, extractCountryCodeFromLocation } from '@/lib/countries';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialMode = searchParams.get('work_mode') || searchParams.get('mode') || 'all';
  const initialLevel = searchParams.get('seniority') || searchParams.get('level') || 'all';
  const initialPosted = searchParams.get('posted') || 'all';
  const initialSource = searchParams.get('source') || 'all';
  const initialLocation = searchParams.get('location') || '';
  const initialCountries = searchParams.get('countries') || '';

  // Search input state
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  // Filters state
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialCountries ? initialCountries.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean) : []
  );
  const [typeFilter, setTypeFilter] = useState<'all' | 'job' | 'internship'>(
    initialType === 'internship' || initialType === 'job' ? initialType : 'all'
  );
  const [workMode, setWorkMode] = useState<string>(initialMode);
  const [expLevel, setExpLevel] = useState<string>(initialLevel);
  const [datePosted, setDatePosted] = useState<string>(initialPosted);
  const [sourcePortal, setSourcePortal] = useState<string>(initialSource);
  const [internshipPaid, setInternshipPaid] = useState<string>('all');
  const [internshipDuration, setInternshipDuration] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>(initialLocation);
  const [sortBy, setSortBy] = useState<'relevant' | 'newest'>('relevant');
  const [page, setPage] = useState<number>(1);

  // Data state
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [portalWarnings, setPortalWarnings] = useState<Record<string, string>>({});

  // Interaction state
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [trackedJobIds, setTrackedJobIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [confirmModalJob, setConfirmModalJob] = useState<NormalizedJob | null>(null);
  const [isApplyingWithProfile, setIsApplyingWithProfile] = useState<boolean>(false);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Load saved bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('helpu_saved_job_ids');
      if (stored) {
        setSavedJobIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Update all state when URL searchParams change (supports shareable links & browser back/forward)
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    const urlType = searchParams.get('type') || 'all';
    const urlMode = searchParams.get('work_mode') || searchParams.get('mode') || 'all';
    const urlLevel = searchParams.get('seniority') || searchParams.get('level') || 'all';
    const urlLoc = searchParams.get('location') || '';
    const urlSource = searchParams.get('source') || 'all';
    const urlPosted = searchParams.get('posted') || 'all';
    const urlCountries = searchParams.get('countries');

    setQuery(urlQ);
    setSearchInput(urlQ);
    if (urlType === 'internship' || urlType === 'job' || urlType === 'all') {
      setTypeFilter(urlType as any);
    }
    setWorkMode(urlMode);
    setExpLevel(urlLevel);
    setLocationInput(urlLoc);
    setSourcePortal(urlSource);
    setDatePosted(urlPosted);
    if (urlCountries !== null) {
      setSelectedCountries(urlCountries.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean));
    } else {
      setSelectedCountries([]);
    }
  }, [searchParams]);

  // Sync helper that updates URL query parameters so searches are always shareable
  const syncFilterToUrl = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'all') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    next.delete('page');
    router.push(`/search?${next.toString()}`);
  };

  // Fetch jobs
  const fetchSearchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (workMode !== 'all') params.set('mode', workMode);
      if (expLevel !== 'all') params.set('level', expLevel);
      if (datePosted !== 'all') params.set('posted', datePosted);
      if (sourcePortal !== 'all') params.set('source', sourcePortal);
      if (internshipPaid !== 'all') params.set('paid', internshipPaid);
      if (internshipDuration) params.set('duration', internshipDuration);
      if (locationInput) params.set('location', locationInput);
      if (selectedCountries.length > 0) params.set('countries', selectedCountries.join(','));
      params.set('sort', sortBy);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/search/jobs?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Search request failed with status ${res.status}`);
      }
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.portalWarnings) {
        setPortalWarnings(data.portalWarnings);
      } else {
        setPortalWarnings({});
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load search results.');
    } finally {
      setLoading(false);
    }
  }, [
    query,
    typeFilter,
    workMode,
    expLevel,
    datePosted,
    sourcePortal,
    internshipPaid,
    internshipDuration,
    locationInput,
    selectedCountries,
    sortBy,
    page,
  ]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setPage(1);
    const newParams = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      newParams.set('q', searchInput.trim());
    } else {
      newParams.delete('q');
    }
    router.push(`/search?${newParams.toString()}`);
  };

  const handleResetFilters = () => {
    setTypeFilter('all');
    setWorkMode('all');
    setExpLevel('all');
    setDatePosted('all');
    setSourcePortal('all');
    setInternshipPaid('all');
    setInternshipDuration('');
    setLocationInput('');
    setSelectedCountries([]);
    setSortBy('relevant');
    setPage(1);
    setSearchInput('');
    setQuery('');
    router.push('/search');
  };

  const toggleSaveJob = (job: NormalizedJob) => {
    const updated = new Set(savedJobIds);
    if (updated.has(job.id)) {
      updated.delete(job.id);
      showToast(`Removed "${job.title}" from saved bookmarks.`, 'info');
    } else {
      updated.add(job.id);
      showToast(`Saved "${job.title}" to bookmarks!`, 'success');
    }
    setSavedJobIds(updated);
    try {
      localStorage.setItem('helpu_saved_job_ids', JSON.stringify(Array.from(updated)));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddToTracker = async (job: NormalizedJob) => {
    try {
      const res = await fetch('/api/search/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_to_tracker', job }),
      });
      if (res.ok) {
        setTrackedJobIds((prev) => new Set(prev).add(job.id));
        showToast(`Added "${job.title}" at ${job.company} to your Application Tracker!`, 'success');
      } else {
        showToast('Failed to add job to tracker', 'error');
      }
    } catch (e) {
      showToast('Error connecting to tracker service', 'error');
    }
  };

  const handleConfirmApplyWithProfile = async () => {
    if (!confirmModalJob) return;
    setIsApplyingWithProfile(true);
    try {
      // Add to tracker with Pending Review status
      await fetch('/api/search/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_to_tracker', job: confirmModalJob }),
      });
      setTrackedJobIds((prev) => new Set(prev).add(confirmModalJob.id));
      showToast(
        `Application queued! You can review the tailored resume in Application Tracker before sending.`,
        'success'
      );
      setConfirmModalJob(null);
    } catch (e) {
      showToast('Error queueing application', 'error');
    } finally {
      setIsApplyingWithProfile(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toast.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for "Apply with my profile" */}
      {confirmModalJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Apply with My Profile</h3>
                  <p className="text-xs text-slate-500">Autonomous Application Confirmation</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmModalJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Position:</span>
                <span className="font-bold text-slate-900">{confirmModalJob.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Company:</span>
                <span className="font-bold text-slate-900">{confirmModalJob.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Source Portal:</span>
                <span className="font-semibold text-slate-700">{confirmModalJob.source}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will add the job to your <strong>Application Tracker</strong> in review mode. Your profile will be used to generate a customized cover letter and tailored resume draft before submission.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalJob(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApplyingWithProfile}
                onClick={handleConfirmApplyWithProfile}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {isApplyingWithProfile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Queueing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Queue Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search jobs & internships by title, company, or keyword…"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type selector tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('job');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === 'job'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Jobs
              </button>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('internship');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === 'internship'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Internships
              </button>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 bg-slate-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filters ({typeFilter !== 'all' || workMode !== 'all' ? 'Active' : 'All'})</span>
            </button>
          </form>

          {/* Quick Filter Chips (FreeHire Search Experience) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Quick Chips:
            </span>
            <button
              type="button"
              onClick={() => {
                const nextMode = workMode === 'remote' ? 'all' : 'remote';
                setWorkMode(nextMode);
                syncFilterToUrl({ work_mode: nextMode });
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
                workMode === 'remote'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              🌐 Remote
            </button>
            <button
              type="button"
              onClick={() => {
                const nextType = typeFilter === 'internship' ? 'all' : 'internship';
                setTypeFilter(nextType);
                syncFilterToUrl({ type: nextType });
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
                typeFilter === 'internship'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              🎓 Internships
            </button>
            {[
              { label: '💻 Software Engineering', val: 'Software Engineering' },
              { label: '📊 Data Engineering', val: 'Data Engineering' },
              { label: '🛡️ Security', val: 'Security' },
              { label: '🧪 QA', val: 'QA' },
              { label: '📈 Data Analytics', val: 'Data Analytics' },
            ].map((chip) => {
              const active = query.toLowerCase() === chip.val.toLowerCase();
              return (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => {
                    const nextQ = active ? '' : chip.val;
                    setQuery(nextQ);
                    setSearchInput(nextQ);
                    syncFilterToUrl({ q: nextQ });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
            {[
              {
                label: 'US',
                code: 'us',
                active: selectedCountries.includes('us'),
                toggle: () => {
                  const active = selectedCountries.includes('us');
                  const updated = active ? selectedCountries.filter((c) => c !== 'us') : [...selectedCountries, 'us'];
                  setSelectedCountries(updated);
                  syncFilterToUrl({ countries: updated.length > 0 ? updated.join(',') : null });
                },
              },
              {
                label: 'EU',
                code: 'eu',
                active: EU_COUNTRY_CODES.length > 0 && EU_COUNTRY_CODES.every((c) => selectedCountries.includes(c)),
                toggle: () => {
                  const active = EU_COUNTRY_CODES.every((c) => selectedCountries.includes(c));
                  let updated: string[];
                  if (active) {
                    updated = selectedCountries.filter((c) => !EU_COUNTRY_CODES.includes(c));
                  } else {
                    updated = Array.from(new Set([...selectedCountries, ...EU_COUNTRY_CODES]));
                  }
                  setSelectedCountries(updated);
                  syncFilterToUrl({ countries: updated.length > 0 ? updated.join(',') : null });
                },
              },
              {
                label: 'India',
                code: 'in',
                active: selectedCountries.includes('in'),
                toggle: () => {
                  const active = selectedCountries.includes('in');
                  const updated = active ? selectedCountries.filter((c) => c !== 'in') : [...selectedCountries, 'in'];
                  setSelectedCountries(updated);
                  syncFilterToUrl({ countries: updated.length > 0 ? updated.join(',') : null });
                },
              },
            ].map((chip) => (
              <button
                key={chip.code}
                type="button"
                onClick={chip.toggle}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
                  chip.active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <CountryFlag code={chip.code} className="w-3.5 h-3.5 shrink-0" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* ================= LEFT FILTER SIDEBAR ================= */}
          <aside
            className={`${
              showMobileFilters ? 'block' : 'hidden'
            } lg:block lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-6 sticky top-36`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Filters</h3>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Reset All
              </button>
            </div>

            {/* Work Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Work Mode
              </label>
              <div className="space-y-1.5">
                {[
                  { value: 'all', label: 'All Modes' },
                  { value: 'remote', label: 'Remote' },
                  { value: 'hybrid', label: 'Hybrid' },
                  { value: 'onsite', label: 'On-site' },
                ].map((mode) => (
                  <label key={mode.value} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="workMode"
                      value={mode.value}
                      checked={workMode === mode.value}
                      onChange={(e) => {
                        setWorkMode(e.target.value);
                        setPage(1);
                      }}
                      className="text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                    <span>{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Countries Work Location Filter */}
            <CountrySidebarFilter
              selectedCountries={selectedCountries}
              onChange={(updated) => {
                setSelectedCountries(updated);
                syncFilterToUrl({ countries: updated.length > 0 ? updated.join(',') : null });
                setPage(1);
              }}
            />

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Experience Level
              </label>
              <div className="space-y-1.5">
                {[
                  { value: 'all', label: 'All Levels' },
                  { value: 'intern', label: 'Intern' },
                  { value: 'entry', label: 'Entry Level' },
                  { value: 'mid', label: 'Mid Level' },
                  { value: 'senior', label: 'Senior' },
                ].map((lvl) => (
                  <label key={lvl.value} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="expLevel"
                      value={lvl.value}
                      checked={expLevel === lvl.value}
                      onChange={(e) => {
                        setExpLevel(e.target.value);
                        setPage(1);
                      }}
                      className="text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                    <span>{lvl.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Posted */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Date Posted
              </label>
              <div className="space-y-1.5">
                {[
                  { value: 'all', label: 'Anytime' },
                  { value: '24h', label: 'Past 24 hours' },
                  { value: '7d', label: 'Past 7 days' },
                  { value: '30d', label: 'Past 30 days' },
                ].map((dp) => (
                  <label key={dp.value} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="datePosted"
                      value={dp.value}
                      checked={datePosted === dp.value}
                      onChange={(e) => {
                        setDatePosted(e.target.value);
                        setPage(1);
                      }}
                      className="text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                    <span>{dp.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Source Portal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Source Portal
              </label>
              <select
                value={sourcePortal}
                onChange={(e) => {
                  setSourcePortal(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="all">🌐 All Portals (Aggregated)</option>
                <optgroup label="Live ATS Search (5.8M+ Tech Jobs)">
                  <option value="freehire">⚡ {BRAND.portalName}</option>
                </optgroup>
                <optgroup label="Direct Company Portals (Official)">
                  <option value="cisco">🏢 Cisco Careers (Official)</option>
                  <option value="redhat">🎩 Red Hat Careers (Official)</option>
                  <option value="bosch">⚙️ Bosch Careers (Official)</option>
                  <option value="pricol">🚗 Pricol Careers (Official)</option>
                </optgroup>
                <optgroup label="Aggregators & Platforms">
                  <option value="linkedin">LinkedIn</option>
                  <option value="indeed">Indeed</option>
                  <option value="naukri">Naukri</option>
                  <option value="greenhouse">Greenhouse / Lever</option>
                  <option value="direct">Direct Career Pages</option>
                </optgroup>
              </select>
            </div>

            {/* Internship-specific section */}
            {(typeFilter === 'internship' || typeFilter === 'all') && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Internship Filters</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Compensation</label>
                  <div className="flex gap-2">
                    {['all', 'paid', 'unpaid'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setInternshipPaid(status);
                          setPage(1);
                        }}
                        className={`flex-1 py-1 text-[11px] rounded-lg font-semibold capitalize border ${
                          internshipPaid === status
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Duration</label>
                  <input
                    type="text"
                    value={internshipDuration}
                    onChange={(e) => {
                      setInternshipDuration(e.target.value);
                      setPage(1);
                    }}
                    placeholder="e.g. 3 months, 12 weeks"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}
          </aside>

          {/* ================= RIGHT RESULTS COLUMN ================= */}
          <main className="lg:col-span-3 space-y-4">
            {/* Results Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {query ? (
                    <>
                      <span>Results for &ldquo;{query}&rdquo;</span>
                    </>
                  ) : (
                    <span>All Available Jobs & Internships</span>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {total} found
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  General search • Independent of candidate profile & automation rules
                </p>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPage(1);
                  }}
                  className="p-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                >
                  <option value="relevant">Most Relevant</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Active Selected Countries Pill Bar */}
            {selectedCountries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs">
                <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5 mr-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  Countries ({selectedCountries.length}):
                </span>
                {selectedCountries.map((code) => {
                  const countryName = getCountryName(code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      <CountryFlag code={code} className="w-3.5 h-3.5 shrink-0" />
                      <span>{countryName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = selectedCountries.filter((c) => c !== code);
                          setSelectedCountries(updated);
                          syncFilterToUrl({ countries: updated.length > 0 ? updated.join(',') : null });
                          setPage(1);
                        }}
                        className="text-indigo-400 hover:text-indigo-800 ml-0.5"
                        title={`Remove ${countryName}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCountries([]);
                    syncFilterToUrl({ countries: null });
                    setPage(1);
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer"
                >
                  Clear countries
                </button>
              </div>
            )}

            {/* Portal Warnings if any source timed out */}
            {Object.keys(portalWarnings).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Note: Portal response delayed from <strong>{Object.keys(portalWarnings).join(', ')}</strong>. Showing live results from active sources.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPortalWarnings({})}
                  className="text-amber-600 hover:text-amber-800 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs animate-pulse space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                      </div>
                      <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                    <div className="flex gap-2 pt-2">
                      <div className="h-8 w-28 bg-slate-200 rounded-xl"></div>
                      <div className="h-8 w-24 bg-slate-100 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State with Retry Button */}
            {!loading && error && (
              <div className="bg-white rounded-3xl p-8 border border-red-200 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Failed to load search results</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
                <button
                  type="button"
                  onClick={fetchSearchResults}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Search</span>
                </button>
              </div>
            )}

            {/* Empty State (Zero Matches) */}
            {!loading && !error && jobs.length === 0 && (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCountries.length > 0 ? (
                    <>No listings found in {selectedCountries.map(getCountryName).join(', ')}</>
                  ) : sourcePortal !== 'all' ? (
                    <>No listings found on <span className="capitalize text-indigo-600 font-extrabold">{sourcePortal} Careers</span></>
                  ) : (
                    <>No jobs or internships found</>
                  )}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {selectedCountries.length > 0
                    ? `We couldn't find any listings in ${selectedCountries.map(getCountryName).join(', ')} matching "${query || 'current filters'}". Try adding more countries or selecting "Remote – Worldwide".`
                    : sourcePortal !== 'all'
                    ? `We couldn't find any opportunities currently open directly on ${sourcePortal.toUpperCase()} careers matching "${query || 'current filters'}". Try searching across all portals or broadening your keyword query.`
                    : `We couldn't find any listings matching "${query || 'your filters'}". Try adjusting your keywords, broadening the location, or resetting the filters.`}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  {selectedCountries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCountries([]);
                        syncFilterToUrl({ countries: null });
                        setPage(1);
                      }}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors border border-indigo-200"
                    >
                      🌍 Clear Country Filters
                    </button>
                  )}
                  {sourcePortal !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSourcePortal('all');
                        setPage(1);
                      }}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors border border-indigo-200"
                    >
                      🌐 Search Across All Portals
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Clear All Filters & Show Everything
                  </button>
                </div>
              </div>
            )}

            {/* Results Cards List */}
            {!loading && !error && jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const isSaved = savedJobIds.has(job.id);
                  const isTracked = trackedJobIds.has(job.id);
                  const isExpanded = expandedJobId === job.id;

                  return (
                    <article
                      key={job.id}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-4"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight hover:text-indigo-600 transition-colors">
                              {job.title}
                            </h2>
                            {/* Job vs Internship Badge */}
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                                job.type === 'internship'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {job.type === 'internship' ? 'Internship' : 'Job'}
                            </span>
                            {job.is_paid === false && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Unpaid
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span className="font-semibold text-slate-900 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {job.company}
                            </span>
                            {(() => {
                              const validCountry = job.country && job.country !== 'unknown' && job.country !== 'undefined' ? job.country : undefined;
                              return (
                                <span className="flex items-center gap-1.5">
                                  {validCountry ? (
                                    <CountryFlag code={validCountry} className="w-3.5 h-3.5 shrink-0" />
                                  ) : (
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  <span>{job.location}</span>
                                  {validCountry && validCountry !== 'remote' && (
                                    <span className="text-[11px] text-slate-400 font-medium">({getCountryName(validCountry)})</span>
                                  )}
                                </span>
                              );
                            })()}
                            <span className="capitalize px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">
                              {job.work_mode}
                            </span>
                            {job.salary_or_stipend && (
                              <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                {job.salary_or_stipend}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Portal / Source Badge & Save Bookmark */}
                        <div className="flex items-center gap-2 shrink-0">
                          {job.requires_manual_login && (
                            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-md border border-amber-200" title="This ATS requires candidate login credentials. Review Mode is recommended.">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Manual Login ATS
                            </span>
                          )}
                          <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                            job.source === 'freehire'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'text-slate-600 bg-slate-100 border-slate-200/60'
                          }`}>
                            {job.source === 'freehire' && <Zap className="w-3 h-3 text-amber-500" />}
                            {getPortalSourceLabel(job.source)}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSaveJob(job)}
                            className={`p-2 rounded-xl border transition-all ${
                              isSaved
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                            title={isSaved ? 'Remove from saved' : 'Save bookmark'}
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-indigo-600' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Description Snippet */}
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <p className={isExpanded ? '' : 'line-clamp-2'}>{job.description}</p>
                        {isExpanded && job.requirements && job.requirements.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Requirements & Qualifications:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-slate-700">
                              {job.requirements.map((req, i) => (
                                <li key={i}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                          className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 inline-flex items-center gap-0.5"
                        >
                          <span>{isExpanded ? 'Show less' : 'Read full details'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Footer Row: Posted Time & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Posted {new Date(job.posted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          {job.duration && (
                            <>
                              <span>•</span>
                              <span>{job.duration}</span>
                            </>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. Apply on Employer ATS */}
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>Apply on ATS</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                          </a>

                          {/* 2. Add to Tracker */}
                          <button
                            type="button"
                            onClick={() => handleAddToTracker(job)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 border ${
                              isTracked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isTracked ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>In Tracker</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span>Add to Tracker</span>
                              </>
                            )}
                          </button>

                          {/* 3. Opt-in "Apply with my profile" */}
                          <button
                            type="button"
                            onClick={() => setConfirmModalJob(job)}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Apply with profile</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mt-6">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs font-medium text-slate-500">
                      Page <strong className="text-slate-900">{page}</strong> of{' '}
                      <strong className="text-slate-900">{totalPages}</strong>
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}

                {/* Engine Attribution & Open Source Notice */}
                <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Jobs powered by <span className="font-bold text-indigo-600">{BRAND.name}</span> (5.8M+ live tech jobs from Greenhouse, Lever, Workday)</span>
                  </span>
                  <span className="text-slate-400">
                    Direct application links routed to official company career boards
                  </span>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8 bg-slate-50 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading search engine…</span>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
