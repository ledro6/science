// CUBE (13.3 – 35.7 с), белый фон — «продуктовая страница apple.com».
// c1–c2: алюминиевый кубик 1 см → 2 см; передняя грань расслаивается на 4 стеклянные плитки (площадь ×4),
//        куб разлетается exploded view на 8 кубиков (объём ×8).
// c3:    сборка 3×3×3 из 27 кубиков; 9 стеклянных плиток (×9); exploded 27 (×27).
// c4:    тонкий график L² / L³ в стиле M1; две призмы: стекло (площадь ×100) и графит (масса ×1000), камера тильтом вверх.
import {
  defineScene, makeStage, orbit, project, atext, line, dot, measure, P, Wd, C, E, THREE, MAT, roundedBox, glassEdges,
  shadowsOn, clamp, lerp, eApple, eSpring, eInOut, eIn, eStd, eEase, C_GRAY,
} from '../engine.mjs';
import * as ENG from '../engine.mjs';

const ctx = () => ENG.g;
const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];

// ключевые кадры камеры: [t, dist, targetY, targetX] — между ключами eInOut
function camAt(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], p = eInOut((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => lerp(v, b[j + 1], p));
  }
  return keys[keys.length - 1].slice(1);
}
// координаты кубика (i,j,k ∈ 0..n-1) в сборке n×n×n с зазором gap (центр — над полом, ни один кубик не уходит под пол)
function cellPos(n, i, j, k, gap) {
  const h = (n - 1) / 2, s = 1 + gap;
  return [(i - h) * s, n / 2 + h * gap + (j - h) * s, (k - h) * s];
}

