// Герой обложек m1: белая керамическая раковина-чаша, в воде — воронка против часовой.
// Те же раковина, вода и трассеры течения, что в сценах (scenes/kit.mjs); трассеры здесь — 3D-ленты
// на поверхности воды (кадр статичный, 2D-слоя у обложки нет).
import { makeBowl, makeWater, simTracers, funnelY, waterR, SINK } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const DEPTH = .3;
  const bowl = makeBowl(), water = makeWater();
  water.position.y = SINK.YW; water.scale.y = DEPTH;
  object.add(bowl, water);
  // снимок течения: частицы после нескольких секунд вращения против часовой
  const P = simTracers(5, 0, () => .5, { N: 130, seed: 11 });
  const pos = [], col = [], idx = [];
  const cw = new THREE.Color('#FFFFFF'), cb = new THREE.Color('#34363B');
  const at = (r, th) => new THREE.Vector3(r * Math.cos(th), SINK.YW + funnelY(r, DEPTH) + .01, -r * Math.sin(th));
  for (const p of P) {
    if (p.a < .2) continue;
    const L = Math.min(1.25, Math.max(.14, Math.abs(p.om) * .32)), n = 14, w = .011;
    const base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const k = i / n, th = p.th - L * (1 - k);
      const c = at(p.r, th), d = at(p.r, th + .01).sub(c).normalize();
      const nrm = new THREE.Vector3(-Math.cos(th), 0, Math.sin(th));      // наружу по радиусу (в плоскости воды)
      const ww = w * (.4 + .6 * k);
      const a = c.clone().addScaledVector(nrm, ww), b = c.clone().addScaledVector(nrm, -ww);
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const cc = cb.clone().lerp(cw, k * k * p.a);
      col.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b);
      if (i) { const q = base + (i - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      void d;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  const ribbons = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }));
  ribbons.renderOrder = 6;
  object.add(ribbons);
  bowl.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { object, cam: { az: -10, el: 36, dist: 7.0, target: [0, .5, 0], fov: 24 } };
}
