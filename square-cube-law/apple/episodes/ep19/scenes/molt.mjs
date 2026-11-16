import { THREE, MAT, C, Wd, P, lerp, eIn, eInOut, makeStage, defineScene, atext } from '../../../engine.mjs';
import { rod } from '../../../models.mjs';
import { frame } from '../../ep18/scenes/kit.mjs';
import { makeCicada } from '../cicada.mjs';

const broodX = [.34, .56, .78];
const branchY = x => 1.14 + x * .42;

defineScene('molt', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .37 });
    const bark = MAT.graphite();
    const trunk = rod(bark, .17, 18);
    trunk.set([-.97, -.12, 0], [-.71, 2.04, 0]);
    const branch = rod(bark, .087, 14);
    branch.set([-.82, .77, 0], [1.08, branchY(1.08), 0]);
    const twig = rod(bark, .048, 12);
    twig.set([.28, branchY(.28), 0], [.52, 1.88, -.03]);
    const shell = makeCicada(THREE, MAT, true).insect;
    shell.position.set(-.69, 1.13, .22);
    shell.rotation.set(.53, .33, -.42);
    const adult = makeCicada(THREE, MAT);
    const eggGeometry = new THREE.SphereGeometry(1, 18, 12);
    const eggMaterial = MAT.ceramicWhite();
    const brood = broodX.map((x, i) => {
      const egg = new THREE.Mesh(eggGeometry, eggMaterial);
      egg.position.set(x, branchY(x) + .035, .077);
      egg.scale.set(.058, .029, .036);
      egg.rotation.z = .38;
      const nymph = makeCicada(THREE, MAT, true).insect;
      nymph.rotation.set(.18, i * .32, -.2 + i * .19);
      nymph.scale.setScalar(.082);
      stage.root.add(egg, nymph);
      return { x, egg, nymph };
    });
    stage.root.add(trunk, branch, twig, shell, adult.insect);
    return { stage, shell, adult, brood };
  },
  update(t, s, { stage, shell, adult, brood }) {
    const molt = P(t, Wd('m1', 'сбрасывает') - .13, 1.28, eInOut);
    const wings = P(t, Wd('m1', 'расправляются') - .16, .9, eInOut);
    const eggs = Wd('m2', 'яйца');
    const branchFocus = P(t, eggs - .8, 1.2, eInOut);
    shell.scale.setScalar(lerp(.39, .31, molt));
    shell.position.z = lerp(.31, .16, molt);
    adult.insect.visible = molt > .02;
    adult.insect.position.set(lerp(-.69, -.25, molt), lerp(1.13, 1.55, molt), lerp(.28, .56, molt));
    adult.insect.rotation.set(lerp(.53, .22, molt), lerp(.33, .9, molt), lerp(-.42, .06, molt));
    adult.insect.scale.setScalar(lerp(.31, .53, molt));
    adult.spread(lerp(.035, .89, wings));
    for (let i = 0; i < brood.length; i++) {
      const { x, egg, nymph } = brood[i];
      const lay = P(t, eggs - .18 + i * .12, .41);
      const hatch = P(t, Wd('m3', 'выходят') + i * .2, .36);
      const drop = P(t, Wd('m3', 'падают') + i * .1, .72, eIn);
      egg.visible = lay > .003 && hatch < .99;
      egg.scale.set(.058 * lay, .029 * lay, .036 * lay);
      nymph.visible = hatch > .003 && drop < .99;
      nymph.position.set(x + .07 * drop, lerp(branchY(x) + .04, .09, drop), .13);
      nymph.scale.setScalar(lerp(.045, .123, hatch));
    }
    const reveal = P(t, s.start + .13, 1.1);
    stage.lights.key.intensity = lerp(.6, 2.65, reveal);
    frame(stage.camera, [lerp(-.25, .42, branchFocus), lerp(1.22, .89, branchFocus), .08],
      lerp(9.85, 9.1, branchFocus), lerp(19, -11, branchFocus), 20, 523, 862);
  },
  draw2d(t, s, { stage: { ink, sub } }) {
    const grow = Wd('m1', 'расправляются');
    const egg = Wd('m2', 'яйца');
    const again = Wd('m3', 'цикл');
    atext('Линька', 540, 392, Wd('m1', 'сбрасывает') - .12, t, { size: 102, col: ink, out: grow - .43 });
    atext('Взрослая цикада', 540, 392, grow, t, { size: 90, col: ink, out: C('m2') - .43 });
    atext('Несколько недель', 540, 392, C('m2') - .04, t, { size: 88, col: ink, out: egg - .43 });
    atext('Яйца на ветках', 540, 392, egg, t, { size: 91, col: ink, out: C('m3') - .43 });
    atext('Личинки падают', 540, 392, Wd('m3', 'падают') - .13, t, { size: 90, col: ink });
    atext('цикл начинается снова', 540, 477, again, t, { size: 49, w: 500, col: sub });
  },
  sfx(add) {
    add(Wd('m1', 'сбрасывает') - .12, 'whoosh', .18, .87);
    add(Wd('m1', 'расправляются'), 'swell', .2, .93);
    add(Wd('m2', 'яйца'), 'tick', .17, .99);
    add(Wd('m3', 'падают'), 'whoosh', .18, .75);
    add(Wd('m3', 'цикл'), 'click', .13, .92);
  },
});
