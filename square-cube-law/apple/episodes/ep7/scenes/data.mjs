// DATA (13.5 – 23.4 с), белый фон.
// d1 — «1938» → «Фрэнк Бенфорд»; три стопки керамических карточек-таблиц собираются на полу (реки, города,
//      константы физики), счётчик «20 229 чисел».
// d2 — появляется воронка; верхние карточки стопок по одной взлетают, ныряют в воронку и, выпав из носика,
//      ложатся в 9 столбиков: та же кривая Бенфорда. Столбик «1» краснеет на «первых цифр», по вершинам рисуется кривая.
import { defineScene, makeStage, project, atext, atextWords, acount, P, Wd, E, THREE, MAT, clamp, lerp, rng, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, BEN, CHIPS, rbox, frame, keys, polyline, smoothPts, bump } from './kit.mjs';

const STACKS = [{ x: -1.3, n: 14, lab: 'Реки' }, { x: 0, n: 16, lab: 'Города' }, { x: 1.3, n: 10, lab: 'Константы' }];
const SZ = -2.2, PITCH = .058;
const CARD = [1.0, .05, .7], CHIP = [.4, .11, .4], CPITCH = .122;
const COLX = d => (d - 5) * .5, COLZ = .6;
const FY = 1.72, FZ = -.2;                                  // воронка: низ носика, глубина
const NT = 40;

function TT() {
  return {
    tys: Wd('d1', 'тысяча'), frank: Wd('d1', 'Фрэнк'), prov: Wd('d1', 'проверил'), dvad: Wd('d1', 'двадцать'), chis: Wd('d1', 'чисел'),
    sam: Wd('d1', 'самых'), tab: Wd('d1', 'таблиц'), vezde: Wd('d2', 'везде'), odno: Wd('d2', 'одно'), raspr: Wd('d2', 'распределение'),
    perv: Wd('d2', 'первых'), end1: E('d1'),
  };
}
// раскладка: карточка m стопки s; время сборки, время старта к воронке, столбик и слот
function plan(T) {
  const cards = [];
  STACKS.forEach((st, s) => { for (let j = 0; j < st.n; j++) cards.push({ s, j }); });
  // сборка: уровень за уровнем, по очереди по стопкам
  const build = [...cards].sort((a, b) => a.j - b.j || a.s - b.s);
  build.forEach((c, i) => { c.tb = T.tys + .2 + i * .075; });
  // старт: верхние карточки уходят первыми, стопки пустеют равномерно
  const launch = [...cards].sort((a, b) => (STACKS[a.s].n - 1 - a.j + .5) / STACKS[a.s].n - (STACKS[b.s].n - 1 - b.j + .5) / STACKS[b.s].n || a.s - b.s);
  // слоты столбиков в том же «равномерном» порядке → все столбики растут одновременно
  const slots = [];
  CHIPS.forEach((n, d) => { for (let j = 0; j < n; j++) slots.push({ d, j, f: (j + .5) / n }); });
  slots.sort((a, b) => a.f - b.f || a.d - b.d);
  const t0 = T.vezde - .2;
  launch.forEach((c, k) => { c.tl = t0 + k * .035; c.d = slots[k].d; c.slot = slots[k].j; });
  return cards;
}
const FLY = 1.0;

const _q = new THREE.Vector3();
function qbez(a, c, b, u, out) {
  const v = 1 - u;
  return out.set(v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1], v * v * a[2] + 2 * v * u * c[2] + u * u * b[2]);
}

