// OUTRO (46.58 – 55.6 с), чёрный фон.
// o1 — те же качели на чёрном: керамическая «рука» толкает сиденье точно в крайней точке, размах большой и ровный;
//      крупно «Маленький толчок в такт / сильнее большого невпопад».
// o2 — финальная карточка: «Резонанс» (по словам, белым), «толчок в такт → размах растёт» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «природы»; качели отходят под карточку.
import { defineScene, makeStage, project, atext, atextWords, measure, P, Wd, clamp, lerp, eApple, eIn, eInOut, MAT } from '../../../engine.mjs';
import { makeSwing, swingAt, SW, frame, glow, pill, wordsAt, smooth, collectMats, setLit } from './kit.mjs';

function TT() {
  return {
    mal: Wd('o1', 'Маленький'), tol: Wd('o1', 'толчок'), v: Wd('o1', 'в'), takt: Wd('o1', 'такт'), sil: Wd('o1', 'сильнее'), bol: Wd('o1', 'большого'), nev: Wd('o1', 'невпопад'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы'),
  };
}
const Tp = 1.6;
const cfg = s => ({ t0: s.start + .3, Tp, A0: .44, dA: .012, nPush: 6, tPush0: s.start + .3 });
function handAt(t, C, intro) {
  const { th } = swingAt(t, C);
  const edge = Math.sin(th) * (SW.RL + .04) + Math.cos(th) * SW.SEAT[0] / 2 + .115;
  let c = 0;
  for (let n = 0; n < C.nPush; n++) { const tp = C.tPush0 + n * Tp; c = Math.max(c, smooth((t - (tp - .5)) / .45) * (1 - smooth((t - (tp + .16)) / .42))); }
  return { x: lerp(2.35 + 3.5 * (1 - intro), edge, c * intro), th };
}
// подбор кегля: строка не шире 900 px
const fit = (s, size, w = 600, track = -.03) => Math.min(size, size * 900 / measure(s, size, w, track));

defineScene('outro', {
  setup(s) {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const swing = makeSwing({ seatMat: MAT.ceramicWhite() });
    stage.root.add(swing);
    return { stage, T: TT(), swing, C: cfg(s), mats: collectMats(swing) };
  },

  update(t, s, st) {
    const { stage, T, swing, C } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.0), lk = P(t, s.start + .3, 1.3);
    const la = (t - s.start) * .25 - .5;
    L.key.position.set(7 * Math.sin(la), 9, 7 * Math.cos(la));
    L.key.intensity = 2.7 * lk; L.hemi.intensity = .5 * lk; L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr;
    setLit(st.mats, lerp(.15, 1, lk));
    const h = handAt(t, C, P(t, s.start, .8, eApple) * (1 - P(t, T.card - .3, .6, eIn)));
    swing.set(h.th, h.x, 1);
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [.25, 1.42, 0], lerp(21.5, 31, o2) - .12 * (t - s.start), 34 - (t - s.start) * 1.4, lerp(7, 10, o2), 540, lerp(900, 790, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy, 520, .06 * P(t, s.start + .2, 1));
    // o1: итоговая мысль
    const o1 = T.card - .35;
    const L1 = 'Маленький толчок в такт', L2 = 'сильнее большого невпопад';
    const sz = Math.min(fit(L1, 100), fit(L2, 100));
    wordsAt(['Маленький', 'толчок', 'в', 'такт'], [T.mal - .05, T.tol - .05, T.v - .05, T.takt - .05], 540, 360, t, { size: sz, w: 600, col: ink, track: -.03, out: o1 });
    wordsAt(['сильнее', 'большого', 'невпопад'], [T.sil - .05, T.bol - .05, T.nev - .05], 540, 360 + sz * 1.12, t, { size: sz, w: 600, col: ink, track: -.03, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Резонанс', 540, 380, T.card + .05, t, { size: 116, w: 600, col: ink, track: -.035, stagger: .12 });
      atext('толчок в такт → размах растёт', 540, 485, T.card + .6, t, { size: 50, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT(), C = cfg(s);
    add(s.start + .2, 'swell', .3, .6);
    for (let n = 0; n < 3; n++) add(C.tPush0 + n * Tp - .02, 'click', .14, .95);
    add(T.takt, 'chime', .2, 1.0);
    add(T.nev, 'bloom', .2, .8);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
