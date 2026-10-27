// CALC (22.7 – 32.6 с), чёрный фон.
// c1 — линейка расстояний в а.е.: Солнце (свечение) в 0, Земля на 1, Нептун на 30; «×30 дальше от Солнца».
// c2 — «30³»: алюминиевый куб набирается слоями (InstancedMesh 10×10×10, условно), счётчик до 27 000;
//      на «Корень» знак √ прорисовывается над числом, затем крупная красная «165» (главная цифра выпуска).
import { defineScene, makeStage, orbit, project, atext, line, measure, P, Wd, E, THREE, MAT, roundedBox, clamp, lerp, eApple, eInOut, eIn, eSpring, C_GRAY } from '../../../engine.mjs';
import { ctx, makeNeptune, makeBall, makeSun, glow, screenR } from './kit.mjs';

const X0 = -3.2, X1 = 3.2, AU = (X1 - X0) / 30;   // линейка: 0 … 30 а.е.
const N = 10, CELL = .24, BOX = .214;              // куб: 10×10×10 условных кубиков

function TT() {
  return {
    nep: Wd('c1', 'Нептун'), x30: Wd('c1', 'тридцать'), dal: Wd('c1', 'дальше'), zem: Wd('c1', 'Земля'),
    cub30: Wd('c2', 'Тридцать'), kube: Wd('c2', 'кубе'), d27: Wd('c2', 'двадцать'), tys: Wd('c2', 'тысяч'),
    kor: Wd('c2', 'Корень'), okolo: Wd('c2', 'около'), sta: Wd('c2', 'ста'), pyat: Wd('c2', 'пяти'),
    cut: (E('c1') + Wd('c2', 'Тридцать')) / 2,
  };
}
const layerT = (T, j) => T.kube - .15 + j * .12;      // начало слоя j
const fillAt = (t, T) => { let f = 0; for (let j = 0; j < N; j++) f += clamp((t - layerT(T, j)) / .45); return f / N; };

