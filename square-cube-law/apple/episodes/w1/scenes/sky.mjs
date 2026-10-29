// SKY (11.17 – 20.135 с), светлый фон — «страница продукта».
// s1 — горизонт: графитовые силуэты города, над ними керамическая Луна; пунктирное кольцо «сейчас» остаётся
//      на месте, а Луна вырастает вдвое по диаметру: «×2 шире», «×4 ярче»;
// s2 — затмение: Луна отходит, в центре проявляется Солнце (того же видимого размера, что Луна сейчас),
//      большая Луна наплывает и закрывает его целиком, вокруг — корона.
import { defineScene, makeStage, project, atext, atextWords, line, P, Wd, E, THREE, clamp, lerp, eApple, eInOut, eIn, eSpring, rng } from '../../../engine.mjs';
import { ctx, makeMoon, frame, circle, screenR, roundedBoxGeo } from './kit.mjs';

const R0 = .36, MY = 1.75;                               // радиус Луны «сейчас», высота над горизонтом
function TT() {
  return {
    neb: Wd('s1', 'небо'), lun: Wd('s1', 'Луна'), vd: Wd('s1', 'вдвое'), sh: Wd('s1', 'шире'), ch: Wd('s1', 'четыре'), yar: Wd('s1', 'ярче'),
    sol: Wd('s2', 'Солнечные'), zat: Wd('s2', 'затмения'), chash: Wd('s2', 'чаще'), dol: Wd('s2', 'дольше'),
  };
}
// Солнце: белый диск с тонким серым ободом; корона — отдельная плоскость с лучами
function sunTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(110,110,115,.9)'; g.lineWidth = 5; g.beginPath(); g.arc(256, 256, 248, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function coronaTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d'), R = rng(5), cx = 512, r0 = 170;
  const gr = g.createRadialGradient(cx, cx, r0 * .95, cx, cx, 500);
  gr.addColorStop(0, 'rgba(29,29,31,.34)'); gr.addColorStop(.25, 'rgba(29,29,31,.12)'); gr.addColorStop(1, 'rgba(29,29,31,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  g.lineCap = 'round';
  for (let i = 0; i < 140; i++) {
    const a = R() * Math.PI * 2, l = r0 * (1.25 + Math.pow(R(), 2) * 1.6);
    g.strokeStyle = `rgba(29,29,31,${(.06 + R() * .14).toFixed(3)})`; g.lineWidth = 1 + R() * 2.5;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cx + Math.sin(a) * r0);
    g.quadraticCurveTo(cx + Math.cos(a + .05) * (r0 + l) * .6, cx + Math.sin(a + .05) * (r0 + l) * .6, cx + Math.cos(a + (R() - .5) * .12) * (r0 + l), cx + Math.sin(a + (R() - .5) * .12) * (r0 + l));
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// силуэт города: [x, ширина, высота]
const CITY = (() => {
  const R = rng(19), out = []; let x = -2.15;
  while (x < 2.15) { const w = .14 + R() * .26, h = .08 + Math.pow(R(), 1.6) * .46; out.push([x + w / 2, w, h]); x += w + .02 + R() * .05; }
  return out;
})();

defineScene('sky', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .4 });
    const moon = makeMoon(R0);
    const mBase = moon.material.color.clone();
    moon.castShadow = false;
    const sunR = R0 * 1.0;
    const sun = new THREE.Mesh(new THREE.CircleGeometry(sunR, 64), new THREE.MeshBasicMaterial({ map: sunTexture(), transparent: true, toneMapped: false, depthWrite: false }));
    const corona = new THREE.Mesh(new THREE.PlaneGeometry(sunR * 5, sunR * 5), new THREE.MeshBasicMaterial({ map: coronaTexture(), transparent: true, depthWrite: false }));
    sun.position.set(0, MY, -1.2); corona.position.set(0, MY, -1.25);
    sun.renderOrder = 1; corona.renderOrder = 0;
    const city = new THREE.Group(), cMat = new THREE.MeshPhysicalMaterial({ color: '#3A3A3C', roughness: .45, clearcoat: .4 });
    for (const [x, w, h] of CITY) {
      const b = new THREE.Mesh(roundedBoxGeo(w, h, .3, .02), cMat);
      b.position.set(x, h / 2, 0); b.castShadow = b.receiveShadow = true; city.add(b);
    }
    stage.root.add(moon, sun, corona, city);
    return { stage, moon, mBase, sun, corona, city, sunR, T: TT() };
  },

  update(t, s, st) {
    const { stage, moon, mBase, sun, corona, T } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(2, 6, 9); L.key.intensity = 2.0; L.hemi.intensity = 1.1; L.rimL.intensity = 1.0; L.rimR.intensity = .8;
    // Луна: восходит из-за горизонта → вырастает вдвое → отходит вправо → наплывает на Солнце
    const rise = P(t, s.start + .1, 1.8, eApple);
    const k = lerp(1, 2, eSpring(clamp((t - T.vd + .05) / 1.1)));
    const away = P(t, T.sol - .15, .8, eInOut), back = P(t, T.zat - .1, 1.5, eInOut);
    const off = away * (1 - back), mx = .92 * off;
    moon.scale.setScalar(k);
    moon.position.set(mx, lerp(MY - .5, MY, rise) - .58 * off, 0);
    moon.rotation.set(.2, -.4 + (t - s.start) * .02, 0);
    // затмение: перекрытие диска Солнца → Луна повёрнута к нам ночной стороной (темнеет)
    const sunIn = P(t, T.sol + .1, .7);
    sun.visible = corona.visible = sunIn > .003;
    sun.material.opacity = sunIn;
    const dd = Math.hypot(mx, .58 * off);
    const ov = clamp(1 - (dd - (R0 * k - st.sunR)) / (st.sunR * 2 + .05));
    const dark = sunIn * ov;
    moon.material.color.copy(mBase).multiplyScalar(lerp(1, .07, dark));
    moon.material.clearcoat = .15 * (1 - dark);
    const tot = clamp((R0 * k - st.sunR - dd) / .05);
    corona.material.opacity = P(t, T.zat + .9, .9) * tot;
    // камера: длинный фокус, горизонт внизу, лёгкий дрейф
    frame(cam, [0, MY, 0], 15, lerp(-4, 4, clamp((t - s.start) / 9)), 4, 540, 780);
  },

  draw2d(t, s, st) {
    const { stage, moon, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    // горизонт
    const [hx1, hy1] = project(cam, -3, 0, .15), [hx2, hy2] = project(cam, 3, 0, .15);
    line(hx1, hy1, hx2, hy2, ink, .35 * P(t, s.start + .2, .8), 2);
    // пунктирное кольцо «сейчас» — в центре старого диска
    const c0 = [0, MY, 0], [cx, cy] = project(cam, ...c0), r0 = screenR(cam, c0, R0);
    const ring = P(t, T.vd - .1, .4) * (1 - P(t, T.sol - .3, .35, eIn));
    circle(cx, cy, r0, ink, .75 * ring, 2.5, [8, 9]);
    const mp = moon.position.toArray(), [mxs, mys] = project(cam, ...mp), rm = screenR(cam, mp, R0 * moon.scale.x);
    // подписи под диском
    const outL = T.sol - .3;
    atext('сейчас', cx, cy + r0 + 56, T.lun, t, { size: 40, w: 500, col: sub, track: 0, dy: 16, out: T.vd - .05, outDur: .25 });
    atext('вдвое ближе', mxs, mys + rm + 56, T.vd + .55, t, { size: 40, w: 500, col: sub, track: 0, dy: 16, out: outL });
    atext('сейчас', cx, cy + 6, T.vd + .7, t, { size: 34, w: 500, col: ink, a: .8, track: 0, dy: 12, out: outL });
    // ×2 / ×4
    atext('×2', 330, 420, T.vd, t, { size: 220, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: outL });
    atext('шире', 330, 495, T.sh, t, { size: 48, w: 500, col: sub, track: -.005, out: outL });
    atext('×4', 760, 420, T.ch, t, { size: 220, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: outL });
    atext('ярче', 760, 495, T.yar, t, { size: 48, w: 500, col: sub, track: -.005, out: outL });
    // затмения
    atext('Затмения', 540, 410, T.zat - .05, t, { size: 120, w: 600, col: ink, track: -.03 });
    atextWords('чаще и дольше', 540, 492, T.chash, t, { size: 52, w: 500, col: sub, track: -.005, stagger: .45 });
  },

  sfx(add) {
    const T = TT();
    add(T.neb, 'swell', .22, .8);
    add(T.vd, 'bloom', .3, .8);
    add(T.ch, 'chime', .22, 1);
    add(T.sol, 'whoosh', .25, .8);
    add(T.zat + .9, 'shimmer', .3, .8);
    add(T.chash, 'tick', .12);
  },
});
