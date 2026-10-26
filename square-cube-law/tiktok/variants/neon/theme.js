// NEON / CYBER GLITCH — тема поверх engine.js (только переопределения)
(function () {
  Object.assign(COL, {
    bg: hex('#05030A'), ink: hex('#E6F0FF'), dim: hex('#7A86A8'), faint: hex('#1E1A33'),
    cube: hex('#2A1450'), area: hex('#FF2E97'), vol: hex('#16F2FF'), red: hex('#FF2A4D'),
    heat: hex('#FF8A1F'), green: hex('#3DFF8F'),
  });
})();
FONT = '"DejaVu Sans Mono", "Liberation Mono", monospace';

// детерминированный шум от целого
function nzNeon(i) { const r = rng(i * 7919 + 13); r(); return r(); }

makeBg = function () {
  BG = document.createElement('canvas'); BG.width = W; BG.height = H;
  const b = BG.getContext('2d');
  b.fillStyle = rgba(COL.bg); b.fillRect(0, 0, W, H);
  // горизонт-свечение
  const hy = 1240;
  const gr = b.createLinearGradient(0, hy - 420, 0, hy + 40);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.85, rgba(COL.area, .16)); gr.addColorStop(1, rgba(COL.area, .35));
  b.fillStyle = gr; b.fillRect(0, hy - 420, W, 460);
  const fl = b.createLinearGradient(0, hy, 0, H);
  fl.addColorStop(0, 'rgba(40,0,60,0.55)'); fl.addColorStop(1, 'rgba(5,3,10,1)');
  b.fillStyle = fl; b.fillRect(0, hy, W, H - hy);
  // звёзды
  const r = rng(77);
  for (let i = 0; i < 140; i++) { b.fillStyle = `rgba(200,230,255,${(r() * .5 + .1).toFixed(2)})`; b.fillRect(r() * W, r() * (hy - 100), 2, 2); }
  b.strokeStyle = rgba(COL.area, .9); b.lineWidth = 3; b.beginPath(); b.moveTo(0, hy); b.lineTo(W, hy); b.stroke();
};

drawBg = function (t) {
  g.drawImage(BG, 0, 0);
  const hy = 1240, vx = W / 2;
  g.save();
  g.shadowColor = rgba(COL.area); g.shadowBlur = 14;
  // вертикальные лучи сетки
  g.strokeStyle = rgba(COL.area, .55); g.lineWidth = 2;
  g.beginPath();
  for (let i = -14; i <= 14; i++) { g.moveTo(vx + i * 30, hy); g.lineTo(vx + i * 330, H); }
  g.stroke();
  // горизонтальные линии, едущие к зрителю
  const ph = (t * .6) % 1;
  g.strokeStyle = rgba(COL.vol, .5);
  g.beginPath();
  for (let i = 0; i < 14; i++) {
    const z = (i + ph) / 14, y = hy + (H - hy) * z * z;
    g.moveTo(0, y); g.lineTo(W, y);
  }
  g.stroke();
  g.restore();
  // солнце-кольцо за горизонтом
  glow(vx, hy - 40, 520, COL.area, .10);
  glow(220 + Math.sin(t * .2) * 120, 500, 600, COL.vol, .05);
};

// сканлайны (накладываются в render)
let SCAN_NEON = null;
function scanNeon() {
  if (SCAN_NEON) return SCAN_NEON;
  SCAN_NEON = document.createElement('canvas'); SCAN_NEON.width = W; SCAN_NEON.height = H;
  const b = SCAN_NEON.getContext('2d'); b.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = 0; y < H; y += 4) b.fillRect(0, y, W, 2);
  const v = b.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.65)');
  b.fillStyle = v; b.fillRect(0, 0, W, H);
  return SCAN_NEON;
}

