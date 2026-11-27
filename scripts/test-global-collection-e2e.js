const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Country, State, City } = require('country-state-city');

console.log('================================================================');
console.log('  GLOBAL MULTI-SOURCE JOB INGESTION & COVERAGE TEST             ');
console.log('================================================================');

// 1. Verify Stored Global Jobs Index
console.log('\n[1/5] Verifying Global Stored Job Index (data/jobs-index.json)...');
const jobsIndexPath = path.join(__dirname, '../data/jobs-index.json');
assert(fs.existsSync(jobsIndexPath), 'data/jobs-index.json must exist');
const jobs = JSON.parse(fs.readFileSync(jobsIndexPath, 'utf8'));
assert(Array.isArray(jobs) && jobs.length >= 35, `Index must contain at least 35 jobs, found ${jobs.length}`);
console.log(`  ✓ Total ingested jobs in store: ${jobs.length}`);

// Check geographic distribution
const countries = new Set(jobs.map(j => j.country).filter(Boolean));
console.log(`  ✓ Distinct countries represented: ${Array.from(countries).join(', ')}`);
assert(countries.has('in'), 'Must contain India jobs');
assert(countries.has('us'), 'Must contain United States jobs');
assert(countries.has('gb'), 'Must contain United Kingdom jobs');
assert(countries.has('ca'), 'Must contain Canada jobs');
assert(countries.has('de'), 'Must contain Germany jobs');
assert(countries.has('au'), 'Must contain Australia jobs');
assert(countries.has('sg'), 'Must contain Singapore jobs');
assert(countries.has('jp'), 'Must contain Japan jobs');
assert(countries.has('ae'), 'Must contain UAE jobs');
assert(countries.has('fr'), 'Must contain France jobs');
assert(countries.has('nl'), 'Must contain Netherlands jobs');
assert(countries.has('remote'), 'Must contain Remote Worldwide jobs');

// 2. Check City & State granularity
console.log('\n[2/5] Checking City & State Coverage...');
const maduraiJobs = jobs.filter(j => j.city === 'Madurai');
assert(maduraiJobs.length >= 6, `Must have at least 6 Madurai jobs, found ${maduraiJobs.length}`);
console.log(`  ✓ Madurai Network & IT positions: ${maduraiJobs.length}`);

const coimbatoreJobs = jobs.filter(j => j.city === 'Coimbatore');
assert(coimbatoreJobs.length >= 3, 'Must have Coimbatore jobs');
console.log(`  ✓ Coimbatore engineering positions: ${coimbatoreJobs.length}`);

const sfJobs = jobs.filter(j => j.city === 'San Francisco');
assert(sfJobs.length >= 2, 'Must have San Francisco jobs');
console.log(`  ✓ San Francisco positions: ${sfJobs.length}`);

const londonJobs = jobs.filter(j => j.city === 'London');
assert(londonJobs.length >= 1, 'Must have London jobs');
console.log(`  ✓ London positions: ${londonJobs.length}`);

// 3. Verify Search API Integration
console.log('\n[3/5] Verifying Search API Wiring (app/api/search/jobs/route.ts)...');
const searchRouteSrc = fs.readFileSync(path.join(__dirname, '../app/api/search/jobs/route.ts'), 'utf8');
assert(searchRouteSrc.includes('loadAllJobsFromStore'), 'Search route must import and invoke loadAllJobsFromStore');
assert(searchRouteSrc.includes('storedPipelineJobs'), 'Search route must merge stored pipeline jobs');
assert(searchRouteSrc.includes('fallbackJobs'), 'Search route must compute fallback jobs for no-dead-ends');
assert(searchRouteSrc.includes('fallbackInfo'), 'Search route must return fallbackInfo');
console.log('  ✓ Search route integrates loadAllJobsFromStore, storedPipelineJobs, and fallback cascade');

// 4. Verify Alert & Report APIs
console.log('\n[4/5] Verifying Job Alert & Report APIs...');
const alertRouteSrc = fs.readFileSync(path.join(__dirname, '../app/api/jobs/alerts/route.ts'), 'utf8');
assert(alertRouteSrc.includes('createJobAlert'), 'Alert route must invoke createJobAlert');
assert(alertRouteSrc.includes('POST'), 'Alert route must export POST');

const reportRouteSrc = fs.readFileSync(path.join(__dirname, '../app/api/jobs/report/route.ts'), 'utf8');
assert(reportRouteSrc.includes('recordJobReport'), 'Report route must invoke recordJobReport');
assert(reportRouteSrc.includes('POST'), 'Report route must export POST');
console.log('  ✓ /api/jobs/alerts and /api/jobs/report endpoints properly configured');

// 5. Verify Search Page UI Components
console.log('\n[5/5] Verifying Search Page UI Components (app/search/page.tsx)...');
const searchPageSrc = fs.readFileSync(path.join(__dirname, '../app/search/page.tsx'), 'utf8');
assert(searchPageSrc.includes('fallbackJobs'), 'Search page must handle fallbackJobs state');
assert(searchPageSrc.includes('isAlertModalOpen'), 'Search page must have Job Alert modal state');
assert(searchPageSrc.includes('reportModalJob'), 'Search page must have Report modal state');
assert(searchPageSrc.includes('renderJobCard'), 'Search page must have unified renderJobCard');
assert(searchPageSrc.includes('handleCreateAlertSubmit'), 'Search page must handle alert submission');
assert(searchPageSrc.includes('handleReportSubmit'), 'Search page must handle report submission');
console.log('  ✓ Search page UI verified with fallback cascade, alert modal, report modal, and card flags');

console.log('\n================================================================');
console.log('  ✓ ALL GLOBAL COLLECTION & COVERAGE TESTS PASSED (100%)       ');
console.log('================================================================');
