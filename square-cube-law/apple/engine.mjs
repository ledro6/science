// Движок Apple-версии ролика «Закон квадрата–куба» (1080×1920).
// 3D — Three.js (WebGL), поверх — 2D-типографика на canvas. Каждый кадр — чистая функция времени:
// сцены выставляют все трансформации из t, без накопленного состояния, поэтому кадры можно рендерить параллельно.
import * as THREE from 'three';
export { THREE };

export const W = 1080, H = 1920;
export const TL = window.TL;

// ---------- цвета (строгий монохром Apple + один системный акцент) ----------
export const C_BLACK = '#000000', C_WHITE = '#FFFFFF', C_PAPER = '#F5F5F7', C_INK = '#1D1D1F',
  C_GRAY = '#86868B', C_GRAY2 = '#A1A1A6', C_RED = '#FF453A';

// ---------- время и кривые ----------
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) { const e = X(s) - x; if (Math.abs(e) < 1e-6) break; const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= e / d; }
    return Y(clamp(s));
  };
}
export const eApple = bezier(.28, .11, .32, 1);   // фирменный «долгий хвост» apple.com
export const eEase = bezier(.25, .1, .25, 1);     // CSS ease
export const eStd = bezier(.4, 0, .2, 1);         // энергичный акцент
export const eIn = bezier(.4, 0, 1, 1);           // уход
export const eInOut = bezier(.65, 0, .35, 1);     // exploded view, push
export const eExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
// пружина без перелёта (critical damping), как SwiftUI .smooth
export const eSpring = t => t >= 1 ? 1 : 1 - (1 + 7 * t) * Math.exp(-7 * t);
export const P = (t, a, d = .8, e = eApple) => e(clamp((t - a) / d));
export const FIO = (t, a, b, din = .7, dout = .35) => Math.min(P(t, a, din), 1 - P(t, b, dout, eIn));

const LN = {}; TL.lines.forEach(l => LN[l.key] = l);
export const SC = {}; TL.scenes.forEach(s => SC[s.id] = s);
export const C = k => LN[k].start;
export const E = k => LN[k].start + LN[k].dur;
const clean = s => s.toLowerCase().replace(/[^a-zа-яё0-9-]/gi, '');
function wordsOf(k, word) {
  const ws = LN[k].words.filter(w => clean(w.w).startsWith(clean(word)));
  if (!ws.length) throw new Error(`нет слова «${word}» в ${k}`);
  return ws;
}
export const Wd = (k, word, n = 0) => wordsOf(k, word)[n].t;           // начало слова
export const WdE = (k, word, n = 0) => { const w = wordsOf(k, word)[n]; return w.t + w.d; }; // конец слова
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- 2D: текущий контекст слоя ----------
export let g = null;
export const FONT = '"Inter Display", Inter, sans-serif';

