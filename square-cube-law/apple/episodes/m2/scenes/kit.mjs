// Общие детали выпуска m2 («Миф или нет: бутерброд маслом вниз»): модели и физика — в toast.mjs,
// здесь — сборка под движок, тень на большие планы, камера-кадр и 2D-помощники (как в m1/kit.mjs) и красная пилюля.
// Не сцена: импортируется сценами выпуска.
import * as ENG from '../../../engine.mjs';
import { THREE, project, clamp, lerp, H, FONT, line, atext } from '../../../engine.mjs';
import * as TM from './toast.mjs';
export { TOAST, TABLE, fallSim } from './toast.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const bump = (t, c, w) => smooth(1 - Math.abs(t - c) / w);
export const makeToast = o => TM.makeToast(THREE, o);
export const makeTable = o => TM.makeTable(THREE, o);

// тень ключевого света на сцену в дециметрах (стол 7,5 дм, а при «3 м» — 30 дм)
export function wideShadow(stage, R = 14, k = 2.2) {
  const key = stage.lights.key;
  key.position.multiplyScalar(k); key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 80;
  sc.updateProjectionMatrix();
}
// копии-«след» поворота
export function ghosts(root, n, op = .22) {
  const arr = [];
  for (let i = 0; i < n; i++) { const g = makeToast({ ghost: op }); g.renderOrder = 2; root.add(g); arr.push(g); }
  return arr;
}
export function place(obj, p, k = 1) { obj.position.set(p.x, p.y, 0); obj.rotation.set(0, 0, p.phi); obj.scale.setScalar(k); }
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
export function head(x, y, dx, dy, col, a = 1, lw = 3, hh = 16) {
  if (a <= .003) return;
  const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  line(x, y, x - ux * hh - uy * hh * .62, y - uy * hh + ux * hh * .62, col, a, lw);
  line(x, y, x - ux * hh + uy * hh * .62, y - uy * hh - ux * hh * .62, col, a, lw);
}
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
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = ENG.measure(' ', size, w, track), wd = ws.map(q => ENG.measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}
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

// Дуга-стрелка в вертикальной плоскости XY (z = const) вокруг c: от угла a0 до a1 (рад, + против часовой)
export function arcXY(cam, c, r, a0, a1, { col = '#FFFFFF', a = 1, lw = 3, hh = 16, n = 60 } = {}) {
  const g = ctx(); if (a <= .003 || Math.abs(a1 - a0) < .01) return;
  const pts = [];
  for (let i = 0; i <= n; i++) { const q = a0 + (a1 - a0) * i / n; pts.push(project(cam, c[0] + r * Math.cos(q), c[1] + r * Math.sin(q), c[2])); }
  g.save(); g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = lw;
  for (let i = 1; i <= n; i++) { g.globalAlpha = a * smooth(i / n * 1.8); g.beginPath(); g.moveTo(...pts[i - 1]); g.lineTo(...pts[i]); g.stroke(); }
  g.restore();
  const [x, y] = pts[n], [px, py] = pts[n - 3];
  head(x, y, x - px, y - py, col, a, lw, hh);
}
