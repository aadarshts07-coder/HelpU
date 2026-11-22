const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cloudflaredExe = path.join(__dirname, '..', 'bin', 'cloudflared.exe');
const liveUrlFile = path.join(__dirname, '..', 'LIVE_URL.txt');

let activeProcess = null;

function runTunnel() {
  console.log('[Tunnel Supervisor] Launching Cloudflare Tunnel...');
  activeProcess = spawn(cloudflaredExe, ['tunnel', '--url', 'http://127.0.0.1:3000'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let urlDetected = false;

  const handleOutput = (data) => {
    const text = data.toString();
    console.log('[cloudflared]', text.trim());

    if (text.includes('Tunnel not found') || text.includes('Unauthorized: Tunnel not found')) {
      console.log('[Tunnel Supervisor] Tunnel expired or deleted by Cloudflare. Cycling process to request new tunnel...');
      try {
        if (activeProcess) activeProcess.kill();
      } catch (e) {}
      return;
    }

    // Match tunnel URL but exclude api.trycloudflare.com
    const matches = text.matchAll(/https:\/\/([a-zA-Z0-9\-]+)\.trycloudflare\.com/g);
    for (const match of matches) {
      const subdomain = match[1];
      if (subdomain !== 'api') {
        const url = `https://${subdomain}.trycloudflare.com`;
        console.log('==================================================');
        console.log('[Tunnel Supervisor] ACTIVE_LIVE_URL:', url);
        console.log('==================================================');
        fs.writeFileSync(liveUrlFile, url, 'utf8');
      }
    }
  };

  activeProcess.stdout.on('data', handleOutput);
  activeProcess.stderr.on('data', handleOutput);

  activeProcess.on('close', (code) => {
    console.log(`[Tunnel Supervisor] Process exited with code ${code}. Restarting in 3s...`);
    setTimeout(runTunnel, 3000);
  });

  activeProcess.on('error', (err) => {
    console.error('[Tunnel Supervisor] Error:', err.message);
    setTimeout(runTunnel, 5000);
  });
}

runTunnel();
