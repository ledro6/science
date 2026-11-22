import {moonModel,earthModel} from './scenes/moon-model.mjs';
export default function(THREE){
 const object=new THREE.Group(),earth=earthModel(THREE),moon=moonModel(THREE);
 earth.scale.setScalar(1.35);earth.position.set(-1.1,.1,0);object.add(earth);
 moon.group.scale.setScalar(.9);moon.group.position.set(1.4,.6,.15);moon.group.rotation.z=.18;object.add(moon.group);
 const points=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;points.push(new THREE.Vector3(-.2+2*Math.cos(a),.35+1*Math.sin(a),-.3))}
 object.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#7C7C80'})));
 return {object,floor:false,cam:{az:0,el:6,dist:13.5,target:[0,.35,0],fov:24,floor:false}};
}
