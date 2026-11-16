import { makeChart, makeTanker, placeTanker } from './hormuz.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const { root, curve, path } = makeChart(THREE, true);
  const ship = makeTanker(THREE, true);
  placeTanker(ship, curve, .66);
  ship.scale.setScalar(.82);
  ship.position.y += .06;
  path.material.opacity = .85;
  object.add(root, ship);
  return { object, cam: { az: -10, el: 57, dist: 11.5, target: [.5, .16, -.12], fov: 24, floor: false } };
}
