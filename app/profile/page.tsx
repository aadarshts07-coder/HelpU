'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Linkedin, 
  Github, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  Code, 
  FolderGit2, 
  Award, 
  Languages, 
  Plus, 
  Trash2, 
  Save, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import { 
  UserProfile, 
  ExperienceItem, 
  EducationItem, 
  SkillItem, 
  ProjectItem, 
  CertificationItem, 
  LanguageItem,
  PipelineStatus 
} from '@/lib/types';

const STEPS = [
  { id: 1, title: 'Contact & Info', icon: User },
  { id: 2, title: 'Roles & Targets', icon: Briefcase },
  { id: 3, title: 'Experience', icon: FolderGit2 },
  { id: 4, title: 'Education', icon: GraduationCap },
  { id: 5, title: 'Skills & Certs', icon: Code },
  { id: 6, title: 'Projects & Langs', icon: Languages },
];

export default function ProfileBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pipeline telemetry state
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [isTriggeringPipeline, setIsTriggeringPipeline] = useState(false);

  // Temporary inputs for array items
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillItem['category']>('Technical');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillItem['level']>('Advanced');
  const [newLangName, setNewLangName] = useState('');
  const [newLangProficiency, setNewLangProficiency] = useState<LanguageItem['proficiency']>('Fluent');

  // Load profile from database on initial mount
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch profile from server');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setIsDirty(false);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      showToast('error', 'Could not load your saved profile: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll pipeline status
  const fetchPipelineStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/pipeline', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.status) setPipelineStatus(data.status);
      }
    } catch (err) {
      // silent polling fail
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchPipelineStatus();
    const interval = setInterval(fetchPipelineStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchProfile, fetchPipelineStatus]);

  // Unsaved changes warning listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved profile changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Helper for updating profile and marking dirty
  const updateProfile = (updater: (prev: UserProfile) => UserProfile) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      setIsDirty(true);
      return updated;
    });
  };

  // Client-side validation across all tabs
  const validateProfile = (): boolean => {
    if (!profile) return false;
    const errs: { [key: string]: string } = {};

    if (!profile.name || profile.name.trim() === '') {
      errs.name = 'Full Name is required.';
    }

    if (!profile.email || profile.email.trim() === '') {
      errs.email = 'Email Address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email.trim())) {
        errs.email = 'Please enter a valid email format (e.g. name@domain.com).';
      }
    }

    if (!profile.targetJobTitles || profile.targetJobTitles.length === 0) {
      errs.targetJobTitles = 'Please add at least one target job title for job matching.';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Guide user to the tab containing the first error
      if (errs.name || errs.email) {
        setCurrentStep(1);
      } else if (errs.targetJobTitles) {
        setCurrentStep(2);
      }
      return false;
    }
    return true;
  };

  // Save changes action
  const saveProfile = async (next = false) => {
    if (!profile) return;

    // Check if user has uncommitted text in pending inputs and auto-commit
    let profileToSave = { ...profile };
    if (newTitle.trim()) {
      profileToSave.targetJobTitles = [...profileToSave.targetJobTitles, newTitle.trim()];
      setNewTitle('');
    }
    if (newLocation.trim()) {
      profileToSave.preferredLocations = [...profileToSave.preferredLocations, newLocation.trim()];
      setNewLocation('');
    }

    setProfile(profileToSave);

    if (!validateProfile()) {
      showToast('error', 'Please resolve the highlighted validation errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToSave),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      setProfile(data.profile);
      setIsDirty(false);
      setErrors({});
      showToast('success', 'Profile saved! Background pipeline triggered for resume, jobs & auto-apply.');
      fetchPipelineStatus();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('profileUpdated'));
      }

      if (next && currentStep < 6) {
        setCurrentStep(currentStep + 1);
      } else if (next && currentStep === 6) {
        router.push('/resume');
      }
    } catch (e: any) {
      console.error('Save error:', e);
      showToast('error', e.message || 'Network error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleManualPipelineTrigger = async () => {
    setIsTriggeringPipeline(true);
    try {
      const res = await fetch('/api/pipeline', { method: 'POST' });
      if (res.ok) {
        showToast('success', 'Pipeline manually triggered! Processing resume and job portals...');
        fetchPipelineStatus();
      } else {
        throw new Error('Failed to start pipeline');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Could not start pipeline');
    } finally {
      setIsTriggeringPipeline(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-semibold text-slate-500">Loading your profile from secure storage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all transform animate-in slide-in-from-top duration-200 ${
          toast.type === 'success' 
            ? 'bg-emerald-950 text-emerald-100 border-emerald-700/60' 
            : 'bg-red-950 text-red-100 border-red-700/60'
        }">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="max-w-md">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
        
        {/* Top Header & Save Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Profile Builder
              </h1>
              {isDirty && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Every detail is strictly used by Claude to generate ATS-optimized resumes and fill job applications without hallucinating.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveProfile(false)}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto disabled:opacity-50 ${
                isDirty ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Pipeline Telemetry Banner */}
        {pipelineStatus && (
          <div className={`p-4 rounded-2xl border transition-all ${
            pipelineStatus.isRunning
              ? 'bg-indigo-50/70 border-indigo-200'
              : pipelineStatus.currentStep === 'error'
              ? 'bg-red-50 border-red-200'
              : pipelineStatus.currentStep === 'paused'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  pipelineStatus.isRunning 
                    ? 'bg-indigo-600 text-white animate-spin' 
                    : pipelineStatus.currentStep === 'paused'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Background Pipeline
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      pipelineStatus.isRunning 
                        ? 'bg-indigo-100 text-indigo-700 animate-pulse'
                        : pipelineStatus.currentStep === 'paused'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {pipelineStatus.currentStep.toUpperCase().replace('_', ' ')}
                    </span>
                    {pipelineStatus.resumeVersionLabel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        {pipelineStatus.resumeVersionLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{pipelineStatus.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualPipelineTrigger}
                  disabled={isTriggeringPipeline || pipelineStatus.isRunning}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 shadow-sm disabled:opacity-50"
                  title="Run pipeline now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringPipeline ? 'animate-spin' : ''}`} />
                  <span>Run Pipeline Now</span>
                </button>
              </div>
            </div>

            {pipelineStatus.isRunning && (
              <div className="mt-3 w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${Math.max(5, pipelineStatus.stepProgress)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Step Indicator Progress Tabs */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isCurrent = currentStep === s.id;
              const isCompleted = currentStep > s.id;
              const hasTabError = 
                (s.id === 1 && (errors.name || errors.email)) ||
                (s.id === 2 && errors.targetJobTitles);

              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center transition-all relative ${
                    isCurrent
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                      : hasTabError
                      ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                      : isCompleted
                      ? 'text-emerald-700 hover:bg-slate-50 font-semibold'
                      : 'text-slate-400 hover:bg-slate-50 font-medium'
                  }`}
                >
                  {hasTabError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : hasTabError
                        ? 'bg-red-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : s.id}
                  </div>
                  <span className="text-[11px] truncate w-full">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Tab Form Body */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          {/* TAB 1: Contact & Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  1. Personal & Contact Information
                </h2>
                <span className="text-xs text-slate-400 font-medium">Fields with * are required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateProfile((p) => ({ ...p, name: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition-all ${
                      errors.name 
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20' 
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                    placeholder="Alex Morgan"
                  />
                  {errors.name && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile((p) => ({ ...p, email: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition-all ${
                      errors.email 
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20' 
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                    placeholder="alex@example.com"
                  />
                  {errors.email && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => updateProfile((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="+1 (555) 382-9014"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current Location (City, State / Country)
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => updateProfile((p) => ({ ...p, location: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={profile.linkedInUrl}
                    onChange={(e) => updateProfile((p) => ({ ...p, linkedInUrl: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    value={profile.githubUrl}
                    onChange={(e) => updateProfile((p) => ({ ...p, githubUrl: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Portfolio / Personal Website URL
                  </label>
                  <input
                    type="url"
                    value={profile.portfolioUrl}
                    onChange={(e) => updateProfile((p) => ({ ...p, portfolioUrl: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="https://alexmorgan.dev"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Professional Summary (Used for ATS Header & Elevator Pitch)
                  </label>
                  <textarea
                    rows={4}
                    value={profile.summary}
                    onChange={(e) => updateProfile((p) => ({ ...p, summary: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
                    placeholder="A concise, factual 3-sentence summary of your core domain expertise, years of experience, and primary accomplishments."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Roles & Targets */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  2. Target Roles & Search Criteria
                </h2>
                <span className="text-xs text-slate-400 font-medium">Controls automated job discovery & scoring</span>
              </div>

              {/* Target Job Titles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Job Titles * (At least 1 required)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.targetJobTitles.map((title, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      {title}
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile((p) => ({
                            ...p,
                            targetJobTitles: p.targetJobTitles.filter((_, i) => i !== idx),
                          }))
                        }
                        className="hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTitle.trim()) {
                        e.preventDefault();
                        updateProfile((p) => ({
                          ...p,
                          targetJobTitles: [...p.targetJobTitles, newTitle.trim()],
                        }));
                        setNewTitle('');
                      }
                    }}
                    placeholder="e.g. Senior Full Stack Engineer, Tech Lead (Press Enter)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTitle.trim()) {
                        updateProfile((p) => ({
                          ...p,
                          targetJobTitles: [...p.targetJobTitles, newTitle.trim()],
                        }));
                        setNewTitle('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold"
                  >
                    Add Title
                  </button>
                </div>
                {errors.targetJobTitles && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.targetJobTitles}</p>
                )}
              </div>

              {/* Preferred Locations */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Job Locations (Cities, States, or Remote)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.preferredLocations.map((loc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {loc}
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile((p) => ({
                            ...p,
                            preferredLocations: p.preferredLocations.filter((_, i) => i !== idx),
                          }))
                        }
                        className="hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLocation.trim()) {
                        e.preventDefault();
                        updateProfile((p) => ({
                          ...p,
                          preferredLocations: [...p.preferredLocations, newLocation.trim()],
                        }));
                        setNewLocation('');
                      }
                    }}
                    placeholder="e.g. Remote, San Francisco, CA, New York, NY (Press Enter)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newLocation.trim()) {
                        updateProfile((p) => ({
                          ...p,
                          preferredLocations: [...p.preferredLocations, newLocation.trim()],
                        }));
                        setNewLocation('');
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    Add Location
                  </button>
                </div>
              </div>

              {/* Work Arrangement & Authorization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Work Arrangement Preference
                  </label>
                  <select
                    value={profile.workPreference}
                    onChange={(e: any) =>
                      updateProfile((p) => ({ ...p, workPreference: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="remote">Remote Only</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-Site</option>
                    <option value="any">Open to Any (Remote, Hybrid, Onsite)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Work Authorization Status (For Form Answering)
                  </label>
                  <input
                    type="text"
                    value={profile.workAuthorization}
                    onChange={(e) =>
                      updateProfile((p) => ({ ...p, workAuthorization: e.target.value }))
                    }
                    placeholder="US Citizen / Authorized without sponsorship"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Desired Minimum Salary ($/year)
                  </label>
                  <input
                    type="number"
                    value={profile.salaryRange.min}
                    onChange={(e) =>
                      updateProfile((p) => ({
                        ...p,
                        salaryRange: { ...p.salaryRange, min: Number(e.target.value) },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Desired Maximum Salary ($/year)
                  </label>
                  <input
                    type="number"
                    value={profile.salaryRange.max}
                    onChange={(e) =>
                      updateProfile((p) => ({
                        ...p,
                        salaryRange: { ...p.salaryRange, max: Number(e.target.value) },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Experience */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    3. Work Experience & Achievements
                  </h2>
                  <p className="text-xs text-slate-400">Strictly verified facts used in ATS resumes and screening answers</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newExp: ExperienceItem = {
                      id: `exp_${Date.now()}`,
                      company: 'New Company',
                      position: 'Software Engineer',
                      location: 'Remote',
                      startDate: '2022-01',
                      endDate: '',
                      current: true,
                      description: 'Architecting scalable enterprise cloud applications.',
                      highlights: [
                        'Spearheaded core feature development resulting in measurable performance improvement.',
                      ],
                    };
                    updateProfile((p) => ({ ...p, experience: [newExp, ...p.experience] }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Position
                </button>
              </div>

              <div className="space-y-6">
                {profile.experience.map((exp, idx) => (
                  <div key={exp.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        Position #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile((p) => ({
                            ...p,
                            experience: p.experience.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Company *</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProfile((p) => ({
                              ...p,
                              experience: p.experience.map((item, i) =>
                                i === idx ? { ...item, company: val } : item
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Job Title *</label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProfile((p) => ({
                              ...p,
                              experience: p.experience.map((item, i) =>
                                i === idx ? { ...item, position: val } : item
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProfile((p) => ({
                              ...p,
                              experience: p.experience.map((item, i) =>
                                i === idx ? { ...item, location: val } : item
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                          placeholder="San Francisco, CA (Hybrid)"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Start Date</label>
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateProfile((p) => ({
                                ...p,
                                experience: p.experience.map((item, i) =>
                                  i === idx ? { ...item, startDate: val } : item
                                ),
                              }));
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                            placeholder="2022-03"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            {exp.current ? 'Current Role' : 'End Date'}
                          </label>
                          <input
                            type="text"
                            disabled={exp.current}
                            value={exp.current ? 'Present' : exp.endDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateProfile((p) => ({
                                ...p,
                                experience: p.experience.map((item, i) =>
                                  i === idx ? { ...item, endDate: val } : item
                                ),
                              }));
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                            placeholder="2024-01"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`current_role_${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateProfile((p) => ({
                            ...p,
                            experience: p.experience.map((item, i) =>
                              i === idx ? { ...item, current: checked, endDate: checked ? '' : item.endDate } : item
                            ),
                          }));
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`current_role_${exp.id}`} className="text-xs font-semibold text-slate-700">
                        I currently work in this role
                      </label>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Accomplishments & Bullets (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={exp.highlights.join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          updateProfile((p) => ({
                            ...p,
                            experience: p.experience.map((item, i) =>
                              i === idx ? { ...item, highlights: lines } : item
                            ),
                          }));
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white leading-relaxed focus:border-indigo-500 outline-none"
                        placeholder="Accomplished [X] as measured by [Y] by doing [Z]."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Education */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">4. Education Background</h2>
                <button
                  type="button"
                  onClick={() => {
                    const newEdu: EducationItem = {
                      id: `edu_${Date.now()}`,
                      institution: 'University Name',
                      degree: 'Bachelor of Science',
                      fieldOfStudy: 'Computer Science',
                      startDate: '2017',
                      endDate: '2021',
                      current: false,
                      grade: '3.8 GPA',
                    };
                    updateProfile((p) => ({ ...p, education: [...p.education, newEdu] }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Degree
                </button>
              </div>

              <div className="space-y-4">
                {profile.education.map((edu, idx) => (
                  <div key={edu.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        Education #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile((p) => ({
                            ...p,
                            education: p.education.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Institution *</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProfile((p) => ({
                              ...p,
                              education: p.education.map((item, i) =>
                                i === idx ? { ...item, institution: val } : item
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                          placeholder="University of California, Berkeley"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Degree *</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProfile((p) => ({
                              ...p,
                              education: p.education.map((item, i) =>
                                i === idx ? { ...item, degree: val } : item
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                          placeholder="Bachelor of Science"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Field of Study</label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProfile((p) => ({
                              ...p,
                              education: p.education.map((item, i) =>
                                i === idx ? { ...item, fieldOfStudy: val } : item
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                          placeholder="Computer Science"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Graduation Year</label>
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateProfile((p) => ({
                                ...p,
                                education: p.education.map((item, i) =>
                                  i === idx ? { ...item, endDate: val } : item
                                ),
                              }));
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                            placeholder="2021"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Grade / GPA</label>
                          <input
                            type="text"
                            value={edu.grade || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateProfile((p) => ({
                                ...p,
                                education: p.education.map((item, i) =>
                                  i === idx ? { ...item, grade: val } : item
                                ),
                              }));
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                            placeholder="3.8 GPA"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Skills & Certifications */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  5. Categorized Skills & Certifications
                </h2>
                <span className="text-xs text-slate-400 font-medium">Used directly for job description match scoring</span>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Skills Inventory ({profile.skills.length} Total)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.skills.map((skill, idx) => (
                    <span
                      key={skill.id || idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-sm"
                    >
                      <span className="text-[10px] text-indigo-600 font-extrabold uppercase">
                        [{skill.category}]
                      </span>
                      {skill.name}
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile((p) => ({
                            ...p,
                            skills: p.skills.filter((_, i) => i !== idx),
                          }))
                        }
                        className="hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newSkillCategory}
                    onChange={(e: any) => setNewSkillCategory(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none font-semibold text-slate-700"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Frameworks">Frameworks</option>
                    <option value="Tools">Tools & Cloud</option>
                    <option value="Soft Skills">Soft Skills</option>
                  </select>

                  <select
                    value={newSkillLevel}
                    onChange={(e: any) => setNewSkillLevel(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none font-semibold text-slate-700"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>

                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Skill name (e.g. Next.js, Docker, PostgreSQL)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSkillName.trim()) {
                        e.preventDefault();
                        updateProfile((p) => ({
                          ...p,
                          skills: [
                            ...p.skills,
                            {
                              id: `sk_${Date.now()}`,
                              name: newSkillName.trim(),
                              category: newSkillCategory,
                              level: newSkillLevel,
                            },
                          ],
                        }));
                        setNewSkillName('');
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (newSkillName.trim()) {
                        updateProfile((p) => ({
                          ...p,
                          skills: [
                            ...p.skills,
                            {
                              id: `sk_${Date.now()}`,
                              name: newSkillName.trim(),
                              category: newSkillCategory,
                              level: newSkillLevel,
                            },
                          ],
                        }));
                        setNewSkillName('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Add Skill
                  </button>
                </div>
              </div>

              {/* Certifications */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Certifications & Licenses
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCert: CertificationItem = {
                        id: `cert_${Date.now()}`,
                        name: 'New Certification Title',
                        issuer: 'Issuing Body (e.g. AWS)',
                        issueDate: '2023-04',
                      };
                      updateProfile((p) => ({
                        ...p,
                        certifications: [...p.certifications, newCert],
                      }));
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    + Add Certification
                  </button>
                </div>

                <div className="space-y-3">
                  {profile.certifications.map((cert, idx) => (
                    <div key={cert.id} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProfile((p) => ({
                            ...p,
                            certifications: p.certifications.map((c, i) =>
                              i === idx ? { ...c, name: val } : c
                            ),
                          }));
                        }}
                        className="flex-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                        placeholder="Certificate Name"
                      />
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProfile((p) => ({
                            ...p,
                            certifications: p.certifications.map((c, i) =>
                              i === idx ? { ...c, issuer: val } : c
                            ),
                          }));
                        }}
                        className="flex-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                        placeholder="Issuer (e.g. AWS, Microsoft)"
                      />
                      <input
                        type="text"
                        value={cert.issueDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProfile((p) => ({
                            ...p,
                            certifications: p.certifications.map((c, i) =>
                              i === idx ? { ...c, issueDate: val } : c
                            ),
                          }));
                        }}
                        className="w-full sm:w-28 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                        placeholder="2023-04"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile((p) => ({
                            ...p,
                            certifications: p.certifications.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Projects & Languages */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  6. Portfolio Projects & Languages
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const newProj: ProjectItem = {
                      id: `proj_${Date.now()}`,
                      title: 'Project Title',
                      description: 'Concise project overview demonstrating technical impact.',
                      techStack: ['Next.js', 'TypeScript', 'PostgreSQL'],
                      bullets: ['Engineered full-stack features with 99.9% reliability.'],
                    };
                    updateProfile((p) => ({ ...p, projects: [...p.projects, newProj] }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Project
                </button>
              </div>

              {/* Projects */}
              <div className="space-y-5">
                {profile.projects.map((proj, idx) => (
                  <div key={proj.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        Project #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile((p) => ({
                            ...p,
                            projects: p.projects.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Project Name *</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProfile((p) => ({
                              ...p,
                              projects: p.projects.map((item, i) =>
                                i === idx ? { ...item, title: val } : item
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Live URL or Repo Link</label>
                        <input
                          type="text"
                          value={proj.liveUrl || proj.repoUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProfile((p) => ({
                              ...p,
                              projects: p.projects.map((item, i) =>
                                i === idx ? { ...item, liveUrl: val } : item
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                          placeholder="https://github.com/user/project"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Technologies Used (comma separated)
                      </label>
                      <input
                        type="text"
                        value={proj.techStack.join(', ')}
                        onChange={(e) => {
                          const list = e.target.value.split(',').map((s) => s.trim());
                          updateProfile((p) => ({
                            ...p,
                            projects: p.projects.map((item, i) =>
                              i === idx ? { ...item, techStack: list } : item
                            ),
                          }));
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        placeholder="React, TypeScript, AWS, Node.js"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Bullet Points / Key Highlights (One per line)
                      </label>
                      <textarea
                        rows={2}
                        value={proj.bullets.join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          updateProfile((p) => ({
                            ...p,
                            projects: p.projects.map((item, i) =>
                              i === idx ? { ...item, bullets: lines } : item
                            ),
                          }));
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Languages */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Languages Spoken
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.languages.map((lang, idx) => (
                    <span
                      key={lang.id || idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {lang.name} ({lang.proficiency})
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile((p) => ({
                            ...p,
                            languages: p.languages.filter((_, i) => i !== idx),
                          }))
                        }
                        className="hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newLangName}
                    onChange={(e) => setNewLangName(e.target.value)}
                    placeholder="Language (e.g. English, Spanish, German)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none"
                  />
                  <select
                    value={newLangProficiency}
                    onChange={(e: any) => setNewLangProficiency(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none font-semibold text-slate-700"
                  >
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Professional">Professional</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Basic">Basic</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (newLangName.trim()) {
                        updateProfile((p) => ({
                          ...p,
                          languages: [
                            ...p.languages,
                            {
                              id: `lang_${Date.now()}`,
                              name: newLangName.trim(),
                              proficiency: newLangProficiency,
                            },
                          ],
                        }));
                        setNewLangName('');
                      }
                    }}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
                  >
                    Add Language
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Tab
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => saveProfile(false)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Progress'}
              </button>

              <button
                type="button"
                onClick={() => saveProfile(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
              >
                <span>{currentStep === 6 ? 'Save & Review Resumes' : 'Save & Next Tab'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
