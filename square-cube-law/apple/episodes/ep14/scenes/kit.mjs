// Общие детали выпуска № 14 (эффект Доплера). Машина скорой — седан-силуэт из a1 (kit.mjs): белая керамика,
// графитовый купол, колёса со спицами; на крыше монохромная балка-мигалка. Звуковые волны — кольца-hairline на полу
// (шейдер, кольца перекрываются машиной), фигурки людей, клавиатура пианино, вагон-платформа с трубачами,
// галактики-спирали из точек, 2D-помощники (осциллограммы, размерные линии, стрелки, свечение, пилюля).
// Не сцена: импортируется сценами выпуска и обложкой (hero.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, MAT, project, clamp, lerp, FONT, line, atext } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// ---------- машина (длина ≈ 4.9, ширина ≈ 1.9, высота ≈ 1.55; смотрит в +X, стоит на y = 0) ----------
export const WR = .36, WX = 1.45;                 // радиус колеса, полубаза
const BODY_BEVEL = .1, CAB_BEVEL = .12;
function bodyShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.22, .3);
  s.lineTo(-WX - .44, .3); s.absarc(-WX, .36, .44, Math.PI, 0, true);
  s.lineTo(WX - .44, .3); s.absarc(WX, .36, .44, Math.PI, 0, true);
  s.lineTo(2.16, .3);
  s.quadraticCurveTo(2.34, .32, 2.32, .55);
  s.quadraticCurveTo(2.3, .78, 1.95, .84);
  s.lineTo(1.0, .96);
  s.lineTo(-1.7, 1.0);
  s.quadraticCurveTo(-2.2, .98, -2.27, .72);
  s.quadraticCurveTo(-2.32, .42, -2.22, .3);
  return s;
}
function cabinShape() {
  const s = new THREE.Shape();
  s.moveTo(1.02, .9);
  s.quadraticCurveTo(.55, 1.24, .02, 1.36);
  s.lineTo(-.95, 1.37);
  s.quadraticCurveTo(-1.5, 1.35, -1.86, .92);
  s.closePath();
  return s;
}
// Верхняя огибающая силуэта (кузов ∪ купол, с фаской) на сетке по X — для линий обтекания
const ENV_X0 = -2.7, ENV_DX = .02, ENV_N = 271;
let ENV = null;
function buildEnv() {
  const env = new Float32Array(ENV_N).fill(0);
  const add = (pts, bev) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
      for (let k = 0; k < ENV_N; k++) {
        const x = ENV_X0 + k * ENV_DX;
        if (x < x0 - bev || x > x1 + bev) continue;
        const f = x1 - x0 < 1e-6 ? 0 : clamp((x - x0) / (x1 - x0));
        const y = (a.x < b.x ? lerp(a.y, b.y, f) : lerp(b.y, a.y, f)) + bev;
        if (y > env[k]) env[k] = y;
      }
    }
  };
  add(bodyShape().getPoints(24), BODY_BEVEL);
  add(cabinShape().getPoints(24), CAB_BEVEL);
  // сглаживание (окно ±0.3), чтобы линии шли плавно
  const sm = new Float32Array(ENV_N);
  for (let k = 0; k < ENV_N; k++) {
    let s = 0, n = 0;
    for (let j = -15; j <= 15; j++) { const q = env[clamp(k + j, 0, ENV_N - 1)]; const w = 1 - Math.abs(j) / 16; s += q * w; n += w; }
    sm[k] = Math.max(s / n, env[k]);
  }
  return ENV = sm;
}
export function carTop(x) {
  const e = ENV || buildEnv();
  const f = (x - ENV_X0) / ENV_DX;
  if (f <= 0 || f >= ENV_N - 1) return 0;
  const i = Math.floor(f), u = f - i;
  return lerp(e[i], e[i + 1], u);
}

