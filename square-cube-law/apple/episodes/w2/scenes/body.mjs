// BODY (19.47 – 28.78 с), чёрный фон.
// b1 — напольные весы как продукт (белая керамика, стеклянная площадка, чёрный глянцевый дисплей): «70 кг» → «140 кг»,
//      платформа чуть проседает, на дисплее те же цифры;
// b2 — «Сердце»: пульс в стиле Apple Watch, амплитуда растёт вдвое, «×2 нагрузка»;
//      горы: графитовый хребет со снежными вершинами проседает вдвое, пунктир «сейчас», «Горы вдвое ниже».
import { defineScene, makeStage, project, atext, acount, line, dot, P, Wd, WdE, E, THREE, MAT, shadowsOn, clamp, lerp, eApple, eInOut, eIn, eSpring, FONT } from '../../../engine.mjs';
import { ctx, bump, frame, dim, collectMats, setLit, roundedBoxGeo, wordsAt } from './kit.mjs';

function TT() {
  return {
    sem: Wd('b1', 'Семьдесят'), kg: Wd('b1', 'килограммов'), ves: Wd('b1', 'весах'), prev: Wd('b1', 'превратятся'), sto: Wd('b1', 'сто'), sor: Wd('b1', 'сорок'),
    ser: Wd('b2', 'Сердцу'), kach: Wd('b2', 'качать'), vd: Wd('b2', 'вдвое'), tya: Wd('b2', 'тяжелее'),
    sam: Wd('b2', 'самые'), gor: Wd('b2', 'горы'), vd2: Wd('b2', 'вдвое', 1), niz: Wd('b2', 'ниже'),
    cutB: (E('b1') + Wd('b2', 'Сердцу')) / 2, cutC: (WdE('b2', 'тяжелее') + Wd('b2', 'а')) / 2,
  };
}
// Хребет — карта высот: три вершины (пирамидальные профили) + гребни из синусов, снег выше 2/3 высоты.
const PEAKS = [[0, 0, 2.4, 1.55], [-1.6, -.55, 1.5, 1.1], [1.5, -.4, 1.75, 1.2]];
function heightAt(x, z) {
  let h = 0;
  for (const [px, pz, ph, w] of PEAKS) {
    const dx = x - px, dz = z - pz, r = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
    const ridges = 1 + .16 * Math.sin(a * 5 + px * 3) + .08 * Math.sin(a * 11 + pz * 5);
    h = Math.max(h, ph * Math.pow(Math.max(0, 1 - r / (w * ridges)), 1.35));
  }
  const n = .05 * Math.sin(x * 7.1 + z * 3.3) * Math.sin(z * 6.3 - x * 2.1) + .025 * Math.sin(x * 17 + z * 13);
  return Math.max(0, h + n * Math.min(1, h * 2));
}
function makeRange() {
  const geo = new THREE.PlaneGeometry(6.4, 3.6, 220, 124); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = heightAt(x, z);
    p.setY(i, y);
    const snow = clamp((y - 1.45 - .12 * Math.sin(x * 9 + z * 5)) / .12), c = lerp(lerp(.03, .11, clamp(y / .5)), .93, snow);
    col.push(c, c, c);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}
const H0 = 2.4;                                          // высота главной вершины «сейчас»

