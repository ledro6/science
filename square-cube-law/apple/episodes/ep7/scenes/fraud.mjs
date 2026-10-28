// FRAUD (36.9 – 44.1 с), белый фон.
// Два керамических «отчёта» стоят рядом, на каждом — рельефная диаграмма первых цифр из графитовых столбиков:
// слева настоящий (кривая Бенфорда), справа придуманный (почти ровные столбики).
// f2 — к придуманному подплывает лупа; на «ровно» поверх ложится ожидаемая кривая пунктиром,
//      на «сразу видно» — красная метка-подозрение: линия по ровным вершинам и значок «!».
import { defineScene, makeStage, project, atext, atextWords, line, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, eSpring, FONT } from '../../../engine.mjs';
import { ctx, BEN, makeBar, rbox, frame, keys, polyline, smoothPts, bump } from './kit.mjs';

const PW = 1.85, PH = 2.45, PX = 1.06, TILT = -.07;
const FAKE = [.118, .104, .113, .108, .116, .106, .112, .103, .12];
const HK = 4.3, BASE = -.78, BXL = j => (j - 4) * .182;     // столбики в координатах панели

function TT() {
  return {
    na: Wd('f1', 'На'), lov: Wd('f1', 'ловят'), mosh: Wd('f1', 'мошенников'),
    prid: Wd('f2', 'Придуманные'), otch: Wd('f2', 'отчётах'), sl: Wd('f2', 'слишком'), rov: Wd('f2', 'ровно'), srazu: Wd('f2', 'сразу'), vid: Wd('f2', 'видно'),
  };
}

