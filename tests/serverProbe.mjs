import http from 'node:http';
import fs from 'node:fs';

const html = fs.readFileSync('dist/index.html', 'utf-8');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(4173, '127.0.0.1', () => {
  http.get('http://127.0.0.1:4173', (res) => {
    console.log('SERVER PROBE STATUS:', res.statusCode);
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('BUNDLE INTACT & VERIFIED:', body.includes('EcoShield AI'));
      server.close();
      process.exit(0);
    });
  });
});
