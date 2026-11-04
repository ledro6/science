// Общие детали выпуска № 13 (резонанс): керамические солдатики (InstancedMesh: туловище, голова, кивер, руки и ноги
// на шарнирах, шаг задаётся фазой), висячий мост Бротон (каменные порталы, цепи из звеньев-стержней, подвески, дощатый
// настил: первая вертикальная мода колебаний и обрыв цепи у дальнего портала), река-шейдер с кругами от падений,
// качели-маятник с «рукой», которая толкает в такт, плоский Мост тысячелетия (боковая мода, толпа пешеходов, гасители),
// 2D-помощники (стрелки, размерные линии, свечение, слова по таймингу, пилюля «Подписаться на L³»).
// Не сцена: импортируется сценами выпуска и обложкой (hero.mjs). Часть помощников — из ep11/ep12 (kit.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, clamp, lerp, rng, FONT, atext, MAT } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];

// Коробка со скруглёнными рёбрами произвольных пропорций (из ep12 kit.mjs)
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

// ---------- камера ----------
// Орбита; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920). Из ep11/ep12 kit.mjs.
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

// Инстансы с цепочкой сегментов: InstancedMesh цилиндров единичной длины, set(i, a, b) — отрезок между точками
const UP = new THREE.Vector3(0, 1, 0);
function segMesh(n, r, mat, radial = 8) {
  const geo = new THREE.CylinderGeometry(r, r, 1, radial, 1, false);
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false;
  m.castShadow = true; m.receiveShadow = true;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pv = new THREE.Vector3(), Sv = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3();
  m.seg = (i, a, b, over = 1) => {
    A.fromArray(a); B.fromArray(b); D.subVectors(B, A);
    const len = D.length();
    if (len < 1e-5 || over <= 0) { M.makeScale(1e-5, 1e-5, 1e-5); m.setMatrixAt(i, M); return; }
    Pv.copy(A).addScaledVector(D, .5); Q.setFromUnitVectors(UP, D.normalize()); Sv.set(1, len * over, 1);
    M.compose(Pv, Q, Sv); m.setMatrixAt(i, M);
  };
  m.hide = i => { M.makeScale(1e-5, 1e-5, 1e-5); m.setMatrixAt(i, M); };
  return m;
}

