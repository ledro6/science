// Модели и физика выпуска m2 («Миф или нет: бутерброд маслом вниз»). Без зависимостей от движка:
// THREE передаётся параметром, поэтому файл подходит и сценам (через kit.mjs), и герою обложки (hero.mjs).
// Единицы: 1 = 1 дм (10 см). Стол 75 см → H = 7.5. Бутерброд ≈ 10 × 11 см, хлеб 1,4 см + масло.
// Оси: край стола идёт вдоль Z через x = 0, столешница — x < 0, бутерброд соскальзывает в +X
// и вращается по часовой (если смотреть с +Z): φ < 0, φ = −π — маслом вниз.

export const TOAST = { th: .14, bt: .035, hw: .52, g: 98 };   // толщина хлеба, масла; полуширина вдоль X; g в дм/с²
export const TABLE = { H: 7.5, top: .32, x0: -11, zd: 4.2, legX: -2.6, legZ: 3.4, legR: .13 };

// контур ломтика тостового хлеба: прямоугольное «тело» и шапка из двух долей
function toastShape(THREE, k = 1, dy = 0) {
  const s = new THREE.Shape(), p = (x, y) => [x * k, (y + dy) * k];
  s.moveTo(...p(-.42, -.55));
  s.lineTo(...p(.42, -.55));
  s.quadraticCurveTo(...p(.5, -.55), ...p(.5, -.47));
  s.lineTo(...p(.47, .16));
  s.bezierCurveTo(...p(.63, .27), ...p(.6, .56), ...p(.3, .57));
  s.bezierCurveTo(...p(.13, .58), ...p(.05, .54), ...p(0, .52));
  s.bezierCurveTo(...p(-.05, .54), ...p(-.13, .58), ...p(-.3, .57));
  s.bezierCurveTo(...p(-.6, .56), ...p(-.63, .27), ...p(-.47, .16));
  s.lineTo(...p(-.5, -.47));
  s.quadraticCurveTo(...p(-.5, -.55), ...p(-.42, -.55));
  return s;
}

// Материалы: мякиш — белая керамика, корка — светло-серая керамика, масло — графитовый глянец
// (монохром: масло читается тоном и бликом, а не жёлтым цветом).
export function toastMats(THREE, ghost = 0) {
  const o = ghost ? { transparent: true, opacity: ghost, depthWrite: false } : {};
  return {
    crumb: new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .5, clearcoat: .25, clearcoatRoughness: .4, ...o }),
    crust: new THREE.MeshPhysicalMaterial({ color: '#B4B4B8', roughness: .42, clearcoat: .4, clearcoatRoughness: .3, ...o }),
    butter: new THREE.MeshPhysicalMaterial({ color: '#4A4A4E', roughness: .22, metalness: .1, clearcoat: 1, clearcoatRoughness: .08, ...o }),
  };
}

// Бутерброд: группа с началом в центре хлеба; +Y — сторона с маслом. .butter — слой масла (для «разлёта»).
export function makeToast(THREE, { ghost = 0 } = {}) {
  const { th, bt } = TOAST, m = toastMats(THREE, ghost);
  const g = new THREE.Group();
  const bevel = .028;
  const bread = new THREE.ExtrudeGeometry(toastShape(THREE, .96), { depth: th - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 18 });
  bread.rotateX(-Math.PI / 2); bread.translate(0, -th / 2 + bevel, 0);
  // группы ExtrudeGeometry: 0 — лицевые грани (мякиш), 1 — бока и фаска (корка)
  const breadMesh = new THREE.Mesh(bread, [m.crumb, m.crust]);
  const bb = .014;
  const butterGeo = new THREE.ExtrudeGeometry(toastShape(THREE, .8, -.02), { depth: bt - 2 * bb, bevelEnabled: true, bevelThickness: bb, bevelSize: .03, bevelSegments: 3, curveSegments: 18 });
  butterGeo.rotateX(-Math.PI / 2); butterGeo.translate(0, th / 2 + bb - .004, 0);
  const butter = new THREE.Mesh(butterGeo, m.butter);
  g.add(breadMesh, butter);
  g.butter = butter; g.mats = m;
  if (!ghost) g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.setOpacity = a => {
    for (const k in m) { m[k].transparent = a < .999 || !!ghost; m[k].opacity = a; m[k].depthWrite = !ghost && a >= .999; }
    g.visible = a > .003;
  };
  return g;
}

