// AIR (≈11.0 – 27.5 с), светлый фон. Машина в системе отсчёта машины: навстречу ей идёт «колонна воздуха»
// из графитовых кубиков (InstancedMesh), кубики поднимаются и перетекают через кузов.
// a1 — одна машина в профиль, колонна воздуха; на «колонну» размерная линия «1 с» — воздух, встреченный за секунду;
// a2 — камера поднимается, во второй полосе машина вдвое быстрее: колонна за секунду вдвое длиннее,
//      кубики отлетают вверх вдвое быстрее (стрелки толчка); «×2 воздуха», «×2 толчок»;
// a3 — стрелки силы сопротивления 1 и 4; «F ∝ v²», огромное белое «×4».
import { defineScene, makeStage, project, atext, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, makeCar, frame, keys, arrow, dim, streamY, roundedBoxGeo, WR } from './kit.mjs';

function TT() {
  return {
    na: Wd('a1', 'На'), mash: Wd('a1', 'машина'), sek: Wd('a1', 'секунду'), ras: Wd('a1', 'расталкивает'), kol: Wd('a1', 'колонну'),
    vd: Wd('a2', 'Вдвое'), bol: Wd('a2', 'больше'), voz: Wd('a2', 'воздуха'), kus: Wd('a2', 'кусочек'), vd2: Wd('a2', 'вдвое', 2), tol: Wd('a2', 'толчок'),
    sila: Wd('a3', 'Сила'), sopr: Wd('a3', 'сопротивления'), chet: Wd('a3', 'четыре'),
  };
}
const LANES = [{ z: -2.6, v: 2.4 }, { z: 2.6, v: 4.8 }];   // 90 и 180 км/ч: условные ед/с
const CX = -2.55, NOSE = CX + 2.45;                         // центр машины и нос (мировая X)
const ROWS = [[.5, .06], [.9, .2], [1.3, .38]], ZS = [-.45, 0, .45];
const SP = .4, XUP = 5.6, XEND = -6.2, LT = XUP - XEND, NS = Math.ceil(LT / SP);
const CUBE = .11;

