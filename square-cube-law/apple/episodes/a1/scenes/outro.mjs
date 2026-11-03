// OUTRO (≈47.7 – 56.3 с), чёрный фон.
// o1 — машина-керамика на медленной орбите, контровой блик едет вдоль кузова, над крышей бегут линии обтекания;
//      «×2 скорость» белым и «×8 мощность» красным;
// o2 — финальная карточка: «Сопротивление воздуха» (по словам, белым), «P ∝ v³» серым (³ красная),
//      красная пилюля «Подписаться на L³» с нажатием на «рулём».
import { defineScene, makeStage, atext, atextWords, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeCar, frame, flowLine, streamPts, projPts, pill, WR } from './kit.mjs';

function TT() {
  return {
    sk: Wd('o1', 'Скорость'), vd: Wd('o1', 'вдвое'), mo: Wd('o1', 'мощность'), vos: Wd('o1', 'восемь'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'рулём'),
  };
}
const LINES = [[.8, .17], [1.25, .34], [1.8, .6]];

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const car = makeCar({ dark: true });
    stage.root.add(car);
    return { stage, car, T: TT() };
  },

  update(t, s, st) {
    const { stage, car, T } = st, cam = stage.camera, L = stage.lights;
    // свет: сначала контровые, потом ключ — объект «вырезается» из темноты
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.key.position.set(4, 9, 7);
    L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr; L.key.intensity = 1.9 * lk; L.hemi.intensity = .3 * lk;
    car.spin((t - s.start) * 5 / WR);
    // блик: контровой свет медленно проезжает вдоль кузова
    const gp = clamp((t - s.start) / (s.end - s.start));
    L.rimR.position.set(lerp(-5, 7, eInOut(gp)), 2.5, -3);
    // o2: машина опускается под карточку и чуть отдаляется
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [0, .7, 0], lerp(27, 31, o2) - .08 * (t - s.start), 40 - (t - s.start) * 2.4, lerp(8, 10, o2), 540, lerp(1010, 960, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    // линии обтекания
    const aL = P(t, s.start + .4, 1.0);
    LINES.forEach(([h, gap], i) => {
      const pts = projPts(cam, streamPts(h, gap, -6.5, 6.5, 80), .2);
      flowLine(pts, t + i * .5, 420 - i * 30, ink, aL * (.7 - i * .15), 1.8, [130 + i * 30, 90 + i * 20], .16);
    });
    // o1: два итоговых числа
    const o1 = T.card - .35;
    atext('×2', 300, 540, T.vd, t, { size: 240, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('скорость', 300, 620, T.sk + .1, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    atext('×8', 780, 540, T.vos, t, { size: 240, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('мощность', 780, 620, T.mo + .1, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Сопротивление', 540, 350, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atextWords('воздуха', 540, 474, T.card + .2, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('P ∝ v³', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vd, 'tick', .16, .9);
    add(T.vos - 1.5, 'riser', .18);
    add(T.vos, 'chime', .3, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
