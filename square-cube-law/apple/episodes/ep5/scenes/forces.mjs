// FORCES (31.5 – 38.9 с), белый фон.
// f1 — три «иконки» в 3D одной строкой: гравитация (графитовый и алюминиевый шары тянутся друг к другу),
//      звук (керамический динамик-конус, дуги волн расходятся и бледнеют), излучение (точечный источник со стрелками);
//      над рядом — «Всё слабеет как 1/r²»;
// f2 — источник излучения на полу, от него бегут кольца интенсивности (прозрачность ∝ 1/r²);
//      человечек-капсула на расстоянии r делает шаг назад до 2r → красная «×¼» «дозы».
import {
  defineScene, makeStage, orbit, project, atext, atextWords, line, P, Wd, E, THREE, MAT, clamp, lerp,
  eApple, eInOut, eIn, eSpring, shadowsOn,
} from '../../../engine.mjs';
import { ctx, dim, bump } from './kit.mjs';
import { rod } from '../../../models.mjs';

const INK = '#1D1D1F';
const XS = [-1.78, .12, 2.02];                  // позиции иконок в ряду
const SX = -1.7, D1 = 1.15;                   // f2: источник и единичное расстояние
const NR = 7;                                 // кольца интенсивности

function TT() {
  return {
    po: Wd('f1', 'По'), zak: Wd('f1', 'закону'), sl: Wd('f1', 'слабеют'), gr: Wd('f1', 'гравитация'), zv: Wd('f1', 'звук'), izl: Wd('f1', 'излучение'),
    odin: Wd('f2', 'Один'), shag: Wd('f2', 'шаг'), naz: Wd('f2', 'назад'), ist: Wd('f2', 'источника'), uzhe: Wd('f2', 'уже'), zash: Wd('f2', 'защита'),
    cut: (E('f1') + Wd('f2', 'Один')) / 2,
  };
}
function arrow(mat, len = .34) {
  const g = new THREE.Group();
  const r = rod(mat, .018); r.set([0, 0, 0], [len - .08, 0, 0]);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.045, .1, 20), mat); tip.rotation.z = -Math.PI / 2; tip.position.x = len - .05;
  g.add(r, tip); return g;
}