// ---------- солдатики ----------
// Рост ≈ 1.2 в локальных единицах (ступни на y = 0, лицом в +X). Шаг: ph — фаза ноги (рад), ноги и руки качаются в противофазе.
export function makeSoldiers(n, { mat = null, hatMat = null, shadow = true } = {}) {
  mat = mat || MAT.ceramicWhite();
  hatMat = hatMat || MAT.ceramicBlack();
  const grp = new THREE.Group();
  const capsule = (r, len, cap = 6, rad = 14) => new THREE.CapsuleGeometry(r, len, cap, rad);
  const torsoG = capsule(.105, .27, 6, 18); torsoG.scale(1, 1, .78);
  const legG = capsule(.052, .4, 4, 12); legG.translate(0, -.252, 0);
  const armG = capsule(.034, .3, 4, 10); armG.translate(0, -.184, 0);
  const headG = new THREE.SphereGeometry(.078, 20, 14);
  const hatG = new THREE.CylinderGeometry(.064, .07, .13, 18);
  const mk = (geo, m) => {
    const im = new THREE.InstancedMesh(geo, m, n);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false;
    im.castShadow = shadow; im.receiveShadow = shadow;
    im.setColorAt(0, new THREE.Color(1, 1, 1));
    grp.add(im); return im;
  };
  const torso = mk(torsoG, mat), head = mk(headG, mat), hat = mk(hatG, hatMat);
  const legL = mk(legG, mat), legR = mk(legG, mat), armL = mk(armG, mat), armR = mk(armG, mat);
  const all = [torso, head, hat, legL, legR, armL, armR];
  const B = new THREE.Matrix4(), L = new THREE.Matrix4(), M = new THREE.Matrix4(), R = new THREE.Matrix4(), E = new THREE.Euler(), Q = new THREE.Quaternion(),
    Pv = new THREE.Vector3(), Sv = new THREE.Vector3(), Cc = new THREE.Color(), Z = new THREE.Vector3(0, 0, 1);
  const part = (im, i, px, py, pz, rz = 0) => {
    L.makeTranslation(px, py, pz); if (rz) { R.makeRotationAxis(Z, rz); L.multiply(R); }
    M.multiplyMatrices(B, L); im.setMatrixAt(i, M);
  };
  return {
    grp, parts: all, H: 1.2,
    // p — позиция ступней, s — масштаб, ry/rx/rz — поворот тела, ph — фаза шага, sw — размах шага, c — яркость
    set(i, p, { s = .3, ry = 0, rx = 0, rz = 0, ph = 0, sw = .42, c = 1, bob = .02 } = {}) {
      const a = sw * Math.sin(ph);
      const by = bob * Math.abs(Math.cos(ph));
      E.set(rx, ry, rz, 'YXZ'); Q.setFromEuler(E);
      B.compose(Pv.set(p[0], p[1], p[2]), Q, Sv.set(s, s, s));
      L.makeTranslation(0, by, 0); B.multiply(L);
      part(torso, i, 0, .735, 0); part(head, i, 0, 1.03, 0); part(hat, i, 0, 1.135, 0);
      part(legL, i, 0, .52, .058, a); part(legR, i, 0, .52, -.058, -a);
      part(armL, i, 0, .9, .135, -a * .8); part(armR, i, 0, .9, -.135, a * .8);
      Cc.setRGB(c, c, c); for (const im of all) im.setColorAt(i, Cc);
    },
    hide(i) { M.makeScale(1e-5, 1e-5, 1e-5); for (const im of all) im.setMatrixAt(i, M); },
    commit() { for (const im of all) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } },
  };
}

