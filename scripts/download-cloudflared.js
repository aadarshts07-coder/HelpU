const https = require('https');
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'bin', 'cloudflared.exe');
fs.mkdirSync(path.dirname(targetPath), { recursive: true });

function download(url) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      return download(res.headers.location);
    }
    if (res.statusCode !== 200) {
      console.error('Download failed with status:', res.statusCode);
      process.exit(1);
    }
    const file = fs.createWriteStream(targetPath);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('cloudflared downloaded successfully to:', targetPath);
    });
  }).on('error', (err) => {
    console.error('Error downloading cloudflared:', err.message);
    process.exit(1);
  });
}

download('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe');
