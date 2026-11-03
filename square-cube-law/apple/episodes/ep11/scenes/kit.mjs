// Общие детали выпуска ep11 (сохранение момента импульса): керамическая фигуристка-волчок из примитивов
// (туловище-лейка, юбка-конус, голова-сфера, руки-стержни, опорная нога с коньком, свободная нога в «пассе»),
// чёрный лёд-зеркало, угол вращения как интеграл ω(t), «шлейф» из полупрозрачных копий, 2D-помощники и пилюля.
// Не сцена: импортируется сценами и обложкой (hero.mjs). Часть помощников — из ep10/w1 (kit.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, project, clamp, lerp, FONT, MAT } from '../../../engine.mjs';
import { rod } from '../../../models.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// ---------- время ----------
// Угол поворота (рад) = 2π ∫ ω(τ) dτ от t0 до t, ω — об/с. Численно (Симпсон), без накопленного состояния.
export function spinAngle(omega, t0, t, n = 240) {
  if (t <= t0) return 0;
  const h = (t - t0) / n;
  let s = omega(t0) + omega(t);
  for (let i = 1; i < n; i++) s += omega(t0 + i * h) * (i % 2 ? 4 : 2);
  return TAU * s * h / 3;
}

// ---------- камера ----------
// Камера на орбите; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920).
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}

// ---------- фигуристка ----------
// Ось вращения — вертикаль через опорный конёк (x = z = 0), лицом в +Z, рост ≈ 1.87.
export const SK_H = 1.87, SK_CX = -.055, SH_Y = 1.47;
const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// Руки: a = 0 — раскинуты в стороны, a = 1 — прижаты к груди (кисти сходятся перед грудью).
function armPts(a, side) {
  const cx = SK_CX, sh = [cx + side * .175, SH_Y, 0];
  const k = a, up = Math.sin(Math.PI * k) * .05;
  const el = [cx + side * lerp(.47, .27, k), lerp(1.45, 1.31, k) + up, lerp(.02, .15, k)];
  const hd = [cx + side * lerp(.79, .035, k), lerp(1.43, 1.37, k) + up * 1.4, lerp(.04, .22, k)];
  // промежуточные позы: кисть идёт по дуге вокруг плеча, а не насквозь через грудь
  const arcK = Math.sin(Math.PI * k) * .22;
  hd[2] += arcK; el[2] += arcK * .5;
  return [sh, el, hd];
}
export function handLocal(a, side) { return armPts(a, side)[2]; }

export function makeSkater({ mat = null, boot = null, blade = null, ghost = false } = {}) {
  mat = mat || MAT.ceramicWhite();
  boot = boot || MAT.ceramicBlack();
  blade = blade || MAT.aluminium();
  const g = new THREE.Group();
  // туловище: лейка с талией, сплюснута по глубине
  const torso = new THREE.Mesh(lathe([[0, .97], [.115, .99], [.128, 1.06], [.112, 1.17], [.138, 1.32], [.165, 1.45], [.14, 1.53], [.07, 1.585], [0, 1.6]]), mat);
  torso.scale.set(1, 1, .72); torso.position.x = SK_CX;
  // юбка: тонкий конус, раскрывается от скорости
  const skirtGeo = lathe([[.118, 1.035], [.16, .97], [.215, .9], [.25, .86]], 40);
  const skirt = new THREE.Mesh(skirtGeo, mat.clone ? mat : mat); skirt.position.x = SK_CX;
  skirt.material = mat.clone(); skirt.material.side = THREE.DoubleSide;
  if (ghost) skirt.material = mat;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.042, .048, .12, 20), mat); neck.position.set(SK_CX, 1.63, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.105, 40, 28), mat); head.position.set(SK_CX, 1.765, 0);
  // пучок волос — маленькая сфера на затылке (читается поворот головы)
  const bun = new THREE.Mesh(new THREE.SphereGeometry(.05, 24, 16), mat); bun.position.set(SK_CX, 1.82, -.085);
  // опорная нога: бедро и голень, ботинок, лезвие
  const leg1 = rod(mat, .052, 18), leg2 = rod(mat, .044, 18);
  leg1.set([-.035, .95, 0], [-.01, .55, .01]); leg2.set([-.01, .55, .01], [0, .2, 0]);
  const bootM = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .16, 24), boot); bootM.position.set(0, .135, .0);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), boot); toe.scale.set(.06, .05, .1); toe.position.set(0, .085, .07);
  const bladeM = new THREE.Mesh(new THREE.BoxGeometry(.016, .045, .3), blade); bladeM.position.set(0, .03, .03);
  // свободная нога в «пассе»: колено в сторону-вперёд, носок у колена опорной
  const fl1 = rod(mat, .05, 18), fl2 = rod(mat, .041, 18);
  const kn = [-.31, .7, .2], ft = [-.06, .56, .1];
  fl1.set([-.13, .95, 0], kn); fl2.set(kn, ft);
  const fboot = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat); fboot.scale.set(.045, .04, .075);
  fboot.position.set(...ft); fboot.rotation.y = -.9;
  // руки
  const arms = [1, -1].map(side => ({ side, up: rod(mat, .034, 16), lo: rod(mat, .03, 16), hand: new THREE.Mesh(new THREE.SphereGeometry(.04, 20, 14), mat) }));
  arms.forEach(A => g.add(A.up, A.lo, A.hand));
  g.add(torso, skirt, neck, head, bun, leg1, leg2, bootM, toe, bladeM, fl1, fl2, fboot);
  g.pose = ({ arms: a = 0, flare = 0 } = {}) => {
    arms.forEach(A => {
      const [sh, el, hd] = armPts(a, A.side);
      A.up.set(sh, el); A.lo.set(el, hd); A.hand.position.set(...hd);
    });
    // юбка раскрывается центробежной силой: чем быстрее, тем шире и выше край
    skirt.scale.set(1 + .35 * flare, 1 - .25 * flare, (1 + .35 * flare) * .85);
    skirt.position.y = 1.035 * .25 * flare;
  };
  g.pose();
  if (!ghost) g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// Фигуристка с зеркальным отражением во льду и «шлейфом» (копии с отставанием по углу).
