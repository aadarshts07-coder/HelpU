const fs = require('fs');

async function test() {
  try {
    const res = await fetch('https://jobs.cisco.com/jobs/SearchJobs/engineer', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const phConfig = html.match(/phApp\.ddo\s*=\s*({.*?});/s);
    if (phConfig) {
      const ddo = JSON.parse(phConfig[1]);
      console.log('siteConfig keys:', Object.keys(ddo.siteConfig || {}));
      console.log('siteConfig refNum / tenant:', ddo.siteConfig?.refNum, ddo.siteConfig?.companyId);
      console.log('jobwidgetsettings:', JSON.stringify(ddo.jobwidgetsettings, null, 2));
      console.log('siteConfig api endpoints:', {
        apiBaseUrl: ddo.siteConfig?.apiBaseUrl,
        jobSearchUrl: ddo.siteConfig?.jobSearchUrl,
        endpoint: ddo.siteConfig?.endpoint
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
