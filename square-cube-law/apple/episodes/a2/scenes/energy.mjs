// ENERGY (≈22.4 – 33.3 с), чёрный фон.
// e1 — энергия движения кубиками из алюминия (фирменный ход канала): 60 км/ч — один кубик, 120 км/ч — квадрат 2×2
//      из четырёх («квадрат скорости»), «E ∝ v²»; тормоза гасят энергию одной и той же силой — кубики тают в одном
//      ритме, каждый кубик = 20 м пути: слева счётчик встаёт на 20 м, справа доходит до 80 м;
// e2 — график скорость–путь для 120 км/ч: кривая v = v0·√(1 − x/d); маленькая машина под осью тормозит по физике,
//      на половине пути (40 м) скорость ещё 85 км/ч: «−29 %».
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, MAT, roundedBox, shadowsOn, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, bump, makeCar, frame, collectMats, setLit, polyline, brakeLights, bx, bv, vAtX, DEC, V120, WR } from './kit.mjs';

const CS = .9, GAP = .06, HS = CS + GAP;
const LX = -1.75, RX = 1.0;                                 // одиночный кубик и квадрат 2×2
// e2: график
const GX0 = 150, GX1 = 900, GY0 = 1120, GY1 = 600;         // путь 0–80 м, скорость 0–120 км/ч
const sx = m => lerp(GX0, GX1, m / 80), sy = k => lerp(GY0, GY1, k / 120);
const CAR_Y = 1262, CD = 120;

function TT() {
  const T = {
    vse: Wd('e1', 'Всё'), en: Wd('e1', 'энергии'), dv: Wd('e1', 'движения'), rast: Wd('e1', 'растёт'), kv: Wd('e1', 'квадрат'), sk: Wd('e1', 'скорости'),
    torm: Wd('e1', 'тормоза'), gas: Wd('e1', 'гасят'), odn: Wd('e1', 'одной'), sil: Wd('e1', 'силой'),
    poe: Wd('e2', 'Поэтому'), perv: Wd('e2', 'первую'), pol: Wd('e2', 'половину'), puti: Wd('e2', 'пути'), pad: Wd('e2', 'падает'),
    men: Wd('e2', 'меньше'), tr: Wd('e2', 'треть'),
  };
  T.cut = T.poe - .15;                                      // смена кубиков на график
  T.eat = i => T.gas + .05 + i * .42;                       // i-й кубик тает (одинаковый ритм = одинаковая сила)
  T.go = T.pad - (V120 - Math.sqrt(V120 * V120 - 2 * DEC * 40)) / DEC;   // старт машины: к «падает» она на 40 м
  return T;
}
// клетки квадрата 2×2 (порядок таяния: верхний ряд, затем нижний)
const CELLS = [[0, 1], [1, 1], [0, 0], [1, 0]];

