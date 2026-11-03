// HOOK (0 – 9.16 с), чёрный фон. Земля как продукт на длиннофокусной камере.
// h1 — «Что если» по словам; Земля проявляется из темноты; на «вдвое больше» из неё «выходит» вторая Земля
//      и вырастает вдвое по радиусу (размерные линии R и 2R); «из того же камня» — серым «та же плотность»;
// h2 — на «восемь» огромное красное «×8» (масса), на «вдвое» рядом белое «×2» (вес).
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { makeEarth, makeShell, frame, keys, dim, wordsAt, glow, screenR } from './kit.mjs';

const R1 = .5, AX = -1.05, BX = .62;                      // радиус Земли «сейчас», итоговые положения двух Земель

function TT() {
  return {
    chto: Wd('h1', 'Что'), esli: Wd('h1', 'если'), zem: Wd('h1', 'Земля'), vd: Wd('h1', 'вдвое'), bol: Wd('h1', 'больше'),
    tog: Wd('h1', 'того'), kam: Wd('h1', 'камня'),
    mas: Wd('h2', 'масса'), vos: Wd('h2', 'восемь'), ty: Wd('h2', 'ты'), tyazh: Wd('h2', 'тяжелее'), vd2: Wd('h2', 'вдвое'),
  };
}
const splitP = (t, T) => P(t, T.vd - .15, 1.5, eInOut);
const growP = (t, T) => eSpring(clamp((t - T.vd + .05) / 1.5));

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const a = makeEarth(R1), b = makeEarth(R1);
    const atA = makeShell(R1 * 1.02, { base: 0, rim: .55, pow: 3.6 }), atB = makeShell(R1 * 1.02, { base: 0, rim: .55, pow: 3.6 });
    stage.root.add(a, b, atA, atB);
    return { stage, a, b, atA, atB, T: TT() };
  },

  update(t, s, st) {
    const { stage, a, b, atA, atB, T } = st, cam = stage.camera, L = stage.lights;
    // «Солнце» слева-спереди; тела проявляются из темноты на «Земля»
    const lit = P(t, T.zem - .35, 1.3, eApple);
    L.key.position.set(-5, 2.5, 6.5); L.key.target.position.set(0, 0, 0); L.key.intensity = 3.1 * lit; L.key.castShadow = false;
    L.hemi.intensity = .12 * lit; L.rimL.intensity = 1.6 * lit; L.rimR.intensity = 1.1 * lit;
    const m = splitP(t, T), k = lerp(1, 2, growP(t, T));
    a.position.set(lerp(0, AX, m), 0, 0);
    b.position.set(lerp(0, BX, m), 0, -.001);
    b.scale.setScalar(k);
    b.visible = t > T.vd - .2;
    a.rotation.set(0, t * .14 - .6, .41); b.rotation.set(0, t * .14 - .6, .41);
    atA.position.copy(a.position); atB.position.copy(b.position); atB.scale.setScalar(k);
    atA.material.uniforms.uOp.value = lit; atB.material.uniforms.uOp.value = lit * (b.visible ? 1 : 0);
    // камера: общий план с медленным дрейфом и отъездом, когда Земля вырастает
    const [d] = keys([[0, 13.5], [T.vd - .1, 13.2], [T.vd + 1.6, 16.2], [s.end, 15.4]], t, eInOut);
    frame(cam, [lerp(0, .14, m), 0, 0], d, -8 + t * 1.4, 6, 540, 960);
  },

  draw2d(t, s, st) {
    const { stage, a, b, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const pa = a.position.toArray(), pb = b.position.toArray();
    const [ax, ay] = project(cam, ...pa), [bx, by] = project(cam, ...pb);
    const ra = screenR(cam, pa, R1), rb = screenR(cam, pb, R1 * b.scale.x);
    glow(ax, ay, ra * 2.6, .07 * P(t, T.zem, 1.2));
    // --- h1: заголовок и размерные линии радиусов ---
    const oT = T.mas - .25;
    wordsAt(['Что', 'если'], [T.chto - .05, T.esli - .05], 540, 470, t, { size: 150, w: 600, col: ink, track: -.035, blur: 16, dur: .8, out: oT });
    atext('та же плотность', 540, 560, T.tog - .05, t, { size: 50, w: 500, col: sub, track: -.005, out: oT });
    const dA = P(t, T.bol + .5, .6) * (1 - P(t, T.mas - .3, .4, eIn));
    const yd = Math.max(ay + ra, by + rb) + 52;
    dim(ax, yd, ax + ra, yd, dA, ink);
    dim(bx, yd, bx + rb, yd, dA, ink);
    const oR = T.mas - .3;
    atext('R', ax + ra / 2, yd + 52, T.bol + .6, t, { size: 44, w: 600, col: ink, track: 0, dy: 14, out: oR });
    atext('2R', bx + rb / 2, yd + 52, T.bol + .75, t, { size: 44, w: 600, col: ink, track: 0, dy: 14, out: oR });
    atext('сейчас', ax, ay - ra - 36, T.bol + .9, t, { size: 38, w: 500, col: sub, track: 0, dy: 12, out: oR });
    // --- h2: масса ×8 (главный акцент, L³) и вес ×2 ---
    atext('×8', 310, 560, T.vos, t, { size: 280, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9 });
    atext('масса', 310, 640, T.vos + .2, t, { size: 50, w: 500, col: sub, track: -.005 });
    atext('×2', 780, 560, T.vd2 - .05, t, { size: 280, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('вес', 780, 640, T.vd2 + .15, t, { size: 50, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(T.chto - .05, 'bloom', .3, .85);
    add(T.zem - .3, 'swell', .26, .7);
    add(T.vd - .1, 'whoosh', .32, .75);
    add(T.vd + 1.2, 'thud', .22, .7);
    add(T.bol + .6, 'tick', .12);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .42, .9);
    add(T.vd2, 'chime', .24, 1);
  },
});
