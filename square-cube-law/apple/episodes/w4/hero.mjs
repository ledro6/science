import { makeSystem, pose } from './scenes/kit.mjs';
export default function(THREE){
  const system=makeSystem();
  system.sun.visible=false;
  pose(system,0,.45);
  system.hole.scale.setScalar(1.6);
  return {object:system.group,cam:{az:-9,el:57,dist:12.4,target:[0,0,0],fov:26,floor:false}};
}
