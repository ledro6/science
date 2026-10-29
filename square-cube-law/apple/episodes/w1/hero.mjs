// Герой обложек w1: Земля в стеклянной водной оболочке, вытянутой приливом к Луне, и Луна рядом (вдвое ближе).
// Те же материалы и текстуры, что в сценах выпуска (scenes/kit.mjs). Без пола.
import { makeEarth, makeMoon, makeShell, tideShell } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const RE = 1, RM = .27, EX = -.78, MX = 1.5;
  const earth = makeEarth(RE, 64), moon = makeMoon(RM, 48);
  earth.position.set(EX, 0, 0); earth.rotation.set(0, -.9, .41);
  moon.position.set(MX, 0, 0); moon.rotation.set(0, -.3, 0);
  const shell = makeShell(RE * 1.07, { base: .06, rim: .9, pow: 2.4, seg: 64 });
  shell.position.copy(earth.position); tideShell(shell, .22, 0);
  // «Солнце» слева-спереди: дневная сторона к зрителю, ночная — справа; Луна освещена так же
  const sun = new THREE.DirectionalLight('#ffffff', 1.3); sun.position.set(-5, 2.5, 6.5);
  object.add(earth, moon, shell, sun, sun.target);
  return { object, cam: { az: -6, el: 8, dist: 10.6, target: [-.2, .4, 0], fov: 24, floor: false } };
}
