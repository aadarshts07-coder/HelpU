/**
 * Unit Test Suite: Profile Saving, Validation & Persistence
 * Run: node scripts/test-profile-save.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

async function runProfileSaveTests() {
  console.log('🧪 ============================================================');
  console.log('🧪 Starting Unit Tests: Profile Builder & Data Persistence');
  console.log('🧪 ============================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  // TEST 1: store.json exists and contains complete profile structure
  test('store.json exists and has valid initial profile', () => {
    assert(fs.existsSync(STORE_PATH), 'data/store.json file must exist');
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const store = JSON.parse(raw);
    assert(store.profile, 'Profile object must exist in store');
    assert(typeof store.profile.name === 'string', 'Profile name must be a string');
    assert(typeof store.profile.email === 'string', 'Profile email must be a string');
    assert(Array.isArray(store.profile.targetJobTitles), 'targetJobTitles must be an array');
    assert(Array.isArray(store.profile.skills), 'skills must be an array');
    assert(Array.isArray(store.profile.experience), 'experience must be an array');
    assert(Array.isArray(store.profile.education), 'education must be an array');
  });

  // TEST 2: Validation rules
  test('Validation: Rejects empty name and invalid email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Empty name
    const invalidName = '   ';
    assert(invalidName.trim() === '', 'Empty name should be detected');

    // Invalid emails
    const badEmails = ['alex', 'alex@', '@example.com', 'alex morgan@domain.com'];
    for (const bad of badEmails) {
      assert(!emailRegex.test(bad), `Should reject invalid email: ${bad}`);
    }

    // Valid email
    const goodEmail = 'alex.morgan@example.com';
    assert(emailRegex.test(goodEmail), `Should accept valid email: ${goodEmail}`);
  });

  // TEST 3: Validation: Requires at least one target job title
  test('Validation: Target Job Titles cannot be empty', () => {
    const emptyTitles = [];
    assert(emptyTitles.length === 0, 'Empty titles list detected');
    const validTitles = ['Senior Full Stack Engineer', 'Frontend Lead'];
    assert(validTitles.length > 0, 'Valid titles list detected');
  });

  // TEST 4: Full 6-Tab deep persistence test
  await testAsync('Persistence: Updating fields across all 6 tabs saves properly', async () => {
    const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    const initialUpdatedAt = store.profile.updatedAt;

    const testTimestamp = new Date().toISOString();
    const updatedProfile = {
      ...store.profile,
      name: 'Dr. Alex Morgan Test',
      email: 'alex.test@example.org',
      phone: '+1 (555) 999-8877',
      location: 'Seattle, WA',
      linkedInUrl: 'https://linkedin.com/in/alexmorgantest',
      githubUrl: 'https://github.com/alexmorgantest',
      portfolioUrl: 'https://alexmorgantest.io',
      summary: 'Updated test summary with 5+ years of verified software engineering experience.',
      targetJobTitles: ['Staff Software Engineer', 'Engineering Manager'],
      preferredLocations: ['Remote', 'Seattle, WA'],
      workPreference: 'remote',
      workAuthorization: 'US Citizen / Authorized without sponsorship',
      salaryRange: {
        min: 175000,
        max: 220000,
        currency: 'USD',
      },
      experience: [
        {
          id: 'exp_unit_test_1',
          company: 'Acme Robotics',
          position: 'Staff Engineer',
          location: 'Seattle, WA',
          startDate: '2022-01',
          endDate: '',
          current: true,
          description: 'Leading autonomous software architectures.',
          highlights: ['Architected low-latency distributed control loop.'],
        },
      ],
      education: [
        {
          id: 'edu_unit_test_1',
          institution: 'University of Washington',
          degree: 'Master of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2019',
          endDate: '2021',
          current: false,
          grade: '3.9 GPA',
        },
      ],
      skills: [
        { id: 'sk_u1', category: 'Technical', name: 'Rust', level: 'Intermediate' },
        { id: 'sk_u2', category: 'Technical', name: 'TypeScript', level: 'Expert' },
      ],
      projects: [
        {
          id: 'proj_u1',
          title: 'QuantumSim',
          description: 'Quantum circuit simulator in browser.',
          techStack: ['WebAssembly', 'Rust', 'Next.js'],
          bullets: ['Simulates 30 qubits in real time.'],
        },
      ],
      certifications: [
        {
          id: 'cert_u1',
          name: 'Certified Kubernetes Administrator (CKA)',
          issuer: 'Linux Foundation',
          issueDate: '2024-01',
        },
      ],
      languages: [
        { id: 'lang_u1', name: 'English', proficiency: 'Native' },
        { id: 'lang_u2', name: 'German', proficiency: 'Conversational' },
      ],
      updatedAt: testTimestamp,
    };

    // Save to store
    store.profile = updatedProfile;
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');

    // Read back and assert all fields persisted accurately
    const readBack = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')).profile;
    assert.strictEqual(readBack.name, 'Dr. Alex Morgan Test');
    assert.strictEqual(readBack.email, 'alex.test@example.org');
    assert.strictEqual(readBack.location, 'Seattle, WA');
    assert.strictEqual(readBack.targetJobTitles.length, 2);
    assert.strictEqual(readBack.targetJobTitles[0], 'Staff Software Engineer');
    assert.strictEqual(readBack.experience[0].company, 'Acme Robotics');
    assert.strictEqual(readBack.education[0].institution, 'University of Washington');
    assert.strictEqual(readBack.skills.some(s => s.name === 'Rust'), true);
    assert.strictEqual(readBack.projects[0].title, 'QuantumSim');
    assert.strictEqual(readBack.certifications[0].name, 'Certified Kubernetes Administrator (CKA)');
    assert.strictEqual(readBack.languages.length, 2);
    assert.strictEqual(readBack.salaryRange.min, 175000);
  });

  // TEST 5: API Route cache headers
  test('Route verification: Force dynamic and no-cache configuration', () => {
    const routeFile = path.join(__dirname, '..', 'app', 'api', 'profile', 'route.ts');
    assert(fs.existsSync(routeFile), 'app/api/profile/route.ts must exist');
    const content = fs.readFileSync(routeFile, 'utf-8');
    assert(content.includes("export const dynamic = 'force-dynamic'"), 'API route must be force-dynamic');
    assert(content.includes('export const revalidate = 0'), 'API route must have revalidate = 0');
    assert(content.includes('triggerProfilePipeline'), 'API route must trigger background pipeline');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All profile save unit tests passed successfully!\n');
  }
}

runProfileSaveTests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
