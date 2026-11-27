'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  Linkedin, 
  Mail, 
  Clock, 
  RefreshCw,
  User,
  Building2
} from 'lucide-react';

interface RecruiterOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  company: string;
  matchScore?: number;
}

export default function RecruiterOutreachModal({
  isOpen,
  onClose,
  jobTitle,
  company,
  matchScore = 85,
}: RecruiterOutreachModalProps) {
  const [activeTab, setActiveTab] = useState<'linkedin' | 'inmail' | 'followup'>('linkedin');
  const [recipientName, setRecipientName] = useState('Hiring Manager');
  const [recipientRole, setRecipientRole] = useState('Technical Recruiter');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [templates, setTemplates] = useState<{
    linkedin: string;
    inmail: { subject: string; body: string };
    followUp: { subject: string; body: string };
  }>({
    linkedin: '',
    inmail: { subject: '', body: '' },
    followUp: { subject: '', body: '' },
  });

  const [customizedContent, setCustomizedContent] = useState('');

  const fetchOutreach = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          company,
          recipientName,
          recipientRole,
          matchScore,
        }),
      });
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
        if (activeTab === 'linkedin') setCustomizedContent(data.templates.linkedin);
        else if (activeTab === 'inmail') setCustomizedContent(data.templates.inmail.body);
        else setCustomizedContent(data.templates.followUp.body);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOutreach();
    }
  }, [isOpen, jobTitle, company]);

  useEffect(() => {
    if (activeTab === 'linkedin') setCustomizedContent(templates.linkedin);
    else if (activeTab === 'inmail') setCustomizedContent(templates.inmail.body);
    else setCustomizedContent(templates.followUp.body);
  }, [activeTab, templates]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(customizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Recruiter & Hiring Team Outreach
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {jobTitle} at {company} • AI personalized outreach
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Recipient Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Sarah / Hiring Manager"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Recipient Role
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={recipientRole}
                onChange={(e) => setRecipientRole(e.target.value)}
                placeholder="e.g. Lead Technical Recruiter"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 gap-2 mt-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('linkedin')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'linkedin'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn Connect (&lt;300 chars)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inmail')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'inmail'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Direct InMail / Email</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'followup'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>5-Day Follow-Up</span>
          </button>
        </div>

        {/* Editor Area */}
        <div className="pt-4 space-y-3">
          {activeTab !== 'linkedin' && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Subject Line:
              </span>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                {activeTab === 'inmail' ? templates.inmail.subject : templates.followUp.subject}
              </div>
            </div>
          )}

          <div className="relative">
            <textarea
              rows={ activeTab === 'linkedin' ? 4 : 8 }
              value={customizedContent}
              onChange={(e) => setCustomizedContent(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed outline-none focus:border-indigo-500 font-medium resize-none"
              placeholder="Outreach draft will appear here..."
            />
            {activeTab === 'linkedin' && (
              <div className={`absolute bottom-3 right-4 text-[10px] font-bold ${
                customizedContent.length > 290 ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {customizedContent.length} / 300 chars
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={fetchOutreach}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Regenerate</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
