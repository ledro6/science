// BONE (18.71 – 34.12 с), чёрный фон.
// b1 — керамическая кость выходит из темноты, «Прочность кости»; лазер-срез на «площади», верхняя половина уходит,
//      макро-проезд над «die-shot» сечения (как в пилоте), выноска «Площадь сечения / прочность ∝ L²»;
//      на «Она» над сечением — стеклянная плитка, на «квадрат» плиток становится 2×2, тонкое кольцо — сечение великана; «×4 прочность»;
// b2 — «сейчас»: одна плитка и один графитовый кубик; «великан»: 2×2 плитки и куб 2×2×2 — на каждой плитке столбик из двух;
//      «×8 вес» (красным, L³) против «×4 прочность», на «вдвое» → «×2 нагрузка на см²»;
//      кость стоит, сверху графитовый груз: «Шаг» — толчок, «прыжок» — удар сильнее, на «перелом» красная трещина (единственный акцент кадра).
import { defineScene, makeStage, project, atext, callout, line, P, Wd, WdE, E, rng, THREE, MAT, roundedBox, glassEdges, shadowsOn, clamp, lerp, eApple, eInOut, eIn, eEase, eExpo, eStd } from '../../../engine.mjs';
import { makeBone } from '../../../models.mjs';
import { ctx, bump, frame, keys, wordsAt, veil } from './kit.mjs';

const H_CUT = 1.8, RO = .3, RI = .165, TS = .6, CB = .56;
function TT() {
  const T = {
    a: Wd('b1', 'А'), pr: Wd('b1', 'прочность'), kos: Wd('b1', 'кости'), pl: Wd('b1', 'площади'), sech: Wd('b1', 'сечения'),
    ona: Wd('b1', 'Она'), tol: Wd('b1', 'только'), kv: Wd('b1', 'квадрат'), chet: Wd('b1', 'четыре'),
    kazh: Wd('b2', 'Каждая'), kost: Wd('b2', 'кость'), pon: Wd('b2', 'понесёт'), vd: Wd('b2', 'вдвое'), nag: Wd('b2', 'нагрузку'), sant: Wd('b2', 'сантиметр'),
    shag: Wd('b2', 'Шаг'), pry: Wd('b2', 'прыжок'), per: Wd('b2', 'перелом'),
  };
  T.cutB = (E('b1') + T.kazh) / 2; T.cutC = (WdE('b2', 'сантиметр') + T.shag) / 2;
  return T;
}
// груз: высота над костью в фазе C (толчок на «Шаг», подскок и удар на «прыжок»)
function loadY(t, T) {
  let y = lerp(1.4, 0, P(t, T.cutC + .05, .55, eIn));
  const hop = t - T.pry, up = .75;
  if (hop > 0 && hop < up) y += .55 * Math.sin(Math.PI * hop / up);
  return y;
}
const hitAt = T => [T.cutC + .6, T.shag + .05, T.pry + .75];