// глитч-появление текста: RGB-расщепление, дрожание, мерцание
atext = function (s, x, y, t0, t, o = {}) {
  const { size = 64, w = 700, col = COL.ink, a = 1, align = 'center', base = 'middle', ls = 0,
    dur = .9, out = null, outDur = .45, grad = null, gradSpan = null } = o;
  const p = P(t, t0, dur * .8, eexp);
  const q = out == null ? 0 : P(t, out, outDur, eio);
  if (t < t0) return;
  const fr = Math.floor(t * 30), seed = (s.length * 31 + Math.floor(t0 * 100)) | 0;
  const g1 = 1 - p + q;                         // сила глитча
  let fl = 1;
  if (g1 > .02) fl = nzNeon(fr + seed) < g1 * .7 ? .25 : 1;  // мерцание
  const al = a * Math.min(1, p * 1.6) * (1 - q) * fl;
  if (al <= .002) return;
  const jx = g1 > .02 ? (nzNeon(fr * 3 + seed) - .5) * 40 * g1 : 0;
  const off = 14 * g1 + 1.2;
  const sz = size * .9;
  g.save();
  g.globalAlpha *= al;
  g.translate(x + jx, y);
  g.font = `${w >= 600 ? 'bold' : 'normal'} ${sz}px ${FONT}`; g.textAlign = align; g.textBaseline = base;
  g.letterSpacing = (ls + sz * .02) + 'px';
  const ga = g.globalAlpha;
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = ga * .75; g.fillStyle = rgba(COL.area); g.fillText(s, -off, 0);
  g.fillStyle = rgba(COL.vol); g.fillText(s, off, 0);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = ga;
  if (grad) {
    const tw = g.measureText(s).width, x0 = align === 'center' ? -tw / 2 : align === 'right' ? -tw : 0;
    const gr = gradSpan ? g.createLinearGradient(gradSpan[0] - x, 0, gradSpan[1] - x, 0) : g.createLinearGradient(x0, 0, x0 + tw, 0);
    gr.addColorStop(0, rgba(grad[0])); gr.addColorStop(1, rgba(grad[1])); g.fillStyle = gr;
    g.shadowColor = rgba(grad[0], .8);
  } else { g.fillStyle = rgba(col); g.shadowColor = rgba(col, .8); }
  g.shadowBlur = 18;
  g.fillText(s, 0, 0);
  g.restore();
};

atextWords = function (s, x, y, t0, t, o = {}) {
  const { size = 64, w = 700, align = 'center', stagger = .08, ls = 0 } = o;
  const sz = size * .9;
  g.save(); g.font = `${w >= 600 ? 'bold' : 'normal'} ${sz}px ${FONT}`; g.letterSpacing = (ls + sz * .02) + 'px';
  const words = s.split(' '), sp = g.measureText(' ').width, ws = words.map(q => g.measureText(q).width);
  g.restore();
  const total = ws.reduce((A, B) => A + B, 0) + sp * (words.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const span = [cx, cx + total];
  words.forEach((q, i) => { atext(q, cx, y, t0 + i * stagger, t, { ...o, align: 'left', gradSpan: o.grad ? span : null }); cx += ws[i] + sp; });
};

glass = function (x, y, w, h, r, a = 1) {
  if (a <= .002) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(10,4,24,0.75)'; g.fillRect(x, y, w, h);
  g.strokeStyle = rgba(COL.vol, .9); g.lineWidth = 2; g.shadowColor = rgba(COL.vol); g.shadowBlur = 16;
  g.strokeRect(x, y, w, h);
  // уголки
  g.fillStyle = rgba(COL.area); const c = 12;
  g.fillRect(x - 3, y - 3, c, 5); g.fillRect(x - 3, y - 3, 5, c);
  g.fillRect(x + w - c + 3, y + h - 2, c, 5); g.fillRect(x + w - 2, y + h - c + 3, 5, c);
  g.restore();
};

chapterPill = function (label, t, s) {
  const p = P(t, s.start + .15, .5, eexp);
  if (p <= 0) return;
  const L = '> ' + label.toUpperCase() + ' _';
  g.save(); g.font = `bold 28px ${FONT}`; g.letterSpacing = '6px';
  const tw = g.measureText(L).width; g.restore();
  const w = tw + 56, x = LAYOUT.cx - w / 2, y = LAYOUT.top - 30;
  glass(x, y, w * p, 60, 0, p);
  atext(L, LAYOUT.cx, y + 31, s.start + .15, t, { size: 31, w: 700, col: COL.vol, ls: 6, dur: .6 });
};

drawCaptions = function (t) {
  const c = CAPS.find(c => t >= c.t0 - .05 && t < c.t1);
  if (!c) return;
  const size = 66, y = LAYOUT.capY;
  const F = `bold ${size}px ${FONT}`;
  g.save(); g.font = F; g.letterSpacing = '2px';
  const up = c.words.map(w => w.w.toUpperCase());
  const sp = g.measureText(' ').width, ws = up.map(w => g.measureText(w).width);
  g.restore();
  const total = ws.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  const k = Math.min(1, 980 / total);
  let x = LAYOUT.cx - total * k / 2;
  const q = P(t, c.t1 - .1, .1, eio);
  c.words.forEach((w, i) => {
    const said = t >= w.t, active = said && t < w.t + w.d + .05;
    const p = P(t, Math.max(c.t0 - .05, w.t - .12), .2, eout);
    const fr = Math.floor(t * 30);
    const gl = (1 - p) + q;
    const al = (.35 + .65 * (said ? 1 : 0)) * p * (1 - q) * (gl > .05 && nzNeon(fr + i * 17) < .4 ? .4 : 1);
    if (al <= .002) { x += (ws[i] + sp) * k; return; }
    const col = active ? COL.vol : COL.ink;
    g.save(); g.globalAlpha = al;
    g.translate(x + ws[i] * k / 2 + (gl > .05 ? (nzNeon(fr * 5 + i) - .5) * 20 * gl : 0), y); g.scale(k, k);
    g.font = F; g.letterSpacing = '2px'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (active) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = al * .6; g.fillStyle = rgba(COL.area); g.fillText(up[i], -4, 2); g.globalCompositeOperation = 'source-over'; g.globalAlpha = al; }
    g.shadowColor = rgba(active ? COL.vol : COL.area, active ? 1 : .7); g.shadowBlur = active ? 30 : 18;
    g.fillStyle = rgba(col);
    g.fillText(up[i], 0, 0);
    g.restore();
    x += (ws[i] + sp) * k;
  });
};

