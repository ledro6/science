// Общие детали выпуска № 16 (закон Стефана-Больцмана): звезда-сфера (шейдер: потемнение к краю + грануляция,
// яркость и «белизна» — параметры), фотоны-точки, бегущие от звезды (их число ∝ мощности излучения),
// конфорка-спираль, керамические плитки, 2D-помощники (свечение, формула с красной «⁴», пилюля).
// Не сцена: импортируется сценами выпуска и обложкой (hero.mjs). Часть помощников — из ep14/kit.mjs.
import * as ENG from '../../../engine.mjs';
import { THREE, project, clamp, lerp, rng, FONT, line, atext, measure, H } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];

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
// экранный радиус шара радиуса r в точке p
const _p = new THREE.Vector3();
export function screenR(cam, p, r) {
  const d = cam.position.distanceTo(_p.set(p[0], p[1], p[2]));
  return r * H / (2 * d * Math.tan(cam.fov * Math.PI / 360));
}

// «проявление из темноты»
export function collectMats(obj) {
  const ms = new Set(); obj.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.material.isMeshBasicMaterial && !o.material.isShaderMaterial) ms.add(o.material); });
  return [...ms].map(m => { m.userData.base = m.color.clone(); m.userData.cc = m.clearcoat || 0; return m; });
}
export function setLit(mats, k) {
  for (const m of mats) { m.color.copy(m.userData.base).multiplyScalar(k); m.clearcoat = m.userData.cc * k; m.specularIntensity = k; }
}
export function rbox(w, h, d, r = .03, seg = 3) {
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

// =====================================================================================================
// Звезда: сфера с шейдером. heat 0..1 — «холодная» (тусклая, чуть тёплый серый, сильное потемнение к краю)
// → «горячая» (чистый белый, ровная). paper: true — вариант для светлого фона (жемчужная сфера с серым краем).
// =====================================================================================================
const STAR_VS = `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main() {
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const STAR_FS = `
uniform float uHeat; uniform float uB; uniform float uTime; uniform float uPaper; uniform float uSeed;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
float h3(vec3 p) { p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  vec3 q = vP * 5.5 + vec3(uSeed, uTime * 0.12, -uTime * 0.07);
  float n = noise(q) * 0.6 + noise(q * 2.3 + 4.1) * 0.3 + noise(q * 5.1 - 2.7) * 0.1;
  if (uPaper > 0.5) {
    // светлый фон: жемчужная сфера, светлый центр, серый край, тонкая грануляция
    float limb = 1.0 - mix(0.46, 0.34, uHeat) * (1.0 - mu) - 0.12 * pow(1.0 - mu, 3.0);
    vec3 core = mix(vec3(0.95, 0.94, 0.925), vec3(1.0), uHeat);
    float fine = noise(vP * 11.0 + vec3(uSeed, uTime * 0.12, 0.0));
    vec3 c = core * limb * (1.0 + (fine - 0.5) * 0.05 * smoothstep(0.0, 0.6, mu));
    gl_FragColor = vec4(c, 1.0);
    return;
  }
  // чёрный фон: потемнение к краю (у холодной сильнее) + грануляция
  float limb = 1.0 - mix(0.74, 0.34, uHeat) * (1.0 - mu);
  vec3 core = mix(vec3(0.97, 0.92, 0.87), vec3(1.0), uHeat);     // чуть тёплый серый → белый
  vec3 c = core * limb * (1.0 + (n - 0.5) * mix(0.12, 0.07, uHeat) * smoothstep(0.1, 0.7, mu));
  c *= uB;
  gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);
}`;
export function makeStar({ paper = false, seed = 0 } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uHeat: { value: 0 }, uB: { value: 1 }, uTime: { value: 0 }, uPaper: { value: paper ? 1 : 0 }, uSeed: { value: seed } },
    vertexShader: STAR_VS, fragmentShader: STAR_FS,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat);
  m.set = ({ heat = 0, b = 1, t = 0 }) => { mat.uniforms.uHeat.value = heat; mat.uniforms.uB.value = b; mat.uniforms.uTime.value = t; };
  return m;
}

// ---------- 2D: свечение ----------
// мягкое свечение (аддитивно, для чёрного фона); warm 0..1 — лёгкий тёплый серый оттенок
export function glow(x, y, R, a = .5, warm = 0) {
  const g = ctx(); if (a <= .003 || R <= 1) return;
  const r = 255, gg = Math.round(255 - 26 * warm), b = Math.round(255 - 44 * warm);
  const c = (al) => `rgba(${r},${gg},${b},${al})`;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(a, 0, 1);
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, c(1)); gr.addColorStop(.18, c(.55)); gr.addColorStop(.45, c(.14)); gr.addColorStop(1, c(0));
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// корона звезды: свечение, начинающееся от края диска (rs — экранный радиус), с плавным спадом
export function corona(x, y, rs, k, a = 1, warm = 0) {
  const g = ctx(); if (a <= .003) return;
  const R = rs * (1.25 + 1.9 * k);
  const r = 255, gg = Math.round(255 - 26 * warm), b = Math.round(255 - 44 * warm);
  const c = (al) => `rgba(${r},${gg},${b},${al})`;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(a, 0, 1);
  const gr = g.createRadialGradient(x, y, rs * 1.005, x, y, R);
  gr.addColorStop(0, c(.3 * (.3 + .7 * k))); gr.addColorStop(.12, c(.22 * (.3 + .7 * k))); gr.addColorStop(.4, c(.07 * (.3 + .7 * k))); gr.addColorStop(1, c(0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, TAU); g.arc(x, y, rs * 1.005, 0, TAU, true); g.fill(); g.restore();
}

// ---------- 2D: фотоны (точки, бегущие от звезды; их число ∝ мощности) ----------
// n — сколько потоков видно сейчас (можно дробное: последний проявляется); L — длина пробега в px;
// rate — сколько пробегов в секунду; clipY — ниже этой линии точки не рисуются (зона субтитров)
const PH = (() => { const r = rng(1607), a = []; for (let i = 0; i < 400; i++) a.push({ th: r() * TAU, ph: r(), sp: .75 + .5 * r(), sz: .7 + .6 * r() }); return a; })();
export function photons(x, y, rs, n, t, { L = 260, rate = .55, a = 1, col = '#FFFFFF', size = 3.2, off = 0, clipY = 1300, minY = 0 } = {}) {
  const g = ctx(); if (a <= .003 || n <= 0) return;
  g.save(); g.fillStyle = col;
  const N = Math.ceil(n);
  for (let i = 0; i < N; i++) {
    const p = PH[(i * 7 + off) % PH.length];
    // равномерные углы (золотое сечение) с небольшим разбросом: поток читается как ровное излучение во все стороны
    const th = (i * 2.399963 + off) + (p.th - Math.PI) * .08;
    const age = ((t * rate * p.sp + p.ph) % 1 + 1) % 1;
    const r = rs * 1.08 + age * L;
    const px = x + Math.cos(th) * r, py = y + Math.sin(th) * r;
    if (py > clipY || py < minY) continue;
    const fadeIn = clamp(age / .12), fadeOut = 1 - smooth((age - .55) / .45);
    const last = i === N - 1 ? n - (N - 1) : 1;
    const al = a * fadeIn * fadeOut * last;
    if (al <= .01) continue;
    g.globalAlpha = al;
    g.beginPath(); g.arc(px, py, size * p.sz, 0, TAU); g.fill();
  }
  g.restore();
}
// кольца излучения для светлого фона: тонкие окружности расходятся от диска (их частота ∝ мощности)
export function rays(x, y, rs, rate, t, { L = 220, a = 1, col = '#1D1D1F', lw = 2, clipY = 1300 } = {}) {
  const g = ctx(); if (a <= .003 || rate <= 0) return;
  g.save(); g.beginPath(); g.rect(0, 0, 1080, clipY); g.clip();
  g.strokeStyle = col; g.lineWidth = lw;
  const per = 1 / rate, span = 1.6;           // каждое кольцо живёт span секунд
  const k0 = Math.floor((t - span) / per), k1 = Math.floor(t / per);
  for (let k = k0; k <= k1; k++) {
    const age = (t - k * per) / span;
    if (age < 0 || age > 1) continue;
    const r = rs * 1.06 + age * L;
    g.globalAlpha = a * .55 * clamp(age / .08) * (1 - smooth((age - .3) / .7));
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  }
  g.restore();
}

// ---------- 2D: текст ----------
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = measure(' ', size, w, track), wd = ws.map(q => measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}
// строка из кусков разного цвета, каждый кусок со своим временем появления: [[текст, цвет, t0], …]
// «⁴» — знак степени закона: как «³» у канала, набирается акцентом (цвет передаётся явно)
export function segText(parts, x, y, t, o = {}) {
  const { size = 96, w = 600, track = -.025, align = 'center' } = o;
  const ws = parts.map(p => measure(p[0], size, w, track)), tot = ws.reduce((A, B) => A + B, 0);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
  parts.forEach((p, i) => { atext(p[0], cx, y, p[2], t, { ...o, size, w, track, col: p[1], align: 'left', a: (o.a ?? 1) * (p[3] ?? 1) }); cx += ws[i]; });
}
export function dim(x1, y1, x2, y2, a, col, tick = 12) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
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

// =====================================================================================================
// Конфорка: керамическая плита (чёрное стекло) + спираль-ТЭН на алюминиевой чаше.
// set(glow 0..1, white 0..1): спираль от графита → тусклое тёплое серое свечение → белое
// =====================================================================================================
export const COIL = { R: 1.05, r0: .2, turns: 4.25, tube: .052, Y: .2 };
export function makeStove() {
  const grp = new THREE.Group();
  const slab = new THREE.Mesh(rbox(4.6, .16, 3.4, .05), new THREE.MeshPhysicalMaterial({ color: '#0E0E10', roughness: .22, clearcoat: 1, clearcoatRoughness: .06 }));
  slab.position.y = .08; slab.receiveShadow = true;
  // чаша под спиралью
  const panM = new THREE.MeshPhysicalMaterial({ color: '#56585C', roughness: .6, metalness: .5, clearcoat: .15, clearcoatRoughness: .5, side: THREE.DoubleSide });
  const pts = [];
  for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(new THREE.Vector2(lerp(.05, 1.36, u), .162 + .07 * smooth((u - .7) / .3) + .004)); }
  const pan = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), panM); pan.receiveShadow = true;
  // спираль (плоская архимедова) — одна трубка
  const N = 360, sp = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = u * COIL.turns * TAU, r = lerp(COIL.r0, COIL.R, u);
    sp.push(new THREE.Vector3(Math.cos(a) * r, COIL.Y, Math.sin(a) * r));
  }
  const curve = new THREE.CatmullRomCurve3(sp);
  const coilM = new THREE.MeshPhysicalMaterial({ color: '#3A3A3C', roughness: .42, metalness: .3, clearcoat: .3, emissive: '#000000' });
  const coil = new THREE.Mesh(new THREE.TubeGeometry(curve, 720, COIL.tube, 10, false), coilM);
  coil.castShadow = true;
  // концы спирали уходят в контактный блок
  const blockM = new THREE.MeshPhysicalMaterial({ color: '#C9CBCF', roughness: .35, metalness: .3, clearcoat: .5 });
  const block = new THREE.Mesh(rbox(.34, .14, .22, .03), blockM);
  block.position.set(COIL.R + .22, COIL.Y, 0); block.castShadow = true;
  // ручка-регулятор
  const knob = new THREE.Group();
  const kb = new THREE.Mesh(new THREE.CylinderGeometry(.19, .2, .14, 40), blockM); kb.position.y = .07;
  const kt = new THREE.Mesh(new THREE.BoxGeometry(.04, .02, .2), new THREE.MeshBasicMaterial({ color: '#1D1D1F' })); kt.position.set(0, .145, -.06);
  knob.add(kb, kt); knob.position.set(1.8, .16, -1.1);
  const light = new THREE.PointLight('#ffffff', 0, 6, 2); light.position.set(0, .75, 0);
  grp.add(slab, pan, coil, block, knob, light);
  const cold = new THREE.Color('#3A3A3C'), warm = new THREE.Color('#9A8E86'), white = new THREE.Color('#FFFFFF');
  const _c = new THREE.Color();
  grp.set = ({ glow = 0, white: wh = 0, knobA = 0 }) => {
    // эмиссия: от тусклого тёплого серого к белому
    _c.copy(warm).lerp(white, wh);
    coilM.emissive.copy(_c).multiplyScalar(glow);
    coilM.color.copy(cold).lerp(white, glow * .5);
    light.intensity = glow * 2.2;
    light.color.copy(_c);
    knob.rotation.y = -knobA;
  };
  return grp;
}

// ---------- плитки: керамические квадраты для «2 → 4 → 8 → 16» ----------
export const TILE = { S: .86, G: 1.0, H: .14 };
// положение плитки i в раскладке на n штук (2: 2×1, 4: 2×2, 8: 4×2, 16: 4×4), центр в (0, 0)
export function tileSlot(i, n) {
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 4, rows = Math.ceil(n / cols);
  const c = i % cols, r = Math.floor(i / cols);
  return [(c - (cols - 1) / 2) * TILE.G, (r - (rows - 1) / 2) * TILE.G];
}
export { rng };
