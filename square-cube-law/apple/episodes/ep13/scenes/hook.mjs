// HOOK (0 – 10.4 с), чёрный фон. Висячий мост из каменных порталов, цепей и дощатого настила над чёрной рекой.
// k1 — колонна керамических солдатиков шагает в ногу, настил раскачивается всё сильнее (каждый шаг — толчок);
//      крупно красное «1831»; на «рухнул» цепь у дальнего портала рвётся, настил падает в реку, солдатики — в воду.
// k2 — через «вдох» в чёрный: целый мост, солдатики идут вразнобой, настил спокоен — «не в ногу»;
//      на «резонанс» камера отходит, заголовок «Резонанс».
import { defineScene, makeStage, project, atext, P, Wd, WdE, C, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeSuspension, makeSoldiers, makeRiver, deckY, colPos, fallPose, BR, COL, BREAK_X, collectMats, setLit, frame, keys, glow, veil, bump, smooth, rng, TAU } from './kit.mjs';

const F = 1.7;                       // шагов в секунду (≈ собственная частота настила)
function TT() {
  return {
    v: Wd('k1', 'В'), yr: Wd('k1', 'тысяча'), sold: Wd('k1', 'солдатами'), shag: Wd('k1', 'шагавшими'), nogu: Wd('k1', 'ногу'),
    ruh: Wd('k1', 'рухнул'), most: WdE('k1', 'мост'), s: Wd('k2', 'С'), sbiv: Wd('k2', 'сбивать'), shag2: Wd('k2', 'шаг'),
    eto: Wd('k2', 'Это'), rez: Wd('k2', 'резонанс'),
  };
}
const VX = .42;
// голова колонны: к обрыву — у дальнего портала
const xf1 = (t, T) => BR.L / 2 - .25 - VX * (T.ruh - Math.min(t, T.ruh));
const xf2 = (t, T) => 1.2 + VX * (t - T.s);
// k1: амплитуда растёт с каждым шагом, на «рухнул» настил падает
function stAt(t, T) {
  const grow = Math.pow(smooth((t - .2) / (T.ruh - .2)), 1.25);
  return {
    amp: lerp(.012, .21, grow) * (1 - P(t, T.ruh, .3, eApple)), ph: TAU * F * t - .6,
    drop: (BR.Y - .1) * Math.pow(clamp((t - T.ruh - .04) / .62), 2), brk: P(t, T.ruh - .02, .55, eApple),
  };
}
const R = rng(1831), RR = [];
for (let i = 0; i < COL.n; i++) RR.push([R(), R(), R(), R(), R(), R(), R()]);

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const T = TT();
    T.cut = (T.most + C('k2')) / 2;
    const bridge = makeSuspension();
    const sold = makeSoldiers(COL.n);
    const river = makeRiver(BR.L + .3, 9);
    stage.root.add(bridge, sold.grp, river);
    return { stage, T, bridge, sold, river, mats: collectMats(bridge) };
  },

  update(t, s, st) {
    const { stage, T, bridge, sold, river } = st, cam = stage.camera, L = stage.lights;
    const k2 = t >= T.cut;
    // свет: объект «вырезается» из темноты — контровые, потом ключ скользит по порталам
    const lr = P(t, 0, .9), lk = P(t, .2, 1.4);
    const sw = eApple(clamp(t / 5));
    L.key.position.set(lerp(-7, 4, k2 ? 1 : sw), 9, lerp(-1, 6, k2 ? 1 : sw));
    L.key.intensity = 2.7 * lk; L.hemi.intensity = .5 * lk; L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr;
    setLit(st.mats, lerp(.12, 1, lk));
    const o = k2 ? { amp: .012, ph: TAU * 1.1 * t } : stAt(t, T);
    bridge.set(o);
    // солдатики
    const splashes = [];
    for (let i = 0; i < COL.n; i++) {
      const r = RR[i];
      if (!k2) {
        const [x, z] = colPos(i, xf1(t, T));
        const u = (x + BR.L / 2) / BR.L;
        const falls = u > .34;
        const tf = T.ruh + .06 + (1 - u) * .55 + r[5] * .1;
        const fp = falls ? fallPose(t, tf, x, z, τ => stAt(τ, T), r) : null;
        if (fp) {
          sold.set(i, fp.p, { s: COL.s, rx: fp.rx, rz: fp.rz, ph: .3, sw: .2, bob: 0 });
          if (splashes.length < 12 && i % 5 === 0) splashes.push([fp.landP[0], fp.landP[1], fp.land]);
        } else {
          const marching = t < T.ruh;
          sold.set(i, [x, deckY(x, o), z], { s: COL.s, ph: marching ? Math.PI * F * t : Math.PI * F * T.ruh, sw: marching ? .42 : .2, bob: marching ? .02 : 0 });
        }
      } else {
        // вразнобой: у каждого своя фаза и чуть свой темп
        const [x, z] = colPos(i, xf2(t, T));
        const ph = Math.PI * F * (.85 + r[0] * .3) * t + r[1] * TAU;
        sold.set(i, [x + (r[2] - .5) * .05, deckY(x, o), z], { s: COL.s, ph, sw: .42 });
      }
    }
    sold.commit();
    river.set(t, splashes, lr);
    // камера: общий план по диагонали → ближе на обрыве; k2 — у колонны, потом отход под заголовок
    if (!k2) {
      const [tx, ty, d, az, el, sy] = keys([
        [0, .2, 1.5, 16.5, 64, 15, 980], [T.ruh - .2, .9, 1.45, 15.5, 60, 14, 1000], [T.cut, 1.6, 1.15, 14.5, 58, 16, 1040],
      ], t, eInOut);
      frame(cam, [tx, ty, 0], d, az, el, 540, sy);
    } else {
      const [tx, ty, d, az, el, sy] = keys([
        [T.cut, 1.6, 1.6, 7.5, 38, 8, 980], [T.sbiv + .6, 2.3, 1.6, 7.2, 30, 7, 980], [T.eto - .2, 1.6, 1.6, 10.5, 40, 10, 1000], [T.rez + .6, .4, 1.55, 17, 58, 15, 1060], [s.end, .3, 1.55, 17.5, 56, 15, 1060],
      ], t, eInOut);
      frame(cam, [tx, ty, 0], d, az, el, 540, sy);
    }
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy, 520, .05 * P(t, .2, 1.2));
    if (t < T.cut) {
      // «1831» — главная цифра выпуска, красным
      atext('1831', 540, 520, T.yr - .05, t, { size: 300, w: 700, col: red, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.cut - .32 });
      atext('шаг в ногу', 540, 600, T.nogu - .1, t, { size: 46, w: 500, col: sub, track: -.005, out: T.ruh - .05 });
      atext('мост рухнул', 540, 600, T.ruh + .05, t, { size: 46, w: 500, col: sub, track: -.005, out: T.cut - .32 });
      // вспышка в точке обрыва цепи
      const [bx, by] = project(cam, BREAK_X, BR.Y + .6, BR.W / 2 + .1);
      glow(bx, by, 260, .5 * bump(t, T.ruh + .06, .3));
    } else {
      atext('не в ногу', 540, 470, T.sbiv - .05, t, { size: 96, w: 600, col: ink, track: -.03, out: T.eto - .1 });
      atext('Резонанс', 540, 480, T.rez - .05, t, { size: 140, w: 600, col: ink, track: -.035, blur: 16, scale0: 1.08, dur: .85 });
    }
    // «вдох» в чёрный на монтажном стыке
    veil('#000', bump(t, T.cut, .22));
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    // шаги в ногу: мягкий глухой удар на каждый шаг, громче по мере раскачки
    for (let t = .35; t < T.ruh - .05; t += 1 / F) add(t, 'thud', .08 + .1 * t / T.ruh, 1.5);
    add(T.yr, 'chime', .22, .85);
    add(T.ruh - 1.5, 'riser', .22);
    add(T.ruh + .02, 'crack', .35, .8);
    add(T.ruh + .05, 'impact', .4, .8);
    add(T.ruh + .7, 'splash', .3, .9);
    add(T.sbiv, 'whoosh', .2, 1.1);
    add(T.rez - .1, 'bloom', .3, .8);
    add(T.rez + .05, 'chime', .24, .95);
  },
});
