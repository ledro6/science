import { THREE, MAT, Wd, P, lerp, eInOut, makeStage, defineScene, atext, line, project } from '../../../engine.mjs';
import { frame } from '../../ep18/scenes/kit.mjs';

defineScene('return', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .4 });
    const tokenGeometry = new THREE.CylinderGeometry(.40, .43, .085, 48);
    const past = new THREE.Mesh(tokenGeometry, MAT.aluminium());
    const next = new THREE.Mesh(tokenGeometry, MAT.graphite());
    const runner = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 16), MAT.aluminium());
    past.position.set(-.81, .04, 0);
    next.position.set(.81, .04, 0);
    past.castShadow = next.castShadow = runner.castShadow = true;
    stage.root.add(past, next, runner);
    return { stage, runner };
  },
  update(t, s, { stage, runner }) {
    const year = Wd('n1', 'две');
    const slide = P(t, year - .4, 1.37, eInOut);
    runner.position.set(lerp(-.81, .81, slide), .16, 0);
    frame(stage.camera, [0, .08, 0], lerp(12.0, 11.6, slide), lerp(-9, 9, slide), 38, 540, 932);
  },
  draw2d(t, s, { stage: { ink, sub, camera }, runner }) {
    const year = Wd('n1', 'две');
    const [x0, y0] = project(camera, -.81, .13, 0);
    const [x1, y1] = project(camera, .81, .13, 0);
    const [x, y] = project(camera, runner.position.x, .13, 0);
    const alpha = P(t, s.start + .3, .65);
    line(x0, y0, x1, y1, sub, .34 * alpha, 2);
    line(x0, y0, x, y, ink, .7 * alpha, 2);
    atext('Следующий общий выход', 540, 420, Wd('n1', 'следующий') - .14, t, { size: 76, col: ink });
    atext('2024', x0, y0 + 229, s.start + .45, t, { size: 71, w: 600, col: sub });
    atext('2245', x1, y1 + 241, year + .24, t, { size: 94, w: 700, col: ink, dur: .66 });
  },
  sfx(add, s) {
    add(s.start + .1, 'swell', .17, .79);
    add(Wd('n1', 'две') - .32, 'whoosh', .17, .83);
    add(Wd('n1', 'пятом'), 'chime', .2, .96);
  },
});
