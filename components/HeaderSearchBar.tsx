'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Zap,
  Building2,
  MapPin,
  Loader2
} from 'lucide-react';
import { BRAND } from '@/lib/config/brand';

interface RecentSearchItem {
  query: string;
  type?: string;
  timestamp: number;
}

interface FreeHireSuggestion {
  text: string;
  kind?: string;
  jobs?: number;
}

interface FreeHireLivePreview {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  url: string;
  type: 'job' | 'internship';
}

const POPULAR_SUGGESTIONS = [
  { label: 'Software Engineering', category: 'job', icon: Briefcase },
  { label: 'Software Engineer Intern', category: 'internship', icon: GraduationCap },
  { label: 'Data Engineering', category: 'job', icon: Briefcase },
  { label: 'Security Engineer', category: 'job', icon: Sparkles },
  { label: 'QA Engineer', category: 'job', icon: Briefcase },
  { label: 'Data Analytics', category: 'job', icon: Briefcase },
  { label: 'Frontend Developer (React/Next.js)', category: 'job', icon: Briefcase },
  { label: 'Machine Learning Intern', category: 'internship', icon: GraduationCap },
  { label: 'Backend Engineer (Node/Python)', category: 'job', icon: Briefcase },
  { label: 'DevOps / Cloud Engineer', category: 'job', icon: Briefcase },
  { label: 'Product Manager', category: 'job', icon: Briefcase },
  { label: 'Cybersecurity Intern', category: 'internship', icon: GraduationCap },
];

const POPULAR_SKILLS = [
  'TypeScript', 'React', 'Next.js', 'Python', 'Node.js',
  'AWS', 'Docker', 'GraphQL', 'PostgreSQL', 'Tailwind CSS'
];

const LOCAL_STORAGE_KEY = 'helpu_recent_searches_v1';
const MAX_RECENT_SEARCHES = 8;

