const http = require('http');
const fs = require('fs');
const path = require('path');
const { makeConfig } = require('./make-config');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;
const ALLOWED = [
  /^\/$/,
  /^\/index\.html$/,
  /^\/config\.js$/,
  /^\/favicon\.svg$/,
  /^\/(css|js)\/[\w.-]+\.(css|js)$/,
];
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

try {
  makeConfig(ROOT);
  console.log('.env → config.js 변환 완료');
} catch (e) {
  console.warn(`[경고] ${e.message}\n키 없이 서버만 띄웁니다. 페이지에 안내 문구가 표시돼요.`);
}

// .env 같은 파일이 노출되지 않도록 허용 목록에 있는 경로만 서빙한다.
http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !ALLOWED.some((re) => re.test(pathname))) {
      res.writeHead(404).end('Not found');
      return;
    }
    const file = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file)],
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`http://localhost:${PORT}`));
