// Детали сцен ep9, завязанные на движок: керамическая Земля с полем ветра (штрихи — InstancedMesh),
// красная пилюля «Подписаться на L³» (поведение как в пилоте), мелкие 2D-помощники.
// Не сцена — вспомогательный модуль (pill скопирован из ep5/kit.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, lerp, H } from '../../../engine.mjs';
import {
  rand, ll, fibSphere, capPoints, dot3, cross3, norm3, add3, scl3, len3, smooth, TAU,
} from './_hair.mjs';

export const ctx = () => ENG.g;
export { bump } from './_hair.mjs';

// ---------- Земля ----------
export const EYE = ll(31, -42);          // центр циклона (Северная Атлантика)
const VORT = [                            // [центр, знак (+ против часовой снаружи), сила, радиус, приток]
  [EYE, 1, 2.6, .3, .38],
  [ll(34, -150), -1, 1.3, .38, -.15],     // Тихоокеанский антициклон
  [ll(58, 18), 1, 1.5, .3, .3],
  [ll(54, 168), 1, 1.4, .32, .3],
  [ll(-48, 62), -1, 1.7, .32, .3],        // в Южном полушарии циклоны крутятся по часовой
  [ll(-46, -118), -1, 1.5, .32, .3],
  [ll(-30, -8), 1, 1.0, .4, -.15],
  [ll(25, 75), -1, .9, .35, -.1],
];
function vortex(p, c, sgn, A, sig, inflow) {
  const cp = dot3(c, p), d = Math.acos(Math.max(-1, Math.min(1, cp)));
  const k = A * Math.exp(-(d / sig) * (d / sig));
  const tang = cross3(c, p), inw = add3(scl3(p, cp), c, -1);   // |·| = sin d
  return add3(scl3(tang, sgn * k), inw, k * inflow);
}
// Ветер у поверхности в точке p (координаты Земли, ось Y — полюс). Ноль ровно в EYE.
export function windAt(p) {
  const lat = Math.asin(Math.max(-1, Math.min(1, p[1])));
  const u = -Math.cos(3 * lat) * .75;                          // пассаты / западные ветры
  let v = scl3([p[2], 0, -p[0]], u);                           // восток × |cos lat|
  for (let i = 1; i < VORT.length; i++) v = add3(v, vortex(p, ...VORT[i]));
  const dE = Math.acos(Math.max(-1, Math.min(1, dot3(p, EYE))));
  const sE = 1 - Math.exp(-(dE / .32) * (dE / .32));          // у глаза общий поток гаснет квадратично
  v = scl3(v, sE);
  return add3(v, vortex(p, ...VORT[0]));
}

