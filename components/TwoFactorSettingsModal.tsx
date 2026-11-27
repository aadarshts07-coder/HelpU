'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Copy, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Smartphone,
  Lock
} from 'lucide-react';

interface TwoFactorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TwoFactorSettingsModal({
  isOpen,
  onClose,
  onSuccess,
}: TwoFactorSettingsModalProps) {
  const [step, setStep] = useState<'intro' | 'setup' | 'disable'>('intro');
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize 2FA setup');

      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setBackupCodes(data.backupCodes || []);
      setStep('setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid 2FA confirmation code');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Enhance your account security with an Authenticator App (TOTP)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Step 1: Intro */}
        {step === 'intro' && (
          <div className="py-6 space-y-4 text-xs text-slate-600">
            <p className="leading-relaxed">
              When 2FA is enabled, you'll enter a 6-digit one-time code from your authenticator app (Google Authenticator, Authy, 1Password) each time you log in.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>Supported Authenticator Apps</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Google Authenticator (iOS & Android)</li>
                <li>Twilio Authy</li>
                <li>1Password / Bitwarden / Apple Passwords</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSetup}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Set Up Authenticator</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Secret & Code Confirmation */}
        {step === 'setup' && (
          <div className="py-4 space-y-4 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                1. Add Secret Key to Your Authenticator App
              </span>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <code className="font-mono font-bold text-indigo-600 text-sm tracking-wider flex-1 truncate">
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shrink-0"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Backup Codes Box */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  2. Save Your 8 Backup Recovery Codes
                </span>
                <button
                  type="button"
                  onClick={handleCopyCodes}
                  className="text-[11px] text-indigo-600 font-bold hover:underline"
                >
                  {copiedCodes ? 'Codes Copied!' : 'Copy All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                {backupCodes.map((c, i) => (
                  <div key={i} className="text-center bg-white py-1 px-2 rounded border border-slate-200/60 font-semibold">
                    {c}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Store these in a password manager. Each code can be used once if you lose your phone.
              </p>
            </div>

            {/* Confirmation form */}
            <form onSubmit={handleConfirmCode} className="pt-2 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. Enter 6-Digit Code from Authenticator
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-lg font-black tracking-widest py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length < 6}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Verify & Activate 2FA</span>
                </button>
              </div>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}