defineScene('bone', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const T = TT(), root = stage.root;
    // ===== A: кость со срезом (из пилота strength.mjs) =====
    const planeLow = new THREE.Plane(new THREE.Vector3(0, -1, 0), H_CUT), planeUp = new THREE.Plane(new THREE.Vector3(0, 1, 0), -H_CUT);
    const boneMatLo = new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25, clippingPlanes: [planeLow] });
    const boneMatUp = new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25, clippingPlanes: [planeUp], transparent: true });
    const boneLo = makeBone(3, .6, boneMatLo), boneUp = makeBone(3, .6, boneMatUp);
    for (const b of [boneLo, boneUp]) { b.rotation.z = Math.PI / 2; b.position.y = 1.5; }
    const gA = new THREE.Group(); gA.add(boneLo, boneUp); root.add(gA);
    // «die-shot» сечения: кортикальное кольцо, канал, ламеллы, остеоны
    const cap = new THREE.Group(); cap.position.y = H_CUT + .0015; cap.rotation.x = -Math.PI / 2;
    cap.add(new THREE.Mesh(new THREE.RingGeometry(RI, RO, 96, 1), new THREE.MeshStandardMaterial({ color: '#FBFAF6', roughness: .55 })),
      new THREE.Mesh(new THREE.CircleGeometry(RI, 96), new THREE.MeshPhysicalMaterial({ color: '#1C1C1E', roughness: .3, clearcoat: 1 })));
    const lamellae = [];
    for (let i = 0; i < 7; i++) {
      const r = lerp(RI + .012, RO - .008, i / 6), pts = [];
      for (let k = 0; k <= 128; k++) { const a = k / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, .0008)); }
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2a2a2c', transparent: true, opacity: .25 }));
      cap.add(ln); lamellae.push(ln);
    }
    const NOST = 46, ost = new THREE.InstancedMesh(new THREE.RingGeometry(.55, 1, 20, 1), new THREE.MeshBasicMaterial({ color: '#8E8E93' }), NOST);
    { const R = rng(11), m = new THREE.Matrix4();
      for (let i = 0; i < NOST; i++) {
        const a = i / NOST * Math.PI * 2 + R() * .12, r = lerp(RI + .03, RO - .025, R()), sz = lerp(.008, .014, R());
        m.makeScale(sz, sz, 1).setPosition(Math.cos(a) * r, Math.sin(a) * r, .0012); ost.setMatrixAt(i, m);
      } }
    cap.add(ost); root.add(cap);
    const laser = new THREE.Mesh(new THREE.TorusGeometry(RO + .012, .005, 8, 96), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true }));
    laser.rotation.x = Math.PI / 2; root.add(laser);
    // стеклянные плитки площади сечения
    const tgeo = new THREE.BoxGeometry(TS, .022, TS), tMat = MAT.glass(.2);
    const eMat = new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .85 }), egeo = new THREE.EdgesGeometry(tgeo, 20);
    const mkTile = () => { const gr = new THREE.Group(); gr.add(new THREE.Mesh(tgeo, tMat), new THREE.LineSegments(egeo, eMat)); return gr; };
    const tilesA = [0, 1, 2, 3].map(() => { const m = mkTile(); root.add(m); return m; });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2 * RO, .004, 6, 128), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true }));
    ring2.rotation.x = Math.PI / 2; root.add(ring2);
    // ===== B: плитки и кубики-вес =====
    const gB = new THREE.Group(), cgeo = roundedBox(CB, .04, 3), gmat = MAT.graphite();
    const tilesB = [], cubesB = [];
    const LX = -1.35, RX = .55;
    tilesB.push({ m: mkTile(), p: [LX, 0, 0] });
    for (const [i, k] of [[0, 0], [1, 0], [0, 1], [1, 1]]) tilesB.push({ m: mkTile(), p: [RX + (i - .5) * (TS + .02), 0, (k - .5) * (TS + .02)] });
    tilesB.forEach(q => { q.m.position.set(q.p[0], .011, q.p[2]); gB.add(q.m); });
    cubesB.push({ m: shadowsOn(new THREE.Mesh(cgeo, gmat)), p: [LX, .022 + CB / 2, 0], ord: 0 });
    let o = 1;
    for (let j = 0; j < 2; j++) for (const q of tilesB.slice(1)) cubesB.push({ m: shadowsOn(new THREE.Mesh(cgeo, gmat)), p: [q.p[0], .022 + CB / 2 + j * (CB + .02), q.p[2]], ord: o++ });
    cubesB.forEach(c => gB.add(c.m)); root.add(gB);
    // ===== C: кость под грузом =====
    const crackPl = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.45), crackUp = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.45);
    const bc1 = makeBone(3, .6, new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25, clippingPlanes: [crackPl] }));
    const bc2 = makeBone(3, .6, new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25, clippingPlanes: [crackUp] }));
    for (const b of [bc1, bc2]) { b.rotation.z = Math.PI / 2; b.position.y = 1.5; }
    const upper = new THREE.Group(); upper.add(bc2);
    const block = new THREE.Group(), bs = .48;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
      const m = shadowsOn(new THREE.Mesh(roundedBox(bs, .035, 3), gmat)); m.position.set((i - .5) * (bs + .015), bs / 2 + j * (bs + .015), (k - .5) * (bs + .015)); block.add(m);
    }
    const gC = new THREE.Group(); gC.add(bc1, upper, block); root.add(gC);
    return { stage, T, gA, boneUp, boneMatUp, cap, lamellae, ost, laser, tilesA, ring2, tMat, eMat, gB, tilesB, cubesB, gC, upper, block };
  },

  update(t, s, st) {
    const { stage, T } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cutB ? 1 : t < T.cutC ? 2 : 3;
    st.gA.visible = st.cap.visible = ph === 1; st.laser.visible = false; st.tilesA.forEach(m => m.visible = false); st.ring2.visible = false;
    st.gB.visible = ph === 2; st.gC.visible = ph === 3;
    L.key.position.set(3, 9, 6); L.key.castShadow = true;
    let lk = 1;
    if (ph === 1) {
      lk = P(t, T.a - .2, 1.4, eEase);
      const sweep = P(t, T.a - .2, 2.4, eInOut);
      L.key.position.set(lerp(-6, 3, sweep), 9, 6);
      st.gA.position.y = lerp(-.25, 0, P(t, T.a - .25, 1.5, eApple));
      // лазер-срез на «площади»
      const t0 = T.pl - .1, pl = P(t, t0, .7, eInOut);
      st.laser.visible = t > t0 && t < t0 + .95;
      st.laser.position.y = lerp(3.05, H_CUT, pl) + st.gA.position.y;
      st.laser.material.opacity = Math.min(P(t, t0, .15), 1 - P(t, t0 + .7, .25, eIn));
      st.laser.scale.setScalar(lerp(1.15, 1, clamp(pl * 4)));
      const lift = P(t, t0 + .75, 1.3, eInOut);
      st.boneUp.position.y = 1.5 + lift * 1.9; st.boneUp.visible = lift < .999;
      st.boneMatUp.opacity = 1 - P(t, t0 + .95, .6, eEase);
      st.boneMatUp.clippingPlanes[0].constant = -(H_CUT + lift * 1.9);
      st.cap.visible = lift > 0; st.cap.position.y = H_CUT + .0015 + st.gA.position.y;
      // die-shot: кольца подсвечиваются волной
      const wave = (t - T.sech) / 1.1;
      st.lamellae.forEach((ln, i) => {
        const hit = Math.exp(-Math.pow((wave - i / 6) * 5, 2));
        ln.material.opacity = .22 + .7 * hit * P(t, T.sech, .2);
        ln.material.color.set(hit > .3 ? '#5a5a5e' : '#2a2a2c');
      });
      // плитки: на «Она» — одна плитка над сечением, на «квадрат» — 2×2
      const ti = P(t, T.ona - .05, .7), sq = P(t, T.kv - .1, 1.1, eInOut), yT = H_CUT + .16 + .04 * Math.sin((t - T.ona) * 1.6);
      st.tMat.opacity = .2; st.eMat.opacity = .85;
      st.tilesA.forEach((m, i) => {
        const cx = (i % 2 - .5) * (TS + .02), cz = (Math.floor(i / 2) - .5) * (TS + .02);
        if (i === 0) { m.visible = ti > .003; m.position.set(cx * sq, yT + (1 - ti) * .25, cz * sq); m.scale.setScalar(lerp(.92, 1, ti)); }
        else { const q = P(t, T.kv - .1 + i * .08, .8, eApple); m.visible = q > .003; m.position.set(cx, yT + (1 - q) * .3, cz); m.scale.setScalar(lerp(.6, 1, q)); }
      });
      const rq = P(t, T.kv + .5, .8);
      st.ring2.visible = rq > .003; st.ring2.material.opacity = .55 * rq; st.ring2.position.y = H_CUT + .004;
      // камера: общий план → макро над срезом → чуть выше, чтобы уместились 2×2 плитки
      const K = [
        [s.start, 16, 1.5, -24, 8, 900], [T.pl + .6, 16, 1.5, -14, 8, 900], [T.pl + 2.2, 4.8, H_CUT, 18, 80, 800],
        [T.kv - .25, 4.5, H_CUT, 30, 82, 800], [T.kv + 1.0, 7.4, H_CUT + .1, 38, 76, 860], [T.cutB, 7.7, H_CUT + .1, 44, 75, 860],
      ];
      const [d, ty, az, el, sy] = keys(K, t, eInOut);
      frame(cam, [0, ty, 0], d, az, el, 540, sy);
    } else if (ph === 2) {
      lk = P(t, T.cutB, .6, eEase);
      st.tMat.opacity = .22; st.eMat.opacity = .85;
      st.tilesB.forEach((q, i) => { const a = P(t, T.cutB + .05 + i * .05, .6); q.m.visible = a > .003; q.m.scale.setScalar(lerp(.7, 1, a)); });
      // кубики-вес падают на плитки: левый на «Каждая», восемь правых — на «кость понесёт»
      st.cubesB.forEach(c => {
        const t0 = c.ord === 0 ? T.kazh - .25 : T.kost - .2 + (c.ord - 1) * .09;
        const f = P(t, t0, .5, eIn);
        c.m.visible = t > t0; c.m.position.set(c.p[0], c.p[1] + (1 - f) * .8, c.p[2]);
        c.m.rotation.y = (1 - f) * .4;
      });
      const k = clamp((t - T.cutB) / (T.cutC - T.cutB));
      frame(cam, [-.2, .5, 0], lerp(15.4, 14.6, eInOut(k)), lerp(14, 24, k), lerp(26, 22, k), 540, 985);
    } else {
      lk = P(t, T.cutC, .6, eEase);
      // груз ложится на кость, на «Шаг» и «прыжок» — удары; кость пружинит
      const ly = loadY(t, T);
      let sh = 0;
      for (const h of hitAt(T)) { const d = t - h; if (d > 0) sh += Math.exp(-d * 9) * Math.sin(d * 60) * (h === T.pry + .75 ? .06 : .03); }
      const br = P(t, T.per - .02, .35, eStd);
      st.block.position.set(br * .06, 2.97 + ly - Math.abs(sh) * .5 - br * .05, 0); st.block.rotation.set(0, .5, -br * .05);
      // перелом: верхний обломок съезжает и чуть наклоняется
      st.upper.position.set(br * .05, -br * .03, 0); st.upper.rotation.z = -br * .035;
      const k = clamp((t - T.cutC) / (s.end - T.cutC));
      const shk = Math.exp(-Math.max(0, t - T.per) * 6) * (t > T.per ? .05 : 0) * Math.sin((t - T.per) * 70);
      frame(cam, [0, 2.0 + sh * .3 + shk, 0], lerp(18.8, 18.2, eInOut(k)), lerp(-16, -8, k), 8, 540 + shk * 80, 870);
    }
    L.key.intensity = 2.6 * lk; L.rimL.intensity = 3.2 * lk; L.rimR.intensity = 2.4 * lk; L.hemi.intensity = .55 * lk;
    stage.floor.material.opacity = .5 * lk;
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    if (t < T.cutB) {
      const oT = T.pl - .2;
      wordsAt(['Прочность', 'кости'], [T.pr - .05, T.kos - .05], 540, 400, t, { size: 110, w: 600, col: ink, track: -.03, blur: 16, dur: .8, out: oT });
      // выноска к сечению во время макро
      const oC = T.kv - .35;
      const [ax, ay] = project(cam, -RO * .85, H_CUT, RO * .5);
      if (t < oC + .4) {
        callout(ax, ay, 300, 450, T.sech + .9, t, ink, 1 - P(t, oC, .3, eIn));
        atext('Площадь сечения', 96, 360, T.sech + 1.1, t, { size: 52, w: 600, col: ink, align: 'left', track: -.012, dy: 22, blur: 10, out: oC });
        atext('прочность ∝ L²', 96, 412, T.sech + 1.28, t, { size: 38, w: 500, col: sub, align: 'left', track: -.005, dy: 18, blur: 8, out: oC });
      }
      atext('×4', 540, 500, T.chet - .05, t, { size: 300, w: 700, col: ink, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: T.cutB - .35 });
      atext('прочность', 540, 578, T.chet + .15, t, { size: 50, w: 500, col: sub, track: -.005, out: T.cutB - .35 });
    } else if (t < T.cutC) {
      const oA = T.vd - .2, oB = T.cutC - .35;
      atext('×8', 300, 500, T.kost - .05, t, { size: 230, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oA, outDur: .3 });
      atext('вес', 300, 574, T.kost + .15, t, { size: 50, w: 500, col: sub, track: -.005, out: oA, outDur: .3 });
      atext('×4', 780, 500, T.pon - .05, t, { size: 230, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oA, outDur: .3 });
      atext('прочность', 780, 574, T.pon + .15, t, { size: 50, w: 500, col: sub, track: -.005, out: oA, outDur: .3 });
      atext('×2', 540, 500, T.vd - .05, t, { size: 300, w: 700, col: ink, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: oB });
      atext('нагрузка на см²', 540, 578, T.nag, t, { size: 50, w: 500, col: sub, track: -.005, out: oB });
      // подписи групп у оснований
      const [lx, ly] = project(cam, -1.35, 0, .5), [rx, ry] = project(cam, .55, 0, .75);
      atext('сейчас', lx, ly + 62, T.kazh, t, { size: 38, w: 500, col: sub, track: 0, dy: 12, out: oB });
      atext('вдвое выше', rx, ry + 62, T.kost + .3, t, { size: 38, w: 500, col: sub, track: 0, dy: 12, out: oB });
    } else {
      const oW = T.per - .25;
      wordsAt(['Шаг,', 'прыжок'], [T.shag - .05, T.pry - .05], 540, 330, t, { size: 110, w: 600, col: ink, track: -.03, blur: 16, dur: .8, out: oW, outDur: .3 });
      atext('Перелом', 540, 330, T.per + .05, t, { size: 110, w: 600, col: ink, track: -.03, blur: 16, dur: .8 });
      // красная трещина поперёк диафиза (единственный акцент кадра)
      const dt = t - T.per;
      if (dt > -.02) {
        const [cx, cy] = project(cam, 0, 1.45, .3), [ex] = project(cam, .3, 1.45, 0), [wx] = project(cam, -.3, 1.45, 0);
        const half = Math.abs(ex - wx) / 2 + 6, grow = P(t, T.per - .02, .25, eExpo), fl = Math.exp(-Math.max(0, dt) * 4);
        const R = rng(7), N = 9, pts = [];
        for (let i = 0; i <= N; i++) pts.push([cx - half + 2 * half * i / N, cy + (i % 2 ? -1 : 1) * (3 + R() * 7) + (R() - .5) * 4]);
        g.save(); g.globalAlpha = .45 * fl;
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, half * 1.5); gr.addColorStop(0, stage.accent); gr.addColorStop(1, 'rgba(255,69,58,0)');
        g.fillStyle = gr; g.fillRect(cx - half * 1.6, cy - half * 1.6, half * 3.2, half * 3.2); g.restore();
        g.save(); g.strokeStyle = stage.accent; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round';
        g.beginPath(); const nn = Math.max(1, Math.round(N * grow));
        // трещина растёт от центра к краям
        const mid = N / 2;
        for (let i = 0; i <= N; i++) { if (Math.abs(i - mid) > mid * grow + .01) continue; const [x, y] = pts[i]; (i === Math.ceil(mid - mid * grow) ? g.moveTo(x, y) : g.lineTo(x, y)); }
        g.stroke();
        // короткие ответвления
        g.lineWidth = 2.5;
        [[3, -1], [6, 1], [2, 1]].forEach(([i, dir]) => {
          if (grow < .7 || nn < 1) return;
          const [x, y] = pts[i]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + dir * 16); g.lineTo(x + 4, y + dir * 28); g.stroke();
        });
        g.restore();
      }
    }
    const dip = Math.max(bump(t, T.cutB, .22), bump(t, T.cutC, .22));
    veil('#000', dip);
  },

  sfx(add) {
    const T = TT();
    add(T.a - .1, 'thud', .4, .8);
    add(T.pr, 'swell', .2, .8);
    add(T.pl - .1, 'shimmer', .25);
    add(T.pl + .65, 'whoosh', .3, .8);
    add(T.sech + .9, 'click', .25);
    add(T.ona, 'tick', .14);
    for (let i = 1; i < 4; i++) add(T.kv + i * .08, 'click', .12, .9 + i * .05);
    add(T.chet, 'chime', .26, .9);
    add(T.kazh + .25, 'thud', .3, .8);
    for (let i = 0; i < 8; i++) add(T.kost + .3 + i * .09, 'click', .1 + i * .012, .8 + i * .03);
    add(T.kost, 'impact', .3, .9);
    add(T.vd, 'chime', .24, 1);
    add(T.cutC + .6, 'thud', .32, .7);
    add(T.shag + .05, 'thud', .34, .7);
    add(T.pry + .75, 'thud', .45, .6);
    add(T.per - 1.5, 'riser', .3);
    add(T.per, 'crack', .9);
    add(T.per + .03, 'impact', .5);
  },
});
