// HOOK (h1–h2), чёрный фон. Графитовый стол и керамический бутерброд как продукт, медленная орбита.
// h1 — бутерброд проявляется из темноты на краю стола; на «почти» съезжает к краю, на «падает» срывается
//      (замедленно ×2) и на «вниз» ложится маслом вниз; камера отъезжает и показывает пол;
//      на «закон подлости» — вопрос серым сверху;
// h2 — «Разбираемся» серым и заголовок «Миф или нет?» по словам (как в m1).
import { defineScene, makeStage, atext, project, callout, P, Wd, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeToast, makeTable, wideShadow, fallSim, place, frame, keys, wordsAt, glow, TABLE } from './kit.mjs';

function TT() {
  return {
    poch: Wd('h1', 'почти'), pad: Wd('h1', 'падает'), masl: Wd('h1', 'маслом'), vniz: Wd('h1', 'вниз'),
    eto: Wd('h1', 'Это'), zak: Wd('h1', 'закон'), podl: Wd('h1', 'подлости'),
    razb: Wd('h2', 'Разбираемся'), mif: Wd('h2', 'миф'), ili: Wd('h2', 'или'), net: Wd('h2', 'нет'),
  };
}
const SIM = fallSim();
const T0 = TT();
// бутерброд срывается так, чтобы лечь ровно на «вниз»; замедление ×2
const SLOW = 2;
const tFall = T0.vniz - SIM.tLand * SLOW;

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    wideShadow(stage);
    const table = makeTable(), toast = makeToast();
    stage.root.add(table, toast);
    return { stage, table, toast, T: TT() };
  },

  update(t, s, st) {
    const { stage, toast, T } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, 0, 1.5, eApple);
    L.key.intensity = 2.6 * lit; L.hemi.intensity = .55 * lit; L.rimL.intensity = 3.2 * P(t, 0, 1.0); L.rimR.intensity = 2.4 * P(t, .1, 1.0);
    // до срыва: бутерброд лежит у края и медленно съезжает (центр масс выходит за кромку)
    const tau = (t - tFall) / SLOW;
    if (tau <= 0) {
      const x = lerp(-.42, .1, P(t, T.poch - .1, tFall - T.poch + .1, eInOut));
      place(toast, { x, y: TABLE.H + .07, phi: 0 });
    } else place(toast, SIM.at(tau));
    const toastY = tau > 0 ? SIM.at(tau).y : TABLE.H;
    // камера: крупно край стола → ведёт бутерброд вниз (съёмка «с проводкой») → низко у пола
    const fall = P(t, tFall + .05, T.vniz + .7 - tFall, eInOut);
    const ty = Math.max(.45, Math.min(lerp(TABLE.H - .15, .45, fall), toastY + .3)), tx = lerp(.3, 1.15, fall);
    const [d, el, sy] = keys([[0, 10.5, 20, 820], [T.pad - .2, 11, 18, 820], [T.vniz + .6, 9.5, 13, 900], [s.end, 11, 16, 900]], t, eInOut);
    frame(cam, [tx, ty, 0], d, 26 - t * 2.4, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, toast, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    // мягкое пятно света под бутербродом на полу после падения
    const [fx, fy] = project(cam, toast.position.x, 0, 0);
    glow(fx, fy, 260, .05 * P(t, T.vniz, .6));
    // выноска «маслом вниз» к упавшему бутерброду
    const cA = 1 - P(t, T.razb - .2, .4, eIn);
    const [ax, ay] = project(cam, toast.position.x - .38, .03, .3);
    callout(ax, ay, ax - 70, ay + 85, T.vniz + .15, t, ink, cA);
    atext('маслом вниз', ax - 70, ay + 128, T.vniz + .3, t, { size: 40, w: 500, col: sub, align: 'center', track: 0, dy: 14, out: T.razb - .2 });
    // h1: вопрос
    atext('Закон подлости?', 540, 340, T.zak - .05, t, { size: 104, w: 600, col: ink, track: -.03, out: T.razb - .25 });
    // h2: рубрика
    atext('Разбираемся', 540, 330, T.razb, t, { size: 48, w: 500, col: sub, track: -.005 });
    wordsAt(['Миф', 'или', 'нет?'], [T.mif - .05, T.ili - .05, T.net - .05], 540, 490, t, { size: 150, w: 600, col: ink, track: -.035, blur: 16, dur: .6 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(.4, 'swell', .2, .7);
    add(T.poch, 'whoosh', .18, 1.2);
    add(tFall + .05, 'whoosh', .26, .8);
    add(T.vniz, 'thud', .4, .85);
    add(T.zak, 'tick', .14);
    add(T.razb, 'swell', .22, .8);
    add(T.mif - .05, 'bloom', .3, .85);
    add(T.net, 'chime', .22, 1.05);
  },
});