// кадр: сцены → глитч-переходы → bloom → сканлайны
render = (function () {
  let OFFN = null, offN = null, BL = null, blG = null, FR = null, frG = null;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  return function (t) {
    if (!OFFN) { OFFN = mk(); offN = OFFN.getContext('2d'); BL = document.createElement('canvas'); BL.width = W / 4; BL.height = H / 4; blG = BL.getContext('2d'); FR = mk(); frG = FR.getContext('2d'); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    drawBg(t);
    let flash = 0;
    for (const s of TL.scenes) {
      const def = SCENE_DEFS[s.id];
      if (!def || t < s.start - .01 || t > s.end + .01) continue;
      const first = s.id === TL.scenes[0].id, isLast = s.id === TL.scenes[TL.scenes.length - 1].id;
      const pin = first ? 1 : P(t, s.start, .35, eout);
      const pout = isLast ? P(t, TL.total - 1.2, 1.1, eio) : P(t, s.end - .3, .3, eio);
      const a = pin * (1 - pout);
      if (a <= .002) continue;
      const gl = Math.max(1 - pin, pout);       // сила глитча перехода
      if (!first) flash = Math.max(flash, Math.max(0, 1 - (t - s.start) / .18));
      const draw = ctx => {
        const keep = g; g = ctx;
        g.save();
        if (def.chapter) chapterPill(def.chapter, t, s);
        def.draw(t, s);
        g.restore(); g = keep;
      };
      if (gl > .01) {
        offN.setTransform(1, 0, 0, 1, 0, 0); offN.globalAlpha = 1; offN.filter = 'none'; offN.globalCompositeOperation = 'source-over';
        offN.clearRect(0, 0, W, H);
        draw(offN);
        const fr = Math.floor(t * 30);
        g.save(); g.globalAlpha = a;
        // RGB-сдвиг
        const d = 30 * gl;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = a * .5 * gl; g.drawImage(OFFN, -d, 0); g.drawImage(OFFN, d, 0);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
        // горизонтальные полосы со сдвигом
        let yy = 0, i = 0;
        while (yy < H) {
          const hh = 20 + Math.floor(nzNeon(fr * 13 + i) * 140);
          const sh = nzNeon(fr * 29 + i * 7) < .55 ? (nzNeon(fr * 31 + i) - .5) * 260 * gl : 0;
          g.drawImage(OFFN, 0, yy, W, hh, sh, yy, W, hh);
          yy += hh; i++;
        }
        g.restore();
      } else {
        g.save(); g.globalAlpha = a; draw(g); g.restore();
      }
    }
    drawCaptions(t);
    // bloom: уменьшенная копия кадра, размытие, сложение
    blG.globalCompositeOperation = 'copy'; blG.filter = 'blur(6px)';
    blG.drawImage(cv, 0, 0, W / 4, H / 4); blG.filter = 'none';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .45; g.imageSmoothingEnabled = true;
    g.drawImage(BL, 0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    if (flash > 0) { g.fillStyle = `rgba(230,240,255,${(flash * .55).toFixed(3)})`; g.fillRect(0, 0, W, H); }
    g.drawImage(scanNeon(), 0, 0);
    g.restore();
  };
})();
