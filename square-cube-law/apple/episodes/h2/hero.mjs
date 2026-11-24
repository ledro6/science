import {kit} from './scenes/props.mjs';
import {mitten} from './scenes/details.mjs';
export default function(T){
 const K=kit(T),{object,left,right}=K.doors();
 left.position.x=-1.10;right.position.x=1.10;
 object.add(K.box(.19,3.8,.04,K.glow(0x8a2622),0,0,-.31));
 const glove=mitten();glove.position.set(.06,-.2,.8);glove.scale.setScalar(.85);glove.rotation.z=-.13;object.add(glove);
 object.scale.setScalar(.56);
 return {object,cam:{az:8,el:3,dist:9.6,target:[0,.02,0],fov:24},floor:false};
}
