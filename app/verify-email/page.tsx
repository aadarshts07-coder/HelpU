'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bot,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { BRAND } from '@/lib/config/brand';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlEmail = searchParams.get('email') || '';
  const urlStatus = searchParams.get('status') || '';
  const urlError = searchParams.get('error') || '';

  const [email, setEmail] = useState(urlEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!urlEmail);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === 'invalid_or_expired'
      ? 'This verification link has expired or has already been used. Please request a new code below.'
      : urlError === 'missing_token'
        ? 'Verification token was missing. Please use the button in your email.'
        : null
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If redirected with ?status=verified
  useEffect(() => {
    if (urlStatus === 'verified') {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [urlStatus, router]);

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Auto advance
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Submit OTP Verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const code = digits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the full 6-digit confirmation code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setStatusMessage('Email verified successfully! Opening your dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired code.');
      setLoading(false);
    }
  };

  // Resend Verification Code
  const handleResend = async () => {
    if (resendCountdown > 0 || resending) return;
    if (!email) {
      setErrorMessage('Please enter your email address to receive a code.');
      return;
    }

    setResending(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend verification');

      setStatusMessage(data.message || 'A fresh code has been sent to your inbox.');
      setResendCountdown(60);
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resend email.');
    } finally {
      setResending(false);
    }
  };

  if (urlStatus === 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-4 animate-scaleUp">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Email Verified!
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Your {BRAND.displayName} account is now fully active. We're launching your dashboard...
          </p>
          <div className="pt-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">

        {/* Header */}
        <div className="text-center">
          <Link href="/login" className="inline-block group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform mb-3">
              <Mail className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Verify your email address
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            We sent a verification link and 6-digit code to activate your account.
          </p>
        </div>

        {/* Email Address Display / Edit */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
          {isEditingEmail ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full bg-transparent border-b border-indigo-400 outline-none font-semibold text-slate-800"
              autoFocus
            />
          ) : (
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Sending to</span>
              <span className="font-bold text-slate-800">{email || 'No email specified'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsEditingEmail(!isEditingEmail)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
          >
            <Edit2 className="w-3 h-3" />
            <span>{isEditingEmail ? 'Save' : 'Change'}</span>
          </button>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {statusMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{statusMessage}</div>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center mb-2">
              Enter 6-Digit Code
            </label>
            <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-13 text-center text-lg font-black text-slate-900 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-xs"
                  autoFocus={i === 0}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length < 6}
            className="w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Confirm & Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend Action */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCountdown > 0 || resending}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {resendCountdown > 0
                  ? `Resend code in ${resendCountdown}s`
                  : 'Didn\'t get an email? Resend code'}
              </span>
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <Link href="/login" className="hover:text-slate-600 transition-colors">
            ← Return to sign in
          </Link>
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single-use OTP code</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
