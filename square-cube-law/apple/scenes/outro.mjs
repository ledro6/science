// Сцена «outro» (79.8–91.8 с), чёрный фон — «One more thing».
// o1: гигантский муравей выходит из темноты и рассыпается на частицы (InstancedMesh) → «bento»-ряд
//     блоха · муравей · мышь · слон на чёрном зеркальном полу, у каждого выноска с S/V, общая медленная орбита →
//     заголовок «Свой идеальный размер.»
// o2: финальная карточка: «Закон квадрата–куба», «S ∝ L²   V ∝ L³», вращающийся алюминиевый куб с бегущим бликом,
//     белая пилюля «Подписаться» с мягким нажатием на «природы».
import {
  defineScene, makeStage, orbit, project, atext, line, P, Wd, THREE, MAT, clamp, lerp,
  eApple, eIn, eInOut, eStd, rng, g, FONT, roundedBox, C_GRAY,
} from '../engine.mjs';
import { makeAnt, makeElephant, makeMouse, makeFlea } from '../models.mjs';

function TT() {
  const u = Wd('o1', 'У');
  return {
    dS: Wd('o1', 'насекомых') - .25,     // 81.62 — начало распада
    dDur: 1.2,
    bento: u - .05,                      // 83.33 — первое существо
    title: Wd('o1', 'свой'),             // 84.58
    out1: Wd('o2', 'Подпишись') - .45,   // 85.95 — уход ряда
    card: Wd('o2', 'Подпишись'),         // 86.40
    press: Wd('o2', 'природы'),          // 89.03
  };
}
const CERAMIC = new THREE.Color('#F2F2F0'), ALU = new THREE.Color('#C9CBCF'), BLACK = new THREE.Color('#000000');
const ANT_S = 2.4, ANT_RY = -.42;
const antX = (t, T) => .22 * (Math.min(t, T.dS) - 81.6);
const antWalk = (t, T) => 3.2 * (Math.min(t, T.dS) - 79.8);

