'use client';

import React from 'react';
import { ShieldCheck, Check, Lock, AlertCircle, X } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onConsent: () => void;
  onCancel: () => void;
}

export default function ConsentModal({ isOpen, onConsent, onCancel }: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Automation Consent & Privacy</h3>
              <p className="text-xs text-slate-500">Explicit user authorization required</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-950 font-medium">
            Before HELP U applies on your behalf, please confirm your permission to use Playwright automation to submit applications using your profile details.
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Stored Credentials Encrypted:</strong> All portal credentials are stored using AES-256 encryption. We never store plain text passwords.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Zero Third-Party Sharing:</strong> Your resume and contact data are strictly submitted to jobs you target, and never shared or sold.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Full Control & Review:</strong> You can select "Ask me before submitting" to review all filled forms prior to final click, and you may delete all data anytime.</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConsent}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all"
          >
            I Agree & Enable Automation
          </button>
        </div>
      </div>
    </div>
  );
}
