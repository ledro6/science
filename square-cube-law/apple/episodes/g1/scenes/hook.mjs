// HOOK (0 – 11.64 с), чёрный фон.
// h1 — монохромный глобус (настоящие материки, Natural Earth) проявляется из темноты; на «торгуют» между соседями
//      прорастают толстые светящиеся дуги потоков (США–Канада–Мексика, Германия–Франция–Нидерланды–Польша),
//      на «богатыми» — тонкие дальние дуги через океан; подписи «соседи» / «далеко»;
// h2 — «закон тяготения»: две керамические «массы» выходят из темноты, стрелки притяжения навстречу;
// h3 — глобус возвращается под заголовок: «Новая рубрика» серым и «Геоэкономика» белым.
import { defineScene, makeStage, project, atext, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { llDir, makeGlobe, makeShell, collectMats, setLit, camLights, camAz, frame, keys, globeArcPts, projPts, drawArc, spot, arrow, wordsAt, glow, screenR, fit, PLACES as PL } from './kit.mjs';

function TT() {
  return {
    poch: Wd('h1', 'Почему'), torg: Wd('h1', 'торгуют'), sos: Wd('h1', 'соседями'), bog: Wd('h1', 'богатыми'),
    zak: Wd('h2', 'закон'), poh: Wd('h2', 'похожий'), vsem: Wd('h2', 'всемирного'), tyag: Wd('h2', 'тяготения'),
    eto: Wd('h3', 'Это'), nov: Wd('h3', 'новая'), geo: Wd('h3', 'геоэкономика'),
    cutB: Wd('h2', 'закон') - .25, cutC: (E('h2') + Wd('h3', 'Это')) / 2,
  };
}
// [откуда, куда, толщина, задержка прорисовки]
const NEAR = [['usa', 'can', 5.5, 0], ['usa', 'mex', 5, .12], ['ger', 'fra', 5, .22], ['ger', 'nld', 4.5, .3], ['ger', 'pol', 4.5, .38], ['fra', 'ita', 4, .46]];
const FAR = [['mex', 'ger', 1.4, 0], ['can', 'ita', 1.4, .14], ['usa', 'pol', 1.4, .26]];
const RG = 1, R1 = .52, R2 = .36;

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const gA = new THREE.Group();
    const globe = makeGlobe(RG), atm = makeShell(RG * 1.015, { base: 0, rim: .55, pow: 4 });
    gA.add(globe, atm);
    const gB = new THREE.Group();
    const m1 = new THREE.Mesh(new THREE.SphereGeometry(R1, 48, 34), MAT.ceramicWhite());
    const m2 = new THREE.Mesh(new THREE.SphereGeometry(R2, 48, 34), MAT.aluminium());
    gB.add(m1, m2);
    stage.root.add(gA, gB);
    const arcs = [...NEAR, ...FAR].map(([a, b]) => globeArcPts(RG, PL[a], PL[b]));
    return { stage, gA, globe, atm, gB, m1, m2, arcs, mA: collectMats(gA), mB: collectMats(gB), T: TT() };
  },

  update(t, s, st) {
    const { stage, gA, atm, gB, m1, m2, T } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cutB ? 1 : t < T.cutC ? 2 : 3;
    gA.visible = ph !== 2; gB.visible = ph === 2;
    if (ph === 1) {
      const lit = P(t, 0, 1.6) * (1 - P(t, T.cutB - .4, .35, eIn));
      setLit(st.mA, lit); atm.material.uniforms.uOp.value = lit;
      const lon = lerp(-36, -50, clamp(t / T.cutB)), az = camAz(lon);
      const [d, el] = keys([[0, 10.2, 30], [T.sos, 9.4, 28], [T.cutB, 8.9, 26]], t, eInOut);
      frame(cam, [0, 0, 0], d, az, el, 540, 900);
      camLights(L, az, 1);
    } else if (ph === 2) {
      // две «массы» — как у Ньютона: выходят из темноты и чуть сближаются на «тяготения»
      setLit(st.mB, P(t, T.cutB, .9));
      const pull = eSpring(clamp((t - T.tyag) / 1.1));
      m1.position.set(lerp(-1.0, -.88, pull), .05, 0); m2.position.set(lerp(1.06, .92, pull), -.05, 0);
      m1.rotation.y = m2.rotation.y = t * .2;
      const k = clamp((t - T.cutB) / (T.cutC - T.cutB));
      frame(cam, [0, 0, 0], lerp(12.5, 11.4, eInOut(k)), lerp(-8, 8, k), lerp(10, 6, k), 540, 900);
      camLights(L, lerp(-8, 8, k), 1, { key: 2.6, rim: 2.2, hemi: .2 });
    } else {
      const lit = P(t, T.cutC, .9);
      setLit(st.mA, lit); atm.material.uniforms.uOp.value = lit;
      const k = clamp((t - T.cutC) / (s.end - T.cutC));
      const lon = lerp(-40, -48, k), az = camAz(lon);
      frame(cam, [0, 0, 0], lerp(11.6, 10.8, eInOut(k)), az, 26, 540, 1000);
      camLights(L, az, 1);
    }
  },

  draw2d(t, s, st) {
    const { stage, arcs, m1, m2, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const ph = t < T.cutB ? 1 : t < T.cutC ? 2 : 3;
    if (ph !== 2) {
      // дуги торговых потоков
      const fade = ph === 1 ? 1 - P(t, T.cutB - .4, .35, eIn) : P(t, T.cutC + .2, .8);
      const t0n = ph === 1 ? T.torg - .1 : T.cutC + .15, t0f = ph === 1 ? T.bog - .1 : T.cutC + .5;
      const pin = projPts.bind(null, cam);
      [...NEAR, ...FAR].forEach(([a, b, lw, dl], i) => {
        const far = i >= NEAR.length, p = P(t, (far ? t0f : t0n) + dl, far ? 1.3 : 1.0, eInOut);
        const sp = pin(arcs[i], 1);
        drawArc(sp, t, { p, lw, a: fade * (far ? .75 : 1), glowK: far ? .4 : 1, pulses: far ? 0 : 3, speed: .3, phase: i * .17, back: true });
      });
      // точки-«центры» стран
      const used = new Set([...NEAR, ...FAR].flatMap(q => q.slice(0, 2)));
      for (const k of used) {
        const [pp] = projPts(cam, [llDir(...PL[k]).multiplyScalar(RG * 1.003).toArray()], RG);
        if (pp.vis) spot(pp.x, pp.y, 5, ink, fade * P(t, (ph === 1 ? T.torg - .2 : T.cutC), .6));
      }
      if (ph === 1) {
        // подписи: «соседи» у короткой дуги, «далеко» у дальней
        const oL = T.cutB - .45;
        const mid = (i, s0 = .5) => { const q = arcs[i][Math.round(s0 * (arcs[i].length - 1))]; return project(cam, ...q); };
        const [nx, ny] = mid(2), [fx, fy] = mid(NEAR.length, .5);
        atext('соседи', nx + 10, ny - 40, T.sos + .1, t, { size: 40, w: 500, col: ink, track: -.005, out: oL });
        atext('далеко', fx, fy - 60, T.bog + .5, t, { size: 40, w: 500, col: sub, track: -.005, out: oL });
      }
    }
    if (ph === 2) {
      // стрелки притяжения навстречу друг другу, подписи масс
      const aB = P(t, T.zak, .6) * (1 - P(t, T.cutC - .4, .35, eIn));
      const p1 = m1.position.toArray(), p2 = m2.position.toArray();
      const [x1, y1] = project(cam, ...p1), [x2, y2] = project(cam, ...p2);
      const r1 = screenR(cam, p1, R1), r2 = screenR(cam, p2, R2);
      glow(x1, y1, r1 * 2.6, .1 * aB); glow(x2, y2, r2 * 2.6, .08 * aB);
      const pa = P(t, T.tyag - .1, .6), gap = (x2 - r2) - (x1 + r1);
      const len = gap * lerp(.12, .4, eSpring(clamp((t - T.tyag) / .9)));
      arrow(x1 + r1 + 16, y1, x1 + r1 + 16 + len, lerp(y1, y2, .15), ink, aB * pa, 4, 16);
      arrow(x2 - r2 - 16, y2, x2 - r2 - 16 - len, lerp(y2, y1, .15), ink, aB * pa, 4, 16);
      const oB = T.cutC - .4;
      atext('m₁', x1, y1 + r1 + 70, T.zak + .2, t, { size: 46, w: 500, col: sub, track: 0, out: oB });
      atext('m₂', x2, y2 + r2 + 70, T.zak + .35, t, { size: 46, w: 500, col: sub, track: 0, out: oB });
      wordsAt(['Как', 'тяготение'], [T.poh - .05, T.vsem - .05], 540, 500, t, { size: 120, w: 600, col: ink, track: -.03, blur: 16, dur: .8, out: oB });
      atext('F ∝ m₁ · m₂ / r²', 540, 590, T.tyag + .1, t, { size: 48, w: 500, col: sub, track: -.005, out: oB });
    }
    // h3: новая рубрика
    atext('Новая рубрика', 540, 330, T.nov, t, { size: 48, w: 500, col: sub, track: -.005 });
    wordsAt(['Геоэкономика'], [T.geo - .05], 540, 480, t, { size: fit('Геоэкономика', 150, 880, 600, -.035), w: 600, col: ink, track: -.035, blur: 16, dur: .8 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.torg - .05, 'whoosh', .3, .8);
    add(T.sos, 'tick', .14);
    add(T.bog, 'shimmer', .14, .9);
    add(T.cutB + .05, 'thud', .26, .75);
    add(T.tyag, 'swell', .22, .9);
    add(T.cutC, 'whoosh', .28, .8);
    add(T.nov, 'swell', .2, .8);
    add(T.geo - .05, 'bloom', .3, .85);
    add(T.geo + .1, 'chime', .22, 1.05);
  },
});
