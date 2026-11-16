export function makeCapillaries(THREE, MAT, dark = true) {
  const group = new THREE.Group();
  const edge = new THREE.LineBasicMaterial({ color: dark ? '#CBCBD1' : '#505057', transparent: true, opacity: .75 });
  const waterMat = new THREE.MeshPhysicalMaterial({ color: dark ? '#D9DBDF' : '#5F626B', roughness: .30, metalness: .07, clearcoat: .65 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#C5C6CB', transparent: true, opacity: .11, roughness: .35, side: THREE.DoubleSide, depthWrite: false });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.15, .12, 1.05), MAT.graphite());
  base.position.y = .06; base.castShadow = true; base.receiveShadow = true; group.add(base);
  const reservoir = new THREE.Mesh(new THREE.BoxGeometry(2.0, .24, .90), waterMat);
  reservoir.position.y = .24; reservoir.receiveShadow = true; group.add(reservoir);
  const tubes = [.23,.115].map((radius, i) => {
    const tube = new THREE.Group(); tube.position.x = i ? .62 : -.62;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius+.028,radius+.028,2.68,40,1,true,Math.PI*.17,Math.PI*1.66), glassMat);
    wall.position.y = 1.52; tube.add(wall);
    for (const y of [.18,2.86]) {
      const pts = Array.from({length:65},(_,j) => {
        const a=j/64*Math.PI*2;
        return new THREE.Vector3((radius+.028)*Math.cos(a),y,(radius+.028)*Math.sin(a));
      });
      tube.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),edge));
    }
    for (const a of [Math.PI*.22,Math.PI*.88]) {
      const x=(radius+.028)*Math.cos(a),z=(radius+.028)*Math.sin(a);
      tube.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,.18,z),new THREE.Vector3(x,2.86,z)]),edge));
    }
    const column = new THREE.Mesh(new THREE.CylinderGeometry(radius*.965,radius*.965,1,40),waterMat);
    column.castShadow = true; tube.add(column);
    const profile = [[0,0],[radius*.45,.008],[radius*.72,.026],[radius*.90,.054],[radius*.965,.075]];
    const meniscus = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),40),waterMat);
    tube.add(meniscus);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius*.965,.014,8,40),MAT.aluminium());
    rim.rotation.x = Math.PI/2; tube.add(rim);
    tube.userData.setHeight = height => {
      column.position.y = .36+height/2;
      column.scale.y = Math.max(.001,height);
      meniscus.position.y = .36+height;
      rim.position.y = .435+height;
    };
    tube.userData.radius = radius;
    tube.userData.setHeight(i ? 2 : 1);
    group.add(tube);
    return tube;
  });
  return { group, tubes, reservoir, base };
}
