// HEAT (34.12 – 48.95 с), светлый фон.
// t1 — «Перегрев»; куб 2×2×2 из графитовых кубиков (тело великана): на «Тепла» кубики раскаляются изнутри
//      (тепло рождается в объёме), огромное красное «×8 тепло»; на «отдаёт» от граней уходят тонкие линии,
//      на «кожей» передняя грань расслаивается на 2×2 стеклянные плитки (кожа), «×4 кожа» монохромом;
// t2 — ориентир 1,75 м (керамика) и графитовый силуэт, который вырастает до 2,72 м; «Роберт Уодлоу», размерная
//      линия «2,72 м»; на «опорами» камера наезжает на голени: алюминиевые ортезы вырастают снизу, «опоры на ногах».
import { defineScene, makeStage, project, atext, callout, P, Wd, WdE, E, rng, THREE, MAT, roundedBox, shadowsOn, clamp, lerp, eApple, eInOut, eIn, eEase, eSpring, C_INK } from '../../../engine.mjs';
import { ctx, bump, frame, keys, dim, wordsAt, veil, makeHuman, collectMats, setLit, HUMAN_H } from './kit.mjs';

const CS = .9, GAP = .05, HS = CS + GAP, KW = 2.72 / HUMAN_H;
const cellPos = (i, j, k) => [(i - .5) * HS, (j - .5) * HS + HS, (k - .5) * HS];
const frac = x => x - Math.floor(x);
function TT() {
  const T = {
    i: Wd('t1', 'И'), per: Wd('t1', 'перегрев'), tep: Wd('t1', 'Тепла'), vyr: Wd('t1', 'вырабатывает'), vos: Wd('t1', 'восемь'),
    otd: Wd('t1', 'отдаёт'), kozh: Wd('t1', 'кожей'), pl: Wd('t1', 'площадь'), vch: Wd('t1', 'вчетверо'),
    sam: Wd('t2', 'Самый'), vys: Wd('t2', 'высокий'), rob: Wd('t2', 'Роберт'), dva: Wd('t2', 'два'), sant: Wd('t2', 'сантиметра'),
    hod: Wd('t2', 'ходил'), op: Wd('t2', 'опорами'), nog: Wd('t2', 'ногах'),
  };
  T.cut = (E('t1') + T.sam) / 2;
  return T;
}
const growW = (t, T) => eSpring(clamp((t - T.vys + .1) / 1.3));
const zoomP = (t, T) => P(t, T.hod - .15, 1.2, eInOut);