// Упрощённые материки (долгота, широта) — силуэты для текстуры
const LAND = [
  [[-168, 66], [-160, 71], [-140, 70], [-125, 72], [-95, 74], [-80, 72], [-65, 62], [-55, 52], [-66, 45], [-75, 38], [-81, 31], [-80, 25], [-90, 30], [-97, 26], [-97, 19], [-87, 21], [-83, 10], [-78, 8], [-92, 15], [-105, 20], [-112, 29], [-117, 33], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]],
  [[-55, 60], [-44, 60], [-20, 70], [-18, 80], [-40, 83], [-62, 81], [-72, 77], [-56, 70]],
  [[-78, 8], [-60, 10], [-50, 0], [-35, -5], [-38, -15], [-48, -26], [-58, -38], [-65, -42], [-68, -55], [-75, -50], [-72, -30], [-70, -18], [-81, -5], [-80, 2]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [5, 52], [8, 57], [5, 62], [15, 69], [28, 71], [40, 67], [60, 70], [80, 73], [100, 77], [120, 73], [140, 72], [160, 70], [180, 68], [180, 65], [170, 60], [160, 58], [156, 51], [142, 46], [135, 35], [127, 35], [122, 30], [120, 22], [108, 20], [106, 10], [100, 13], [100, 3], [104, 1], [98, 8], [92, 22], [80, 15], [77, 8], [72, 20], [66, 25], [57, 25], [52, 30], [48, 30], [55, 22], [52, 15], [44, 12], [35, 28], [32, 31], [26, 40], [23, 36], [20, 40], [13, 45], [16, 38], [12, 44], [8, 44], [3, 42], [-5, 36]],
  [[-17, 21], [-17, 14], [-12, 7], [-7, 4], [5, 5], [9, 4], [10, -2], [12, -17], [15, -27], [20, -35], [26, -34], [33, -26], [40, -15], [40, -5], [51, 12], [43, 12], [37, 22], [32, 31], [20, 32], [10, 37], [-6, 36], [-10, 30]],
  [[113, -22], [115, -34], [130, -32], [140, -38], [150, -37], [153, -27], [145, -15], [142, -11], [136, -12], [130, -12], [122, -17]],
  [[44, -25], [47, -15], [50, -15], [48, -25]],
  [[130, 31], [135, 34], [141, 37], [142, 43], [140, 41], [135, 35]],
  [[-5, 50], [1, 51], [-2, 55], [-3, 58], [-6, 57]],
  [[95, 5], [105, -6], [115, -8], [118, 2], [110, 2], [100, 5]],
  [[131, -2], [140, -3], [150, -10], [141, -9]],
];
function earthTexture() {
  const W = 1024, Hh = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const g = cv.getContext('2d');
  g.fillStyle = '#2A2A2D'; g.fillRect(0, 0, W, Hh);
  g.fillStyle = '#6A6A70';
  const X = lon => ((lon / 360 + .25) % 1 + 1) % 1 * W, Y = lat => (90 - lat) / 180 * Hh;
  for (const poly of LAND) for (const off of [-W, 0, W]) {
    g.beginPath();
    let px = null;
    poly.forEach(([lo, la], i) => {
      let x = X(lo);
      if (px != null) { while (x - px > W / 2) x -= W; while (px - x > W / 2) x += W; }
      px = x; i ? g.lineTo(x + off, Y(la)) : g.moveTo(x + off, Y(la));
    });
    g.closePath(); g.fill();
  }
  g.fillRect(0, Y(-70), W, Hh);                                  // Антарктида
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

// Меридианы/параллели (тонкая «математическая» сетка)
export function graticule(R, op = .3) {
  const pts = [], N = 96;
  for (let m = 0; m < 12; m++) {
    const lon = m * 30;
    for (let i = 0; i < N; i++) { const a = ll(-90 + 180 * i / N, lon), b = ll(-90 + 180 * (i + 1) / N, lon); pts.push(...scl3(a, R), ...scl3(b, R)); }
  }
  for (const lat of [-60, -30, 0, 30, 60]) for (let i = 0; i < N; i++) { const a = ll(lat, 360 * i / N), b = ll(lat, 360 * (i + 1) / N); pts.push(...scl3(a, R), ...scl3(b, R)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: op, depthWrite: false }));
}

// Земля: tilt (наклон оси) → spin (суточное вращение) → шар + штрихи ветра.
// nG штрихов по всей сфере и nC — в «шапке» вокруг глаза циклона (видны на наезде).
export function makeEarth({ R = 1, nG = 2600, nC = 1300, cap = .5, seed = 9 } = {}) {
  const tilt = new THREE.Group(), spin = new THREE.Group(); tilt.add(spin);
  const tex = earthTexture();
  const mat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: tex, roughness: .42, clearcoat: .5, clearcoatRoughness: .32 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 36), mat);
  // «математический» шар без материков поверх (проявляется прозрачностью)
  const plainMat = new THREE.MeshPhysicalMaterial({ color: '#2A2A2D', roughness: .42, clearcoat: .5, clearcoatRoughness: .32, transparent: true, opacity: 0 });
  const plain = new THREE.Mesh(new THREE.SphereGeometry(R * 1.002, 48, 36), plainMat);
  const grid = graticule(R * 1.004, 0); grid.material.opacity = 0;
  spin.add(sphere, plain, grid);
  // штрихи: конус, толстый конец — «голова» (летит вперёд)
  const geo = new THREE.CylinderGeometry(1, .18, 1, 5, 1, true); geo.translate(0, .5, 0);
  const smat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const N = nG + nC, strokes = new THREE.InstancedMesh(geo, smat, N);
  strokes.frustumCulled = false;
  strokes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  spin.add(strokes);
  const Rn = rand(seed);
  const S = [...fibSphere(nG, seed), ...capPoints(nC, EYE, cap, seed + 1)].map((p, i) => {
    const v = windAt(p), L = len3(v);
    const vh = L > 1e-6 ? norm3(v) : norm3(cross3(EYE, [0, 1, 0]));
    return { p, vh, L, cap: i >= nG, ph: Rn(), rate: .55 + .5 * Rn(), b: .55 + .45 * Rn() };
  });
  return { tilt, spin, sphere, mat, plain, plainMat, grid, strokes, S, R };
}

