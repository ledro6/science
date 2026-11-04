// BRIDGE (20.45 – 33.35 с), чёрный фон. Тот же висячий мост, что в хуке.
// b1 — пустой мост чуть подрагивает в собственном ритме: выноска «свой ритм», под мостом рисуется график колебаний
//      середины настила; заголовок «Мост Бротон», подпись «под Манчестером, 1831»; из темноты проявляется колонна
//      «74» солдатика, шаг в ногу — размах растёт на графике; на «оборвался» цепь рвётся, график обрывается
//      красным пиком (главная величина — растущая амплитуда) с меткой «обрыв».
// b2 — настил в реке, солдатики падают в воду, по воде круги; крупно «≈ 20», подпись «травм», затем «травм, погибших нет».
import { defineScene, makeStage, project, atext, callout, line, dot, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeSuspension, makeSoldiers, makeRiver, deckY, colPos, fallPose, BR, COL, BREAK_X, collectMats, setLit, frame, keys, glow, polyline, bigNum, wordsAt, bump, smooth, rng, TAU } from './kit.mjs';

const F = 1.25;     // собственная частота настила = темп шага (Гц на экране)
function TT() {
  return {
    most: Wd('b1', 'моста'), ritm: Wd('b1', 'ритм'), most2: Wd('b1', 'Мост', 1), brot: Wd('b1', 'Бротон'), man: Wd('b1', 'Манчестером'),
    rask: Wd('b1', 'раскачивался'), shag: Wd('b1', 'шагом'), sem: Wd('b1', 'семидесяти'), sold: Wd('b1', 'солдат'), poka: Wd('b1', 'пока'), obor: Wd('b1', 'оборвался'),
    lyudi: Wd('b2', 'Люди'), upali: Wd('b2', 'упали'), reku: Wd('b2', 'реку'), okolo: Wd('b2', 'около'), dvad: Wd('b2', 'двадцати'), travm: Wd('b2', 'травмы'),
    nikto: Wd('b2', 'никто'), pogib: Wd('b2', 'погиб'),
  };
}
const VX = .3;
const xf = (t, T) => BR.L / 2 - .3 - VX * (T.obor - Math.min(t, T.obor));
// амплитуда: свой ритм (малая) → шаг в ногу, растёт → обрыв
function ampAt(t, T) {
  const base = .018 * P(t, T.most - .3, 1.0);
  const grow = Math.pow(smooth((t - T.rask + .2) / (T.obor - T.rask + .2)), 1.6);
  return (base + .24 * grow) * (1 - P(t, T.obor, .3, eApple));
}
function stAt(t, T) {
  return { amp: ampAt(t, T), ph: TAU * F * t, drop: (BR.Y - .1) * Math.pow(clamp((t - T.obor - .04) / .62), 2), brk: P(t, T.obor - .02, .55, eApple) };
}
const R = rng(74), RR = [];
for (let i = 0; i < COL.n; i++) RR.push([R(), R(), R(), R(), R(), R(), R()]);
// график: мировая середина настила → экран
const GX0 = 120, GX1 = 940, GY = 1185, GK = 330;

