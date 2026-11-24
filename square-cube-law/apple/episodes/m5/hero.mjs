import {makeJar,makeDisplay} from './scenes/jars.mjs';
export default function(THREE){
 const object=new THREE.Group();
 const rack=makeDisplay(THREE,24,{dark:true});rack.scale.setScalar(.67);rack.position.set(-.25,.04,-.6);
 const hero=makeJar(THREE,{dark:true});hero.scale.setScalar(1.7);hero.position.set(.65,.05,.6);hero.rotation.y=-.12;
 object.add(rack,hero);
 return{object,cam:{az:7,el:9,dist:9.4,target:[0,.94,0],fov:24}};
}
