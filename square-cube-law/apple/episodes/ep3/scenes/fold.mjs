// FOLD (8.9 – 34.7 с), белый фон. Экспонента прямо в движении камеры: масштаб кадра V (метров по вертикали)
// меняется логарифмически — от 2,4 мм (макро торца листа) до полутора миллиардов метров (Земля и Луна).
// f1: макро торца листа, «0,1 мм»; каждый сгиб — копия стопки ложится сверху (InstancedMesh листов): 1 → 2 → 4.
// f2: сгибы ускоряются 8 → 64 слоя, счётчик 0,8 → 6,4 мм; «10 сгибов» — стопка 10 см (высота кружки).
// f3: 100 м рядом с графитовым силуэтом небоскрёба; 100 км — стопка пробивает тонкую линию границы космоса.
// f4: 42 сгиба — 440 000 км (красным), из Земли столб уходит дальше Луны.
import {
  defineScene, makeStage, project, atext, line, P, Wd, C, E, THREE, MAT, clamp, lerp,
  eApple, eInOut, eIn, eEase, eStd, W, H, g as _g,
} from '../../../engine.mjs';
import * as ENG from '../../../engine.mjs';
import { frame, smooth, paperTexture, stackMaterials } from './_lib.mjs';
import { moonGeometry } from './_lib.mjs';

const ctx = () => ENG.g;
const SHEET_W = .21, SHEET_D = .297, TH = 1e-4;          // метры
const VIS = 2 * 10 * Math.tan(13 * Math.PI / 180);          // высота кадра в единицах сцены на дистанции 10
const NL = 64;                                              // листов (или пачек) в InstancedMesh
const R_EARTH = 6.371e6, R_MOON = 1.737e6, D_MOON = 3.844e8, MOON_X = 1.75e8;
const Hm = n => TH * Math.pow(2, n);

let T = null;
function TT() {
  if (T) return T;
  T = {
    list: Wd('f1', 'Лист'), odna: Wd('f1', 'одна'), slozh: Wd('f1', 'Сложили'), dve: Wd('f1', 'две'), esche: Wd('f1', 'Ещё'), chet: Wd('f1', 'четыре'),
    kazh: Wd('f2', 'Каждый'), udv: Wd('f2', 'удваивает'), des: Wd('f2', 'десяти'), desyat: Wd('f2', 'десять'), sant: Wd('f2', 'сантиметров'),
    dvadc: Wd('f3', 'двадцати'), sto: Wd('f3', 'сто'), nebo: Wd('f3', 'небоскрёб'), tridc: Wd('f3', 'тридцати'), sto2: Wd('f3', 'сто', 1),
    kosm: Wd('f3', 'космос'), a: Wd('f4', 'А'), sorok: Wd('f4', 'сорока'), chetyr: Wd('f4', 'четыреста'), dalshe: Wd('f4', 'Дальше'), luny: Wd('f4', 'Луны'),
  };
  // сгибы «ложатся» (дискретно): [начало, длительность]
  T.lands = [[T.slozh + .05, .85], [T.esche + .05, .85], [T.udv - .1, .5], [T.udv + .42, .5], [T.udv + .94, .5], [T.udv + 1.46, .5]];
  // непрерывный рост: [t0, t1, n0, n1]
  T.segs = [[T.des - .1, T.desyat - .05, 6, 10], [T.dvadc - .12, T.sto, 10, 20], [T.tridc - .12, T.sto2, 20, 30], [T.sorok - .05, T.chetyr + .05, 30, 42]];
  return T;
}
// непрерывное число сгибов (для высоты и камеры)
function nCont(t) {
  const T = TT();
  let n = 0;
  for (const [a, d] of T.lands) n += eApple(clamp((t - a) / d));
  for (const [a, b, n0, n1] of T.segs) n += (n1 - n0) * eInOut(clamp((t - a) / (b - a)));
  return n;
}
// видимая высота кадра, м (камера чуть отстаёт от стопки — столб «выстреливает», камера догоняет)
function viewV(t) {
  const nv = nCont(t < TT().segs[0][0] - .2 ? t + .22 : t);
  const foot = .62 * smooth(7.6, 10, nv);
  return Math.max(.0024, Hm(nv) / .3, foot);
}

