'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UserCircle, 
  FileText, 
  Briefcase, 
  CheckSquare, 
  Bell, 
  Settings, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile Builder', icon: UserCircle, badge: 'Step 1' },
  { href: '/resume', label: 'AI Resume & Letter', icon: FileText, badge: 'ATS' },
  { href: '/jobs', label: 'Job', icon: Briefcase },
  { href: '/tracker', label: 'Application Tracker', icon: CheckSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings & Privacy', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-indigo-500 text-indigo-100'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
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
          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 mt-2"
        >
          Manage safety settings →
        </Link>
      </div>
    </aside>
  );
}
