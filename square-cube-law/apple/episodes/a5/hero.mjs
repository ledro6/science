import { makeTyre,road } from './kit.mjs';
export default function () {
  const tyre=makeTyre(),path=road(true);
  tyre.group.position.y=1.28;tyre.spin.rotation.z=.25;path.stripe.scale.x=.24;
  path.group.add(tyre.group);
  return {object:path.group,cam:{az:18,el:14,dist:10.3,target:[.08,.75,0],fov:24}};
}
