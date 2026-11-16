import { defineScene, makeStage, THREE, MAT, atext, project, P, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, dashPath } from '../../ep18/scenes/kit.mjs';
import { makeBritain, westCoast } from './coast.mjs';

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .48 });
    stage.root.add(makeBritain(THREE, MAT));
    return { stage, ruler: Wd('h1', 'линейкой') };
  },
  update(t, s, { stage }) {
    const p = P(t, s.start, s.end - s.start, eInOut);
    frame(stage.camera, [0, .16, 0], lerp(24, 21.5, p), lerp(-16, 6, p), lerp(52, 62, p), 520, 930);
  },
  draw2d(t, s, { stage, ruler }) {
    const title = { size: 79, col: stage.ink, track: -.039 };
    atext('Сколько километров', 520, 356, s.start + .03, t, title);
    atext('в береговой линии?', 520, 449, s.start + .15, t, title);
    atext('Великобритания', 520, 528, Wd('h1', 'Британии') - .08, t, { size: 47, col: stage.sub });
    const path = westCoast.map(([x, y]) => project(stage.camera, x - .08, .27, -y));
    dashPath(path, P(t, ruler - .23, .75), stage.ink, .68, 3.2, [2, 7]);
  },
  sfx(add, s) {
    add(s.start + .07, 'bloom', .24, .8);
    add(Wd('h1', 'Британии') - .08, 'swell', .14, .87);
    add(Wd('h1', 'линейкой'), 'tick', .21, 1.05);
  },
});
