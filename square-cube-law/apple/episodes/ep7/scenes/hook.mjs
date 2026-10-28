// HOOK (0 – 13.5 с), чёрный фон.
// k1 — поток графитовых плашек с настоящими числами (население, реки, цены) летит из темноты мимо камеры;
//      на каждой категории её карточки ярче, на «цены» первые цифры выделяются, остальное гаснет.
// k2 — поток тормозит, карточки не на «1» гаснут; на «треть» вырастают 3D-столбики 1–9 (log10(1+1/d)):
//      столбик «1» и огромная «30%» красные; на «девятки» — столбик 9 и «4,6%» серым.
// k3 — медленная орбита, свет скользит по столбикам, заголовок «Закон Бенфорда».
import { defineScene, makeStage, project, atext, atextWords, line, P, Wd, E, THREE, MAT, clamp, lerp, rng, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, BEN, makeBar, makeCards, frame, lerp3, NUMS, pct } from './kit.mjs';

const N = 26, L = 40, Z0 = -34, V0 = 6.2;
const BX = d => (d - 5) * .56, BZ = -26, BH = 9;          // столбики: x по цифре, высота = 10·P(d)

function TT() {
  return {
    chis: Wd('k1', 'чисел'), nas: Wd('k1', 'население'), dl: Wd('k1', 'длины'), cen: Wd('k1', 'цены'),
    pochti: Wd('k2', 'Почти'), tr: Wd('k2', 'треть'), ed: Wd('k2', 'единицы'), dev: Wd('k2', 'девятки'), men: Wd('k2', 'меньше'),
    eto: Wd('k3', 'Это'), zakon: Wd('k3', 'закон'), ben: Wd('k3', 'Бенфорда'), end2: E('k2'),
  };
}
// пройденный потоком путь: постоянная скорость, затем плавное торможение
const TS = 4.9, TD = 1.9;
const travel = t => { const u = clamp((t - TS) / TD); return V0 * (Math.min(t, TS) + TD * (u - u * u / 2)); };
const cat = k => NUMS[k % NUMS.length][0];

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    stage.camera.far = 200; stage.camera.updateProjectionMatrix();
    stage.scene.fog = new THREE.Fog('#000000', 10, 31);
    const T = TT();
    // поток карточек: полосы вокруг оси камеры, без центра (карточки пролетают мимо)
    const R = rng(7);
    const deck = makeCards(N);
    const lane = [];
    for (let i = 0; i < N; i++) {
      const a = (i * 2.399 + R() * .5) % (Math.PI * 2), r = 1.5 + R() * 1.9;
      lane.push({ x: Math.cos(a) * r * .9, y: Math.sin(a) * r * 1.25 + .2, ph: (i + R() * .6) / N, ry: (R() - .5) * .5, rx: (R() - .5) * .3, rz: (R() - .5) * .25, sp: (R() - .5) * .6 });
    }
    stage.root.add(deck.grp);
    // столбики распределения
    const white = MAT.ceramicWhite(), red = MAT.red();
    const bars = BEN.map((p, i) => { const b = makeBar(.42, .42, i === 0 ? red : white.clone()); b.position.set(BX(i + 1), 0, BZ); b.receiveShadow = false; stage.root.add(b); return b; });
    return { stage, T, deck, lane, bars, Q: new THREE.Quaternion(), E3: new THREE.Euler(), V: new THREE.Vector3() };
  },

  update(t, s, st) {
    const { stage, T, deck, lane, bars, Q, E3, V } = st, cam = stage.camera, Lg = stage.lights;
    // ---- поток карточек ----
    const sd = travel(t);
    const catOf = { 'Население': T.nas, 'Река': T.dl, 'Цена': T.cen };
    const hiMix = P(t, T.cen + .1, .9);                      // первые цифры выделяются
    const dimNot1 = P(t, T.pochti + .1, .8);                 // не-«1» гаснут
    const gone = P(t, T.tr + .05, .65, eIn);                  // поток уходит, растут столбики
    deck.grp.visible = gone < 1;
    for (let i = 0; i < N; i++) {
      const c = deck.cards[i], l = lane[i];
      let z = Z0 + ((l.ph * L + sd) % L);
      const near = clamp((z - 2) / 6);                        // у камеры карточка уходит в сторону
      V.set(l.x * (1 + near * .5), l.y * (1 + near * .5), z);
      E3.set(l.rx + near * .2 * Math.sign(l.y), l.ry + (sd * .02 * l.sp) - near * .3 * Math.sign(l.x), l.rz + sd * .01 * l.sp);
      Q.setFromEuler(E3);
      // категория, которую называет диктор, ярче остальных
      const cc = cat(c.k);
      let focus = 1;
      if (t > T.nas - .1 && t < T.cen + 1.2) {
        const cur = t < T.dl ? 'Население' : t < T.cen ? 'Река' : 'Цена';
        focus = cc === cur ? 1 : lerp(1, .45, P(t, T.nas - .1, .4)) * (1 - P(t, T.cen + .6, .6)) + P(t, T.cen + .6, .6);
      }
      const b = focus * (c.lead === 1 ? 1 : lerp(1, .16, dimNot1)) * (1 - gone);
      deck.set(i, V, Q, 1, b, hiMix, 1);
    }
    deck.commit();

    // ---- столбики ----
    bars.forEach((b, i) => {
      const g = eSpring(clamp((t - (T.tr + .3 + i * .075)) / 1.1));
      b.setH(Math.max(.001, BEN[i] * BH * g));
      b.visible = g > .001;
      if (i) {
        // на «девятки» — фокус на 9, остальные чуть уходят в тень; на «закон» всё снова ровно
        const foc = i === 8 ? 1 : 1 - .55 * P(t, T.dev - .1, .5) * (1 - P(t, T.eto, .6));
        b.material.color.set('#F2F2F0').multiplyScalar(foc);
      }
    });

    // ---- свет ----
    const lit = P(t, 0, 1.2);
    const sweep = clamp((t - T.eto + .2) / 2.2);
    Lg.key.position.set(lerp(-8, 6, eInOut(sweep)), 9, lerp(-17, -15, sweep));
    Lg.key.target.position.set(0, 0, BZ); Lg.key.target.updateMatrixWorld();
    Lg.key.intensity = 2.7 * lit; Lg.hemi.intensity = .5 * lit;
    Lg.rimL.intensity = 3.2 * lit; Lg.rimR.intensity = 2.4 * lit;
    stage.floor.visible = t > T.tr;

    // ---- камера: в потоке (смотрит вдоль оси) → обзор столбиков ----
    const k = P(t, T.pochti + .2, 1.9, eInOut);
    const drift = clamp((t - T.tr) / (s.end - T.tr));
    const bT = [0, 1.35, BZ], bD = 23, bAz = lerp(-16, 14, drift), bEl = lerp(9, 15, drift);
    const azR = bAz * Math.PI / 180, elR = bEl * Math.PI / 180;
    const bPos = [bT[0] + bD * Math.cos(elR) * Math.sin(azR), bT[1] + bD * Math.sin(elR), bT[2] + bD * Math.cos(elR) * Math.cos(azR)];
    const sPos = [Math.sin(t * .4) * .15, .1 + Math.cos(t * .3) * .1, 8];
    const pos = lerp3(sPos, bPos, k), tgt = lerp3([0, 0, -30], bT, k);
    // экранная точка цели: в потоке — центр, у столбиков — ниже середины (сверху цифра/заголовок)
    const sy = lerp(960, 965, k);
    stage.scene.fog.near = lerp(10, 80, k); stage.scene.fog.far = lerp(31, 160, k);
    cam.position.set(...pos); cam.lookAt(...tgt);
    cam.setViewOffset(1080, 1920, 0, 960 - sy, 1080, 1920); cam.updateMatrixWorld();
  },

  draw2d(t, s, st) {
    const { stage, T, bars } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    // k1: подписи категорий (эйбрау сверху)
    // в центре «тоннеля» — мягкая темнота, подпись категории стоит там
    const vg = P(t, T.nas - .4, .6) * (1 - P(t, T.pochti, .5, eIn));
    if (vg > .003) {
      g.save(); g.globalAlpha = vg;
      const gr = g.createRadialGradient(540, 990, 0, 540, 990, 520);
      gr.addColorStop(0, 'rgba(0,0,0,.92)'); gr.addColorStop(.55, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 400, 1080, 1180); g.restore();
    }
    const eb = { size: 76, w: 600, col: ink, track: -.025 };
    atext('Население городов', 540, 985, T.nas, t, { ...eb, out: T.dl - .2 });
    atext('Длины рек', 540, 985, T.dl, t, { ...eb, out: T.cen - .2 });
    atext('Цены в магазине', 540, 985, T.cen, t, { ...eb, out: T.pochti - .1 });
    atext('первая цифра', 540, 1050, T.cen + .5, t, { size: 42, w: 500, col: sub, track: 0, out: T.pochti - .1 });
    // k2: огромная «30%»
    const o2 = T.eto - .15;
    atext('30%', 540, 590, T.tr + .05, t, { size: 300, w: 700, col: acc, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o2 });
    atext('чисел начинаются с 1', 540, 670, T.ed - .1, t, { size: 48, w: 500, col: sub, track: -.005, out: o2 });
    // подписи цифр под столбиками
    bars.forEach((b, i) => {
      const [x, y] = project(cam, BX(i + 1), 0, BZ + .3);
      const t0 = T.tr + .45 + i * .075;
      const foc = i === 0 || i === 8 ? 1 : 1 - .5 * P(t, T.dev - .1, .5) * (1 - P(t, T.eto, .6));
      atext(String(i + 1), x, y + 58, t0, t, { size: 44, w: 600, col: i === 0 ? ink : sub, a: foc, track: 0, dy: 16 });
    });
    // 9 → 4,6% серым (выноска с верха столбика)
    {
      const [ax, ay] = project(cam, BX(9), BEN[8] * BH + .05, BZ);
      const t0 = T.men - .1, q = 1 - P(t, o2, .3, eIn);
      const pd = P(t, t0, .25), pl = P(t, t0 + .1, .45);
      const by = ay - 170;
      if (pd > 0) {
        g.save(); g.globalAlpha = pd * q; g.fillStyle = sub; g.beginPath(); g.arc(ax, ay - 6, 5, 0, 7); g.fill(); g.restore();
        line(ax, ay - 6, ax, lerp(ay - 6, by + 14, pl), sub, .8 * q, 2);
      }
      atext(pct(BEN[8]), ax, by, t0 + .25, t, { size: 52, w: 600, col: sub, track: -.02, dy: 18, out: o2, align: 'center' });
    }
    // k3: заголовок
    atextWords('Закон Бенфорда', 540, 560, T.zakon - .05, t, { size: 108, w: 600, col: ink, track: -.03, stagger: .2 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    add(.4, 'whoosh', .3, .7);
    add(T.nas, 'tick', .14);
    add(T.dl, 'tick', .14, 1.05);
    add(T.cen, 'tick', .14, 1.1);
    add(T.cen + .1, 'shimmer', .2);
    add(T.tr - 1.5, 'riser', .25);
    add(T.tr + .05, 'impact', .4, .9);
    for (let i = 0; i < 9; i += 2) add(T.tr + .4 + i * .075, 'click', .12, 1 + i * .04);
    add(T.men, 'chime', .2, 1.1);
    add(T.zakon, 'bloom', .32, .8);
  },
});
