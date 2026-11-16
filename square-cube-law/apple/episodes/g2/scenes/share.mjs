import { THREE, MAT, defineScene, makeStage, atext, lerp, P, Wd, eInOut } from '../../../engine.mjs';
import { frame } from '../../g1/scenes/kit.mjs';

defineScene('share', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    const geom = new THREE.CylinderGeometry(.26, .26, .22, 40, 1);
    const light = MAT.aluminium(), dark = MAT.graphite();
    const discs = Array.from({ length: 5 }, (_, i) => {
      const disc = new THREE.Mesh(geom, i === 0 ? dark : light);
      disc.castShadow = true;
      disc.receiveShadow = true;
      stage.root.add(disc);
      return disc;
    });
    return { stage, discs, share: Wd('s1', 'пятая'), world: Wd('s1', 'мирового') };
  },
  update(t, s, { stage, discs, share }) {
    discs.forEach((disc, i) => {
      const split = P(t, s.start + .2 + i * .04, .83, eInOut);
      const lift = i === 0 ? P(t, share, .72) : 0;
      disc.position.set(lerp(0, (i - 2) * .67, split), .115 + .25 * lift, 0);
      disc.scale.setScalar(.32 + .68 * split);
    });
    frame(stage.camera, [0, .24, 0], 14.4, lerp(-7, -2, P(t, s.start, s.end - s.start)), 37, 540, 917);
  },
  draw2d(t, s, { stage, share, world }) {
    atext('≈20%', 540, 560, share, t, { size: 270, col: stage.accent, scale0: 1.08, blur: 18 });
    atext('от мирового потребления', 540, 677, world, t, { size: 58, w: 500, col: stage.ink });
    atext('нефти и нефтепродуктов', 540, 746, world + .13, t, { size: 50, w: 500, col: stage.sub });
    atext('I полугодие 2025 · оценка EIA', 540, 1144, world + .25, t, { size: 39, w: 500, col: stage.sub });
  },
  sfx(add) {
    const share = Wd('s1', 'пятая');
    add(share - .35, 'swell', .19, .85);
    add(share, 'impact', .32, .95);
    add(share + .10, 'chime', .19, .9);
  },
});
