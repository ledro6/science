// Общие детали выпуска ep10 (принцип Ферма): пляж из двух плит (песок / вода-стекло с рёбрами-волнами),
// спасатель-капсула, решение задачи Ферма (точка преломления), 2D-помощники (ломаные, свечение, дуги углов), пилюля.
// Не сцена: импортируется сценами выпуска. Часть помощников скопирована из ep5/ep7 (kit.mjs) и адаптирована.
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, lerp, FONT, MAT } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];

// ---------- задача Ферма ----------
// Граница — прямая z = 0 (или y = 0 для сцены «свет»). A — в первой среде (скорость v1), B — во второй (v2).
// Возвращает координату точки пересечения границы, при которой время пути минимально (золотое сечение).
export function fermatX(A, B, v1, v2) {
  const T = x => Math.hypot(x - A[0], A[1]) / v1 + Math.hypot(B[0] - x, B[1]) / v2;
  let a = Math.min(A[0], B[0]) - 3, b = Math.max(A[0], B[0]) + 3;
  const r = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 80; i++) {
    const c = b - r * (b - a), d = a + r * (b - a);
    if (T(c) < T(d)) b = d; else a = c;
  }
  return (a + b) / 2;
}
// Пляж: спасатель A на песке, тонущий B в воде; 1 единица = 10 м, бег 6,5 м/с, плавание 2 м/с.
export const BEACH = { A: [-1.45, -1.85], B: [1.35, 1.45], v1: .65, v2: .2 };
export const pathTime =(A, B, x, v1, v2) => Math.hypot(x - A[0], A[1]) / v1 + Math.hypot(B[0] - x, B[1]) / v2;

// Ломаная из двух отрезков в плоскости (u, w): точка на ней по ВРЕМЕНИ движения τ (скорость v1, затем v2).
// Возвращает [u, w, сегмент 0|1, доля пути 0..1, угол направления].
export function onPath(A, B, x, v1, v2, tau) {
  const d1 = Math.hypot(x - A[0], A[1]), d2 = Math.hypot(B[0] - x, B[1]);
  const t1 = d1 / v1, t2 = d2 / v2;
  const tt = clamp(tau, 0, t1 + t2);
  if (tt <= t1) {
    const k = tt / t1;
    return [lerp(A[0], x, k), lerp(A[1], 0, k), 0, (k * d1) / (d1 + d2), Math.atan2(-A[1], x - A[0])];
  }
  const k = (tt - t1) / t2;
  return [lerp(x, B[0], k), lerp(0, B[1], k), 1, (d1 + k * d2) / (d1 + d2), Math.atan2(B[1], B[0] - x)];
}

// ---------- геометрия ----------
// Коробка со скруглёнными рёбрами произвольных пропорций (из ep7/kit.mjs).
export function rbox(w, h, d, r = .04, seg = 3) {
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

// Пляж: плита «песок» (z < 0) и плита «вода» (z > 0) — стекло с рёбрами-волнами, которые катятся к берегу.
// Верх обеих плит — на y = 0, толщина TH (пол сцены ставить на floorY = -TH).
export const TH = .14;
// Детерминированное «зерно» песка: монохромная шумовая текстура (одинакова во всех потоках рендера).
export function grainTexture(seed = 7, size = 256, lo = .82, hi = 1) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  let s = seed >>> 0; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < size * size; i++) { const v = Math.round(255 * (lo + (hi - lo) * R())); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(3, 1.6); tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}
export function makeBeach({ w = 4.8, d = 2.5, dark = true, sandMat = null } = {}) {
  const grp = new THREE.Group();
  const sMat = sandMat || (dark ? MAT.aluminium() : MAT.ceramicWhite());
  if (!sandMat && dark) { sMat.color.set('#6E6E73'); sMat.roughness = .6; sMat.clearcoat = .2; }
  if (!sandMat) sMat.map = grainTexture(7, 256, dark ? .78 : .9, 1);
  const sand = new THREE.Mesh(rbox(w, TH, d, .035), sMat);
  sand.position.set(0, -TH / 2, -d / 2 - .004);
  sand.castShadow = true; sand.receiveShadow = true;
  // вода: тёмное «дно» + стеклянная оболочка + рёбра
  const deep = new THREE.Mesh(new THREE.BoxGeometry(w - .02, TH * .7, d - .02),
    new THREE.MeshPhysicalMaterial({ color: dark ? '#0A0A0C' : '#B9B9BE', roughness: .25, clearcoat: 1, clearcoatRoughness: .1 }));
  deep.position.set(0, -TH * .62, d / 2 + .004); deep.receiveShadow = true;
  const gGeo = new THREE.BoxGeometry(w, TH, d);
  const glass = new THREE.Mesh(gGeo, MAT.glass(dark ? .1 : .16));
  glass.position.copy(deep.position).setY(-TH / 2);
  const edges = glassEdges(gGeo, dark ? '#FFFFFF' : '#1D1D1F', dark ? .7 : .45);
  edges.position.copy(glass.position);
  grp.add(sand, deep, glass, edges);
  // рёбра-волны: тонкие стеклянные валики поперёк воды
  const NR = 7, ribMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .1, clearcoat: 1, transparent: true, opacity: dark ? .5 : .9, depthWrite: false });
  if (!dark) ribMat.color.set('#E8E8ED');
  const ribs = [];
  for (let i = 0; i < NR; i++) {
    // валик чуть волнистый: трубка вдоль синусоиды
    const pts = [];
    for (let j = 0; j <= 24; j++) { const x = -w / 2 + .06 + (w - .12) * j / 24; pts.push(new THREE.Vector3(x, 0, .045 * Math.sin(x * 2.3 + i * 1.9) + .02 * Math.sin(x * 5.1 + i))); }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, .014, 6), ribMat.clone());
    grp.add(m); ribs.push(m);
  }
  grp.userData = { w, d };
  grp.update = (t, k = 1) => {
    // волны идут к берегу (z → 0), проявляются вдали и тают у кромки
    ribs.forEach((m, i) => {
      const u = ((i / NR) + t * .045) % 1, z = d * (1 - u) - .02;
      m.position.set(0, .004 + .006 * Math.sin(t * 2 + i), z);
      m.scale.set(1, 1, 1 + .5 * Math.sin(t * 1.3 + i * 1.7));
      m.material.opacity = (dark ? .3 : .7) * k * clamp(u / .18) * clamp((1 - u) / .25);
      m.visible = m.material.opacity > .01;
    });
  };
  grp.parts = { sand, deep, glass, edges, ribs };
  return grp;
}
function glassEdges(geom, color, opacity) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geom, 20), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

