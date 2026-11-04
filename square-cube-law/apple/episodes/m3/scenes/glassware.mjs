// Модели выпуска m3 («Миф или нет: эффект Мпембы»). Без зависимостей от движка:
// THREE передаётся параметром, поэтому файл подходит и сценам (через kit.mjs), и герою обложки (hero.mjs).
// Единицы: 1 = 1 дм (10 см). Стакан ≈ 7 см в диаметре и 10 см высотой.
// Стекло — полупрозрачная оболочка без transmission (бюджет программного рендера) + светлые кольца кромки и дна.

export const GLASS = { r0: .32, r1: .36, h: 1.0, bt: .07 };      // радиус у дна и у кромки, высота, толщина дна

function mulberry(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const lerp = (a, b, t) => a + (b - a) * t;
const frac = x => x - Math.floor(x);

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

// мягкое пятно (пар, иней)
let _puff = null;
function puffTex(THREE) {
  if (_puff) return _puff;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _puff = new THREE.CanvasTexture(c); _puff.colorSpace = THREE.SRGBColorSpace; return _puff;
}
// иней: белые кристаллы-крапинки, гуще у дна
let _frost = null;
function frostTex(THREE) {
  if (_frost) return _frost;
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d'), R = mulberry(7);
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {
    const x = R() * 512, y = Math.pow(R(), .7) * 512, s = .6 + R() * 2.2;
    g.fillStyle = `rgba(255,255,255,${(.25 + R() * .6) * (.45 + .55 * y / 512)})`;
    g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
  }
  // тонкие «иголки» кристаллов
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
  for (let i = 0; i < 420; i++) {
    const x = R() * 512, y = Math.pow(R(), .6) * 512, a = R() * Math.PI, l = 3 + R() * 9;
    g.beginPath(); g.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // вертикальная вуаль: лёгкая белая дымка
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, 'rgba(255,255,255,.08)'); gr.addColorStop(1, 'rgba(255,255,255,.3)');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  _frost = new THREE.CanvasTexture(c); _frost.colorSpace = THREE.SRGBColorSpace;
  _frost.wrapS = THREE.RepeatWrapping; _frost.repeat.set(2, 1); return _frost;
}

export const innerR = y => { const { r0, r1, h, bt } = GLASS; return lerp(r0 - .028, r1 - .022, (y - bt) / (h - bt)) - .006; };

// Стакан с водой. .setLevel(y) — уровень воды (от 0), .setIce(f) — 0 вода … 1 лёд, .setOpacity(a), .setFrost(a) — иней снаружи.
export function makeGlass(THREE, { paper = false } = {}) {
  const { r0, r1, h, bt } = GLASS;
  const g = new THREE.Group();
  const prof = [[0, 0], [r0 - .03, 0], [r0, .03], [r1, h - .01], [r1 - .004, h], [r1 - .02, h], [r0 - .028, bt + .02], [r0 - .05, bt], [0, bt]].map(([x, y]) => new THREE.Vector2(x, y));
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, transparent: true, opacity: paper ? .22 : .16, depthWrite: false, clearcoat: 1, clearcoatRoughness: .04, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), glassMat);
  shell.renderOrder = 3;
  // кромка и дно — светлые кольца (читаются как рёбра стекла)
  const edgeMat = new THREE.MeshBasicMaterial({ color: paper ? '#8E8E93' : '#FFFFFF', transparent: true, opacity: paper ? .55 : .5, depthWrite: false });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r1 - .011, .009, 8, 96), edgeMat); rim.rotation.x = Math.PI / 2; rim.position.y = h - .004; rim.renderOrder = 4;
  const foot = new THREE.Mesh(new THREE.TorusGeometry(r0 - .012, .012, 8, 96), edgeMat); foot.rotation.x = Math.PI / 2; foot.position.y = .015; foot.renderOrder = 4;
  // толстое дно — чуть плотнее стенок
  const baseMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .1, transparent: true, opacity: paper ? .3 : .22, depthWrite: false, clearcoat: 1 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r0 - .03, r0 - .035, bt - .01, 64), baseMat); base.position.y = bt / 2; base.renderOrder = 2;
  // вода: цилиндр, верхние вершины которого переставляются на уровень
  const wGeo = new THREE.CylinderGeometry(1, 1, 1, 64, 1, false);
  const wp = wGeo.attributes.position, wTop = [], wBase = [];
  for (let i = 0; i < wp.count; i++) { wTop.push(wp.getY(i) > 0); wBase.push([wp.getX(i), wp.getZ(i)]); }
  const water = new THREE.Mesh(wGeo, new THREE.MeshPhysicalMaterial({ color: paper ? '#AEB4BC' : '#8D939C', roughness: .12, clearcoat: 1, clearcoatRoughness: .05, transparent: true, opacity: .62, depthWrite: false }));
  water.renderOrder = 1;
  const WATER = new THREE.Color(paper ? '#AEB4BC' : '#8D939C'), ICE = new THREE.Color(paper ? '#E4E7EB' : '#EEF1F4');
  // иней снаружи
  const frost = new THREE.Mesh(new THREE.CylinderGeometry(r1 + .006, r0 + .008, h - .03, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', map: frostTex(THREE), transparent: true, opacity: 0, depthWrite: false, roughness: .9 }));
  frost.position.y = h / 2; frost.renderOrder = 5; frost.visible = false;
  g.add(base, water, shell, rim, foot, frost);
  shell.castShadow = true;
  g.level = .8;
  g.setLevel = L => {
    g.level = L;
    for (let i = 0; i < wp.count; i++) {
      const y = wTop[i] ? L : bt, r = innerR(y), [bx, bz] = wBase[i];
      wp.setXYZ(i, bx * r, y, bz * r);
    }
    wp.needsUpdate = true; wGeo.computeBoundingSphere();
  };
  g.setIce = f => {
    const m = water.material;
    m.color.copy(WATER).lerp(ICE, f);
    m.roughness = lerp(.12, .55, f); m.clearcoat = lerp(1, .3, f); m.opacity = lerp(.62, .94, f);
    m.depthWrite = f > .5;
  };
  g.setOpacity = a => {
    glassMat.opacity = (paper ? .22 : .16) * a; edgeMat.opacity = (paper ? .55 : .5) * a; baseMat.opacity = (paper ? .3 : .22) * a;
    water.material.opacity = Math.min(water.material.opacity, a);
    g.visible = a > .003;
  };
  g.setFrost = a => { frost.material.opacity = a; frost.visible = a > .003; };
  g.setLevel(.8); g.setIce(0);
  g.water = water; g.mats = { glassMat, edgeMat, baseMat };
  return g;
}

// Пар: лёгкие клубы-спрайты, поднимаются и расплываются. .set(t, a) — чистая функция времени.
export function makeSteam(THREE, { n = 16, color = '#FFFFFF', op = .3, seed = 3, height = 1.5, spread = .18 } = {}) {
  const g = new THREE.Group(), R = mulberry(seed), P = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.SpriteMaterial({ map: puffTex(THREE), color, transparent: true, opacity: 0, depthWrite: false });
    const s = new THREE.Sprite(m); s.renderOrder = 6; g.add(s);
    P.push({ s, off: i / n + R() * .04, sp: .28 + R() * .1, ph: R() * 6.3, x0: (R() - .5) * .3, z0: (R() - .5) * .3, k: .7 + R() * .6 });
  }
  g.set = (t, a = 1) => {
    for (const p of P) {
      const u = frac(t * p.sp + p.off);
      const sway = Math.sin(u * 3.4 + p.ph + t * .6) * spread * (.3 + u);
      p.s.position.set(p.x0 * (1 - u * .4) + sway, .05 + u * height, p.z0 + Math.cos(u * 2.7 + p.ph) * spread * .5 * u);
      const sc = (.22 + u * .62) * p.k;
      p.s.scale.set(sc * .85, sc * 1.25, 1);
      p.s.material.opacity = a * op * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 1.4;
      p.s.visible = p.s.material.opacity > .003;
    }
  };
  g.set(0, 0);
  return g;
}

