// Герой обложки a3: та же машина в разрезе, что в сценах (стеклянный кузов с рёбрами, салон с сиденьями и рулём),
// вид сбоку 3/4 на длиннофокусной камере: груз у зеркала отклонён назад, шарик с гелием наклонён вперёд на 16°.
import { makeCutCar, THETA } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const car = makeCutCar({ dark: true });
  car.pend.pose(THETA); car.balloon.pose(THETA); car.spin(.4);
  object.add(car);
  return { object, cam: { az: 20, el: 7, dist: 11.2, target: [-.15, .8, 0], fov: 24 } };
}