// ---------- висячий мост Бротон ----------
// Пролёт вдоль X от −L/2 до L/2, настил на высоте Y над рекой (y = 0), порталы высотой TH над настилом.
export const BR = { L: 8, W: .66, Y: 1.45, TH: 1.85, SAG: 1.62, N: 40, BANK: 3.2 };
const sinU = x => Math.sin(Math.PI * clamp((x + BR.L / 2) / BR.L));
// состояние: amp — амплитуда первой моды, ph — фаза колебаний, drop — просадка дальнего конца (обрыв), brk — 0..1 разрыв цепи
export function deckY(x, o) {
  const { L, Y } = BR, u = (x + L / 2) / L;
  if (u <= 0 || u >= 1) return Y;
  return Y + (o.amp || 0) * Math.sin(Math.PI * u) * Math.sin(o.ph || 0) - (o.drop || 0) * Math.pow(u, 1.5);
}
const XB = BR.L / 2 - .55;   // точка разрыва цепи (у дальнего портала)
function cableSpanY(x, o) {
  const { L, Y, TH, SAG } = BR, u = (x + L / 2) / L;
  const y0 = Y + TH - SAG * (1 - Math.pow(2 * x / L, 2)) + (o.amp || 0) * sinU(x) * Math.sin(o.ph || 0) * .92;
  const k = o.brk || 0;
  if (k <= 0) return y0;
  // оборванная цепь ложится на опавший настил
  return lerp(y0, deckY(x, o) + .07, k * smooth((u - .15) / .8));
}
export function makeSuspension({ deckMat = null, towerMat = null, chainMat = null, bankMat = null, banks = true } = {}) {
  const { L, W, Y, TH, N, BANK } = BR;
  deckMat = deckMat || MAT.aluminium();
  towerMat = towerMat || MAT.ceramicWhite();
  chainMat = chainMat || new THREE.MeshPhysicalMaterial({ color: '#D9DADC', roughness: .28, metalness: .5, clearcoat: .7 });
  bankMat = bankMat || new THREE.MeshLambertMaterial({ color: '#202022' });
  const g = new THREE.Group();
  // доски настила и продольные балки
  const pw = L / N;
  const planks = new THREE.InstancedMesh(rbox(pw * .9, .05, W, .012, 2), deckMat, N);
  const beams = new THREE.InstancedMesh(rbox(pw * 1.02, .085, .045, .01, 1), deckMat, N * 2);
  for (const m of [planks, beams]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = m.receiveShadow = true; g.add(m); }
  // порталы: два каменных столба + перемычка на каждом берегу
  const zt = W / 2 + .1, ht = Y + TH + .12;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(rbox(.26, ht, .26, .035), towerMat); p.position.set(sx * (L / 2 + .1), ht / 2, sz * zt); g.add(p);
      const cap = new THREE.Mesh(rbox(.34, .1, .34, .03), towerMat); cap.position.set(sx * (L / 2 + .1), ht + .05, sz * zt); g.add(cap);
    }
    const lin = new THREE.Mesh(rbox(.24, .2, 2 * zt + .1, .035), towerMat); lin.position.set(sx * (L / 2 + .1), Y + TH - .32, 0); g.add(lin);
    if (banks) {
      const b = new THREE.Mesh(rbox(BANK, Y, 9, .04), bankMat); b.position.set(sx * (L / 2 + BANK / 2), Y / 2, 0); g.add(b);
    }
  }
  // цепи: 2 стороны × (оттяжка 6 + пролёт 36 + оттяжка 6) сегментов; подвески у каждой доски
  const NS = 36, NB = 6, NC = NS + 2 * NB;
  const chains = segMesh(NC * 2, .03, chainMat, 10);
  const hangers = segMesh(N * 2, .0085, chainMat, 6);
  g.add(chains, hangers);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pv = new THREE.Vector3(), Sv = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  const top = (sx) => [sx * (L / 2 + .1), Y + TH + .05];
  g.set = (o = {}) => {
    const k = o.brk || 0;
    // настил
    for (let i = 0; i < N; i++) {
      const x = -L / 2 + pw * (i + .5), y = deckY(x, o), sl = (deckY(x + .02, o) - deckY(x - .02, o)) / .04;
      E.set(0, 0, Math.atan(sl)); Q.setFromEuler(E);
      M.compose(Pv.set(x, y - .025, 0), Q, Sv); planks.setMatrixAt(i, M);
      for (const s of [0, 1]) { M.compose(Pv.set(x, y - .07, (s ? 1 : -1) * (W / 2 - .02)), Q, Sv); beams.setMatrixAt(i * 2 + s, M); }
    }
    planks.instanceMatrix.needsUpdate = true; beams.instanceMatrix.needsUpdate = true;
    // цепи
    [-1, 1].forEach((sz, side) => {
      const z = sz * zt, pts = [];
      const [xl, yt] = top(-1), [xr] = top(1);
      for (let j = 0; j <= NB; j++) pts.push([lerp(-L / 2 - BANK + .35, xl, j / NB), lerp(Y + .02, yt, Math.pow(j / NB, .9)), z]);
      for (let j = 1; j <= NS; j++) { const x = lerp(-L / 2, L / 2, j / NS); pts.push([x, j === NS ? yt : cableSpanY(x, o), z]); }
      for (let j = 1; j <= NB; j++) pts.push([lerp(xr, L / 2 + BANK - .35, j / NB), lerp(yt, Y + .02, Math.pow(j / NB, 1.1)), z]);
      // обрыв: звенья дальше XB — обрывок висит с портала (поворачивается вниз)
      const jb = NB + Math.round((XB + L / 2) / L * NS);
      for (let j = 0; j < pts.length - 1; j++) {
        const id = side * NC + j;
        let a = pts[j], b = pts[j + 1];
        if (k > 0 && j >= jb && j < NB + NS) {
          // обрывок: от вершины портала вниз
          const T0 = [xr, yt, z], dA = (NB + NS - j), dB = (NB + NS - j - 1), seg = (L / NS) * 1.05;
          const ang = lerp(Math.atan2(-(pts[NB + NS - 1][1] - yt), L / NS), Math.PI / 2 - .12, smooth(k * 1.2));
          a = [T0[0] - Math.cos(ang) * dA * seg, T0[1] - Math.sin(ang) * dA * seg, z];
          b = [T0[0] - Math.cos(ang) * dB * seg, T0[1] - Math.sin(ang) * dB * seg, z];
          if (j === jb) { chains.hide(id); continue; }
        }
        chains.seg(id, a, b);
      }
      // подвески
      for (let i = 0; i < N; i++) {
        const x = -L / 2 + pw * (i + .5), id = side * N + i;
        if (k > 0 && x > XB - .1) { const fall = smooth(k * 3); if (fall > .5) { hangers.hide(id); continue; } }
        const yc = cableSpanY(x, o), yd = deckY(x, o) - .02;
        if (yc - yd < .02) { hangers.hide(id); continue; }
        hangers.seg(id, [x, yd, sz * (W / 2 - .02)], [x, yc, z]);
      }
    });
    chains.instanceMatrix.needsUpdate = true; hangers.instanceMatrix.needsUpdate = true;
  };
  g.set({});
  g.parts = { planks, beams, chains, hangers };
  return g;
}
export const BREAK_X = XB;