export function makeCar({ body = null, glass = null, dark = true } = {}) {
  body = body || MAT.ceramicWhite(); if (!arguments[0] || !arguments[0].body) body.color.set('#DEDEDC');
  glass = glass || MAT.ceramicBlack(); if (!arguments[0] || !arguments[0].glass) glass.color.set(dark ? '#2E2E32' : '#141416');
  const g = new THREE.Group();
  const DEPTH = 1.66;
  const bgeo = new THREE.ExtrudeGeometry(bodyShape(), { depth: DEPTH, bevelEnabled: true, bevelThickness: .12, bevelSize: BODY_BEVEL, bevelSegments: 4, curveSegments: 14 });
  bgeo.translate(0, 0, -DEPTH / 2);
  const bm = new THREE.Mesh(bgeo, body);
  const CD = 1.26;
  const cgeo = new THREE.ExtrudeGeometry(cabinShape(), { depth: CD, bevelEnabled: true, bevelThickness: .14, bevelSize: CAB_BEVEL, bevelSegments: 4, curveSegments: 14 });
  cgeo.translate(0, 0, -CD / 2);
  const cm = new THREE.Mesh(cgeo, glass);
  g.add(bm, cm);
  // фары и задние огни — тонкие светящиеся полосы (монохром)
  const lm = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
  const tm = new THREE.MeshBasicMaterial({ color: dark ? '#8E8E93' : '#3A3A3C', toneMapped: false });
  for (const sz of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(.06, .05, .42), lm); hl.position.set(2.35, .74, sz * .56); hl.rotation.z = .55; g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .5), tm); tl.position.set(-2.36, .86, sz * .5); g.add(tl);
  }
  // колёса: шина-графит, диск, 5 алюминиевых спиц на наружной стороне
  const tyre = new THREE.MeshStandardMaterial({ color: '#1C1C1E', roughness: .6 });
  const rimM = new THREE.MeshStandardMaterial({ color: '#C9CBCF', roughness: .3, metalness: .3 });
  const tgeo = new THREE.CylinderGeometry(WR, WR, .28, 40); tgeo.rotateX(Math.PI / 2);
  const dgeo = new THREE.CylinderGeometry(WR * .66, WR * .66, .292, 32); dgeo.rotateX(Math.PI / 2);
  const sgeo = new THREE.BoxGeometry(.05, WR * 1.2, .02);
  const hgeo = new THREE.CylinderGeometry(.05, .05, .3, 20); hgeo.rotateX(Math.PI / 2);
  const dark2 = new THREE.MeshStandardMaterial({ color: '#2C2C2E', roughness: .35, metalness: .3 });
  const wheels = [];
  for (const wx of [-WX, WX]) for (const sz of [-1, 1]) {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(tgeo, tyre), new THREE.Mesh(dgeo, dark2), new THREE.Mesh(hgeo, rimM));
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Mesh(sgeo, rimM); sp.position.set(0, 0, sz * .15);
      const piv = new THREE.Group(); piv.rotation.z = i * TAU / 5; sp.position.y = WR * .3; piv.add(sp); w.add(piv);
    }
    w.position.set(wx, WR, sz * .82);
    g.add(w); wheels.push(w);
  }
  g.wheels = wheels;
  // spin(угол) — поворот колёс (машина едет в +X → по часовой, если смотреть с +Z)
  g.spin = a => { for (const w of wheels) w.rotation.z = -a; };
  g.traverse(o => { if (o.isMesh && o.material !== lm && o.material !== tm) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// ---------- линии обтекания: точки линии тока над кузовом (в координатах машины) ----------
// «холм» — огибающая кузова, размытая вперёд (поток начинает подниматься заранее) и сильнее назад (след)
const HX0 = -9, HDX = .05, HN = 361;
let HILL = null;
function hill(x) {
  if (!HILL) {
    HILL = new Float32Array(HN);
    for (let i = 0; i < HN; i++) {
      const xi = HX0 + i * HDX; let m = 0;
      for (let k = -270; k <= 270; k += 2) {
        const xc = k / 100, c = carTop(xc); if (c <= 0) continue;
        const d = xi - xc, L = d > 0 ? .95 : 1.9;
        const v = c * Math.exp(-(d / L) * (d / L)); if (v > m) m = v;
      }
      HILL[i] = m;
    }
  }
  const f = (x - HX0) / HDX; if (f <= 0 || f >= HN - 1) return 0;
  const i = Math.floor(f), u = f - i; return lerp(HILL[i], HILL[i + 1], u);
}
// h — высота линии вдали, gap — зазор над крышей; от носа (x1) к корме (x0) — по направлению потока
export function streamPts(h, gap, x0 = -6, x1 = 6, n = 120) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const x = lerp(x1, x0, i / n); pts.push([x, streamY(x, h, gap)]); }
  return pts;
}
export function streamY(x, h, gap) {
  const q = clamp(hill(x) / 1.55);
  return Math.max(h + (1.55 + gap - h) * Math.pow(q, 1.15), carTop(x) + gap * .7);
}

