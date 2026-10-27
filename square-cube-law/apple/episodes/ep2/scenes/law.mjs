// LAW (21.42 – 36.81 с), чёрный фон. График в стиле M1: лог-шкалы, без сетки, подписи у линий.
// l1: «1932» крупно, «Макс Клайбер» → оси, керамические сферы-животные (мышь → слон), прямая через них;
// l2: «обмен веществ» — прямая наклона ¾ против пунктира «∝ масса»; формула P ∝ M¾;
// l3: масса ×10 000 (серым) → энергия всего ×1000 (красным).
// Сам график лежит в 3D-плоскости z = 0: камера медленно дрейфует, линии проецируются каждый кадр.
import {
  defineScene, makeStage, project, atext, atextWords, line, dot, measure, P, Wd, WdE, C, E, clamp, lerp,
  eApple, eIn, eInOut, eEase, eSpring, eStd, THREE, MAT, accent, C_GRAY,
} from '../../../engine.mjs';
import * as ENG from '../../../engine.mjs';
import { frame, formula } from '../lib.mjs';

const DU = .65;                                  // мировых единиц на порядок
const LM0 = -2, LM1 = 4, LP0 = -1, LP1 = 4.7;    // lg массы (кг), lg мощности (Вт)
const wx = lm => (lm - 1) * DU, wy = lp => (lp - LP0) * DU;
const K0 = Math.log10(3.4);                      // P ≈ 3.4·M^¾ Вт (M в кг)
const fit = lm => K0 + .75 * lm;
const ANIMALS = [
  ['мышь', .025, .04], ['кошка', 4, -.06], ['человек', 70, .05], ['бык', 700, -.04], ['слон', 4000, .03],
].map(([n, m, o]) => { const lm = Math.log10(m); return { n, lm, lp: fit(lm) + o, r: .075 + .026 * (lm + 2) }; });
const LMA = -.4, LMB = 3.6;                          // пара «в 10 000 раз тяжелее»

function TT() {
  return {
    y1932: Wd('l1', 'тысяча'), max: Wd('l1', 'Макс'), cmp: Wd('l1', 'сравнил'), anim: Wd('l1', 'животных'),
    mouse: Wd('l1', 'мыши'), bull: Wd('l1', 'быка'), rule: Wd('l1', 'вывел'),
    obmen: Wd('l2', 'Обмен'), prop: Wd('l2', 'пропорционально'), massa: Wd('l2', 'масса'), tri: Wd('l2', 'три'),
    heavy: Wd('l3', 'тяжелее'), tenk: Wd('l3', 'десять'), energy: Wd('l3', 'энергии'), thousand: Wd('l3', 'тысячу'),
  };
}

