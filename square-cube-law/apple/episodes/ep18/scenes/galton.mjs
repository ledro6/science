// GALTON (31,4 – 37,9 с), светлый фон. Доска целиком в светлом исполнении, камера медленно обходит её.
// g1 — «Фрэнсис Гальтон», серым «XIX век»; поток шариков снова сыплется через гвозди;
//      на «хаоса» — «Из хаоса» (шарики ещё летят вразнобой), на «рождается» — «рождается порядок»,
//      на «порядок» по стопкам проводится тонкая кривая-колокол.
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeBoard, makeBalls, sched, pathDur, frame, keys, dashPath, bellY, DX, ROWS, ZG } from './kit.mjs';

const N = 260, OPT = { rowT: .07, funT: .3 };
function TT() {
  return {
    fr: Wd('g1', 'Фрэнсис'), gal: Wd('g1', 'Гальтон'), pr: Wd('g1', 'придумал'), dev: Wd('g1', 'девятнадцатом'), ch: Wd('g1', 'чтобы'),
    iz: Wd('g1', 'из'), hao: Wd('g1', 'хаоса'), rozh: Wd('g1', 'рождается'), por: Wd('g1', 'порядок'),
  };
}

defineScene('galton', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const board = makeBoard({ light: true });
    const balls = makeBalls(N, { seed: 18, dark: true });
    stage.root.add(board.grp, balls.im);
    return { stage, T: TT(), board, balls };
  },

  update(t, s, st) {
    const { stage, T, board, balls } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(lerp(4, -2, clamp((t - s.start) / (s.end - s.start))), 9, 7);
    board.setLit(1);
    balls.set(t, sched(N, s.start + .3, T.hao - s.start - .5, 1.15), OPT);
    const u = (t - s.start) / (s.end - s.start);
    frame(cam, [0, 3.15, 0], lerp(33, 32, u), lerp(-26, -12, eInOut(u)), lerp(14, 7, u), 540, 915);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const o1 = T.ch - .1;
    atext('Фрэнсис Гальтон', 540, 360, T.fr - .05, t, { size: 96, w: 600, col: ink, track: -.03, out: o1 });
    atext('XIX век', 540, 445, T.dev - .05, t, { size: 56, w: 500, col: sub, track: -.01, out: o1 });
    atext('Из хаоса', 540, 330, T.hao - .1, t, { size: 104, w: 600, col: ink, track: -.03 });
    atext('рождается порядок', 540, 445, T.rozh - .1, t, { size: 104, w: 600, col: ink, track: -.03 });
    const pts = [];
    for (let q = 0; q <= 80; q++) { const x = (q / 80 - .5) * (ROWS + 1) * DX; pts.push(project(cam, x, bellY(x, N) + .07, ZG + .02)); }
    dashPath(pts, P(t, T.por - .1, .9, eInOut), ink, .7, 2.5, null);
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .2, .8);
    for (let k = 0; k < 12; k++) add(s.start + .6 + k * .3, 'tick', .05 + .02 * (k % 3), .9 + (k % 5) * .05);
    add(T.gal, 'chime', .18, .9);
    add(T.hao, 'whoosh', .16, 1.0);
    add(T.por, 'bloom', .26, .85);
  },
});