defineScene('calc', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    stage.camera.far = 300; stage.camera.updateProjectionMatrix();
    const sun = makeSun(.2, 3.2);
    const earth = makeBall(.075, MAT.ceramicWhite());
    const nep = makeNeptune(.22);
    const ruler = new THREE.Group(); ruler.add(sun.grp, earth, nep);
    sun.grp.position.set(X0, 0, 0); earth.position.set(X0 + AU, 0, 0); nep.position.set(X1, 0, 0);
    const mat = MAT.aluminium();
    const cubes = new THREE.InstancedMesh(roundedBox(BOX, .022, 1), mat, N * N * N);
    cubes.castShadow = true; cubes.receiveShadow = true; cubes.frustumCulled = false;
    const cubeG = new THREE.Group(); cubeG.add(cubes);
    stage.root.add(ruler, cubeG);
    return { stage, sun, earth, nep, ruler, cubes, cubeG, mat, M: new THREE.Matrix4(), T: TT() };
  },

  update(t, s, st) {
    const { stage, sun, earth, nep, ruler, cubes, cubeG, mat, M, T } = st, cam = stage.camera, L = stage.lights;
    const A = t < T.cut;
    ruler.visible = A; cubeG.visible = !A; stage.floor.visible = !A;
    if (A) {
      const lit = P(t, s.start + .05, 1.2);
      sun.pl.intensity = 3.2 * lit;
      L.key.intensity = .3; L.hemi.intensity = .08; L.rimL.intensity = 1.2; L.rimR.intensity = .8; L.key.castShadow = false;
      nep.visible = P(t, T.nep - .1, .6) > .01; nep.scale.setScalar(lerp(.6, 1, eSpring(clamp((t - T.nep + .1) / .8))));
      nep.rotation.set(0, t * .4, .5);
      earth.visible = t > T.zem - .1; earth.scale.setScalar(lerp(.4, 1, eSpring(clamp((t - T.zem + .1) / .7))));
      orbit(cam, [0, .05, 0], lerp(33, 31.5, clamp((t - s.start) / 3.3)), lerp(-4, 3, clamp((t - s.start) / 3.3)), 9);
    } else {
      sun.pl.intensity = 0; L.key.castShadow = true;
      // слои падают сверху и «садятся» мягкой пружиной; число кубиков = N² на слой
      const h = (N - 1) / 2;
      for (let j = 0; j < N; j++) {
        const p = clamp((t - layerT(T, j)) / .45), k = eSpring(p);
        for (let i = 0; i < N; i++) for (let q = 0; q < N; q++) {
          const idx = (j * N + i) * N + q;
          const sc = p <= 0 ? 1e-4 : 1;
          M.makeScale(sc, sc, sc);
          M.setPosition((i - h) * CELL, j * CELL + BOX / 2 + (1 - k) * 1.1, (q - h) * CELL);
          cubes.setMatrixAt(idx, M);
        }
      }
      cubes.instanceMatrix.needsUpdate = true;
      // на «165» куб уходит вниз и в тень — главная цифра остаётся одна
      const dn = P(t, T.okolo - .1, 1.1, eInOut);
      cubeG.position.set(0, -dn * .22, 0); cubeG.scale.setScalar(lerp(1, .7, dn));
      cubeG.rotation.y = (t - T.kube) * .12;
      stage.floor.position.y = -dn * .22;
      const sweep = clamp((t - T.kor + .2) / 1.6);
      L.key.position.set(lerp(-8, 7, eInOut(sweep)), 9, lerp(-2, 6, sweep));
      const lit = P(t, T.cut, .8) * (1 - .45 * dn);
      L.key.intensity = 2.8 * lit; L.hemi.intensity = .5 * lit; L.rimL.intensity = 3.2 * lit; L.rimR.intensity = 2.4 * lit;
      mat.color.set('#C9CBCF');
      orbit(cam, [0, 1.62, 0], lerp(28, 29, clamp((t - T.cut) / 6)), lerp(30, 42, clamp((t - T.cut) / 6.5)), 24);
    }
  },

  draw2d(t, s, st) {
    const { stage, T, earth, nep } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    if (t < T.cut + .05) {
      const fo = 1 - P(t, T.cut - .3, .3, eIn);
      const [sx, sy] = project(cam, X0, 0, 0);
      glow(sx, sy, 150, .6 * P(t, s.start, 1) * fo);
      // линейка: рисуется слева направо, засечки на каждой а.е., подписи 0 · 10 · 20 · 30
      const pr = P(t, T.nep - .2, 1.1, eInOut);
      const ry = .55, [ax, ay] = project(cam, X0, -ry, 0), [bx, by] = project(cam, X1, -ry, 0);
      line(ax, ay, lerp(ax, bx, pr), lerp(ay, by, pr), ink, .7 * fo, 2);
      for (let i = 0; i <= 30; i++) {
        const [x, y] = project(cam, X0 + i * AU, -ry, 0);
        const a = clamp((pr * 30 - i + 1)) * fo, big = i % 10 === 0;
        line(x, y, x, y - (big ? 18 : 9), ink, (big ? .8 : .45) * a, 2);
        if (big && i) atext(String(i), x, y + 52, T.nep + i / 30, t, { size: 38, w: 500, col: sub, track: 0, dy: 14, out: T.cut - .3 });
      }
      atext('0', ax, ay + 52, T.nep - .1, t, { size: 38, w: 500, col: sub, track: 0, dy: 14, out: T.cut - .3 });
      atext('а.е.', bx + 6, ay + 98, T.x30, t, { size: 30, w: 500, col: sub, track: 0, dy: 12, out: T.cut - .3 });
      // Земля на 1: выноска с подписью
      const [ex, ey] = project(cam, ...earth.position.toArray());
      const ea = P(t, T.zem, .4) * fo;
      line(ex, ey - 14, ex, lerp(ey - 14, ey - 120, P(t, T.zem + .1, .4)), ink, .7 * ea, 2);
      atext('Земля · 1', ex - 6, ey - 140, T.zem + .2, t, { size: 40, w: 500, col: ink, align: 'left', track: 0, dy: 14, out: T.cut - .3 });
      const [nx, ny] = project(cam, ...nep.position.toArray());
      line(nx, ny - 34, nx, lerp(ny - 34, ny - 120, P(t, T.nep + .1, .4)), ink, .7 * P(t, T.nep, .4) * fo, 2);
      atext('Нептун · 30', nx + 6, ny - 140, T.nep + .2, t, { size: 40, w: 500, col: ink, align: 'right', track: 0, dy: 14, out: T.cut - .3 });
      atext('×30', 540, 560, T.x30, t, { size: 280, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.cut - .3 });
      atext('дальше от Солнца', 540, 640, T.dal, t, { size: 50, w: 500, col: sub, track: -.005, out: T.cut - .3 });
      return;
    }
    // ---- c2: 30³ → 27 000 → √ → 165 ----
    atext('30³', 540, 400, T.cub30, t, { size: 130, w: 600, col: ink, track: -.03, out: T.kor - .2 });
    // число и знак корня — группа, которая на «около» отъезжает вверх и сжимается
    const mv = P(t, T.okolo - .15, .8, eInOut);
    const gy = lerp(610, 360, mv), gk = lerp(1, .42, mv), ga = lerp(1, .8, mv);
    const v = Math.round(27000 * fillAt(t, T)).toLocaleString('ru-RU').replace(/\s/g, ' ');
    const ns = 220, nw = measure('27 000', ns, 700, -.045);
    g.save(); g.translate(540, gy); g.scale(gk, gk);
    atext(v, 0, 0, T.kube, t, { size: ns, w: 700, col: mv > .5 ? sub : ink, a: ga, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    // знак √: засечка → вниз → вверх → черта над числом
    const rp = P(t, T.kor - .05, .8, eInOut);
    if (rp > 0) {
      const x0 = -nw / 2 - 30, top = -ns * .82, bot = 14;
      const pts = [[x0 - 70, -ns * .32], [x0 - 48, -ns * .4], [x0 - 18, bot], [x0 + 8, top], [nw / 2 + 16, top]];
      const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), tot = lens.reduce((a, b) => a + b, 0);
      let left = rp * tot;
      g.save(); g.globalAlpha *= ga; g.strokeStyle = mv > .5 ? sub : ink; g.lineWidth = 12; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[0]);
      for (let i = 1; i < pts.length && left > 0; i++) {
        const f = Math.min(1, left / lens[i - 1]); left -= lens[i - 1];
        g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
      }
      g.stroke(); g.restore();
    }
    g.restore();
    atext('165', 540, 720, T.sta, t, { size: 330, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .95 });
    atext('лет длится год Нептуна', 540, 800, T.pyat - .1, t, { size: 48, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(T.nep, 'whoosh', .3, .8);
    add(T.x30, 'chime', .22, .9);
    add(T.zem, 'tick', .18);
    add(T.cub30, 'thud', .3, .75);
    for (let j = 0; j < 10; j += 3) add(layerT(T, j) + .3, 'click', .12, 1 + j * .04);
    add(T.tys, 'chime', .25, .9);
    add(T.kor, 'shimmer', .22);
    add(T.sta - 1.5, 'riser', .25);
    add(T.sta, 'impact', .4, .9);
  },
});
