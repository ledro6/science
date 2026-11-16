export function makeCoffeeCup(THREE, MAT) {
  const group = new THREE.Group();
  const ceramic = MAT.ceramicWhite();
  const profile = [[0,.05],[.90,.05],[1.01,.14],[1.05,1.24],[1.01,1.30],[.95,1.27],[.91,.24],[0,.24]];
  const wall = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),48),ceramic);
  wall.castShadow=true; wall.receiveShadow=true;
  group.add(wall);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.35,.085,10,36,Math.PI*1.72),ceramic);
  handle.position.set(1.19,.77,0);handle.rotation.z=-.44;group.add(handle);
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(1.26,1.18,.075,48),ceramic);
  saucer.position.y=.035;saucer.receiveShadow=true;group.add(saucer);
  const surfaceMaterial = new THREE.MeshPhysicalMaterial({color:'#19191C',roughness:.28,clearcoat:.7});
  const surface = new THREE.Mesh(new THREE.CircleGeometry(.927,48),surfaceMaterial);
  surface.rotation.x=-Math.PI/2;surface.position.y=.95;group.add(surface);
  const milk = new THREE.Mesh(new THREE.CylinderGeometry(.043,.043,1,12),MAT.ceramicWhite());
  milk.position.set(.1,1.68,0);group.add(milk);milk.visible=false;
  const jug = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.26,.20,.44,32),MAT.aluminium());
  body.position.y=.22;
  const lip = new THREE.Mesh(new THREE.ConeGeometry(.105,.22,12),MAT.aluminium());
  lip.position.set(-.22,.35,0);lip.rotation.z=Math.PI*.40;
  jug.add(body,lip);jug.position.set(.40,2.20,0);group.add(jug);
  jug.visible=false;
  return {group,surface,milk,jug};
}
