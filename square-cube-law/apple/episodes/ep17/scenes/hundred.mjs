// HUNDRED (24,3 – 34,6 с), чёрный фон. Чёрная глянцевая панель со ста дверями-плитками 10 × 10.
// h1 — на «сто дверей» плитки волной встают на панель, сверху «100 дверей»; на «одну» выбранная плитка
//      выдвигается и обводится рамкой «твоя»; на «открыл» 98 плиток распахиваются волной (за ними пустые ниши),
//      счётчик «N пустых» досчитывает до 98.
// h2 — открытые плитки гаснут, две закрытые выдвигаются вперёд, камера наезжает; «почти наверняка» сверху,
//      на «не тронул» у второй закрытой выноска «не тронута».
import { defineScene, makeStage, project, atext, callout, P, Wd, clamp, lerp, rng, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeTileWall, frame, keys, lights, glow, line, GN, TX, TY, TW, TH } from './kit.mjs';

const CH = 23, OT = 78;                       // выбранная и оставленная ведущим
function TT() {
  return {
    pred: Wd('h1', 'Представь'), sto: Wd('h1', 'сто'), dv: Wd('h1', 'дверей'), vyb: Wd('h1', 'выбрал'), odnu: Wd('h1', 'одну'),
    otk: Wd('h1', 'открыл'), dev: Wd('h1', 'девяносто'), pust: Wd('h1', 'пустых'),
    tep: Wd('h2', 'Теперь'), poch: Wd('h2', 'почти'), nav: Wd('h2', 'наверняка'), toy: Wd('h2', 'той'), ne: Wd('h2', 'не'), tron: Wd('h2', 'тронул'),
  };
}
const R = rng(100), JIT = Array.from({ length: GN * GN }, () => R());
const rc = i => [Math.floor(i / GN), i % GN];
// появление плитки: волна от центра
const inAt = (i, T) => { const [r, c] = rc(i); return T.sto - .15 + Math.hypot(r - 4.5, c - 4.5) / 6.4 * .75 + JIT[i] * .06; };
// раскрытие: диагональная волна сверху-слева
const openAt = (i, T) => { const [r, c] = rc(i); return T.otk - .1 + (r + c) / 18 * 1.45 + JIT[i] * .12; };
const OPEN = .7;
const keep = i => i === CH || i === OT;

defineScene('hundred', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const wall = makeTileWall({ chosen: CH, other: OT });
    stage.root.add(wall.grp);
    return { stage, T: TT(), wall };
  },

  update(t, s, st) {
    const { stage, T, wall } = st, cam = stage.camera;
    const { lk } = lights(stage, t, s.start, s.end, { kx: [-4, 3] });
    const fade = P(t, T.tep - .1, 1.0);
    const bm = wall.board.material, bk = lerp(.2, 1, lk) * (1 - fade);
    bm.color.set('#232325').multiplyScalar(bk); bm.clearcoat = .5 * bk; bm.specularIntensity = bk;
    wall.board.visible = fade < .995;
    const fwd = eSpring(clamp((t - T.tep) / 1.1));
    wall.set(i => {
      const show = eSpring(clamp((t - inAt(i, T)) / .7));
      const sel = i === CH ? eSpring(clamp((t - T.odnu + .05) / .8)) : 0;
      if (keep(i)) return { show, dz: .1 * sel + .22 * fwd, bright: 1 };
      const o = eSpring(clamp((t - openAt(i, T)) / OPEN));
      // h2: открытые плитки уходят (сжимаются в петлю), остаются две закрытые
      const gone = P(t, T.tep - .1 + JIT[i] * .5, .7, eIn);
      return { show: show * (1 - gone), open: o * .9, bright: lerp(1, .55, o) };
    });
    // камера: общий план → наезд на две закрытые
    const [tx, ty, dist, az, el, sy] = keys([
      [s.start, 0, 3.15, 30, 24, 5, 860], [T.dv + .4, 0, 3.15, 33, 19, 4, 860], [T.pust + .2, 0, 3.15, 33.5, 15, 4, 860],
      [T.poch + .6, .45, 3.3, 20.5, 12, 5, 930], [s.end, .45, 3.3, 19.5, 9, 6, 930],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const [fx, fy] = project(cam, 0, 3, -.2);
    glow(fx, fy, 640, .05 * P(t, s.start + .2, 1.2));
    const out1 = T.otk - .2;
    atext('100 дверей', 540, 330, T.sto - .05, t, { size: 110, w: 600, col: ink, track: -.03, out: out1 });
    // счётчик открытых
    if (t > T.otk - .3) {
      let n = 0; for (let i = 0; i < GN * GN; i++) if (!keep(i) && t >= openAt(i, T) + .2) n++;
      atext(`${n} пустых`, 540, 330, T.otk - .1, t, { size: 110, w: 600, col: ink, track: -.03, out: T.tep - .15 });
    }
    atext('почти наверняка', 540, 330, T.poch - .05, t, { size: 104, w: 600, col: ink, track: -.03 });
    // рамка вокруг выбранной плитки и подписи
    const fwd = eSpring(clamp((t - T.tep) / 1.1));
    const box = (i, dz) => {
      const [r, c] = rc(i);
      const [x1, y1] = project(cam, TX(c) - TW / 2 - .05, TY(r) + TH / 2 + .05, dz), [x2, y2] = project(cam, TX(c) + TW / 2 + .05, TY(r) - TH / 2 - .05, dz);
      return [x1, y1, x2, y2];
    };
    {
      const a = P(t, T.odnu, .5);
      const [x1, y1, x2, y2] = box(CH, .1 + .22 * fwd);
      if (a > .003) {
        line(x1, y1, x2, y1, ink, a, 3); line(x2, y1, x2, y2, ink, a, 3); line(x2, y2, x1, y2, ink, a, 3); line(x1, y2, x1, y1, ink, a, 3);
      }
      atext('твоя', (x1 + x2) / 2, y1 - 22, T.odnu + .2, t, { size: 40, w: 500, col: sub, track: -.005, dy: 14 });
    }
    {
      const [x1, y1, x2, y2] = box(OT, .22 * fwd);
      glow((x1 + x2) / 2, (y1 + y2) / 2, 260, .09 * P(t, T.nav, 1.0));
      const a = P(t, T.toy - .1, .5);
      line(x1, y1, x2, y1, ink, a, 3); line(x2, y1, x2, y2, ink, a, 3); line(x2, y2, x1, y2, ink, a, 3); line(x1, y2, x1, y1, ink, a, 3);
      atext('не тронута', (x1 + x2) / 2, y1 - 22, T.toy, t, { size: 40, w: 500, col: ink, track: -.005, dy: 14 });
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .24, .7);
    for (let k = 0; k < 6; k++) add(T.sto - .05 + k * .14, 'tick', .07, .9 + k * .04);
    add(T.odnu, 'click', .18, 1.0);
    for (let k = 0; k < 10; k++) add(T.otk + .1 + k * .16, 'tick', .07, 1 + k * .03);
    add(T.tep, 'whoosh', .2, .8);
    add(T.poch, 'chime', .22, .95);
    add(T.toy, 'tick', .14, 1.05);
  },
});
