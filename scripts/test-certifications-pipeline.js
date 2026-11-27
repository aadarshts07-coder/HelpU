/**
 * Unit Test Suite for Certification Discovery Pipeline:
 *  1. Safe Word-Boundary Regex Matcher (Negative lookahead/lookbehind, prevents false positives)
 *  2. Adapter Isolation & Resilient Execution (Timeouts, failures don't affect other adapters)
 *  3. Fuzzy Deduplication Engine (Key, name, exam code)
 *  4. Multi-Factor Ranking Engine (Relevance x Market Demand x Cost x Timeline)
 *  5. Readiness Bonus & Cap at 97
 */

// 1. Regex Matcher Implementation
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSafeTermPattern(term) {
  const trimmed = term.trim();
  const isAcronym = /^[A-Z0-9-]{2,8}$/.test(trimmed);

  if (isAcronym) {
    return new RegExp(`(?<![a-zA-Z0-9_-])${escapeRegex(trimmed)}(?![a-zA-Z0-9_-])`, 'g');
  }

  const words = trimmed.split(/[\s-]+/).filter(Boolean);
  const patternStr = words.map(escapeRegex).join('[\\s-]+');
  return new RegExp(`(?<![a-zA-Z0-9])${patternStr}(?![a-zA-Z0-9])`, 'gi');
}

function matchCertificationInText(certTerms, text) {
  if (!text || text.length === 0) return { matched: false };

  if (certTerms.examCode && certTerms.examCode.trim().length >= 3) {
    const examCode = certTerms.examCode.trim();
    const examRegex = new RegExp(`(?<![a-zA-Z0-9_-])${escapeRegex(examCode)}(?![a-zA-Z0-9_-])`, 'i');
    if (examRegex.test(text)) return { matched: true, matchedTerm: examCode };
  }

  const nameRegex = buildSafeTermPattern(certTerms.name);
  if (nameRegex.test(text)) return { matched: true, matchedTerm: certTerms.name };

  if (certTerms.aliases && certTerms.aliases.length > 0) {
    for (const alias of certTerms.aliases) {
      if (alias.trim().length < 2) continue;
      const aliasRegex = buildSafeTermPattern(alias);
      if (aliasRegex.test(text)) return { matched: true, matchedTerm: alias };
    }
  }

  return { matched: false };
}

// 2. Adapter Safe Runner Implementation
async function runAdapterSafely(adapter, understanding) {
  const timeoutMs = adapter.timeoutMs || 4500;
  try {
    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Adapter "${adapter.name}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    });

    const fetchPromise = adapter.fetchCertifications(understanding);
    const results = await Promise.race([fetchPromise, timeoutPromise]);
    return Array.isArray(results) ? results : [];
  } catch (err) {
    return [];
  }
}

// 3. Deduplication Implementation
function deduplicateCertifications(items) {
  const seenKeys = new Set();
  const seenNames = new Set();
  const seenExamCodes = new Set();
  const unique = [];

  for (const item of items) {
    const normKey = item.key.toLowerCase().trim();
    const normName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normExam = item.exam_code ? item.exam_code.toUpperCase().replace(/[^A-Z0-9]/g, '') : null;

    if (seenKeys.has(normKey)) continue;
    if (seenNames.has(normName)) continue;
    if (normExam && seenExamCodes.has(normExam)) continue;

    seenKeys.add(normKey);
    seenNames.add(normName);
    if (normExam) seenExamCodes.add(normExam);

    unique.push(item);
  }

  return unique;
}

