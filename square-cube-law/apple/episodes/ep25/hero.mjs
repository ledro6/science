import { makeCapillaries } from './apparatus.mjs';
export default function(THREE,{MAT}){
  const {group}=makeCapillaries(THREE,MAT,true);
  return {object:group,cam:{az:7,el:13,dist:10.9,target:[0,1.20,0],fov:24}};
}
