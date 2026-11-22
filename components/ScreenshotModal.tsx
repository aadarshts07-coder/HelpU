'use client';

import React from 'react';
import Link from 'next/link';
import { X, ExternalLink, ShieldAlert, CheckCircle, HelpCircle, Edit3, SkipForward, Check } from 'lucide-react';
import { ApplicationRecord } from '@/lib/types';

interface ScreenshotModalProps {
  application: ApplicationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onSkip?: (id: string) => void;
}

export default function ScreenshotModal({ application, isOpen, onClose, onApprove, onSkip }: ScreenshotModalProps) {
  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg">{application.jobTitle}</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                {application.portal}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {application.company} • {application.location} • Match Score: <strong className="text-indigo-600">{application.matchScore}%</strong>
              {application.tailoredResumeVersion && (
                <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                  Using Resume: {application.tailoredResumeVersion}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout Banner */}
        <div className="mt-4">
          {application.status === 'Needs manual action' && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Manual Intervention Needed ({application.requiresAttentionReason})</p>
                <p className="mt-0.5 text-amber-800">{application.statusReason}</p>
              </div>
            </div>
          )}

          {application.status === 'Pending review' && (
            <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-3">
              <div className="flex items-start gap-3 text-xs text-indigo-950">
                <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Review Mode — Awaiting Your Sign-Off</p>
                  <p className="mt-0.5 text-indigo-800">{application.statusReason}</p>
                </div>
              </div>

              {/* Action Buttons: Approve / Edit / Skip */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-200/60 justify-end">
                {onSkip && (
                  <button
                    onClick={() => {
                      onSkip(application.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    Skip Job
                  </button>
                )}

                <Link
                  href="/profile"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile / Details
                </Link>

                {onApprove && (
                  <button
                    onClick={() => {
                      onApprove(application.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve & Submit
                  </button>
                )}
              </div>
            </div>
          )}

          {application.status === 'Applied' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Application Successfully Submitted</p>
                <p className="mt-0.5 text-emerald-800">{application.statusReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Screening Questions Answered By Claude */}
        {application.questionsAnswered && application.questionsAnswered.length > 0 && (
          <div className="mt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Screening Questions Answered from Profile
            </h4>
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              {application.questionsAnswered.map((q, idx) => (
                <div key={idx} className="pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                  <p className="font-bold text-slate-800">Q: {q.question}</p>
                  <p className="text-slate-600 mt-1 pl-3 border-l-2 border-indigo-400 font-medium">A: {q.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Playwright Verification Screenshots */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Verification Screenshots Log ({application.screenshots.length})
          </h4>

          {application.screenshots.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
              No screenshots captured for this submission.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-80 overflow-y-auto p-1">
              {application.screenshots.map((shot, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5">
                  <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 flex justify-between items-center">
                    <span>Screenshot #{idx + 1} — Verification Audit</span>
                    <a
                      href={shot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      Open Full Size <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <img
                    src={shot}
                    alt={`Playwright run step ${idx + 1}`}
                    className="w-full object-contain max-h-72 bg-white"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
          <a
            href={application.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Visit Original Job Portal Page <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
