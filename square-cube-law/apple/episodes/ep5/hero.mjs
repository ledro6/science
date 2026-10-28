// Герой обложек ep5: светящаяся сфера-лампа и две концентрические стеклянные оболочки r и 2r
// с тонкими меридианами; на оболочках выделен «пучок»: квадратик 1×1 на малой и 2×2 на большой. Без пола.
export default function (THREE, { shadowsOn }) {
  const object = new THREE.Group();
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.2, 48, 32), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }));
  // мягкий ореол лампы — несколько аддитивных полупрозрачных сфер
  for (const [r, o] of [[.32, .18], [.5, .08], [.75, .04]]) {
    lamp.add(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  }
  const pl = new THREE.PointLight('#ffffff', 6, 0, 2);
  object.add(lamp, pl);
  const wire = (R, op) => {
    const pts = [], N = 96;
    for (let m = 0; m < 12; m++) {
      const ph = m / 12 * Math.PI;
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2;
        pts.push(Math.sin(a) * Math.cos(ph), Math.cos(a), Math.sin(a) * Math.sin(ph), Math.sin(b) * Math.cos(ph), Math.cos(b), Math.sin(b) * Math.sin(ph));
      }
    }
    for (const lat of [-60, -30, 0, 30, 60]) {
      const y = Math.sin(lat * Math.PI / 180), r = Math.cos(lat * Math.PI / 180);
      for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2; pts.push(r * Math.cos(a), y, r * Math.sin(a), r * Math.cos(b), y, r * Math.sin(b)); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: op, depthWrite: false })); l.scale.setScalar(R); return l;
  };
  // ось пучка — к камере, чуть вправо-вверх
  const AX = new THREE.Vector3(.42, .3, 1).normalize();
  const E1 = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), AX).normalize();
  const E2 = new THREE.Vector3().crossVectors(AX, E1).normalize();
  const A = .3;
  const surf = (R, u, v) => AX.clone().addScaledVector(E1, u).addScaledVector(E2, v).normalize().multiplyScalar(R);
  const cell = (R, u0, u1, v0, v1, op) => {
    const g = new THREE.PlaneGeometry(1, 1, 8, 8), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const q = surf(R * 1.004, u0 + (u1 - u0) * (p.getX(i) + .5), v0 + (v1 - v0) * (p.getY(i) + .5)); p.setXYZ(i, q.x, q.y, q.z); }
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    const pts = [], seg = 12, R2 = R * 1.008;
    const side = (f) => { for (let i = 0; i < seg; i++) { const a = f(i / seg), b = f((i + 1) / seg); pts.push(a.x, a.y, a.z, b.x, b.y, b.z); } };
    side(s => surf(R2, u0 + (u1 - u0) * s, v0)); side(s => surf(R2, u1, v0 + (v1 - v0) * s));
    side(s => surf(R2, u1 - (u1 - u0) * s, v1)); side(s => surf(R2, u0, v1 - (v1 - v0) * s));
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const e = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .95 }));
    object.add(m, e);
  };
  for (const [R, n, op] of [[.8, 1, .6], [1.6, 2, .16]]) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, transparent: true, opacity: .06, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }));
    const w = wire(R, R < 1 ? .3 : .22);
    w.rotation.set(.25, .4, .08);
    object.add(shell, w);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cell(R, -A + 2 * A * i / n, -A + 2 * A * (i + 1) / n, -A + 2 * A * j / n, -A + 2 * A * (j + 1) / n, op);
  }
  // рёбра пучка: от лампы через углы к внешней оболочке
  const bp = [];
  for (const [u, v] of [[-A, -A], [A, -A], [A, A], [-A, A]]) { const q = surf(1.6, u, v); bp.push(0, 0, 0, q.x, q.y, q.z); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  object.add(new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .45 })));
  object.position.y = 1.6;
  return { object, cam: { az: 0, el: 6, dist: 10.6, target: [0, 1.75, 0], fov: 24, floor: false } };
}
