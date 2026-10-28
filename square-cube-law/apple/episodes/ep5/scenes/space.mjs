// SPACE (21.7 – 31.5 с), чёрный фон.
// s1 — Солнце, Земля и Марс на одной линии (Марс в 1,52 раза дальше); экранная яркость каждого шара ∝ 1/r²:
//      Земля 100%, Марс 43%; выноски с процентами;
// s2 — камера летит вдоль линии в 30 раз дальше, к Нептуну; Солнце — крошечная звезда за ним, сам Нептун почти тёмный
//      (1/900 света), виден лишь тонким серпом и контуром; «×30» → красная «1/900» «света Земли».
import {
  defineScene, makeStage, project, atext, line, dot, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, rng,
} from '../../../engine.mjs';
import { ctx, makeBall, glow, screenR, bump } from './kit.mjs';

const U = 1.5;                       // 1 а.е. в сцене
const SUN_R = .42;
// [имя, расстояние в а.е., радиус шара (условно)]
const PL = [['Земля', 1, .2], ['Марс', 1.524, .15], ['Нептун', 30, .3]];
const GAMMA = 2.2;                    // экранная яркость ∝ 1/r²: линейное альбедо = (1/r²)^2.2

function TT() {
  return {
    po: Wd('s1', 'Поэтому'), mars: Wd('s1', 'Марсе'), sol: Wd('s1', 'солнечного'), men: Wd('s1', 'меньше'), pol: Wd('s1', 'половины'), zem: Wd('s1', 'земного'),
    nep: Wd('s2', 'Нептуне'), x30: Wd('s2', 'тридцать'), dal: Wd('s2', 'дальше'), d900: Wd('s2', 'девятьсот'), men2: Wd('s2', 'меньше'),
    tam: Wd('s2', 'Там'), sum: Wd('s2', 'сумерки'), end2: E('s2'),
  };
}
// полосатая монохромная текстура Нептуна (как в ep4, своя копия)
function bandTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d'), R = rng(46);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#c4c7cc'); grd.addColorStop(.5, '#e6e8ec'); grd.addColorStop(1, '#c2c5ca');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 22; i++) { const y = R() * 256, h = 3 + R() * 16, v = Math.round(170 + R() * 60); g.globalAlpha = .15 + R() * .2; g.fillStyle = `rgb(${v},${v + 2},${v + 5})`; g.fillRect(0, y, 512, h); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}
// камера: обзор Солнце-Земля-Марс сбоку → к Нептуну, Солнце позади него
const CA = { pos: [1.05, .9, 13.6], tgt: [1.15, .05, 0] };
const nx = PL[2][1] * U;
const CB = { pos: [nx + 5.2, .3, .46], tgt: [nx - .7, -.06, 0] };