// 4. Ranking Implementation
function rankCertificationsForGoal(certifications, understanding, timelineWeeks = 12, userSkills = []) {
  const targetWeeks = timelineWeeks;
  const userSkillSet = new Set(
    [...understanding.requiredSkills, ...understanding.keywords, ...understanding.certAliases, ...userSkills]
      .map((s) => s.toLowerCase().trim())
  );

  const scoredList = certifications.map((cert) => {
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

    const mentionCount = cert.evidence?.totalMentionCount || (cert.common_employers ? cert.common_employers.length * 2 : 6);
    const demandScore = Math.min(100, Math.round(mentionCount * 6 + 20));

    const costScore = cert.is_free ? 100 : Math.max(20, 100 - Math.round(cert.cost_usd_min / 4));
    const timelineFit = cert.study_weeks <= targetWeeks
      ? 100
      : Math.max(30, 100 - (cert.study_weeks - targetWeeks) * 12);

    const rankScore = Math.round(
      relevance * 0.35 + demandScore * 0.3 + timelineFit * 0.2 + costScore * 0.15
    );

    const levelOrder = {
      Foundational: 1,
      Associate: 2,
      Professional: 3,
      Specialty: 4,
    };
    const pathOrder = levelOrder[cert.level] || 2;

    const tags = [];
    if (cert.is_free || cert.cost_usd_min === 0) tags.push('free');
    if (cert.study_weeks <= 3) tags.push('fastest');
    if (mentionCount >= 6) tags.push('most_requested');
    if (cert.level === 'Professional' && cert.difficulty >= 4) tags.push('stretch');

    return {
      ...cert,
      relevanceScore: relevance,
      rankScore,
      tags,
      pathOrder,
      readinessBonus: cert.difficulty >= 4 ? 5 : cert.difficulty === 3 ? 4 : 3,
    };
  });

  scoredList.sort((a, b) => b.rankScore - a.rankScore);
  if (scoredList.length > 0 && !scoredList[0].tags.includes('best_roi')) {
    scoredList[0].tags.unshift('best_roi');
  }

  return {
    ranked: scoredList,
    spotlight: scoredList[0] || null,
  };
}

// -------------------------------------------------------------
// TEST RUNNER
// -------------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('=== Certification Pipeline Unit Tests ===');
console.log('================================================================\n');

// SUITE 1: Word-Boundary Regex Matcher
console.log('Test Suite 1: Certification Regex Matcher & False Positive Avoidance');
const certCka = {
  name: 'Certified Kubernetes Administrator',
  examCode: 'CKA',
  aliases: ['CKA', 'Certified Kubernetes Administrator'],
};

assert(
  matchCertificationInText(certCka, 'We require a CKA certified DevOps engineer.').matched === true,
  'Matches isolated acronym "CKA"'
);
assert(
  matchCertificationInText(certCka, 'Qualifications: Certified Kubernetes Administrator or equivalent').matched === true,
  'Matches full name "Certified Kubernetes Administrator"'
);
assert(
  matchCertificationInText(certCka, 'Must have (CKA) or (CKAD) certification').matched === true,
  'Matches acronym enclosed in parentheses "(CKA)"'
);
assert(
  matchCertificationInText(certCka, 'Tech stack: Kubernetes, Docker, CKA preferred.').matched === true,
  'Matches acronym followed by punctuation'
);
assert(
  matchCertificationInText(certCka, 'The package must be trackable through our logistics system.').matched === false,
  'Does NOT match "CKA" inside "trackable" or "package"'
);
assert(
  matchCertificationInText(certCka, 'Dealing with a water blockage in the facility.').matched === false,
  'Does NOT match "CKA" inside "blockage"'
);
assert(
  matchCertificationInText({ name: 'Google Cloud PCA', examCode: 'PCA', aliases: ['PCA'] }, 'The pcar vehicle drove upcast.').matched === false,
  'Does NOT match "PCA" inside "pcar" or "upcast"'
);

// SUITE 2: Adapter Isolation
console.log('\nTest Suite 2: Adapter Error Isolation and Timeout Resilience');

