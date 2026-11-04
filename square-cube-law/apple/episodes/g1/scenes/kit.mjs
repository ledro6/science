// Общие детали выпуска g1 («Почему страны торгуют с соседями»): монохромный глобус с настоящими очертаниями
// материков (Natural Earth 1:50m, geo.mjs), силуэты стран-«подсветки», дуги торговых потоков (2D по проекции,
// с перекрытием глобусом, свечением и бегущими «грузами»), 3D-трубки дуг для обложки, плоская точечная карта.
// Помощники камеры/2D/пилюли — из w1/kit.mjs (тот же стиль рубрик).
import * as ENG from '../../../engine.mjs';
import { THREE, project, clamp, lerp, H, FONT, line, atext } from '../../../engine.mjs';
import { countryMap, MW, MH, ID } from './geo.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };

// ---------- география ----------
// направление на точку (широта, долгота) в системе THREE.SphereGeometry (UV: долгота 0 → +X, 90° в.д. → −Z)
export function llDir(lat, lon) {
  const a = lat * D2R, b = lon * D2R;
  return new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b));
}
// азимут/высота камеры (для orbit/frame), смотрящей прямо на точку (lat, lon)
export const camAz = lon => lon + 90;

// экономические «центры» стран (условные точки для дуг; подписи — названия стран)
export const PLACES = {
  usa: [39.5, -92], can: [50.5, -97], mex: [22.5, -101.5],
  ger: [51, 10], fra: [47, 2.5], nld: [52.3, 5.4], pol: [52, 19.5], ita: [43.5, 12],
  chn: [32, 114], jpn: [36.2, 138.5], kor: [36.5, 127.8],
};

// ---------- процедурный шум (детерминированный) ----------
function hash3(x, y, z, s) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + s * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function noise3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const c = (i, j, k) => hash3(xi + i, yi + j, zi + k, s);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
function fbm(x, y, z, s, oct = 3) {
  let a = .5, f = 1, sum = 0, n = 0;
  for (let i = 0; i < oct; i++) { sum += a * noise3(x * f, y * f, z * f, s + i * 17); n += a; a *= .5; f *= 2.03; }
  return sum / n;
}

