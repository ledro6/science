// Герой обложки № 17: та же студия, что в сценах (scenes/kit.mjs): три керамические двери в графитовой стене,
// средняя приоткрыта, за ней машина-приз.
import { makeStudio, DX } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const studio = makeStudio({ prize: 1 });
  studio.doors.forEach((d, i) => d.set({ open: i === 1 ? .62 : 0 }));
  object.add(studio.grp);
  return { object, cam: { az: 22, el: 8, dist: 15.2, target: [DX(1) + .35, 1.15, -.4], fov: 24 } };
}
