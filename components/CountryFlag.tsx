import React from 'react';
import { Globe } from 'lucide-react';

interface CountryFlagProps {
  code: string;
  className?: string;
}

export default function CountryFlag({ code, className = 'w-4 h-4' }: CountryFlagProps) {
  const norm = (code || '').toLowerCase().trim();

  if (norm === 'remote' || norm === 'worldwide') {
    return <Globe className={`text-indigo-500 shrink-0 ${className}`} aria-label="Remote - Worldwide" />;
  }

  // EU virtual flag supported by flag-icons (fi-eu)
  if (norm === 'eu') {
    return (
      <span
        className={`fi fi-eu fis rounded-full shrink-0 ring-1 ring-slate-200 inline-block overflow-hidden ${className}`}
        role="img"
        aria-label="Flag of European Union"
      />
    );
  }

  if (!norm || norm.length !== 2) {
    return (
      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded shrink-0">
        {(code || '??').toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={`fi fi-${norm} fis rounded-full shrink-0 ring-1 ring-slate-200 inline-block overflow-hidden ${className}`}
      role="img"
      aria-label={`Flag of ${norm.toUpperCase()}`}
    />
  );
}
