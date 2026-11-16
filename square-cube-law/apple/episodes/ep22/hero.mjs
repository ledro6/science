import { makeCrowd } from '../ep8/scenes/kit.mjs';
export default function(THREE,{MAT}) {
  const crowd=makeCrowd(70,MAT.ceramicWhite(),{mirror:false,lo:true});
  for(let i=0;i<70;i++) crowd.set(i,(i%10-4.5)*.4,0,(Math.floor(i/10)-3)*.46,.63,1);
  crowd.commit();
  return {object:crowd.grp,cam:{az:19,el:47,dist:8.4,target:[0,.1,0],fov:29}};
}
