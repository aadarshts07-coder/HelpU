import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate';
  trend?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'indigo',
  trend,
}: StatsCardProps) {
  const badgeClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeColor];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="font-semibold text-emerald-600">{trend}</span>}
        </div>
      )}
    </div>
  );
}
