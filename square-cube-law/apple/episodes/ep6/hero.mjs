// Герой обложек ep6: крупная керамическая бактерия (капсула) со жгутиком-спиралью, по диагонали вверх-вправо,
// вокруг — едва заметная взвесь. Без пола.
import { makeBacterium } from './scenes/_kit.mjs';

export default function (THREE, { MAT, shadowsOn }) {
  const object = new THREE.Group();
  const bac = makeBacterium(THREE, MAT.ceramicWhite(), { len: 2.7, R: .22, turns: 3.0, tube: .042 });
  bac.spin(.9);
  bac.position.x = 1.0;              // центр композиции — середина «тело + жгутик»
  const tilt = new THREE.Group(); tilt.add(bac);
  tilt.rotation.set(.2, -.35, .62);
  object.add(tilt);
  // взвесь: несколько мелких частиц
  let seed = 61; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const mm = new THREE.MeshBasicMaterial({ color: '#8E8E93' });
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(.012 + R() * .018, 8, 6), mm);
    m.position.set(-3 + R() * 6, -3.5 + R() * 7, -3 + R() * 2.5); object.add(m);
  }
  shadowsOn(bac);
  return { object, cam: { az: 0, el: 6, dist: 8.6, target: [.05, .15, 0], fov: 24, floor: false } };
}
