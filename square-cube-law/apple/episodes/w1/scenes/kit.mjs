// Общие детали выпуска w1 («Что если Луна станет вдвое ближе»): монохромная Земля (графитовый океан,
// алюминиевые материки), керамическая Луна с кратерами, стеклянная «водная оболочка» с френелевым ободом,
// 2D-помощники (кольца орбит, ломаные, стрелки, размерные линии, свечение, пилюля).
// Не сцена: импортируется сценами выпуска. Часть помощников — из ep4/ep10 (kit.mjs) и пилота.
import * as ENG from '../../../engine.mjs';
import { THREE, project, clamp, lerp, rng, H, FONT, line, atext } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
// «384 400» — разряды через неразрывный пробел
export const fmt = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------- процедурные текстуры (детерминированные: одинаковы во всех потоках рендера) ----------
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
function fbm(x, y, z, s, oct = 5) {
  let a = .5, f = 1, sum = 0, n = 0;
  for (let i = 0; i < oct; i++) { sum += a * noise3(x * f, y * f, z * f, s + i * 17); n += a; a *= .5; f *= 2.03; }
  return sum / n;
}
// равнопромежуточная развёртка: (u, v) → точка на сфере
function sphereTex(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    const lat = (.5 - (j + .5) / h) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < w; i++) {
      const lon = (i + .5) / w * TAU;
      const v = fn(cl * Math.cos(lon), sl, cl * Math.sin(lon), lat);
      const k = (j * w + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = clamp(Math.round(v), 0, 255); img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  return tx;
}
let EARTH = null, MOON = null;
// Земля: океан — тёмный графит, материки — светлый алюминий, полярные шапки — керамика
export function earthTexture() {
  if (EARTH) return EARTH;
  EARTH = sphereTex(512, 256, (x, y, z, lat) => {
    const n = fbm(x * 1.7 + 3.1, y * 1.7 + 1.3, z * 1.7 + 7.7, 11);
    const land = smooth((n - .515) / .03);
    const tone = fbm(x * 5 + 1, y * 5, z * 5, 29);
    const ice = smooth((Math.abs(lat) - 1.3) / .1);
    const ocean = 30 + 10 * tone;
    const ground = 128 + 70 * (tone - .5) + 30 * smooth((n - .6) / .1);
    return lerp(lerp(ocean, ground, land), 196, ice);
  });
  return EARTH;
}
// Луна: светлая керамика, тёмные «моря» и кратеры с приподнятым краем
export function moonTexture() {
  if (MOON) return MOON;
  const R = rng(77), craters = [];
  for (let i = 0; i < 70; i++) {
    const u = R() * 2 - 1, th = R() * TAU, s = Math.sqrt(1 - u * u);
    craters.push([s * Math.cos(th), u, s * Math.sin(th), .03 + Math.pow(R(), 2.5) * .16]);
  }
  MOON = sphereTex(512, 256, (x, y, z) => {
    const m = fbm(x * 1.3 + 5, y * 1.3 + 2, z * 1.3 + 9, 41);
    const mare = smooth((m - .55) / .05);
    const grain = fbm(x * 9, y * 9, z * 9, 53);
    let v = 205 - 62 * mare + 26 * (grain - .5);
    for (const [cx, cy, cz, r] of craters) {
      const d = Math.hypot(x - cx, y - cy, z - cz) / r;
      if (d < 1.25) v += d < .8 ? -16 * (1 - d / .8) : 14 * bump(d, 1, .25);
    }
    return v;
  });
  return MOON;
}
export function makeEarth(r = 1, seg = 48) {
  const m = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: earthTexture(), roughness: .42, metalness: .08, clearcoat: .35, clearcoatRoughness: .3 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
export function makeMoon(r = .27, seg = 48) {
  const m = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: moonTexture(), roughness: .62, clearcoat: .15, clearcoatRoughness: .5 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
// Стеклянная оболочка (вода/атмосфера): почти прозрачная, с ярким френелевым ободом — тонкое «стекло» без transmission
export function makeShell(r = 1, { color = '#FFFFFF', base = .05, rim = .85, pow = 2.6, seg = 48 } = {}) {
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
// Приливная деформация оболочки: вытянута вдоль направления на Луну (dir — угол в плоскости XZ);
// поперёк не сжимаем — оболочка не должна уходить под поверхность Земли
export function tideShell(shell, b, dirAng = 0) {
  const ax = 1 + b, tr = 1;
  shell.scale.set(ax, tr, tr);
  shell.rotation.set(0, -dirAng, 0);
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
// Орбита; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920). Из ep10/kit.mjs.
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
// экранный радиус шара радиуса r в точке p
export function screenR(cam, p, r) {
  const d = cam.position.distanceTo(new THREE.Vector3(...p));
  return r * H / (2 * d * Math.tan(cam.fov * Math.PI / 360));
}

// ---------- 2D ----------
export const onRing = (r, a, y = 0) => [r * Math.cos(a), y, -r * Math.sin(a)];
// Кольцо орбиты 2D-линией по проекции; occ — шары [{p,r}], перекрывающие заднюю часть кольца (из ep4/kit.mjs)
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
// Хвост за телом на кольце: дуга с затуханием к началу (len — длина в радианах)
export function trail(cam, r, ang, len, { col = '#FFFFFF', a = 1, lw = 3, seg = 20, occ = [] } = {}) {
  for (let i = 0; i < seg; i++) {
    const a0 = ang - len * (i + 1) / seg, a1 = ang - len * i / seg;
    ring(cam, r, { col, a: a * Math.pow(1 - i / seg, 1.6), lw, from: a0, to: a1 + .002, occ, N: 400 });
  }
}
// Стрелка 2D (линия + засечка-уголок)
export function arrow(x1, y1, x2, y2, col, a = 1, lw = 3, head = 14) {
  if (a <= .003) return;
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return;
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, hh = Math.min(head, L * .45);
  line(x1, y1, x2, y2, col, a, lw);
  line(x2, y2, x2 - ux * hh - uy * hh * .62, y2 - uy * hh + ux * hh * .62, col, a, lw);
  line(x2, y2, x2 - ux * hh + uy * hh * .62, y2 - uy * hh - ux * hh * .62, col, a, lw);
}
// Размерная линия как на техчертежах apple.com: засечки на концах (из пилота)
export function dim(x1, y1, x2, y2, a, col, tick = 12) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
}
// Пунктирная окружность на экране, рисуется на долю p
export function circle(x, y, r, col, a = 1, lw = 2, dash = null, p = 1, start = -Math.PI / 2) {
  if (a <= .003 || p <= 0) return;
  const g = ctx(); g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.arc(x, y, r, start, start + TAU * clamp(p)); g.stroke(); g.restore();
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
// Заголовок из слов, каждое — в свой момент (ts[i]) — как «Закон квадрата и куба» в пилоте
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

// Коробка со скруглёнными рёбрами произвольных пропорций (из ep10/kit.mjs)
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
