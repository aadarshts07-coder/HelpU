'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PageSlotReveal from '@/components/PageSlotReveal';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  Check, 
  Trash2, 
  ExternalLink,
  Clock
} from 'lucide-react';
import { InAppNotification } from '@/lib/types';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <PageSlotReveal pageTitle="In-App Notifications & Alerts">
        <main className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-600" />
              <span>In-App Notifications & Alerts</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time updates regarding application submissions, verification challenges, and interview requests.
            </p>
          </div>

          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark All Read</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No notifications yet. New application alerts will appear here.
            </div>
          ) : (
            notifications.map((n, idx) => (
              <div
                key={n.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all animate-row-cascade ${
                  !n.read
                    ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 mt-0.5">
                      {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {n.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      {n.type === 'info' && <Bot className="w-4 h-4 text-indigo-500" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{n.title}</h2>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.timestamp).toLocaleString()}
                        </span>

                        {n.actionUrl && (
                          <Link
                            href={n.actionUrl}
                            className="font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            <span>View in Tracker</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => markSingleRead(n.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </main>
      </PageSlotReveal>
    </div>
  );
}
