'use client';

import React from 'react';
import AnimatedNumber from './AnimatedNumber';
import { UserProfile } from '@/lib/types';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export interface ProfileCompletenessRingProps {
  profile: UserProfile | null;
  className?: string;
}

export function calculateProfileCompleteness(profile: UserProfile | null): number {
  if (!profile) return 0;
  let score = 0;

  // Name & Email (20%)
  if (profile.name?.trim() && profile.email?.trim()) score += 20;
  // Phone & Location (15%)
  if (profile.phone?.trim() && profile.location?.trim()) score += 15;
  // Summary (15%)
  if (profile.summary && profile.summary.trim().length >= 30) score += 15;
  // Target Job Titles (15%)
  if (Array.isArray(profile.targetJobTitles) && profile.targetJobTitles.length > 0) score += 15;
  // Experience (15%)
  if (Array.isArray(profile.experience) && profile.experience.length > 0) score += 15;
  // Education (10%)
  if (Array.isArray(profile.education) && profile.education.length > 0) score += 10;
  // Skills (10%)
  if (Array.isArray(profile.skills) && profile.skills.length >= 3) score += 10;

  return Math.min(100, Math.max(0, score));
}

export default function ProfileCompletenessRing({ profile, className = '' }: ProfileCompletenessRingProps) {
  const percentage = calculateProfileCompleteness(profile);

  // Determine tone & milestone
  const isComplete = percentage >= 100;
  const isHigh = percentage >= 80;
  const isMid = percentage >= 50;

  const color = isComplete
    ? '#10b981'
    : isHigh
    ? '#6366f1'
    : isMid
    ? '#f59e0b'
    : '#f43f5e';

  // SVG Ring Math
  const r = 16;
  const circumference = 2 * Math.PI * r; // ~100.53
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`inline-flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md ${className}`}>
      {/* Mini SVG Progress Ring */}
      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 38 38">
          <circle
            cx="19"
            cy="19"
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="3.5"
          />
          <circle
            cx="19"
            cy="19"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-[10px] font-black text-slate-800 tracking-tighter">
          {percentage}%
        </span>
      </div>

      {/* Label and Milestone Tag */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-900 tracking-tight">
            Profile Strength:
          </span>
          <span className="text-xs font-bold text-slate-600">
            <AnimatedNumber value={percentage} suffix="%" duration={900} />
          </span>
        </div>

        {/* Dynamic Milestone Badge */}
        <div className="flex items-center gap-1 mt-0.5">
          {isComplete ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-spring-pop">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>All ATS Fields Complete!</span>
            </span>
          ) : isHigh ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 animate-spring-pop">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Ready for Auto-Apply!</span>
            </span>
          ) : isMid ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <span>Great momentum — 50%+ complete</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">
              Complete steps to maximize matches
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
