// Сцена «fall» (69.1–79.8 с), белый фон.
// f1: шар со стрелками сил (сопротивление ∝ площади ↑, вес ∝ объёму ↓) → «падение без земли»:
//     керамическая мышь падает в чертёжной шахте, справа живой счётчик скорости упирается в предел ≈ 6 м/с,
//     мягкое приземление, отряхивается и убегает.
// f2: человек (≈ 55 м/с) раскалывается по трещине (единственный красный — срез), лошадь — графитовая сфера (≈ 90 м/с),
//     кадр гаснет в чистый белый: «…лучше не представлять.»
import {
  defineScene, makeStage, orbit, project, atext, line, P, Wd, THREE, MAT, clamp, lerp,
  eApple, eIn, eInOut, eEase, eStd, rng, g, FONT, C_RED, C_GRAY, C_PAPER,
} from '../engine.mjs';
import { makeMouse, rod } from '../models.mjs';

// ---------- тайминг (всё из слов) ----------
function TT() {
  return {
    fallW: Wd('f1', 'падение'),            // 69.80 — стрелки сил
    dip1: Wd('f1', 'Мышь') - .2,           // 71.26 — белая «вдох»-склейка
    fall0: Wd('f1', 'Мышь') - .05,         // 71.41 — мышь начинает падать
    land: Wd('f1', 'отряхнётся') - .08,    // 73.09 — приземление
    shake: Wd('f1', 'отряхнётся'),         // 73.17
    run: Wd('f1', 'убежит'),               // 74.11
    dip2: Wd('f2', 'Человек') - .13,       // 74.94
    hland: Wd('f2', 'разобьётся') - .02,   // 75.61
    crack: Wd('f2', 'разобьётся'),         // 75.63
    dip3: Wd('f2', 'А') - .07,             // 77.25
    horse: Wd('f2', 'лошадь'),             // 77.50
    white: Wd('f2', 'лучше'),              // 78.16
  };
}
const sp = (x, s) => s * Math.log(1 + Math.exp(x / s));   // мягкий «пол» для камеры
const VM = 14, TAU = .32;                                  // мышь: видимая скорость падения (ед/с) и постоянная выхода на предел

// ---------- шахта-чертёж: тонкие рёбра стен ----------
function makeShaft() {
  const hw = 1.5, hd = 1.1, step = .9, HH = 70;
  const minor = [], major = [];
  const seg = (arr, a, b) => arr.push(...a, ...b);
  for (const [x, z] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) seg(major, [x, 0, z], [x, HH, z]);
  for (let i = 0; i * step <= HH; i++) {
    const y = i * step, arr = i % 4 === 0 ? major : minor;
    seg(arr, [-hw, y, -hd], [hw, y, -hd]);
    seg(arr, [-hw, y, -hd], [-hw, y, hd]);
    seg(arr, [hw, y, -hd], [hw, y, hd]);
    seg(arr, [-hw, y, hd], [-hw + .28, y, hd]);
    seg(arr, [hw, y, hd], [hw - .28, y, hd]);
  }
  // вертикальные «стойки» по задней стене
  for (const x of [-hw / 3, hw / 3]) seg(minor, [x, 0, -hd], [x, HH, -hd]);
  const mk = (arr, col, op) => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op }));
  };
  const grp = new THREE.Group();
  grp.add(mk(minor, '#BDBDC2', .9), mk(major, '#8E8E93', .9));
  // стены — чуть светлее фона, как листы бумаги
  const wallMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, HH), wallMat); back.position.set(0, HH / 2, -hd);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(hd * 2, HH), wallMat); left.rotation.y = Math.PI / 2; left.position.set(-hw, HH / 2, 0);
  const right = left.clone(); right.position.x = hw;
  grp.add(back, left, right);
  return grp;
}

// ---------- условная фигура человека из капсул (ноги на y=0, рост ≈ 1.9) ----------
function makeFigure(mat) {
  const grp = new THREE.Group();
  const parts = [
    [[.17, .09, 0], [.16, .86, 0], .13], [[-.17, .09, 0], [-.16, .86, 0], .13],   // ноги
    [[.42, 1.42, 0], [.52, .86, 0], .1], [[-.42, 1.42, 0], [-.52, .86, 0], .1],  // руки
  ];
  for (const [a, b, r] of parts) { const R = rod(mat, r, 24); R.set(a, b); grp.add(R); }
  // корпус — цельная капсула (без внутренних граней, чтобы срез был чистым)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .36, 12, 32), mat); torso.position.set(0, 1.18, 0); grp.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 32, 22), mat); head.position.set(0, 1.87, 0); grp.add(head);
  return grp;
}

