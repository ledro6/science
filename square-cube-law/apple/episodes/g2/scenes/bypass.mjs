import { atext, defineScene, eInOut, lerp, makeStage, MAT, P, project, THREE, Wd } from '../../../engine.mjs';
import { frame } from '../../g1/scenes/kit.mjs';
import { makeTanker } from '../hormuz.mjs';

const segments = 40;
const height = .19;

function route(z) {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    [-1.41, height, z], [-.75, height, z], [-.35, height, z + .21],
    [.60, height, z + .21], [1.08, height, z],
  ].map(point => new THREE.Vector3(...point)));
  const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, .045, 8), MAT.aluminium());
  pipe.castShadow = true;
  group.add(pipe);
  for (const p of [curve.getPointAt(0), curve.getPointAt(1)]) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(.128, .128, .15, 24), MAT.graphite());
    pad.position.set(p.x, .075, p.z);
    pad.castShadow = true;
    group.add(pad);
  }
  const cargo = new THREE.Mesh(new THREE.SphereGeometry(.072, 16, 12), MAT.graphite());
  group.add(cargo);
  return { group, curve, pipe, cargo };
}

defineScene('bypass', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    const west = route(-.70), east = route(.59);
    const ship = makeTanker(THREE, false);
    ship.scale.setScalar(.39);
    stage.root.add(west.group, east.group, ship);
    return {
      stage, west, east, ship, redSea: Wd('b1', 'красному'),
      uae: Wd('b2', 'эмиратах'), port: Wd('b2', 'фуджейра'), load: Wd('b3', 'погрузить'),
    };
  },
  update(t, s, { stage, west, east, ship, redSea, uae, load }) {
    const p = P(t, s.start, s.end - s.start, eInOut);
    const routes = [[west, redSea], [east, uae]];
    for (const [{ group, curve, pipe, cargo }, time] of routes) {
      const reveal = P(t, time - .35, .8, eInOut);
      const progress = P(t, time, 1.75, eInOut);
      group.visible = reveal > .001;
      group.position.y = lerp(-.10, 0, reveal);
      pipe.geometry.setDrawRange(0, Math.floor(reveal * segments) * 48);
      cargo.visible = reveal > .1;
      cargo.position.copy(curve.getPointAt(progress * reveal));
    }
    const sailing = P(t, load - .24, 1.12, eInOut);
    ship.visible = sailing > .001;
    ship.position.set(lerp(1.23, 1.59, sailing), height, .59);
    ship.scale.setScalar(lerp(.29, .39, sailing));
    frame(stage.camera, [.07, .08, 0], lerp(14.0, 14.7, p), lerp(-5, -1, p), 58, 540, 860);
  },
  draw2d(t, s, { stage, west, east, redSea, uae, port, load }) {
    const { camera, ink, sub } = stage;
    atext('Маршруты в обход', 540, 354, s.start + .2, t, { size: 88, col: ink });
    atext('Схема нефтепроводов', 540, 442, s.start + .4, t, { size: 48, w: 500, col: sub });
    const label = (curve, side, name, time) => {
      const v = curve.getPointAt(side);
      const [x, y] = project(camera, v.x, v.y, v.z);
      const left = side === 0;
      atext(name, left ? Math.max(88, x - 6) : x, y - 50, time, t, {
        size: 42, col: ink, align: left ? 'left' : 'center',
      });
    };
    label(west.curve, 0, 'Саудовская Аравия', redSea - .32);
    label(west.curve, 1, 'Красное море', redSea);
    label(east.curve, 0, 'ОАЭ', uae);
    label(east.curve, 1, 'Фуджейра', port);
    atext('Перегрузка на танкер', 540, 1196, load - .06, t, { size: 48, w: 500, col: sub });
  },
  sfx(add) {
    add(Wd('b1', 'красному') - .18, 'swell', .19, .83);
    add(Wd('b2', 'эмиратах'), 'tick', .14, .94);
    add(Wd('b2', 'фуджейра'), 'tick', .15, 1.08);
    add(Wd('b3', 'погрузить'), 'thud', .16, .94);
  },
});
