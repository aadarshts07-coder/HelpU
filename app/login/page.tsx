'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Bot, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  AlertCircle, 
  Loader2, 
  Check,
  Building2,
  CheckSquare
} from 'lucide-react';
import { BRAND } from '@/lib/config/brand';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  // Form State
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEMO_EMAIL || 'alex.morgan@example.com');
  const [password, setPassword] = useState(process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'CareerBoost2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authMode, setAuthMode] = useState<'password' | 'magic-link'>('password');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle logout parameter if present
  useEffect(() => {
    if (searchParams.get('logout') === 'true') {
      fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
    }
  }, [searchParams]);

  // Handle Standard / Password Sign In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (authMode === 'magic-link') {
        const res = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, redirect: redirectTarget }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send magic link');
        setSuccessMessage(data.message || 'Check your inbox for a secure sign-in link!');
        setLoading(false);
        return;
      }

      // Password Auth
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          redirect: redirectTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
          return;
        }
        throw new Error(data.error || 'Invalid email or password.');
      }

      // Success: redirect to intended destination
      router.push(data.redirect || '/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to sign in. Please try again.');
      setLoading(false);
    }
  };

  // Handle Continue with Google
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect: redirectTarget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google sign-in could not be completed');
      router.push(data.redirect || '/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed. Please use email & password.');
      setGoogleLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const handleQuickDemo = async () => {
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'alex.morgan@example.com';
    const demoPass = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'CareerBoost2026!';
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          password: demoPass,
          rememberMe: true,
          redirect: redirectTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      router.push(data.redirect || '/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      
      {/* LEFT COLUMN: Form Container */}
      <div className="w-full lg:w-[50%] xl:w-[46%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white z-10 border-r border-slate-200">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block">
                {BRAND.displayName}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block -mt-1">
                {BRAND.tagline}
              </span>
            </div>
          </Link>

          <Link
            href="/search"
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block"
          >
            Explore Jobs & Internships →
          </Link>
        </div>

        {/* Center Card / Form */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Sign in to manage your autonomous job applications & AI career copilot.
            </p>
          </div>

          {/* Social Sign-in: Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-60 hover:border-slate-300"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                or continue with email
              </span>
            </div>
          </div>

          {/* Mode Switcher: Password vs Magic Link */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-1.5 rounded-lg transition-all ${
                authMode === 'password'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('magic-link');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'magic-link'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Magic Link</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Password Field (Only when in password mode) */}
            {authMode === 'password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me Checkbox */}
            {authMode === 'password' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="font-medium text-[11px]">Remember me for 30 days</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{authMode === 'magic-link' ? 'Sending Magic Link...' : 'Verifying & Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'magic-link' ? 'Email Me a Magic Link' : 'Sign In to Your Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick 1-Click Demo Login */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-slate-700 font-bold text-xs bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80 flex items-center justify-center gap-2"
              >
                <span>⚡ Instant 1-Click Demo Access</span>
              </button>
            </div>

          </form>

          {/* Sign Up Link */}
          <div className="pt-5 text-center text-xs text-slate-500 font-medium">
            Don't have an account yet?{' '}
            <Link
              href="/signup"
              className="font-bold text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline transition-colors"
            >
              Sign up for free
            </Link>
          </div>

          {/* Trust Line */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>AES-256 encrypted session protection • Your data is never sold</span>
          </div>

        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {BRAND.displayName} Inc.</span>
          <div className="flex items-center gap-3">
            <Link href="/settings" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/settings" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Branded Showcase Panel (Desktop Only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-10 xl:p-16 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
        
        {/* Subtle decorative glowing background blur */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tagline Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous AI Job Pipeline</span>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Trusted by active tech job seekers
          </span>
        </div>

        {/* Center Content: Headline & Benefit Bullets */}
        <div className="relative z-10 max-w-lg my-auto py-10 space-y-8">
          
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Land interviews faster, with less repetitive effort.
            </h2>
            <p className="text-sm text-indigo-200 leading-relaxed font-normal">
              HELP U continuously matches verified tech openings, tailors your ATS resume to job specs, and prepares you for tough interviews.
            </p>
          </div>

          {/* 3 Benefit Bullets */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Smart ATS Resume Tailoring</h3>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Automatically aligns your bullet points and technical competencies to match target job descriptions with high keyword precision.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Stealth Review Gate</h3>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  You stay 100% in control. Review every tailored cover letter, form answer, and screening question before single-click dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">AI Interview Copilot & Question Prep</h3>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Simulate technical architecture and STAR behavioral questions for any applied role with real-time scoring and answer refinement.
                </p>
              </div>
            </div>
          </div>

          {/* Live Product Preview Glassmorphism Card */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cisco Systems • Senior Full-Stack Engineer</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
                94% Match
              </span>
            </div>
            <div className="text-[11px] text-slate-300 line-clamp-2 italic">
              "Tailored resume v2 aligned with React, TypeScript & Distributed Cloud Microservices. Application ready for 1-click submission."
            </div>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Check className="w-3 h-3" /> Stealth Guard Verified
              </span>
              <span>San Jose, CA (Hybrid)</span>
            </div>
          </div>

        </div>

        {/* Bottom Security Note */}
        <div className="relative z-10 text-[11px] text-slate-400 flex items-center gap-2">
          <span>Enterprise-grade data isolation • Strict zero scraping policy</span>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading HELP U Login...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
