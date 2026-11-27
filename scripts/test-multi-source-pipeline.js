const assert = require('assert');
const path = require('path');

console.log('================================================================');
console.log('    HELP U - MULTI-SOURCE PIPELINE & MADURAI COVERAGE TEST      ');
console.log('================================================================');

// 1. Test Geocoder & Canonical IDs
console.log('\n[1/6] Testing Canonical Location Geocoder & Case-Insensitivity...');
const { resolveCanonicalLocation } = require('../lib/pipeline/geocoder');

const loc1 = resolveCanonicalLocation('Madurai, Tamil Nadu, India');
assert.strictEqual(loc1.countryCode, 'in', 'Country code must be in');
assert.strictEqual(loc1.stateCode, 'tn', 'State code must be tn');
assert.strictEqual(loc1.city, 'Madurai', 'City must be Madurai');
assert.strictEqual(loc1.canonicalId, 'in-tn-madurai', 'Canonical ID must be in-tn-madurai');
assert(loc1.latitude && loc1.longitude, 'Coordinates must be present');
console.log(`  ✓ 'Madurai, Tamil Nadu, India' -> ${loc1.canonicalId} (${loc1.latitude}, ${loc1.longitude})`);

// Case-insensitivity test
const loc2 = resolveCanonicalLocation('madurai');
assert.strictEqual(loc2.canonicalId, 'in-tn-madurai', 'Case-insensitive "madurai" must resolve to in-tn-madurai');
console.log(`  ✓ Case-insensitive 'madurai' -> ${loc2.canonicalId}`);

// Alias test
const loc3 = resolveCanonicalLocation('kovai');
assert.strictEqual(loc3.canonicalId, 'in-tn-coimbatore', 'Alias "kovai" must resolve to in-tn-coimbatore');
console.log(`  ✓ Alias 'kovai' -> ${loc3.canonicalId}`);

// 2. Test Quality & Anti-Scam Filter
console.log('\n[2/6] Testing Anti-Scam & Quality Filter...');
const { validateJobQuality } = require('../lib/pipeline/quality');

const scamCheck = validateJobQuality(
  'Data Entry Specialist',
  'QuickHire Inc',
  'Please pay registration fee of Rs. 500 before starting training work from home.',
  'https://quickhire.example/apply'
);
assert.strictEqual(scamCheck.isValid, false, 'Scam listing with registration fee must be rejected');
console.log(`  ✓ Rejected scam posting: "${scamCheck.reason}"`);

const legitCheck = validateJobQuality(
  'Network Engineer',
  'Sify Technologies',
  'We are seeking a Network Engineer in Madurai to manage BGP, OSPF routing protocols and Cisco switches with 2+ years experience.',
  'https://sifytechnologies.com/careers'
);
assert.strictEqual(legitCheck.isValid, true, 'Legitimate job must be accepted');
assert(legitCheck.qualityScore >= 70, 'Quality score must be >= 70');
console.log(`  ✓ Accepted legitimate posting: Quality Score ${legitCheck.qualityScore}/100`);

// 3. Test Deduplication Fingerprinting
console.log('\n[3/6] Testing Deduplication Fingerprinting...');
const { generateJobFingerprint, deduplicateJobs } = require('../lib/pipeline/deduplicator');

const fp1 = generateJobFingerprint('Network Engineer', 'Sify Technologies', 'in-tn-madurai');
const fp2 = generateJobFingerprint('network engineer', 'sify technologies', 'in-tn-madurai');
assert.strictEqual(fp1, fp2, 'Fingerprints must be case and whitespace invariant');
console.log(`  ✓ Deterministic fingerprint: ${fp1}`);

const duplicates = [
  {
    id: 'job_a',
    title: 'Network Engineer',
    company: 'Sify Technologies',
    location: 'Madurai, Tamil Nadu, India',
    source: 'Greenhouse',
    url: 'https://boards.greenhouse.io/sify/1',
    description: 'Short description',
  },
  {
    id: 'job_b',
    title: 'Network Engineer',
    company: 'Sify Technologies',
    location: 'Madurai, Tamil Nadu, India',
    source: 'Adzuna',
    url: 'https://adzuna.com/job/2',
    description: 'Longer comprehensive description with routing and switching responsibilities.',
  },
];

const merged = deduplicateJobs(duplicates);
assert.strictEqual(merged.length, 1, 'Two duplicate jobs must be merged into 1 listing');
assert.strictEqual(merged[0].sourceList.length, 2, 'Merged job must contain both apply sources');
console.log(`  ✓ Merged duplicates across sources: ${merged[0].sourceList.map(s => s.source).join(', ')}`);

// 4. Test Company Registry
console.log('\n[4/6] Testing Company Registry for Madurai Operations...');
const { getCompanyRegistry, getCompaniesByCity } = require('../lib/pipeline/registry');

const allCompanies = getCompanyRegistry();
assert(allCompanies.length >= 10, 'Registry should have companies');
console.log(`  ✓ Total registered employers: ${allCompanies.length}`);

const maduraiEmployers = getCompaniesByCity('madurai');
assert(maduraiEmployers.length >= 4, 'Should find at least 4 companies operating in Madurai');
console.log(`  ✓ Employers operating in Madurai: ${maduraiEmployers.map(c => c.name).join(', ')}`);

// 5. Test Multi-Source Aggregator on "Network Engineer" in Madurai
console.log('\n[5/6] Testing Multi-Source Ingestion for "Network Engineer" in Madurai...');
const { aggregateJobsFromAllSources } = require('../lib/pipeline/aggregator');

async function testSearchMadurai() {
  const result = await aggregateJobsFromAllSources({
    query: 'Network Engineer',
    city: 'madurai',
    country: 'in',
  });

  assert(result.jobs.length > 0, 'Must return jobs for Network Engineer in Madurai (poor coverage fixed!)');
  console.log(`  ✓ Aggregator returned ${result.jobs.length} jobs for 'Network Engineer' in Madurai`);

  for (const job of result.jobs.slice(0, 3)) {
    console.log(`    - [${job.company}] ${job.title} (${job.location}) -> ${job.salary_or_stipend || 'Competitive'}`);
    assert(job.location.toLowerCase().includes('madurai'), 'Job location must mention Madurai');
  }
}

// 6. Test Zero-Result Demand Tracker
console.log('\n[6/6] Testing Zero-Result Search Logger...');
const { logZeroResultSearch, getZeroResultHotspots } = require('../lib/pipeline/zero-results');

logZeroResultSearch({
  query: 'Quantum Computing Specialist',
  country: 'in',
  state: 'tn',
  city: 'Madurai',
  resultCount: 0,
  timestamp: new Date().toISOString(),
});

const hotspots = getZeroResultHotspots();
assert(hotspots.length > 0, 'Hotspots tracker must record unmet demand');
console.log(`  ✓ Hotspot logged: "${hotspots[0].query}" in ${hotspots[0].location} (${hotspots[0].count} searches)`);

testSearchMadurai().then(() => {
  console.log('\n================================================================');
  console.log('  ✓ ALL 6 MULTI-SOURCE PIPELINE TESTS PASSED (100% SUCCESS)    ');
  console.log('================================================================');
});
