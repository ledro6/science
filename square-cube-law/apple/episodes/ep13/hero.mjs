// Герой обложки № 13: тот же висячий мост, что в сценах (scenes/kit.mjs): каменные порталы, цепи, дощатый настил;
// колонна из 74 керамических солдатиков шагает в ногу, настил прогнулся под шагом.
import { makeSuspension, makeSoldiers, makeRiver, deckY, colPos, BR, COL } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const o = { amp: .16, ph: -Math.PI / 2 };
  const bridge = makeSuspension({ bankZ: 2.2, bankX: 2.2 }); bridge.set(o);
  const sold = makeSoldiers(COL.n);
  for (let i = 0; i < COL.n; i++) {
    const [x, z] = colPos(i, BR.L / 2 - .45);
    sold.set(i, [x, deckY(x, o), z], { s: COL.s, ph: .9, sw: .42 });
  }
  sold.commit();
  const river = makeRiver(BR.L + .3, 2.2); river.set(2, []);
  object.add(bridge, sold.grp, river);
  return { object, cam: { az: 44, el: 15, dist: 21, target: [1.0, 1.3, 0], fov: 24 } };
}
