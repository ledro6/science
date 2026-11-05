// LAW (8.6 – 16.8 с), светлый фон.
// l1 — формула собирается по словам: «P» на «Мощность», «∝» на «растёт», «T» на «как», красная «⁴» на «четвёртая»;
//      серые подписи «мощность излучения» и «температура» под буквами.
// l2 — формула уходит вверх и становится «2⁴»; на полу керамические плитки удваиваются четыре раза:
//      каждая новая плитка выходит из копии старой (1 → 2 → 4 → 8 → 16), на «шестнадцать» сетка 4×4;
//      ряд «2 → 4 → 8 → 16», в конце «2⁴ = 16».
import { defineScene, makeStage, project, atext, measure, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { frame, keys, rbox, segText, tileSlot, TILE, ctx } from './kit.mjs';

function TT() {
  return {
    mo: Wd('l1', 'Мощность'), iz: Wd('l1', 'излучения'), ra: Wd('l1', 'растёт'), kak: Wd('l1', 'как'), ch: Wd('l1', 'четвёртая'),
    st: Wd('l1', 'степень'), te: Wd('l1', 'температуры'),
    dva: Wd('l2', 'Два'), chv: Wd('l2', 'четвёртой'), d2: Wd('l2', 'два', 1), c4: Wd('l2', 'четыре'), c8: Wd('l2', 'восемь'), c16: Wd('l2', 'шестнадцать'),
  };
}
// шаги удвоения: [момент, число плиток]
const STEPS = T => [[T.dva + .1, 1], [T.d2 - .05, 2], [T.c4 - .05, 4], [T.c8 - .05, 8], [T.c16 - .05, 16]];
const MOVE = .5;

defineScene('law', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const mat = MAT.ceramicWhite();
    const tiles = [];
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(rbox(TILE.S, TILE.H, TILE.S, .045), mat);
      m.castShadow = m.receiveShadow = true; stage.root.add(m); tiles.push(m);
    }
    return { stage, tiles, T: TT() };
  },

  update(t, s, st) {
    const { stage, tiles, T } = st, cam = stage.camera;
    const S = STEPS(T);
    // текущий шаг k: плитки 0..n_k-1; во время перехода новые выходят из копий
    let k = -1; for (let i = 0; i < S.length; i++) if (t >= S[i][0]) k = i;
    for (let i = 0; i < 16; i++) {
      const m = tiles[i];
      if (k < 0) { m.visible = false; continue; }
      const n = S[k][1], np = k > 0 ? S[k - 1][1] : 0, p = eInOut(clamp((t - S[k][0]) / MOVE));
      if (i >= n) { m.visible = false; continue; }
      m.visible = true;
      let x, z, y = TILE.H / 2, sc = 1;
      const [x1, z1] = tileSlot(i, n);
      if (k === 0) { x = x1; z = z1; sc = lerp(.6, 1, eApple(clamp((t - S[0][0]) / .7))); y += (1 - eApple(clamp((t - S[0][0]) / .7))) * .6; }
      else if (i < np) { const [x0, z0] = tileSlot(i, np); x = lerp(x0, x1, p); z = lerp(z0, z1, p); }
      else {
        // копия: выходит из плитки-источника, приподнимаясь над ней
        const [x0, z0] = tileSlot(i - np, np);
        x = lerp(x0, x1, p); z = lerp(z0, z1, p); y += Math.sin(Math.PI * p) * .45 + (p < .02 ? .002 : 0);
      }
      m.position.set(x, y, z); m.scale.setScalar(sc); m.rotation.set(0, 0, 0);
    }
    const L = stage.lights;
    L.key.position.set(lerp(-3, 4, clamp((t - s.start) / 8)), 9, 6);
    // камера: сверху-спереди; на 8 и 16 плитках чуть отходит
    const [dist, az, el, sy] = keys([
      [s.start, 16, -10, 42, 960], [T.dva, 16, -8, 42, 960], [T.c8 - .1, 18.5, -4, 45, 950], [T.c16, 22, 3, 48, 940], [s.end, 22.6, 6, 48, 940],
    ], t, eInOut);
    frame(cam, [0, 0, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st;
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    // ---- l1: формула крупно; на «Два» уезжает вверх и меньшеет ----
    const up = P(t, T.dva - .3, .8, eInOut);
    const size = lerp(250, 120, up), y = lerp(860, 400, up);
    const parts = [['P', ink, T.mo - .05], [' ∝ ', ink, T.ra - .05], ['T', ink, T.kak - .05], ['⁴', acc, T.ch - .02]];
    const swap = T.chv - .05;                       // «P ∝ T⁴» → «2⁴»
    const aF = 1 - P(t, swap - .3, .3, eIn);
    if (aF > .003) {
      segText(parts, 540, y, t, { size, w: 600, track: -.03, a: aF, blur: 16 });
      // подписи под буквами
      const wP = measure('P', size, 600, -.03), wA = measure(' ∝ ', size, 600, -.03), wT = measure('T', size, 600, -.03), w4 = measure('⁴', size, 600, -.03);
      const x0 = 540 - (wP + wA + wT + w4) / 2;
      const capA = (1 - P(t, T.dva - .35, .3, eIn));
      atext('мощность', x0 + wP / 2, 960, T.iz - .05, t, { size: 40, w: 500, col: sub, track: 0, a: capA });
      atext('излучения', x0 + wP / 2, 1008, T.iz + .05, t, { size: 40, w: 500, col: sub, track: 0, a: capA });
      atext('температура', x0 + wP + wA + wT / 2 + 20, 960, T.te - .05, t, { size: 40, w: 500, col: sub, track: 0, a: capA });
    }
    // ---- l2: «2⁴» и ряд удвоений ----
    if (t > swap) {
      const done = T.c16 + .35;
      segText([['2', ink, swap + .05], ['⁴', acc, swap + .12], [' = 16', ink, done, 1]], 540, 400, t, { size: 120, w: 600, track: -.03 });
      const nums = ['2', '4', '8', '16'], ts = [T.d2, T.c4, T.c8, T.c16];
      const ns = 96, arrow = '  →  ', wa = measure(arrow, ns, 500, -.02);
      const wn = nums.map(q => measure(q, ns, 700, -.04)), tot = wn.reduce((A, B) => A + B, 0) + wa * 3;
      let x = 540 - tot / 2;
      nums.forEach((q, i) => {
        const cur = i === 3 || t < (ts[i + 1] ?? 1e9) - .05;
        // текущее число чёрным, пройденные — серым
        const col = cur ? ink : sub;
        atext(q, x, 560, ts[i] - .05, t, { size: ns, w: 700, col, track: -.04, align: 'left' });
        x += wn[i];
        if (i < 3) { atext(arrow, x, 560, ts[i + 1] - .1, t, { size: ns, w: 500, col: sub, track: -.02, align: 'left' }); x += wa; }
      });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.mo, 'tick', .18, 1.0);
    add(T.ch, 'chime', .25, 1.0);
    add(T.dva + .1, 'thud', .25, .9);
    for (const [k, p] of [[T.d2, .9], [T.c4, 1.0], [T.c8, 1.1]]) add(k, 'click', .3, p);
    add(T.c16 - .05, 'click', .35, 1.2);
    add(T.c16 + .35, 'chime', .25, 1.05);
  },
});
