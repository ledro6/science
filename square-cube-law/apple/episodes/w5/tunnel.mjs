import { THREE, MAT } from '../../engine.mjs';

export const radius = 1.65;
export function makeTunnelWorld() {
  const object = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32, Math.PI, Math.PI), MAT.graphite());
  const face = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), MAT.ceramicWhite());
  face.position.z = .008;
  object.add(shell, face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .025, 8, 64), MAT.aluminium());
  ring.position.z = .025;
  object.add(ring);
  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(.19, radius*2+.12, .07), MAT.ceramicBlack());
  tunnel.position.z = .073;
  object.add(tunnel);
  for (const x of [-.118,.118]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,radius*2+.12,12), MAT.aluminium());
    rail.position.set(x,0,.124);
    object.add(rail);
  }
  const capsule = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.066,.066,.18,24), MAT.graphite());
  capsule.add(body);
  for (const y of [-.09,.09]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.066,24,16),MAT.aluminium());
    cap.position.y=y; capsule.add(cap);
  }
  capsule.position.z=.16;
  object.add(capsule);
  const dots=[];
  for(let i=0;i<13;i++){
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.015,10,8),MAT.aluminium());
    dot.position.set(-.074,radius*Math.cos(i/12*Math.PI),.155);
    object.add(dot);dots.push(dot);
  }
  return {object,capsule,dots};
}
export function setTrip(world, fraction) {
  world.capsule.position.y=radius*Math.cos(Math.PI*fraction);
  world.capsule.rotation.z=.015*Math.sin(fraction*Math.PI*2);
  world.dots.forEach((dot,i)=>{dot.visible=i/12<fraction-.025;});
}
