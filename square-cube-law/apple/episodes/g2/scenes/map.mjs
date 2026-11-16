import { defineScene, atext, callout, lerp, P, Wd, project, eInOut } from '../../../engine.mjs';
import { frame } from '../../g1/scenes/kit.mjs';
import { mapPoint, placeTanker } from '../hormuz.mjs';
import { shippingStage } from './common.mjs';

defineScene('map', {
  setup() {
    return {
      ...shippingStage('white'),
      iran: Wd('m1', 'Ираном'), oman: Wd('m1', 'Оманом'),
      gulf: Wd('m1', 'залив'), sea: Wd('m1', 'морем'),
    };
  },
  update(t, s, { stage, path, curve, ship, iran }) {
    const q = P(t, s.start, s.end - s.start, eInOut);
    frame(stage.camera, [lerp(.24, .07, q), .15, -.02], lerp(15.6, 18.2, q), lerp(-5, 2, q), 62, 540, 923);
    placeTanker(ship, curve, lerp(.38, .87, q));
    path.geometry.setDrawRange(0, Math.floor(P(t, iran - .25, 2.4) * 48) * 30);
  },
  draw2d(t, s, { stage, iran, oman, gulf, sea }) {
    const { camera, ink, sub } = stage;
    const [ix, iy] = project(camera, ...mapPoint(56.65, 27.35, .282));
    const [ox, oy] = project(camera, ...mapPoint(56.36, 26.28, .282));
    atext('Между двух берегов', 540, 345, iran - .48, t, { size: 82, col: ink });
    callout(ix, iy, ix + 28, iy - 74, iran, t, ink, .8);
    callout(ox, oy, ox + 67, oy + 75, oman, t, ink, .8);
    atext('Иран', ix + 38, iy - 93, iran + .10, t, { size: 41, col: ink, align: 'left' });
    atext('Оман', ox + 67, oy + 116, oman + .10, t, { size: 41, col: ink, align: 'left' });
    atext('Персидский залив', 247, 1175, gulf, t, { size: 39, w: 500, col: sub });
    atext('Оманский залив', 779, 1175, sea, t, { size: 39, w: 500, col: sub });
  },
  sfx(add) {
    const iran = Wd('m1', 'Ираном'), oman = Wd('m1', 'Оманом'), gulf = Wd('m1', 'залив');
    add(iran, 'tick', .17, .9);
    add(oman, 'tick', .16, 1.02);
    add(gulf, 'swell', .18, .82);
  },
});
