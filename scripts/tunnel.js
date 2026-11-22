const localtunnel = require('localtunnel');
const https = require('https');

function getPublicIp() {
  return new Promise((resolve) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => resolve('Not available'));
  });
}

async function startTunnel() {
  const ip = await getPublicIp();
  console.log('PUBLIC_IP:' + ip);

  try {
    const tunnel = await localtunnel({
      port: 3000,
      subdomain: 'helpu-ai-' + Math.random().toString(36).substring(2, 7)
    });

    console.log('LIVE_URL:' + tunnel.url);
    console.log('TUNNEL_ACTIVE');

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
    });
  } catch (err) {
    console.error('Failed to start tunnel:', err.message);
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
