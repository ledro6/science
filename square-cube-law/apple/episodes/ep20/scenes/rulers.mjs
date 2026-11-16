import { defineScene, makeStage, THREE, MAT, atext, project, line, dot, P, Wd, lerp, clamp, eInOut } from '../../../engine.mjs';
import { frame } from '../../ep18/scenes/kit.mjs';
import { makeBay, rulerRoute } from './coast.mjs';

const longRoute = rulerRoute(.96);
const shortRoute = rulerRoute(.26);

function drawSteps(camera, route, progress, color, alpha, width, dashes) {
  const points = route.map(([x, y]) => project(camera, x, .18, -y));
  const end = progress * (points.length - 1);
  for (let i = 0; i < Math.ceil(end); i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const p = clamp(end - i);
    line(x1, y1, lerp(x1, x2, p), lerp(y1, y2, p), color, alpha, width, dashes);
    if (p === 1) dot(x2, y2, width * 1.08, color, alpha);
  }
}

defineScene('rulers', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .7 });
    stage.root.add(makeBay(THREE, MAT));
    return { stage, long: Wd('r1', 'Длинная'), short: Wd('r1', 'Короткая') };
  },
  update(t, s, { stage, short }) {
    const p = P(t, short - .2, 1.1, eInOut);
    frame(stage.camera, [0, .1, -.15], lerp(23.5, 21.1, p), lerp(-9, 0, p), lerp(55, 72, p), 515, 932);
  },
  draw2d(t, s, { stage, long, short }) {
    const fine = P(t, short, .76);
    const title = { size: 92, col: stage.ink, track: -.036 };
    atext('Длинный шаг', 520, 402, long, t, { ...title, out: short - .38, outDur: .28 });
    atext('Короткий шаг', 520, 402, short, t, title);
    atext('Схема бухты', 520, 490, long + .2, t, { size: 46, col: stage.sub });
    drawSteps(stage.camera, longRoute, P(t, long + .15, .96), stage.ink, lerp(.92, .23, fine), 5, [14, 8]);
    drawSteps(stage.camera, shortRoute, fine, stage.ink, .98, 5, null);
  },
  sfx(add) {
    add(Wd('r1', 'Длинная') + .2, 'tick', .25, .82);
    add(Wd('r1', 'бухты') - .14, 'thud', .13, .95);
    add(Wd('r1', 'Короткая') + .08, 'click', .29, 1.07);
    add(Wd('r1', 'изгибов') - .15, 'tick', .16, 1.13);
  },
});