defineScene('space', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    stage.camera.far = 600; stage.camera.updateProjectionMatrix();
    const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 48, 32), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }));
    const pl = new THREE.PointLight('#ffffff', 3.3, 0, 0);   // без затухания: 1/r² задаём явно, яркостью материала
    const tex = bandTex();
    const balls = PL.map(([, a, r], i) => {
      const m = new THREE.MeshStandardMaterial({ color: '#F2F2F0', roughness: .7, map: i === 2 ? tex : null });
      m.toneMapped = false;
      // Нептун: 1/900 в линейном свете (в гамма-коррекции он был бы абсолютно чёрным) — «почти тёмный»
      const f = i === 2 ? 1 / (a * a) : Math.pow(1 / (a * a), GAMMA);
      m.color.multiplyScalar(f);
      const b = makeBall(r, m, 48); b.position.set(a * U, 0, 0);
      if (i === 2) b.rotation.z = .5;
      return b;
    });
    // звёздная пыль — едва заметная глубина в полёте
    const R = rng(9), N = 260;
    const sm = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .35 });
    const stars = new THREE.InstancedMesh(new THREE.SphereGeometry(.03, 6, 4), sm, N);
    const M = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const x = -20 + R() * 75, y = (R() - .5) * 26, z = -6 - R() * 30;
      M.makeTranslation(x, y, z); M.scale(new THREE.Vector3().setScalar(.5 + R() * 1.2)); stars.setMatrixAt(i, M);
    }
    stage.root.add(sun, pl, ...balls, stars);
    return { stage, sun, pl, balls, stars, sm, T: TT() };
  },

  update(t, s, st) {
    const { stage, balls, T } = st, cam = stage.camera, L = stage.lights;
    L.key.intensity = 0; L.key.castShadow = false; L.hemi.intensity = 0;
    // тонкий контровой — только чтобы тёмный Нептун читался контуром
    L.rimL.intensity = 0; L.rimR.intensity = .0;
    const lit = P(t, s.start, 1.0, eApple);
    st.pl.intensity = 3.3 * lit;
    balls.forEach((b, i) => { b.rotation.y = t * .2 + i; b.scale.setScalar(Math.max(1e-3, P(t, s.start + .15 + i * .15, .9, eApple))); });
    // в полёте Земля и Марс уходят за спину камеры; у Нептуна они не должны заслонять далёкое Солнце
    const fl = P(t, T.nep - .2, 2.1, eInOut);
    balls[0].visible = balls[1].visible = fl < .6;
    // полёт к Нептуну
    const f = P(t, T.nep - .2, 2.1, eInOut);
    const pos = CA.pos.map((v, i) => lerp(v, CB.pos[i], f)), tgt = CA.tgt.map((v, i) => lerp(v, CB.tgt[i], f));
    const drift = (t - s.start) * .03;
    const orb = P(t, T.tam - .4, 2.2, eInOut);
    cam.position.set(pos[0] + drift * (1 - f) - orb * .3, pos[1] - orb * .08, pos[2] + orb * .25);
    cam.lookAt(tgt[0], tgt[1], tgt[2]); cam.updateMatrixWorld();
    st.sm.opacity = .35 * lit;
  },

  draw2d(t, s, st) {
    const { stage, balls, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const f = P(t, T.nep - .2, 2.1, eInOut);
    // ореол Солнца: большой в s1, крошечная звезда в s2
    const [sx, sy] = project(cam, 0, 0, 0);
    const sR = screenR(cam, [0, 0, 0], SUN_R);
    if (cam.position.x > -1) glow(sx, sy, clamp(sR * 6, 40, 300), .6 * P(t, s.start, 1.2));
    // s1: выноски Земли и Марса
    const outA = T.nep - .25;
    const lab = (i, pct, t0, big) => {
      const b = balls[i], r = PL[i][2];
      const [ax, ay] = project(cam, b.position.x, r + .04, 0);
      const by = ay - (big ? 230 : 150);
      const a = 1 - P(t, outA, .35, eIn);
      if (t < t0 || a <= .003) return;
      const pd = P(t, t0, .25, eApple), pl = P(t, t0 + .1, .4, eApple);
      dot(ax, ay, 4 * pd, ink, a * pd);
      line(ax, ay, ax, lerp(ay, by + 14, pl), ink, .6 * a, 2);
      atext(pct, ax, by, t0 + .2, t, { size: big ? 120 : 64, w: 700, col: ink, a, track: -.035, dy: 18, dur: .7 });
      const [nx2, ny2] = project(cam, b.position.x, -r - .04, 0);
      atext(PL[i][0], nx2, ny2 + 56, t0 + .1, t, { size: 38, w: 500, col: sub, a, track: 0, dy: 12, dur: .6 });
    };
    lab(0, '100%', T.sol - .1, false);
    lab(1, '43%', T.men, false);
    atext('43%', 540, 520, T.pol, t, { size: 280, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: outA });
    atext('света Земли на Марсе', 540, 600, T.zem - .1, t, { size: 46, w: 500, col: sub, track: -.005, out: outA });
    // s2: Нептун — «×30», затем красная «1/900»
    atext('×30', 540, 560, T.x30, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.d900 - .1, outDur: .3 });
    atext('дальше от Солнца', 540, 640, T.dal - .05, t, { size: 46, w: 500, col: sub, track: -.005, out: T.d900 - .1, outDur: .3 });
    atext('1/900', 540, 560, T.d900, t, { size: 280, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('света Земли', 540, 640, T.d900 + .25, t, { size: 46, w: 500, col: sub, track: -.005 });
    // подпись «Нептун» у шара
    const nb = balls[2];
    const [px, py] = project(cam, nb.position.x, -PL[2][2] - .05, 0);
    if (f > .9) atext('Нептун', px, py + 70, T.dal, t, { size: 40, w: 500, col: sub, track: 0, dy: 12 });
    // тонкий контур тёмного Нептуна (2D, мягко), чтобы шар читался в «сумерках»
    const [cx, cy] = project(cam, nb.position.x, 0, 0);
    const cr = screenR(cam, nb.position.toArray(), PL[2][2]);
    const ca = .3 * P(t, T.dal, 1.0);
    if (ca > .003 && f > .5) { g.save(); g.globalAlpha = ca; g.strokeStyle = '#FFFFFF'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, cr, 0, Math.PI * 2); g.stroke(); g.restore(); }
  },

  sfx(add) {
    const T = TT();
    add(T.po - .1, 'bloom', .3, .8);
    add(T.sol - .1, 'tick', .2);
    add(T.men, 'chime', .25, .9);
    add(T.nep - .2, 'whoosh', .4, .6);
    add(T.x30, 'thud', .3, .8);
    add(T.d900 - 1.5, 'riser', .22);
    add(T.d900, 'impact', .38, .85);
    add(T.tam, 'swell', .22, .6);
  },
});
