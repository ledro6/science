// Общие детали выпуска ep9 (теорема о причёсывании ежа): касательные поля на сфере, «волоски» и штрихи ветра
// через InstancedMesh, кадрирование камеры. Модуль не зависит от движка (THREE — параметром),
// его использует и hero.mjs обложки.

export const TAU = Math.PI * 2;
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const bump = (t, c, w) => { const x = clamp01(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export function rand(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- векторы как массивы [x, y, z] ----------
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
export const scl3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const len3 = a => Math.hypot(a[0], a[1], a[2]);
// сферическая интерполяция единичных векторов
export function slerp3(a, b, k) {
  const c = Math.max(-1, Math.min(1, dot3(a, b))), w = Math.acos(c);
  if (w < 1e-5) return a.slice();
  const s = Math.sin(w), ka = Math.sin((1 - k) * w) / s, kb = Math.sin(k * w) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}
// точка на сфере по широте/долготе (градусы): ось Y — полюс, долгота 0 смотрит в +Z
export function ll(lat, lon) {
  const a = lat * Math.PI / 180, b = lon * Math.PI / 180;
  return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)];
}

// Равномерные точки на сфере (спираль Фибоначчи) с лёгким дрожанием
export function fibSphere(n, seed = 1, jitter = .35) {
  const R = rand(seed), out = [], ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - 2 * (i + .5 + (R() - .5) * jitter) / n, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * ga + (R() - .5) * jitter * .5;
    out.push([r * Math.cos(a), y, r * Math.sin(a)]);
  }
  return out;
}
// Точки в «шапке» радиуса cap (рад) вокруг c — плотнее к центру не делаем: равномерно по площади
export function capPoints(n, c, cap, seed = 7) {
  const R = rand(seed), F = frameOf(c), out = [], z0 = Math.cos(cap);
  for (let i = 0; i < n; i++) {
    const z = 1 - (1 - z0) * (i + R()) / n, r = Math.sqrt(1 - z * z), a = i * 2.39996 + R() * .3;
    out.push(norm3(add3(add3(scl3(F.c, z), F.e1, r * Math.cos(a)), F.e2, r * Math.sin(a))));
  }
  return out;
}

// Ортонормированный базис (c, e1, e2) вокруг направления c; hint задаёт e1
export function frameOf(c, hint = [0, 1, 0]) {
  c = norm3(c);
  let h = hint; if (Math.abs(dot3(h, c)) > .97) h = [1, 0, 0];
  const e1 = norm3(add3(h, c, -dot3(h, c))), e2 = cross3(c, e1);
  return { c, e1, e2 };
}

// Касательное поле на сфере с ЕДИНСТВЕННЫМ нулём в точке F.c (индекс 2): перенос постоянного поля
// с плоскости обратной стереографической проекцией из полюса c. В антиподе −c поле равно e1.
// swirl — поворот векторов вокруг нормали вблизи нуля (плавная функция расстояния → поле остаётся непрерывным).
// Возвращает { v: единичный касательный вектор, d: угловое расстояние до нуля }.
export function dipole(p, F, swirl = 0, swirlW = .7) {
  const x = dot3(p, F.e1), y = dot3(p, F.e2), z = dot3(p, F.c), m = 1 - z;
  let a = 2 * (m * m + y * y - x * x), b = -4 * x * y, cc = 4 * x * m;
  let v = [F.e1[0] * a + F.e2[0] * b + F.c[0] * cc, F.e1[1] * a + F.e2[1] * b + F.c[1] * cc, F.e1[2] * a + F.e2[2] * b + F.c[2] * cc];
  const d = Math.acos(Math.max(-1, Math.min(1, z)));
  // убрать нормальную составляющую (численная чистота) и нормировать
  v = add3(v, p, -dot3(v, p));
  const L = len3(v);
  if (L < 1e-9) v = add3(F.e1, p, -dot3(F.e1, p));
  v = norm3(v);
  if (swirl) {
    const al = swirl * (1 - smooth(0, swirlW, d)), w = cross3(p, v), ca = Math.cos(al), sa = Math.sin(al);
    v = [v[0] * ca + w[0] * sa, v[1] * ca + w[1] * sa, v[2] * ca + w[2] * sa];
  }
  return { v, d };
}

// ---------- InstancedMesh-«волоски» ----------
// Конус-волосок вдоль +Y от 0 до 1 (у основания толще). pts — точки на поверхности (единичные нормали или
// [p, n] через opts.normals), set(i, pos, dir, len, thick) — выставить один волосок.
export function makeHairs(THREE, { n, mat, r0 = .012, r1 = .0035, seg = 5 }) {
  const geo = new THREE.CylinderGeometry(r1, r0, 1, seg, 1, true); geo.translate(0, .5, 0);
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pv = new THREE.Vector3(), Sv = new THREE.Vector3(), Dv = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  mesh.setHair = (i, pos, dir, len, thick = 1) => {
    Dv.set(dir[0], dir[1], dir[2]).normalize(); Q.setFromUnitVectors(UP, Dv);
    Pv.set(pos[0], pos[1], pos[2]); Sv.set(thick, Math.max(len, 1e-4), thick);
    M.compose(Pv, Q, Sv); mesh.setMatrixAt(i, M);
  };
  return mesh;
}

// Пушистое (непричёсанное) направление: нормаль + случайный наклон в касательной плоскости
export function fluffDirs(pts, seed = 3, amt = .55) {
  const R = rand(seed);
  return pts.map(p => {
    const F = frameOf(p, [R() - .5, R() - .5, R() - .5]);
    const a = R() * TAU, k = amt * (.4 + .6 * R());
    return norm3(add3(p, add3(scl3(F.e1, Math.cos(a)), F.e2, Math.sin(a)), k));
  });
}
// Причёсанный волосок: от нормали к касательной v на угол phi
export const combDir = (p, v, phi) => norm3(add3(scl3(p, Math.cos(phi)), v, Math.sin(phi)));
export const mixDir = (a, b, k) => norm3([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]);

// Шар с волосками, причёсанный полем dipole (одна макушка в F.c). Для обложки и как образец.
export function hairyBall(THREE, { R = 1, n = 2600, len = .2, ballMat, hairMat, pole = [0, .6, .8], hint = [1, 0, 0], swirl = 1.2, phiMax = 1.22, seed = 5 }) {
  const grp = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 36), ballMat);
  const pts = fibSphere(n, seed), hairs = makeHairs(THREE, { n, mat: hairMat });
  const F = frameOf(pole, hint), Rn = rand(seed + 11);
  pts.forEach((p, i) => {
    const { v, d } = dipole(p, F, swirl);
    const phi = phiMax * smooth(.04, .5, d) + (Rn() - .5) * .12;
    const l = len * (.85 + .3 * Rn()) * (1 + .25 * (1 - smooth(0, .4, d)));
    hairs.setHair(i, scl3(p, R * .995), combDir(p, v, phi), l, 1);
  });
  hairs.instanceMatrix.needsUpdate = true;
  grp.add(ball, hairs);
  return { grp, ball, hairs, F };
}

// Камера на орбите; цель выводится в экранную точку (sx, sy) кадра 1080×1920 через view offset.
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.up.set(0, 1, 0); cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}
// Камера в точке pos смотрит на target; target выводится в (sx, sy)
export function lookFrom(cam, pos, target, sx = 540, sy = 960, up = [0, 1, 0]) {
  cam.position.set(pos[0], pos[1], pos[2]); cam.up.set(up[0], up[1], up[2]);
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}
