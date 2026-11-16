import { THREE, MAT, P, lerp, eInOut } from '../../engine.mjs';
import { rbox, frame, makeBar } from '../ep18/scenes/kit.mjs';
import { figureGeos } from '../ep8/scenes/kit.mjs';
export { frame, rbox, makeBar };

function block(w,h,d,material,x=0,y=h/2,z=0) {
  const mesh=new THREE.Mesh(rbox(w,h,d,.035,2),material);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
  return mesh;
}
export function machine() {
  const object=new THREE.Group();
  const white=MAT.ceramicWhite(), black=MAT.graphite(), alu=MAT.aluminium();
  object.add(block(.88,.12,.78,black),block(.18,.92,.18,alu,-.28,.58,-.19),
    block(.64,.17,.58,white,0,.54,0),block(.68,.20,.32,white,0,1.02,-.10));
  const spindle=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.37,16),alu);
  spindle.position.set(.15,.77,.04);object.add(spindle);
  const wheel=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.029,8,32),alu);
  wheel.add(ring);
  for(let i=0;i<3;i++){const spoke=block(.026,.31,.025,alu,0,0,0);spoke.rotation.z=i*Math.PI/3;wheel.add(spoke);}
  wheel.position.set(.46,.54,.31);object.add(wheel);
  const work=block(.15,.08,.20,black,.15,.67,.04);object.add(work);
  const product=block(.16,.16,.16,white,0,.08,.65);object.add(product);
  return {object,wheel,product,pose(t){
    wheel.rotation.z=-t*1.45;
    spindle.rotation.y=t*4;
    const u=(t*.45)%1;product.position.z=.61+u*.67;
    product.scale.setScalar(Math.min(1,u*8,(1-u)*8));
  }};
}
export function worker() {
  const object=new THREE.Group();
  const geos=figureGeos(.92);
  geos.forEach(geo=>{const m=new THREE.Mesh(geo,MAT.ceramicWhite());m.castShadow=true;object.add(m);});
  return object;
}
export function floorPlate(w=3.9,d=2) {return block(w,.10,d,MAT.graphite(),0,.045,0);}
export function bench() {
  const object=new THREE.Group();object.add(floorPlate());
  const person=worker();person.position.set(-.95,.10,.11);object.add(person);
  const tool=machine();tool.object.position.set(.42,.10,0);object.add(tool.object);
  return {object,person,tool};
}
export function settings(stage,t,s,{distance=21,sy=900,target=[0,.5,0],az=17}={}) {
  const p=P(t,s.start,s.end-s.start,eInOut);
  frame(stage.camera,target,distance-.35*p,az-11*p,11,540,sy);
  stage.lights.key.position.set(3+2*p,9,7);
}
