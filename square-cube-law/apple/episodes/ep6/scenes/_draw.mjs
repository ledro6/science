// 2D-помощники сцен ep6 поверх 3D: линии тока по проекции, линейка, красная пилюля финала.
import * as ENG from '../../../engine.mjs';
import { THREE, project, P, lerp, eApple, eStd, FONT } from '../../../engine.mjs';
import { streamline } from './_kit.mjs';

export const ctx = () => ENG.g;
const V = new THREE.Vector3();
// точка в локальных координатах объекта → экран
export const lp = (cam, obj, x, y, z = 0) => { V.set(x, y, z); obj.localToWorld(V); return project(cam, V.x, V.y, V.z); };

// Линии тока вокруг тела в плоскости z = 0 его локальной системы. cs — значения функции тока (±),
// off — смещение штрихов (пройденный путь, чтобы штрихи «текли» и замирали вместе с телом).
export function streams(cam, obj, { cs = [-2.4, -1.5, -.85, -.42, .42, .85, 1.5, 2.4], ax = .95, ay = .42, x0 = -4.2, x1 = 3.2,
  col = '#FFFFFF', a = .5, lw = 2, dash = [26, 18], off = 0, fadeEnds = true, z = 0, warp = null } = {}) {
  const g = ctx(); if (a <= .003) return;
  obj.updateMatrixWorld();
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  cs.forEach((c, i) => {
    const pts = streamline(c, ax, ay, x0, x1, 70);
    // концы гаснут: рисуем тремя кусками с разной прозрачностью
    const segs = fadeEnds ? [[0, .18, .35], [.18, .82, 1], [.82, 1, .35]] : [[0, 1, 1]];
    for (const [u0, u1, k] of segs) {
      g.globalAlpha = a * k * (1 - .35 * Math.abs(c) / 3);
      g.setLineDash(dash); g.lineDashOffset = off + i * 13;
      g.beginPath();
      const n0 = Math.round(u0 * (pts.length - 1)), n1 = Math.round(u1 * (pts.length - 1));
      for (let j = n0; j <= n1; j++) {
        let [x, y] = pts[j];
        let zz = z;
        if (warp) [x, y, zz] = warp(x, y, z, c);
        const [sx, sy] = lp(cam, obj, x, y, zz);
        j === n0 ? g.moveTo(sx, sy) : g.lineTo(sx, sy);
      }
      g.stroke();
    }
  });
  g.restore();
}

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (outro.mjs).
export function pill(t, t0, press) {
  const g = ctx(), p = P(t, t0, .8, eApple);
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
