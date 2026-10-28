// Герой обложек ep7: девять керамических столбиков распределения первых цифр 1–9 (log10(1 + 1/d)),
// первый — самый высокий; на полу перед ними — пара графитовых плашек-карточек.
export default function (THREE, { MAT, roundedBox, shadowsOn }) {
  const object = new THREE.Group();
  const rbox = (w, h, d, r) => {
    const n = 8, geo = new THREE.BoxGeometry(w, h, d, n, n, n);
    const sx = w / 2 - r, sy = h / 2 - r, sz = d / 2 - r, p = geo.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      c.set(Math.max(-sx, Math.min(sx, v.x)), Math.max(-sy, Math.min(sy, v.y)), Math.max(-sz, Math.min(sz, v.z)));
      v.sub(c).normalize().multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals(); return geo;
  };
  const mat = MAT.ceramicWhite();
  for (let d = 1; d <= 9; d++) {
    const h = Math.log10(1 + 1 / d) * 9;
    const m = new THREE.Mesh(rbox(.42, h, .42, .05), mat);
    m.position.set((d - 5) * .56, h / 2, 0);
    object.add(m);
  }
  const g = MAT.graphite();
  [[-1.2, .9, .35], [.9, 1.05, -.5]].forEach(([x, z, ry]) => {
    const c = new THREE.Mesh(rbox(1.0, .04, .5, .018), g);
    c.position.set(x, .02, z); c.rotation.y = ry; object.add(c);
  });
  shadowsOn(object);
  return { object, cam: { az: 22, el: 14, dist: 15, target: [0, 1.05, 0], fov: 24 } };
}
