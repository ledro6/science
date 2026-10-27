// Герой обложки ep3: высокая стопка листов уходит вверх, у подножия — маленькая керамическая Луна.
import { moonGeometry, moonMaterial } from './scenes/_lib.mjs';

export default function (THREE, { MAT, shadowsOn }) {
  const object = new THREE.Group();
  let s = 3;
  const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const N = 96, PITCH = .046;
  const geo = new THREE.BoxGeometry(1.05, PITCH * .8, 1.48);
  const mat = new THREE.MeshPhysicalMaterial({ color: '#F4F4F1', roughness: .55, clearcoat: .2 });
  const im = new THREE.InstancedMesh(geo, mat, N);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const u = i / N;
    e.set(0, (R() - .5) * .09 + u * .35, 0); q.setFromEuler(e);
    p.set((R() - .5) * .04 + u * u * .12, PITCH * (i + .5), (R() - .5) * .04);
    M.compose(p, q, one); im.setMatrixAt(i, M);
    c.setScalar(.88 + R() * .12); im.setColorAt(i, c);
  }
  object.add(im);
  const moon = new THREE.Mesh(moonGeometry(THREE, 64, 11), moonMaterial(THREE));
  moon.scale.setScalar(.42); moon.position.set(1.05, .42, .75); moon.rotation.set(.3, -.6, 0);
  object.add(moon);
  shadowsOn(object);
  return { object, cam: { az: 32, el: 9, dist: 17, target: [.35, 2.5, 0], fov: 24 } };
}
