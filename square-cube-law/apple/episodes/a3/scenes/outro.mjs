// OUTRO (≈44.0 – 52.0 с), чёрный фон.
// o1 — та же машина в разрезе на медленной орбите продолжает разгоняться: груз отклонён назад, шарик вперёд;
//      «Всё в салоне назад» и «гелий вперёд» крупно белым;
// o2 — финальная карточка как в a2: «Давление при ускорении» (по словам, белым), «a ≈ 0,28 g» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «рулём».
import { defineScene, makeStage, atext, atextWords, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { frame, pill, makeRoad, makeCutCar, makeDrive, A_CAR, THETA, WR } from './kit.mjs';

function TT() {
  return {
    vse: Wd('o1', 'Всё'), naz: Wd('o1', 'назад'), gel: Wd('o1', 'гелий'), vper: Wd('o1', 'вперёд'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'рулём'),
  };
}

defineScene('outro', {
  setup(s) {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const road = makeRoad({ x0: -40, x1: 260, lanes: [0, 3.8], dark: true });
    road.line(0);
    const car = makeCutCar({ dark: true });
    car.pend.pose(THETA); car.balloon.pose(THETA);
    stage.root.add(road, car);
    return { stage, road, car, T: TT(), drive: makeDrive(() => A_CAR, s.start, s.end + 1, 8) };
  },

  update(t, s, st) {
    const { stage, car, T, drive } = st, cam = stage.camera, L = stage.lights;
    const x = drive.x(t);
    car.position.x = x; car.spin(x / WR);
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.key.position.set(x + 4, 9, 7); L.key.target.position.set(x, 0, 0); L.key.target.updateMatrixWorld();
    L.rimL.position.set(x - 6, 3, -5);
    L.rimL.intensity = 3.4 * lr; L.key.intensity = 2.2 * lk; L.hemi.intensity = .4 * lk;
    // блик: контровой свет медленно проезжает вдоль кузова
    const gp = clamp((t - s.start) / (s.end - s.start));
    L.rimR.position.set(x + lerp(-5, 7, eInOut(gp)), 2.5, -3); L.rimR.intensity = 2.6 * lr;
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [x - .2, .8, 0], lerp(21, 25, o2) - .1 * (t - s.start), 26 - (t - s.start) * 2.2, lerp(7, 9, o2), 540, lerp(1000, 860, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st;
    const ink = '#FFFFFF', sub = stage.sub;
    const o1 = T.card - .15;
    atext('Всё назад', 540, 400, T.naz - .1, t, { size: 120, w: 600, col: ink, track: -.035, out: o1 });
    atext('гелий вперёд', 540, 540, T.gel - .05, t, { size: 120, w: 600, col: ink, track: -.035, out: o1 });
    if (t > T.card - .1) {
      atextWords('Давление', 540, 350, T.card + .15, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atextWords('при ускорении', 540, 474, T.card + .3, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('a ≈ 0,28 g', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.naz - .1, 'thud', .18, .8);
    add(T.gel, 'tick', .16, 1.0);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
