// GROWTH (23.4 – 36.9 с), чёрный фон.
// Логарифмическая шкала 1–10 как алюминиевая дорожка: отрезок 1→2 самый длинный (≈30%), 9→10 короткий (≈4,6%).
// g1 — «Причина в росте»; шарик-число катится 1→2 с постоянной скоростью в log-пространстве, «×2».
// g2 — шарик перепрыгивает на 9 и с той же скоростью проходит 9→10 почти мгновенно, «+11%»;
//      затем шарик бежит по кругу 1→10, а за дорожкой растут блоки «время на участке» — выше всех у единицы (красный).
import { defineScene, makeStage, project, atext, atextWords, line, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, BEN, makeBar, rbox, frame, keys, dimLine, bump, pct } from './kit.mjs';

const X0 = -2.6, LEN = 5.2, BR = .17, TOP = .16, LZ = -.62;
const xOf = v => X0 + Math.log10(v) * LEN;
const SPD = Math.log10(2);                         // log-единиц за «ролл» 1→2 (длительность задаётся ниже)

function TT() {
  const T = {
    prich: Wd('g1', 'Причина'), rost: Wd('g1', 'росте'), chis: Wd('g1', 'число'), odn: Wd('g1', 'одного'), dvuh: Wd('g1', 'двух'), udv: Wd('g1', 'удвоиться'),
    a: Wd('g2', 'А'), dev: Wd('g2', 'девяти'), des: Wd('g2', 'десяти'), odin: Wd('g2', 'одиннадцати'), proc: Wd('g2', 'процентов'),
    pot: Wd('g2', 'Поэтому'), ed: Wd('g2', 'единице'), dol: Wd('g2', 'дольше'), end1: E('g1'),
  };
  T.r1 = T.odn; T.rd = T.udv + .05 - T.odn;         // 1→2 за rd секунд → скорость SPD/rd
  T.v = SPD / T.rd;
  T.r9 = T.des - .05; T.rd9 = Math.log10(10 / 9) / T.v; // 9→10 с той же скоростью
  T.hop = T.a + .05; T.hopD = T.dev - .05 - T.hop;
  T.L0 = T.pot + .05; T.LD = 1.2;                   // круги 1→10
  return T;
}
// положение шарика в log-пространстве [0..1] и «видимость» (провал на перескоке)
function ball(t, T) {
  if (t < T.r1) return { l: 0, y: 0 };
  if (t < T.hop) return { l: Math.min(SPD, (t - T.r1) * T.v), y: 0 };
  if (t < T.hop + T.hopD) { const u = eInOut((t - T.hop) / T.hopD); return { l: lerp(SPD, Math.log10(9), u), y: 4 * u * (1 - u) * 1.1 }; }
  if (t < T.L0) return { l: Math.log10(9) + clamp((t - T.r9) * T.v, 0, Math.log10(10 / 9)), y: 0 };
  const n = (t - T.L0) / T.LD, f = n - Math.floor(n);
  return { l: f, y: 0, wrap: Math.min(bump(f, 0, .05), 1) + bump(f, 1, .05) };
}
// время, проведённое шариком на участке d (в кругах)
function dwell(t, T, d) {
  if (t < T.L0) return 0;
  const n = (t - T.L0) / T.LD, k = Math.floor(n), f = n - k, a = Math.log10(d), b = Math.log10(d + 1);
  return (k * (b - a) + clamp(f - a, 0, b - a)) * T.LD;
}

