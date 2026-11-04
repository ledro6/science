// WORDS (18,6 – 29,1 с), чёрный фон.
// u1 — та же лестница с номерами; на «первые» места 4–10 уходят в тень; кубик первого места поворачивается
//      на 90° и показывает «и», второго — «в», третьего — «не»; сверху эти слова встают в ряд, каждое на своё слово;
//      на «неточно» — серая оговорка «на верхних местах закон неточен».
// u2 — лестница уходит в пол, камера поднимается над «страницей текста» из плашек-слов; на «сто самых частых слов»
//      ровно половина плашек (в основном короткие) белеет, остальные темнеют: «100 слов» → «≈ 50 %» любого текста.
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeStair, makePage, frame, keys, lights, glow, NB, G } from './kit.mjs';

function TT() {
  return {
    perv: Wd('u1', 'первые'), i: Wd('u1', 'и'), v: Wd('u1', 'в', 1), ne: Wd('u1', 'не'),
    verh: Wd('u1', 'верху'), net: Wd('u1', 'неточно'),
    a: Wd('u2', 'А'), ang: Wd('u2', 'английском'), sto: Wd('u2', 'сто'), slov: Wd('u2', 'слов'), okolo: Wd('u2', 'около'),
    pol: Wd('u2', 'половины'), teksta: Wd('u2', 'текста'),
  };
}
const turnAt = (i, T) => [T.i - .55, T.v - .5, T.ne - .5][i];
const WORD = [G.i, G.v, G.ne];

defineScene('words', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const stair = makeStair({ faces: Array.from({ length: NB }, (_, i) => [i, i < 3 ? WORD[i] : -1, -1, -1]) });
    const page = makePage({ rows: 12, width: 5.0 });
    page.im.position.set(0, 0, 0);
    stage.root.add(stair.grp, page.im);
    return { stage, T: TT(), stair, page };
  },

  update(t, s, st) {
    const { stage, T, stair, page } = st, cam = stage.camera;
    const { lk } = lights(stage, t, s.start, s.end - s.start);
    const dim = P(t, T.perv - .1, .7);
    const gone = P(t, T.a - .05, .7, eIn);                // лестница уходит
    for (let i = 0; i < NB; i++) {
      const r = i < 3 ? eInOut(clamp((t - turnAt(i, T)) / .8)) : 0;
      // кубик слегка приподнимается, пока поворачивается
      const lift = i < 3 ? .22 * Math.sin(Math.PI * clamp((t - turnAt(i, T)) / .8)) : 0;
      let foc = i < 3 ? 1 : lerp(1, .3, dim);
      // текущее слово ярче двух других
      if (i < 3) {
        const cur = t < turnAt(1, T) ? 0 : t < turnAt(2, T) ? 1 : 2;
        if (t > turnAt(0, T)) foc = i === cur ? 1 : lerp(1, .55, P(t, turnAt(0, T), .5));
      }
      const sink = eInOut(clamp((t - (T.a - .05 + (NB - 1 - i) * .03)) / .8));
      stair.set(i, { grow: 1 - sink, rot: r * Math.PI / 2, dy: lift - sink * .6, bright: foc * lerp(.2, 1, lk) * (1 - gone), glyph: [1 - r, r, 0, 0], hide: gone >= .999 });
    }
    // страница текста
    const pr = T.ang - .1, mk = T.sto;
    for (let k = 0; k < page.N; k++) {
      const c = page.chips[k];
      const rise = eSpring(clamp((t - (pr + c.ord * .9)) / .7));
      const mark = P(t, mk + c.ord * 1.0, .45);
      page.set(k, rise, mark, 1);
    }
    page.im.visible = t > pr - .05;
    page.commit();
    // камера: обзор лестницы → к первым трём местам → над страницей
    const [tx, ty, dist, az, el, sy] = keys([
      [s.start, 0, 2.4, 31, 12, 10, 975], [T.perv + .2, -1.0, 2.2, 26, 14, 10, 930], [T.ne + .4, -1.0, 2.2, 26, 12, 11, 930],
      [T.a + .2, 0, .5, 25, 10, 34, 960], [T.ang + 1.0, 0, 0, 22, 8, 52, 960], [s.end, 0, 0, 21.5, 4, 55, 960],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy + 30, 520, .05 * P(t, s.start + .2, 1));
    // u1: слова крупно
    const big = { size: 260, w: 700, col: ink, track: -.04, blur: 20, scale0: 1.1, dur: .9 };
    const lab = { size: 50, w: 500, col: sub, track: -.005 };
    // три слова встают в ряд, каждое на своё слово диктора; на «неточно» — серая оговорка
    const o1 = T.a - .2, row = { ...big, size: 210, out: o1 };
    atext('и', 410, 470, T.i - .05, t, row);
    atext('в', 575, 470, T.v - .05, t, row);
    atext('не', 780, 470, T.ne - .05, t, row);
    atext('на верхних местах закон неточен', 540, 560, T.net - .1, t, { ...lab, out: o1 });
    // u2
    atext('100 слов', 540, 450, T.sto - .05, t, { size: 140, w: 600, col: ink, track: -.035, out: T.pol - .35 });
    atext('самых частых в английском', 540, 530, T.sto + .35, t, { ...lab, out: T.pol - .35 });
    atext('≈ 50 %', 540, 470, T.pol - .05, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('любого текста', 540, 550, T.teksta - .1, t, lab);
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .22, .7);
    for (let i = 0; i < 3; i++) add(turnAt(i, T) + .7, 'click', .2, .9 + i * .05);
    add(T.i, 'chime', .18, .9); add(T.v, 'chime', .18, 1.0); add(T.ne, 'chime', .18, 1.1); add(T.net, 'tick', .14, .9);
    add(T.a, 'whoosh', .25, .8);
    add(T.ang, 'shimmer', .16);
    add(T.sto, 'bloom', .24, .9);
    add(T.pol, 'chime', .26, 1.0);
  },
});
