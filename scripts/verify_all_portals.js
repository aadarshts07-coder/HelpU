// Verification script for all 4 company career portal adapters
const query = 'engineer';

async function testBosch() {
  console.log('\n--- 1. Testing Bosch SmartRecruiters API ---');
  const start = Date.now();
  const url = `https://api.smartrecruiters.com/v1/companies/BoschGroup/postings?q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url);
  const data = await res.json();
  const jobs = (data.content || []).map(j => ({
    title: j.name,
    company: 'Bosch Group',
    location: [j.location?.city, j.location?.country].filter(Boolean).join(', '),
    source: 'Bosch',
    applyUrl: `https://jobs.smartrecruiters.com/BoschGroup/${j.id}`,
    type: j.name?.toLowerCase().includes('intern') ? 'internship' : 'job'
  }));
  console.log(`[Bosch] Status: ${res.status} (${Date.now() - start}ms) | Total: ${data.totalFound} | Retrieved: ${jobs.length}`);
  console.log('Sample Job:', jobs[0]);
  return jobs.length > 0;
}

async function testCisco() {
  console.log('\n--- 2. Testing Cisco Phenom API ---');
  const start = Date.now();
  const res = await fetch('https://careers.cisco.com/widgets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify({
      lang: 'en_global',
      deviceType: 'desktop',
      country: 'global',
      pageName: 'search-results',
      ddoKey: 'refineSearch',
      from: 0,
      jobs: true,
      counts: true,
      size: 5,
      keywords: query,
      global: true,
      refNum: 'CISCISGLOBAL'
    })
  });
  const data = await res.json();
  const rawJobs = data?.refineSearch?.data?.jobs || [];
  const jobs = rawJobs.map(j => ({
    title: j.title,
    company: 'Cisco Systems',
    location: [j.city, j.country].filter(Boolean).join(', '),
    source: 'Cisco',
    applyUrl: j.applyUrl || `https://jobs.cisco.com/jobs/ProjectDetail/${j.jobId}`,
    type: j.title?.toLowerCase().includes('intern') ? 'internship' : 'job'
  }));
  console.log(`[Cisco] Status: ${res.status} (${Date.now() - start}ms) | Total: ${data?.refineSearch?.totalHits} | Retrieved: ${jobs.length}`);
  console.log('Sample Job:', jobs[0]);
  return jobs.length > 0;
}

async function testRedHat() {
  console.log('\n--- 3. Testing Red Hat Workday CXS API ---');
  const start = Date.now();
  const initRes = await fetch('https://redhat.wd5.myworkdayjobs.com/Jobs', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const cookies = initRes.headers.getSetCookie ? initRes.headers.getSetCookie() : [initRes.headers.get('set-cookie')];
  const cookieHeader = cookies.filter(Boolean).map(c => c.split(';')[0]).join('; ');

  const res = await fetch('https://redhat.wd5.myworkdayjobs.com/wday/cxs/redhat/Jobs/jobs', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cookie': cookieHeader,
      'Origin': 'https://redhat.wd5.myworkdayjobs.com',
      'Referer': 'https://redhat.wd5.myworkdayjobs.com/Jobs'
    },
    body: JSON.stringify({
      appliedFacets: {},
      limit: 5,
      offset: 0,
      searchText: query
    })
  });
  const data = await res.json();
  const rawJobs = data?.jobPostings || [];
  const jobs = rawJobs.map(j => ({
    title: j.title,
    company: 'Red Hat',
    location: j.locationsText,
    source: 'Red Hat',
    applyUrl: `https://redhat.wd5.myworkdayjobs.com/en-US/Jobs${j.externalPath}`,
    type: j.title?.toLowerCase().includes('intern') ? 'internship' : 'job'
  }));
  console.log(`[Red Hat] Status: ${res.status} (${Date.now() - start}ms) | Total: ${data?.total} | Retrieved: ${jobs.length}`);
  console.log('Sample Job:', jobs[0]);
  return jobs.length > 0;
}

async function testPricol() {
  console.log('\n--- 4. Testing Pricol Careers WordPress REST API ---');
  const start = Date.now();
  const res = await fetch('https://pricol.com/wp-json/wp/v2/jobs?per_page=5');
  const data = await res.json();
  const jobs = data.map(j => ({
    title: j.title?.rendered?.replace(/&#8211;/g, '–').replace(/&amp;/g, '&'),
    company: 'Pricol Limited',
    location: 'Coimbatore / Tamil Nadu, India',
    source: 'Pricol',
    applyUrl: j.link,
    type: j.title?.rendered?.toLowerCase().includes('intern') ? 'internship' : 'job'
  }));
  console.log(`[Pricol] Status: ${res.status} (${Date.now() - start}ms) | Retrieved: ${jobs.length}`);
  console.log('Sample Job:', jobs[0]);
  return jobs.length > 0;
}

async function main() {
  console.log('Starting verification of all 4 official company portal adapters for query: "' + query + '"');
  const [b, c, r, p] = await Promise.all([
    testBosch(),
    testCisco(),
    testRedHat(),
    testPricol()
  ]);

  console.log('\n================ VERIFICATION SUMMARY ================');
  console.log(`Bosch:   ${b ? 'PASS (Real Data)' : 'FAIL'}`);
  console.log(`Cisco:   ${c ? 'PASS (Real Data)' : 'FAIL'}`);
  console.log(`Red Hat: ${r ? 'PASS (Real Data)' : 'FAIL'}`);
  console.log(`Pricol:  ${p ? 'PASS (Real Data)' : 'FAIL'}`);
  console.log('======================================================');
}

main();
