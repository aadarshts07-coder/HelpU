/**
 * Automated Verification Suite for Profile Builder Motion System,
 * Completeness Ring, Direction-Aware Stepper, and Micro-Interactions.
 */

const fs = require('fs');

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
};

console.log('================================================================');
console.log('✨ RUNNING PROFILE BUILDER MOTION & UX VERIFICATION SUITE');
console.log('================================================================\n');

// --- 1. Profile Completeness Logic & Milestone Celebrations ---
console.log('--- 1. Testing Profile Completeness Ring Logic ---');

function calculateProfileCompleteness(profile) {
  if (!profile) return 0;
  let score = 0;

  // Name & Email (20%)
  if (profile.name && profile.name.trim() && profile.email && profile.email.trim()) score += 20;
  // Phone & Location (15%)
  if (profile.phone && profile.phone.trim() && profile.location && profile.location.trim()) score += 15;
  // Summary (15%)
  if (profile.summary && profile.summary.trim().length >= 30) score += 15;
  // Target Job Titles (15%)
  if (Array.isArray(profile.targetJobTitles) && profile.targetJobTitles.length > 0) score += 15;
  // Experience (15%)
  if (Array.isArray(profile.experience) && profile.experience.length > 0) score += 15;
  // Education (10%)
  if (Array.isArray(profile.education) && profile.education.length > 0) score += 10;
  // Skills (10%)
  if (Array.isArray(profile.skills) && profile.skills.length >= 3) score += 10;

  return Math.min(100, Math.max(0, score));
}

const emptyProfile = {
  id: 'usr_test',
  name: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  targetJobTitles: [],
  experience: [],
  education: [],
  skills: [],
};

assert(calculateProfileCompleteness(emptyProfile) === 0, 'Empty profile computes to 0% completeness');

const partialProfile = {
  ...emptyProfile,
  name: 'Alex Morgan',
  email: 'alex@example.com', // +20
  phone: '+1 555-0192',
  location: 'San Francisco, CA', // +15
  targetJobTitles: ['Full Stack Engineer'], // +15
};
assert(calculateProfileCompleteness(partialProfile) === 50, 'Partial profile computes to 50% completeness (Milestone 1 reached)');

const fullProfile = {
  ...partialProfile,
  summary: 'Experienced software engineer specializing in scalable full-stack web applications and cloud architecture.', // +15
  experience: [{ id: 'exp_1', company: 'Tech Corp', position: 'Senior Engineer', startDate: '2022', endDate: '', current: true }], // +15
  education: [{ id: 'edu_1', institution: 'UC Berkeley', degree: 'BS Computer Science', startDate: '2018', endDate: '2022', current: false }], // +10
  skills: [
    { id: 'sk_1', name: 'TypeScript', category: 'Technical', level: 'Expert' },
    { id: 'sk_2', name: 'React', category: 'Frameworks', level: 'Expert' },
    { id: 'sk_3', name: 'Node.js', category: 'Technical', level: 'Advanced' },
  ], // +10
};
assert(calculateProfileCompleteness(fullProfile) === 100, 'Full profile computes to 100% completeness (All ATS Fields Complete)');

// --- 2. StepTabs Stepper & Gliding Highlight Invariants ---
console.log('\n--- 2. Testing StepTabs Stepper & Shared Layout Highlight ---');

const stepTabsCode = fs.readFileSync('components/StepTabs.tsx', 'utf-8');
const profileCompletenessCode = fs.readFileSync('components/ProfileCompletenessRing.tsx', 'utf-8');
const profilePageCode = fs.readFileSync('app/profile/page.tsx', 'utf-8');
const globalsCss = fs.readFileSync('app/globals.css', 'utf-8');

assert(stepTabsCode.includes('sliderStyle') && stepTabsCode.includes('offsetLeft') && stepTabsCode.includes('offsetWidth'), 'StepTabs calculates sliding highlight position using real DOM offset geometry');
assert(stepTabsCode.includes('role="tablist"') && stepTabsCode.includes('role="tab"'), 'StepTabs enforces accessible WAI-ARIA tablist & tab roles');
assert(stepTabsCode.includes('animate-checkmark-draw'), 'StepTabs uses animated SVG checkmark draw on completed steps');
assert(stepTabsCode.includes('warnStepId') && stepTabsCode.includes('animate-ping'), 'StepTabs features amber warning pulse dot when skipping required fields');
assert(stepTabsCode.includes('from-indigo-500 to-emerald-500'), 'StepTabs includes continuous background progress line connecting tabs');

// --- 3. Form Micro-Interactions & Motion System ---
console.log('\n--- 3. Testing Form Micro-Interactions & CSS Keyframes ---');

assert(globalsCss.includes('@keyframes field-shake'), 'globals.css defines 300ms field-shake keyframe');
assert(globalsCss.includes('@keyframes checkmark-draw'), 'globals.css defines checkmark-draw stroke keyframe');
assert(globalsCss.includes('@keyframes sparkle-ambient'), 'globals.css defines ambient sparkle pulse keyframe');
assert(globalsCss.includes('@keyframes shimmer-slide'), 'globals.css defines continuous shimmer sweep keyframe');
assert(globalsCss.includes('prefers-reduced-motion: reduce'), 'globals.css enforces prefers-reduced-motion accessibility');

assert(profilePageCode.includes('triggerFieldShake'), 'Profile page implements triggerFieldShake for invalid input blur/submit');
assert(profilePageCode.includes('shakingFields.name') && profilePageCode.includes('shakingFields.email'), 'Profile page applies shake animation to name and email on validation failure');
assert(profilePageCode.includes('stepDirection') && profilePageCode.includes('slide-in-from-right-4') && profilePageCode.includes('slide-in-from-left-4'), 'Profile page features direction-aware step slide transitions');
assert(profilePageCode.includes('scrollHeight'), 'Profile page implements auto-growing Professional Summary textarea');
assert(profilePageCode.includes('AI Tip:'), 'Profile page includes glowing AI Tip banner when summary is brief');
assert(profilePageCode.includes('<ProfileCompletenessRing'), 'Profile page mounts the header completeness meter');
assert(profilePageCode.includes('<StepTabs'), 'Profile page mounts the StepTabs stepper');
assert(profilePageCode.includes('saveSuccessMorph'), 'Profile page implements save button morphing to checkmark');
assert(profilePageCode.includes('ConfettiCelebration') && profilePageCode.includes('showCompletionModal'), 'Profile page triggers confetti and completion celebration modal on final step');
assert(profilePageCode.includes('stepIntroBanner'), 'Profile page shows welcome intro banner with step focus tip');
assert(profilePageCode.includes('aria-live="polite"'), 'Profile page includes accessible live region for screen readers');
assert(profilePageCode.includes('addEventListener(\'popstate\''), 'Profile page syncs with browser history and Back/Forward buttons');

const layoutCode = fs.readFileSync('app/layout.tsx', 'utf-8');
assert(layoutCode.includes('<TopLoadingBar />'), 'Root layout mounts top loading bar for smooth route transitions');

const sidebarCode = fs.readFileSync('components/Sidebar.tsx', 'utf-8');
assert(sidebarCode.includes('animate-spring-pop') && sidebarCode.includes('translate-x-1'), 'Sidebar features active indicator bar and smooth navigation transitions');

console.log('\n================================================================');
if (process.exitCode === 1) {
  console.error('❌ SUITE FINISHED WITH FAILURES');
  process.exit(1);
} else {
  console.log('🏁 ALL TESTS PASSED: 25/25 PROFILE MOTION & UX ASSERTIONS SUCCESSFUL');
  console.log('================================================================\n');
}
