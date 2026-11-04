// AIR (≈9.3 – 23.2 с), светлый фон. Та же машина в разрезе (алюминиевое стекло, тёмные рёбра), вид сбоку,
// камера едет с машиной, которая всё время разгоняется (штрихи дороги уходят назад).
// a1 — «воздух»: салон наполняют частицы воздуха (2D-точки, равномерно); «отстаёт и сжимается у заднего стекла» —
//      облако сползает назад и сгущается у заднего стекла; «Сзади давление чуть выше» — мягкая тень плотности
//      и подпись «выше» над задним стеклом; «спереди чуть ниже» — «ниже» над передним (разница утрирована, в жизни — доли процента).
// a2 — «Эта разница»: у пола появляется шарик (пока вертикально), «давит на шарик сзади» — стрелки давления со всех сторон,
//      сзади длиннее; «толкает его вперёд» — итоговая стрелка вперёд, шарик наклоняется; «туда, где воздух реже» —
//      стрелка дотягивается к разреженному переду.
import { defineScene, makeStage, project, atext, line, dot, P, Wd, THREE, MAT, clamp, lerp, rng, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, frame, keys, makeRoad, makeCutCar, makeDrive, arrow, A_CAR, G, THETA, WR, CAB_X0, CAB_X1, cabCeil, BAL_AT } from './kit.mjs';

const N = 300, FLOOR = .58;
function TT() {
  return {
    pri: Wd('a1', 'При'), vozd: Wd('a1', 'воздух'), tozhe: Wd('a1', 'тоже'), otst: Wd('a1', 'отстаёт'), szh: Wd('a1', 'сжимается'), stekla: Wd('a1', 'стекла'),
    szadi: Wd('a1', 'Сзади'), dav: Wd('a1', 'давление'), vyshe: Wd('a1', 'выше'), sper: Wd('a1', 'спереди'), nizhe: Wd('a1', 'ниже'),
    eta: Wd('a2', 'Эта'), razn: Wd('a2', 'разница'), davit: Wd('a2', 'давит'), shar: Wd('a2', 'шарик'), szadi2: Wd('a2', 'сзади'),
    tolk: Wd('a2', 'толкает'), vper: Wd('a2', 'вперёд'), tuda: Wd('a2', 'туда'), reje: Wd('a2', 'реже'),
  };
}
const accel = (t, s) => A_CAR * P(t, s.start - .5, 1.2, eInOut);
// облако частиц: u ∈ [0,1] вдоль салона (0 — заднее стекло); сжатие f(u) = u − c·u(1 − u) → у заднего стекла гуще
const KC = .55;

