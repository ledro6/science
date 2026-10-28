// ANTS (29.5 – 34.1 с), белый фон. Две плиты: гладкая глянцевая керамика и шершавая (россыпь зёрен, InstancedMesh).
// По ним из гнезда к крошкам идёт цепочка чёрных керамических муравьёв: по гладкому быстро, по шершавому медленно
// (цепочка там гуще) — и тропа ломается на границе по правилу Ферма. Подпись «муравьи, 2013»,
// на «тропы» — пунктир тропы, на «правилу» — нормаль и углы α, β, как у луча.
import { defineScene, makeStage, project, atext, P, Wd, THREE, MAT, clamp, lerp, rng, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeAnt } from '../../../models.mjs';
import { ctx, fermatX, onPath, pathTime, rbox, frame, polyline, arc, TH } from './kit.mjs';

const N = [-1.65, -1.85], F = [1.45, 1.45], V1 = .55, V2 = .27;     // гнездо, еда; скорость по гладкой и по шершавой
const XC = fermatX(N, F, V1, V2), TT_ = pathTime(N, F, XC, V1, V2);
const NA = 9, SC = .2, W = 4.6, D = 2.4;

function TT() {
  return { bio: Wd('a1', 'биологи'), vy: Wd('a1', 'выяснили'), mur: Wd('a1', 'муравьи'), trop: Wd('a1', 'тропы'), tom: Wd('a1', 'тому'), pr: Wd('a1', 'правилу') };
}

