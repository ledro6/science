// MASS (9.16 – 19.47 с), светлый фон — «страница продукта».
// m1 — фирменный ход канала: куб 2×2×2 собирается из 8 алюминиевых кубиков, размерные линии «2»,
//      «2³ = 8» (³ красная) → огромное красное «×8» масса;
// m2 — Земля вдвое больше: «ты» — точка на поверхности, стрелка тяжести к центру, радиус до центра «2R»;
//      «g ∝ M / R²» → «8 / 2² = 2» собирается по словам диктора, стрелка тяжести удлиняется вдвое.
import { defineScene, makeStage, project, atext, line, dot, measure, P, Wd, E, THREE, MAT, roundedBox, shadowsOn, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, bump, makeEarth, frame, arrow, dim, collectMats, setLit, screenR, wordsAt } from './kit.mjs';

const CS = .9, GAP = .05, HS = CS + GAP, RE = 1;
const cellPos = (i, j, k) => [(i - .5) * HS, (j - .5) * HS, (k - .5) * HS];
function TT() {
  return {
    ob: Wd('m1', 'Объём'), kub: Wd('m1', 'куб'), rad: Wd('m1', 'радиуса'), dva: Wd('m1', 'два'), kube: Wd('m1', 'кубе'), vos: Wd('m1', 'восемь'),
    tya: Wd('m2', 'тяжесть'), pov: Wd('m2', 'поверхности'), del: Wd('m2', 'делится'), kv: Wd('m2', 'квадрат'), ras: Wd('m2', 'расстояния'), cen: Wd('m2', 'центра'),
    vos2: Wd('m2', 'восемь'), delim: Wd('m2', 'делим'), chet: Wd('m2', 'четыре'), vyh: Wd('m2', 'выходит'), dva2: Wd('m2', 'два'),
    cut: (E('m1') + Wd('m2', 'А')) / 2,
  };
}

