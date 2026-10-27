// Общие детали выпуска ep5 (закон обратных квадратов): лампа, свечение, ключи камеры, сетка на сфере.
// Не сцена — вспомогательный модуль (часть взята из ep4/kit.mjs и скопирована сюда).
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, H, MAT } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };

// Светящийся шар (без тонмаппинга — чистый белый) + точечный свет (по умолчанию с физическим затуханием 1/r²)
export function makeLamp(r = .2, light = 3, decay = 2) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), mat);
  const pl = new THREE.PointLight('#ffffff', light, 0, decay);
  grp.add(sphere, pl);
  return { grp, sphere, mat, pl };
}
export function makeBall(r, mat, seg = 40) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), mat); }

// экранный радиус шара радиуса r в точке p
export function screenR(cam, p, r) {
  const d = cam.position.distanceTo(new THREE.Vector3(...p));
  return r * H / (2 * d * Math.tan(cam.fov * Math.PI / 360));
}
// Мягкое свечение (аддитивно, для чёрного фона)
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// Камера: [t, ...значения] → интерполяция ease между ключами
export function keys(K, t, ease) {
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) {
    const a = K[i - 1], b = K[i], p = ease((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * p);
  }
  return K[K.length - 1].slice(1);
}
// Размерная линия (засечки на концах)
export function dim(x1, y1, x2, y2, a, col, tick = 12) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * tick, ny = dx / L * tick;
  ENG.line(x1, y1, x2, y2, col, a * .8, 2);
  ENG.line(x1 - nx, y1 - ny, x1 + nx, y1 + ny, col, a * .8, 2);
  ENG.line(x2 - nx, y2 - ny, x2 + nx, y2 + ny, col, a * .8, 2);
}
// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs)
export function pill(t, t0, press) {
  const g = ctx(), { P, eApple, eStd, lerp, FONT } = ENG;
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
export { MAT };
