// Герой обложек w2: Земля «сейчас» и Земля вдвое больше по радиусу рядом, в тонких стеклянных атмосферах.
// Те же материалы и текстуры, что в сценах выпуска (scenes/kit.mjs, копия kit пилота рубрики w1). Без пола.
import { makeEarth, makeShell } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const R1 = .55, AX = -1.38, BX = .5;
  const a = makeEarth(R1, 64), b = makeEarth(R1 * 2, 64);
  a.position.set(AX, 0, 0); a.rotation.set(0, -.6, .41);
  b.position.set(BX, 0, 0); b.rotation.set(0, -1.0, .41);
  const atA = makeShell(R1 * 1.02, { base: 0, rim: .55, pow: 3.6, seg: 64 }), atB = makeShell(R1 * 2.04, { base: .02, rim: .7, pow: 3, seg: 64 });
  atA.position.copy(a.position); atB.position.copy(b.position);
  // «Солнце» слева-спереди: дневная сторона к зрителю, ночная — справа (как у w1)
  const sun = new THREE.DirectionalLight('#ffffff', 1.3); sun.position.set(-5, 2.5, 6.5);
  object.add(a, b, atA, atB, sun, sun.target);
  return { object, cam: { az: -6, el: 8, dist: 11, target: [-.1, .4, 0], fov: 24, floor: false } };
}
