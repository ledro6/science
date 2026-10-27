// LIMIT (46.7 – 56.2 с), белый фон.
// r1: настоящий лист A4 складывается 7 раз: половина откидывается на петле поверх другой, оси чередуются,
//     пачка становится короче и толще (полоски торца = листы); восьмой сгиб не идёт, половина лишь приподнимается.
// r2: рекорд 12 сгибов: пачка из ленты, и сама лента разматывается от пачки к горизонту, длиннее километра.
import {
  defineScene, makeStage, atext, P, Wd, C, E, THREE, clamp, lerp,
  eApple, eInOut, eIn, eEase, W, H,
} from '../../../engine.mjs';
import * as ENG from '../../../engine.mjs';
import { frame, paperTexture, stackMaterials, smooth } from './_lib.mjs';

const ctx = () => ENG.g;
const U = 10;                                  // единиц сцены на метр
let T = null;
function TT() {
  if (T) return T;
  T = {
    pravda: Wd('r1', 'Правда'), sem: Wd('r1', 'семи-восьми'), ne: Wd('r1', 'не'), sloz: Wd('r1', 'сложить'),
    rek: Wd('r2', 'Рекорд'), dven: Wd('r2', 'двенадцать'), sgib: Wd('r2', 'сгибов'), dlya: Wd('r2', 'Для'),
    bum: Wd('r2', 'бумага'), dlin: Wd('r2', 'длиной'), bol: Wd('r2', 'больше'), km: Wd('r2', 'километра'),
  };
  T.F = [...Array(7)].map((_, i) => 47.0 + .37 * i);   // начала сгибов (последний заканчивается ≈ 49.6)
  T.FD = .36;
  T.fail = T.F[6] + T.FD + .06;
  T.B = T.rek + .05;                                      // смена на рекорд (под «вдохом»)
  return T;
}
// состояния пачки до каждого сгиба: размеры a (x), b (z), толщина h, центр cx, cz, ось сгиба
const ST = (() => {
  const s = [{ a: .297 * U, b: .21 * U, h: 1e-4 * U, cx: 0, cz: 0 }];
  for (let i = 0; i < 8; i++) {
    const c = s[i], ax = c.a >= c.b ? 'x' : 'z'; c.ax = ax;
    s.push(ax === 'x' ? { a: c.a / 2, b: c.b, h: c.h * 2, cx: c.cx - c.a / 4, cz: c.cz } : { a: c.a, b: c.b / 2, h: c.h * 2, cx: c.cx, cz: c.cz - c.b / 4 });
  }
  return s;
})();

