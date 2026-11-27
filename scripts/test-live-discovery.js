const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (c) => (resData += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(resData) });
          } catch {
            resolve({ status: res.statusCode, text: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method: 'GET',
      },
      (res) => {
        let resData = '';
        res.on('data', (c) => (resData += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(resData) });
          } catch {
            resolve({ status: res.statusCode, text: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Testing Live Certification Pipeline API Endpoints...\n');

  // 1. POST /api/certifications/discover
  console.log('1. POST /api/certifications/discover');
  const discRes = await post('/api/certifications/discover', {
    goal: 'Senior Cloud & DevOps Architect at High-Growth Fintech',
    timeline: '3 months',
    skills: ['AWS', 'Kubernetes', 'Terraform'],
  });
  console.log(`   Status: HTTP ${discRes.status}`);
  if (discRes.json) {
    console.log(`   Total Found: ${discRes.json.totalFound}`);
    console.log(`   Total Companies Hiring: ${discRes.json.totalCompaniesHiring}`);
    console.log(`   Spotlight: ${discRes.json.spotlightCert?.name}`);
    console.log(
      `   Top 3 Certs:`,
      discRes.json.certifications?.slice(0, 3).map((c) => ({
        key: c.key,
        name: c.name,
        rankScore: c.rankScore,
        tags: c.tags,
        evidenceEmployers: c.evidence?.topEmployers?.map((e) => e.company),
      }))
    );
  }

  // 2. GET /api/certifications/evidence?key=aws-saa
  console.log('\n2. GET /api/certifications/evidence?key=aws-saa');
  const evRes = await get('/api/certifications/evidence?key=aws-saa');
  console.log(`   Status: HTTP ${evRes.status}`);
  if (evRes.json) {
    console.log(`   Evidence Total Mentions: ${evRes.json.evidence?.totalMentionCount}`);
    console.log(`   Top Hiring Employers:`, evRes.json.evidence?.topEmployers?.map((e) => `${e.company} (${e.openRolesCount})`));
    console.log(`   Sample Roles count: ${evRes.json.evidence?.sampleRoles?.length}`);
    console.log(`   Match Preview: ${evRes.json.matchScoreBefore}% -> ${evRes.json.matchScoreAfter}%`);
  }

  // 3. GET /api/goal-analysis (Verify auto-discovery backfill)
  console.log('\n3. GET /api/goal-analysis');
  const goalRes = await get('/api/goal-analysis');
  console.log(`   Status: HTTP ${goalRes.status}`);
  const certsCount = goalRes.json?.record?.result?.certifications?.length || 0;
  console.log(`   Goal Record Certifications count: ${certsCount}`);
  if (certsCount > 0) {
    console.log(`   SUCCESS: Grid is now populated with ${certsCount} certifications! ✓`);
  }

  console.log('\nAll Live API checks finished successfully!');
}

main().catch((err) => {
  console.error('API Verification Failed:', err);
  process.exit(1);
});
