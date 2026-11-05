// OUTRO (38.0 – 46.6 с), чёрный фон.
// o1 — те же две звезды, что в хуке: «T» и раскалённая «T × 2» с потоком фотонов в 16 раз гуще;
//      крупно «Температура ×2 / свет ×16» (×16 красным).
// o2 — финальная карточка: «Закон Стефана-Больцмана» (по словам, белым), «P ∝ T⁴» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «природы»; звёзды отходят под карточку.
import { defineScene, makeStage, project, atext, atextWords, measure, P, Wd, clamp, lerp, eApple, eIn, eInOut, rng } from '../../../engine.mjs';
import { makeStar, frame, screenR, corona, glow, photons, segText, pill, ctx } from './kit.mjs';

function TT() {
  return {
    tem: Wd('o1', 'Температура'), vd: Wd('o1', 'вдвое'), sv: Wd('o1', 'свет'), sh: Wd('o1', 'шестнадцать'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы'),
  };
}
const R = .78, X = 1.3, N0 = 8;
const STARS = (() => { const r = rng(4416), a = []; for (let i = 0; i < 70; i++) a.push([r() * 1080, 240 + r() * 1060, .4 + r() * 1.2, r()]); return a; })();

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const A = makeStar({ seed: 1.3 }), B = makeStar({ seed: 7.9 });
    A.scale.setScalar(R); B.scale.setScalar(R);
    stage.root.add(A, B);
    return { stage, A, B, T: TT() };
  },

  update(t, s, st) {
    const { stage, A, B, T } = st, cam = stage.camera;
    A.position.set(-X, 0, 0); B.position.set(X, 0, -.02);
    A.rotation.y = t * .05; B.rotation.y = 1.1 + t * .05;
    const on = P(t, s.start, 1.0, eApple);
    A.set({ heat: .12, b: .8 * on, t }); B.set({ heat: 1, b: 1.06 * on, t: t + 3 });
    // o2: звёзды отходят и опускаются под карточку
    const o2 = P(t, T.card - .2, 1.3, eInOut);
    frame(cam, [0, 0, 0], lerp(19.5, 25, o2) - .12 * (t - s.start), -3 + (t - s.start) * .8, 3, 540, lerp(940, 900, o2));
  },

  draw2d(t, s, st) {
    const { stage, A, B, T } = st, cam = stage.camera, g = ctx();
    const ink = '#FFFFFF', sub = stage.sub, acc = stage.accent;
    const on = P(t, s.start, 1.0, eApple), o2 = P(t, T.card - .2, 1.3, eInOut);
    g.save(); g.fillStyle = '#FFFFFF';
    for (const [x, y, r, ph] of STARS) { g.globalAlpha = on * (.12 + .14 * ph) * (.8 + .2 * Math.sin(t * 1.3 + ph * 9)); g.beginPath(); g.arc(x - t * 3 * ph, y, r, 0, 6.29); g.fill(); }
    g.restore();
    const pa = A.position.toArray(), pb = B.position.toArray();
    const [ax, ay] = project(cam, ...pa), [bx, by] = project(cam, ...pb);
    const ra = screenR(cam, pa, R), rb = screenR(cam, pb, R);
    corona(ax, ay, ra, .25, .9 * on, .8);
    corona(bx, by, rb, 1, on, 0);
    glow(bx, by, rb * 3.2, .18 * on);
    const minY = lerp(640, 680, o2), clipY = lerp(ay + ra + 30, 1120, o2);
    photons(ax, ay, ra, N0 * on, t, { L: lerp(250, 190, o2), a: .8, minY, clipY });
    photons(bx, by, rb, 16 * N0 * on, t + .37, { L: lerp(250, 190, o2), a: .9, off: 101, minY, clipY });
    // подписи под звёздами (только в o1)
    const oA = T.card - .35;
    atext('T', ax, ay + ra + 92, s.start + .4, t, { size: 52, w: 600, col: ink, track: -.01, dy: 16, out: oA });
    atext('T × 2', bx, by + rb + 92, s.start + .5, t, { size: 52, w: 600, col: ink, track: -.01, dy: 16, out: oA });
    // o1: итоговая мысль
    segText([['Температура ', ink, T.tem - .05], ['×2', ink, T.vd - .05]], 540, 390, t, { size: 104, w: 600, track: -.03, out: oA });
    segText([['свет ', ink, T.sv - .05], ['×16', acc, T.sh - .05]], 540, 510, t, { size: 104, w: 600, track: -.03, out: oA });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Закон', 540, 360, T.card + .05, t, { size: 104, w: 600, col: ink, track: -.035 });
      const s2 = Math.min(104, 104 * 900 / measure('Стефана-Больцмана', 104, 600, -.035));
      atextWords('Стефана-Больцмана', 540, 360 + s2 * 1.12, T.card + .17, t, { size: s2, w: 600, col: ink, track: -.035 });
      atext('P ∝ T⁴', 540, 360 + s2 * 1.12 + 108, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vd, 'whoosh', .22, 1.0);
    add(T.sh - 1.5, 'riser', .2);
    add(T.sh - .05, 'impact', .32, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
