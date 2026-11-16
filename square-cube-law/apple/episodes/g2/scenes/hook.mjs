import { defineScene, atextWords, atext, lerp, P, Wd, eInOut } from '../../../engine.mjs';
import { frame } from '../../g1/scenes/kit.mjs';
import { placeTanker } from '../hormuz.mjs';
import { shippingStage } from './common.mjs';

defineScene('hook', {
  setup() {
    return { ...shippingStage('black'), title: Wd('h1', 'почему'), strait: Wd('h1', 'пролив') };
  },
  update(t, s, { stage, path, ship, curve, title }) {
    const q = P(t, s.start, s.end - s.start, eInOut);
    placeTanker(ship, curve, lerp(.47, .69, q));
    path.material.opacity = P(t, title, .7) * .55;
    frame(stage.camera, [.52, .19, -.03], lerp(10, 12.2, q), lerp(-13, -5, q), 62, 540, 916);
  },
  draw2d(t, s, { stage, title, strait }) {
    atextWords('Один пролив', 540, 323, title - .20, t, { size: 107, col: stage.ink });
    atext('для потока нефти', 540, 430, title + .19, t, { size: 72, col: stage.ink });
    atext('Ормузский пролив', 540, 533, strait, t, { size: 43, w: 500, col: stage.sub });
  },
  sfx(add, s) {
    const strait = Wd('h1', 'пролив');
    add(s.start + .05, 'bloom', .26, .75);
    add(strait - .06, 'tick', .16, .92);
  },
});
