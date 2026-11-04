// HOOK (0 – 10.12 с), чёрный фон. Керамическая фигура человека как продукт на длиннофокусной камере.
// h1 — «Что если» по словам; фигура проявляется из темноты на «человек»; на «вдвое» из неё «выходит» копия
//      и вырастает вдвое (те же пропорции), камера отъезжает; «сохранив пропорции» — серым «те же пропорции»;
// h2 — размерные линии «1,75 м» и «3,5 м» на «Рост … три с половиной»; на «восемь» огромное красное «×8» (вес, L³),
//      на «полутонны» белым «> 500 кг».
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { makeHuman, collectMats, setLit, frame, dim, wordsAt, glow, HUMAN_H } from './kit.mjs';

const AX = -1.0, BX = .62;                       // итоговые положения обычного человека и великана

function TT() {
  return {
    chto: Wd('h1', 'Что'), esli: Wd('h1', 'если'), chel: Wd('h1', 'человек'), vyr: Wd('h1', 'вырастет'), vd: Wd('h1', 'вдвое'),
    sohr: Wd('h1', 'сохранив'), prop: Wd('h1', 'пропорции'),
    rost: Wd('h2', 'Рост'), tri: Wd('h2', 'три'), ves: Wd('h2', 'вес'), vos: Wd('h2', 'восемь'), pol: Wd('h2', 'полутонны'),
  };
}
const splitP = (t, T) => P(t, T.vd - .15, 1.5, eInOut);
const growP = (t, T) => eSpring(clamp((t - T.vd + .05) / 1.5));

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const a = makeHuman(), b = makeHuman();
    a.rotation.y = .18; b.rotation.y = -.12;
    stage.root.add(a, b);
    return { stage, a, b, mA: collectMats(a), mB: collectMats(b), T: TT() };
  },

  update(t, s, st) {
    const { stage, a, b, T } = st, cam = stage.camera, L = stage.lights;
    // фигура «вырезается» светом из темноты на «человек»
    const lit = P(t, T.chel - .45, 1.4, eApple);
    L.key.position.set(3, 9, 6); L.key.intensity = 2.6 * lit; L.rimL.intensity = 3.2 * lit; L.rimR.intensity = 2.4 * lit; L.hemi.intensity = .5 * lit;
    stage.floor.material.opacity = .55 * lit;
    setLit(st.mA, lit); setLit(st.mB, lit);
    const m = splitP(t, T), k = lerp(1, 2, growP(t, T));
    a.position.set(lerp(0, AX, m), 0, 0);
    b.position.set(lerp(0, BX, m), 0, -.002);
    b.scale.setScalar(k);
    b.visible = t > T.vd - .2;
    // медленный поворот «на витрине»
    a.rotation.y = .3 - .03 * t; b.rotation.y = lerp(.3 - .03 * t, -.1 - .02 * t, m);
    // камера: фигура крупно → общий план двух фигур
    // дистанция растёт вместе с великаном: он сохраняет размер в кадре и не наезжает на заголовок
    const gp = growP(t, T), d = 10.6 * k * lerp(1, .93, gp) - .12 * Math.max(0, t - T.vd - 1.6);
    frame(cam, [lerp(0, -.2, m), lerp(.88, 1.75, gp), 0], d, -6 + t * .9, 5, 540, 925);
  },

  draw2d(t, s, st) {
    const { stage, a, b, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const [gx, gy] = project(cam, b.position.x, HUMAN_H * b.scale.x * .55, 0);
    glow(gx, gy, 520 * b.scale.x / 2 + 120, .055 * P(t, T.chel, 1.2));
    // --- h1: заголовок ---
    const oT = T.rost - .25;
    wordsAt(['Что', 'если'], [T.chto - .05, T.esli - .05], 540, 430, t, { size: 150, w: 600, col: ink, track: -.035, blur: 16, dur: .8, out: oT });
    atext('те же пропорции', 540, 510, T.sohr - .05, t, { size: 50, w: 500, col: sub, track: -.005, out: oT });
    // --- h2: размерные линии роста ---
    const oD = T.ves - .3, dA = 1 - P(t, oD, .4, eIn);
    const xa = a.position.x - .42, xb = b.position.x + .38 * b.scale.x;
    const [ax0, ay0] = project(cam, xa, 0, 0), [ax1, ay1] = project(cam, xa, HUMAN_H, 0);
    const [bx0, by0] = project(cam, xb, 0, 0), [bx1, by1] = project(cam, xb, HUMAN_H * b.scale.x, 0);
    dim(ax0, ay0, ax0, ay1, dA * P(t, T.prop - .1, .5), ink, 12, P(t, T.prop - .1, .8, eInOut));
    dim(bx0, by0, bx0, by1, dA * P(t, T.rost - .05, .5), ink, 12, P(t, T.rost - .05, 1.0, eInOut));
    atext('1,75 м', ax0, ay1 - 30, T.prop + .2, t, { size: 44, w: 600, col: ink, track: 0, dy: 14, out: oD });
    atext('3,5 м', bx0, by1 - 34, T.tri - .05, t, { size: 64, w: 600, col: ink, track: -.01, dy: 16, out: oD });
    atext('рост', bx0, by1 - 104, T.rost + .1, t, { size: 38, w: 500, col: sub, track: 0, dy: 12, out: oD });
    // --- h2: вес ×8 (главный акцент, L³) и «> 500 кг» ---
    atext('×8', 300, 560, T.vos, t, { size: 280, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9 });
    atext('вес', 300, 640, T.vos + .2, t, { size: 50, w: 500, col: sub, track: -.005 });
    atext('> 500 кг', 300, 800, T.pol - .05, t, { size: 96, w: 600, col: ink, track: -.03, blur: 16, scale0: 1.08, dur: .8 });
  },

  sfx(add) {
    const T = TT();
    add(T.chto - .05, 'bloom', .3, .85);
    add(T.chel - .4, 'swell', .26, .7);
    add(T.vd - .1, 'whoosh', .32, .75);
    add(T.vd + 1.2, 'thud', .26, .65);
    add(T.prop, 'tick', .12);
    add(T.tri, 'tick', .14, .9);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .42, .9);
    add(T.pol, 'chime', .22, .95);
  },
});
