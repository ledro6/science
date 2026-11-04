// HOOK (0 – 9.3 с), чёрный фон. Машина в разрезе: стеклянный кузов с тонкими рёбрами, внутри виден салон —
// сиденья, руль, груз на нитке у зеркала и шарик с гелием, привязанный к полу. Вид сбоку, камера едет с машиной.
// h1 — «Машина» проявляется из темноты; «разгоняется» — плавно набирается ускорение 0→100 за 10 с (честные 0,28 g),
//      штрихи дороги уходят назад; «всё в салоне» — камера подъезжает к грузу, на «назад» он отклонён назад (16°),
//      выноска «назад»; «А шарик» — камера отъезжает, в кадр входит шарик: он всё это время наклонён вперёд;
//      на «вперёд» — красная стрелка «вперёд» (акцент хука).
// h2 — «Почему?» крупно, камера медленно обходит машину.
import { defineScene, makeStage, project, atext, line, dot, P, Wd, THREE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, frame, keys, collectMats, setLit, makeRoad, makeCutCar, makeDrive, arrow, A_CAR, G, WR } from './kit.mjs';

function TT() {
  return {
    mash: Wd('h1', 'Машина'), raz: Wd('h1', 'разгоняется'), vse: Wd('h1', 'всё'), otk: Wd('h1', 'отклоняется'), naz: Wd('h1', 'назад'),
    A: Wd('h1', 'А'), shar: Wd('h1', 'шарик'), let: Wd('h1', 'летит'), vper: Wd('h1', 'вперёд'),
    poch: Wd('h2', 'Почему'), nao: Wd('h2', 'наоборот'),
  };
}
// ускорение нарастает от «разгоняется» до «назад» и дальше держится
const accel = (t, T) => A_CAR * P(t, T.raz, T.naz - T.raz + .2, eInOut);

defineScene('hook', {
  setup(s) {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const T = TT();
    const road = makeRoad({ x0: -40, x1: 160, lanes: [0, 3.8], dark: true });
    road.line(0);
    const car = makeCutCar({ dark: true });
    stage.root.add(road, car);
    const drive = makeDrive(t => accel(t, T), 0, s.end + 1);
    return { stage, T, road, car, drive, mats: collectMats(car) };
  },

  update(t, s, st) {
    const { stage, T, car, drive, mats } = st, cam = stage.camera, L = stage.lights;
    const x = drive.x(t);
    car.position.x = x; car.spin(x / WR);
    const th = Math.atan(accel(t, T) / G);
    car.pend.pose(th); car.balloon.pose(th);
    // свет: контровые вырезают силуэт, затем ключ проявляет салон
    const lr = P(t, 0, 1.0), lk = P(t, T.mash, 1.4);
    setLit(mats, .3 + .7 * lk);
    car.edges.forEach((m, i) => m.opacity = car.edgeBase[i] * lr);
    L.key.position.set(x + 3, 9, 7); L.key.target.position.set(x, 0, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.4 * lk; L.hemi.intensity = .45 * lk;
    L.rimL.position.set(x - 6, 3, -5); L.rimR.position.set(x + 6, 2, -4);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    // камера: общий план → к грузу → отъезд, чтобы вошёл шарик → медленный обход на «Почему»
    const [tx, ty, d, az, el, sy] = keys([
      [0, -.1, .8, 23, 14, 6, 900],
      [T.vse - .25, -.1, .8, 22, 12, 5, 900],
      [T.otk + .2, .3, .95, 9.5, 6, 3, 860],
      [T.A - .05, .28, .95, 9.2, 5, 3, 860],
      [T.let, -.3, .9, 14.5, 3, 3, 900],
      [T.poch - .1, -.3, .9, 16, 2, 4, 960],
      [s.end, -.3, .9, 17, -9, 6, 980],
    ], t, eInOut);
    frame(cam, [x + tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, car } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const oH = s.end - .4;
    // груз: «назад» — стрелка под грузом, подпись под ней
    const [bx, by] = project(cam, ...car.bobC());
    const aB = P(t, T.naz - .1, .6) * (1 - P(t, oH, .3, eIn));
    const kB = clamp(project(cam, 0, 0, 0)[0] - project(cam, -1, 0, 0)[0], 40, 400) / 160;   // масштаб кадра (px на метр / 160)
    if (aB > .003) {
      const y = by + 26 * kB + 18, len = lerp(0, 60 + 40 * kB, P(t, T.naz - .1, .7));
      arrow(bx + 20, y, bx + 20 - len, y, ink, aB, 4, 16);
      atext('назад', bx, y + 56, T.naz, t, { size: 44, w: 600, col: ink, track: -.01, dy: 14, out: oH });
    }
    // шарик: красная стрелка «вперёд» над шариком
    const [qx, qy] = project(cam, ...car.balloonC());
    const aQ = P(t, T.vper - .15, .6) * (1 - P(t, oH, .3, eIn));
    if (aQ > .003) {
      const y = qy - 34 * kB - 40, len = lerp(0, 90 + 50 * kB, P(t, T.vper - .15, .7));
      arrow(qx - 20, y, qx - 20 + len, y, stage.accent, aQ, 5, 18);
      atext('вперёд', qx + 30, y - 26, T.vper, t, { size: 44, w: 600, col: stage.accent, track: -.01, dy: 14, out: oH });
    }
    // h2
    atext('Почему?', 540, 460, T.poch - .05, t, { size: 150, w: 600, col: ink, track: -.035, blur: 16 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    add(T.raz, 'swell', .22, .6);
    add(T.vse, 'whoosh', .2, .8);
    add(T.naz, 'tick', .14, .9);
    add(T.A, 'whoosh', .22, .9);
    add(T.vper - 1.5, 'riser', .18);
    add(T.vper, 'impact', .32, 1.0);
    add(T.poch, 'chime', .24, .9);
  },
});