// Пузырьки растворённого газа внутри стакана. .set(t, amount 0..1, level)
export function makeBubbles(THREE, { n = 46, seed = 5, color = '#FFFFFF' } = {}) {
  const geo = new THREE.SphereGeometry(1, 12, 8);
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: .1, clearcoat: 1, transparent: true, opacity: .75, depthWrite: false });
  const im = new THREE.InstancedMesh(geo, mat, n); im.renderOrder = 2; im.frustumCulled = false;
  const R = mulberry(seed), B = [];
  for (let i = 0; i < n; i++) B.push({ a: R() * 6.283, r: Math.sqrt(R()) * .8, sp: .25 + R() * .3, off: R(), s: .012 + R() * .018, rank: R() });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  im.set = (t, amount = 1, level = .8) => {
    const { bt } = GLASS;
    B.forEach((b, i) => {
      const u = frac(t * b.sp + b.off), y = bt + .03 + u * (level - bt - .05), rr = b.r * innerR(y) * .92;
      const on = b.rank < amount ? 1 : 0, k = on * b.s * (.7 + .6 * u) * Math.min(1, (1 - u) * 8);
      V.set(Math.cos(b.a + u * .6) * rr, y, Math.sin(b.a + u * .6) * rr); S.set(k, k, k);
      M.compose(V, Q, S); im.setMatrixAt(i, M);
    });
    im.instanceMatrix.needsUpdate = true;
  };
  im.set(0, 0);
  return im;
}

