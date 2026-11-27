'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  Briefcase,
  CheckSquare,
  Bell,
  Settings,
  ShieldCheck,
  Sparkles,
  Target
} from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile Builder', icon: UserCircle, badge: 'Step 1' },
  { href: '/resume', label: 'AI Resume & Letter', icon: FileText, badge: 'ATS' },
  { href: '/jobs', label: 'Job', icon: Briefcase },
  { href: '/tracker', label: 'Application Tracker', icon: CheckSquare },
  { href: '/interview-prep', label: 'Interview Copilot', icon: Sparkles, badge: 'AI' },
  { href: '/goal-to-achieve', label: 'Goal to Achieve', icon: Target, badge: 'New', badgeColor: 'green' },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings & Privacy', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  const [sliderStyle, setSliderStyle] = useState<{ top: number; height: number; opacity: number }>({
    top: 0,
    height: 42,
    opacity: 0,
  });

  // Track clicked item for icon-pop and localized ripple effect
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; href: string } | null>(null);

  // Measure and glide the active highlight pill smoothly
  const updateActivePosition = () => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLAnchorElement>(`[data-nav-href="${pathname}"]`);
    if (activeEl) {
      setSliderStyle({
        top: activeEl.offsetTop,
        height: activeEl.offsetHeight,
        opacity: 1,
      });

      // Compute center Y position of active item relative to header for slot reveal
      const rect = activeEl.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      if (typeof window !== 'undefined') {
        (window as any).__HELP_U_SLOT_Y__ = Math.round(centerY);
        document.documentElement.style.setProperty('--slot-origin-y', `${Math.round(centerY)}px`);
      }
    }
  };

  useEffect(() => {
    updateActivePosition();
    const handleResize = () => updateActivePosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname]);

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const centerY = rect.top + rect.height / 2;

    // Set origin Y for the slot opening animation
    if (typeof window !== 'undefined') {
      (window as any).__HELP_U_SLOT_Y__ = Math.round(centerY);
      document.documentElement.style.setProperty('--slot-origin-y', `${Math.round(centerY)}px`);
      window.dispatchEvent(new CustomEvent('help-u-slot-open', { detail: { y: Math.round(centerY) } }));
    }

    // Trigger icon scale pop & ripple wave
    setClickedHref(href);
    setRipple({ x: clickX, y: clickY, href });

    setTimeout(() => setClickedHref(null), 220);
    setTimeout(() => setRipple(null), 450);
  };

  const handleMouseEnter = (href: string) => {
    // Prefetch target page so opening feels instantaneous
    try {
      router.prefetch(href);
    } catch {
      // safe fallback
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        <nav ref={navRef} className="space-y-1 relative" aria-label="Main Navigation">
          {/* Unified Gliding Active Highlight Pill with Clean Left Accent Bar */}
          {sliderStyle.opacity > 0 && (
            <div
              className="absolute left-0 right-0 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 shadow-md shadow-indigo-500/20 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
              style={{
                top: `${sliderStyle.top}px`,
                height: `${sliderStyle.height}px`,
              }}
            >
              {/* Clean animated left accent bar that travels with the active item */}
              <span className="absolute left-1.5 top-2.5 bottom-2.5 w-1 bg-white/90 rounded-full animate-spring-pop" />
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isClicked = clickedHref === item.href;
            const hasRipple = ripple?.href === item.href;

            return (
              <Link
                key={item.href}
                data-nav-href={item.href}
                href={item.href}
                onClick={(e) => handleItemClick(e, item.href)}
                onMouseEnter={() => handleMouseEnter(item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative z-10 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${isActive
                    ? 'text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 hover:translate-x-1'
                  }`}
              >
                {/* Localized Click Ripple Wave */}
                {hasRipple && ripple && (
                  <span
                    className="absolute pointer-events-none rounded-full bg-white/25 animate-ripple-spread"
                    style={{
                      left: `${ripple.x}px`,
                      top: `${ripple.y}px`,
                      width: '40px',
                      height: '40px',
                      marginLeft: '-20px',
                      marginTop: '-20px',
                    }}
                  />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ${isClicked
                        ? 'animate-icon-pop'
                        : isActive
                          ? 'text-white scale-105'
                          : 'text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 group-hover:rotate-6'
                      }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-200 ${item.badgeColor === 'green'
                        ? isActive
                          ? 'bg-emerald-500 text-white shadow-inner font-extrabold'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-100 group-hover:animate-badge-bounce'
                        : isActive
                          ? 'bg-indigo-500/90 text-indigo-50 shadow-inner'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:animate-badge-bounce'
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Safety & Consent Badge */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/50 border border-indigo-100/80">
        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Stealth Guard Active</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Human-like delays, CAPTCHA alerts & AES-256 encrypted credential protection.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 mt-2 hover:translate-x-0.5 transition-transform"
        >
          Manage safety settings →
        </Link>
      </div>
    </aside>
  );
}
