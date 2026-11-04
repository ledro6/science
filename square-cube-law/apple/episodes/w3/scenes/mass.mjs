// MASS (10.12 – 18.71 с), светлый фон — «страница продукта».
// m1 — фирменный ход канала: один алюминиевый кубик, к нему слетаются ещё семь — куб 2×2×2, размерные линии «2»,
//      «2³ = 8» (³ красная) → огромное красное «×8» вес;
// m2 — напольные весы как продукт (алюминий, стеклянная площадка, чёрный дисплей), на них керамический человек:
//      «70 кг»; на «превратятся» он вырастает вдвое, площадка проседает, счёт до «560 кг» (монохром), на дисплее те же цифры.
import { defineScene, makeStage, project, atext, acount, P, Wd, E, THREE, MAT, roundedBox, shadowsOn, clamp, lerp, eApple, eInOut, eIn, eSpring, FONT } from '../../../engine.mjs';
import { ctx, bump, frame, dim, collectMats, setLit, roundedBoxGeo, makeHuman } from './kit.mjs';

const CS = .9, GAP = .05, HS = CS + GAP;
const cellPos = (i, j, k) => [(i - .5) * HS, (j - .5) * HS, (k - .5) * HS];
function TT() {
  return {
    ves: Wd('m1', 'Вес'), ob: Wd('m1', 'объёма'), ras: Wd('m1', 'растёт'), kub: Wd('m1', 'куб'), dva: Wd('m1', 'два'), kube: Wd('m1', 'кубе'), vos: Wd('m1', 'восемь'),
    sem: Wd('m2', 'Семьдесят'), kg: Wd('m2', 'килограммов'), prev: Wd('m2', 'превратятся'), pyat: Wd('m2', 'пятьсот'), shes: Wd('m2', 'шестьдесят'),
    cut: (E('m1') + Wd('m2', 'Семьдесят')) / 2,
  };
}
const growP = (t, T) => eSpring(clamp((t - T.prev + .05) / 1.3));

