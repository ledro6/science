// Общие детали выпуска № 18 (нормальное распределение): доска Гальтона.
// Стоит на полу: алюминиевая рама, тёмная (или светлая) задняя панель, стеклянная передняя панель с рёбрами,
// сверху воронка, двенадцать рядов алюминиевых гвоздей треугольником, внизу тринадцать ячеек.
// Стальные шарики — InstancedMesh; детерминированная симуляция из rng(seed): у каждого шарика заранее
// выбраны 12 отскоков влево/вправо и место в стопке своей ячейки; положение — чистая функция времени.
// Не сцена: импортируется сценами выпуска и обложкой (hero.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, lerp, rng, FONT, atext, line } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// ---------- раскладка доски ----------
export const ROWS = 12;               // ряды гвоздей
export const NBIN = ROWS + 1;         // ячейки
export const DX = .3;                 // шаг гвоздей по x (= ширина ячейки)
export const DY = .25;                // шаг рядов
export const RB = .046;               // радиус шарика
export const RP = .034;               // радиус гвоздя
export const BASE = .12;              // нижняя планка
export const BIN_TOP = 2.05;          // верх перегородок ячеек
export const Y_LAST = 2.38;           // последний ряд гвоздей
export const Y_TOP = Y_LAST + (ROWS - 1) * DY;   // первый (верхний) гвоздь
export const Y_NECK = Y_TOP + .3;     // горлышко воронки
export const Y_FUN = Y_NECK + .62;    // верх воронки
export const H_BOARD = Y_FUN + .26;   // верх рамы
export const HALF_W = NBIN * DX / 2 + .02;   // внутренняя полуширина
export const ZG = .085;               // половина зазора между панелями
export const LAYER = .09;             // шаг слоя в стопке
export const binX = k => (k - ROWS / 2) * DX;
export const pegX = (r, j) => (j - r / 2) * DX;
export const pegY = r => Y_TOP - r * DY;
export const slotPos = (k, j) => {
  const L = Math.floor(j / 3), c = j % 3, jit = ((L * 7 + k * 3) % 5 - 2) * .004;
  return [binX(k) + (c - 1) * .093 + (L % 2 ? .006 : -.006) + jit, BASE + RB + .004 + L * LAYER];
};
export const binHeight = n => n <= 0 ? 0 : Math.floor((n - 1) / 3) * LAYER + 2 * RB;   // высота стопки из n шариков
// биномиальные вероятности ячеек (p = 1/2)
export const PB = (() => { const a = [1]; for (let r = 0; r < ROWS; r++) { const b = [1]; for (let i = 1; i <= r; i++) b.push(a[i - 1] + a[i]); b.push(1); a.splice(0, a.length, ...b); } return a.map(v => v / 2 ** ROWS); })();

// кривая-колокол по ожидаемым стопкам n шариков: высота верха стопки над x
export function bellY(x, n) {
  const sg = Math.sqrt(ROWS) / 2, u = x / DX;
  return BASE + RB + Math.max(0, n * Math.exp(-u * u / (2 * sg * sg)) / (sg * Math.sqrt(2 * Math.PI)) / 3 * LAYER - LAYER * .5);
}

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
// Столбик: основание на y = 0, высота меняется без искажения скруглений (из ep7/ep15)
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

