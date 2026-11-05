// BOARD (7,2 – 19,4 с), светлый фон. Та же доска в светлом исполнении (белая керамика, алюминий, графитовые шарики).
// b1 — крупно верхние ряды: один шарик выходит из воронки и садится на гвоздь на «гвозде»; на каждом гвозде
//      развилка: две тонкие ветки вниз, выбранная — сплошная; за шариком тянется тонкий след;
//      на «влево» / «вправо» — крупные слова слева и справа. Камера отъезжает за шариком; он ложится в середину.
// b2 — доска целиком: на «край» пунктиром проводится путь «всё время влево» к крайней ячейке, второй шарик идёт
//      по нему, счётчик «влево × n»; на «редко» — крупное «редко»; на «большинство» сыплется поток,
//      стопки растут в середине.
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { THREE } from '../../../engine.mjs';
import { makeBoard, makeBalls, sched, pathPos, frame, keys, dashPath, line, slotPos, binX, pegX, pegY, ROWS, RB, RP, DY, ZG, NBIN } from './kit.mjs';
import * as ENG from '../../../engine.mjs';

const BITS_A = [1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0];      // 6 вправо → средняя ячейка
const BITS_B = Array(ROWS).fill(0);                       // всё время влево → край
const KA = BITS_A.reduce((a, b) => a + b, 0), KB = 0;
const N = 170;
function TT() {
  const T = {
    na: Wd('b1', 'На'), gv: Wd('b1', 'гвозде'), sl: Wd('b1', 'случайно'), vl: Wd('b1', 'влево'), ili: Wd('b1', 'или'), vp: Wd('b1', 'вправо'),
    ch: Wd('b2', 'Чтобы'), kr: Wd('b2', 'край'), mn: Wd('b2', 'много'), pod: Wd('b2', 'подряд'), st: Wd('b2', 'сторону'),
    eto: Wd('b2', 'Это'), red: Wd('b2', 'редко'), pot: Wd('b2', 'поэтому'), bol: Wd('b2', 'большинство'), ser: Wd('b2', 'середине'),
  };
  // шарик A: садится на верхний гвоздь на «гвозде», проходит ряды за ~3 с
  T.A = { funT: .5, rowT: (WdE('b1', 'вправо') + .2 - T.gv) / ROWS };
  T.a0 = T.gv - T.A.funT;
  // шарик B: на «много» начинает путь «всё время влево», к «сторону» в крайней ячейке
  T.B = { funT: .45, rowT: (T.st + .1 - T.mn) / ROWS };
  T.b0 = T.mn - T.B.funT;
  return T;
}
const WdE = ENG.WdE;
const hitT = (T, r, who = 'A') => (who === 'A' ? T.a0 : T.b0) + T[who].funT + r * T[who].rowT;