// Термометр: стеклянная трубка, графитовый столбик и колба; начало координат — центр колбы.
export function makeThermo(THREE, { L = 1.55, paper = false } = {}) {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, L, 20), new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, clearcoat: 1, transparent: true, opacity: paper ? .45 : .3, depthWrite: false }));
  tube.position.y = L / 2; tube.renderOrder = 4;
  const ink = new THREE.MeshPhysicalMaterial({ color: paper ? '#2C2C2E' : '#D8D8DC', roughness: .25, clearcoat: 1 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, 1, 10), ink); col.renderOrder = 3;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.045, 24, 16), ink);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.028, 16, 10), tube.material); cap.position.y = L; cap.renderOrder = 4;
  g.add(tube, col, bulb, cap);
  g.setCol = f => { const l = .1 + f * (L - .3); col.scale.y = l; col.position.y = l / 2; };
  g.setCol(.4);
  return g;
}

// Минималистичная морозилка: белый керамический корпус, графитовая камера, открытая дверь на петле справа.
export const FREEZER = { W: 2.5, H: 1.62, D: 1.5, t: .13 };
export function makeFreezer(THREE, { open = 1.75 } = {}) {
  const { W, H, D, t } = FREEZER;
  const g = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .42, clearcoat: .35, clearcoatRoughness: .3 });
  const inner = new THREE.MeshPhysicalMaterial({ color: '#1A1A1C', roughness: .5, clearcoat: .4, clearcoatRoughness: .3 });
  const alu = new THREE.MeshPhysicalMaterial({ color: '#C9CBCF', roughness: .3, metalness: .3, clearcoat: .6, clearcoatRoughness: .2 });
  const OW = W + 2 * t, OH = H + 2 * t;
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(slab(THREE, OW, t, D + t, .05), white, 0, t / 2, -(D + t) / 2);              // дно
  add(slab(THREE, OW, t, D + t, .05), white, 0, OH - t / 2, -(D + t) / 2);         // крыша
  add(slab(THREE, t, OH, D + t, .05), white, -OW / 2 + t / 2, OH / 2, -(D + t) / 2);
  add(slab(THREE, t, OH, D + t, .05), white, OW / 2 - t / 2, OH / 2, -(D + t) / 2);
  add(slab(THREE, OW, OH, t, .05), white, 0, OH / 2, -D - t / 2 - .001);     // задняя стенка
  // графитовая камера: тонкие панели по внутренним граням
  const e = .004;
  const pl = (w, h) => new THREE.PlaneGeometry(w, h);
  const back = add(pl(W, H), inner, 0, t + H / 2, -D + e);
  const fl = add(pl(W, D), inner, 0, t + e, -D / 2); fl.rotation.x = -Math.PI / 2;
  const tp = add(pl(W, D), inner, 0, t + H - e, -D / 2); tp.rotation.x = Math.PI / 2;
  const sl = add(pl(D, H), inner, -W / 2 + e, t + H / 2, -D / 2); sl.rotation.y = Math.PI / 2;
  const sr = add(pl(D, H), inner, W / 2 - e, t + H / 2, -D / 2); sr.rotation.y = -Math.PI / 2;
  void back;
  // дверь на петле у правого переднего ребра
  const hinge = new THREE.Group(); hinge.position.set(OW / 2, 0, 0);
  const door = new THREE.Mesh(slab(THREE, OW, OH, .16, .06), white); door.position.set(-OW / 2, OH / 2, .08);
  const handle = new THREE.Mesh(slab(THREE, .05, OH * .55, .06, .02), alu); handle.position.set(-OW + .16, OH / 2, .2);
  const gasket = new THREE.Mesh(slab(THREE, OW - .16, OH - .16, .02, .01), inner); gasket.position.set(-OW / 2, OH / 2, -.006);
  hinge.add(door, handle, gasket); g.add(hinge);
  hinge.rotation.y = open;
  g.setOpen = a => { hinge.rotation.y = a; };
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.floorY = t;            // высота дна камеры
  return g;
}

