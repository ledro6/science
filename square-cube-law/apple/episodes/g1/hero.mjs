// Герой обложки g1: монохромный глобус (те же текстура и материалы, что в сценах, scenes/kit.mjs) с яркими
// дугами торговых потоков между соседями: США–Канада и США–Мексика.
// У обложки нет 2D-слоя, поэтому дуги — 3D-трубки (белое ядро + мягкий ореол) и светящиеся точки-центры. Без пола.
import { makeGlobe, makeShell, globeArcPts, arcTube, llDir, PLACES as PL } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const globe = makeGlobe(1, 96);
  const atm = makeShell(1.015, { base: 0, rim: .6, pow: 3.6, seg: 64 });
  object.add(globe, atm);
  const core = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
  const halo = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const ARCS = [['usa', 'can', 1], ['usa', 'mex', .9]];
  for (const [a, b, w] of ARCS) {
    const pts = globeArcPts(1, PL[a], PL[b], { n: 48 });
    object.add(arcTube(pts, .011 * w, core), arcTube(pts, .032 * w, halo));
  }
  for (const k of ['usa', 'can', 'mex']) {
    const d = llDir(...PL[k]);
    const m = new THREE.Mesh(new THREE.SphereGeometry(.016, 16, 12), core); m.position.copy(d).multiplyScalar(1.004);
    const h = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), halo); h.position.copy(m.position);
    object.add(m, h);
  }
  // «Солнце» слева-спереди относительно камеры: дневная сторона к зрителю
  const sun = new THREE.DirectionalLight('#ffffff', 1.4); sun.position.set(-5, 5, 5);
  object.add(sun, sun.target);
  return { object, cam: { az: 12, el: 26, dist: 6.9, target: [0, 0, 0], fov: 24, floor: false } };
}
