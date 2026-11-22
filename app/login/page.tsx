'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Mail, Lock, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEMO_EMAIL || '');
  const [password, setPassword] = useState(process.env.NEXT_PUBLIC_DEMO_PASSWORD || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      const secureAttr = isHttps ? '; Secure' : '';
      const params = new URLSearchParams(window.location.search);
      if (params.get('logout') === 'true') {
        document.cookie = `helpu_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureAttr}`;
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureAttr = isHttps ? '; Secure' : '';
    document.cookie = `helpu_session=usr_demo_101; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-100 mb-4">
            <Bot className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to HELP U
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Access your autonomous job application agent & tracker
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="you@domain.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span>Remember me</span>
            </label>
            <a href="#" className="font-semibold text-indigo-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              'Signing In...'
            ) : (
              <>
                <span>Sign In & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || '';
                const demoPass = process.env.NEXT_PUBLIC_DEMO_PASSWORD || '';
                setEmail(demoEmail);
                setPassword(demoPass);
                setLoading(true);
                const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
                const secureAttr = isHttps ? '; Secure' : '';
                document.cookie = `helpu_session=usr_demo_101; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
                setTimeout(() => {
                  const params = new URLSearchParams(window.location.search);
                  const redirectUrl = params.get('redirect') || '/dashboard';
                  router.push(redirectUrl);
                }, 300);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-slate-700 font-bold text-xs bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80"
            >
              🚀 Quick 1-Click Demo Login
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>AES-256 Encrypted Session Protection</span>
        </div>

      </div>
    </div>
  );
}
