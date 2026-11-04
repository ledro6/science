// Общие детали выпуска № 15 (закон Ципфа): лестница из десяти керамических столбиков, высота столбика ранга r
// равна BH / r (вместе с кубиком-словом наверху); у каждого кубика четыре боковые грани с надписями
// (номера мест, слова «и», «в», «не», иконки «город», «компания», «сайт» из простых фигур).
// «Страница текста» из плашек-слов (InstancedMesh) для сцены words. 2D-помощники: свечение, пилюля, заголовки.
// Не сцена: импортируется сценами выпуска и обложкой (hero.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, lerp, rng, FONT, atext, line } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// ---------- раскладка лестницы ----------
export const NB = 10;                 // десять мест
export const PITCH = .64;             // шаг столбиков
export const CUBE = .5;               // кубик-слово
export const SHAFT = .44;             // сечение столбика
export const BH = 5.0;                // высота первого места (кубик + столбик)
export const BX = i => (i - (NB - 1) / 2) * PITCH;      // i = 0..9 (место i + 1)
export const HT = i => BH / (i + 1);                     // полная высота места i + 1: 1 / ранг

// ---------- геометрия ----------
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
// Столбик: основание на y = 0, высота меняется без искажения скруглений (из ep7)
export function makeBar(w, d, mat, r = .04) {
  const geo = rbox(w, 1, d, r, 3); geo.translate(0, .5, 0);
  const base = Float32Array.from(geo.attributes.position.array);
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true;
  let cur = -1;
  m.setH = h => {
    const hh = Math.max(h, 2 * r + .002);
    if (Math.abs(hh - cur) < 1e-5) return; cur = hh;
    const a = geo.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) { const y = base[i + 1]; a[i + 1] = y <= r ? y : y >= 1 - r ? y - 1 + hh : r + (y - r) / (1 - 2 * r) * (hh - 2 * r); }
    geo.attributes.position.needsUpdate = true;
  };
  m.setH(1);
  return m;
}

