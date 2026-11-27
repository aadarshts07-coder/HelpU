'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PageSlotReveal from '@/components/PageSlotReveal';
import TwoFactorSettingsModal from '@/components/TwoFactorSettingsModal';
import { 
  Settings, 
  ShieldCheck, 
  Sliders, 
  Lock, 
  Trash2, 
  Download, 
  Save, 
  AlertTriangle, 
  Pause, 
  Play, 
  KeyRound,
  CheckCircle2,
  Mail,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { UserSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Blacklist chips input
  const [newCompany, setNewCompany] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Credentials inputs
  const [linkedinPass, setLinkedinPass] = useState('');
  const [indeedPass, setIndeedPass] = useState('');
  const [naukriPass, setNaukriPass] = useState('');

  // GDPR Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorActive, setTwoFactorActive] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload: any = { ...settings };

      // Passwords to encrypt
      if (linkedinPass || indeedPass || naukriPass) {
        payload.portalCredentials = {
          linkedin: {
            username: settings.portalCredentials.linkedin?.username || '',
            ...(linkedinPass ? { password: linkedinPass } : {}),
          },
          indeed: {
            username: settings.portalCredentials.indeed?.username || '',
            ...(indeedPass ? { password: indeedPass } : {}),
          },
          naukri: {
            username: settings.portalCredentials.naukri?.username || '',
            ...(naukriPass ? { password: naukriPass } : {}),
          },
        };
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setLinkedinPass('');
        setIndeedPass('');
        setNaukriPass('');
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    window.open('/api/data/export', '_blank');
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/data/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: 'DELETE' }),
      });
      if (res.ok) {
        alert('All your user profile and application data has been permanently purged.');
        window.location.href = '/';
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <PageSlotReveal pageTitle="Settings and Privacy">
        <main className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" />
              <span>Settings, Automation & Privacy Controls</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure automation thresholds, review modes, portal credentials encryption, and data rights.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-100 transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Settings'}</span>
          </button>
        </div>

        {/* 1. Automation & Application Pace Controls */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Automation Engine & Rate Limits</span>
            </h2>

            {/* Pause/Resume Switch */}
            <button
              onClick={() => setSettings({ ...settings, isPaused: !settings.isPaused })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                settings.isPaused
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {settings.isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume Automation
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  Pause Automation
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Daily Application Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Daily Application Limit
                </label>
                <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {settings.dailyApplicationLimit} / day
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={settings.dailyApplicationLimit}
                onChange={(e) => setSettings({ ...settings, dailyApplicationLimit: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Default 20. Safeguards your account against aggressive rate limits and spam triggers.
              </p>
            </div>

            {/* Job Match Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Job Match Threshold (0-100)
                </label>
                <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {settings.jobMatchThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={95}
                value={settings.jobMatchThreshold}
                onChange={(e) => setSettings({ ...settings, jobMatchThreshold: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Default 70%. Playwright will only submit to jobs matching your profile at or above this score.
              </p>
            </div>

            {/* Review Mode Toggle */}
            <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Submission Review Mode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setSettings({ ...settings, reviewMode: 'ask_before_submitting' })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    settings.reviewMode === 'ask_before_submitting'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Ask me before submitting</span>
                    {settings.reviewMode === 'ask_before_submitting' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] font-normal text-slate-500 leading-relaxed">
                    Playwright fills the form and captures a screenshot. Holds the submission in "Pending review" until you click 1-click Approve.
                  </p>
                </label>

                <label
                  onClick={() => setSettings({ ...settings, reviewMode: 'auto_submit' })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    settings.reviewMode === 'auto_submit'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Auto-Submit (Full Autonomy)</span>
                    {settings.reviewMode === 'auto_submit' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] font-normal text-slate-500 leading-relaxed">
                    Playwright automatically clicks submit after filling answers and uploading your tailored resume.
                  </p>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* 2. Blacklist Filtering */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Company & Keyword Blacklists
          </h2>
          <p className="text-xs text-slate-500">
            Jobs matching these companies or descriptions will be automatically bypassed from auto-apply.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Blacklisted Companies
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.blacklistedCompanies.map((comp, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  {comp}
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        blacklistedCompanies: settings.blacklistedCompanies.filter((_, i) => i !== idx),
                      })
                    }
                    className="hover:text-red-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCompany.trim()) {
                    e.preventDefault();
                    setSettings({
                      ...settings,
                      blacklistedCompanies: [...settings.blacklistedCompanies, newCompany.trim()],
                    });
                    setNewCompany('');
                  }
                }}
                placeholder="Company name to ignore (Press Enter to add)"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none"
              />
              <button
                onClick={() => {
                  if (newCompany.trim()) {
                    setSettings({
                      ...settings,
                      blacklistedCompanies: [...settings.blacklistedCompanies, newCompany.trim()],
                    });
                    setNewCompany('');
                  }
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                Add Company
              </button>
            </div>
          </div>
        </div>

        {/* 3. Encrypted Stored Credentials */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                <span>Job Portal Credentials (AES-256 Encrypted)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved securely using AES-256-GCM. Used only when portal login walls are encountered.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Encrypted at Rest
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* LinkedIn */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800">LinkedIn Login</span>
              <input
                type="text"
                value={settings.portalCredentials.linkedin?.username || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    portalCredentials: {
                      ...settings.portalCredentials,
                      linkedin: { ...settings.portalCredentials.linkedin, username: e.target.value },
                    },
                  })
                }
                placeholder="Username / Email"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="password"
                value={linkedinPass}
                onChange={(e) => setLinkedinPass(e.target.value)}
                placeholder="Update Password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            {/* Indeed */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800">Indeed Login</span>
              <input
                type="text"
                value={settings.portalCredentials.indeed?.username || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    portalCredentials: {
                      ...settings.portalCredentials,
                      indeed: { ...settings.portalCredentials.indeed, username: e.target.value },
                    },
                  })
                }
                placeholder="Username / Email"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="password"
                value={indeedPass}
                onChange={(e) => setIndeedPass(e.target.value)}
                placeholder="Update Password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            {/* Naukri */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800">Naukri Login</span>
              <input
                type="text"
                value={settings.portalCredentials.naukri?.username || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    portalCredentials: {
                      ...settings.portalCredentials,
                      naukri: { ...settings.portalCredentials.naukri, username: e.target.value },
                    },
                  })
                }
                placeholder="Username / Email"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="password"
                value={naukriPass}
                onChange={(e) => setNaukriPass(e.target.value)}
                placeholder="Update Password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 4. Account Security & Two-Factor Authentication */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Account Security & Verification</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Protect your account with multi-factor authentication, verified email, and password controls.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Email Verified</span>
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* 2FA Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    Two-Factor Authentication (2FA / TOTP)
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                    Require a 6-digit code from Google Authenticator, Authy, or 1Password when signing in.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTwoFactorModal(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 ${
                  twoFactorActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{twoFactorActive ? '2FA Active (Configure)' : 'Enable 2FA'}</span>
              </button>
            </div>

            {/* Password & Active Session Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Account Password</p>
                  <p className="text-[11px] text-slate-500">Encrypted with memory-hard scrypt</p>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Change →
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Active Session</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">Active now • AES-256 GCM</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/login';
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Privacy, GDPR Export & Account Deletion */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Data Ownership & Privacy Rights
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            HELP U complies with GDPR & CCPA privacy standards. We never sell your personal information or application history.
          </p>
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 text-[11px] text-indigo-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold text-slate-900 block">Location Privacy Guarantee</strong>
              <p className="text-slate-600 leading-relaxed">
                When you use "Use My Precise Location", coordinates are used solely in memory to detect nearby job openings within your chosen radius. We round coordinates to approximately 1 km before performing geo-queries and never log or permanently store your exact coordinates.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Export All Data</p>
              <p className="text-[11px] text-slate-500">Download a complete JSON export of your profile, applications, and logs.</p>
            </div>
            <button
              onClick={handleExportData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export Data (JSON)</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-rose-600">Delete All My Data</p>
              <p className="text-[11px] text-slate-500">Permanently purge your account, credentials, resumes, and application history.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge All Data</span>
            </button>
          </div>
        </div>

      </main>
      </PageSlotReveal>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-extrabold text-slate-900 text-base">Permanently Purge Data?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action cannot be undone. All your stored profile details, generated resumes, job credentials, application tracker history, and screenshots will be wiped immediately.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Type DELETE to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 outline-none focus:border-rose-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                {isDeleting ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Setup Modal */}
      <TwoFactorSettingsModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        onSuccess={() => setTwoFactorActive(true)}
      />

    </div>
  );
}
