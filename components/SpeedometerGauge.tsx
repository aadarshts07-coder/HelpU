'use client';

import React, { useState, useEffect } from 'react';

export interface SpeedometerGaugeProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  thresholds?: {
    low: number; // default: 50 (below is rose)
    medium: number; // default: 80 (below is amber, above is emerald)
  };
  animate?: boolean;
  showNeedle?: boolean;
  badge?: string;
  badgeColor?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate';
  trend?: string;
  className?: string;
}

export default function SpeedometerGauge({
  value,
  label = 'Success Rate',
  sublabel = 'Applications submitted',
  size = 'md',
  thresholds = { low: 50, medium: 80 },
  animate = true,
  showNeedle = true,
  badge = 'Verified',
  badgeColor = 'emerald',
  trend = '↑ High pass',
  className = '',
}: SpeedometerGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
  const [currentVal, setCurrentVal] = useState(animate ? 0 : clampedValue);

  // Smooth easing animation on mount and value changes
  useEffect(() => {
    if (!animate) {
      setCurrentVal(clampedValue);
      return;
    }

    let startTimestamp: number | null = null;
    const startVal = currentVal;
    const duration = 1100; // ms

    let animFrameId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const interpolated = Math.round(startVal + (clampedValue - startVal) * easedProgress);
      setCurrentVal(interpolated);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      }
    };

    animFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameId);
  }, [clampedValue, animate]);

  // Determine current tier & accent color
  const isHigh = currentVal >= thresholds.medium;
  const isMid = currentVal >= thresholds.low && currentVal < thresholds.medium;
  const currentAccent = isHigh ? '#10b981' : isMid ? '#f59e0b' : '#f43f5e';

  // --- Mini Variant (for badges and dense table cells) ---
  if (size === 'sm') {
    const miniRadius = 14;
    const miniCircumference = 2 * Math.PI * miniRadius;
    const miniOffset = miniCircumference - (currentVal / 100) * miniCircumference;

    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-slate-50/80 ${
        isHigh
          ? 'border-emerald-200/80 text-emerald-800'
          : isMid
          ? 'border-amber-200/80 text-amber-800'
          : 'border-rose-200/80 text-rose-800'
      } ${className}`}>
        <svg className="w-4 h-4 -rotate-90 shrink-0" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r={miniRadius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3.5"
          />
          <circle
            cx="18"
            cy="18"
            r={miniRadius}
            fill="none"
            stroke={currentAccent}
            strokeWidth="3.5"
            strokeDasharray={miniCircumference}
            strokeDashoffset={miniOffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="font-extrabold text-[11px] tabular-nums tracking-tight">
          {currentVal}% Match
        </span>
      </div>
    );
  }

  // --- Full Speedometer Gauge (for Stat Cards) ---
  // Geometry parameters: Semicircle arc from 180° (left) to 0° (right)
  const cx = 100;
  const cy = 92;
  const r = 68;
  const arcLength = Math.PI * r; // ~213.628
  const strokeOffset = arcLength - (currentVal / 100) * arcLength;

  // Needle angle (-90deg at 0%, 0deg at 50%, +90deg at 100%)
  const needleRotation = -90 + (currentVal / 100) * 180;

  // Generate tick marks (0%, 25%, 50%, 75%, 100%)
  const tickPercentages = [0, 25, 50, 75, 100];
  const ticks = tickPercentages.map((pct) => {
    const angleRad = (180 - pct * 1.8) * (Math.PI / 180);
    const r1 = 78;
    const r2 = pct % 50 === 0 ? 84 : 82;
    const x1 = cx + r1 * Math.cos(angleRad);
    const y1 = cy - r1 * Math.sin(angleRad);
    const x2 = cx + r2 * Math.cos(angleRad);
    const y2 = cy - r2 * Math.sin(angleRad);
    const labelX = cx + 89 * Math.cos(angleRad);
    const labelY = cy - 89 * Math.sin(angleRad) + 3;
    const isMajor = pct === 0 || pct === 50 || pct === 100;
    const isActive = currentVal >= pct;

    return {
      pct,
      x1,
      y1,
      x2,
      y2,
      labelX,
      labelY,
      isMajor,
      isActive,
    };
  });

  return (
    <div className={`flex flex-col items-center justify-between w-full h-full select-none ${className}`}>
      {/* SVG Speedometer Gauge Canvas */}
      <div className="relative w-full max-w-[210px] mx-auto aspect-[200/125]">
        <svg
          viewBox="0 0 200 125"
          className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
        >
          <defs>
            {/* Multi-stop vibrant gradient along the arc */}
            <linearGradient id="speedometer-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />   {/* Rose */}
              <stop offset="30%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#f59e0b" />  {/* Amber */}
              <stop offset="70%" stopColor="#10b981" />  {/* Emerald */}
              <stop offset="100%" stopColor="#10b981" /> {/* Deep Emerald */}
            </linearGradient>

            {/* Glowing filter for needle & active zone */}
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor={currentAccent} floodOpacity="0.35" />
            </filter>

            <filter id="needle-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#64748b" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Arc Track with rounded caps */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Foreground Colored Active Arc */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="url(#speedometer-arc-gradient)"
            strokeWidth="11"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />

          {/* Tick marks & subtle micro-labels */}
          {ticks.map((t) => (
            <g key={t.pct}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isActive ? currentAccent : '#cbd5e1'}
                strokeWidth={t.isMajor ? '2' : '1.5'}
                strokeLinecap="round"
                className="transition-colors duration-300"
              />
              {t.isMajor && (
                <text
                  x={t.labelX}
                  y={t.labelY}
                  textAnchor="middle"
                  className="text-[8px] font-bold fill-slate-400 select-none tracking-tighter"
                >
                  {t.pct}
                </text>
              )}
            </g>
          ))}

          {/* Aerodynamic Needle with Pivot Hub */}
          {showNeedle && (
            <g
              transform={`rotate(${needleRotation} ${cx} ${cy})`}
              className="transition-transform duration-300 ease-out origin-[100px_92px]"
              filter="url(#needle-shadow)"
            >
              {/* Tapered Needle Blade */}
              <polygon
                points={`${cx - 2.5},${cy} ${cx},${cy - 60} ${cx + 2.5},${cy} ${cx},${cy + 4}`}
                fill="#1e293b"
              />
              {/* Needle Tip Accent */}
              <circle cx={cx} cy={cy - 57} r="1.5" fill={currentAccent} />
            </g>
          )}

          {/* Central Hub (Outer Slate Ring + Glowing Center Dot) */}
          <circle cx={cx} cy={cy} r="7.5" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="3.5" fill={currentAccent} filter="url(#gauge-glow)" />

          {/* Percentage Value Readout (Centered Below Hub) */}
          <text
            x={cx}
            y={cy + 22}
            textAnchor="middle"
            className="text-2xl font-black fill-slate-900 tracking-tight"
          >
            {currentVal}%
          </text>
        </svg>
      </div>

      {/* Sublabel & Trend footer aligned with neighboring stat cards */}
      <div className="w-full mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium truncate max-w-[110px]" title={sublabel}>
          {sublabel}
        </span>
        {trend && (
          <span className={`font-bold flex items-center gap-1 ${
            isHigh ? 'text-emerald-600' : isMid ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
