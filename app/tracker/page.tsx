'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ScreenshotModal from '@/components/ScreenshotModal';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  ExternalLink, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Eye,
  Building2,
  Calendar,
  ThumbsUp
} from 'lucide-react';
import { ApplicationRecord, ApplicationStatus } from '@/lib/types';

export default function TrackerPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [portalFilter, setPortalFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/apply/status');
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await fetch('/api/apply/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action: 'approve' }),
      });
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkip = async (id: string) => {
    try {
      await fetch('/api/apply/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action: 'skip', notes: 'Skipped by user in review mode.' }),
      });
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await fetch('/api/apply/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, notes: `Status manually updated to ${newStatus}` }),
      });
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (portalFilter !== 'ALL' && app.portal.toLowerCase() !== portalFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.jobTitle.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q) ||
        app.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-indigo-600" />
              <span>Application Tracker & Verification Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live audit logs for every automated Playwright submission, complete with verification screenshots and review approvals.
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchApplications();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications by role, company, location..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Pending review">Pending Review</option>
                <option value="Needs manual action">Needs Manual Action</option>
                <option value="Interview">Interview</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Portal:</span>
              <select
                value={portalFilter}
                onChange={(e) => setPortalFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium outline-none"
              >
                <option value="ALL">All Portals</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Naukri">Naukri</option>
                <option value="Greenhouse">Greenhouse</option>
                <option value="Lever">Lever</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-medium ml-auto md:ml-0">
              Showing {filteredApps.length} applications
            </span>
          </div>
        </div>

        {/* Tracker Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Role & Company</th>
                  <th className="py-3.5 px-4">Portal</th>
                  <th className="py-3.5 px-4">Match Score</th>
                  <th className="py-3.5 px-4">Status & Reason</th>
                  <th className="py-3.5 px-4">Screenshots</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Job Title & Company */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-extrabold text-slate-900 text-sm">{app.jobTitle}</div>
                        <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{app.company}</span>
                          <span>•</span>
                          <span>{app.location}</span>
                        </div>
                      </td>

                      {/* Portal */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {app.portal}
                        </span>
                      </td>

                      {/* Match Score */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                          {app.matchScore}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 max-w-xs">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${
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
                        {app.statusReason && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                            {app.statusReason}
                          </p>
                        )}
                      </td>

                      {/* Screenshots */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200 font-semibold"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{app.screenshots.length} shots</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right space-x-2">
                        {app.status === 'Pending review' && (
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all"
                          >
                            Approve & Submit
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          title="View Full Logs & Verification"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <a
                          href={app.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors inline-block"
                          title="Open original job page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <ScreenshotModal
        isOpen={Boolean(selectedApp)}
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onApprove={handleApprove}
        onSkip={handleSkip}
      />
    </div>
  );
}
