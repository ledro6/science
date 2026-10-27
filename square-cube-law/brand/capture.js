// Рендер логотипа и баннеров: node capture.js [имя1,имя2]  → out/<имя>.png
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { s.writeHead(403); s.end(); return; }
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
});
server.listen(0, '127.0.0.1', async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/brand/brand.html`);
  await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
  const names = process.argv[2] ? process.argv[2].split(',') : await page.evaluate('ASSET_NAMES');
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  for (const n of names) {
    try { fs.writeFileSync(path.join(__dirname, 'out', n + '.png'), Buffer.from(await page.evaluate(n => drawAsset(n), n), 'base64')); console.log('ok', n); }
    catch (e) { console.error('FAIL', n, e.message.split('\n')[0]); }
  }
  await browser.close(); server.close();
});
