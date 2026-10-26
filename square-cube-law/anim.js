'use strict';
// Ролик «Закон квадрата–куба». Вся графика — чистая функция времени render(t),
// поэтому кадры можно рендерить в любом порядке и параллельно.

const W = 1920, H = 1080;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const g = cv.getContext('2d');

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
// момент, когда диктор произносит слово (по доле символов в реплике)
function Wd(k, word) {
  const l = LN[k], i = l.text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) throw new Error(`нет слова «${word}» в ${k}`);
  return l.start + l.dur * i / l.text.length;
}
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- 2D-примитивы ----------
const FONT = 'Inter, "DejaVu Sans", sans-serif';
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

// ---------- общие элементы ----------
let BG = null;
function makeBg() {
  BG = document.createElement('canvas'); BG.width = W; BG.height = H;
  const b = BG.getContext('2d');
  b.fillStyle = rgba(COL.bg); b.fillRect(0, 0, W, H);
  b.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 36; y < H; y += 48) for (let x = 24; x < W; x += 48) { b.beginPath(); b.arc(x, y, 1.3, 0, 7); b.fill(); }
  const gr = b.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1150);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
  b.fillStyle = gr; b.fillRect(0, 0, W, H);
}
function chapter(num, name, t, s) {
  const a = P(t, s.start + .4, .8, eout);
  txt(num, 96, 92, { size: 22, col: COL.area, a, w: 600, align: 'left', ls: 2 });
  txt(name.toUpperCase(), 140, 92, { size: 22, col: COL.dim, a, w: 500, align: 'left', ls: 5 });
}
function counter(label, x, y, col, steps, t, a) {
  // steps: [[время, текст], ...] — значение со «щелчком» при смене
  let cur = steps[0], prev = null;
  for (const st of steps) if (t >= st[0]) { prev = cur; cur = st; }
  const k = 1 + .14 * (1 - P(t, cur[0], .35, eout)) * (prev ? 1 : 0);
  txt(label, x, y, { size: 22, col: COL.dim, a, align: 'left', ls: 5 });
  g.save(); g.translate(x, y + 82); g.scale(k, k);
  txt(cur[1], 0, 0, { size: 104, col, a, w: 600, align: 'left' });
  g.restore();
}

// =====================================================================
// СЦЕНЫ
// =====================================================================
function sceneIntro(t) {
  const q1 = C('q1'), q2 = C('q2'), ti = C('title');
  // A: муравей размером с дом
  const aA = FIO(t, q1 - .8, q2 - .2, .6);
  if (aA > 0) {
    line(220, 820, 1700, 820, COL.faint, aA, 2);
    drawHouse(1300, 820, 1, aA * P(t, Wd('q1', 'дом?') - .4, .8, eout));
    const sc = lerp(.35, 3.2, P(t, Wd('q1', 'размером'), 1.6, eio));
    drawAnt(600, 820, sc, { a: aA });
  }
  // B: блоха и слон
  const aB = FIO(t, q2 - .1, ti - .2, .6);
  if (aB > 0) {
    line(220, 820, 1700, 820, COL.faint, aB, 2);
    const t0 = Wd('q2', 'блоха'), per = 1.3;
    let fx = 470, fy = 820;
    if (t > t0) {
      const n = Math.floor((t - t0) / per), u = ((t - t0) % per) / per, ju = clamp(u / .75);
      const dir = n % 2 ? -1 : 1, x0 = n % 2 ? 690 : 470;
      fx = x0 + dir * 220 * ju; fy = 820 - 4 * ju * (1 - ju) * 380;
      g.save(); g.setLineDash([3, 10]); g.strokeStyle = rgba(COL.dim, .5 * aB); g.lineWidth = 2;
      g.beginPath(); for (let i = 0; i <= 40; i++) { const v = i / 40; g.lineTo(470 + 220 * v, 820 - 4 * v * (1 - v) * 380); } g.stroke(); g.restore();
    }
    drawFlea(fx, fy, 1.3, { a: aB * P(t, t0 - .5, .5) });
    txtIn('блоха', 580, 880, t0 - .3, t, { size: 26, col: COL.dim, a: aB, ls: 3 });
    txtIn('×100 своего роста', 580, 400, t0 + .6, t, { size: 26, col: COL.area, a: aB, ls: 1 });
    const te = Wd('q2', 'слон');
    const sq = Math.max(0, Math.sin(clamp((t - Wd('q2', 'подпрыгнуть')) / 1.6) * Math.PI * 2));
    drawElephant(1300, 820, 1.05, { a: aB * P(t, te - .4, .6, eout), squat: sq });
    txtIn('слон', 1300, 880, te - .2, t, { size: 26, col: COL.dim, a: aB, ls: 3 });
  }
  // C: заголовок
  const aC = FIO(t, ti + .2, SC.intro.end - .5, .6);
  if (aC > 0) {
    const tt = Wd('title', 'законе квадрата');
    const up = P(t, tt - .6, 1.0);
    const cw = cam(.62 + t * .35, .5, 960, lerp(540, 250, up), lerp(130, 70, up));
    const gr = P(t, ti + .3, 1.2, eout);
    drawWire(cw, [-gr / 2, -gr / 2, -gr / 2], gr, COL.ink, aC * .9, 2.2);
    txtIn('Закон квадрата–куба', 960, 480, tt - .3, t, { size: 104, w: 600, a: aC });
    const lw = 160 * P(t, tt + .4, .8, eout);
    line(960 - lw, 568, 960 + lw, 568, COL.faint, aC, 2);
    txtIn('S ∝ L²', 820, 640, tt + 1.0, t, { size: 52, col: COL.area, a: aC, w: 500 });
    txtIn('V ∝ L³', 1100, 640, tt + 1.4, t, { size: 52, col: COL.vol, a: aC, w: 500 });
  }
}