defineScene('mass', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .45 });
    // --- A: куб 2×2×2 ---
    const gA = new THREE.Group(), alu = MAT.aluminium(), geo = roundedBox(CS, .045, 3), cubes = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
      const m = shadowsOn(new THREE.Mesh(geo, alu)); gA.add(m);
      cubes.push({ m, home: cellPos(i, j, k), dir: [(i - .5) * 2, (j - .5) * 2 + .25, (k - .5) * 2], ord: [0, 4, 2, 6, 1, 5, 3, 7][i * 4 + j * 2 + k] });
    }
    // --- B: Земля вдвое больше ---
    const gB = new THREE.Group(), earth = makeEarth(RE);
    gB.add(earth);
    stage.root.add(gA, gB);
    return { stage, T: TT(), gA, cubes, gB, earth, mA: collectMats(gA), mB: collectMats(gB) };
  },

  update(t, s, st) {
    const { stage, T, gA, cubes, gB, earth } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cut ? 1 : 2;
    gA.visible = ph === 1; gB.visible = ph === 2;
    L.key.position.set(3, 9, 6); L.key.intensity = 2.2; L.hemi.intensity = 1.15; L.rimL.intensity = 1.2; L.rimR.intensity = .9;
    if (ph === 1) {
      setLit(st.mA, P(t, s.start + .1, .6));
      stage.floor.visible = true; stage.floor.position.y = -HS; L.key.castShadow = true;
      // кубики слетаются на «куб радиуса»
      cubes.forEach(c => {
        const p = P(t, T.kub - .35 + c.ord * .1, 1.0, eInOut);
        const ex = .7 * (1 - p);
        c.m.position.set(c.home[0] + c.dir[0] * ex, c.home[1] + c.dir[1] * ex, c.home[2] + c.dir[2] * ex);
        c.m.rotation.set((1 - p) * .5 * c.dir[2], (1 - p) * .6 * c.dir[0], 0);
      });
      const k = clamp((t - s.start) / (T.cut - s.start));
      frame(cam, [0, -.05, 0], lerp(22, 18.8, eInOut(k)), lerp(24, 40, k), lerp(24, 20, k), 540, 930);
    } else {
      setLit(st.mB, P(t, T.cut, .6));
      stage.floor.visible = false; L.key.castShadow = false;
      L.key.position.set(-4, 7, 7);
      earth.rotation.set(0, (t - T.cut) * .22 - 1.1, .41);
      const k = clamp((t - T.cut) / (s.end - T.cut));
      frame(cam, [0, 0, 0], lerp(15.6, 15, eInOut(k)), lerp(-6, 6, k), 8, 540, 1035);
    }
  },

  draw2d(t, s, st) {
    const { stage, T, earth } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    if (t < T.cut) {
      // размерные линии «2» по трём рёбрам собранного куба
      const a = P(t, T.dva - .15, .5) * (1 - P(t, T.cut - .35, .3, eIn));
      const e = HS - GAP / 2, o = .22;
      const edge = (p1, p2, lab, n) => {
        const A = project(cam, ...p1), B = project(cam, ...p2);
        dim(A[0], A[1], B[0], B[1], a, ink);
        atext(lab, (A[0] + B[0]) / 2 + n[0], (A[1] + B[1]) / 2 + n[1], T.dva, t, { size: 48, w: 600, col: ink, track: 0, dy: 12, out: T.cut - .35 });
      };
      edge([-e, -e, e + o], [e, -e, e + o], '2', [0, 40]);
      edge([e + o, -e, e], [e + o, -e, -e], '2', [34, 34]);
      edge([-e - o, -e, e], [-e - o, e, e], '2', [-36, 14]);
      const oO = T.dva - .2;
      atext('Объём шара', 540, 380, T.ob - .05, t, { size: 110, w: 600, col: ink, track: -.03, out: oO });
      atext('растёт как куб радиуса', 540, 456, T.kub - .1, t, { size: 50, w: 500, col: sub, track: -.005, out: oO });
      const o2 = T.vos - .15;
      atext('2³ = 8', 540, 420, T.dva, t, { size: 170, w: 600, col: ink, track: -.03, blur: 18, scale0: 1.08, dur: .9, out: o2, outDur: .3 });
      atext('×8', 540, 450, T.vos, t, { size: 340, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: T.cut - .35 });
      atext('масса', 540, 528, T.vos + .2, t, { size: 50, w: 500, col: sub, track: -.005, out: T.cut - .35 });
    } else {
      const c0 = [0, 0, 0], [cx, cy] = project(cam, ...c0), r = screenR(cam, c0, RE);
      // «ты» на поверхности (верхняя точка диска) и стрелка тяжести к центру
      const top = [cx, cy - r], aY = P(t, T.pov - .1, .5);
      dot(top[0], top[1] - 8, 9 * aY, ink, aY);
      atext('ты', top[0] + 22, top[1] - 22, T.pov, t, { size: 38, w: 600, col: ink, align: 'left', track: 0, dy: 12 });
      const aA = P(t, T.tya + .1, .5);
      const len = lerp(55, 110, eSpring(clamp((t - T.dva2 + .05) / .9)));
      arrow(top[0] - 34, top[1] - 34 - len, top[0] - 34, top[1] - 34, ink, aA * P(t, T.tya, .6), 4, 16);
      // радиус до центра: пунктир внутри диска и подпись «2R»
      const pr = P(t, T.ras - .1, .7, eInOut);
      line(cx, cy, cx + r * pr, cy, '#FFFFFF', .95 * P(t, T.ras - .1, .3), 3, [10, 8]);
      dot(cx, cy, 6 * P(t, T.cen - .1, .4), '#FFFFFF', P(t, T.cen - .1, .4));
      atext('2R', cx + r / 2, cy - 22, T.cen - .05, t, { size: 46, w: 600, col: '#FFFFFF', track: 0, dy: 12 });
      // формулы
      atext('тяжесть на поверхности', 540, 300, T.tya, t, { size: 46, w: 500, col: sub, track: -.005 });
      const oF = T.vos2 - .2;
      atext('g ∝ M / R²', 540, 440, T.del, t, { size: 140, w: 600, col: ink, track: -.03, blur: 18, scale0: 1.08, dur: .9, out: oF, outDur: .3 });
      const u = P(t, T.kv, .45) * (1 - P(t, oF, .3, eIn));
      const tot = measure('g ∝ M / R²', 140, 600, -.03), wd = measure('R²', 140, 600, -.03), ux = 540 + tot / 2 - wd / 2;
      line(ux - wd / 2 * u, 472, ux + wd / 2 * u, 472, ink, .85 * u, 3);
      wordsAt(['8', '/', '2²', '=', '2'], [T.vos2 - .05, T.delim, T.chet - .05, T.vyh, T.dva2 - .05], 540, 450, t,
        { size: 160, w: 600, col: ink, track: -.03, blur: 18, dur: .8 });
      atext('вес вдвое больше', 540, 535, T.dva2 + .2, t, { size: 48, w: 500, col: sub, track: -.005 });
    }
    // «вдох» в белый на монтажном стыке
    const dip = bump(t, T.cut, .22);
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = stage.bgc; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  },

  sfx(add) {
    const T = TT();
    add(T.ob, 'swell', .2, .8);
    for (let i = 0; i < 8; i++) add(T.kub + .65 + i * .1, 'click', .1 + i * .01, .9 + i * .04);
    add(T.dva, 'chime', .2, .9);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .4, .9);
    add(T.cut, 'whoosh', .22, .8);
    add(T.del, 'bloom', .22, .85);
    add(T.kv, 'tick', .14);
    add(T.vos2, 'tick', .12, .9);
    add(T.chet, 'tick', .12, 1);
    add(T.dva2, 'chime', .26, 1);
  },
});
