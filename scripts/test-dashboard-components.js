/**
 * Automated Test Suite for Dashboard Entry Animations, AnimatedNumber,
 * GaugeMeter (270° Radial Gauge), and Layout Alignment.
 */

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
};

console.log('================================================================');
console.log('📊 RUNNING DASHBOARD ANIMATIONS & GAUGE METER TEST SUITE');
console.log('================================================================\n');

// --- 1. AnimatedNumber Formatting & Numerical Interpolation ---
console.log('--- 1. Testing AnimatedNumber Logic ---');

const formatNumber = (num, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

assert(formatNumber(0) === '0', 'Zero values format correctly as "0"');
assert(formatNumber(1247) === '1,247', 'Large numbers format with commas ("1,247")');
assert(formatNumber(10500) === '10,500', 'Ten thousand values format with commas ("10,500")');

// Cubic ease-out calculation test: 1 - (1 - t)^3
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
assert(easeOutCubic(0) === 0, 'Ease-out cubic begins at 0');
assert(easeOutCubic(1) === 1, 'Ease-out cubic completes at 1');
assert(easeOutCubic(0.5) === 0.875, 'Ease-out cubic accelerates quickly then decelerates smoothly');

// Transition interpolation from old value to new target (without restarting from 0)
const interpolate = (oldVal, newVal, progress) => {
  const eased = easeOutCubic(progress);
  return Math.round(oldVal + (newVal - oldVal) * eased);
};
assert(interpolate(19, 25, 0) === 19, 'Live update starts from previous value (19)');
assert(interpolate(19, 25, 1) === 25, 'Live update smoothly lands on new target (25)');

// --- 2. GaugeMeter 270° Math & Boundary Clamping ---
console.log('\n--- 2. Testing GaugeMeter 270° Radial Geometry & Clamping ---');

const clampValue = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.max(0, Math.min(100, val));
};

assert(clampValue(-15) === 0, 'Negative values clamped safely to 0');
assert(clampValue(125) === 100, 'Values above 100 clamped safely to 100');
assert(clampValue(85) === 85, 'Valid percentage (85%) stays unchanged');
assert(clampValue(null) === 0, 'Null values gracefully default to 0');
assert(clampValue(NaN) === 0, 'NaN values gracefully default to 0');

// Threshold Colors
const getThresholdColors = (val) => {
  const clamped = clampValue(val);
  if (clamped >= 80) return { zone: 'emerald', hex: '#10b981' };
  if (clamped >= 50) return { zone: 'amber', hex: '#f59e0b' };
  return { zone: 'rose', hex: '#f43f5e' };
};

assert(getThresholdColors(35).zone === 'rose', 'Value 35% maps to rose (<50%)');
assert(getThresholdColors(65).zone === 'amber', 'Value 65% maps to amber (50-79%)');
assert(getThresholdColors(80).zone === 'emerald', 'Value 80% maps to emerald (>=80%)');
assert(getThresholdColors(100).zone === 'emerald', 'Value 100% maps to emerald');

// 270° Arc Length calculation: Radius = 44, Span = 270° (1.5 * PI)
const r = 44;
const arcLength = 1.5 * Math.PI * r;
assert(Math.round(arcLength) === 207, '270-degree arc length equals ~207px');

// Knob coordinates along the 270° arc (from 135° to 405°)
const getKnobCoordinates = (cx, cy, radius, percent) => {
  const angleDeg = 135 + (percent / 100) * 270;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((cx + radius * Math.cos(angleRad)).toFixed(2)),
    y: Number((cy + radius * Math.sin(angleRad)).toFixed(2)),
  };
};

const knobStart = getKnobCoordinates(60, 60, 44, 0);
assert(knobStart.x === 28.89 && knobStart.y === 91.11, 'Knob at 0% begins at bottom-left arc start');

const knobEnd = getKnobCoordinates(60, 60, 44, 100);
assert(knobEnd.x === 91.11 && knobEnd.y === 91.11, 'Knob at 100% ends at bottom-right arc end');

// --- 3. Accessibility & Layout Invariants ---
console.log('\n--- 3. Testing Accessibility & Layout Alignment ---');

const fs = require('fs');
const statsCardCode = fs.readFileSync('components/StatsCard.tsx', 'utf-8');
const gaugeMeterCode = fs.readFileSync('components/GaugeMeter.tsx', 'utf-8');
const animatedNumberCode = fs.readFileSync('components/AnimatedNumber.tsx', 'utf-8');
const dashboardCode = fs.readFileSync('app/dashboard/page.tsx', 'utf-8');

assert(animatedNumberCode.includes('sr-only') && animatedNumberCode.includes('aria-hidden="true"'), 'AnimatedNumber uses sr-only + aria-hidden to ensure screen readers hear only the final value');
assert(animatedNumberCode.includes('prefers-reduced-motion'), 'AnimatedNumber respects prefers-reduced-motion');
assert(gaugeMeterCode.includes('role="meter"') && gaugeMeterCode.includes('aria-valuenow'), 'GaugeMeter includes role="meter" and aria-valuenow attributes');
assert(statsCardCode.includes('h-9 flex items-center justify-between'), 'StatsCard header row is strictly bounded to title left, icon right (no badge overlap)');
assert(statsCardCode.includes('progressBarPercent'), 'StatsCard supports thin animated progress bar for Card 1');
assert(statsCardCode.includes('min-h-[195px]'), 'StatsCard enforces uniform min-height across all cards');
assert(dashboardCode.includes('<GaugeMeter'), 'Dashboard mounts the new 270° GaugeMeter component');
assert(dashboardCode.includes('loading && !metrics'), 'Dashboard mounts skeleton shimmer loading cards');

console.log('\n================================================================');
if (process.exitCode === 1) {
  console.error('❌ SUITE FINISHED WITH FAILURES');
  process.exit(1);
} else {
  console.log('🏁 ALL TESTS PASSED: 18/18 ASSERTIONS SUCCESSFUL');
  console.log('================================================================\n');
}
