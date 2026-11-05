// Общие детали выпуска № 17 (парадокс Монти Холла): керамическая стена-«студия» с тремя кабинками
// (передняя стена с тремя проёмами, перегородки, задняя стенка), двери на петлях с ручкой, филёнкой и номером,
// машина-приз (makeCar из a1, монохромно) в одной кабинке; режим «рентген» (дверь становится стеклом и
// сквозь неё угадывается машина); световая полоска на полу перед выбранной дверью.
// Стена из 100 дверей-плиток (InstancedMesh) для сцены hundred, журнальная полоса и письма для сцены story.
// 2D-помощники: свечение, заголовки по словам, составные строки, скобка, пилюля.
// Не сцена: импортируется сценами выпуска и обложкой (hero.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, MAT, clamp, lerp, rng, FONT, atext, line } from '../../../engine.mjs';
import { makeCar } from '../../a1/scenes/kit.mjs';
export { makeCar };

export const ctx = () => ENG.g;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// ---------- геометрия ----------
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
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };

// ---------- раскладка студии ----------
export const DW = 1.12, DH = 2.0, PITCH = 1.72, WALL_H = 2.62, WT = .14, BD = 2.5;
export const DX = i => (i - 1) * PITCH;                 // центры дверей 0, 1, 2
export const WALL_W = 3 * PITCH + .3;
export const CAR_S = .5;

