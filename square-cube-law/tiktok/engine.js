'use strict';
// Движок вертикального ролика «Закон квадрата–куба» (1080×1920).
// Вся графика — чистая функция времени render(t). Сцены лежат в scenes/*.js
// и регистрируются через defineScene(id, {draw, sfx}).

const W = 1080, H = 1920;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
let g = cv.getContext('2d');

// ---------- цвет ----------
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const COL = {
  bg: hex('#0E1014'), ink: hex('#ECE8DF'), dim: hex('#7C8190'), faint: hex('#2A2E37'),
  cube: hex('#2E333E'), area: hex('#F2B45A'), vol: hex('#5FAEF2'), red: hex('#EF6A5B'),
  heat: hex('#FF8748'), green: hex('#7FD49B'),
};
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ---------- время ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = t => 1 - Math.pow(1 - t, 3);
const eback = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const P = (t, a, d = .8, e = eio) => e(clamp((t - a) / d));
// появление в a, исчезновение в b
const FIO = (t, a, b, d = .5) => Math.min(P(t, a, d, eout), 1 - P(t, b, d, eio));

const LN = {}; TL.lines.forEach(l => LN[l.key] = l);
const SC = {}; TL.scenes.forEach(s => SC[s.id] = s);
const C = k => LN[k].start;
const E = k => LN[k].start + LN[k].dur;
// точный момент начала слова в реплике k (по WordBoundary из TTS); n — номер вхождения
const clean = s => s.toLowerCase().replace(/[^a-zа-яё0-9-]/gi, '');
function Wd(k, word, n = 0) {
  const ws = LN[k].words.filter(w => clean(w.w).startsWith(clean(word)));
  if (!ws[n]) throw new Error(`нет слова «${word}» в ${k}`);
  return ws[n].t;
}
// конец слова
function WdE(k, word, n = 0) {
  const ws = LN[k].words.filter(w => clean(w.w).startsWith(clean(word)));
  if (!ws[n]) throw new Error(`нет слова «${word}» в ${k}`);
  return ws[n].t + ws[n].d;
}
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- 2D-примитивы ----------
let FONT = '"Inter Display", Inter, "DejaVu Sans", sans-serif';
function txt(s, x, y, o = {}) {
  const { size = 40, col = COL.ink, a = 1, w = 500, align = 'center', base = 'middle', ls = 0 } = o;
  if (a <= .002) return;
  g.save(); g.globalAlpha *= a;
  g.font = `${w} ${size}px ${FONT}`; g.fillStyle = rgba(col);
  g.textAlign = align; g.textBaseline = base; g.letterSpacing = ls + 'px';
  g.fillText(s, x, y); g.restore();
}
function txtIn(s, x, y, t0, t, o = {}) {
  const p = P(t, t0, .7, eout);
  txt(s, x, y + (1 - p) * 18, { ...o, a: (o.a ?? 1) * p });
}
function line(x1, y1, x2, y2, col, a = 1, lw = 2, dash = null) {
  if (a <= .002) return;
  g.save(); g.strokeStyle = rgba(col, a); g.lineWidth = lw; g.lineCap = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore();
}
function arrow(x1, y1, x2, y2, col, a = 1, lw = 4, hs = 14) {
  if (a <= .002) return;
  const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
  hs = Math.min(hs, len * .6);
  g.save(); g.strokeStyle = g.fillStyle = rgba(col, a); g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(ang) * hs * .6, y2 - Math.sin(ang) * hs * .6); g.stroke();
  g.beginPath(); g.moveTo(x2, y2);
  g.lineTo(x2 - Math.cos(ang - .45) * hs, y2 - Math.sin(ang - .45) * hs);
  g.lineTo(x2 - Math.cos(ang + .45) * hs, y2 - Math.sin(ang + .45) * hs);
  g.closePath(); g.fill(); g.restore();
}
function circle(x, y, r, col, a = 1) {
  if (a <= .002 || r <= 0) return;
  g.fillStyle = rgba(col, a); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}
