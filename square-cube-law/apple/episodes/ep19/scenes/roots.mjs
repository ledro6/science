import { THREE, MAT, C, Wd, P, clamp, lerp, eInOut, makeStage, defineScene, atext, line, project, roundedBox } from '../../../engine.mjs';
import { frame } from '../../ep18/scenes/kit.mjs';
import { makeCicada } from '../cicada.mjs';

function rootTube(points, width, material) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 18, width, 8), material);
}
const tunnel = [
  new THREE.Vector3(-.69, .60, .80), new THREE.Vector3(-.32, .77, .81),
  new THREE.Vector3(.09, 1.09, .79), new THREE.Vector3(.25, 1.37, .77),
  new THREE.Vector3(.31, 1.74, .60),
];
const passage = new THREE.CatmullRomCurve3(tunnel);
defineScene('roots', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .38 });
    const section = new THREE.Group();
    const block = new THREE.Mesh(roundedBox(1, .035), MAT.graphite());
    block.scale.set(2.42, 1.44, 1.37);
    block.position.y = .72;
    block.castShadow = block.receiveShadow = true;
    section.add(block);
    const top = new THREE.Mesh(roundedBox(1, .03), MAT.ceramicWhite());
    top.scale.set(2.44, .135, 1.39);
    top.position.y = 1.448;
    top.castShadow = true;
    section.add(top);
    const bark = MAT.aluminium();
    const rootTip = [
      [[-.44, 1.77, .61], [-.40, 1.39, .71], [-.43, 1.18, .745], [-.78, .93, .744], [-.92, .61, .743]],
      [[-.40, 1.32, .735], [-.22, 1.15, .745], [.03, .99, .746], [.35, .82, .744], [.63, .82, .741]],
      [[-.72, .97, .742], [-.92, .99, .747], [-1.10, .90, .745]],
      [[.01, 1.01, .744], [.17, .77, .747], [.09, .56, .742]],
      [[.27, .86, .745], [.51, .66, .746], [.74, .53, .745]],
      [[-.79, .78, .745], [-.58, .66, .749], [-.61, .41, .746]],
    ];
    rootTip.forEach((points, i) => section.add(rootTube(points, i === 0 ? .062 : i === 1 ? .044 : .023, bark)));
    const tunnelTube = rootTube(tunnel.slice(0, 4).map(p => [p.x, p.y, .719]), .070, MAT.ceramicBlack());
    section.add(tunnelTube);
    const { insect: nymph } = makeCicada(THREE, MAT, true);
    nymph.scale.setScalar(.175);
    section.add(nymph);
    const adults = [-.61, .04, .62].map((x, i) => {
      const { insect, spread } = makeCicada(THREE, MAT);
      insect.scale.setScalar(.20);
      insect.position.set(x, 1.54, -.31 + i * .11);
      insect.rotation.y = (i - 1) * .6;
      section.add(insect);
      return { insect, spread };
    });
    stage.root.add(section);
    return { stage, nymph, adults };
  },
  update(t, s, { stage, nymph, adults }) {
    const cue = Wd('r2', 'выходит');
    const p = P(t, cue - .15, 1.35, eInOut);
    const point = passage.getPoint(p), tangent = passage.getTangent(p);
    nymph.position.copy(point);
    nymph.rotation.set(-.4 - .84 * p, 0, Math.atan2(tangent.y, tangent.x) - Math.PI / 2);
    nymph.scale.setScalar(lerp(.175, .145, p));
    for (let i = 0; i < adults.length; i++) {
      const { insect, spread } = adults[i];
      const rise = P(t, cue + .55 + i * .14, .72);
      insect.visible = rise > .002;
      insect.position.y = 1.49 + rise * (.21 + i * .06);
      spread(lerp(.05, .38, rise));
    }
    const dolly = P(t, s.start, 1.65, eInOut);
    frame(stage.camera, [0, .89, 0], lerp(11.7, 10.75, dolly), lerp(18, 12, dolly), 13, 520, 860);
  },
  draw2d(t, s, { stage: { ink, sub, camera } }) {
    const emerge = Wd('r2', 'поверхность');
    atext('Личинки и корни', 540, 400, C('r1') - .02, t, { size: 91, col: ink, out: emerge - .44 });
    atext('Почти одновременно', 540, 401, Wd('r2', 'одновременно') - .12, t, { size: 81, col: ink, dur: .53 });
    const alpha = P(t, Wd('r1', 'корней') - .11, .43) * (1 - P(t, Wd('r2', 'выходит'), .33));
    const [x, y] = project(camera, -.46, .99, .75);
    const extent = 72 * alpha;
    line(x - extent, y + extent, x, y, sub, alpha * .82, 1.8);
  },
  sfx(add, s) {
    add(s.start + .13, 'swell', .2, .74);
    add(Wd('r1', 'корней'), 'tick', .12, .94);
    add(Wd('r2', 'выходит') - .16, 'whoosh', .17, .82);
    add(Wd('r2', 'одновременно'), 'chime', .17, .93);
  },
});
