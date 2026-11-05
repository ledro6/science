// OUTRO (37,9 – 47,4 с), чёрный фон.
// o1 — доска Гальтона с полным колоколом выходит из темноты, ключ медленно обходит раму; крупно в четыре строки
//      «Много мелких / случайностей / складываются / в форму»; на «форму» по стопкам проводится кривая-колокол.
// o2 — финальная карточка: «Нормальное распределение» (по словам, белым), серым «±1σ ≈ 68 %», красная пилюля
//      «Подписаться на L³» с нажатием на «природы»; доска отходит под карточку и гаснет.
import { defineScene, makeStage, project, atext, atextWords, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeBoard, makeBalls, frame, glow, pill, dashPath, bellY, DX, ROWS, ZG } from './kit.mjs';

const N = 260;
function TT() {
  return {
    mn: Wd('o1', 'Много'), sl: Wd('o1', 'случайностей'), skl: Wd('o1', 'складываются'), v: Wd('o1', 'в'), f: Wd('o1', 'форму'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const board = makeBoard();
    const balls = makeBalls(N, { seed: 18 });
    stage.root.add(board.grp, balls.im);
    return { stage, T: TT(), board, balls };
  },

  update(t, s, st) {
    const { stage, T, board, balls } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.0), lk = P(t, s.start + .3, 1.3);
    const la = (t - s.start) * .25 - .7;
    L.key.position.set(6 * Math.sin(la), 9, 6 * Math.cos(la) + 2);
    L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    const lit = lerp(.15, 1, lk) * lerp(1, .6, o2);
    board.setLit(lit);
    balls.set(100, () => 0, {}, lit);       // все шарики уже в ячейках
    frame(cam, [0, 3.15, 0], lerp(41, 56, o2) - .1 * (t - s.start), 24 - (t - s.start) * 1.6, lerp(6, 8, o2), 540, lerp(1010, 845, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy + 20, 520, .05 * P(t, s.start + .2, 1));
    const o1 = T.card - .35;
    const pts = [];
    for (let q = 0; q <= 80; q++) { const x = (q / 80 - .5) * (ROWS + 1) * DX; pts.push(project(cam, x, bellY(x, N) + .07, ZG + .02)); }
    dashPath(pts, P(t, T.f - .1, .9, eInOut), ink, .7 * (1 - P(t, o1, .4, eIn)), 2.5, null);
    const hd = { size: 96, w: 600, col: ink, track: -.03, out: o1 };
    atextWords('Много мелких', 540, 290, T.mn - .05, t, { ...hd, stagger: .4 });
    atext('случайностей', 540, 392, T.sl - .05, t, hd);
    atext('складываются', 540, 494, T.skl - .05, t, hd);
    atextWords('в форму', 540, 596, T.v - .05, t, { ...hd, stagger: .06 });
    if (t > T.card - .1) {
      atextWords('Нормальное', 540, 330, T.card + .05, t, { size: 104, w: 600, col: ink, track: -.035 });
      atextWords('распределение', 540, 440, T.card + .17, t, { size: 104, w: 600, col: ink, track: -.035 });
      atext('±1σ ≈ 68 %', 540, 535, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.sl, 'whoosh', .2, 1.0);
    add(T.f, 'chime', .22, .95);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
