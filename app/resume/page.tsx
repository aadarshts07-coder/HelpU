'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ATSResumePreview from '@/components/ATSResumePreview';
import { ATSResumeContent } from '@/lib/ai';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Download, 
  Building2, 
  Briefcase,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { UserProfile, ResumeVersion } from '@/lib/types';

export default function ResumePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resumeData, setResumeData] = useState<ATSResumeContent | null>(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [activeVersionLabel, setActiveVersionLabel] = useState<string | null>(null);

  // Cover Letter Generator State
  const [activeTab, setActiveTab] = useState<'resume' | 'cover_letter'>('resume');
  const [targetCompany, setTargetCompany] = useState('Stripe');
  const [targetJobTitle, setTargetJobTitle] = useState('Senior Full Stack Engineer');
  const [jobDescription, setJobDescription] = useState(
    'Seeking a Senior Full Stack Engineer experienced with TypeScript, React, Node.js, and distributed high-concurrency systems.'
  );
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const fetchProfileAndGenerate = async () => {
    try {
      const profRes = await fetch('/api/profile');
      const profData = await profRes.json();
      if (profData.profile) {
        setProfile(profData.profile);
        if (profData.profile.targetJobTitles?.[0]) {
          setTargetJobTitle(profData.profile.targetJobTitles[0]);
        }
      }

      // Check for saved versions
      const verRes = await fetch('/api/resume/versions');
      const verData = await verRes.json();
      if (verData.versions && verData.versions.length > 0) {
        setResumeVersions(verData.versions);
        const latest = verData.versions[verData.versions.length - 1];
        console.log('[DIAGNOSE /resume UI] Live profile updatedAt:', profData.profile?.updatedAt, 'Profile Name:', profData.profile?.name);
        console.log('[DIAGNOSE /resume UI] Displayed Snapshot:', latest.label, 'Version ID:', latest.id, 'Snapshot createdAt:', latest.createdAt, 'Company in Snapshot:', latest.resumeData?.experience?.[0]?.company);
        setResumeData(latest.resumeData);
        setGeneratedLetter(latest.coverLetter);
        setActiveVersionLabel(latest.label);
      } else {
        // Fallback: Generate initial resume
        const resRes = await fetch('/api/resume/generate', { method: 'POST' });
        const resData = await resRes.json();
        if (resData.resume) {
          setResumeData(resData.resume);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResume(false);
    }
  };

  useEffect(() => {
    fetchProfileAndGenerate();
  }, []);

  const handleRegenerateResume = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: targetJobTitle }),
      });
      const data = await res.json();
      if (data.resume) {
        setResumeData(data.resume);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setGeneratingLetter(true);
    try {
      const res = await fetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetJobTitle,
          company: targetCompany,
          description: jobDescription,
        }),
      });
      const data = await res.json();
      if (data.coverLetter) {
        setGeneratedLetter(data.coverLetter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <span>AI Resume & Tailored Cover Letter Engine</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Powered by Claude API. Outputs 100% ATS-compliant Word DOCX & print PDFs with high keyword matching.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'resume'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ATS Resume Preview
            </button>
            <button
              onClick={() => {
                setActiveTab('cover_letter');
                if (!generatedLetter) handleGenerateCoverLetter();
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'cover_letter'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cover Letter Generator
            </button>
          </div>
        </div>

        {/* TAB 1: ATS Resume Preview & Live Editor */}
        {activeTab === 'resume' && (
          <div className="space-y-6">
            {/* Version History Selector */}
            {resumeVersions.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Resume Version History:</span>
                  <div className="flex flex-wrap gap-1.5 ml-2">
                    {resumeVersions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setResumeData(v.resumeData);
                          setGeneratedLetter(v.coverLetter);
                          setActiveVersionLabel(v.label);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          activeVersionLabel === v.label
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeVersionLabel && (
                  <span className="text-xs text-slate-500 font-medium">
                    Viewing <strong className="text-indigo-600 font-bold">{activeVersionLabel}</strong> (Preserved snapshot)
                  </span>
                )}
              </div>
            )}

            {loadingResume ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-xs font-bold text-slate-700">Synthesizing ATS-Optimized Resume with Claude...</p>
              </div>
            ) : resumeData ? (
              <ATSResumePreview
                resume={resumeData}
                onUpdateResume={(updated) => setResumeData(updated)}
                onRegenerateWithAI={handleRegenerateResume}
                isGenerating={generatingAI}
              />
            ) : null}
          </div>
        )}

        {/* TAB 2: Cover Letter Generator */}
        {activeTab === 'cover_letter' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Controls */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Target Opportunity Parameters
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Company Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                    placeholder="e.g. Stripe, Vercel, Linear"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Job Position Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetJobTitle}
                    onChange={(e) => setTargetJobTitle(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                    placeholder="e.g. Senior Full Stack Engineer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Job Description / Key Requirements Snippet
                </label>
                <textarea
                  rows={5}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 leading-relaxed"
                  placeholder="Paste snippet of the job requirements here..."
                />
              </div>

              <button
                onClick={handleGenerateCoverLetter}
                disabled={generatingLetter}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generatingLetter ? 'Claude is Drafting...' : 'Generate Tailored Letter'}</span>
              </button>
            </div>

            {/* Generated Cover Letter Preview */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tailored Cover Letter Preview
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    {copiedLetter ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {generatingLetter ? (
                <div className="py-16 text-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-xs text-slate-500">Writing personalized cover letter with Claude...</p>
                </div>
              ) : generatedLetter ? (
                <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-serif">
                  {generatedLetter}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Click Generate to synthesize a customized cover letter for {targetCompany}.
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