// Керамическая формочка (рамекин) со смесью для мороженого. .setIce(f) — смесь застывает (матовая, светлая, иней).
export function makeCup(THREE) {
  const g = new THREE.Group();
  const R = .46, Hh = .42;
  const prof = [[0, 0], [R - .04, 0], [R, .04], [R + .012, Hh - .02], [R, Hh], [R - .05, Hh], [R - .06, .06], [0, .06]].map(([x, y]) => new THREE.Vector2(x, y));
  const cer = new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .42, clearcoat: .35, clearcoatRoughness: .3, side: THREE.DoubleSide });
  const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), cer);
  // рёбрышки снаружи (как у рамекина) — тонкие вертикальные валики
  const ribs = new THREE.InstancedMesh(new THREE.CylinderGeometry(.012, .012, Hh - .08, 6), cer, 36);
  const M = new THREE.Matrix4();
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; M.makeTranslation(Math.cos(a) * (R + .004), Hh / 2, Math.sin(a) * (R + .004)); ribs.setMatrixAt(i, M); }
  const mixMat = new THREE.MeshPhysicalMaterial({ color: '#D9D6CF', roughness: .14, clearcoat: 1, clearcoatRoughness: .05 });
  const mix = new THREE.Mesh(new THREE.CylinderGeometry(R - .055, R - .058, .26, 64), mixMat); mix.position.y = .06 + .13;
  const frost = new THREE.Mesh(new THREE.CircleGeometry(R - .056, 64), new THREE.MeshStandardMaterial({ color: '#FFFFFF', map: frostTex(THREE), transparent: true, opacity: 0, depthWrite: false, roughness: .9 }));
  frost.rotation.x = -Math.PI / 2; frost.position.y = .06 + .262; frost.renderOrder = 5;
  g.add(cup, ribs, mix, frost);
  const LIQ = new THREE.Color('#D9D6CF'), ICE = new THREE.Color('#FBFBFA');
  g.setIce = f => { mixMat.color.copy(LIQ).lerp(ICE, f); mixMat.roughness = lerp(.14, .75, f); mixMat.clearcoat = lerp(1, 0, f); frost.material.opacity = f * .9; frost.visible = f > .003; };
  g.setIce(0);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  frost.castShadow = false;
  g.top = .06 + .26;
  return g;
}
