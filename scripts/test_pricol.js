async function test() {
  try {
    const res = await fetch('https://pricol.com/careers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Pricol status:', res.status, res.headers.get('content-type'));
    const html = await res.text();
    console.log('Pricol HTML length:', html.length);
    
    // Look for API calls or links or tables
    const jobMatches = [...html.matchAll(/(software|engineer|developer|intern|manager|lead|technician|trainee)/gi)];
    console.log('Keyword matches count:', jobMatches.length);

    // Look for links to job portals or job postings
    const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
    const careerLinks = links.filter(l => l.includes('career') || l.includes('job') || l.includes('apply') || l.includes('naukri') || l.includes('linkedin'));
    console.log('Career links:', careerLinks);
  } catch (e) {
    console.error('Pricol error:', e.message);
  }
}
test();
