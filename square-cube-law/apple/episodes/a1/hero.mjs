// Герой обложек a1: тот же седан-силуэт, что в сценах (белая керамика, графитовый стеклянный купол, колёса со спицами),
// 3/4 спереди на длиннофокусной камере; над кузовом — тонкие светящиеся линии обтекания (как в хуке выпуска).
import { makeCar, streamPts } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const car = makeCar({ dark: true });
  car.spin(.5);
  object.add(car);
  // линии обтекания: тонкие трубки по линиям тока над крышей
  const lm = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .55, toneMapped: false, depthWrite: false });
  for (const [h, gap, z] of [[.8, .16, .35], [1.15, .3, -.2], [1.5, .46, .3], [1.95, .66, -.35]]) {
    const pts = streamPts(h, gap, -4.6, 4.2, 90).map(([x, y]) => new THREE.Vector3(x, y, z));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, .008, 6, false), lm);
    tube.castShadow = false; tube.renderOrder = 3;
    object.add(tube);
  }
  return { object, cam: { az: 46, el: 9, dist: 15.5, target: [.15, .55, 0], fov: 24 } };
}
