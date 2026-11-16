import { THREE, MAT, C, Wd, P, lerp, eInOut, makeStage, defineScene, atext } from '../../../engine.mjs';
import { frame } from '../../ep18/scenes/kit.mjs';
import { makeCicada } from '../cicada.mjs';

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .4 });
    const { insect, spread } = makeCicada(THREE, MAT);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.39, .19, 56), MAT.graphite());
    plinth.position.y = .096;
    plinth.receiveShadow = true;
    stage.root.add(plinth, insect);
    return { stage, insect, spread };
  },
  update(t, s, { stage, insect, spread }) {
    const first = P(t, s.start, 1.6, eInOut);
    const open = P(t, Wd('h1', 'тринадцать') - .2, 1.02, eInOut);
    const { key, hemi, rimL, rimR } = stage.lights;
    key.position.set(lerp(-3, 4, first), 8, 4);
    key.intensity = lerp(.45, 2.9, first);
    hemi.intensity = lerp(.38, .7, first);
    rimL.intensity = 2.7; rimR.intensity = 2.05;
    insect.position.y = .20;
    insect.rotation.y = lerp(-.33, .04, first);
    spread(lerp(.06, .51, open));
    frame(stage.camera, [0, .37, -.16], lerp(9.3, 10.85, open), lerp(49, 28, first), 43, 535, 975);
  },
  draw2d(t, s, { stage: { ink, sub } }) {
    const age = Wd('h1', 'тринадцать');
    atext('Годы под землёй', 540, 385, C('h1') - .18, t, { size: 91, col: ink, out: age - .46 });
    atext('13 или 17', 540, 409, age, t, { size: 137, col: ink, dur: .58, scale0: 1.10 });
    atext('лет под землёй', 540, 489, Wd('h1', 'семнадцать') - .18, t, { size: 54, w: 500, col: sub });
  },
  sfx(add, s) {
    add(s.start + .08, 'bloom', .25, .84);
    add(Wd('h1', 'тринадцать') - .08, 'thud', .22, .85);
    add(Wd('h1', 'семнадцать'), 'tick', .13, 1);
  },
});
