// OUTRO (≈41.5 – 50.0 с), чёрный фон.
// o1 — та же машина-керамика на медленной орбите доскальзывает до остановки, за колёсами — следы торможения,
//      горят стоп-сигналы, контровой блик едет вдоль кузова; «×2 скорость» белым и «×4 тормозной путь» красным;
// o2 — финальная карточка как в a1: «Тормозной путь» (по словам, белым), «d ∝ v²» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «рулём».
import { defineScene, makeStage, project, atext, atextWords, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeCar, frame, pill, glow, brakeLights, makeRoad, TAIL, WR } from './kit.mjs';

function TT() {
  return {
    sk: Wd('o1', 'Скорость'), vd: Wd('o1', 'вдвое'), torm: Wd('o1', 'тормозной'), vch: Wd('o1', 'вчетверо'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'рулём'),
  };
}
const V0 = 7, A = 3.2;                                  // замедленная съёмка последних метров торможения
const XS = -3;                                          // где машина встаёт

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const road = makeRoad({ x0: -60, x1: 60, lanes: [0, 3.8], dark: true });
    road.line(0);
    const car = brakeLights(makeCar({ dark: true }));
    stage.root.add(road, car);
    return { stage, road, car, T: TT() };
  },

  update(t, s, st) {
    const { stage, road, car, T } = st, cam = stage.camera, L = stage.lights;
    // доскальзывает и встаёт к «вдвое»
    const ts = V0 / A, tau = clamp(t - (T.vd - ts), 0, ts);
    const x = XS - V0 * V0 / (2 * A) + V0 * tau - A * tau * tau / 2;
    car.position.x = x; car.spin(x / WR);
    car.brake(t < T.vd ? 1 : .6);
    road.skid(0, XS - 16, x);
    road.skid(1, 0, 0);
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.key.position.set(4, 9, 7);
    L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr; L.key.intensity = 1.9 * lk; L.hemi.intensity = .3 * lk;
    // блик: контровой свет медленно проезжает вдоль кузова
    const gp = clamp((t - s.start) / (s.end - s.start));
    L.rimR.position.set(lerp(-5, 7, eInOut(gp)), 2.5, -3);
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [XS, .7, 0], lerp(27, 31, o2) - .08 * (t - s.start), -40 + (t - s.start) * 2.4, lerp(10, 11, o2), 540, lerp(1010, 960, o2));
  },

  draw2d(t, s, st) {
    const { stage, car, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    // свечение стоп-сигналов
    const k = t < T.vd ? 1 : .6;
    for (const p of TAIL) { const [px, py] = project(cam, car.position.x + p[0], p[1], p[2]); glow(px, py, 40, .3 * k * P(t, s.start, .8)); }
    // o1: два итоговых числа
    const o1 = T.card - .15;
    atext('×2', 300, 540, T.vd, t, { size: 240, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('скорость', 300, 620, T.sk + .1, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    atext('×4', 780, 540, T.vch - .2, t, { size: 240, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('тормозной путь', 780, 620, T.torm + .1, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Тормозной', 540, 350, T.card + .15, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atextWords('путь', 540, 474, T.card + .3, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('d ∝ v²', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vd - .1, 'thud', .2, .8);
    add(T.vd, 'tick', .16, .9);
    add(T.vch - 1.7, 'riser', .18);
    add(T.vch - .2, 'chime', .3, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
