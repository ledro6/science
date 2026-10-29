// HOOK (0 – 11.17 с), чёрный фон. Земля и Луна как продукт на длиннофокусной камере.
// h1 — «384 400 км до Луны», размерная линия между телами; на «вдвое ближе» Луна плавно подъезжает,
//      счётчик сбегает к 192 200, камера мягко наезжает вслед;
// h2 — «притяжение»: стрелка у поверхности Земли растёт в 4 раза, «×4» белым; «приливы»: стеклянная водная
//      оболочка вытягивается к Луне, огромное красное «×8»;
// h3 — «Новая рубрика» серым и заголовок «Что если» по словам.
import { defineScene, makeStage, project, atext, P, Wd, E, THREE, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, fmt, makeEarth, makeMoon, makeShell, tideShell, frame, keys, dim, arrow, wordsAt, glow, screenR } from './kit.mjs';

const RE = .68, RM = .185, EX = -1.45, D0 = 3.0;           // радиусы, положение Земли, исходное расстояние (условный масштаб)

function TT() {
  return {
    chto: Wd('h1', 'Что'), vd: Wd('h1', 'вдвое'), bl: Wd('h1', 'ближе'),
    prit: Wd('h2', 'притяжение'), chet: Wd('h2', 'четыре'), pril: Wd('h2', 'приливы'), vos: Wd('h2', 'восемь'),
    eto: Wd('h3', 'Это'), nov: Wd('h3', 'новая'), chto2: Wd('h3', 'что'), esli: Wd('h3', 'если'),
  };
}
const moveP = (t, T) => P(t, T.vd - .12, 1.35, eInOut);

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const earth = makeEarth(RE), moon = makeMoon(RM);
    const shell = makeShell(RE * 1.07, { base: .06, rim: .9, pow: 2.4 });
    const atm = makeShell(RE * 1.015, { base: 0, rim: .5, pow: 4 });
    earth.position.set(EX, 0, 0); shell.position.copy(earth.position); atm.position.copy(earth.position);
    stage.root.add(earth, moon, shell, atm);
    return { stage, earth, moon, shell, atm, T: TT() };
  },

  update(t, s, st) {
    const { stage, earth, moon, shell, atm, T } = st, cam = stage.camera, L = stage.lights;
    // свет: «Солнце» слева-спереди, тела проявляются из темноты; контровой подчёркивает край
    const lit = P(t, 0, 1.4, eApple);
    L.key.position.set(-5, 2.5, 6.5); L.key.target.position.set(0, 0, 0); L.key.intensity = 3.1 * lit; L.key.castShadow = false;
    L.hemi.intensity = .12 * lit; L.rimL.intensity = 1.6 * lit; L.rimR.intensity = 1.1 * lit;
    earth.rotation.set(0, t * .14 - .6, .41);
    const m = moveP(t, T);
    moon.position.set(EX + lerp(D0, D0 / 2, m), 0, 0);
    moon.rotation.set(0, -.3, 0);
    // водная оболочка: появляется на «приливы», вытягивается к Луне; на «восемь» — сильный горб
    const sIn = P(t, T.pril - .1, .7);
    const b = lerp(.03, .08, P(t, T.pril, .8)) + .22 * eSpring(clamp((t - T.vos + .05) / 1.0));
    tideShell(shell, b, 0);
    shell.material.uniforms.uOp.value = sIn;
    shell.visible = sIn > .003;
    atm.material.uniforms.uOp.value = lit * (1 - sIn);
    // камера: общий план → наезд вслед за Луной → крупнее на заголовке рубрики
    const tx = lerp(EX + D0 / 2 - .05, EX + D0 / 4 - .22, P(t, T.vd - .05, 1.6, eInOut));
    const [d, el] = keys([[0, 20.5, 8], [T.vd - .05, 20, 8], [T.vd + 1.6, 14.2, 7], [T.eto, 13.8, 7], [11.2, 12, 4]], t, eInOut);
    frame(cam, [tx, 0, 0], d, -10 + t * 1.6, el, 540, 930);
  },

  draw2d(t, s, st) {
    const { stage, earth, moon, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const pE = project(cam, ...earth.position.toArray()), pM = project(cam, ...moon.position.toArray());
    const rE = screenR(cam, earth.position.toArray(), RE), rM = screenR(cam, moon.position.toArray(), RM);
    glow(pM[0], pM[1], rM * 5, .16 * P(t, .3, 1.2));
    // --- h1: расстояние ---
    const oD = T.prit - .3;
    const dv = P(t, T.chto + .1, .6) * (1 - P(t, T.pril - .4, .4, eIn));
    const yd = Math.max(pE[1] + rE, pM[1] + rM) + 46;
    dim(pE[0], yd, pM[0], yd, dv, ink);
    const v = lerp(384400, 192200, moveP(t, T));
    atext(fmt(Math.round(v / 100) * 100), 540, 520, T.chto + .05, t, { size: 210, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oD });
    atext('км до Луны', 540, 600, T.chto + .35, t, { size: 50, w: 500, col: sub, track: -.005, out: oD });
    // --- h2: притяжение ×4 (стрелка у поверхности Земли, направлена к Луне) ---
    const oA = T.pril - .25;
    const aA = P(t, T.prit, .5) * (1 - P(t, oA, .35, eIn));
    const dd = Math.hypot(pM[0] - pE[0], pM[1] - pE[1]) || 1, ux = (pM[0] - pE[0]) / dd, uy = (pM[1] - pE[1]) / dd;
    const gap = dd - rM - rE - 20;
    const len = gap * lerp(.17, .7, eSpring(clamp((t - T.chet + .05) / .9)));
    const x0 = pE[0] + ux * (rE + 10), y0 = pE[1] + uy * (rE + 10);
    arrow(x0, y0, x0 + ux * len, y0 + uy * len, ink, aA, 4, 16);
    atext('×4', 540, 560, T.chet, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oA });
    atext('притяжение', 540, 640, T.chet + .2, t, { size: 50, w: 500, col: sub, track: -.005, out: oA });
    // --- h2: приливы ×8 — главный акцент выпуска ---
    const oT = T.eto - .1;
    atext('×8', 540, 580, T.vos, t, { size: 360, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: oT });
    atext('сила приливов', 540, 665, T.vos + .2, t, { size: 50, w: 500, col: sub, track: -.005, out: oT });
    // --- h3: новая рубрика ---
    atext('Новая рубрика', 540, 330, T.nov, t, { size: 48, w: 500, col: sub, track: -.005 });
    wordsAt(['Что', 'если'], [T.chto2 - .05, T.esli - .05], 540, 480, t, { size: 160, w: 600, col: ink, track: -.035, blur: 16, dur: .8 });
    // сноска о масштабе
    atext('расстояние и размеры не в масштабе', 540, 1290, .9, t, { size: 28, w: 500, col: sub, a: .7, track: 0, dy: 10, out: T.eto });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.vd - .1, 'whoosh', .35, .8);
    add(T.vd + 1.2, 'thud', .22, .8);
    add(T.prit, 'tick', .14);
    add(T.chet, 'chime', .26, .95);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .42, .9);
    add(T.nov, 'swell', .22, .8);
    add(T.chto2 - .05, 'bloom', .3, .85);
    add(T.esli, 'chime', .22, 1.05);
  },
});
