'use client';

import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export interface StatsCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate';
  trend?: string;
  progressBarPercent?: number; // 0 to 100 (for Card 1: Today daily limit)
  sparkle?: boolean; // Subtle pulse on trend (for Card 5)
  index?: number; // Stagger index (0 to 4)
  loading?: boolean;
  children?: React.ReactNode;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'indigo',
  trend,
  progressBarPercent,
  sparkle = false,
  index = 0,
  loading = false,
  children,
}: StatsCardProps) {
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [cardMounted, setCardMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCardMounted(true);
    }, index * 70);
    return () => clearTimeout(timer);
  }, [index]);

  const badgeClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeColor];

  // Skeleton loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between h-full min-h-[195px] animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 bg-slate-200 rounded-md" />
          <div className="w-9 h-9 rounded-xl bg-slate-100" />
        </div>
        <div className="my-auto py-2">
          <div className="h-8 w-16 bg-slate-200 rounded-lg" />
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="h-2.5 w-20 bg-slate-100 rounded-md" />
          <div className="h-2.5 w-14 bg-slate-100 rounded-md" />
        </div>
      </div>
    );
  }

  // Parse numeric value if applicable
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '');
  const numericVal = isNumeric ? Number(value) : 0;

  return (
    <div
      style={{
        transitionDelay: `${index * 60}ms`,
      }}
      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-500 ease-out flex flex-col justify-between h-full min-h-[195px] transform ${
        cardMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      {/* 1. Header Row (Fixed h-9: Title Left, Icon Right — Zero Collision) */}
      <div className="h-9 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate mr-2">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
      </div>

      {/* 2. Main Metric Area (Fixed h-24: Perfectly Centered Vertical Space) */}
      <div className="h-24 flex items-center justify-center my-1">
        {children ? (
          <div className="w-full flex items-center justify-center">
            {children}
          </div>
        ) : (
          <div className="flex items-baseline gap-2.5 w-full justify-start">
            {isNumeric ? (
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                <AnimatedNumber
                  value={numericVal}
                  duration={1200}
                  onComplete={() => setBadgeVisible(true)}
                />
              </span>
            ) : (
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {value || '-'}
              </span>
            )}

            {/* Delayed Badge Fade/Scale In */}
            {badge && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all duration-400 ease-out transform ${
                  badgeVisible || !isNumeric ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                } ${badgeClasses}`}
              >
                {badge}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer Row (Fixed h-7: Sublabel Left, Trend/Pill Right) */}
      <div className="border-t border-slate-100 pt-2 flex flex-col justify-end">
        <div className="flex items-center justify-between text-xs gap-2 min-w-0">
          {subtitle && (
            <span className="text-slate-500 font-medium truncate min-w-0 flex-1" title={subtitle}>
              {subtitle}
            </span>
          )}

          {trend && (
            <span
              className={`font-semibold shrink-0 ${
                sparkle ? 'text-emerald-600 animate-pulse' : 'text-emerald-600'
              }`}
            >
              {trend}
            </span>
          )}
        </div>

        {/* Optional Thin Animated Progress Bar (e.g. Daily Limits) */}
        {typeof progressBarPercent === 'number' && (
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progressBarPercent))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
