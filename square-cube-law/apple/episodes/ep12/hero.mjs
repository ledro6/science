// Герой обложки № 12: тот же аквариум, что в сценах (scenes/kit.mjs): корпус-лодка из стали держится на воде,
// стальной кубик рядом идёт ко дну, за ним — пузырьки, по воде расходятся круги.
import { makeCube, makeHull, makeTank, makeWater, makeBubbles, HULL, DRAFT } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const TW = 4.4, TD = 4.0, TH = 2.6, WL = 2.0, CX = -1.25, CZ = .55, HX = 1.0;
  const tank = makeTank(TW, TD, TH);
  const water = makeWater(TW - .02, TD - .02, { opacity: .13, edgeOp: .5, surf: { base: .04, fres: .3, spec: 1.1 } });
  water.splash(.9, CX, CZ); water.set(WL, 1.6, 1);
  water.hole(HX - HULL.B / 2 + .01, HX + HULL.B / 2 - .01, -HULL.L / 2 + .01, HULL.L / 2 - .01);
  const cube = makeCube(); cube.position.set(CX, .95, CZ); cube.rotation.set(.08, .35, .12);
  const hull = makeHull(); hull.rotation.y = Math.PI / 2; hull.position.set(HX, WL - DRAFT, 0); hull.set({ fold: 1 });
  // пузырьки за кубиком: путь — вертикаль от поверхности до текущей глубины
  const bubbles = makeBubbles(46);
  bubbles.set(1.6, .9, 1.45, τ => [CX, lerpY(τ), CZ], WL, 1);
  function lerpY(τ) { const k = Math.min(1, Math.max(0, (τ - .9) / .7)); return WL + .2 - k * (WL + .2 - 1.45); }
  object.add(tank, water, cube, hull, bubbles);
  return { object, cam: { az: 22, el: 21, dist: 17, target: [.05, 1.2, 0], fov: 24 } };
}