// ---------- камера ----------
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}
export function keys(K, t, ease) {
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) {
    const a = K[i - 1], b = K[i], p = ease((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * p);
  }
  return K[K.length - 1].slice(1);
}

// «проявление из темноты»
export function collectMats(obj) {
  const ms = new Set(); obj.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.material.isMeshBasicMaterial) ms.add(o.material); });
  return [...ms].map(m => { m.userData.base = m.color.clone(); m.userData.cc = m.clearcoat || 0; return m; });
}
export function setLit(mats, k) {
  for (const m of mats) { m.color.copy(m.userData.base).multiplyScalar(k); m.clearcoat = m.userData.cc * k; m.specularIntensity = k; }
}

// ---------- 2D ----------
export function arrow(x1, y1, x2, y2, col, a = 1, lw = 3, head = 14) {
  if (a <= .003) return;
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return;
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, hh = Math.min(head, L * .45);
  line(x1, y1, x2, y2, col, a, lw);
  line(x2, y2, x2 - ux * hh - uy * hh * .62, y2 - uy * hh + ux * hh * .62, col, a, lw);
  line(x2, y2, x2 - ux * hh + uy * hh * .62, y2 - uy * hh - ux * hh * .62, col, a, lw);
}
export function dim(x1, y1, x2, y2, a, col, tick = 12) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
}
// Ломаная, нарисованная на долю p (из ep10)
export function polyline(pts, p, col, a = 1, lw = 3, dash = null, from = 0) {
  const g = ctx(); if (a <= .003 || p <= from || pts.length < 2) return;
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const tot = lens.reduce((A, B) => A + B, 0);
  const s0 = clamp(from) * tot, s1 = clamp(p) * tot;
  const at = s => { let acc = 0; for (let i = 0; i < lens.length; i++) { if (s <= acc + lens[i] || i === lens.length - 1) { const f = clamp((s - acc) / (lens[i] || 1)); return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), i]; } acc += lens[i]; } };
  const [x0, y0, i0] = at(s0), [x1, y1, i1] = at(s1);
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.moveTo(x0, y0);
  for (let i = i0 + 1; i <= i1; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.lineTo(x1, y1); g.stroke(); g.restore();
}
// Бегущая hairline-линия: штрихи едут вдоль ломаной со скоростью spd (px/с); края гаснут
export function flowLine(pts, t, spd, col, a = 1, lw = 2, dash = [90, 70], fadeL = .18) {
  const g = ctx(); if (a <= .003 || pts.length < 2) return;
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const tot = lens.reduce((A, B) => A + B, 0) || 1;
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.setLineDash(dash);
  let acc = 0;
  for (let i = 0; i < lens.length; i++) {
    const u = (acc + lens[i] / 2) / tot, e = smooth(Math.min(u, 1 - u) / fadeL);
    if (e > .01) {
      g.globalAlpha = a * e; g.lineDashOffset = acc - t * spd;
      g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke();
    }
    acc += lens[i];
  }
  g.restore();
}
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = ENG.measure(' ', size, w, track), wd = ws.map(q => ENG.measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs)
export function pill(t, t0, press) {
  const g = ctx(), { P, eApple, eStd } = ENG;
  const p = P(t, t0, .8, eApple);
  if (p <= .003) return;
  const dn = P(t, press, .14, eStd), up = P(t, press + .14, .6, eApple);
  const k = (1 - .055 * dn + .055 * up) * lerp(1.04, 1, p);
  const W2 = 300, H2 = 56, cx = 540, cy = 1205 + (1 - p) * 34;
  const bl = (1 - P(t, t0, .55, eApple)) * 12;
  g.save(); g.globalAlpha = p; if (bl > .3) g.filter = `blur(${bl.toFixed(1)}px)`;
  g.translate(cx, cy); g.scale(k, k);
  const dk = lerp(1, .82, dn * (1 - up));
  g.fillStyle = `rgb(${Math.round(255 * dk)},${Math.round(69 * dk)},${Math.round(58 * dk)})`;
  g.beginPath(); g.roundRect(-W2, -H2, W2 * 2, H2 * 2, H2); g.fill();
  g.font = `600 44px ${FONT}`; g.letterSpacing = '-0.4px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#FFFFFF'; g.fillText('Подписаться на L³', 0, 2);
  g.restore();
  const rp = P(t, press + .05, .9, eApple);
  if (rp > 0 && rp < 1) {
    const gr = 4 + 30 * rp;
    g.save(); g.globalAlpha = .5 * (1 - rp); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(cx - W2 - gr, 1205 - H2 - gr, (W2 + gr) * 2, (H2 + gr) * 2, H2 + gr); g.stroke(); g.restore();
  }
}

