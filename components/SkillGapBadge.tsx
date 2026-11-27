'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  X, 
  Lightbulb, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface SkillGapBadgeProps {
  score: number;
  matchReasons?: string[];
  missingSkills?: string[];
  jobTitle?: string;
  company?: string;
  compact?: boolean;
}

export default function SkillGapBadge({
  score,
  matchReasons = [],
  missingSkills = [],
  jobTitle = 'Role',
  company = 'Company',
  compact = false,
}: SkillGapBadgeProps) {
  const [showDrawer, setShowDrawer] = useState(false);

  // Categorize fit tier
  let tierLabel = 'Reach Role';
  let tierStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <AlertCircle className="w-3.5 h-3.5 text-slate-500" />;

  if (score >= 90) {
    tierLabel = 'Great Fit';
    tierStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
  } else if (score >= 75) {
    tierLabel = 'Good Fit';
    tierStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    icon = <Sparkles className="w-3.5 h-3.5 text-indigo-600" />;
  } else if (score >= 60) {
    tierLabel = 'Moderate Fit';
    tierStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    icon = <Lightbulb className="w-3.5 h-3.5 text-amber-600" />;
  }

  // Derive default skills if none provided
  const displayMatches = matchReasons && matchReasons.length > 0 
    ? matchReasons 
    : ['Core tech stack matches candidate profile', 'Seniority & experience level aligned'];

  const displayMissing = missingSkills && missingSkills.length > 0 
    ? missingSkills 
    : ['Niche domain frameworks', 'Internal cloud infrastructure tools'];

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDrawer(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 ${tierStyle}`}
        title="Click to inspect matching skills & gaps"
      >
        {icon}
        <span>{score}% Match</span>
        {!compact && (
          <span className="opacity-75 font-medium ml-0.5">• {tierLabel}</span>
        )}
      </button>

      {/* Slide-over Detail Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleUp">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierStyle}`}>
                    {icon}
                    <span>{score}% Match • {tierLabel}</span>
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-2">
                  Fit Analysis: {jobTitle}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {company} • Powered by HELP U Fit Engine
                </p>
              </div>

              <button
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Matched Strengths */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Matching Qualifications ({displayMatches.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {displayMatches.map((m, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-emerald-50/70 text-emerald-900 px-3 py-2 rounded-xl border border-emerald-100/80 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Gaps & Talking Points */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Skill Gaps & Recommended Talking Points ({displayMissing.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {displayMissing.map((g, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-amber-50/70 text-amber-900 px-3 py-2 rounded-xl border border-amber-100/80 flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{g}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full shrink-0">
                        Address in prep
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation Callout */}
              <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 p-3.5 rounded-2xl border border-indigo-100">
                <p className="text-xs text-indigo-950 font-semibold mb-1">
                  How to tackle missing skills in interviews:
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Frame missing items as rapid-learning opportunities. Highlight adjacent competencies you have mastered quickly in prior roles.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <Link
                href={`/interview-prep?role=${encodeURIComponent(jobTitle)}&company=${encodeURIComponent(company)}`}
                onClick={() => setShowDrawer(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Practice Interview for this Role</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
