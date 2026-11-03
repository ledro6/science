// Герой обложки ep11: та же керамическая фигуристка, что в сценах (scenes/kit.mjs), крупно, на чёрном льду:
// руки раскинуты, на льду — следы лезвия.
import { makeSkater } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const ang = -.35;
  const sk = makeSkater(); sk.rotation.y = ang; sk.pose({ arms: .12, flare: .35 });
  // лёд: мягкая тень студийного пола (отражение на обложке не нужно: оно уходило бы под название закона)
  object.add(sk);
  // следы лезвия на льду
  [[.12, .3, 5.2, .28], [.22, 1.6, 4.4, .2], [.36, 2.8, 5.0, .14], [.6, .9, 3.6, .1], [.95, 3.6, 3.4, .07]].forEach(([r, a0, len, op]) => {
    const pts = [];
    for (let i = 0; i <= 96; i++) { const a = a0 + len * i / 96; pts.push(new THREE.Vector3(r * Math.cos(a), .005, r * Math.sin(a))); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: op }));
    l.renderOrder = 5; object.add(l);
  });
  return { object, cam: { az: 6, el: 7, dist: 7.0, target: [0, 1.04, 0], fov: 24 } };
}