function ellipse(x, y, rx, ry, rotA, col, a = 1) {
  g.fillStyle = rgba(col, a); g.beginPath(); g.ellipse(x, y, rx, ry, rotA, 0, Math.PI * 2); g.fill();
}
function glow(x, y, r, col, a) {
  if (a <= .002) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}

// ---------- 3D (ортографическая проекция) ----------
const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function cam(yaw, pitch, cx, cy, unit) {
  return { cx, cy, unit, cy_: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch) };
}
function rot(c, [x, y, z]) {
  const x1 = x * c.cy_ + z * c.sy, z1 = -x * c.sy + z * c.cy_;
  return [x1, y * c.cp - z1 * c.sp, y * c.sp + z1 * c.cp];
}
function proj(c, p) { const r = rot(c, p); return [c.cx + r[0] * c.unit, c.cy - r[1] * c.unit, r[2]]; }
// грани: +x −x +y −y +z −z (индекс угла = dx + 2·dy + 4·dz)
const FACES = [[[1, 0, 0], [1, 3, 7, 5]], [[-1, 0, 0], [0, 4, 6, 2]], [[0, 1, 0], [2, 6, 7, 3]],
  [[0, -1, 0], [0, 1, 5, 4]], [[0, 0, 1], [4, 5, 7, 6]], [[0, 0, -1], [0, 2, 3, 1]]];
const LIGHT = norm([-.45, .75, .55]);
function corners(p, s) {
  const v = [];
  for (let i = 0; i < 8; i++) v.push([p[0] + (i & 1 ? s : 0), p[1] + (i & 2 ? s : 0), p[2] + (i & 4 ? s : 0)]);
  return v;
}
function drawCubes(c, cubes) {
  const items = cubes.filter(q => q.a > .002 && q.s > 0)
    .map(q => ({ q, d: rot(c, [q.p[0] + q.s / 2, q.p[1] + q.s / 2, q.p[2] + q.s / 2])[2] }))
    .sort((A, B) => A.d - B.d);
  for (const { q } of items) {
    const v = corners(q.p, q.s).map(p => proj(c, p));
    for (let fi = 0; fi < 6; fi++) {
      const [n, idx] = FACES[fi], nr = rot(c, n);
      if (nr[2] <= .001) continue;
      const base = (q.faces && q.faces[fi]) || q.col;
      const lit = .55 + .45 * Math.max(0, dot(nr, LIGHT));
      g.beginPath(); idx.forEach((k, j) => j ? g.lineTo(v[k][0], v[k][1]) : g.moveTo(v[k][0], v[k][1])); g.closePath();
      g.fillStyle = rgba(mul(base, lit), q.a); g.fill();
      g.strokeStyle = rgba(q.edge || COL.ink, q.a * (q.ea ?? .5)); g.lineWidth = q.lw || 1.6; g.lineJoin = 'round'; g.stroke();
    }
  }
}
function drawWire(c, p, s, col, a, lw = 2.2) {
  if (a <= .002) return;
  const v = corners(p, s).map(q => proj(c, q)), vis = FACES.map(([n]) => rot(c, n)[2] > .001);
  for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) {
    const bit = 1 << b; if (i & bit) continue;
    const j = i | bit;
    let visible = false;
    for (let ob = 0; ob < 3; ob++) if (ob !== b && vis[ob * 2 + (((i >> ob) & 1) ? 0 : 1)]) visible = true;
    line(v[i][0], v[i][1], v[j][0], v[j][1], col, a * (visible ? 1 : .3), lw, visible ? null : [6, 9]);
  }
}
function quad3(c, pts, col, a) {
  if (a <= .002) return;
  const v = pts.map(p => proj(c, p));
  g.beginPath(); v.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath();
  g.fillStyle = rgba(col, a); g.fill();
}
// плитки n×n на передней грани (+z) куба со стороной n, центрированного в 0
function frontTiles(c, n, t, t0, step, aOut, col) {
  const h = n / 2, ins = .07;
  for (let i = 0; i < n * n; i++) {
    const x = -h + (i % n), y = h - 1 - Math.floor(i / n);
    const a = P(t, t0 + i * step, .3, eout) * aOut;
    const k = .7 + .3 * a;
    const cx = x + .5, cy = y + .5, r = (.5 - ins) * k;
    quad3(c, [[cx - r, cy - r, h], [cx + r, cy - r, h], [cx + r, cy + r, h], [cx - r, cy + r, h]], col, a * .9);
  }
}
// n³ кубиков, падающих сверху по очереди
function dropOrder(n) {
  const arr = [];
  for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) arr.push([x, y, z]);
  return arr;
}
function droppedCubes(n, t, t0, step, col, aAll = 1) {
  const h = n / 2;
  return dropOrder(n).map(([x, y, z], k) => {
    const u = clamp((t - (t0 + k * step)) / .5);
    return { p: [x - h, y - h + 3.2 * (1 - eout(u)), z - h], s: 1, col, a: clamp(u * 3) * aAll, ea: .45 };
  });
}