function sceneCube(t) {
  const s = SC.cube; chapter('01', 'Кубик', t, s);
  const c1 = C('c1'), c2 = C('c2'), c3 = C('c3'), c4 = C('c4'), c5 = C('c5'), c6 = C('c6');
  const yaw = .62 + .14 * Math.sin(t * .3), pitch = .5, U = 112;
  // маленький кубик
  const mv = P(t, c3, 1.2);
  const sx = lerp(960, 380, mv), sy = 560;
  const pop = eback(clamp((t - c1 - .2) / .6));
  const aF = FIO(t, Wd('c2', 'площадь'), Wd('c2', 'объём') - .15, .4);
  const aV = FIO(t, Wd('c2', 'объём'), c3 + .3, .4);
  let col = mix(COL.cube, COL.area, aF * .85);
  col = mix(col, COL.vol, aV * .8);
  const cs = cam(yaw, pitch, sx, sy, U);
  if (pop > 0) drawCubes(cs, [{ p: [-pop / 2, -pop / 2, -pop / 2], s: pop, col, a: 1 }]);
  txtIn('1 см', sx, sy + 150, c1 + .7, t, { size: 30, col: COL.dim });
  const aL = 1 - P(t, c3 - .1, .5);
  txtIn('S = 6 см²', sx + 330, sy - 40, Wd('c2', 'площадь'), t, { size: 54, col: COL.area, a: aL, w: 600 });
  txtIn('V = 1 см³', sx + 330, sy + 50, Wd('c2', 'объём'), t, { size: 54, col: COL.vol, a: aL, w: 600 });

  // большой куб: сначала 2, потом 3
  const bx = 1010, by = 560, cb = cam(yaw, pitch, bx, by, U);
  const sw = P(t, c6, .7);              // переход 2 → 3
  const a2 = FIO(t, c3 + .2, c6, .5), a3 = P(t, c6 + .2, .6, eout);
  const side = lerp(1, 2, P(t, c3 + .3, 1.0, eout)) + lerp(0, 1, P(t, c6 + .2, 1.0, eout));
  drawWire(cb, [-side / 2, -side / 2, -side / 2], side, COL.ink, Math.max(a2, a3) * .8);
  const blue = mix(COL.cube, COL.vol, .55);
  const t5 = c5 + .2, t6 = c6 + .9;
  if (a2 > 0) {
    drawCubes(cb, droppedCubes(2, t, t5, .22, blue, a2));
    frontTiles(cb, 2, t, c4 + .35, .28, (1 - P(t, t5, .4)) * a2, COL.area);
  }
  if (a3 > 0) {
    drawCubes(cb, droppedCubes(3, t, t6, .075, blue, a3));
    const ta = Wd('c6', 'площадь');
    frontTiles(cb, 3, t, ta - .3, .07, a3 * (1 - P(t, Wd('c6', 'объём') - .1, .4)), COL.area);
  }
  txt(side < 2.5 ? '2 см' : '3 см', bx, by + side * U * .5 + 140, { size: 30, col: COL.dim, a: Math.max(a2, a3) * P(t, c3 + .8, .5) });
  // счётчики
  const aC = P(t, c3 + .6, .6, eout);
  counter('ПЛОЩАДЬ', 1500, 330, COL.area, [[0, '×1'], [c4 + .35 + 3 * .28 + .3, '×4'], [Wd('c6', 'площадь') + .6, '×9']], t, aC);
  counter('ОБЪЁМ', 1500, 600, COL.vol, [[0, '×1'], [t5 + 7 * .22 + .45, '×8'], [t6 + 26 * .075 + .45, '×27']], t, aC);
  void sw;
}