// ---------- атлас надписей граней (белое на прозрачном, цвет задаёт материал) ----------
// 0–9 → «1»…«10», 10 «и», 11 «в», 12 «не», 13 город, 14 компания, 15 сайт
export const G = { num: i => i, i: 10, v: 11, ne: 12, city: 13, firm: 14, site: 15 };
const CELL = 256, COLS = 4;
let ATLAS = null;
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function drawIcon(g, k) {
  g.fillStyle = '#FFFFFF'; g.strokeStyle = '#FFFFFF';
  if (k === G.city) {
    // силуэт города: четыре башни разной высоты на общей линии
    const base = 196;
    [[44, 46, 92], [94, 40, 132], [138, 34, 70], [176, 38, 108]].forEach(([x, w, h]) => { rr(g, x, base - h, w, h, 5); g.fill(); });
    g.save(); g.globalCompositeOperation = 'destination-out';
    for (let y = 80; y < 186; y += 18) for (const x of [104, 118]) { g.fillRect(x, y, 8, 8); }
    for (let y = 120; y < 186; y += 18) for (const x of [55, 70]) g.fillRect(x, y, 8, 8);
    for (let y = 104; y < 186; y += 18) for (const x of [186, 200]) g.fillRect(x, y, 8, 8);
    g.restore();
  } else if (k === G.firm) {
    // компания: портфель
    g.lineWidth = 14; rr(g, 98, 58, 60, 42, 12); g.stroke();
    rr(g, 44, 86, 168, 116, 18); g.fill();
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillRect(44, 132, 168, 8); rr(g, 116, 122, 24, 28, 5); g.fill(); g.restore();
    rr(g, 120, 126, 16, 20, 4); g.fill();
  } else if (k === G.site) {
    // сайт: окно браузера
    g.lineWidth = 12; rr(g, 40, 58, 176, 140, 18); g.stroke();
    g.fillRect(40, 92, 176, 10);
    [62, 82, 102].forEach(x => { g.beginPath(); g.arc(x, 76, 6, 0, 7); g.fill(); });
    rr(g, 62, 120, 96, 12, 6); g.fill(); rr(g, 62, 146, 132, 12, 6); g.fill(); rr(g, 62, 172, 70, 12, 6); g.fill();
  }
}
export function atlas() {
  if (ATLAS) return ATLAS;
  const c = document.createElement('canvas'); c.width = CELL * COLS; c.height = CELL * COLS;
  const g = c.getContext('2d');
  for (let k = 0; k < 16; k++) {
    g.save(); g.translate((k % COLS) * CELL, Math.floor(k / COLS) * CELL);
    if (k <= 12) {
      const s = k <= 9 ? String(k + 1) : ['и', 'в', 'не'][k - 10];
      const size = k === 9 ? 132 : k === 12 ? 138 : 150;
      g.font = `600 ${size}px ${FONT}`; g.letterSpacing = (-.04 * size).toFixed(1) + 'px';
      g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#FFFFFF';
      g.fillText(s, CELL / 2 + (k === 9 ? -4 : 0), CELL / 2 + size * .36);
    } else { g.translate(CELL / 2, CELL / 2 + 4); g.scale(1.22, 1.22); g.translate(-CELL / 2, -CELL / 2); drawIcon(g, k); }
    g.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return ATLAS = tex;
}
const FGEO = {};
function faceGeo(k) {
  if (FGEO[k]) return FGEO[k];
  const s = CUBE - .04, geo = new THREE.PlaneGeometry(s, s);
  const u0 = (k % COLS) / COLS, v1 = 1 - Math.floor(k / COLS) / COLS, d = 1 / COLS, uv = geo.attributes.uv;
  for (let j = 0; j < uv.count; j++) uv.setXY(j, u0 + uv.getX(j) * d, v1 - d + uv.getY(j) * d);
  return FGEO[k] = geo;
}

// ---------- лестница ----------
// faces[i] = [перед +Z, лево −X, зад −Z, право +X] — номера ячеек атласа (−1 — пусто).
// Поворот кубика на +90° вокруг Y выводит к камере левую грань, на +180° — заднюю, на +270° — правую.
export function makeStair({ faces = null, ink = '#1D1D1F', base = '#F2F2F0' } = {}) {
  const grp = new THREE.Group();
  const tex = atlas();
  const cubeGeo = rbox(CUBE, CUBE, CUBE, .05, 3);
  const bars = [];
  for (let i = 0; i < NB; i++) {
    const smat = new THREE.MeshPhysicalMaterial({ color: base, roughness: .42, clearcoat: .35, clearcoatRoughness: .3 });
    const cmat = new THREE.MeshPhysicalMaterial({ color: base, roughness: .38, clearcoat: .45, clearcoatRoughness: .25 });
    const shaft = makeBar(SHAFT, SHAFT, smat, .035);
    const holder = new THREE.Group(), cube = new THREE.Mesh(cubeGeo, cmat);
    cube.castShadow = cube.receiveShadow = true;
    holder.add(cube);
    const fs = (faces ? faces[i] : [i, -1, -1, -1]).map((k, j) => {
      if (k < 0) return null;
      const m = new THREE.Mesh(faceGeo(k), new THREE.MeshBasicMaterial({ map: tex, color: ink, transparent: true, depthWrite: false, toneMapped: false }));
      const a = -j * Math.PI / 2;          // перед, лево, зад, право
      m.position.set(Math.sin(a) * (CUBE / 2 + .003), 0, Math.cos(a) * (CUBE / 2 + .003));
      m.rotation.y = a; m.renderOrder = 3;
      holder.add(m); return m;
    });
    grp.add(shaft, holder);
    bars.push({ shaft, holder, cube, smat, cmat, fs, x: BX(i) });
  }
  const B = new THREE.Color(base), tmp = new THREE.Color();
  // set(i, { grow 0..1 — доля полной высоты, x, z, dy — подъём кубика над вершиной, rot — поворот (рад),
  //          bright — яркость керамики, glyph — прозрачность надписей (массив по граням или число), tilt })
  const set = (i, { grow = 1, x = null, z = 0, dy = 0, rot = 0, bright = 1, glyph = 1, tilt = 0, hide = false } = {}) => {
    const b = bars[i], X = x == null ? b.x : x;
    const sh = Math.max(0, HT(i) - CUBE) * clamp(grow);
    b.shaft.visible = !hide && sh > .02;
    b.shaft.setH(sh); b.shaft.position.set(X, 0, z);
    b.holder.visible = !hide;
    b.holder.position.set(X, sh + CUBE / 2 + dy, z);
    b.holder.rotation.set(tilt, rot, tilt * .6);
    tmp.copy(B).multiplyScalar(bright);
    b.smat.color.copy(tmp); b.cmat.color.copy(tmp);
    b.smat.clearcoat = .35 * clamp(bright); b.cmat.clearcoat = .45 * clamp(bright);
    b.fs.forEach((m, j) => {
      if (!m) return;
      const a = Array.isArray(glyph) ? glyph[j] : glyph;
      m.material.opacity = clamp(a) * lerp(.35, 1, clamp(bright));
      m.visible = m.material.opacity > .003 && !hide;
    });
  };
  const top = i => bars[i].holder.position.y + CUBE / 2;      // верх кубика (для выносок)
  return { grp, bars, set, top };
}

// ---------- «страница текста»: строки из плашек-слов, лежат на полу ----------
// Короткие слова чаще оказываются среди «ста самых частых» (выбор детерминирован, ровно половина по счёту).
export function makePage({ rows = 13, width = 6.2, gap = .07, rowStep = .36, seed = 15 } = {}) {
  const R = rng(seed), chips = [];
  for (let r = 0; r < rows; r++) {
    let x = 0; const ln = [];
    const lim = r === rows - 1 ? width * .55 : width;
    while (true) {
      const short = R() < .5;
      const w = short ? .16 + R() * .16 : .34 + R() * .5;
      if (x + w > lim) break;
      ln.push({ x0: x, w, short, r }); x += w + gap;
    }
    // выравнивание строки по ширине
    const free = lim - (x - gap), k = ln.length > 1 && r !== rows - 1 ? free / (ln.length - 1) : 0;
    ln.forEach((c, j) => { c.x0 += k * j; chips.push(c); });
  }
  // половина плашек — «частые слова»: в первую очередь короткие
  const order = chips.map((c, i) => ({ i, s: (c.short ? 0 : 1) + R() * 1.3 })).sort((a, b) => a.s - b.s);
  order.slice(0, Math.round(chips.length / 2)).forEach(o => chips[o.i].top = true);
  const N = chips.length;
  const mat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .4, clearcoat: .4, clearcoatRoughness: .3 });
  const im = new THREE.InstancedMesh(rbox(1, .07, .2, .03, 2), mat, N);
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  const Cw = new THREE.Color('#F2F2F0'), Cd = new THREE.Color('#2C2C2E'), Cm = new THREE.Color('#5A5A5E'), col = new THREE.Color();
  for (let i = 0; i < N; i++) im.setColorAt(i, Cm);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  const depth = (rows - 1) * rowStep;
  chips.forEach(c => { c.cx = c.x0 + c.w / 2 - width / 2; c.cz = c.r * rowStep - depth / 2; c.ord = (c.r * width + c.x0) / (rows * width); });
  // set(i, rise 0..1, mark 0..1 — «частые» белеют, остальные темнеют, bright)
  const set = (i, rise, mark, bright = 1) => {
    const c = chips[i], s = clamp(rise);
    V.set(c.cx, .035 + (1 - s) * .5, c.cz);
    S.set(c.w * Math.max(s, 1e-3), Math.max(s, 1e-3), 1);
    M.compose(V, Q, S); im.setMatrixAt(i, M);
    col.copy(Cm).lerp(c.top ? Cw : Cd, clamp(mark)).multiplyScalar(bright * lerp(.3, 1, s));
    im.setColorAt(i, col);
  };
  const commit = () => { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; };
  return { im, chips, set, commit, N, depth, width };
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
// свет «из темноты»: контровые раньше ключа; ключ медленно проходит по лестнице
export function lights(stage, t, t0, span, dark = true) {
  const L = stage.lights, lr = ENG.P(t, t0, .9), lk = ENG.P(t, t0 + .2, 1.2);
  const u = clamp((t - t0) / span);
  L.key.position.set(lerp(-6, 5, u), 9, 6);
  if (dark) { L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; }
  return { lr, lk };
}

// ---------- 2D ----------
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
// Строка из частей разного цвета (центр по x): parts = [[текст, цвет], …]
export function atextParts(parts, x, y, t0, t, o = {}) {
  const { size = 96, w = 600, track = -.025 } = o;
  const wd = parts.map(([s]) => ENG.measure(s, size, w, track)), tot = wd.reduce((A, B) => A + B, 0);
  let cx = x - tot / 2;
  parts.forEach(([s, col, dt = 0], i) => { atext(s, cx, y, t0 + dt, t, { ...o, size, w, track, col, align: 'left' }); cx += wd[i]; });
}
// Пунктир по экранным точкам, рисуется на долю p
export function dashPath(pts, p, col, a = 1, lw = 2.5, dash = [2, 10]) {
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
// Горизонтальная отметка уровня: пунктир от x1 до x2 на высоте y, рисуется слева направо
export function level(x1, x2, y, p, col, a = 1) {
  if (p <= 0 || a <= .003) return;
  line(x1, y, lerp(x1, x2, clamp(p)), y, col, a * .9, 2.5, [3, 9]);
}

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs), копия из ep12/kit.mjs
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
