'use client';

import React, { useState, useEffect, useRef } from 'react';
import AnimatedNumber from './AnimatedNumber';

export interface TooltipBreakdown {
  submitted?: number;
  failed?: number;
  pending?: number;
  manualAction?: number;
}

export interface GaugeMeterProps {
  value: number; // 0 to 100
  sampleSize?: string;
  label?: string;
  statusBadge?: string;
  size?: number; // default: 116
  animate?: boolean;
  tooltipBreakdown?: TooltipBreakdown;
  className?: string;
}

export default function GaugeMeter({
  value,
  sampleSize = '19 of 19 applications',
  label = 'success',
  statusBadge = 'Verified',
  size = 116,
  animate = true,
  tooltipBreakdown = {
    submitted: 19,
    failed: 0,
    pending: 216,
    manualAction: 12,
  },
  className = '',
}: GaugeMeterProps) {
  const isValueValid = typeof value === 'number' && !isNaN(value);
  const clampedVal = isValueValid ? Math.max(0, Math.min(100, value)) : 0;
  const [animatedProgress, setAnimatedProgress] = useState<number>(animate && isValueValid ? 0 : clampedVal);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [glowPulse, setGlowPulse] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!isValueValid) return;

    if (prefersReducedMotion || !animate) {
      setAnimatedProgress(clampedVal);
      return;
    }

    const duration = 1200;
    let startTimestamp: number | null = null;
    let animFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = clampedVal * eased;
      setAnimatedProgress(current);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      } else {
        setAnimatedProgress(clampedVal);
        setGlowPulse(true);
        setTimeout(() => setGlowPulse(false), 800);
      }
    };

    animFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameId);
  }, [clampedVal, isValueValid, animate, prefersReducedMotion]);

  // Determine color zone
  const isHigh = clampedVal >= 80;
  const isMid = clampedVal >= 50 && clampedVal < 80;
  const primaryColor = isHigh ? '#10b981' : isMid ? '#f59e0b' : '#f43f5e';
  const secondaryColor = isHigh ? '#10b981' : isMid ? '#d97706' : '#e11d48';

  // 270° Radial Geometry (Center: 60,60, Radius: 44)
  const cx = 60;
  const cy = 60;
  const r = 44;
  const arcLength = 1.5 * Math.PI * r; // ~207.345
  const strokeOffset = arcLength - (animatedProgress / 100) * arcLength;

  // Knob coordinates at current progress tip
  const currentAngleDeg = 135 + (animatedProgress / 100) * 270;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const knobX = cx + r * Math.cos(currentAngleRad);
  const knobY = cy + r * Math.sin(currentAngleRad);

  // Minimal ticks at 0%, 50%, and 100%
  const ticks = [
    { pct: 0, angle: 135, label: '0' },
    { pct: 50, angle: 270, label: '50' },
    { pct: 100, angle: 405, label: '100' },
  ].map((t) => {
    const rad = (t.angle * Math.PI) / 180;
    const r1 = r + 7;
    const r2 = r + 11;
    return {
      ...t,
      x1: cx + r1 * Math.cos(rad),
      y1: cy + r1 * Math.sin(rad),
      x2: cx + r2 * Math.cos(rad),
      y2: cy + r2 * Math.sin(rad),
      lx: cx + (r + 17) * Math.cos(rad),
      ly: cy + (r + 17) * Math.sin(rad) + 2.5,
      active: clampedVal >= t.pct,
    };
  });

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="meter"
      aria-label="Application Success Rate"
      aria-valuenow={isValueValid ? clampedVal : 0}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* 270-Degree Radial Gauge Canvas */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg
          viewBox="0 0 120 120"
          className={`w-full h-full overflow-hidden transition-all duration-300 ${
            glowPulse ? 'scale-105' : 'scale-100'
          }`}
        >
          <defs>
            <linearGradient id="radial-gauge-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>

            <filter id="knob-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor={primaryColor} floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Background Neutral Track (270° from 135° to 45°) */}
          <path
            d="M 28.89,91.11 A 44,44 0 1,1 91.11,91.11"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Active Animated Progress Arc */}
          {isValueValid && clampedVal > 0 ? (
            <path
              d="M 28.89,91.11 A 44,44 0 1,1 91.11,91.11"
              fill="none"
              stroke="url(#radial-gauge-gradient)"
              strokeWidth="9"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          ) : null}

          {/* Minimal Radial Ticks */}
          {ticks.map((t) => (
            <g key={t.pct}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.active ? primaryColor : '#cbd5e1'}
                strokeWidth="1.5"
                strokeLinecap="round"
                className="transition-colors duration-300"
              />
              <text
                x={t.lx}
                y={t.ly}
                textAnchor="middle"
                className="text-[7px] font-bold fill-slate-400 select-none tracking-tighter"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Glowing End Knob (at active tip, leaves center completely open) */}
          {isValueValid && clampedVal > 0 && (
            <g filter="url(#knob-glow)">
              <circle
                cx={knobX}
                cy={knobY}
                r="5"
                fill="#ffffff"
                stroke={primaryColor}
                strokeWidth="2.5"
                className="transition-all duration-300 ease-out"
              />
            </g>
          )}
        </svg>

        {/* Big Bold Typography Centered Inside Arc */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none pb-1">
          {isValueValid ? (
            <>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                <AnimatedNumber value={clampedVal} suffix="%" duration={1200} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                {label}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold text-slate-400">No data yet</span>
          )}
        </div>
      </div>

      {/* Interactive Floating Breakdown Tooltip */}
      {showTooltip && tooltipBreakdown && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 bg-white text-slate-800 text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-md whitespace-nowrap border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">{tooltipBreakdown.submitted || 0} Submitted</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 font-bold">{tooltipBreakdown.pending || 0} Pending</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 font-bold">{tooltipBreakdown.manualAction || 0} Action</span>
          </div>
          {/* Tooltip triangle */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
        </div>
      )}
    </div>
  );
}
