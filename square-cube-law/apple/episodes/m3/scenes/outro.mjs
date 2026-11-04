// OUTRO (o1–o2), чёрный фон. Два стакана проявляются из темноты (контровые → ключ), над левым пар.
// o1 — «Вердикт» белым и огромное красное «скорее миф» (акцент финала); на «Без» серым «без особых условий»;
//      на «не замерзает» оба стакана схватываются льдом одновременно, пар гаснет;
// o2 — финальная карточка как в m2: «Эффект Мпембы» (по словам, белым), серым «горячая вода быстрее: скорее миф»,
//      красная пилюля «Подписаться на L³» с нажатием на «нет».
import { defineScene, makeStage, atext, atextWords, project, P, Wd, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeGlass, makeSteam, frame, glow, pill, fit, wideShadow, GLASS } from './kit.mjs';

function TT() {
  return {
    ver: Wd('o1', 'Вердикт'), skor: Wd('o1', 'скорее'), mif: Wd('o1', 'миф'), bez: Wd('o1', 'Без'), zam: Wd('o1', 'замерзает'), bys: Wd('o1', 'быстрее'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'нет'),
  };
}
const GX = .62;

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    wideShadow(stage, 6, 1.4);
    const hot = makeGlass(), cold = makeGlass();
    hot.position.x = -GX; cold.position.x = GX;
    const steam = makeSteam({ n: 26, op: .42, height: .6, spread: .11, seed: 21 });
    steam.position.set(-GX, GLASS.h - .12, 0);
    stage.root.add(hot, cold, steam);
    return { stage, hot, cold, steam, T: TT() };
  },

  update(t, s, st) {
    const { stage, hot, cold, steam, T } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.6 * lk; L.hemi.intensity = .5 * lk;
    // оба стакана замерзают одновременно
    const ice = P(t, T.zam - .1, 1.0, eInOut);
    hot.setIce(ice); cold.setIce(ice);
    steam.set(t, P(t, s.start + .3, 1.0) * (1 - ice));
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [0, .5, 0], lerp(12.2, 12.8, o2) - .05 * (t - s.start), -12 + (t - s.start) * 1.5, lerp(12, 16, o2), 540, lerp(1080, 870, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, ink = '#FFFFFF', sub = stage.sub;
    const [gx, gy] = project(cam, 0, .05, 0);
    glow(gx, gy, 380, .05 * P(t, s.start + .3, 1.0));
    // o1: вердикт
    const o1 = T.card - .35, v = 'скорее миф';
    atext('Вердикт', 540, 330, T.ver - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: o1 });
    atext(v, 540, 580, T.skor - .05, t, { size: fit(v, 220, 700, 900, -.045), w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: o1 });
    atext('без особых условий', 540, 680, T.bez, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      const law = 'Эффект Мпембы', ls = fit(law, 112, 600, 900, -.035);
      atextWords(law, 540, 380, T.card + .05, t, { size: ls, w: 600, col: ink, track: -.035, stagger: .09 });
      const l2 = 'горячая вода быстрее: скорее миф';
      atext(l2, 540, 480, T.card + .5, t, { size: fit(l2, 54, 500, 900, -.01), w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.ver, 'tick', .16, .9);
    add(T.skor - 1.5, 'riser', .2);
    add(T.skor, 'impact', .36, .9);
    add(T.zam, 'shimmer', .2, 1.0);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
