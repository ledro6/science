// Общие детали выпуска m1 («Миф или нет: вода в раковине и сила Кориолиса»):
// керамическая раковина-чаша (LatheGeometry), вода с воронкой (френелевая оболочка + свет по склону),
// трассеры течения (детерминированная симуляция от начала сцены: частицы закручиваются и уходят в слив),
// монохромная Земля (из w1/kit.mjs), спирали ураганов на сфере, 2D-помощники и красная пилюля.
// Не сцена: импортируется сценами выпуска и героем обложки (hero.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, project, clamp, lerp, rng, H, FONT, line, atext } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const bump = (t, c, w) => smooth(1 - Math.abs(t - c) / w);

// ---------- раковина ----------
// Чаша-эллипсоид: внутренний радиус RI, глубина DP, дно на B0; кромка — скруглённая, снизу — ножка.
export const SINK = { RI: 1.0, DP: .52, B0: .22, RIM: .06, YW: .64 };
export const innerY = r => SINK.B0 + SINK.DP * (1 - Math.sqrt(Math.max(0, 1 - (r / SINK.RI) ** 2)));
export const waterR = (() => { const c = 1 - (SINK.YW - SINK.B0) / SINK.DP; return SINK.RI * Math.sqrt(1 - c * c); })();

export function makeBowl(mat) {
  const { RI, DP, B0, RIM } = SINK, top = B0 + DP, pts = [];
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(.002, RI * Math.sin(a)), B0 + DP * (1 - Math.cos(a)))); }
  for (let i = 1; i < 12; i++) { const a = Math.PI - i / 12 * Math.PI; pts.push(new THREE.Vector2(RI + RIM / 2 + RIM / 2 * Math.cos(a), top + RIM / 2 * Math.sin(a))); }
  const RO = RI + RIM, HO = top;
  for (let i = 0; i <= 30; i++) {
    const a = Math.PI / 2 - i / 30 * (Math.PI / 2 - .42);
    pts.push(new THREE.Vector2(RO * Math.sin(a), HO * (1 - Math.cos(a))));
  }
  const fr = RO * Math.sin(.42);
  pts.push(new THREE.Vector2(fr - .02, .02), new THREE.Vector2(fr - .04, 0), new THREE.Vector2(.002, 0));
  const geo = new THREE.LatheGeometry(pts, 96);
  const m = new THREE.Mesh(geo, mat || new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .36, clearcoat: .55, clearcoatRoughness: .22, side: THREE.DoubleSide }));
  m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  // слив: алюминиевое кольцо и тёмная решётка
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.085, .014, 12, 48), new THREE.MeshPhysicalMaterial({ color: '#C9CBCF', roughness: .25, metalness: .6, clearcoat: .6 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = B0 + .006;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.075, 40), new THREE.MeshBasicMaterial({ color: '#101012' }));
  hole.rotation.x = -Math.PI / 2; hole.position.y = B0 + .004;
  g.add(ring, hole);
  return g;
}

// Профиль воронки (свободный вихрь с ядром): 0 у края воды, вниз к центру. depth — глубина.
export const FUN = { c: .11, r0: .035 };
export const funnelY = (r, depth, R = waterR) => {
  const c2 = FUN.c * FUN.c, f = rr => c2 / (rr * rr + c2);
  return -depth * (f(r) - f(R)) / (f(FUN.r0) - f(R));
};
// Вода: Lathe по профилю единичной глубины; глубину задаём scale.y группы
export function makeWater({ R = waterR, color = '#2C2E33', base = .62, rim = .5, light = [.35, 1, .55], lit = .55 } = {}) {
  const pts = [];
  const N = 70;
  for (let i = 0; i <= N; i++) { const u = i / N, r = lerp(FUN.r0, R, u * u); pts.push(new THREE.Vector2(r, funnelY(r, 1, R))); }
  pts.push(new THREE.Vector2(FUN.r0 * .7, -1.25));
  pts.sort((a, b) => a.y - b.y);
  const geo = new THREE.LatheGeometry(pts, 96);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uBase: { value: base }, uRim: { value: rim }, uOp: { value: 1 },
      uL: { value: new THREE.Vector3(...light).normalize() }, uLit: { value: lit } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz;
        vW = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uBase, uRim, uOp, uLit; uniform vec3 uL; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; vec3 w = normalize(vW); if (!gl_FrontFacing) w = -w;
        float f = 1.0 - abs(dot(n, normalize(vV)));
        float sh = mix(1.0 - uLit, 1.0 + uLit * .6, clamp(dot(w, uL) * .5 + .5, 0.0, 1.0));
        float a = uBase + uRim * pow(f, 2.2);
        gl_FragColor = vec4(uColor * sh + vec3(pow(f, 3.0) * .25), clamp(a, 0.0, 1.0) * uOp); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 4;
  const g = new THREE.Group(); g.add(mesh); g.mat = mat;
  return g;
}