defineScene('law', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: 0 });
    stage.floor.visible = false;
    const T = TT();
    const spheres = ANIMALS.map((a, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), MAT.ceramicWhite());
      stage.root.add(m); return m;
    });
    T.pop = ANIMALS.map((a, i) => i === 0 ? T.mouse - .05 : i === 4 ? T.bull + .25 : lerp(T.mouse, T.bull, i / 3.4));
    return { stage, spheres, T };
  },

  update(t, s, st) {
    const { stage, spheres, T } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(-3, 8, 9); L.key.intensity = 2.4; L.rimL.intensity = 3.4; L.rimR.intensity = 2.6;
    spheres.forEach((m, i) => {
      const a = ANIMALS[i], k = eSpring(clamp((t - T.pop[i]) / .7));
      m.visible = k > .003;
      m.position.set(wx(a.lm), wy(a.lp), 0);
      m.scale.setScalar(a.r * k);
    });
    const u = clamp((t - s.start) / (s.end - s.start));
    frame(cam, [0, 1.85, 0], 22, lerp(-9, 8, u), lerp(5, -2, u), 540, 935);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub, g = ENG.g;
    const pr = (lm, lp) => project(cam, wx(lm), wy(lp), 0);
    const seg = (a, b, p, col, al, lw = 2, dash = null) => {
      if (p <= 0 || al <= .003) return;
      const [x1, y1] = pr(...a), [x2, y2] = pr(lerp(a[0], b[0], p), lerp(a[1], b[1], p));
      line(x1, y1, x2, y2, col, al, lw, dash);
    };

    // ---- l1: «1932» ----
    atext('1932', 540, 820, T.y1932, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.cmp - .15, outDur: .35 });
    atext('Макс Клайбер', 540, 905, T.max, t, { size: 52, w: 500, col: sub, track: -.005, out: T.cmp - .15, outDur: .35 });
    atext('Макс Клайбер, 1932', 96, 300, T.cmp + .1, t, { size: 36, w: 500, col: sub, align: 'left', track: 0, out: T.heavy - .7 });

    // ---- оси ----
    const ax = P(t, T.cmp, .9, eInOut), aOut = 1;
    seg([LM0, LP0], [LM1 + .15, LP0], ax, ink, .55, 2);
    seg([LM0, LP0], [LM0, LP1], ax, ink, .55, 2);
    // засечки по порядкам массы: 10 г, 1 кг, 100 кг, 10 т
    [[-2, '10 г'], [0, '1 кг'], [2, '100 кг'], [4, '10 т']].forEach(([lm, lab], i) => {
      const a = P(t, T.cmp + .3 + i * .08, .5);
      const [x, y] = pr(lm, LP0);
      line(x, y, x, y + 10, ink, .55 * a, 2);
      atext(lab, x, y + 40, T.cmp + .3 + i * .08, t, { size: 26, w: 500, col: sub, a: .9, track: 0, dy: 10, dur: .5 });
    });
    for (let lm = -1; lm <= 3; lm += 2) { const [x, y] = pr(lm, LP0); line(x, y, x, y + 6, ink, .4 * ax, 2); }
    { const [x, y] = pr(LM1 + .15, LP0); atext('масса', x, y - 16, T.cmp + .6, t, { size: 30, w: 500, col: sub, align: 'right', track: 0, dy: 10 }); }
    { const [x, y] = pr(LM0, LP1); atext('обмен веществ', x + 18, y + 10, T.obmen, t, { size: 30, w: 500, col: sub, align: 'left', track: 0, dy: 10, out: T.heavy - .2 }); }

    // ---- точки-животные: подписи ----
    ANIMALS.forEach((a, i) => {
      const t0 = T.pop[i] + .15;
      const [x, y] = pr(a.lm, a.lp);
      const off = [[26, 10, 'left'], [0, -46, 'center'], [20, 62, 'left'], [24, 66, 'left'], [0, -58, 'center']][i];
      atext(a.n, x + off[0], y + off[1], t0, t, { size: 30, w: 500, col: sub, align: off[2], track: 0, dy: 10, dur: .55 });
    });

    // ---- прямая ¾ (белая) и пунктир «∝ масса» (серый) ----
    const pf = P(t, T.rule - .05, 1.2, eInOut);
    seg([LM0, fit(LM0)], [LM1, fit(LM1)], pf, ink, .95, 4);
    const pd = P(t, T.prop, 1.3, eInOut), mo = ANIMALS[0];
    const lmEnd = 3.72;
    seg([mo.lm, mo.lp], [lmEnd, mo.lp + (lmEnd - mo.lm)], pd, C_GRAY, .9, 3, [10, 12]);
    { const [x, y] = pr(2.35, mo.lp + (2.35 - mo.lm)); atext('∝ масса', x - 22, y, T.prop + .7, t, { size: 34, w: 500, col: C_GRAY, align: 'right', track: 0, dy: 10, out: T.heavy - .2 }); }
    { const [x, y] = pr(0, fit(0)); atext('∝ масса¾', x + 24, y + 64, T.tri + .2, t, { size: 34, w: 600, col: ink, align: 'left', track: 0, dy: 10, plain: true, out: T.heavy - .2 }); }

    // ---- формула ----
    formula(540, 470, T.massa, T.tri, t, { size: 130, col: ink, out: T.tenk - .3 });

    // ---- l3: в 10 000 раз тяжелее → в 1000 раз больше энергии ----
    const A = [LMA, fit(LMA)], B = [LMB, fit(LMB)];
    const hk = P(t, T.tenk, .6), ek = P(t, T.energy - .1, .6);
    [A, B].forEach(q => {
      const [x, y] = pr(...q);
      if (hk > .003) { g.save(); g.globalAlpha = hk; g.strokeStyle = ink; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, 13, 0, 7); g.stroke(); g.restore(); }
    });
    // вертикальные проекции на ось массы и отрезок ×10 000
    seg(A, [LMA, LP0], P(t, T.tenk + .1, .5), C_GRAY, .8, 2, [6, 8]);
    seg(B, [LMB, LP0], P(t, T.tenk + .1, .5), C_GRAY, .8, 2, [6, 8]);
    seg([LMA, LP0], [LMB, LP0], P(t, T.heavy - .1, .8, eInOut), C_GRAY, 1, 7);
    // горизонтальные проекции на ось обмена и отрезок ×1000
    seg(A, [LM0, A[1]], P(t, T.energy - .1, .5), ink, .7, 2, [6, 8]);
    seg(B, [LM0, B[1]], P(t, T.energy - .1, .5), ink, .7, 2, [6, 8]);
    seg([LM0, A[1]], [LM0, B[1]], P(t, T.thousand - .1, .8, eInOut), ink, 1, 7);

    atext('×10 000', 96, 350, T.tenk + .15, t, { size: 104, w: 700, col: C_GRAY, align: 'left', track: -.04, blur: 16, scale0: 1.1, dur: .8 });
    atext('масса', 100, 398, T.heavy, t, { size: 36, w: 500, col: C_GRAY, align: 'left', track: 0 });
    atext('×1000', 944, 350, T.thousand, t, { size: 150, w: 700, col: accent(), align: 'right', track: -.045, blur: 20, scale0: 1.15, dur: .9 });
    atext('энергия', 940, 398, T.thousand + .25, t, { size: 36, w: 500, col: sub, align: 'right', track: 0 });
  },

  sfx(add) {
    const T = TT();
    add(T.y1932, 'chime', .25, .9);
    add(T.cmp, 'whoosh', .25, .8);
    TT().mouse && [0, 1, 2, 3, 4].forEach(i => add(lerp(T.mouse, T.bull, i / 3.4) - .05, 'click', .16, 1 + i * .06));
    add(T.rule, 'swell', .25);
    add(T.prop, 'tick', .2);
    add(T.tri, 'chime', .3);
    add(T.tenk + .1, 'click', .25);
    add(T.thousand - 1.5, 'riser', .3);
    add(T.thousand, 'impact', .5, .8);
  },
});
