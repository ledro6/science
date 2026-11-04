// Герой обложки w3: обычный человек и великан вдвое выше рядом, та же керамическая фигура, что в сценах (scenes/kit.mjs).
// Пол с мягкой тенью студии; камера чуть снизу-сбоку, крупно, в нижних двух третях кадра.
import { makeHuman } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const a = makeHuman(), b = makeHuman();
  a.position.set(-.95, 0, .1); a.rotation.y = .3;
  b.position.set(.55, 0, 0); b.scale.setScalar(2); b.rotation.y = -.12;
  object.add(a, b);
  return { object, cam: { az: -6, el: 5, dist: 12.6, target: [-.12, 1.68, 0], fov: 24 } };
}
