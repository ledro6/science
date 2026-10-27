// Общие детали выпуска ep4 (третий закон Кеплера): Солнце, планеты, кольца орбит (2D-линии по проекции),
// мягкое свечение. Не сцена — вспомогательный модуль, импортируется сценами hook / calc / speed / outro.
import * as ENG from '../../../engine.mjs';
import { THREE, project, clamp, rng, H } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };

// точка на орбите радиуса r (плоскость XZ, против часовой при взгляде сверху)
export const onRing = (r, a, y = 0) => [r * Math.cos(a), y, -r * Math.sin(a)];

// Полосатая «газовая» текстура в монохроме (Нептун): мягкие широтные полосы, чистая функция seed
let NEPT_TEX = null;
export function neptuneTexture() {
  if (NEPT_TEX) return NEPT_TEX;
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d'), R = rng(46);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#7d8187'); grd.addColorStop(.5, '#a4a8ae'); grd.addColorStop(1, '#7a7e84');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 22; i++) {
    const y = R() * 256, h = 3 + R() * 16, v = Math.round(120 + R() * 70);
    g.globalAlpha = .12 + R() * .18; g.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    g.fillRect(0, y, 512, h);
  }
  // тёмное пятно — как Большое тёмное пятно, но тонально
  g.globalAlpha = .25; g.fillStyle = '#55595f'; g.beginPath(); g.ellipse(300, 150, 34, 14, 0, 0, TAU); g.fill();
  g.globalAlpha = 1;
  NEPT_TEX = new THREE.CanvasTexture(c); NEPT_TEX.colorSpace = THREE.SRGBColorSpace;
  return NEPT_TEX;
}
export function makeNeptune(r = .16) {
  const m = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: neptuneTexture(), roughness: .5, metalness: .1, clearcoat: .2, clearcoatRoughness: .4 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), m);
  mesh.rotation.z = .5;   // наклон оси
  return mesh;
}
export function makeBall(r, mat) { return new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat); }
// Солнце: самосветящаяся белая сфера (без тонмаппинга — чистый белый) + точечный свет без затухания
export function makeSun(r = .22, light = 3) {
  const grp = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }));
  const pl = new THREE.PointLight('#ffffff', light, 0, 0);
  grp.add(sphere, pl);
  return { grp, sphere, pl };
}

// экранный радиус шара радиуса r в точке p
export function screenR(cam, p, r) {
  const d = cam.position.distanceTo(new THREE.Vector3(...p));
  return r * H / (2 * d * Math.tan(cam.fov * Math.PI / 360));
}
// Кольцо орбиты 2D-линией по проекции; occ — шары [{p,r}], перекрывающие заднюю часть кольца.
export function ring(cam, r, { col = '#FFFFFF', a = 1, lw = 2, from = 0, to = TAU, occ = [], N = 220, y = 0, dash = null } = {}) {
  const g = ctx(); if (a <= .003 || to <= from) return;
  const oc = occ.map(o => { const [x, yy] = project(cam, ...o.p); return { x, y: yy, R: screenR(cam, o.p, o.r) + lw, d: cam.position.distanceTo(new THREE.Vector3(...o.p)) }; });
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath();
  const n = Math.max(2, Math.ceil(N * (to - from) / TAU));
  let pen = false; const v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const ang = from + (to - from) * i / n, p = onRing(r, ang, y);
    const [x, yy] = project(cam, ...p);
    v.set(...p); const d = cam.position.distanceTo(v);
    const hid = oc.some(o => d > o.d && Math.hypot(x - o.x, yy - o.y) < o.R);
    if (hid) { pen = false; continue; }
    pen ? g.lineTo(x, yy) : g.moveTo(x, yy); pen = true;
  }
  g.stroke(); g.restore();
}
// Хвост за планетой: дуга с затуханием к началу (len — длина в радианах)
export function trail(cam, r, ang, len, { col = '#FFFFFF', a = 1, lw = 3, seg = 24, occ = [] } = {}) {
  for (let i = 0; i < seg; i++) {
    const a0 = ang - len * (i + 1) / seg, a1 = ang - len * i / seg;
    ring(cam, r, { col, a: a * Math.pow(1 - i / seg, 1.6), lw, from: a0, to: a1 + .002, occ, N: 400 });
  }
}
// Мягкое свечение (аддитивно, для чёрного фона)
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// Камера: [t, ...значения] → интерполяция eInOut между ключами
export function keys(K, t, ease) {
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) {
    const a = K[i - 1], b = K[i], p = ease((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * p);
  }
  return K[K.length - 1].slice(1);
}
