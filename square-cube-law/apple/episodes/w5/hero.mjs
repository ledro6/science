import {makeTunnelWorld,setTrip} from './tunnel.mjs';
export default function(){
  const world=makeTunnelWorld();setTrip(world,.42);
  return {object:world.object,cam:{az:13,el:9,dist:12.5,target:[0,0,0],fov:26,floor:false}};
}