defineScene('cube', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const alu = MAT.aluminium();
    const big = shadowsOn(new THREE.Mesh(roundedBox(1, .045, 3), alu));
    const cgeo = roundedBox(1, .05, 3);
    const smalls = [];
    for (let i = 0; i < 27; i++) { const m = shadowsOn(new THREE.Mesh(cgeo, alu)); smalls.push(m); }
    // стеклянные плитки (площадь): полупрозрачная пластина + тонкие тёмные рёбра — читается на белом
    const tgeo = new THREE.BoxGeometry(.94, .94, .02);
    const tMat = new THREE.MeshPhysicalMaterial({ color: '#E9EDF2', roughness: .06, transparent: true, opacity: .55, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    const eMat = new THREE.LineBasicMaterial({ color: '#1D1D1F', transparent: true, opacity: .7 });
    const egeo = new THREE.EdgesGeometry(tgeo, 20);
    const tiles = [];
    for (let i = 0; i < 9; i++) { const gr = new THREE.Group(); gr.add(new THREE.Mesh(tgeo, tMat), new THREE.LineSegments(egeo, eMat)); tiles.push(gr); }
    // призмы: стекло (площадь) и цельный графит (масса)
    const pgeo = new THREE.BoxGeometry(1, 1, 1); pgeo.translate(0, .5, 0);
    const pgMat = new THREE.MeshPhysicalMaterial({ color: '#E4E8EE', roughness: .05, transparent: true, opacity: .45, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    const pEdge = new THREE.LineSegments(new THREE.EdgesGeometry(pgeo), new THREE.LineBasicMaterial({ color: '#1D1D1F', transparent: true, opacity: .75 }));
    const pGlass = new THREE.Group(); pGlass.add(new THREE.Mesh(pgeo, pgMat), pEdge);
    const pGraph = shadowsOn(new THREE.Mesh(pgeo, MAT.graphite()));
    stage.root.add(big, ...smalls, ...tiles, pGlass, pGraph);

    const T = {
      kub: Wd('c1', 'кубик'), dva: Wd('c1', 'два'),
      pl2: Wd('c2', 'площадь'), x4: Wd('c2', 'четыре'), ob2: Wd('c2', 'объём'), x8: Wd('c2', 'восемь'),
      tri: Wd('c3', 'три'), pl3: Wd('c3', 'площадь'), x9: Wd('c3', 'девять'), ob3: Wd('c3', 'объём'), x27: Wd('c3', 'двадцать'),
      g0: Wd('c4', 'объём'), obg: Wd('c4', 'обгоняет'), uv: Wd('c4', 'увеличишь'), x10: Wd('c4', 'десять'),
      pl4: Wd('c4', 'площадь', 1), x100: Wd('c4', 'сто'), mas: Wd('c4', 'масса'), x1000: Wd('c4', 'тысячу'),
    };
    T.ex8 = T.ob2 - .05; T.as = T.tri - .1; T.exit = E('c3') + .05; T.pr = T.uv - .1;
    const cam1 = [
      [13.2, 9.8, .62, 0], [16.35, 9.8, .62, 0], [17.4, 16.5, 1.18, 0], [T.ex8, 16.5, 1.18, 0], [T.ex8 + 1.4, 26, 1.75, 0],
      [T.as, 26, 1.75, 0], [T.as + .9, 32, 2.4, 0], [T.as + 1.6, 28, 1.85, 0], [T.ob3, 28, 1.85, 0], [T.ob3 + 1.4, 37, 2.5, 0],
      [T.exit + .5, 37, 2.5, 0],
    ];
    return { stage, alu, big, smalls, tiles, tMat, eMat, pGlass, pgMat, pEdge, pGraph, T, cam1 };
  },

  update(t, s, st) {
    const { stage, big, smalls, tiles, tMat, eMat, pGlass, pGraph, T } = st, cam = stage.camera;
    const { key, rimL, rimR, hemi } = stage.lights;
    key.position.set(3, 9, 6); key.intensity = 2.2; rimL.intensity = 1.2; rimR.intensity = .9; hemi.intensity = 1.15;
    big.visible = false; smalls.forEach(m => { m.visible = false; m.scale.setScalar(1); m.rotation.set(0, 0, 0); });
    tiles.forEach(m => m.visible = false); pGlass.visible = pGraph.visible = false;

    const tiled = (n, L, tIn, tPeel, tOut) => {          // n×n плиток на передней грани куба ребра L
      const a = P(t, tIn, .45) * (1 - P(t, tOut, .4, eIn));
      if (a <= .003) return;
      tMat.opacity = .55 * a; eMat.opacity = .7 * a;
      for (let i = 0; i < n * n; i++) {
        const ix = i % n, iy = Math.floor(i / n), h = (n - 1) / 2;
        const c = Math.abs(ix - h) + Math.abs(iy - h);                 // от центра к краям
        const pe = P(t, tPeel + c * .07, 1.2, eInOut);
        const sp = 1 + pe * .12;                                        // плитки слегка расходятся в плоскости
        const m = tiles[i]; m.visible = true;
        const u = L / n;
        m.position.set((ix - h) * sp * u, (iy - h) * sp * u + L / 2, L / 2 + .02 + pe * (.42 + .16 * n));
        m.scale.set(u, u, 1);
      }
    };

    if (t < T.ex8) {
      // ---- c1–c2: один куб, рост 1 → 2, плитки площади ×4 ----
      const L = 1 + eSpring(clamp((t - T.dva + .05) / 1.15));
      big.visible = true; big.scale.setScalar(L); big.position.set(0, L / 2, 0);
      tiled(2, L, T.pl2 - .1, T.pl2 + .25, T.ob2 - .45);
    } else if (t < T.as) {
      // ---- exploded view: 8 кубиков ----
      let q = 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
        const e = P(t, T.ex8 + .05 + q * .045, 1.5, eInOut);
        const m = smalls[q++]; m.visible = true; m.position.fromArray(cellPos(2, i, j, k, .75 * e));
      }
    } else if (t < T.exit + .6) {
      // ---- сборка 3×3×3 из 27 кубиков, плитки ×9, exploded ×27, уход ----
      const corner = P(t, T.as, .75, eInOut);
      const G0 = .6 * (1 - P(t, T.as + .85, .8, eInOut));
      let q = 0;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
        const d = Math.abs(i - 1) + Math.abs(j - 1) + Math.abs(k - 1);
        const ex = P(t, T.ob3 + .05 + d * .07, 1.6, eInOut);
        const G = G0 + .55 * ex;
        let p = cellPos(3, i, j, k, G);
        const m = smalls[q++]; m.visible = true;
        const isCorner = d === 3;
        if (isCorner) {
          const p2 = cellPos(2, i / 2, j / 2, k / 2, .75);
          p = lerp3(p2, p, corner);
        } else {
          m.scale.setScalar(eSpring(clamp((t - T.as - .15 - (3 - d) * .08) / .6)));
        }
        // уход: кубики тают от краёв к центру
        const out = P(t, T.exit - .2 + (3 - d) * .05, .45, eIn);
        m.scale.multiplyScalar(1 - out);
        m.visible = m.scale.x > .003;
        m.position.fromArray(p);
      }
      if (t < T.ob3) tiled(3, 3, T.pl3 - .1, T.pl3 + .2, T.ob3 - .4);
    }

    if (t < T.exit + .6) {
      const [d, ty, tx] = camAt(st.cam1, t);
      orbit(cam, [tx, ty - .032 * d, 0], d, 26 + (t - 13.3) * 1.25, lerp(21, 17, clamp((t - 13.3) / 15)));
    } else {
      // ---- c4: призмы ----
      const rise = P(t, T.pr, .9);
      const hG = .16 + 1.6 * P(t, T.pl4, 1.3, eInOut);
      const hM = .16 + 1.6 * P(t, T.pl4, 1.3, eInOut) + 14.4 * P(t, T.mas - .05, 1.6, eInOut);
      pGlass.visible = pGraph.visible = rise > .003;
      pGlass.position.set(-.6, 0, 0); pGlass.scale.set(.85, Math.max(.001, hG * rise), .85);
      pGraph.position.set(.6, 0, 0); pGraph.scale.set(.85, Math.max(.001, hM * rise), .85);
      const tilt = P(t, T.mas, 1.6, eInOut);
      const d = lerp(14, 21, tilt), ty = lerp(.7, 8.6, tilt);
      orbit(cam, [-.5 - tilt * .2, ty, 0], d, 22 + (t - T.pr) * 2, lerp(12, 4, tilt));
    }
  },

  draw2d(t, s, st) {
    const { stage, T, big } = st, cam = stage.camera, g = ctx(), ink = stage.ink, sub = stage.sub;
    const bigNum = (txt, cap, t0, tOut, o = {}) => {
      const { x = 540, y = 485, size = 320, align = 'center' } = o;
      atext(txt, x, y, t0, t, { size, w: 700, col: (cap === 'объём' || cap === 'масса') ? stage.accent : ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: tOut, align });
      atext(cap, x + (align === 'left' ? 8 : 0), y + Math.round(size * .26), t0 + .25, t, { size: Math.round(size / 6.6), w: 500, col: sub, track: -.005, out: tOut, align });
    };

    // ---- c1: размерная линия «1 см» → «2 см» ----
    if (t < T.pl2 + .2) {
      const L = big.scale.x;
      const a = P(t, T.kub, .5) * (1 - P(t, T.pl2 - .25, .35, eIn));
      if (a > .003) {
        const z = L / 2 + .32;
        const [x1, y1] = project(cam, -L / 2, 0, z), [x2, y2] = project(cam, L / 2, 0, z);
        const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy), nx = -dy / n * 12, ny = dx / n * 12;
        line(x1, y1, x2, y2, ink, a * .75, 2);
        line(x1 - nx, y1 - ny, x1 + nx, y1 + ny, ink, a * .75, 2);
        line(x2 - nx, y2 - ny, x2 + nx, y2 + ny, ink, a * .75, 2);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 62;
        const sw = T.dva + .25;
        atext('1 см', mx, my, T.kub + .1, t, { size: 46, w: 500, col: ink, a, dy: 14, dur: .6, out: sw, outDur: .3 });
        atext('2 см', mx, my, sw + .05, t, { size: 46, w: 500, col: ink, a, dy: 14, dur: .6 });
      }
    }

    // ---- огромные цифры + подписи ----
    bigNum('×4', 'площадь', T.x4, T.ob2 - .45);
    bigNum('×8', 'объём', T.x8, T.as);
    bigNum('×9', 'площадь', T.x9, T.ob3 - .35);
    bigNum('×27', 'объём', T.x27, T.exit - .3);

    // ---- c4: график L² / L³ (тонкие линии, без сетки, подписи у линий) ----
    if (t > T.exit - .2 && t < T.pr + .4) {
      const a = 1 - P(t, T.pr - .35, .4, eIn);
      const X0 = 150, X1 = 900, Y0 = 1140, Y1 = 470;
      const ax = P(t, T.g0 - .05, .7);
      line(X0, Y0, lerp(X0, X1 + 20, ax), Y0, ink, .55 * a, 2);
      line(X0, Y0, X0, lerp(Y0, Y1 - 20, ax), ink, .55 * a, 2);
      const curve = (pow, col, lw, p) => {
        if (p <= 0) return;
        g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
        const N = 90;
        for (let i = 0; i <= N; i++) {
          const L = 4 * p * i / N, x = X0 + (X1 - X0) * L / 4, y = Y0 - (Y0 - Y1) * Math.pow(L, pow) / 64;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke(); g.restore();
        const L = 4 * p; return [X0 + (X1 - X0) * L / 4, Y0 - (Y0 - Y1) * Math.pow(L, pow) / 64];
      };
      const p2 = P(t, T.g0 + .2, 1.5, eInOut), p3 = P(t, T.obg - .35, 1.6, eInOut);
      curve(2, '#86868B', 4, p2);
      const e3 = curve(3, ink, 4, p3);
      if (e3 && p3 > .02) dot(e3[0], e3[1], 7, ink, a);
      atext('площадь · L²', X1, Y0 - (Y0 - Y1) * 16 / 64 - 30, Wd('c4', 'площадь') + .1, t, { size: 40, w: 500, col: '#6E6E73', align: 'right', a, track: 0 });
      atext('объём · L³', X1 - 30, Y1 + 10, T.obg + .9, t, { size: 40, w: 600, col: ink, align: 'right', a, track: 0 });
      atext('размер', X1 + 20, Y0 + 50, T.g0 + .3, t, { size: 32, w: 500, col: sub, align: 'right', a: .9 * a, track: 0 });
    }

    // ---- c4: призмы — подписи у оснований и цифры ----
    if (t > T.pr) {
      const lab = (txt, x3, t0, col) => {
        const [x, y] = project(cam, x3, 0, .62);
        const a = 1 - clamp((y + 58 - 1270) / 30);
        atext(txt, x, y + 58, t0, t, { size: 36, w: 500, col, align: 'center', a, track: 0 });
      };
      lab('площадь', -.6, T.pr + .5, sub); lab('масса', .6, T.pr + .65, ink);
      bigNum('×10', 'размер', T.x10, T.pl4 - .25, { x: 96, y: 520, size: 250, align: 'left' });
      bigNum('×100', 'площадь', T.x100, T.x1000 - .35, { x: 96, y: 520, size: 230, align: 'left' });
      bigNum('×1000', 'масса', T.x1000, 1e9, { x: 96, y: 520, size: 190, align: 'left' });
    }
  },

  sfx(add, s) {
    add(Wd('c1', 'кубик'), 'click', .35);
    add(Wd('c1', 'два') - .05, 'swell', .35);
    add(Wd('c2', 'площадь') + .25, 'shimmer', .3);
    add(Wd('c2', 'четыре'), 'chime', .3);
    add(Wd('c2', 'объём'), 'whoosh', .35, .8);
    add(Wd('c2', 'восемь'), 'chime', .3, .9);
    add(Wd('c3', 'три'), 'whoosh', .3, 1.1);
    add(Wd('c3', 'три') + 1.6, 'click', .4);
    add(Wd('c3', 'площадь') + .2, 'shimmer', .3);
    add(Wd('c3', 'девять'), 'chime', .3);
    add(Wd('c3', 'объём'), 'whoosh', .35, .8);
    add(Wd('c3', 'двадцать'), 'bloom', .4);
    add(Wd('c4', 'обгоняет'), 'swell', .25);
    add(Wd('c4', 'десять'), 'tick', .3);
    add(Wd('c4', 'сто'), 'chime', .3);
    add(Wd('c4', 'тысячу') - 1.5, 'riser', .3);
    add(Wd('c4', 'тысячу'), 'impact', .35, .8);
  },
});
