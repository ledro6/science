// Общие детали выпуска № 12 (закон Архимеда): стальной кубик 1 м, корпус-лодка из листа той же стали
// (дно + четыре борта на шарнирах: лист раскрыт крестом → борта поднимаются), стеклянный аквариум,
// вода (полупрозрачный объём + живая поверхность-шейдер с рябью и кругами от падения), пузырьки,
// большое судно из примитивов, 2D-помощники (стрелки сил, размерные линии, выноски, свечение, пилюля).
// Не сцена: импортируется сценами выпуска и обложкой (hero.mjs). Часть помощников — из ep11/w1 (kit.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, project, clamp, lerp, rng, FONT, line, atext } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];

// ---------- физика (метры, тонны) ----------
export const RHO_STEEL = 7.85;
// корпус: длина L, ширина B, высота борта H, толщина листа TH; осадка = 7,85 т / (L·B·1 т/м³)
export const HULL = { L: 3.2, B: 2.0, H: 1.6, TH: .045 };
export const DRAFT = RHO_STEEL / (HULL.L * HULL.B);          // ≈ 1,23 м

// ---------- материалы ----------
// Сталь: светлый холодный металл, «продуктовый» (без env-карт форму лепят ключ и контровые)
// карта-«софтбокс»: на каждой грани мягкий градиент сверху вниз и косой блик (вместо env-карты, бесплатно)
let STEEL_TX = null;
function steelTex() {
  if (STEEL_TX) return STEEL_TX;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(.45, '#C8C8C8'); gr.addColorStop(1, '#7A7A7A');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const st = g.createLinearGradient(0, 0, 256, 256);
  st.addColorStop(.3, 'rgba(255,255,255,0)'); st.addColorStop(.42, 'rgba(255,255,255,.35)'); st.addColorStop(.5, 'rgba(255,255,255,0)');
  g.fillStyle = st; g.fillRect(0, 0, 256, 256);
  STEEL_TX = new THREE.CanvasTexture(c); STEEL_TX.colorSpace = THREE.SRGBColorSpace;
  return STEEL_TX;
}
export const steelMat = (light = false) => new THREE.MeshPhysicalMaterial(light
  ? { color: '#E2E5EA', map: steelTex(), roughness: .3, metalness: .32, clearcoat: .8, clearcoatRoughness: .12 }
  : { color: '#B4B8BF', map: steelTex(), roughness: .28, metalness: .55, clearcoat: .8, clearcoatRoughness: .12 });
export const glassMat = (opacity = .08) => new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, transparent: true, opacity, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });

// Коробка со скруглёнными рёбрами произвольных пропорций (из ep10/w1 kit.mjs)
export function rbox(w, h, d, r = .03, seg = 3) {
  const n = seg * 2 + 2;
  const geo = new THREE.BoxGeometry(w, h, d, n, n, n);
  const sx = w / 2 - r, sy = h / 2 - r, sz = d / 2 - r;
  const p = geo.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(clamp(v.x, -sx, sx), clamp(v.y, -sy, sy), clamp(v.z, -sz, sz));
    v.sub(c).normalize().multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

// «проявление из темноты»: запоминаем цвета материалов (k: 0 — чёрный, 1 — как есть)
export function collectMats(obj) {
  const ms = new Set(); obj.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.material.isShaderMaterial && !o.material.transparent) ms.add(o.material); });
  return [...ms].map(m => { m.userData.base = m.color.clone(); m.userData.cc = m.clearcoat || 0; return m; });
}
export function setLit(mats, k) {
  for (const m of mats) { m.color.copy(m.userData.base).multiplyScalar(k); m.clearcoat = m.userData.cc * k; m.specularIntensity = k; }
}

