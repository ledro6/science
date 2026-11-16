import { THREE, MAT, Wd, P, lerp, eInOut, makeStage, defineScene, atext, line, dot, project } from '../../../engine.mjs';
import { frame } from '../../ep18/scenes/kit.mjs';

function dial(years) {
  const object = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(.64, .67, .14, 56), MAT.graphite());
  bezel.rotation.x = Math.PI / 2;
  bezel.castShadow = true;
  object.add(bezel);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.565, 48), MAT.ceramicBlack());
  face.position.z = .072;
  object.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.617, .018, 8, 56), MAT.aluminium());
  rim.position.z = .081;
  object.add(rim);
  const wheel = new THREE.Group();
  const peg = new THREE.BoxGeometry(.028, .09, .016);
  const pin = new THREE.Object3D();
  const ticks = new THREE.InstancedMesh(peg, MAT.aluminium(), years);
  for (let i = 0; i < years; i++) {
    const angle = i * Math.PI * 2 / years;
    pin.position.set(-.487 * Math.sin(angle), .487 * Math.cos(angle), .089);
    pin.rotation.z = angle;
    pin.updateMatrix();
    ticks.setMatrixAt(i, pin.matrix);
  }
  const marker = new THREE.Mesh(new THREE.ConeGeometry(.066, .19, 3), MAT.ceramicWhite());
  marker.position.set(0, .27, .105);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(.075, 18, 12), MAT.aluminium());
  hub.position.z = .088;
  wheel.add(ticks, marker, hub);
  object.add(wheel);
  return { object, wheel };
}

defineScene('cycles', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .45 });
    const discs = [dial(13), dial(17)];
    for (let i = 0; i < discs.length; i++) {
      const { object } = discs[i];
      object.position.set(i === 0 ? -.74 : .74, .95, 0);
      object.rotation.x = -.17;
      stage.root.add(object);
    }
    return { stage, discs };
  },
  update(t, s, { stage, discs }) {
    const reveal = P(t, s.start + .1, 1.3, eInOut);
    const join = P(t, Wd('c1', 'вместе') - .4, 1.4, eInOut);
    const { key, hemi } = stage.lights;
    key.position.set(lerp(-4, 5, reveal), 7, 5);
    key.intensity = lerp(.6, 2.45, reveal);
    hemi.intensity = lerp(.25, .6, reveal);
    discs[0].wheel.rotation.z = lerp(-1.6, 0, join);
    discs[1].wheel.rotation.z = lerp(1.18, 0, join);
    frame(stage.camera, [0, .95, 0], lerp(12.65, 12.0, reveal), lerp(-13, 6, reveal), 10, 540, 914);
  },
  draw2d(t, s, { stage: { ink, sub, accent, camera } }) {
    const coincidence = Wd('c1', 'вместе');
    const count = Wd('c2', 'двести');
    const titleOut = count - .42;
    atext('Два цикла', 540, 377, coincidence - .77, t, { size: 96, col: ink, out: titleOut });
    atext('совпали в 2024 году', 540, 459, Wd('c1', 'четвёртом') - .36, t, { size: 56, w: 500, col: sub, out: titleOut });
    atext('221 год', 540, 505, count, t, { size: 153, w: 700, col: accent, dur: .69, scale0: 1.105, dy: 26 });
    atext('до следующего совпадения', 540, 598, count + .26, t, { size: 48, w: 500, col: sub });
    const [a, y] = project(camera, -.74, 1.62, .12);
    const [b, y2] = project(camera, .74, 1.62, .12);
    const p = P(t, coincidence, .91, eInOut);
    dot(a, y, 3.5, ink, p * .8);
    line(a, y, lerp(a, b, p), lerp(y, y2, p), ink, p * .53, 1.55);
    dot(b, y2, 3.5, ink, p ** 3 * .8);
    const [aLabel, aY] = project(camera, -.74, .16, .14);
    const [bLabel, bY] = project(camera, .74, .16, .14);
    atext('13 лет', aLabel, aY, s.start + .25, t, { size: 45, col: ink, dy: 18 });
    atext('17 лет', bLabel, bY, s.start + .35, t, { size: 45, col: ink, dy: 18 });
  },
  sfx(add, s) {
    const count = Wd('c2', 'двести');
    add(s.start + .22, 'swell', .16, .76);
    add(Wd('c1', 'вместе'), 'click', .18, .88);
    add(count - 1.5, 'riser', .18);
    add(count, 'impact', .28, .91);
    add(count + .06, 'chime', .19, 1);
  },
});