defineScene('forces', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .45 });
    const T = TT();
    const gm = MAT.graphite(), al = MAT.aluminium(), cw = MAT.ceramicWhite();
    // --- гравитация ---
    const grav = new THREE.Group();
    const bigB = new THREE.Mesh(new THREE.SphereGeometry(.36, 48, 32), gm);
    const smB = new THREE.Mesh(new THREE.SphereGeometry(.2, 40, 28), al);
    const a1 = arrow(gm, .2), a2 = arrow(gm, .2);
    grav.add(bigB, smB, a1, a2);
    // --- звук: динамик ---
    const snd = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.36, .34, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .45, clearcoat: .35, side: THREE.DoubleSide }));
    cone.rotation.z = Math.PI / 2;           // раструб смотрит вправо (+X)
    const mag = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .16, 36), gm); mag.rotation.z = Math.PI / 2; mag.position.x = -.22;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.36, .025, 12, 64), gm); rim.rotation.y = Math.PI / 2; rim.position.x = .17;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 16, 0, Math.PI), gm); cap.rotation.y = Math.PI / 2; cap.position.x = 0;
    const arcs = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(1, .022, 8, 48, Math.PI * .55), new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 1, depthWrite: false }));
      m.rotation.z = -Math.PI * .275; return m;
    });
    const cg = new THREE.Group(); cg.add(cone, mag, rim, cap); snd.add(cg, ...arcs);
    // --- излучение: точечный источник со стрелками ---
    const rad = new THREE.Group();
    const src = new THREE.Mesh(new THREE.SphereGeometry(.11, 32, 24), MAT.ceramicBlack());
    const rays = [];
    for (let i = 0; i < 8; i++) { const a = arrow(gm, .3); a.rotation.z = i / 8 * Math.PI * 2; const p = new THREE.Group(); p.add(a); rays.push({ p, a, ang: i / 8 * Math.PI * 2 }); rad.add(p); }
    rad.add(src);
    const icons = [grav, snd, rad];
    // --- f2: источник на полу, кольца, человечек ---
    const f2 = new THREE.Group();
    const src2 = shadowsOn(new THREE.Mesh(new THREE.SphereGeometry(.13, 32, 24), MAT.ceramicBlack())); src2.position.set(SX, .13, 0);
    const ringMats = [], rings = [];
    for (let i = 0; i < NR; i++) {
      const m = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: .5, depthWrite: false });
      const r = new THREE.Mesh(new THREE.TorusGeometry(1, .012, 6, 96), m); r.rotation.x = -Math.PI / 2; r.position.set(SX, .004, 0);
      ringMats.push(m); rings.push(r); f2.add(r);
    }
    const man = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.15, .42, 8, 24), cw); body.position.y = .38;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.12, 32, 24), cw); head.position.y = .84;
    man.add(body, head); shadowsOn(man);
    f2.add(src2, man);
    stage.root.add(...icons, f2);
    shadowsOn(grav); shadowsOn(cg); shadowsOn(rad);
    return { stage, T, icons, grav, bigB, smB, a1, a2, snd, cg, arcs, rad, src, rays, f2, rings, ringMats, man, body, head };
  },

  update(t, s, st) {
    const { stage, T, icons, bigB, smB, a1, a2, cg, arcs, rays, f2, rings, ringMats, man } = st, cam = stage.camera;
    const ph2 = t >= T.cut;
    icons.forEach(g => g.visible = !ph2); f2.visible = ph2;
    if (!ph2) {
      // появление каждой иконки на своём слове, уход перед f2
      const tin = [T.gr - .1, T.zv - .1, T.izl - .1], out = P(t, T.cut - .45, .4, eIn);
      icons.forEach((g, i) => {
        const k = .95 * eSpring(clamp((t - tin[i]) / .8)) * (1 - out);
        g.visible = k > .003; g.scale.setScalar(Math.max(1e-3, k));
        g.position.set(XS[i], .55, 0);
        g.rotation.y = i === 1 ? -.35 + (t - s.start) * .04 : (t - s.start) * .05 * (i - 1);
      });
      // гравитация: шары слегка тянутся друг к другу
      const pull = .04 * Math.sin((t - T.gr) * 2.2);
      bigB.position.set(-.45 + pull, 0, 0); smB.position.set(.55 - pull, -.08, 0);
      // стрелки притяжения: от каждого шара к другому
      a1.position.set(-.06 + pull, 0, 0); a1.rotation.set(0, 0, 0);
      a2.position.set(.32 - pull, -.04, 0); a2.rotation.set(0, Math.PI, 0);
      // звук: дуги разлетаются от раструба и бледнеют как 1/r²
      cg.position.set(-.25, 0, 0);
      arcs.forEach((m, i) => {
        const u = ((t - T.zv) * .55 + i / 3) % 1, uu = u < 0 ? u + 1 : u;
        const r = lerp(.3, 1.0, uu);
        m.scale.setScalar(r); m.position.set(-.1, 0, 0);
        m.material.opacity = Math.min(1, (.3 / r) ** 2) * P(t, T.zv, .5) * (1 - out);
      });
      // излучение: стрелки «дышат» наружу
      rays.forEach(({ p, a, ang }) => {
        const u = .16 + .06 * Math.sin((t - T.izl) * 3);
        p.rotation.z = 0; a.position.set(Math.cos(ang) * u, Math.sin(ang) * u, 0); a.rotation.z = ang;
      });
      orbit(cam, [0, .5, 0], 23 - (t - s.start) * .15, -3 + (t - s.start) * .6, 9);
    } else {
      // f2: кольца бегут от источника, прозрачность ∝ 1/r²
      rings.forEach((r, i) => {
        const u = ((t - T.cut) * .28 + i / NR) % 1;
        const R = lerp(.25, 3.0, u);
        r.scale.setScalar(R);
        ringMats[i].opacity = .85 * Math.min(1, (.45 / R) ** 2 * 2.2) * clamp(u * 8) * P(t, T.cut, .5);
      });
      // человечек: r → 2r на «шаг назад», с лёгким покачиванием шага
      const w = P(t, T.shag - .1, 1.1, eInOut);
      const d = D1 * (1 + w);
      const bob = Math.sin(w * Math.PI) * .05;
      man.position.set(SX + d, bob * .4, 0);
      man.rotation.set(0, 0, -.06 * Math.sin(w * Math.PI));
      const k = eSpring(clamp((t - T.cut - .05) / .8));
      man.scale.setScalar(Math.max(1e-3, k));
      const pull = P(t, T.cut, 3.0, eApple);
      orbit(cam, [lerp(-.35, -.25, pull), -.1, 0], lerp(14.5, 15.2, pull), lerp(-6, 4, clamp((t - T.cut) / 3.4)), lerp(24, 21, pull));
    }
  },

  draw2d(t, s, st) {
    const { stage, T, icons, man } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    if (t < T.cut) {
      const out = T.cut - .45;
      atextWords('Всё слабеет как 1/r²', 540, 520, T.sl - .05, t, { size: 76, w: 600, col: ink, track: -.025, stagger: .09, out });
      const names = ['гравитация', 'звук', 'излучение'], tin = [T.gr, T.zv, T.izl];
      names.forEach((n, i) => {
        const [x, y] = project(cam, XS[i], 0, .5);
        atext(n, x, y + 70, tin[i] + .1, t, { size: 38, w: 500, col: sub, track: 0, out });
      });
    } else {
      // размерная линия r → 2r по полу перед человечком
      const zf = .7;
      const [ax, ay] = project(cam, SX, 0, zf), [bx, by] = project(cam, man.position.x, 0, zf);
      const a = P(t, T.cut + .2, .5);
      dim(ax, ay, bx, by, a, sub);
      const mx = (ax + bx) / 2, my = (ay + by) / 2 + 56, sw = T.naz;
      atext('r', mx, my, T.cut + .3, t, { size: 42, w: 500, col: ink, a, dy: 12, dur: .6, out: sw, outDur: .3 });
      atext('2r', mx, my, sw + .15, t, { size: 42, w: 500, col: ink, a, dy: 12, dur: .6 });
      atext('Шаг назад', 540, 300, T.shag - .05, t, { size: 76, w: 600, col: ink, track: -.025 });
      atext('×¼', 540, 545, T.zash - .05, t, { size: 280, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
      atext('дозы излучения', 540, 620, T.zash + .2, t, { size: 46, w: 500, col: sub, track: -.005 });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.sl, 'swell', .22, .8);
    add(T.gr - .1, 'thud', .3, .8);
    add(T.zv - .1, 'thud', .28, .95);
    add(T.izl - .1, 'thud', .28, 1.1);
    add(T.cut, 'whoosh', .3, .7);
    add(T.shag, 'click', .25, .9);
    add(T.zash - 1.5, 'riser', .2);
    add(T.zash, 'impact', .35, .9);
  },
});
