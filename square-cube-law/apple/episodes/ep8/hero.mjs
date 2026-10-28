// Герой обложек ep8: кольцо из 23 керамических фигурок-капсул (тот же образ, что в ролике).
// Две фигурки с совпавшим днём рождения — белая керамика на светящихся кольцах-подставках, остальные — графит;
// между их головами — тонкая дуга. Без цвета.
export default function (THREE, { MAT, shadowsOn }) {
  const object = new THREE.Group();
  const N = 23, R = 2.3, K = 1.25, PAIR = [3, 14];
  const body = new THREE.CapsuleGeometry(.155 * K, .36 * K, 8, 32); body.translate(0, (.155 + .18) * K, 0);
  const head = new THREE.SphereGeometry(.118 * K, 32, 20); head.translate(0, .82 * K, 0);
  const white = MAT.ceramicWhite(), graphite = MAT.graphite();
  const ringMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .85, toneMapped: false });
  const heads = [];
  for (let i = 0; i < N; i++) {
    const a = Math.PI * 2 * i / N, x = R * Math.sin(a), z = R * Math.cos(a);
    const hi = PAIR.includes(i), m = hi ? white : graphite;
    const f = new THREE.Group(); f.add(new THREE.Mesh(body, m), new THREE.Mesh(head, m)); f.position.set(x, 0, z);
    object.add(f);
    if (hi) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.4, .016, 8, 64), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(x, .01, z);
      object.add(ring);
      heads.push(new THREE.Vector3(x, .82 * K + .2, z));
    }
  }
  // дуга между совпавшими
  const [A, B] = heads, mid = A.clone().add(B).multiplyScalar(.5); mid.y += 1.4;
  const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
  object.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .016, 8, false), ringMat));
  shadowsOn(object);
  return { object, cam: { az: 0, el: 30, dist: 13.4, target: [0, .7, 0], fov: 24 } };
}
