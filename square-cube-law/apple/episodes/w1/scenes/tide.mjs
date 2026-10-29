// TIDE (20.135 – 35.394 с), чёрный фон.
// t1 — вид сверху: Земля вращается под стеклянной водной оболочкой, которая вытягивается к Луне в два горба;
//      поле приливных сил — тонкие стрелки (к Луне и от неё по оси, к центру по бокам); формула «F ∝ 1/d³»;
// t2 — фирменный ход канала: куб 2×2×2 собирается из 8 алюминиевых кубиков, размерные линии «2», «2³ = 8» → красное «×8»;
// t3 — разрез берега: алюминиевый профиль суши с домиками, стеклянная вода поднимается далеко на сушу и уходит,
//      пунктир — прилив сегодня; «каждые 13 ч».
import { defineScene, makeStage, project, atext, line, measure, P, Wd, E, THREE, MAT, roundedBox, glassEdges, shadowsOn, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, TAU, bump, smooth, makeEarth, makeMoon, makeShell, tideShell, frame, keys, arrow, dim, collectMats, setLit, glow, screenR, roundedBoxGeo } from './kit.mjs';

const RE = 1, MX = 2.7, RM = .27;
const CS = .9, GAP = .05, HS = CS + GAP;                  // кубик, зазор, шаг сетки
const ys = x => -.62 + .62 * smooth((x + 1.5) / 1.3) + .78 * clamp((x + .2) / 3.4);   // профиль суши (уровень моря = 0 при x ≈ -0.2)
const X0 = -2.3, X1 = 2.9, ZD = 1.4, YB = -1.0;
// кромка воды: где профиль суши пересекает уровень h
const shore = h => { let a = -1.6, b = X1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (ys(m) < h) a = m; else b = m; } return (a + b) / 2; };

function TT() {
  return {
    ok: Wd('t1', 'океан'), vyt: Wd('t1', 'вытягивает'), gor: Wd('t1', 'горба'), sila: Wd('t1', 'сила'), kub: Wd('t1', 'куба'),
    vd: Wd('t2', 'Вдвое'), dva: Wd('t2', 'два'), kube: Wd('t2', 'кубе'), vos: Wd('t2', 'восемь'),
    kazh: Wd('t3', 'Каждые'), tr: Wd('t3', 'тринадцать'), zah: Wd('t3', 'заходить'), sush: Wd('t3', 'сушу'), uh: Wd('t3', 'уходить'), obr: Wd('t3', 'обратно'),
    cutB: (E('t1') + Wd('t2', 'Вдвое')) / 2, cutC: (E('t2') + Wd('t3', 'Каждые')) / 2,
  };
}
// уровень воды в разрезе берега: поднимается к «сушу», держится, уходит к «обратно»
const level = (t, T) => .42 * smooth((t - T.tr - .35) / (T.sush + .1 - T.tr - .35)) - .48 * smooth((t - T.uh + .15) / (T.obr + .45 - T.uh + .15));
const cellPos = (i, j, k) => [(i - .5) * HS, (j - .5) * HS, (k - .5) * HS];