// ---------- доска ----------
// light: светлая сцена (белая керамическая задняя панель, рёбра стекла тёмные)
export function makeBoard({ light = false } = {}) {
  const grp = new THREE.Group();
  const alu = new THREE.MeshPhysicalMaterial({ color: '#C9CBCF', roughness: .3, metalness: .25, clearcoat: .6, clearcoatRoughness: .2 });
  const panel = light
    ? new THREE.MeshPhysicalMaterial({ color: '#EDEDEF', roughness: .5, clearcoat: .2 })
    : new THREE.MeshPhysicalMaterial({ color: '#151517', roughness: .45, metalness: .1, clearcoat: .5, clearcoatRoughness: .25 });
  const mats = [alu, panel];
  const T = .1, D = 2 * ZG + .1;
  // рама: две стойки, верх, низ
  const W2 = HALF_W + T / 2;
  const side = rbox(T, H_BOARD, D, .035);
  [-1, 1].forEach(s => { const m = new THREE.Mesh(side, alu); m.position.set(s * W2, H_BOARD / 2, 0); grp.add(m); });
  const top = new THREE.Mesh(rbox(2 * W2 + T, T, D, .035), alu); top.position.set(0, H_BOARD - T / 2, 0); grp.add(top);
  const bot = new THREE.Mesh(rbox(2 * W2 + T, BASE, D + .06, .035), alu); bot.position.set(0, BASE / 2, 0); grp.add(bot);
  // задняя панель
  const back = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF_W, H_BOARD - BASE - T, .03), panel);
  back.position.set(0, BASE + (H_BOARD - BASE - T) / 2, -ZG - .015); grp.add(back);
  // стекло спереди
  const gl = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, transparent: true, opacity: light ? .1 : .07, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
  const gGeo = new THREE.BoxGeometry(2 * HALF_W, H_BOARD - BASE - T, .02);
  const glass = new THREE.Mesh(gGeo, gl); glass.position.set(0, BASE + (H_BOARD - BASE - T) / 2, ZG + .01); glass.renderOrder = 5;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(gGeo, 20), new THREE.LineBasicMaterial({ color: light ? '#1D1D1F' : '#FFFFFF', transparent: true, opacity: light ? .25 : .45 }));
  edges.position.copy(glass.position); edges.renderOrder = 6;
  grp.add(glass, edges);
  // перегородки ячеек
  const divGeo = rbox(.022, BIN_TOP - BASE, 2 * ZG, .008, 1);
  for (let b = 1; b < NBIN; b++) {
    const m = new THREE.Mesh(divGeo, alu); m.position.set(binX(b) - DX / 2, BASE + (BIN_TOP - BASE) / 2, 0); grp.add(m);
  }
  // воронка: две наклонные планки
  const fl = Math.hypot(HALF_W - .1, Y_FUN - Y_NECK);
  const fGeo = rbox(fl, .04, 2 * ZG, .015, 1);
  [-1, 1].forEach(s => {
    const m = new THREE.Mesh(fGeo, alu);
    const x0 = s * .085, x1 = s * (HALF_W - .02);
    m.position.set((x0 + x1) / 2, (Y_NECK + Y_FUN) / 2, 0);
    m.rotation.z = s * Math.atan2(Y_FUN - Y_NECK, HALF_W - .1);
    grp.add(m);
  });
  // гвозди: InstancedMesh (ось вдоль z)
  const NP = ROWS * (ROWS + 1) / 2;
  const pegs = new THREE.InstancedMesh(new THREE.CylinderGeometry(RP, RP, 2 * ZG, 16, 1), alu, NP);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let j = 0; j <= r; j++) { V.set(pegX(r, j), pegY(r), 0); M.compose(V, Q, S1); pegs.setMatrixAt(n++, M); }
  pegs.instanceMatrix.needsUpdate = true;
  grp.add(pegs);
  grp.traverse(o => { if (o.isMesh && o !== glass) { o.castShadow = true; o.receiveShadow = o !== back; } });
  back.castShadow = true;
  const B = mats.map(m => m.color.clone());
  // яркость материалов (выход из темноты)
  const setLit = k => { mats.forEach((m, i) => m.color.copy(B[i]).multiplyScalar(k)); gl.opacity = (light ? .1 : .07) * clamp(k); edges.material.opacity = (light ? .25 : .45) * clamp(k); };
  return { grp, setLit, glass, edges };
}

