// OUTRO (o1–o2), чёрный фон. Раковина проявляется из темноты (контровые → ключ), вода спокойно крутится.
// o1 — «Вердикт» белым и огромное красное «миф» (акцент финала); на «экватор» через кадр проходит
//      пунктирная линия экватора, а вихрь в раковине не меняется;
// o2 — финальная карточка: «Сила Кориолиса» (по словам, белым), «вода в раковине: миф» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «нет».
import { defineScene, makeStage, project, atext, atextWords, line, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeBowl, makeWater, simTracers, drawTracers, sinkPoint, SINK, frame, glow, pill, smooth } from './kit.mjs';

function TT() {
  return {
    ver: Wd('o1', 'Вердикт'), mif: Wd('o1', 'миф'), rak: Wd('o1', 'Раковине'), gde: Wd('o1', 'где'), ekv: Wd('o1', 'экватор'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'нет'),
  };
}
const W0 = .4;
const omega = () => W0;

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const bowl = makeBowl(), water = makeWater();
    water.position.y = SINK.YW; water.scale.y = .3;
    stage.root.add(bowl, water);
    return { stage, water, T: TT() };
  },

  update(t, s, st) {
    const { stage, water, T } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.6 * lk; L.hemi.intensity = .5 * lk;
    water.mat.uniforms.uOp.value = P(t, s.start + .2, 1.0);
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [0, .4, 0], lerp(15.6, 16.6, o2) - .08 * (t - s.start), -14 + (t - s.start) * 2.0, lerp(40, 44, o2), 540, lerp(960, 900, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, ink = '#FFFFFF', sub = stage.sub;
    const P0 = simTracers(t, s.start - 3, omega, { N: 110, seed: 5 });
    drawTracers(cam, P0, sinkPoint([0, 0, 0], .3), { col: ink, a: .85 * P(t, s.start + .3, 1.0), lw: 2.4 });
    // o1: вердикт
    const o1 = T.card - .35;
    atext('Вердикт', 540, 330, T.ver - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: o1 });
    atext('миф', 540, 600, T.mif - .05, t, { size: 280, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: o1 });
    // экватор проходит через кадр, вихрь не меняется
    const eA = P(t, T.ekv - .1, .6) * (1 - P(t, o1, .35, eIn));
    if (eA > .003) {
      const [, cy] = project(cam, 0, SINK.YW, 0), x1 = lerp(80, 1000, P(t, T.ekv - .15, .7, eInOut));
      line(80, cy, x1, cy, ink, eA * .6, 2, [10, 10]);
      atext('экватор', 96, cy - 22, T.ekv, t, { size: 38, w: 500, col: sub, align: 'left', track: 0, out: o1 });
    }
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Сила Кориолиса', 540, 380, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('вода в раковине: миф', 540, 480, T.card + .5, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.ver, 'tick', .16, .9);
    add(T.mif - 1.5, 'riser', .2);
    add(T.mif, 'impact', .36, .9);
    add(T.ekv, 'whoosh', .2, 1.1);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