export default function HeaderSearchBar() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // FreeHire live state
  const [freehireSuggestions, setFreehireSuggestions] = useState<FreeHireSuggestion[]>([]);
  const [liveJobPreviews, setLiveJobPreviews] = useState<FreeHireLivePreview[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch (e) {
      console.warn('Failed to parse recent searches from localStorage', e);
    }
  }, []);

  // Synchronize header search bar with URL query parameter (keeps page search bar and top bar in sync)
  useEffect(() => {
    const syncFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q !== null && q !== undefined) {
          setQuery(q);
        }
      } catch (e) {
        // Safe in SSR
      }
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
      const updated = [{ query: trimmed, timestamp: Date.now() }, ...filtered].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save recent search to localStorage', e);
      }
      return updated;
    });
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear recent searches', e);
    }
  };

  const removeRecentItem = (e: React.MouseEvent, targetQuery: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.query !== targetQuery);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
      return updated;
    });
  };

  // 300ms Debounce typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Query FreeHire suggestions & live jobs on debounced query
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setFreehireSuggestions([]);
      setLiveJobPreviews([]);
      setIsLoadingLive(false);
      return;
    }

    let isMounted = true;
    setIsLoadingLive(true);

    fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setFreehireSuggestions(data.suggestions || []);
        setLiveJobPreviews(data.liveJobs || []);
        setIsLoadingLive(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Error fetching FreeHire suggestions:', err);
        setIsLoadingLive(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Global Keyboard shortcuts: '/' or 'Ctrl+K' / 'Cmd+K' to focus, 'Esc' to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isMobileExpanded) {
          mobileInputRef.current?.focus();
        } else {
          setIsMobileExpanded(false);
          inputRef.current?.focus();
        }
        setIsOpen(true);
        return;
      }

      // '/' when not in another input
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        return;
      }

      // Esc to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileExpanded(false);
        inputRef.current?.blur();
        mobileInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileExpanded]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter local suggestions based on debounced input
  const filteredSuggestions = POPULAR_SUGGESTIONS.filter((s) =>
    s.label.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const filteredSkills = POPULAR_SKILLS.filter((s) =>
    s.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  // Flatten active items for arrow key navigation
  const activeItems: string[] = [];
  if (debouncedQuery.trim().length === 0) {
    recentSearches.forEach((r) => activeItems.push(r.query));
    POPULAR_SUGGESTIONS.slice(0, 5).forEach((s) => activeItems.push(s.label));
  } else {
    freehireSuggestions.forEach((s) => activeItems.push(s.text));
    filteredSuggestions.forEach((s) => activeItems.push(s.label));
    filteredSkills.forEach((s) => activeItems.push(s));
  }

  const handleExecuteSearch = (searchQuery: string, typeParam: string = 'all') => {
    const target = searchQuery.trim();
    if (!target) return;

    saveRecentSearch(target);
    setIsOpen(false);
    setIsMobileExpanded(false);

    // Route to /search with query parameters
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(target)}&type=${encodeURIComponent(typeParam)}`);
    });
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev < activeItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : activeItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < activeItems.length) {
        const selected = activeItems[selectedIndex];
        setQuery(selected);
        handleExecuteSearch(selected);
      } else {
        handleExecuteSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <>
      {/* ================= DESKTOP SEARCH BAR ================= */}
      <div ref={containerRef} className="relative flex-1 max-w-md lg:max-w-xl hidden sm:block mx-3 lg:mx-6">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-slate-400">
            {isLoadingLive ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDownInput}
            placeholder={BRAND.searchPlaceholder}
            aria-label="Search jobs & internships"
            className="w-full pl-10 pr-20 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs lg:text-sm text-slate-800 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1 pointer-events-none">
                <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600/80 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100">
                  <Zap className="w-2.5 h-2.5 text-indigo-500" />
                  {BRAND.name}
                </span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
                  ⌘K
                </kbd>
                <kbd className="inline-flex lg:hidden items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
                  /
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Suggestions & Recent Searches */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
            {/* Header / Helper bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">↵ Enter</kbd> to search
              </span>
              <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                <Zap className="w-3 h-3 text-indigo-500" />
                <span>{BRAND.dropdownHeader}</span>
              </span>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 p-2">
              {/* If query is empty, show Recent Searches & Popular Picks */}
              {debouncedQuery.trim().length === 0 ? (
                <>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center justify-between pb-1.5 px-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearAllRecent}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="space-y-0.5 mt-1">
                        {recentSearches.map((item, idx) => {
                          const isSelected = selectedIndex === idx;
                          return (
                            <div
                              key={item.query + item.timestamp}
                              onClick={() => {
                                setQuery(item.query);
                                handleExecuteSearch(item.query);
                              }}
                              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                                <span className="truncate">{item.query}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => removeRecentItem(e, item.query)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-all"
                                  title="Remove from history"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Popular Job & Internship Suggestions */}
                  <div className="p-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2 pb-1.5">
                      <TrendingUp className="w-3 h-3 text-indigo-500" />
                      Popular Roles & Opportunities
                    </span>
                    <div className="space-y-0.5 mt-1">
                      {POPULAR_SUGGESTIONS.slice(0, 6).map((item, idx) => {
                        const offsetIdx = recentSearches.length + idx;
                        const isSelected = selectedIndex === offsetIdx;
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            onClick={() => {
                              setQuery(item.label);
                              handleExecuteSearch(item.label, item.category);
                            }}
                            className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              item.category === 'internship'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                            }`}>
                              {item.category === 'internship' ? 'Internship' : 'Job'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Matching Results, FreeHire Live Suggestions & Live Jobs */
                <div className="p-2 space-y-3">
                  {/* Enter Search Option */}
                  <div
                    onClick={() => handleExecuteSearch(query)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-xs cursor-pointer hover:bg-indigo-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-600" />
                      <span>Search all portals (helpu.ai, Cisco, Red Hat, Bosch) for &ldquo;{query}&rdquo;</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </div>

                  {/* helpu.ai Live Suggestions with Job Counts */}
                  {freehireSuggestions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-2 pb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          {BRAND.liveSuggestionsLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Live ATS Count</span>
                      </div>
                      <div className="space-y-0.5">
                        {freehireSuggestions.map((item, idx) => {
                          const isSelected = selectedIndex === idx;
                          return (
                            <div
                              key={item.text + idx}
                              onClick={() => {
                                setQuery(item.text);
                                handleExecuteSearch(item.text);
                              }}
                              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Search className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                                <span className="truncate">{item.text}</span>
                              </div>
                              {item.jobs && item.jobs > 0 ? (
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                  {item.jobs.toLocaleString()} jobs
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Live Job Postings from helpu.ai */}
                  {liveJobPreviews.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between px-2 pb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          {BRAND.livePostingsLabel}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Direct ATS
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {liveJobPreviews.map((job) => (
                          <a
                            key={job.id}
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                                {job.title}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {job.company}
                              </span>
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {job.location}
                              </span>
                              <span className="capitalize font-semibold text-indigo-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                {job.workMode}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Local Matching Roles (Fallback or Additional) */}
                  {freehireSuggestions.length === 0 && filteredSuggestions.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1 block">
                        Matching Roles
                      </span>
                      <div className="space-y-0.5">
                        {filteredSuggestions.map((item, idx) => {
                          const isSelected = selectedIndex === idx;
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.label}
                              onClick={() => {
                                setQuery(item.label);
                                handleExecuteSearch(item.label, item.category);
                              }}
                              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.category === 'internship'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                              }`}>
                                {item.category === 'internship' ? 'Internship' : 'Job'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Skills Tag Suggestions */}
                  {filteredSkills.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1.5 block">
                        Keywords & Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5 px-2">
                        {filteredSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              setQuery(skill);
                              handleExecuteSearch(skill);
                            }}
                            className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dropdown footer info */}
            <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {BRAND.dropdownFooter}
              </span>
              <button
                type="button"
                onClick={() => handleExecuteSearch(query || 'developer')}
                className="text-indigo-600 hover:underline font-bold"
              >
                View Full Search Results →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MOBILE COLLAPSED BUTTON ================= */}
      <div className="sm:hidden flex items-center">
        <button
          type="button"
          onClick={() => {
            setIsMobileExpanded(true);
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open search bar"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* ================= MOBILE FULL-WIDTH OVERLAY ================= */}
      {isMobileExpanded && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-start p-3 sm:hidden animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Input Row */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-200">
              {isLoadingLive ? (
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0 ml-1" />
              ) : (
                <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              )}
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch(query);
                  } else if (e.key === 'Escape') {
                    setIsMobileExpanded(false);
                  }
                }}
                placeholder={BRAND.mobilePlaceholder}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileExpanded(false)}
                className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>

            {/* Quick Action / Suggestions */}
            <div className="overflow-y-auto p-2 space-y-2 flex-1">
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => handleExecuteSearch(query)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-xs"
                >
                  <span>Search for &ldquo;{query}&rdquo;</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* helpu.ai Suggestions */}
              {freehireSuggestions.length > 0 && (
                <div className="pt-1">
                  <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{BRAND.liveSuggestionsLabel}</span>
                  </div>
                  {freehireSuggestions.map((item, idx) => (
                    <div
                      key={item.text + idx}
                      onClick={() => handleExecuteSearch(item.text)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <span>{item.text}</span>
                      {item.jobs && item.jobs > 0 ? (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                          {item.jobs}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {/* Live Jobs preview */}
              {liveJobPreviews.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {BRAND.livePostingsLabel}
                  </span>
                  <div className="space-y-1">
                    {liveJobPreviews.map((job) => (
                      <a
                        key={job.id}
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="font-bold text-slate-900 truncate">{job.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{job.company} · {job.location}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {recentSearches.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Recent Searches</span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-indigo-600"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((item) => (
                    <div
                      key={item.query}
                      onClick={() => handleExecuteSearch(item.query)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.query}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
              ⚡ Powered by <span className="font-bold text-indigo-600">{BRAND.poweredBy}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