export function makeSpinner(stage, { ghosts = 3, dark = true } = {}) {
  const grp = new THREE.Group();
  const main = makeSkater();
  const mirror = new THREE.Group(); mirror.scale.y = -1;
  // отражение и шлейф — дешёвые Lambert-материалы (их почти не видно, а clearcoat в программном рендере дорог)
  const refl = makeSkater({ ghost: true, mat: new THREE.MeshLambertMaterial({ color: '#E6E6E4' }), boot: new THREE.MeshLambertMaterial({ color: '#141416' }), blade: new THREE.MeshLambertMaterial({ color: '#A8AAAE' }) });
  refl.traverse(o => { if (o.isMesh) o.castShadow = false; });
  mirror.add(refl);
  const gs = [];
  for (let i = 0; i < ghosts; i++) {
    const m = new THREE.MeshLambertMaterial({ color: '#F2F2F0', transparent: true, opacity: .2, depthWrite: false });
    const b = new THREE.MeshLambertMaterial({ color: '#141416', transparent: true, opacity: .2, depthWrite: false });
    const gk = makeSkater({ mat: m, boot: b, blade: b, ghost: true }); gk.traverse(o => { if (o.isMesh) o.renderOrder = 4; });
    gs.push({ g: gk, m, b }); grp.add(gk);
  }
  grp.add(main, mirror);
  grp.set = (ang, omega, a, flare, k = 1) => {
    // omega — об/с; копии отстают на ω·Δt (как выдержка камеры)
    main.rotation.y = ang; main.pose({ arms: a, flare });
    refl.rotation.y = ang; refl.pose({ arms: a, flare });
    gs.forEach((G, i) => {
      const lag = TAU * omega * .011 * (i + 1);
      G.g.rotation.y = ang - lag; G.g.pose({ arms: a, flare });
      const op = k * clamp((omega - 1.2) / 3) * [.22, .12, .06, .03][i];
      G.m.opacity = op; G.b.opacity = op * .8;
      G.g.visible = op > .004;
    });
  };
  grp.parts = { main, refl, mirror, ghosts: gs };
  return grp;
}

// Чёрный лёд: зеркальные копии под полупрозрачной чёрной плоскостью, мягкая тень, тонкие следы-окружности.
export function makeIce(stage, { opacity = .88, rings = true } = {}) {
  stage.floor.visible = true; stage.floor.position.y = .004; stage.floor.renderOrder = 3;
  const grp = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity }));
  m.rotation.x = -Math.PI / 2; m.position.y = .002; m.renderOrder = 2;
  grp.add(m);
  const lines = [];
  if (rings) {
    // следы лезвия: несколько незамкнутых окружностей вокруг точки вращения
    [[.09, .0, 5.2, .22], [.16, 1.2, 4.6, .16], [.26, 2.6, 5.6, .12], [.42, .7, 3.8, .09], [.66, 3.4, 4.2, .07], [1.05, 1.9, 3.1, .05]].forEach(([r, a0, len, op]) => {
      const pts = [];
      for (let i = 0; i <= 96; i++) { const a = a0 + len * i / 96; pts.push(new THREE.Vector3(r * Math.cos(a), .005, r * Math.sin(a))); }
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: op }));
      l.renderOrder = 5; l.userData.op = op; grp.add(l); lines.push(l);
    });
  }
  grp.fade = k => lines.forEach(l => { l.material.opacity = l.userData.op * k; });
  grp.mirror = m;
  return grp;
}