// ---------- трассеры течения ----------
// Частица на радиусе r вращается с угловой скоростью ∝ ω(t)·(r_ref² + a²)/(r² + a²) (свободный вихрь с ядром)
// и медленно уходит к сливу; дойдя до ядра — рождается заново у края. Интегрируем фиксированным шагом
// от начала сцены: результат — чистая функция t (одинаков в любом потоке рендера).
// omega(t) — обороты в секунду на r_ref (знак: + против часовой, если смотреть сверху).
export function simTracers(t, t0, omega, { N = 110, seed = 7, R = waterR * .86, rc = .07, rref = .3, core = .14, inflow = .05, dt = 1 / 60 } = {}) {
  const R0 = rng(seed), P = [];
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt(lerp(rc * rc * 4, R * R, R0())), th = R0() * TAU;
    P.push({ r, th, age: 1 + R0() * 3, k: i * 131 + 17 });
  }
  const steps = Math.max(0, Math.floor((t - t0) / dt));
  const a2 = core * core, kref = rref * rref + a2;
  const angW = (w, r) => w * kref / (r * r + a2);
  for (let s = 0; s < steps; s++) {
    const w = omega(t0 + (s + .5) * dt) * TAU, aw = Math.abs(w);
    for (const p of P) {
      p.th += angW(w, p.r) * dt;
      p.r -= inflow * aw * (rref / Math.max(p.r, .05)) * dt;
      p.age += dt * (.4 + aw * .25);
      if (p.r < rc) {
        const q = rng(p.k++); q();
        p.r = R * (.78 + .22 * q()); p.th = q() * TAU; p.age = 0;
      }
    }
  }
  const w = omega(t) * TAU;
  for (const p of P) { p.om = angW(w, p.r); p.a = smooth(p.age / .6) * smooth((p.r - rc) / .06); }
  return P;
}
// 2D-рисование трассеров: дуга-хвост позади частицы (длина ∝ скорости), проекция на поверхность воды.
// toWorld(r, th) → [x, y, z]
export function drawTracers(cam, P, toWorld, { col = '#FFFFFF', a = 1, lw = 2.4, tail = .32, min = .12, max = 1.25, n = 10, minLen = 0 } = {}) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.strokeStyle = col; g.lineCap = 'round';
  for (const p of P) {
    if (p.a <= .01) continue;
    const L = clamp(Math.abs(p.om) * tail, min, max), sg = Math.sign(p.om) || 1;
    const al = a * p.a * smooth((Math.abs(p.om) * tail - minLen) / .1 + (minLen ? 0 : 1));
    if (al <= .01) continue;
    let prev = project(cam, ...toWorld(p.r, p.th - sg * L));
    for (let i = 1; i <= n; i++) {
      const k = i / n, cur = project(cam, ...toWorld(p.r, p.th - sg * L * (1 - k)));
      g.globalAlpha = al * k * k;
      g.lineWidth = lw * lerp(.4, 1, k);
      g.beginPath(); g.moveTo(...prev); g.lineTo(...cur); g.stroke();
      prev = cur;
    }
  }
  g.restore();
}
// Точка поверхности воды раковины: (r, θ) → мир (вода в группе с позицией pos и глубиной depth)
export const sinkPoint = (pos, depth, R = waterR, lift = .006) => (r, th) => [pos[0] + r * Math.cos(th), pos[1] + SINK.YW + funnelY(r, depth, R) + lift, pos[2] - r * Math.sin(th)];

// Угол поворота: ∫ω dt от t0 (числено, фиксированный шаг) — для стрелок-«стрелок часов»
export function spin(t, t0, omega, dt = 1 / 120) {
  let a = 0; const n = Math.max(0, Math.floor((t - t0) / dt));
  for (let i = 0; i < n; i++) a += omega(t0 + (i + .5) * dt) * dt;
  return (a + omega(t) * ((t - t0) - n * dt)) * TAU;
}

