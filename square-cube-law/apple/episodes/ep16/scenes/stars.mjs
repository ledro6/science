// STARS (27.8 – 38.0 с), светлый фон. Звёзды — жемчужные сферы (светлый центр, серый край), от них
// расходятся тонкие кольца излучения (у Сириуса чаще и плотнее).
// t1 — Солнце; на «Сириуса» слева выходит Сириус того же размера; на «горячее» он белеет, крупно «T × 1,7»;
//      на «крупнее» растёт до 1,7 радиуса Солнца, «R × 1,7», радиус-hairline на обеих звёздах.
// t2 — Солнце уменьшается и встаёт в центр сетки 5×5; из него волной выходят ещё 24 «солнца»;
//      крупно «≈ 25», подпись «солнц света».
import { defineScene, makeStage, project, atext, line, dot, P, Wd, E, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeStar, frame, keys, screenR, rays, smooth, ctx } from './kit.mjs';

function TT() {
  return {
    pov: Wd('t1', 'Поверхность'), sir: Wd('t1', 'Сириуса'), od: Wd('t1', 'один'), gor: Wd('t1', 'горячее'), sol: Wd('t1', 'солнечной'),
    a: Wd('t1', 'а'), od2: Wd('t1', 'один', 1), kr: Wd('t1', 'крупнее'),
    vm: Wd('t2', 'Вместе'), ok: Wd('t2', 'около'), dv: Wd('t2', 'двадцати'), pya: Wd('t2', 'пяти'), sn: Wd('t2', 'солнц'), sv: Wd('t2', 'света'),
  };
}
const RS = 1, RB = 1.7;                         // радиусы Солнца и Сириуса
const GR = .4, GS = 1.04, GX = 2.75;            // сетка 25 солнц: радиус, шаг, центр по x
const cell = i => [GX + ((i % 5) - 2) * GS, (2 - Math.floor(i / 5)) * GS];
// порядок появления: от центральной клетки (12) наружу
const ORDER = (() => { const a = [...Array(25).keys()].map(i => { const [x, y] = cell(i); return [i, Math.hypot(x - GX, y)]; }); a.sort((p, q) => p[1] - q[1]); const o = []; a.forEach(([i], k) => o[i] = k); return o; })();