// ---------- 2D-помощники ----------
function arrow(x, y0, y1, p, col, a = 1, lw = 3) {
  if (p <= .003 || a <= .003) return;
  const y = lerp(y0, y1, p), dir = Math.sign(y1 - y0), hs = 18;
  line(x, y0, x, y, col, a, lw);
  line(x, y, x - hs * .62, y - dir * hs, col, a, lw);
  line(x, y, x + hs * .62, y - dir * hs, col, a, lw);
}
// табличные цифры: каждая цифра в ячейке фиксированной ширины (счётчик не «дрожит»)
function tabNum(str, xr, y, size, col, a) {
  if (a <= .003) return;
  g.save(); g.globalAlpha *= a; g.font = `600 ${size}px ${FONT}`; g.fillStyle = col;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.letterSpacing = '0px';
  const cw = g.measureText('0').width * .96, cm = size * .27;
  let x = xr;
  for (let i = str.length - 1; i >= 0; i--) { const w = str[i] === ',' ? cm : cw; g.fillText(str[i], x - w / 2, y); x -= w; }
  g.restore();
}
function tabWidth(str, size) {
  g.save(); g.font = `600 ${size}px ${FONT}`; g.letterSpacing = '0px';
  const cw = g.measureText('0').width * .96; g.restore();
  return [...str].reduce((A, c) => A + (c === ',' ? size * .27 : cw), 0);
}
const fmt = v => v < 10 ? v.toFixed(1).replace('.', ',') : String(Math.round(v));

// Модуль скорости справа сверху: подпись-существо, большое число, шкала 0–100 м/с с пределом.
function speedo(t, t0, st, name, v, limit) {
  const ink = st.stage.ink, sub = st.stage.sub;
  const p = P(t, t0, .7, eApple);
  if (p <= .003) return;
  const XR = 940, YN = 560, SZ = 210;
  atext(name, XR, 330, t0, t, { size: 44, w: 600, col: sub, align: 'right', track: -.01, dy: 24 });
  g.save();
  const b = (1 - P(t, t0, .5, eApple)) * 14;
  if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`;
  g.translate(0, (1 - p) * 34);
  const unit = 'м/с';
  g.font = `500 56px ${FONT}`; g.letterSpacing = '0px';
  const uw = g.measureText(unit).width;
  g.fillStyle = sub; g.globalAlpha = p; g.textAlign = 'right'; g.fillText(unit, XR, YN);
  g.restore();
  g.save(); g.translate(0, (1 - p) * 34); if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`;
  tabNum(fmt(v), XR - uw - 18, YN, SZ, ink, p);
  g.restore();
  // шкала
  const X0 = 520, X1 = 940, Y = 615, k = x => lerp(X0, X1, clamp(x / 100));
  const pb = P(t, t0 + .15, .8, eApple);
  line(X0, Y, lerp(X0, X1, pb), Y, '#D2D2D7', p, 4);
  line(X0, Y, k(v), Y, ink, p, 4);
  const lx = k(limit), hit = clamp((v - limit * .93) / (limit * .07));
  line(lx, Y - 16, lx, Y + 16, hit > 0 ? ink : sub, p * pb, 2.5);
  const lab = `предел ≈ ${limit} м/с`;
  g.save(); g.font = `500 34px ${FONT}`; const lw = g.measureText(lab).width; g.restore();
  const al = lx - lw / 2 < X0 ? 'left' : lx + lw / 2 > X1 ? 'right' : 'center';
  const ax = al === 'left' ? X0 : al === 'right' ? X1 : lx;
  atext(lab, ax, Y + 58, t0 + .35, t, { size: 34, w: 500, col: hit > .99 ? ink : sub, align: al, track: 0, dy: 16, blur: 8 });
}

