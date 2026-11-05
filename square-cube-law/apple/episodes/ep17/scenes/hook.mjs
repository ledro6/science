// HOOK (0 – 11,1 с), чёрный фон. Керамическая стена-студия с тремя дверями-кабинками выходит из темноты.
// k1 — на «Три двери» двери по очереди проявляются светом; на «машина» средняя дверь становится стеклом,
//      за ней угадывается машина; на «выбрал» под первой дверью загорается полоска, «твой выбор»;
//      на «открыл» третья дверь распахивается: внутри пусто, выноска «пусто».
// k2 — на «Менять» пунктирная дуга от первой двери ко второй; на «Да» полоска переезжает на вторую;
//      на «двух» огромное красное «2/3» «если сменить дверь».
import { defineScene, makeStage, project, atext, callout, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeStudio, frame, keys, lights, glow, arcArrow, selBar, DX, DW, DH } from './kit.mjs';

function TT() {
  return {
    tri: Wd('k1', 'Три'), dv: Wd('k1', 'двери'), mash: Wd('k1', 'машина'), ty: Wd('k1', 'Ты'), vyb: Wd('k1', 'выбрал'),
    ved: Wd('k1', 'ведущий'), otk: Wd('k1', 'открыл'), pust: Wd('k1', 'пустую'),
    men: Wd('k2', 'Менять'), da: Wd('k2', 'Да'), dvuh: Wd('k2', 'двух'), tr: Wd('k2', 'трёх'),
  };
}
const doorIn = (i, T) => T.tri - .1 + i * .16;

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const studio = makeStudio({ prize: 1 });
    stage.root.add(studio.grp);
    return { stage, T: TT(), studio };
  },

  update(t, s, st) {
    const { stage, T, studio } = st, cam = stage.camera;
    const { lk } = lights(stage, t, 0, s.end, { kx: [-5, 3] });
    studio.lit(lerp(.08, 1, lk));
    const xr = P(t, T.mash - .1, .6) * (1 - P(t, T.ty - .35, .6, eIn));
    studio.doors.forEach((d, i) => {
      const b = lerp(.06, 1, P(t, doorIn(i, T), .9));
      const open = i === 2 ? eSpring(clamp((t - T.otk + .05) / 1.25)) * .92 : 0;
      d.set({ open, xray: i === 1 ? xr : 0, bright: b });
    });
    const [ty, dist, az, el, sy] = keys([
      [0, 1.15, 20, 14, 5, 990], [T.ty, 1.2, 26, 9, 4, 990], [T.otk + .8, 1.2, 26.5, 5, 4, 990],
      [T.da, 1.2, 26.5, 2, 4, 1000], [s.end, 1.2, 27.5, -2, 5, 1010],
    ], t, eInOut);
    frame(cam, [0, ty, -.6], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, studio } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy - 60, 560, .06 * P(t, .2, 1.2));
    const swap = P(t, T.da - .05, .7, eInOut);
    selBar(cam, 0, P(t, T.vyb, .5) * (1 - swap), ink);
    selBar(cam, 1, P(t, T.da + .2, .6), ink);
    // «твой выбор» над первой дверью, «пусто» над третьей
    const top = i => project(cam, DX(i), 2.62 + .45, 0);
    const k2 = T.men - .2;
    {
      const [x, y] = top(0);
      atext('твой выбор', x, y, T.vyb + .1, t, { size: 42, w: 500, col: sub, track: -.005, dy: 16, out: T.da - .2 });
      const [x2, y2] = top(1);
      atext('новый выбор', x2, y2, T.da + .25, t, { size: 42, w: 500, col: ink, track: -.005, dy: 16 });
    }
    {
      const [ax, ay] = project(cam, DX(2), .9, -.9);
      const [, by] = top(2);
      callout(ax, ay, ax, by + 18, T.pust - .25, t, ink, 1 - P(t, k2, .35, eIn));
      atext('пусто', ax, by, T.pust - .15, t, { size: 42, w: 500, col: ink, track: -.005, dy: 16, out: k2 });
    }
    // k2: дуга смены выбора
    {
      const [ax, ay] = project(cam, DX(0), DH + .15, 0), [bx, by] = project(cam, DX(1), DH + .15, 0);
      arcArrow(ax, ay - 6, bx, by - 6, 90, P(t, T.men, .8, eInOut), ink, .8 * (1 - P(t, T.dvuh - .3, .4, eIn)), 3);
    }
    // огромное «2/3»
    atext('2/3', 540, 500, T.dvuh - .05, t, { size: 300, w: 700, col: acc, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('если сменить дверь', 540, 585, T.dvuh + .4, t, { size: 46, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    for (let i = 0; i < 3; i++) add(doorIn(i, T) + .2, 'click', .1, .9 + i * .06);
    add(T.mash, 'shimmer', .16);
    add(T.vyb + .05, 'tick', .16, 1.0);
    add(T.otk, 'whoosh', .22, .8);
    add(T.otk + .7, 'thud', .18, .8);
    add(T.men + .1, 'swell', .18, .9);
    add(T.da, 'click', .16, 1.0);
    add(T.dvuh - 1.5, 'riser', .22);
    add(T.dvuh - .05, 'impact', .38, .9);
  },
});