// Плита со скруглёнными рёбрами (как roundedBox движка, но с разными сторонами)
export function slab(THREE, sx, sy, sz, r = .06, seg = 3) {
  const geo = new THREE.BoxGeometry(sx, sy, sz, seg * 2 + 2, seg * 2 + 2, seg * 2 + 2);
  const p = geo.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const hx = sx / 2 - r, hy = sy / 2 - r, hz = sz / 2 - r, cl = (x, a) => Math.max(-a, Math.min(a, x));
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(cl(v.x, hx), cl(v.y, hy), cl(v.z, hz));
    v.sub(c); if (v.lengthSq() > 1e-12) v.normalize().multiplyScalar(r); v.add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

// Стол: графитовая столешница (на светлой сцене — светло-серый алюминий) (край по x = 0) и алюминиевые ножки. setH(h) — высота стола (ножки тянутся).
export function makeTable(THREE, { dark = true } = {}) {
  const { top, x0, zd, legX, legZ, legR } = TABLE;
  const g = new THREE.Group();
  const topMat = new THREE.MeshPhysicalMaterial({ color: dark ? '#2E2E31' : '#C4C4C9', roughness: dark ? .34 : .5, metalness: .15, clearcoat: dark ? .8 : .3, clearcoatRoughness: .14 });
  const legMat = new THREE.MeshPhysicalMaterial({ color: '#C9CBCF', roughness: .3, metalness: .3, clearcoat: .6, clearcoatRoughness: .2 });
  const w = -x0;
  const slabM = new THREE.Mesh(slab(THREE, w, top, zd * 2, .07), topMat);
  const legGeo = new THREE.CylinderGeometry(legR, legR * .85, 1, 28); legGeo.translate(0, .5, 0);
  const legs = [];
  for (const z of [-legZ, legZ]) for (const x of [legX, x0 + 1.1]) { const l = new THREE.Mesh(legGeo, legMat); l.position.set(x, 0, z); legs.push(l); }
  g.add(slabM, ...legs);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.setH = h => {
    slabM.position.set(x0 / 2, h - top / 2, 0);
    for (const l of legs) l.scale.set(1, h - top + .01, 1);
  };
  g.setH(TABLE.H);
  g.topMat = topMat;
  return g;
}

// ---------- физика падения (упрощённая модель Мэтьюза) ----------
// Фаза 1: центр масс за краем на d, бутерброд поворачивается вокруг кромки (φ = −φ1·(τ/τ1)²), ещё касаясь её.
// Фаза 2: свободный полёт с постоянной угловой скоростью ω и небольшой горизонтальной скоростью соскальзывания.
// ω подобрана так, чтобы со стола 75 см бутерброд лёг ровно маслом вниз (φ = −π).
// Масштаб k — увеличенный бутерброд (для дальних планов), физика угла от него почти не зависит.
const rot = (a, b, f) => [a * Math.cos(f) - b * Math.sin(f), a * Math.sin(f) + b * Math.cos(f)];
export function fallSim({ H = TABLE.H, k = 1, d = .1, phi1 = .38, vx0 = 2.4, omega = null } = {}) {
  const { th, bt, hw, g } = TOAST;
  const hh = (th / 2 + bt) * k, a = d * k, b = th / 2 * k;     // полутолщина (с маслом), плечо от кромки
  const lowY = (y, f) => y - (Math.abs(Math.sin(f)) * hw * k + Math.abs(Math.cos(f)) * hh);
  function make(w) {
    const t1 = 2 * phi1 / w;
    const [rx, ry] = rot(a, b, -phi1);
    const [dx, dy] = rot(-b, a, -phi1);                  // dR/dφ · (a, b)
    const p1 = [rx, H + ry], v1 = [-w * dx + vx0, -w * dy];
    const pose = tau => {
      if (tau <= 0) return { x: a, y: H + b, phi: 0, landed: false, tip: 0 };
      if (tau < t1) { const f = -phi1 * (tau / t1) ** 2, [x, y] = rot(a, b, f); return { x: x + vx0 * .5 * tau * tau / t1, y: H + y, phi: f, landed: false, tip: tau / t1 }; }
      const q = tau - t1;
      return { x: p1[0] + vx0 * .5 * t1 + v1[0] * q, y: p1[1] + v1[1] * q - .5 * g * q * q, phi: -phi1 - w * q, landed: false, tip: 1 };
    };
    // момент касания пола
    let lo = t1, hi = 3;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2, p = pose(m); if (lowY(p.y, p.phi) > 0) lo = m; else hi = m; }
    return { pose, t1, tLand: lo };
  }
  let w = omega;
  if (w == null) {   // подбор ω: φ(tLand) = −π
    let lo = 2, hi = 20;
    for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2, s = make(m), f = s.pose(s.tLand).phi; if (f > -Math.PI) lo = m; else hi = m; }
    w = (lo + hi) / 2;
  }
  const s = make(w);
  const land = s.pose(s.tLand);
  const flat = Math.round(land.phi / Math.PI) * Math.PI;   // ложится на ближайшую сторону
  // после касания — короткое «доворачивание» до плоского положения и проскальзывание
  const at = tau => {
    if (tau < s.tLand) return s.pose(tau);
    const u = Math.min(1, (tau - s.tLand) / .06), e = u * (2 - u);
    const yf = (th / 2 + (Math.cos(flat) < 0 ? bt : 0)) * k;
    return { x: land.x + .25 * k * e, y: land.y + (yf - land.y) * e, phi: land.phi + (flat - land.phi) * e, landed: true, tip: 1 };
  };
  return { at, omega: w, tLand: s.tLand, t1: s.t1, landPhi: land.phi, flat, k };
}
