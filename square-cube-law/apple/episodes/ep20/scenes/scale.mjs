import { defineScene, makeStage, THREE, MAT, atext, project, P, C, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, dashPath } from '../../ep18/scenes/kit.mjs';
import { makeBritain, westCoast } from './coast.mjs';

const detail = westCoast.slice(43, 60);
const [detailX, detailY] = detail[8];

defineScene('scale', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .64 });
    stage.root.add(makeBritain(THREE, MAT));
    return { stage, details: Wd('s0', 'изгибов'), finer: Wd('s0', 'поменьше'),
      step: Wd('s1', 'уменьшить'), reveal: Wd('s1', 'вдвое') };
  },
  update(t, s, { stage, details, reveal }) {
    const p = P(t, reveal - .36, .95, eInOut);
    const inspect = P(t, details - .2, 1.32, eInOut) * (1 - P(t, C('s1') - .36, 1.05, eInOut));
    frame(stage.camera, [lerp(-.08, detailX, inspect), .14, lerp(.1, -detailY, inspect)],
      lerp(lerp(24, 22.2, p), 15.8, inspect), lerp(7, -10, p), lerp(lerp(59, 69, p), 74, inspect), 530, 955);
  },
  draw2d(t, s, { stage, details, finer, step, reveal }) {
    const out = C('s1') - .38;
    atext('Изгибы внутри изгибов', 520, 405, details, t,
      { size: 78, col: stage.ink, out, outDur: .30 });
    const bay = detail.map(([x, y]) => project(stage.camera, x - .085, .265, -y));
    dashPath(bay, P(t, details - .06, .86), stage.ink, .78 * (1 - P(t, out, .55)), 4, [4, 8]);
    dashPath(bay, P(t, finer - .30, .76), stage.ink, .96 * (1 - P(t, out, .55)), 4, null);
    atext('Шаг в 10 раз меньше', 520, 405, step - .08, t, {
      size: 76, col: stage.ink, track: -.034, out: reveal - .36, outDur: .27,
    });
    atext('×1,8', 520, 471, reveal, t, {
      size: 190, col: stage.accent, scale0: 1.13, blur: 17, track: -.045, dy: 34, dur: .58,
    });
    atext('длина западного берега', 520, 553, reveal + .09, t, { size: 46, col: stage.sub, dur: .53 });
    const path = westCoast.map(([x, y]) => project(stage.camera, x - .085, .265, -y));
    dashPath(path, P(t, reveal - .09, .82), stage.ink, .90, 4, [2, 6]);
  },
  sfx(add) {
    const reveal = Wd('s1', 'вдвое');
    add(Wd('s0', 'изгибов'), 'swell', .16, .83);
    add(Wd('s0', 'поменьше'), 'tick', .17, 1.02);
    add(Wd('s1', 'уменьшить'), 'tick', .22, 1);
    add(reveal - 1.5, 'riser', .16, .91);
    add(reveal, 'impact', .28, .86);
    add(reveal + .06, 'chime', .22, 1.06);
  },
});
