const assert = require('assert');
const http = require('http');

console.log('================================================================');
console.log('  TESTING SEARCHBAR ACCURACY & FILTER LOGIC                     ');
console.log('================================================================');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  // Test 1: Query for "Network Engineer"
  console.log('\n[1/6] Testing searchbar query: "Network Engineer"...');
  const resNet = await get('http://127.0.0.1:3000/api/search/jobs?q=Network+Engineer');
  assert.strictEqual(resNet.status, 200, 'Status must be 200');
  assert(resNet.body.jobs.length > 0, 'Must return jobs matching Network Engineer');
  console.log(`  ✓ Returned ${resNet.body.total} jobs matching "Network Engineer"`);
  for (const j of resNet.body.jobs) {
    const text = `${j.title} ${j.company} ${j.description} ${(j.requirements || []).join(' ')}`.toLowerCase();
    assert(text.includes('network') || text.includes('engineer'), `Job "${j.title}" must match search query`);
  }
  console.log('  ✓ 100% of returned jobs match "network" or "engineer"');

  // Test 2: Query for "React"
  console.log('\n[2/6] Testing searchbar query: "React"...');
  const resReact = await get('http://127.0.0.1:3000/api/search/jobs?q=React');
  assert.strictEqual(resReact.status, 200, 'Status must be 200');
  assert(resReact.body.jobs.length > 0, 'Must return jobs matching React');
  console.log(`  ✓ Returned ${resReact.body.total} jobs matching "React"`);
  for (const j of resReact.body.jobs) {
    const text = `${j.title} ${j.company} ${j.description} ${(j.requirements || []).join(' ')}`.toLowerCase();
    assert(text.includes('react'), `Job "${j.title}" must contain "react"`);
  }

  // Test 3: Query for Company Name "Sify"
  console.log('\n[3/6] Testing searchbar query for company: "Sify"...');
  const resSify = await get('http://127.0.0.1:3000/api/search/jobs?q=Sify');
  assert.strictEqual(resSify.status, 200, 'Status must be 200');
  assert(resSify.body.jobs.length > 0, 'Must return jobs for company Sify');
  assert(resSify.body.jobs.every(j => j.company.toLowerCase().includes('sify')), 'All jobs must be from Sify');
  console.log(`  ✓ Successfully found ${resSify.body.total} Sify job(s)`);

  // Test 4: Query for Location inside searchbar: "Madurai"
  console.log('\n[4/6] Testing searchbar location keyword: "Madurai"...');
  const resMad = await get('http://127.0.0.1:3000/api/search/jobs?q=Madurai');
  assert.strictEqual(resMad.status, 200, 'Status must be 200');
  assert(resMad.body.jobs.length >= 5, 'Must return at least 5 Madurai jobs');
  for (const j of resMad.body.jobs) {
    const loc = `${j.location} ${j.city || ''}`.toLowerCase();
    assert(loc.includes('madurai'), `Job "${j.title}" at "${j.location}" must match Madurai`);
  }
  console.log(`  ✓ Returned ${resMad.body.total} jobs in Madurai from keyword search`);

  // Test 5: Query for Type "internship"
  console.log('\n[5/6] Testing type filter: "internship"...');
  const resIntern = await get('http://127.0.0.1:3000/api/search/jobs?type=internship');
  assert.strictEqual(resIntern.status, 200, 'Status must be 200');
  assert(resIntern.body.jobs.every(j => j.type === 'internship'), 'All returned listings must be internships');
  console.log(`  ✓ Returned ${resIntern.body.total} internships with 100% type accuracy`);

  // Test 6: Non-existent query (Dead-end fallback check)
  console.log('\n[6/6] Testing non-existent search query: "UnobtainiumMiner999"...');
  const resZero = await get('http://127.0.0.1:3000/api/search/jobs?q=UnobtainiumMiner999');
  assert.strictEqual(resZero.status, 200, 'Status must be 200');
  assert.strictEqual(resZero.body.total, 0, 'Must return 0 exact matches for nonsense query');
  console.log('  ✓ 0 exact matches properly handled without crash');

  console.log('\n================================================================');
  console.log('  ✓ ALL SEARCHBAR ACCURACY TESTS PASSED (100%)                  ');
  console.log('================================================================');
  process.exit(0);
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
