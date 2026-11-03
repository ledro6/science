// HOOK (0 – 10.87 с), чёрный фон. Две одинаковые машины-керамика на параллельных полосах, вид сзади 3/4
// длиннофокусной камерой; поперёк дороги — белая линия начала торможения.
// h1 — «тормозить в одной точке»: линия прорисовывается; «одна на шестидесяти» — над дальней машиной «60 км/ч»,
//      она пересекает линию, загораются стоп-сигналы, за колёсами тянется след; «другая на ста двадцати» — в кадр
//      влетает вторая, «120 км/ч». Время сцены — честная физика (a = 6,87 м/с²) в замедленной съёмке.
// h2 — первая встаёт (20 м) ровно в тот миг, когда вторая проносится мимо неё: спидометр второй замирает
//      на «104 км/ч» красным в этой точке, время почти останавливается; на «ста четырёх» цифра вырастает в заголовок.
import { defineScene, makeStage, project, atext, line, dot, P, Wd, THREE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, makeCar, frame, keys, glow, collectMats, setLit, brakeLights, makeRoad, bx, bv, stopDist, DEC, V60, V120, TAIL, WR } from './kit.mjs';

const LANE = [-2, 2];                                   // z полос: 0 — первая (60), 1 — вторая (120)
const D1 = stopDist(V60);                               // 20,2 м
const TAU1 = V60 / DEC;                                 // первая стоит через 2,43 с торможения
// вторая проходит точку D1 через τ' после начала своего торможения; стартует так, чтобы это совпало с остановкой первой
const TAUP = (V120 - Math.sqrt(V120 * V120 - 2 * DEC * D1)) / DEC;
const TAU2B = TAU1 - TAUP;                              // ≈ 1,78 с
const V_MEET = bv(V120, TAUP) * 3.6;                    // ≈ 104 км/ч

