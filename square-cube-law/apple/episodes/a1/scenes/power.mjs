// POWER (≈25.6 – 40.5 с), чёрный фон.
// p1 — машина-керамика на медленной орбите, формула «P = F · v» собирается по словам, под символами подписи;
// p2 — фирменный ход канала: куб 2×2×2 собирается из 8 алюминиевых кубиков: на «Четыре» — грань 2×2 (сила, v²),
//      на «два» — второй слой (скорость, ×v); «4 × 2» → огромное красное «×8» → «P ∝ v³» (³ красная), размерные линии «2»;
// p3 — кубики перестраиваются в столбики мощности: 1 кубик — 90 км/ч, ≈ 6 кВт; башня из 8 — 180 км/ч, ≈ 50 кВт.
import { defineScene, makeStage, project, atext, measure, P, Wd, E, THREE, MAT, roundedBox, shadowsOn, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, bump, makeCar, frame, keys, dim, collectMats, setLit } from './kit.mjs';

const CS = .9, GAP = .05, HS = CS + GAP;
const TX = 1.5, LX = -2.3;                                  // башня и одиночный кубик в p3
function TT() {
  return {
    mo: Wd('p1', 'мощность'), rav: Wd('p1', 'равна'), sil: Wd('p1', 'силе'), um: Wd('p1', 'умноженной'), sk: Wd('p1', 'скорость'),
    che: Wd('p2', 'Четыре'), dva: Wd('p2', 'два'), vos: Wd('p2', 'восемь'), sko: Wd('p2', 'Скорость'), kub: Wd('p2', 'кубе'),
    leg: Wd('p3', 'легковушки'), dev: Wd('p3', 'девяноста'), shes: Wd('p3', 'шести'), kv: Wd('p3', 'киловатт'),
    sta: Wd('p3', 'ста'), vosm: Wd('p3', 'восьмидесяти'), pya: Wd('p3', 'пятьдесят'),
    cutB: (E('p1') + Wd('p2', 'Четыре')) / 2 - .1,
  };
}
// клетка куба 2×2×2 на полу: i — x, j — y (слой), k — z (k = 1 — передняя грань)
const cell = (i, j, k) => [(i - .5) * HS, CS / 2 + j * HS, (k - .5) * HS];