function sceneLaw(t) {
  const s = SC.law; chapter('02', 'Закон', t, s);
  const l1 = C('l1'), l2 = C('l2'), l3 = C('l3');
  const m = P(t, l2 - .2, 1.0);
  const fy = lerp(520, 190, m), fs = lerp(120, 64, m);
  txtIn('S ∝ L²', lerp(700, 760, m), fy, Wd('l1', 'площадь'), t, { size: fs, col: COL.area, w: 600 });
  txtIn('V ∝ L³', lerp(1220, 1160, m), fy, Wd('l1', 'объём'), t, { size: fs, col: COL.vol, w: 600 });
  txtIn('площадь', 700, 620, Wd('l1', 'площадь') + .3, t, { size: 28, col: COL.dim, ls: 3, a: 1 - m });
  txtIn('объём', 1220, 620, Wd('l1', 'объём') + .3, t, { size: 28, col: COL.dim, ls: 3, a: 1 - m });

  // график
  const aG = FIO(t, l2 + .2, l3 - .2, .5);
  if (aG > 0) {
    const x0 = 460, y0 = 900, x1 = 1460, y1 = 320, Lmax = 5, Ymax = 125;
    const X = L => x0 + (x1 - x0) * L / Lmax, Y = v => y0 - (y0 - y1) * v / Ymax;
    line(x0, y0, x1 + 40, y0, COL.dim, aG, 2); line(x0, y0, x0, y1 - 40, COL.dim, aG, 2);
    for (let i = 1; i <= 5; i++) txt(String(i), X(i), y0 + 34, { size: 24, col: COL.dim, a: aG });
    txt('размер L', x1 + 40, y0 + 76, { size: 24, col: COL.dim, a: aG, align: 'right' });
    const p = P(t, l2 + .6, 2.6, eio), Lp = Lmax * p;
    if (Lp > .01) {
      g.save(); g.globalAlpha *= aG;
      g.beginPath();
      for (let i = 0; i <= 120; i++) { const L = Lp * i / 120; g.lineTo(X(L), Y(L ** 3)); }
      for (let i = 120; i >= 0; i--) { const L = Lp * i / 120; g.lineTo(X(L), Y(L ** 2)); }
      g.fillStyle = rgba(COL.vol, .12); g.fill();
      for (const [pw, c] of [[2, COL.area], [3, COL.vol]]) {
        g.beginPath(); for (let i = 0; i <= 120; i++) { const L = Lp * i / 120; g.lineTo(X(L), Y(L ** pw)); }
        g.strokeStyle = rgba(c); g.lineWidth = 5; g.lineCap = 'round'; g.stroke();
        circle(X(Lp), Y(Lp ** pw), 8, c);
      }
      g.restore();
      txt('L²', X(Lp) + 24, Y(Lp ** 2) - 6, { size: 34, col: COL.area, a: aG, align: 'left', w: 600 });
      txt('L³', X(Lp) + 24, Y(Lp ** 3), { size: 34, col: COL.vol, a: aG, align: 'left', w: 600 });
    }
  }
  // столбики ×10
  const aB = FIO(t, l3 - .1, s.end - .6, .5);
  if (aB > 0) {
    txtIn('размер ×10', 960, 320, l3 + .1, t, { size: 34, col: COL.ink, a: aB, ls: 2 });
    const pa = P(t, Wd('l3', 'площадь'), 1.2, eout), pv = P(t, Wd('l3', 'объём'), 1.8, eout);
    const base = 920, full = 500;
    for (const [x, p, val, c, lab] of [[760, pa, 100, COL.area, 'площадь'], [1160, pv, 1000, COL.vol, 'объём и масса']]) {
      const h = full * val / 1000 * p;
      g.fillStyle = rgba(c, aB); g.beginPath(); g.roundRect(x - 80, base - h, 160, Math.max(h, 1), [6, 6, 0, 0]); g.fill();
      txt('×' + Math.round(val * p), x, base - h - 40, { size: 56, col: c, a: aB * clamp(p * 4), w: 600 });
      txt(lab, x, base + 40, { size: 26, col: COL.dim, a: aB * clamp(p * 4), ls: 2 });
    }
  }
}