defineScene('fall', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    const T = TT();
    // A: шар-«тело»
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.5, 48, 32), MAT.ceramicWhite());
    ball.castShadow = true; stage.root.add(ball);
    // B: шахта + мышь
    const shaft = makeShaft(); stage.root.add(shaft);
    const mouse = makeMouse(MAT.ceramicWhite()); stage.root.add(mouse);
    // C: человек из двух половин; срез — красная «крышка» из задних граней
    const halves = [-1, 1].map(sd => {
      const base = new THREE.Plane(new THREE.Vector3(sd, 0, 0), 0);  // sd=-1 → оставляем x<0
      const plane = base.clone();
      const white = MAT.ceramicWhite(); white.clippingPlanes = [plane]; white.clipShadows = true;
      const red = new THREE.MeshBasicMaterial({ color: C_RED, side: THREE.BackSide, clippingPlanes: [plane] });
      const grp = new THREE.Group();
      const fw = makeFigure(white); fw.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      grp.add(fw, makeFigure(red));
      stage.root.add(grp);
      return { sd, base, plane, grp };
    });
    // трещина по полу: две ломаные от точки удара + короткие ответвления
    const R = rng(7), crack = [];
    for (const sd of [-1, 1]) {
      const pts = [[0, 0, .05]]; let z = .05;
      for (let i = 1; i <= 11; i++) { z += (R() - .5) * .2; z = clamp(z, -.3, .2); pts.push([sd * i * .19, 0, z]); }
      crack.push(pts);
      const k = 4 + Math.floor(R() * 4), bp = pts[k];
      crack.push([bp, [bp[0] + sd * .25, 0, bp[2] - .28], [bp[0] + sd * .42, 0, bp[2] - .4]]);
    }
    // D: «лошадь» — огромная графитовая сфера
    const heavy = new THREE.Mesh(new THREE.SphereGeometry(1.7, 48, 32), MAT.graphite());
    stage.root.add(heavy);
    // A: «потоки воздуха» — тонкие штрихи вокруг шара
    const R2 = rng(21), streaks = [];
    for (let i = 0; i < 14; i++) {
      let x = 120 + R2() * 820; if (Math.abs(x - 540) < 200) x += x < 540 ? -200 : 200;
      streaks.push({ x: clamp(x, 110, 930), len: 70 + R2() * 170, ph: R2(), sp: 900 + R2() * 700, a: .18 + R2() * .22 });
    }
    return { stage, T, ball, shaft, mouse, halves, crack, heavy, streaks };
  },

  update(t, s, st) {
    const { stage, T, ball, shaft, mouse, halves, heavy } = st;
    const cam = stage.camera;
    const ph = t < T.dip1 ? 'A' : t < T.dip2 ? 'B' : t < T.dip3 ? 'C' : 'D';
    ball.visible = ph === 'A'; mouse.visible = ph === 'B'; heavy.visible = ph === 'D';
    halves.forEach(h => h.grp.visible = ph === 'C');
    shaft.visible = ph !== 'A';
    stage.floor.visible = ph === 'B' || ph === 'C';
    stage.lights.key.position.set(3, 9, 6); stage.lights.key.target.position.set(0, 0, 0);

    if (ph === 'A') {
      const sc = lerp(1, 1.5, P(t, T.fallW + .55, .9, eInOut)) * lerp(.94, 1, P(t, s.start, 1.0, eApple));
      ball.scale.setScalar(sc);
      ball.position.set(0, 4, 0);
      ball.rotation.set(0, t * .3, 0);
      orbit(cam, [0, 2.85, 0], 20, 0, 0);
      stage.lights.key.position.set(3, 13, 6); stage.lights.key.target.position.set(0, 4, 0);
    } else if (ph === 'B') {
      shaft.scale.setScalar(1);
      const D = T.land - T.fall0, H0 = VM * (D - TAU * (1 - Math.exp(-D / TAU)));
      const dt = clamp(t - T.fall0, 0, D);
      const my = H0 - VM * (dt - TAU * (1 - Math.exp(-dt / TAU)));
      // ориентация: в полёте лёгкое кувыркание, к земле — выравнивание
      const k = P(t, T.land - .55, .5, eInOut), fd = t - T.fall0;
      let ry = (1 - k) * (.55 + .5 * Math.sin(fd * 1.7)), rz = (1 - k) * (-.38 + .12 * Math.sin(fd * 2.3));
      // отряхивание: быстрый «крен» вокруг продольной оси, затухает
      const u = t - T.shake;
      const roll = u > 0 && u < .8 ? Math.sin(u * Math.PI * 2 * 7.5) * .3 * clamp(1 - u / .8) * clamp(u / .06) : 0;
      // убегает: поворот к камере и рывок вперёд
      const turn = P(t, T.run - .2, .4, eInOut);
      ry += .55 * turn;
      const r = eIn(clamp((t - T.run) / .75));
      const dir = [Math.cos(.55), 0, -Math.sin(.55)];
      const ru = Math.max(0, t - T.run);
      mouse.position.set(dir[0] * 4.2 * r, my + (ru > 0 ? .05 * Math.abs(Math.sin(ru * 20)) : 0), dir[2] * 4.2 * r);
      mouse.rotation.set(roll, ry, rz);
      // приземление: короткий squash без отскока
      const ul = t - T.land;
      const sq = ul < 0 ? 0 : ul < .06 ? .8 * ul / .06 : .8 * Math.exp(-(ul - .06) / .13);
      mouse.pose({ wag: u > 0 && u < 1 ? t * 22 : t * 6, squash: sq });
      // камера летит рядом, у земли мягко тормозит
      const cy = .62 + sp(my - .17, .35);
      const az = 26 + 6 * P(t, T.fall0, 3, eApple), el = lerp(16, 9, P(t, T.fall0, 2, eApple));
      orbit(cam, [0, cy, 0], 10, az, el);
      stage.lights.key.position.set(3, cy + 9, 6); stage.lights.key.target.position.set(0, cy, 0);
    } else if (ph === 'C') {
      shaft.scale.setScalar(1.75);
      const fy = Math.max(0, 21 * (T.hland - t));
      const sep = P(t, T.crack + .05, 1.2, eApple);
      for (const h of halves) {
        h.grp.position.set(h.sd * .07 * sep, fy, 0);
        h.grp.rotation.set(0, 0, -h.sd * .14 * sep);
      }
      const cy = .8 + sp(fy, .5);
      const hold = P(t, T.hland, 1.6, eApple);
      orbit(cam, [0, cy, 0], lerp(16, 15, hold), lerp(20, 27, hold), lerp(12, 9, hold));
      stage.lights.key.position.set(3, cy + 9, 6); stage.lights.key.target.position.set(0, cy, 0);
      stage.scene.updateMatrixWorld();
      for (const h of halves) h.plane.copy(h.base).applyMatrix4(h.grp.matrixWorld);
    } else {
      shaft.scale.setScalar(2.6);
      const sy = 60 - 34 * (t - T.dip3);
      heavy.position.set(0, sy, 0);
      heavy.rotation.set(t * .2, t * .35, 0);
      // огромная сфера: камера начинает вплотную и отъезжает; центр сферы в кадре 860 → 1020 px, низ всегда выше субтитров
      const back = P(t, T.dip3 - .05, 1.1, eApple), d = lerp(16, 27, back), cyPx = lerp(860, 1020, back);
      orbit(cam, [0, sy + (cyPx - 960) * d / 4158, 0], d, lerp(30, 20, back), 10);
      stage.lights.key.position.set(3, sy + 9, 6); stage.lights.key.target.position.set(0, sy, 0);
    }
  },

  draw2d(t, s, st) {
    const { stage, T, ball, crack, streaks } = st;
    const ink = stage.ink, sub = stage.sub, cam = stage.camera;
    if (t < T.dip1) {
      // потоки воздуха — тонкие штрихи, бегущие вверх (тело падает)
      const sa = P(t, s.start + .2, .8, eApple);
      for (const k of streaks) {
        const y = 1300 - ((k.ph * 1400 + (t - s.start) * k.sp) % 1400);
        line(k.x, y, k.x, Math.min(y + k.len, 1300), '#AEAEB2', sa * k.a * clamp((y - 250) / 120), 2);
      }
      const r = .5 * ball.scale.x;
      const [cx, ty] = project(cam, 0, 4 + r, 0), [, by] = project(cam, 0, 4 - r, 0);
      const S = ball.scale.x / 1.0, base = 105;
      const up = base * S * S / 1, dn = base * S * S * S;
      const pU = P(t, T.fallW - .05, .55, eApple), pD = P(t, T.fallW + .15, .55, eApple);
      const yU0 = ty - 16, yU1 = yU0 - up, yD0 = by + 16, yD1 = yD0 + dn;
      arrow(cx, yU0, yU1, pU, ink, 1, 3);
      arrow(cx, yD0, yD1, pD, ink, 1, 3);
      atext('Сопротивление', cx + 34, yU1 + 34, T.fallW + .15, t, { size: 46, w: 600, col: ink, align: 'left', track: -.015, dy: 20 });
      atext('∝ площади', cx + 34, yU1 + 84, T.fallW + .25, t, { size: 40, w: 500, col: sub, align: 'left', track: 0, dy: 20 });
      atext('Вес', cx + 34, yD1 - 52, T.fallW + .35, t, { size: 46, w: 600, col: ink, align: 'left', track: -.015, dy: 20 });
      atext('∝ объёму', cx + 34, yD1 - 4, T.fallW + .45, t, { size: 40, w: 500, col: sub, align: 'left', track: 0, dy: 20 });
    } else if (t < T.dip2) {
      const D = T.land - T.fall0, dt = clamp(t - T.fall0, 0, D);
      speedo(t, T.fall0 + .05, st, 'Мышь', 6 * (1 - Math.exp(-dt / TAU)), 6);
    } else if (t < T.dip3) {
      speedo(t, T.dip2 + .08, st, 'Человек', 55 * (1 - Math.exp(-Math.max(0, t - T.dip2) / .17)), 55);
      // трещина по полу — тонкая чёрная линия, быстро «бежит» от точки удара
      const pc = P(t, T.crack, .5, eStd);
      if (pc > 0) {
        g.save(); g.strokeStyle = '#1D1D1F'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.lineCap = 'round';
        crack.forEach((pts, ci) => {
          const q = ci % 2 ? clamp((pc - .45) / .55) : pc;
          if (q <= 0) return;
          const n = (pts.length - 1) * q;
          g.beginPath();
          for (let i = 0; i <= Math.ceil(n); i++) {
            const a = pts[Math.min(i, pts.length - 1)], b = pts[Math.max(0, i - 1)];
            const f = i > n ? n - (i - 1) : 1;
            const pnt = i === 0 ? a : [lerp(b[0], a[0], f), 0, lerp(b[2], a[2], f)];
            const [x, y] = project(cam, pnt[0], .002, pnt[2]);
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.globalAlpha = 1 - clamp(Math.abs(0) / 1); g.stroke();
        });
        g.restore();
      }
    } else {
      speedo(t, T.horse + .2, st, 'Лошадь', 90 * (1 - Math.exp(-Math.max(0, t - T.dip3) / .2)), 90);
    }
    // склейки-«вдохи» в чистый фон
    const dip = c => t < c ? eEase(clamp((t - (c - .2)) / .2)) : 1 - eEase(clamp((t - c) / .32));
    let wa = Math.max(dip(T.dip1), dip(T.dip2), dip(T.dip3));
    // финал: кадр гаснет в чистый белый, остаётся только серая фраза
    wa = Math.max(wa, P(t, T.white, .55, eEase));
    if (wa > .003) { g.save(); g.globalAlpha = wa; g.fillStyle = C_PAPER; g.fillRect(0, 0, 1080, 1920); g.restore(); }
    atext('…лучше', 540, 880, T.white + .3, t, { size: 92, w: 600, col: C_GRAY, track: -.025 });
    atext('не представлять', 540, 990, T.white + .42, t, { size: 92, w: 600, col: C_GRAY, track: -.025 });
  },

  sfx(add) {
    const T = TT();
    add(T.fallW, 'whoosh', .3, .8);
    add(T.fall0 + .05, 'whoosh', .35, .7);
    add(T.land, 'thud', .35, 1.3);
    add(T.run + .1, 'whoosh', .2, 1.4);
    add(T.dip2 + .05, 'whoosh', .35, .6);
    add(T.crack, 'crack', .45);
    add(T.horse - .1, 'swell', .35, .6);
    add(T.white, 'bloom', .2, .7);
  },
});