defineScene('air', {
  setup(s) {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    const T = TT();
    const road = makeRoad({ x0: -40, x1: 400, lanes: [0, 3.8], dark: false });
    road.line(0);
    const car = makeCutCar({ dark: false });
    stage.root.add(road, car);
    const drive = makeDrive(t => accel(t, s), s.start - 1, s.end + 1, 4);
    const r = rng(731), pts = [];
    for (let i = 0; i < N; i++) pts.push({ u: r(), v: r(), p1: r() * 6.28, p2: r() * 6.28, w1: .7 + r() * .9, w2: .6 + r() * .9, rad: 3.6 + r() * 2.2 });
    return { stage, T, road, car, drive, pts };
  },

  update(t, s, st) {
    const { stage, T, car, drive } = st, cam = stage.camera, L = stage.lights;
    const x = drive.x(t);
    car.position.x = x; car.spin(x / WR);
    car.pend.pose(Math.atan(accel(t, s) / G));
    // шарик: проявляется на «Эта», наклоняется на «толкает»
    const pb = P(t, T.eta - .05, .7);
    car.balloon.visible = pb > .003;
    car.balloon.scale.setScalar(Math.max(1e-3, lerp(.85, 1, pb)));
    car.balloon.ball.material.opacity = 1;
    car.balloon.pose(THETA * P(t, T.tolk - .05, 1.0, eInOut));
    L.key.position.set(x + 3, 9, 7); L.key.target.position.set(x, 0, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.0; L.hemi.intensity = 1.15;
    // камера: общий план → салон крупно на «воздух» → чуть ближе к шарику на a2
    const [tx, ty, d, az, el, sy] = keys([
      [s.start, -.3, .85, 21, 8, 6, 980],
      [T.vozd - .3, -.3, .85, 20, 7, 5, 980],
      [T.otst, -.42, .92, 14.2, 3, 3, 1000],
      [T.eta - .2, -.42, .92, 14.4, 2, 3, 1000],
      [T.tolk, -.42, .92, 13.8, 1, 3, 1010],
      [s.end, -.42, .92, 14.4, -2, 3, 1010],
    ], t, eInOut);
    frame(cam, [x + tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, car, pts } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, X = car.position.x;
    const P2 = (x, y) => project(cam, X + x, y, 0);
    // контур салона в экране (для тени плотности)
    const poly = [];
    for (let i = 0; i <= 40; i++) { const x = lerp(CAB_X0, CAB_X1, i / 40); poly.push(P2(x, cabCeil(x))); }
    for (let i = 40; i >= 0; i--) { const x = lerp(CAB_X0, CAB_X1, i / 40); poly.push(P2(x, FLOOR)); }
    // тень плотности: темнее у заднего стекла
    const aS = P(t, T.szadi - .1, 1.0) * .85;
    if (aS > .003) {
      const [rx] = P2(CAB_X0, 1), [fx] = P2(CAB_X1, 1);
      const gr = g.createLinearGradient(rx, 0, fx, 0);
      gr.addColorStop(0, 'rgba(29,29,31,.16)'); gr.addColorStop(.45, 'rgba(29,29,31,.05)'); gr.addColorStop(1, 'rgba(29,29,31,0)');
      g.save(); g.globalAlpha = aS; g.fillStyle = gr; g.beginPath(); poly.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill(); g.restore();
    }
    // частицы воздуха
    const aP = P(t, T.vozd - .1, .9);
    const c = KC * P(t, T.otst - .1, T.stekla - T.otst + .6, eInOut);
    const lag = .12 * P(t, T.otst - .1, .8, eInOut) * (1 - P(t, T.szh, 1.2, eInOut));       // облако сначала «отстаёт» целиком
    const [bcx, bcy] = project(cam, ...car.balloonC());
    const kpx = P2(1, 0)[0] - P2(0, 0)[0];                                                   // px на метр
    const bR = car.balloon.R * kpx * 1.3 * (car.balloon.visible ? 1 : 0);
    if (aP > .003) {
      g.save(); g.fillStyle = ink;
      for (const q of pts) {
        const f = q.u - c * q.u * (1 - q.u);
        let x = lerp(CAB_X0 + .08, CAB_X1 - .06, f) - lag * (1 - q.u) + .03 * Math.sin(t * q.w1 + q.p1);
        const ceil = cabCeil(x) - .05;
        const y = lerp(FLOOR + .04, ceil, q.v) + .03 * Math.sin(t * q.w2 + q.p2);
        const [px, py] = P2(x, y);
        const dd = Math.hypot(px - bcx, py - bcy); if (dd < bR) continue;
        const appear = clamp((aP * 1.4 - q.v * .4));
        g.globalAlpha = .55 * appear * clamp((dd - bR) / 20 + (bR ? 0 : 1));
        g.beginPath(); g.arc(px, py, q.rad, 0, 6.2832); g.fill();
      }
      g.restore();
    }
    // подписи «выше» / «ниже» над стёклами
    const [rx, ry] = P2(-1.55, 1.42), [fx, fy] = P2(.62, 1.42);
    const top = Math.min(ry, fy) - 70;
    const oA = s.end - .4;
    atext('давление', rx, top - 74, T.dav - .05, t, { size: 34, w: 500, col: sub, track: 0, dy: 12, out: oA });
    atext('выше', rx, top, T.vyshe - .05, t, { size: 76, w: 600, col: ink, track: -.025, out: oA });
    atext('давление', fx, top - 74, T.sper - .05, t, { size: 34, w: 500, col: sub, track: 0, dy: 12, out: oA });
    atext('ниже', fx, top, T.nizhe - .05, t, { size: 76, w: 600, col: ink, track: -.025, out: oA });
    const aL = P(t, T.vyshe, .6) * (1 - P(t, oA, .3, eIn)), aR = P(t, T.nizhe, .6) * (1 - P(t, oA, .3, eIn));
    line(rx, top + 22, rx, ry - 8, ink, .4 * aL, 2); dot(rx, ry, 5, ink, aL);
    line(fx, top + 22, fx, fy - 8, ink, .4 * aR, 2); dot(fx, fy, 5, ink, aR);
    // заголовки
    atext('Воздух отстаёт', 540, 340, T.otst - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: T.szadi - .25 });
    atext('и сжимается назад', 540, 410, T.szh, t, { size: 44, w: 500, col: sub, track: -.005, out: T.szadi - .25 });
    atext('Разница давлений', 540, 340, T.razn - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: oA });
    atext('толкает шарик вперёд', 540, 410, T.tolk, t, { size: 44, w: 500, col: sub, track: -.005, out: oA });
    // стрелки давления на шарик: со всех сторон, сзади длиннее
    const aA = P(t, T.davit - .05, .6) * (1 - P(t, T.tolk + .6, .5, eIn));
    const rear = P(t, T.szadi2 - .1, .8, eInOut);
    const R0 = car.balloon.R * kpx * 1.2;
    if (aA > .003) for (let i = 0; i < 8; i++) {
      const ph = i * Math.PI / 4, ux = Math.cos(ph), uy = Math.sin(ph);
      const len = (46 + 30 * rear * -ux) * P(t, T.davit - .05 + i * .03, .6);
      arrow(bcx + ux * (R0 + len + 14), bcy + uy * (R0 + len + 14), bcx + ux * (R0 + 10), bcy + uy * (R0 + 10), ink, aA * .85, 3, 12);
    }
    // итоговая сила — вперёд, к разреженному переду
    const pF = P(t, T.tolk - .05, .7), pT = P(t, T.tuda, 1.0, eInOut);
    if (pF > .003) {
      const x0 = bcx + R0 + 8, L = lerp(0, lerp(150, P2(.3, 0)[0] - x0, pT), pF);
      arrow(x0, bcy, x0 + L, bcy, ink, pF, 5, 20);
      atext('реже', P2(.3, 0)[0] + 20, bcy + 14, T.reje - .1, t, { size: 40, w: 600, col: ink, track: -.01, align: 'left', dy: 12 });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.vozd, 'shimmer', .12, .9);
    add(T.szh, 'swell', .16, .7);
    add(T.vyshe, 'tick', .14, .9);
    add(T.nizhe, 'tick', .14, 1.05);
    add(T.eta, 'thud', .16, .9);
    add(T.tolk, 'whoosh', .2, .9);
    add(T.reje, 'click', .14, 1.0);
  },
});
