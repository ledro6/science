// ROCKET (28.78 – 40.78 с), светлый фон.
// r1 — орбита сверху под углом: Земля и низкая орбита со спутником; «7,9 км/с»; на «вдвое» Земля и орбита
//      вырастают вдвое (пунктир прежней орбиты тает внутри), спутник бежит по большой орбите с тем же периодом
//      (v = √(gR): вдвое длиннее путь за то же время) → «≈ 15,8 км/с»;
// r2 — две ракеты из примитивов: «сейчас» и «Земля ×2»; полезная нагрузка та же, а топливный бак второй
//      разрастается в высоту и ширину, камера отъезжает; «Топливо / во много раз больше» → «Почти невозможно».
import { defineScene, makeStage, project, atext, P, Wd, E, THREE, MAT, shadowsOn, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, TAU, bump, makeEarth, makeShell, frame, keys, ring, trail, onRing, collectMats, setLit, roundedBoxGeo } from './kit.mjs';

const RE0 = .62, A0 = .95, PER = 3.6;                    // радиус Земли и орбиты «сейчас», период спутника (условно)
function TT() {
  return {
    chto: Wd('r1', 'Чтобы'), orb: Wd('r1', 'орбиту'), rak: Wd('r1', 'ракете'), vd: Wd('r1', 'вдвое'), sk: Wd('r1', 'скорость'),
    pch: Wd('r1', 'почти'), shes: Wd('r1', 'шестнадцать'),
    top: Wd('r2', 'Топлива'), star: Wd('r2', 'старте'), mn: Wd('r2', 'много'), bol: Wd('r2', 'больше'), pol: Wd('r2', 'полёт'),
    pch2: Wd('r2', 'почти'), nev: Wd('r2', 'невозможным'),
    cut: (E('r1') + Wd('r2', 'Топлива')) / 2,
  };
}
const growE = (t, T) => eSpring(clamp((t - T.vd + .05) / 1.4));          // Земля и орбита ×2
const tankP = (t, T) => P(t, T.mn - .25, 1.9, eInOut);                    // бак разрастается

// Ракета из примитивов: сопло, бак (масштабируется), переходник, вторая ступень и обтекатель (одинаковые у обеих)
function makeRocket() {
  const g = new THREE.Group(), white = MAT.ceramicWhite(), gr = MAT.graphite(), alu = MAT.aluminium();
  const low = new THREE.Group();                                           // сопло и стабилизаторы — расширяются вместе с баком
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(.11, .17, .16, 32, 1, true), gr); nozzle.position.y = .08;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .03, 40), gr); plate.position.y = .17;
  low.add(nozzle, plate);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(roundedBoxGeo(.025, .34, .2, .01), gr), a = i * TAU / 4 + TAU / 8;
    f.position.set(Math.cos(a) * .25, .3, Math.sin(a) * .25); f.rotation.y = -a; low.add(f);
  }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 1, 48), alu);  // высота 1 → scale.y
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.205, .205, .03, 48), gr);
  const up = new THREE.Group();
  const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .34, 48), white); stage2.position.y = .17;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.16, .42, 48), white); nose.position.y = .34 + .21;
  up.add(stage2, nose);
  g.add(low, tank, band, up);
  shadowsOn(g);
  return { g, low, tank, band, up };
}
function setRocket(r, h, k) {                             // h — высота бака, k — ширина бака
  r.low.scale.set(k, 1, k);
  r.tank.scale.set(k, h, k); r.tank.position.y = .185 + h / 2;
  r.band.scale.set(k, 1, k); r.band.position.y = .185 + h;
  r.up.position.y = .185 + h + .015;
}
const rocketTop = h => .185 + h + .015 + .76;