defineScene('tide', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const T = TT();
    // --- A: Земля, вода, Луна ---
    const gA = new THREE.Group();
    const earth = makeEarth(RE), moon = makeMoon(RM);
    const shell = makeShell(RE * 1.06, { base: .07, rim: .95, pow: 2.2 });
    moon.position.set(MX, 0, 0);
    gA.add(earth, moon, shell);
    // --- B: куб 2×2×2 ---
    const gB = new THREE.Group(), alu = MAT.aluminium(), geo = roundedBox(CS, .045, 3), cubes = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
      const m = shadowsOn(new THREE.Mesh(geo, alu)); gB.add(m);
      cubes.push({ m, home: cellPos(i, j, k), dir: [(i - .5) * 2, (j - .5) * 2 + .25, (k - .5) * 2], ord: [0, 4, 2, 6, 1, 5, 3, 7][i * 4 + j * 2 + k] });
    }
    // --- C: разрез берега ---
    const gC = new THREE.Group();
    const sh = new THREE.Shape(); sh.moveTo(X0, YB); sh.lineTo(X1, YB);
    for (let i = 0; i <= 120; i++) { const x = X1 - (X1 - X0) * i / 120; sh.lineTo(x, ys(x)); }
    sh.closePath();
    const lgeo = new THREE.ExtrudeGeometry(sh, { depth: ZD, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 4 });
    lgeo.translate(0, 0, -ZD / 2);
    const lmat = MAT.aluminium(); lmat.color.set('#5E6065'); lmat.roughness = .5;
    const land = new THREE.Mesh(lgeo, lmat); land.castShadow = land.receiveShadow = true;
    const wgeo = new THREE.BoxGeometry(X1 - X0 - .02, 1, ZD - .04); wgeo.translate(0, .5, 0);
    const water = new THREE.Mesh(wgeo, MAT.glass(.26)); water.renderOrder = 2;
    const wEdge = glassEdges(wgeo, '#FFFFFF', .9);
    const wG = new THREE.Group(); wG.add(water, wEdge); wG.position.set((X0 + X1) / 2, YB + .01, 0);
    const hMat = MAT.ceramicWhite(), houses = [];
    for (const [x, w, h] of [[2.0, .26, .2], [2.4, .2, .28]]) {
      const b = shadowsOn(new THREE.Mesh(roundedBoxGeo(w, h, .3, .02), hMat)); b.position.set(x, ys(x) + h / 2 - .01, 0); gC.add(b); houses.push(b);
    }
    gC.add(land, wG);
    stage.root.add(gA, gB, gC);
    return { stage, T, gA, earth, moon, shell, gB, cubes, alu, gC, wG, land, houses,
      mA: collectMats(gA), mB: collectMats(gB), mC: collectMats(gC) };
  },

  update(t, s, st) {
    const { stage, T, gA, earth, shell, gB, cubes, gC, wG } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cutB ? 1 : t < T.cutC ? 2 : 3;
    gA.visible = ph === 1; gB.visible = ph === 2; gC.visible = ph === 3;
    L.hemi.intensity = .45; L.rimL.intensity = 2.8; L.rimR.intensity = 2.0; L.key.intensity = 2.6; L.key.castShadow = true;
    if (ph === 1) {
      // ---- вид сверху: Земля под водной оболочкой ----
      const lit = P(t, s.start + .05, 1.2);
      setLit(st.mA, lit * (1 - P(t, T.cutB - .4, .35, eIn)));
      L.key.position.set(-6, 9, 5); L.key.castShadow = false; L.hemi.intensity = .14; L.rimL.intensity = 1.6; L.rimR.intensity = 1.2;
      stage.floor.visible = false;
      earth.rotation.set(0, (t - s.start) * .32, .41);
      const b = .05 * P(t, T.ok, .8) + .24 * P(t, T.vyt - .05, 1.3, eInOut);
      tideShell(shell, b, 0);
      shell.material.uniforms.uOp.value = P(t, T.ok - .15, .8) * (1 - P(t, T.cutB - .4, .35, eIn));
      const k = clamp((t - s.start) / (T.cutB - s.start));
      frame(cam, [.8, 0, 0], lerp(19.5, 18, eInOut(k)), lerp(-6, 6, k), lerp(44, 38, k), 540, 900);
    } else if (ph === 2) {
      // ---- куб 2×2×2 собирается из 8 кубиков ----
      setLit(st.mB, P(t, T.cutB, .5));
      stage.floor.visible = true; stage.floor.position.y = -HS;
      L.key.position.set(3, 9, 6);
      cubes.forEach(c => {
        const p = P(t, T.cutB + c.ord * .1, 1.0, eInOut);
        const ex = .95 * (1 - p);
        c.m.position.set(c.home[0] + c.dir[0] * ex, c.home[1] + c.dir[1] * ex, c.home[2] + c.dir[2] * ex);
        c.m.rotation.set((1 - p) * .5 * c.dir[2], (1 - p) * .6 * c.dir[0], 0);
      });
      gB.rotation.y = 0;
      const k = clamp((t - T.cutB) / (T.cutC - T.cutB));
      frame(cam, [0, -.05, 0], lerp(19.5, 18, eInOut(k)), lerp(26, 40, k), lerp(24, 20, k), 540, 950);
    } else {
      // ---- разрез берега ----
      setLit(st.mC, P(t, T.cutC, .6));
      stage.floor.visible = true; stage.floor.position.y = YB;
      L.key.position.set(-2, 9, 7);
      const h = Math.max(.002, -YB + level(t, T));
      wG.scale.set(1, h, 1);
      const k = clamp((t - T.cutC) / (s.end - T.cutC));
      frame(cam, [.32, -.15, 0], lerp(23, 22, eInOut(k)), lerp(-14, -7, k), lerp(17, 14, k), 540, 1010);
    }
  },

  draw2d(t, s, st) {
    const { stage, T, earth, moon, gB } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const ph = t < T.cutB ? 1 : t < T.cutC ? 2 : 3;
    if (ph === 1) {
      const fade = 1 - P(t, T.cutB - .4, .35, eIn);
      const [mx, my] = project(cam, MX, 0, 0);
      glow(mx, my, 90, .14 * P(t, s.start, 1) * fade);
      // поле приливных сил: по оси Земля-Луна — наружу, по бокам — к центру
      const aF = P(t, T.gor - .1, .6) * (1 - P(t, T.sila + .3, .5)) * fade;
      if (aF > .003) {
        const N = 16, R1 = RE * 1.18;
        for (let i = 0; i < N; i++) {
          const a = TAU * i / N, x = Math.cos(a), z = Math.sin(a);
          const fx = 2 * x, fz = -z, fl = .3 * Math.hypot(fx, fz) / 2;
          const p0 = [R1 * x, 0, R1 * z], p1 = [R1 * x + fx * .2, 0, R1 * z + fz * .2];
          const q0 = fx * x + fz * z < 0 ? p1 : p0, q1 = fx * x + fz * z < 0 ? p0 : p1;
          const A = project(cam, ...q0), B = project(cam, ...q1);
          const gr = P(t, T.gor - .1 + i * .02, .5, eApple);
          arrow(A[0], A[1], lerp(A[0], B[0], gr), lerp(A[1], B[1], gr), ink, aF * (.5 + fl), 3, 12);
        }
      }
      atext('Океан', 540, 380, T.ok - .05, t, { size: 120, w: 600, col: ink, track: -.03, out: T.sila - .35 });
      // формула: «³» красная автоматически
      const F = 'F ∝ 1/d³', fs = 170, fw = 600, ftr = -.03;
      atext(F, 540, 400, T.sila, t, { size: fs, w: fw, col: ink, track: ftr, blur: 18, scale0: 1.08, dur: .9, out: T.cutB - .4 });
      const tot = measure(F, fs, fw, ftr), wd = measure('d³', fs, fw, ftr), cx = 540 + tot / 2 - wd / 2;
      const u = P(t, T.kub, .45) * fade;
      line(cx - wd / 2 * u, 440, cx + wd / 2 * u, 440, ink, .85 * u, 3);
      atext('куб расстояния', cx - 30, 500, T.kub + .05, t, { size: 46, w: 500, col: sub, track: -.005, dy: 18, out: T.cutB - .4 });
    } else if (ph === 2) {
      // размерные линии «2» по трём рёбрам собранного куба
      gB.updateMatrixWorld();
      const a = P(t, T.dva - .1, .5) * (1 - P(t, T.cutC - .35, .3, eIn));
      const e = HS - GAP / 2, o = .22;
      const edge = (p1, p2, lab, n) => {
        const A = project(cam, ...p1), B = project(cam, ...p2);
        dim(A[0], A[1], B[0], B[1], a, ink);
        atext(lab, (A[0] + B[0]) / 2 + n[0], (A[1] + B[1]) / 2 + n[1], T.dva + .1, t, { size: 48, w: 600, col: ink, track: 0, dy: 12, out: T.cutC - .35 });
      };
      edge([-e, -e, e + o], [e, -e, e + o], '2', [0, 38]);
      edge([e + o, -e, e], [e + o, -e, -e], '2', [32, 34]);
      edge([-e - o, -e, e], [-e - o, e, e], '2', [-34, 14]);
      const o2 = T.vos - .15;
      atext('2³ = 8', 540, 440, T.dva, t, { size: 170, w: 600, col: ink, track: -.03, blur: 18, scale0: 1.08, dur: .9, out: o2, outDur: .3 });
      atext('×8', 540, 470, T.vos, t, { size: 340, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: T.cutC - .35 });
      atext('сила приливов', 540, 548, T.vos + .2, t, { size: 50, w: 500, col: sub, track: -.005, out: T.cutC - .35 });
    } else {
      // уровень воды — яркая линия по передней грани разреза
      const hw = level(t, T), xs0 = shore(hw), zf = ZD / 2;
      const la = P(t, T.cutC + .2, .6);
      const W1 = project(cam, X0 + .01, hw, zf), W2 = project(cam, xs0, hw, zf), W3 = project(cam, xs0, hw, -zf);
      line(W1[0], W1[1], W2[0], W2[1], ink, .95 * la, 3);
      line(W2[0], W2[1], W3[0], W3[1], ink, .6 * la, 2);
      // пунктир: прилив сегодня (в 8 раз слабее) — короткий подъём у кромки
      const a = P(t, T.zah - .2, .6);
      const yl = .42 / 8, xs = shore(yl);
      const A = project(cam, X0 + .05, yl, ZD / 2 + .01), B = project(cam, xs, yl, ZD / 2 + .01);
      line(A[0], A[1], B[0], B[1], ink, .8 * a, 2.5, [8, 8]);
      atext('сегодня', A[0] + 6, A[1] - 18, T.zah, t, { size: 34, w: 500, col: sub, align: 'left', track: 0, dy: 12 });
      atext('Каждые', 540, 340, T.kazh, t, { size: 56, w: 500, col: sub, track: -.005 });
      atext('13 ч', 540, 560, T.tr, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
      atext('прилив и отлив', 540, 640, T.zah - .1, t, { size: 46, w: 500, col: sub, track: -.005 });
    }
    // «вдохи» в чёрный на монтажных стыках
    const dip = Math.max(bump(t, T.cutB, .22), bump(t, T.cutC, .22));
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = '#000'; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  },

  sfx(add) {
    const T = TT();
    add(T.ok, 'swell', .25, .7);
    add(T.vyt, 'whoosh', .2, .7);
    add(T.gor, 'shimmer', .22, .8);
    add(T.sila, 'bloom', .26, .8);
    add(T.kub, 'click', .2, .9);
    for (let i = 0; i < 8; i++) add(T.cutB + 1.0 + i * .1, 'click', .1 + i * .01, .9 + i * .04);
    add(T.dva, 'chime', .2, .9);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .4, .9);
    add(T.kazh, 'thud', .22, .8);
    add(T.zah, 'whoosh', .28, .6);
    add(T.sush, 'splash', .16, .8);
    add(T.uh, 'whoosh', .22, .5);
  },
});
