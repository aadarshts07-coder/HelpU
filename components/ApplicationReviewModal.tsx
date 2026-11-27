'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Send,
  ThumbsDown,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { ApplicationRecord } from '@/lib/types';

interface ApplicationReviewModalProps {
  isOpen: boolean;
  application: ApplicationRecord | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
}

export default function ApplicationReviewModal({
  isOpen,
  application,
  onClose,
  onApprove,
  onSkip,
}: ApplicationReviewModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'coverletter'>('overview');

  if (!isOpen || !application) return null;

  const handleApproveClick = async () => {
    setSubmitting(true);
    try {
      await onApprove(application.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipClick = async () => {
    setSubmitting(true);
    try {
      await onSkip(application.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleUp max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                  Stealth Review Gate
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {application.jobTitle}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{application.company}</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5" />
              <span>{application.location}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                {application.portal}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 gap-3 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Form Answers & Screening
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coverletter')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'coverletter'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Tailored Cover Letter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resume')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'resume'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Resume Version ({application.tailoredResumeVersion || 'v1'})
          </button>
        </div>

        {/* Content body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100/80">
                <p className="text-indigo-950 font-bold mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Review Before Dispatch</span>
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  All answers and materials have been prepared based on your approved profile and the target job description. Approve to let Playwright submit securely.
                </p>
              </div>

              {/* Questions Answered */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Screening Questions & Form Answers
                </h4>
                {application.questionsAnswered && application.questionsAnswered.length > 0 ? (
                  application.questionsAnswered.map((qa, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">{qa.question}</p>
                      <p className="text-slate-600 italic">"{qa.answer}"</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 italic">
                    Standard profile fields (Full Name, Contact, Work Authorization, Portfolio, Experience) pre-filled.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'coverletter' && (
            <div className="space-y-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                {application.coverLetter || `Dear Hiring Team,\n\nI am writing to express my strong interest in the ${application.jobTitle} position at ${application.company}. With a proven track record delivering robust full-stack solutions and high-performance applications, I am eager to contribute to your engineering goals.\n\nThank you for your consideration.\n\nSincerely,\nCandidate`}
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">
                  Targeted ATS Resume Profile
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Tailored specifically to match {application.jobTitle} with optimized keyword density and XYZ achievement framing.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-[11px]">
                    Match Score: {application.matchScore}%
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 text-[11px]">
                    ATS Verified
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkipClick}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Skip this Job</span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={application.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Portal</span>
            </a>

            <button
              type="button"
              onClick={handleApproveClick}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Approve & Submit Now'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