defineScene('stars', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    stage.floor.visible = false;
    const sun = makeStar({ paper: true, seed: 2.2 }), sir = makeStar({ paper: true, seed: 5.1 });
    const mini = [];
    for (let i = 0; i < 25; i++) { const m = new THREE.Mesh(sun.geometry, sun.material); stage.root.add(m); mini.push(m); }
    stage.root.add(sun, sir);
    return { stage, sun, sir, mini, T: TT() };
  },

  update(t, s, st) {
    const { stage, sun, sir, mini, T } = st, cam = stage.camera;
    const S = sunPose(t, T), B = sirPose(t, T);
    sun.position.set(S.x, S.y, 0); sun.scale.setScalar(S.r); sun.rotation.y = t * .05;
    sir.position.set(B.x, 0, 0); sir.scale.setScalar(B.r); sir.rotation.y = 1 + t * .05; sir.visible = B.r > .01;
    sun.set({ heat: 0, t }); sir.set({ heat: B.heat, t });
    // 24 копии выходят из Солнца (оно — центральная клетка)
    const t0 = T.vm + .55;
    for (let i = 0; i < 25; i++) {
      const m = mini[i];
      if (i === 12) { m.visible = false; continue; }
      const p = eInOut(clamp((t - t0 - ORDER[i] * .045) / .55));
      m.visible = p > .002;
      const [cx, cy] = cell(i);
      m.position.set(lerp(S.x, cx, p), lerp(S.y, cy, p), -.05);
      m.scale.setScalar(GR * lerp(.5, 1, p)); m.rotation.y = i * .7 + t * .05;
    }
    const [tx, dist, sy] = keys([
      [s.start, .6, 24, 960], [T.sir - .1, .6, 24, 960], [T.sir + 1.0, .2, 29, 990], [T.od2, .2, 29, 990], [T.kr + .2, -.1, 34, 1000],
      [T.vm, -.1, 34.5, 1000], [T.vm + 1.0, .55, 40.5, 900], [s.end, .55, 41, 900],
    ], t, eInOut);
    frame(cam, [tx, 0, 0], dist, -2 + (t - s.start) * .5, 2, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, sun, sir, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const S = sunPose(t, T), B = sirPose(t, T);
    const ps = [S.x, S.y, 0], pb = [B.x, 0, 0];
    const [sx, sy] = project(cam, ...ps), [bx, by] = project(cam, ...pb);
    const rs = screenR(cam, ps, S.r), rb = screenR(cam, pb, B.r);
    // кольца излучения: у Сириуса чаще и темнее
    const oR = 1 - P(t, T.vm, .5, eIn);
    rays(sx, sy, rs, .7, t, { L: 150, a: .5 * P(t, s.start, .8) * oR, col: '#86868B' });
    if (B.r > .05) rays(bx, by, rb, lerp(.7, 2.2, B.heat), t + .3, { L: lerp(150, 230, B.heat), a: lerp(.5, .9, B.heat) * P(t, T.sir, .6) * oR, col: lerp(0, 1, B.heat) > .5 ? '#1D1D1F' : '#86868B' });
    // подписи под звёздами
    const oL = T.vm - .1;
    const ly = Math.max(sy + rs, by + rb) + 88;
    atext('Солнце', sx, ly, s.start + .3, t, { size: 46, w: 600, col: ink, track: -.01, dy: 14, out: oL });
    atext('Сириус', bx, ly, T.sir + .1, t, { size: 46, w: 600, col: ink, track: -.01, dy: 14, out: oL });
    // радиусы: hairline от центра к краю
    const aR = P(t, T.od2 - .1, .5) * (1 - P(t, oL, .35, eIn));
    if (aR > .003) {
      dot(sx, sy, 5, ink, aR); line(sx, sy, sx + rs * P(t, T.od2, .4), sy, ink, aR * .8, 2);
      dot(bx, by, 5, ink, aR); line(bx, by, bx + rb * P(t, T.od2 + .1, .4), by, ink, aR * .8, 2);
      atext('R', sx + rs / 2, sy - 18, T.od2 + .2, t, { size: 36, w: 600, col: ink, track: 0, a: aR, dy: 10 });
      atext('1,7 R', bx + rb / 2, by - 18, T.od2 + .3, t, { size: 36, w: 600, col: ink, track: 0, a: aR, dy: 10 });
    }
    // крупно: «T × 1,7», затем «R × 1,7»
    atext('Сириус', 540, 330, T.sir + .2, t, { size: 46, w: 600, col: sub, track: -.005, out: oL });
    atext('T × 1,7', 540, 470, T.od - .05, t, { size: 130, w: 700, col: ink, track: -.04, blur: 18, out: oL });
    atext('поверхность горячее', 540, 530, T.gor - .05, t, { size: 40, w: 500, col: sub, track: 0, out: oL });
    atext('R × 1,7', 540, 660, T.od2 - .05, t, { size: 130, w: 700, col: ink, track: -.04, blur: 18, out: oL });
    atext('радиус больше', 540, 720, T.kr - .05, t, { size: 40, w: 500, col: sub, track: 0, out: oL });
    // t2: «≈ 25 солнц света»
    atext('≈ 25', 540, 470, T.dv - .05, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('солнц света', 540, 550, T.sn - .05, t, { size: 50, w: 500, col: sub, track: -.005 });
    const ga = P(t, T.pya, .5);
    if (ga > .003) {
      // рамка-скобка под сеткой: «= 25 × Солнце»
      const [gx0, gy0] = project(cam, GX - 2 * GS - GR, -2 * GS - GR - .35, 0), [gx1] = project(cam, GX + 2 * GS + GR, 0, 0);
      const [sbx] = project(cam, B.x - B.r, 0, 0), [sbx1] = project(cam, B.x + B.r, 0, 0);
      line(gx0, gy0, gx1, gy0, sub, ga * .7, 2); line(gx0, gy0 - 10, gx0, gy0, sub, ga * .7, 2); line(gx1, gy0 - 10, gx1, gy0, sub, ga * .7, 2);
      line(sbx, gy0, sbx1, gy0, sub, ga * .7, 2); line(sbx, gy0 - 10, sbx, gy0, sub, ga * .7, 2); line(sbx1, gy0 - 10, sbx1, gy0, sub, ga * .7, 2);
      atext('Сириус', (sbx + sbx1) / 2, gy0 + 54, T.pya + .05, t, { size: 40, w: 600, col: ink, track: 0, dy: 12 });
      atext('25 Солнц', (gx0 + gx1) / 2, gy0 + 54, T.pya + .15, t, { size: 40, w: 600, col: ink, track: 0, dy: 12 });
      atext('=', (sbx1 + gx0) / 2, by + 26, T.pya + .1, t, { size: 90, w: 500, col: sub, track: 0, dy: 12 });
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'bloom', .25, .9);
    add(T.sir, 'whoosh', .25, .9);
    add(T.od - .05, 'tick', .2, 1.0);
    add(T.gor, 'shimmer', .2);
    add(T.od2 - .05, 'swell', .25, .8);
    add(T.kr, 'thud', .25, .9);
    add(T.vm + .5, 'whoosh', .22, 1.1);
    add(T.dv - .05, 'chime', .26, .95);
  },
});

// Солнце: в центре → вправо (на «Сириуса») → в центр сетки, уменьшаясь (на «около»)
function sunPose(t, T) {
  const m1 = P(t, T.sir - .2, 1.1, eInOut), m2 = P(t, T.vm - .05, .8, eInOut);
  const on = P(t, T.pov - .5, .9, eApple);
  return { x: lerp(lerp(0, 2.15, m1), GX, m2), y: 0, r: lerp(RS, GR, m2) * lerp(.85, 1, on) };
}
// Сириус: выходит слева тем же размером; белеет на «горячее»; растёт до 1,7 на «один … крупнее»; на t2 сдвигается влево
function sirPose(t, T) {
  const on = P(t, T.sir - .1, .9, eApple), gr = P(t, T.od2 - .05, T.kr + .3 - T.od2, eInOut), m2 = P(t, T.vm - .05, .8, eInOut);
  return { x: lerp(lerp(-1.55, -1.8, gr), -2.45, m2), r: lerp(RS, RB, gr) * on, heat: P(t, T.od, 1.2, eApple) };
}
