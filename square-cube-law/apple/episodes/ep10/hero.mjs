// Герой обложек ep10: стеклянный блок (граница двух сред) и световой стержень — луч из лампы
// входит в стекло и преломляется к нормали; на дне — пятно света. 
export default function (THREE, { MAT }) {
  const object = new THREE.Group();
  const BW = 2.8, BH = 1.1, BD = 1.3;
  const geo = new THREE.BoxGeometry(BW, BH, BD);
  const glass = new THREE.Mesh(geo, MAT.glass(.16)); glass.position.y = BH / 2;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .85 }));
  edges.position.y = BH / 2;
  object.add(glass, edges);
  const lm = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
  const A = new THREE.Vector3(-1.35, BH + 1.25, 0), C = new THREE.Vector3(-.5, BH, 0), B = new THREE.Vector3(-.05, .05, 0);
  const beam = (a, b, r) => {
    const d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 16), lm);
    m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
  };
  object.add(beam(A, C, .028), beam(C, B, .028));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.11, 32, 22), lm); lamp.position.copy(A);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(.12, 32), lm); spot.rotation.x = -Math.PI / 2; spot.position.set(B.x, .004, 0);
  object.add(lamp, spot);
  const pl = new THREE.PointLight('#ffffff', 4, 0, 2); pl.position.copy(A).add(new THREE.Vector3(0, 0, .4)); object.add(pl);
  glass.castShadow = false; glass.receiveShadow = false;
  return { object, cam: { az: 8, el: 10, dist: 9.5, target: [-.1, 1.1, 0], fov: 24, floor: false } };
}
