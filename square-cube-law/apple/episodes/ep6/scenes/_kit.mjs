// Общие детали выпуска ep6 (число Рейнольдса): керамическая бактерия со жгутиком-спиралью, кадрирование камеры,
// линии тока вокруг тела. Модуль не зависит от движка (THREE — параметром), его использует и hero.mjs обложки.

export const TAU = Math.PI * 2;
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const bump = (t, c, w) => { const x = clamp01(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };

// Камера на орбите; цель выводится в экранную точку (sx, sy) кадра 1080×1920 через view offset.
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}

// Геометрия жгутика: короткий «крючок» от тела, затем спираль, радиус которой плавно нарастает.
// Ось — локальная −X, начало в 0. len — длина, R — радиус спирали, turns — число витков.
export function helixGeometry(THREE, { len = 2.6, R = .16, turns = 3.2, tube = .028, seg = 260, rseg = 8 } = {}) {
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const s = i / 120, r = R * smooth(0, .22, s);
    const a = TAU * turns * s;
    pts.push(new THREE.Vector3(-len * s, r * Math.cos(a), r * Math.sin(a)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, tube, rseg, false);
}

// Бактерия: капсула вдоль +X (длина ≈ 1.6, толщина .64), жгутик за кормой вдоль −X.
// spin(phase) — вращение жгутика вокруг оси (бегущая волна спирали), тело чуть вращается навстречу.
export function makeBacterium(THREE, mat, { flagMat = null, len = 2.7, R = .2, turns = 3.0, tube = .036 } = {}) {
  const g = new THREE.Group();
  const bodyG = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .95, 12, 40), mat);
  body.rotation.z = Math.PI / 2;
  bodyG.add(body);
  // тонкий поясок (деление клетки) — чтобы вращение тела читалось на свету
  const band = new THREE.Mesh(new THREE.TorusGeometry(.321, .006, 6, 64), mat);
  band.rotation.y = Math.PI / 2; band.position.x = .08;
  bodyG.add(band);
  g.add(bodyG);
  const flag = new THREE.Group();
  flag.position.x = -.74;
  const fm = new THREE.Mesh(helixGeometry(THREE, { len, R, turns, tube }), flagMat || mat);
  flag.add(fm);
  // «мотор» в корме — маленькая втулка
  const hub = new THREE.Mesh(new THREE.SphereGeometry(.07, 20, 14), flagMat || mat);
  hub.position.x = .02; flag.add(hub);
  g.add(flag);
  g.body = bodyG; g.flag = flag; g.flagLen = len;
  g.spin = ph => { flag.rotation.x = ph; bodyG.rotation.x = -ph * .12; };
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// Линия тока (обтекание тела-эллипса с полуосями ax, ay) в системе тела, поток вдоль +X.
// psi = y'(1 − 1/r'²) — классическое обтекание круга в растянутых координатах; ищем y' по x' для заданного c.
export function streamline(c, ax, ay, x0, x1, n = 90) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const xs = x0 + (x1 - x0) * i / n, xp = xs / ax;
    // y' > 0 ветка: f(y) = y(1 − 1/(x²+y²)) − |c| монотонна при y ≥ ~1 снаружи тела
    let lo = Math.max(0, Math.sqrt(Math.max(0, 1 - xp * xp))), hi = Math.abs(c) + 2;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2, f = m * (1 - 1 / (xp * xp + m * m)) - Math.abs(c); f > 0 ? hi = m : lo = m; }
    pts.push([xs, Math.sign(c || 1) * (lo + hi) / 2 * ay]);
  }
  return pts;
}