defineScene('rocket', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .45 });
    const T = TT();
    // --- A: Земля, орбита, спутник ---
    const gA = new THREE.Group(), earth = makeEarth(RE0), atm = makeShell(RE0 * 1.02, { base: 0, rim: .35, pow: 3.5, color: '#86868B' });
    const sat = new THREE.Mesh(new THREE.SphereGeometry(.045, 24, 16), MAT.ceramicBlack());
    gA.add(earth, atm, sat);
    // --- B: две ракеты ---
    const gB = new THREE.Group(), r0 = makeRocket(), r1 = makeRocket();
    r0.g.position.set(-.85, 0, 0); r1.g.position.set(.75, 0, 0);
    gB.add(r0.g, r1.g);
    stage.root.add(gA, gB);
    return { stage, T, gA, earth, atm, sat, gB, r0, r1, mA: collectMats(gA), mB: collectMats(gB) };
  },

  update(t, s, st) {
    const { stage, T, gA, earth, atm, sat, gB, r0, r1 } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cut ? 1 : 2;
    gA.visible = ph === 1; gB.visible = ph === 2;
    L.key.intensity = 2.2; L.hemi.intensity = 1.1; L.rimL.intensity = 1.0; L.rimR.intensity = .8;
    if (ph === 1) {
      setLit(st.mA, P(t, s.start + .05, .7) * (1 - P(t, T.cut - .4, .35, eIn)));
      stage.floor.visible = false; L.key.castShadow = false; L.key.position.set(-4, 8, 7);
      const k = lerp(1, 2, growE(t, T));
      earth.scale.setScalar(k); atm.scale.setScalar(k);
      earth.rotation.set(0, (t - s.start) * .3, .41);
      atm.material.uniforms.uOp.value = P(t, s.start + .2, .8);
      sat.position.set(...onRing(A0 * k, satAng(t, T)));
      sat.visible = t > T.chto - .1;
      sat.scale.setScalar(Math.max(1e-3, P(t, T.chto - .1, .5)));
      const kk = clamp((t - s.start) / (T.cut - s.start));
      const [d] = keys([[s.start, 13.5], [T.vd - .1, 13.5], [T.vd + 1.5, 19], [T.cut, 18.6]], t, eInOut);
      frame(cam, [0, 0, 0], d, lerp(-8, 8, kk), 42, 540, 1000);
    } else {
      setLit(st.mB, P(t, T.cut, .6));
      stage.floor.visible = true; stage.floor.position.y = 0; L.key.castShadow = true; L.key.position.set(3, 9, 6);
      setRocket(r0, .9, 1);
      const p = tankP(t, T);
      setRocket(r1, lerp(.9, 2.85, p), lerp(1, 1.75, p));
      const kk = clamp((t - T.cut) / (s.end - T.cut));
      const top = rocketTop(lerp(.9, 2.85, p));
      // подошва ракет всегда на y ≈ 1200 (подписи над зоной субтитров), камера отъезжает вслед за ростом бака
      const d = lerp(10.5, 22, P(t, T.mn - .3, 2.0, eInOut)) - .3 * kk, ppu = 1920 / (2 * d * Math.tan(13 * Math.PI / 180));
      frame(cam, [0, top * .5, 0], d, lerp(-10, 6, kk), 8, 540, 1200 - top * .5 * ppu);
    }
  },

  draw2d(t, s, st) {
    const { stage, T, earth, sat, r0, r1 } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    if (t < T.cut) {
      const fade = 1 - P(t, T.cut - .4, .35, eIn);
      const k = earth.scale.x, occ = [{ p: [0, 0, 0], r: RE0 * k }];
      // орбита «сейчас» — пунктиром остаётся на месте, новая — сплошная
      ring(cam, A0, { col: ink, a: .55 * P(t, s.start + .3, .8) * (1 - P(t, T.vd - .1, .4, eIn)) * fade, lw: 2, dash: [7, 9], occ, to: TAU * P(t, s.start + .2, 1.2, eInOut) });
      if (k > 1.01) ring(cam, A0 * k, { col: ink, a: .6 * P(t, T.vd, .5) * fade, lw: 2.5, occ });
      if (sat.visible) trail(cam, A0 * k, satAng(t, T), 1.4, { col: ink, a: .85 * P(t, T.chto, .6) * fade, lw: 4, occ });
      // скорости
      const oN = T.shes - .15;
      atext('7,9 км/с', 540, 400, T.orb - .05, t, { size: 180, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oN, outDur: .3 });
      atext('скорость орбиты сейчас', 540, 470, T.orb + .25, t, { size: 46, w: 500, col: sub, track: -.005, out: oN, outDur: .3 });
      atext('≈ 15,8 км/с', 540, 400, T.shes - .05, t, { size: 180, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.cut - .4 });
      atext('вдвое быстрее', 540, 470, T.shes + .2, t, { size: 46, w: 500, col: sub, track: -.005, out: T.cut - .4 });
    } else {
      const p = tankP(t, T);
      // подписи под ракетами
      const [ax, ay] = project(cam, r0.g.position.x, 0, 0), [bx, by] = project(cam, r1.g.position.x, 0, 0);
      atext('сейчас', ax, ay + 44, T.cut + .4, t, { size: 38, w: 500, col: sub, track: 0, dy: 12 });
      atext('Земля ×2', bx, by + 44, T.cut + .55, t, { size: 38, w: 600, col: ink, track: 0, dy: 12 });
      const oT = T.pch2 - .2;
      atext('Топливо', 540, 330, T.top - .05, t, { size: 110, w: 600, col: ink, track: -.03, out: oT });
      atext('во много раз больше', 540, 400, T.mn - .05, t, { size: 50, w: 500, col: sub, track: -.005, out: oT });
      atext('Почти невозможно', 540, 340, T.pch2 - .05, t, { size: 110, w: 600, col: ink, track: -.03, blur: 16 });
      atext('выйти в космос', 540, 410, T.nev + .1, t, { size: 50, w: 500, col: sub, track: -.005 });
      // выноска на бак
      const [tx, ty] = project(cam, r1.g.position.x + .2 * lerp(1, 1.75, p), .185 + lerp(.9, 2.85, p) * .5, 0);
      const ca = P(t, T.star + .1, .5) * (1 - P(t, oT, .3, eIn));
      if (ca > .003) {
        g.save(); g.globalAlpha = ca; g.strokeStyle = ink; g.lineWidth = 2;
        g.beginPath(); g.arc(tx + 8, ty, 5, 0, TAU); g.fillStyle = ink; g.fill();
        g.beginPath(); g.moveTo(tx + 8, ty); g.lineTo(tx + 90, ty); g.stroke(); g.restore();
        atext('бак', tx + 104, ty + 12, T.star + .2, t, { size: 38, w: 600, col: ink, align: 'left', track: 0, dy: 10, out: oT });
      }
    }
    const dip = bump(t, T.cut, .22);
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = stage.bgc; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .2, .8);
    add(T.orb, 'tick', .14, .9);
    add(T.vd - .1, 'whoosh', .28, .7);
    add(T.vd + 1.1, 'thud', .2, .7);
    add(T.shes, 'chime', .26, 1);
    add(T.cut, 'whoosh', .2, .8);
    add(T.top, 'thud', .24, .7);
    add(T.mn - .25, 'rise', .22, .7);
    add(T.bol + .9, 'thud', .3, .6);
    add(T.pch2, 'bloom', .22, .75);
  },
});
// угол спутника: постоянная угловая скорость (у Земли той же плотности период низкой орбиты тот же)
function satAng(t, T) { return 1.2 + TAU * (t - T.chto) / PER; }
