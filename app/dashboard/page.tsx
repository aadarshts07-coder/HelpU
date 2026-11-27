'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PageSlotReveal from '@/components/PageSlotReveal';
import StatsCard from '@/components/StatsCard';
import GaugeMeter from '@/components/GaugeMeter';
import SpeedometerGauge from '@/components/SpeedometerGauge';
import ScreenshotModal from '@/components/ScreenshotModal';
import ConsentModal from '@/components/ConsentModal';
import { 
  Send, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Sparkles, 
  Search, 
  FileText, 
  ExternalLink, 
  Play, 
  Pause,
  ArrowUpRight,
  TrendingUp,
  Eye
} from 'lucide-react';
import { DashboardMetrics, ApplicationRecord, UserSettings, UserProfile } from '@/lib/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const loadData = async () => {
    try {
      const [appRes, setRes, profRes] = await Promise.all([
        fetch('/api/apply/status'),
        fetch('/api/settings'),
        fetch('/api/profile'),
      ]);

      const appData = await appRes.json();
      const setData = await setRes.json();
      const profData = await profRes.json();

      if (appData.metrics) setMetrics(appData.metrics);
      if (appData.applications) setApplications(appData.applications);
      if (setData.settings) {
        setSettings(setData.settings);
        if (!setData.settings.consentGiven) {
          setShowConsentModal(true);
        }
      }
      if (profData.profile) setProfile(profData.profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConsent = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentGiven: true, consentTimestamp: new Date().toISOString() }),
      });
      setShowConsentModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch('/api/apply/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <PageSlotReveal pageTitle="Dashboard">
        <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* Welcome & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Welcome back, {profile?.name?.split(' ')[0] || 'Alex'}</span>
              <span className="text-xl">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              HELP U autonomous application agent is active. Monitoring job boards and queuing matching roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Search & Auto-Apply</span>
            </Link>

            <Link
              href="/resume"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Resume Editor</span>
            </Link>
          </div>
        </div>

        {/* Top Metrics Cards with Skeleton Shimmer Support & Staggered Animations */}
        {loading && !metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <StatsCard key={i} title="" icon={Send} loading={true} index={i} />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Applications Sent with Daily Progress Bar */}
            <StatsCard
              title="Applications Sent"
              value={metrics.applicationsSent}
              icon={Send}
              badge="Submitted"
              badgeColor="indigo"
              subtitle={`Today: ${metrics.dailyApplicationsCount} / ${metrics.dailyLimit}`}
              progressBarPercent={(metrics.dailyApplicationsCount / Math.max(1, metrics.dailyLimit)) * 100}
              index={0}
            />

            {/* Card 2: Redesigned 270° Modern Radial Gauge with Sample Size & Tooltip */}
            <StatsCard
              title="Success Rate"
              icon={TrendingUp}
              subtitle={`${metrics.applicationsSent} of ${metrics.applicationsSent} submitted`}
              trend="↑ High pass"
              index={1}
            >
              <GaugeMeter
                value={metrics.successRate}
                sampleSize={`${metrics.applicationsSent} of ${metrics.applicationsSent} submitted`}
                label="success"
                statusBadge="Verified"
                size={116}
                tooltipBreakdown={{
                  submitted: metrics.applicationsSent,
                  failed: 0,
                  pending: metrics.pendingReview,
                  manualAction: metrics.needsManualAction,
                }}
              />
            </StatsCard>

            {/* Card 3: Pending Review (No stray dash, aligned height) */}
            <StatsCard
              title="Pending Review"
              value={metrics.pendingReview}
              icon={Clock}
              badge="Needs Sign-off"
              badgeColor="amber"
              subtitle="Review Mode active"
              index={2}
            />

            {/* Card 4: Manual Action (Clean spacing & alignment) */}
            <StatsCard
              title="Manual Action"
              value={metrics.needsManualAction}
              icon={AlertTriangle}
              badge="CAPTCHA / Login"
              badgeColor="rose"
              subtitle="Paused safely"
              index={3}
            />

            {/* Card 5: Interviews (With sparkle/pulse effect on +1 this week) */}
            <StatsCard
              title="Interviews"
              value={metrics.interviewsReceived}
              icon={Users}
              badge="Progressing"
              badgeColor="emerald"
              trend="🎉 +1 this week"
              sparkle={true}
              index={4}
            />
          </div>
        ) : null}

        {/* Automation Status Banner */}
        {settings && (
          <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-indigo-50/40 border border-indigo-100/90 rounded-3xl p-6 sm:p-8 shadow-light-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 text-indigo-800 text-xs font-bold border border-indigo-200/60">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Stealth Background Worker Configuration</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {settings.isPaused ? 'Automation is Paused' : 'Automation is Actively Running'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applying to jobs with match score &gt;= <strong className="text-slate-900">{settings.jobMatchThreshold}%</strong>. Daily limit: <strong className="text-slate-900">{settings.dailyApplicationLimit} applications/day</strong>. Review Mode: <strong className="text-slate-900">{settings.reviewMode === 'ask_before_submitting' ? 'Ask me before submitting' : 'Auto-submit enabled'}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/settings"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-xs"
              >
                Modify Limits & Blacklist
              </Link>
              <Link
                href="/tracker"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <span>Open Full Tracker</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Recent Applications Activity Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Applications & Verification Logs</h2>
            <Link href="/tracker" className="text-xs font-bold text-indigo-600 hover:underline">
              View All ({applications.length}) →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 5).map((app, idx) => (
                <div
                  key={app.id}
                  style={{ animationDelay: `${idx * 65}ms` }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors animate-row-cascade"
                >
                  
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                      {app.company.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">{app.jobTitle}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {app.portal}
                        </span>
                        <SpeedometerGauge
                          value={app.matchScore}
                          size="sm"
                        />
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        {app.company} • {app.location} • {new Date(app.updatedAt).toLocaleDateString()}
                      </p>

                      {app.statusReason && (
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
                          ↳ {app.statusReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        app.status === 'Applied'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : app.status === 'Pending review'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : app.status === 'Needs manual action'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : app.status === 'Interview'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {app.status}
                    </span>

                    {/* View Details / Screenshot Modal Button */}
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Inspect screenshots & logs"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </button>

                    {/* Approve button for pending review */}
                    {app.status === 'Pending review' && (
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        Approve
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
      </PageSlotReveal>

      {/* Screenshot & Logs Modal */}
      <ScreenshotModal
        isOpen={Boolean(selectedApp)}
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onApprove={handleApprove}
      />

      {/* Security Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        onConsent={handleConsent}
        onCancel={() => setShowConsentModal(false)}
      />
    </div>
  );
}
