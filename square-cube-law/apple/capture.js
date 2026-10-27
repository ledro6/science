// Рендер кадров (страница отдаётся локальным http-сервером — ES-модули не грузятся с file://).
//   node capture.js <fps> <from> <to> <out.mp4>
//   node capture.js stills 1.5,3,4.2 [префикс] [only=hook,cube]   → stills/<префикс>_t<время>.png
//   node capture.js sfx                                             → build/sfx.json
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname;
// EP=ep2 — выпуск из episodes/ep2 (sfx.json и stills/ пишутся туда); без EP — пилот
const EPDIR = process.env.EP ? path.join(ROOT, 'episodes', process.env.EP) : ROOT;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };

const server = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { s.writeHead(403); s.end(); return; }
  fs.readFile(f, (e, d) => {
    if (e) { s.writeHead(404); s.end(); return; }
    s.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); s.end(d);
  });
});

server.listen(0, '127.0.0.1', async () => {
  const [mode, ...args] = process.argv.slice(2);
  const only = (args.find(a => a.startsWith('only=')) || '').slice(5);
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); if (mode !== 'stills') process.exit(1); });
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  const q = new URLSearchParams(); if (only) q.set('only', only); if (process.env.SCALE) q.set('s', process.env.SCALE); if (process.env.EP) q.set('ep', process.env.EP);
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?${q}`);
  await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
  const frame = (t, type, q) => page.evaluate(([t, type, q]) => { render(t); return document.getElementById('c').toDataURL(type, q).split(',')[1]; }, [t, type, q]);

  if (mode === 'sfx') {
    fs.writeFileSync(path.join(EPDIR, 'build/sfx.json'), JSON.stringify(await page.evaluate('SFX'), null, 1));
  } else if (mode === 'stills') {
    const pre = args[1] && !args[1].startsWith('only=') ? args[1] : 'still';
    fs.mkdirSync(path.join(EPDIR, 'stills'), { recursive: true });
    for (const t of args[0].split(',').map(Number)) {
      try { fs.writeFileSync(path.join(EPDIR, `stills/${pre}_t${t.toFixed(2)}.png`), Buffer.from(await frame(t, 'image/png'), 'base64')); }
      catch (e) { console.error(`RENDER ERROR at t=${t}:`, e.message.split('\n')[0]); }
    }
  } else {
    const fps = +mode, from = +args[0], to = +args[1], out = args[2];
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    for (let i = from; i < to; i++) {
      const buf = Buffer.from(await frame(i / fps, 'image/jpeg', .95), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 120 === 0) console.log(out, i);
    }
    ff.stdin.end(); await done;
  }
  await browser.close(); server.close();
});
