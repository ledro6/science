// Общие детали выпуска m3 («Миф или нет: эффект Мпембы»): модели — в glassware.mjs (без движка, их берёт и hero.mjs),
// здесь — сборка под движок, камера-кадр и 2D-помощники (как в m1/m2 kit.mjs) и красная пилюля.
// Не сцена: импортируется сценами выпуска.
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, lerp, FONT, line, atext } from '../../../engine.mjs';
import * as GW from './glassware.mjs';
export { GLASS, FREEZER, innerR } from './glassware.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const makeGlass = o => GW.makeGlass(THREE, o);
export const makeSteam = o => GW.makeSteam(THREE, o);
export const makeBubbles = o => GW.makeBubbles(THREE, o);
export const makeThermo = o => GW.makeThermo(THREE, o);
export const makeFreezer = o => GW.makeFreezer(THREE, o);
export const makeCup = () => GW.makeCup(THREE);
export const slab = (...a) => GW.slab(THREE, ...a);

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
// тень ключевого света на крупную сцену
export function wideShadow(stage, R = 8, k = 1.6, map = 1024) {
  const key = stage.lights.key;
  key.position.multiplyScalar(k); key.shadow.mapSize.set(map, map);
  const sc = key.shadow.camera; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 60;
  sc.updateProjectionMatrix();
}
export const fit = (s, size, w = 600, max = 900, track = -.03) => Math.min(size, size * max / ENG.measure(s, size, w, track));

// ---------- 2D ----------
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
// ломаная, проявляющаяся слева направо (p — доля длины)
export function poly(pts, col, a = 1, lw = 3, p = 1, dash = null) {
  const g = ctx(); if (a <= .003 || p <= 0 || pts.length < 2) return null;
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rest = L * clamp(p), end = pts[0];
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) {
    if (rest >= seg[i - 1]) { g.lineTo(...pts[i]); rest -= seg[i - 1]; end = pts[i]; }
    else { const k = rest / seg[i - 1]; end = [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; g.lineTo(...end); break; }
  }
  g.stroke(); g.restore();
  return end;
}
// 3D-окружность в горизонтальной плоскости (y = const) → 2D-ломаная
export function ring3(cam, c, r, y, col, a = 1, lw = 2, dash = null, n = 72) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const q = i / n * TAU; pts.push(ENG.project(cam, c[0] + r * Math.cos(q), y, c[2] + r * Math.sin(q))); }
  return poly(pts, col, a, lw, 1, dash);
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
