'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Briefcase,
  MapPin,
  DollarSign,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function PostJobPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'feed'>('form');

  // Single Job Form State
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'onsite' | 'hybrid' | 'remote'>('onsite');
  const [jobType, setJobType] = useState<'job' | 'internship'>('job');
  const [experienceLevel, setExperienceLevel] = useState<'Entry' | 'Mid' | 'Senior'>('Mid');
  const [salary, setSalary] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [description, setDescription] = useState('');

  // Bulk Feed State
  const [feedJson, setFeedJson] = useState('');

  // Submission State
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitSingleJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/jobs/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          company,
          location,
          workMode,
          type: jobType,
          experienceLevel,
          salary,
          applyUrl,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit job posting');
      }

      setSuccessMsg(`"${title}" at ${company} was published successfully and is now live in search results!`);
      // Reset form
      setTitle('');
      setCompany('');
      setLocation('');
      setSalary('');
      setApplyUrl('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error publishing job posting');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let parsed = [];
      try {
        parsed = JSON.parse(feedJson);
      } catch (e) {
        throw new Error('Invalid JSON format. Please ensure valid JSON array syntax.');
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Please provide an array with at least one job object.');
      }

      const res = await fetch('/api/jobs/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: parsed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Feed import failed');

      setSuccessMsg(`Successfully imported ${data.createdCount} jobs into the verified job network!`);
      setFeedJson('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error importing feed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Employer Direct Ingestion Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Post Openings for Any City or Region
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Ensure talent in Tier-2/Tier-3 hubs like Madurai, Coimbatore, and regional centers can discover your official job opportunities.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'form'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Direct Job Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'feed'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Bulk JSON / XML Feed
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <Link
              href="/search"
              className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900 ml-3 shrink-0"
            >
              View in Search →
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Single Job Form */}
        {activeTab === 'form' && (
          <form
            onSubmit={handleSubmitSingleJob}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Network Engineer"
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Sify Technologies"
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location (City, State, Country) *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Madurai, Tamil Nadu, India"
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Apply URL *
                </label>
                <input
                  type="url"
                  required
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  placeholder="https://company.com/careers/job-123"
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Mode
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white outline-none font-semibold text-slate-700"
                >
                  <option value="onsite">🏢 On-site</option>
                  <option value="hybrid">🔄 Hybrid</option>
                  <option value="remote">🌐 Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white outline-none font-semibold text-slate-700"
                >
                  <option value="job">Full-time Job</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Salary / Compensation
                </label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. ₹6,00,000 - ₹10,00,000 / yr"
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Job Description & Requirements *
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe roles, routing/switching responsibilities, team details, and qualifications…"
                className="w-full p-3 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none leading-relaxed"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating & Publishing…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Job Directly to HELP U Network</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Bulk Feed Import */}
        {activeTab === 'feed' && (
          <form
            onSubmit={handleBulkUpload}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Paste JSON Job Array
              </label>
              <textarea
                required
                rows={8}
                value={feedJson}
                onChange={(e) => setFeedJson(e.target.value)}
                placeholder={`[
  {
    "title": "Network Engineer",
    "company": "Sify Technologies",
    "location": "Madurai, Tamil Nadu, India",
    "workMode": "onsite",
    "salary": "₹6,00,000 - ₹9,50,000",
    "applyUrl": "https://sifytechnologies.com/careers",
    "description": "Manage enterprise Cisco routing, switching, and BGP/OSPF configurations at Madurai datacenter."
  }
]`}
                className="w-full p-3 font-mono text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ingesting Batch…</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Validate & Ingest Feed</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
