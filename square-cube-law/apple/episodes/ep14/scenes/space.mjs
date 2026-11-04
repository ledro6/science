// SPACE (29.4 – 44.1 с), светлый фон. Галактики-спирали из точек (графит) медленно вращаются вокруг «нас».
// s1 — «Со светом то же самое»: полоса спектра (монохром) с тёмными линиями; на «сдвинут» линии уезжают вправо,
//      к краю «красный», стрелка сдвига; на «красного» — «красное смещение» (единственный красный акцент сцены).
// s2 — «Хаббл, 1929»; на «чем дальше» от каждой галактики стрелка скорости, длина ∝ расстоянию; «дальше → быстрее»;
//      на «Вселенная расширяется» всё поле разлетается.
import { defineScene, makeStage, project, atext, line, dot, P, Wd, THREE, clamp, lerp, rng, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeGalaxy, frame, keys, arrow, wordsAt, ctx } from './kit.mjs';

function TT() {
  return {
    so: Wd('s1', 'Со'), svetom: Wd('s1', 'светом'), samoe: Wd('s1', 'самое'), svet: Wd('s1', 'Свет'), dal: Wd('s1', 'далёких'),
    gal: Wd('s1', 'галактик'), sdv: Wd('s1', 'сдвинут'), kras: Wd('s1', 'красного'),
    edv: Wd('s2', 'Эдвин'), hab: Wd('s2', 'Хаббл'), tys: Wd('s2', 'тысяча'), god: Wd('s2', 'году'), chem: Wd('s2', 'чем'),
    dal2: Wd('s2', 'дальше'), gal2: Wd('s2', 'галактика'), tem: Wd('s2', 'тем'), bys: Wd('s2', 'быстрее'), udal: Wd('s2', 'удаляется'),
    vsel: Wd('s2', 'Вселенная'), rassh: Wd('s2', 'расширяется'),
  };
}
// галактики: [x, y, z, R, наклон X, наклон Z]
const GAL = [
  [-1.75, 1.05, -1.2, .62, .9, .2], [1.55, 1.25, -2.4, .7, 1.2, -.4], [-.95, -1.15, .9, .48, .5, .5], [1.95, -.55, .4, .55, 1.4, .1],
  [2.6, -.4, -4.2, .7, .7, -.2], [-2.3, -.2, -2.8, .58, 1.1, .6], [.85, -1.45, -1.6, .5, .4, -.6], [-.35, 1.55, 1.3, .42, 1.3, .3],
];
const BAR = { x0: 150, x1: 930, y: 520, h: 46 };
const LINES = [.14, .27, .33, .52, .61, .7];      // доли ширины: «линии спектра»
const SHIFT = .12;

// масштаб расширения: медленный дрейф с «чем», сильнее на «Вселенная расширяется»
const scaleAt = (t, T) => 1 + .05 * Math.max(0, t - T.chem) + .32 * P(t, T.vsel - .2, 2.4, eInOut);