defineScene('mass', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .45 });
    // --- A: куб 2×2×2 ---
    const gA = new THREE.Group(), alu = MAT.aluminium(), geo = roundedBox(CS, .045, 3), cubes = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
      const m = shadowsOn(new THREE.Mesh(geo, alu)); gA.add(m);
      cubes.push({ m, home: cellPos(i, j, k), dir: [(i - .5) * 2, (j - .5) * 2 + .25, (k - .5) * 2], ord: [0, 4, 2, 6, 1, 5, 3, 7][i * 4 + j * 2 + k] });
    }
    // --- B: весы и человек ---
    const gB = new THREE.Group();
    const base = new THREE.Mesh(roundedBoxGeo(1.7, .17, 1.7, .075), MAT.aluminium()); base.position.y = .085;
    const top = new THREE.Mesh(roundedBoxGeo(1.58, .03, 1.58, .012), MAT.glass(.3)); top.position.y = .18;
    const disp = new THREE.Mesh(roundedBoxGeo(.56, .02, .2, .008), MAT.ceramicBlack()); disp.position.set(0, .2, .62);
    const man = makeHuman(); man.position.set(0, .195, -.12);
    const plat = new THREE.Group(); plat.add(top, disp, man);
    gB.add(base, plat); shadowsOn(base); shadowsOn(top);
    stage.root.add(gA, gB);
    return { stage, T: TT(), gA, cubes, gB, plat, disp, man, mA: collectMats(gA), mB: collectMats(gB) };
  },

  update(t, s, st) {
    const { stage, T, gA, cubes, gB, plat, man } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cut ? 1 : 2;
    gA.visible = ph === 1; gB.visible = ph === 2;
    L.key.position.set(3, 9, 6); L.key.intensity = 2.2; L.hemi.intensity = 1.15; L.rimL.intensity = 1.2; L.rimR.intensity = .9; L.key.castShadow = true;
    stage.floor.visible = true;
    if (ph === 1) {
      setLit(st.mA, P(t, s.start + .1, .6));
      stage.floor.position.y = -HS;
      // первый кубик стоит в центре; на «растёт» к нему слетаются ещё семь, и он занимает свой угол
      cubes.forEach(c => {
        if (c.ord === 0) {
          const p = P(t, T.ras - .1, 1.0, eInOut);
          c.m.position.set(lerp(0, c.home[0], p), c.home[1], lerp(0, c.home[2], p)); c.m.rotation.set(0, (1 - p) * .35, 0);
          c.m.scale.setScalar(1); c.m.visible = true; return;
        }
        const p = P(t, T.ras - .1 + c.ord * .1, 1.0, eInOut);
        const ex = .8 * (1 - p);
        c.m.visible = p > .003; c.m.scale.setScalar(lerp(.6, 1, p));
        c.m.position.set(c.home[0] + c.dir[0] * ex, c.home[1] + c.dir[1] * ex + (1 - p) * .6, c.home[2] + c.dir[2] * ex);
        c.m.rotation.set((1 - p) * .5 * c.dir[2], (1 - p) * .6 * c.dir[0], 0);
      });
      const k = clamp((t - s.start) / (T.cut - s.start));
      frame(cam, [0, -.05, 0], lerp(21, 18.8, eInOut(k)), lerp(24, 40, k), lerp(24, 20, k), 540, 950);
    } else {
      setLit(st.mB, P(t, T.cut, .6));
      stage.floor.position.y = 0;
      const gp = growP(t, T);
      man.scale.setScalar(lerp(1, 2, gp));
      man.rotation.y = .15 - .04 * (t - T.cut);
      plat.position.y = -.01 * P(t, T.sem, .5) - .03 * gp;
      // камера отъезжает вместе с ростом человека
      const k = clamp((t - T.cut) / (s.end - T.cut));
      frame(cam, [0, lerp(1.0, 1.9, gp), 0], lerp(16, 21, gp) - .3 * k, lerp(-16, -6, k), lerp(12, 10, k), 540, 925);
    }
  },

  draw2d(t, s, st) {
    const { stage, T, disp } = st, cam = stage.camera, g = ctx();
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
      atext('Вес ∝ объём', 540, 380, T.ves - .05, t, { size: 110, w: 600, col: ink, track: -.03, out: oO });
      atext('объём растёт как куб роста', 540, 456, T.ras - .05, t, { size: 50, w: 500, col: sub, track: -.005, out: oO });
      const o2 = T.vos - .15;
      atext('2³ = 8', 540, 420, T.dva, t, { size: 170, w: 600, col: ink, track: -.03, blur: 18, scale0: 1.08, dur: .9, out: o2, outDur: .3 });
      atext('×8', 540, 450, T.vos, t, { size: 340, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: T.cut - .35 });
      atext('вес', 540, 528, T.vos + .2, t, { size: 50, w: 500, col: sub, track: -.005, out: T.cut - .35 });
    } else {
      // большая цифра: «70 кг» → счёт до «560 кг» (монохром: красный в этой сцене — только «×8»)
      atext('70 кг', 540, 470, T.sem - .05, t, { size: 220, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.pyat - .1, outDur: .2 });
      if (t > T.pyat - .15) acount(560, 540, 470, T.pyat - .1, t, { from: 70, suffix: ' кг', size: 220, w: 700, col: ink, dur: 1.0 });
      atext('на весах', 540, 548, T.kg, t, { size: 50, w: 500, col: sub, track: -.005, out: T.pyat - .1 });
      atext('больше полутонны', 540, 548, T.shes + .1, t, { size: 50, w: 500, col: sub, track: -.005 });
      // дисплей весов: то же число, «прилипает» к 3D
      disp.updateMatrixWorld();
      const dp = new THREE.Vector3(0, .012, 0).applyMatrix4(disp.matrixWorld), [dx, dy] = project(cam, dp.x, dp.y, dp.z);
      const v = t < T.pyat - .1 ? 70 : Math.round(lerp(70, 560, P(t, T.pyat - .1, 1.0, x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))));
      const da = P(t, T.sem + .2, .5);
      const fs = lerp(40, 24, growP(t, T));
      if (da > .003) {
        g.save(); g.globalAlpha = da; g.translate(dx, dy); g.transform(1, 0, -.3, .5, 0, 0);
        g.font = `600 ${fs}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFFFFF';
        g.fillText(v.toFixed(1).replace('.', ','), 0, 0); g.restore();
      }
    }
    // «вдох» на монтажном стыке
    const dip = bump(t, T.cut, .22);
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = stage.bgc; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  },

  sfx(add) {
    const T = TT();
    add(T.ves, 'swell', .2, .8);
    for (let i = 1; i < 8; i++) add(T.ras + .85 + i * .1, 'click', .1 + i * .01, .9 + i * .04);
    add(T.dva, 'chime', .2, .9);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .4, .9);
    add(T.sem - .1, 'thud', .26, .8);
    add(T.prev, 'whoosh', .26, .75);
    add(T.pyat - .1, 'thud', .34, .6);
    add(T.shes + .3, 'chime', .24, .95);
  },
});
