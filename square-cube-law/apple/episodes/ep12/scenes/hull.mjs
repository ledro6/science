// HULL (22.7 – 34.9 с), чёрный фон.
// h1 — тот же стальной кубик раскатывается: сначала в толстую плиту (объём тот же), затем в тонкий лист,
//      из-под которого выкатываются четыре борта (лист крестом); борта по очереди поднимаются — корпус.
// h2 — вокруг корпуса поднимается вода; корпус отрывается от дна и всплывает; вытесненный объём подсвечен
//      «рентгеном» (стеклянный блок поверх), выноска «≈ 8 м³», огромное красное «×8»;
//      стрелки: вес и выталкивающая сила, вторая растёт до равенства (1 т → 7,85 т);
//      итог «Металл тот же, / держит форма».
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeHull, makeWater, makeDisplaced, collectMats, setLit, frame, keys, force, glow, wordsAt, dec, HULL, DRAFT } from './kit.mjs';

const { L, B, H, TH } = HULL;
const WL = 1.62, SW = 16, SD = 9;
function TT() {
  return {
    ras: Wd('h1', 'Раскатаем'), st: Wd('h1', 'сталь'), ton: Wd('h1', 'тонкий'), list: Wd('h1', 'лист'), sog: Wd('h1', 'согнём'), korp: Wd('h1', 'корпус'),
    tep: Wd('h2', 'Теперь'), vyt: Wd('h2', 'вытесняет'), vos: Wd('h2', 'восемь'), kbm: Wd('h2', 'кубометров'), vody: Wd('h2', 'воды'),
    vyt2: Wd('h2', 'выталкивающая'), sila: Wd('h2', 'сила'), sr: Wd('h2', 'сравнивается'), ves: Wd('h2', 'весом'),
    met: Wd('h2', 'Металл'), der: Wd('h2', 'держит'), form: Wd('h2', 'форма'),
  };
}
const levelAt = (t, T) => WL * P(t, T.tep - .1, 1.5, eInOut);
const hullY = (t, T) => Math.max(0, levelAt(t, T) - DRAFT);
// выталкивающая сила (в тоннах) на стрелке: от «1 т» (как у кубика) до веса
const buoy = (t, T) => lerp(1, 7.85, P(t, T.sr - .1, 1.3, eInOut));

