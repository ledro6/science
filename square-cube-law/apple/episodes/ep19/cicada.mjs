// Neutral product model shared by the hook, root cutaway and cover.
export function makeCicada(THREE, MAT, nymph = false) {
  const insect = new THREE.Group();
  const shell = nymph ? MAT.aluminium() : MAT.graphite();
  const dark = MAT.ceramicBlack();
  const sphere = new THREE.SphereGeometry(1, 28, 18);
  const point = (x, y, z) => new THREE.Vector3(x, y, z);
  const ellipsoid = (material, x, y, z, a, b, c) => {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(a, b, c);
    mesh.castShadow = true;
    insect.add(mesh);
  };
  const rod = (from, to, width, material) => {
    const a = point(...from), b = point(...to);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(width * .67, width, a.distanceTo(b), 10), material);
    mesh.position.copy(a).lerp(b, .5);
    mesh.quaternion.setFromUnitVectors(point(0, 1, 0), b.sub(a).normalize());
    insect.add(mesh);
  };
  ellipsoid(shell, 0, .36, -.34, .29, .25, .74);
  for (let i = 0; i < 5; i++) {
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(.271 - .018 * i, .012, 7, 28), shell);
    ridge.position.set(0, .36, -.33 - .116 * i);
    ridge.scale.y = .84;
    insect.add(ridge);
  }
  ellipsoid(shell, 0, .39, .3, .36, .28, .45);
  ellipsoid(shell, 0, .39, .68, .4, .23, .24);

  const wings = [];
  const wing = new THREE.Shape();
  wing.moveTo(.05, 0);
  wing.bezierCurveTo(.42, .18, .81, .64, .88, 1.43);
  wing.bezierCurveTo(.96, 1.98, .68, 2.06, .48, 1.86);
  wing.bezierCurveTo(.22, 1.66, .13, .83, .05, 0);
  const wingGeometry = new THREE.ShapeGeometry(wing, 24);
  wingGeometry.rotateX(-Math.PI / 2);
  const outline = new THREE.BufferGeometry().setFromPoints(wing.getPoints(26).map(p => point(p.x, .004, -p.y)));
  const veinPaths = [
    [[.06, 0, 0], [.37, 0, -.58], [.54, 0, -1.2], [.68, 0, -1.88]],
    [[.18, 0, -.36], [.55, 0, -.67], [.71, 0, -1.13], [.83, 0, -1.53]],
    [[.32, 0, -.78], [.23, 0, -.95], [.29, 0, -1.17]],
    [[.52, 0, -1.08], [.74, 0, -1.09], [.84, 0, -1.35]],
    [[.58, 0, -1.4], [.41, 0, -1.4], [.4, 0, -1.56]],
    [[.68, 0, -1.61], [.81, 0, -1.69], [.75, 0, -1.84]],
  ];
  const veins = [];
  for (const path of veinPaths) {
    for (let i = 1; i < path.length; i++) veins.push(point(...path[i - 1]), point(...path[i]));
  }
  const veinGeometry = new THREE.BufferGeometry().setFromPoints(veins);
  const edge = new THREE.LineBasicMaterial({ color: '#f3f3f3', transparent: true, opacity: .47, depthWrite: false });
  const vein = new THREE.LineBasicMaterial({ color: '#e7e7e7', transparent: true, opacity: .35, depthWrite: false });
  const glass = MAT.glass(.36);

  for (const side of [-1, 1]) {
    ellipsoid(dark, side * .31, .48, .76, .142, .158, .154);
    rod([side * .1, .52, .84], [side * .24, .59, 1.13], .012, shell);
    for (let i = 0; i < 3; i++) {
      const z = .51 - i * .33;
      const knee = [side * (.57 + i * .055), .245, z - .12 + i * .09];
      rod([side * .22, .33, z], knee, nymph && i === 0 ? .084 : .044, shell);
      rod(knee, [side * (.7 + i * .07), .035, z + .17 - i * .18], .026, shell);
    }
    if (nymph) continue;
    const pair = new THREE.Group();
    pair.position.set(side * .19, .56, .43);
    pair.scale.x = side;
    const innerWing = new THREE.Mesh(wingGeometry, glass);
    innerWing.scale.set(.68, 1, .78);
    innerWing.rotation.y = -.13;
    const upperWing = new THREE.Mesh(wingGeometry, glass);
    upperWing.position.y = .023;
    const upperOutline = new THREE.Line(outline, edge);
    const upperVeins = new THREE.LineSegments(veinGeometry, vein);
    upperOutline.position.y = upperVeins.position.y = .028;
    innerWing.renderOrder = 1;
    upperWing.renderOrder = 2;
    upperOutline.renderOrder = upperVeins.renderOrder = 3;
    pair.add(innerWing, upperWing, upperOutline, upperVeins);
    wings.push({ pair, side });
    insect.add(pair);
  }
  const spread = amount => {
    for (const { pair, side } of wings) {
      pair.rotation.y = side * (.26 - .76 * amount);
      pair.rotation.z = side * (.045 + .27 * amount);
    }
  };
  spread(.12);
  return { insect, spread };
}