// ряд «bento»: [фабрика, масштаб, x, сдвиг центра модели, верх (локально), S/V, имя]
const ROW = [
  [makeFlea, 1.3, -1.78, 0, .42, '3000', 'блоха'],
  [makeAnt, .5, -.92, .02, .62, '1200', 'муравей'],
  [makeMouse, .58, .2, .17, .62, '75', 'мышь'],
  [makeElephant, .4, 1.48, -.2, 2.9, '2', 'слон'],
];

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    const T = TT();
    stage.floor.visible = false;
    // чёрное зеркало: отражения — зеркальные копии под полупрозрачной чёрной плоскостью
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .84 }));
    mirror.rotation.x = -Math.PI / 2; mirror.position.y = .002; mirror.renderOrder = 2;
    stage.root.add(mirror);

    // --- гигантский муравей + его отражение, срез плоскостью для распада ---
    const clip = new THREE.Plane(new THREE.Vector3(1, 0, 0), 10);
    const antMat = MAT.ceramicWhite(); antMat.side = THREE.DoubleSide; antMat.clippingPlanes = [clip];
    const ant = makeAnt(antMat), antR = makeAnt(antMat);
    const antRG = new THREE.Group(); antRG.scale.set(1, -1, 1); antRG.add(antR);
    stage.root.add(ant, antRG);
    // частицы: вершины поверхности муравья в позе на момент распада
    ant.scale.setScalar(ANT_S); ant.rotation.y = ANT_RY; ant.position.set(antX(T.dS, T), 0, 0);
    ant.pose({ walk: antWalk(T.dS, T) });
    ant.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(ant.matrixWorld).invert(), m = new THREE.Matrix4(), v = new THREE.Vector3();
    const pool = [];
    ant.traverse(o => {
      if (!o.isMesh) return;
      m.multiplyMatrices(inv, o.matrixWorld);
      const pa = o.geometry.attributes.position;
      for (let i = 0; i < pa.count; i += 2) { v.fromBufferAttribute(pa, i).applyMatrix4(m); pool.push([v.x, v.y, v.z]); }
    });
    const R = rng(11), N = 1700, parts = [];
    let xmin = 1e9, xmax = -1e9;
    for (let i = 0; i < N; i++) {
      const p = pool[Math.floor(R() * pool.length)];
      xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]);
      parts.push({ p, v: [-.25 - R() * .45, .1 + R() * .45, (R() - .5) * .7], life: .8 + R() * .6, s: .6 + R() * .7, rx: R() * 6, ry: R() * 6, j: R() * .12 });
    }
    const pMat = new THREE.MeshStandardMaterial({ color: '#F2F2F0', roughness: .45 });
    const dust = new THREE.InstancedMesh(new THREE.BoxGeometry(.034, .034, .034), pMat, N);
    dust.frustumCulled = false;
    const dustG = new THREE.Group(); dustG.add(dust);
    dustG.position.copy(ant.position); dustG.rotation.copy(ant.rotation); dustG.scale.copy(ant.scale);
    stage.root.add(dustG);

    // --- bento-ряд + отражения ---
    const row = ROW.map(([mk, sc, x, cx, top, sv, name], i) => {
      const mat = MAT.ceramicWhite();
      const a = mk(mat), b = mk(mat);
      const gA = new THREE.Group(), gB = new THREE.Group();
      for (const [gg, mm] of [[gA, a], [gB, b]]) { mm.position.x = -cx; gg.add(mm); gg.scale.setScalar(sc); gg.position.x = x; gg.rotation.y = -.38; }
      gB.scale.y = -sc;
      stage.root.add(gA, gB);
      return { mat, a, b, gA, gB, sc, x, top, sv, name, i };
    });

    // --- финальный куб ---
    const cubeMat = MAT.aluminium();
    const cube = new THREE.Mesh(roundedBox(.72, .05, 3), cubeMat); cube.castShadow = true;
    cube.rotation.set(Math.atan(1 / Math.SQRT2), 0, Math.PI / 4);
    const cubeG = new THREE.Group(); cubeG.add(cube); stage.root.add(cubeG);
    const glint = new THREE.PointLight('#ffffff', 0, 0, 2); stage.scene.add(glint);

    return { stage, T, clip, ant, antRG, antR, dust, dustG, parts, xmin, xmax, row, cubeMat, cube, cubeG, glint };
  },

  update(t, s, st) {
    const { stage, T, clip, ant, antR, antRG, dust, parts, xmin, xmax, row, cubeMat, cubeG, glint } = st;
    const L = stage.lights, cam = stage.camera;
    // свет: объект «вырезается» из темноты — сначала контровые, потом ключ
    const lr = P(t, s.start + .05, 1.1, eApple), lk = P(t, s.start + .4, 1.4, eApple);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk;

    // --- муравей ---
    const antOn = t < T.dS + T.dDur + .05;
    ant.visible = antRG.visible = antOn;
    if (antOn) {
      ant.scale.setScalar(ANT_S); ant.rotation.set(0, ANT_RY, 0); ant.position.set(antX(t, T), 0, 0);
      ant.pose({ walk: antWalk(t, T) });
      antR.scale.setScalar(ANT_S); antR.rotation.set(0, ANT_RY, 0); antR.position.copy(ant.position);
      antR.pose({ walk: antWalk(t, T) });
      const c = t < T.dS ? xmin - 1 : lerp(xmin, xmax + .02, (t - T.dS) / T.dDur);
      clip.set(new THREE.Vector3(1, 0, 0), -c);
      ant.updateMatrixWorld(true);
      clip.applyMatrix4(ant.matrixWorld);
    }
    // --- частицы: отрываются там, где прошла плоскость, уплывают вверх-назад и тают ---
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
    const dOn = t > T.dS - .05 && t < T.dS + T.dDur + 1.6;
    dust.visible = dOn;
    if (dOn) {
      parts.forEach((pt, i) => {
        const tr = T.dS + (pt.p[0] - xmin) / (xmax - xmin) * T.dDur - pt.j;
        const a = t - tr;
        let k = 0;
        if (a > 0) k = pt.s * clamp(1 - a / pt.life) * clamp(a / .08);
        const aa = Math.max(0, a);
        pos.set(pt.p[0] + pt.v[0] * aa - .1 * aa * aa, pt.p[1] + pt.v[1] * aa + .35 * aa * aa, pt.p[2] + pt.v[2] * aa);
        e.set(pt.rx + aa * 3, pt.ry + aa * 2, 0); q.setFromEuler(e); scl.setScalar(Math.max(k, 1e-4));
        M.compose(pos, q, scl); dust.setMatrixAt(i, M);
      });
      dust.instanceMatrix.needsUpdate = true;
    }

    // --- bento: каждое существо выходит из темноты (цвет материала от чёрного) ---
    const outK = P(t, T.out1, .45, eIn);
    row.forEach(r => {
      const k = P(t, T.bento + r.i * .3, .9, eApple) * (1 - outK);
      const on = k > .002;
      r.gA.visible = r.gB.visible = on;
      r.mat.color.copy(BLACK).lerp(CERAMIC, k); r.mat.clearcoat = .35 * k;
      const y = lerp(-.06, 0, P(t, T.bento + r.i * .3, 1.0, eApple));
      r.gA.position.y = y; r.gB.position.y = -y;
      const ph = t * 2.4 + r.i;
      if (r.i === 0) { r.a.pose({ crouch: .5 + .5 * Math.sin(ph) }); r.b.pose({ crouch: .5 + .5 * Math.sin(ph) }); }
      if (r.i === 1) { r.a.pose({ walk: ph }); r.b.pose({ walk: ph }); }
      if (r.i === 2) { r.a.pose({ wag: ph * 2 }); r.b.pose({ wag: ph * 2 }); }
      if (r.i === 3) { r.a.pose({ flap: .3 * Math.sin(ph), trunk: .4 * Math.sin(ph * .7) }); r.b.pose({ flap: .3 * Math.sin(ph), trunk: .4 * Math.sin(ph * .7) }); }
    });

    // --- куб ---
    const ck = P(t, T.out1 + .45, 1.0, eApple);
    cubeG.visible = ck > .002;
    cubeMat.color.copy(BLACK).lerp(ALU, ck); cubeMat.clearcoat = .6 * ck;
    cubeG.position.set(0, lerp(1.35, 1.55, P(t, T.out1 + .45, 1.4, eApple)), 0);
    cubeG.rotation.set(0, (t - 86) * .55, 0);
    // бегущий блик: точечный свет проезжает перед кубом
    const gp = ((t - (T.card + .3)) / 2.1) % 1;
    glint.intensity = t > T.card ? 14 * Math.sin(Math.PI * clamp(gp)) * ck : 0;
    glint.position.set(lerp(-2.2, 2.2, eInOut(clamp(gp))), 2.15, 1.3);

    // --- камера: муравей (низкий ракурс) → ряд (общая орбита) → карточка ---
    const k1 = P(t, T.dS + .9, 1.1, eInOut), k2 = P(t, T.out1, 1.1, eInOut);
    const ca = { tg: [.15, .8, 0], d: lerp(15.5, 14.5, P(t, s.start, 2.6, eApple)), az: lerp(38, 26, P(t, s.start, 3, eApple)), el: 4 };
    const cb = { tg: [.1, .5, 0], d: 22, az: lerp(-14, 10, clamp((t - T.bento + .3) / 3.2)), el: 8 };
    const cc = { tg: [0, 1.32, 0], d: 12, az: 0, el: 6 };
    const mix = (A, B, k) => ({ tg: A.tg.map((x, i) => lerp(x, B.tg[i], k)), d: lerp(A.d, B.d, k), az: lerp(A.az, B.az, k), el: lerp(A.el, B.el, k) });
    const cm = mix(mix(ca, cb, k1), cc, k2);
    orbit(cam, cm.tg, cm.d, cm.az, cm.el);
  },

  draw2d(t, s, st) {
    const { T, row, stage } = st;
    const cam = stage.camera, ink = '#FFFFFF', sub = C_GRAY;
    // --- bento: выноски S/V ---
    if (t > T.bento && t < T.out1 + .6) {
      atext('Отношение S/V', 540, 625, T.bento + .25, t, { size: 34, w: 500, col: sub, track: 0, dy: 20, out: T.out1 - .05 });
      row.forEach(r => {
        const t0 = T.bento + r.i * .3 + .45;
        const [ax, ay] = project(cam, r.gA.position.x, r.top * r.sc + .1, 0);
        const lx = clamp(ax, 120, 930);
        const pd = P(t, t0, .25, eApple), pl = P(t, t0 + .1, .4, eApple), q = 1 - P(t, T.out1 - .05, .35, eIn);
        const ya = ay - 10, yb = 778;
        line(ax, ya, lerp(ax, lx, pl), lerp(ya, yb, pl), ink, .6 * pd * q, 2);
        g.save(); g.globalAlpha = pd * q; g.fillStyle = ink; g.beginPath(); g.arc(ax, ya, 5 * pd, 0, Math.PI * 2); g.fill(); g.restore();
        atext(r.sv, lx, 722, t0 + .25, t, { size: 52, w: 600, col: ink, track: -.03, dy: 20, out: T.out1 - .05 });
        atext(r.name, lx, 760, t0 + .32, t, { size: 30, w: 500, col: sub, track: 0, dy: 16, out: T.out1 - .05 });
      });
      atext('Свой идеальный', 540, 390, T.title, t, { size: 100, w: 600, col: ink, track: -.03, out: T.out1 - .1 });
      atext('размер.', 540, 500, T.title + .4, t, { size: 100, w: 600, col: ink, track: -.03, out: T.out1 - .1 });
    }
    // --- финальная карточка ---
    if (t > T.card - .1) {
      atext('Закон', 540, 350, T.card + .05, t, { size: 116, w: 600, col: ink, track: -.035 });
      atext('квадрата–куба', 540, 474, T.card + .15, t, { size: 116, w: 600, col: ink, track: -.035 });
      atext('S ∝ L²      V ∝ L³', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      // пилюля «Подписаться»
      const t0 = T.card + .65, p = P(t, t0, .8, eApple);
      if (p > .003) {
        const dn = P(t, T.press, .14, eStd), up = P(t, T.press + .14, .6, eApple);
        const k = (1 - .055 * dn + .055 * up) * lerp(1.04, 1, p);
        const W2 = 230, H2 = 56, cx = 540, cy = 1205 + (1 - p) * 34;
        const bl = (1 - P(t, t0, .55, eApple)) * 12;
        g.save(); g.globalAlpha = p; if (bl > .3) g.filter = `blur(${bl.toFixed(1)}px)`;
        g.translate(cx, cy); g.scale(k, k);
        const shade = Math.round(lerp(255, 222, dn * (1 - up)));
        g.fillStyle = `rgb(${shade},${shade},${Math.min(255, shade + 4)})`;
        g.beginPath(); g.roundRect(-W2, -H2, W2 * 2, H2 * 2, H2); g.fill();
        g.font = `600 44px ${FONT}`; g.letterSpacing = '-0.4px'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#1D1D1F'; g.fillText('Подписаться', 0, 2);
        g.restore();
        // мягкая волна от нажатия
        const rp = P(t, T.press + .05, .9, eApple);
        if (rp > 0 && rp < 1) {
          const gr = 4 + 30 * rp;
          g.save(); g.globalAlpha = .5 * (1 - rp); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2;
          g.beginPath(); g.roundRect(cx - W2 - gr, 1205 - H2 - gr, (W2 + gr) * 2, (H2 + gr) * 2, H2 + gr); g.stroke(); g.restore();
        }
      }
    }
  },

  sfx(add) {
    const T = TT();
    add(80.0, 'swell', .3, .6);
    add(T.dS, 'shimmer', .3, .8);
    for (let i = 0; i < 4; i++) add(T.bento + i * .3, 'click', .14, 1 + i * .08);
    add(T.title, 'bloom', .22, .8);
    add(T.out1 + .25, 'whoosh', .3, .6);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
