export function makeCup(THREE, MAT) {
  const cup = new THREE.Group();
  const wallMat = MAT.ceramicWhite();
  const profile = [[0,.04],[1.27,.04],[1.37,.12],[1.40,1.37],[1.34,1.43],[1.28,1.37],[1.25,.20],[0,.20]];
  const wall = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r,y]) => new THREE.Vector2(r,y)),48,Math.PI*.43,Math.PI*1.14), wallMat);
  wall.castShadow = true; wall.receiveShadow = true;
  cup.add(wall);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.28,1.27,.13,48),wallMat);
  base.position.y=.14; base.receiveShadow=true; cup.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.34,.055,8,64,Math.PI*1.14),wallMat);
  rim.rotation.set(Math.PI/2,0,Math.PI*.43); rim.position.y=1.37; cup.add(rim);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.45,.085,10,36,Math.PI*1.65),wallMat);
  handle.rotation.z=-.30; handle.position.set(1.57,.81,-.15); cup.add(handle);
  const waterMat=new THREE.MeshStandardMaterial({color:'#B5B9BF',roughness:.34,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
  const water=new THREE.Mesh(new THREE.CircleGeometry(1.24,64),waterMat);
  water.rotation.x=-Math.PI/2; water.position.y=1.08; cup.add(water);
  return {cup,water};
}
