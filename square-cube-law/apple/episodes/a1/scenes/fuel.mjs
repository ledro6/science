// FUEL (≈40.5 – 47.7 с), светлый фон. График мощности, нужной на ходу, от скорости (0–180 км/ч):
// нижняя полоса — остальное (шины и прочее, ∝ v), верхняя тёмная — воздух (∝ v³: 6 кВт на 90, ≈ 50 на 180).
// Под осью маленькая алюминиевая машина едет вместе с маркером скорости, над ней бегут линии обтекания.
// f1 — «трасса» (зона 90–180), кривая растёт с маркером, «∝ v³» (³ красная), доля воздуха захватывает график;
//      заголовок «Расход» → «На трассе: воздух».
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, makeCar, frame, flowLine, streamPts, projPts, WR } from './kit.mjs';

function TT() {
  return {
    poe: Wd('f1', 'Поэтому'), tr: Wd('f1', 'трассе'), ras: Wd('f1', 'расход'), rast: Wd('f1', 'растёт'), vys: Wd('f1', 'высокой'), sk: Wd('f1', 'скорости'),
    bol: Wd('f1', 'больше'), top: Wd('f1', 'топлива'), bor: Wd('f1', 'борьбу'), voz: Wd('f1', 'воздухом'),
  };
}
const GX0 = 150, GX1 = 930, GY0 = 1080, KY = 620 / 60;     // ось скорости 0–180 км/ч, мощность 0–60 кВт
const sx = v => lerp(GX0, GX1, v / 180), sy = kw => GY0 - kw * KY;
const Pair = v => 6.2 * Math.pow(v / 90, 3), Proll = v => 3.4 * v / 90;
const CAR_Y = 1262, D = 120;                                 // экранная линия пола под осью, дальность камеры
const vAt = (t, T) => 180 * P(t, T.poe + .1, T.sk + .3 - T.poe, eInOut);

defineScene('fuel', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    const car = makeCar({ body: MAT.aluminium(), dark: false });
    stage.root.add(car);
    return { stage, car, T: TT() };
  },

  update(t, s, st) {
    const { stage, car, T } = st, cam = stage.camera, L = stage.lights;
    frame(cam, [0, 0, 0], D, 0, 3, 540, CAR_Y);
    // экран ↔ мир по X (на плоскости z = 0 линейно)
    const k = (project(cam, 1, 0, 0)[0] - project(cam, 0, 0, 0)[0]);
    const v = vAt(t, T);
    const x = (sx(v) - 540) / k - 2.2;                     // нос машины — у маркера
    car.position.set(x, 0, 0);
    const a = P(t, s.start + .1, .8);
    car.scale.setScalar(Math.max(1e-3, a));
    // путь ∝ ∫v dt — колёса крутятся быстрее с ростом скорости
    car.spin((t - s.start) * (2 + v / 12) / WR);
    L.key.position.set(x + 3, 9, 6); L.key.target.position.set(x, 0, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.0; L.hemi.intensity = 1.15;
  },

  draw2d(t, s, st) {
    const { stage, car, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const ax = P(t, s.start + .1, .8);
    // зона «трасса» 90–180
    const zA = P(t, T.tr - .05, .6);
    if (zA > .003) {
      g.save(); g.globalAlpha = .55 * zA; g.fillStyle = '#E8E8ED'; g.fillRect(sx(90), sy(60), sx(180) - sx(90), GY0 - sy(60)); g.restore();
      line(sx(90), sy(60), sx(90), GY0, sub, .6 * zA, 2, [6, 8]);
      atext('трасса', sx(90) + 18, sy(60) + 46, T.tr - .05, t, { size: 38, w: 600, col: sub, align: 'left', track: 0, dy: 12 });
    }
    // полосы: остальное (светлая) и воздух (тёмная) до текущей скорости
    const v = vAt(t, T), N = 60;
    if (v > .5) {
      const ptsR = [], ptsA = [];
      for (let i = 0; i <= N; i++) { const q = v * i / N; ptsR.push([sx(q), sy(Proll(q))]); ptsA.push([sx(q), sy(Proll(q) + Pair(q))]); }
      g.save();
      g.fillStyle = '#C7C7CC'; g.beginPath(); g.moveTo(sx(0), GY0); ptsR.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(sx(v), GY0); g.closePath(); g.fill();
      g.fillStyle = '#1D1D1F'; g.beginPath(); ptsR.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
      for (let i = N; i >= 0; i--) g.lineTo(ptsA[i][0], ptsA[i][1]); g.closePath(); g.fill();
      g.restore();
      // маркер скорости: линия от оси к кривой и точка
      const mx = sx(v), my = sy(Proll(v) + Pair(v));
      line(mx, GY0, mx, my, ink, .5, 2);
      g.save(); g.fillStyle = '#FFFFFF'; g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.arc(mx, my, 9, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore();
      atext(Math.round(v / 5) * 5 + ' км/ч', mx, my - 30, T.poe + .3, t, { size: 34, w: 600, col: ink, track: 0, dy: 10, out: T.sk + .15 });
    }
    // оси и подписи
    line(GX0, GY0, GX1 + 20, GY0, ink, .8 * ax, 2);
    line(GX0, GY0, GX0, sy(60) - 10, ink, .8 * ax, 2);
    atext('мощность', GX0 + 14, sy(60) + 4, s.start + .3, t, { size: 34, w: 500, col: sub, align: 'left', track: 0, dy: 10 });
    [[0, '0'], [90, '90'], [180, '180 км/ч']].forEach(([q, lab], i) => atext(lab, sx(q), GY0 + 44, s.start + .3 + i * .08, t, { size: 32, w: 500, col: sub, track: 0, dy: 10 }));
    // подписи полос
    atext('∝ v³', sx(180) - 62, sy(Proll(180) + Pair(180)) + 70, T.sk + .35, t, { size: 64, w: 600, col: ink, align: 'right', track: -.02, dy: 18 });
    atext('воздух', sx(150), sy((Proll(150) + Pair(150) + Proll(150)) / 2) + 12, T.bor - .05, t, { size: 40, w: 600, col: '#FFFFFF', track: 0, dy: 12 });
    atext('остальное', sx(152), sy(Proll(152) / 2) + 11, T.top, t, { size: 30, w: 500, col: ink, track: 0, dy: 10 });
    // заголовок
    atext('Расход', 540, 330, T.ras - .05, t, { size: 110, w: 600, col: ink, track: -.03, out: T.top - .3 });
    atext('На трассе: воздух', 540, 330, T.top, t, { size: 96, w: 600, col: ink, track: -.03 });
    // линии обтекания над машиной: скорость штрихов ∝ скорости
    const a = P(t, T.poe, .8);
    if (a > .003) {
      const cx = car.position.x;
      [[.9, .14], [1.5, .38]].forEach(([h, gap], i) => {
        const pts = projPts(cam, streamPts(h, gap, -4.2, 4.2, 50), 0, cx);
        flowLine(pts, t + i * .4, 60 + v * 3, ink, a * .55, 1.5, [26, 18], .2);
      });
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .2, .8);
    add(T.poe, 'rise', .2, .8);
    add(T.sk + .35, 'bloom', .2, .9);
    add(T.top, 'chime', .22, .95);
    add(T.voz, 'thud', .18, .8);
  },
});
