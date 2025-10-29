const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 4173;
const rootDir = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

function resolvePath(urlPath) {
  const cleanedPath = urlPath.split('?')[0].split('#')[0];
  if (cleanedPath === '/' || cleanedPath === '') {
    return path.join(rootDir, 'index.html');
  }
  const safePath = path.normalize(cleanedPath).replace(/^\/+/, '');
  return path.join(rootDir, safePath);
}

function sendNotFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Ресурс не знайдено');
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url || '/');

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendNotFound(res);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      sendNotFound(res);
    });
    stream.pipe(res);
  });
});

server.listen(port, () => {
  console.log(`FlowTrack prototype is running at http://localhost:${port}`);
});
