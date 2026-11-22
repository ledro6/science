import {kit} from './scenes/props.mjs';
export default function(THREE) {
  const K=kit(THREE);
  const {object}=K.doors();
  const display=K.box(.95,.31,.11,K.glow(0xff453a),0,2.51,.15);
  object.add(display);
  object.scale.setScalar(.55);
  return {object,cam:{az:7,el:3,dist:9.6,target:[0,.02,0],fov:24},floor:false};
}
