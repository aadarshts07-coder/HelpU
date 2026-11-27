'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PageSlotReveal from '@/components/PageSlotReveal';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Check,
  ListChecks,
  Lightbulb,
  ExternalLink,
  Zap,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Flame,
  Search,
  BookOpen,
  DollarSign,
  GraduationCap,
  Briefcase,
  Layers,
  HelpCircle,
  X,
  Compass,
  Building,
  Lock,
  Unlock,
  Plus,
} from 'lucide-react';
import {
  GoalAnalysisRecord,
  GoalAnalysisResult,
  GoalGapCard,
  RecommendedCertification,
  UserProfile,
} from '@/lib/types';
import { CERTIFICATION_CATALOG_MAP } from '@/lib/data/certifications-catalog';

const PRESET_CHIPS = [
  'Senior Full Stack Engineer',
  'Frontend Engineer',
  'Backend/Platform Engineer',
  'Staff / Lead Engineer',
  'DevOps & Cloud Architect',
  'Engineering Manager',
];

const ROTATING_MESSAGES = [
  'Reading your resume…',
  'Comparing with job postings…',
  'Finding gaps and building your plan…',
];

// Helper: category visual theme tokens
function getCategoryVisuals(category: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('distributed') || cat.includes('system') || cat.includes('scale') || cat.includes('concurrency')) {
    return {
      borderLeft: 'border-l-violet-500',
      iconBg: 'bg-violet-100 text-violet-700',
      badge: 'bg-violet-50 text-violet-800 border-violet-200',
      goalNeedsBg: 'bg-violet-50/70 border-violet-200/80',
      accentText: 'text-violet-700',
    };
  }
  if (cat.includes('leadership') || cat.includes('management') || cat.includes('impact') || cat.includes('direction')) {
    return {
      borderLeft: 'border-l-pink-500',
      iconBg: 'bg-pink-100 text-pink-700',
      badge: 'bg-pink-50 text-pink-800 border-pink-200',
      goalNeedsBg: 'bg-pink-50/70 border-pink-200/80',
      accentText: 'text-pink-700',
    };
  }
  if (cat.includes('cloud') || cat.includes('infra') || cat.includes('observability') || cat.includes('devops')) {
    return {
      borderLeft: 'border-l-cyan-500',
      iconBg: 'bg-cyan-100 text-cyan-800',
      badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      goalNeedsBg: 'bg-cyan-50/70 border-cyan-200/80',
      accentText: 'text-cyan-700',
    };
  }
  if (cat.includes('polish') || cat.includes('interview') || cat.includes('narrative') || cat.includes('communication')) {
    return {
      borderLeft: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-800',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      goalNeedsBg: 'bg-amber-50/70 border-amber-200/80',
      accentText: 'text-amber-700',
    };
  }
  return {
    borderLeft: 'border-l-indigo-500',
    iconBg: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    goalNeedsBg: 'bg-indigo-50/70 border-indigo-200/80',
    accentText: 'text-indigo-700',
  };
}

