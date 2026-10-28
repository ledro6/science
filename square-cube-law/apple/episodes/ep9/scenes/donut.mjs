// DONUT (33.0 – 38.7 с), белый фон.
// «А вот бублик причесать можно»: алюминиевый тор с графитовыми волосками; на «причесать» по кольцу бежит волна —
// волоски ложатся вдоль кольца, и ни одного вихра (подпись); тор медленно вращается вокруг своей оси — мех «течёт».
// «Всё решает форма»: снизу справа выезжает маленький шар с волосками — у него макушка (красная точка).
// «у сферы нет дырки» — заголовок, пунктирное кольцо в дырке тора с выноской «дырка».
import { defineScene, makeStage, project, atext, line, dot, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, bump } from './_kit.mjs';
import { makeHairs, fluffDirs, combDir, mixDir, fibSphere, frameOf, dipole, norm3, scl3, smooth, rand, frame, TAU } from './_hair.mjs';

const TR = .74, Tr = .3, NT = 2600, SR = .42, NS = 900;
function TT() {
  return {
    a: Wd('d1', 'А'), bub: Wd('d1', 'бублик'), prich: Wd('d1', 'причесать'), mozh: Wd('d1', 'можно'),
    vse: Wd('d1', 'Всё'), resh: Wd('d1', 'решает'), forma: Wd('d1', 'форма'), sfer: Wd('d1', 'сферы'), net: Wd('d1', 'нет'), dyr: Wd('d1', 'дырки'),
  };
}

