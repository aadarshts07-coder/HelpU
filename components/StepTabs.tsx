'use client';

import React, { useRef, useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

export interface StepItem {
  id: number;
  title: string;
  icon: LucideIcon;
}

export interface StepTabsProps {
  steps: StepItem[];
  currentStep: number;
  onSelectStep: (id: number) => void;
  completedStepIds?: number[];
  stepErrorIds?: number[];
  warnStepId?: number | null; // Trigger subtle amber pulse dot
}

export default function StepTabs({
  steps,
  currentStep,
  onSelectStep,
  completedStepIds = [],
  stepErrorIds = [],
  warnStepId = null,
}: StepTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  // Update gliding highlight pill position whenever currentStep changes
  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(`[data-step-id="${currentStep}"]`);
    if (activeBtn) {
      setSliderStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
      // Auto-scroll active tab into view on smaller viewports
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [currentStep, steps]);

  // Handle window resize to recompute slider
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(`[data-step-id="${currentStep}"]`);
      if (activeBtn) {
        setSliderStyle({
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep]);

  // Overall progress percentage for the background progress line
  const completedCount = completedStepIds.length;
  const progressPercent = Math.min(100, Math.max(0, (completedCount / Math.max(1, steps.length)) * 100));

  return (
    <div className="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Background Rail Progress Line connecting the tabs */}
      <div className="absolute top-[28px] left-8 right-8 h-1 bg-slate-100 rounded-full z-0 hidden sm:block">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div
        ref={containerRef}
        role="tablist"
        aria-label="Profile Builder Steps"
        className="relative grid grid-cols-3 sm:grid-cols-6 gap-2 z-10"
      >
        {/* Sliding Active Tab Highlight Pill */}
        {sliderStyle.width > 0 && (
          <div
            className="absolute top-0 bottom-0 rounded-xl bg-indigo-50/80 border border-indigo-200 shadow-sm pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              left: `${sliderStyle.left}px`,
              width: `${sliderStyle.width}px`,
            }}
          />
        )}

        {steps.map((s) => {
          const Icon = s.icon;
          const isCurrent = currentStep === s.id;
          const isCompleted = completedStepIds.includes(s.id);
          const hasError = stepErrorIds.includes(s.id);
          const isWarning = warnStepId === s.id;

          return (
            <button
              key={s.id}
              data-step-id={s.id}
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Step ${s.id}: ${s.title}`}
              onClick={() => onSelectStep(s.id)}
              className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl text-center relative z-10 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0 ${
                isCurrent
                  ? 'text-indigo-700 font-extrabold'
                  : hasError
                  ? 'text-red-700 font-bold hover:bg-red-50/50'
                  : isCompleted
                  ? 'text-emerald-700 hover:text-emerald-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Amber Warning Pulse Dot when trying to skip incomplete required step */}
              {isWarning && (
                <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping z-20" />
              )}
              {hasError && !isWarning && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse z-20" />
              )}

              {/* Number / Checkmark Badge with Soft Glow */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-300 relative ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300/60 scale-105'
                    : hasError
                    ? 'bg-red-600 text-white'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}
              >
                {isCompleted ? (
                  <>
                    <span className="absolute inset-0 rounded-lg border-2 border-emerald-400 animate-ripple-pulse pointer-events-none" />
                    {/* Animated SVG Checkmark Draw */}
                    <svg
                      className="w-4 h-4 text-emerald-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" className="animate-checkmark-draw" />
                    </svg>
                  </>
                ) : (
                  <span className="font-bold">{s.id}</span>
                )}
              </div>

              {/* Step Title */}
              <span className="text-[11px] truncate w-full tracking-tight">
                {s.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