// Фирменное появление Apple: подъём + проявление из размытия + прозрачность (blur заканчивается раньше движения).
// out — момент ухода: прозрачность → 0 и лёгкое размытие без сдвига.
export function atext(s, x, y, t0, t, o = {}) {
  const { size = 96, w = 600, col = C_WHITE, a = 1, align = 'center', base = 'alphabetic', track = -.025,
    dur = .75, blur = 12, dy = 40, out = null, outDur = .35, scale0 = 1.04 } = o;
  const p = P(t, t0, dur, eApple), pb = P(t, t0, dur * .7, eApple);
  const q = out == null ? 0 : P(t, out, outDur, eIn);
  const al = a * p * (1 - q);
  if (al <= .003) return;
  const b = (1 - pb) * blur + q * 8;
  g.save();
  g.globalAlpha *= al;
  if (b > .25) g.filter = `blur(${b.toFixed(2)}px)`;
  g.translate(x, y + (1 - p) * dy);
  const k = lerp(scale0, 1, p); g.scale(k, k);
  g.font = `${w} ${size}px ${FONT}`; g.textAlign = align; g.textBaseline = base;
  g.letterSpacing = (track * size).toFixed(2) + 'px';
  g.fillStyle = col; g.fillText(s, 0, 0);
  g.restore();
}
export function measure(s, size, w = 600, track = -.025) {
  g.save(); g.font = `${w} ${size}px ${FONT}`; g.letterSpacing = (track * size).toFixed(2) + 'px';
  const m = g.measureText(s).width; g.restore(); return m;
}
// Пословный stagger (60–90 мс) — для коротких заголовков.
export function atextWords(s, x, y, t0, t, o = {}) {
  const { size = 96, w = 600, align = 'center', stagger = .075, track = -.025 } = o;
  const words = s.split(' '), sp = measure(' ', size, w, track), ws = words.map(q => measure(q, size, w, track));
  const total = ws.reduce((A, B) => A + B, 0) + sp * (words.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  words.forEach((q, i) => { atext(q, cx, y, t0 + i * stagger, t, { ...o, align: 'left' }); cx += ws[i] + sp; });
}
// Число, которое «приземляется»: масштаб 1.15→1, blur 20→0, счёт easeOutExpo.
export function acount(to, x, y, t0, t, o = {}) {
  const { dur = 1.2, prefix = '', suffix = '', from = 0 } = o;
  const p = P(t, t0, dur, eExpo);
  const v = Math.round(lerp(from, to, p)).toLocaleString('ru-RU').replace(/ /g, ' ');
  atext(prefix + v + suffix, x, y, t0, t, { dur: .9, blur: 20, scale0: 1.15, track: -.045, ...o });
}
export function line(x1, y1, x2, y2, col, a = 1, lw = 2, dash = null) {
  if (a <= .003) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore();
}
export function dot(x, y, r, col, a = 1) {
  if (a <= .003) return;
  g.save(); g.globalAlpha *= a; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
}
// Выноска Apple: точка-якорь на объекте, линия 2 px рисуется от объекта к тексту за ~350 мс.
export function callout(ax, ay, bx, by, t0, t, col = C_WHITE, a = 1) {
  const pd = P(t, t0, .25, eApple), pl = P(t, t0 + .1, .4, eApple);
  dot(ax, ay, 5 * pd, col, a * pd);
  if (pl > 0) line(ax, ay, lerp(ax, bx, pl), lerp(ay, by, pl), col, a * .75, 2);
}

// ---------- раскладка (безопасные зоны TikTok: верх 220, низ 380, справа 140) ----------
export const LAYOUT = { cx: 500, left: 96, top: 250, stageY: 800, capY: 1400, bottom: 1540 };

// ---------- 3D: рендерер, студийный свет, материалы ----------
const glCanvas = document.createElement('canvas');
glCanvas.width = W; glCanvas.height = H;
export const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = true;

// Материалы. Без env-карт (дорого в программном рендере) — форму «лепят» ключ, заполнение и два контровых света.
export const MAT = {
  ceramicWhite: () => new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .42, clearcoat: .35, clearcoatRoughness: .3 }),
  ceramicBlack: () => new THREE.MeshPhysicalMaterial({ color: '#141416', roughness: .3, clearcoat: 1, clearcoatRoughness: .12 }),
  aluminium: () => new THREE.MeshPhysicalMaterial({ color: '#C9CBCF', roughness: .32, metalness: .25, clearcoat: .6, clearcoatRoughness: .2 }),
  graphite: () => new THREE.MeshPhysicalMaterial({ color: '#3A3A3C', roughness: .38, metalness: .2, clearcoat: .5 }),
  // «стекло» без transmission: полупрозрачная оболочка + отдельные рёбра (см. glassEdges)
  glass: (opacity = .14) => new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, transparent: true, opacity, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }),
  red: () => new THREE.MeshPhysicalMaterial({ color: C_RED, roughness: .35, clearcoat: .5 }),
};
// Тонкие рёбра меша (для стеклянных и «чертёжных» объектов).
export function glassEdges(geom, color = '#FFFFFF', opacity = .85) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geom, 20), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}
// Куб со скруглёнными рёбрами (фаска ~4 % — «продуктовый» вид).
export function roundedBox(size = 1, r = .045, seg = 3) {
  const s = size / 2 - r, geo = new THREE.BoxGeometry(size, size, size, seg * 2 + 2, seg * 2 + 2, seg * 2 + 2);
  const p = geo.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(clamp(v.x, -s, s), clamp(v.y, -s, s), clamp(v.z, -s, s));
    v.sub(c).normalize().multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

// Сцена-«студия»: камера (длиннофокусная), свет, пол с мягкой тенью.
export function makeStage({ bg = 'black', fov = 26, floorY = 0, shadow = .35 } = {}) {
  const scene = new THREE.Scene();
  const bgc = bg === 'white' ? C_PAPER : C_BLACK;
  scene.background = new THREE.Color(bgc);
  const camera = new THREE.PerspectiveCamera(fov, W / H, .05, 200);
  const hemi = new THREE.HemisphereLight('#ffffff', bg === 'white' ? '#cfcfd2' : '#0b0b0c', bg === 'white' ? 1.15 : .55);
  const key = new THREE.DirectionalLight('#ffffff', bg === 'white' ? 2.2 : 2.6);
  key.position.set(3, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5; key.shadow.bias = -.0004;
  const sc = key.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = .5; sc.far = 30;
  const rimL = new THREE.DirectionalLight('#ffffff', bg === 'white' ? 1.2 : 3.2); rimL.position.set(-6, 3, -5);
  const rimR = new THREE.DirectionalLight('#ffffff', bg === 'white' ? .9 : 2.4); rimR.position.set(6, 2, -4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: bg === 'white' ? shadow * .45 : shadow }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = floorY; floor.receiveShadow = true;
  const root = new THREE.Group();
  scene.add(hemi, key, key.target, rimL, rimR, floor, root);
  return { scene, camera, root, floor, lights: { hemi, key, rimL, rimR }, bg, bgc, ink: bg === 'white' ? C_INK : C_WHITE, sub: bg === 'white' ? '#6E6E73' : C_GRAY };
}
// Камера на орбите вокруг цели (углы в градусах).
export function orbit(camera, target, dist, azDeg, elDeg) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  camera.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  camera.lookAt(target[0], target[1], target[2]);
  camera.updateMatrixWorld();
}
// Проекция 3D-точки в координаты кадра (для выносок и текста, «прилипающего» к объекту).
const _v = new THREE.Vector3();
export function project(camera, x, y, z) {
  _v.set(x, y, z).project(camera);
  return [(_v.x * .5 + .5) * W, (-_v.y * .5 + .5) * H];
}
export function shadowsOn(obj) { obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return obj; }

// ---------- регистрация сцен ----------
// defineScene(id, { bg, setup() → state, update(t, s, state), draw2d(t, s, state), sfx(add, s) })
const DEFS = {};
export function defineScene(id, def) { DEFS[id] = def; }

// ---------- субтитры: каждое слово появляется ровно как заголовок (подъём + blur-in) в момент произнесения ----------
const CAPS = [];
function buildCaps() {
  for (const l of TL.lines) {
    let grp = [], pos = 0;
    const text = l.text;
    l.words.forEach((w, i) => {
      const at = text.indexOf(w.w, pos); pos = at >= 0 ? at + w.w.length : pos;
      const after = text.slice(pos, pos + 2);
      grp.push({ ...w, w: w.w + (/^[,.!?:…]/.test(after) ? after[0] : '') });
      const chars = grp.reduce((A, q) => A + q.w.length + 1, 0);
      const brk = /[,.!?:—]/.test(after) || /^ —/.test(text.slice(pos, pos + 3));
      if (brk || chars > 16 || grp.length >= 3 || i === l.words.length - 1) { CAPS.push({ words: grp }); grp = []; }
    });
  }
  CAPS.forEach((c, i) => {
    c.t0 = c.words[0].t;
    const last = c.words[c.words.length - 1], next = CAPS[i + 1];
    c.t1 = Math.min(last.t + last.d + .45, next ? next.words[0].t - .02 : 1e9);
  });
}
function drawCaptions(t, ink) {
  for (const c of CAPS) {
    if (t < c.t0 - .1 || t > c.t1 + .36) continue;
    const size = 66, w = 600, track = -.02;
    const sp = measure(' ', size, w, track), ws = c.words.map(q => measure(q.w, size, w, track));
    const total = ws.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
    let x = LAYOUT.cx - total / 2;
    c.words.forEach((q, i) => {
      atext(q.w, x, LAYOUT.capY, q.t - .06, t, { size, w, col: ink, align: 'left', track, dur: .6, dy: 26, blur: 12, out: c.t1, outDur: .3 });
      x += ws[i] + sp;
    });
  }
}

// ---------- кадр ----------
const out = document.getElementById('c');
out.width = W; out.height = H;
const octx = out.getContext('2d');
const layer = document.createElement('canvas'); layer.width = W; layer.height = H;
const lctx = layer.getContext('2d');
const STATE = {};

function sceneAlpha(t, s, i) {
  // вход: проявление из размытия с лёгким масштабом; уход: прозрачность + размытие без сдвига (как у Apple)
  const pin = i === 0 ? 1 : P(t, s.start, .7, eApple);
  const last = i === TL.scenes.length - 1;
  const pout = last ? P(t, TL.total - 1.3, 1.2, eEase) : P(t, s.end - .35, .35, eIn);
  return { a: pin * (1 - pout), blur: (1 - P(t, s.start, .5, eApple)) * (i === 0 ? 0 : 14) + pout * 10, k: lerp(1.035, 1, pin) };
}

export function render(t) {
  octx.setTransform(1, 0, 0, 1, 0, 0); octx.filter = 'none'; octx.globalAlpha = 1;
  // фон кадра = фон активной сцены (переходы между чёрным и белым идут «под прикрытием» затухания)
  let capInk = C_WHITE, bestA = -1;
  octx.fillStyle = C_BLACK; octx.fillRect(0, 0, W, H);
  TL.scenes.forEach((s, i) => {
    const def = DEFS[s.id];
    if (!def || t < s.start - .01 || t > s.end + .01) return;
    const { a, blur, k } = sceneAlpha(t, s, i);
    if (a <= .003) return;
    const st = STATE[s.id];
    def.update && def.update(t, s, st);
    renderer.render(st.stage.scene, st.stage.camera);
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalAlpha = 1; lctx.filter = 'none';
    lctx.drawImage(glCanvas, 0, 0);
    g = lctx; def.draw2d && def.draw2d(t, s, st); g = null;
    octx.save(); octx.globalAlpha = a;
    if (blur > .3) octx.filter = `blur(${blur.toFixed(1)}px)`;
    octx.translate(W / 2, H / 2); octx.scale(k, k); octx.translate(-W / 2, -H / 2);
    octx.drawImage(layer, 0, 0); octx.restore();
    if (a > bestA) { bestA = a; capInk = st.stage.ink; }
  });
  g = octx; drawCaptions(t, capInk); g = null;
}

export function buildSfx() {
  const S = [], add = (t, type, gain = 1, pitch = 1) => S.push({ t: +t.toFixed(3), type, gain, pitch });
  TL.scenes.forEach((s, i) => { if (i) add(s.start, 'whoosh', .5); });
  for (const s of TL.scenes) if (DEFS[s.id] && DEFS[s.id].sfx) {
    try { DEFS[s.id].sfx(add, s); } catch (e) { console.error('sfx ' + s.id + ': ' + e.message); }
  }
  return S.sort((a, b) => a.t - b.t);
}

export async function boot() {
  await Promise.all(['600 40px "Inter Display"', '700 40px "Inter Display"', '500 40px "Inter Display"', '400 40px "Inter Display"']
    .map(f => document.fonts.load(f)));
  buildCaps();
  for (const s of TL.scenes) if (DEFS[s.id]) STATE[s.id] = DEFS[s.id].setup(s);
  window.render = render;
  window.SFX = buildSfx();
  render(0);
  window.READY = true;
  if (location.hash.startsWith('#t=')) render(parseFloat(location.hash.slice(3)));
}
