import { makeCicada } from './cicada.mjs';

export default function (THREE, { MAT }) {
  const { insect: object, spread } = makeCicada(THREE, MAT);
  spread(.52);
  object.rotation.y = -.38;
  return { object, cam: { az: 28, el: 53, dist: 5.6, target: [0, .39, -.17], fov: 26 } };
}
