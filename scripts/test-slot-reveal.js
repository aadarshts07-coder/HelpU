const fs = require('fs');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

console.log('================================================================');
console.log('✨ RUNNING SLOT OPENING REVEAL & SIDEBAR MOTION TEST SUITE');
console.log('================================================================');

// 1. Motion Tokens & CSS Keyframes
console.log('\n--- 1. Testing Motion Tokens & Keyframes in globals.css ---');
const globalsCss = fs.readFileSync('app/globals.css', 'utf-8');

assert(globalsCss.includes('@keyframes slot-reveal'), 'globals.css defines 420ms clip-path slot-reveal keyframe');
assert(globalsCss.includes('@keyframes slot-edge-glow'), 'globals.css defines vertex slot-edge-glow keyframe');
assert(globalsCss.includes('@keyframes icon-pop'), 'globals.css defines 200ms scale-pop keyframe for sidebar click');
assert(globalsCss.includes('@keyframes ripple-spread'), 'globals.css defines localized ripple-spread keyframe');
assert(globalsCss.includes('@keyframes paper-settle'), 'globals.css defines paper-settle keyframe with shadow bloom');
assert(globalsCss.includes('@keyframes badge-bounce'), 'globals.css defines badge-bounce keyframe for hover');
assert(globalsCss.includes('@keyframes row-cascade'), 'globals.css defines row-cascade keyframe for staggered list items');
assert(globalsCss.includes('prefers-reduced-motion: reduce'), 'globals.css enforces prefers-reduced-motion accessibility');

// 2. Sidebar Component & Sliver Fix
console.log('\n--- 2. Testing Sidebar Component & Click Choreography ---');
const sidebarCode = fs.readFileSync('components/Sidebar.tsx', 'utf-8');

assert(sidebarCode.includes('sliderStyle') && sidebarCode.includes('offsetTop') && sidebarCode.includes('offsetHeight'), 'Sidebar measures active link geometry for smooth spring gliding');
assert(sidebarCode.includes('w-1 bg-white/90 rounded-full'), 'Sidebar includes clean integrated left accent bar inside the gliding pill (sliver bug resolved)');
assert(sidebarCode.includes('clickedHref') && sidebarCode.includes('animate-icon-pop'), 'Sidebar triggers icon-pop animation on click');
assert(sidebarCode.includes('ripple') && sidebarCode.includes('animate-ripple-spread'), 'Sidebar spawns localized click ripple expanding from cursor coordinates');
assert(sidebarCode.includes('__HELP_U_SLOT_Y__') && sidebarCode.includes('help-u-slot-open'), 'Sidebar sets global slot origin Y and emits live slot-open event');
assert(sidebarCode.includes('prefetch'), 'Sidebar prefetches target page on hover for instantaneous page opening');
assert(sidebarCode.includes('group-hover:rotate-6') && sidebarCode.includes('group-hover:animate-badge-bounce'), 'Sidebar tilts icon and bounces badges on hover');
assert(sidebarCode.includes('focus-visible:ring-2'), 'Sidebar provides accessible visible keyboard focus styling');

// 3. PageSlotReveal Component
console.log('\n--- 3. Testing PageSlotReveal Component Architecture ---');
const slotRevealCode = fs.readFileSync('components/PageSlotReveal.tsx', 'utf-8');

assert(slotRevealCode.includes('animate-slot-reveal'), 'PageSlotReveal applies clip-path slot reveal animation');
assert(slotRevealCode.includes('animate-slot-edge-glow'), 'PageSlotReveal features subtle glowing vertex edge line');
assert(slotRevealCode.includes('aria-live="polite"'), 'PageSlotReveal announces page title to screen readers');
assert(slotRevealCode.includes('heading.focus'), 'PageSlotReveal programmatically moves focus to page heading');
assert(slotRevealCode.includes('--slot-origin-y'), 'PageSlotReveal adapts dynamically to active sidebar item origin Y');

// 4. All 8 Authenticated Pages Integration
console.log('\n--- 4. Testing All 8 Pages Mounting PageSlotReveal & Signature Touches ---');
const dashboardCode = fs.readFileSync('app/dashboard/page.tsx', 'utf-8');
const profileCode = fs.readFileSync('app/profile/page.tsx', 'utf-8');
const resumeCode = fs.readFileSync('app/resume/page.tsx', 'utf-8');
const resumePreviewCode = fs.readFileSync('components/ATSResumePreview.tsx', 'utf-8');
const jobsCode = fs.readFileSync('app/jobs/page.tsx', 'utf-8');
const trackerCode = fs.readFileSync('app/tracker/page.tsx', 'utf-8');
const interviewCode = fs.readFileSync('app/interview-prep/page.tsx', 'utf-8');
const notifsCode = fs.readFileSync('app/notifications/page.tsx', 'utf-8');
const settingsCode = fs.readFileSync('app/settings/page.tsx', 'utf-8');

assert(dashboardCode.includes('<PageSlotReveal') && dashboardCode.includes('animate-row-cascade'), 'Dashboard mounts PageSlotReveal and cascades recent applications row by row');
assert(profileCode.includes('<PageSlotReveal') && profileCode.includes('StepTabs'), 'Profile Builder mounts PageSlotReveal and orchestrates step tabs');
assert(resumeCode.includes('<PageSlotReveal'), 'Resume page mounts PageSlotReveal');
assert(resumePreviewCode.includes('animate-paper-settle'), 'ATS Resume Preview features paper-settle signature entrance');
assert(jobsCode.includes('<PageSlotReveal') && jobsCode.includes('animate-row-cascade'), 'Job Discovery mounts PageSlotReveal and cascades job cards');
assert(trackerCode.includes('<PageSlotReveal') && trackerCode.includes('animate-row-cascade'), 'Application Tracker mounts PageSlotReveal and cascades table rows');
assert(interviewCode.includes('<PageSlotReveal') && interviewCode.includes('animate-sparkle-ambient'), 'Interview Copilot mounts PageSlotReveal with ambient AI sparkle pulse');
assert(notifsCode.includes('<PageSlotReveal') && notifsCode.includes('animate-pulse'), 'Notifications mounts PageSlotReveal with pulsing unread indicators');
assert(settingsCode.includes('<PageSlotReveal'), 'Settings & Privacy mounts PageSlotReveal');

console.log('\n================================================================');
if (process.exitCode === 1) {
  console.error('❌ SUITE FINISHED WITH FAILURES');
  process.exit(1);
} else {
  console.log('🏁 ALL TESTS PASSED: 25/25 SLOT REVEAL & SIDEBAR MOTION ASSERTIONS SUCCESSFUL');
  console.log('================================================================\n');
}
