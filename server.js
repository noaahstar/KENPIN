const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HTTP_PORT = 8000;
const HTTPS_PORT = 8443;

// Request handler
const requestHandler = (req, res) => {
  let requestPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, requestPath === '/' ? 'index.html' : requestPath);
  
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ファイルが見つかりません');
    } else {
      let contentType = 'text/html';
      if (filePath.endsWith('.js')) contentType = 'text/javascript';
      if (filePath.endsWith('.css')) contentType = 'text/css';
      if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
      if (filePath.endsWith('.png')) contentType = 'image/png';
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
};

// Start HTTP Server
http.createServer(requestHandler).listen(HTTP_PORT, () => {
  console.log(`[HTTP] Local web server is running at http://localhost:${HTTP_PORT}`);
});

// Start HTTPS Server if certificates exist
try {
  const keyPath = path.join(__dirname, 'key.pem');
  const certPath = path.join(__dirname, 'cert.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    
    https.createServer(options, requestHandler).listen(HTTPS_PORT, () => {
      console.log(`[HTTPS] Secure web server is running at https://localhost:${HTTPS_PORT}`);
      
      // Print local IP URL for smartphone
      const interfaces = os.networkInterfaces();
      console.log('\n======================================================');
      console.log('スマホでの動作テスト用URL：');
      console.log('1. スマホをPCと同じWi-Fiに接続してください。');
      console.log('2. スマホのブラウザで、以下のURLにアクセスしてください：');
      for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`   https://${net.address}:${HTTPS_PORT}/`);
          }
        }
      }
      console.log('\n※警告画面が表示されますが、以下のように進めてください：');
      console.log('  ・Safari(iPhone)：「詳細を表示」 ➔ 「このWebサイトを閲覧」');
      console.log('  ・Chrome(Android)：「詳細設定」 ➔ 「〜 にアクセスする（安全ではありません）」');
      console.log('======================================================\n');
    });
  } else {
    console.log('[HTTPS] Certificates not found. Only HTTP is active.');
  }
} catch (e) {
  console.error("Failed to start HTTPS server:", e);
}