export function roundedBoxGeo(w, h, d, r = .04, seg = 3) {
  const n = seg * 2 + 2;
  const geo = new THREE.BoxGeometry(w, h, d, n, n, n);
  const sx = w / 2 - r, sy = h / 2 - r, sz = d / 2 - r;
  const p = geo.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(clamp(v.x, -sx, sx), clamp(v.y, -sy, sy), clamp(v.z, -sz, sz));
    v.sub(c).normalize().multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}
// проекция ломаной из координат машины (x, y в плоскости z) в экран
export const projPts = (cam, pts, z = 0, ox = 0, oz = 0) => pts.map(([x, y]) => project(cam, x + ox, y, z + oz));

// =====================================================================================================
// ep14: Доплер
// =====================================================================================================
const rbox = roundedBoxGeo;

// ---------- скорая: седан из a1 + балка-мигалка на крыше (монохром, без креста и надписей) ----------
export const ROOF = 1.49;
export function makeAmbulance(o = {}) {
  const car = makeCar(o);
  const bar = new THREE.Group();
  const base = new THREE.Mesh(rbox(.86, .1, .62, .035), new THREE.MeshPhysicalMaterial({ color: '#2C2C2E', roughness: .35, clearcoat: .8 }));
  base.position.y = .05; base.castShadow = true;
  const lensM = [0, 1].map(() => new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }));
  const lens = [-1, 1].map((sx, i) => {
    const m = new THREE.Mesh(rbox(.34, .1, .5, .03), lensM[i]);
    m.position.set(sx * .2, .13, 0); return m;
  });
  bar.add(base, ...lens);
  bar.position.set(-.45, ROOF - .02, 0);
  car.add(bar);
  // мигалка: две половины вспыхивают по очереди (k — общая яркость 0..1)
  const lo = new THREE.Color('#3A3A3C'), hi = new THREE.Color('#FFFFFF');
  car.flash = (t, k = 1) => {
    const ph = (t * 2.2) % 1;
    const a = ph < .5 ? 1 : .15, b = ph < .5 ? .15 : 1;
    lensM[0].color.copy(lo).lerp(hi, a * k); lensM[1].color.copy(lo).lerp(hi, b * k);
    return ph < .5 ? 0 : 1;
  };
  car.bar = bar;
  return car;
}

// ---------- фигурка человека (керамика, «пешка»): высота ≈ 1.62 ----------
export function makeFigure(mat, s = 1) {
  mat = mat || MAT.ceramicWhite();
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .85, 8, 28), mat); body.position.y = .625;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.15, 32, 22), mat); head.position.y = 1.42;
  g.add(body, head); g.scale.setScalar(s); g.head = head;
  g.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } });
  return g;
}
// трубач: та же фигурка + алюминиевая труба у губ, раструб вперёд (+X)
export function makeTrumpeter(mat, s = 1) {
  const g = makeFigure(mat, s);
  const al = MAT.aluminium();
  const tr = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .42, 14), al); tube.rotation.z = -Math.PI / 2; tube.position.x = .21;
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(.1, .024, .16, 28, 1, true), al); bell.rotation.z = -Math.PI / 2; bell.position.x = .5;
  const valves = new THREE.Mesh(rbox(.12, .08, .05, .015), al); valves.position.set(.16, .04, 0);
  tr.add(tube, bell, valves);
  tr.position.set(.08, 1.38, 0); tr.rotation.z = .12;
  // рука, держащая трубу
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .3, 6, 14), mat || g.head.material);
  arm.position.set(.2, 1.12, .1); arm.rotation.set(.25, 0, -1.0);
  g.add(tr, arm);
  g.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } });
  return g;
}