defineScene('power', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const T = TT();
    const car = makeCar({ dark: true });
    const alu = MAT.aluminium(), geo = roundedBox(CS, .045, 3), cubes = [];
    const gB = new THREE.Group();
    let slot = 0;
    for (let j = 0; j < 2; j++) for (let k = 1; k >= 0; k--) for (let i = 0; i < 2; i++) {
      const m = shadowsOn(new THREE.Mesh(geo, alu)); gB.add(m);
      cubes.push({ m, i, j, k, home: cell(i, j, k), slot: slot++ });
    }
    // одиночный кубик (90 км/ч) — появляется в p3
    const one = shadowsOn(new THREE.Mesh(geo, alu)); gB.add(one);
    stage.root.add(car, gB);
    return { stage, T, car, gB, cubes, one, mCar: collectMats(car) };
  },

  update(t, s, st) {
    const { stage, T, car, gB, cubes, one } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(3, 10, 7); L.hemi.intensity = .45; L.rimL.intensity = 3.0; L.rimR.intensity = 2.2; L.key.intensity = 2.4;
    const ph = t < T.cutB ? 1 : 2;
    car.visible = ph === 1; gB.visible = ph === 2;
    if (ph === 1) {
      setLit(st.mCar, P(t, s.start, 1.0) * (1 - P(t, T.cutB - .45, .4, eIn)));
      car.spin((t - s.start) * 4 / .36);
      const k = clamp((t - s.start) / (T.cutB - s.start));
      frame(cam, [0, .7, 0], lerp(25, 23, eInOut(k)), lerp(30, 48, k), lerp(9, 12, k), 540, 1060);
      return;
    }
    // ---- кубики ----
    cubes.forEach(c => {
      // сборка: передняя грань (k = 1) на «Четыре», задняя (k = 0) въезжает на «два»
      const t0 = c.k === 1 ? T.che - .15 + (c.i + c.j * 2) * .07 : T.dva - .1 + (c.i + c.j * 2) * .07;
      const p = P(t, t0, .9, eInOut);
      const from = c.k === 1 ? [c.home[0] * 1.8, c.home[1] + 1.6, c.home[2] + 2.4] : [c.home[0], c.home[1], c.home[2] - 3.2];
      let x = lerp(from[0], c.home[0], p), y = lerp(from[1], c.home[1], p), z = lerp(from[2], c.home[2], p);
      let sc = Math.max(1e-4, P(t, t0 - .05, .5));
      // p3: в башню (снизу вверх), каждый кубик по дуге вперёд, чтобы не задевать соседей
      const q = P(t, T.leg + .05 + c.slot * .16, 1.0, eInOut);
      if (q > 0) {
        const tgt = [TX, CS / 2 + c.slot * HS, 0];
        x = lerp(x, tgt[0], q); y = lerp(y, tgt[1], q) + Math.sin(Math.PI * q) * .25; z = lerp(z, tgt[2], q) + Math.sin(Math.PI * q) * 1.4;
      }
      c.m.position.set(x, y, z); c.m.scale.setScalar(sc);
      c.m.rotation.set((1 - p) * (c.k ? .4 : 0), (1 - p) * .5 * (c.i - .5), 0);
    });
    const po = P(t, T.dev - .1, .8, eApple);
    one.position.set(LX, CS / 2 + (1 - po) * 1.2, 0); one.scale.setScalar(Math.max(1e-4, po));
    // камера: куб крупно на орбите → отъезд, видны столбики
    const k3 = P(t, T.leg - .1, 2.2, eInOut);
    const kk = clamp((t - T.cutB) / (T.leg - T.cutB));
    const tgt = [lerp(0, -.35, k3), lerp(HS * .95, 3.75, k3), 0];
    const d = lerp(lerp(20, 18.5, eInOut(kk)), 46, k3), az = lerp(lerp(28, 40, kk), 14, k3) + (t - T.leg) * .4 * k3, el = lerp(lerp(24, 20, kk), 9, k3);
    frame(cam, tgt, d, az, el, 540, lerp(990, 845, k3));
  },

  draw2d(t, s, st) {
    const { stage, T, cubes, gB } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    // --- p1: P = F · v, символы по словам, под ними подписи ---
    const o1 = T.cutB - .45;
    const toks = ['P', '=', 'F', '·', 'v'], tt = [T.mo, T.rav, T.sil, T.um, T.sk], labs = ['мощность', null, 'сила', null, 'скорость'];
    const fs = 190, fw = 600, tr = -.02, sp = measure(' ', fs, fw, tr), ws = toks.map(q => measure(q, fs, fw, tr));
    let cx = 540 - (ws.reduce((a, b) => a + b, 0) + sp * (toks.length - 1)) / 2;
    toks.forEach((q, i) => {
      atext(q, cx, 560, tt[i] - .05, t, { size: fs, w: fw, col: ink, align: 'left', track: tr, blur: 16, out: o1 });
      if (labs[i]) atext(labs[i], cx + ws[i] / 2, 640, tt[i] + .15, t, { size: 40, w: 500, col: sub, track: -.005, dy: 16, out: o1 });
      cx += ws[i] + sp;
    });
    // --- p2: 4 × 2 → ×8 → P ∝ v³ ---
    const oF = T.vos - .1;
    atext('4', 350, 470, T.che, t, { size: 200, w: 700, col: ink, track: -.04, blur: 18, out: oF, outDur: .3 });
    atext('× 2', 650, 470, T.dva, t, { size: 200, w: 700, col: ink, track: -.04, blur: 18, out: oF, outDur: .3 });
    atext('сила', 350, 545, T.che + .2, t, { size: 42, w: 500, col: sub, track: -.005, out: oF, outDur: .3 });
    atext('скорость', 650, 545, T.dva + .2, t, { size: 42, w: 500, col: sub, track: -.005, out: oF, outDur: .3 });
    const o8 = T.sko - .15;
    atext('×8', 540, 500, T.vos, t, { size: 340, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: o8, outDur: .3 });
    atext('мощность', 540, 580, T.vos + .2, t, { size: 50, w: 500, col: sub, track: -.005, out: o8, outDur: .3 });
    const oC = T.leg - .1;
    atext('P ∝ v³', 540, 470, T.sko, t, { size: 170, w: 600, col: ink, track: -.03, blur: 18, scale0: 1.08, dur: .9, out: oC });
    atext('скорость в кубе', 540, 548, T.kub - .05, t, { size: 46, w: 500, col: sub, track: -.005, dy: 18, out: oC });
    // размерные линии «2» по трём рёбрам собранного куба
    if (t > T.cutB) {
      gB.updateMatrixWorld();
      const a = P(t, T.kub - .1, .5) * (1 - P(t, oC, .3, eIn));
      const e = HS - GAP / 2, o = .22, yb = 0;
      const edge = (p1, p2, lab, n) => {
        const A = project(cam, ...p1), B = project(cam, ...p2);
        dim(A[0], A[1], B[0], B[1], a, ink);
        atext(lab, (A[0] + B[0]) / 2 + n[0], (A[1] + B[1]) / 2 + n[1], T.kub, t, { size: 46, w: 600, col: ink, track: 0, dy: 12, out: oC });
      };
      edge([-e, yb, e + o], [e, yb, e + o], '2', [0, 40]);
      edge([e + o, yb, e], [e + o, yb, -e], '2', [34, 34]);
      edge([-e - o, yb, e], [-e - o, yb + 2 * HS - GAP, e], '2', [-36, 14]);
    }
    // --- p3: столбики мощности ---
    if (t > T.leg) {
      const [lx, ly] = project(cam, LX, 0, CS / 2 + .1), [tx, ty] = project(cam, TX, 0, CS / 2 + .1);
      atext('90 км/ч', lx, ly + 62, T.dev, t, { size: 40, w: 500, col: sub, track: -.005, dy: 14 });
      atext('180 км/ч', tx, ty + 62, T.vosm, t, { size: 40, w: 500, col: sub, track: -.005, dy: 14 });
      const [ax, ay] = project(cam, LX, CS + .05, 0);
      atext('≈ 6 кВт', ax, ay - 40, T.shes, t, { size: 64, w: 600, col: ink, track: -.02 });
      const top = CS + 7 * HS * P(t, T.leg + .05 + 7 * .16, 1.0, eInOut);
      const [bx, by] = project(cam, TX, top + .05, 0);
      atext('≈ 50 кВт', bx, Math.min(by, ay - 120) - 46, T.pya - .05, t, { size: 120, w: 700, col: ink, track: -.04, blur: 18, scale0: 1.1, dur: .9 });
    }
    const dip = bump(t, T.cutB, .2);
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = '#000'; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .22, .7);
    add(T.mo, 'tick', .14); add(T.sil, 'tick', .14); add(T.sk, 'tick', .14);
    for (let i = 0; i < 4; i++) add(T.che + .55 + i * .07, 'click', .12 + i * .01, .9 + i * .04);
    for (let i = 0; i < 4; i++) add(T.dva + .6 + i * .07, 'click', .12 + i * .01, 1.0 + i * .04);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .42, .9);
    add(T.sko, 'bloom', .26, .85);
    add(T.leg + .1, 'whoosh', .25, .7);
    for (let i = 0; i < 8; i++) add(T.leg + 1.0 + i * .16, 'click', .1 + i * .01, .85 + i * .05);
    add(T.dev, 'thud', .2, .9);
    add(T.shes, 'chime', .18, .9);
    add(T.pya, 'chime', .28, 1.05);
  },
});