function sceneStrength(t) {
  const s = SC.strength; chapter('03', 'Прочность', t, s);
  const s1 = C('s1'), s2 = C('s2'), s3 = C('s3'), s4 = C('s4'), s5 = C('s5');
  // A: сечение vs объём
  const aA = FIO(t, s1 + .2, s4 - .2, .5);
  if (aA > 0) {
    const grow = P(t, Wd('s3', 'ноги') - .3, 1.5, eio);
    const r = 80 * P(t, Wd('s1', 'прочность'), .7, eback) * (1 + .5 * grow);
    const cy = 540 - 40 * grow;
    g.save(); g.globalAlpha *= aA;
    circle(560, cy, r, COL.area, .9);
    g.strokeStyle = rgba(COL.bg, .5); g.lineWidth = 2; g.setLineDash([5, 7]);
    g.beginPath(); g.moveTo(560 - r, cy); g.lineTo(560 + r, cy); g.stroke(); g.restore();
    txtIn('сечение кости', 560, 780, Wd('s1', 'площади'), t, { size: 28, col: COL.dim, a: aA, ls: 2 });
    txtIn('прочность ∝ L²', 560, 830, Wd('s1', 'площади') + .3, t, { size: 40, col: COL.area, a: aA, w: 600 });

    const pc = P(t, C('s2') - .1, .7, eback) * (1 + .9 * grow);
    const cc = cam(.62 + .1 * Math.sin(t * .3), .5, 1360, 540 - 30 * grow, 120);
    if (pc > 0) drawCubes(cc, [{ p: [-pc / 2, -pc / 2, -pc / 2], s: pc, col: mix(COL.cube, COL.vol, .7), a: aA }]);
    txtIn('объём тела', 1360, 780, C('s2'), t, { size: 28, col: COL.dim, a: aA, ls: 2 });
    txtIn('вес ∝ L³', 1360, 830, C('s2') + .3, t, { size: 40, col: COL.vol, a: aA, w: 600 });
    // ×100
    const tm = Wd('s3', 'муравья');
    drawAnt(905, 300, .55, { a: aA * P(t, tm - .3, .5) });
    txtIn('×100', 1020, 270, tm, t, { size: 40, col: COL.ink, a: aA, align: 'left', w: 600 });
    const pa = P(t, Wd('s3', 'ноги'), 1.4, eout), pv = P(t, Wd('s3', 'вес'), 1.8, eout);
    const fmt = v => '×' + Math.round(v).toLocaleString('ru-RU').replace(/ /g, ' ');
    if (pa > 0) txt(fmt(10000 * pa), 560, 920, { size: 52, col: COL.area, a: aA * clamp(pa * 5), w: 600 });
    if (pv > 0) txt(fmt(1e6 * pv), 1360, 920, { size: 52, col: COL.vol, a: aA * clamp(pv * 5), w: 600 });
  }
  // B: гигантский муравей ломается
  const aB = FIO(t, s4 - .1, s5 - .2, .5);
  if (aB > 0) {
    line(260, 840, 1660, 840, COL.faint, aB, 2);
    const tc = Wd('s4', 'рухнул');
    const b = clamp(eback(clamp((t - tc) / .45)), 0, 1.05);
    drawAnt(980, 840, 3.6, { a: aB * P(t, s4 - .1, .6, eout), buckle: b, crack: P(t, tc + .1, .2) });
    txtIn('нагрузка на кость ×100', 960, 230, Wd('s4', 'сто'), t, { size: 44, col: COL.red, a: aB, w: 600 });
    if (t > tc) {
      const r = rng(7);
      for (let i = 0; i < 14; i++) {
        const u = clamp((t - tc - .25) / 1.0), ang = Math.PI * (1 + r()), sp = 120 + 200 * r();
        const px = 980 + (r() - .5) * 500 + Math.cos(ang) * sp * u, py = 838 + Math.sin(ang) * sp * u * .4;
        circle(px, py, 3 + 3 * r(), COL.dim, aB * (1 - u) * .8);
      }
    }
  }
  // C: кости Галилея → слон
  const aC = FIO(t, s5 - .1, s.end - .6, .5);
  if (aC > 0) {
    const tg = Wd('s5', 'Галилей'), te = Wd('s5', 'Посмотрите');
    const aBone = aC * (1 - P(t, te - .2, .6));
    txtIn('Галилей, 1638', 960, 250, tg, t, { size: 30, col: COL.dim, a: aBone, ls: 3 });
    drawBone(560, 560, 200, 24, COL.ink, aBone * P(t, tg + .3, .6, eout));
    drawBone(1180, 560, 600, 124, COL.ink, aBone * P(t, Wd('s5', 'кости'), .8, eout));
    txtIn('×1', 560, 720, tg + .5, t, { size: 30, col: COL.dim, a: aBone });
    txtIn('в 3 раза длиннее', 1180, 720, Wd('s5', 'кости') + .3, t, { size: 34, col: COL.dim, a: aBone });
    txtIn('в 5 раз толще', 1180, 775, Wd('s5', 'толще') - .4, t, { size: 40, col: COL.area, a: aBone, w: 600 });
    const aE = aC * P(t, te, .7, eout);
    if (aE > 0) {
      drawElephant(930, 860, 1.6, { a: aE, legCol: COL.area });
      line(500, 860, 1420, 860, COL.faint, aE, 2);
    }
  }
}

