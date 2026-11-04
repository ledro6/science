// Герой обложки № 15: та же лестница, что в сценах (scenes/kit.mjs): десять керамических столбиков 1 / ранг,
// наверху каждого кубик-слово с номером места.
import { makeStair, NB } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const stair = makeStair({ faces: Array.from({ length: NB }, (_, i) => [i, -1, -1, -1]) });
  for (let i = 0; i < NB; i++) stair.set(i, { grow: 1 });
  object.add(stair.grp);
  return { object, cam: { az: 16, el: 10, dist: 19.5, target: [0, 2.45, 0], fov: 24 } };
}