defineScene('hull', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const T = TT();
    const hull = makeHull();
    const water = makeWater(SW, SD, { opacity: .12, edgeOp: 0, surf: { base: .035, fres: .3, spec: 1.1 } });
    const disp = makeDisplaced();
    stage.root.add(hull, water, disp);
    return { stage, T, hull, water, disp, mats: collectMats(hull) };
  },

  update(t, s, st) {
    const { stage, T, hull, water, disp } = st, cam = stage.camera, Lg = stage.lights;
    const lr = P(t, s.start, .5), lk = P(t, s.start, .6);
    Lg.key.position.set(lerp(-4, 5, clamp((t - s.start) / 12)), 9, 6);
    Lg.key.intensity = 2.7 * lk; Lg.hemi.intensity = .5 * lk; Lg.rimL.intensity = 3.2 * lr; Lg.rimR.intensity = 2.4 * lr;
    setLit(st.mats, lerp(.2, 1, lk));
    // раскатка: кубик → плита (объём тот же) → тонкий лист + борта выкатываются → сгиб
    const r1 = P(t, T.ras, 1.25, eInOut), r2 = P(t, T.ton - .05, .8, eInOut);
    const slab = lerp(lerp(1, 1 / (L * B), r1), TH, r2);
    const bx = lerp(1, L, r1), bz = lerp(1, B, r1);
    const fold = [0, 1, 2, 3].map(i => P(t, T.sog + [0, .1, .45, .55][i], .95, eInOut));
    hull.set({ fold, grow: r2, slab, bx, bz });
    hull.position.set(0, hullY(t, T) + .012 * Math.sin((t - T.tep) * 1.6) * P(t, T.vyt, 1), 0);
    hull.rotation.set(0, 0, .01 * Math.sin((t - T.tep) * 1.2) * P(t, T.vyt, 1));
    water.set(levelAt(t, T), t, P(t, T.tep - .2, .5));
    water.hole(-L / 2 + .01, L / 2 - .01, -B / 2 + .01, B / 2 - .01);
    // вытесненный объём — от днища до ватерлинии
    const sub = Math.max(.001, levelAt(t, T) - hullY(t, T));
    disp.position.set(0, hullY(t, T), 0); disp.scale.set(1.004, sub, 1.004);
    disp.setA(P(t, T.vyt + .35, .6) * (1 - .55 * P(t, T.met - .3, .6)));
    // камера: на кубик → сверху на раскрытый лист → вниз, к воде (видно подводную часть)
    const [tx, ty, d, az, el, sy] = keys([
      [s.start, 0, .5, 13, 28, 24, 980], [T.ras + .1, 0, .5, 13, 30, 26, 980], [T.list + .2, 0, .2, 27, 34, 42, 960],
      [T.sog + .3, 0, .2, 27, 34, 42, 960], [T.korp + .6, 0, .7, 21, 30, 28, 960], [T.tep + .2, 0, .8, 21, 28, 22, 960],
      [T.vyt + 1.0, 0, 1.1, 20.5, 26, 24, 950], [s.end, 0, 1.15, 20.5, 32, 25, 950],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy, 420, .05 * P(t, s.start, 1));
    // h1: подписи процесса
    const o1 = T.tep - .3;
    atext('1 м³ стали', 540, 430, T.st - .05, t, { size: 72, w: 600, col: ink, track: -.02, out: o1, plain: true });
    atext('тот же объём, другая форма', 540, 500, T.sog + .2, t, { size: 44, w: 500, col: sub, track: -.005, out: o1 });
    // h2: «≈ 8 м³» у вытесненного объёма
    const y0 = Math.max(0, WL - DRAFT);
    const oX = T.vyt2 - .25;
    if (t > T.kbm - .2) {
      const a = 1 - P(t, T.met - .3, .4, eIn);
      const [ax, ay] = project(cam, -L * .22, y0 + DRAFT * .5, B / 2);
      atext('≈ 8 м³', ax, ay + 4, T.kbm, t, { size: 64, w: 600, col: ink, a, track: -.01, plain: true });
      atext('вытесненной воды', ax, ay + 52, T.vody, t, { size: 36, w: 500, col: ink, a: a * .75, track: 0 });
    }
    // огромное красное «×8» — главный акцент выпуска
    atext('×8', 540, 470, T.vos - .05, t, { size: 330, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: oX });
    atext('объём воды против объёма стали', 540, 548, T.vos + .25, t, { size: 46, w: 500, col: sub, track: -.005, out: oX });
    // стрелки сил: вес вниз, выталкивающая вверх растёт до равенства
    const aF = P(t, T.vyt2 - .1, .5) * (1 - .3 * P(t, T.met, .6));
    if (aF > .003) {
      const [cx, cy] = project(cam, L * .26, y0 + H * .42, B / 2);
      const [bx, by] = project(cam, L * .26, y0 + DRAFT * .5, B / 2);
      const Wpx = 200, fb = buoy(t, T);
      force(cx - 24, cy, Wpx, 1, ink, aF, P(t, T.vyt2, .9, eApple));
      force(bx + 24, by, Wpx * fb / 7.85, -1, ink, aF, P(t, T.vyt2 + .3, .6, eApple));
      atext('вес 7,85 т', cx - 46, cy + Wpx - 10, T.vyt2 + .2, t, { size: 40, w: 500, col: ink, a: aF, align: 'right', track: 0 });
      atext(`${dec(fb, fb > 1.005 && fb < 7.845 ? 1 : fb >= 7.845 ? 2 : 0)} т`, bx + 46, by - Wpx * fb / 7.85 + 14, T.sila, t, { size: 40, w: 600, col: ink, a: aF, align: 'left', track: 0 });
    }
    // итог
    wordsAt(['Металл', 'тот', 'же,'], [T.met - .05, T.met + .3, T.met + .45], 540, 400, t, { size: 104, w: 600, col: ink, track: -.03 });
    wordsAt(['держит', 'форма'], [T.der - .05, T.form - .05], 540, 515, t, { size: 104, w: 600, col: ink, track: -.03 });
  },

  sfx(add) {
    const T = TT();
    add(T.ras, 'swell', .28, .7);
    add(T.ton, 'whoosh', .22, 1.1);
    add(T.sog + .9, 'click', .32, .9);
    add(T.sog + 1.45, 'click', .3, 1.0);
    add(T.tep, 'swell', .25, .8);
    add(T.vos - 1.5, 'riser', .24);
    add(T.vos, 'impact', .4, .9);
    add(T.kbm, 'tick', .18, 1.1);
    add(T.vyt2, 'whoosh', .2, .9);
    add(T.ves, 'chime', .24, 1.0);
    add(T.met, 'thud', .22, .8);
  },
});