defineScene('bridge', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const T = TT();
    const bridge = makeSuspension();
    const sold = makeSoldiers(COL.n);
    const river = makeRiver(BR.L + .3, 9);
    stage.root.add(bridge, sold.grp, river);
    return { stage, T, bridge, sold, river, mats: collectMats(bridge) };
  },

  update(t, s, st) {
    const { stage, T, bridge, sold, river } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, .9), lk = P(t, s.start + .25, 1.3);
    const la = (t - s.start) * .12 - .8;
    L.key.position.set(8 * Math.sin(la), 9, 8 * Math.cos(la));
    L.key.intensity = 2.7 * lk; L.hemi.intensity = .5 * lk; L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr;
    setLit(st.mats, lerp(.12, 1, lk));
    const o = stAt(t, T);
    bridge.set(o);
    // солдатики: проявляются из темноты на «Бротон», шагают в ногу
    const lit = P(t, T.brot - .2, 1.1);
    const splashes = [];
    for (let i = 0; i < COL.n; i++) {
      const r = RR[i];
      const [x, z] = colPos(i, xf(t, T));
      const u = (x + BR.L / 2) / BR.L;
      const tf = T.obor + .06 + (1 - u) * .7 + r[5] * .12;
      const fp = u > .3 ? fallPose(t, tf, x, z, τ => stAt(τ, T), r) : null;
      if (lit < .003) { sold.hide(i); continue; }
      if (fp) {
        sold.set(i, fp.p, { s: COL.s, rx: fp.rx, rz: fp.rz, ph: .3, sw: .2, bob: 0, c: lit });
        if (splashes.length < 12 && i % 4 === 1) splashes.push([fp.landP[0], fp.landP[1], fp.land]);
      } else {
        const m = t < T.obor;
        sold.set(i, [x, deckY(x, o), z], { s: COL.s, ph: Math.PI * F * Math.min(t, T.obor), sw: m ? .42 : .2, bob: m ? .02 : 0, c: lit });
      }
    }
    sold.commit();
    river.set(t, splashes, lr);
    // камера: общий план сбоку (видна мода) → на обрыв → к реке
    const [tx, ty, d, az, el, sy] = keys([
      [s.start, 0, 1.7, 31, 33, 13, 830], [T.brot, 0, 1.7, 29.5, 31, 13, 850], [T.obor - .4, .5, 1.5, 26, 36, 15, 860],
      [T.upali + .3, 1.7, .8, 17.5, 46, 22, 1010], [s.end, 1.8, .7, 17, 50, 24, 1010],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy, 520, .05 * P(t, s.start + .2, 1.2));
    // --- график колебаний середины настила ---
    const tA = T.most - .2, tB = T.obor + .05;
    const X = τ => lerp(GX0, GX1, (τ - tA) / (tB - tA));
    const Yv = τ => { const o = stAt(τ, T); return GY - GK * o.amp * Math.sin(o.ph); };
    const ga = P(t, tA, .6) * (1 - P(t, T.upali + .2, .4, eIn));
    if (ga > .003) {
      line(GX0, GY, lerp(GX0, GX1, P(t, tA, 1.2, eApple)), GY, sub, ga * .4, 2);
      const tEnd = Math.min(t, tB), pts = [];
      for (let τ = tA; τ <= tEnd; τ += 1 / 90) pts.push([X(τ), Yv(τ)]);
      // последний полупериод перед обрывом — красный: растущая амплитуда в момент обрыва
      const tR = T.obor - .5 / F;
      const iR = pts.findIndex((p, i) => tA + i / 90 >= tR);
      if (iR < 0) polyline(pts, ink, ga, 3);
      else { polyline(pts.slice(0, iR + 1), ink, ga, 3); polyline(pts.slice(iR), red, ga, 4); }
      if (t < tB && pts.length) { const [x, y] = pts[pts.length - 1]; dot(x, y, 6, t > tR ? red : ink, ga); }
      if (t >= tB) {
        const [x, y] = pts[pts.length - 1], k = P(t, tB, .3, eApple);
        dot(x, y, 8 * k, red, ga);
        atext('обрыв', x - 14, y - 26, tB + .05, t, { size: 38, w: 600, col: ink, a: ga, align: 'right', track: 0, dy: 14 });
      }
      atext('колебания настила', GX0, GY + 70, tA + .3, t, { size: 34, w: 500, col: sub, a: ga, align: 'left', track: 0, dy: 14 });
    }
    // --- «свой ритм»: выноска к середине настила ---
    const oR = T.most2 - .2;
    if (t < oR + .5) {
      const o = stAt(t, T), [mx, my] = project(cam, 0, deckY(0, o) + .05, BR.W / 2);
      callout(mx, my, mx, 560, T.ritm - .35, t, ink, 1 - P(t, oR, .35, eIn));
      atext('свой ритм', mx, 530, T.ritm - .2, t, { size: 56, w: 600, col: ink, track: -.02, out: oR, dy: 18 });
    }
    // --- заголовок ---
    wordsAt(['Мост', 'Бротон'], [T.most2 - .05, T.brot - .05], 540, 400, t, { size: 104, w: 600, col: ink, track: -.035, out: T.sem - .4 });
    atext('под Манчестером, 1831', 540, 470, T.man - .05, t, { size: 46, w: 500, col: sub, track: -.005, out: T.sem - .4 });
    // --- «74» ---
    bigNum('74', 'солдата шагали в ногу', t, T.sem - .05, T.obor + .3, { y: 500, size: 300, col: ink, sub, capT: T.sold - .05 });
    // вспышка обрыва
    const [bx, by] = project(cam, BREAK_X, BR.Y + .6, BR.W / 2 + .1);
    glow(bx, by, 260, .45 * bump(t, T.obor + .06, .3));
    // --- b2 ---
    bigNum('≈ 20', null, t, T.dvad - .1, null, { y: 500, size: 280, col: ink, sub });
    atext('травм', 540, 576, T.travm - .05, t, { size: 46, w: 500, col: sub, track: -.005, out: T.nikto - .15, outDur: .25 });
    atext('травм, погибших нет', 540, 576, T.nikto, t, { size: 46, w: 500, col: sub, track: -.005 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .15, 'swell', .22, .7);
    add(T.ritm, 'tick', .18, 1.0);
    add(T.brot, 'bloom', .22, .8);
    for (let t = T.rask; t < T.obor - .05; t += 1 / F) add(t, 'thud', .1 + .12 * (t - T.rask) / (T.obor - T.rask), 1.5);
    add(T.sem, 'chime', .22, .9);
    add(T.obor - 1.5, 'riser', .24);
    add(T.obor + .02, 'crack', .35, .8);
    add(T.obor + .05, 'impact', .42, .8);
    add(T.obor + .75, 'splash', .32, .9);
    add(T.obor + 1.2, 'splash', .22, 1.1);
    add(T.dvad, 'chime', .2, .85);
    add(T.nikto, 'bloom', .2, 1.0);
  },
});
