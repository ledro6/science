import { defineScene, makeStage, atext, atextWords, project, P, Wd, eIn, eInOut } from '../../../engine.mjs';
import { frame, keys, makeRoad, makeCutCar, collectMats, setLit, arrow, WR } from '../../a3/scenes/kit.mjs';

defineScene('hook', {
  setup(s) {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const road = makeRoad({ x0: -40, x1: 600, lanes: [0, 3.8], dark: true });
    road.line(0);
    const car = makeCutCar({ dark: true });
    car.pend.visible = false; car.balloon.visible = false;

    stage.root.add(road, car);
    const T = { car: Wd('h1', 'Машина'), speed: Wd('h1', 'сто'), meters: Wd('h1', 'двадцать'), q: Wd('h2', 'какой'), move: Wd('h1','едет'), close: Wd('h1','Это') };
    return { stage, car, T, mats: collectMats(car) };
  },
  update(t, s, { stage, car, T, mats }) {
    const x = t * (100/3.6);
    car.position.x = x; car.spin(x / WR);
    const { key, hemi, rimL, rimR } = stage.lights;
    const lr = P(t, s.start, 1.0), lk = P(t, T.car, 1.4);
    setLit(mats, .3 + .7 * lk);
    car.edges.forEach((m, i) => m.opacity = car.edgeBase[i] * lr);
    key.position.set(x+3, 9, 7); key.target.position.set(x, 0, 0); key.target.updateMatrixWorld();
    key.intensity = 2.4 * lk; hemi.intensity = .45 * lk;
    rimL.position.set(x-6, 3, -5); rimR.position.set(x+6, 2, -4);
    rimL.intensity = 3.2 * lr; rimR.intensity = 2.4 * lr;
    const [tx, ty, d, az, el, sy] = keys([
      [0, -.1, .8, 23, 14, 6, 900],
      [T.move - .25, -.1, .8, 22, 12, 5, 900],
      [T.speed + .2, .3, .95, 9.5, 6, 3, 860],
      [T.close - .05, .28, .95, 9.2, 5, 3, 860],
      [T.meters, -.3, .9, 14.5, 3, 3, 900],
      [T.q - .1, -.3, .9, 16, 2, 4, 960],
      [s.end, -.3, .9, 17, -9, 6, 980],
    ], t, eInOut);
    frame(stage.camera, [x + tx, ty, 0], d, az, el, 540, sy);
  },
  draw2d(t, s, { stage, T, car }) {
    const [ax, ay] = project(stage.camera, car.position.x + .25, 1.52, 0);
    const p = P(t, T.move, .7) * (1 - P(t,T.q-.55,.4,eIn));
    arrow(ax-57,ay-45,ax-57+114*p,ay-45,stage.ink,p,3,15);
    atext('100 км/ч', 540, 455, T.speed, t, { size: 153, w: 600, col: stage.ink, track: -.04, out: T.q-.4 });
    atext('≈ 28 м/с', 540, 548, T.meters, t, { size: 57, w: 500, col: stage.sub, out: T.q-.4 });
    atextWords('С какой высоты', 540, 405, T.q-.04, t, { size: 106, col: stage.ink, track: -.035 });
    atextWords('нужно упасть?', 540, 526, T.q+.25, t, { size: 106, col: stage.ink, track: -.035 });
  },
  sfx(add, s) {
    add(s.start+.05, 'bloom', .3, .8);
    add(Wd('h1','едет'), 'swell', .22, .6);
    add(Wd('h1','сто')-.16, 'whoosh', .2, .8);
    add(Wd('h1','сто')+.35, 'tick', .14, .9);
    add(Wd('h1','Это'), 'whoosh', .22, .9);
    add(Wd('h1','двадцать'), 'tick', .16, 1);
    add(Wd('h2','какой'), 'chime', .22, .9);
  },
});