defineScene('energy', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const T = TT();
    const alu = MAT.aluminium(), geo = roundedBox(CS, .045, 3);
    const one = shadowsOn(new THREE.Mesh(geo, alu));
    const four = CELLS.map(() => shadowsOn(new THREE.Mesh(geo, alu)));
    const gC = new THREE.Group(); gC.add(one, ...four);
    const car = brakeLights(makeCar({ dark: true }));
    stage.root.add(gC, car);
    return { stage, T, gC, one, four, car };
  },

  update(t, s, st) {
    const { stage, T, gC, one, four, car } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cut ? 1 : 2;
    gC.visible = ph === 1; car.visible = ph === 2;
    if (ph === 1) {
      L.key.position.set(3, 10, 7); L.key.target.position.set(0, 0, 0); L.key.target.updateMatrixWorld();
      L.hemi.intensity = .45; L.rimL.intensity = 3.0; L.rimR.intensity = 2.2; L.key.intensity = 2.4;
      // появление: одиночный — на «энергии», квадрат — по кубику на «квадрат»; таяние — на «гасят» в одном ритме
      const melt = (m, t0) => { const q = P(t, t0, .45, eIn); return Math.max(1e-4, 1 - q); };
      const p1 = P(t, T.en - .1, .9, eApple);
      one.position.set(LX, CS / 2 + (1 - p1) * 1.4, 0);
      one.scale.setScalar(Math.max(1e-4, p1) * melt(one, T.eat(0)));
      one.rotation.y = (1 - p1) * .6;
      four.forEach((m, i) => {
        const [ci, cj] = CELLS[3 - i];                       // собираем снизу вверх, тает сверху вниз
        const p = P(t, T.kv - .15 + i * .09, .85, eInOut);
        const hx = RX + (ci - .5) * HS, hy = CS / 2 + cj * HS;
        m.position.set(lerp(hx * 1.6, hx, p), hy + (1 - p) * 1.6, (1 - p) * 2.2);
        m.rotation.set((1 - p) * .4, (1 - p) * .5 * (ci - .5), 0);
        const k = CELLS.findIndex(c => c[0] === ci && c[1] === cj);
        m.scale.setScalar(Math.max(1e-4, P(t, T.kv - .2 + i * .09, .5)) * melt(m, T.eat(k)));
      });
      const kk = clamp((t - s.start) / (T.cut - s.start));
      frame(cam, [(LX + RX) / 2, .95, 0], lerp(22, 20, eInOut(kk)), lerp(-8, 10, kk), lerp(16, 12, kk), 540, 1010);
      return;
    }
    // ---- e2: машина под осью графика ----
    cam.fov = 26; cam.updateProjectionMatrix();
    frame(cam, [0, 0, 0], CD, 0, 3, 540, CAR_Y);
    const k = project(cam, 1, 0, 0)[0] - project(cam, 0, 0, 0)[0];
    const tau = t - T.go;
    const xm = clamp(bx(V120, tau), 0, 40);                   // путь (м), машина держится на 40 м
    const held = bx(V120, tau) >= 40;
    car.position.set((sx(xm) - 540) / k - 2.2, 0, 0);
    car.scale.setScalar(Math.max(1e-3, P(t, T.cut + .1, .7)));
    car.spin(xm * 1.4 / WR);
    car.brake(tau > 0 ? 1 : 0);
    L.key.position.set(car.position.x + 3, 9, 6); L.key.target.position.copy(car.position); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.2; L.hemi.intensity = .45; L.rimL.intensity = 3; L.rimR.intensity = 2.2;
    st.held = held;
  },

  draw2d(t, s, st) {
    const { stage, T, gC } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    if (t < T.cut) {
      // ---- e1 ----
      const o1 = T.cut - .35;
      atext('Энергия движения', 540, 340, T.en - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: T.torm - .2 });
      atext('E ∝ v²', 540, 500, T.kv - .05, t, { size: 170, w: 600, col: ink, track: -.03, blur: 18, scale0: 1.08, dur: .9, out: T.torm - .2 });
      atext('Одна и та же сила', 540, 400, T.odn - .1, t, { size: 84, w: 600, col: ink, track: -.03, out: o1 });
      atext('каждый кубик гаснет за 20 м', 540, 470, T.sil - .05, t, { size: 40, w: 500, col: sub, track: -.005, out: o1 });
      // подписи под кубиками
      const [lx, ly] = project(cam, LX, 0, CS / 2 + .2), [rx, ry] = project(cam, RX, 0, CS / 2 + .2);
      atext('60 км/ч', lx, ly + 56, T.en + .1, t, { size: 38, w: 500, col: sub, track: -.005, dy: 14, out: o1 });
      atext('120 км/ч', rx, ry + 56, T.kv + .3, t, { size: 38, w: 500, col: sub, track: -.005, dy: 14, out: o1 });
      // «1» и «4» над столбиками, на таянии — счётчики пути
      const [ax, ay] = project(cam, LX, CS + .15, 0), [bx2, by] = project(cam, RX, 2 * HS + .1, 0);
      const yTop = Math.min(ay, by) - 50;
      atext('1', lx, yTop, T.en + .15, t, { size: 110, w: 700, col: ink, track: -.04, out: T.gas - .2 });
      atext('4', rx, yTop, T.kv + .2, t, { size: 110, w: 700, col: ink, track: -.04, out: T.gas - .2 });
      if (t > T.eat(0) + .15) {
        const nL = 20;
        let nR = 0; for (let i = 0; i < 4; i++) if (t >= T.eat(i) + .15) nR += 20;
        atext(nL + ' м', lx, yTop, T.eat(0) + .15, t, { size: 80, w: 600, col: ink, track: -.03, out: o1 });
        atext(nR + ' м', rx, yTop, T.eat(0) + .15, t, { size: 80, w: 600, col: ink, track: -.03, out: o1 });
      }
      const dip = bump(t, T.cut, .2);
      if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = '#000'; g.fillRect(0, 0, 1080, 1920); g.restore(); }
      return;
    }
    // ---- e2: график скорость–путь ----
    const ax = P(t, T.cut + .1, .8);
    line(GX0, GY0, GX1 + 24, GY0, ink, .8 * ax, 2);
    line(GX0, GY0, GX0, GY1 - 30, ink, .8 * ax, 2);
    atext('скорость, км/ч', GX0 + 16, GY1 - 14, T.cut + .3, t, { size: 34, w: 500, col: sub, align: 'left', track: 0, dy: 10 });
    [[0, '0'], [40, '40'], [80, '80 м']].forEach(([m, lab], i) => atext(lab, sx(m), GY0 + 46, T.cut + .3 + i * .08, t, { size: 32, w: 500, col: sub, track: 0, dy: 10 }));
    atext('120', GX0 - 18, sy(120) + 11, T.cut + .3, t, { size: 32, w: 500, col: sub, align: 'right', track: 0, dy: 10 });
    // кривая v = v0·√(1 − x/d)
    const pts = []; for (let i = 0; i <= 120; i++) { const m = 80 * (1 - Math.pow(1 - i / 120, 1.6)); pts.push([sx(m), sy(vAtX(V120, m) * 3.6)]); }
    polyline(pts, P(t, T.poe, .9, eInOut), ink, 1, 4);
    // половина пути
    const aH = P(t, T.pol - .05, .5);
    line(sx(40), GY0, sx(40), sy(120) - 10, sub, .7 * aH, 2, [6, 8]);
    atext('половина пути', sx(40) + 14, GY0 - 18, T.pol - .05, t, { size: 32, w: 500, col: sub, align: 'left', track: 0, dy: 10 });
    // маркер скорости машины
    const tau = t - T.go, xm = clamp(bx(V120, tau), 0, 40), v = vAtX(V120, xm) * 3.6;
    const aM = P(t, T.perv - .3, .4);
    if (aM > .003) {
      const mx = sx(xm), my = sy(v);
      line(mx, GY0, mx, my, ink, .45 * aM, 2);
      g.save(); g.globalAlpha = aM; g.fillStyle = '#000'; g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.arc(mx, my, 10, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore();
      atext(Math.round(v) + ' км/ч', mx + 22, my + 50, T.perv - .3, t, { size: 40, w: 600, col: ink, align: 'left', track: 0, dy: 10 });
    }
    // падение: пунктир уровня 120 и скобка 120 → 85
    const aD = P(t, T.pad - .05, .6);
    if (aD > .003) {
      line(GX0, sy(120), sx(40), sy(120), sub, .6 * aD, 2, [6, 8]);
      const xb = sx(40) - 26, y1 = sy(120), y2 = lerp(y1, sy(vAtX(V120, 40) * 3.6), P(t, T.pad, .7, eInOut));
      line(xb, y1, xb, y2, ink, aD, 3); line(xb - 10, y1, xb + 10, y1, ink, aD, 3); line(xb - 10, y2, xb + 10, y2, ink, aD * P(t, T.pad + .5, .2), 3);
    }
    atext('−29 %', 540, 450, T.tr - .1, t, { size: 220, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('скорость на половине пути', 540, 520, T.tr + .15, t, { size: 42, w: 500, col: sub, track: -.005 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .22, .7);
    add(T.en, 'thud', .22, .9);
    for (let i = 0; i < 4; i++) add(T.kv + .55 + i * .09, 'click', .12 + i * .01, .9 + i * .05);
    add(T.kv + .1, 'bloom', .2, .9);
    for (let i = 0; i < 4; i++) add(T.eat(i) + .1, 'tick', .14, 1.0 - i * .05);
    add(T.sil, 'chime', .2, .9);
    add(T.poe, 'whoosh', .22, .7);
    add(T.pad, 'tick', .14);
    add(T.tr, 'chime', .26, 1.0);
  },
});
