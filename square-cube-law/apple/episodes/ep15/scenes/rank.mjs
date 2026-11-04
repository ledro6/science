// RANK (7,5 – 18,6 с), светлый фон.
// r1 — десять столбиков-слов стоят вперемешку (кубики пока без номеров); на «Расставь» они по одному переезжают
//      на свои места (кто вправо — уходит назад, кто влево — вперёд), получается лестница; на «обратно» —
//      формула «частота ∝ 1 / ранг» («1 / ранг» красным), по вершинам рисуется пунктирная гипербола;
//      на «месту» на кубиках волной проявляются номера мест 1…10.
// r2 — формула уходит; фокус на первом и втором: пунктир на половине первого, «×2» красным;
//      на «десять» — фокус на первом и десятом, «×10» (белым по смыслу: монохром, чёрным на светлом).
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeStair, frame, keys, atextParts, dashPath, level, NB, HT, BX, CUBE } from './kit.mjs';

function TT() {
  return {
    ras: Wd('r1', 'Расставь'), slova: Wd('r1', 'слова'), chast: Wd('r1', 'частоте'), Chast: Wd('r1', 'Частота'), obr: Wd('r1', 'обратно'),
    prop: Wd('r1', 'пропорциональна'), mest: Wd('r1', 'месту'), spis: Wd('r1', 'списке'),
    perv: Wd('r2', 'Первое'), dva: Wd('r2', 'два'), vtor: Wd('r2', 'второго'), des: Wd('r2', 'десять'), dest: Wd('r2', 'десятого'),
  };
}
// вперемешку: SLOT[i] — исходная позиция столбика места i
const SLOT = [6, 2, 8, 0, 4, 9, 1, 5, 3, 7];
const ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort((a, b) => Math.abs(BX(SLOT[b]) - BX(b)) - Math.abs(BX(SLOT[a]) - BX(a)));
const moveAt = (i, T) => T.slova - .1 + ORDER.indexOf(i) * .1;
const MOVE = 1.15;

defineScene('rank', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const stair = makeStair({ faces: Array.from({ length: NB }, (_, i) => [i, -1, -1, -1]) });
    stage.root.add(stair.grp);
    return { stage, T: TT(), stair };
  },

  update(t, s, st) {
    const { stage, T, stair } = st, cam = stage.camera;
    const f12 = P(t, T.dva - .25, .5) * (1 - P(t, T.des - .2, .5));     // фокус 1 и 2
    const f110 = P(t, T.des - .2, .5);                                    // фокус 1 и 10
    for (let i = 0; i < NB; i++) {
      const g = eSpring(clamp((t - (s.start + .05 + SLOT[i] * .04)) / .8));
      const u = clamp((t - moveAt(i, T)) / MOVE), e = eInOut(u);
      const x0 = BX(SLOT[i]), x1 = BX(i), dir = Math.sign(x1 - x0);
      const z = -dir * Math.sin(Math.PI * u) * (.55 + .5 * Math.abs(x1 - x0) / 5.8);
      let foc = 1;
      if (i > 1) foc = lerp(1, .55, f12);
      if (i === 1) foc = lerp(1, .55, f110);
      if (i > 0 && i < 9) foc = Math.min(foc, lerp(1, .55, f110));
      stair.set(i, { grow: g, x: lerp(x0, x1, e), z, bright: foc, glyph: P(t, T.mest - .1 + i * .06, .5) });
    }
    const L = stage.lights;
    L.key.position.set(lerp(-2, 1.5, clamp((t - s.start) / (s.end - s.start))), 9, 6);
    const [ty, dist, az, el, sy] = keys([
      [s.start, 2.4, 32, -10, 9, 975], [T.chast + .8, 2.4, 31, -2, 10, 975], [T.perv, 2.4, 31, 8, 10, 975], [s.end, 2.3, 30, 13, 11, 975],
    ], t, eInOut);
    frame(cam, [0, ty, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, stair } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    // r1: формула и гипербола по вершинам
    const o1 = T.perv - .2;
    const dt = T.obr - T.Chast;
    atextParts([['частота ', ink], ['∝ ', ink, dt], ['1 / ранг', acc, dt + .25]], 540, 470, T.Chast - .05, t, { size: 92, w: 600, track: -.025, out: o1 });
    {
      const pts = [];
      for (let k = 0; k <= 60; k++) {
        const r = 1 + 9 * k / 60, x = BX(r - 1), y = HT(r - 1);
        pts.push(project(cam, x, y + .02, CUBE / 2));
      }
      dashPath(pts, P(t, T.prop - .1, 1.3, eInOut), sub, 1 - P(t, o1, .35, eIn), 2.5, [2, 9]);
    }
    // r2: ×2 и ×10
    const o2 = T.des - .25;
    {
      const y1 = HT(0) / 2;
      const [, ay] = project(cam, BX(1), y1, CUBE / 2);
      const [bx] = project(cam, BX(0) - CUBE / 2 - .2, y1, CUBE / 2);
      const [cx] = project(cam, BX(1) + CUBE / 2 + .12, y1, CUBE / 2);
      level(cx, bx, ay, P(t, T.dva - .1, .6), ink, .55 * (1 - P(t, o2, .3, eIn)));
      const y10 = HT(9);
      const [, dy] = project(cam, BX(9), y10, CUBE / 2);
      const [ex] = project(cam, BX(0) - CUBE / 2 - .2, y10, CUBE / 2);
      const [fx] = project(cam, BX(9) - CUBE / 2 - .1, y10, CUBE / 2);
      level(fx, ex, dy, P(t, T.des + .1, .8, eInOut), ink, .55 * (1 - P(t, s.end - .4, .3, eIn)));
    }
    atext('×2', 540, 470, T.dva - .05, t, { size: 300, w: 700, col: acc, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o2 });
    atext('первое и второе место', 540, 548, T.dva + .3, t, { size: 46, w: 500, col: sub, track: -.005, out: o2 });
    atext('×10', 540, 470, T.des - .05, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('первое и десятое место', 540, 548, T.des + .3, t, { size: 46, w: 500, col: sub, track: -.005 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .25, 'swell', .22, .8);
    for (let k = 0; k < NB; k += 2) add(moveAt(ORDER[k], T) + MOVE * .9, 'click', .1, .9 + k * .03);
    add(T.obr, 'chime', .2, .9);
    add(T.prop, 'shimmer', .16);
    add(T.mest, 'tick', .14, 1.05);
    add(T.dva - 1.5, 'riser', .2);
    add(T.dva, 'impact', .32, .95);
    add(T.des, 'chime', .24, 1.05);
  },
});
