'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Search, 
  Sparkles, 
  Filter, 
  MapPin, 
  Building2, 
  DollarSign, 
  Send, 
  CheckCircle, 
  RefreshCw, 
  ExternalLink,
  ChevronDown,
  AlertCircle,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { JobListing, UserProfile, UserSettings } from '@/lib/types';
import { BRAND } from '@/lib/config/brand';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [batchApplying, setBatchApplying] = useState(false);
  const [filterPortal, setFilterPortal] = useState('ALL');
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyResultBanner, setApplyResultBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = async (triggerScrape = false) => {
    try {
      const [jobRes, profRes, setRes] = await Promise.all([
        fetch(`/api/jobs/search${triggerScrape ? '?scrape=true' : ''}`),
        fetch('/api/profile'),
        fetch('/api/settings'),
      ]);

      const jobData = await jobRes.json();
      const profData = await profRes.json();
      const setData = await setRes.json();

      if (jobData.jobs) setJobs(jobData.jobs);
      if (profData.profile) setProfile(profData.profile);
      if (setData.settings) {
        setSettings(setData.settings);
        setFilterMinScore(setData.settings.jobMatchThreshold || 70);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplySingle = async (job: JobListing) => {
    setApplyingJobId(job.id);
    setApplyResultBanner(null);
    try {
      const res = await fetch('/api/apply/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger application');

      setApplyResultBanner({
        message: `Success! Application queued for "${job.title}" at ${job.company}. Playwright worker is executing.`,
        type: 'success',
      });
    } catch (err: any) {
      setApplyResultBanner({
        message: err.message,
        type: 'error',
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleBatchApply = async () => {
    if (!settings) return;
    setBatchApplying(true);
    setApplyResultBanner(null);

    // Eligible jobs: above threshold, not blacklisted
    const eligible = jobs.filter(
      (j) => j.matchScore >= settings.jobMatchThreshold && !j.isBlacklisted
    );

    if (eligible.length === 0) {
      setApplyResultBanner({
        message: `No jobs found meeting your match threshold of ${settings.jobMatchThreshold}%.`,
        type: 'error',
      });
      setBatchApplying(false);
      return;
    }

    try {
      const res = await fetch('/api/apply/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: eligible.map((j) => j.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch apply failed');

      setApplyResultBanner({
        message: `Queued ${data.applications?.length || eligible.length} matching applications! Tracking in progress.`,
        type: 'success',
      });
    } catch (err: any) {
      setApplyResultBanner({
        message: err.message,
        type: 'error',
      });
    } finally {
      setBatchApplying(false);
    }
  };

  // Filtered list
  const filteredJobs = jobs.filter((job) => {
    if (filterPortal !== 'ALL' && job.portal.toLowerCase() !== filterPortal.toLowerCase()) {
      return false;
    }
    if (job.matchScore < filterMinScore) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Search className="w-6 h-6 text-indigo-600" />
              <span>Job Discovery & Match Scoring</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live crawler results across LinkedIn, Indeed, Naukri, and direct career portals scored against your profile (0-100).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSearching(true);
                loadData(true);
              }}
              disabled={searching}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${searching ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{searching ? 'Crawling Portals...' : 'Scrape Portals Now'}</span>
            </button>

            <button
              onClick={handleBatchApply}
              disabled={batchApplying}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{batchApplying ? 'Queueing Applications...' : `Batch Apply (>= ${settings?.jobMatchThreshold || 70}%)`}</span>
            </button>
          </div>
        </div>

        {/* Status / Alert Banner */}
        {applyResultBanner && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
              applyResultBanner.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {applyResultBanner.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{applyResultBanner.message}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, company, skills..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Portal Filter */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Portal:</span>
              <select
                value={filterPortal}
                onChange={(e) => setFilterPortal(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium outline-none"
              >
                <option value="ALL">All Portals</option>
                <option value="FreeHire">{BRAND.portalName}</option>
                <option value="Cisco">Cisco Careers</option>
                <option value="RedHat">Red Hat Careers</option>
                <option value="Bosch">Bosch Careers</option>
                <option value="Pricol">Pricol Careers</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Naukri">Naukri</option>
                <option value="Greenhouse">Greenhouse</option>
                <option value="Lever">Lever</option>
                <option value="CareerPage">Career Pages</option>
              </select>
            </div>

            {/* Min Match Score */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Min Score:</span>
              <select
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium outline-none"
              >
                <option value={0}>Any Score (0%+)</option>
                <option value={60}>60%+ Match</option>
                <option value={70}>70%+ (Default)</option>
                <option value={80}>80%+ High Match</option>
                <option value={90}>90%+ Exact Match</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-medium ml-auto md:ml-0">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </span>
          </div>
        </div>

        {/* Job Listings Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => {
            const isEligible = job.matchScore >= (settings?.jobMatchThreshold || 70);
            const isApplying = applyingJobId === job.id;

            return (
              <div
                key={job.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all hover:shadow-md ${
                  job.isBlacklisted
                    ? 'border-slate-200 opacity-60'
                    : isEligible
                    ? 'border-indigo-100/80 shadow-sm'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left: Job Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black text-slate-900">{job.title}</h2>
                      
                      {/* Match Score Badge */}
                      <span
                        className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${
                          job.matchScore >= 90
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : job.matchScore >= 70
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {job.matchScore}% Match
                      </span>

                      {/* Portal Badge */}
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {job.portal}
                      </span>

                      {job.isBlacklisted && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Company Blacklisted
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 text-slate-700 font-bold">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" /> {job.salary}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                      {job.description}
                    </p>

                    {/* Claude Match Reasons & Missing Skills */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {job.matchReasons.slice(0, 2).map((reason, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium bg-emerald-50/70 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100"
                        >
                          ✓ {reason}
                        </span>
                      ))}

                      {job.missingSkills && job.missingSkills.length > 0 && (
                        <span className="text-[11px] font-medium bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-100">
                          Missing: {job.missingSkills.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
                    <button
                      onClick={() => handleApplySingle(job)}
                      disabled={isApplying || job.isBlacklisted}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 ${
                        isEligible && !job.isBlacklisted
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                          : 'bg-slate-800 hover:bg-slate-900 text-white'
                      } disabled:opacity-50`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isApplying ? 'Applying...' : 'Auto-Apply Now'}</span>
                    </button>

                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600"
                    >
                      <span>View Portal Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