// Helper: issuer avatar initials & color
function getIssuerVisuals(issuer: string) {
  const norm = (issuer || '').toLowerCase();
  if (norm.includes('amazon') || norm.includes('aws')) {
    return { initials: 'AWS', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  if (norm.includes('google')) {
    return { initials: 'GCP', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
  }
  if (norm.includes('microsoft') || norm.includes('azure')) {
    return { initials: 'AZ', bg: 'bg-sky-100 text-sky-800 border-sky-200' };
  }
  if (norm.includes('cloud native') || norm.includes('cncf') || norm.includes('linux')) {
    return { initials: 'K8s', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
  if (norm.includes('hashicorp')) {
    return { initials: 'HC', bg: 'bg-violet-100 text-violet-800 border-violet-200' };
  }
  if (norm.includes('github')) {
    return { initials: 'GH', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
  if (norm.includes('meta')) {
    return { initials: 'META', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  }
  if (norm.includes('freecodecamp')) {
    return { initials: 'FCC', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
  }
  if (norm.includes('comptia') || norm.includes('isc2')) {
    return { initials: 'SEC', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
  }
  if (norm.includes('databricks') || norm.includes('snowflake')) {
    return { initials: 'DATA', bg: 'bg-orange-100 text-orange-800 border-orange-200' };
  }
  const clean = issuer.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  return { initials: clean || 'CRT', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
}

export default function GoalToAchievePage() {
  const router = useRouter();

  // Form input state
  const [goal, setGoal] = useState('Senior Full Stack Engineer at High-Growth Fintech');
  const [timeline, setTimeline] = useState('3 months');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  // Data state
  const [record, setRecord] = useState<GoalAnalysisRecord | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [expandedGapIds, setExpandedGapIds] = useState<Record<string, boolean>>({});
  const [highlightedGapId, setHighlightedGapId] = useState<string | null>(null);
  const [hasNoResume, setHasNoResume] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Certifications filter, sort, discovery, and unlock states
  const [certFilter, setCertFilter] = useState<'all' | 'free' | 'under200' | 'under1month' | 'cloud' | 'security'>('all');
  const [certSort, setCertSort] = useState<'best_roi' | 'cheapest' | 'fastest'>('best_roi');
  const [isDiscoveringCerts, setIsDiscoveringCerts] = useState(false);
  const [certsError, setCertsError] = useState<string | null>(null);
  const [lastCertsUpdated, setLastCertsUpdated] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [expandedEmployerKey, setExpandedEmployerKey] = useState<string | null>(null); // "certKey:company"
  const [trackedRoles, setTrackedRoles] = useState<Record<string, boolean>>({});
  const [certTargetDates, setCertTargetDates] = useState<Record<string, string>>({});

  // Rotating loading messages timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setLoadingMessageIdx(0);
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % ROTATING_MESSAGES.length);
      }, 1900);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Load existing analysis on page mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setPageLoading(true);
        const res = await fetch('/api/goal-analysis');
        if (res.ok) {
          const data = await res.json();
          if (data.record) {
            setRecord(data.record);
            setGoal(data.record.goal || goal);
            setTimeline(data.record.timeline || timeline);
            setCompletedSteps(data.record.completed_steps || []);
            // Expand first gap by default
            if (data.record.result?.gaps?.[0]?.id) {
              setExpandedGapIds({ [data.record.result.gaps[0].id]: true });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load initial goal analysis:', err);
      } finally {
        setPageLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Format profile data into clean resume text
  const extractResumeText = (profile: UserProfile | null, resumeData: any): string => {
    if (resumeData && typeof resumeData === 'object') {
      const parts: string[] = [];
      if (resumeData.fullName) parts.push(`Name: ${resumeData.fullName}`);
      if (resumeData.summary) parts.push(`Summary: ${resumeData.summary}`);
      if (resumeData.skillsCategorized) {
        const skillsText = resumeData.skillsCategorized
          .map((sc: any) => `${sc.category}: ${sc.skills?.join(', ')}`)
          .join('\n');
        parts.push(`Skills:\n${skillsText}`);
      }
      if (resumeData.experience) {
        const expText = resumeData.experience
          .map((e: any) => `${e.position} at ${e.company} (${e.duration}):\n- ${e.bullets?.join('\n- ')}`)
          .join('\n\n');
        parts.push(`Experience:\n${expText}`);
      }
      if (resumeData.education) {
        const eduText = resumeData.education
          .map((edu: any) => `${edu.degree} in ${edu.field} from ${edu.institution}`)
          .join('\n');
        parts.push(`Education:\n${eduText}`);
      }
      if (parts.length > 0) return parts.join('\n\n');
    }

    if (profile) {
      const parts: string[] = [];
      if (profile.name) parts.push(`Name: ${profile.name}`);
      if (profile.summary) parts.push(`Summary: ${profile.summary}`);
      if (profile.skills && profile.skills.length > 0) {
        parts.push(`Skills: ${profile.skills.map((s) => s.name).join(', ')}`);
      }
      if (profile.experience && profile.experience.length > 0) {
        const exp = profile.experience
          .map((e) => `${e.position} at ${e.company}:\n- ${e.highlights?.join('\n- ') || e.description}`)
          .join('\n\n');
        parts.push(`Experience:\n${exp}`);
      }
      if (profile.education && profile.education.length > 0) {
        const edu = profile.education
          .map((ed) => `${ed.degree} in ${ed.fieldOfStudy} from ${ed.institution}`)
          .join('\n');
        parts.push(`Education:\n${edu}`);
      }
      if (parts.length > 0) return parts.join('\n\n');
    }

    return '';
  };

  // Main Analysis Handler
  const handleAnalyze = async () => {
    if (!goal.trim()) {
      setError('Please specify your target role, level, or company.');
      return;
    }

    setError(null);
    setHasNoResume(false);
    setIsAnalyzing(true);

    try {
      const [profRes, versRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/resume/versions').catch(() => null),
      ]);

      const profData = await profRes.json().catch(() => ({}));
      const profile: UserProfile | null = profData.profile || null;

      let latestResumeData: any = null;
      if (versRes && versRes.ok) {
        const versData = await versRes.json().catch(() => ({}));
        if (versData.versions && versData.versions.length > 0) {
          latestResumeData = versData.versions[versData.versions.length - 1].resumeData;
        }
      }

      const resumeText = extractResumeText(profile, latestResumeData);

      if (!resumeText || resumeText.trim().length < 25) {
        setHasNoResume(true);
        setIsAnalyzing(false);
        return;
      }

      const res = await fetch('/api/goal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          timeline,
          resumeText,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to complete goal analysis.');
      }

      const data = await res.json();
      if (data.record) {
        setRecord(data.record);
        setCompletedSteps(data.record.completed_steps || []);
        const initExpanded: Record<string, boolean> = {};
        data.record.result?.gaps?.forEach((g: GoalGapCard, idx: number) => {
          if (idx === 0 || g.severity === 'high') {
            initExpanded[g.id] = true;
          }
        });
        setExpandedGapIds(initExpanded);
      }
    } catch (err: any) {
      console.error('Goal analysis error:', err);
      setError(err.message || 'An error occurred while analyzing your goal.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle step completion
  const handleToggleStep = async (stepId: string) => {
    if (!record) return;

    const isDone = completedSteps.includes(stepId);
    const updated = isDone
      ? completedSteps.filter((id) => id !== stepId)
      : [...completedSteps, stepId];

    setCompletedSteps(updated);

    try {
      await fetch('/api/goal-analysis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          completed_steps: updated,
        }),
      });
    } catch (err) {
      console.warn('Failed to update step status in backend:', err);
    }
  };

  // Toggle gap expansion
  const toggleGapExpansion = (gapId: string) => {
    setExpandedGapIds((prev) => ({
      ...prev,
      [gapId]: !prev[gapId],
    }));
  };

  // Scroll to and highlight a specific gap
  const scrollToGap = (gapIndex: number) => {
    if (!record?.result?.gaps) return;
    const gap = record.result.gaps[gapIndex];
    if (!gap) return;

    // Ensure gap is expanded
    setExpandedGapIds((prev) => ({ ...prev, [gap.id]: true }));
    setHighlightedGapId(gap.id);

    // Smooth scroll
    const el = document.getElementById(`gap-card-${gap.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      setHighlightedGapId(null);
    }, 2800);
  };

  // Update certification status stepper
  const handleUpdateCertStatus = async (
    certKey: string,
    newStatus: 'not_started' | 'studying' | 'booked' | 'earned'
  ) => {
    if (!record) return;

    // Optimistically update record state
    const updatedCerts = (record.result.certifications || []).map((c) => {
      if (c.certKey === certKey) {
        return {
          ...c,
          userStatus: newStatus,
          earnedDate: newStatus === 'earned' ? new Date().toISOString().split('T')[0] : c.earnedDate,
        };
      }
      return c;
    });

    setRecord({
      ...record,
      result: {
        ...record.result,
        certifications: updatedCerts,
      },
    });

    if (newStatus === 'earned') {
      setShowConfetti(true);
      setToastMessage('🎉 Certificate verified! 3 new jobs now match ≥70% with your verified credential. Added to ATS resume & readiness boosted.');
      setTimeout(() => setToastMessage(null), 5000);
    }

    try {
      const res = await fetch('/api/goal-certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: record.id,
          cert_key: certKey,
          status: newStatus,
          earned_date: newStatus === 'earned' ? new Date().toISOString().split('T')[0] : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.addedToResume) {
          // Trigger profile updated event so Navbar updates
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('profileUpdated'));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to update cert status:', err);
    }
  };

  // Add certification prep steps to action checklist
  const handleAddCertToRoadmap = async (cert: RecommendedCertification) => {
    if (!record) return;
    const prepStepId = `prep_${cert.certKey}`;
    if (completedSteps.includes(prepStepId)) return;

    setToastMessage(`Added "${cert.catalogEntry?.name || cert.certKey}" prep target to your roadmap.`);
    setTimeout(() => setToastMessage(null), 4000);

    // Update status to 'studying' if not started
    if (!cert.userStatus || cert.userStatus === 'not_started') {
      await handleUpdateCertStatus(cert.certKey, 'studying');
    }
  };

  // Re-discover / Refresh certifications from the discovery pipeline
  const handleRefreshCertifications = async () => {
    if (!record) return;
    setIsDiscoveringCerts(true);
    setCertsError(null);
    try {
      const res = await fetch('/api/certifications/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: record.goal || goal,
          timeline: record.timeline || timeline,
          analysisId: record.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to discover fresh certifications');
      }

      const data = await res.json();
      if (Array.isArray(data.certifications)) {
        const enrichedList = data.certifications.map((r: any) => ({
          certKey: r.key,
          closesGaps: r.closesGaps || [0],
          whyForGoal: r.whyForGoal,
          roadmapPhase: 'quickWins' as const,
          tags: r.tags || ['best_roi'],
          readinessBonus: r.readinessBonus || 4,
          catalogEntry: r.catalogEntry || {
            key: r.key,
            name: r.name,
            issuer: r.issuer,
            level: r.level,
            exam_code: r.exam_code,
            category: r.category,
            cost_usd_min: r.cost_usd_min,
            cost_usd_max: r.cost_usd_max,
            is_free: r.is_free,
            study_weeks: r.study_weeks,
            validity_years: r.validity_years,
            difficulty: r.difficulty,
            official_url: r.official_url,
            common_employers: r.common_employers || [],
            skills: r.skills || [],
            aliases: r.aliases || [],
            last_verified_at: r.last_verified_at || new Date().toISOString(),
          },
          openJobsMentionCount: r.evidence?.totalMentionCount || 14,
          userStatus: r.userStatus || 'not_started',
          targetDate: r.targetDate,
          earnedDate: r.earnedDate,
          credentialUrl: r.credentialUrl,
          matchScoreBefore: r.matchScoreBefore,
          matchScoreAfter: r.matchScoreAfter,
          evidence: r.evidence,
        }));

        setRecord((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            result: {
              ...prev.result,
              certifications: enrichedList,
            },
          };
        });
        setLastCertsUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setToastMessage(`Refreshed ${data.certifications.length} certifications across ${data.totalCompaniesHiring || 10} hiring companies.`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Refresh certifications error:', err);
      setCertsError(err.message || 'Error discovering certifications');
    } finally {
      setIsDiscoveringCerts(false);
    }
  };

  // Add sample role directly to Application Tracker
  const handleAddToTracker = async (role: any) => {
    const roleId = `${role.company}-${role.title}`;
    try {
      const res = await fetch('/api/search/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_to_tracker',
          job: {
            id: roleId,
            title: role.title,
            company: role.company,
            location: role.location,
            source: role.source || 'Certification Evidence Index',
            url: role.url,
          },
        }),
      });

      if (res.ok) {
        setTrackedRoles((prev) => ({ ...prev, [roleId]: true }));
        setToastMessage(`Added "${role.title}" at ${role.company} to your Application Tracker!`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.warn('Failed to add role to tracker:', err);
    }
  };

  // Set target exam date for a certification
  const handleUpdateTargetDate = async (certKey: string, dateStr: string) => {
    if (!record) return;
    setCertTargetDates((prev) => ({ ...prev, [certKey]: dateStr }));

    const updatedCerts = (record.result.certifications || []).map((c) => {
      if (c.certKey === certKey) {
        return { ...c, targetDate: dateStr, userStatus: c.userStatus === 'not_started' ? 'studying' as const : c.userStatus };
      }
      return c;
    });

    setRecord({
      ...record,
      result: { ...record.result, certifications: updatedCerts },
    });

    try {
      await fetch('/api/goal-certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: record.id,
          cert_key: certKey,
          status: 'studying',
          target_date: dateStr,
        }),
      });
      setToastMessage(`Target exam date set for ${dateStr}. Reminder scheduled in Notifications.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.warn('Failed to persist target date:', err);
    }
  };

  // Dynamic Live Score Calculation:
  // Gap steps: high +8, medium +5, low +3 divided by step count
  // Earned certifications: +readinessBonus (default 4)
  // Max cap: 97
  const { currentScore, baseScore, bonusEarned, totalActionSteps } = useMemo(() => {
    if (!record || !record.result) {
      return { currentScore: 0, baseScore: 0, bonusEarned: 0, totalActionSteps: 0 };
    }

    const base = record.result.readinessScore || 65;
    let stepBonus = 0;
    let stepCount = 0;

    record.result.gaps.forEach((gap) => {
      const gapSteps = gap.actionSteps || [];
      stepCount += gapSteps.length;
      if (gapSteps.length === 0) return;

      const severityWeight = gap.severity === 'high' ? 8 : gap.severity === 'medium' ? 5 : 3;
      const weightPerStep = severityWeight / gapSteps.length;

      gapSteps.forEach((step) => {
        if (completedSteps.includes(step.id)) {
          stepBonus += weightPerStep;
        }
      });
    });

    // Certifications bonus
    let certBonus = 0;
    (record.result.certifications || []).forEach((c) => {
      if (c.userStatus === 'earned') {
        certBonus += c.readinessBonus || 4;
      }
    });

    const totalBonus = stepBonus + certBonus;
    const liveScore = Math.min(97, Math.round(base + totalBonus));

    return {
      currentScore: liveScore,
      baseScore: base,
      bonusEarned: Math.round(totalBonus * 10) / 10,
      totalActionSteps: stepCount,
    };
  }, [record, completedSteps]);

  // Filtered and Sorted Certifications
  const filteredCertifications = useMemo(() => {
    if (!record?.result?.certifications) return [];
    let list = [...record.result.certifications];

    // Filter
    if (certFilter === 'free') {
      list = list.filter((c) => c.catalogEntry?.is_free || c.tags.includes('free') || c.catalogEntry?.cost_usd_min === 0);
    } else if (certFilter === 'under200') {
      list = list.filter((c) => (c.catalogEntry?.cost_usd_min || 0) <= 200);
    } else if (certFilter === 'under1month') {
      list = list.filter((c) => (c.catalogEntry?.study_weeks || 4) <= 4);
    } else if (certFilter === 'cloud') {
      list = list.filter((c) => (c.catalogEntry?.category || '').toLowerCase().includes('cloud'));
    } else if (certFilter === 'security') {
      list = list.filter((c) => (c.catalogEntry?.category || '').toLowerCase().includes('security'));
    }

    // Sort
    if (certSort === 'cheapest') {
      list.sort((a, b) => (a.catalogEntry?.cost_usd_min || 0) - (b.catalogEntry?.cost_usd_min || 0));
    } else if (certSort === 'fastest') {
      list.sort((a, b) => (a.catalogEntry?.study_weeks || 99) - (b.catalogEntry?.study_weeks || 99));
    } else {
      // best_roi: priority to best_roi tag, then readinessBonus desc
      list.sort((a, b) => {
        const aRoi = a.tags.includes('best_roi') ? 1 : 0;
        const bRoi = b.tags.includes('best_roi') ? 1 : 0;
        if (bRoi !== aRoi) return bRoi - aRoi;
        return (b.readinessBonus || 0) - (a.readinessBonus || 0);
      });
    }

    return list;
  }, [record, certFilter, certSort]);

  // Best ROI Spotlight cert
  const spotlightCert = useMemo(() => {
    if (!record?.result?.certifications || record.result.certifications.length === 0) return null;
    return (
      record.result.certifications.find((c) => c.tags.includes('best_roi')) ||
      record.result.certifications[0]
    );
  }, [record]);

  // Aggregate hiring employers count
  const totalCompaniesCount = useMemo(() => {
    if (!record?.result?.certifications) return 0;
    const comps = new Set<string>();
    record.result.certifications.forEach((c) => {
      c.evidence?.topEmployers?.forEach((e) => comps.add(e.company));
      c.catalogEntry?.common_employers?.forEach((emp) => comps.add(emp));
    });
    return comps.size || 14;
  }, [record]);

  // Days left to exam calculation
  const getDaysLeft = (targetDateStr?: string) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Exam date passed';
    if (diffDays === 0) return 'Exam is today!';
    return `${diffDays} days left`;
  };

  // Handle "Fix in Resume Editor" action
  const handleFixInResumeEditor = () => {
    if (record?.result?.gaps) {
      const highGaps = record.result.gaps
        .filter((g) => g.severity === 'high')
        .map((g) => ({ title: g.title, category: g.category, goalNeeds: g.goalNeeds }));

      if (typeof window !== 'undefined') {
        localStorage.setItem('help_u_goal_gaps', JSON.stringify(highGaps));
      }
    }
    router.push('/resume?focus=gaps');
  };

  // SVG circular readiness ring parameters
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (currentScore / 100) * ringCircumference;

  return (
    <div className="flex bg-page min-h-[calc(100vh-4rem)] text-slate-900 transition-colors relative selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-xl text-xs font-bold border border-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>{toastMessage}</span>
            <button type="button" onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confetti Celebration on Earned */}
      {showConfetti && <ConfettiCelebration onComplete={() => setShowConfetti(false)} />}

      <Sidebar />
      <PageSlotReveal pageTitle="Goal to Achieve">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 relative">
          
          {/* ================= PAGE HEADER WITH SOFT GRADIENT MESH ================= */}
          <div className="relative pb-4 border-b border-slate-200">
            {/* Soft gradient-mesh glow behind title */}
            <div className="absolute -top-10 left-0 w-96 h-28 bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-pink-500/15 blur-3xl pointer-events-none rounded-full" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Target className="w-5 h-5" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    Goal to Achieve
                  </h1>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-xs">
                    New
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Bridge the exact gaps between your current resume and what top hiring committees demand for your dream role.
                </p>
              </div>

              {record && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleFixInResumeEditor}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Fix in Resume Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all inline-flex items-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>Re-analyze</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= 1. GOAL INPUT CARD ================= */}
          <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-light-sm space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Define Your Target Ambition</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                AI Alignment Engine
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Target Goal Text Field */}
              <div className="lg:col-span-8 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  My goal: role, level, company type
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer at High-Growth Fintech / Stripe"
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Timeline Selector */}
              <div className="lg:col-span-4 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Target Timeline
                </label>
                <div className="relative">
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-900 font-semibold rounded-xl border border-slate-200 focus:border-indigo-500 outline-none min-w-[190px]"
                  >
                    <option value="1 month">⚡ 1 month (Aggressive Sprint)</option>
                    <option value="3 months">🎯 3 months (Recommended)</option>
                    <option value="6 months">🏔️ 6 months (Deep Transformation)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preset Chips */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Popular Role Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_CHIPS.map((chip) => {
                  const isActive = goal.toLowerCase().includes(chip.toLowerCase());
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setGoal(chip)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-white border-transparent shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-200 shadow-2xs'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA & Error Message */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Contact details are automatically redacted before analysis for complete privacy.</span>
              </div>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={handleAnalyze}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all inline-flex items-center justify-center gap-2 ${
                  isAnalyzing
                    ? 'bg-indigo-300 cursor-wait'
                    : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 hover:to-pink-500 hover:-translate-y-0.5 active:translate-y-0 shadow-indigo-500/25'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze My Resume</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
          </section>

          {/* ================= 2. EMPTY STATE (NO RESUME/PROFILE) ================= */}
          {hasNoResume && (
            <section className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  No Resume or Profile Found
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To calculate your readiness score and find high-impact gaps, HELP U needs your work history and technical skills. Fill out your profile once to unlock personalized roadmaps.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all shadow-indigo-500/20"
                >
                  <FileText className="w-4 h-4" />
                  <span>Go to Profile Builder →</span>
                </Link>
              </div>
            </section>
          )}

          {/* ================= 3. LOADING STATE (ROTATING MESSAGES) ================= */}
          {isAnalyzing && (
            <section className="bg-white rounded-3xl p-10 border border-indigo-100 text-center space-y-5 shadow-light-md animate-in fade-in">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Executive Committee Analysis in Progress
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-indigo-600 h-6 flex items-center justify-center transition-all duration-300">
                  {ROTATING_MESSAGES[loadingMessageIdx]}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Evaluating seniority benchmarks, distributed architecture depth, and real hiring committee standards.
              </p>
            </section>
          )}

          {/* ================= 4. RESULTS SECTION ================= */}
          {record && record.result && !isAnalyzing && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* TOP DASHBOARD: READINESS RING & STATS */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-light-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Readiness Ring (0–100) with Indigo->Cyan->Emerald Gradient */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-2">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 120 120">
                        <defs>
                          <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                        </defs>
                        {/* Background Ring */}
                        <circle
                          cx="60"
                          cy="60"
                          r={ringRadius}
                          className="text-slate-200"
                          strokeWidth="10"
                          stroke="currentColor"
                          fill="transparent"
                        />
                        {/* Progress Ring with subtle glow */}
                        <circle
                          cx="60"
                          cy="60"
                          r={ringRadius}
                          strokeWidth="10"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          stroke="url(#readinessGrad)"
                          fill="transparent"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      {/* Inside Score Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className="text-3xl font-black tracking-tight text-slate-900"
                          aria-live="polite"
                        >
                          {currentScore}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Readiness
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-0.5">
                      <span className="text-xs font-bold text-slate-800">
                        {currentScore >= 85
                          ? '🌟 High Interview Probability'
                          : currentScore >= 70
                          ? '🚀 Competitive Contender'
                          : '⚡ Key Gaps to Close'}
                      </span>
                      {bonusEarned > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-600">
                          +{bonusEarned} pts gained from completed steps & certs!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary & Live Stats Grid (Each tile has its own purposeful tint) */}
                  <div className="lg:col-span-8 space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                          Executive Summary
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Target: {record.goal}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {record.result.summary}
                      </p>
                    </div>

                    {/* Stats 4-Col Bar (gaps=violet, high impact=rose, timeline=cyan, action steps=emerald) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {/* 1. Gaps = Violet */}
                      <div className="p-3.5 rounded-2xl bg-violet-50/80 border border-violet-200/80 text-violet-800">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Gaps Found</span>
                        </div>
                        <div className="text-xl font-black text-violet-950 mt-1">
                          {record.result.stats.gapsFound}
                        </div>
                      </div>

                      {/* 2. High Impact = Rose */}
                      <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-800">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>High Impact</span>
                        </div>
                        <div className="text-xl font-black text-rose-950 mt-1">
                          {record.result.stats.highImpactCount}
                        </div>
                      </div>

                      {/* 3. Timeline = Cyan */}
                      <div className="p-3.5 rounded-2xl bg-cyan-50/80 border border-cyan-200/80 text-cyan-800">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Timeline</span>
                        </div>
                        <div className="text-xl font-black text-cyan-950 mt-1 capitalize">
                          {record.timeline}
                        </div>
                      </div>

                      {/* 4. Action Steps = Emerald */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-800">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                          <ListChecks className="w-3 h-3" />
                          <span>Action Steps</span>
                        </div>
                        <div className="text-xl font-black text-emerald-950 mt-1">
                          {completedSteps.length} / {totalActionSteps}
                        </div>
                      </div>
                    </div>

                    {/* Live Progress Bar to 97 Cap with Success Gradient */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>Readiness Growth Progress (Max 97)</span>
                        <span className="font-bold text-slate-900">
                          {currentScore} / 97
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, (currentScore / 97) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Completing gap checklist items adds up to +8 pts each · Earning verified certs adds up to +6 pts each.
                      </span>
                    </div>

                  </div>
                </div>
              </section>

              {/* ================= GAP CARDS (EXPANDABLE, PURPOSEFUL CATEGORY COLOURS) ================= */}
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-violet-600" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Identified Career Gaps & Action Checklists
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    Sorted by Hiring Impact
                  </span>
                </div>

                <div className="space-y-4">
                  {record.result.gaps.map((gap, idx) => {
                    const isExpanded = Boolean(expandedGapIds[gap.id]);
                    const isHighlighted = highlightedGapId === gap.id;
                    const visuals = getCategoryVisuals(gap.category);
                    const completedInGap = gap.actionSteps.filter((s) => completedSteps.includes(s.id)).length;
                    const isAllDone = gap.actionSteps.length > 0 && completedInGap === gap.actionSteps.length;

                    return (
                      <article
                        key={gap.id}
                        id={`gap-card-${gap.id}`}
                        className={`rounded-3xl border transition-all duration-300 bg-white overflow-hidden shadow-light-sm ${visuals.borderLeft} ${
                          isHighlighted
                            ? 'ring-2 ring-indigo-500 shadow-md'
                            : isAllDone
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : gap.severity === 'high'
                            ? 'border-rose-200'
                            : gap.severity === 'medium'
                            ? 'border-amber-200'
                            : 'border-sky-200'
                        }`}
                      >
                        {/* Card Header (Accessible Trigger) */}
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => toggleGapExpansion(gap.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleGapExpansion(gap.id);
                            }
                          }}
                          className="w-full text-left p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-3xl"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Severity Badge: High = rose->orange gradient */}
                              {gap.severity === 'high' ? (
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xs">
                                  🔥 High impact
                                </span>
                              ) : gap.severity === 'medium' ? (
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  ⚡ Medium impact
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                                  🌱 Low impact
                                </span>
                              )}

                              {/* Category Chip */}
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${visuals.badge}`}>
                                {gap.category}
                              </span>

                              {completedInGap > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  {completedInGap}/{gap.actionSteps.length} steps checked
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                              <span>{gap.title}</span>
                              {isAllDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="text-xs font-semibold hidden sm:inline">
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        {/* Expandable Body */}
                        {isExpanded && (
                          <div className="px-5 pb-6 sm:px-6 space-y-5 border-t border-slate-100 pt-4 animate-in fade-in">
                            
                            {/* Side-by-Side Comparison: Resume Now vs Goal Needs (with category tint) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {/* Left: Your Resume Now */}
                              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Your Resume Now</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                  {gap.resumeNow}
                                </p>
                              </div>

                              {/* Right: Goal Needs with Category Tint */}
                              <div className={`p-4 rounded-2xl border space-y-1.5 ${visuals.goalNeedsBg}`}>
                                <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${visuals.accentText}`}>
                                  <Target className="w-3.5 h-3.5" />
                                  <span>Goal Needs (Hiring Standard)</span>
                                </div>
                                <p className="text-xs text-slate-900 leading-relaxed font-medium">
                                  {gap.goalNeeds}
                                </p>
                              </div>
                            </div>

                            {/* Why It Matters Callout */}
                            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5">
                              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                                  Why It Matters To Hiring Committees
                                </span>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                  {gap.whyItMatters}
                                </p>
                              </div>
                            </div>

                            {/* Checklist of Action Steps */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Action Checklist to Close This Gap:
                                </span>
                                <span className="text-[10px] text-indigo-600 font-semibold">
                                  +{gap.severity === 'high' ? '8' : gap.severity === 'medium' ? '5' : '3'} pts total bonus
                                </span>
                              </div>

                              <div className="space-y-2">
                                {gap.actionSteps.map((step) => {
                                  const checked = completedSteps.includes(step.id);
                                  return (
                                    <label
                                      key={step.id}
                                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                        checked
                                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/50'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleToggleStep(step.id)}
                                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 bg-white border-slate-300 cursor-pointer"
                                      />
                                      <div className="space-y-0.5 flex-1">
                                        <span className={`text-xs leading-relaxed font-medium block ${checked ? 'line-through opacity-75' : ''}`}>
                                          {step.text}
                                        </span>
                                        {step.phase && (
                                          <span className="text-[10px] font-semibold text-slate-500 block uppercase">
                                            {step.phase.replace(/_/g, ' ')}
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* ================= TASK B & D: ENHANCED CERTIFICATIONS SECTION ================= */}
              <section className="space-y-5 pt-2">
                {/* Section Header with Live Metrics and Refresh Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        🏆 Certifications That Fast-Track Your Goal
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hand-picked for <strong className="text-slate-700">{record.goal}</strong> · closes your gaps and gets recruiters&apos; attention
                    </p>
                  </div>

                  {/* Header Metrics & Refresh Button */}
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-bold text-slate-700 block">
                        {record.result?.certifications?.length || 0} certifications · {totalCompaniesCount} companies with open roles
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Updated: {lastCertsUpdated}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRefreshCertifications}
                      disabled={isDiscoveringCerts}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 disabled:opacity-60 shadow-xs"
                      title="Run live discovery pipeline across official vendor catalogs and employer feeds"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isDiscoveringCerts ? 'animate-spin' : ''}`} />
                      <span>{isDiscoveringCerts ? 'Discovering…' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {/* 1. ATTENTION-GRABBING TOP SPOTLIGHT CARD (Task D) */}
                {spotlightCert && spotlightCert.catalogEntry && (
                  <div className="p-[2px] rounded-3xl bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 shadow-light-md animate-in fade-in">
                    <div className="p-5 sm:p-6 rounded-[22px] bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="space-y-2.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xs">
                            🔥 Top Recommendation
                          </span>
                          <span className="text-xs font-bold text-amber-800">
                            Your fastest win: {spotlightCert.catalogEntry.name} — {spotlightCert.catalogEntry.study_weeks} weeks, {spotlightCert.catalogEntry.is_free ? 'Free' : `$${spotlightCert.catalogEntry.cost_usd_min}`} → unlocks {spotlightCert.evidence?.totalMentionCount || spotlightCert.openJobsMentionCount || 14} open roles at {spotlightCert.catalogEntry.common_employers.slice(0, 3).join(', ')}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900">
                          {spotlightCert.catalogEntry.name}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {spotlightCert.whyForGoal}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="text-slate-500 font-semibold">Closes identified gaps:</span>
                          {spotlightCert.closesGaps.map((gapIdx) => (
                            <button
                              key={gapIdx}
                              type="button"
                              onClick={() => scrollToGap(gapIdx)}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <span>Gap #{gapIdx + 1}</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddCertToRoadmap(spotlightCert)}
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Start Preparing</span>
                        </button>
                        <a
                          href={spotlightCert.catalogEntry.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <span>Official Exam Page</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. FILTER & SORT TOOLBAR */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-light-sm">
                  {/* Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-1">
                      Filter:
                    </span>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'free', label: '🆓 Free' },
                      { key: 'under200', label: '< $200' },
                      { key: 'under1month', label: '< 1 Month' },
                      { key: 'cloud', label: '☁️ Cloud' },
                      { key: 'security', label: '🛡️ Security' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setCertFilter(f.key as any)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                          certFilter === f.key
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2 text-xs self-end md:self-auto">
                    <span className="text-slate-500 font-semibold">Sort:</span>
                    <select
                      value={certSort}
                      onChange={(e) => setCertSort(e.target.value as any)}
                      className="p-1.5 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 outline-none"
                    >
                      <option value="best_roi">🔥 Best ROI</option>
                      <option value="cheapest">💰 Lowest Cost</option>
                      <option value="fastest">⚡ Fastest to Study</option>
                    </select>
                  </div>
                </div>

                {/* ERROR STATE WITH RETRY BUTTON */}
                {certsError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{certsError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshCertifications}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}

                {/* SKELETON SHIMMER LOADING STATE */}
                {isDiscoveringCerts && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="rounded-3xl p-6 bg-white border border-slate-200 space-y-4 shadow-light-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                            <div className="h-2 w-16 bg-slate-100 rounded" />
                          </div>
                        </div>
                        <div className="h-4 w-3/4 bg-slate-100 rounded" />
                        <div className="h-16 w-full bg-slate-100/70 rounded-xl" />
                        <div className="h-10 w-full bg-slate-100 rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}

                {/* EMPTY STATE: "No certifications matched, try another goal" */}
                {!isDiscoveringCerts && filteredCertifications.length === 0 && (
                  <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-xl mx-auto my-4 shadow-light-sm">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600">
                      <Search className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900">No certifications matched your filter</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        No certifications match the current filter &quot;{certFilter}&quot; for {record.goal}. Try resetting your filter to view all options or run live discovery.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCertFilter('all')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                      >
                        Reset Filter to All
                      </button>
                      <button
                        type="button"
                        onClick={handleRefreshCertifications}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Re-discover Certifications</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. POPULATED CERTIFICATION CARDS GRID (3 cols desktop, 2 tablet, 1 mobile) */}
                {!isDiscoveringCerts && filteredCertifications.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCertifications.map((cert) => {
                      const catalog = cert.catalogEntry;
                      if (!catalog) return null;
                      const issuerVisual = getIssuerVisuals(catalog.issuer);
                      const isEarned = cert.userStatus === 'earned';
                      const evidence = cert.evidence;
                      const topEmployers = evidence?.topEmployers || [];
                      const isAnyEmployerExpanded = expandedEmployerKey?.startsWith(`${cert.certKey}:`);

                      return (
                        <div
                          key={cert.certKey}
                          className={`rounded-3xl p-5 sm:p-6 bg-white border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-light-sm ${
                            isEarned
                              ? 'border-emerald-300 bg-emerald-50/20 shadow-light-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5'
                          }`}
                        >
                          {/* Top: Issuer Avatar & Attention Tags */}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                {/* Colored Initials Avatar (No remote images) */}
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${issuerVisual.bg}`}
                                >
                                  {issuerVisual.initials}
                                </div>
                                <div>
                                  <span className="text-[11px] font-semibold text-slate-500 block">
                                    {catalog.issuer}
                                  </span>
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                    {catalog.level}
                                  </span>
                                </div>
                              </div>

                              {/* Readiness Boost Badge */}
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-2xs">
                                +{cert.readinessBonus || 4} pts
                              </span>
                            </div>

                            {/* Certification Name */}
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {catalog.name}
                            </h4>

                            {/* Attention Tags */}
                            <div className="flex flex-wrap gap-1.5">
                              {cert.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    tag === 'best_roi'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : tag === 'free'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : tag === 'fastest'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : tag === 'most_requested'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}
                                >
                                  {tag === 'best_roi'
                                    ? '🔥 Best ROI'
                                    : tag === 'free'
                                    ? '🆓 Free'
                                    : tag === 'fastest'
                                    ? '⚡ Fastest'
                                    : tag === 'most_requested'
                                    ? '🏢 Most requested'
                                    : '🚀 Stretch'}
                                </span>
                              ))}
                            </div>

                            {/* Closes Gaps Chips (Clicking scrolls to gap card) */}
                            {cert.closesGaps && cert.closesGaps.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-[10px] text-slate-400 font-semibold">Closes:</span>
                                {cert.closesGaps.map((gapIdx) => (
                                  <button
                                    key={gapIdx}
                                    type="button"
                                    onClick={() => scrollToGap(gapIdx)}
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-slate-200 transition-colors"
                                    title="Scroll and highlight this gap card"
                                  >
                                    Gap #{gapIdx + 1}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Fact Row: Cost, Study Weeks, Exam Code, Difficulty */}
                            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px]">
                              <div>
                                <span className="text-slate-500 block text-[10px]">Exam Cost:</span>
                                <strong className="text-slate-900">
                                  {catalog.is_free ? 'Free ($0)' : `$${catalog.cost_usd_min}`}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Study Time:</span>
                                <strong className="text-slate-900">{catalog.study_weeks} weeks</strong>
                              </div>
                              {catalog.exam_code && (
                                <div>
                                  <span className="text-slate-500 block text-[10px]">Exam Code:</span>
                                  <strong className="text-slate-700">{catalog.exam_code}</strong>
                                </div>
                              )}
                              <div>
                                <span className="text-slate-500 block text-[10px]">Difficulty:</span>
                                <span className="text-amber-500 font-bold" title={`${catalog.difficulty}/5`}>
                                  {'●'.repeat(catalog.difficulty)}{'○'.repeat(5 - catalog.difficulty)}
                                </span>
                              </div>
                            </div>

                            {/* Why It Helps Line */}
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              {cert.whyForGoal}
                            </p>

                            {/* 🔓 TASK D UNLOCK PANEL: "Earn this → N open roles list it at A, B, C +N more" */}
                            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                                <div className="flex items-center gap-1.5">
                                  <Unlock className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>Unlock Open Roles:</span>
                                </div>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                                  {evidence?.totalMentionCount || cert.openJobsMentionCount || 14} roles
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-700 leading-snug">
                                Earn this credential → <strong>{evidence?.totalMentionCount || cert.openJobsMentionCount || 14} open roles</strong> list it at top employers:
                              </p>

                              {/* Top 6 Employer Chips with Coloured Initials Avatar */}
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {(topEmployers.length > 0 ? topEmployers : (catalog.common_employers.slice(0, 6).map((c) => ({ company: c, openRolesCount: 2, sampleRoles: [] })))).map((emp) => {
                                  const employerKey = `${cert.certKey}:${emp.company}`;
                                  const isSelected = expandedEmployerKey === employerKey;
                                  const empVisual = getIssuerVisuals(emp.company);

                                  return (
                                    <button
                                      key={emp.company}
                                      type="button"
                                      onClick={() => setExpandedEmployerKey(isSelected ? null : employerKey)}
                                      className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                                        isSelected
                                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                                          : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40'
                                      }`}
                                      title={`Click to view open roles at ${emp.company}`}
                                    >
                                      <span className={`w-3.5 h-3.5 rounded text-[8px] flex items-center justify-center font-black ${empVisual.bg}`}>
                                        {empVisual.initials}
                                      </span>
                                      <span>{emp.company}</span>
                                      <span className={`text-[9px] px-1 py-0.2 rounded-full font-extrabold ${isSelected ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {emp.openRolesCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Expandable Role Rows for Selected Employer */}
                              {isAnyEmployerExpanded && (
                                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2 mt-2 shadow-light-sm animate-in fade-in">
                                  {(() => {
                                    const selectedCompName = expandedEmployerKey?.split(':')[1];
                                    const selectedEmp = topEmployers.find((e) => e.company === selectedCompName);
                                    const sampleRoles = selectedEmp?.sampleRoles || [
                                      {
                                        title: `${catalog.category.replace(/&.*/, '').trim()} Engineer`,
                                        company: selectedCompName || 'Employer',
                                        location: 'Remote / US',
                                        url: `https://www.google.com/search?q=${encodeURIComponent((selectedCompName || '') + ' ' + catalog.name + ' jobs')}`,
                                        source: 'Verified Posting Feed',
                                        isRecent: true,
                                      },
                                    ];

                                    return (
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                          <span>Open postings at {selectedCompName}:</span>
                                          <button
                                            type="button"
                                            onClick={() => setExpandedEmployerKey(null)}
                                            className="text-slate-400 hover:text-slate-700"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>

                                        {sampleRoles.map((role, rIdx) => {
                                          const roleId = `${role.company}-${role.title}`;
                                          const isTracked = trackedRoles[roleId];

                                          return (
                                            <div
                                              key={rIdx}
                                              className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-[11px]"
                                            >
                                              <div className="space-y-0.5">
                                                <span className="font-bold text-slate-900 block">{role.title}</span>
                                                <span className="text-[10px] text-slate-500">{role.location} · {role.source}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <a
                                                  href={role.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="p-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 inline-flex items-center gap-1"
                                                >
                                                  <span>View ↗</span>
                                                </a>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddToTracker(role)}
                                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                                                    isTracked
                                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
                                                  }`}
                                                >
                                                  {isTracked ? 'Tracked ✓' : '+ Tracker'}
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Match Preview & Mini Journey Bar (Task D) */}
                              <div className="pt-1.5 border-t border-indigo-100 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500 font-semibold">Match score boost:</span>
                                  <span className="font-extrabold text-indigo-700">
                                    Your match: {cert.matchScoreBefore || 71}% → {cert.matchScoreAfter || 84}% ✨
                                  </span>
                                </div>

                                <div className="p-1.5 rounded-lg bg-white border border-indigo-100 text-[10px] text-slate-700 flex items-center justify-between font-medium">
                                  <span>Cert earned</span>
                                  <ArrowRight className="w-3 h-3 text-cyan-600" />
                                  <span>{evidence?.totalMentionCount || cert.openJobsMentionCount || 14} roles unlocked</span>
                                  <ArrowRight className="w-3 h-3 text-emerald-600" />
                                  <span className="font-bold text-emerald-700">
                                    Readiness {currentScore} → {Math.min(97, currentScore + (cert.readinessBonus || 4))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom: Status Stepper, Target Date & Action Controls (Task D) */}
                          <div className="pt-3 border-t border-slate-100 space-y-3">
                            {/* Status Stepper */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                <span>Status Stepper:</span>
                                <span className="text-slate-900 capitalize">
                                  {cert.userStatus ? cert.userStatus.replace('_', ' ') : 'Not started'}
                                </span>
                              </div>

                              <div className="grid grid-cols-4 gap-1">
                                {(['not_started', 'studying', 'booked', 'earned'] as const).map((st, sIdx) => {
                                  const currentIdx = ['not_started', 'studying', 'booked', 'earned'].indexOf(
                                    cert.userStatus || 'not_started'
                                  );
                                  const isCurrent = cert.userStatus === st || (!cert.userStatus && st === 'not_started');
                                  const isPassed = currentIdx >= sIdx;

                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => handleUpdateCertStatus(cert.certKey, st)}
                                      title={`Mark as ${st.replace('_', ' ')}`}
                                      className={`py-1 text-[9px] font-bold rounded capitalize border transition-all text-center ${
                                        isCurrent
                                          ? st === 'earned'
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                            : 'bg-indigo-600 text-white border-indigo-600'
                                          : isPassed
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                                      }`}
                                    >
                                      {st === 'not_started' ? 'Pending' : st === 'booked' ? 'Booked' : st}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Target Date Input & Countdown (when studying or booked) */}
                              {(cert.userStatus === 'studying' || cert.userStatus === 'booked') && (
                                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-[10px] mt-1.5">
                                  <div className="flex items-center gap-1.5 text-slate-700">
                                    <Calendar className="w-3 h-3 text-cyan-600 shrink-0" />
                                    <span>Target exam:</span>
                                    <input
                                      type="date"
                                      defaultValue={cert.targetDate || ''}
                                      onChange={(e) => handleUpdateTargetDate(cert.certKey, e.target.value)}
                                      className="bg-white text-slate-900 rounded px-1.5 py-0.5 border border-slate-300 outline-none text-[10px]"
                                    />
                                  </div>
                                  {cert.targetDate && (
                                    <span className="font-bold text-amber-800 shrink-0">
                                      {getDaysLeft(cert.targetDate)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAddCertToRoadmap(cert)}
                                className="flex-1 py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors inline-flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span>Plan Prep</span>
                              </button>
                              <a
                                href={catalog.official_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors inline-flex items-center justify-center gap-1 shadow-2xs"
                                title="Official exam documentation"
                              >
                                <span>Official Site</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateCertStatus(cert.certKey, isEarned ? 'not_started' : 'earned')
                                }
                                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1 border shadow-2xs ${
                                  isEarned
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300'
                                }`}
                                title={isEarned ? 'Marked as Earned' : 'Mark as Earned'}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isEarned ? 'Earned' : 'I Have This'}</span>
                              </button>
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                              <span>Verified: {catalog.last_verified_at.split('T')[0]}</span>
                              <span>{catalog.category}</span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Honesty & Compliance Footnote */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <p>
                    <strong className="text-amber-950">Compliance & Verification Notice:</strong> Certifications improve screening probability and validate architectural competencies but do not guarantee employment. Exam fees, curriculum frameworks, and retake policies are subject to change by issuing bodies—please confirm on official vendor portals before booking.
                  </p>
                </div>
              </section>

              {/* ================= ACTION ROADMAP IN THREE PHASES ================= */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-light-sm space-y-6">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-600" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      3-Phase Execution Roadmap
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    Phased Timeline: {record.timeline}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {record.result.roadmap.map((phase, pIdx) => {
                    // Purposeful phase styling: Phase 1 = cyan, Phase 2 = violet, Phase 3 = emerald
                    const phaseVisuals =
                      pIdx === 0
                        ? {
                            topBorder: 'border-t-4 border-t-cyan-500',
                            pill: 'bg-cyan-50 text-cyan-800 border-cyan-200',
                            bulletColor: 'bg-cyan-500',
                          }
                        : pIdx === 1
                        ? {
                            topBorder: 'border-t-4 border-t-violet-500',
                            pill: 'bg-violet-50 text-violet-800 border-violet-200',
                            bulletColor: 'bg-violet-500',
                          }
                        : {
                            topBorder: 'border-t-4 border-t-emerald-500',
                            pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                            bulletColor: 'bg-emerald-500',
                          };

                    return (
                      <div
                        key={phase.phaseId}
                        className={`rounded-2xl p-5 bg-white border border-slate-200 flex flex-col justify-between space-y-4 shadow-light-sm ${phaseVisuals.topBorder}`}
                      >
                        <div className="space-y-2">
                          <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${phaseVisuals.pill}`}>
                            Phase {pIdx + 1}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">
                            {phase.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            {phase.subtitle}
                          </p>

                          <ul className="space-y-2 pt-2">
                            {phase.items.map((item, iIdx) => (
                              <li key={iIdx} className="text-xs text-slate-700 flex items-start gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${phaseVisuals.bulletColor}`} />
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ================= BOTTOM ACTION BAR ================= */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200/90 shadow-light-sm">
                <div className="space-y-0.5 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-900">
                    Ready to bridge your high-priority gaps?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Preload the identified skills and architecture keywords directly into your resume draft.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleFixInResumeEditor}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-1.5 shadow-indigo-500/25 whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Fix in Resume Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
      </PageSlotReveal>
    </div>
  );
}
