// Approximate island silhouette for the 3D illustration, in longitude and latitude.
const west = [
  [-5.72,50.07],[-5.46,50.23],[-5.07,50.40],[-4.61,50.53],[-4.54,50.92],[-4.22,51.18],
  [-3.55,51.24],[-3.12,51.21],[-2.69,51.55],[-3.22,51.47],[-3.81,51.58],[-4.29,51.54],
  [-4.58,51.75],[-5.12,51.68],[-5.28,51.87],[-4.93,52.01],[-4.46,52.12],[-4.09,52.41],
  [-4.05,52.76],[-4.48,52.82],[-4.80,52.83],[-4.62,53.00],[-4.29,53.04],[-4.14,53.26],
  [-3.67,53.32],[-3.18,53.25],[-3.03,53.43],[-3.01,53.62],[-3.20,53.91],[-2.88,54.08],
  [-3.24,54.19],[-3.59,54.54],[-3.38,54.88],[-3.89,54.86],[-4.18,54.73],[-4.35,54.68],
  [-4.67,54.83],[-5.13,54.63],[-5.03,54.95],[-4.72,55.23],[-4.86,55.57],[-4.55,55.93],
  [-4.94,55.95],[-5.24,56.14],[-5.49,55.87],[-5.73,55.30],[-5.80,55.60],[-5.62,55.99],
  [-5.39,56.35],[-5.42,56.65],[-5.81,56.62],[-5.95,56.71],[-5.66,56.95],[-5.89,57.19],
  [-5.60,57.47],[-5.80,57.59],[-5.56,57.81],[-5.34,57.91],[-5.48,58.15],[-5.18,58.37],
  [-5.02,58.60],[-4.70,58.53],[-4.51,58.52],[-4.23,58.57],[-3.94,58.55],[-3.36,58.61],
  [-3.04,58.64],
];

const eastAndSouth = [
  [-3.12,58.43],[-3.53,58.26],[-3.87,58.12],[-3.91,57.92],[-4.15,57.76],[-4.05,57.62],
  [-3.44,57.72],[-2.65,57.72],[-2.11,57.69],[-1.81,57.53],[-1.98,57.20],[-2.22,56.86],
  [-2.50,56.54],[-2.85,56.46],[-3.22,56.35],[-2.65,56.28],[-2.55,56.17],[-3.20,56.05],
  [-3.61,56.04],[-3.16,55.98],[-2.59,56.04],[-2.15,55.84],[-1.83,55.59],[-1.65,55.30],
  [-1.37,54.88],[-1.21,54.66],[-0.79,54.56],[-0.53,54.47],[-0.34,54.22],[0.09,53.91],
  [0.13,53.66],[-0.12,53.70],[0.21,53.55],[0.34,53.22],[0.15,52.93],[0.50,52.89],
  [0.79,52.96],[1.28,52.93],[1.65,52.79],[1.76,52.48],[1.62,52.13],[1.23,52.00],
  [1.14,51.84],[0.91,51.73],[0.67,51.54],[0.16,51.48],[0.87,51.36],[1.43,51.37],
  [1.38,51.18],[1.09,51.03],[0.93,50.89],[0.38,50.82],[0.08,50.73],[-0.21,50.80],
  [-0.66,50.74],[-1.20,50.77],[-1.55,50.75],[-1.97,50.57],[-2.40,50.60],[-2.80,50.69],
  [-3.29,50.64],[-3.65,50.24],[-4.13,50.34],[-4.61,50.31],[-4.83,50.20],[-5.18,50.02],
  [-5.19,49.96],[-5.59,50.04],
];

function toMap([lon, lat]) {
  return [(lon + 2.03) * .47, (lat - 54.4) * .54];
}

export const westCoast = west.map(toMap);
export const mapDepth = .17;

function relief(THREE, points, depth, face, edge) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: .035,
    bevelSize: .025,
    bevelSegments: 2,
  });
  geom.rotateX(-Math.PI / 2);
  const model = new THREE.Mesh(geom, [face, edge]);
  model.position.y = .05;
  model.castShadow = true;
  model.receiveShadow = true;
  return model;
}

export function makeBritain(THREE, MAT) {
  const face = MAT.ceramicWhite();
  const edge = MAT.aluminium();
  return relief(THREE, [...westCoast, ...eastAndSouth.map(toMap)], mapDepth, face, edge);
}

// A schematic inlet. Coordinates are in the map plane, not geographic units.
const bay = [
  [-2.15, .42],[-1.98, .56],[-1.82, .47],[-1.58, .56],[-1.39, .44],
  [-1.23, .10],[-1.14, -.24],[-.98, -.29],[-.92, -.60],[-.75, -.83],
  [-.57, -.97],[-.46, -.70],[-.28, -.79],[-.20, -.44],[-.03, -.51],
  [.09, -.14],[.19, .08],[.35, .02],[.48, .34],[.63, .53],[.83, .44],
  [1.00, .60],[1.18, .50],[1.32, .25],[1.53, .27],[1.70, .49],
  [1.84, .40],[2.02, .56],[2.15, .42],
];

export function makeBay(THREE, MAT) {
  return relief(THREE, [...bay, [2.15, 1.6], [-2.15, 1.6]], .12,
    MAT.ceramicWhite(), MAT.aluminium());
}

// At twice the model scale this bay is 6 m across and 5 m along each bank.
export const exampleBay = [[-1.5, 0], [0, 2], [1.5, 0]];

export function makeExampleBay(THREE, MAT) {
  return relief(THREE, [[-2.2, 0], ...exampleBay, [2.2, 0], [2.2, 2.65], [-2.2, 2.65]],
    .12, MAT.graphite(), MAT.aluminium());
}

// Walk the same contour with dividers of fixed span. Only the last step may be shorter.
export function rulerRoute(step) {
  const route = [bay[0]];
  let segment = 1;
  while (segment < bay.length) {
    const [px, py] = route.at(-1);
    const [bx, by] = bay[segment];
    if (Math.hypot(bx - px, by - py) <= step) {
      segment++;
      continue;
    }
    const [ax, ay] = bay[segment - 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const projection = (px - ax) * dx + (py - ay) * dy;
    const remaining = (ax - px) ** 2 + (ay - py) ** 2 - step ** 2;
    const u = (projection + Math.sqrt(projection ** 2 - lengthSq * remaining)) / lengthSq;
    route.push([ax + dx * u, ay + dy * u]);
  }
  route.push(bay.at(-1));
  return route;
}
