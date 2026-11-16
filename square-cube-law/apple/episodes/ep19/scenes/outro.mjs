import { THREE, MAT, C, Wd, P, lerp, eInOut, makeStage, defineScene, atext, atextWords } from '../../../engine.mjs';
import { frame, pill } from '../../ep18/scenes/kit.mjs';
import { makeCicada } from '../cicada.mjs';

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .45 });
    const { insect, spread } = makeCicada(THREE, MAT);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.10, 1.15, .14, 56), MAT.graphite());
    plinth.position.y = .071;
    plinth.receiveShadow = true;
    stage.root.add(plinth, insect);
    return { stage, insect, spread };
  },
  update(t, s, { stage, insect, spread }) {
    const reveal = P(t, s.start + .12, 1.15, eInOut);
    const card = P(t, Wd('o2', 'Подпишись') - .2, 1.12, eInOut);
    const { key, hemi, rimL, rimR } = stage.lights;
    key.position.set(lerp(-3, 3, reveal), 9, 4);
    key.intensity = lerp(.38, 2.2, reveal); hemi.intensity = .5;
    rimL.intensity = 2.65; rimR.intensity = 2.05;
    insect.position.y = .15;
    insect.rotation.y = lerp(-.19, .19, reveal) + .19 * card;
    spread(lerp(.14, .43, reveal));
    frame(stage.camera, [0, .37, -.17], lerp(10.3, 12.4, card), lerp(39, 20, reveal), 36, 540, lerp(979, 869, card));
  },
  draw2d(t, s, { stage: { ink, sub } }) {
    const card = Wd('o2', 'Подпишись');
    const press = Wd('o2', 'кубе');
    atext('13 × 17 = 221', 540, 417, C('o1') - .06, t, { size: 113, col: ink, out: card - .38 });
    atextWords('Периодические', 540, 358, card + .1, t, { size: 93, col: ink });
    atext('цикады', 540, 470, card + .28, t, { size: 112, col: ink });
    atext('Восток Северной Америки', 540, 551, card + .51, t, { size: 48, w: 500, col: sub });
    pill(t, card + .53, press);
  },
  sfx(add, s) {
    add(s.start + .14, 'swell', .2, .69);
    add(Wd('o2', 'Подпишись') + .1, 'thud', .22, .8);
    add(Wd('o2', 'кубе'), 'click', .45, .9);
  },
});