function heatArrows(cx, cy, R, t, col, a, n = 10) {
  for (let i = 0; i < n; i++) {
    const ang = i / n * Math.PI * 2 + .2, u = ((t * .7 + i * .37) % 1);
    const r0 = R + 20 + u * 60;
    arrow(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0, cx + Math.cos(ang) * (r0 + 44), cy + Math.sin(ang) * (r0 + 44),
      col, a * Math.sin(u * Math.PI), 4, 14);
  }
}
function sceneHeat(t) {
  const s = SC.heat; chapter('04', 'Тепло', t, s);
  const h1 = C('h1'), h2 = C('h2'), h3 = C('h3'), h4 = C('h4');
  // A
  const aA = FIO(t, h1 - .1, h2 - .2, .5);
  if (aA > 0) {
    const pulse = .5 + .5 * Math.sin(t * 3);
    const tw = Wd('h1', 'вырабатывает'), tl = Wd('h1', 'теряет');
    glow(640, 560, 300, COL.heat, aA * .25 * P(t, tw, .8) * (.7 + .3 * pulse));
    const cc = cam(.62 + .12 * Math.sin(t * .3), .5, 640, 560, 110);
    const warm = mix(mix(COL.cube, COL.heat, .45 * P(t, tw, .8)), COL.heat, .12 * pulse);
    drawCubes(cc, [{ p: [-1, -1, -1], s: 2, col: warm, a: aA }]);
    heatArrows(640, 560, 190, t, COL.area, aA * P(t, tl, .8), 12);
    txtIn('вырабатывает тепло', 1120, 430, tw, t, { size: 28, col: COL.dim, a: aA, align: 'left', ls: 2 });
    txtIn('объём ∝ L³', 1120, 490, tw + .2, t, { size: 56, col: COL.vol, a: aA, align: 'left', w: 600 });
    txtIn('теряет тепло', 1120, 610, tl, t, { size: 28, col: COL.dim, a: aA, align: 'left', ls: 2 });
    txtIn('поверхность ∝ L²', 1120, 670, tl + .2, t, { size: 56, col: COL.area, a: aA, align: 'left', w: 600 });
  }
  // B: S/V
  const aB = FIO(t, h2 - .1, h3 - .2, .5);
  if (aB > 0) {
    txtIn('S / V = 6 / L', 960, 230, h2 + .1, t, { size: 56, col: COL.ink, a: aB, w: 600 });
    const sides = [.5, 1, 2, 4], xs = [330, 600, 960, 1460], U = 70;
    sides.forEach((sd, i) => {
      const ta = h2 + .6 + i * .45, p = P(t, ta, .6, eback);
      const c0 = cam(.62, .5, 0, 0, U);
      const low = Math.max(...corners([-sd / 2, -sd / 2, -sd / 2], sd).map(q => proj(c0, q)[1]));
      const cc = cam(.62, .5, xs[i], 820 - low, U);
      drawCubes(cc, [{ p: [-sd / 2 * p, -sd / 2 * p, -sd / 2 * p], s: sd * p, col: mix(COL.cube, COL.vol, .35), a: aB }]);
      txt((6 / sd).toLocaleString('ru-RU'), xs[i], 330, { size: 64 - i * 6, col: COL.area, a: aB * P(t, ta + .2, .5), w: 600 });
    });
    const th = Wd('h2', 'быстрее');
    glow(330, 780, 120, COL.heat, aB * .35 * P(t, th, .6));
    heatArrows(330, 780, 30, t, COL.area, aB * P(t, th, .6), 8);
    txtIn('быстро остывает', 330, 900, th, t, { size: 26, col: COL.area, a: aB, ls: 1 });
    line(240, 820, 1720, 820, COL.faint, aB, 2);
  }
  // C: землеройка
  const aC = FIO(t, h3 - .1, h4 - .2, .5);
  if (aC > 0) {
    const tz = Wd('h3', 'землеройка');
    drawMouse(600, 700, 2.4, { a: aC * P(t, tz - .3, .6, eout) });
    txtIn('землеройка · 10 г', 600, 780, tz, t, { size: 28, col: COL.dim, a: aC, ls: 2 });
    const pr = P(t, Wd('h3', 'съедает'), 2.0, eio) * .9;
    g.save(); g.globalAlpha *= aC;
    g.strokeStyle = rgba(COL.faint); g.lineWidth = 18;
    g.beginPath(); g.arc(1300, 560, 150, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = rgba(COL.area); g.lineCap = 'round';
    if (pr > 0) { g.beginPath(); g.arc(1300, 560, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); g.stroke(); }
    g.restore();
    txt(Math.round(pr * 100) + '%', 1300, 545, { size: 72, col: COL.area, a: aC * P(t, Wd('h3', 'съедает') - .2, .4), w: 600 });
    txt('веса тела — еда за сутки', 1300, 780, { size: 28, col: COL.dim, a: aC * P(t, Wd('h3', 'съедает'), .5) });
  }
  // D: слон и уши
  const aD = FIO(t, h4 - .1, s.end - .6, .5);
  if (aD > 0) {
    const te = Wd('h4', 'уши');
    const flap = P(t, te - .2, .5) * (.5 + .5 * Math.sin(t * 5));
    drawElephant(820, 840, 1.55, { a: aD, flap });
    line(380, 840, 1400, 840, COL.faint, aD, 2);
    const ex = 820 + 96 * 1.55, ey = 840 - 196 * 1.55;
    for (let i = 0; i < 3; i++) {
      g.save(); g.globalAlpha *= aD * P(t, te, .6);
      g.strokeStyle = rgba(COL.heat, .8); g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath();
      for (let k = 0; k <= 30; k++) {
        const v = k / 30, yy = ey - 110 - v * 150, xx = ex - 40 + i * 40 + Math.sin(v * 9 - t * 5 + i) * 10;
        g.lineTo(xx, yy);
      }
      g.stroke(); g.restore();
    }
    txtIn('уши = радиатор', 1350, 520, te + .2, t, { size: 44, col: COL.area, a: aD, align: 'left', w: 600 });
    txtIn('большая площадь — больше теплоотдача', 1350, 580, te + .5, t, { size: 24, col: COL.dim, a: aD, align: 'left' });
  }
}

const FALLERS = [
  { name: 'мышь', r: 12, x: 420, dur: 1.7, word: 'мышь' },
  { name: 'крыса', r: 22, x: 780, dur: 1.05, word: 'крыса' },
  { name: 'человек', r: 50, x: 1140, dur: .75, word: 'человек' },
  { name: 'лошадь', r: 90, x: 1500, dur: .55, word: 'лошадь' },
];
const GROUND = 860;
function fallLand(f) { return Wd('f2', f.word) + .55; }
function sceneFall(t) {
  const s = SC.fall; chapter('05', 'Падение', t, s);
  const f1 = C('f1'), f2 = C('f2');
  const aS = FIO(t, f1 - .1, s.end - .6, .5);
  line(240, GROUND, 1720, GROUND, COL.faint, aS, 2);
  const tq = f2 + .3;
  txtIn('Дж. Б. С. Холдейн, «О правильном размере», 1926', 1824, 92, tq, t, { size: 22, col: COL.dim, a: aS, align: 'right', ls: 1 });
  txtIn('сопротивление ∝ L²', 760, 170, Wd('f1', 'сопротивление'), t, { size: 38, col: COL.area, a: aS * (1 - P(t, f2, .6)), w: 600 });
  txtIn('вес ∝ L³', 1160, 170, Wd('f1', 'вес'), t, { size: 38, col: COL.vol, a: aS * (1 - P(t, f2, .6)), w: 600 });
  FALLERS.forEach((f, i) => {
    const ta = f1 + .4 + i * .25;
    const land = fallLand(f), st = land - f.dur;
    const u = clamp((t - st) / f.dur);
    const y0 = 330, yL = GROUND - f.r;
    // мелкие быстро выходят на малую предельную скорость: почти линейно; крупные — разгоняются
    const ease = i === 0 ? (x => x) : (x => x * x * (1 - i * .08) + x * i * .08);
    let y = lerp(y0, yL, ease(u)), x = f.x, sx = 1, sy = 1, a = aS * P(t, ta, .5, eout), col = COL.ink;
    const after = t - land;
    if (after > 0) {
      if (i === 0) { y = yL - Math.abs(Math.sin(after * 9)) * 24 * Math.exp(-after * 3); x = f.x + clamp(after - .4, 0, 1.6) * 140; }
      if (i === 1) { sy = lerp(1, .45, P(t, land, .15)); sx = 1 / Math.sqrt(sy); y = GROUND - f.r * sy; col = mix(COL.ink, COL.red, P(t, land, .3)); }
    }
    // стрелки сил: вес (вниз) один масштаб, сопротивление на единицу веса ∝ 1/L
    const aAr = a * P(t, Wd('f1', 'сопротивление'), .5) * (1 - P(t, land - .1, .3));
    if (aAr > 0) {
      arrow(x, y + f.r + 8, x, y + f.r + 8 + 90, COL.vol, aAr, 5, 16);
      arrow(x, y - f.r - 8, x, y - f.r - 8 - 90 * (12 / f.r) * .95, COL.area, aAr, 5, 16);
    }
    if (i === 3 && after > 0) {
      const r = rng(11);
      for (let k = 0; k < 46; k++) {
        const ang = -Math.PI * (.08 + .84 * r()), sp = 300 + 600 * r(), tt = after;
        const px = x + Math.cos(ang) * sp * tt, py = yL + f.r * .6 + Math.sin(ang) * sp * tt + 900 * tt * tt;
        if (py < GROUND + 4) circle(px, py, 4 + 9 * r() * (1 - clamp(tt / 1.2)), COL.ink, aS * (1 - clamp(tt / 1.3)));
      }
      circle(x, GROUND, f.r * 1.4 * (1 - P(t, land, .25)), COL.ink, aS);
    } else if (i === 2 && after > 0) {
      const sp = P(t, land, .35, eout) * 18;
      g.save(); g.globalAlpha *= a;
      for (const sgn of [-1, 1]) {
        g.save(); g.translate(x + sgn * sp, y); g.rotate(sgn * sp * .012);
        g.beginPath(); g.arc(0, 0, f.r, sgn < 0 ? Math.PI / 2 : -Math.PI / 2, sgn < 0 ? Math.PI * 1.5 : Math.PI / 2);
        g.fillStyle = rgba(COL.ink); g.fill(); g.restore();
      }
      g.restore();
      line(x - 6, y - f.r - 6, x + 8, y - 8, COL.red, a * P(t, land, .2), 3);
      line(x + 8, y - 8, x - 4, y + f.r + 6, COL.red, a * P(t, land, .2), 3);
    } else {
      g.save(); g.translate(x, y); g.scale(sx, sy); circle(0, 0, f.r, col, a); g.restore();
    }
    const tn = Wd('f2', f.word);
    txtIn(f.name, f.x, GROUND + 48, tn - .2, t, { size: 28, col: COL.dim, a: aS, ls: 2 });
    if (i === 0) txtIn('✓ убежала', f.x + 40, GROUND + 92, land + .5, t, { size: 24, col: COL.green, a: aS });
  });
}

function sceneOutro(t) {
  const s = SC.outro;
  const o1 = C('o1'), o2 = C('o2'), o3 = C('o3');
  const aA = FIO(t, o1 - .1, o2 - .2, .5);
  txtIn('Размер — это не просто масштаб.', 960, 470, Wd('o1', 'Размер') - .2, t, { size: 64, w: 500, a: aA });
  txtIn('Меняя размер, мы меняем физику.', 960, 570, Wd('o1', 'Меняя') - .2, t, { size: 64, w: 600, col: COL.area, a: aA });
  const aB = FIO(t, o2 - .1, o3 - .2, .5);
  if (aB > 0) {
    const tb = o2 + .1;
    line(200, 760, 1720, 760, COL.faint, aB, 2);
    drawFlea(330, 760, 1.4, { a: aB * P(t, tb, .5) });
    drawAnt(560, 760, .9, { a: aB * P(t, tb + .4, .5) });
    drawMouse(860, 760, 1.6, { a: aB * P(t, tb + .8, .5) });
    drawElephant(1360, 760, 1.25, { a: aB * P(t, tb + 1.2, .5) });
    txtIn('у каждого — свой правильный размер', 960, 880, tb + 1.4, t, { size: 30, col: COL.dim, a: aB, ls: 1 });
  }
  const aC = P(t, o3 - .2, .6, eout) * (1 - P(t, TL.total - 1.6, 1.4));
  if (aC > 0) {
    txtIn('Закон квадрата–куба', 960, 480, o3 - .2, t, { size: 104, w: 600, a: aC });
    line(960 - 160, 568, 960 + 160, 568, COL.faint, aC * P(t, o3 + .2, .6), 2);
    txtIn('S ∝ L²', 820, 640, o3 + .5, t, { size: 52, col: COL.area, a: aC });
    txtIn('V ∝ L³', 1100, 640, o3 + .8, t, { size: 52, col: COL.vol, a: aC });
  }
}

const SCENES = { intro: sceneIntro, cube: sceneCube, law: sceneLaw, strength: sceneStrength, heat: sceneHeat, fall: sceneFall, outro: sceneOutro };

function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  g.drawImage(BG, 0, 0);
  for (const s of TL.scenes) {
    if (t < s.start - .01 || t > s.end + .01) continue;
    const a = s.id === 'intro' ? 1 - P(t, s.end - .5, .5) : FIO(t, s.start, s.end - .5, .5);
    if (a <= 0) continue;
    g.save(); g.globalAlpha = a; SCENES[s.id](t); g.restore();
  }
  // тонкая шкала прогресса
  const fade = P(t, 1.0, 1) * (1 - P(t, TL.total - 1.6, 1.4));
  g.fillStyle = rgba(COL.faint, fade); g.fillRect(0, H - 4, W, 4);
  g.fillStyle = rgba(COL.dim, .7 * fade); g.fillRect(0, H - 4, W * t / TL.total, 4);
}

