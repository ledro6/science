// BORDER (34.53 – 53.19 с), светлый фон. Точечная карта-схема (Natural Earth): Канада — графитовые «шайбы»,
// США — светлый алюминий; камера под углом, как на техчертеже.
// b1 — точки поднимаются волной, на «границы» прорисовывается линия границы;
// b2 — «Маккаллум, 1995»: между провинциями Канады — толстые дуги потоков с бегущими «грузами»,
//      огромное красное «×20» (главный акцент выпуска), затем тонкие дуги через границу к штатам США;
// b3 — граница «растягивает» расстояние: США отъезжают, в зазоре по очереди «пошлины», «валюты», «законы», «язык»,
//      размерная линия «+ тысячи км»; дуги через границу вытягиваются и бледнеют.
import { defineScene, makeStage, project, atext, atextWords, line, P, Wd, THREE, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, frame, keys, flatArcPts, projPts, drawArc, dim, fit, D2R } from './kit.mjs';
import { countryAt, ID, BORDER_US_CA } from './geo.mjs';

function TT() {
  return {
    no: Wd('b1', 'Но'), gran: Wd('b1', 'границы'),
    v: Wd('b2', 'В'), mak: Wd('b2', 'Маккаллум'), kan: Wd('b2', 'канадские'), prov: Wd('b2', 'провинции'), mezh: Wd('b2', 'между'),
    dv: Wd('b2', 'двадцать'), chem: Wd('b2', 'чем'), sht: Wd('b2', 'штатами'), ras: Wd('b2', 'расстоянии'),
    posh: Wd('b3', 'Пошлины'), val: Wd('b3', 'валюты'), zak: Wd('b3', 'законы'), yaz: Wd('b3', 'язык'), rab: Wd('b3', 'работают'),
    tys: Wd('b3', 'тысячи'), lish: Wd('b3', 'лишние'), km: Wd('b3', 'километров'),
  };
}
// проекция «долгота/широта → плоскость»: север — от камеры (−Z)
const K = .064, CL = Math.cos(50 * D2R);
const XZ = (lat, lon) => [(lon + 96) * CL * K, -(lat - 50) * K];
const CITY = {
  van: [49.28, -123.1], cal: [51.05, -114.07], reg: [50.45, -104.6], win: [49.9, -97.14], tor: [43.65, -79.38], mon: [45.5, -73.57], hal: [44.65, -63.57],
  sea: [47.6, -122.33], min: [44.98, -93.27], chi: [41.88, -87.63], nyc: [40.71, -74], bos: [42.36, -71.06], den: [39.74, -104.99],
};
const US = new Set(['sea', 'min', 'chi', 'nyc', 'bos', 'den']);
const INTRA = [['van', 'cal'], ['cal', 'reg'], ['reg', 'win'], ['win', 'tor'], ['tor', 'mon'], ['mon', 'hal'], ['cal', 'tor']];
const CROSS = [['van', 'sea'], ['cal', 'den'], ['win', 'min'], ['tor', 'chi'], ['tor', 'nyc'], ['mon', 'bos']];
const GAP = .78;                                               // насколько «отъезжают» США на b3
const gapAt = (t, T) => GAP * P(t, T.posh - .1, 2.2, eInOut);
const BLINE = BORDER_US_CA.filter(l => l[0][0] > -125 || l[l.length - 1][0] > -125)[0];

