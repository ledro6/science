// OUTRO (34.1 – 42.3 с), чёрный фон.
// o1 — «Самый быстрый путь / не всегда прямой»: стеклянный блок на чёрном, лампа, луч входит в блок и ломается;
//      рядом серым пунктиром — прямая. Медленная орбита, блик бежит по стеклу.
// o2 — финальная карточка: «Принцип Ферма», «sin α / sin β = v₁ / v₂» серым, красная пилюля «Подписаться на L³».
import { defineScene, makeStage, project, atext, atextWords, P, Wd, THREE, MAT, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { rod } from '../../../models.mjs';
import { ctx, fermatX, frame, polyline, glow, glowLine, pill, lerp3 } from './kit.mjs';

const BW = 2.8, BH = 1.1, BD = 1.3;                     // блок стоит на полу, верх на y = BH
const A = [-1.35, BH + 1.25], B = [.75, .05];            // лампа и точка на дне блока
const XC = fermatX([A[0], A[1] - BH], [B[0], B[1] - BH], 1, .67);   // стекло: v = c/1,5

function TT() {
  return { sam: Wd('o1', 'Самый'), put: Wd('o1', 'путь'), ne: Wd('o1', 'не'), pr: Wd('o1', 'прямой'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const T = TT();
    const obj = new THREE.Group();
    const geo = new THREE.BoxGeometry(BW, BH, BD);
    const glass = new THREE.Mesh(geo, MAT.glass(.14)); glass.position.y = BH / 2;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .8 }));
    edges.position.y = BH / 2;
    const lm = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.08, 32, 22), lm); lamp.position.set(A[0], A[1], 0);
    const r1 = rod(lm, .02, 12), r2 = rod(lm, .02, 12);
    r1.set([A[0], A[1], 0], [XC, BH, 0]); r2.set([XC, BH, 0], [B[0], B[1], 0]);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(.07, 32), lm); spot.rotation.x = -Math.PI / 2; spot.position.set(B[0], .004, 0);
    obj.add(glass, edges, lamp, r1, r2, spot);
    const glint = new THREE.PointLight('#ffffff', 0, 0, 2);
    stage.root.add(obj); stage.scene.add(glint);
    return { stage, T, obj, glint };
  },

  update(t, s, st) {
    const { stage, T, obj, glint } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.4 * lk; L.hemi.intensity = .5 * lk;
    const ap = P(t, s.start + .1, 1.2);
    obj.scale.setScalar(lerp(.94, 1, ap));
    obj.rotation.y = lerp(-.32, .32, clamp((t - s.start) / 8.2));
    const gp = ((t - s.start) / 2.6) % 1;
    glint.intensity = 10 * Math.sin(Math.PI * clamp(gp)) * ap;
    glint.position.set(lerp(-2.4, 2.4, eInOut(gp)), BH + .9, 1.6);
    // o2: объект опускается под карточку и чуть уменьшается
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [0, 1.05, 0], lerp(17, 21, o2), 0, lerp(9, 11, o2), 540, lerp(930, 840, o2));
  },

  draw2d(t, s, st) {
    const { stage, T, obj } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    obj.updateMatrixWorld();
    const W3 = (x, y) => { const v = new THREE.Vector3(x, y, 0).applyMatrix4(obj.matrixWorld); return project(cam, v.x, v.y, v.z); };
    const pA = W3(A[0], A[1]), pC = W3(XC, BH), pB = W3(B[0], B[1]);
    const ap = P(t, s.start + .1, 1.2);
    glow(pA[0], pA[1], 80, .6 * ap);
    glowLine([pA, pC, pB], 1, .35 * ap, 1.5);
    glow(pB[0], pB[1], 50, .35 * ap);
    // прямая — серый пунктир (на «прямой»)
    const o1 = T.card - .35;
    polyline([pA, pB], P(t, T.pr - .1, .6, eInOut), sub, .9 * (1 - P(t, o1, .35, eIn)), 2.5, [9, 11]);
    atextWords('Самый быстрый путь', 540, 340, T.sam - .05, t, { size: 92, w: 600, col: ink, track: -.03, stagger: .2, out: o1 });
    atextWords('не всегда прямой', 540, 450, T.ne - .05, t, { size: 92, w: 600, col: ink, track: -.03, stagger: .16, out: o1 });
    if (t > T.card - .1) {
      atextWords('Принцип Ферма', 540, 380, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .12 });
      atext('sin α / sin β = v₁ / v₂', 540, 480, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.pr, 'tick', .14, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
