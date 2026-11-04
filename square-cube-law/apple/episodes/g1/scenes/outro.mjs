// OUTRO (53.19 – 63.15 с), чёрный фон.
// o1 — глобус на медленной орбите выходит из темноты (сначала контровой, потом ключ), между соседями — светящиеся
//      дуги потоков; крупно «Притягивают / большие и близкие», серым «границы отталкивают»;
// o2 — финальная карточка: «Гравитационная модель торговли» (по словам, белым), «T ∝ M₁ · M₂ / D» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «геоэкономики».
import { defineScene, makeStage, atext, atextWords, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { llDir, makeGlobe, makeShell, collectMats, setLit, camLights, camAz, frame, globeArcPts, projPts, drawArc, spot, pill, fit, PLACES as PL } from './kit.mjs';

function TT() {
  return {
    torg: Wd('o1', 'Торговлю'), prit: Wd('o1', 'притягивают'), bol: Wd('o1', 'большие'), bliz: Wd('o1', 'близкие'),
    gran: Wd('o1', 'границы'), ott: Wd('o1', 'отталкивают'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'геоэкономики'),
  };
}
const RG = 1;
const ARCS = [['usa', 'can', 6], ['usa', 'mex', 5.5], ['ger', 'fra', 5], ['ger', 'nld', 4.5], ['ger', 'pol', 4.5], ['fra', 'ita', 4]];

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const globe = makeGlobe(RG), atm = makeShell(RG * 1.015, { base: 0, rim: .6, pow: 3.6 });
    stage.root.add(globe, atm);
    const arcs = ARCS.map(([a, b]) => globeArcPts(RG, PL[a], PL[b]));
    return { stage, globe, atm, arcs, mats: collectMats(globe), T: TT() };
  },

  update(t, s, st) {
    const { stage, atm, T } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    setLit(st.mats, .3 + .7 * lk); atm.material.uniforms.uOp.value = lr;
    const lon = -54 - (t - s.start) * 1.4, az = camAz(lon);
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [0, 0, 0], lerp(12.2, 19, o2) - .05 * (t - s.start), az, lerp(30, 26, o2), 540, lerp(1000, 880, o2));
    camLights(L, az, 1);
    L.key.intensity = 3.0 * lk; L.rimL.intensity = 2.2 * lr; L.rimR.intensity = 1.5 * lr; L.hemi.intensity = .12 * lk;
  },

  draw2d(t, s, st) {
    const { stage, arcs, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const aA = P(t, s.start + .5, 1.0);
    ARCS.forEach(([a, b, lw], i) => drawArc(projPts(cam, arcs[i], RG), t, { p: P(t, s.start + .4 + i * .1, 1.1, eInOut), lw, a: aA, pulses: 3, speed: .3, phase: i * .21, back: true }));
    for (const k of new Set(ARCS.flatMap(q => q.slice(0, 2)))) {
      const [q] = projPts(cam, [llDir(...PL[k]).multiplyScalar(RG * 1.003).toArray()], RG);
      if (q.vis) spot(q.x, q.y, 5, ink, aA);
    }
    // o1: итоговая мысль
    const o1 = T.card - .35;
    atext('Притягивают', 540, 340, T.prit, t, { size: 112, w: 600, col: ink, track: -.03, out: o1 });
    const l2 = 'большие и близкие';
    atextWords(l2, 540, 460, T.bol - .05, t, { size: fit(l2, 104, 880, 600, -.03), w: 600, col: ink, track: -.03, stagger: .12, out: o1 });
    atext('границы отталкивают', 540, 560, T.gran, t, { size: 56, w: 500, col: sub, track: -.01, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Гравитационная', 540, 350, T.card + .05, t, { size: fit('Гравитационная', 112, 880, 600, -.035), w: 600, col: ink, track: -.035, stagger: .09 });
      atextWords('модель торговли', 540, 474, T.card + .2, t, { size: fit('модель торговли', 112, 880, 600, -.035), w: 600, col: ink, track: -.035, stagger: .09 });
      atext('T ∝ M₁ · M₂ / D', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.prit, 'tick', .16, .9);
    add(T.bliz, 'chime', .24, .95);
    add(T.gran, 'tick', .14, .8);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