defineScene('body', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    // --- A: весы ---
    const gA = new THREE.Group();
    const base = new THREE.Mesh(roundedBoxGeo(1.7, .17, 1.7, .075), MAT.ceramicWhite());
    base.position.y = .085;
    const top = new THREE.Mesh(roundedBoxGeo(1.58, .03, 1.58, .012), MAT.glass(.22)); top.position.y = .18;
    const disp = new THREE.Mesh(roundedBoxGeo(.56, .02, .2, .008), MAT.ceramicBlack()); disp.position.set(0, .2, .62);
    const plat = new THREE.Group(); plat.add(top, disp);
    gA.add(base, plat); shadowsOn(gA);
    // --- C: хребет ---
    const gC = new THREE.Group();
    const mm = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', vertexColors: true, roughness: .6, clearcoat: .25, clearcoatRoughness: .4 });
    gC.add(new THREE.Mesh(makeRange(), mm));
    shadowsOn(gC);
    stage.root.add(gA, gC);
    return { stage, T: TT(), gA, plat, disp, gC, mA: collectMats(gA), mC: collectMats(gC) };
  },

  update(t, s, st) {
    const { stage, T, gA, plat, gC } = st, cam = stage.camera, L = stage.lights;
    const ph = t < T.cutB ? 1 : t < T.cutC ? 2 : 3;
    gA.visible = ph === 1; gC.visible = ph === 3;
    L.hemi.intensity = .45; L.rimL.intensity = 2.8; L.rimR.intensity = 2.0; L.key.intensity = 2.6; L.key.castShadow = true;
    stage.floor.visible = ph !== 2; stage.floor.position.y = 0;
    if (ph === 1) {
      setLit(st.mA, P(t, s.start + .05, .9) * (1 - P(t, T.cutB - .4, .35, eIn)));
      L.key.position.set(3, 9, 6);
      plat.position.y = -.018 * eSpring(clamp((t - T.sto + .05) / .8));
      const k = clamp((t - s.start) / (T.cutB - s.start));
      frame(cam, [0, .1, .1], lerp(10.5, 9.6, eInOut(k)), lerp(-18, -6, k), lerp(34, 30, k), 540, 1010);
    } else if (ph === 3) {
      setLit(st.mC, P(t, T.cutC, .7));
      L.key.position.set(-6, 7, 5); L.rimL.intensity = 3.2; L.rimR.intensity = 2.4; L.hemi.intensity = .3;
      gC.scale.set(1, lerp(1, .5, eSpring(clamp((t - T.vd2 + .05) / 1.2))), 1);
      const k = clamp((t - T.cutC) / (s.end - T.cutC));
      frame(cam, [0, .9, 0], lerp(19, 18.2, eInOut(k)), lerp(-10, -4, k), 9, 540, 1000);
    }
  },

  draw2d(t, s, st) {
    const { stage, T, disp, gC } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    if (t < T.cutB) {
      const oA = T.cutB - .4;
      // большая цифра: «70 кг» → счёт до «140 кг»
      atext('70 кг', 540, 520, T.sem - .05, t, { size: 230, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.sto - .05, outDur: .2 });
      if (t > T.sto - .1) acount(140, 540, 520, T.sto - .05, t, { from: 70, suffix: ' кг', size: 230, w: 700, col: ink, dur: 1.0, out: oA });
      atext('на весах', 540, 600, T.ves, t, { size: 50, w: 500, col: sub, track: -.005, out: oA });
      // дисплей весов: то же число, «прилипает» к 3D
      disp.updateMatrixWorld();
      const dp = new THREE.Vector3(0, .012, 0).applyMatrix4(disp.matrixWorld), [dx, dy] = project(cam, dp.x, dp.y, dp.z);
      const v = t < T.sto ? 70 : Math.round(lerp(70, 140, P(t, T.sto - .05, 1.0, x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))));
      const da = P(t, T.sem + .2, .5) * (1 - P(t, oA, .35, eIn));
      if (da > .003) {
        g.save(); g.globalAlpha = da; g.translate(dx, dy); g.transform(1, 0, -.35, .62, 0, 0);
        g.font = `600 44px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFFFFF';
        g.fillText(v.toFixed(1).replace('.', ','), 0, 0); g.restore();
      }
    } else if (t < T.cutC) {
      // пульс: развёртка как на Apple Watch, амплитуда растёт вдвое на «вдвое»
      const oB = T.cutC - .35, a = P(t, T.cutB + .1, .5) * (1 - P(t, oB, .3, eIn));
      atext('Сердце', 540, 400, T.ser - .05, t, { size: 120, w: 600, col: ink, track: -.03, out: oB });
      atext('×2', 540, 640, T.vd - .05, t, { size: 220, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oB });
      atext('нагрузка', 540, 712, T.vd + .15, t, { size: 50, w: 500, col: sub, track: -.005, out: oB });
      // лента развёртки: справа — «сейчас», влево — прошлое; амплитуда зависит от момента удара (после «вдвое» — ×2)
      const x0 = 110, x1 = 970, y0 = 1010, per = .78, span = 2.4;
      const amp = q => lerp(1, 2, eSpring(clamp((q - T.vd + .05) / .5)));
      const yv = q => { const f = (((q - T.cutB) % per) + per) % per / per;
        return -amp(q) * (100 * Math.exp(-Math.pow((f - .3) / .016, 2)) - 30 * Math.exp(-Math.pow((f - .35) / .022, 2)) + 20 * Math.exp(-Math.pow((f - .62) / .06, 2))); };
      if (a > .003) {
        g.save(); g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = ink;
        const N = 300;
        for (let i = 0; i < N; i++) {
          const f0 = i / N, f1 = (i + 1) / N, q0 = t - (1 - f0) * span, q1 = t - (1 - f1) * span;
          if (q0 < T.cutB) continue;
          g.globalAlpha = a * Math.pow(f1, 1.4);
          g.beginPath(); g.moveTo(lerp(x0, x1, f0), y0 + yv(q0)); g.lineTo(lerp(x0, x1, f1), y0 + yv(q1)); g.stroke();
        }
        g.restore();
        dot(x1, y0 + yv(t), 7, ink, a);
        line(x0, y0 + 160, x1, y0 + 160, sub, .35 * a, 2);
      }
    } else {
      // хребет: пунктир прежней высоты, размерная линия текущей
      const a = P(t, T.cutC + .3, .6);
      const [lx, ly] = project(cam, -2.1, H0, 0), [rx, ry] = project(cam, 2.3, H0, 0);
      line(lx, ly, rx, ry, ink, .7 * a * P(t, T.vd2 - .2, .4), 2.5, [8, 9]);
      atext('сейчас', lx, ly - 18, T.vd2, t, { size: 36, w: 500, col: sub, align: 'left', track: 0, dy: 12 });
      wordsAt(['Горы', 'вдвое', 'ниже'], [T.gor - .05, T.vd2 - .05, T.niz - .05], 540, 420, t, { size: 120, w: 600, col: ink, track: -.03, blur: 16, dur: .8 });
    }
    const dip = Math.max(bump(t, T.cutB, .22), bump(t, T.cutC, .22));
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = '#000'; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  },

  sfx(add) {
    const T = TT();
    add(T.sem - .1, 'thud', .26, .8);
    add(T.ves, 'tick', .12);
    add(T.sto - .05, 'thud', .32, .65);
    add(T.sor + .2, 'chime', .24, .95);
    add(T.ser, 'swell', .2, .7);
    for (let i = 0; i < 3; i++) add(T.cutB + .3 * .78 + i * .78, 'tick', .1, .7);
    add(T.vd, 'chime', .22, .9);
    add(T.cutC, 'whoosh', .22, .7);
    add(T.gor, 'bloom', .22, .75);
    add(T.vd2, 'thud', .3, .6);
    add(T.niz, 'tick', .14, .9);
  },
});
