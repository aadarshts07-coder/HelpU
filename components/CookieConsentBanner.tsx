'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Check, X } from 'lucide-react';
import { BRAND } from '@/lib/config/brand';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('helpu_cookie_consent');
      if (!consent) {
        // Show after a brief delay for smooth appearance
        const timer = setTimeout(() => setVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // LocalStorage access restricted
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('helpu_cookie_consent', JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }));
    } catch (e) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside 
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-200 animate-slideUp text-xs"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1.5 flex-1">
          <h3 className="font-bold text-slate-900 flex items-center justify-between">
            <span>Privacy & Essential Cookies</span>
            <button
              onClick={handleAccept}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              aria-label="Dismiss cookie notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </h3>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            {BRAND.displayName} uses strictly essential, HTTP-only encrypted cookies for session authentication and CSRF defense. We never sell your personal data or use third-party ad trackers.
          </p>
          <div className="pt-2 flex items-center justify-between gap-3">
            <Link
              href="/settings"
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <button
              onClick={handleAccept}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-all shadow-xs"
            >
              <Check className="w-3 h-3" />
              <span>Accept & Continue</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
