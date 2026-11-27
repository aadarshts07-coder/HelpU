'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PageSlotReveal from '@/components/PageSlotReveal';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Award, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft,
  RefreshCw, 
  Eye, 
  EyeOff, 
  Send, 
  Copy, 
  Check, 
  HelpCircle,
  Play,
  Square,
  Building2,
  Briefcase
} from 'lucide-react';
import { ApplicationRecord } from '@/lib/types';
import { InterviewQuestion } from '../api/interview-prep/route';

function InterviewPrepContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') || 'Full-Stack Software Engineer';
  const initialCompany = searchParams.get('company') || 'Tech Innovators Inc.';

  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState(initialCompany);
  const [trackedApps, setTrackedApps] = useState<ApplicationRecord[]>([]);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
    areasForImprovement: string[];
    suggestedPolish: string;
  } | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Copy toast state
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Load tracked jobs for dropdown
  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch('/api/apply/status');
        const data = await res.json();
        if (data.applications) setTrackedApps(data.applications);
      } catch (e) {
        console.error(e);
      }
    }
    loadApps();
  }, []);

  // Fetch questions
  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    setEvaluationResult(null);
    setUserAnswer('');
    setShowModelAnswer(false);
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          jobTitle: role,
          company: company,
        }),
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setActiveQuestionIdx(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const toggleTimer = () => {
    if (timerRunning) {
      setTimerRunning(false);
    } else {
      setTimerSeconds(0);
      setTimerRunning(true);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleEvaluate = async () => {
    if (!currentQ || !userAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'evaluate',
          jobTitle: role,
          company: company,
          question: currentQ.question,
          userResponse: userAnswer,
        }),
      });
      const data = await res.json();
      setEvaluationResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentQ = questions[activeQuestionIdx];

  const handleCopyPolish = () => {
    if (!evaluationResult?.suggestedPolish) return;
    navigator.clipboard.writeText(evaluationResult.suggestedPolish);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <PageSlotReveal pageTitle="AI Interview Copilot">
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
          
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl animate-sparkle-ambient">
                  <Sparkles className="w-5 h-5" />
                </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                AI Interview Copilot & Question Simulator
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Simulate role-specific technical, STAR behavioral, and situational interviews. Get real-time AI scoring and polished answers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Interactive Practice Mode Active
            </span>
          </div>
        </div>

        {/* Target Job Selector Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
            
            {/* Quick Tracked Job Fill */}
            {trackedApps.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Load from Tracked Jobs
                </label>
                <select
                  onChange={(e) => {
                    const sel = trackedApps.find(a => a.id === e.target.value);
                    if (sel) {
                      setRole(sel.jobTitle);
                      setCompany(sel.company);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium outline-none focus:border-indigo-500"
                >
                  <option value="">Select a tracked job...</option>
                  {trackedApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.jobTitle} @ {a.company}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Target Role
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 font-medium outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Cisco, Bosch"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 font-medium outline-none focus:border-indigo-500"
                />
              </div>
            </div>

          </div>

          <div className="flex items-end">
            <button
              onClick={fetchQuestions}
              disabled={loadingQuestions}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingQuestions ? 'animate-spin' : ''}`} />
              <span>{loadingQuestions ? 'Generating Questions...' : 'Generate New Set'}</span>
            </button>
          </div>
        </div>

        {/* Question Navigation Tabs */}
        {questions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setActiveQuestionIdx(idx);
                  setEvaluationResult(null);
                  setUserAnswer('');
                  setShowModelAnswer(false);
                }}
                className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  activeQuestionIdx === idx
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Q{idx + 1}:</span>
                <span className="font-normal opacity-90 truncate max-w-[120px]">{q.category}</span>
              </button>
            ))}
          </div>
        )}

        {/* Current Question & Practice Room */}
        {currentQ && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 Columns: Question, Framework & Response Input */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Question {activeQuestionIdx + 1} of {questions.length} • {currentQ.category}
                  </span>

                  {/* Timer widget */}
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{formatTimer(timerSeconds)}</span>
                    <button
                      onClick={toggleTimer}
                      className="ml-1 p-1 hover:text-indigo-600 text-slate-500"
                      title={timerRunning ? 'Stop timer' : 'Start 2-min response timer'}
                    >
                      {timerRunning ? <Square className="w-3 h-3 fill-rose-500 text-rose-500" /> : <Play className="w-3 h-3 fill-emerald-500 text-emerald-500" />}
                    </button>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  "{currentQ.question}"
                </h2>

                {/* Framework Strategy */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Strategy & Recommended Framework:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {currentQ.framework}
                  </p>
                </div>

                {/* Candidate Practice Textarea */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">
                      Your Answer (type or paste draft):
                    </label>
                    <span className="text-slate-400 font-medium text-[11px]">
                      {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>

                  <textarea
                    rows={7}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Draft your response here. Aim for 90 to 180 seconds of speech (around 150-250 words). Follow the recommended framework..."
                    className="w-full p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                  >
                    {showModelAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showModelAnswer ? 'Hide Model Answer' : 'Peek Sample Model Answer'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEvaluate}
                      disabled={isEvaluating || !userAnswer.trim()}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                        !userAnswer.trim() || isEvaluating
                          ? 'bg-slate-300 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                      <span>{isEvaluating ? 'AI Scoring...' : 'Evaluate My Answer'}</span>
                    </button>
                  </div>
                </div>

                {/* Model Answer Drawer if toggled */}
                {showModelAnswer && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 text-xs space-y-2 animate-fadeIn">
                    <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>High-Impact Model Answer:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic bg-white/70 p-3 rounded-xl border border-indigo-100/50">
                      "{currentQ.sampleModelAnswer}"
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Right 5 Columns: Key Talking Points & AI Feedback Evaluation */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Talking Points & Pitfalls Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Key Points to Hit</span>
                </h3>
                <div className="space-y-2">
                  {currentQ.keyTalkingPoints.map((pt, i) => (
                    <div key={i} className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-slate-700 flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pt-2">
                  <HelpCircle className="w-4 h-4 text-rose-500" />
                  <span>Common Traps to Avoid</span>
                </h3>
                <div className="space-y-2">
                  {currentQ.pitfallsToAvoid.map((trap, i) => (
                    <div key={i} className="text-xs bg-rose-50/60 p-2.5 rounded-xl border border-rose-100 text-rose-800 flex items-start gap-2">
                      <span className="text-rose-500 font-bold">✕</span>
                      <span>{trap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Feedback & Score Card (when evaluated) */}
              {evaluationResult && (
                <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md space-y-4 animate-scaleUp">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      AI Feedback & STAR Score
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {evaluationResult.score} / 100
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {evaluationResult.feedback}
                  </p>

                  {/* Strengths */}
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                      Strengths:
                    </span>
                    <div className="space-y-1">
                      {evaluationResult.strengths.map((str, i) => (
                        <div key={i} className="text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Improvements */}
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                      Areas to Improve:
                    </span>
                    <div className="space-y-1">
                      {evaluationResult.areasForImprovement.map((imp, i) => (
                        <div key={i} className="text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1.5">
                          <span className="text-amber-500 font-bold">▲</span>
                          <span>{imp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Polish */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900">AI Suggested Refinement:</span>
                      <button
                        onClick={handleCopyPolish}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        {copiedAnswer ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAnswer ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic bg-white p-3 rounded-xl border border-indigo-100/60">
                      "{evaluationResult.suggestedPolish}"
                    </p>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        </main>
      </PageSlotReveal>
    </div>
  );
}

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-slate-500">Loading Interview Copilot...</div>}>
      <InterviewPrepContent />
    </Suspense>
  );
}