// ---------- силуэты ----------
function withT(x, y, s, a, fn) {
  if (a <= .002) return;
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= a; fn(); g.restore();
}
function poly(pts, col, lw) {
  g.strokeStyle = rgba(col); g.lineWidth = lw; g.lineCap = g.lineJoin = 'round';
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
}
function drawAnt(x, y, s, o = {}) {
  const { a = 1, col = COL.ink, buckle = 0, crack = 0 } = o;
  withT(x, y, s, a, () => {
    const d = buckle * 30, far = mix(col, COL.bg, .45);
    const legs = [[4, 26, 52], [12, 6, 12], [20, -26, -60]];
    const leg = (hx, kx, fx, c, off) => {
      const sp = 1 + buckle * .7;
      poly([[hx + off, -40 + d], [hx + off + kx * sp, lerp(-64, -26, buckle)], [hx + off + fx * sp, 0]], c, 5);
    };
    legs.forEach(([hx, kx, fx]) => leg(hx, kx * .8, fx * .78, far, 7));
    // усики
    poly([[56, -68 + d], [72, -96 + d], [94, -98 + d]], col, 3.5);
    poly([[52, -70 + d], [60, -102 + d], [80, -112 + d]], far, 3.5);
    ellipse(-52, -44 + d, 44, 29, -.2, col);
    circle(-6, -44 + d, 7, col);
    ellipse(14, -47 + d, 24, 12, -.15, col);
    circle(50, -56 + d, 17, col);
    legs.forEach(([hx, kx, fx]) => leg(hx, kx, fx, col, 0));
    if (crack > 0) legs.forEach(([hx, kx], i) => {
      const kx2 = hx + kx * (1 + buckle * .7), ky = lerp(-64, -26, buckle);
      g.save(); g.globalAlpha *= crack;
      poly([[kx2 - 7, ky - 9], [kx2 + 2, ky - 2], [kx2 - 3, ky + 4], [kx2 + 7, ky + 10]], COL.red, 2.5);
      g.restore();
    });
  });
}
function drawElephant(x, y, s, o = {}) {
  const { a = 1, col = COL.ink, flap = 0, legCol = null, squat = 0 } = o;
  withT(x, y, s, a, () => {
    const q = squat * 14, far = mix(legCol || col, COL.bg, .4), near = legCol || col;
    const legR = (lx, c) => { g.fillStyle = rgba(c); g.beginPath(); g.roundRect(lx, -150 + q, 46, 150 - q, [0, 0, 8, 8]); g.fill(); };
    legR(-88, far); legR(84, far);
    poly([[-140, -190 + q], [-158, -112 + q]], col, 5);
    ellipse(0, -178 + q, 148, 94, 0, col);
    legR(-112, near); legR(56, near);
    circle(128, -205 + q, 66, col);
    g.strokeStyle = rgba(col); g.lineWidth = 30; g.lineCap = 'round';
    g.beginPath(); g.moveTo(172, -200 + q); g.quadraticCurveTo(226, -130 + q, 204, -34 + q * .5); g.stroke();
    ellipse(96, -196 + q, 46 + flap * 16, 62, -.1 - flap * .25, mix(col, COL.bg, .22));
    g.strokeStyle = rgba(COL.bg, .9); g.lineWidth = 3;
    g.beginPath(); g.ellipse(96, -196 + q, 46 + flap * 16, 62, -.1 - flap * .25, 0, Math.PI * 2); g.stroke();
    circle(150, -216 + q, 5, COL.bg);
  });
}
function drawMouse(x, y, s, o = {}) {
  const { a = 1, col = COL.ink } = o;
  withT(x, y, s, a, () => {
    g.strokeStyle = rgba(col); g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-40, -18); g.bezierCurveTo(-80, -2, -100, -42, -132, -24); g.stroke();
    ellipse(0, -27, 46, 26, 0, col);
    ellipse(46, -31, 28, 19, .15, col);
    g.fillStyle = rgba(col); g.beginPath(); g.moveTo(58, -42); g.lineTo(92, -24); g.lineTo(56, -16); g.fill();
    circle(32, -52, 12, col); circle(32, -52, 6, mix(col, COL.bg, .4));
    circle(60, -35, 3.2, COL.bg);
    g.fillRect(-28, -8, 12, 8); g.fillRect(22, -8, 12, 8);
  });
}
function drawFlea(x, y, s, o = {}) {
  const { a = 1, col = COL.ink } = o;
  withT(x, y, s, a, () => {
    ellipse(0, -10, 11, 8, -.3, col); circle(10, -14, 4.5, col);
    poly([[-4, -6], [-14, -18], [-17, 0]], col, 2.6); poly([[6, -5], [9, 0]], col, 2);
  });
}
function drawBone(x, y, len, th, col, a = 1) {
  withT(x, y, 1, a, () => {
    g.fillStyle = rgba(col);
    g.beginPath(); g.roundRect(-len / 2 + th * .6, -th / 2, len - th * 1.2, th, th * .2); g.fill();
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) circle(sx * (len / 2 - th * .55), sy * th * .45, th * .56, col);
  });
}
function drawHouse(x, y, s, a) {
  withT(x, y, s, a, () => {
    g.strokeStyle = rgba(COL.dim); g.lineWidth = 3 / s; g.lineJoin = 'round';
    g.strokeRect(-180, -250, 360, 250);
    g.beginPath(); g.moveTo(-210, -250); g.lineTo(0, -400); g.lineTo(210, -250); g.stroke();
    g.strokeRect(-40, -120, 80, 120); g.strokeRect(70, -190, 60, 60);
  });
}


