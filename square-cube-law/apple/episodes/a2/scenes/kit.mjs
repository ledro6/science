// Общие детали выпуска a2 («За рулём»: тормозной путь). Основа — kit.mjs пилота рубрики a1 (та же машина-силуэт,
// линии обтекания, 2D-помощники, пилюля); ниже добавлены физика торможения, дорога со следами и стоп-сигналы.
// Не сцена: импортируется сценами выпуска.
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

// ================= a2: торможение =================
// Сухой асфальт: μ ≈ 0,7 → замедление a = μg ≈ 6,9 м/с² (берём 6,94, чтобы пути были ровно 20 и 80 м).
// Мировая единица сцены = 1 м (машина ≈ 4,9 м).
export const V60 = 60 / 3.6, V120 = 120 / 3.6, DEC = V120 * V120 / 160;
export const stopDist = v0 => v0 * v0 / (2 * DEC);           // 60 → 20 м; 120 → 80 м
// путь и скорость при торможении с момента τ = 0 (до него — равномерно)
export function bx(v0, tau) {
  if (tau <= 0) return v0 * tau;
  const ts = v0 / DEC; if (tau >= ts) return stopDist(v0);
  return v0 * tau - DEC * tau * tau / 2;
}
export function bv(v0, tau) { return tau <= 0 ? v0 : Math.max(0, v0 - DEC * tau); }
// скорость в точке x тормозного пути: v = v0·√(1 − x/d)
export const vAtX = (v0, x) => v0 * Math.sqrt(clamp(1 - x / stopDist(v0)));

// Стоп-сигналы: у makeCar задние огни — тонкие полосы MeshBasic; brake(k) разгорает их до белого
export function brakeLights(car) {
  const ms = new Set();
  car.traverse(o => { if (o.isMesh && o.material.isMeshBasicMaterial && o.material.color.getHex() !== 0xffffff) ms.add(o.material); });
  const list = [...ms].map(m => ({ m, c: m.color.clone() }));
  const W = new THREE.Color('#FFFFFF');
  car.brake = k => { for (const { m, c } of list) m.color.copy(c).lerp(W, clamp(k)); };
  return car;
}
// мировые точки задних огней (для 2D-свечения)
export const TAIL = [[-2.38, .86, -.5], [-2.38, .86, .5]];

// Дорога: полотно, пунктир между полосами, сплошные кромки (InstancedMesh), линия начала торможения,
// следы торможения (по два на машину). lanes — z полос.
export function makeRoad({ x0 = -160, x1 = 120, lanes = [-2, 2], dark = true } = {}) {
  const g = new THREE.Group();
  const HW = Math.max(...lanes.map(Math.abs)) + 2;
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, HW * 2),
    new THREE.MeshLambertMaterial({ color: dark ? '#1E1E21' : '#E6E6EA' }));
  slab.rotation.x = -Math.PI / 2; slab.position.set((x0 + x1) / 2, .001, 0); slab.receiveShadow = true;
  g.add(slab);
  const pm = new THREE.MeshBasicMaterial({ color: dark ? '#3A3A3E' : '#B8B8BE', toneMapped: false });
  // пунктир 3 м через 6 м между полосами
  const nD = Math.ceil((x1 - x0) / 9);
  const dashes = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, .12), pm, nD);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < nD; i++) { v.set(x0 + 1.5 + i * 9, .004, (lanes[0] + lanes[1]) / 2); m4.compose(v, q, one); dashes.setMatrixAt(i, m4); }
  dashes.frustumCulled = false;
  g.add(dashes);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, .12), pm); e.rotation.x = -Math.PI / 2; e.position.set((x0 + x1) / 2, .004, s * (HW - .35)); g.add(e);
  }
  // линия начала торможения (x = 0), растёт поперёк дороги: road.line(k)
  const lm = new THREE.MeshBasicMaterial({ color: dark ? '#FFFFFF' : '#1D1D1F', toneMapped: false, transparent: true });
  const bl = new THREE.Mesh(new THREE.PlaneGeometry(.32, HW * 2 - .7), lm); bl.rotation.x = -Math.PI / 2; bl.position.set(0, .005, 0); g.add(bl);
  g.line = (k, a = 1) => { bl.visible = k > .002; bl.scale.y = Math.max(1e-3, k); lm.opacity = a; };
  // следы торможения
  const sm = new THREE.MeshBasicMaterial({ color: dark ? '#000000' : '#1D1D1F', transparent: true, opacity: dark ? .9 : .7, depthWrite: false, toneMapped: false });
  const sg = new THREE.PlaneGeometry(1, .24); sg.translate(.5, 0, 0);
  const skids = lanes.map(z => {
    const pair = [-.82, .82].map(dz => { const m = new THREE.Mesh(sg, sm); m.rotation.x = -Math.PI / 2; m.position.set(0, .006, z + dz); m.renderOrder = 1; g.add(m); return m; });
    return (from, to) => pair.forEach(m => { const L = to - from; m.visible = L > .02; m.position.x = from; m.scale.x = Math.max(.02, L); });
  });
  g.skid = (i, from, to) => skids[i](from, to);
  g.skidMat = sm; g.paintMat = pm; g.slab = slab;
  return g;
}