defineScene('fraud', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .55 });
    stage.camera.far = 200; stage.camera.updateProjectionMatrix();
    const T = TT();
    const paper = MAT.ceramicWhite();
    const ink = new THREE.MeshPhysicalMaterial({ color: '#2C2C2E', roughness: .35, clearcoat: .6, clearcoatRoughness: .2 });
    const lineMat = new THREE.MeshPhysicalMaterial({ color: '#C7C7CC', roughness: .5 });
    const panels = [0, 1].map(k => {
      const g = new THREE.Group();
      const slab = new THREE.Mesh(rbox(PW, PH, .06, .05, 2), paper); slab.castShadow = slab.receiveShadow = true;
      g.add(slab);
      // строки «текста» отчёта
      [[.9, .95], [.76, .6], [.62, .75]].forEach(([y, w], i) => {
        const m = new THREE.Mesh(rbox(PW * w * (i ? .62 : .5), i ? .05 : .08, .02, .01, 1), i ? lineMat : ink);
        m.position.set(-PW / 2 + .2 + PW * w * (i ? .62 : .5) / 2, y, .035); g.add(m);
      });
      const bars = (k ? FAKE : BEN).map((v, j) => { const b = makeBar(.13, .07, ink, .025); b.position.set(BXL(j), BASE, .065); g.add(b); return b; });
      // основание-ось
      const ax = new THREE.Mesh(rbox(PW - .3, .018, .02, .006, 1), lineMat); ax.position.set(0, BASE - .015, .035); g.add(ax);
      stage.root.add(g);
      return { g, bars, vals: k ? FAKE : BEN };
    });
    // лупа: графитовое кольцо, «стекло», ручка
    const lupa = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.4, .045, 20, 72), ink);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(.39, 64), MAT.glass(.22));
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .72, 24), ink);
    handle.position.set(.5, -.5, 0); handle.rotation.z = Math.PI / 4;
    lupa.add(ring, glass, handle);
    ring.castShadow = handle.castShadow = true;
    stage.root.add(lupa);
    return { stage, T, panels, lupa, glass };
  },

  update(t, s, st) {
    const { stage, T, panels, lupa } = st, cam = stage.camera, L = stage.lights;
    L.key.intensity = 2.2; L.hemi.intensity = 1.15; L.rimL.intensity = 1.2; L.rimR.intensity = .9;
    L.key.position.set(lerp(-3, 4, clamp((t - s.start) / 7)), 9, 7); L.key.target.position.set(0, 1, 0); L.key.target.updateMatrixWorld();
    panels.forEach((p, k) => {
      const t0 = s.start + .1 + k * .22;
      const e = eSpring(clamp((t - t0) / 1.0));
      p.g.position.set(k ? PX : -PX, PH / 2 + (1 - e) * -.5, 0);
      p.g.rotation.set(TILT, (k ? -1 : 1) * .1, 0);
      p.g.scale.setScalar(lerp(.96, 1, e));
      p.g.visible = t > t0 - .01;
      p.bars.forEach((b, j) => {
        const g = eSpring(clamp((t - (T.na + .15 + k * .25 + j * .06)) / .9));
        b.setH(Math.max(.001, p.vals[j] * HK * g)); b.visible = g > .001;
      });
    });
    // лупа подплывает к придуманному отчёту и чуть «дышит»
    const la = P(t, T.otch - .3, 1.3, eInOut);
    const hov = Math.sin((t - T.otch) * 2.2) * .03;
    lupa.visible = la > .002;
    lupa.position.set(lerp(2.9, PX + .05, la), lerp(-.2, 1.02, la) + hov * la, lerp(1.6, .42, la));
    lupa.rotation.set(lerp(-.2, -.05, la), lerp(.5, -.12, la), 0);
    // камера
    const [tx, ty, d, az, el, sy] = keys([
      [s.start, 0, 1.25, 16.8, -6, 7, 930],
      [T.prid, 0, 1.25, 16.4, 0, 7, 930],
      [T.rov, .35, 1.2, 15.6, 6, 6, 930],
      [s.end, .45, 1.2, 15.2, 9, 6, 930],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, panels } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    // заголовки
    atextWords('Ловят мошенников', 540, 340, T.lov - .05, t, { size: 96, w: 600, col: ink, track: -.03, stagger: .14, out: T.sl - .25 });
    atextWords('Слишком ровно', 540, 340, T.sl, t, { size: 96, w: 600, col: ink, track: -.03, stagger: .14 });
    // подписи под отчётами
    const lab = (k, txt, t0) => {
      panels[k].g.updateMatrixWorld();
      const v = panels[k].g.localToWorld(new THREE.Vector3(0, -PH / 2, .1));
      const [x, y] = project(cam, v.x, v.y, v.z);
      atext(txt, x, y + 62, t0, t, { size: 40, w: 600, col: k ? ink : sub, track: -.01, dy: 14 });
    };
    lab(0, 'Настоящий отчёт', T.mosh - .1);
    lab(1, 'Придуманный', T.prid);
    // вершины столбиков (экран)
    const tops = k => panels[k].vals.map((v, j) => {
      const w = panels[k].g.localToWorld(new THREE.Vector3(BXL(j), BASE + v * HK + .09, .08));
      return project(cam, w.x, w.y, w.z);
    });
    panels.forEach(p => p.g.updateMatrixWorld());
    // настоящий: кривая Бенфорда по вершинам
    polyline(smoothPts(tops(0), 8), P(t, T.mosh + .3, 1.0, eInOut), sub, .9, 3);
    // придуманный: ожидаемая кривая пунктиром
    {
      const exp = BEN.map((v, j) => { const w = panels[1].g.localToWorld(new THREE.Vector3(BXL(j), BASE + v * HK + .09, .08)); return project(cam, w.x, w.y, w.z); });
      polyline(smoothPts(exp, 8), P(t, T.rov - .05, .9, eInOut), sub, .85, 3, [10, 9]);
    }
    // красная метка-подозрение: линия по ровным вершинам + значок «!»
    {
      const tp = tops(1), p = P(t, T.srazu - .05, .55, eInOut);
      const yAvg = tp.reduce((A, q) => A + q[1], 0) / tp.length;
      const x0 = tp[0][0] - 26, x1 = tp[8][0] + 26;
      if (p > 0) line(x0, yAvg, lerp(x0, x1, p), yAvg, acc, 1, 5);
      const bp = eSpring(clamp((t - T.srazu - .25) / .6));
      if (bp > .003) {
        const cx = x1 + 6, cy = yAvg - 58, r = 30 * lerp(.6, 1, bp);
        g.save(); g.globalAlpha = bp; g.fillStyle = acc; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
        g.fillStyle = '#FFFFFF'; g.font = `700 ${Math.round(40 * lerp(.6, 1, bp))}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('!', cx, cy + 2); g.restore();
      }
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .15, 'thud', .25, .8);
    add(T.na + .3, 'click', .14);
    add(T.lov, 'chime', .2, .9);
    add(T.otch - .3, 'whoosh', .3, .9);
    add(T.rov, 'tick', .18);
    add(T.srazu - 1.5, 'riser', .2);
    add(T.srazu, 'impact', .32, 1);
  },
});
