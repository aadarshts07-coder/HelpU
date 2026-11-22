const fs = require('fs');

async function test() {
  try {
    const res = await fetch('https://pricol.com/careers/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    fs.writeFileSync('pricol_sample.html', html);

    // Also check wp-json endpoints
    const wpRes = await fetch('https://pricol.com/wp-json/wp/v2/types');
    if (wpRes.ok) {
      const types = await wpRes.json();
      console.log('WP custom post types:', Object.keys(types));
    } else {
      console.log('WP types status:', wpRes.status);
    }
  } catch (e) {
    console.error('Err:', e);
  }
}
test();