// ---------- Земля (как в w1/kit.mjs: графитовый океан, алюминиевые материки) ----------
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
let EARTH = null;
export function earthTexture() {
  if (EARTH) return EARTH;
  const w = 512, h = 256, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    const lat = (.5 - (j + .5) / h) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < w; i++) {
      const lon = (i + .5) / w * TAU, x = cl * Math.cos(lon), y = sl, z = cl * Math.sin(lon);
      const n = fbm(x * 1.7 + 3.1, y * 1.7 + 1.3, z * 1.7 + 7.7, 11);
      const land = smooth((n - .515) / .03), tone = fbm(x * 5 + 1, y * 5, z * 5, 29), ice = smooth((Math.abs(lat) - 1.3) / .1);
      const v = lerp(lerp(30 + 10 * tone, 128 + 70 * (tone - .5) + 30 * smooth((n - .6) / .1), land), 196, ice);
      const k = (j * w + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = clamp(Math.round(v), 0, 255); img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  EARTH = new THREE.CanvasTexture(c); EARTH.colorSpace = THREE.SRGBColorSpace; EARTH.anisotropy = 4;
  return EARTH;
}
export function makeEarth(r = 1, seg = 48) {
  const m = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: earthTexture(), roughness: .42, metalness: .08, clearcoat: .35, clearcoatRoughness: .3 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
// точка на сфере (локально, единичная) по широте/долготе в градусах
export const ll = (lat, lon) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b)]; };
const _v = new THREE.Vector3(), _c = new THREE.Vector3();
// Точка на поверхности тела obj (радиус R) из локальной единичной точки → [x, y, z] мира и видимость
export function onBody(obj, R, p, lift = 1.01) {
  _v.set(p[0] * R * lift, p[1] * R * lift, p[2] * R * lift).applyMatrix4(obj.matrixWorld);
  return _v.toArray();
}
export function facingCam(cam, obj, wp) {
  _c.setFromMatrixPosition(obj.matrixWorld);
  const nx = wp[0] - _c.x, ny = wp[1] - _c.y, nz = wp[2] - _c.z;
  return nx * (cam.position.x - wp[0]) + ny * (cam.position.y - wp[1]) + nz * (cam.position.z - wp[2]);
}
// Кривая на сфере (массив локальных единичных точек) → 2D-линия, задняя сторона скрыта
export function sphereCurve(cam, obj, R, pts, { col = '#FFFFFF', a = 1, lw = 2, dash = null, lift = 1.01 } = {}) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); let pen = false;
  for (const p of pts) {
    const w = onBody(obj, R, p, lift);
    if (facingCam(cam, obj, w) < 0) { pen = false; continue; }
    const [x, y] = project(cam, ...w);
    pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true;
  }
  g.stroke(); g.restore();
}
export const latCircle = (lat, n = 160) => Array.from({ length: n + 1 }, (_, i) => ll(lat, i / n * 360));
// Спиральные рукава урагана на сфере: центр c (локально), угловой радиус rad, знак sgn (+1 против часовой снаружи)
// ph — фаза вращения (рад). Возвращает массив рукавов, каждый — [{p, k}] (k: 0 у края → 1 у глаза)
export function cycloneArms(c, rad, sgn, ph, { arms = 4, n = 46, wind = 2.3 } = {}) {
  const C = new THREE.Vector3(...c).normalize();
  const e1 = new THREE.Vector3(0, 1, 0).cross(C).normalize(), e2 = new THREE.Vector3().crossVectors(C, e1);
  const out = [];
  for (let a = 0; a < arms; a++) {
    const arm = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, r = rad * lerp(1, .09, k);
      const th = sgn * (ph + a * TAU / arms + wind * Math.log(rad / r));
      const p = C.clone().addScaledVector(e1, r * Math.cos(th)).addScaledVector(e2, r * Math.sin(th)).normalize();
      arm.push({ p: p.toArray(), k });
    }
    out.push(arm);
  }
  return out;
}
export function drawArms(cam, obj, R, arms, { col = '#FFFFFF', a = 1, lw = 4 } = {}) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.strokeStyle = col; g.lineCap = 'round';
  for (const arm of arms) {
    let prev = null;
    for (const { p, k } of arm) {
      const w = onBody(obj, R, p, 1.012);
      const vis = facingCam(cam, obj, w) > 0;
      const s = project(cam, ...w);
      if (prev && vis) {
        g.globalAlpha = a * Math.sin(Math.PI * clamp(k * .92 + .04)) ** .7;
        g.lineWidth = lw * lerp(.35, 1, Math.sin(Math.PI * k));
        g.beginPath(); g.moveTo(...prev); g.lineTo(...s); g.stroke();
      }
      prev = vis ? s : null;
    }
  }
  g.restore();
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
export function screenR(cam, p, r) {
  const d = cam.position.distanceTo(new THREE.Vector3(...p));
  return r * H / (2 * d * Math.tan(cam.fov * Math.PI / 360));
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
// Наконечник стрелки в точке (x, y), направленный по (dx, dy)
export function head(x, y, dx, dy, col, a = 1, lw = 3, hh = 16) {
  if (a <= .003) return;
  const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  line(x, y, x - ux * hh - uy * hh * .62, y - uy * hh + ux * hh * .62, col, a, lw);
  line(x, y, x - ux * hh + uy * hh * .62, y - uy * hh - ux * hh * .62, col, a, lw);
}
// Дуга-стрелка по 3D-окружности (центр c, радиус r, горизонтальная плоскость): от a0 до a1 (рад, + против часовой сверху)
export function ringArrow(cam, c, r, a0, a1, { col = '#FFFFFF', a = 1, lw = 3, hh = 18, n = 90, fade = true } = {}) {
  const g = ctx(); if (a <= .003 || Math.abs(a1 - a0) < .01) return;
  const pts = [];
  for (let i = 0; i <= n; i++) { const q = a0 + (a1 - a0) * i / n; pts.push(project(cam, c[0] + r * Math.cos(q), c[1], c[2] - r * Math.sin(q))); }
  g.save(); g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = lw;
  for (let i = 1; i <= n; i++) {
    g.globalAlpha = a * (fade ? smooth(i / n * 1.6) : 1);
    g.beginPath(); g.moveTo(...pts[i - 1]); g.lineTo(...pts[i]); g.stroke();
  }
  g.restore();
  const [x, y] = pts[n], [px, py] = pts[n - 3];
  head(x, y, x - px, y - py, col, a, lw, hh);
}
// Дуга-стрелка на экране (окружность x, y, R): от a0 до a1 (рад, экранные: + по часовой)
export function arcArrow(x, y, R, a0, a1, col, a = 1, lw = 3, hh = 16) {
  const g = ctx(); if (a <= .003 || Math.abs(a1 - a0) < .01) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.arc(x, y, R, Math.min(a0, a1), Math.max(a0, a1)); g.stroke(); g.restore();
  const s = Math.sign(a1 - a0), ex = x + R * Math.cos(a1), ey = y + R * Math.sin(a1);
  head(ex, ey, -Math.sin(a1) * s, Math.cos(a1) * s, col, a, lw, hh);
}
export function dim(x1, y1, x2, y2, a, col, tick = 12) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
}
export function circle(x, y, r, col, a = 1, lw = 2, dash = null, p = 1, start = -Math.PI / 2) {
  if (a <= .003 || p <= 0) return;
  const g = ctx(); g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.arc(x, y, r, start, start + TAU * clamp(p)); g.stroke(); g.restore();
}
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// Циферблат-«счётчик оборотов»: кольцо, риски, стрелка под углом ang (рад, + против часовой)
export function dial(x, y, R, ang, col, sub, a = 1) {
  if (a <= .003) return;
  const g = ctx();
  circle(x, y, R, sub, a * .55, 2);
  for (let i = 0; i < 12; i++) {
    const q = i / 12 * TAU, l = i % 3 ? 8 : 16;
    line(x + Math.cos(q) * (R - 6), y + Math.sin(q) * (R - 6), x + Math.cos(q) * (R - 6 - l), y + Math.sin(q) * (R - 6 - l), sub, a * .8, 2);
  }
  const hx = x + Math.cos(-Math.PI / 2 - ang) * (R - 26), hy = y + Math.sin(-Math.PI / 2 - ang) * (R - 26);
  line(x, y, hx, hy, col, a, 4);
  g.save(); g.globalAlpha *= a; g.fillStyle = col; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); g.restore();
}
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = ENG.measure(' ', size, w, track), wd = ws.map(q => ENG.measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}

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