// =====================================================================
// Apple-стиль: появление через размытие, пружинные кривые
// =====================================================================
const eexp = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);                 // «expo out» — основная кривая
const espr = t => t >= 1 ? 1 : 1 - Math.exp(-6.5 * t) * Math.cos(7.5 * t); // мягкая пружина с лёгким перелётом

// Текст, проявляющийся из размытия. out — момент исчезновения (тоже через размытие).
// grad: [цвет1, цвет2] — горизонтальный градиент заливки.
function atext(s, x, y, t0, t, o = {}) {
  const { size = 64, w = 700, col = COL.ink, a = 1, align = 'center', base = 'middle', ls = 0,
    dur = .9, blur = 22, dy = 28, out = null, outDur = .45, grad = null, gradSpan = null, scale0 = 1.04 } = o;
  const p = P(t, t0, dur, eexp);
  const q = out == null ? 0 : P(t, out, outDur, eio);
  const al = a * p * (1 - q);
  if (al <= .002) return;
  const b = (1 - p) * blur + q * blur * .8;
  g.save();
  g.globalAlpha *= al;
  if (b > .3) g.filter = `blur(${b.toFixed(2)}px)`;
  g.translate(x, y + (1 - p) * dy - q * dy * .5);
  const k = lerp(scale0, 1, p) * (1 - .03 * q); g.scale(k, k);
  g.font = `${w} ${size}px ${FONT}`; g.textAlign = align; g.textBaseline = base; g.letterSpacing = ls + 'px';
  if (grad) {
    const tw = g.measureText(s).width, x0 = align === 'center' ? -tw / 2 : align === 'right' ? -tw : 0;
    const gr = gradSpan ? g.createLinearGradient(gradSpan[0] - x, 0, gradSpan[1] - x, 0) : g.createLinearGradient(x0, 0, x0 + tw, 0);
    gr.addColorStop(0, rgba(grad[0])); gr.addColorStop(1, rgba(grad[1])); g.fillStyle = gr;
  } else g.fillStyle = rgba(col);
  g.fillText(s, 0, 0);
  g.restore();
}
// Заголовок, слова которого проявляются по очереди (stagger) — как в презентациях Apple.
function atextWords(s, x, y, t0, t, o = {}) {
  const { size = 64, w = 700, align = 'center', stagger = .08, ls = 0 } = o;
  g.save(); g.font = `${w} ${size}px ${FONT}`; g.letterSpacing = ls + 'px';
  const words = s.split(' '), sp = g.measureText(' ').width, ws = words.map(q => g.measureText(q).width);
  g.restore();
  const total = ws.reduce((A, B) => A + B, 0) + sp * (words.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const span = [cx, cx + total];
  words.forEach((q, i) => { atext(q, cx, y, t0 + i * stagger, t, { ...o, align: 'left', gradSpan: o.grad ? span : null }); cx += ws[i] + sp; });
}
// Число, «прокручивающееся» до значения, с проявлением из размытия.
function acount(to, x, y, t0, t, o = {}) {
  const { dur = 1.2, prefix = '', suffix = '', from = 0 } = o;
  const p = P(t, t0, dur, eexp);
  const v = Math.round(lerp(from, to, p)).toLocaleString('ru-RU').replace(/ /g, ' ');
  atext(prefix + v + suffix, x, y, t0, t, o);
}
// Плавный зум/сдвиг «камеры» внутри сцены: fn рисует в масштабе zoom вокруг (cx, cy).
function withCam(cx, cy, zoom, fn) {
  g.save(); g.translate(W / 2, H / 2); g.scale(zoom, zoom); g.translate(-cx, -cy); fn(); g.restore();
}
// Короткий «удар» камеры: 0 → amp → 0 после t0 (для акцентов).
const punch = (t, t0, amp = .06, d = .5) => t < t0 ? 0 : amp * Math.exp(-(t - t0) / (d * .35)) * Math.sin(Math.min(1, (t - t0) / (d * .25)) * Math.PI / 2);
// Тряска (например, при «хрусте»).
function shake(t, t0, amp = 18, d = .5) {
  if (t < t0 || t > t0 + d) return [0, 0];
  const k = amp * (1 - (t - t0) / d);
  return [Math.sin(t * 91) * k, Math.cos(t * 77) * k];
}
// Стеклянная плашка (glass card) — полупрозрачный скруглённый прямоугольник.
function glass(x, y, w, h, r, a = 1) {
  if (a <= .002) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1.5;
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); g.stroke(); g.restore();
}

