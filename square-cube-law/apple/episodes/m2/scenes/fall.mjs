// FALL (f1–f2), чёрный фон. Профиль стола 75 см, справа — колонка цифр.
// f1 — бутерброд замер на кромке; на «высотой» тянется размерная линия, на «семидесяти» — «75 см»;
//      на «падает» он срывается (замедление ×2) и ложится маслом вниз, счётчик «0,39 с» бежит синхронно с падением;
// f2 — повтор в сильном замедлении: бутерброд снова на краю, падает, оставляя след из полупрозрачных копий
//      (видно, как он поворачивается), бежит маленький счётчик; на «пол-оборота» — огромное красное «½ оборота»
//      (единственный акцент); на «приземляется» — удар, на «маслом вниз» — выноска к нижней стороне.
import { defineScene, makeStage, atext, project, callout, line, P, Wd, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeToast, makeTable, wideShadow, ghosts, fallSim, place, frame, keys, dim, TABLE } from './kit.mjs';

function TT() {
  return {
    vys: Wd('f1', 'высотой'), sem: Wd('f1', 'семидесяти'), sant: Wd('f1', 'сантиметров'), pad: Wd('f1', 'падает'),
    men: Wd('f1', 'меньше'), polov: Wd('f1', 'половины'), sek: Wd('f1', 'секунды'),
    za: Wd('f2', 'За'), uspev: Wd('f2', 'успевает'), pol: Wd('f2', 'пол-оборота'), I: Wd('f2', 'И'), prizem: Wd('f2', 'приземляется'),
    maslom: Wd('f2', 'маслом'), vniz: Wd('f2', 'вниз'),
  };
}
const K = 1.7;                                            // бутерброд крупнее натуры (для читаемости следа)
const SIM = fallSim({ k: K });
const T0 = TT();
const SLOW1 = 2;                                         // первое падение
const R0 = T0.za + .4, SLOW2 = (T0.prizem - R0) / SIM.tLand;   // повтор: касание ровно на «приземляется»
const NG = 6, XD = 2.7;                                  // копий в следе; x размерной линии
const fmt = v => v.toFixed(2).replace('.', ',') + ' с';

// моменты копий: равные шаги по высоте (а не по времени), последняя — у самого пола
const gT = i => SIM.t1 + (SIM.tLand - SIM.t1) * Math.sqrt((i + 1) / (NG + .6));

function phase(t, T) {
  // 0 — замер на кромке, 1 — первое падение, 2 — повтор
  if (t < T.za + .05) return { tau: Math.max(0, (t - T.pad) / SLOW1), rep: false };
  return { tau: Math.max(0, (t - R0) / SLOW2), rep: true };
}

defineScene('fall', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    wideShadow(stage);
    const table = makeTable(), toast = makeToast();
    const gh = ghosts(stage.root, NG, .3);
    stage.root.add(table, toast);
    return { stage, table, toast, gh, T: TT() };
  },

  update(t, s, st) {
    const { stage, toast, gh, T } = st, cam = stage.camera;
    const { tau, rep } = phase(t, T);
    place(toast, SIM.at(tau), K);
    // смена «дубля»: упавший бутерброд гаснет, на кромке проявляется снова
    const op = Math.min(1 - P(t, T.za - .25, .3, eIn) * (1 - P(t, T.za + .1, .35)), 1);
    toast.setOpacity(op);
    gh.forEach((g, i) => {
      const tk = gT(i);
      place(g, SIM.at(tk), K);
      const a = rep ? clamp((tau - tk) / .03) : 0;
      g.visible = a > .01;
      for (const k in g.mats) g.mats[k].opacity = .3 * a;
    });
    const [d, az, el] = keys([[s.start, 31.5, -30, 9], [T.za, 30, -25, 8], [s.end, 29, -21, 9]], t, eInOut);
    frame(cam, [2.4, 3.75, 0], d, az, el, 540, 730);
    st.tau = tau; st.rep = rep;
  },

  draw2d(t, s, st) {
    const { stage, toast, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    const CX = 580;
    // пол
    const [fx1, fy1] = project(cam, -1.2, 0, 0), [fx2, fy2] = project(cam, 6, 0, 0);
    line(fx1, fy1, fx2, fy2, ink, .22 * P(t, s.start + .2, .8), 2);
    // размерная линия 75 см
    const [dx, dy1] = project(cam, XD, TABLE.H, 0), [, dy2] = project(cam, XD, 0, 0);
    const dA = P(t, T.vys - .1, .6) * (1 - P(t, T.za - .2, .4, eIn) * .6);
    const dp = P(t, T.vys, .9, eInOut);
    dim(dx, dy1, dx, lerp(dy1, dy2, dp), dA, ink);
    line(project(cam, .3, TABLE.H, 0)[0], dy1, dx - 14, dy1, ink, dA * .35, 1.5, [4, 6]);
    // f1: 75 см → 0,39 с
    const big = { size: 150, w: 600, col: ink, align: 'left', track: -.04, blur: 18, scale0: 1.1 };
    atext('75 см', CX, 720, T.sem - .05, t, { ...big, out: T.pad - .1 });
    atext('высота стола', CX + 4, 790, T.sem + .2, t, { size: 42, w: 500, col: sub, align: 'left', track: 0, out: T.pad - .1 });
    const tau1 = Math.max(0, (t - T.pad) / SLOW1), v1 = .39 * clamp(tau1 / SIM.tLand);
    atext(fmt(v1), CX, 720, T.pad, t, { ...big, out: T.za - .1 });
    atext('меньше полсекунды', CX + 4, 790, T.men, t, { size: 42, w: 500, col: sub, align: 'left', track: 0, out: T.za - .1 });
    // f2: маленький счётчик повтора и «½ оборота»
    const v2 = .39 * clamp((st.rep ? st.tau : 0) / SIM.tLand);
    atext(fmt(v2), CX + 4, 470, T.za + .3, t, { size: 64, w: 600, col: ink, align: 'left', track: -.03 });
    atext('замедлено', CX + 6, 520, T.za + .5, t, { size: 36, w: 500, col: sub, align: 'left', track: 0 });
    atext('½', CX - 6, 900, T.pol - .05, t, { size: 330, w: 600, col: stage.accent, align: 'left', track: -.04, blur: 22, scale0: 1.14, dur: .9 });
    atext('оборота', CX + 4, 990, T.pol + .2, t, { size: 60, w: 600, col: ink, align: 'left', track: -.02 });
    // маслом вниз
    if (st.rep && t > T.prizem) {
      const [ax, ay] = project(cam, toast.position.x + .75, .04, .3);
      callout(ax, ay, ax + 90, ay - 120, T.maslom - .1, t, ink, 1);
      atext('маслом вниз', ax + 90, ay - 138, T.maslom, t, { size: 44, w: 600, col: ink, track: -.01, dy: 14 });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.vys, 'tick', .14);
    add(T.sem, 'chime', .2, .9);
    add(T.pad + .02, 'whoosh', .25, .8);
    add(T.pad + SIM.tLand * SLOW1, 'thud', .3, .9);
    add(T.za, 'swell', .2, .7);
    add(T.pol - 1.5, 'riser', .2);
    add(T.pol, 'impact', .34, .9);
    add(T.prizem, 'thud', .4, .8);
    add(T.maslom, 'tick', .14);
  },
});