const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _P = new THREE.Vector3(), _S = new THREE.Vector3(), _D = new THREE.Vector3(), _UP = new THREE.Vector3(0, 1, 0), _C = new THREE.Color();
// Выставить штрихи на момент t.
// g — яркость глобальных штрихов, c — штрихов шапки, w — толщина (≈ 1 на общем плане), spike 0..1 — штрихи встают
// иглами по нормали («ёж»), arrow 0..1 — замереть ровными стрелками «поле направлений», calm — сила «тишины» у глаза.
export function setStrokes(E, t, { g = 1, c = 0, w = 1, spike = 0, arrow = 0, lenK = 1 } = {}) {
  const { strokes, S, R } = E;
  S.forEach((s, i) => {
    const K = s.cap ? c : g;
    if (K <= .002) { _S.set(1e-4, 1e-4, 1e-4); _M.compose(_P.set(0, 0, 0), _Q.identity(), _S); strokes.setMatrixAt(i, _M); strokes.setColorAt(i, _C.setRGB(0, 0, 0)); return; }
    const u0 = ((t * s.rate * .5 + s.ph) % 1 + 1) % 1, u = lerp(u0, .5, arrow);
    const sp = Math.min(s.L, 1.2);
    const travel = (s.cap ? .06 : .1) * sp * u;
    let p = norm3(add3(s.p, s.vh, travel));
    let len = clamp(s.L * (s.cap ? .085 : .085), s.cap ? .004 : .01, s.cap ? .045 : .085);
    len = lerp(len, .05, arrow * (s.cap ? 0 : 1)) * lenK;
    let dir = s.vh;
    if (spike > 0) { dir = norm3(add3(scl3(s.vh, 1 - spike), p, spike * 1.4)); len = lerp(len, .1 + .04 * s.b, spike); p = norm3([lerp(p[0], s.p[0], spike), lerp(p[1], s.p[1], spike), lerp(p[2], s.p[2], spike)]); }
    const life = lerp(Math.sin(Math.PI * u0), 1, Math.max(arrow, spike));
    const bright = K * s.b * life * (s.cap ? clamp(s.L * 6) : clamp(.35 + s.L * 1.5));
    _D.set(dir[0], dir[1], dir[2]); _Q.setFromUnitVectors(_UP, _D);
    const r = R * 1.008;
    _P.set(p[0] * r, p[1] * r, p[2] * r);
    const th = .0042 * w * (s.cap ? .55 : 1);
    _S.set(th, len * R, th);
    _M.compose(_P, _Q, _S); strokes.setMatrixAt(i, _M);
    strokes.setColorAt(i, _C.setRGB(bright, bright, bright));
  });
  strokes.instanceMatrix.needsUpdate = true; strokes.instanceColor.needsUpdate = true;
}

// мировые координаты точки Земли (локальная p, радиус r)
const _V = new THREE.Vector3();
export function earthWorld(E, p, r = 1) {
  E.spin.updateMatrixWorld(true);
  return E.spin.localToWorld(_V.set(p[0] * r, p[1] * r, p[2] * r)).toArray();
}

// экранный радиус шара радиуса r в точке p
export function screenR(cam, p, r) {
  const d = cam.position.distanceTo(new THREE.Vector3(...p));
  return r * H / (2 * d * Math.tan(cam.fov * Math.PI / 360));
}
// видна ли точка поверхности (нормаль к камере)
export function facing(cam, p, n) {
  const c = cam.position;
  return (c.x - p[0]) * n[0] + (c.y - p[1]) * n[1] + (c.z - p[2]) * n[2];
}

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs)
export function pill(t, t0, press) {
  const g = ctx(), { P, eApple, eStd, FONT } = ENG;
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
// кольцо (2D)
export function ring(x, y, r, col, a = 1, lw = 2) {
  if (a <= .003 || r <= 0) return;
  const g = ctx(); g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.restore();
}
// мягкая тёмная подложка под текстом (на чёрном — чтобы штрихи не спорили с цифрой)
export function scrim(y0, y1, a = .6) {
  if (a <= .003) return;
  const g = ctx(); g.save(); g.globalAlpha = a;
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.35, 'rgba(0,0,0,1)'); gr.addColorStop(.65, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, y0, 1080, y1 - y0); g.restore();
}
export { smooth };
