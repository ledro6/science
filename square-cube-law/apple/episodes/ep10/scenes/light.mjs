// LIGHT (14.2 – 29.5 с), чёрный фон. Разрез «воздух / вода»: стеклянный блок воды, над ним — лампа.
// l1 — «Пьер Ферма, XVII век»; на «всех путей» из лампы веером тянутся серые пути; на «самый быстрый» загорается
//      настоящий луч (3D-стержень + свечение), преломлённый на границе.
// l2 — по лучу бегут импульсы света: в воде медленнее (шаг короче); подписи 300 000 км/с и 225 000 км/с.
// l3 — наезд на точку преломления: нормаль, углы α и β; затем стакан воды с ложкой — ложка «ломается» на поверхности.
import { defineScene, makeStage, project, atext, atextWords, acount, line, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { rod } from '../../../models.mjs';
import { ctx, bump, fermatX, frame, polyline, polyAt, glowLine, glow, arc, lerp3, TAU } from './kit.mjs';

const A = [-1.45, 1.7], B = [1.05, -1.3], V1 = 1, V2 = .75;       // скорость в воде = 0,75 от скорости в воздухе
const XC = fermatX(A, B, V1, V2);
const BW = 3.8, BH = 1.6, BD = 1.2;                               // блок воды: верх на y = 0
const GY = -BH;                                                   // пол
// стакан и ложка
const GR = .62, GH = 1.95, WL = -.5;                              // радиус, высота стакана, уровень воды
const SP_T = [.78, .72, .16], SP_B = [-.3, -1.42, -.08];          // ручка сверху → черпак внизу
const SU = (SP_T[1] - WL) / (SP_T[1] - SP_B[1]);
const SP_S = lerp3(SP_T, SP_B, SU);                               // точка на поверхности воды

function TT() {
  const T = {
    pier: Wd('l1', 'Пьер'), fer: Wd('l1', 'Ферма'), xvii: Wd('l1', 'семнадцатом'), pon: Wd('l1', 'понял'), svet: Wd('l1', 'свет'),
    vseh: Wd('l1', 'всех'), put: Wd('l1', 'путей'), sam: Wd('l1', 'самый'), bys: Wd('l1', 'быстрый'),
    vode: Wd('l2', 'воде'), med: Wd('l2', 'медленнее'), vozd: Wd('l2', 'воздухе'), dv: Wd('l2', 'двести'), sek: Wd('l2', 'секунду'),
    vm: Wd('l2', 'вместо'), tr: Wd('l2', 'трёхсот'),
    poe: Wd('l3', 'Поэтому'), gran: Wd('l3', 'границе'), luch: Wd('l3', 'луч'), izg: Wd('l3', 'изгибается'),
    lozh: Wd('l3', 'ложка'), stak: Wd('l3', 'стакане'), slom: Wd('l3', 'сломанной'),
  };
  T.beam = T.sam - .05;                       // загорается луч
  T.cut = (Wd('l3', 'изгибается') + 0.9 + T.lozh) / 2 - .05;   // блок → стакан (через вдох в чёрный)
  return T;
}
// путь луча по времени: доля длины при равномерном времени (в воде медленнее)
const D1 = Math.hypot(XC - A[0], A[1]), D2 = Math.hypot(B[0] - XC, B[1]);
const T1 = D1 / V1, T2 = D2 / V2;
const fracAt = u => { const tt = u * (T1 + T2); return tt <= T1 ? (tt / T1) * D1 / (D1 + D2) : (D1 + (tt - T1) / T2 * D2) / (D1 + D2); };

defineScene('light', {
  setup() {
    const stage = makeStage({ bg: 'black', floorY: GY, shadow: .55 });
    const T = TT();
    // блок воды: стекло + рёбра + тонкий «мениск» по верхней грани
    const blk = new THREE.Group();
    const bGeo = new THREE.BoxGeometry(BW, BH, BD);
    const glass = new THREE.Mesh(bGeo, MAT.glass(.13));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(bGeo), new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .75 }));
    const top = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, clearcoat: 1, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide }));
    top.rotation.x = -Math.PI / 2; top.position.y = BH / 2 - .002;
    blk.add(glass, edges, top); blk.position.y = -BH / 2;
    // лампа и луч
    const lampMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.085, 32, 22), lampMat);
    lamp.position.set(A[0], A[1], 0);
    const beamMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
    const r1 = rod(beamMat, .018, 12), r2 = rod(beamMat, .018, 12);
    const plight = new THREE.PointLight('#ffffff', 0, 0, 2);
    plight.position.set(A[0], A[1], .3);
    // стакан, вода, ложка
    const cup = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(GR, GR * .94, GH, 64, 1, true), MAT.glass(.12));
    wall.position.y = GY + GH / 2;
    const rimMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .1, clearcoat: 1, transparent: true, opacity: .8 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(GR, .012, 8, 96), rimMat); rim.rotation.x = Math.PI / 2; rim.position.y = GY + GH;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(GR * .94, GR * .94, .08, 64), MAT.glass(.3)); base.position.y = GY + .04;
    const wH = WL - GY - .08;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(GR * .975, GR * .94, wH, 64, 1), new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .1, transparent: true, opacity: .16, depthWrite: false }));
    water.position.y = GY + .08 + wH / 2;
    const surf = new THREE.Mesh(new THREE.TorusGeometry(GR * .975, .008, 6, 96), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .8 }));
    surf.rotation.x = Math.PI / 2; surf.position.y = WL;
    const spMat = MAT.aluminium();
    const sp1 = rod(spMat, .03, 16), sp2 = rod(spMat, .03, 16);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), spMat); bowl.scale.set(.15, .05, .1);
    cup.add(sp1, sp2, bowl, base, wall, water, surf, rim);
    cup.traverse(o => { if (o.isMesh) o.castShadow = true; });
    stage.root.add(blk, lamp, r1, r2, plight, cup);
    return { stage, T, blk, glass, edges, top, lamp, r1, r2, plight, cup, sp1, sp2, bowl, spMat };
  },

  update(t, s, st) {
    const { stage, T, blk, edges, lamp, r1, r2, plight, cup, sp1, sp2, bowl } = st, cam = stage.camera, L = stage.lights;
    const ph2 = t >= T.cut;
    blk.visible = lamp.visible = !ph2; cup.visible = ph2;
    const lit = P(t, s.start, 1.1);
    L.key.position.set(lerp(-6, 5, clamp((t - s.start) / 12)), 9, 6);
    L.key.intensity = 2.4 * lit; L.hemi.intensity = .45 * lit; L.rimL.intensity = 3.2 * lit; L.rimR.intensity = 2.4 * lit;
    if (!ph2) {
      lamp.scale.setScalar(Math.max(.001, P(t, T.pier - .1, .8)));
      edges.material.opacity = .55 + .3 * bump(t, T.vode + .3, .6);
      // луч растёт из лампы (в воде медленнее)
      const u = clamp((t - T.beam) / .9);
      const f = fracAt(u), fc = D1 / (D1 + D2);
      const C = [XC, 0, 0];
      const p1 = clamp(f / fc), p2 = clamp((f - fc) / (1 - fc));
      r1.visible = p1 > .001; r2.visible = p2 > .001;
      r1.set([A[0], A[1], 0], lerp3([A[0], A[1], 0], C, p1));
      if (p2 > .001) r2.set(C, lerp3(C, [B[0], B[1], 0], p2));
      plight.intensity = 3 * P(t, T.pier, .8);
      // камера: общий план → наезд на точку преломления
      const z = P(t, T.gran - .2, 1.4, eInOut) * (1 - P(t, T.cut - .5, .5, eIn) * 0);
      const az = lerp(-8, 6, clamp((t - s.start) / 11));
      frame(cam, lerp3([0, .1, 0], [XC, .05, 0], z), lerp(20, 11.5, z), lerp(az, 10, z), lerp(5, 3, z), 540, lerp(870, 860, z));
    } else {
      r1.visible = r2.visible = false; plight.intensity = 0;
      // ложка «ломается»: подводная часть смещается и приподнимается
      const k = P(t, T.slom - .1, .8, eInOut);
      const S2 = [SP_S[0] + .17 * k, WL, SP_S[2]], Bw = [SP_B[0] + .4 * k, SP_B[1] + .28 * k, SP_B[2]];
      sp1.set(SP_T, SP_S); sp2.set(S2, Bw);
      bowl.position.set(...Bw); bowl.rotation.z = Math.atan2(Bw[1] - S2[1], Bw[0] - S2[0]);
      const ci = P(t, T.cut, .9);
      cup.position.y = lerp(-.05, 0, ci);
      cup.scale.setScalar(1);
      const tt = clamp((t - T.cut) / (s.end - T.cut));
      frame(cam, [0, -.75, 0], lerp(10.8, 10, eApple(tt)), lerp(-14, -4, tt), lerp(7, 5, tt), 540, 880);
    }
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const ph2 = t >= T.cut;
    if (!ph2) {
      const pr = (x, y) => project(cam, x, y, 0);
      const pA = pr(A[0], A[1]), pB = pr(B[0], B[1]), pC = pr(XC, 0);
      // ореол лампы
      glow(pA[0], pA[1], 90, .55 * P(t, T.pier, .8));
      // заголовок
      atext('Пьер Ферма', 540, 330, T.fer - .2, t, { size: 104, w: 600, col: ink, track: -.03, out: T.vseh - .2 });
      atext('XVII век', 540, 410, T.xvii, t, { size: 48, w: 500, col: sub, track: -.005, out: T.vseh - .2 });
      // все пути: веер серых ломаных через разные точки границы
      const fade = 1 - .8 * P(t, T.beam + .2, .7);
      for (let i = 0; i < 9; i++) {
        const x = lerp(-1.75, 1.75, i / 8);
        if (Math.abs(x - XC) < .12) continue;
        const pts = [pA, pr(x, 0), pB];
        const t0 = T.put - .25 + i * .05;
        polyline(pts, P(t, t0, .6, eInOut), sub, .75 * fade * (1 - P(t, T.cut - .7, .4, eIn)), 2, [5, 9]);
      }
      // настоящий луч: свечение вдоль 3D-стержня
      const u = clamp((t - T.beam) / .9);
      if (u > 0) {
        const f = fracAt(u);
        glowLine([pA, pC, pB], f, .55, 2);
        const [hx, hy] = polyAt([pA, pC, pB], f);
        glow(hx, hy, 60, .8 * (1 - P(t, T.beam + .9, .4)));
      }
      // импульсы света: идут с постоянным ритмом, в воде медленнее → шаг короче
      const pa = P(t, T.vode - .1, .6) * (1 - P(t, T.cut - .45, .35, eIn));
      if (pa > .003) {
        const per = .2, travel = 1.7;          // интервал между импульсами и время пролёта всего пути, с
        for (let k = 0; k < 12; k++) {
          const age = ((t - T.vode) % per + per) % per + k * per;
          if (age > travel) continue;
          const [x, y] = polyAt([pA, pC, pB], fracAt(age / travel));
          glow(x, y, 26, .9 * pa);
        }
      }
      // скорости
      const o2 = T.poe - .1;
      atext('воздух', 920, 560, T.vozd - .15, t, { size: 38, w: 500, col: sub, align: 'right', track: 0, out: o2 });
      atext('300 000 км/с', 920, 630, T.vozd, t, { size: 62, w: 600, col: ink, align: 'right', track: -.02, out: o2, a: 1 - .45 * P(t, T.dv, .5) + .45 * bump(t, T.tr + .3, .5) });
      atext('вода', 160, 1130, T.vode, t, { size: 38, w: 500, col: sub, align: 'left', track: 0, out: o2 });
      acount(225000, 160, 1205, T.dv, t, { from: 300000, dur: 1.6, size: 62, w: 600, col: ink, align: 'left', track: -.02, suffix: ' км/с', out: o2 });
      // l3: нормаль и углы
      const na = P(t, T.gran, .5) * (1 - P(t, T.cut - .35, .3, eIn));
      if (na > .003) {
        const n1 = pr(XC, 1.05), n2 = pr(XC, -1.05);
        polyline([n1, n2], P(t, T.gran, .6, eInOut), ink, .7 * na, 2, [8, 10]);
        // граница — тонкая линия по верхней грани
        const b1 = pr(XC - 1.3, 0), b2 = pr(XC + 1.3, 0);
        line(b1[0], b1[1], b2[0], b2[1], ink, .35 * na, 2);
        const up = Math.atan2(n1[1] - pC[1], n1[0] - pC[0]), dn = Math.atan2(n2[1] - pC[1], n2[0] - pC[0]);
        const ia = Math.atan2(pA[1] - pC[1], pA[0] - pC[0]), ra = Math.atan2(pB[1] - pC[1], pB[0] - pC[0]);
        const pa1 = P(t, T.luch, .6, eInOut), pa2 = P(t, T.izg + .1, .6, eInOut);
        const R1 = 150, R2 = 190;
        arc(pC[0], pC[1], R1, up, ia, pa1, ink, na);
        arc(pC[0], pC[1], R2, dn, ra, pa2, ink, na);
        const m1 = (up + ia) / 2, m2 = dn + ((ra - dn) / 2);
        atext('α', pC[0] + Math.cos(m1) * (R1 + 44), pC[1] + Math.sin(m1) * (R1 + 44) + 18, T.luch + .2, t, { size: 54, w: 500, col: ink, a: na, track: 0, dy: 12 });
        atext('β', pC[0] + Math.cos(m2) * (R2 + 44), pC[1] + Math.sin(m2) * (R2 + 44) + 18, T.izg + .3, t, { size: 54, w: 500, col: ink, a: na, track: 0, dy: 12 });
      }
    } else {
      // поверхность воды: выноска к излому ложки
      const k = P(t, T.slom, .6);
      const [sx, sy] = project(cam, SP_S[0] + .09, WL, SP_S[2] + .3);
      const pd = P(t, T.slom + .35, .3), pl = P(t, T.slom + .45, .45);
      if (pd > 0) {
        g.save(); g.globalAlpha = pd; g.fillStyle = ink; g.beginPath(); g.arc(sx, sy, 5, 0, TAU); g.fill(); g.restore();
        line(sx, sy, lerp(sx, 860, pl), sy, ink, .7, 2);
      }
      atext('граница сред', 870, sy + 14, T.slom + .55, t, { size: 40, w: 500, col: sub, align: 'left', track: 0, dy: 14 });
      void k;
    }
    // вдох в чёрный на смене блока на стакан
    const dip = bump(t, T.cut, .28);
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = '#000'; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  },

  sfx(add) {
    const T = TT();
    add(T.pier, 'bloom', .28, .8);
    add(T.put, 'shimmer', .2, 1);
    add(T.beam - 1.5, 'riser', .18);
    add(T.beam, 'impact', .3, 1.1);
    add(T.vozd, 'tick', .14, 1.1);
    add(T.dv, 'chime', .22, .9);
    add(T.gran + .1, 'click', .2, 1);
    add(T.cut, 'whoosh', .25, .8);
    add(T.lozh, 'thud', .22, .8);
    add(T.slom, 'crack', .14, 1.2);
  },
});