// ---------- колонна: 2 в ряд × 37 рядов = 74 солдата ----------
export const COL = { n: 74, rows: 37, dx: .205, dz: .17, s: .3 };
// x головы колонны → позиции солдат (i: ряд = i>>1, сторона = i&1)
export function colPos(i, xf) { const r = i >> 1, s = i & 1; return [xf - r * COL.dx, (s ? 1 : -1) * COL.dz]; }

// ---------- река: шейдер-поверхность, круги от падений (до 12 источников) ----------
export function makeRiver(w, d, { col = '#FFFFFF', base = .012, fres = .07, spec = .7, seg = [120, 100] } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, seg[0], seg[1]); geo.rotateX(-Math.PI / 2);
  const spl = []; for (let i = 0; i < 12; i++) spl.push(new THREE.Vector3(0, 0, -99));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uSpl: { value: spl }, uCol: { value: new THREE.Color(col) }, uBase: { value: base }, uFres: { value: fres }, uSpec: { value: spec }, uOp: { value: 1 },
      uL: { value: new THREE.Vector3(.35, 1, .5).normalize() } },
    vertexShader: `uniform float uT; uniform vec3 uSpl[12]; varying vec3 vN; varying vec3 vW;
      float hgt(vec2 p){
        float h = .0025*sin(p.x*6.3+uT*1.1) + .002*sin(p.y*7.1-uT*.9) + .0015*sin((p.x-p.y)*11.+uT*1.6);
        for (int i = 0; i < 12; i++) { float dt = uT - uSpl[i].z;
          if (dt > 0. && dt < 5.) { float r = length(p - uSpl[i].xy), c = .1 + .9*dt; h += .045*exp(-dt*1.1)*exp(-pow((r-c)*2.4, 2.))*sin((r-c)*14.); } }
        return h; }
      void main(){
        vec3 p = position; vec2 q = p.xz; float e = .03;
        float h = hgt(q), hx = hgt(q + vec2(e, 0.)), hz = hgt(q + vec2(0., e));
        p.y += h;
        vN = normalize(normalMatrix * normalize(vec3(-(hx-h)/e, 1., -(hz-h)/e)));
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 uCol, uL; uniform float uBase, uFres, uSpec, uOp; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        vec3 Lv = normalize((viewMatrix * vec4(uL, 0.)).xyz);
        vec3 Vv = normalize((viewMatrix * vec4(V, 0.)).xyz);
        float f = pow(1. - clamp(dot(N, Vv), 0., 1.), 3.);
        float s = pow(clamp(dot(reflect(-Lv, N), Vv), 0., 1.), 140.);
        float a = uBase + uFres*f + uSpec*s;
        gl_FragColor = vec4(mix(uCol, vec3(1.), clamp(s, 0., 1.)), clamp(a, 0., 1.)*uOp); }`,
    transparent: true, depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = 4; m.position.y = .025;
  m.set = (t, splashes = [], a = 1) => {
    mat.uniforms.uT.value = t; mat.uniforms.uOp.value = a;
    for (let i = 0; i < 12; i++) { const s = splashes[i]; if (s) spl[i].set(s[0], s[1], s[2]); else spl[i].set(0, 0, -99); }
    m.visible = a > .003;
  };
  return m;
}