defineScene('board', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const board = makeBoard({ light: true });
    const balls = makeBalls(N, { seed: 5, dark: true, reserve: { [KA]: 1, [KB]: 1 } });
    const geo = new THREE.SphereGeometry(RB, 24, 16);
    const mk = () => { const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#3A3A3C', roughness: .2, metalness: .45, clearcoat: 1, clearcoatRoughness: .08 })); m.castShadow = true; return m; };
    const A = mk(), B = mk();
    stage.root.add(board.grp, balls.im, A, B);
    return { stage, T: TT(), board, balls, A, B };
  },

  update(t, s, st) {
    const { stage, T, board, balls, A, B } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(lerp(-3, 3, clamp((t - s.start) / (s.end - s.start))), 9, 7);
    board.setLit(1);
    const place = (m, bits, t0, o, k) => {
      const tau = t - t0;
      if (tau < 0) { m.visible = false; return null; }
      const [sx, sy] = slotPos(k, 0);
      const [x, y] = pathPos(bits, tau, { ...o, slotX: sx, slotY: sy });
      m.visible = true; m.scale.setScalar(clamp(tau / .15)); m.position.set(x, y, 0); return [x, y];
    };
    place(A, BITS_A, T.a0, T.A, KA);
    place(B, BITS_B, T.b0, T.B, KB);
    // поток: на «поэтому» — к «середине» стопки в основном посередине
    balls.set(t, sched(N, T.pot - .1, T.ser - T.pot + .2, 1.1), { rowT: .062, funT: .3 });
    // камера: крупно верх → за шариком вниз → вся доска
    const [ty, dist, az, el, sy] = keys([
      [s.start, 4.95, 10.5, 8, 4, 1110], [T.gv, 4.8, 11, 10, 4, 1110], [T.vl, 4.0, 11.5, 13, 4, 1010], [WdE('b1', 'вправо'), 3.6, 12, 15, 5, 1000],
      [T.kr + .1, 3.15, 33.5, 22, 5, 915], [s.end, 3.15, 34, 24, 5, 915],
    ], t, eInOut);
    frame(cam, [0, ty, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, A } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const Z = ZG * .6;
    const pr = (x, y) => project(cam, x, y, Z);
    const yHit = r => pegY(r) + RP + RB;
    // след шарика A и развилки на каждом пройденном гвозде
    {
      const out = T.ch - .1, qa = 1 - P(t, out, .5, eIn);
      const tau = t - T.a0;
      if (tau > T.A.funT) {
        const pts = [];
        for (let q = T.A.funT; q <= tau; q += .02) { const [x, y] = pathPos(BITS_A, q, { ...T.A, slotX: slotPos(KA, 0)[0], slotY: slotPos(KA, 0)[1] }); pts.push(pr(x, y)); }
        dashPath(pts, 1, sub, .8 * qa, 2.5, [2, 7]);
      }
      let k = 0;
      for (let r = 0; r < ROWS; r++) {
        const th = hitT(T, r);
        const a = Math.min(P(t, th - .12, .2), 1 - P(t, th + T.A.rowT * 1.6, .3, eIn)) * qa;   // развилка — только на текущем гвозде
        if (a > .003) {
          const [px, py] = pr(pegX(r, k), pegY(r));
          const [lx, ly] = pr(pegX(r, k) - .5 * .3 * .75, pegY(r) - DY * .75);
          const [rx, ry] = pr(pegX(r, k) + .5 * .3 * .75, pegY(r) - DY * .75);
          const pick = BITS_A[r], pp = P(t, th, .3);
          line(px, py, lerp(px, lx, pp), lerp(py, ly, pp), pick ? sub : ink, a * (pick ? .6 : 1), pick ? 2.5 : 4, pick ? [2, 7] : null);
          line(px, py, lerp(px, rx, pp), lerp(py, ry, pp), pick ? ink : sub, a * (pick ? 1 : .6), pick ? 4 : 2.5, pick ? null : [2, 6]);
        }
        k += BITS_A[r];
      }
      const o1 = T.ch - .3;
      atext('влево', 300, 400, T.vl - .05, t, { size: 104, w: 600, col: ink, track: -.03, out: o1 });
      atext('или', 540, 400, T.ili - .02, t, { size: 52, w: 500, col: sub, track: -.01, out: o1 });
      atext('вправо', 780, 400, T.vp - .05, t, { size: 104, w: 600, col: ink, track: -.03, out: o1 });
    }
    // путь «всё время влево»: пунктир заранее, затем шарик B
    {
      const out = T.pot + .2, qb = 1 - P(t, out, .6, eIn);
      const pts = [];
      for (let q = T.B.funT - .05; q <= T.B.funT + ROWS * T.B.rowT + .6; q += .02) { const [x, y] = pathPos(BITS_B, q, { ...T.B, slotX: slotPos(KB, 0)[0], slotY: slotPos(KB, 0)[1] }); pts.push(pr(x, y)); }
      dashPath(pts, P(t, T.kr - .2, 1.0, eInOut), ink, .7 * qb, 3, [2, 9]);
      // пройденные гвозди левого края
      for (let r = 0; r < ROWS; r++) {
        const [px, py] = pr(pegX(r, 0), pegY(r));
        const a = P(t, hitT(T, r, 'B') - .04, .2) * qb;
        ENG.dot(px, py, 7, ink, a * .9);
      }
      // счётчик
      const n = clamp(Math.floor((t - (T.b0 + T.B.funT)) / T.B.rowT) + 1, 0, ROWS);
      const o2 = T.eto - .2;
      if (n > 0) atext(`влево × ${n}`, 540, 400, T.mn, t, { size: 104, w: 600, col: ink, track: -.03, out: o2 });
      atext('подряд', 540, 470, T.pod, t, { size: 46, w: 500, col: sub, track: -.005, out: o2 });
      atext('редко', 540, 410, T.red - .05, t, { size: 150, w: 700, col: ink, track: -.04, blur: 20, scale0: 1.1, dur: .9, out: T.bol - .2 });
      atext('большинство в середине', 540, 400, T.bol + .2, t, { size: 80, w: 600, col: ink, track: -.03 });
    }
  },

  sfx(add, s) {
    const T = TT();
    add(T.a0 + .1, 'whoosh', .18, 1.1);
    for (let r = 0; r < ROWS; r++) add(hitT(T, r), 'tick', r < 3 ? .16 : .09, 1 + (r % 3) * .04);
    add(T.vl, 'click', .14, .95);
    add(T.vp, 'click', .14, 1.05);
    add(T.kr, 'whoosh', .16, .9);
    for (let r = 0; r < ROWS; r += 2) add(hitT(T, r, 'B'), 'tick', .1, .85 + r * .02);
    add(T.red, 'thud', .26, .85);
    add(T.pot, 'shimmer', .16);
    for (let k = 0; k < 8; k++) add(T.pot + .3 + k * .25, 'tick', .05, .95 + (k % 4) * .04);
    add(T.ser, 'chime', .2, .9);
  },
});
