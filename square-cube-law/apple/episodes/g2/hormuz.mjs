// Simplified coastline from the EIA chokepoint map; positions are illustrative, not navigation data.
const north = [
  [49.4,30.45], [49.98,30.03], [50.82,28.94], [51.27,28.07], [52.60,27.48],
  [53.83,26.79], [54.53,26.54], [55.38,26.57], [55.88,26.96], [56.18,27.17],
  [56.63,27.14], [57.10,26.69], [57.31,26.10], [57.82,25.69], [58.82,25.57],
  [60.38,25.24], [60.38,30.7], [49.4,30.7],
];
const south = [
  [49.4,27.4], [50.15,26.76], [50.18,26.21], [50.65,25.84], [50.78,25.37],
  [50.91,25.42], [51.24,26.12], [51.61,25.99], [51.61,24.61], [51.73,24.21],
  [52.60,24.16], [53.49,24.14], [54.50,24.55], [55.27,25.27], [55.74,25.81],
  [56.12,26.08], [56.28,26.40], [56.46,26.35], [56.54,26.05], [56.35,25.49],
  [56.39,24.98], [56.75,24.53], [57.47,23.89], [58.51,23.62], [59.82,22.53],
  [60.38,22.32], [60.38,21.9], [49.4,21.9],
];
const qeshm = [[55.24,26.70], [55.66,26.75], [56.08,26.84], [56.36,26.96], [56.22,27.00], [55.75,26.89], [55.33,26.79]];
const route = [[50.4,27.48], [52.08,26.60], [54.35,26.02], [55.84,26.39], [56.55,26.57], [56.94,26.22], [57.65,25.62], [59.66,24.88]];
export const mapPoint = (lon, lat, y = .19) => [(lon - 55) * .37, y, (26.2 - lat) * .42];

export function makeChart(THREE, dark) {
  const root = new THREE.Group();
  const ocean = new THREE.MeshPhysicalMaterial({ color: dark ? '#141418' : '#A4A6AC', roughness: .47, metalness: .11 });
  const coast = new THREE.MeshPhysicalMaterial({ color: dark ? '#53545A' : '#EBEBEB', roughness: .53, metalness: .15 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(4.16, .17, 3.81), ocean);
  plate.position.set(-.04, .09, -.043);
  plate.receiveShadow = true;
  root.add(plate);
  for (const coastLine of [north, south, qeshm]) {
    const outline = new THREE.Shape();
    for (const [i, [lon, lat]] of coastLine.entries()) {
      const [x, , z] = mapPoint(lon, lat);
      if (i === 0) outline.moveTo(x, -z);
      else outline.lineTo(x, -z);
    }
    outline.closePath();
    const geometry = new THREE.ExtrudeGeometry(outline, { depth: .10, bevelEnabled: false });
    const mesh = new THREE.Mesh(geometry, coast);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = .176;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  const curve = new THREE.CatmullRomCurve3(route.map(([lon, lat]) => new THREE.Vector3(...mapPoint(lon, lat, .184))));
  const path = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, .012, 5, false),
    new THREE.MeshBasicMaterial({ color: dark ? '#ECECF0' : '#343439', transparent: true, opacity: .85 }),
  );
  root.add(path);
  return { root, curve, path };
}

export function makeTanker(THREE, dark) {
  const ship = new THREE.Group();
  const hull = new THREE.Shape();
  hull.moveTo(-.5, -.135);
  hull.lineTo(.26, -.135);
  hull.quadraticCurveTo(.41, -.12, .55, 0);
  hull.quadraticCurveTo(.41, .12, .26, .135);
  hull.lineTo(-.50, .135);
  hull.quadraticCurveTo(-.53, .13, -.53, .09);
  hull.lineTo(-.53, -.09);
  hull.closePath();
  const deckMaterial = new THREE.MeshPhysicalMaterial({ color: dark ? '#C8C8CD' : '#5A5A60', roughness: .35, metalness: .20, clearcoat: .3 });
  const bodyMaterial = new THREE.MeshPhysicalMaterial({ color: dark ? '#2C2C30' : '#2F3034', roughness: .41, metalness: .20 });
  const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(hull, { depth: .1, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 2 }), [deckMaterial, bodyMaterial]);
  deck.rotation.x = -Math.PI / 2;
  ship.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(.19, .13, .18), deckMaterial);
  cabin.position.set(-.35, .185, 0);
  ship.add(cabin);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(.06, .046, .185), bodyMaterial);
  bridge.position.set(-.256, .22, 0);
  ship.add(bridge);
  const hatch = new THREE.BoxGeometry(.14, .024, .166);
  for (const x of [-.19, -.02, .15, .32]) {
    const mesh = new THREE.Mesh(hatch, bodyMaterial);
    mesh.position.set(x, .13, 0);
    ship.add(mesh);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .16, 8), deckMaterial);
  mast.position.set(-.39, .302, 0);
  ship.add(mast);
  ship.traverse(item => { if (item.isMesh) item.castShadow = true; });
  return ship;
}

export function placeTanker(ship, curve, u) {
  ship.position.copy(curve.getPointAt(u));
  const tangent = curve.getTangentAt(u);
  ship.rotation.y = -Math.atan2(tangent.z, tangent.x);
}
