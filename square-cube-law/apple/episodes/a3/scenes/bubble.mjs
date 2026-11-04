// BUBBLE (≈23.2 – 32.7 с), чёрный фон. Прозрачная бутылка с водой лежит горлышком вперёд (+X), под самой стенкой —
// приплюснутый пузырь воздуха. Вид сбоку.
// b1 — «пузырь в бутылке с водой»: бутылка проявляется из темноты, контур стекла прорисован тонкой линией;
//      «при разгоне» — сверху стрелка «разгон», мимо бутылки назад бегут hairline-штрихи (честное ускорение 0,28 g);
//      «уходит вперёд» — пузырь скользит под стенкой к плечику горлышка.
// b2 — «Шарик с гелием»: бутылка отъезжает влево, справа проявляется шарик на алюминиевой шайбе, наклонённый вперёд;
//      «легче воздуха» — заголовок и подписи «легче воды» / «легче воздуха»; «всплытие» — «= всплывает».
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, frame, keys, collectMats, setLit, makeBalloon, makeDrive, flowLine, arrow, A_CAR, THETA } from './kit.mjs';

// профиль бутылки (r, s), s — вдоль оси; ось кладётся вдоль +X
const PROF = [[0, -1.12], [.3, -1.12], [.36, -1.09], [.38, -1.02], [.38, .4], [.36, .52], [.29, .66], [.18, .78], [.13, .86], [.13, 1.0], [.145, 1.01], [.145, 1.13], [0, 1.13]];
const RB = .38, RIN = .355;
const BX0 = -.38, BX1 = .3;                     // пузырь: в покое и у плечика

function TT() {
  return {
    tak: Wd('b1', 'Так'), puz: Wd('b1', 'пузырь'), but: Wd('b1', 'бутылке'), vod: Wd('b1', 'водой'), pri: Wd('b1', 'при'), raz: Wd('b1', 'разгоне'),
    uh: Wd('b1', 'уходит'), vper: Wd('b1', 'вперёд'),
    shar: Wd('b2', 'Шарик'), gel: Wd('b2', 'гелием'), leg: Wd('b2', 'легче'), vozd: Wd('b2', 'воздуха'), vspl: Wd('b2', 'всплытие'),
  };
}
const accel = (t, T) => A_CAR * P(t, T.raz - .1, .9, eInOut);

