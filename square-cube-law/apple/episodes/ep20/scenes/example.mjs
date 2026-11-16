import { defineScene, makeStage, THREE, MAT, atext, project, dot, P, C, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, dashPath } from '../../ep18/scenes/kit.mjs';
import { exampleBay, makeExampleBay } from './coast.mjs';

defineScene('example', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    stage.root.add(makeExampleBay(THREE, MAT));
    return { stage, width: Wd('x1', 'шесть'), sides: Wd('x1', 'пять'),
      across: Wd('x2', 'Линейка'), along: Wd('x2', 'вдоль'), total: Wd('x2', 'десять'),
      compare: Wd('x2', 'Разница') };
  },
  update(t, s, { stage, along }) {
    const p = P(t, along - .1, 1.2, eInOut);
    frame(stage.camera, [0, .14, -1.12], lerp(24.5, 22.3, p), lerp(-13, 2, p), lerp(65, 78, p), 520, 883);
  },
  draw2d(t, s, { stage, width, sides, across, along, total, compare }) {
    const [left, back, right] = exampleBay.map(([x, y]) => project(stage.camera, x, .215, -y));
    const chord = [left, right];
    const banks = [left, back, right];
    const a = P(t, across, .55), b = P(t, along, .55), c = P(t, compare, .55);
    const showWidth = 1 - .67 * b + .34 * c;
    const showSides = 1 - .72 * a * (1 - b);

    atext('Одна бухта', 520, 405, C('x1'), t, { size: 99, col: stage.ink });
    atext('Условный пример', 520, 485, width - .24, t, { size: 48, col: stage.sub });
    dashPath(chord, P(t, width - .12, .66), stage.ink, showWidth, 4.5, [13, 8]);
    dashPath(banks, P(t, sides - .12, .93), stage.ink, showSides, 5, null);

    for (const [x, y] of chord) dot(x, y, 5.2, stage.ink, P(t, width, .52));
    dot(...back, 5.2, stage.ink, showSides * P(t, sides + .22, .48));
    atext('6 м', (left[0] + right[0]) / 2, (left[1] + right[1]) / 2 - 22, width, t,
      { size: 58, col: stage.ink, a: showWidth, dy: 13, blur: 4 });
    for (const edge of [left, right]) {
      const dx = Math.sign(edge[0] - back[0]) * 55;
      atext('5 м', (back[0] + edge[0]) / 2 + dx, (back[1] + edge[1]) / 2,
        sides, t, { size: 50, col: stage.ink, a: showSides, dy: 13, blur: 4 });
    }
    atext('5 м + 5 м = 10 м', 520, 1260, total, t, { size: 68, col: stage.ink });
  },
  sfx(add, s) {
    add(s.start + .12, 'swell', .17, .74);
    add(Wd('x1', 'шесть'), 'tick', .22, .93);
    add(Wd('x1', 'пять'), 'tick', .20, 1.08);
    add(Wd('x2', 'вдоль'), 'click', .23, .91);
    add(Wd('x2', 'десять'), 'chime', .18, 1.02);
  },
});
