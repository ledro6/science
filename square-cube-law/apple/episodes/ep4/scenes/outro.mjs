// OUTRO (46.8 – 55.8 с), чёрный фон.
// o1 — вся система: 8 планет на кольцах с настоящими отношениями периодов (Меркурий 0,8 с … Нептун ~9 мин);
//      «Вся небесная механика» → на «в одну строчку» камера опускается в плоскость орбит, и все кольца
//      складываются в одну светлую строку.
// o2 — финальная карточка: «Третий закон Кеплера», «T² ∝ a³» серым (³ красная), красная пилюля «Подписаться на L³».
import { defineScene, makeStage, orbit, project, atext, atextWords, P, Wd, THREE, MAT, clamp, lerp, eApple, eIn, eInOut, eStd, FONT } from '../../../engine.mjs';
import { ctx, TAU, onRing, makeNeptune, makeBall, makeSun, ring, glow, screenR } from './kit.mjs';

// [радиус кольца (условно), период в годах, радиус шара]
const PL = [[.42, .241, .035], [.58, .615, .05], [.76, 1, .055], [.97, 1.88, .045], [1.5, 11.86, .12], [1.98, 29.46, .1], [2.42, 84.0, .075], [2.85, 164.8, .1]];
const K = .8 / .241;                                    // секунд ролика на год (Меркурий — 0,8 с)
const ang = (i, t) => i * 1.7 + TAU * (t - 46) / (PL[i][1] * K);

function TT() {
  return { vsya: Wd('o1', 'Вся'), odnu: Wd('o1', 'одну'), str: Wd('o1', 'строчку'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    stage.camera.far = 300; stage.camera.updateProjectionMatrix();
    const sun = makeSun(.2, 3.2);
    const balls = PL.map(([r, , pr], i) => i === 7 ? makeNeptune(pr) : makeBall(pr, i === 4 || i === 5 ? MAT.aluminium() : MAT.ceramicWhite()));
    stage.root.add(sun.grp, ...balls);
    return { stage, sun, balls, T: TT() };
  },

  update(t, s, st) {
    const { stage, sun, balls, T } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, s.start, 1.2);
    sun.pl.intensity = 3.2 * lit; L.key.intensity = .3 * lit; L.hemi.intensity = .08 * lit; L.rimL.intensity = 1.2 * lit; L.rimR.intensity = .8 * lit; L.key.castShadow = false;
    balls.forEach((b, i) => { b.position.set(...onRing(PL[i][0], ang(i, t))); b.scale.setScalar(Math.max(1e-3, P(t, s.start + .1 + i * .06, .9))); });
    balls[7].rotation.set(0, t * .4, .5);
    // камера: наклонный обзор → в плоскость орбит на «одну строчку»
    const flat = P(t, T.odnu - .25, 1.15, eInOut);
    orbit(cam, [0, lerp(.55, -.05, flat), 0], lerp(30, 29.5, flat), lerp(-18, 10, clamp((t - s.start) / 4)) + (t - s.start) * 1.2, lerp(38, 1.2, flat));
  },

  draw2d(t, s, st) {
    const { stage, T, balls } = st, cam = stage.camera, g = ctx();
    const ink = '#FFFFFF', sub = stage.sub;
    const occ = [{ p: [0, 0, 0], r: .2 }, ...balls.map((b, i) => ({ p: b.position.toArray(), r: PL[i][2] }))];
    const [sx, sy] = project(cam, 0, 0, 0);
    glow(sx, sy, 170, .6 * P(t, s.start, 1.1));
    const flat = P(t, T.odnu - .25, 1.15, eInOut);
    const lineK = P(t, T.str + .2, .6) * (1 - .4 * P(t, T.card + .4, 1));
    PL.forEach(([r], i) => ring(cam, r, { a: (.2 + .1 * (i === 7)) * P(t, s.start + .15 + i * .06, 1) + .35 * flat * lineK, lw: 1.6, occ }));
    // o1
    atextWords('Вся небесная механика', 540, 390, T.vsya, t, { size: 84, w: 600, col: ink, track: -.03, stagger: .12, out: T.card - .35 });
    atextWords('в одну строчку', 540, 495, T.odnu - .05, t, { size: 84, w: 600, col: ink, track: -.03, stagger: .1, out: T.card - .35 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Третий закон', 540, 350, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atextWords('Кеплера', 540, 474, T.card + .2, t, { size: 112, w: 600, col: ink, track: -.035 });
      atext('T² ∝ a³', 540, 580, T.card + .6, t, { size: 58, w: 500, col: sub, track: -.01 });
      // пилюля «Подписаться на L³» — как в пилоте
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
    add(s.start + .2, 'swell', .3, .6);
    add(T.str, 'shimmer', .28, .8);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