// ---------- обрушение: солдат на настиле → падение в реку → лежит на воде (чистая функция времени) ----------
// x0 — позиция вдоль моста в момент срыва tf, st(τ) — состояние моста; возвращает { p, rx, rz, onDeck, land }
export function fallPose(t, tf, x, z, stAt, R) {
  const G = 5.2;
  if (t <= tf) return null;
  const o = stAt(tf), y0 = deckY(x, o);
  const vx = .35 + R[0] * .5, vy = .35 + R[1] * .5, vz = (R[2] - .5) * .9;
  const tl = (vy + Math.sqrt(vy * vy + 2 * G * (y0 - .02))) / G;   // время до воды
  const tau = Math.min(t - tf, tl);
  const p = [x + vx * tau, y0 + vy * tau - .5 * G * tau * tau, z + vz * tau];
  const k = tau / tl;
  let rz = -lerp(0, Math.PI / 2 + (R[3] - .5) * .5, smooth(k * 1.1)), rx = (R[4] - .5) * 1.2 * k;
  if (t - tf > tl) {
    // на воде: медленно сносит течением, покачивается
    const a = t - tf - tl;
    p[0] += .04 * a; p[2] += .14 * a; p[1] = .035 + .012 * Math.sin(a * 2.2 + R[0] * 6);
  }
  return { p, rx, rz, land: tf + tl, landP: [x + vx * tl, z + vz * tl] };
}

// ---------- качели ----------
// Перекладина на высоте PIV вдоль Z, сиденье на двух подвесах длины RL; угол θ — поворот вокруг Z (вправо = +X).
export const SW = { PIV: 2.75, RL: 2.1, SEAT: [.6, .07, .42] };
export function makeSwing({ frameMat = null, seatMat = null, ropeMat = null, handMat = null } = {}) {
  frameMat = frameMat || MAT.aluminium();
  seatMat = seatMat || MAT.ceramicBlack();
  ropeMat = ropeMat || MAT.graphite();
  handMat = handMat || MAT.ceramicWhite();
  const g = new THREE.Group();
  const { PIV, RL, SEAT } = SW;
  const leg = (a, b) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, d.length(), 20), frameMat);
    m.position.copy(A).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(UP, d.normalize()); g.add(m);
  };
  const ZF = 1.05;
  for (const z of [-ZF, ZF]) { leg([-1.15, 0, z], [0, PIV + .04, z]); leg([1.15, 0, z], [0, PIV + .04, z]); }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.062, .062, 2 * ZF + .26, 24), frameMat); bar.rotation.x = Math.PI / 2; bar.position.y = PIV + .04; g.add(bar);
  for (const z of [-ZF - .14, ZF + .14]) { const c = new THREE.Mesh(new THREE.SphereGeometry(.07, 20, 14), frameMat); c.position.set(0, PIV + .04, z); g.add(c); }
  const piv = new THREE.Group(); piv.position.y = PIV; g.add(piv);
  for (const z of [-.17, .17]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, RL, 8), ropeMat); r.position.set(0, -RL / 2, z); piv.add(r);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.03, .01, 8, 16), frameMat); ring.position.set(0, 0, z); piv.add(ring);
  }
  const seat = new THREE.Mesh(rbox(...SEAT, .03), seatMat); seat.position.y = -RL - SEAT[1] / 2; piv.add(seat);
  // «рука»: предплечье + кисть, приходит справа (из-за кадра), толкает спинку сиденья
  const hand = new THREE.Group();
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(.075, 1.7, 6, 18), handMat); fore.rotation.z = Math.PI / 2; fore.position.x = .95; hand.add(fore);
  const fist = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), handMat); fist.scale.set(.12, .1, .1); fist.position.x = .02; hand.add(fist);
  g.add(hand);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.set = (theta, handX, handA = 1) => {
    piv.rotation.z = theta;
    const sy = PIV - Math.cos(theta) * (RL + SEAT[1] / 2);
    hand.position.set(handX, sy + .02, 0); hand.visible = handA > .01;
  };
  g.seatPos = theta => [Math.sin(theta) * (RL + SEAT[1] / 2), PIV - Math.cos(theta) * (RL + SEAT[1] / 2), 0];
  g.parts = { piv, seat, hand };
  return g;
}
// Качание с толчками в такт: θ = A(t)·cos(2π(t − t0)/Tp), толчок — у правой крайней точки; после толчка A растёт на dA.
export function swingAt(t, { t0, Tp, A0, dA, nPush, tPush0 = t0 }) {
  let A = A0, last = -1;
  for (let n = 0; n < nPush; n++) { const tp = tPush0 + n * Tp; A += dA * smooth((t - tp) / (Tp * .4)); if (t >= tp - Tp * .3) last = n; }
  return { th: A * Math.cos(TAU * (t - t0) / Tp), A, last };
}

