'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Bell,
  ShieldCheck,
  Play,
  Pause,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  User,
  Sliders,
  LogOut
} from 'lucide-react';
import { InAppNotification, UserSettings } from '@/lib/types';
import HeaderSearchBar from './HeaderSearchBar';

export default function Navbar() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [userName, setUserName] = useState('My Profile');
  const [userInitials, setUserInitials] = useState('U');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const data = await res.json();
      if (data.profile?.name) {
        setUserName(data.profile.name);
        const parts = data.profile.name.trim().split(/\s+/);
        if (parts.length >= 2) {
          setUserInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
        } else if (parts.length === 1 && parts[0].length > 0) {
          setUserInitials(parts[0].slice(0, 2).toUpperCase());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const secureAttr = isHttps ? '; Secure' : '';
      const cookies = document.cookie.split(';').map(c => c.trim());
      const isExplicitlyLoggedOut = cookies.some(c => c === 'helpu_session=logged_out');
      const hasValidSession = cookies.some(c => c.startsWith('helpu_session=') && !c.includes('logged_out'));
      if (!isExplicitlyLoggedOut && !hasValidSession) {
        document.cookie = `helpu_session=usr_demo_101; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
      }
    }

    fetchProfile();
    fetchNotifs();
    fetchSettings();
    const interval = setInterval(() => {
      fetchNotifs();
      fetchProfile();
    }, 10000);

    const handleProfileUpdated = () => {
      fetchProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdated);
    window.addEventListener('focus', handleProfileUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('profileUpdated', handleProfileUpdated);
      window.removeEventListener('focus', handleProfileUpdated);
    };
  }, []);

  const handleTogglePause = async () => {
    if (!settings) return;
    const newPaused = !settings.isPaused;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: newPaused }),
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                HELP <span className="text-indigo-600">U</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                AI Auto Apply
              </span>
            </div>
          </Link>

          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 ml-3">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Claude AI + Playwright
          </span>
        </div>

        {/* General Job & Internship Search Bar */}
        <HeaderSearchBar />

        {/* Global Controls & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Pause / Resume Automation Quick Pill */}
          {settings && (
            <button
              onClick={handleTogglePause}
              title={settings.isPaused ? 'Click to resume automated applications' : 'Click to pause automated applications'}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${settings.isPaused
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
            >
              {settings.isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  Automation Paused
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current animate-pulse text-emerald-500" />
                  Automation Active
                </>
              )}
            </button>
          )}

          {/* Review Mode Badge */}
          {settings && (
            <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {settings.reviewMode === 'ask_before_submitting' ? 'Review Mode (Ask me)' : 'Auto-Submit Mode'}
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">In-App Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-2 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        className={`py-3 transition-colors ${!n.read ? 'bg-indigo-50/50 -mx-2 px-2 rounded-lg' : ''}`}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                          {n.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                          {n.type === 'info' && <Bot className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />}
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 mt-1 border-t border-slate-100 text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifPopover(false)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    View All Notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic User Profile Avatar & Name */}
          <Link
            href="/profile"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {userInitials}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">{userName}</span>
          </Link>

          {/* Quick Logout Button */}
          <button
            type="button"
            onClick={() => {
              const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
              const secureAttr = isHttps ? '; Secure' : '';
              document.cookie = `helpu_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureAttr}`;
              window.location.href = '/login?logout=true';
            }}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