// ---------- путь одного шарика ----------
// bits[r] = 0 (влево) / 1 (вправо); возвращает [x, y] при времени tau с момента появления в воронке.
// o: { rowT — время на ряд, funT — путь по воронке, g — ускорение падения в ячейку, slotY — высота в стопке, x0 — где появился }
export function pathPos(bits, tau, o) {
  const { rowT = .075, funT = .32, g = 26, slotY = BASE + RB, x0 = 0, slotX = null } = o;
  const yHit = r => pegY(r) + RP + RB;
  if (tau < funT) {   // воронка: от верха к горлышку, ускоряясь
    const u = tau / funT, e = u * u;
    return [lerp(x0, 0, smooth(u)), lerp(Y_FUN - .12, yHit(0), e)];
  }
  let tt = tau - funT, k = 0;
  for (let r = 0; r < ROWS; r++) {
    if (tt < rowT) {
      const u = tt / rowT, x0r = pegX(r, k), x1 = x0r + (bits[r] ? .5 : -.5) * DX;
      const y0 = yHit(r), y1 = r < ROWS - 1 ? yHit(r + 1) : y0 - DY;
      return [lerp(x0r, x1, Math.sin(u * Math.PI / 2)), y0 + .05 * Math.sin(Math.PI * u) * (1 - u) + (y1 - y0) * u * u];
    }
    tt -= rowT; k += bits[r];
  }
  // падение в ячейку
  const xb = binX(k), y0 = yHit(ROWS - 1) - DY, h = Math.max(0, y0 - slotY), tf = Math.sqrt(2 * h / g);
  const sx = slotX == null ? xb : slotX;
  if (tt < tf) { const u = tt / tf; return [lerp(xb, sx, u * u), y0 - .5 * g * tt * tt]; }
  return [sx, slotY];
}
export const pathDur = (o = {}) => (o.funT ?? .32) + ROWS * (o.rowT ?? .075);

// ---------- шарики ----------
// Симуляция: N шариков, у каждого 12 отскоков, ячейка, место в стопке; spawn(i) — момент появления (по расписанию).
// reserve[k] — сколько мест в ячейке k уже занято (одиночные шарики сцены board).
export function makeBalls(N = 260, { seed = 18, dark = false, reserve = {} } = {}) {
  const R = rng(seed), balls = [], cnt = Array(NBIN).fill(0);
  for (let k in reserve) cnt[k] = reserve[k];
  for (let i = 0; i < N; i++) {
    const bits = []; let k = 0;
    for (let r = 0; r < ROWS; r++) { const b = R() < .5 ? 0 : 1; bits.push(b); k += b; }
    const j = cnt[k]++;
    const [sx, sy] = slotPos(k, j);
    balls.push({ bits, k, j, sx, sy, x0: (R() - .5) * 2 * (HALF_W - .35), z: (R() - .5) * .06 });
  }
  const mat = new THREE.MeshPhysicalMaterial({ color: dark ? '#5E5F64' : '#D4D6DA', roughness: .22, metalness: .45, clearcoat: 1, clearcoatRoughness: .08 });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(RB, 18, 12), mat, N);
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  const base = mat.color.clone();
  // set(t, spawn(i) → время появления, opt pathPos, lit)
  const set = (t, spawn, o = {}, lit = 1) => {
    for (let i = 0; i < N; i++) {
      const b = balls[i], tau = t - spawn(i);
      if (tau < 0) { S.set(1e-4, 1e-4, 1e-4); V.set(0, -5, 0); }
      else {
        const [x, y] = pathPos(b.bits, tau, { ...o, x0: b.x0, slotY: b.sy, slotX: b.sx });
        const sc = clamp(tau / .12);
        V.set(x, y, b.z); S.set(sc, sc, sc);
      }
      M.compose(V, Q, S); im.setMatrixAt(i, M);
    }
    im.instanceMatrix.needsUpdate = true;
    mat.color.copy(base).multiplyScalar(lit);
  };
  return { im, balls, set, cnt, N, mat };
}
// расписание: N шариков с t0 за dur, темп нарастает и затихает (p > 1 — медленнее в начале)
export const sched = (N, t0, dur, p = 1.25) => i => t0 + dur * Math.pow(i / N, 1 / p);

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

// ---------- 2D ----------
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// Пунктир/линия по экранным точкам, рисуется на долю p
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
// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs), копия из ep12/ep15 kit.mjs
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
export { atext, line };
