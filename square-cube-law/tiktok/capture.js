// Рендер кадров: node capture.js <fps> <from> <to> <out.mp4>   |   node capture.js stills t1,t2,... | sfx
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const url = 'file://' + path.resolve(__dirname, process.env.PAGE || 'index.html');
const OUTDIR = path.dirname(path.resolve(__dirname, process.env.PAGE || 'index.html'));

(async () => {
  const [mode, ...args] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); if (mode !== 'stills') process.exit(1); });
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(url);
  await page.waitForFunction('window.READY === true');
  const frame = t => page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/png').slice(22); }, t);

  if (mode === 'sfx') {
    fs.writeFileSync(path.join(__dirname, 'build/sfx.json'), JSON.stringify(await page.evaluate('SFX'), null, 1));
  } else if (mode === 'stills') {
    // node capture.js stills 1.5,3,4.2 [префикс] — кадры в build/stills/<префикс>_t<время>.png
    const pre = args[1] || 'still';
    fs.mkdirSync(path.join(OUTDIR, 'stills'), { recursive: true });
    for (const t of args[0].split(',').map(Number)) {
      try {
        fs.writeFileSync(path.join(OUTDIR, `stills/${pre}_t${t.toFixed(2)}.png`), Buffer.from(await frame(t), 'base64'));
      } catch (e) { console.error(`RENDER ERROR at t=${t}:`, e.message.split('\n')[0]); }
    }
  } else {
    const fps = +mode, from = +args[0], to = +args[1], out = args[2];
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(fps), out],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    for (let i = from; i < to; i++) {
      const buf = Buffer.from(await frame(i / fps), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 300 === 0) console.log(out, i);
    }
    ff.stdin.end(); await done;
  }
  await browser.close();
})();
