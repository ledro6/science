// DIST (≈10.9 – 22.4 с), светлый фон. Дорога-шкала: вид сверху, полотно по диагонали кадра, вдоль кромки — линейка в метрах.
// d1 — пустая дорога, линейка прорисовывается; «Тормозной путь», на «квадрат» — «∝ v²»;
// d2 — машины въезжают к линии на 60 и 120 км/ч и тормозят одновременно (время сцены — реальное, a = 6,87 м/с²):
//      за колёсами тянутся следы, на конце следов живые счётчики «20 м» и «80 м»; камера отъезжает, чтобы влезли 80 м;
//      на «четыре» — красное «×4», след второй делится на четыре отрезка по 20 м.
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, makeCar, frame, keys, dim, makeRoad, bx, bv, stopDist, V60, V120, WR } from './kit.mjs';

const LANE = [-2, 2];
const D = [stopDist(V60), stopDist(V120)];             // 20,2 и 80,9 м
const V = [V60, V120];
const EDGE = 4.6;                                       // z линейки (за правой кромкой)

function TT() {
  return {
    torm: Wd('d1', 'Тормозной'), put: Wd('d1', 'путь'), kv: Wd('d1', 'квадрат'), sk: Wd('d1', 'скорости'),
    na: Wd('d2', 'На'), suh: Wd('d2', 'сухом'), shest: Wd('d2', 'шестидесяти'), dvad: Wd('d2', 'двадцать'), metr: Wd('d2', 'метров'),
    sta: Wd('d2', 'ста'), dvadc: Wd('d2', 'двадцати'), vos: Wd('d2', 'восемьдесят'), chet: Wd('d2', 'четыре'), dal: Wd('d2', 'дальше'),
  };
}
// обе машины пересекают линию одновременно на «шестидесяти» — дальше чистая физика
const tauAt = (t, T) => t - T.shest;

defineScene('dist', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    const T = TT();
    const road = makeRoad({ x0: -120, x1: 160, lanes: LANE, dark: false });
    const cars = LANE.map(z => {
      const c = makeCar({ body: MAT.aluminium(), glass: new THREE.MeshStandardMaterial({ color: '#141416', roughness: .15, metalness: .2 }), dark: false });
      c.position.z = z; return c;
    });
    stage.root.add(road, ...cars);
    return { stage, T, road, cars };
  },

  update(t, s, st) {
    const { stage, T, road, cars } = st, cam = stage.camera, L = stage.lights;
    const tau = tauAt(t, T);
    cars.forEach((c, i) => {
      const x = bx(V[i], tau);
      c.position.x = x; c.spin(x / WR);
      c.visible = x > -60;
      road.skid(i, 0, tau > 0 ? x : 0);
    });
    road.line(P(t, s.start + .2, .9, eInOut));
    L.key.position.set(30, 40, 20); L.key.target.position.set(30, 0, 0); L.key.target.updateMatrixWorld();
    L.key.shadow.camera.left = -60; L.key.shadow.camera.right = 60; L.key.shadow.camera.top = 60; L.key.shadow.camera.bottom = -60;
    L.key.shadow.camera.updateProjectionMatrix();
    L.key.intensity = 2.0; L.hemi.intensity = 1.15;
    // камера: почти сверху, дорога по диагонали; отъезд вслед за второй машиной, чтобы влезли все 80 м
    const x2 = bx(V120, tau);
    const k = P(t, T.shest - .2, T.vos + .9 - T.shest, eInOut);
    const tx = lerp(9, 40, k), d = lerp(130, 420, k);
    cam.fov = 20; cam.far = 2000; cam.updateProjectionMatrix();
    frame(cam, [tx, 0, 0], d, lerp(-46, -40, k), 62, 540, lerp(980, 945, k));
  },

  draw2d(t, s, st) {
    const { stage, T, cars } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const tau = tauAt(t, T);
    // линейка вдоль кромки: штрих каждые 10 м, подписи 0 … 80
    for (let m = 0; m <= 80; m += 10) {
      const a = P(t, T.put + m * .006, .5);
      if (a <= .003) continue;
      const [ax, ay] = project(cam, m, 0, EDGE), [bx2, by] = project(cam, m, 0, EDGE + (m % 20 ? .9 : 1.6));
      line(ax, ay, bx2, by, sub, a, 2);
      if (m % 20 === 0) {
        const [lx, ly] = project(cam, m, 0, EDGE + 3.4);
        atext(m ? String(m) : '0 м', lx, ly + 10, T.put + m * .006, t, { size: 30, w: 500, col: sub, track: 0, dy: 10 });
      }
    }
    // заголовок d1
    const oT = T.na - .1;
    atext('Тормозной путь', 540, 330, T.torm - .05, t, { size: 96, w: 600, col: ink, track: -.03, out: oT });
    atext('∝ v²', 540, 500, T.kv - .05, t, { size: 170, w: 600, col: ink, track: -.03, blur: 18, scale0: 1.08, dur: .9, out: oT });
    atext('сухой асфальт', 96, 330, T.suh, t, { size: 40, w: 500, col: sub, align: 'left', track: -.005, out: T.chet - .2 });
    // живые счётчики на концах следов
    cars.forEach((c, i) => {
      if (tau <= 0) return;
      const x = bx(V[i], tau), [px, py] = project(cam, x + 3.2, 0, LANE[i] - 3.4);
      const t0 = T.shest + .25;
      const big = i === 0 ? P(t, T.metr - .1, .5) : P(t, T.vos, .5);
      atext(Math.round(x) + ' м', px, py, t0, t, { size: lerp(44, 64, big), w: 600, col: ink, track: -.02, dy: 12, align: 'right' });
      atext(i ? 'со 120 км/ч' : 'с 60 км/ч', px, py + 40, i ? T.dvadc - .05 : T.shest, t, { size: 30, w: 500, col: sub, track: 0, dy: 10, align: 'right' });
    });
    // ×4: след второй делится на четыре отрезка по 20 м
    for (let j = 0; j < 4; j++) {
      const a = P(t, T.chet + j * .12, .5) * (1 - P(t, s.end - .4, .3, eIn));
      if (a <= .003) continue;
      const [ax, ay] = project(cam, j * D[0] + .4, 0, LANE[1] + 1.5), [bx2, by] = project(cam, (j + 1) * D[0] - .4, 0, LANE[1] + 1.5);
      dim(ax, ay, bx2, by, a, ink, 9);
    }
    atext('×4', 300, 520, T.chet, t, { size: 300, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9 });
    atext('тормозной путь', 300, 600, T.chet + .25, t, { size: 46, w: 500, col: sub, track: -.005 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .2, .8);
    add(T.kv, 'bloom', .22, .9);
    add(T.shest - .6, 'whoosh', .28, .8);
    add(T.metr, 'click', .22, .9);
    add(T.vos + .8, 'click', .22, .8);
    add(T.chet - 1.5, 'riser', .22);
    add(T.chet, 'impact', .4, .9);
    for (let j = 0; j < 4; j++) add(T.chet + .3 + j * .12, 'tick', .1, .9 + j * .06);
  },
});
