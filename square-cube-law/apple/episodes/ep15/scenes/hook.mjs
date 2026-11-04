// HOOK (0 – 7,5 с), чёрный фон. Десять керамических кубиков-слов с номерами мест 1…10 опускаются из темноты в ряд;
// k1 — на «встречается» под первым кубиком вырастает столбик (самое частое слово), на «вдвое» — второй, вдвое ниже,
//      пунктир на половине первого и огромное красное «×2»; на «втрое» — третий, на «третьего» волной вся лестница 1 / r.
// k2 — «×2» уходит, свет проходит по лестнице, заголовок «Закон Ципфа» по словам.
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeStair, frame, keys, lights, glow, wordsAt, level, NB, HT, CUBE } from './kit.mjs';

function TT() {
  return {
    sam: Wd('k1', 'Самое'), vstr: Wd('k1', 'встречается'), vdv: Wd('k1', 'вдвое'), vtor: Wd('k1', 'второго'),
    vtr: Wd('k1', 'втрое'), tret: Wd('k1', 'третьего'), eto: Wd('k2', 'Это'), zak: Wd('k2', 'закон'), cip: Wd('k2', 'Ципфа'),
  };
}
// момент роста столбика места i
const growAt = (i, T) => i === 0 ? T.vstr - .1 : i === 1 ? T.vdv - .05 : i === 2 ? T.vtr - .02 : T.tret - .15 + (i - 3) * .07;
const landAt = i => .3 + i * .075;

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const stair = makeStair();
    stage.root.add(stair.grp);
    return { stage, T: TT(), stair };
  },

  update(t, s, st) {
    const { stage, T, stair } = st, cam = stage.camera;
    const { lk } = lights(stage, t, 0, s.end);
    for (let i = 0; i < NB; i++) {
      // кубик опускается из темноты и мягко садится на пол
      const pl = P(t, landAt(i), .9, eApple);
      const g = eSpring(clamp((t - growAt(i, T)) / 1.05));
      stair.set(i, { grow: g, dy: (1 - pl) * 2.2, bright: lerp(.05, 1, pl) * lerp(.25, 1, lk), glyph: P(t, landAt(i) + .35, .6), hide: pl <= .001 });
    }
    // камера: лёгкий наезд и медленный обход
    const [ty, dist, az, el, sy] = keys([
      [0, 1.4, 33, 16, 9, 1010], [T.vstr, 2.2, 31.5, 15, 9, 990], [T.tret + .6, 2.4, 31, 12, 10, 975], [s.end, 2.4, 31.5, 8, 11, 975],
    ], t, eInOut);
    frame(cam, [0, ty, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, stair } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy + 30, 520, .05 * P(t, .2, 1.2));
    const o2 = T.eto - .15, q = 1 - P(t, o2, .35, eIn);
    // пунктир: вершина второго столбика = половина первого
    {
      const y1 = HT(0) / 2;
      const [ax, ay] = project(cam, stair.bars[1].x - CUBE / 2 - .05, y1, CUBE / 2);
      const [bx] = project(cam, stair.bars[0].x - CUBE / 2 - .25, y1, CUBE / 2);
      const [cx] = project(cam, stair.bars[1].x + CUBE / 2 + .1, y1, CUBE / 2);
      level(cx, bx, ay, P(t, T.vtor - .2, .7), ink, q * .55);
    }
    // огромное «×2»
    atext('×2', 540, 470, T.vdv + .05, t, { size: 300, w: 700, col: acc, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o2 });
    atext('первое слово против второго', 540, 548, T.vdv + .45, t, { size: 46, w: 500, col: sub, track: -.005, out: o2 });
    // k2: заголовок
    wordsAt(['Закон', 'Ципфа'], [T.zak - .05, T.cip - .05], 540, 470, t, { size: 120, w: 600, col: ink, track: -.03 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    for (let i = 0; i < NB; i += 2) add(landAt(i) + .55, 'click', .1, .9 + i * .03);
    add(T.vstr - .1, 'whoosh', .25, .8);
    add(T.vdv - 1.5, 'riser', .22);
    add(T.vdv + .05, 'impact', .38, .9);
    add(T.vtr, 'thud', .22, .9);
    for (let i = 3; i < NB; i += 2) add(growAt(i, T) + .2, 'click', .1, 1 + i * .03);
    add(T.zak - .1, 'bloom', .3, .8);
    add(T.cip, 'chime', .24, .95);
  },
});
