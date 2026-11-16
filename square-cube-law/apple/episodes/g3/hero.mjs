import { bench, machine } from './models.mjs';
export default function(THREE){
 const object=new THREE.Group(),workshop=bench();
 object.add(workshop.object);workshop.tool.pose(.85);
 const second=machine();second.object.scale.setScalar(.68);second.object.position.set(.68,.1,-.64);second.pose(.6);object.add(second.object);
 return{object,cam:{az:27,el:16,dist:18.8,target:[0,.48,.05],fov:24}};
}
