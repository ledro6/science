// Герой обложки m3: два стеклянных стакана крупно — горячий с паром и холодный с инеем снаружи и льдом внутри.
// Те же модели, что в сценах (scenes/glassware.mjs; файл не зависит от движка).
import { makeGlass, makeSteam, GLASS } from './scenes/glassware.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const hot = makeGlass(THREE), cold = makeGlass(THREE);
  hot.position.set(-.5, 0, .12); cold.position.set(.5, 0, -.12);
  cold.setIce(.85); cold.setFrost(.95); cold.setLevel(.78);
  hot.setLevel(.8);
  const steam = makeSteam(THREE, { n: 30, op: .55, height: .8, spread: .13, seed: 21 });
  steam.position.set(-.5, GLASS.h - .1, .12); steam.set(2.3, 1);
  object.add(hot, cold, steam);
  hot.children[2].castShadow = cold.children[2].castShadow = true;
  return { object, cam: { az: 14, el: 12, dist: 6.3, target: [0, .86, 0], fov: 24 } };
}