// ---------- текстуры глобуса ----------
let TEX = null;
const OVL = {};
function canvasTex(c) { const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx; }
// Глобус: океан — тёмный графит, суша — алюминий с лёгкой фактурой, границы стран — тонкие тёмные линии
export function globeTexture() {
  if (TEX) return TEX;
  const m = countryMap(), c = document.createElement('canvas'); c.width = MW; c.height = MH;
  const g = c.getContext('2d'), img = g.createImageData(MW, MH);
  for (let j = 0; j < MH; j++) {
    const lat = (90 - (j + .5) / MH * 180) * D2R, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < MW; i++) {
      const lon = ((i + .5) / MW * 360 - 180) * D2R;
      const x = cl * Math.cos(lon), y = sl, z = -cl * Math.sin(lon);
      const id = m[j * MW + i];
      const tone = fbm(x * 6 + 1, y * 6, z * 6, 29);
      let v;
      if (!id) v = 26 + 12 * tone;
      else {
        v = 158 + 34 * (tone - .5) + 34 * smooth((Math.abs(lat) - 1.15) / .2);
        const r = m[j * MW + (i + 1) % MW], d = j + 1 < MH ? m[(j + 1) * MW + i] : id;
        if ((r && r !== id) || (d && d !== id)) v -= 48;
        else if (!r || !d) v += 18;                      // светлый кант по берегу
      }
      const k = (j * MW + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = clamp(Math.round(v), 0, 255); img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return (TEX = canvasTex(c));
}
// Силуэт одной страны (белый, остальное прозрачное) — для «подсветки» страны на глобусе
export function countryTexture(key) {
  if (OVL[key]) return OVL[key];
  const id = ID[key], m = countryMap(), c = document.createElement('canvas'); c.width = MW; c.height = MH;
  const g = c.getContext('2d'), img = g.createImageData(MW, MH);
  for (let p = 0; p < m.length; p++) if (m[p] === id) { const k = p * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = 255; }
  g.putImageData(img, 0, 0);
  return (OVL[key] = canvasTex(c));
}
export function makeGlobe(r = 1, seg = 48) {
  const m = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: globeTexture(), roughness: .5, metalness: .06, clearcoat: .25, clearcoatRoughness: .35 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
// Подсветка страны: керамический силуэт поверх глобуса; яркость — opacity материала
export function makeCountry(key, r = 1, seg = 48) {
  const m = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: countryTexture(key), transparent: true, opacity: 0, depthWrite: false,
    roughness: .38, clearcoat: .5, clearcoatRoughness: .25, emissive: '#FFFFFF', emissiveIntensity: 0, emissiveMap: countryTexture(key) });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r * 1.0015, seg, Math.round(seg * .7)), m);
  mesh.renderOrder = 2;
  return mesh;
}
// Стеклянная атмосфера: почти прозрачная оболочка с френелевым ободом (как в w1)
export function makeShell(r = 1, { color = '#FFFFFF', base = 0, rim = .5, pow = 4, seg = 48 } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uBase: { value: base }, uRim: { value: rim }, uPow: { value: pow }, uOp: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uBase, uRim, uPow, uOp; varying vec3 vN; varying vec3 vV;
      void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); float a = uBase + uRim * pow(f, uPow); gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0) * uOp); }`,
    transparent: true, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), mat);
  mesh.renderOrder = 3;
  return mesh;
}
// «проявление из темноты»: запоминаем цвета материалов (k: 0 — чёрный, 1 — как есть)
export function collectMats(obj) {
  const ms = new Set(); obj.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.material.isShaderMaterial) ms.add(o.material); });
  return [...ms].map(m => { m.userData.base = m.color.clone(); m.userData.cc = m.clearcoat || 0; return m; });
}
export function setLit(mats, k) {
  for (const m of mats) { m.color.copy(m.userData.base).multiplyScalar(k); m.clearcoat = m.userData.cc * k; m.specularIntensity = k; }
}
// Студийный свет «привязан» к камере: ключ слева-спереди, контровые сзади (как Солнце в w1, но при любой орбите)
export function camLights(L, azDeg, k = 1, { key = 3.0, rim = 1.6, hemi = .12 } = {}) {
  const a = azDeg * D2R, ca = Math.cos(a), sa = Math.sin(a);
  const rot = (x, y, z) => [x * ca + z * sa, y, -x * sa + z * ca];
  L.key.position.set(...rot(-7, 5, 3.5)); L.key.target.position.set(0, 0, 0); L.key.castShadow = false;
  L.rimL.position.set(...rot(-6, 3, -5)); L.rimR.position.set(...rot(6, 2, -4));
  L.key.intensity = key * k; L.rimL.intensity = rim * k; L.rimR.intensity = rim * .7 * k; L.hemi.intensity = hemi * k;
}

// ---------- камера ----------
// Орбита; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920). Из w1/kit.mjs.
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * D2R, el = elDeg * D2R;
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
export function screenR(cam, p, r) {
  const d = cam.position.distanceTo(new THREE.Vector3(...p));
  return r * H / (2 * d * Math.tan(cam.fov * Math.PI / 360));
}

// ---------- дуги торговых потоков ----------
const _u = new THREE.Vector3(), _w = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
// точки дуги большого круга между (lat,lon) a и b, приподнятой над глобусом радиуса R
export function globeArcPts(R, a, b, { lift = null, n = 64 } = {}) {
  const u = llDir(...a), w = llDir(...b), om = Math.acos(clamp(u.dot(w), -1, 1)), so = Math.sin(om) || 1;
  const h = lift == null ? .08 + .3 * om / Math.PI : lift;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, k1 = Math.sin((1 - s) * om) / so, k2 = Math.sin(s * om) / so;
    _p.copy(u).multiplyScalar(k1).addScaledVector(w, k2).normalize().multiplyScalar(R * (1 + h * Math.sin(Math.PI * s)));
    pts.push(_p.toArray());
  }
  return pts;
}
// дуга-парабола над плоскостью y = y0 между точками [x,z]
export function flatArcPts(a, b, { y0 = 0, lift = .22, n = 48 } = {}) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    pts.push([lerp(a[0], b[0], s), y0 + lift * L * 4 * s * (1 - s), lerp(a[1], b[1], s)]);
  }
  return pts;
}
// проекция с проверкой перекрытия глобусом (сфера радиуса R в начале координат)
export function projPts(cam, pts, R = 0) {
  const C = cam.position, c2 = C.lengthSq() - R * R * .998;
  return pts.map(p => {
    const [x, y] = project(cam, ...p);
    let vis = true;
    if (R > 0) {
      _d.set(p[0] - C.x, p[1] - C.y, p[2] - C.z); const L = _d.length(); _d.divideScalar(L);
      const b = _d.dot(C), disc = b * b - c2;
      if (disc > 0) { const t1 = -b - Math.sqrt(disc); if (t1 > 0 && t1 < L - 1e-3) vis = false; }
    }
    return { x, y, vis };
  });
}
// Рисует дугу: p — доля прорисовки (от a к b), lw — толщина, glowK — свечение (на чёрном), pulses — бегущие «грузы»
export function drawArc(sp, t, { p = 1, col = '#FFFFFF', a = 1, lw = 4, glowK = 1, pulses = 0, speed = .35, phase = 0, dark = true, pulseCol = null, back = false } = {}) {
  const g = ctx(); if (a <= .003 || p <= 0) return;
  const n = sp.length - 1, m = p * n, mi = Math.floor(m);
  const runs = []; let cur = null;
  for (let i = 0; i <= Math.min(n, mi + 1); i++) {
    let q = sp[i];
    if (i > m) { const f = m - mi, a0 = sp[mi]; q = { x: lerp(a0.x, q.x, f), y: lerp(a0.y, q.y, f), vis: q.vis && a0.vis }; }
    if (!q.vis) { cur = null; continue; }
    if (!cur) { cur = []; runs.push(cur); }
    cur.push(q);
  }
  const stroke = (w, al, add) => {
    g.save(); g.globalAlpha = a * al; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    if (add) g.globalCompositeOperation = 'lighter';
    for (const r of runs) { if (r.length < 2) continue; g.beginPath(); g.moveTo(r[0].x, r[0].y); for (let i = 1; i < r.length; i++) g.lineTo(r[i].x, r[i].y); g.stroke(); }
    g.restore();
  };
  if (dark && glowK > 0) { stroke(lw * 4.5, .05 * glowK, true); stroke(lw * 2.4, .1 * glowK, true); }
  stroke(lw, 1, false);
  // «грузы»: точки бегут по прорисованной части (в обе стороны при back)
  for (let k = 0; k < pulses; k++) {
    for (const dir of back ? [1, -1] : [1]) {
      let s = ((t * speed + phase + k / pulses + (dir < 0 ? .5 / pulses : 0)) % 1 + 1) % 1;
      if (dir < 0) s = 1 - s;
      if (s > p) continue;
      const f = s * n, i0 = Math.floor(f), i1 = Math.min(n, i0 + 1), q0 = sp[i0], q1 = sp[i1];
      if (!q0.vis || !q1.vis) continue;
      const x = lerp(q0.x, q1.x, f - i0), y = lerp(q0.y, q1.y, f - i0), fade = Math.sin(Math.PI * s);
      g.save(); g.globalAlpha = a * fade; g.fillStyle = pulseCol || (dark ? '#FFFFFF' : ENG.C_PAPER);
      if (dark) {
        g.globalCompositeOperation = 'lighter';
        const R = lw * 2.2, gr = g.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(.35, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R);
      } else { g.beginPath(); g.arc(x, y, Math.max(1.5, lw * .32), 0, TAU); g.fill(); }
      g.restore();
    }
  }
}
// 3D-трубка дуги (для обложки — у неё нет 2D-слоя)
export function arcTube(pts, r, mat, seg = 80) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), mat);
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
// Размерная линия с засечками (из пилота)
export function dim(x1, y1, x2, y2, a, col, tick = 12) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
}
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// точка-«город»: ядро + мягкий ореол (на чёрном)
export function spot(x, y, r, col, a = 1, dark = true) {
  if (a <= .003) return;
  if (dark) glow(x, y, r * 6, .35 * a);
  ENG.dot(x, y, r, col, a);
}
// Заголовок из слов, каждое — в свой момент (ts[i])
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = ENG.measure(' ', size, w, track), wd = ws.map(q => ENG.measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}
// кегль, при котором строка укладывается в ширину maxW
export const fit = (s, size, maxW, w = 600, track = -.03) => Math.min(size, size * maxW / ENG.measure(s, size, w, track));

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs), копия из w1/kit.mjs
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
