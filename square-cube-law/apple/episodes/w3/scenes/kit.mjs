// Общие детали выпуска w3 («Что если человек вырастет вдвое»): керамическая фигура человека из примитивов
// (туловище-лейка, голова-эллипсоид, конические конечности), алюминиевые ортезы на голенях,
// 2D-помощники рубрики «Что если» (размерные линии, стрелки, свечение, пилюля «Подписаться на L³») — из w2/kit.mjs.
// Не сцена: импортируется сценами выпуска и hero.mjs.
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, lerp, FONT, line, atext, MAT } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// ---------- фигура человека (рост 1.75, ступни на y = 0, лицом в +Z) ----------
export const HUMAN_H = 1.75;
const UP = new THREE.Vector3(0, 1, 0);
const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// Конический сегмент конечности от a (радиус r1) до b (радиус r2) со сферическими суставами
function limb(grp, mat, a, b, r1, r2, seg = 20) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, seg, 1, true), mat);
  cyl.position.copy(A).addScaledVector(d, .5); cyl.quaternion.setFromUnitVectors(UP, d.normalize());
  const j1 = new THREE.Mesh(new THREE.SphereGeometry(r1, seg, 12), mat); j1.position.copy(A);
  const j2 = new THREE.Mesh(new THREE.SphereGeometry(r2, seg, 12), mat); j2.position.copy(B);
  grp.add(cyl, j1, j2);
}
function ell(grp, mat, rx, ry, rz, p, seg = 28) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * .7)), mat);
  m.scale.set(rx, ry, rz); m.position.set(...p); grp.add(m); return m;
}
// Точки скелета (для выносок и ортезов)
export const JOINT = {
  head: [0, 1.75, 0], foot: [0, 0, 0], knee: x => [x * .095, .5, .01], ankle: x => [x * .1, .09, 0],
};
export function makeHuman({ mat = null, braces = false, braceMat = null } = {}) {
  mat = mat || MAT.ceramicWhite();
  const g = new THREE.Group(), body = new THREE.Group();
  // туловище: таз, талия, грудная клетка; сплюснуто по глубине
  const torso = new THREE.Mesh(lathe([[0, .8], [.1, .812], [.152, .86], [.17, .94], [.158, 1.03], [.146, 1.1], [.158, 1.2], [.178, 1.3], [.188, 1.38], [.168, 1.432], [.1, 1.468], [0, 1.48]]), mat);
  torso.scale.set(1, 1, .64); body.add(torso);
  // шея и голова
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.044, .05, .13, 20), mat); neck.position.set(0, 1.5, 0); body.add(neck);
  ell(body, mat, .094, .118, .106, [0, 1.632, .005], 36);
  // плечи (дельты)
  for (const x of [-1, 1]) ell(body, mat, .062, .06, .06, [x * .185, 1.405, 0], 20);
  // ноги: бедро, голень, стопа
  for (const x of [-1, 1]) {
    limb(body, mat, [x * .088, .86, 0], JOINT.knee(x), .074, .052);
    limb(body, mat, JOINT.knee(x), JOINT.ankle(x), .05, .033);
    ell(body, mat, .045, .034, .108, [x * .104, .034, .048], 20);
  }
  // руки: плечо, предплечье, кисть
  for (const x of [-1, 1]) {
    limb(body, mat, [x * .205, 1.385, 0], [x * .248, 1.1, -.012], .044, .035);
    limb(body, mat, [x * .248, 1.1, -.012], [x * .262, .84, .02], .033, .025);
    ell(body, mat, .028, .062, .04, [x * .265, .782, .026], 18);
  }
  g.add(body);
  // ортезы: две алюминиевые шины вдоль голени + три хомута; появляются по grow (0..1, снизу вверх)
  if (braces) {
    const bm = braceMat || MAT.aluminium();
    const br = new THREE.Group();
    for (const x of [-1, 1]) {
      const cx = x * .1;
      for (const s of [-1, 1]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .62, 10), bm);
        rod.position.set(cx + s * .066, .34, .005); br.add(rod);
      }
      [[.17, .046], [.4, .058], [.62, .07]].forEach(([y, r]) => {
        const band = new THREE.Mesh(new THREE.TorusGeometry(r + .012, .012, 8, 40), bm);
        band.rotation.x = Math.PI / 2; band.position.set(cx, y, .005); band.scale.set(1, .78, 1); br.add(band);
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(.1, .012, .2), bm); plate.position.set(cx + x * .004, .006, .045); br.add(plate);
    }
    g.add(br); g.braces = br;
    // grow: шины вырастают снизу вверх
    g.setBraces = k => { br.visible = k > .003; br.scale.set(1, Math.max(.001, k), 1); br.children.forEach(c => { if (c.material) c.material.opacity = 1; }); };
    g.setBraces(0);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// «проявление из темноты»: запоминаем цвета материалов (k: 0 — чёрный, 1 — как есть)
export function collectMats(obj) {
  const ms = new Set(); obj.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.material.isShaderMaterial) ms.add(o.material); });
  return [...ms].map(m => { m.userData.base = m.color.clone(); m.userData.cc = m.clearcoat || 0; return m; });
}
export function setLit(mats, k) {
  for (const m of mats) { m.color.copy(m.userData.base).multiplyScalar(k); m.clearcoat = m.userData.cc * k; m.specularIntensity = k; }
}

// ---------- камера ----------
// Орбита; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920).
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}
// Ключи [t, ...значения] → интерполяция ease между ключами
export function keys(K, t, ease) {
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) {
    const a = K[i - 1], b = K[i], p = ease((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * p);
  }
  return K[K.length - 1].slice(1);
}

// ---------- 2D ----------
// Стрелка 2D (линия + засечка-уголок)
export function arrow(x1, y1, x2, y2, col, a = 1, lw = 3, head = 14) {
  if (a <= .003) return;
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return;
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, hh = Math.min(head, L * .45);
  line(x1, y1, x2, y2, col, a, lw);
  line(x2, y2, x2 - ux * hh - uy * hh * .62, y2 - uy * hh + ux * hh * .62, col, a, lw);
  line(x2, y2, x2 - ux * hh + uy * hh * .62, y2 - uy * hh - ux * hh * .62, col, a, lw);
}
// Размерная линия как на техчертежах apple.com: засечки на концах; p — доля прорисовки от (x1, y1)
export function dim(x1, y1, x2, y2, a, col, tick = 12, p = 1) {
  if (a <= .003 || p <= .003) return;
  x2 = lerp(x1, x2, p); y2 = lerp(y1, y2, p);
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
}
// Мягкое пятно света (аддитивно, для чёрного фона)
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// Заголовок из слов, каждое — в свой момент (ts[i])
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = ENG.measure(' ', size, w, track), wd = ws.map(q => ENG.measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}
// «Вдох» — заливка 2D-слоя цветом фона
export function veil(col, a) { const g = ctx(); if (a <= .003) return; g.save(); g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, 1080, 1920); g.restore(); }

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

// Коробка со скруглёнными рёбрами произвольных пропорций
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
