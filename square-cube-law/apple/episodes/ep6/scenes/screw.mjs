// SCREW (35.1 – 40.4 с), белый фон.
// Бактерия крупно: на «крутят» жгутик-штопор раскручивается, тело ввинчивается вперёд; вокруг жгутика
// закручиваются винтовые линии тока (задние витки бледнее). Ниже — метафора: алюминиевый штопор
// ввинчивается в пробку-цилиндр, «пробка» на последнем слове.
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { rod } from '../../../models.mjs';
import { frame, makeBacterium, helixGeometry, TAU } from './_kit.mjs';
import { ctx, lp } from './_draw.mjs';

function TT() {
  return { bak: Wd('s1', 'Бактерии'), vyh: Wd('s1', 'выход'), kr: Wd('s1', 'крутят'), sht: Wd('s1', 'жгутик-штопор'),
    vv: Wd('s1', 'ввинчиваются'), vodu: Wd('s1', 'воду'), pr: Wd('s1', 'пробку') };
}
// фаза жгутика: медленно до «крутят», затем разгон (интеграл скорости — чистая функция t)
const SLOW = 1.2, FAST = 12, RAMP = .6;
function spinPh(t, T) {
  if (t < T.kr) return SLOW * t;
  const u = t - T.kr;
  return SLOW * T.kr + SLOW * u + (FAST - SLOW) * (u < RAMP ? u * u / (2 * RAMP) : RAMP / 2 + (u - RAMP));
}
const bodyX = (t, T) => .016 * (spinPh(t, T) - SLOW * T.bak);   // путь пропорционален числу оборотов: как винт в резьбе

defineScene('screw', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .35 });
    stage.floor.position.y = -3.29;
    const T = TT();
    const bac = makeBacterium(THREE, MAT.ceramicBlack(), { len: 2.5, R: .22, turns: 3.0, tube: .042 });
    stage.root.add(bac);
    bac.traverse(o => { if (o.isMesh) o.castShadow = false; });
    // штопор: спираль + стержень + Т-ручка; пробка — цилиндр
    const alu = MAT.aluminium();
    const cs = new THREE.Group();
    const coil = new THREE.Mesh(helixGeometry(THREE, { len: 1.15, R: .1, turns: 4.2, tube: .028, seg: 200 }), alu);
    coil.rotation.z = Math.PI / 2;     // ось спирали — вертикально, острие вниз (локальный −X → −Y)
    const shaft = rod(alu, .035, 16); shaft.set([0, 0, 0], [0, .55, 0]);
    const handle = rod(MAT.graphite(), .07, 24); handle.set([-.42, .6, 0], [.42, .6, 0]);
    cs.add(coil, shaft, handle);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(.36, .32, .8, 48), new THREE.MeshPhysicalMaterial({ color: '#CFCAC2', roughness: .8 }));
    stage.root.add(cs, cork);
    [cs, cork].forEach(o => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }));
    return { stage, T, bac, cs, cork };
  },

  update(t, s, st) {
    const { stage, T, bac, cs, cork } = st, cam = stage.camera;
    const ph = spinPh(t, T);
    bac.spin(ph);
    bac.position.set(bodyX(t, T) - .05, 0, 0);
    bac.rotation.set(.18, 0, .06);
    // штопор и пробка снизу
    const ci = P(t, T.sht + .1, .9, eApple), ki = P(t, T.vv - .1, .9, eApple);
    cs.visible = ci > .01; cork.visible = ki > .01;
    const dig = clamp((t - T.vv) / (s.end - T.vv));
    cs.position.set(-.15, -1.35 + (1 - ci) * .25 - .45 * eInOut(dig) * ki, 0);
    cs.rotation.y = -TAU * 1.3 * eInOut(dig) - t * .4;
    cs.scale.setScalar(Math.max(1e-3, .95 * ci));
    cork.position.set(-.15, -2.89 - (1 - ki) * .12, 0);
    cork.scale.setScalar(Math.max(1e-3, lerp(.92, 1, ki)));
    const p = clamp((t - s.start) / (s.end - s.start));
    frame(cam, [-.85, -1.455, 0], 19.5, lerp(-10, 6, p), lerp(9, 5, p), 540, 830);
  },

  draw2d(t, s, st) {
    const { stage, T, bac, cs, cork } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    // винтовые линии тока вокруг жгутика: закручены и вращаются вместе с ним
    const ph = spinPh(t, T), a0 = P(t, T.kr - .2, .8) * (1 - P(t, s.end - .45, .3, eIn));
    if (a0 > .003) {
      bac.updateMatrixWorld();
      g.save(); g.lineWidth = 2.2; g.lineCap = 'round'; g.strokeStyle = ink;
      for (let k = 0; k < 3; k++) {
        let prev = null;
        for (let i = 0; i <= 140; i++) {
          const u = i / 140, x = lerp(-4.2, .4, u);
          const r = lerp(.62, .5, u) + .08 * Math.sin(u * 3);
          const ang = -x * 3.2 + ph * .55 + k * TAU / 3;
          const y = r * Math.cos(ang), z = r * Math.sin(ang);
          const q = lp(cam, bac, x, y, z);
          if (prev) {
            const fade = Math.min(1, u * 4, (1 - u) * 6);
            g.globalAlpha = a0 * fade * (z > 0 ? .55 : .14);
            g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke();
          }
          prev = q;
        }
      }
      g.restore();
    }
    // тексты
    atext('Выход', 540, 330, T.vyh, t, { size: 104, w: 600, col: ink, track: -.03, out: T.sht - .3 });
    atext('Жгутик-штопор', 540, 330, T.sht, t, { size: 104, w: 600, col: ink, track: -.03 });
    // выноска к жгутику
    const ca = P(t, T.kr, .5) * (1 - P(t, s.end - .45, .3, eIn));
    if (ca > .003) {
      const [ax, ay] = lp(cam, bac, -2.2, -.3, 0);
      line(ax, ay, ax - 30, ay + 110, sub, ca * .8, 2);
      g.save(); g.globalAlpha = ca; g.fillStyle = ink; g.beginPath(); g.arc(ax, ay, 5, 0, 7); g.fill(); g.restore();
      atext('≈100 об/с', ax - 30, ay + 150, T.kr + .1, t, { size: 40, w: 600, col: ink, track: 0, dy: 12, a: ca });
    }
    // подписи метафоры
    const [cx, cy] = project(cam, cork.position.x + .42, cork.position.y, 0);
    atext('пробка', cx + 20, cy + 14, T.pr, t, { size: 42, w: 500, col: sub, align: 'left', track: 0, dy: 12 });
    const [sx, sy] = project(cam, cs.position.x + .45, cs.position.y + .45, 0);
    atext('штопор', sx + 20, sy + 14, T.sht + .5, t, { size: 42, w: 500, col: sub, align: 'left', track: 0, dy: 12 });
  },

  sfx(add, s) {
    const T = TT();
    add(T.kr, 'swell', .3, 1.1);
    add(T.sht + .1, 'whoosh', .3, .9);
    add(T.vv, 'click', .25, .8);
    add(T.pr, 'thud', .3, .8);
  },
});
