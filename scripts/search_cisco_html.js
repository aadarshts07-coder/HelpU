const fs = require('fs');
const html = fs.readFileSync('cisco_sample.html', 'utf8');

// Look for data-ph-id or job cards
const phIds = [...html.matchAll(/data-ph-id="([^"]+)"/g)].map(m => m[1]);
console.log('Total data-ph-id elements:', phIds.length);
console.log('Sample data-ph-ids:', phIds.slice(0, 10));

// Check if there are any embedded scripts with job listings
const scripts = [...html.matchAll(/<script[^>]*>(.*?)<\/script>/gis)].map(m => m[1]);
console.log('Inline scripts count:', scripts.length);
scripts.forEach((s, idx) => {
  if (s.includes('job') || s.includes('Job') || s.includes('Title') || s.includes('requisition')) {
    console.log(`Script #${idx} length: ${s.length}, snippet:`, s.substring(0, 150));
  }
});
