import { THREE, MAT } from '../../../engine.mjs';
import { makeEarth } from '../../w1/scenes/kit.mjs';

export function makeSystem() {
  const group = new THREE.Group();
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.55, 40, 24), new THREE.MeshBasicMaterial({color:'#F5F5F7'}));
  const hole = new THREE.Mesh(new THREE.SphereGeometry(.40, 40, 24), MAT.ceramicBlack());
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.418, .022, 8, 64), MAT.aluminium());
  hole.add(rim); rim.rotation.x = Math.PI/2;
  const points = [];
  for (let i=0;i<=128;i++) {
    const a=i/128*Math.PI*2; points.push(new THREE.Vector3(Math.cos(a)*2.06,0,Math.sin(a)*2.06));
  }
  const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#7C7C82',transparent:true,opacity:.88}));
  const earth = makeEarth(.31, 40);
  earth.rotation.z=.4;
  group.add(sun,hole,orbit,earth);
  return {group,sun,hole,earth,orbit};
}
export function pose(system,t,phase=0) {
  const angle = phase+t*.15;
  system.earth.position.set(2.06*Math.cos(angle),0,2.06*Math.sin(angle));
  system.earth.rotation.y=t*.23;
  system.hole.rotation.y=t*.09;
}
export function makeRayPath() {
  const group=new THREE.Group();
  const points=[new THREE.Vector3(-1.5,0,0),new THREE.Vector3(1.5,0,0)];
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#727278'})));
  const source=new THREE.Mesh(new THREE.SphereGeometry(.37,40,24),new THREE.MeshBasicMaterial({color:'#FFFFFF'}));
  source.position.x=-1.5;
  const earth=makeEarth(.39,40);earth.position.x=1.5;
  const photons=[];
  for(let i=0;i<7;i++){
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshBasicMaterial({color:'#FFFFFF'}));
    group.add(dot); photons.push(dot);
  }
  group.add(source,earth);
  return {group,source,earth,photons};
}
