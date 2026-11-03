// RECORD (29.29 – 35.48 с), чёрный фон. Рекордное вращение: фигуристка с прижатыми руками крутится
// на 308 об/мин (5,13 об/с) со шлейфом. Камера медленно поднимается краном от уровня льда почти в зенит:
// фигура превращается в «волчок», вокруг — следы лезвия и кистей. Свет обходит фигуру по кругу.
// r1 — «Рекорд на коньках» серым; счётчик 0 → 308 «оборотов в минуту»; на «больше» — «> 5 оборотов в секунду».
import { defineScene, makeStage, project, atext, acount, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeSpinner, makeIce, spinAngle, frame, handTrail, glow, fadeBelow, TAU } from './kit.mjs';

const OM = 308 / 60;
function TT() {
  return {
    rek: Wd('r1', 'Рекорд'), kon: Wd('r1', 'коньках'), tr: Wd('r1', 'триста'), min: Wd('r1', 'минуту'),
    eto: Wd('r1', 'Это'), bol: Wd('r1', 'больше'), pyat: Wd('r1', 'пяти'), sek: Wd('r1', 'секунду'),
  };
}
const craneAt = (t, s) => P(t, s.start + .3, 5.4, eInOut);

defineScene('record', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const ice = makeIce(stage);
    const sk = makeSpinner(stage, { ghosts: 4 });
    stage.root.add(ice, sk);
    return { stage, T: TT(), ice, sk };
  },

  update(t, s, st) {
    const { stage, ice, sk } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, s.start, 1.0);
    // ключ обходит фигуру — блик бежит по керамике
    const la = (t - s.start) * .9;
    L.key.position.set(7 * Math.sin(la), 9, 7 * Math.cos(la));
    L.key.intensity = 2.5 * lit; L.hemi.intensity = .5 * lit; L.rimL.intensity = 3.2 * lit; L.rimR.intensity = 2.4 * lit;
    ice.fade(lit);
    sk.set(TAU * OM * (t - s.start) + 1.1, OM, 1, 1, 1);
    const c = craneAt(t, s);
    ice.mirror.material.opacity = lerp(.88, .975, c);
    frame(cam, [0, lerp(.95, .8, c), 0], lerp(11, 7.6, c), 20 + (t - s.start) * 2, lerp(6, 62, c), 540, lerp(975, 990, c));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const ang = TAU * OM * (t - s.start) + 1.1;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy, 200, .12 * P(t, s.start, 1));
    [1, -1].forEach(side => handTrail(cam, 1, side, ang, OM, { dt: .11, alpha: .8 * P(t, s.start + .2, .6), lw: 3.5 }));
    // отражение гаснет, пока камера низко; в зените отражения почти нет
    fadeBelow(fy + 10, 440, '0,0,0', 1 - craneAt(t, s));
    atext('Рекорд', 540, 430, T.rek - .05, t, { size: 120, w: 600, col: ink, track: -.03, out: T.tr - .3 });
    atext('на коньках', 540, 510, T.kon - .05, t, { size: 50, w: 500, col: sub, track: -.005, out: T.tr - .3 });
    const oA = T.eto - .1;
    acount(308, 540, 470, T.tr + .05, t, { size: 230, w: 700, col: ink, dur: 1.3, out: oA });
    atext('оборотов в минуту', 540, 548, T.min - .25, t, { size: 48, w: 500, col: sub, track: -.005, out: oA });
    atext('> 5', 540, 470, T.bol - .05, t, { size: 230, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('оборотов в секунду', 540, 548, T.pyat, t, { size: 48, w: 500, col: sub, track: -.005 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .3, 'swell', .22, .8);
    add(T.rek, 'tick', .12, 1);
    add(T.tr, 'chime', .24, .9);
    add(T.bol, 'chime', .2, 1.1);
  },
});
