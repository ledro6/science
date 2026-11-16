import { makeCutCar, roundedBoxGeo } from '../a3/scenes/kit.mjs';

export default function (THREE, { MAT }) {
  const object = new THREE.Group();
  const car = makeCutCar({ dark: true });
  car.pend.visible = false;
  car.balloon.visible = false;
  car.scale.setScalar(.74);
  car.position.set(-1.35, 0, .2);
  car.spin(.4);
  object.add(car);

  const floorHeight = .29;
  const floors = 12;
  const slab = roundedBoxGeo(1.20, .255, .94, .033);
  const ceramic = MAT.ceramicWhite();
  for (let i = 0; i < floors; i++) {
    const floor = new THREE.Mesh(slab, ceramic);
    floor.position.set(1.54, floorHeight * (i + .5), 0);
    floor.castShadow = true;
    floor.receiveShadow = true;
    object.add(floor);
  }

  const height = floorHeight * floors;
  const accent = new THREE.LineBasicMaterial({ color: '#FF453A', toneMapped: false });
  const points = [
    [2.32, .04, .52], [2.32, height, .52],
    [2.24, .04, .52], [2.40, .04, .52],
    [2.24, height, .52], [2.40, height, .52],
  ].map(point => new THREE.Vector3(...point));
  object.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), accent));

  return { object, cam: { az: 14, el: 9, dist: 14.8, target: [-.23, 1.6, 0], fov: 24 } };
}
