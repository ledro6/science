// OUTRO (46.86 – 55.12 с), чёрный фон.
// o1 — фигуристка на чёрном льду вращается с раскинутыми руками; на «Ближе» прижимает руки и разгоняется втрое,
//      следы кистей стягиваются к оси; крупно «Ближе к оси, / значит быстрее». Свет обходит фигуру.
// o2 — финальная карточка: «Сохранение момента импульса» (по словам, белым), «L = I · ω» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «природы»; фигура опускается под карточку.
import { defineScene, makeStage, project, atextWords, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeSpinner, makeIce, spinAngle, frame, handTrail, glow, smooth, fadeBelow, pill } from './kit.mjs';

function TT() {
  return { bl: Wd('o1', 'Ближе'), osi: Wd('o1', 'оси'), zn: Wd('o1', 'значит'), bys: Wd('o1', 'быстрее'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}
const armsAt = (t, T) => P(t, T.bl - .05, 1.1, eInOut);
const omegaAt = (t, T) => 2 / (1 - (2 / 3) * armsAt(t, T));

defineScene('outro', {
  setup(s) {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const T = TT();
    const ice = makeIce(stage);
    const sk = makeSpinner(stage);
    stage.root.add(ice, sk);
    return { stage, T, ice, sk, om: t => omegaAt(t, T) };
  },

  update(t, s, st) {
    const { stage, T, ice, sk, om } = st, cam = stage.camera, L = stage.lights;
    // сначала контровые, потом ключ — фигура «вырезается» из темноты; ключ медленно обходит её
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    const la = (t - s.start) * .35 - .4;
    L.key.position.set(7 * Math.sin(la), 9, 7 * Math.cos(la));
    L.rimL.intensity = 3.3 * lr; L.rimR.intensity = 2.5 * lr; L.key.intensity = 2.5 * lk; L.hemi.intensity = .5 * lk;
    ice.fade(lr);
    const a = armsAt(t, T), w = om(t);
    sk.set(spinAngle(om, s.start, t) + 2.2, w, a, smooth((w - 1) / 5));
    // o2: фигура опускается под карточку и отдаляется
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [0, .95, 0], lerp(11.6, 16.5, o2) - .08 * (t - s.start), -8 + (t - s.start) * 1.5, lerp(7, 9, o2), 540, lerp(905, 900, o2));
  },

  draw2d(t, s, st) {
    const { stage, T, om } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const a = armsAt(t, T), w = om(t), ang = spinAngle(om, s.start, t) + 2.2;
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    [1, -1].forEach(side => handTrail(cam, a, side, ang, w, { dt: lerp(.16, .07, a), alpha: .75 * P(t, s.start + .2, .6) * (1 - .6 * o2), lw: 3 }));
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy, 160, .1 * P(t, s.start + .2, 1));
    fadeBelow(fy + 10);
    // o1: итоговая мысль
    const o1 = T.card - .35;
    atextWords('Ближе к оси,', 540, 360, T.bl - .05, t, { size: 112, w: 600, col: ink, track: -.03, stagger: .22, out: o1 });
    atextWords('значит быстрее', 540, 480, T.zn - .05, t, { size: 112, w: 600, col: ink, track: -.03, stagger: .3, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Сохранение', 540, 350, T.card + .05, t, { size: 104, w: 600, col: ink, track: -.035, stagger: .1 });
      atextWords('момента импульса', 540, 465, T.card + .2, t, { size: 104, w: 600, col: ink, track: -.035, stagger: .1 });
      atext('L = I · ω', 540, 570, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.bl, 'whoosh', .26, 1.15);
    add(T.bys, 'chime', .24, .95);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