// Спасатель: капсула-туловище + сфера-голова, смотрит в +X, стоит на y = 0. pose(swim 0..1, stride фаза).
export function makeLifeguard(mat) {
  const g = new THREE.Group(), tilt = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.085, .2, 8, 24), mat);
  body.position.y = -.035;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.07, 28, 20), mat);
  head.position.y = .2;
  tilt.add(body, head); g.add(tilt);
  g.pose = (swim = 0, stride = 0) => {
    // бег: лёгкий наклон вперёд и покачивание; плавание: тело ложится вдоль воды и уходит наполовину вниз
    tilt.rotation.z = -lerp(.16 + .05 * Math.sin(stride * 2), 1.45, swim);
    tilt.position.y = lerp(.22 + .012 * Math.abs(Math.sin(stride)), -.03, swim);
    tilt.rotation.x = swim * .12 * Math.sin(stride);
  };
  g.pose();
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// Тонущий: маленькая сфера + два кольца ряби.
export function makeSwimmer(mat, dark = true) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.085, 32, 22), mat);
  ball.castShadow = true;
  const rMat = () => new THREE.MeshBasicMaterial({ color: dark ? '#FFFFFF' : '#1D1D1F', transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide });
  const rings = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 64), rMat()); m.rotation.x = -Math.PI / 2; g.add(m); return m; });
  g.add(ball);
  g.update = (t, k = 1) => {
    ball.position.y = .03 + .018 * Math.sin(t * 3.1);
    rings.forEach((m, i) => {
      const u = ((t * .55) + i * .5) % 1;
      m.position.y = .006; m.scale.setScalar(.1 + u * .32);
      m.material.opacity = .55 * k * (1 - u) * clamp(u / .1);
    });
  };
  return g;
}

// Камера на орбите; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920). Из ep7/kit.mjs.
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}

// ---------- 2D ----------
// Ломаная по экранным точкам, рисуется на долю p (от начала).
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
// Точка на ломаной по доле длины
export function polyAt(pts, p) {
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let s = clamp(p) * lens.reduce((A, B) => A + B, 0);
  for (let i = 0; i < lens.length; i++) { if (s <= lens[i] || i === lens.length - 1) { const f = clamp(s / (lens[i] || 1)); return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } s -= lens[i]; }
}
// Светящаяся линия (аддитивно, для чёрного фона)
export function glowLine(pts, p, a = 1, lw = 3, from = 0) {
  if (a <= .003) return;
  const g = ctx();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.shadowColor = 'rgba(255,255,255,.9)'; g.shadowBlur = 22;
  polyline(pts, p, 'rgba(255,255,255,.55)', a, lw * 3.2, null, from);
  g.shadowBlur = 8;
  polyline(pts, p, '#FFFFFF', a, lw, null, from);
  g.restore();
}
// Мягкое пятно света (из ep5/kit.mjs)
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// Дуга угла между двумя направлениями (экранные углы, рад) с центром (x, y), рисуется на долю p
export function arc(x, y, r, a0, a1, p, col, a = 1, lw = 2.5) {
  if (a <= .003 || p <= 0) return;
  const g = ctx();
  let d = a1 - a0; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.arc(x, y, r, a0, a0 + d * clamp(p), d < 0); g.stroke(); g.restore();
}
// Подложка-плашка под подписью (цвет фона сцены)
export function chip(x, y, w, h, col, a = 1) {
  if (a <= .003) return;
  const g = ctx(); g.save(); g.globalAlpha *= a; g.fillStyle = col;
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.restore();
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
