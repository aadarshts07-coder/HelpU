import {
  DiscoveredCertification,
  GoalUnderstanding,
  RankedCertification,
  CertificationLevel,
} from './types';
import { evidenceService } from './evidence-service';

export function parseTimelineWeeks(timelineStr: string = '3 months'): number {
  const lower = timelineStr.toLowerCase();
  if (lower.includes('1 month') || lower.includes('4 week')) return 4;
  if (lower.includes('3 month') || lower.includes('12 week')) return 12;
  if (lower.includes('6 month') || lower.includes('24 week')) return 24;
  return 12;
}

export function rankCertificationsForGoal(
  certifications: DiscoveredCertification[],
  understanding: GoalUnderstanding,
  timelineStr: string = '3 months',
  userSkills: string[] = []
): {
  ranked: RankedCertification[];
  spotlight: RankedCertification | null;
} {
  const targetWeeks = parseTimelineWeeks(timelineStr);
  const userSkillSet = new Set(
    [...understanding.requiredSkills, ...understanding.keywords, ...understanding.certAliases, ...userSkills]
      .map((s) => s.toLowerCase().trim())
  );

  const scoredList: RankedCertification[] = certifications.map((cert) => {
    // 1. Relevance Score (0 - 100)
    let matchedSkillsCount = 0;
    (cert.skills || []).forEach((skill) => {
      const s = skill.toLowerCase().trim();
      for (const req of Array.from(userSkillSet)) {
        if (s.includes(req) || req.includes(s)) {
          matchedSkillsCount++;
          break;
        }
      }
    });

    const hasAliasMatch = (cert.aliases || []).some((alias) =>
      understanding.certAliases.some((ca) => alias.toLowerCase().includes(ca.toLowerCase()))
    );

    const relevance = Math.min(
      100,
      matchedSkillsCount * 18 + (hasAliasMatch ? 30 : 0) + (cert.category.includes(understanding.roleFamily) ? 20 : 10)
    );

    // 2. Market Evidence & Demand Score
    const { evidence, matchScoreBefore, matchScoreAfter } = evidenceService.findEvidenceForCertification(cert, userSkills);
    const demandScore = Math.min(100, Math.round(evidence.totalMentionCount * 6 + evidence.topEmployers.length * 8));

    // 3. Cost & Timeline Fit Score
    const costScore = cert.is_free ? 100 : Math.max(20, 100 - Math.round(cert.cost_usd_min / 4));
    const timelineFit = cert.study_weeks <= targetWeeks
      ? 100
      : Math.max(30, 100 - (cert.study_weeks - targetWeeks) * 12);

    // 4. Composite Ranking Score
    // Weightings: 35% Relevance, 30% Market Demand, 20% Timeline Fit, 15% Cost
    const rankScore = Math.round(
      relevance * 0.35 + demandScore * 0.3 + timelineFit * 0.2 + costScore * 0.15
    );

    // Path Order (1: Foundational, 2: Associate, 3: Professional, 4: Specialty)
    const levelOrder: Record<CertificationLevel, number> = {
      Foundational: 1,
      Associate: 2,
      Professional: 3,
      Specialty: 4,
    };
    const pathOrder = levelOrder[cert.level] || 2;

    // Tags
    const tags: ('best_roi' | 'free' | 'fastest' | 'most_requested' | 'stretch')[] = [];
    if (cert.is_free || cert.cost_usd_min === 0) tags.push('free');
    if (cert.study_weeks <= 3) tags.push('fastest');
    if (evidence.totalMentionCount >= 6) tags.push('most_requested');
    if (cert.level === 'Professional' && cert.difficulty >= 4) tags.push('stretch');

    // Why it helps for your goal
    const whyForGoal = `Directly closes your ${cert.category} gaps by certifying practical hands-on proficiency in ${cert.skills.slice(0, 3).join(', ')}. Unlocks open roles at top employers including ${cert.common_employers?.slice(0, 3).join(', ') || 'leading tech companies'}.`;

    // Map to gap indexes (0, 1, 2)
    const closesGaps = [0];
    if (cert.skills.some((s) => s.toLowerCase().includes('cloud') || s.toLowerCase().includes('aws') || s.toLowerCase().includes('azure'))) {
      closesGaps.push(1);
    }
    if (cert.level === 'Professional' || cert.difficulty >= 3) {
      closesGaps.push(2);
    }

    const readinessBonus = cert.difficulty >= 4 ? 5 : cert.difficulty === 3 ? 4 : 3;

    return {
      ...cert,
      relevanceScore: relevance,
      marketDemandScore: demandScore,
      rankScore,
      tags,
      pathOrder,
      whyForGoal,
      closesGaps: Array.from(new Set(closesGaps)),
      readinessBonus,
      userStatus: 'not_started',
      matchScoreBefore,
      matchScoreAfter,
      evidence,
    };
  });

  // Sort by rank score descending
  scoredList.sort((a, b) => b.rankScore - a.rankScore);

  // Mark highest ranked certification as best_roi
  if (scoredList.length > 0 && !scoredList[0].tags.includes('best_roi')) {
    scoredList[0].tags.unshift('best_roi');
  }

  // Return top 8 - 12 certifications
  const topCerts = scoredList.slice(0, 12);
  const spotlight = topCerts[0] || null;

  return {
    ranked: topCerts,
    spotlight,
  };
}
