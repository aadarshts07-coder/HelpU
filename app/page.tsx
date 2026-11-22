import React from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  Search, 
  Send, 
  Camera, 
  CheckCircle2, 
  Lock, 
  Zap, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36 bg-gradient-to-b from-indigo-50/60 via-white to-slate-50">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-3">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Next-Gen Autonomous Career Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto">
            Your Personal AI Agent That <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">Applies For You</span> While You Sleep.
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            <strong>HELP U</strong> extracts your experience, crafts an ATS-perfect resume with Claude, scans LinkedIn, Indeed & Naukri, scores job matches, and completes verified applications via Playwright.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2.5 group"
            >
              <span>Launch Dashboard & Start</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/resume"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-base border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Preview ATS Resume & Letter</span>
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Claude 3.5 Sonnet Precision
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Stealth Playwright Runner
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> AES-256 Encrypted Credentials
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Audit Screenshot Logging
            </span>
          </div>

        </div>
      </section>

      {/* The 6-Step Autonomous Flow */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              The End-To-End Automation Pipeline
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              How HELP U Secures Your Interviews
            </h2>
            <p className="text-sm text-slate-600 mt-3">
              From profile parsing to background submission, every step is automated, audited, and strictly within your control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-200 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-indigo-100">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Multi-Step Profile Builder</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Add education, work history, categorized skills, target job titles, salary targets, and remote/onsite preferences in minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-200 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-purple-100">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Claude ATS Resume & Letter</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                AI synthesizes clean, ATS-compliant bullet points. Live editing, instant PDF print export, and native Microsoft Word DOCX downloads.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-200 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-blue-100">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Cross-Portal Job Scraping</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Scrapes LinkedIn, Indeed, Naukri, and career pages (Greenhouse, Lever, Ashby) to find live opportunities matching your criteria.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-200 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-emerald-100">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">LLM Match Scoring (0-100)</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Claude rates relevance between your background and the job description. Only applies to opportunities meeting your threshold (e.g. 70%+).
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-200 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-amber-100">
                5
              </div>
              <h3 className="font-bold text-slate-900 text-base">Stealth Playwright Auto-Apply</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Opens application forms, types with human delays, uploads tailored resumes, and answers custom questions with Claude API.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-200 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-rose-100">
                6
              </div>
              <h3 className="font-bold text-slate-900 text-base">Live Tracker & Notifications</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Full-page screenshot audit logs, in-app alerts, email dispatches, and 1-click review approval mode for total peace of mind.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Safety & Security Highlights */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Enterprise-Grade Privacy & Safety
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 leading-tight">
                Designed to Protect Your Profile & Data at Every Step.
              </h2>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                We believe job automation must be responsible, transparent, and respectful of portal boundaries. HELP U incorporates intelligent safety measures that protect you from bot bans or inaccurate submissions.
              </p>

              <div className="mt-8 space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white">AES-256 Encrypted Portal Passwords:</strong> Passwords and cookies are encrypted at rest with hardware-grade AES-256-GCM.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white">Smart Obstacle Detection:</strong> Detects CAPTCHAs, Cloudflare Turnstile, and login walls. Pauses and notifies you instead of guessing.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 mt-0.5">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white">Review Mode Toggle:</strong> Choose "Ask me before submitting" to manually inspect filled forms with 1 click before final submission.
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Configure security settings →
                </Link>
              </div>
            </div>

            <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl">
              <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <span>Live Verification Screenshot Stream</span>
              </h3>
              
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    playwright_apply_worker.log
                  </span>
                  <span className="text-emerald-400 font-bold">200 OK</span>
                </div>
                <div className="p-4 font-mono text-[11px] space-y-1 text-slate-300">
                  <p className="text-indigo-400">[09:30:12] Navigating to Stripe Senior Full Stack Engineer form...</p>
                  <p>[09:30:15] Form recognized: Greenhouse board detected</p>
                  <p>[09:30:17] Typing candidate name & contact info with human delays (80ms/char)</p>
                  <p className="text-purple-400">[09:30:20] Claude answering custom prompt: "Why are you interested in Stripe?"</p>
                  <p className="text-emerald-400">[09:30:23] Tailored ATS resume uploaded: Alex_Morgan_Resume_Stripe.docx</p>
                  <p className="text-amber-400">[09:30:24] Review mode active: Holding application for user sign-off</p>
                  <p className="text-slate-500">[09:30:25] Audit screenshot saved: /screenshots/app_stripe_2026.png</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span>Total Applications Sent: <strong>142</strong></span>
                <span className="text-emerald-400 font-bold">Success Rate: 94%</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>HELP U — Autonomous AI Job Application Agent</span>
          </div>
          <div className="flex items-center gap-6 text-slate-600">
            <Link href="/dashboard" className="hover:text-indigo-600 font-semibold">Dashboard</Link>
            <Link href="/profile" className="hover:text-indigo-600 font-semibold">Profile</Link>
            <Link href="/resume" className="hover:text-indigo-600 font-semibold">Resume Generator</Link>
            <Link href="/tracker" className="hover:text-indigo-600 font-semibold">Tracker</Link>
            <Link href="/settings" className="hover:text-indigo-600 font-semibold">Settings</Link>
          </div>
          <p>© {new Date().getFullYear()} HELP U. All user data encrypted.</p>
        </div>
      </footer>
    </div>
  );
}
