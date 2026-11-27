/**
 * Unit tests for Goal Readiness Score Calculation
 * Tests:
 *  1. Base score calculation (no steps completed)
 *  2. Step completion bonuses (+8 for high, +5 for medium, +3 for low, split across gap steps)
 *  3. Partial step completion
 *  4. Certification bonuses (+readinessBonus per earned cert)
 *  5. Hard ceiling cap at exactly 97
 *  6. Edge cases (0 steps, empty gaps, unearned certs)
 */

function calculateScore({ baseScore, gaps = [], certifications = [], completedStepIds = [] }) {
  const base = baseScore !== undefined ? baseScore : 65;
  let stepBonus = 0;
  let stepCount = 0;

  gaps.forEach((gap) => {
    const gapSteps = gap.actionSteps || [];
    stepCount += gapSteps.length;
    if (gapSteps.length === 0) return;

    const severityWeight = gap.severity === 'high' ? 8 : gap.severity === 'medium' ? 5 : 3;
    const weightPerStep = severityWeight / gapSteps.length;

    gapSteps.forEach((step) => {
      if (completedStepIds.includes(step.id)) {
        stepBonus += weightPerStep;
      }
    });
  });

  let certBonus = 0;
  certifications.forEach((c) => {
    if (c.userStatus === 'earned') {
      certBonus += c.readinessBonus !== undefined ? c.readinessBonus : 4;
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
}

// Assert helper
let passed = 0;
let failed = 0;

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  ✓ PASS: ${testName} (expected ${expected}, got ${actual})`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} (expected ${expected}, got ${actual})`);
    failed++;
  }
}

console.log('=== Running Goal Readiness Score Calculation Unit Tests ===\n');

// Test 1: Base Score with 0 steps
console.log('Test Suite 1: Base score with no completed steps or certs');
{
  const res = calculateScore({ baseScore: 68 });
  assertEqual(res.currentScore, 68, 'Current score equals base score');
  assertEqual(res.bonusEarned, 0, 'Bonus earned is 0');
  assertEqual(res.totalActionSteps, 0, 'Total action steps is 0');
}

// Test 2: High severity gap (all steps completed)
console.log('\nTest Suite 2: High severity gap with 4 steps (+8 points total)');
{
  const gaps = [
    {
      id: 'gap-1',
      severity: 'high',
      actionSteps: [
        { id: 's1', text: 'Step 1' },
        { id: 's2', text: 'Step 2' },
        { id: 's3', text: 'Step 3' },
        { id: 's4', text: 'Step 4' },
      ],
    },
  ];
  // Completing 2 steps out of 4 -> 4 points
  const partial = calculateScore({
    baseScore: 65,
    gaps,
    completedStepIds: ['s1', 's2'],
  });
  assertEqual(partial.currentScore, 69, 'Partial completion (2/4 steps of high severity) adds 4 pts');
  assertEqual(partial.bonusEarned, 4, 'Bonus earned is exactly 4.0');

  // Completing all 4 steps -> 8 points
  const full = calculateScore({
    baseScore: 65,
    gaps,
    completedStepIds: ['s1', 's2', 's3', 's4'],
  });
  assertEqual(full.currentScore, 73, 'Full completion (4/4 steps of high severity) adds 8 pts');
  assertEqual(full.bonusEarned, 8, 'Bonus earned is exactly 8.0');
}

// Test 3: Mixed severity gaps (high = 8, medium = 5, low = 3)
console.log('\nTest Suite 3: Mixed severity gaps (High + Med + Low)');
{
  const gaps = [
    { id: 'g1', severity: 'high', actionSteps: [{ id: 'h1' }, { id: 'h2' }] }, // 4 pts each
    { id: 'g2', severity: 'medium', actionSteps: [{ id: 'm1' }] },              // 5 pts
    { id: 'g3', severity: 'low', actionSteps: [{ id: 'l1' }] },                 // 3 pts
  ];

  // Complete 1 high (4pts) + 1 medium (5pts) = +9 pts
  const res = calculateScore({
    baseScore: 60,
    gaps,
    completedStepIds: ['h1', 'm1'],
  });
  assertEqual(res.currentScore, 69, 'Completing h1 (4pts) and m1 (5pts) gives 60 + 9 = 69');
  assertEqual(res.bonusEarned, 9, 'Bonus is 9.0');
}

// Test 4: Certification bonuses
console.log('\nTest Suite 4: Certification earned bonuses');
{
  const certs = [
    { certKey: 'aws-saa', readinessBonus: 5, userStatus: 'earned' },
    { certKey: 'ckad', readinessBonus: 4, userStatus: 'studying' },     // not earned -> 0 pts
    { certKey: 'comptia-sec', readinessBonus: 3, userStatus: 'earned' },
  ];

  const res = calculateScore({
    baseScore: 70,
    certifications: certs,
  });
  assertEqual(res.currentScore, 78, 'Earned certs (5 + 3 = 8 pts) added to 70 = 78');
  assertEqual(res.bonusEarned, 8, 'Cert bonus is 8.0');
}

// Test 5: Hard cap at 97
console.log('\nTest Suite 5: Score ceiling cap at 97');
{
  // Base 92 + 10 bonus -> 102 capped at 97
  const capped1 = calculateScore({
    baseScore: 92,
    certifications: [{ certKey: 'aws-sap', readinessBonus: 10, userStatus: 'earned' }],
  });
  assertEqual(capped1.currentScore, 97, 'Score 92 + 10 = 102 is capped at 97');

  // Base 75 + high (8) + med (5) + low (3) + 3 certs (15) = 106 capped at 97
  const gaps = [
    { id: 'g1', severity: 'high', actionSteps: [{ id: 'h1' }] },
    { id: 'g2', severity: 'medium', actionSteps: [{ id: 'm1' }] },
    { id: 'g3', severity: 'low', actionSteps: [{ id: 'l1' }] },
  ];
  const certs = [
    { certKey: 'c1', readinessBonus: 5, userStatus: 'earned' },
    { certKey: 'c2', readinessBonus: 5, userStatus: 'earned' },
    { certKey: 'c3', readinessBonus: 5, userStatus: 'earned' },
  ];
  const capped2 = calculateScore({
    baseScore: 75,
    gaps,
    certifications: certs,
    completedStepIds: ['h1', 'm1', 'l1'],
  });
  assertEqual(capped2.currentScore, 97, 'Score 75 + 16 + 15 = 106 is capped at 97');
}

// Test 6: Edge cases
console.log('\nTest Suite 6: Edge cases (empty steps, unknown statuses, defaults)');
{
  const gaps = [
    { id: 'g1', severity: 'high', actionSteps: [] }, // 0 steps
  ];
  const certs = [
    { certKey: 'c1', userStatus: 'exam_booked' },    // not earned
    { certKey: 'c2', userStatus: 'earned' },         // earned without explicit readinessBonus -> defaults to 4
  ];
  const res = calculateScore({
    baseScore: 65,
    gaps,
    certifications: certs,
  });
  assertEqual(res.currentScore, 69, 'Handled empty actionSteps and defaulted unassigned cert bonus to +4');
  assertEqual(res.totalActionSteps, 0, 'Total action steps is 0');
}

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
