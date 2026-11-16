import { defineScene, atext, atextWords, lerp, P, Wd, eInOut } from '../../../engine.mjs';
import { frame, pill } from '../../g1/scenes/kit.mjs';
import { placeTanker } from '../hormuz.mjs';
import { shippingStage } from './common.mjs';

defineScene('outro', {
  setup() {
    return {
      ...shippingStage('black'), bypass: Wd('o1', 'обход'), card: Wd('o2', 'подпишись'),
      press: Wd('o2', 'торговля'),
    };
  },
  update(t, s, { stage, path, ship, curve, card }) {
    const q = P(t, s.start, s.end - s.start, eInOut);
    const final = P(t, card - .15, 1.2, eInOut);
    placeTanker(ship, curve, lerp(.39, .87, q));
    path.material.opacity = .75 * (1 - .36 * final);
    frame(stage.camera, [.22, .18, -.06], lerp(16, 20.3, final), lerp(2, -6, q), 54, 540, lerp(958, 843, final));
  },
  draw2d(t, s, { stage, bypass, card, press }) {
    atextWords('Обход заменит', 540, 346, bypass - .18, t, { size: 88, col: stage.ink, out: card - .32 });
    atext('только часть потока', 540, 453, bypass + .30, t, { size: 71, col: stage.ink, out: card - .32 });
    atextWords('Ормузский пролив', 540, 377, card + .06, t, { size: 93, col: stage.ink });
    atext('Узкое место нефтяной торговли', 540, 485, card + .38, t, { size: 51, w: 500, col: stage.sub });
    pill(t, card + .61, press);
  },
  sfx(add) {
    const bypass = Wd('o1', 'обход'), card = Wd('o2', 'подпишись'), press = Wd('o2', 'торговля');
    add(bypass, 'tick', .18, .9);
    add(card + .1, 'thud', .22, .8);
    add(press, 'click', .45, .9);
  },
});