defineScene('air', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    const T = TT();
    const cars = LANES.map(l => { const c = makeCar({ body: new THREE.MeshStandardMaterial({ color: '#C9CBCF', roughness: .32, metalness: .25 }), glass: new THREE.MeshStandardMaterial({ color: '#141416', roughness: .15, metalness: .2 }), dark: false }); c.position.set(CX, 0, l.z); stage.root.add(c); return c; });
    const geo = new THREE.BoxGeometry(CUBE, CUBE, CUBE), mat = new THREE.MeshStandardMaterial({ color: '#5A5A5F', roughness: .45, metalness: .15 });
    const N = NS * ROWS.length * ZS.length;
    const parts = LANES.map(() => { const m = new THREE.InstancedMesh(geo, mat, N); m.castShadow = false; m.frustumCulled = false; stage.root.add(m); return m; });
    return { stage, T, cars, parts, _m: new THREE.Matrix4(), _q: new THREE.Quaternion(), _p: new THREE.Vector3(), _s: new THREE.Vector3(), _e: new THREE.Euler() };
  },

  update(t, s, st) {
    const { stage, T, cars, parts, _m, _q, _p, _s, _e } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(-3, 10, 7); L.key.intensity = 2.0; L.hemi.intensity = 1.15;
    const inB = P(t, T.vd - .1, 1.2, eInOut);             // вторая полоса въезжает слева
    LANES.forEach((ln, li) => {
      const car = cars[li], show = li === 0 ? 1 : inB;
      car.position.x = CX - (1 - show) * 9;
      car.visible = show > .001;
      car.spin((t - s.start) * ln.v / WR);
      const m = parts[li]; let n = 0;
      for (let k = 0; k < NS; k++) {
        let x = XUP - ((k * SP + ln.v * (t - s.start)) % LT);
        const xr = x - CX;                                    // в координатах машины
        const fade = clamp((XUP - x) / 1.2) * clamp((x - CX + .6) / 1.6) * (li === 0 ? P(t, s.start + .1, .9) : P(t, T.vd + .6, .8));
        ROWS.forEach(([h, gap], ri) => ZS.forEach((z0, zi) => {
          const jx = ((ri * 7 + zi * 3) % 5) * .05;
          const y = streamY(xr + jx, h, gap) + Math.max(0, 1.9 - xr) * .22;
          // по бокам поток ещё и раздвигается: чем ближе к машине, тем шире
          const q = clamp((y - h) / .8);
          const z = z0 * (1 + .9 * q);
          _p.set(x + jx, y + CUBE / 2, ln.z + z);
          const sc = Math.max(1e-4, fade);
          _s.set(sc, sc, sc);
          _e.set(q * .6 * (zi - 1.5), q * .8, q * .5); _q.setFromEuler(_e);
          _m.compose(_p, _q, _s); m.setMatrixAt(n++, _m);
        }));
      }
      m.instanceMatrix.needsUpdate = true;
    });
    // камера: профиль одной машины → выше и дальше, видны обе полосы
    const k = P(t, T.vd - .2, 1.6, eInOut);
    const tx = lerp(-1.3, -.75, k), ty = lerp(.8, .3, k), tz = lerp(LANES[0].z, 0, k);
    const d = lerp(32, 44, k) - .05 * (t - s.start), el = lerp(9, 34, k), az = lerp(4, 7, k) + (t - s.start) * .15;
    frame(cam, [tx, ty, tz], d, az, el, 540, lerp(1000, 1075, k));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const inB = P(t, T.vd - .1, 1.2, eInOut);
    // --- a1: колонна воздуха за 1 секунду ---
    const oA1 = T.vd - .3;
    atext('Колонна воздуха', 540, 420, T.kol - .1, t, { size: 96, w: 600, col: ink, track: -.03, out: oA1 });
    const br = (li, t0, out) => {
      const ln = LANES[li], y = 1.95, a = P(t, t0, .5) * (1 - P(t, out, .35, eIn));
      const A = project(cam, NOSE, y, ln.z), B = project(cam, NOSE + ln.v * P(t, t0, .7, eInOut), y, ln.z);
      dim(A[0], A[1], B[0], B[1], a, ink);
      const M = project(cam, NOSE + ln.v / 2, y, ln.z);
      atext('1 с', M[0], M[1] - 22, t0 + .2, t, { size: 38, w: 600, col: ink, track: 0, dy: 12, out });
    };
    br(0, T.kol, T.sila - .2);
    // подписи скоростей над крышами
    LANES.forEach((ln, li) => {
      const [x, y] = project(cam, CX - (li ? (1 - inB) * 9 : 0) - 1.5, 1.45, ln.z);
      atext(li ? '180 км/ч' : '90 км/ч', x, y - 18, li ? T.vd + .3 : T.vd + .1, t, { size: 36, w: 600, col: sub, track: 0, dy: 12 });
    });
    // --- a2: вторая колонна вдвое длиннее ---
    br(1, T.voz - .2, T.sila - .2);
    const o2 = T.sila - .35;
    atext('×2', 300, 500, T.bol, t, { size: 220, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o2 });
    atext('воздуха', 300, 580, T.voz, t, { size: 48, w: 500, col: sub, track: -.005, out: o2 });
    atext('×2', 780, 500, T.vd2, t, { size: 220, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o2 });
    atext('толчок', 780, 580, T.tol, t, { size: 48, w: 500, col: sub, track: -.005, out: o2 });
    // стрелки толчка у носа: вверх, длина ∝ скорости
    const aK = P(t, T.kus, .5) * (1 - P(t, T.sila - .2, .35, eIn));
    LANES.forEach((ln, li) => {
      // экранная стрелка над носом: длина ∝ скорости (60 и 120 px)
      const [nx, ny] = project(cam, NOSE - .1, 1.05, ln.z);
      const len = 62 * (li + 1) * P(t, T.kus + li * .5, .7, eInOut);
      arrow(nx + 14, ny - 26, nx + 14 - len * .42, ny - 26 - len, ink, aK, 4, 15);
    });
    // --- a3: сила сопротивления ×4 ---
    atext('F ∝ v²', 540, 330, T.sila - .05, t, { size: 110, w: 600, col: ink, track: -.02 });
    atext('×4', 540, 560, T.chet - .05, t, { size: 280, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('сила сопротивления', 540, 640, T.chet + .2, t, { size: 48, w: 500, col: sub, track: -.005 });
    const aF = P(t, T.sopr, .5);
    LANES.forEach((ln, li) => {
      // стрелка силы сопротивления над крышей, против движения: 1 и 4
      const [rx, ry] = project(cam, CX + 1.2, 2.55, ln.z);
      const len = (li ? 4 : 1) * 62 * P(t, T.sopr + (li ? .45 : 0), .9, eInOut);
      arrow(rx, ry, rx - len, ry, ink, aF, 5, 17);
      atext(li ? '4F' : 'F', rx + 16, ry + 13, T.sopr + (li ? .6 : .15), t, { size: 38, w: 600, col: ink, align: 'left', track: 0, dy: 10 });
    });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .2, .8);
    add(T.kol, 'tick', .16);
    add(T.vd - .1, 'whoosh', .3, 1.0);
    add(T.bol, 'chime', .2, .9);
    add(T.voz - .2, 'tick', .14);
    add(T.vd2, 'chime', .2, 1.0);
    add(T.tol, 'thud', .2, .8);
    add(T.sila, 'bloom', .22, .85);
    add(T.chet, 'chime', .26, .95);
  },
});
