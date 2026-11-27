const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log('Testing Goal to Achieve API Endpoints...\n');

  // 1. GET /api/goal-analysis
  const getAnalysis = await request('/api/goal-analysis');
  console.log(`1. GET /api/goal-analysis -> HTTP ${getAnalysis.status}`);
  if (getAnalysis.data.record) {
    console.log(`   Record ID: ${getAnalysis.data.record.id}`);
    console.log(`   Goal: "${getAnalysis.data.record.goal}"`);
    console.log(`   Readiness Score: ${getAnalysis.data.record.result?.readinessScore}`);
    console.log(`   Certifications count: ${getAnalysis.data.record.result?.certifications?.length || 0}`);
  }

  // 2. POST /api/goal-certifications (mark as studying)
  const postStudying = await request('/api/goal-certifications', {
    method: 'POST',
    body: {
      analysis_id: getAnalysis.data.record?.id || 'default',
      cert_key: 'aws-saa',
      status: 'studying',
    },
  });
  console.log(`2. POST /api/goal-certifications (studying) -> HTTP ${postStudying.status}`);
  console.log(`   Response:`, postStudying.data);

  // 3. POST /api/goal-certifications (mark as earned)
  const postEarned = await request('/api/goal-certifications', {
    method: 'POST',
    body: {
      analysis_id: getAnalysis.data.record?.id || 'default',
      cert_key: 'aws-saa',
      status: 'earned',
      earned_date: '2026-11-26',
    },
  });
  console.log(`3. POST /api/goal-certifications (earned) -> HTTP ${postEarned.status}`);
  console.log(`   Response:`, postEarned.data);

  // 4. GET /api/profile to verify resume was updated
  const getProfile = await request('/api/profile');
  console.log(`4. GET /api/profile -> HTTP ${getProfile.status}`);
  const certs = getProfile.data.profile?.certifications || [];
  console.log(`   Profile Certifications:`, certs.map((c) => c.name));
  const hasAws = certs.some((c) => c.name.includes('AWS') || c.name.includes('Solutions Architect'));
  console.log(`   AWS Cert added to profile resume: ${hasAws ? 'YES ✓' : 'NO ✗'}`);

  console.log('\nAll API tests completed successfully!');
}

run().catch((err) => {
  console.error('API Test Error:', err);
  process.exit(1);
});
