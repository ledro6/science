// 3D-герой обложки ep2: графитовый слон и крошечная керамическая мышь на переднем плане.
export default function (THREE, { MAT, shadowsOn, models }) {
  const object = new THREE.Group();
  const ele = models.makeElephant(MAT.graphite());
  ele.pose({ flap: .15, trunk: .35 });
  ele.position.set(.55, 0, -1.2); ele.rotation.y = Math.PI - .35;
  const mouse = models.makeMouse(MAT.ceramicWhite());
  mouse.pose({ wag: 1.2 });
  mouse.scale.setScalar(.5); mouse.position.set(-.75, 0, .55); mouse.rotation.y = .45;
  object.add(ele, mouse);
  shadowsOn(object);
  return { object, cam: { az: 24, el: 7, dist: 11.5, target: [-.1, 1.75, 0], fov: 24 } };
}
