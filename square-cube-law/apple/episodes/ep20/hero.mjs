import { makeBritain } from './scenes/coast.mjs';

export default function (THREE, { MAT }) {
  const object = new THREE.Group();
  object.add(makeBritain(THREE, MAT));
  return { object, cam: { az: 12, el: 69, dist: 21, target: [0, .15, 0], fov: 25 } };
}