// Номер на двери: тонкая гравировка (CanvasTexture)
function numTex(n, col) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.font = `600 200px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(String(n), 128, 140);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
}

// Дверь: пивот на петле (левая кромка, лицевая плоскость z = 0), полотно, филёнка, ручка, номер
export function makeDoor(n, { col = '#F2F2F0', numCol = '#8E8E93' } = {}) {
  const pivot = new THREE.Group();
  const leafMat = new THREE.MeshPhysicalMaterial({ color: col, roughness: .4, clearcoat: .4, clearcoatRoughness: .25, transparent: true, opacity: 1 });
  const panelMat = leafMat;
  const knobMat = MAT.aluminium();
  knobMat.transparent = true;
  const leaf = new THREE.Group();
  const T = .09;
  const slab = mesh(rbox(DW, DH, T, .03), leafMat, DW / 2, DH / 2, -T / 2);
  const p1 = mesh(rbox(DW - .34, DH * .38, .03, .012, 2), panelMat, DW / 2, DH * .72, .006);
  const p2 = mesh(rbox(DW - .34, DH * .36, .03, .012, 2), panelMat, DW / 2, DH * .3, .006);
  const stem = mesh(new THREE.CylinderGeometry(.022, .022, .07, 16).rotateX(Math.PI / 2), knobMat, DW - .13, DH * .5, .035);
  const knob = mesh(new THREE.SphereGeometry(.055, 24, 16), knobMat, DW - .13, DH * .5, .08);
  const numMat = new THREE.MeshBasicMaterial({ map: numTex(n, numCol), transparent: true, depthWrite: false });
  const num = new THREE.Mesh(new THREE.PlaneGeometry(.26, .26), numMat); num.position.set(DW / 2, DH * .72, .024);
  p1.castShadow = p2.castShadow = false;
  leaf.add(slab, p1, p2, stem, knob, num);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry, 30), new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false }));
  edges.position.copy(slab.position); leaf.add(edges);
  pivot.add(leaf);
  pivot.mats = { leafMat, knobMat, numMat, edges: edges.material };
  pivot.base = leafMat.color.clone();
  // open 0..1 — угол раскрытия наружу (к камере), xray 0..1 — полотно становится стеклом, bright — яркость
  pivot.set = ({ open = 0, xray = 0, bright = 1 } = {}) => {
    pivot.rotation.y = -open * 1.9;
    const op = lerp(1, .12, xray);
    leafMat.opacity = op; leafMat.depthWrite = xray < .02;
    knobMat.opacity = op; knobMat.depthWrite = xray < .02;
    numMat.opacity = lerp(1, .2, xray);
    edges.material.opacity = .8 * xray;
    leafMat.color.copy(pivot.base).multiplyScalar(bright);
    slab.castShadow = xray < .5;
  };
  pivot.set();
  return pivot;
}

// Студия: стена с тремя проёмами, три кабинки, двери, машина за дверью prize, полоски выбора
export function makeStudio({ prize = 1, bg = 'black', car = true } = {}) {
  const grp = new THREE.Group();
  // стена — графит (чёрная керамика), двери — белая керамика, наличники — алюминий
  const wallMat = new THREE.MeshPhysicalMaterial({ color: bg === 'white' ? '#3A3A3C' : '#232326', roughness: .34, clearcoat: .9, clearcoatRoughness: .15 });
  const innerMat = new THREE.MeshPhysicalMaterial({ color: bg === 'white' ? '#4A4A4E' : '#3A3A3E', roughness: .7 });
  const trimMat = new THREE.MeshPhysicalMaterial({ color: '#C9CBCF', roughness: .3, metalness: .3, clearcoat: .6 });
  // передняя стена: столбы и перемычки
  const gap = PITCH - DW - .12;          // ширина простенка между проёмами (с учётом наличников)
  const side = (WALL_W - 3 * PITCH) / 2 + (PITCH - DW - .12) / 2;
  const posts = [];
  for (let k = 0; k <= 3; k++) {
    const w = k === 0 || k === 3 ? side : gap;
    const x = k === 0 ? -WALL_W / 2 + w / 2 : k === 3 ? WALL_W / 2 - w / 2 : (DX(k - 1) + DX(k)) / 2;
    posts.push(mesh(new THREE.BoxGeometry(w, WALL_H, WT), wallMat, x, WALL_H / 2, -WT / 2));
  }
  const lint = [0, 1, 2].map(i => mesh(new THREE.BoxGeometry(DW + .14, WALL_H - DH - .06, WT), wallMat, DX(i), (WALL_H + DH + .06) / 2, -WT / 2));
  // наличники (тёмный графит): тонкая рамка вокруг проёма
  const trims = [];
  for (let i = 0; i < 3; i++) {
    const x = DX(i);
    trims.push(mesh(rbox(.06, DH + .06, WT + .03, .015, 2), trimMat, x - DW / 2 - .03, (DH + .06) / 2, -WT / 2));
    trims.push(mesh(rbox(.06, DH + .06, WT + .03, .015, 2), trimMat, x + DW / 2 + .03, (DH + .06) / 2, -WT / 2));
    trims.push(mesh(rbox(DW + .12, .06, WT + .03, .015, 2), trimMat, x, DH + .03, -WT / 2));
  }
  // кабинки: перегородки и задняя стенка
  const inner = [];
  for (let k = 0; k <= 3; k++) {
    const x = k === 0 ? DX(0) - PITCH / 2 : k === 3 ? DX(2) + PITCH / 2 : (DX(k - 1) + DX(k)) / 2;
    inner.push(mesh(new THREE.BoxGeometry(.06, WALL_H, BD), innerMat, x, WALL_H / 2, -WT - BD / 2));
  }
  inner.push(mesh(new THREE.BoxGeometry(3 * PITCH + .06, WALL_H, .06), innerMat, 0, WALL_H / 2, -WT - BD));
  const roof = mesh(new THREE.BoxGeometry(3 * PITCH + .06, .05, BD), innerMat, 0, WALL_H - .025, -WT - BD / 2);
  inner.push(roof);
  grp.add(...posts, ...lint, ...trims, ...inner);
  // конструкция не отбрасывает теней внутрь кабинок: ключ освещает приз сквозь открытую дверь
  [...posts, ...lint, ...trims, ...inner].forEach(m => { m.castShadow = false; });
  // двери
  const doors = [0, 1, 2].map(i => {
    const d = makeDoor(i + 1, { col: bg === 'white' ? '#FFFFFF' : '#F2F2F0', numCol: bg === 'white' ? '#A1A1A6' : '#8E8E93' });
    d.position.set(DX(i) - DW / 2, 0, .0); grp.add(d); return d;
  });
  // машина-приз (смотрит на камеру)
  let carM = null;
  if (car) {
    carM = makeCar();
    carM.scale.setScalar(CAR_S); carM.rotation.y = -Math.PI / 2;
    carM.position.set(DX(prize), 0, -WT - BD / 2 - .05);
    grp.add(carM);
  }
  // полоски выбора на полу (светятся)
  const stripMat = () => new THREE.MeshBasicMaterial({ color: bg === 'white' ? '#1D1D1F' : '#FFFFFF', transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const strips = [0, 1, 2].map(i => {
    const m = new THREE.Mesh(rbox(DW * .86, .012, .05, .006, 1), stripMat()); m.position.set(DX(i), .008, .34); grp.add(m); return m;
  });
  const mats = { wallMat, innerMat, trimMat };
  const base = { wall: wallMat.color.clone(), inner: innerMat.color.clone(), trim: trimMat.color.clone() };
  return {
    grp, doors, car: carM, strips, posts, lint, mats,
    // яркость стены (проявление из темноты)
    lit(k) { wallMat.color.copy(base.wall).multiplyScalar(k); innerMat.color.copy(base.inner).multiplyScalar(k); trimMat.color.copy(base.trim).multiplyScalar(k); },
    sel() {},
  };
}

// ---------- стена из 100 дверей-плиток ----------
export const GN = 10, TW = .34, TH = .48, TGX = .1, TGY = .1;
export const TX = c => (c - (GN - 1) / 2) * (TW + TGX);
export const TB = .4;
export const TY = r => TB + (GN - 1 - r) * (TH + TGY) + TH / 2;   // r = 0 — верхний ряд
export function makeTileWall({ chosen = 23, other = 78 } = {}) {
  const grp = new THREE.Group();
  const N = GN * GN;
  const tileMat = new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .42, clearcoat: .35 });
  const knobMat = MAT.aluminium();
  const tgeo = rbox(TW, TH, .05, .018, 2); tgeo.translate(TW / 2, 0, -.025);
  const kgeo = new THREE.SphereGeometry(.022, 12, 8); kgeo.translate(TW - .055, 0, .02);
  const tiles = new THREE.InstancedMesh(tgeo, tileMat, N), knobs = new THREE.InstancedMesh(kgeo, knobMat, N);
  tiles.castShadow = tiles.receiveShadow = true; knobs.castShadow = true;
  tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage); knobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const col = new THREE.Color();
  for (let i = 0; i < N; i++) tiles.setColorAt(i, col.set('#FFFFFF'));
  // подложка: чёрная глянцевая панель с ячейками-нишами (открытая дверь показывает пустую нишу)
  const W = GN * (TW + TGX) + .2, H = GN * (TH + TGY) + .2;
  const BH2 = TB - .15 + H;
  const board = mesh(rbox(W, BH2, .12, .03), MAT.graphite(), 0, BH2 / 2, -.14);
  board.material.color.set('#232325');
  const niche = new THREE.InstancedMesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshBasicMaterial({ color: '#050506' }), N);
  const M = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { const r = Math.floor(i / GN), c = i % GN; M.makeTranslation(TX(c), TY(r), -.075); niche.setMatrixAt(i, M); }
  grp.add(board, niche, tiles, knobs);
  const R = new THREE.Matrix4(), T1 = new THREE.Matrix4(), Q = new THREE.Matrix4();
  return {
    grp, tiles, knobs, board, N, chosen, other,
    // f(i) → { open, dz, bright, show }
    set(f) {
      for (let i = 0; i < N; i++) {
        const r = Math.floor(i / GN), c = i % GN, s = f(i);
        const sc = s.show == null ? 1 : Math.max(1e-4, s.show);
        T1.makeTranslation(TX(c) - TW / 2, TY(r) + (s.dy || 0), (s.dz || 0));
        R.makeRotationY(-(s.open || 0) * 1.75);
        Q.makeScale(sc, sc, sc);
        M.copy(T1).multiply(R).multiply(Q);
        tiles.setMatrixAt(i, M); knobs.setMatrixAt(i, M);
        tiles.setColorAt(i, col.setScalar(s.bright == null ? 1 : s.bright));
      }
      tiles.instanceMatrix.needsUpdate = knobs.instanceMatrix.needsUpdate = true;
      tiles.instanceColor.needsUpdate = true;
    },
  };
}

// ---------- журнальная полоса (страница с колонками) ----------
export function makePage() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1400;
  const g = c.getContext('2d');
  g.fillStyle = '#FAFAF8'; g.fillRect(0, 0, 1024, 1400);
  const R = rng(17);
  // шапка
  g.fillStyle = '#1D1D1F'; g.fillRect(70, 70, 884, 14);
  g.fillStyle = '#2C2C2E'; g.fillRect(70, 120, 560, 54); g.fillRect(70, 190, 380, 54);
  g.fillStyle = '#B0B0B5'; g.fillRect(70, 280, 884, 4);
  // три колонки строк
  const colX = [70, 370, 670], colW = 284;
  for (let k = 0; k < 3; k++) {
    let y = 320;
    while (y < 1320) {
      // в средней колонке — врезка с тремя дверями
      if (k === 1 && y > 520 && y < 560) {
        g.strokeStyle = '#3A3A3C'; g.lineWidth = 4; g.strokeRect(colX[k], y, colW, 250);
        for (let d = 0; d < 3; d++) {
          const dx = colX[k] + 30 + d * 82;
          g.fillStyle = d === 2 ? '#FAFAF8' : '#3A3A3C'; g.fillRect(dx, y + 50, 62, 150);
          g.strokeStyle = '#3A3A3C'; g.strokeRect(dx, y + 50, 62, 150);
          g.fillStyle = d === 2 ? '#3A3A3C' : '#FAFAF8'; g.beginPath(); g.arc(dx + 50, y + 128, 5, 0, 7); g.fill();
        }
        y += 290; continue;
      }
      const par = R() < .12;
      const w = par ? colW * (.35 + R() * .4) : colW * (.86 + R() * .14);
      g.fillStyle = '#A1A1A6'; g.fillRect(colX[k], y, w, 12);
      y += par ? 48 : 28;
    }
  }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  const mat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: tx, roughness: .55, clearcoat: .15 });
  const edgeMat = new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .5 });
  const W = 2.6, H = 3.55;
  const geo = new THREE.BoxGeometry(W, .03, H);
  const m = new THREE.Mesh(geo, [edgeMat, edgeMat, mat, edgeMat, edgeMat, edgeMat]);
  m.castShadow = m.receiveShadow = true;
  const grp = new THREE.Group(); grp.add(m); m.position.y = .015;
  grp.W = W; grp.H = H;
  return grp;
}
// Письма: InstancedMesh конвертов (верхняя грань с клапаном — текстура)
export function makeLetters(n = 90) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#F4F4F2'; g.fillRect(0, 0, 256, 160);
  g.strokeStyle = '#B5B5BA'; g.lineWidth = 4; g.beginPath(); g.moveTo(4, 4); g.lineTo(128, 92); g.lineTo(252, 4); g.stroke();
  g.fillStyle = '#C7C7CC'; g.fillRect(150, 112, 70, 8); g.fillRect(150, 128, 50, 8);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const top = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: tx, roughness: .5 });
  const sideM = new THREE.MeshPhysicalMaterial({ color: '#E4E4E2', roughness: .5 });
  const geo = new THREE.BoxGeometry(.64, .015, .4);
  const im = new THREE.InstancedMesh(geo, [sideM, sideM, top, sideM, sideM, sideM], n);
  im.castShadow = im.receiveShadow = true;
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const R = rng(1990);
  const slots = [];
  for (let i = 0; i < n; i++) slots.push({ x: (R() - .5) * .26, z: (R() - .5) * .22, ry: (R() - .5) * .9, tilt: (R() - .5) * .06, x0: (R() - .5) * 1.2 - .3, z0: (R() - .5) * 1.2 + .3 });
  const M = new THREE.Matrix4(), Qn = new THREE.Quaternion(), Eu = new THREE.Euler(), V = new THREE.Vector3(), Sv = new THREE.Vector3();
  return {
    mesh: im, n,
    // f(i) → прогресс 0..1 полёта письма i на своё место в стопке (0 — нет)
    set(f) {
      for (let i = 0; i < n; i++) {
        const p = f(i), s = slots[i];
        const e = smooth(p);
        V.set(lerp(s.x0, s.x, e), i * .016 + .011 + (1 - e) * 1.1, lerp(s.z0, s.z, e));
        Eu.set(s.tilt + (1 - e) * .8, s.ry + (1 - e) * 1.6, (1 - e) * .5);
        Qn.setFromEuler(Eu);
        const sc = p <= 0 ? 1e-4 : 1;
        Sv.set(sc, sc, sc);
        M.compose(V, Qn, Sv); im.setMatrixAt(i, M);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------- камера ----------
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}
export function keys(K, t, ease) {
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) {
    const a = K[i - 1], b = K[i], p = ease((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => v + (b[j + 1] - v) * p);
  }
  return K[K.length - 1].slice(1);
}
// свет «из темноты»: сначала контровые, потом ключ; ключ медленно скользит
export function lights(stage, t, t0, t1, { kx = [-4, 4] } = {}) {
  const L = stage.lights, white = stage.bg === 'white';
  const lr = P2(t, t0, .9), lk = white ? 1 : P2(t, t0 + .25, 1.3);
  L.key.position.set(lerp(kx[0], kx[1], clamp((t - t0) / (t1 - t0))), 9, 7);
  if (!white) { L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; }
  return { lr, lk };
}
const P2 = (t, a, d) => ENG.P(t, a, d);

// ---------- 2D ----------
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
export function wordsAt(ws, ts, x, y, t, o = {}) {
  const { size = 112, w = 600, track = -.03 } = o;
  const sp = ENG.measure(' ', size, w, track), wd = ws.map(q => ENG.measure(q, size, w, track));
  const tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2;
  ws.forEach((q, i) => { atext(q, cx, y, ts[i], t, { ...o, size, w, track, align: 'left' }); cx += wd[i] + sp; });
}
// Строка из частей разного цвета: [[текст, цвет, задержка], …]
export function atextParts(parts, x, y, t0, t, o = {}) {
  const { size = 96, w = 600, track = -.025 } = o;
  const wd = parts.map(([s]) => ENG.measure(s, size, w, track)), tot = wd.reduce((A, B) => A + B, 0);
  let cx = x - tot / 2;
  parts.forEach(([s, col, dt = 0], i) => { atext(s, cx, y, t0 + dt, t, { ...o, size, w, track, col, align: 'left' }); cx += wd[i]; });
}
// Скобка над дверями: горизонталь с загнутыми вниз концами, рисуется от центра на долю p
export function bracket(x1, x2, y, p, col, a = 1, lw = 3, h = 22) {
  if (a <= .003 || p <= 0) return;
  const g = ctx(), cx = (x1 + x2) / 2, hw = (x2 - x1) / 2 * clamp(p);
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(cx - hw, y + h * clamp(p * 2 - 1)); g.lineTo(cx - hw, y); g.lineTo(cx + hw, y); g.lineTo(cx + hw, y + h * clamp(p * 2 - 1));
  g.stroke();
  g.beginPath(); g.moveTo(cx, y); g.lineTo(cx, y - 14 * clamp(p * 2 - 1)); g.stroke();
  g.restore();
}
// Дуга-стрелка (пунктир) от a к b через вершину выше на lift, рисуется на долю p
export function arcArrow(ax, ay, bx, by, lift, p, col, a = 1, lw = 3) {
  if (a <= .003 || p <= 0) return;
  const g = ctx(), n = 40, pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(ax, bx, u), y = lerp(ay, by, u) - lift * 4 * u * (1 - u);
    pts.push([x, y]);
  }
  const m = Math.max(1, Math.round(n * clamp(p)));
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.setLineDash([2, 11]);
  g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i <= m; i++) g.lineTo(...pts[i]); g.stroke();
  g.setLineDash([]);
  if (p > .96) {
    const [x1, y1] = pts[n - 2], [x2, y2] = pts[n];
    const ang = Math.atan2(y2 - y1, x2 - x1), hh = 16;
    g.beginPath(); g.moveTo(x2, y2);
    g.lineTo(x2 - hh * Math.cos(ang - .45), y2 - hh * Math.sin(ang - .45));
    g.lineTo(x2 - hh * Math.cos(ang + .45), y2 - hh * Math.sin(ang + .45)); g.closePath(); g.fill();
  }
  g.restore();
}
export { line };
// Полоска выбора под дверью i (2D, на полу перед проёмом): тонкая светящаяся линия
export function selBar(cam, i, a, col, dark = true) {
  if (a <= .003) return;
  const [x1, y1] = ENG.project(cam, DX(i) - DW * .42, 0, .32), [x2, y2] = ENG.project(cam, DX(i) + DW * .42, 0, .32);
  const g = ctx(), y = (y1 + y2) / 2;
  if (dark) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .35;
    const gr = g.createRadialGradient((x1 + x2) / 2, y, 0, (x1 + x2) / 2, y, (x2 - x1) * .7);
    gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.translate((x1 + x2) / 2, y); g.scale(1, .18); g.translate(-(x1 + x2) / 2, -y);
    g.fillStyle = gr; g.fillRect(x1 - 200, y - 400, x2 - x1 + 400, 800); g.restore();
  }
  line(lerp(x1, x2, .5 - .5 * a), y1, lerp(x1, x2, .5 + .5 * a), y2, col, a, 6);
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