defineScene('fold', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .55 });
    const cam = stage.camera; cam.near = .05; cam.far = 4000; cam.updateProjectionMatrix();
    const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, .5, -.5);
    const pMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .82 });
    const iMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .82, transparent: true });
    const stack = new THREE.InstancedMesh(geo, pMat, NL), inc = new THREE.InstancedMesh(geo, iMat, NL);
    const c = new THREE.Color();
    for (let i = 0; i < NL; i++) {
      c.set(i % 2 ? '#F3F3F0' : '#FCFCFA'); stack.setColorAt(i, c); inc.setColorAt(i, c);
    }
    stack.castShadow = inc.castShadow = true; stack.frustumCulled = inc.frustumCulled = false;
    // город: главный небоскрёб (ступенчатый) + низкие коробки вокруг (InstancedMesh)
    const gMat = MAT.graphite();
    const tower = new THREE.Group();
    const box = (w, h, d, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gMat); m.position.y = y + h / 2; m.castShadow = true; tower.add(m); };
    box(30, 70, 30, 0); box(23, 16, 23, 70); box(15, 8, 15, 86);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1.2, 14, 8), gMat); spire.position.y = 101; tower.add(spire);
    tower.position.set(46, 0, -30);
    const cityMat = new THREE.MeshPhysicalMaterial({ color: '#8E8E93', roughness: .5, clearcoat: .3 });
    const CITY = [[88, -22, 18, 34], [114, -52, 22, 24], [-52, -40, 20, 40], [-86, -18, 16, 22], [70, -76, 26, 46], [-118, -64, 24, 30], [140, -14, 14, 18]];
    const cgeo = new THREE.BoxGeometry(1, 1, 1); cgeo.translate(0, .5, 0);
    const city = new THREE.InstancedMesh(cgeo, cityMat, CITY.length); city.castShadow = true; city.frustumCulled = false;
    // Земля и Луна
    const earthMat = new THREE.MeshPhysicalMaterial({ color: '#C9CBCF', roughness: .45, clearcoat: .4, transparent: true });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), earthMat);
    const moonMat = new THREE.MeshPhysicalMaterial({ color: '#E2E1DD', roughness: .6, transparent: true });
    const moon = new THREE.Mesh(moonGeometry(THREE, 48, 11), moonMat);
    // непрерывный рост: один брусок с полосатым торцом (полоса = лист; mip-карты усредняют тысячи листов)
    const tex = paperTexture(THREE), col = new THREE.Mesh(geo, stackMaterials(THREE, tex).list); col.castShadow = true;
    stage.root.add(stack, inc, col, tower, city, earth, moon);
    return { stage, stack, inc, iMat, col, tex, tower, city, CITY, earth, earthMat, moon, moonMat };
  },

  update(t, s, st) {
    const T = TT();
    const { stage, stack, inc, iMat, col, tex, tower, city, CITY, earth, earthMat, moon, moonMat } = st, cam = stage.camera;
    const L = stage.lights;
    L.key.position.set(3, 9, 6); L.key.intensity = 2.3; L.hemi.intensity = 1.15; L.rimL.intensity = 1.2; L.rimR.intensity = .9;
    const V = viewV(t), k = VIS / V;
    stage.root.scale.setScalar(k);
    const n = nCont(t), Hc = Hm(n);
    const fw = Math.max(SHEET_W, V * .025), fd = Math.max(SHEET_D, V * .025);

    // ---- стопка листов ----
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    let done = 0, land = null;
    for (const [a, d] of T.lands) { if (t >= a + d) done++; else if (t >= a) { land = clamp((t - a) / d); break; } }
    const cont = t >= T.segs[0][0];
    let cnt = cont ? 0 : Math.pow(2, done), pitch = TH;
    stack.count = cnt; stack.visible = !cont; col.visible = cont;
    if (cont) { col.scale.set(fw, Hc, fd); tex.repeat.set(1, Math.min(Math.pow(2, n), 16384)); }
    for (let i = 0; i < cnt; i++) {
      p.set(0, i * pitch, 0); sc.set(fw, pitch * (cont ? .985 : .86), fd); M.compose(p, q, sc); stack.setMatrixAt(i, M);
    }
    stack.instanceMatrix.needsUpdate = true;
    inc.visible = land != null && !cont;
    if (inc.visible) {
      const e = eApple(land), base = cnt * TH, drop = V * .07 * (1 - e);
      inc.count = cnt;
      for (let i = 0; i < cnt; i++) { p.set(0, base + i * TH + drop, 0); sc.set(fw, TH * .86, fd); M.compose(p, q, sc); inc.setMatrixAt(i, M); }
      inc.instanceMatrix.needsUpdate = true;
      iMat.opacity = clamp(land * 3);
    }

    // ---- небоскрёб и город (f3) ----
    const up = P(t, T.nebo - .25, 1.1, eApple), vis = up > .003 && t < T.tridc + 1.2;
    tower.visible = city.visible = vis;
    if (vis) {
      tower.scale.set(1, Math.max(.001, up), 1);
      CITY.forEach(([x, z, w, h], i) => {
        const u = P(t, T.nebo - .1 + i * .06, 1.0, eApple);
        p.set(x, 0, z); sc.set(w, Math.max(.001, h * u), w * .9); M.compose(p, q, sc); city.setMatrixAt(i, M);
      });
      city.instanceMatrix.needsUpdate = true;
    }

    // ---- Земля и Луна (f4) ----
    const eo = smooth(4e7, 2e8, V);
    earth.visible = eo > .003;
    const Rd = Math.max(R_EARTH, V * .045);
    earth.scale.setScalar(Rd); earth.position.set(0, -Rd, -fd / 2); earthMat.opacity = eo;
    earth.rotation.set(.4, t * .05, 0);
    const mo = smooth(6e7, 4e8, V) * P(t, T.chetyr - .3, 1.0);
    moon.visible = mo > .003;
    moon.scale.setScalar(Math.max(R_MOON, V * .022)); moon.position.set(MOON_X, D_MOON, -fd / 2); moonMat.opacity = mo;
    moon.rotation.set(.3, -.5 + t * .04, 0);

    // ---- камера: фиксированная дистанция, масштаб мира — экспонента ----
    const nv = nCont(t < T.segs[0][0] - .2 ? t + .22 : t);
    const az = lerp(lerp(8, 30, smooth(5, 10, nv)), 16, smooth(10.5, 15, nv)) + .4 * (t - s.start);
    const el = lerp(lerp(4, 15, smooth(5, 10, nv)), 5, smooth(10.5, 15, nv));
    const sy = lerp(1200, 1090, smooth(30, 42, nv));
    frame(cam, [0, 0, -fd * k / 2 * smooth(8, 11, nv)], 10, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const T = TT(), { stage } = st, cam = stage.camera, g = ctx(), ink = stage.ink, sub = stage.sub;
    const V = viewV(t), k = VIS / V, n = nCont(t), Hc = Hm(n);
    const wp = (x, y, z = 0) => project(cam, x * k, y * k, z * k);

    // ---- размерная линия толщины (макро) ----
    {
      const a = P(t, T.list, .6) * (1 - P(t, T.des - .3, .35, eIn));
      if (a > .003) {
        const [, y0] = wp(0, 0), [, y1] = wp(0, Hc);
        const x = 960;
        line(x, y0, x, y1, ink, a * .7, 2);
        line(x - 12, y0, x + 12, y0, ink, a * .7, 2); line(x - 12, y1, x + 12, y1, ink, a * .7, 2);
      }
    }
    // ---- граница космоса (f3) ----
    {
      const a = P(t, T.tridc + .1, .6) * (1 - P(t, T.sorok + .1, .4, eIn));
      if (a > .003) {
        const [gx0, gy0] = wp(-V, 0), [gx1, gy1] = wp(V, 0);
        const [kx0, ky0] = wp(-V, 1e5), [kx1, ky1] = wp(V, 1e5);
        // атмосфера — едва заметный серый слой от земли до линии
        const gr = g.createLinearGradient(0, gy0, 0, ky0);
        gr.addColorStop(0, 'rgba(110,110,115,0.16)'); gr.addColorStop(1, 'rgba(110,110,115,0)');
        g.save(); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, Math.min(ky0, gy0), W, Math.abs(gy0 - ky0)); g.restore();
        line(gx0, gy0, gx1, gy1, ink, a * .5, 2);
        const pierce = P(t, T.kosm - .2, .6);
        line(kx0, ky0, kx1, ky1, ink, a * .55, 2, [10, 10]);
        atext('граница космоса', 1000, ky0 - 18, T.tridc + .4, t, { size: 32, w: 500, col: sub, align: 'right', track: 0, a, out: T.sorok });
        // точка пробоя
        const [px, py] = wp(0, 1e5);
        if (pierce > 0) {
          g.save(); g.globalAlpha = a * pierce; g.strokeStyle = ink; g.lineWidth = 2;
          g.beginPath(); g.arc(px, py, 10 + 26 * pierce, 0, Math.PI * 2); g.stroke(); g.restore();
        }
      }
    }
    // ---- выноска Луны и вершины столба (f4) ----
    {
      const a = P(t, T.dalshe - .1, .5);
      if (a > .003) {
        const [mx, my] = wp(MOON_X, D_MOON - Math.max(R_MOON, V * .022));
        atext('Луна', mx, my + 52, T.dalshe, t, { size: 38, w: 600, col: ink, track: 0 });
        atext('384 400 км', mx, my + 92, T.dalshe + .15, t, { size: 30, w: 500, col: sub, track: 0 });
        const [tx, ty] = wp(0, Hc), [lx] = wp(MOON_X * 1.6, 0);
        line(tx + 30, ty, lerp(tx + 30, lx, P(t, T.luny - .1, .5)), ty, ink, a * .45, 2, [8, 8]);
        line(mx + 50, my - 30, lerp(mx + 50, lx, P(t, T.luny - .1, .5)), my - 30, ink, a * .45, 2, [8, 8]);
      }
    }

    // ---- большие цифры ----
    const L = T.lands.map(([a, d]) => a + d * .55);
    const steps = [
      [T.odna, '0,1 мм', 'лист'], [L[0], '0,2 мм', '1 сгиб'], [L[1], '0,4 мм', '2 сгиба'],
      [L[2], '0,8 мм', '3 сгиба', 1], [L[3], '1,6 мм', '4 сгиба', 1], [L[4], '3,2 мм', '5 сгибов', 1], [L[5], '6,4 мм', '6 сгибов', 1],
      [T.desyat - .05, '10 см', '10 сгибов'], [T.sto - .05, '100 м', '20 сгибов'], [T.sto2 - .05, '100 км', '30 сгибов'],
      [T.chetyr - .05, '440 000 км', '42 сгиба', 0, 1],
    ];
    steps.forEach(([t0, big, fold, quick, red], i) => {
      const nx = steps[i + 1] ? steps[i + 1][0] - (steps[i + 1][3] ? .12 : .2) : null;
      if (t < t0 - .1 || (nx != null && t > nx + .5)) return;
      const o = { out: nx, outDur: quick || (steps[i + 1] && steps[i + 1][3]) ? .14 : .3 };
      const dur = quick ? .35 : .9;
      atext(fold, 540, 300, t0, t, { size: 40, w: 500, col: sub, track: 0, dur: quick ? .3 : .7, dy: quick ? 14 : 30, ...o });
      atext(big, 540, 480, t0, t, { size: red ? 150 : 210, w: 700, col: red ? stage.accent : ink, track: -.045, blur: quick ? 8 : 20, scale0: quick ? 1.04 : 1.12, dur, dy: quick ? 18 : 40, ...o });
    });
    const caps = [[T.list + .3, 'толщина листа', T.slozh], [T.sant, 'высота кружки', T.dvadc - .3], [T.nebo, 'как небоскрёб', T.tridc - .3],
      [T.kosm, 'это уже космос', T.sorok - .25], [T.dalshe, 'дальше Луны', null]];
    caps.forEach(([t0, txt, out]) => atext(txt, 540, 560, t0, t, { size: 46, w: 500, col: sub, track: -.005, out }));
  },

  sfx(add) {
    const T = TT();
    add(T.list, 'shimmer', .22);
    T.lands.forEach(([a, d], i) => add(a + d * .55, i < 2 ? 'thud' : 'click', i < 2 ? .3 : .2, 1 + i * .06));
    add(T.desyat - .05, 'chime', .26);
    add(T.dvadc - .1, 'whoosh', .35, .9);
    add(T.nebo, 'thud', .3, .7);
    add(T.tridc - .1, 'whoosh', .35, .8);
    add(T.kosm - .1, 'shimmer', .25);
    add(T.chetyr - 1.5, 'riser', .3);
    add(T.sorok - .05, 'whoosh', .4, .6);
    add(T.chetyr, 'impact', .38, .8);
    add(T.dalshe, 'chime', .3, .9);
  },
});