// Мировая позиция кисти при повороте ang вокруг оси Y (группа в начале координат, масштаб sc).
export function handWorld(a, side, ang, sc = 1, pos = [0, 0, 0]) {
  const [x, y, z] = handLocal(a, side), c = Math.cos(ang), s = Math.sin(ang);
  return [pos[0] + sc * (x * c + z * s), pos[1] + sc * y, pos[2] + sc * (-x * s + z * c)];
}

// ---------- 2D ----------
// След кисти: дуга по окружности вращения за последние dt секунд, гаснет к хвосту.
export function handTrail(cam, a, side, ang, omega, { dt = .09, sc = 1, pos = [0, 0, 0], col = '#FFFFFF', alpha = 1, lw = 3, n = 16 } = {}) {
  const g = ctx(); if (alpha <= .003) return;
  const span = TAU * omega * dt;
  let prev = project(cam, ...handWorld(a, side, ang, sc, pos));
  g.save(); g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 1; i <= n; i++) {
    const p = project(cam, ...handWorld(a, side, ang - span * i / n, sc, pos));
    g.globalAlpha = alpha * Math.pow(1 - (i - 1) / n, 1.6);
    g.lineWidth = lw * (1 - .6 * i / n);
    g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(p[0], p[1]); g.stroke();
    prev = p;
  }
  g.restore();
}
// Проекция окружности (радиус r, высота y) — эллипс-орбита.
export function ring3(cam, r, y, { col = '#FFFFFF', a = 1, lw = 2, dash = null, N = 120, cx = 0, cz = 0 } = {}) {
  const g = ctx(); if (a <= .003 || r <= .001) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; if (dash) g.setLineDash(dash);
  g.beginPath();
  for (let i = 0; i <= N; i++) { const q = TAU * i / N, [x, yy] = project(cam, cx + r * Math.cos(q), y, cz + r * Math.sin(q)); i ? g.lineTo(x, yy) : g.moveTo(x, yy); }
  g.stroke(); g.restore();
}
// Размерная линия с засечками.
export function dim(x1, y1, x2, y2, a, col, tick = 12, lw = 2) {
  if (a <= .003) return;
  const g = ctx(), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * tick, ny = dx / L * tick;
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
  g.moveTo(x1 - nx, y1 - ny); g.lineTo(x1 + nx, y1 + ny); g.moveTo(x2 - nx, y2 - ny); g.lineTo(x2 + nx, y2 + ny);
  g.stroke(); g.restore();
}
// Окружность на экране, рисуется на долю p.
export function circle(x, y, r, col, a = 1, lw = 2, dash = null, p = 1, start = -Math.PI / 2) {
  if (a <= .003 || p <= 0) return;
  const g = ctx(); g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; if (dash) g.setLineDash(dash);
  g.beginPath(); g.arc(x, y, r, start, start + TAU * clamp(p)); g.stroke(); g.restore();
}
// Стрелка-дуга вращения (по эллипсу вокруг оси), рисуется на долю p.
export function spinArrow(cam, r, y, a0, len, p, col, a = 1, lw = 3) {
  if (a <= .003 || p <= 0) return;
  const g = ctx(), N = 40, pts = [];
  for (let i = 0; i <= N; i++) { const q = a0 + len * clamp(p) * i / N; pts.push(project(cam, r * Math.cos(q), y, r * Math.sin(q))); }
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); pts.forEach(([x, yy], i) => i ? g.lineTo(x, yy) : g.moveTo(x, yy)); g.stroke();
  const [x1, y1] = pts[N - 1], [x2, y2] = pts[N], ang = Math.atan2(y2 - y1, x2 - x1), h = 16;
  g.beginPath(); g.moveTo(x2 + Math.cos(ang) * 4, y2 + Math.sin(ang) * 4);
  g.lineTo(x2 - Math.cos(ang - .45) * h, y2 - Math.sin(ang - .45) * h); g.lineTo(x2 - Math.cos(ang + .45) * h, y2 - Math.sin(ang + .45) * h);
  g.closePath(); g.fill(); g.restore();
}
// Отражение во льду гаснет с глубиной: чёрный градиент от линии льда вниз.
export function fadeBelow(y0, len = 440, col = '0,0,0', a = 1) {
  const g = ctx(); g.save();
  const gr = g.createLinearGradient(0, y0, 0, y0 + len);
  gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(.45, `rgba(${col},${.55 * a})`); gr.addColorStop(1, `rgba(${col},${a})`);
  g.fillStyle = gr; g.fillRect(0, y0, 1080, 1920 - y0); g.restore();
}
// Мягкое пятно света (для чёрного фона)
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)');
  gr.addColorStop(.45, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs), копия из ep10/kit.mjs
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
