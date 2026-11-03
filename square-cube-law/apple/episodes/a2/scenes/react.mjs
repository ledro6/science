// REACT (≈33.3 – 41.5 с), светлый фон. Та же дорога-шкала, что в dist: след торможения со 120 км/ч — 80 м.
// r1 — «без реакции водителя»: камера отъезжает, перед линией торможения освобождается место; машина встаёт
//      за 33 м до линии; на «одну секунду» она проезжает их ровно за 1 с реального времени (счётчик «0,0 → 1,0 с»),
//      за ней остаётся пунктир без следа (педаль ещё не нажата); на линии — тормоз; на «тридцать три» — «33 м».
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, makeCar, frame, keys, dim, makeRoad, bx, stopDist, V120, WR } from './kit.mjs';

const LANE = [-2.4, 2.4], Z = LANE[1];
const D2 = stopDist(V120);                              // 80 м
const RD = V120 * 1;                                    // путь за 1 с реакции: 33,3 м
const EDGE = 5;

function TT() {
  return {
    eto: Wd('r1', 'это'), bez: Wd('r1', 'без'), rea: Wd('r1', 'реакции'), vod: Wd('r1', 'водителя'),
    za: Wd('r1', 'За'), odnu: Wd('r1', 'одну'), sek: Wd('r1', 'секунду'), ped: Wd('r1', 'педаль'),
    proe: Wd('r1', 'проезжает'), tri: Wd('r1', 'тридцать'), metra: Wd('r1', 'метра'),
  };
}
// положение машины (м от линии торможения): стоит в конце следа → исчезает → появляется за 33 м до линии →
// на «одну» едет 1 с без торможения → тормозит по физике
const t0 = T => T.odnu;
function carX(t, T) {
  if (t < T.vod) return D2;
  const tau = t - t0(T);
  if (tau <= 0) return -RD;
  if (tau <= 1) return -RD + V120 * tau;
  return bx(V120, tau - 1);
}

defineScene('react', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    const T = TT();
    const road = makeRoad({ x0: -140, x1: 160, lanes: LANE, dark: false });
    const car = makeCar({ body: MAT.aluminium(), glass: new THREE.MeshStandardMaterial({ color: '#141416', roughness: .15, metalness: .2 }), dark: false });
    car.position.z = Z;
    stage.root.add(road, car);
    return { stage, T, road, car };
  },

  update(t, s, st) {
    const { stage, T, road, car } = st, cam = stage.camera, L = stage.lights;
    const x = carX(t, T);
    car.position.x = x; car.spin(x / WR);
    // исчезает в конце следа и проявляется на старте реакции
    const vis = t < T.vod ? 1 - P(t, T.bez, .5, eIn) : P(t, T.vod + .2, .7);
    car.scale.setScalar(Math.max(1e-3, vis));
    road.skid(0, 0, 0);
    road.skid(1, 0, D2);
    road.line(1);
    L.key.position.set(20, 40, 20); L.key.target.position.set(20, 0, 0); L.key.target.updateMatrixWorld();
    L.key.shadow.camera.left = -80; L.key.shadow.camera.right = 80; L.key.shadow.camera.top = 80; L.key.shadow.camera.bottom = -80;
    L.key.shadow.camera.updateProjectionMatrix();
    L.key.intensity = 2.0; L.hemi.intensity = 1.15;
    // камера: как в конце dist → отъезд (место под реакцию) → ближе к машине на секунду реакции → общий план
    const [tx, d, sy] = keys([[s.start, 40, 400, 880], [T.bez, 40, 400, 880], [T.za - .3, 24, 600, 930], [T.odnu - .1, -10, 320, 960], [T.ped + .2, -4, 320, 960], [T.proe + .4, 24, 600, 930], [41.6, 25, 610, 930]], t, eInOut);
    cam.fov = 20; cam.far = 2000; cam.updateProjectionMatrix();
    frame(cam, [tx, 0, 0], d, -40, 62, 505 + 45 * P(t, T.proe, 1.0, eInOut), sy - 20 * P(t, T.proe, 1.0, eInOut));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    // линейка (как в dist), теперь и перед линией
    for (let m = -30; m <= 80; m += 10) {
      const a = m >= 0 ? 1 : P(t, T.bez + (-m) * .01, .5);
      if (a <= .003) continue;
      const [ax, ay] = project(cam, m, 0, EDGE), [bx2, by] = project(cam, m, 0, EDGE + (m % 20 ? .9 : 1.6));
      line(ax, ay, bx2, by, sub, a, 2);
      if (m % 20 === 0 && m >= 0) {
        const [lx, ly] = project(cam, m, 0, EDGE + 3.4);
        atext(m ? String(m) : '0 м', lx, ly + 10, s.start - 1, t, { size: 30, w: 500, col: sub, track: 0, dy: 10 });
      }
    }
    // подпись следа
    const [ex, ey] = project(cam, D2 + 2.6, 0, LANE[0] - 4.6);
    atext('80 м', ex, ey, s.start - 1, t, { size: 56, w: 600, col: ink, track: -.02, align: 'right' });
    atext('торможение', ex, ey + 40, s.start - 1, t, { size: 30, w: 500, col: sub, track: 0, align: 'right' });
    // путь реакции: пунктир за машиной (следа нет — педаль ещё не нажата)
    const x = carX(t, T);
    if (t > T.odnu) {
      const xe = Math.min(x, 0);
      const [ax, ay] = project(cam, -RD, 0, Z), [bx2, by] = project(cam, xe, 0, Z);
      line(ax, ay, bx2, by, ink, .9, 5, [14, 12]);
    }
    // размерная линия «33 м»
    const aR = P(t, T.tri - .1, .5);
    if (aR > .003) {
      const [ax, ay] = project(cam, -RD, 0, LANE[0] - 3), [bx2, by] = project(cam, 0, 0, LANE[0] - 3);
      dim(ax, ay, bx2, by, aR, ink, 10);
      const [mx, my] = project(cam, -RD / 2, 0, LANE[0] - 6.5);
      atext('33 м', mx, my, T.tri - .05, t, { size: 64, w: 600, col: ink, track: -.02 });
      atext('реакция', mx, my + 42, T.tri + .1, t, { size: 34, w: 500, col: sub, track: 0 });
    }
    // заголовки
    atext('Без реакции водителя', 540, 330, T.bez - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: T.za - .15 });
    const sec = clamp(t - T.odnu, 0, 1);
    const oS = T.tri - .2;
    atext((sec >= 1 ? '1' : sec.toFixed(1).replace('.', ',')) + ' с', 540, 420, T.odnu - .1, t, { size: 200, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .7, out: oS });
    atext('до нажатия на педаль', 540, 495, T.sek, t, { size: 44, w: 500, col: sub, track: -.005, out: oS });
    atext('1 с = 33 м', 540, 420, T.tri - .05, t, { size: 160, w: 700, col: ink, track: -.04, blur: 20, scale0: 1.1, dur: .9 });
    atext('на 120 км/ч', 540, 495, T.metra, t, { size: 44, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(T.bez, 'whoosh', .22, .7);
    add(T.vod + .2, 'thud', .18, .8);
    add(T.odnu, 'tick', .18, 1.0);
    add(T.odnu + 1, 'click', .3, .9);
    add(T.tri, 'chime', .26, .95);
  },
});