// ---------- стальной кубик (ребро 1 м, стоит на y = 0) ----------
export function makeCube(mat = steelMat()) {
  const m = new THREE.Mesh(rbox(1, 1, 1, .035), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// ---------- корпус из листа: дно + 4 борта на шарнирах ----------
// set({ fold: 0 — лист раскрыт крестом, 1 — борта вертикальны; grow: 0..1 — борта «выкатываются» из-под дна;
//       slab: толщина дна (для раскатки кубика) }). Начало координат — центр днища снизу.
export function makeHull(mat = steelMat()) {
  const { L, B, H, TH } = HULL;
  const g = new THREE.Group();
  const base = new THREE.Mesh(rbox(1, 1, 1, .012, 2), mat);          // масштабируется в L × slab × B
  g.add(base);
  const wallGeo = rbox(1, 1, 1, .012, 2);
  // борта: [ось шарнира, позиция шарнира, длина вдоль шарнира, знак наружу]
  const defs = [
    { ax: 'x', pos: [0, 0, B / 2], len: L, s: 1 },
    { ax: 'x', pos: [0, 0, -B / 2], len: L, s: -1 },
    { ax: 'z', pos: [L / 2, 0, 0], len: B - 2 * TH, s: 1 },
    { ax: 'z', pos: [-L / 2, 0, 0], len: B - 2 * TH, s: -1 },
  ];
  const walls = defs.map(d => {
    const piv = new THREE.Group(), w = new THREE.Mesh(wallGeo, mat);
    piv.add(w); g.add(piv);
    return { ...d, piv, w };
  });
  g.set = ({ fold = 1, grow = 1, slab = TH, bx = L, bz = B } = {}) => {
    base.scale.set(bx, slab, bz); base.position.set(0, slab / 2, 0);
    walls.forEach(({ ax, pos, len, s, piv, w }, i) => {
      const fo = Array.isArray(fold) ? fold[i] : fold;
      // шарнир на внешней кромке дна; борт растёт вверх (в собственной системе пивота)
      const inset = ax === 'x' ? [0, 0, -s * TH / 2] : [-s * TH / 2, 0, 0];
      piv.position.set(pos[0] + inset[0], slab * .5, pos[2] + inset[2]);
      const h = Math.max(.001, H * grow);
      if (ax === 'x') { w.scale.set(len, h, TH); piv.rotation.set(s * (Math.PI / 2) * (1 - fo), 0, 0); }
      else { w.scale.set(TH, h, len); piv.rotation.set(0, 0, -s * (Math.PI / 2) * (1 - fo)); }
      w.position.set(0, h / 2, 0);
      w.visible = grow > .003;
    });
  };
  g.set();
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
// Вытесненный объём под корпусом: «рентген» — стеклянный блок и рёбра поверх всего (depthTest off)
export function makeDisplaced(col = '#FFFFFF') {
  const { L, B } = HULL;
  const geo = new THREE.BoxGeometry(L, 1, B); geo.translate(0, .5, 0);
  const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .12, depthWrite: false, depthTest: false }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineDashedMaterial({ color: col, transparent: true, opacity: .9, depthTest: false, dashSize: .09, gapSize: .07 }));
  edges.computeLineDistances();
  fill.renderOrder = 8; edges.renderOrder = 9;
  const g = new THREE.Group(); g.add(fill, edges);
  g.setA = a => { fill.material.opacity = .09 * a; edges.material.opacity = .95 * a; g.visible = a > .003; };
  return g;
}

// ---------- вода ----------
// Поверхность: шейдер с мягкой рябью, кругами от падения (uS0 — момент, uSP — точка) и бликом.
export function makeSurface(w, d, { col = '#FFFFFF', base = .05, fres = .35, spec = 1, seg = [96, 48] } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, seg[0], seg[1]); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uS0: { value: -99 }, uSP: { value: new THREE.Vector2() }, uCol: { value: new THREE.Color(col) },
      uBase: { value: base }, uFres: { value: fres }, uSpec: { value: spec }, uOp: { value: 1 }, uAmp: { value: 1 }, uHole: { value: new THREE.Vector4(99, 99, 99, 99) }, uL: { value: new THREE.Vector3(.35, 1, .5).normalize() } },
    vertexShader: `uniform float uT, uS0, uAmp; uniform vec2 uSP; varying vec3 vN; varying vec3 vW;
      float hgt(vec2 p){
        float h = .007*sin(p.x*2.7+uT*1.25) + .005*sin(p.y*3.9-uT*1.05) + .004*sin((p.x+p.y)*5.3+uT*1.7);
        float dt = uT - uS0;
        if (dt > 0.) { float r = length(p - uSP), c = .3 + 1.5*dt; h += .07*exp(-dt*1.3)*exp(-pow((r-c)*1.6, 2.))*sin((r-c)*11.); }
        return h*uAmp; }
      void main(){
        vec3 p = position; vec2 q = p.xz; float e = .03;
        float h = hgt(q), hx = hgt(q + vec2(e, 0.)), hz = hgt(q + vec2(0., e));
        p.y += h;
        vN = normalize(normalMatrix * normalize(vec3(-(hx-h)/e, 1., -(hz-h)/e)));
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 uCol, uL; uniform float uBase, uFres, uSpec, uOp; uniform vec4 uHole; varying vec3 vN; varying vec3 vW;
      void main(){
        if (vW.x > uHole.x && vW.x < uHole.y && vW.z > uHole.z && vW.z < uHole.w) discard;
        vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        vec3 Lv = normalize((viewMatrix * vec4(uL, 0.)).xyz);
        vec3 Vv = normalize((viewMatrix * vec4(V, 0.)).xyz);
        float f = pow(1. - clamp(dot(N, Vv), 0., 1.), 3.);
        float s = pow(clamp(dot(reflect(-Lv, N), Vv), 0., 1.), 70.);
        float a = uBase + uFres*f + uSpec*s;
        gl_FragColor = vec4(mix(uCol, vec3(1.), clamp(s, 0., 1.)), clamp(a, 0., 1.)*uOp); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = 4;
  return m;
}
// Объём воды: коробка без крышки (стенки и дно полупрозрачны) + рёбра; масштаб по y = уровень.
export function makeWater(w, d, { col = '#C9D2DC', opacity = .16, edge = '#FFFFFF', edgeOp = .55, surf = {} } = {}) {
  const geo = new THREE.BoxGeometry(w, 1, d); geo.translate(0, .5, 0);
  const side = new THREE.MeshPhysicalMaterial({ color: col, roughness: .1, transparent: true, opacity, depthWrite: false, clearcoat: .6 });
  const hide = new THREE.MeshBasicMaterial({ visible: false });
  const body = new THREE.Mesh(geo, [side, side, hide, side, side, side]); body.renderOrder = 3;
  const eg = new THREE.EdgesGeometry(geo);
  const edges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: edgeOp })); edges.renderOrder = 5;
  const surface = makeSurface(w - .004, d - .004, surf);
  const g = new THREE.Group(); g.add(body, edges, surface);
  g.set = (level, t, a = 1) => {
    body.scale.y = edges.scale.y = Math.max(.001, level - .012); body.position.y = edges.position.y = .012;
    surface.position.y = level;
    surface.material.uniforms.uT.value = t;
    side.opacity = opacity * a; edges.material.opacity = edgeOp * a; surface.material.uniforms.uOp.value = a;
    g.visible = a > .003 && level > .002;
  };
  // «дырка» в поверхности под корпусом (мировые x0, x1, z0, z1): внутри лодки воды нет
  g.hole = (x0, x1, z0, z1) => surface.material.uniforms.uHole.value.set(x0, x1, z0, z1);
  g.splash = (t0, x, z) => { surface.material.uniforms.uS0.value = t0; surface.material.uniforms.uSP.value.set(x, z); };
  g.parts = { body, edges, surface, side };
  return g;
}
// Аквариум: стеклянные стенки без крышки + тонкие рёбра + стеклянное дно
export function makeTank(w, d, h, { edge = '#FFFFFF', edgeOp = .85, op = .07 } = {}) {
  const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2 + .006, 0);
  const gm = glassMat(op), hide = new THREE.MeshBasicMaterial({ visible: false });
  const shell = new THREE.Mesh(geo, [gm, gm, hide, gm, gm, gm]); shell.renderOrder = 2;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: edgeOp })); edges.renderOrder = 6;
  const g = new THREE.Group(); g.add(shell, edges);
  g.setA = a => { gm.opacity = op * a; edges.material.opacity = edgeOp * a; g.visible = a > .003; };
  return g;
}

// ---------- падение кубика в воду (чистая функция времени) ----------
// y — низ кубика. До tDrop висит на y0; свободное падение до поверхности wl; в воде — к предельной скорости; дно yb.
export function sinkY(t, tDrop, y0, wl, yb = 0, { vt = 1.9, tau = .22 } = {}) {
  if (t <= tDrop) return { y: y0, phase: 0, tEntry: Infinity, tBottom: Infinity };
  const h = y0 - wl, tf = Math.sqrt(2 * Math.max(h, 0) / 9.8), ve = 9.8 * tf, tEntry = tDrop + tf;
  const s = t - tDrop;
  if (s <= tf) return { y: y0 - 4.9 * s * s, phase: 1, tEntry, tBottom: Infinity };
  const fall = u => vt * u + (ve - vt) * tau * (1 - Math.exp(-u / tau));
  // момент касания дна — бисекция
  let a = 0, b = 6; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (wl - fall(m) > yb) a = m; else b = m; }
  const tBottom = tEntry + b, u = s - tf;
  return { y: Math.max(yb, wl - fall(u)), phase: u < b ? 2 : 3, tEntry, tBottom };
}
// Пузырьки: InstancedMesh; рождаются на пути кубика и всплывают
export function makeBubbles(n = 46, col = '#FFFFFF', op = .55) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshPhysicalMaterial({ color: col, roughness: .1, transparent: true, opacity: op, depthWrite: false, clearcoat: 1 }), n);
  m.renderOrder = 4; m.frustumCulled = false;
  const R = rng(1207), B = [];
  for (let i = 0; i < n; i++) B.push({ k: R(), dx: R() - .5, dz: R() - .5, r: .018 + Math.pow(R(), 2) * .05, v: .55 + R() * .5, ph: R() * TAU });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3();
  // pathAt(τ) → [x, y, z] центра кубика в момент τ; [t0, t1] — интервал рождения; wl — поверхность
  m.set = (t, t0, t1, pathAt, wl, a = 1) => {
    let vis = 0;
    B.forEach((b, i) => {
      const tb = lerp(t0, t1, b.k), age = t - tb;
      let s = 0;
      if (age > 0) {
        const [cx, cy, cz] = pathAt(tb);
        const y = cy + (b.dx * .3) + age * b.v;
        if (y < wl - b.r) {
          s = b.r * clamp(age / .15) * (1 - clamp((age - 2.6) / .4));
          Pv.set(cx + b.dx * .9 + .05 * Math.sin(age * 6 + b.ph), y, cz + b.dz * .9);
        }
      }
      if (s > 1e-4) vis++;
      Sv.setScalar(Math.max(s, 1e-5)); M.compose(Pv, Q, Sv); m.setMatrixAt(i, M);
    });
    m.instanceMatrix.needsUpdate = true; m.material.opacity = op * a; m.visible = vis > 0 && a > .003;
  };
  return m;
}

// ---------- большое судно (длина ≈ 10, осадка SHIP.D, ватерлиния на y = 0) ----------
export const SHIP = { L: 10.4, B: 1.7, D: .78, F: .95 };   // F — высота надводного борта
export function makeShip({ hullCol = '#3A3A3C', deckCol = '#E6E6E8', clip = null } = {}) {
  const g = new THREE.Group();
  const { L, B, D, F } = SHIP, x0 = -L / 2, x1 = L / 2;
  // профиль корпуса сбоку: корма, днище, скула, наклонный форштевень
  const sh = new THREE.Shape();
  sh.moveTo(x0, F); sh.lineTo(x0, -.15); sh.quadraticCurveTo(x0 + .1, -D, x0 + .8, -D);
  sh.lineTo(x1 - 1.6, -D); sh.quadraticCurveTo(x1 - .55, -D, x1 - .25, -.25); sh.lineTo(x1 + .2, F + .12); sh.lineTo(x0, F);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: B, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 3, curveSegments: 12 });
  geo.translate(0, 0, -B / 2);
  const hm = new THREE.MeshPhysicalMaterial({ color: hullCol, roughness: .38, metalness: .2, clearcoat: .6, clearcoatRoughness: .2 });
  const hull = new THREE.Mesh(geo, hm);
  // подводная часть (= вытесненный объём): тот же корпус, отрезанный по ватерлинии
  const um = new THREE.MeshPhysicalMaterial({ color: hullCol, roughness: .38, metalness: .2, clearcoat: .6, clearcoatRoughness: .2 });
  const under = new THREE.Mesh(geo, um);
  // ватерлиния в мировых координатах — уровень воды y = 0: надводная часть и подводная — разными материалами
  const cut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);    // оставляет y < 0
  um.clippingPlanes = [cut]; hm.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
  // палуба, надстройка, труба, контейнеры
  const dm = new THREE.MeshPhysicalMaterial({ color: deckCol, roughness: .45, clearcoat: .35 });
  const deck = new THREE.Mesh(rbox(L - .6, .06, B - .06, .02), dm); deck.position.set(.1, F + .03, 0);
  const sup = new THREE.Mesh(rbox(1.0, 1.15, B - .2, .05), dm); sup.position.set(x0 + 1.0, F + .6, 0);
  const brg = new THREE.Mesh(rbox(1.25, .2, B + .1, .04), dm); brg.position.set(x0 + 1.0, F + 1.25, 0);
  const win = new THREE.Mesh(rbox(1.27, .08, B + .12, .02), new THREE.MeshPhysicalMaterial({ color: '#1D1D1F', roughness: .2, clearcoat: 1 })); win.position.set(x0 + 1.0, F + 1.1, 0);
  const fun = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .7, 28), new THREE.MeshPhysicalMaterial({ color: hullCol, roughness: .35, clearcoat: .6 })); fun.position.set(x0 + .55, F + 1.55, 0);
  g.add(hull, under, deck, sup, brg, win, fun);
  // контейнеры: 7 рядов × 2 яруса × 2 поперёк (монохромные оттенки)
  const cg = rbox(.62, .3, .38, .02, 2), N = 7 * 2 * 4;
  const cm = new THREE.InstancedMesh(cg, new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .42, clearcoat: .3 }), N);
  const R = rng(55), M = new THREE.Matrix4(), tones = ['#C9CBCF', '#8E9096', '#E6E6E8', '#6E6E73', '#B0B2B7'];
  let q = 0;
  for (let i = 0; i < 7; i++) for (let k = 0; k < 2; k++) for (let j = 0; j < 4; j++) {
    const tall = k === 0 || R() > .25;
    M.makeTranslation(x0 + 2.3 + i * .7, F + .06 + .15 + k * .31, (j - 1.5) * .4);
    if (!tall) M.scale(new THREE.Vector3(1e-4, 1e-4, 1e-4));
    cm.setMatrixAt(q, M); cm.setColorAt(q, new THREE.Color(tones[Math.floor(R() * tones.length)])); q++;
  }
  g.add(cm);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.parts = { hull, under, hm, um, cut };
  return g;
}

// ---------- камера ----------
// Орбита; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920). Из ep10/ep11 kit.mjs.
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}
// Ключи [t, ...значения] → интерполяция ease между ключами
export function keys(K, t, ease) {
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) {
    const a = K[i - 1], b = K[i], p = ease((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * p);
  }
  return K[K.length - 1].slice(1);
}

// ---------- 2D ----------
// Стрелка силы: толстая линия с закрашенным наконечником (длина рисуется на долю p)
export function force(x, y, len, dir, col, a = 1, p = 1, lw = 5, head = 22) {
  if (a <= .003 || p <= 0 || len < 1) return;
  const g = ctx(), L = len * clamp(p), y2 = y + dir * L, hh = Math.min(head, L * .6);
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y2 - dir * hh * .7); g.stroke();
  g.beginPath(); g.moveTo(x, y2); g.lineTo(x - hh * .55, y2 - dir * hh); g.lineTo(x + hh * .55, y2 - dir * hh); g.closePath(); g.fill();
  g.restore();
  dot(x, y, lw * 1.3, col, a);
}
function dot(x, y, r, col, a) { ENG.dot(x, y, r, col, a); }
// Размерная линия с засечками (из пилота)
export function dim(x1, y1, x2, y2, a, col, tick = 12) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
}
// Пунктирная линия по проекции 3D-отрезка
export function dash3(cam, a3, b3, col, a = 1, lw = 2, d = [10, 9]) {
  const [x1, y1] = project(cam, ...a3), [x2, y2] = project(cam, ...b3);
  line(x1, y1, x2, y2, col, a, lw, d);
}
// Мягкое пятно света (аддитивно, для чёрного фона)
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
// Заголовок из слов, каждое — в свой момент (ts[i]), как «Закон квадрата и куба» в пилоте (из w1)
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = ENG.measure(' ', size, w, track), wd = ws.map(q => ENG.measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}
// «7,85» — десятичная запятая
export const dec = (v, n = 2) => v.toFixed(n).replace('.', ',');

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs), копия из ep11/kit.mjs
export function pill(t, t0, press) {
  const g = ctx(), { P, eApple, eStd } = ENG;
  const p = P(t, t0, .8, eApple);
  if (p <= .003) return;
  const dn = P(t, press, .14, eStd), up = P(t, press + .14, .6, eApple);
  const k = (1 - .055 * dn + .055 * up) * lerp(1.04, 1, p);
  const W2 = 300, H2 = 56, cx = 540, cy = 1205 + (1 - p) * 34;
  const bl = (1 - P(t, t0, .55, eApple)) * 12;
  g.save(); g.globalAlpha = p; if (bl > .3) g.filter = `blur(${bl.toFixed(1)}px)`;
  g.translate(cx, cy); g.scale(k, k);
  const dk = lerp(1, .82, dn * (1 - up));
  g.fillStyle = `rgb(${Math.round(255 * dk)},${Math.round(69 * dk)},${Math.round(58 * dk)})`;
  g.beginPath(); g.roundRect(-W2, -H2, W2 * 2, H2 * 2, H2); g.fill();
  g.font = `600 44px ${FONT}`; g.letterSpacing = '-0.4px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#FFFFFF'; g.fillText('Подписаться на L³', 0, 2);
  g.restore();
  const rp = P(t, press + .05, .9, eApple);
  if (rp > 0 && rp < 1) {
    const gr = 4 + 30 * rp;
    g.save(); g.globalAlpha = .5 * (1 - rp); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(cx - W2 - gr, 1205 - H2 - gr, (W2 + gr) * 2, (H2 + gr) * 2, H2 + gr); g.stroke(); g.restore();
  }
}