// =====================================================================
// Раскладка кадра 9:16 (безопасные зоны TikTok/Reels/Shorts)
// =====================================================================
const LAYOUT = {
  top: 250,            // выше — интерфейс платформы
  stageY: 760,         // центр основной «сцены» с графикой
  stageTop: 300, stageBottom: 1220,
  capY: 1370,          // базовая линия субтитров
  bottom: 1560,        // ниже — подпись/интерфейс платформы, ничего важного не ставим
  cx: 520,             // центр по X чуть левее середины (справа — кнопки платформы)
};

// ---------- регистрация сцен ----------
const SCENE_DEFS = {};
function defineScene(id, def) { SCENE_DEFS[id] = def; }

// ---------- фон: тёмный с медленными мягкими пятнами света ----------
let BG = null;
function makeBg() {
  BG = document.createElement('canvas'); BG.width = W; BG.height = H;
  const b = BG.getContext('2d');
  b.fillStyle = rgba(COL.bg); b.fillRect(0, 0, W, H);
  const gr = b.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1300);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)');
  b.fillStyle = gr; b.fillRect(0, 0, W, H);
}
function drawBg(t) {
  g.drawImage(BG, 0, 0);
  const blobs = [[COL.vol, .07, 300, 500, .11], [COL.area, .05, 800, 1300, .09], [hex('#8E6CF2'), .05, 500, 900, .07]];
  blobs.forEach(([c, a, bx, by, sp], i) => {
    const x = bx + Math.sin(t * sp + i * 2) * 220, y = by + Math.cos(t * sp * .8 + i) * 260;
    glow(x, y, 700, c, a);
  });
}

