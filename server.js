/**
 * Zero-dependency lightweight HTTP server for SURAKSHA ALERT
 * Serves static files & API dispatch on port 3000
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // API Route for Automated Dispatch Logging & Gateway Forwarding
  if (req.method === 'POST' && req.url === '/api/send-alert') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const timestamp = new Date().toLocaleTimeString();
        console.log(`\n[${timestamp}] 🚨 EMERGENCY ALERT DISPATCHED:`);
        console.log(`   From: ${payload.sender || 'Kumkum (+91 99586 50203)'} [Sector 15, Faridabad]`);
        console.log(`   To: ${payload.name || 'Guardian'} (${payload.to}) via ${payload.channel || 'SMS/Call/WhatsApp'}`);
        console.log(`   Message: "${payload.message || 'Emergency Distress'}"\n`);

        // Optional Gateway Forwarding if Fast2SMS API key is set in environment
        if (process.env.FAST2SMS_API_KEY && payload.to) {
          const postData = JSON.stringify({
            route: 'v3',
            sender_id: 'TXTIND',
            message: payload.message,
            language: 'english',
            flash: 0,
            numbers: payload.to.replace(/[^0-9]/g, '').slice(-10)
          });
          const opt = {
            hostname: 'www.fast2sms.com',
            path: '/dev/bulkV2',
            method: 'POST',
            headers: {
              'authorization': process.env.FAST2SMS_API_KEY,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };
          const smsReq = https.request(opt, (smsRes) => {
            console.log(`  [Fast2SMS] Gateway response status: ${smsRes.statusCode}`);
          });
          smsReq.on('error', (err) => console.warn('  [Fast2SMS] Error:', err.message));
          smsReq.write(postData);
          smsReq.end();
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          recipient: payload.name,
          phone: payload.to,
          timestamp: timestamp,
          message: "Alert logged and queued successfully."
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  SURAKSHA ALERT – Women's Personal Safety Platform`);
  console.log(`  Live on PC: http://localhost:${PORT}`);
  console.log(`  Live on Phone (Same Wi-Fi): http://10.214.111.129:${PORT}`);
  console.log(`  User Profile: Kumkum (+91 99586 50203 - Faridabad)`);
  console.log(`  Guardians Configured:`);
  console.log(`   - Priority 1: Nakul (+91 98998 28825)`);
  console.log(`   - Priority 2: Anshu (+91 82878 78272)`);
  console.log(`======================================================\n`);
});