// ---------- кольца звуковых волн: шейдер на полу, линии постоянной толщины в пикселях ----------
export const MAXR = 28;
export function makeWaveField(size = 40, { col = '#FFFFFF', lw = 1.6, fade = .45 } = {}) {
  const R = []; for (let i = 0; i < MAXR; i++) R.push(new THREE.Vector4(0, 0, 0, 0));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { R: { value: R }, N: { value: 0 }, col: { value: new THREE.Color(col) }, A: { value: 1 }, lw: { value: lw },
      ctr: { value: new THREE.Vector2(0, 0) }, rad: { value: size * fade } },
    vertexShader: `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec4 R[${MAXR}]; uniform int N; uniform vec3 col; uniform float A; uniform float lw; uniform vec2 ctr; uniform float rad;
      varying vec2 vP;
      void main(){
        float e = 1.0 - smoothstep(rad * .55, rad, length(vP - ctr));
        if (e <= 0.0 || A <= 0.0) discard;
        float a = 0.0;
        vec2 px = dFdx(vP), py = dFdy(vP);
        for (int i = 0; i < ${MAXR}; i++) {
          if (i >= N) break;
          vec4 r = R[i];
          vec2 q = vP - r.xy;
          float L = length(q);
          if (abs(L - r.z) > lw * 4.0 * (abs(px.x) + abs(px.y) + abs(py.x) + abs(py.y)) + .001) continue;
          vec2 n = q / max(L, 1e-5);
          float w = max(abs(dot(n, px)) + abs(dot(n, py)), 1e-5);
          float d = abs(L - r.z) / w;
          a = max(a, r.w * (1.0 - smoothstep(lw * .5 - .5, lw * .5 + .7, d)));
        }
        if (a <= 0.0) discard;
        gl_FragColor = vec4(col, a * A * e);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = .004; m.renderOrder = 2;
  // set(rings: [[x, z, r, a], …], A, центр затухания)
  m.set = (rings, A = 1, cx = 0, cz = 0) => {
    const n = Math.min(MAXR, rings.length);
    for (let i = 0; i < n; i++) R[i].set(rings[i][0], rings[i][1], rings[i][2], rings[i][3]);
    mat.uniforms.N.value = n; mat.uniforms.A.value = A; mat.uniforms.ctr.value.set(cx, cz);
  };
  m.mat = mat;
  return m;
}
// Кольца источника, движущегося по закону xOf(τ): волна, испущенная в τ = k·dt, имеет радиус c·(t − τ).
// Чистая функция времени. maxAge — жизнь кольца (гаснет к концу), t0 — с какого момента источник «звучит».
export function rings(t, xOf, { dt = .3, c = 3.4, maxAge = 2.6, t0 = -1e9, z = 0, a = 1, zOf = null } = {}) {
  const out = [];
  const k1 = Math.floor(t / dt), k0 = Math.ceil((t - maxAge) / dt);
  for (let k = k1; k >= k0 && out.length < MAXR; k--) {
    const τ = k * dt; if (τ < t0) break;
    const age = t - τ; if (age < 0) continue;
    const al = a * clamp(age / .12) * Math.pow(clamp(1 - age / maxAge), 1.3);
    if (al < .01) continue;
    out.push([xOf(τ), zOf ? zOf(τ) : z, c * age, al]);
  }
  return out;
}
// путь при плавном разгоне от 0 до V за d секунд, начиная с a (интеграл скорости, без накопления)
export function rampX(t, a, d, V, x0 = 0) {
  if (t <= a) return x0;
  const u = t - a;
  if (u < d) { const s = u / d; return x0 + V * d * (s * s * s - s * s * s * s / 2); }
  return x0 + V * (d / 2 + (u - d));
}
export const rampV = (t, a, d, V) => { if (t <= a) return 0; const s = clamp((t - a) / d); return V * (3 * s * s - 2 * s * s * s); };

// ---------- осциллограмма: синус с длиной волны lam (px), края гаснут ----------
export function sine(x0, x1, y, amp, lam, phase, col, a = 1, lw = 3, p = 1) {
  const g = ctx(); if (a <= .003 || p <= .003) return;
  const xe = lerp(x0, x1, clamp(p));
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  const N = Math.max(8, Math.ceil((xe - x0) / 3));
  // три участка разной прозрачности — мягкие края
  const seg = 24;
  for (let s = 0; s < seg; s++) {
    const xa = lerp(x0, xe, s / seg), xb = lerp(x0, xe, (s + 1) / seg);
    const u = ((xa + xb) / 2 - x0) / (x1 - x0), e = smooth(Math.min(u, 1 - u) / .12);
    if (e < .01) continue;
    g.globalAlpha = a * e; g.beginPath();
    const n = Math.max(2, Math.ceil(N / seg));
    for (let i = 0; i <= n; i++) {
      const x = lerp(xa, xb, i / n), yy = y - amp * Math.sin(TAU * (x - x0) / lam - phase);
      i ? g.lineTo(x, yy) : g.moveTo(x, yy);
    }
    g.stroke();
  }
  g.restore();
}

// ---------- клавиатура пианино (керамика): 10 белых клавиш C…E, чёрные — между ----------
export const KEY = { W: .26, L: 1.55, H: .18, gap: .014, BW: .15, BL: 1.0, BH: .16 };
const BLACKS = [0, 1, 3, 4, 5, 7, 8];          // чёрная клавиша после белой с этим индексом (C# D# F# G# A# C# D#)
export function makeKeyboard() {
  const g = new THREE.Group();
  const white = MAT.ceramicWhite(), black = MAT.ceramicBlack();
  const wgeo = rbox(KEY.W - KEY.gap, KEY.H, KEY.L, .03), bgeo = rbox(KEY.BW, KEY.BH, KEY.BL, .025);
  const n = 10, X0 = -(n * KEY.W) / 2 + KEY.W / 2;
  const keys = [];      // по полутонам: { mesh, x, black, base }
  const whites = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(wgeo, white.clone()); m.position.set(X0 + i * KEY.W, KEY.H / 2, 0);
    g.add(m); whites.push(m);
  }
  const blacks = {};
  for (const i of BLACKS) {
    const m = new THREE.Mesh(bgeo, black.clone()); m.position.set(X0 + (i + .5) * KEY.W, KEY.H + KEY.BH / 2 - .02, -(KEY.L - KEY.BL) / 2);
    g.add(m); blacks[i] = m;
  }
  // полутоновая последовательность
  for (let i = 0; i < n; i++) {
    keys.push({ mesh: whites[i], black: false });
    if (blacks[i] && i < n - 1) keys.push({ mesh: blacks[i], black: true });
  }
  keys.forEach(k => { k.base = k.mesh.position.clone(); k.col = k.mesh.material.color.clone(); });
  // корпус: графитовая планка позади клавиш и тонкое основание
  const body = MAT.graphite();
  const back = new THREE.Mesh(rbox(n * KEY.W + .3, .42, .36, .05), body); back.position.set(0, .21, -KEY.L / 2 - .2);
  const sideL = new THREE.Mesh(rbox(.14, .3, KEY.L + .1, .04), body); sideL.position.set(-n * KEY.W / 2 - .09, .15, .02);
  const sideR = sideL.clone(); sideR.position.x *= -1;
  g.add(back, sideL, sideR);
  g.keys = keys;
  // press(i, p, lit): клавиша опускается (p) и подсвечивается (lit)
  const HI_W = new THREE.Color('#FFFFFF'), HI_B = new THREE.Color('#8E8E93');
  g.press = (i, p, lit = 0, dim = 1) => {
    const k = keys[i]; k.mesh.position.y = k.base.y - .05 * p;
    k.mesh.rotation.x = .035 * p;
    k.mesh.material.color.copy(k.col).lerp(k.black ? HI_B : HI_W, lit).multiplyScalar(dim);
    k.mesh.material.emissive.setScalar((k.black ? .12 : .3) * lit * dim);
    k.mesh.material.clearcoat = (k.black ? 1 : .35) * dim;
  };
  g.reset = () => keys.forEach((k, i) => g.press(i, 0, 0));
  g.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } });
  return g;
}

// ---------- вагон-платформа на рельсах (длина ≈ 4.4) ----------
export function makeWagon() {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(rbox(4.4, .18, 1.9, .04), MAT.graphite()); deck.position.y = .78;
  const al = MAT.aluminium();
  const frameM = new THREE.MeshPhysicalMaterial({ color: '#1C1C1E', roughness: .4, clearcoat: .5 });
  const beam = new THREE.Mesh(rbox(4.2, .16, 1.2, .03), frameM); beam.position.y = .62;
  g.add(deck, beam);
  // борт-поручни: тонкие алюминиевые стойки и перила по краям
  for (const sz of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, 4.2, 10), al); rail.rotation.z = Math.PI / 2; rail.position.set(0, 1.3, sz * .9); g.add(rail);
    for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .45, 8), al); p.position.set(-2.05 + i * .82, 1.08, sz * .9); g.add(p); }
  }
  const wheels = [];
  const wgeo = new THREE.CylinderGeometry(.3, .3, .12, 32); wgeo.rotateX(Math.PI / 2);
  const wm = new THREE.MeshPhysicalMaterial({ color: '#2C2C2E', roughness: .35, metalness: .3 });
  for (const wx of [-1.5, -.9, .9, 1.5]) for (const sz of [-1, 1]) {
    const w = new THREE.Mesh(wgeo, wm); w.position.set(wx, .3, sz * .72); g.add(w); wheels.push(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .14, 16).rotateX(Math.PI / 2), al); hub.position.copy(w.position); g.add(hub);
  }
  g.spin = a => { for (const w of wheels) w.rotation.z = -a; };
  g.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } });
  return g;
}
// рельсы со шпалами вдоль X (static, InstancedMesh)
export function makeTrack(x0 = -30, x1 = 40) {
  const g = new THREE.Group();
  const al = MAT.aluminium();
  for (const sz of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .08, .07), al); r.position.set((x0 + x1) / 2, .04, sz * .72); r.receiveShadow = true; g.add(r); }
  const n = Math.floor((x1 - x0) / .6);
  const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(.2, .05, 1.9), new THREE.MeshStandardMaterial({ color: '#2C2C2E', roughness: .7 }), n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m.makeTranslation(x0 + i * .6, .02, 0); sl.setMatrixAt(i, m); }
  sl.receiveShadow = true; g.add(sl);
  return g;
}

// ---------- галактика-спираль из точек ----------
let DOT_TX = null;
function dotTex() {
  if (DOT_TX) return DOT_TX;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  q.fillStyle = gr; q.fillRect(0, 0, 64, 64);
  return DOT_TX = new THREE.CanvasTexture(c);
}
export function makeGalaxy(R, rand, { n = 1400, col = '#1D1D1F', col2 = '#A1A1A6', size = .06, arms = 2 } = {}) {
  const pos = new Float32Array(n * 3), cols = new Float32Array(n * 3);
  const c1 = new THREE.Color(col), c2 = new THREE.Color(col2), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    let x, y, z, k;
    const q = rand();
    if (q < .24) {                            // ядро
      const r = R * .2 * Math.pow(rand(), 1.8), a = rand() * TAU;
      x = r * Math.cos(a); z = r * Math.sin(a); y = (rand() - .5) * R * .14 * (1 - r / (R * .2)); k = .05 * rand();
    } else if (q < .44) {                     // диффузный диск
      const r = R * -Math.log(1 - .93 * rand()) * .38, a = rand() * TAU;
      x = r * Math.cos(a); z = r * Math.sin(a); y = (rand() - .5) * R * .05; k = .55 + .45 * rand();
    } else {                                  // рукава (логарифмическая спираль + разброс)
      const arm = Math.floor(rand() * arms), u = Math.pow(rand(), .85);
      const r = R * (.14 + .86 * u), a = arm * TAU / arms + Math.log(r / (R * .14)) * 1.9;
      const sp = R * .16 * (.3 + u);
      x = r * Math.cos(a) + (rand() - .5) * sp; z = r * Math.sin(a) + (rand() - .5) * sp; y = (rand() - .5) * R * .04;
      k = .15 + .5 * u * rand();
    }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    c.copy(c1).lerp(c2, k); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const mat = new THREE.PointsMaterial({ size, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true, alphaTest: .02 });
  const p = new THREE.Points(geo, mat);
  return p;
}