defineScene('border', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .25 });
    stage.floor.visible = false;
    // сетка точек: Канада и континентальные США (без Аляски), 24°–70° с. ш.
    const ca = [], us = [], S = .056;
    for (let z = -1.1; z <= 1.65; z += S) for (let x = -1.95; x <= 2.15; x += S) {
      const lat = 50 - z / K, lon = x / (CL * K) - 96, id = countryAt(lat, lon);
      if (id === ID.CAN && lat < 66) ca.push([x, z]);
      else if (id === ID.USA && lat < 49.6 && lon > -126) us.push([x, z]);
    }
    const geo = new THREE.CylinderGeometry(.021, .021, .02, 12); geo.translate(0, .01, 0);
    const mk = (pts, col, rough) => {
      const m = new THREE.InstancedMesh(geo, new THREE.MeshPhysicalMaterial({ color: col, roughness: rough, clearcoat: .5, clearcoatRoughness: .3 }), pts.length);
      m.frustumCulled = false; m.castShadow = true; return m;
    };
    const mCA = mk(ca, '#8A8A8F', .35), mUS = mk(us, '#D2D2D6', .4);
    const usG = new THREE.Group(); usG.add(mUS);
    stage.root.add(mCA, usG);
    const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .12 }));
    shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.receiveShadow = true; stage.root.add(shadowFloor);
    return { stage, ca, us, mCA, mUS, usG, T: TT() };
  },

  update(t, s, st) {
    const { stage, ca, us, mCA, mUS, usG, T } = st, cam = stage.camera, L = stage.lights;
    // точки поднимаются волной с запада на восток
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    const put = (mesh, pts, t0) => {
      pts.forEach(([x, z], i) => {
        const k = eSpring(clamp((t - t0 - (x + 2) * .22 - (z + 1.1) * .05) / .7));
        p.set(x, 0, z); sc.set(Math.max(k, 1e-3), Math.max(k, 1e-3), Math.max(k, 1e-3));
        M.compose(p, q, sc); mesh.setMatrixAt(i, M);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    put(mCA, ca, s.start + .05); put(mUS, us, s.start + .25);
    usG.position.z = gapAt(t, T);
    L.key.position.set(-3, 10, 5); L.key.intensity = 2.2;
    const [az, el, d, ty] = keys([[s.start, -6, 70, 18.6, .15], [T.mak, -2, 66, 18.2, .2], [T.posh, 2, 64, 18.2, .3], [s.end, 4, 66, 19.8, .5]], t, eInOut);
    frame(cam, [0, 0, ty], d, az, el, 525, 1010);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, gap = gapAt(t, T);
    const P3 = ([lat, lon], dz = 0) => { const [x, z] = XZ(lat, lon); return [x, .025, z + dz]; };
    const city = k => P3(CITY[k], US.has(k) ? gap : 0);
    // --- граница (на b3 — две линии и серый зазор между ними) ---
    const pb = P(t, T.gran - .15, 1.1, eInOut), nB = BLINE.length;
    const top = BLINE.map(([lon, lat]) => project(cam, ...P3([lat, lon]))), bot = BLINE.map(([lon, lat]) => project(cam, ...P3([lat, lon], gap)));
    if (gap > .005) {
      g.save(); g.fillStyle = '#E4E4E7'; g.beginPath();
      top.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
      for (let i = nB - 1; i >= 0; i--) g.lineTo(...bot[i]);
      g.closePath(); g.fill(); g.restore();
    }
    const strokeL = (pts, a, lw) => {
      if (a <= .003) return; const m = Math.max(1, Math.floor(pb * (nB - 1)));
      g.save(); g.globalAlpha = a; g.strokeStyle = ink; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath(); for (let i = 0; i <= m; i++) i ? g.lineTo(...pts[i]) : g.moveTo(...pts[i]); g.stroke(); g.restore();
    };
    strokeL(top, pb > 0 ? 1 : 0, 3.5);
    if (gap > .005) strokeL(bot, P(t, T.posh, .4), 3.5);
    const [gx, gy] = project(cam, ...P3([49, -112]));
    atext('граница', gx, gy - 26, T.gran + .25, t, { size: 40, w: 500, col: ink, track: -.005, out: T.mak - .2 });
    // --- названия стран на карте ---
    const [cx1, cy1] = project(cam, ...P3([60.5, -106])), [ux1, uy1] = project(cam, ...P3([36.5, -91], gap));
    atext('Канада', cx1, cy1, T.v, t, { size: 52, w: 600, col: ink, track: -.01 });
    atext('США', ux1, uy1, T.v + .35, t, { size: 52, w: 600, col: '#6E6E73', track: -.01 });
    // --- дуги: внутри Канады толстые, через границу тонкие ---
    INTRA.forEach(([a, b], i) => {
      const pts = flatArcPts([city(a)[0], city(a)[2]], [city(b)[0], city(b)[2]], { y0: .03, lift: .42 });
      const pi = P(t, T.prov - .1 + i * .14, .9, eInOut);
      drawArc(projPts(cam, pts), t, { p: pi, lw: 11, col: '#F5F5F7', dark: false, a: 1 - .35 * P(t, T.posh, .8) });
      drawArc(projPts(cam, pts), t, { p: pi, lw: 6.5, col: ink, dark: false, pulses: 2, speed: .4, phase: i * .23, back: true, a: 1 - .35 * P(t, T.posh, .8) });
    });
    CROSS.forEach(([a, b], i) => {
      const pts = flatArcPts([city(a)[0], city(a)[2]], [city(b)[0], city(b)[2]], { y0: .03, lift: .2 });
      const pc = P(t, T.chem - .05 + i * .1, .9, eInOut);
      drawArc(projPts(cam, pts), t, { p: pc, lw: 2, col: '#6E6E73', dark: false, a: lerp(1, .55, gap / GAP) });
    });
    for (const k in CITY) {
      const [x, y] = project(cam, ...city(k)), isUS = US.has(k);
      const a = isUS ? P(t, T.chem - .1, .5) : P(t, T.prov - .2, .5);
      ENGdot(g, x, y, isUS ? 6 : 8, isUS ? '#6E6E73' : ink, a);
    }
    // --- тексты ---
    const oB2 = T.posh - .3;
    atext('Джон Маккаллум, 1995', 540, 270, T.mak, t, { size: 46, w: 500, col: sub, track: -.005, out: oB2 });
    atext('×20', 540, 545, T.dv, t, { size: 300, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: oB2 });
    atext('внутри Канады', 540, 615, T.dv + .25, t, { size: 46, w: 500, col: sub, track: -.005, out: oB2 });
    atext('чем со штатами США', 540, 668, T.chem, t, { size: 46, w: 500, col: sub, track: -.005, out: oB2 });
    // b3: граница как лишнее расстояние
    atextWordsAt(['Граница', 'как'], 540, 380, T.rab - .1, t, ink);
    atextWordsAt(['лишнее', 'расстояние'], 540, 490, T.lish - .1, t, ink);
    const W4 = [['пошлины', T.posh, -120], ['валюты', T.val, -103], ['законы', T.zak, -90], ['язык', T.yaz, -75]];
    W4.forEach(([w0, t0, lon], i) => {
      const lat = lon < -95 ? 49 : lon < -85 ? 48 : 44.6;
      const [x, y] = project(cam, ...P3([lat, lon], gap * .5));
      atext(w0, x, y + 13, t0, t, { size: 36, w: 600, col: ink, track: -.005, dy: 16 });
    });
    // размерная линия зазора справа
    const [ax, ay] = project(cam, ...P3([46.5, -66])), [bx, by] = project(cam, ...P3([46.5, -66], gap));
    const aK = P(t, T.tys - .1, .6);
    dim(ax + 40, ay, bx + 40, by, aK, ink, 10);
    atext('+ тысячи км', Math.min(bx + 40, 860), by + 70, T.tys, t, { size: 40, w: 600, col: ink, track: -.005, align: 'center' });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .1, 'shimmer', .18, .8);
    add(T.gran - .1, 'whoosh', .2, .8);
    add(T.mak, 'tick', .14);
    add(T.prov, 'whoosh', .2, 1.1);
    add(T.dv - 1.5, 'riser', .25);
    add(T.dv, 'impact', .42, .9);
    add(T.chem, 'tick', .14, .9);
    add(T.posh - .1, 'swell', .24, .7);
    add(T.val, 'click', .16, 1);
    add(T.zak, 'click', .16, 1.05);
    add(T.yaz, 'click', .16, 1.1);
    add(T.tys, 'thud', .22, .8);
  },
});
function ENGdot(g, x, y, r, col, a) {
  if (a <= .003) return;
  g.save(); g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#F5F5F7'; g.beginPath(); g.arc(x, y, r * .42, 0, Math.PI * 2); g.fill(); g.restore();
}
function atextWordsAt(ws, x, y, t0, t, col) {
  atextWords(ws.join(' '), x, y, t0, t, { size: 96, w: 600, col, track: -.03, stagger: .12 });
}
