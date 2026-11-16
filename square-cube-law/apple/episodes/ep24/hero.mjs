import { makePlane } from './kit.mjs';
export default function(THREE,{MAT}){
  const plane=makePlane(THREE,MAT);
  plane.spots.forEach(spot=>spot.visible=true);
  plane.panels.forEach(panel=>panel.visible=false);
  plane.object.rotation.y=-.14;
  return {object:plane.object,cam:{az:14,el:65,dist:11.2,target:[0,.35,0],fov:29}};
}
