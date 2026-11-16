import { atext, defineScene, eInOut, lerp, makeStage, P, Wd } from '../../../engine.mjs';
import { camAz, camLights, drawArc, frame, globeArcPts, llDir, makeGlobe, PLACES, projPts, spot } from '../../g1/scenes/kit.mjs';

const radius = 1;
const hormuz = [26.56, 56.25];
const destinations = [
  ['Китай', 'китай', PLACES.chn, 205],
  ['Индия', 'индия', [21, 79], 407],
  ['Япония', 'япония', PLACES.jpn, 610],
  ['Южная Корея', 'корея', PLACES.kor, 826],
];

defineScene('destinations', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    stage.root.add(makeGlobe(radius));
    const routes = destinations.map(([name, word, destination, x]) => ({
      name, x, time: Wd('d2', word), points: globeArcPts(radius, hormuz, destination),
    }));
    const origin = llDir(...hormuz).multiplyScalar(1.005 * radius).toArray();
    return { stage, routes, origin, asia: Wd('d1', 'азию') };
  },
  update(t, s, { stage }) {
    const p = P(t, s.start, s.end - s.start, eInOut);
    const az = camAz(lerp(86, 98, p));
    frame(stage.camera, [0, 0, 0], lerp(10.1, 9.4, p), az, lerp(25, 30, p), 540, 853);
    camLights(stage.lights, az, 1, { hemi: .28 });
  },
  draw2d(t, s, { stage, routes, origin, asia }) {
    const { camera, ink, sub } = stage;
    atext('Основной поток', 540, 352, s.start + .16, t, { size: 87, col: ink });
    atext('в Азию', 540, 454, asia - .16, t, { size: 102, col: ink });
    const [anchor] = projPts(camera, [origin], radius);
    if (anchor.vis) spot(anchor.x, anchor.y, 6, ink, P(t, asia - .3, .48));
    for (const { name, x, time, points } of routes) {
      drawArc(projPts(camera, points, radius), t, {
        p: P(t, time - .12, .64, eInOut), col: ink, a: .79, lw: 3, glowK: .24,
      });
      atext(name, x, 1218, time - .05, t, { size: 39, col: ink });
    }
    atext('Сырая нефть и конденсат · I полугодие 2025', 540, 1280, asia, t, {
      size: 33, w: 500, col: sub,
    });
  },
  sfx(add) {
    add(Wd('d1', 'азию') - .12, 'swell', .21, .8);
    destinations.forEach(([, word], i) => add(Wd('d2', word), 'tick', .12, .86 + i * .07));
  },
});
