// ODDS (11,1 – 24,3 с), светлый фон. Та же студия из трёх дверей, под первой — полоска выбора.
// p1 — на «один из трёх» над первой дверью «1/3»; на «что бы ни делал ведущий» над второй и третьей
//      вырастает общая скобка «2/3» (красным, главный акцент).
// p2 — на «А» ведущий распахивает третью дверь; на «достаются» вся скобка «2/3» стягивается на вторую закрытую;
//      на «ведущий знает, где приз» сверху подпись, вторая дверь на миг становится стеклом (там машина);
//      на «пустую» выноска «пусто» у открытой третьей.
import { defineScene, makeStage, project, atext, callout, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeStudio, frame, keys, bracket, selBar, DX, DW, DH } from './kit.mjs';

function TT() {
  return {
    tv: Wd('p1', 'Твоя'), odin: Wd('p1', 'один'), eto: Wd('p1', 'Это'), men: Wd('p1', 'меняется'), chto: Wd('p1', 'что'), ved1: Wd('p1', 'ведущий'),
    a: Wd('p2', 'А'), dost: Wd('p2', 'достаются'), vtor: Wd('p2', 'второй'), ved: Wd('p2', 'ведущий'), zn: Wd('p2', 'знает'), priz: Wd('p2', 'приз'),
    vs: Wd('p2', 'всегда'), otk: Wd('p2', 'открывает'), pust: Wd('p2', 'пустую'),
  };
}
const LY = 2.62 + .5;     // высота скобки и меток над дверями

defineScene('odds', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const studio = makeStudio({ prize: 1, bg: 'white' });
    stage.root.add(studio.grp);
    return { stage, T: TT(), studio };
  },

  update(t, s, st) {
    const { stage, T, studio } = st, cam = stage.camera;
    stage.lights.key.position.set(lerp(-3, 3, clamp((t - s.start) / (s.end - s.start))), 9, 7);
    studio.lit(1);
    const xr = P(t, T.zn - .1, .5) * (1 - P(t, T.vs - .1, .5, eIn));
    studio.doors.forEach((d, i) => {
      const open = i === 2 ? eSpring(clamp((t - T.a + .05) / 1.25)) * .92 : 0;
      const foc = i === 0 ? 1 - .1 * P(t, T.a, .6) : 1;
      d.set({ open, xray: i === 1 ? xr : 0, bright: foc });
    });
    const [dist, az, el, sy] = keys([
      [s.start, 27, -6, 3, 1060], [T.chto, 27.5, -2, 4, 1070], [T.a + .6, 27.5, 2, 4, 1070], [s.end, 28, 6, 5, 1070],
    ], t, eInOut);
    frame(cam, [0, 1.25, -.6], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    selBar(cam, 0, P(t, s.start + .1, .6), ink, false);
    const px = (i, dx = 0) => project(cam, DX(i) + dx, LY, 0);
    // «1/3» над первой дверью
    {
      const [x, y] = px(0);
      atext('1/3', x, y - 30, T.odin - .05, t, { size: 120, w: 700, col: ink, track: -.04, blur: 16, scale0: 1.1, dur: .85 });
      atext('твоя дверь', x, y + 34, T.odin + .35, t, { size: 38, w: 500, col: sub, track: -.005, dy: 14 });
    }
    // скобка «2/3»: над второй и третьей → стягивается на вторую
    {
      const c = P(t, T.dost - .1, 1.0, eInOut);
      const [l1] = px(1, -DW / 2), [r2] = px(2, DW / 2), [r1, y] = px(1, DW / 2);
      const x1 = l1, x2 = lerp(r2, r1, c);
      const pb = P(t, T.chto - .1, .7, eInOut);
      bracket(x1, x2, y + 6, pb, ink, .7, 3, 22);
      const mx = (x1 + x2) / 2;
      atext('2/3', mx, y - 30, T.chto + .1, t, { size: 120, w: 700, col: acc, track: -.04, blur: 16, scale0: 1.1, dur: .85 });
    }
    // подпись про ведущего
    atext('ведущий знает, где приз', 540, 430, T.ved - .05, t, { size: 64, w: 600, col: ink, track: -.02 });
    // «пусто» у открытой третьей двери
    {
      const [ax, ay] = project(cam, DX(2), .9, -.9);
      const [, by] = px(2);
      callout(ax, ay, ax, by + 14, T.pust - .25, t, ink, 1);
      atext('пусто', ax, by - 6, T.pust - .15, t, { size: 44, w: 500, col: ink, track: -.005, dy: 14 });
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .2, .8);
    add(T.odin, 'chime', .2, .9);
    add(T.chto, 'click', .16, 1.0);
    add(T.a, 'whoosh', .22, .8);
    add(T.a + .7, 'thud', .16, .8);
    add(T.dost + .7, 'click', .2, .95);
    add(T.zn, 'shimmer', .14);
    add(T.pust, 'tick', .14, 1.05);
  },
});