defineScene('bubble', {
  setup(s) {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const T = TT();
    const bottle = new THREE.Group();
    const lathe = (k, mat, ro) => {
      const geo = new THREE.LatheGeometry(PROF.map(([r, y]) => new THREE.Vector2(r * k, y * (k > .99 ? 1 : .985))), 48);
      geo.rotateZ(-Math.PI / 2);
      const m = new THREE.Mesh(geo, mat); m.renderOrder = ro; return m;
    };
    const glassM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .25, transparent: true, opacity: .07, depthWrite: false, side: THREE.DoubleSide });
    const waterM = new THREE.MeshStandardMaterial({ color: '#9FA3AA', roughness: .3, transparent: true, opacity: .26, depthWrite: false });
    const glass = lathe(1, glassM, 3), water = lathe(.93, waterM, 2);
    // крышка — графит
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .13, 32), MAT.graphite()); cap.rotation.z = -Math.PI / 2; cap.position.x = 1.08;
    // контур стекла в плоскости z = 0 (силуэт сбоку) + кольца по корпусу
    const lm = new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .55 });
    const sil = PROF.map(([r, y]) => new THREE.Vector3(y, r, 0)).concat(PROF.slice().reverse().map(([r, y]) => new THREE.Vector3(y, -r, 0)));
    const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(sil), lm); outline.renderOrder = 4;
    const rings = [];
    for (const xr of [-1.02, .4]) {
      const pts = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; pts.push(new THREE.Vector3(xr, Math.cos(a) * RB, Math.sin(a) * RB)); }
      const r = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .2 })); r.renderOrder = 4; rings.push(r);
    }
    const bubM = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .08, clearcoat: 1, clearcoatRoughness: .05, metalness: .1 });
    const bub = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), bubM);
    const small = [0, 1, 2].map(i => new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), bubM));
    bottle.add(bub, ...small, water, glass, cap, outline, ...rings);
    bottle.position.y = RB + .002;
    cap.castShadow = true; bub.castShadow = true;
    const shadowCaster = new THREE.Mesh(new THREE.CylinderGeometry(RB * .9, RB * .9, 2.1, 24), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    shadowCaster.rotation.z = -Math.PI / 2; shadowCaster.castShadow = true; bottle.add(shadowCaster);
    // b2: шарик на алюминиевой шайбе
    const balG = new THREE.Group();
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(.2, .22, .07, 40), MAT.aluminium()); puck.position.y = .035; puck.castShadow = true;
    const bal = makeBalloon({ L: .8, R: .34 }); bal.position.y = .07;
    bal.traverse(o => { if (o.isMesh) o.castShadow = true; });
    balG.add(puck, bal);
    stage.root.add(bottle, balG);
    return { stage, T, bottle, bub, small, balG, bal, glassM, waterM, lm, mats: collectMats(bottle), drive: makeDrive(t => accel(t, T), s.start, s.end + 1) };
  },

  update(t, s, st) {
    const { stage, T, bottle, bub, small, balG, bal, glassM, waterM, lm, mats } = st, cam = stage.camera, L = stage.lights;
    // проявление
    const lk = P(t, T.tak, 1.3), lr = P(t, s.start + .1, 1.0);
    setLit(mats, .3 + .7 * lk);
    waterM.opacity = .26 * lk; glassM.opacity = .07 * lr; lm.opacity = .55 * P(t, T.but - .2, 1.0);
    L.key.position.set(2, 9, 7); L.key.target.position.set(0, 0, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.3 * lk; L.hemi.intensity = .45; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    // пузырь: скользит вперёд под стенкой
    const m = P(t, T.uh - .35, 1.3, eInOut);
    const bx = lerp(BX0, BX1, m);
    const rx = lerp(.34, .27, m), ry = lerp(.075, .09, m);
    bub.scale.set(rx, ry, lerp(.22, .2, m));
    bub.position.set(bx, RIN - ry - .006, 0);
    // мелкие пузырьки следом
    small.forEach((q, i) => {
      const r = [.03, .022, .016][i];
      const k = P(t, T.uh - .2 + i * .12, 1.4, eInOut);
      q.scale.setScalar(r); q.position.set(lerp(-.62 - i * .13, BX1 - .38 - i * .12, k), RIN - r - .004, [.08, -.1, .02][i]);
    });
    // b2: бутылка влево, шарик справа
    const b2 = P(t, T.shar - .15, 1.2, eInOut);
    bottle.position.x = lerp(0, -1.35, b2);
    bottle.scale.setScalar(lerp(1, .82, b2)); bottle.position.y = (RB + .002) * lerp(1, .82, b2);
    const pb = P(t, T.shar + .15, .9);
    balG.visible = pb > .003;
    balG.position.set(1.65, 0, 0); balG.scale.setScalar(Math.max(1e-3, lerp(.9, 1, pb)));
    bal.pose(THETA);
    const [tx, ty, d, el, sy] = keys([[s.start, 0, .38, 11.5, 9, 900], [T.raz, 0, .38, 10.6, 7, 900], [T.shar - .15, 0, .38, 10.4, 6, 900], [T.shar + 1.1, .1, .7, 19, 6, 900], [s.end, .1, .7, 19.7, 5, 900]], t, eInOut);
    frame(cam, [tx, ty, 0], d, lerp(-6, 4, clamp((t - s.start) / (s.end - s.start))), el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, bottle, bal, balG, drive } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const o1 = T.shar - .25;
    // штрихи движения: бегут назад, скорость — честная (путь машины), края гаснут
    const aS = P(t, T.raz - .1, .8) * (1 - P(t, o1, .4, eIn));
    if (aS > .003) {
      const x = drive.x(t);
      [[.08, 0], [.95, 1.3], [-.25, -.4], [1.25, -.9]].forEach(([y, ph], i) => {
        const [, py] = project(cam, 0, y, -.6);
        flowLine([[1000, py], [80, py]], x + ph, 180, ink, aS * (i % 2 ? .35 : .5), 2, [70, 110], .22);
      });
    }
    // стрелка «разгон»
    const [ax, ay] = project(cam, bottle.position.x, 1.05, 0);
    const pA = P(t, T.raz - .05, .7) * (1 - P(t, o1, .4, eIn));
    if (pA > .003) arrow(ax - 120, ay, ax - 120 + 240 * pA, ay, ink, pA, 4, 18);
    atext('разгон', ax, ay - 30, T.raz, t, { size: 44, w: 600, col: ink, track: -.01, dy: 14, out: o1 });
    atext('Пузырь в бутылке', 540, 340, T.puz - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: o1 });
    atext('с водой', 540, 410, T.vod - .05, t, { size: 44, w: 500, col: sub, track: -.005, out: o1 });
    // b2
    const out = s.end - .4;
    atext('Легче воздуха', 540, 340, T.leg - .05, t, { size: 84, w: 600, col: ink, track: -.03, out });
    atext('= всплывает', 540, 444, T.vspl - .05, t, { size: 84, w: 600, col: ink, track: -.03, out });
    const [bx, by] = project(cam, bottle.position.x, 0, .5), [qx, qy] = project(cam, balG.position.x, 0, .5);
    const yl = Math.max(by, qy) + 58;
    atext('пузырь', bx, yl, T.shar + .4, t, { size: 40, w: 600, col: ink, track: -.01, dy: 12, out });
    atext('легче воды', bx, yl + 46, T.leg + .1, t, { size: 34, w: 500, col: sub, track: 0, dy: 12, out });
    atext('шарик', qx, yl, T.gel, t, { size: 40, w: 600, col: ink, track: -.01, dy: 12, out });
    atext('легче воздуха', qx, yl + 46, T.vozd, t, { size: 34, w: 500, col: sub, track: 0, dy: 12, out });
  },

  sfx(add) {
    const T = TT();
    add(T.tak + .1, 'bloom', .22, .8);
    add(T.raz, 'swell', .2, .7);
    add(T.uh, 'whoosh', .16, 1.1);
    add(T.shar + .15, 'thud', .18, .9);
    add(T.leg, 'tick', .14);
    add(T.vspl, 'chime', .22, 1.0);
  },
});