defineScene('limit', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .6 });
    const cam = stage.camera; cam.near = .02; cam.far = 30000; cam.updateProjectionMatrix();
    const tex = paperTexture(THREE, true), mats = stackMaterials(THREE, tex);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const half = new THREE.Mesh(geo, mats.list), flap = new THREE.Mesh(geo, mats.list);
    const pivot = new THREE.Group(); pivot.add(flap);
    // рекорд: пачка из ленты + лента к горизонту
    const tex2 = paperTexture(THREE, true); tex2.repeat.set(1, 4096);
    const m2 = stackMaterials(THREE, tex2);
    const packet = new THREE.Mesh(geo, m2.list);
    const ribGeo = new THREE.BoxGeometry(1, 1, 1); ribGeo.translate(-.5, .5, 0);
    const ribbon = new THREE.Mesh(ribGeo, new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .75 }));
    const ribEdge = new THREE.LineSegments(new THREE.EdgesGeometry(ribGeo), new THREE.LineBasicMaterial({ color: '#1D1D1F', transparent: true, opacity: .35 }));
    ribbon.add(ribEdge);
    [half, flap, packet, ribbon].forEach(m => { m.castShadow = true; m.receiveShadow = true; });
    stage.root.add(half, pivot, packet, ribbon);
    return { stage, tex, half, flap, pivot, packet, ribbon };
  },

  update(t, s, st) {
    const T = TT(), { stage, tex, half, flap, pivot, packet, ribbon } = st, cam = stage.camera;
    const L = stage.lights;
    L.key.position.set(3, 9, 6); L.key.intensity = 2.2; L.hemi.intensity = 1.1; L.rimL.intensity = 1.2; L.rimR.intensity = .9;
    const A = t < T.B;
    half.visible = pivot.visible = A; packet.visible = ribbon.visible = !A;
    if (A) {
      // ---- какой сгиб идёт сейчас ----
      let i = 0, ph = 0;
      for (let k = 0; k < 7; k++) if (t >= T.F[k]) { i = k; ph = eInOut(clamp((t - T.F[k]) / T.FD)); }
      let shake = 0;
      if (t >= T.fail) {
        // восьмой сгиб: половина едва приподнимается и опускается, пачка дрожит
        i = 7; const u = clamp((t - T.fail) / .75);
        ph = .16 * Math.sin(Math.PI * Math.min(1, u * 1.2)) * (u < .83 ? 1 : 0);
        shake = .004 * Math.sin(t * 70) * Math.sin(Math.PI * u);
      }
      const c = ST[i], n = ST[i + 1];
      tex.repeat.set(1, Math.pow(2, i));
      const phi = ph * Math.PI;
      pivot.rotation.set(0, 0, 0); pivot.position.set(c.cx + shake, c.h, c.cz);
      if (c.ax === 'x') {
        half.position.set(c.cx - c.a / 4 + shake, c.h / 2, c.cz); half.scale.set(c.a / 2, c.h, c.b);
        flap.position.set(c.a / 4, -c.h / 2, 0); flap.scale.set(c.a / 2, c.h, c.b);
        pivot.rotation.z = phi;
      } else {
        half.position.set(c.cx + shake, c.h / 2, c.cz - c.b / 4); half.scale.set(c.a, c.h, c.b / 2);
        flap.position.set(0, -c.h / 2, c.b / 4); flap.scale.set(c.a, c.h, c.b / 2);
        pivot.rotation.x = -phi;
      }
      // камера следует за центром пачки и приближается по мере её сжатия
      const k = i < 7 ? ph : 0, mix = (p, q) => lerp(p, q, k);
      const ext = mix(Math.max(c.a, c.b), Math.max(n.a, n.b)) + mix(c.h, n.h) * 2.2;
      const tg = [mix(c.cx, n.cx), mix(c.h, n.h) * .6, mix(c.cz, n.cz)];
      frame(cam, tg, ext * 6.2, 28 + (t - s.start) * 5, lerp(48, 30, clamp((t - s.start) / 3.5)), 540, 960);
    } else {
      // ---- рекорд: пачка 12 сгибов (лента 1,2 км → 29 см, толщина 41 см) и лента к горизонту ----
      const pa = P(t, T.B, .9, eApple);
      packet.scale.set(2.93, 4.1 * Math.max(.001, pa), 1.0); packet.position.set(0, 4.1 * pa / 2, 0);
      const ru = P(t, T.dlya, 2.6, eInOut);
      const Lr = Math.pow(12001, ru) - 1;
      ribbon.visible = Lr > .01;
      ribbon.scale.set(Math.max(.001, Lr), .025, 1.0); ribbon.position.set(-1.465, 0, 0);
      const cm = P(t, T.bum - .1, 1.7, eInOut);
      frame(cam, [0, 2, 0], 34, 32 + (t - T.B) * 3, 12, 540, 1110);
      if (cm > 0) {
        // кран над лентой: камера уходит к пачке и смотрит вдоль ленты к горизонту
        const p0 = cam.position.clone(), p1 = new THREE.Vector3(-3.5, 3.4, 2.4);
        const q0 = new THREE.Vector3(0, 2, 0), q1 = new THREE.Vector3(-400, 0, -6);
        cam.position.lerpVectors(p0, p1, cm); cam.lookAt(q0.lerp(q1, Math.pow(cm, 1.6)));
        cam.setViewOffset(W, H, 0, 960 - lerp(1110, 760, cm), W, H); cam.updateMatrixWorld();
      }
    }
  },

  draw2d(t, s, st) {
    const T = TT(), { stage } = st, g = ctx(), ink = stage.ink, sub = stage.sub;
    // счётчик сгибов
    for (let k = 0; k < 7; k++) {
      const t0 = T.F[k] + T.FD * .6, nx = k < 6 ? T.F[k + 1] + T.FD * .6 - .12 : T.B - .3;
      atext(String(k + 1), 540, 560, t0, t, { size: 300, w: 700, col: ink, track: -.045, blur: 8, scale0: 1.05, dur: .3, dy: 18, out: nx, outDur: .12 });
    }
    atext('предел руками', 540, 640, T.sem, t, { size: 46, w: 500, col: sub, track: -.005, out: T.B - .3 });
    // рекорд
    atext('12', 540, 560, T.dven - .05, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.bol - .3 });
    atext('сгибов, рекорд', 540, 640, T.sgib, t, { size: 46, w: 500, col: sub, track: -.005, out: T.bol - .3 });
    atext('> 1 км', 540, 560, T.bol, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('длина бумаги', 540, 640, T.km, t, { size: 46, w: 500, col: sub, track: -.005 });
    // «вдох» в белый на смене сцены
    const dip = t < T.B ? P(t, T.B - .3, .3, eIn) : 1 - P(t, T.B, .45, eEase);
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = stage.bgc; g.fillRect(0, 0, W, H); g.restore(); }
  },

  sfx(add) {
    const T = TT();
    T.F.forEach((f, k) => add(f + T.FD * .7, 'click', .16 + k * .02, 1 + k * .05));
    add(T.fail + .1, 'thud', .3, .6);
    add(T.B, 'whoosh', .3, .8);
    add(T.dven, 'chime', .26);
    add(T.bum - .3, 'swell', .3, .8);
    add(T.bol - 1.5, 'riser', .22);
    add(T.bol, 'impact', .28, .9);
  },
});
