// Общие детали выпуска ep7 (закон Бенфорда): распределение первых цифр, столбики со скруглёнными рёбрами,
// карточки-плашки с настоящими числами (атлас текстур), помощники 2D. Не сцена: импортируется сценами выпуска.
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, lerp, FONT, line } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// Закон Бенфорда: P(d) = log10(1 + 1/d)
export const BEN = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => Math.log10(1 + 1 / d));
export const pct = p => (p * 100).toFixed(1).replace('.', ',') + '%';
// раскладка 40 карточек/фишек по столбикам (≈ 40·P(d)): 12, 7, 5, 4, 3, 3, 2, 2, 2
export const CHIPS = [12, 7, 5, 4, 3, 3, 2, 2, 2];

// ---------- геометрия ----------
// Коробка со скруглёнными рёбрами произвольных пропорций (радиус r по всем осям одинаковый).
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
// Столбик: основание на y=0, высота меняется без искажения скруглений (верхняя половина вершин сдвигается).
export function makeBar(w, d, mat, r = .045) {
  const geo = rbox(w, 1, d, r, 3); geo.translate(0, .5, 0);
  const base = Float32Array.from(geo.attributes.position.array);
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true;
  let cur = -1;
  m.setH = h => {
    const hh = Math.max(h, 2 * r + .002);
    if (Math.abs(hh - cur) < 1e-5) return; cur = hh;
    const a = geo.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) { const y = base[i + 1]; a[i + 1] = y > .5 ? y + hh - 1 : y; }
    geo.attributes.position.needsUpdate = true;
  };
  m.setH(1);
  return m;
}
// Плашка-карточка (тонкая, со скруглёнными углами), лицом к +Z, центр в 0.
export const CARD_W = 1.6, CARD_H = .8, CARD_D = .05;
export function cardGeometry(w = CARD_W, h = CARD_H, dep = CARD_D, r = .11) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const b = .014;
  const geo = new THREE.ExtrudeGeometry(s, { depth: dep - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 6 });
  geo.translate(0, 0, -(dep - 2 * b) / 2);
  geo.computeVertexNormals();
  return geo;
}

// ---------- настоящие числа: 32 карточки (население, реки, цены), первые цифры ≈ по Бенфорду ----------
export const NUMS = [
  ['Население', '1 284 302'], ['Река', '1 870 км'], ['Цена', '149 ₽'], ['Население', '12 600'], ['Река', '1 011 км'],
  ['Цена', '18 990 ₽'], ['Население', '164 220'], ['Река', '1 437 км'], ['Цена', '1 299 ₽'], ['Население', '13 870 512'],
  ['Население', '2 718 000'], ['Река', '2 428 км'], ['Цена', '249 ₽'], ['Население', '21 345'], ['Цена', '2 990 ₽'], ['Река', '264 км'],
  ['Население', '3 405 112'], ['Река', '3 530 км'], ['Цена', '349 ₽'], ['Население', '38 210'],
  ['Река', '4 400 км'], ['Цена', '459 ₽'], ['Население', '412 900'],
  ['Река', '5 410 км'], ['Цена', '59 ₽'], ['Население', '502 140'],
  ['Река', '6 650 км'], ['Цена', '689 ₽'],
  ['Население', '7 120 450'], ['Цена', '799 ₽'],
  ['Население', '8 336 817'],
  ['Цена', '99 ₽'],
];
export const lead = i => +NUMS[i % NUMS.length][1][0];

