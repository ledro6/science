export function makeMirror(THREE, MAT, dark = true) {
  const object = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 3.3, .07),
    MAT.aluminium(),
  );
  frame.position.y = 1.65;
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(frame.geometry),
    new THREE.LineBasicMaterial({ color: dark ? '#FFFFFF' : '#1D1D1F', transparent: true, opacity: .7 }),
  );
  edge.position.copy(frame.position);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2),
    new THREE.MeshBasicMaterial({
      color: dark ? '#BFC0C4' : '#7D7E85', transparent: true,
      opacity: .10, side: THREE.DoubleSide, depthWrite: false,
    }));
  glass.position.y = 1.65;
  object.add(edge, glass);
  const feet = [-1.42, 1.42].map(x => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.21, .25, .06, 24), MAT.graphite());
    mesh.position.set(x, .03, 0);
    mesh.castShadow = true;
    object.add(mesh);
    return mesh;
  });
  return object;
}

function segment(THREE, a, b, radius, material) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const direction = B.clone().sub(A);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 20), material);
  mesh.position.copy(A).add(B).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize());
  mesh.castShadow = true;
  return mesh;
}

export function makePerson(THREE, MAT, reflected = false) {
  const object = new THREE.Group();
  const bodyMat = reflected ? MAT.graphite() : MAT.ceramicWhite();
  const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 32, 20), bodyMat);
  head.position.y = 2.15;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.23, .66, 5, 20), bodyMat);
  torso.position.y = 1.48;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.07, .17, 16), MAT.aluminium());
  nose.rotation.x = -Math.PI/2;
  nose.position.set(0, 2.16, -.24);
  object.add(head, torso, nose);
  for(const x of [-.15,.15]) object.add(segment(THREE,[x,1.07,0],[x,.18,0],.085,bodyMat));
  object.add(segment(THREE,[-.29,1.8,0],[-.49,.98,.03],.07,bodyMat));
  const arm = new THREE.Group();
  arm.position.set(.29,1.8,0);
  arm.add(segment(THREE,[0,0,0],[.3,-.44,0],.065,bodyMat));
  arm.add(segment(THREE,[.3,-.44,0],[.52,-.71,-.04],.062,bodyMat));
  const hand = new THREE.Mesh(new THREE.SphereGeometry(.105,24,16), MAT.aluminium());
  hand.position.set(.52,-.71,-.04);
  arm.add(hand); object.add(arm);
  object.traverse(mesh => { if(mesh.isMesh) { mesh.castShadow=true; mesh.receiveShadow=false; } });
  return { object, arm };
}

export function makeDepthArrow(THREE, MAT, reflected = false) {
  const object = new THREE.Group();
  const mat = reflected ? MAT.graphite() : MAT.ceramicWhite();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.85,24), mat);
  stem.rotation.x = Math.PI/2;
  stem.position.z = .06;
  const head = new THREE.Mesh(new THREE.ConeGeometry(.19,.35,32), mat);
  head.rotation.x = -Math.PI/2;
  head.position.z = -.55;
  object.add(stem,head);
  return object;
}
