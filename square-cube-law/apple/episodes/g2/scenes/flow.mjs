import { defineScene, atext, lerp, P, Wd, eInOut } from '../../../engine.mjs';
import { frame } from '../../g1/scenes/kit.mjs';
import { placeTanker } from '../hormuz.mjs';
import { shippingStage } from './common.mjs';

defineScene('flow', {
  setup() {
    return {
      ...shippingStage('black'),
      year: Wd('f1', 'первом'), count: Wd('f1', 'двадцати'), unit: Wd('f1', 'баррелей'),
    };
  },
  update(t, s, { stage, curve, ship, path, count }) {
    const q = P(t, s.start, s.end - s.start, eInOut);
    placeTanker(ship, curve, lerp(.43, .95, q));
    path.material.opacity = .31 + .54 * P(t, count - .3, .85);
    frame(stage.camera, [.56, .17, .05], lerp(13.5, 14.5, q), lerp(2, 8, q), 57, 540, 926);
  },
  draw2d(t, s, { stage, year, count, unit }) {
    atext('I полугодие 2025', 540, 317, year - .13, t, { size: 49, w: 500, col: stage.sub });
    atext('20,9 млн', 540, 535, count - .04, t, { size: 161, w: 600, col: stage.ink, scale0: 1.065, blur: 16 });
    atext('баррелей в сутки', 540, 631, unit, t, { size: 53, w: 500, col: stage.ink });
    atext('Нефть, конденсат и нефтепродукты', 540, 1223, unit + .23, t, { size: 38, w: 500, col: stage.sub });
  },
  sfx(add) {
    const count = Wd('f1', 'двадцати');
    add(count - .85, 'riser', .17);
    add(count, 'impact', .20, .82);
    add(count + .1, 'chime', .18, .84);
  },
});
