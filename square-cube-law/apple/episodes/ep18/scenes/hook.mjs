// HOOK (0 – 7,2 с), чёрный фон. Доска Гальтона выходит из темноты: сначала контровой свет на раме и рёбрах стекла,
// потом ключ. k1 — крупно воронка и гвозди: стальные шарики сыплются, отскакивают от гвоздей; камера отъезжает,
//      в ячейках растут стопки; на «колокол» по стопкам проводится тонкая кривая-колокол.
// k2 — доска целиком, свет скользит по раме; заголовок «Нормальное / распределение» по словам.
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeBoard, makeBalls, sched, pathDur, frame, keys, glow, dashPath, bellY, DX, ROWS, ZG } from './kit.mjs';

const N = 260, OPT = { rowT: .075, funT: .32 };
function TT() {
  return {
    sh: Wd('k1', 'Шарики'), pad: Wd('k1', 'падают'), gv: Wd('k1', 'гвоздей'), skl: Wd('k1', 'складываются'), kol: Wd('k1', 'колокол'),
    eto: Wd('k2', 'Это'), dos: Wd('k2', 'доска'), norm: Wd('k2', 'нормальное'), rasp: Wd('k2', 'распределение'),
  };
}
const T0 = .25, DUR = 4.4;
defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const board = makeBoard();
    const balls = makeBalls(N, { seed: 18 });
    stage.root.add(board.grp, balls.im);
    return { stage, T: TT(), board, balls };
  },

  update(t, s, st) {
    const { stage, T, board, balls } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, 0, .9), lk = P(t, .25, 1.3);
    L.key.position.set(lerp(-5, 4, clamp(t / s.end)), 9, 7);
    L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    board.setLit(lerp(.2, 1, lk));
    balls.set(t, sched(N, T0, DUR), OPT, lerp(.2, 1, lk));
    // камера: крупно воронка и верхние ряды → вся доска под заголовок
    const [ty, dist, az, el, sy] = keys([
      [0, 4.9, 13, 10, 4, 820], [T.gv, 4.4, 17, 12, 4, 860], [T.kol, 3.15, 29, 17, 4, 920], [T.dos, 3.15, 33.5, 21, 5, 915], [s.end, 3.15, 33.5, 22, 5, 915],
    ], t, eInOut);
    frame(cam, [0, ty, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy + 20, 560, .06 * P(t, .2, 1.2));
    // колокол по стопкам: высота — по числу уже упавших шариков
    const land = clamp(Math.pow(clamp((t - T0 - pathDur(OPT) - .25) / DUR), 1.25)) * N;
    const pts = [];
    for (let q = 0; q <= 80; q++) { const x = (q / 80 - .5) * (ROWS + 1) * DX; pts.push(project(cam, x, bellY(x, land) + .07, ZG + .02)); }
    dashPath(pts, P(t, T.kol - .15, .9, eInOut), ink, .75, 2.5, null);
    // k2: заголовок
    atext('Нормальное', 540, 330, T.norm - .1, t, { size: 112, w: 600, col: ink, track: -.03 });
    atext('распределение', 540, 450, T.rasp - .1, t, { size: 112, w: 600, col: ink, track: -.03 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    // россыпь мягких тиков: шарики по гвоздям
    for (let k = 0; k < 14; k++) add(T0 + .45 + k * .28, 'tick', .05 + .02 * (k % 3), .9 + (k % 5) * .05);
    add(T.gv, 'whoosh', .2, .8);
    add(T.kol - .05, 'shimmer', .18);
    add(T.norm - .1, 'bloom', .3, .8);
    add(T.rasp, 'chime', .24, .95);
  },
});