// ---------- Мост тысячелетия ----------
// Пролёт вдоль X (−L/2 … L/2), настил-лезвие на высоте Y; две опоры-«рогатки»; тросы вдоль бортов; боковая мода z = amp·sin(πu)·sin(ph).
export const MB = { L: 15, W: .82, Y: 1.05, N: 72, PIERS: [-2.6, 2.6] };
export function bladeZ(x, o) { const u = (x + MB.L / 2) / MB.L; return u <= 0 || u >= 1 ? 0 : (o.amp || 0) * Math.sin(Math.PI * u) * Math.sin(o.ph || 0); }
export function bladeY(x) { return MB.Y + .12 * (1 - Math.pow(2 * x / MB.L, 2)); }
export function makeBlade({ deckMat = null, pierMat = null, cableMat = null, damperMat = null } = {}) {
  const { L, W, N } = MB;
  deckMat = deckMat || new THREE.MeshPhysicalMaterial({ color: '#D7D9DD', roughness: .3, metalness: .3, clearcoat: .7, clearcoatRoughness: .15 });
  pierMat = pierMat || MAT.graphite();
  cableMat = cableMat || new THREE.MeshPhysicalMaterial({ color: '#8E9096', roughness: .3, metalness: .4, clearcoat: .6 });
  damperMat = damperMat || MAT.graphite();
  const g = new THREE.Group(), sw = L / N;
  const deck = new THREE.InstancedMesh(rbox(sw * 1.01, .07, W, .02, 2), deckMat, N);
  const rails = new THREE.InstancedMesh(rbox(sw * 1.01, .025, .025, .008, 1), cableMat, N * 2);
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(.008, .008, .2, 6), cableMat, N);
  const arms = new THREE.InstancedMesh(rbox(.06, .05, W + .5, .015, 1), pierMat, 12);
  for (const m of [deck, rails, posts, arms]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = m.receiveShadow = true; g.add(m); }
  const cables = segMesh(N * 4, .02, cableMat, 8);
  g.add(cables);
  // опоры: V-образная «рогатка» из двух наклонных ног + перекладина
  MB.PIERS.forEach(px => {
    const mk = (a, b, r) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * .7, r, d.length(), 20), pierMat);
      m.position.copy(A).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(UP, d.normalize()); g.add(m);
    };
    mk([px, 0, 0], [px, .45, 0], .14);
    mk([px, .42, 0], [px, MB.Y + .05, W / 2 + .3], .07); mk([px, .42, 0], [px, MB.Y + .05, -W / 2 - .3], .07);
  });
  // берега-площадки
  for (const sx of [-1, 1]) { const b = new THREE.Mesh(rbox(2.4, MB.Y, 3.4, .04), MAT.ceramicWhite()); b.position.set(sx * (L / 2 + 1.2), MB.Y / 2, 0); g.add(b); }
  // гасители: 8 цилиндров под настилом (появляются k: выезжают снизу)
  // гасители: по 2 на каждой из 8 поперечин — графитовый корпус-капсула + алюминиевый шток, сбоку под настилом
  const DX = [-6.1, -4.6, -1.7, -.6, .6, 1.7, 4.6, 6.1];
  const damp = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.075, .34, 6, 18), damperMat, DX.length * 2);
  const dampC = new THREE.InstancedMesh(new THREE.CylinderGeometry(.028, .028, .78, 12), deckMat, DX.length * 2);
  for (const m of [damp, dampC]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = true; g.add(m); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pv = new THREE.Vector3(), Sv = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  const zc = W / 2 + .2;
  const cableY = x => { let y = MB.Y + .02; for (const p of MB.PIERS) y += .1 * Math.exp(-Math.pow((x - p) / 1.3, 2)); return y - .09 * Math.cos(Math.PI * x / 2.6) * 0; };
  g.set = (o = {}, damperK = 0) => {
    for (let i = 0; i < N; i++) {
      const x = -L / 2 + sw * (i + .5), y = bladeY(x), z = bladeZ(x, o);
      const sl = (bladeY(x + .02) - bladeY(x - .02)) / .04, yaw = -(bladeZ(x + .05, o) - bladeZ(x - .05, o)) / .1;
      E.set(0, yaw, Math.atan(sl)); Q.setFromEuler(E);
      M.compose(Pv.set(x, y - .035, z), Q, Sv); deck.setMatrixAt(i, M);
      for (const s of [0, 1]) { M.compose(Pv.set(x, y + .2, z + (s ? 1 : -1) * (W / 2 - .03)), Q, Sv); rails.setMatrixAt(i * 2 + s, M); }
      M.compose(Pv.set(x, y + .1, z + (i % 2 ? 1 : -1) * (W / 2 - .03)), Q, Sv); posts.setMatrixAt(i, M);
      // тросы вдоль бортов: два яруса с каждой стороны
      const x2 = x + sw, z2 = bladeZ(x2, o);
      for (const [j, sz, dy] of [[0, 1, 0], [1, -1, 0], [2, 1, -.12], [3, -1, -.12]]) {
        if (i === N - 1) { cables.hide(j * N + i); continue; }
        cables.seg(j * N + i, [x, cableY(x) + dy - .1 + (bladeY(x) - MB.Y) * .6, z + sz * zc], [x2, cableY(x2) + dy - .1 + (bladeY(x2) - MB.Y) * .6, z2 + sz * zc]);
      }
    }
    for (let k = 0; k < 12; k++) {
      const x = -L / 2 + (k + .5) * L / 12, z = bladeZ(x, o);
      M.compose(Pv.set(x, bladeY(x) - .1, z), Q.identity(), Sv); arms.setMatrixAt(k, M);
    }
    DX.forEach((x, k) => {
      const kk = smooth((damperK - k * .06) / .6), z = bladeZ(x, o);
      E.set(0, 0, Math.PI / 2); Q.setFromEuler(E);
      for (const sd of [0, 1]) {
        const zz = z + (sd ? 1 : -1) * (W / 2 + .26), yy = bladeY(x) - .17 - (1 - kk) * .7;
        M.compose(Pv.set(x, yy, zz), Q, Sv.set(Math.max(kk, 1e-4), Math.max(kk, 1e-4), Math.max(kk, 1e-4))); damp.setMatrixAt(k * 2 + sd, M); dampC.setMatrixAt(k * 2 + sd, M);
      }
      Sv.set(1, 1, 1);
    });
    damp.visible = dampC.visible = damperK > .003;
    for (const m of [deck, rails, posts, arms, damp, dampC]) m.instanceMatrix.needsUpdate = true;
    cables.instanceMatrix.needsUpdate = true;
  };
  g.set({});
  g.DX = DX;
  return g;
}
// Толпа пешеходов: капсула + голова (InstancedMesh), высота ≈ .26
export function makeWalkers(n, mat) {
  const grp = new THREE.Group();
  const bodyG = new THREE.CapsuleGeometry(.042, .12, 4, 10); bodyG.translate(0, .1, 0);
  const headG = new THREE.SphereGeometry(.036, 12, 9); headG.translate(0, .225, 0);
  const mk = geo => { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = true; grp.add(m); return m; };
  const body = mk(bodyG), head = mk(headG);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pv = new THREE.Vector3(), Sv = new THREE.Vector3(), E = new THREE.Euler();
  return {
    grp,
    set(i, x, y, z, s, lean = 0) { E.set(lean, 0, 0); Q.setFromEuler(E); M.compose(Pv.set(x, y, z), Q, Sv.set(s, s, s)); body.setMatrixAt(i, M); head.setMatrixAt(i, M); },
    commit() { body.instanceMatrix.needsUpdate = true; head.instanceMatrix.needsUpdate = true; },
  };
}

