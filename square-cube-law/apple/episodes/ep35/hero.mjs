import {makePasta} from './scenes/pasta-geometry.mjs';
export default function(THREE){const p=makePasta(THREE);p.pose({release:.09,second:true,split:1.3,gap:.10});p.object.rotation.z=.12;return{object:p.object,cam:{az:10,el:9,dist:11.5,target:[0,1.3,0],fov:24},floor:false}}
