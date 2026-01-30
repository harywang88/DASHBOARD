const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'ganti-dengan-secret-anda';
const PROJECT_DIR = process.env.PROJECT_DIR || '/var/www/harywang-dashboard';
const LOG_FILE = path.join(__dirname, 'deploy.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(line.trim());
  fs.appendFileSync(LOG_FILE, line);
}

function verifySignature(payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function deploy() {
  try {
    log('Mulai deploy...');

    log('> git pull origin main');
    const pullResult = execSync('git pull origin main', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 60000
    });
    log(pullResult.trim());

    // Install dependencies jika package.json berubah
    log('> npm install (root)');
    execSync('npm install --production', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 120000
    });

    log('> npm install (convert service)');
    execSync('npm install --production', {
      cwd: path.join(PROJECT_DIR, 'services/convert'),
      encoding: 'utf-8',
      timeout: 120000
    });

    log('> npm install (pdf service)');
    execSync('npm install --production', {
      cwd: path.join(PROJECT_DIR, 'services/pdf/backend'),
      encoding: 'utf-8',
      timeout: 120000
    });

    // Restart semua services via PM2
    log('> pm2 restart ecosystem.config.js');
    const pm2Result = execSync('pm2 restart ecosystem.config.js --only dashboard,convert-service,pdf-service', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 30000
    });
    log(pm2Result.trim());

    log('Deploy selesai!');
    return true;
  } catch (err) {
    log('Deploy GAGAL: ' + err.message);
    return false;
  }
}

const server = http.createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // Webhook endpoint
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    req.on('data', chunk => { body += chunk; });

    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];

      if (!verifySignature(body, signature)) {
        log('Webhook ditolak: signature tidak valid');
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
        return;
      }

      // Hanya proses push ke branch main
      if (payload.ref !== 'refs/heads/main') {
        log(`Push ke branch ${payload.ref} diabaikan (bukan main)`);
        res.writeHead(200);
        res.end('Ignored: not main branch');
        return;
      }

      log(`Push diterima dari ${payload.pusher?.name || 'unknown'}: ${payload.head_commit?.message || ''}`);

      res.writeHead(200);
      res.end('Deploy started');

      // Jalankan deploy secara async
      deploy();
    });

    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  log(`Webhook server berjalan di port ${PORT}`);
});