defineScene('heat', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .45 });
    const T = TT();
    // --- A: куб-тело, кубики раскаляются изнутри ---
    const gA = new THREE.Group(), geo = roundedBox(CS, .045, 3), cubes = [];
    const hot = new THREE.MeshPhysicalMaterial({ color: '#3A3A3C', roughness: .38, metalness: .2, clearcoat: .5, emissive: new THREE.Color('#FFF6EC'), emissiveIntensity: 0 });
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
      const m = shadowsOn(new THREE.Mesh(geo, hot)); m.position.set(...cellPos(i, j, k)); gA.add(m); cubes.push(m);
    }
    // стеклянные плитки кожи на передней грани
    const tgeo = new THREE.BoxGeometry(CS, CS, .02);
    const tMat = new THREE.MeshPhysicalMaterial({ color: '#E9EDF2', roughness: .06, transparent: true, opacity: .55, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    const eMat = new THREE.LineBasicMaterial({ color: '#1D1D1F', transparent: true, opacity: .7 }), egeo = new THREE.EdgesGeometry(tgeo, 20);
    const tiles = [0, 1, 2, 3].map(() => { const gr = new THREE.Group(); gr.add(new THREE.Mesh(tgeo, tMat), new THREE.LineSegments(egeo, eMat)); gA.add(gr); return gr; });
    // --- B: ориентир и Роберт Уодлоу ---
    const gB = new THREE.Group();
    const man = makeHuman(); man.position.set(-.95, 0, 0); man.rotation.y = .25;
    const wad = makeHuman({ mat: MAT.graphite(), braces: true }); wad.position.set(.32, 0, 0); wad.rotation.y = -.12;
    gB.add(man, wad);
    stage.root.add(gA, gB);
    return { stage, T, gA, cubes, hot, tiles, tMat, eMat, gB, man, wad, mA: collectMats(gA), mB: collectMats(gB) };
  },

  update(t, s, st) {
    const { stage, T, gA, gB, hot, tiles, tMat, eMat, wad } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cut ? 1 : 2;
    gA.visible = ph === 1; gB.visible = ph === 2;
    L.key.position.set(3, 9, 6); L.key.intensity = 2.2; L.hemi.intensity = 1.15; L.rimL.intensity = 1.2; L.rimR.intensity = .9; L.key.castShadow = true;
    stage.floor.position.y = 0;
    if (ph === 1) {
      setLit(st.mA, P(t, s.start + .1, .7));
      // тепло рождается в объёме: кубики раскаляются, дышат
      const h = P(t, T.tep - .1, 1.6, eApple);
      hot.emissiveIntensity = h * (.24 + .03 * Math.sin((t - T.tep) * 3.2));
      // плитки кожи отслаиваются от передней грани
      const a = P(t, T.kozh - .2, .45);
      tMat.opacity = .55 * a; eMat.opacity = .7 * a;
      tiles.forEach((m, i) => {
        const ix = i % 2, iy = Math.floor(i / 2), pe = P(t, T.kozh + .05 + (ix + iy) * .07, 1.2, eInOut), sp = 1 + pe * .14;
        m.visible = a > .003;
        m.position.set((ix - .5) * HS * sp, HS + (iy - .5) * HS * sp, HS + .02 + pe * .55);
      });
      const k = clamp((t - s.start) / (T.cut - s.start));
      frame(cam, [0, HS, 0], lerp(20, 18.2, eInOut(k)), lerp(30, 40, k), lerp(20, 17, k), 540, 940);
    } else {
      setLit(st.mB, P(t, T.cut, .6));
      wad.scale.setScalar(lerp(1, KW, growW(t, T)));
      wad.setBraces(P(t, T.op - .1, .8, eInOut));
      // общий план → наезд на голени Уодлоу
      const z = zoomP(t, T), k = clamp((t - T.cut) / (s.end - T.cut));
      st.man.visible = z < .45;
      const tg = [lerp(-.3, .32 + .02, z), lerp(1.36, .5, z), 0];
      const d = Math.exp(lerp(Math.log(15), Math.log(7.4), z));
      frame(cam, tg, d - .25 * k, lerp(lerp(-8, -2, k), 16, z), lerp(5, 9, z), lerp(540, 760, z), lerp(925, 900, z));
    }
  },

  draw2d(t, s, st) {
    const { stage, T, wad, man } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    if (t < T.cut) {
      atext('Перегрев', 540, 420, T.per - .05, t, { size: 130, w: 600, col: ink, track: -.03, blur: 16, dur: .8, out: T.tep - .25 });
      const oA = T.cut - .35;
      atext('×8', 300, 480, T.vos - .05, t, { size: 250, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oA });
      atext('тепло', 300, 556, T.vos + .15, t, { size: 50, w: 500, col: sub, track: -.005, out: oA });
      atext('×4', 780, 480, T.vch - .05, t, { size: 250, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oA });
      atext('площадь кожи', 780, 556, T.vch + .15, t, { size: 50, w: 500, col: sub, track: -.005, out: oA });
      // тепло уходит через поверхность: тонкие линии от силуэта куба наружу
      const ri = P(t, T.otd - .15, .8, eApple) * (1 - P(t, oA, .3, eIn));
      if (ri > .003) {
        const [cx, cy] = project(cam, 0, HS, 0), R = rng(21);
        g.save(); g.strokeStyle = C_INK; g.lineCap = 'round'; g.lineWidth = 2;
        for (let i = 0; i < 56; i++) {
          const a = R() * Math.PI * 2, ph = R(), sp = .55 + R() * .3, kk = frac(t * sp + ph);
          const r0 = (215 + 25 * Math.abs(Math.sin(2 * a))) * lerp(.95, 1.05, R()), r = r0 + kk * 120, l = 18 + R() * 14;
          const y0 = cy + Math.sin(a) * r;
          if (y0 < 640 || y0 + Math.sin(a) * l > 1310) continue;
          g.globalAlpha = Math.sin(Math.PI * kk) * .45 * ri;
          g.beginPath(); g.moveTo(cx + Math.cos(a) * r, y0); g.lineTo(cx + Math.cos(a) * (r + l), cy + Math.sin(a) * (r + l)); g.stroke();
        }
        g.restore();
      }
    } else {
      const oT = T.hod - .3;
      atext('самый высокий человек в истории', 540, 300, T.sam, t, { size: 44, w: 500, col: sub, track: -.005, out: oT });
      atext('Роберт Уодлоу', 540, 410, T.rob - .05, t, { size: 104, w: 600, col: ink, track: -.03, blur: 16, dur: .8, out: oT });
      // размерные линии: 1,75 м слева от ориентира, 2,72 м справа от Уодлоу
      const dA = P(t, T.cut + .3, .5) * (1 - P(t, oT, .35, eIn));
      const xa = man.position.x - .42, xb = wad.position.x + .42 * wad.scale.x, hw = HUMAN_H * wad.scale.x;
      const [a0x, a0y] = project(cam, xa, 0, 0), [, a1y] = project(cam, xa, HUMAN_H, 0);
      const [b0x, b0y] = project(cam, xb, 0, 0), [, b1y] = project(cam, xb, hw, 0);
      dim(a0x, a0y, a0x, a1y, dA, ink, 12, P(t, T.cut + .3, .8, eInOut));
      dim(b0x, b0y, b0x, b1y, dA * P(t, T.dva - .2, .4), ink, 12, P(t, T.dva - .2, 1.0, eInOut));
      atext('1,75 м', a0x, a1y - 28, T.cut + .6, t, { size: 40, w: 600, col: ink, track: 0, dy: 12, out: oT });
      atext('2,72 м', b0x - 10, b1y - 34, T.dva - .05, t, { size: 64, w: 600, col: ink, track: -.01, dy: 16, out: oT });
      // наезд: ортезы и выноска
      const zp = zoomP(t, T);
      if (zp > .5) {
        wad.updateMatrixWorld(true);
        const v = new THREE.Vector3(-.166, .4, .02).applyMatrix4(wad.matrixWorld), [px, py] = project(cam, v.x, v.y, v.z);
        callout(px, py, 380, 1015, T.op + .45, t, ink);
        atext('опоры на ногах', 96, 1000, T.op + .6, t, { size: 46, w: 600, col: ink, align: 'left', track: -.02, dy: 22, blur: 10 });
      }
    }
    veil(stage.bgc, bump(t, T.cut, .22));
  },

  sfx(add) {
    const T = TT();
    add(T.per, 'swell', .22, .8);
    add(T.tep, 'bloom', .26, .8);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .38, .9);
    add(T.otd, 'whoosh', .22, 1.2);
    add(T.kozh + .05, 'shimmer', .26);
    add(T.vch, 'chime', .24, .95);
    add(T.cut, 'whoosh', .22, .7);
    add(T.vys - .05, 'swell', .26, .6);
    add(T.rob, 'tick', .12);
    add(T.dva, 'chime', .22, .9);
    add(T.hod - .1, 'whoosh', .22, .8);
    add(T.op, 'click', .3, .9);
  },
});