// ---------- субтитры: группы по 1–3 слова, активное слово подсвечено ----------
const CAPS = [];
(function buildCaps() {
  for (const l of TL.lines) {
    let grp = [], pos = 0;
    const text = l.text;
    l.words.forEach((w, i) => {
      const at = text.indexOf(w.w, pos); pos = at >= 0 ? at + w.w.length : pos;
      const after = text.slice(pos, pos + 2);
      grp.push({ ...w, w: w.w + (/^[,.!?:…]/.test(after) ? after[0] : '') });
      const chars = grp.reduce((A, q) => A + q.w.length + 1, 0);
      const brk = /[,.!?:—]/.test(after) || /^ —/.test(text.slice(pos, pos + 3));
      if (brk || chars > 15 || grp.length >= 3 || i === l.words.length - 1) { CAPS.push({ words: grp, line: l.key }); grp = []; }
    });
  }
  CAPS.forEach((c, i) => {
    c.t0 = c.words[0].t;
    const last = c.words[c.words.length - 1];
    const next = CAPS[i + 1];
    c.t1 = Math.min(last.t + last.d + .35, next ? next.words[0].t : 1e9);
  });
})();
function drawCaptions(t) {
  const c = CAPS.find(c => t >= c.t0 - .05 && t < c.t1);
  if (!c) return;
  const size = 76, y = LAYOUT.capY;
  g.save(); g.font = `800 ${size}px ${FONT}`; g.letterSpacing = '-1px';
  const sp = g.measureText(' ').width * 1.35, ws = c.words.map(w => g.measureText(w.w).width);
  g.restore();
  const total = ws.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let x = LAYOUT.cx - total / 2;
  const q = P(t, c.t1 - .12, .12, eio);
  c.words.forEach((w, i) => {
    const said = t >= w.t, active = said && t < w.t + w.d + .05;
    const p = P(t, Math.max(c.t0 - .05, w.t - .18), .32, eexp);
    const al = (.38 + .62 * (said ? 1 : 0)) * p * (1 - q);
    const b = (1 - p) * 14 + q * 10;
    g.save(); g.globalAlpha = al; if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`;
    g.translate(x + ws[i] / 2, y + (1 - p) * 16 - (active ? 4 * P(t, w.t, .15, eout) : 0));
    g.font = `800 ${size}px ${FONT}`; g.letterSpacing = '-1px'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 24;
    g.fillStyle = rgba(active ? COL.area : COL.ink);
    g.fillText(w.w, 0, 0);
    g.restore();
    x += ws[i] + sp;
  });
}

// ---------- метка главы (стеклянная «пилюля» сверху) ----------
function chapterPill(label, t, s) {
  const p = P(t, s.start + .15, .8, eexp);
  if (p <= 0) return;
  g.save(); g.font = `600 30px ${FONT}`; g.letterSpacing = '4px';
  const tw = g.measureText(label).width; g.restore();
  const w = tw + 64, x = LAYOUT.cx - w / 2, y = LAYOUT.top - 30;
  g.save(); g.globalAlpha *= p; if (p < .99) g.filter = `blur(${((1 - p) * 12).toFixed(1)}px)`;
  glass(x, y, w, 64, 32);
  g.restore();
  atext(label, LAYOUT.cx, y + 33, s.start + .15, t, { size: 30, w: 600, col: COL.ink, ls: 4, blur: 12, dy: 0 });
}

// ---------- кадр ----------
let OFF = null, offG = null;
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
  drawBg(t);
  for (const s of TL.scenes) {
    const def = SCENE_DEFS[s.id];
    if (!def || t < s.start - .01 || t > s.end + .01) continue;
    // переход в стиле Apple: входящая сцена — из размытия и чуть крупнее, уходящая — в размытие и чуть мельче
    const pin = s.id === TL.scenes[0].id ? 1 : P(t, s.start, .55, eexp);
    const isLast = s.id === TL.scenes[TL.scenes.length - 1].id;
    const pout = isLast ? P(t, TL.total - 1.2, 1.1, eio) : P(t, s.end - .38, .38, eio);
    const a = pin * (1 - pout);
    if (a <= .002) continue;
    const blur = (1 - pin) * 26 + pout * 26, k = lerp(1.07, 1, pin) * (1 - .06 * pout);
    const draw = ctx => {
      const keep = g; g = ctx;
      g.save(); g.translate(W / 2, H / 2); g.scale(k, k); g.translate(-W / 2, -H / 2);
      if (def.chapter) chapterPill(def.chapter, t, s);
      def.draw(t, s);
      g.restore(); g = keep;
    };
    if (blur > .4) {
      if (!OFF) { OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; offG = OFF.getContext('2d'); }
      offG.setTransform(1, 0, 0, 1, 0, 0); offG.globalAlpha = 1; offG.filter = 'none'; offG.clearRect(0, 0, W, H);
      draw(offG);
      g.save(); g.globalAlpha = a; g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(OFF, 0, 0); g.restore();
    } else {
      g.save(); g.globalAlpha = a; draw(g); g.restore();
    }
  }
  drawCaptions(t);
}

function buildSfx() {
  const S = [], add = (t, type, gain = 1, pitch = 1) => S.push({ t: +t.toFixed(3), type, gain, pitch });
  TL.scenes.forEach((s, i) => { if (i) add(s.start, 'whoosh', .7); });
  for (const s of TL.scenes) if (SCENE_DEFS[s.id] && SCENE_DEFS[s.id].sfx) {
    try { SCENE_DEFS[s.id].sfx(add, s); } catch (e) { console.error('sfx ' + s.id + ': ' + e.message); }
  }
  return S.sort((a, b) => a.t - b.t);
}

function boot() {
  window.render = render;
  window.SFX = buildSfx();
  Promise.all(['800 40px "Inter Display"', '700 40px "Inter Display"', '600 40px "Inter Display"', '500 40px Inter']
    .map(f => document.fonts.load(f))).then(() => {
    makeBg(); render(0); window.READY = true;
    if (location.hash === '#play') {
      const t0 = performance.now();
      const loop = () => { render((performance.now() - t0) / 1000 % TL.total); requestAnimationFrame(loop); };
      loop();
    } else if (location.hash.startsWith('#t=')) render(parseFloat(location.hash.slice(3)));
  });
}
