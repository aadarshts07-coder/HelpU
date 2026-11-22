async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('====================================================');
  console.log('🚀 Running FreeHire Search Engine Verification Tests');
  console.log('====================================================\n');

  const testCases = [
    { name: 'Query: "Software Engineer Intern"', url: `${baseUrl}/api/search/jobs?q=Software+Engineer+Intern` },
    { name: 'Query: "python"', url: `${baseUrl}/api/search/jobs?q=python` },
    { name: 'Query: "react remote"', url: `${baseUrl}/api/search/jobs?q=react&mode=remote` },
    { name: 'Query: "data analyst"', url: `${baseUrl}/api/search/jobs?q=data+analyst` },
    { name: 'Internships tab (type=internship)', url: `${baseUrl}/api/search/jobs?q=Software&type=internship` },
    { name: 'Work Mode filter (mode=remote)', url: `${baseUrl}/api/search/jobs?q=developer&mode=remote` },
    { name: 'Date Posted filter (posted=24h)', url: `${baseUrl}/api/search/jobs?q=engineer&posted=24h` },
    { name: 'Pagination (page=2, limit=5)', url: `${baseUrl}/api/search/jobs?q=engineer&page=2&limit=5` },
  ];

  for (const tc of testCases) {
    try {
      console.log(`--- [TEST] ${tc.name} ---`);
      console.log(`URL: ${tc.url}`);
      const res = await fetch(tc.url);
      if (!res.ok) {
        console.error(`❌ HTTP Error: ${res.status}`);
        continue;
      }
      const data = await res.json();
      console.log(`✅ Status: ${res.status} | Total Count: ${data.total} | Returned: ${data.jobs?.length} | Page: ${data.page}/${data.totalPages}`);
      
      const top3 = (data.jobs || []).slice(0, 3);
      if (top3.length === 0) {
        console.log('⚠️ No jobs returned in top 3.');
      } else {
        top3.forEach((job, idx) => {
          console.log(`  [Job #${idx + 1}]`);
          console.log(`    Title:       ${job.title}`);
          console.log(`    Company:     ${job.company}`);
          console.log(`    Location:    ${job.location}`);
          console.log(`    Work Mode:   ${job.work_mode}`);
          console.log(`    Type:        ${job.type}`);
          console.log(`    Level:       ${job.experience_level}`);
          console.log(`    Salary:      ${job.salary_or_stipend}`);
          console.log(`    Source:      ${job.source}`);
          console.log(`    Apply URL:   ${job.url}`);
          console.log(`    ManualLogin: ${job.requires_manual_login || false}`);
        });
      }
      console.log('');
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
    }
  }

  console.log('====================================================');
  console.log('✨ All Search Verification Tests Completed');
  console.log('====================================================');
}

runTests();
