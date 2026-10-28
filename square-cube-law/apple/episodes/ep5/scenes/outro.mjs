// OUTRO (38.9 – 47.0 с), чёрный фон.
// o1 — светящаяся лампа-сфера и две стеклянные оболочки r и 2r с меридианами (тот же образ, что в sphere и на обложке),
//      медленная орбита; итог крупно: «Расстояние работает в квадрате»;
// o2 — финальная карточка: «Закон обратных квадратов», «I ∝ 1/r²» серым, красная пилюля «Подписаться на L³» (как в пилоте).
import { defineScene, makeStage, orbit, project, atext, atextWords, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { ctx, makeLamp, glow, screenR, pill, bump } from './kit.mjs';

const R1 = .42, R2 = .84;
function TT() {
  return { ras: Wd('o1', 'Расстояние'), rab: Wd('o1', 'работает'), kv: Wd('o1', 'квадрате'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}
function wire(R, col = '#FFFFFF', op = .3) {
  const pts = [], N = 64;
  for (let m = 0; m < 10; m++) {
    const ph = m / 10 * Math.PI;
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2;
      pts.push(Math.sin(a) * Math.cos(ph), Math.cos(a), Math.sin(a) * Math.sin(ph), Math.sin(b) * Math.cos(ph), Math.cos(b), Math.sin(b) * Math.sin(ph));
    }
  }
  for (const lat of [-45, 0, 45]) {
    const y = Math.sin(lat * Math.PI / 180), r = Math.cos(lat * Math.PI / 180);
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2; pts.push(r * Math.cos(a), y, r * Math.sin(a), r * Math.cos(b), y, r * Math.sin(b)); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false }));
  l.scale.setScalar(R); return l;
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const lamp = makeLamp(.12, 2, 2);
    const shells = [R1, R2].map(R => {
      const m = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, transparent: true, opacity: .07, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), m);
      const w = wire(R);
      const g = new THREE.Group(); g.add(mesh, w); g.position.y = 1.0;
      return { g, m, w };
    });
    lamp.grp.position.y = 1.0;
    stage.root.add(lamp.grp, ...shells.map(s => s.g));
    return { stage, lamp, shells, T: TT() };
  },

  update(t, s, st) {
    const { stage, lamp, shells, T } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, s.start, 1.2, eApple);
    L.key.intensity = .6 * lit; L.key.castShadow = false; L.hemi.intensity = .1 * lit; L.rimL.intensity = 2 * lit; L.rimR.intensity = 1.5 * lit;
    lamp.pl.intensity = 2 * lit; lamp.grp.scale.setScalar(lerp(.5, 1, lit));
    shells.forEach((sh, i) => {
      const k = P(t, s.start + .2 + i * .35, 1.1, eApple);
      const pulse = i === 1 ? bump(t, T.kv + .25, .5) : 0;
      sh.g.scale.setScalar(Math.max(1e-3, lerp(.6, 1, k) * (1 + .04 * pulse)));
      sh.g.rotation.set(.35, (t - s.start) * .12 * (i ? 1 : -1.3), .1);
      sh.m.opacity = .07 * k; sh.w.material.opacity = (.22 + .25 * pulse) * k;
    });
    const card = P(t, T.card - .3, 1.2, eInOut);
    orbit(cam, [0, lerp(.78, .74, card), 0], lerp(15, 17, card), 20 + (t - s.start) * 2, lerp(10, 8, card));
  },

  draw2d(t, s, st) {
    const { stage, lamp, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const p = lamp.grp.position.toArray(), [lx, ly] = project(cam, ...p);
    glow(lx, ly, clamp(screenR(cam, p, .12) * 8, 90, 200), .5 * P(t, s.start, 1.2));
    // o1: итоговая мысль
    const out1 = T.card - .35;
    atext('Расстояние', 540, 380, T.ras, t, { size: 96, w: 600, col: ink, track: -.03, out: out1 });
    atextWords('работает в квадрате', 540, 490, T.rab, t, { size: 96, w: 600, col: ink, track: -.03, stagger: .22, out: out1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Закон обратных', 540, 350, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('квадратов', 540, 474, T.card + .2, t, { size: 112, w: 600, col: ink, track: -.035 });
      atext('I ∝ 1/r²', 540, 580, T.card + .6, t, { size: 58, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.kv, 'shimmer', .26, .8);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
