import { makeHeadphone } from './product.mjs';
export default function(THREE) {
  const {object}=makeHeadphone(THREE);
  return {object,cam:{az:24,el:7,dist:8.7,target:[0,.35,0],fov:24},floor:false};
}