defineScene('donut', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    stage.floor.visible = false;
    const hairMat = new THREE.MeshStandardMaterial({ color: '#47474B', roughness: .5, metalness: .1 });
    // ---- тор ----
    const torG = new THREE.Group(), torSpin = new THREE.Group(); torG.add(torSpin);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(TR, Tr, 36, 96), MAT.aluminium());
    const th = makeHairs(THREE, { n: NT, mat: hairMat, r0: .0085, r1: .0028 });
    torSpin.add(torus, th);
    const Rn = rand(77), TH = [];
    while (TH.length < NT) {
      const u = Rn() * TAU, v = Rn() * TAU;
      if (Rn() > (TR + Tr * Math.cos(v)) / (TR + Tr)) continue;           // равномерно по площади
      const n = [Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v)];
      const p = [(TR + Tr * Math.cos(v)) * Math.cos(u), (TR + Tr * Math.cos(v)) * Math.sin(u), Tr * Math.sin(v)];
      TH.push({ u, n, p, tan: [-Math.sin(u), Math.cos(u), 0], l: .15 * (.8 + .4 * Rn()), j: (Rn() - .5) * .12 });
    }
    const tf = fluffDirs(TH.map(h => h.n), 8, .6); TH.forEach((h, i) => h.f = tf[i]);
    // ---- маленький шар с макушкой ----
    const sphG = new THREE.Group();
    const sph = new THREE.Mesh(new THREE.SphereGeometry(SR, 40, 30), MAT.ceramicWhite());
    const sh = makeHairs(THREE, { n: NS, mat: hairMat, r0: .0075, r1: .0025 });
    const pole = norm3([.35, .75, .55]), F = frameOf(pole, [1, 0, 0]), Rs = rand(5);
    fibSphere(NS, 41).forEach((p, i) => {
      const { v, d } = dipole(p, F, 1.15, .75);
      sh.setHair(i, scl3(p, SR * .99), combDir(p, v, 1.27 * smooth(.03, .5, d) + (Rs() - .5) * .12), .1 * (.85 + .3 * Rs()) * (1 + .3 * (1 - smooth(0, .4, d))), 1);
    });
    sh.instanceMatrix.needsUpdate = true;
    sphG.add(sph, sh);
    stage.root.add(torG, sphG);
    return { stage, torG, torSpin, th, TH, sphG, pole, T: TT() };
  },

  update(t, s, st) {
    const { stage, torG, torSpin, th, TH, sphG, T } = st, cam = stage.camera, L = stage.lights;
    L.key.castShadow = false;
    const inK = P(t, s.start + .05, 1.2, eApple);
    const side = P(t, T.vse - .15, 1.2, eInOut);
    torG.position.set(lerp(0, -.3, side), lerp(1.2, 1.32, side), 0);
    torG.scale.setScalar(lerp(.9, 1, inK) * lerp(1, .9, side));
    torG.rotation.set(-1.08, 0, .1);
    torSpin.rotation.z = .9 + .32 * (t - s.start);
    // волна причёсывания бежит по кольцу
    TH.forEach((h, i) => {
      const k = eApple(clamp((t - T.prich + .05 - (h.u / TAU) * 1.0) / .45));
      const dir = mixDir(h.f, combDir(h.n, h.tan, 1.25 + h.j), k);
      th.setHair(i, h.p, dir, h.l * P(t, s.start + .15 + (h.u / TAU) * .4, .6, eApple), 1);
    });
    th.instanceMatrix.needsUpdate = true;
    // маленький шар выезжает справа снизу
    const sk = P(t, T.vse, 1.1, eApple);
    sphG.visible = sk > .003;
    sphG.position.set(lerp(1.6, .74, sk), lerp(.0, .2, sk), .4);
    sphG.scale.setScalar(Math.max(.001, lerp(.7, 1, sk)));
    sphG.rotation.set(0, -.3 + .2 * (t - T.vse), 0);
    frame(cam, [0, 1.05, 0], 13.4 - .12 * (t - s.start), lerp(-6, 4, clamp((t - s.start) / 6)), 14, 540, 860);
  },

  draw2d(t, s, st) {
    const { stage, T, torG, sphG, pole } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    // «ни одного вихра»
    atext('ни одного вихра', 540, 1180, T.mozh, t, { size: 52, w: 500, col: sub, track: -.01, out: T.vse - .1 });
    // макушка маленького шара
    sphG.updateMatrixWorld(true);
    const pw = new THREE.Vector3(...scl3(pole, SR * 1.04)); sphG.localToWorld(pw);
    const [px, py] = project(cam, pw.x, pw.y, pw.z);
    const dA = P(t, T.forma, .5);
    dot(px, py, 10 * dA * (1 + .3 * bump(t, T.sfer + .1, .35)), red, dA);
    // заголовок
    atext('У сферы', 540, 300, T.sfer - .1, t, { size: 104, w: 600, col: ink, track: -.03 });
    atext('нет дырки', 540, 410, T.net - .05, t, { size: 104, w: 600, col: ink, track: -.03 });
    // пунктирное кольцо в дырке тора + выноска
    torG.updateMatrixWorld(true);
    const c = new THREE.Vector3(0, 0, 0); torG.localToWorld(c);
    const [cx, cy] = project(cam, c.x, c.y, c.z);
    const ha = P(t, T.dyr - .1, .5);
    if (ha > .003) {
      // эллипс — проекция окружности радиуса TR−Tr в плоскости тора
      g.save(); g.globalAlpha = ha; g.strokeStyle = ink; g.lineWidth = 3; g.setLineDash([9, 9]); g.lineCap = 'round';
      g.beginPath();
      for (let i = 0; i <= 64; i++) {
        const a = -1.2 + i / 64 * TAU * P(t, T.dyr - .1, .7, eApple), r = (TR - Tr) * .78;
        const q = new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0); torG.localToWorld(q);
        const [x, y] = project(cam, q.x, q.y, q.z); i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke(); g.restore();
    }
    atext('дырка', cx, cy + 14, T.dyr + .1, t, { size: 40, w: 600, col: ink, track: -.01 });
  },

  sfx(add) {
    const T = TT();
    add(T.bub - .2, 'bloom', .3, .8);
    add(T.prich, 'shimmer', .25, 1);
    add(T.mozh, 'click', .25, 1);
    add(T.vse, 'whoosh', .25, .8);
    add(T.dyr, 'chime', .22, .9);
  },
});