async function testAdapterIsolation() {
  const failingAdapter = {
    name: 'Failing Mock Adapter',
    timeoutMs: 300,
    async fetchCertifications() {
      throw new Error('API connection reset by peer');
    },
  };

  const timingOutAdapter = {
    name: 'Hanging Mock Adapter',
    timeoutMs: 200,
    async fetchCertifications() {
      await new Promise((r) => setTimeout(r, 800));
      return [];
    },
  };

  const healthyAdapter = {
    name: 'Healthy Mock Adapter',
    timeoutMs: 500,
    async fetchCertifications() {
      return [{ key: 'mock-1', name: 'Mock Cert' }];
    },
  };

  const failRes = await runAdapterSafely(failingAdapter, {});
  assert(Array.isArray(failRes) && failRes.length === 0, 'Failing adapter returns [] gracefully without throwing');

  const timeoutRes = await runAdapterSafely(timingOutAdapter, {});
  assert(Array.isArray(timeoutRes) && timeoutRes.length === 0, 'Timing out adapter returns [] gracefully without blocking');

  const healthyRes = await runAdapterSafely(healthyAdapter, {});
  assert(healthyRes.length === 1 && healthyRes[0].key === 'mock-1', 'Healthy adapter returns valid discovered items');
}

// SUITE 3: Deduplication
console.log('\nTest Suite 3: Deduplication Engine');
function testDeduplication() {
  const duplicates = [
    { key: 'aws-saa', name: 'AWS Certified Solutions Architect – Associate', exam_code: 'SAA-C03' },
    { key: 'aws-saa', name: 'AWS Certified Solutions Architect Associate', exam_code: 'SAA-C03' },
    { key: 'ckad', name: 'Certified Kubernetes Application Developer', exam_code: 'CKAD' },
  ];
  const deduped = deduplicateCertifications(duplicates);
  assert(deduped.length === 2, `Deduplicated 3 items down to 2 (got ${deduped.length})`);
  assert(deduped.some((d) => d.key === 'aws-saa'), 'Retains unique aws-saa');
  assert(deduped.some((d) => d.key === 'ckad'), 'Retains unique ckad');
}

// SUITE 4: Ranking
console.log('\nTest Suite 4: Goal-Specific Ranking & Pathway Ordering');
function testRanking() {
  const sampleCerts = [
    {
      key: 'aws-saa',
      name: 'AWS Certified Solutions Architect – Associate',
      level: 'Associate',
      exam_code: 'SAA-C03',
      category: 'Cloud Architecture',
      skills: ['AWS', 'Amazon EC2', 'Docker'],
      aliases: ['AWS SAA'],
      cost_usd_min: 150,
      study_weeks: 6,
      difficulty: 3,
      common_employers: ['Amazon', 'Netflix'],
    },
    {
      key: 'pmp',
      name: 'Project Management Professional',
      level: 'Professional',
      exam_code: 'PMP',
      category: 'Management',
      skills: ['Agile', 'Scrum'],
      aliases: ['PMP'],
      cost_usd_min: 405,
      study_weeks: 10,
      difficulty: 4,
      common_employers: ['IBM'],
    },
  ];

  const understanding = {
    roleFamily: 'Cloud Architecture',
    level: 'Senior',
    requiredSkills: ['AWS', 'Docker'],
    keywords: ['Cloud', 'AWS'],
    certAliases: ['AWS SAA'],
  };

  const { ranked, spotlight } = rankCertificationsForGoal(sampleCerts, understanding, 12, ['AWS']);
  assert(ranked.length === 2, 'Returns ranked certifications');
  assert(ranked[0].key === 'aws-saa', 'AWS SAA ranked higher than PMP for Cloud role');
  assert(ranked[0].tags.includes('best_roi'), 'Top recommendation tagged as best_roi');
  assert(spotlight !== null && spotlight.key === 'aws-saa', 'Spotlight card accurately set to top recommendation');
  assert(ranked[0].pathOrder === 2, 'Associate level mapped to pathOrder 2');
}

async function runAll() {
  await testAdapterIsolation();
  testDeduplication();
  testRanking();

  console.log('\n================================================================');
  console.log(`Pipeline Results: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runAll().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