defineScene('ants', {
  setup() {
    const stage = makeStage({ bg: 'white', floorY: -TH, shadow: .5 });
    const T = TT();
    // гладкая плита
    const smoothMat = MAT.ceramicWhite(); smoothMat.roughness = .12; smoothMat.clearcoat = 1; smoothMat.clearcoatRoughness = .05;
    const smooth = new THREE.Mesh(rbox(W, TH, D, .035), smoothMat);
    smooth.position.set(0, -TH / 2, -D / 2 - .004);
    // шершавая плита + зёрна
    const roughMat = new THREE.MeshPhysicalMaterial({ color: '#D6D6DA', roughness: .85 });
    const rough = new THREE.Mesh(rbox(W, TH, D, .035), roughMat);
    rough.position.set(0, -TH / 2, D / 2 + .004);
    const R = rng(31), NG = 650;   // зёрна без теней — бюджет кадра
    const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshPhysicalMaterial({ color: '#BDBDC2', roughness: .7 }), NG);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    for (let i = 0; i < NG; i++) {
      const r = .014 + R() * .028;
      p.set((R() - .5) * (W - .12), r * .35, .06 + R() * (D - .12));
      e.set(R() * 6, R() * 6, R() * 6); q.setFromEuler(e); sc.set(r, r * (.6 + R() * .5), r);
      M.compose(p, q, sc); grains.setMatrixAt(i, M);
    }
    grains.receiveShadow = false;
    [smooth, rough].forEach(m => { m.receiveShadow = true; m.castShadow = true; });
    // гнездо (графитовая шайба с отверстием) и крошки
    const nest = new THREE.Mesh(new THREE.TorusGeometry(.16, .05, 16, 48), MAT.graphite());
    nest.rotation.x = Math.PI / 2; nest.position.set(N[0], .02, N[1]);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(.13, 40), new THREE.MeshBasicMaterial({ color: '#1D1D1F' }));
    hole.rotation.x = -Math.PI / 2; hole.position.set(N[0], .003, N[1]);
    const food = new THREE.Group();
    const fm = MAT.ceramicWhite();
    [[0, 0, .07], [.12, .05, .05], [-.06, .11, .045], [.05, -.1, .04]].forEach(([x, z, r]) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), fm); m.position.set(x, r * .8, z); m.castShadow = true; food.add(m); });
    food.position.set(F[0] + .12, 0, F[1] + .1);
    // муравьи
    const ants = [];
    const antMat = MAT.ceramicBlack();
    for (let i = 0; i < NA; i++) {
      const a = makeAnt(antMat); a.scale.setScalar(SC); ants.push(a);
      // бюджет кадра: тень отбрасывает только тело (лапки и усики — слишком мелкие для карты теней)
      a.traverse(o => { if (o.isMesh) { o.receiveShadow = false; o.castShadow = o.geometry.type === 'SphereGeometry' && o.scale.x > .1; } });
    }
    stage.root.add(smooth, rough, grains, nest, hole, food, ...ants);
    return { stage, T, ants };
  },

  update(t, s, st) {
    const { stage, ants } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(lerp(-5, 5, clamp((t - s.start) / 4.6)), 10, 6);
    ants.forEach((a, i) => {
      // поток: каждый муравей проходит путь за TT_ секунд, стартуя с шагом TT_/NA (чистая функция времени)
      const tau = (((t - 20) + i * TT_ / NA) % TT_ + TT_) % TT_;
      const [x, z, seg, , ang] = onPath(N, F, XC, V1, V2, tau);
      a.position.set(x, 0, z); a.rotation.y = -ang;
      const dist = seg ? Math.hypot(XC - N[0], N[1]) + (tau - Math.hypot(XC - N[0], N[1]) / V1) * V2 : tau * V1;
      a.pose({ walk: dist * 26 });
      // проявление у гнезда и исчезновение у еды
      const k = clamp(tau / .5) * clamp((TT_ - tau) / .5);
      a.scale.setScalar(SC * Math.max(k, .001)); a.visible = k > .01;
    });
    const k = clamp((t - s.start) / 4.6);
    frame(cam, [-.05, 0, -.1], lerp(23.5, 22.5, eInOut(k)), lerp(-8, 4, k), lerp(54, 58, k), 530, 880);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const pr = (x, z) => project(cam, x, .012, z);
    atext('муравьи, 2013', 540, 370, T.bio - .05, t, { size: 96, w: 600, col: ink, track: -.03 });
    const [sx, sy] = pr(-2.2, -.32), [rx, ry] = pr(-2.2, .58);
    atext('гладкая', sx + 4, sy, T.vy, t, { size: 34, w: 500, col: sub, align: 'left', track: 0, dy: 14 });
    atext('шершавая', rx + 4, ry, T.vy + .25, t, { size: 34, w: 500, col: ink, a: .8, align: 'left', track: 0, dy: 14 });
    // тропа
    const pN = pr(N[0], N[1]), pC = pr(XC, 0), pF = pr(F[0], F[1]);
    polyline([pN, pC, pF], P(t, T.trop - .1, .8, eInOut), ink, .55, 2.5, [7, 9]);
    // нормаль и углы
    const na = P(t, T.tom, .5);
    if (na > .003) {
      const n1 = pr(XC, -.75), n2 = pr(XC, .75);
      polyline([n1, n2], P(t, T.tom, .5, eInOut), ink, .6 * na, 2, [6, 8]);
      const up = Math.atan2(n1[1] - pC[1], n1[0] - pC[0]), dn = Math.atan2(n2[1] - pC[1], n2[0] - pC[0]);
      const ia = Math.atan2(pN[1] - pC[1], pN[0] - pC[0]), ra = Math.atan2(pF[1] - pC[1], pF[0] - pC[0]);
      arc(pC[0], pC[1], 70, up, ia, P(t, T.tom + .05, .5, eInOut), ink, na);
      arc(pC[0], pC[1], 84, dn, ra, P(t, T.tom + .25, .5, eInOut), ink, na);
      const m1 = (up + ia) / 2, m2 = (dn + ra) / 2;
      atext('α', pC[0] + Math.cos(m1) * 106, pC[1] + Math.sin(m1) * 106 + 14, T.tom + .15, t, { size: 44, w: 500, col: ink, track: 0, dy: 10 });
      atext('β', pC[0] + Math.cos(m2) * 120, pC[1] + Math.sin(m2) * 120 + 14, T.tom + .35, t, { size: 44, w: 500, col: ink, track: 0, dy: 10 });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.bio, 'bloom', .22, 1);
    add(T.trop, 'tick', .14, 1);
    add(T.pr, 'click', .2, 1);
  },
});
