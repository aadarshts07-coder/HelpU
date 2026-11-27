'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Whenever route changes, trigger a quick 300ms loading sweep
    setLoading(true);
    setProgress(30);

    const t1 = setTimeout(() => setProgress(80), 80);
    const t2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setLoading(false), 200);
    }, 240);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  if (!loading && progress === 100) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none transition-opacity duration-300 ${
        loading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 shadow-sm shadow-indigo-500/50 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