// ---------- 2D ----------
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
export function veil(col, a) { const g = ctx(); if (a <= .003) return; g.save(); g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, 1080, 1920); g.restore(); }
// Стрелка (линия + закрашенный наконечник)
export function arrow(x1, y1, x2, y2, col, a = 1, lw = 3, head = 16, both = false) {
  if (a <= .003) return;
  const g = ctx(), ang = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 2) return;
  const h = Math.min(head, L * .45);
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  const tip = (x, y, an) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(an - .42) * h, y - Math.sin(an - .42) * h); g.lineTo(x - Math.cos(an + .42) * h, y - Math.sin(an + .42) * h); g.closePath(); g.fill(); };
  g.beginPath(); g.moveTo(x1 + (both ? Math.cos(ang) * h * .7 : 0), y1 + (both ? Math.sin(ang) * h * .7 : 0)); g.lineTo(x2 - Math.cos(ang) * h * .7, y2 - Math.sin(ang) * h * .7); g.stroke();
  tip(x2, y2, ang); if (both) tip(x1, y1, ang + Math.PI);
  g.restore();
}
// Размерная линия с засечками
export function dim(x1, y1, x2, y2, a, col, tick = 12, lw = 2) {
  if (a <= .003) return;
  const g = ctx(), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * tick, ny = dx / L * tick;
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
  g.moveTo(x1 - nx, y1 - ny); g.lineTo(x1 + nx, y1 + ny); g.moveTo(x2 - nx, y2 - ny); g.lineTo(x2 + nx, y2 + ny);
  g.stroke(); g.restore();
}
// Полилиния (график), рисуется до доли p; col — цвет, a — прозрачность
export function polyline(pts, col, a = 1, lw = 3, dash = null) {
  if (a <= .003 || pts.length < 2) return;
  const g = ctx(); g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  if (dash) g.setLineDash(dash);
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore();
}
// Заголовок из слов, каждое — в свой момент (ts[i]), из ep12 kit.mjs
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = ENG.measure(' ', size, w, track), wd = ws.map(q => ENG.measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}
// Крупная цифра + подпись (6:1)
export function bigNum(txt, cap, t, t0, tOut, { y = 470, size = 280, col, sub, capT = null, capSize = 46 } = {}) {
  atext(txt, 540, y, t0, t, { size, w: 700, col, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: tOut });
  if (cap) atext(cap, 540, y + Math.round(size * .27), capT ?? t0 + .25, t, { size: capSize, w: 500, col: sub, track: -.005, out: tOut });
}

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs), копия из ep12/kit.mjs
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
export { rng };