// ---------- звуковые события (единый источник таймингов с графикой) ----------
function buildSfx() {
  const S = [], add = (t, type, gain = 1, pitch = 1) => S.push({ t: +t.toFixed(3), type, gain, pitch });
  TL.scenes.forEach((s, i) => { if (i) add(s.start + .05, 'whoosh', .8); });
  // интро
  add(Wd('q1', 'размером'), 'swell', .9);
  const t0 = Wd('q2', 'блоха');
  for (let n = 0; t0 + n * 1.3 < C('title') - .3; n++) add(t0 + n * 1.3, 'boing', .5, n % 2 ? 1.1 : 1);
  add(Wd('q2', 'подпрыгнуть'), 'thud', .45); add(Wd('q2', 'подпрыгнуть') + .8, 'thud', .45);
  add(Wd('title', 'законе квадрата') - .3, 'chime', 1);
  add(Wd('title', 'законе квадрата') + 1.0, 'tick', .6); add(Wd('title', 'законе квадрата') + 1.4, 'tick', .6, 1.2);
  // куб
  add(C('c1') + .2, 'pop', 1, .8);
  add(Wd('c2', 'площадь'), 'shimmer', .7); add(Wd('c2', 'объём'), 'bloom', .8);
  add(C('c3') + .3, 'swell', .6);
  for (let i = 0; i < 4; i++) add(C('c4') + .35 + i * .28, 'tick', .7, 1 + i * .12);
  for (let i = 0; i < 8; i++) add(C('c5') + .2 + i * .22 + .38, 'pop', .75, .9 + i * .06);
  add(C('c6') + .2, 'swell', .6);
  for (let i = 0; i < 9; i++) add(Wd('c6', 'площадь') - .3 + i * .07, 'tick', .4, 1 + i * .08);
  for (let i = 0; i < 27; i++) add(C('c6') + .9 + i * .075 + .38, 'pop', .4, .85 + i * .03);
  // закон
  add(Wd('l1', 'площадь'), 'chime', .7, 1); add(Wd('l1', 'объём'), 'chime', .7, 1.335);
  add(C('l2') + .6, 'rise', .7);
  add(Wd('l3', 'площадь'), 'tick', .6); add(Wd('l3', 'объём'), 'rise', .6, 1.3);
  // прочность
  add(Wd('s1', 'прочность'), 'pop', .8, .7); add(C('s2') - .1, 'pop', .8, .55);
  add(Wd('s3', 'ноги'), 'rise', .5); add(Wd('s3', 'вес'), 'rise', .6, 1.4);
  add(Wd('s4', 'рухнул'), 'crack', 1); add(Wd('s4', 'рухнул') + .12, 'thud', 1.1);
  add(Wd('s5', 'Галилей'), 'chime', .6, .9); add(Wd('s5', 'Посмотрите'), 'bloom', .6);
  // тепло
  add(Wd('h1', 'вырабатывает'), 'bloom', .7, .8);
  for (let i = 0; i < 4; i++) add(C('h2') + .6 + i * .45, 'pop', .6, 1.3 - i * .15);
  add(Wd('h3', 'съедает'), 'rise', .6);
  add(Wd('h4', 'уши'), 'whoosh', .5, 1.4);
  // падение
  FALLERS.forEach((f, i) => {
    const land = fallLand(f);
    add(land - f.dur, 'fall', .35, 1.5 - i * .25);
    add(land, ['tick', 'thud', 'crack', 'splash'][i], [.8, .7, 1, 1][i], [1.4, 1.4, 1, 1][i]);
  });
  // финал
  add(Wd('o1', 'Меняя'), 'shimmer', .5);
  add(C('o3') - .2, 'chime', 1, 1); add(C('o3') + .5, 'tick', .5); add(C('o3') + .8, 'tick', .5, 1.2);
  return S.sort((a, b) => a.t - b.t);
}

window.render = render;
window.SFX = buildSfx();
document.fonts.load(`600 40px Inter`).then(() => document.fonts.load(`500 40px Inter`)).then(() => {
  makeBg(); render(0); window.READY = true;
  if (location.hash === '#play') {
    const t0 = performance.now();
    const loop = () => { render((performance.now() - t0) / 1000 % TL.total); requestAnimationFrame(loop); };
    loop();
  } else if (location.hash.startsWith('#t=')) render(parseFloat(location.hash.slice(3)));
});
