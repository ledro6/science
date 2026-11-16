import { THREE, makeStage } from '../../../engine.mjs';
import { makeChart, makeTanker } from '../hormuz.mjs';

export function shippingStage(bg) {
  const stage = makeStage({ bg });
  const dark = bg === 'black';
  const { root, curve, path } = makeChart(THREE, dark);
  const ship = makeTanker(THREE, dark);
  stage.root.add(root, ship);
  ship.scale.setScalar(.47);
  return { stage, curve, path, ship };
}
