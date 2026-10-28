// Герой обложек ep9: керамический шар, покрытый графитовыми волосками, причёсанный «без проборов» —
// и всё равно с одной макушкой-вихром (повёрнута к камере, в ней крошечная красная бусина). Без пола.
import { hairyBall, scl3, norm3 } from './scenes/_hair.mjs';

export default function (THREE, { MAT }) {
  const object = new THREE.Group();
  const hairMat = new THREE.MeshStandardMaterial({ color: '#4A4A4E', roughness: .5, metalness: .1 });
  const pole = norm3([.38, .5, .78]);
  const { grp } = hairyBall(THREE, { R: 1, n: 3400, len: .2, ballMat: MAT.ceramicWhite(), hairMat, pole, hint: [1, 0, 0], swirl: 1.25, seed: 9 });
  const bead = new THREE.Mesh(new THREE.SphereGeometry(.06, 24, 16), MAT.red());
  bead.position.fromArray(scl3(pole, 1.05));
  grp.add(bead);
  object.add(grp);
  return { object, cam: { az: 8, el: 10, dist: 7.6, target: [0, 0, 0], fov: 24, floor: false } };
}