defineScene('data', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    stage.camera.far = 200; stage.camera.updateProjectionMatrix();
    const T = TT();
    const cards = plan(T);
    const R = rng(19);
    cards.forEach(c => { c.jr = (R() - .5) * .08; c.jx = (R() - .5) * .03; c.jz = (R() - .5) * .03; c.a = R() * Math.PI * 2; c.tone = .9 + R() * .1; c.spin = R() < .5 ? -1 : 1; });
    const mat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .42, clearcoat: .35, clearcoatRoughness: .3 });
    const im = new THREE.InstancedMesh(rbox(1, 1, 1, .1, 2), mat, NT);
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    const col = new THREE.Color('#F2F2F0');
    for (let i = 0; i < NT; i++) im.setColorAt(i, col);
    // воронка (керамика, тонкая стенка)
    const prof = [[.15, 0], [.15, .26], [.2, .36], [.92, 1.08], [1.0, 1.16], [1.02, 1.2], [.97, 1.21], [.9, 1.13], [.18, .38], [.11, .27], [.11, 0]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const fMat = MAT.ceramicWhite(); fMat.side = THREE.DoubleSide; fMat.transparent = true;
    const funnel = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), fMat);
    funnel.castShadow = false; funnel.position.set(0, FY, FZ);
    stage.root.add(im, funnel);
    return { stage, T, cards, im, mat, fMat, funnel, M: new THREE.Matrix4(), Q: new THREE.Quaternion(), E3: new THREE.Euler(), V: new THREE.Vector3(), S: new THREE.Vector3(), C: new THREE.Color(), W: new THREE.Color('#F2F2F0'), A: new THREE.Color(stage.accent) };
  },

  update(t, s, st) {
    const { stage, T, cards, im, fMat, funnel, M, Q, E3, V, S, C, W, A } = st, cam = stage.camera, L = stage.lights;
    cards.forEach((c, i) => {
      const sx = STACKS[c.s].x, rest = [sx + c.jx, c.j * PITCH + CARD[1] / 2, SZ + c.jz];
      let sc = [...CARD], rx = 0, ry = c.jr, rz = 0;
      const u = (t - c.tl) / FLY;
      if (u <= 0) {
        // сборка стопки: карточка опускается сверху и садится мягкой пружиной
        const p = eSpring(clamp((t - c.tb) / .55));
        V.set(rest[0], rest[1] + (1 - p) * 1.1, rest[2]);
        const k = t < c.tb ? 0 : 1;
        sc = sc.map(x => x * k);
        ry = c.jr + (1 - p) * .4;
      } else {
        const A0 = [Math.cos(c.a) * .62, FY + 1.42, FZ + Math.sin(c.a) * .62], B0 = [0, FY - .05, FZ];
        const slotY = c.slot * CPITCH + CHIP[1] / 2, C0 = [COLX(c.d + 1), slotY, COLZ];
        const m = clamp(u);
        if (m < .45) {
          const q = eInOut(m / .45);
          qbez(rest, [lerp(rest[0], A0[0], .35), FY + 1.85, lerp(rest[2], A0[2], .5)], A0, q, V);
        } else if (m < .6) {
          const q = (m - .45) / .15;
          const r = lerp(.62, .05, q), a = c.a + q * 3;
          V.set(Math.cos(a) * r, lerp(A0[1], B0[1], q * q), FZ + Math.sin(a) * r);
        } else {
          const q = eApple((m - .6) / .4);
          qbez(B0, [lerp(B0[0], C0[0], .1), Math.max(slotY + .5, 1.1), lerp(B0[2], C0[2], .2)], C0, q, V);
        }
        // карточка превращается в фишку столбика и кувыркается в полёте
        const f = smooth3(clamp(m / .5));
        sc = CARD.map((x, j) => lerp(x, CHIP[j], f));
        rx = Math.sin(Math.PI * m) * 1.1 * c.spin; ry = c.jr * (1 - m) + c.spin * Math.PI * m; rz = Math.sin(Math.PI * m * 2) * .4;
      }
      E3.set(rx, ry, rz); Q.setFromEuler(E3); S.set(Math.max(sc[0], 1e-4), Math.max(sc[1], 1e-4), Math.max(sc[2], 1e-4));
      M.compose(V, Q, S); im.setMatrixAt(i, M);
      // столбик «1» краснеет на «первых цифр»
      const red = c.d === 0 && u > 0 ? P(t, Math.max(c.tl + FLY, T.perv + .05), .55) : 0;
      C.copy(W).multiplyScalar(c.tone).lerp(A, red); im.setColorAt(i, C);
    });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;

    // воронка: проявляется и поднимается перед d2
    const fa = P(t, T.end1 - .1, 1.0, eApple);
    funnel.visible = fa > .003;
    fMat.opacity = fa; fMat.depthWrite = fa > .95;
    funnel.position.y = FY + (1 - fa) * .35;
    funnel.rotation.y = t * .2;

    // свет
    const lit = P(t, s.start, 1);
    L.key.intensity = 2.2 * lit; L.hemi.intensity = 1.15; L.rimL.intensity = 1.2 * lit; L.rimR.intensity = .9 * lit;
    L.key.position.set(lerp(-4, 4, clamp((t - s.start) / 9)), 10, 6); L.key.target.position.set(0, 0, -.5); L.key.target.updateMatrixWorld();

    // камера: стопки → общий план (воронка + столбики)
    const [tx, ty, tz, d, az, el, sy] = keys([
      [s.start, 0, .45, SZ, 15.5, -12, 15, 990],
      [T.end1 - .5, 0, .5, SZ, 14.8, -5, 14, 990],
      [T.vezde + .5, 0, 1.5, -.3, 19.5, 4, 12, 790],
      [s.end, 0, 1.5, -.3, 19.2, 10, 13, 790],
    ], t, eInOut);
    frame(cam, [tx, ty, tz], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, cards } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    // 1938 → Фрэнк Бенфорд
    const o1 = T.dvad - .2;
    atext('1938', 540, 560, T.tys, t, { size: 280, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('Фрэнк Бенфорд, физик', 540, 640, T.frank, t, { size: 50, w: 500, col: sub, track: -.005, out: o1 });
    // счётчик
    const o2 = T.end1 - .25;
    atext('Фрэнк Бенфорд, 1938', 540, 330, T.dvad + .1, t, { size: 46, w: 600, col: ink, track: -.01, out: o2 });
    acount(20229, 540, 560, T.dvad, t, { size: 230, w: 700, col: ink, dur: 1.3, out: o2 });
    atext('чисел', 540, 640, T.chis, t, { size: 50, w: 500, col: sub, track: -.005, out: o2 });
    // подписи стопок
    STACKS.forEach((sk, i) => {
      const [x, y] = project(cam, sk.x, 0, SZ + CARD[2] / 2 + .05);
      atext(sk.lab, x, y + 56, T.sam + i * .18, t, { size: 36, w: 500, col: sub, track: 0, dy: 14, out: T.end1 - .15 });
    });
    // d2: заголовок
    atextWords('Одно и то же', 540, 300, T.odno - .05, t, { size: 84, w: 600, col: ink, track: -.03, stagger: .1 });
    atext('распределение', 540, 392, T.raspr, t, { size: 84, w: 600, col: ink, track: -.03 });
    // цифры под столбиками и кривая по вершинам
    const tops = [];
    for (let d = 1; d <= 9; d++) {
      const [x, y] = project(cam, COLX(d), 0, COLZ + CHIP[2] / 2 + .05);
      atext(String(d), x, y + 48, T.vezde + .3 + d * .05, t, { size: 38, w: 600, col: d === 1 ? ink : sub, track: 0, dy: 14 });
      tops.push(project(cam, COLX(d), CHIPS[d - 1] * CPITCH + .25, COLZ));
    }
    const cp = P(t, T.perv + .15, 1.0, eInOut);
    polyline(smoothPts(tops, 10), cp, ink, .85, 3);
    tops.forEach(([x, y], i) => { const a = P(t, T.perv + .15 + i * .1, .3); if (a > 0) { const g = ctx(); g.save(); g.globalAlpha = a; g.fillStyle = ink; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.restore(); } });
  },

  sfx(add) {
    const T = TT();
    add(T.tys, 'chime', .22, .9);
    for (let i = 0; i < 40; i += 8) add(T.tys + .2 + i * .075 + .3, 'click', .1, 1 + i * .005);
    add(T.dvad, 'chime', .25, 1.0);
    add(T.tab - .1, 'bloom', .25, .8);
    add(T.end1, 'whoosh', .3, .8);
    for (let k = 0; k < 40; k += 6) add(T.vezde - .2 + k * .035 + FLY, 'click', .1, 1.05 + k * .004);
    add(T.perv + .1, 'shimmer', .22);
  },
});
function smooth3(x) { return x * x * (3 - 2 * x); }
