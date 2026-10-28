// OUTRO (42.0 – 50.0 с), чёрный фон, чёрное зеркало. Кольцо из 23 керамических фигурок и тонкая «звезда»
// из 253 линий-пар между головами (тот же образ, что в pairs и на обложке), медленная орбита.
// o1 — итог крупно: «Интуиция плохо считает пары» (на «пары» звезда вспыхивает);
// o2 — финальная карточка: «Парадокс дней рождения», «23 человека → 50,7%» серым, красная пилюля «Подписаться на L³».
import { defineScene, atext, atextWords, P, Wd, THREE, MAT, makeStage, clamp, lerp, eApple, eInOut, eSpring } from '../../../engine.mjs';
import { N, PAIR, bump, frame, mirrorFloor, makeCrowd, ringPos, pill, FIG_H } from './kit.mjs';

const R = 2.5, HEAD = FIG_H * .82 * .88;
function TT() {
  return { int: Wd('o1', 'Интуиция'), plo: Wd('o1', 'плохо'), sch: Wd('o1', 'считает'), pary: Wd('o1', 'пары'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    mirrorFloor(stage);
    const crowd = makeCrowd(N, MAT.ceramicWhite());
    const pts = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const [x1, z1] = ringPos(i, R), [x2, z2] = ringPos(j, R);
      pts.push(x1, HEAD, z1, x2, HEAD, z2);
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false }));
    lines.renderOrder = 3;
    stage.root.add(crowd.grp, lines);
    return { stage, crowd, lines, T: TT() };
  },

  update(t, s, st) {
    const { stage, crowd, lines, T } = st, L = stage.lights;
    for (let i = 0; i < N; i++) {
      const [x, z] = ringPos(i, R);
      const k = eSpring(clamp((t - s.start - .1 - Math.min(i, N - i) * .035) / .8));
      const lit = P(t, s.start + Math.min(i, N - i) * .035, .9, eApple);
      const pair = i === PAIR[0] || i === PAIR[1];
      crowd.set(i, x, 0, z, Math.max(1e-3, .82 * lerp(.6, 1, k)), lit * (pair ? 1 : .62), Math.atan2(-x, -z) + Math.PI);
    }
    crowd.commit();
    lines.material.opacity = .24 * P(t, s.start + .6, 1.4, eApple) + .4 * bump(t, T.pary + .3, .7);
    const lit = P(t, s.start, 1.2, eApple);
    L.key.position.set(3, 9, 6); L.key.intensity = 2.4 * lit; L.hemi.intensity = .45 * lit;
    L.rimL.position.set(-6, 3, -5); L.rimL.intensity = 3.2 * lit; L.rimR.intensity = 2.4 * lit;
    const card = P(t, T.card - .3, 1.2, eInOut);
    frame(stage.camera, [0, .4, 0], lerp(30, 34, card), 10 + (t - s.start) * 3, lerp(30, 30, card), 540, lerp(900, 850, card));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, ink = '#FFFFFF', sub = stage.sub;
    const out1 = T.card - .35;
    atextWords('Интуиция плохо', 540, 380, T.int, t, { size: 104, w: 600, col: ink, track: -.03, stagger: T.plo - T.int, out: out1 });
    atextWords('считает пары', 540, 495, T.sch, t, { size: 104, w: 600, col: ink, track: -.03, stagger: T.pary - T.sch, out: out1 });
    if (t > T.card - .1) {
      atext('Парадокс', 540, 350, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035 });
      atextWords('дней рождения', 540, 474, T.card + .15, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('23 человека → 50,7%', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.pary + .2, 'shimmer', .26, .8);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
