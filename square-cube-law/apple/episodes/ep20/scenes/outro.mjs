import { defineScene, makeStage, THREE, MAT, atext, atextWords, P, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, pill } from '../../ep18/scenes/kit.mjs';
import { makeBritain } from './coast.mjs';

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    stage.root.add(makeBritain(THREE, MAT));
    return { stage, card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
  },
  update(t, s, { stage, card }) {
    const p = P(t, card - .28, .96, eInOut);
    const q = P(t, s.start, s.end - s.start, eInOut);
    frame(stage.camera, [0, .18, 0], lerp(24, 36, p), lerp(14, -12, q), lerp(52, 62, q), 520, lerp(915, 867, p));
    stage.lights.key.intensity = lerp(2.4, 1.45, p);
  },
  draw2d(t, s, { stage, card, press }) {
    const out = card - .40;
    const title = { size: 86, col: stage.ink, track: -.032, out, outDur: .30 };
    const question = Wd('o1', 'Какую');
    atext('Длина зависит', 520, 360, Wd('o1', 'длина') - .05, t, { ...title, out: question - .31 });
    atext('от масштаба', 520, 459, Wd('o1', 'масштаба') - .05, t, { ...title, out: question - .31 });
    atext('Какую линейку', 520, 360, question, t, title);
    atext('выбрал бы ты?', 520, 459, Wd('o1', 'выбрал') - .08, t, title);
    atextWords('Парадокс', 520, 358, card + .02, t, { size: 96, col: stage.ink });
    atextWords('береговой линии', 520, 468, card + .14, t, { size: 87, col: stage.ink });
    pill(t, card + .58, press);
  },
  sfx(add, s) {
    add(s.start + .18, 'swell', .23, .67);
    add(Wd('o1', 'масштаба'), 'tick', .19, .92);
    add(Wd('o2', 'Подпишись') + .1, 'thud', .20, .82);
    add(Wd('o2', 'природы'), 'click', .43, .94);
  },
});
