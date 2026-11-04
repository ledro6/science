// Герой обложки № 14: та же скорая, что в сценах (белая керамика, графитовый купол, балка-мигалка),
// 3/4 спереди на длиннофокусной камере; от мигалки по полу расходятся кольца звуковых волн:
// спереди сжаты, сзади растянуты (тот же шейдер, что в хуке).
import { makeAmbulance, makeWaveField } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const car = makeAmbulance({ dark: true });
  car.spin(.6); car.flash(.1, 1);
  const V = 1.7, CS = 3.4, DT = .3, SX = -.45;
  const R = [];
  for (let k = 1; k <= 11; k++) {
    const age = k * DT - .12;
    R.push([SX - V * age, 0, CS * age, Math.pow(1 - age / 3.5, 1.2) * .95]);
  }
  const field = makeWaveField(30, { lw: 2.2, fade: .3 });
  field.set(R, 1, -.6, 0);
  object.add(car, field);
  return { object, cam: { az: 34, el: 21, dist: 18.5, target: [.1, .45, 0], fov: 24 } };
}