function TT() {
  const T = {
    dve: Wd('h1', 'Две'), torm: Wd('h1', 'тормозить'), tochk: Wd('h1', 'точке'), odna: Wd('h1', 'одна'), shest: Wd('h1', 'шестидесяти'),
    drug: Wd('h1', 'другая'), dvad: Wd('h1', 'двадцати'),
    tam: Wd('h2', 'Там'), perv: Wd('h2', 'первая'), stoit: Wd('h2', 'стоит'), vtor: Wd('h2', 'вторая'), nes: Wd('h2', 'несётся'),
    sta: Wd('h2', 'ста'), chet: Wd('h2', 'четырёх'),
  };
  T.b1 = T.shest + .45;                                 // первая пересекает линию сразу после «шестидесяти»
  T.meet = T.stoit - .12;                               // первая встала, вторая рядом
  T.r = TAU1 / (T.meet - T.b1);                         // темп замедленной съёмки
  return T;
}
// время физики τ (0 — первая начинает тормозить); после встречи время почти замирает
const R_END = .07, K_END = .4;
function tauAt(t, T) {
  if (t <= T.meet) return T.r * (t - T.b1);
  const u = t - T.meet;
  return TAU1 + R_END * u + (T.r - R_END) * K_END * (1 - Math.exp(-u / K_END));
}
const kmh = v => Math.round(v * 3.6);

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const T = TT();
    const road = makeRoad({ x0: -180, x1: 140, lanes: LANE, dark: true });
    const cars = LANE.map(z => { const c = brakeLights(makeCar({ dark: true })); c.position.z = z; return c; });
    stage.root.add(road, ...cars);
    return { stage, T, road, cars, mats: cars.map(collectMats) };
  },

  update(t, s, st) {
    const { stage, T, road, cars, mats } = st, cam = stage.camera, L = stage.lights;
    const tau = tauAt(t, T);
    const x = [bx(V60, tau), bx(V120, tau - TAU2B)];
    cars.forEach((c, i) => {
      c.position.x = x[i];
      c.spin(x[i] / WR);
      const tb = i ? tau - TAU2B : tau;
      // стоп-сигналы: загораются на линии, у стоящей машины чуть тускнеют
      c.brake(tb > 0 ? (bv(i ? V120 : V60, tb) > 0 ? 1 : .55) : 0);
      road.skid(i, 0, tb > 0 ? x[i] : 0);
    });
    // свет: контровые вырезают силуэты, потом ключ проявляет керамику
    const lr = P(t, 0, 1.0), lk = P(t, .2, 1.4);
    mats.forEach(m => setLit(m, .35 + .65 * lk));
    L.key.position.set(x[0] - 4, 12, 9); L.key.target.position.set(x[0] + 6, 0, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.0 * lk; L.hemi.intensity = .35 * lk;
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    road.line(P(t, T.torm - .05, .9, eInOut));
    // камера: сзади 3/4, длинный фокус. Ведёт первую → отъезжает телеобъективом, чтобы влетела вторая →
    // к встрече останавливается на точке 20 м
    const wA = P(t, T.drug - .3, 1.3, eInOut), wB = P(t, T.tam, T.meet - T.tam + .3, eInOut);
    const tx = lerp(lerp(x[0] + .5, (x[0] + x[1]) / 2 + 6, wA), D1 + .5, wB) + Math.max(0, t - T.meet) * .3;
    const [az, el, d, fov] = keys([[0, -74, 13, 46, 17], [T.drug - .3, -76, 12, 46, 17], [T.dvad + .3, -84, 8, 90, 11], [T.meet, -76, 14, 52, 16], [10.9, -72, 15, 50, 16]], t, eInOut);
    cam.fov = fov; cam.updateProjectionMatrix();
    frame(cam, [tx, .7, lerp(LANE[0], .6, wA)], d, az, el, 540, lerp(1000, 900, wA));
  },

  draw2d(t, s, st) {
    const { stage, T, cars } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const tau = tauAt(t, T);
    // свечение стоп-сигналов
    cars.forEach((c, i) => {
      const tb = i ? tau - TAU2B : tau;
      if (tb <= 0) return;
      const k = bv(i ? V120 : V60, tb) > 0 ? 1 : .55;
      for (const p of TAIL) { const [px, py] = project(cam, c.position.x + p[0], p[1], c.position.z + p[2]); glow(px, py, 46, .35 * k); }
    });
    // подпись линии — у её дальнего края
    const [lx, ly] = project(cam, 0, 0, LANE[0] - 2.4);
    atext('начало торможения', lx - 16, ly + 10, T.tochk - .05, t, { size: 34, w: 500, col: sub, align: 'right', track: 0, dy: 12, out: T.drug - .2 });
    // спидометры: крупно вверху (как «90 км/ч» в a1), к машинам — тонкие выноски
    const HX = [310, 770], HY = 520;
    const hud = (i, t0, val, col, o = {}) => {
      atext(String(val), HX[i], HY, t0, t, { size: 190, w: 700, col, track: -.045, blur: 18, scale0: 1.1, dur: .9, ...o });
      atext('км/ч', HX[i], HY + 66, t0 + .15, t, { size: 40, w: 500, col: sub, track: -.005, ...o });
      const c = cars[i], [px, py] = project(cam, c.position.x - .3, 1.42, c.position.z);
      const a = P(t, t0 + .25, .6) * (o.out ? 1 - P(t, o.out, .35, eIn) : 1);
      if (a > .003) { line(HX[i], HY + 96, lerp(HX[i], px, P(t, t0 + .25, .5)), lerp(HY + 96, py, P(t, t0 + .25, .5)), ink, .45 * a, 2); dot(px, py, 5, ink, a); }
    };
    const oH = T.sta - .15;
    hud(0, T.shest - .05, kmh(bv(V60, tau)), ink, { out: oH });
    if (t < T.meet) hud(1, T.dvad - .05, kmh(bv(V120, tau - TAU2B)), ink);
    else {
      // встреча: спидометр второй замирает на 104 (в точке, где встала первая) и краснеет; на «ста» — в центр, крупно
      const m = P(t, T.sta - .1, 1.0, eInOut);
      const pin = project(cam, D1 - .3, 1.42, LANE[1]);
      atext(String(Math.round(V_MEET)), lerp(HX[1], 540, m), lerp(HY, 600, m), T.dvad - .05, t, { size: lerp(190, 300, m), w: 700, col: stage.accent, track: -.045, blur: 18 });
      atext('км/ч', lerp(HX[1], 540, m), lerp(HY + 66, 690, m), T.dvad + .1, t, { size: lerp(40, 54, m), w: 500, col: sub, track: -.005 });
      // выноска теперь держится за точку 20 м, а не за уехавшую машину
      const a = 1 - P(t, oH, .35, eIn);
      if (a > .003) { line(HX[1], HY + 96, pin[0], pin[1], ink, .45 * a, 2); dot(pin[0], pin[1], 5, ink, a); }
    }
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    add(T.torm, 'whoosh', .2, .7);
    add(T.shest, 'tick', .14);
    add(T.b1, 'thud', .18, .8);
    add(T.drug + .3, 'whoosh', .32, .9);
    add(T.dvad, 'tick', .14, 1.1);
    add(T.meet - 1.5, 'riser', .22);
    add(T.meet, 'impact', .4, .9);
    add(T.sta, 'chime', .26, 1.0);
  },
});
