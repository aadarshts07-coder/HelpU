const fs = require('fs');

const html = fs.readFileSync('cisco_sample.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]);
console.log('Scripts total:', scripts.length);
scripts.forEach(s => {
  if (s.includes('job') || s.includes('search') || s.includes('phenom') || s.includes('cisco') || s.includes('bundle')) {
    console.log('Script:', s);
  }
});

// Also check form tags
const forms = [...html.matchAll(/<form[^>]*action=["']([^"']+)["']/gi)].map(m => m[1]);
console.log('Forms:', forms);