defineScene('growth', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    stage.camera.far = 200; stage.camera.updateProjectionMatrix();
    const T = TT();
    const alu = MAT.graphite();
    const track = new THREE.Mesh(rbox(LEN + .5, TOP, .62, .05, 2), alu);
    track.position.set(X0 + LEN / 2, TOP / 2, 0); track.castShadow = track.receiveShadow = true;
    // риски шкалы: тонкие графитовые полоски поперёк дорожки
    const tickMat = new THREE.MeshBasicMaterial({ color: '#D8D8DC', toneMapped: false });
    const ticks = [];
    for (let v = 1; v <= 10; v++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.022, .006, .5), tickMat); m.position.set(xOf(v), TOP + .002, 0); ticks.push(m); }
    // подсветка участков 1→2 и 9→10 (светлая полоса на поверхности)
    const hl = [[1, 2], [9, 10]].map(([a, b]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(xOf(b) - xOf(a) - .04, .56), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set((xOf(a) + xOf(b)) / 2, TOP + .004, 0); return m;
    });
    const ballM = new THREE.Mesh(new THREE.SphereGeometry(BR, 48, 32), MAT.ceramicWhite());
    ballM.castShadow = true;
    // блоки «время на участке» за дорожкой
    const white = MAT.ceramicWhite(), red = MAT.red();
    const blocks = BEN.map((p, i) => { const w = xOf(i + 2) - xOf(i + 1) - .05; const b = makeBar(w, .34, i === 0 ? red : white, Math.min(.04, w * .3)); b.position.set((xOf(i + 1) + xOf(i + 2)) / 2, 0, LZ); return b; });
    stage.root.add(track, ...ticks, ...hl, ballM, ...blocks);
    return { stage, T, track, ticks, hl, ballM, blocks, alu, red };
  },

  update(t, s, st) {
    const { stage, T, track, hl, ballM, blocks, red } = st, cam = stage.camera, L = stage.lights;
    // дорожка выходит из темноты, свет проезжает вдоль
    const lit = P(t, s.start, 1.2);
    const sw = clamp((t - s.start) / 2.6);
    L.key.position.set(lerp(-9, 5, eInOut(sw)), 9, 6); L.key.target.position.set(0, 0, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.7 * lit; L.hemi.intensity = .5 * lit; L.rimL.intensity = 3.2 * lit; L.rimR.intensity = 2.4 * lit;
    track.scale.set(lerp(.94, 1, P(t, s.start, 1.4)), 1, 1);
    // шарик
    const b = ball(t, T);
    const x = X0 + b.l * LEN;
    const app = eSpring(clamp((t - T.chis + .15) / .7));
    const k = Math.max(1e-3, app * (1 - (b.wrap || 0)));
    ballM.visible = app > .002;
    ballM.scale.setScalar(k);
    ballM.position.set(x, TOP + BR * k + b.y + (1 - app) * .6, 0);
    ballM.rotation.set(0, 0, -(x - X0) / BR);
    // подсветка участков
    hl[0].material.opacity = .3 * P(t, T.r1, .5) * (1 - P(t, T.a, .5)) + .1 * P(t, T.a, .5) * (1 - P(t, T.pot, .4));
    hl[1].material.opacity = .4 * P(t, T.r9 - .1, .3) * (1 - P(t, T.pot, .4));
    // блоки времени
    blocks.forEach((bl, i) => {
      const h = 1.5 * dwell(t, T, i + 1);
      bl.setH(Math.max(.001, h)); bl.visible = h > .002;
    });
    red.color.set('#F2F2F0').lerp(new THREE.Color(stage.accent), P(t, T.ed - .05, .5));
    // камера: общий план → участок 1→2 → участок 9→10 → общий план
    const [tx, ty, d, az, el, sy] = keys([
      [s.start, 0, .35, 24.5, -6, 26, 930],
      [T.chis - .4, 0, .35, 24, -3, 25, 930],
      [T.odn + .3, -1.25, .3, 15, -6, 22, 930],
      [T.udv + .6, -1.25, .3, 14.5, -3, 22, 930],
      [T.dev + .3, 1.25, .3, 15, 4, 22, 930],
      [T.proc + .8, 1.3, .3, 14.5, 6, 22, 930],
      [T.pot + .7, 0, .6, 24, -2, 24, 1000],
      [s.end, 0, .6, 23.5, 3, 25, 1000],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    // числа шкалы под дорожкой
    for (let v = 1; v <= 10; v++) {
      const [x, y] = project(cam, xOf(v), 0, .36);
      const hot = (v <= 2 && t > T.r1 && t < T.a) || (v >= 9 && t > T.dev - .1 && t < T.pot) || (v === 1 && t > T.ed);
      const a = P(t, s.start + .3 + v * .06, .6);
      atext(String(v), x, y + 50, s.start + .3 + v * .06, t, { size: 40, w: 600, col: hot ? ink : sub, a, track: 0, dy: 14 });
    }
    // g1
    atextWords('Причина в росте', 540, 430, T.prich, t, { size: 100, w: 600, col: ink, track: -.03, stagger: .12, out: T.chis - .1 });
    // ×2 над участком 1→2
    {
      const o = T.a - .1;
      atext('1 → 2', 540, 540, T.odn, t, { size: 170, w: 700, col: ink, track: -.04, blur: 18, scale0: 1.08, dur: .8, out: T.udv - .2 });
      atext('×2', 540, 560, T.udv - .05, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o });
      atext('чтобы дойти от 1 до 2', 540, 640, T.udv + .25, t, { size: 46, w: 500, col: sub, track: -.005, out: o });
      const [ax, ay] = project(cam, xOf(1), TOP, -.36), [bx, by] = project(cam, xOf(2), TOP, -.36);
      const a = P(t, T.dvuh, .5) * (1 - P(t, o, .3, eIn));
      dimLine(ax, ay - 74, bx, by - 74, ink, a);
      atext(pct(BEN[0]), (ax + bx) / 2, (ay + by) / 2 - 98, T.dvuh + .1, t, { size: 40, w: 600, col: ink, track: 0, dy: 12, out: o });
    }
    // +11% над участком 9→10
    {
      const o = T.pot - .15;
      atext('9 → 10', 540, 540, T.dev, t, { size: 170, w: 700, col: ink, track: -.04, blur: 18, scale0: 1.08, dur: .8, out: T.odin - .2 });
      atext('+11%', 540, 560, T.odin, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o });
      atext('чтобы дойти от 9 до 10', 540, 640, T.proc, t, { size: 46, w: 500, col: sub, track: -.005, out: o });
      const [ax, ay] = project(cam, xOf(9), TOP, -.36), [bx, by] = project(cam, xOf(10), TOP, -.36);
      const a = P(t, T.des, .5) * (1 - P(t, o, .3, eIn));
      dimLine(ax, ay - 74, bx, by - 74, ink, a, 10);
      atext(pct(BEN[8]), (ax + bx) / 2, (ay + by) / 2 - 98, T.des + .1, t, { size: 40, w: 600, col: ink, track: 0, dy: 12, out: o });
    }
    // круги: заголовок
    atextWords('Дольше всего на единице', 540, 470, T.ed - .05, t, { size: 76, w: 600, col: ink, track: -.03, stagger: .1 });
    atext('время на каждом участке', 540, 550, T.dol, t, { size: 42, w: 500, col: sub, track: 0 });
  },

  sfx(add) {
    const T = TT();
    add(T.prich - .1, 'bloom', .3, .8);
    add(T.chis, 'thud', .3, .9);
    add(T.r1, 'swell', .2, .8);
    add(T.udv, 'chime', .25, .9);
    add(T.hop, 'whoosh', .25, 1.1);
    add(T.dev, 'thud', .22, 1);
    add(T.r9, 'tick', .2, 1.2);
    add(T.odin, 'chime', .25, 1.05);
    add(T.L0, 'whoosh', .25, .8);
    add(T.ed, 'click', .25);
    add(T.dol, 'shimmer', .2);
  },
});
