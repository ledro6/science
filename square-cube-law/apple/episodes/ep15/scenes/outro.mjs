// OUTRO (39,2 – 48,8 с), чёрный фон.
// o1 — лестница с номерами мест выходит из темноты, свет медленно обходит её; крупно в четыре строки
//      «Первое вдвое / больше второго / и вдесятеро / больше десятого»; на «второго» ярче места 1 и 2, на «десятого» — 1 и 10.
// o2 — финальная карточка: «Закон Ципфа» (по словам, белым), серым «f ∝ 1 / r», красная пилюля «Подписаться на L³»
//      с нажатием на «природы»; лестница отходит под карточку.
import { defineScene, makeStage, project, atext, atextWords, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeStair, frame, glow, pill, NB } from './kit.mjs';

function TT() {
  return {
    perv: Wd('o1', 'Первое'), bol: Wd('o1', 'больше'), vtor: Wd('o1', 'второго'), i: Wd('o1', 'и'), bol2: Wd('o1', 'больше', 1),
    des: Wd('o1', 'десятого'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const stair = makeStair();
    stage.root.add(stair.grp);
    return { stage, T: TT(), stair };
  },

  update(t, s, st) {
    const { stage, T, stair } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.0), lk = P(t, s.start + .3, 1.3);
    const la = (t - s.start) * .25 - .7;
    L.key.position.set(6 * Math.sin(la), 9, 6 * Math.cos(la) + 2);
    L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    const f2 = P(t, T.vtor - .1, .5) * (1 - P(t, T.i, .4)), f10 = P(t, T.des - .1, .5) * (1 - P(t, T.card - .3, .6));
    for (let i = 0; i < NB; i++) {
      let foc = 1;
      if (i > 1) foc = lerp(foc, .4, f2);
      if (i > 0 && i < 9) foc = Math.min(foc, lerp(1, .4, f10));
      stair.set(i, { grow: 1, bright: foc * lerp(.15, 1, lk), glyph: 1 });
    }
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [0, 2.4, 0], lerp(38, 42, o2) - .12 * (t - s.start), 14 - (t - s.start) * 1.5, lerp(10, 12, o2), 540, lerp(990, 880, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy + 30, 520, .05 * P(t, s.start + .2, 1));
    const o1 = T.card - .35;
    const hd = { size: 96, w: 600, col: ink, track: -.03, out: o1 };
    atextWords('Первое вдвое', 540, 290, T.perv - .05, t, { ...hd, stagger: .3 });
    atextWords('больше второго', 540, 392, T.bol - .05, t, { ...hd, stagger: .25 });
    atextWords('и вдесятеро', 540, 515, T.i - .05, t, { ...hd, stagger: .06 });
    atextWords('больше десятого', 540, 617, T.bol2 - .05, t, { ...hd, stagger: .3 });
    if (t > T.card - .1) {
      atextWords('Закон Ципфа', 540, 380, T.card + .05, t, { size: 104, w: 600, col: ink, track: -.035, stagger: .12 });
      atext('f ∝ 1 / r', 540, 485, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vtor, 'tick', .16, .95);
    add(T.des, 'chime', .22, 1.0);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