defineScene('space', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    stage.floor.visible = false;
    const T = TT();
    const r = rng(1429);
    const gals = GAL.map(([x, y, z, R, tx, tz], i) => {
      const grp = new THREE.Group();
      const p = makeGalaxy(R, r, { n: Math.round(1600 + 1800 * R), size: .05, arms: i % 3 === 2 ? 3 : 2 });
      grp.add(p); grp.rotation.set(tx, 0, tz);
      grp.userData = { base: new THREE.Vector3(x, y, z), spin: (i % 2 ? 1 : -1) * (.08 + .02 * i), p };
      stage.root.add(grp);
      return grp;
    });
    // «мы» — маленькое плотное ядро в центре
    const us = makeGalaxy(.28, rng(7), { n: 500, size: .05 });
    us.rotation.set(1.1, 0, .2);
    stage.root.add(us);
    return { stage, T, gals, us };
  },

  update(t, s, st) {
    const { stage, T, gals, us } = st, cam = stage.camera;
    const k = scaleAt(t, T), u = t - s.start;
    const ap = P(t, s.start + .1, 1.4);
    gals.forEach((g, i) => {
      g.position.copy(g.userData.base).multiplyScalar(k);
      g.userData.p.rotation.y = u * g.userData.spin + i;
      g.userData.p.material.opacity = ap * P(t, s.start + .1 + i * .08, 1.2);
    });
    us.rotation.y = -u * .1; us.material.opacity = ap;
    const [d, az, el, sy] = keys([[s.start, 31, -10, 16, 990], [T.svet, 29, -4, 18, 990], [T.edv, 29, 2, 20, 1000], [T.vsel, 30, 6, 22, 1000], [s.end, 33, 9, 22, 1000]], t, eInOut);
    frame(cam, [0, 0, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, gals } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const g = ctx();
    // мы
    const [ux, uy] = project(cam, 0, 0, 0);
    atext('мы', ux, uy + 52, s.start + .9, t, { size: 34, w: 500, col: sub, track: 0, dy: 10, out: T.edv - .3 });
    // ---------- s1: спектр ----------
    const oS = T.edv - .35;
    const aB = P(t, T.svetom - .1, .7) * (1 - P(t, oS, .35, eIn));
    if (aB > .003) {
      const { x0, x1, y, h } = BAR, wipe = P(t, T.svetom - .1, 1.0, eApple);
      const xe = lerp(x0, x1, wipe);
      g.save(); g.globalAlpha = aB;
      g.beginPath(); g.roundRect(x0, y - h / 2, xe - x0, h, 10); g.clip();
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, '#E6E6EA'); gr.addColorStop(.5, '#D9D9DE'); gr.addColorStop(1, '#C7C7CC');
      g.fillStyle = gr; g.fillRect(x0, y - h / 2, x1 - x0, h);
      const sh = SHIFT * P(t, T.sdv - .05, 1.1, eInOut);
      // где линии были — бледные следы
      if (sh > .002) for (const f of LINES) line(lerp(x0, x1, f), y - h / 2, lerp(x0, x1, f), y + h / 2, ink, .18, 2);
      for (const f of LINES) line(lerp(x0, x1, f + sh), y - h / 2, lerp(x0, x1, f + sh), y + h / 2, ink, .9, 3);
      g.restore();
      g.save(); g.globalAlpha = aB * .5; g.strokeStyle = ink; g.lineWidth = 1.5;
      g.beginPath(); g.roundRect(x0, y - h / 2, xe - x0, h, 10); g.stroke(); g.restore();
      atext('спектр света', x0, y - h / 2 - 26, T.svetom + .1, t, { size: 38, w: 500, col: sub, align: 'left', track: -.005, dy: 12, out: T.kras - .25 });
      atext('синий', x0, y + h / 2 + 46, T.svetom + .35, t, { size: 34, w: 500, col: sub, align: 'left', track: 0, dy: 12, out: oS });
      atext('красный', x1, y + h / 2 + 46, T.svetom + .45, t, { size: 34, w: 500, col: sub, align: 'right', track: 0, dy: 12, out: oS });
      // стрелка сдвига
      const aA = P(t, T.sdv + .1, .6) * aB;
      if (aA > .003) {
        const ax0 = lerp(x0, x1, .43), ax1 = lerp(x0, x1, .43 + SHIFT * P(t, T.sdv + .1, 1.0, eInOut) + .02);
        arrow(ax0, y + h / 2 + 36, ax1, y + h / 2 + 36, ink, aA, 3, 14);
      }
    }
    atext('красное смещение', 540, 380, T.kras - .05, t, { size: 76, w: 600, col: stage.accent, track: -.025, out: oS });
    // ---------- s2: Хаббл ----------
    const oH = T.vsel - .35;
    wordsAt(['Хаббл,', '1929'], [T.hab - .05, T.tys - .05], 540, 420, t, { size: 112, w: 600, col: ink, track: -.03, out: oH });
    atext('дальше → быстрее', 540, 510, T.bys - .05, t, { size: 52, w: 500, col: sub, track: -.01, out: oH });
    atext('Вселенная', 540, 410, T.vsel - .05, t, { size: 112, w: 600, col: ink, track: -.03 });
    atext('расширяется', 540, 530, T.rassh - .05, t, { size: 112, w: 600, col: ink, track: -.03 });
    // стрелки скоростей: от галактики прочь от нас, длина ∝ расстоянию
    const aV = P(t, T.chem - .05, .6) * (1 - P(t, s.end - .5, .4, eIn));
    if (aV > .003) {
      const grow = lerp(.55, 1, P(t, T.bys - .1, .8));
      gals.forEach((gg, i) => {
        const p = gg.position, [gx, gy] = project(cam, p.x, p.y, p.z);
        const dx = gx - ux, dy = gy - uy, L = Math.hypot(dx, dy) || 1;
        const dist = p.length();
        const len = 30 * dist * grow * P(t, T.chem - .05 + i * .05, .6);
        const r0 = 18 + 34 * GAL[i][3];
        arrow(gx + dx / L * r0, gy + dy / L * r0, gx + dx / L * (r0 + len), gy + dy / L * (r0 + len), ink, aV * .85, 3, 13);
      });
    }
    // мягкий низ кадра
    const gr2 = g.createLinearGradient(0, 1260, 0, 1420);
    gr2.addColorStop(0, 'rgba(245,245,247,0)'); gr2.addColorStop(1, 'rgba(245,245,247,1)');
    g.fillStyle = gr2; g.fillRect(0, 1260, 1080, 700);
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'shimmer', .2, .8);
    add(T.svetom, 'swell', .2, .9);
    add(T.sdv, 'whoosh', .2, .7);
    add(T.kras - 1.5, 'riser', .2);
    add(T.kras, 'impact', .32, .85);
    add(T.hab - .05, 'bloom', .24, .9);
    add(T.tys, 'chime', .2, 1.0);
    add(T.chem, 'tick', .16, 1.0);
    add(T.bys, 'chime', .2, 1.1);
    add(T.vsel - .1, 'swell', .3, .7);
    add(T.rassh, 'shimmer', .22, .9);
  },
});