// Атлас лиц карточек 4×8 ячеек по 512×256. hi = первая цифра белая, остальное приглушено.
const COLS = 4, ROWS = 8, CW = 512, CH = 256;
const ATL = {};
export function cardAtlas(hi) {
  const key = hi ? 'hi' : 'lo';
  if (ATL[key]) return ATL[key];
  const c = document.createElement('canvas'); c.width = CW * COLS; c.height = CH * ROWS;
  const g = c.getContext('2d');
  NUMS.forEach(([lab, num], i) => {
    const x0 = (i % COLS) * CW, y0 = Math.floor(i / COLS) * CH;
    g.save(); g.translate(x0, y0);
    g.font = `500 34px ${FONT}`; g.letterSpacing = '0px'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillStyle = hi ? '#5E5E63' : '#8E8E93'; g.fillText(lab, 44, 66);
    let size = 120; g.letterSpacing = '-4px';
    g.font = `600 ${size}px ${FONT}`;
    const wd = g.measureText(num).width; if (wd > 430) { size = Math.floor(size * 430 / wd); g.font = `600 ${size}px ${FONT}`; g.letterSpacing = (-size * .035).toFixed(1) + 'px'; }
    const first = num[0], rest = num.slice(1);
    g.fillStyle = '#FFFFFF'; g.fillText(first, 40, 206);
    const fw = g.measureText(first).width;
    g.fillStyle = hi ? '#4A4A4F' : '#FFFFFF'; g.fillText(rest, 40 + fw, 206);
    g.restore();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  ATL[key] = tex; return tex;
}
// Плоскость лица карточки i (UV — своя ячейка атласа).
const FACE_GEO = {};
export function faceGeometry(i) {
  const k = i % NUMS.length;
  if (FACE_GEO[k]) return FACE_GEO[k];
  const geo = new THREE.PlaneGeometry(CARD_W - .08, CARD_H - .04);
  const u0 = (k % COLS) / COLS, v1 = 1 - Math.floor(k / COLS) / ROWS, du = 1 / COLS, dv = 1 / ROWS;
  const uv = geo.attributes.uv;
  for (let j = 0; j < uv.count; j++) uv.setXY(j, u0 + uv.getX(j) * du, v1 - dv + uv.getY(j) * dv);
  FACE_GEO[k] = geo; return geo;
}
// Набор из N карточек: корпус — InstancedMesh (графит, цвет на экземпляр), лицо — два слоя (обычный / с выделенной первой цифрой).
export function makeCards(N, { body = '#1C1C1E', fog = true, offset = 0 } = {}) {
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .32, metalness: .1, clearcoat: .8, clearcoatRoughness: .15 });
  const bodies = new THREE.InstancedMesh(cardGeometry(), bodyMat, N);
  bodies.frustumCulled = false;
  const base = new THREE.Color(body), col = new THREE.Color();
  for (let i = 0; i < N; i++) bodies.setColorAt(i, base);
  const grp = new THREE.Group(); grp.add(bodies);
  const lo = cardAtlas(false), hi = cardAtlas(true);
  const cards = [];
  for (let i = 0; i < N; i++) {
    const k = i + offset;
    const mk = tex => {
      const m = new THREE.Mesh(faceGeometry(k), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog }));
      m.position.z = CARD_D / 2 + .003; m.renderOrder = 3; return m;
    };
    const holder = new THREE.Group(), fLo = mk(lo), fHi = mk(hi);
    holder.add(fLo, fHi); grp.add(holder);
    cards.push({ holder, fLo, fHi, k, lead: lead(k) });
  }
  const M = new THREE.Matrix4(), S = new THREE.Vector3();
  // set(i, pos(Vector3), quat, scale, bright 0..1, hiMix 0..1, faceA 0..1)
  const set = (i, pos, quat, sc, bright = 1, hiMix = 0, faceA = 1) => {
    const c = cards[i];
    S.setScalar(Math.max(sc, 1e-4));
    M.compose(pos, quat, S); bodies.setMatrixAt(i, M);
    col.copy(base).multiplyScalar(bright); bodies.setColorAt(i, col);
    c.holder.position.copy(pos); c.holder.quaternion.copy(quat); c.holder.scale.copy(S);
    const a = faceA * bright;
    c.fLo.material.opacity = a * (1 - hiMix); c.fHi.material.opacity = a * hiMix;
    c.fLo.visible = c.fLo.material.opacity > .003; c.fHi.visible = c.fHi.material.opacity > .003;
    c.holder.visible = sc > 1e-3;
  };
  const commit = () => { bodies.instanceMatrix.needsUpdate = true; bodies.instanceColor.needsUpdate = true; };
  return { grp, bodies, bodyMat, cards, set, commit };
}

// Камера на орбите вокруг цели; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920).
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}
export const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
// Камера: [t, ...значения] → интерполяция между ключами
export function keys(K, t, ease) {
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) {
    const a = K[i - 1], b = K[i], p = ease((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * p);
  }
  return K[K.length - 1].slice(1);
}

// ---------- 2D ----------
// Тонкая кривая по точкам (экранные координаты), рисуется на долю p.
export function polyline(pts, p, col, a = 1, lw = 3, dash = null) {
  const g = ctx(); if (a <= .003 || p <= 0 || pts.length < 2) return;
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let left = clamp(p) * lens.reduce((A, B) => A + B, 0);
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const f = Math.min(1, left / lens[i - 1]); left -= lens[i - 1];
    g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
  }
  g.stroke(); g.restore();
}
// Гладкая кривая через точки (Catmull-Rom → много точек)
export function smoothPts(pts, n = 10) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// Размерная линия с засечками
export function dimLine(x1, y1, x2, y2, col, a, tick = 12) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
}
// Пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs)
export function subscribePill(t, t0, press) {
  const g = ctx();
  const p = ENG.P(t, t0, .8, ENG.eApple);
  if (p <= .003) return;
  const dn = ENG.P(t, press, .14, ENG.eStd), up = ENG.P(t, press + .14, .6, ENG.eApple);
  const k = (1 - .055 * dn + .055 * up) * lerp(1.04, 1, p);
  const W2 = 300, H2 = 56, cx = 540, cy = 1205 + (1 - p) * 34;
  const bl = (1 - ENG.P(t, t0, .55, ENG.eApple)) * 12;
  g.save(); g.globalAlpha = p; if (bl > .3) g.filter = `blur(${bl.toFixed(1)}px)`;
  g.translate(cx, cy); g.scale(k, k);
  const dk = lerp(1, .82, dn * (1 - up));
  g.fillStyle = `rgb(${Math.round(255 * dk)},${Math.round(69 * dk)},${Math.round(58 * dk)})`;
  g.beginPath(); g.roundRect(-W2, -H2, W2 * 2, H2 * 2, H2); g.fill();
  g.font = `600 44px ${FONT}`; g.letterSpacing = '-0.4px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#FFFFFF'; g.fillText('Подписаться на L³', 0, 2);
  g.restore();
  const rp = ENG.P(t, press + .05, .9, ENG.eApple);
  if (rp > 0 && rp < 1) {
    const gr = 4 + 30 * rp;
    g.save(); g.globalAlpha = .5 * (1 - rp); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(cx - W2 - gr, 1205 - H2 - gr, (W2 + gr) * 2, (H2 + gr) * 2, H2 + gr); g.stroke(); g.restore();
  }
}
