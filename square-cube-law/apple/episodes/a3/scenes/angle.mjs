// ANGLE (≈32.7 – 44.0 с), светлый фон. Крупно — шарик на алюминиевой шайбе (графитовая керамика), вид сбоку;
// справа — векторная схема.
// g1 — «Для всего в салоне»: шарик проявляется (нитка вертикально); «работает» — стрелка g вниз;
//      «дополнительная тяжесть, направленная назад» — заголовок «Тяжесть разгона», стрелка назад, сумма пунктиром.
// g2 — «сотню за десять секунд» — «0→100 за 10 с» и «a ≈ 0,28 g» (длины стрелок в честном масштабе);
//      «наклонится вперёд» — нитка ложится против суммарной тяжести, через точку крепления — пунктир вертикали
//      и линия суммы; «шестнадцать градусов» — дуга угла и огромное красное «16°» (главный акцент выпуска).
import { defineScene, makeStage, project, atext, acount, line, dot, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, frame, makeBalloon, arrow, THETA, A_CAR, G } from './kit.mjs';

const AX = 330, AY = 1210;                     // точка крепления нитки в кадре
const OX = 830, OY = 560, GL = 300;            // начало схемы, длина g в px
function TT() {
  return {
    dlya: Wd('g1', 'Для'), rab: Wd('g1', 'работает'), dop: Wd('g1', 'дополнительная'), tyazh: Wd('g1', 'тяжесть'), napr: Wd('g1', 'направленная'), naz: Wd('g1', 'назад'),
    esli: Wd('g2', 'Если'), sot: Wd('g2', 'сотню'), sek: Wd('g2', 'секунд'), nit: Wd('g2', 'нитка'), nakl: Wd('g2', 'наклонится'), vper: Wd('g2', 'вперёд'),
    shest: Wd('g2', 'шестнадцать'), grad: Wd('g2', 'градусов'),
  };
}

defineScene('angle', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    const T = TT();
    const g = new THREE.Group();
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(.2, .22, .07, 48), MAT.aluminium()); puck.position.y = .035;
    const bm = MAT.ceramicBlack(); bm.color.set('#2C2C2E');
    const bal = makeBalloon({ L: .82, R: .34, mat: bm, string: new THREE.MeshStandardMaterial({ color: '#6E6E73', roughness: .5 }) }); bal.position.y = .07;
    g.add(puck, bal);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    stage.root.add(g);
    return { stage, T, g, bal };
  },

  update(t, s, st) {
    const { stage, T, g, bal } = st, cam = stage.camera, L = stage.lights;
    const p = P(t, T.dlya - .2, .9);
    g.scale.setScalar(Math.max(1e-3, lerp(.92, 1, p)));
    g.position.y = (1 - p) * .1;
    bal.pose(THETA * P(t, T.nakl - .1, 1.2, eInOut));
    L.key.position.set(3, 9, 7); L.key.target.position.set(0, .6, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.1; L.hemi.intensity = 1.15;
    frame(cam, [0, 0, 0], lerp(12, 11.4, clamp((t - s.start) / (s.end - s.start))), lerp(-4, 4, eInOut(clamp((t - s.start) / (s.end - s.start)))), 4, AX, AY);
  },

  draw2d(t, s, st) {
    const { stage, T, bal } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    const [ax, ay] = project(cam, 0, .07, 0);
    const th = -bal.rotation.z;
    const [bx, by] = project(cam, Math.sin(th) * bal.top, .07 + Math.cos(th) * bal.top, 0);
    // ---- векторная схема ----
    const aL = GL * A_CAR / G;                                  // ≈ 85 px
    const pg = P(t, T.rab - .05, .8, eInOut), pa = P(t, T.napr - .1, T.naz - T.napr + .5, eInOut), ps = P(t, T.naz + .3, .9, eInOut);
    if (pg > .003) {
      arrow(OX, OY, OX, OY + GL * pg, ink, P(t, T.rab - .05, .3), 4, 18);
      atext('g', OX + 26, OY + GL * .55, T.rab + .1, t, { size: 52, w: 600, col: ink, align: 'left', track: 0, dy: 12 });
    }
    if (pa > .003) {
      arrow(OX, OY + GL, OX - aL * pa, OY + GL, ink, P(t, T.napr - .1, .3), 4, 16);
      atext('разгон', OX - aL / 2, OY + GL + 56, T.naz - .1, t, { size: 34, w: 500, col: sub, track: 0, dy: 10 });
    }
    if (ps > .003) {
      const ex = OX - aL * ps, ey = OY + GL * ps;
      line(OX, OY, ex, ey, ink, .9, 3, [10, 9]);
      if (ps > .9) arrow(ex + (aL / GL) * 20, ey - 20, ex, ey, ink, P(t, T.naz + 1.1, .3), 3, 14);
      atext('вместе', OX - aL / 2 - 22, OY + GL * .55, T.naz + .6, t, { size: 34, w: 500, col: sub, align: 'right', track: 0, dy: 10 });
    }
    // ---- у точки крепления: вертикаль, линия суммы, дуга ----
    const pv = P(t, T.nit - .1, .6);
    const R = 190;
    if (pv > .003) {
      line(ax, ay, ax, ay - (R + 110) * pv, sub, .9, 2, [8, 9]);
    }
    const pArc = P(t, T.nakl + .2, 1.1, eInOut);
    if (pArc > .003) {
      const a0 = -Math.PI / 2, a1 = Math.atan2(by - ay, bx - ax);
      g.save(); g.globalAlpha = pArc; g.strokeStyle = red; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.arc(ax, ay, R, a0, lerp(a0, a1, pArc)); g.stroke(); g.restore();
    }
    // ---- заголовки ----
    atext('Тяжесть разгона', 540, 340, T.dop - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: T.esli - .2 });
    atext('направлена назад', 540, 410, T.napr, t, { size: 44, w: 500, col: sub, track: -.005, out: T.esli - .2 });
    atext('0→100 км/ч за 10 с', 540, 340, T.sot - .05, t, { size: 76, w: 600, col: ink, track: -.03 });
    atext('a ≈ 0,28 g', 540, 410, T.sek, t, { size: 44, w: 500, col: sub, track: -.005 });
    // главный акцент: 16°
    acount(16, 700, 1150, T.shest - .05, t, { size: 260, w: 700, col: red, suffix: '°', dur: 1.0 });
    atext('наклон нитки', 700, 1216, T.grad, t, { size: 40, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(T.dlya, 'thud', .16, .9);
    add(T.rab, 'tick', .14, .9);
    add(T.napr, 'whoosh', .16, .8);
    add(T.naz + .3, 'click', .16, 1.0);
    add(T.sot, 'tick', .14, 1.0);
    add(T.nakl, 'swell', .16, .8);
    add(T.shest - 1.5, 'riser', .22);
    add(T.shest, 'impact', .4, .9);
    add(T.shest + .1, 'chime', .26, 1.0);
  },
});
