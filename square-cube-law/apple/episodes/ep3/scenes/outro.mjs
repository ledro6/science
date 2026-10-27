// OUTRO (56.2 – 66.9 с), чёрный фон.
// o1: справа бесконечный столб листов (InstancedMesh, лёгкий разброс), камера медленно поднимается вдоль него;
//     слева крупно: «Невозможно почувствовать» → «Можно только посчитать» и серая строка расчёта.
// o2: столб складывается в маленькую аккуратную пачку, финальная карточка: «Экспонента», «0,1 мм × 2⁴²» серым,
//     красная пилюля «Подписаться на L³» с мягким нажатием на «природы» (как в пилоте).
import {
  defineScene, makeStage, atext, atextWords, P, Wd, THREE, clamp, lerp, rng,
  eApple, eIn, eInOut, eStd, g, FONT, C_GRAY,
} from '../../../engine.mjs';
import { frame } from './_lib.mjs';

const N = 230, PITCH = .095, SW = 2.1, SD = 2.97, KEEP = 15;
function TT() {
  return {
    nev: Wd('o1', 'невозможно'), poch: Wd('o1', 'почувствовать'), eyo: Wd('o1', 'Её'), mozh: Wd('o1', 'можно'),
    pos: Wd('o1', 'посчитать'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const geo = new THREE.BoxGeometry(SW, PITCH * .82, SD);
    const mat = new THREE.MeshStandardMaterial({ color: '#F4F4F1', roughness: .6 });
    const im = new THREE.InstancedMesh(geo, mat, N); im.frustumCulled = false;
    const R = rng(42), jit = [];
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) { jit.push([(R() - .5) * .07, (R() - .5) * .07, (R() - .5) * .05]); c.setScalar(.86 + R() * .14); im.setColorAt(i, c); }
    stage.root.add(im);
    const glint = new THREE.PointLight('#ffffff', 0, 0, 2); stage.scene.add(glint);
    return { stage, T: TT(), im, mat, jit, glint, base: mat.color.clone() };
  },

  update(t, s, st) {
    const { stage, T, im, mat, jit, glint, base } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start + .05, 1.1), lk = P(t, s.start + .4, 1.4);
    L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.6 * lk; L.hemi.intensity = .5 * lk;
    L.key.position.set(4, 9, 7);
    // сборка в пачку: листы выше KEEP «уходят» сверху вниз
    const col = P(t, T.card - .55, 1.0, eInOut);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const [a, b, r] = jit[i];
      let k = 1;
      if (i >= KEEP) k = 1 - clamp((col * 1.25 - (1 - i / N) * .25) / 1);
      k = clamp(k);
      const tw = .0025 * i * (1 - col);                             // лёгкая закрутка столба
      e.set(0, r + tw, 0); q.setFromEuler(e);
      p.set(a * (1 - col * .6), i * PITCH + PITCH * .41, b * (1 - col * .6)); sc.set(1, 1, 1).multiplyScalar(Math.max(k, 1e-4));
      M.compose(p, q, sc); im.setMatrixAt(i, M);
    }
    im.instanceMatrix.needsUpdate = true;
    mat.color.copy(base);
    // камера: o1 — подъём вдоль столба справа; o2 — пачка по центру, медленный поворот
    const rise = clamp((t - s.start) / (T.card - s.start));
    const ca = { tg: [0, lerp(6, 10, eInOut(rise)), 0], d: 36, az: lerp(36, 18, rise), el: lerp(6, 14, rise), sx: 865, sy: 960 };
    const cb = { tg: [0, KEEP * PITCH * .5, 0], d: 19, az: 30 + (t - T.card) * 9, el: 24, sx: 540, sy: 820 };
    const k2 = P(t, T.card - .5, 1.2, eInOut);
    frame(cam, ca.tg.map((x, i) => lerp(x, cb.tg[i], k2)), lerp(ca.d, cb.d, k2), lerp(ca.az, cb.az, k2), lerp(ca.el, cb.el, k2), lerp(ca.sx, cb.sx, k2), lerp(ca.sy, cb.sy, k2));
    // бегущий блик по пачке на карточке
    const gp = ((t - (T.card + .5)) / 2.2) % 1;
    glint.intensity = t > T.card + .5 ? 10 * Math.sin(Math.PI * clamp(gp)) : 0;
    glint.position.set(lerp(-3, 3, eInOut(clamp(gp))), 2.2, 2.4);
  },

  draw2d(t, s, st) {
    const { T } = st, ink = '#FFFFFF', sub = C_GRAY;
    const o1 = T.eyo - .3, o2 = T.card - .45;
    atext('Невозможно', 96, 430, T.nev, t, { size: 88, w: 600, col: ink, align: 'left', track: -.03, out: o1 });
    atext('почувствовать', 96, 540, T.poch, t, { size: 88, w: 600, col: ink, align: 'left', track: -.03, out: o1 });
    atext('Можно только', 96, 430, T.mozh, t, { size: 88, w: 600, col: ink, align: 'left', track: -.03, out: o2 });
    atext('посчитать', 96, 540, T.pos, t, { size: 88, w: 600, col: ink, align: 'left', track: -.03, out: o2 });
    atext('0,1 мм × 2⁴² = 440 000 км', 100, 620, T.pos + .45, t, { size: 40, w: 500, col: sub, align: 'left', track: 0, out: o2 });
    // --- финальная карточка ---
    if (t > T.card - .1) {
      atextWords('Экспонента', 540, 380, T.card + .05, t, { size: 124, w: 600, col: ink, track: -.035 });
      atext('0,1 мм × 2⁴²', 540, 480, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      // пилюля «Подписаться на L³» (поведение как в пилоте)
      const t0 = T.card + .65, p = P(t, t0, .8, eApple);
      if (p > .003) {
        const dn = P(t, T.press, .14, eStd), up = P(t, T.press + .14, .6, eApple);
        const k = (1 - .055 * dn + .055 * up) * lerp(1.04, 1, p);
        const W2 = 300, H2 = 56, cx = 540, cy = 1205 + (1 - p) * 34;
        const bl = (1 - P(t, t0, .55, eApple)) * 12;
        g.save(); g.globalAlpha = p; if (bl > .3) g.filter = `blur(${bl.toFixed(1)}px)`;
        g.translate(cx, cy); g.scale(k, k);
        const dk = lerp(1, .82, dn * (1 - up));
        g.fillStyle = `rgb(${Math.round(255 * dk)},${Math.round(69 * dk)},${Math.round(58 * dk)})`;
        g.beginPath(); g.roundRect(-W2, -H2, W2 * 2, H2 * 2, H2); g.fill();
        g.font = `600 44px ${FONT}`; g.letterSpacing = '-0.4px'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#FFFFFF'; g.fillText('Подписаться на L³', 0, 2);
        g.restore();
        const rp = P(t, T.press + .05, .9, eApple);
        if (rp > 0 && rp < 1) {
          const gr = 4 + 30 * rp;
          g.save(); g.globalAlpha = .5 * (1 - rp); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2;
          g.beginPath(); g.roundRect(cx - W2 - gr, 1205 - H2 - gr, (W2 + gr) * 2, (H2 + gr) * 2, H2 + gr); g.stroke(); g.restore();
        }
      }
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .1, 'swell', .3, .6);
    add(T.nev, 'bloom', .2, .8);
    add(T.pos, 'chime', .22, .9);
    add(T.card - .5, 'whoosh', .3, .6);
    add(T.card + .3, 'click', .25);
    add(T.card + .7, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
