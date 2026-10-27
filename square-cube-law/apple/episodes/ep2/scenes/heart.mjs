// HEART (11.25 – 21.42 с), белый фон — «страница Apple Health».
// h1: керамическое сердце мыши крупно, бьётся 600 уд/мин (10 Гц), под ним ЭКГ-лента; на «слона» — отъезд:
//     два сердца рядом (сердце слона крупнее, бьётся 30 уд/мин — в 20 раз реже), «600» и «30».
// h2: сердце слона уходит, сердце мыши в центре «сжигает энергию» — поток частиц; «×20 энергии на килограмм».
import {
  defineScene, makeStage, project, atext, line, dot, measure, P, Wd, WdE, C, E, rng, clamp, lerp,
  eApple, eIn, eInOut, eEase, eSpring, THREE, MAT, C_GRAY,
} from '../../../engine.mjs';
import * as ENG from '../../../engine.mjs';
import { frame, heartGeometry, beat, ecg, smooth } from '../lib.mjs';

const HZ_M = 10, HZ_E = .5;   // 600 и 30 уд/мин — реальное соотношение 20:1
function TT() {
  return {
    mouse: Wd('h1', 'мыши'), b600: Wd('h1', 'шестьсот'), min: Wd('h1', 'минуту'),
    ele: Wd('h1', 'слона'), b30: Wd('h1', 'тридцати'),
    small: Wd('h2', 'Маленький'), fast: Wd('h2', 'быстро'), burn: Wd('h2', 'сжигает'), energy: Wd('h2', 'энергию'), speed: Wd('h2', 'скоростью'),
  };
}
const NP = 160;

defineScene('heart', {
  setup(s) {
    const stage = makeStage({ bg: 'white', shadow: .45 });
    const geo = heartGeometry(48);
    const mk = () => new THREE.MeshPhysicalMaterial({ color: '#F4F3F1', roughness: .38, clearcoat: .6, clearcoatRoughness: .18, transparent: true });
    const hm = new THREE.Mesh(geo, mk()), he = new THREE.Mesh(geo, mk());
    hm.castShadow = he.castShadow = true;
    stage.root.add(hm, he);
    // частицы энергии
    const parts = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), MAT.graphite(), NP);
    parts.frustumCulled = false; stage.root.add(parts);
    const R = rng(21), pd = [];
    for (let i = 0; i < NP; i++) {
      const u = R() * 2 - 1, a = R() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      pd.push({ d: new THREE.Vector3(r * Math.cos(a), u * .8, r * Math.sin(a) * .6).normalize(), o: R(), sp: .8 + R() * .9, s: .018 + R() * .022 });
    }
    return { stage, hm, he, parts, pd, T: TT(), m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), sv: new THREE.Vector3() };
  },

  update(t, s, st) {
    const { stage, hm, he, parts, pd, T } = st, cam = stage.camera;
    // фазы: A — сердце мыши крупно; B — пара; C — снова мышь, энергия
    const kB = P(t, T.ele - .35, 1.2, eInOut), kC = P(t, T.small - .1, 1.2, eInOut);
    // сердце мыши
    const inM = P(t, s.start + .15, 1.1, eApple);
    const xm = lerp(lerp(0, -.86, kB), 0, kC), sm = lerp(lerp(.82, .3, kB), .62, kC);
    const bm = beat(t * HZ_M) * smooth(T.mouse - .2, T.mouse + .2, t);
    hm.position.set(xm, lerp(1.0, 1.25, inM) + lerp(0, -.15, kB) * (1 - kC) - .3 * kC, 0);
    hm.scale.setScalar(sm * (1 + .075 * bm) * lerp(.9, 1, inM));
    hm.rotation.set(.08, .45 * Math.sin((t - 11) * .55) - .15, .05 * Math.sin(t * .7));
    hm.material.opacity = inM;
    // сердце слона: в 2.4 раза крупнее, удар раз в 2 с
    const inE = P(t, T.ele - .1, 1.1, eApple), outE = P(t, T.small - .1, .9, eInOut);
    he.visible = inE > .003 && outE < .999;
    const be = beat((t - T.b30 + .12) * HZ_E);
    he.position.set(.86 + 2.4 * outE, lerp(.95, 1.1, inE), 0);
    he.scale.setScalar(.64 * (1 + .1 * be) * lerp(.9, 1, inE));
    he.rotation.set(.08, .4 * Math.sin((t - 14) * .45) + .2, -.04);
    he.material.opacity = inE * (1 - outE);
    // свет: ключ слегка «дышит» вместе с ударом слона
    stage.lights.key.intensity = 2.2;
    // частицы энергии — непрерывный поток из сердца мыши
    const pk = P(t, T.burn - .1, .8);
    parts.visible = pk > .003;
    if (parts.visible) {
      const life = .9;
      pd.forEach((p, i) => {
        const age = ((t - T.burn) / life * p.sp + p.o) % 1;
        const a = age < 0 ? age + 1 : age;
        const r = .5 + a * 1.7;
        st.v.copy(p.d).multiplyScalar(r * sm / .62).add(hm.position);
        const sc = p.s * pk * Math.sin(Math.PI * a) * 1.2;
        st.m4.compose(st.v, st.q, st.sv.setScalar(Math.max(sc, 1e-4)));
        parts.setMatrixAt(i, st.m4);
      });
      parts.instanceMatrix.needsUpdate = true;
    }
    // камера: почти фронтально, медленный дрейф
    frame(cam, [0, 1.05, 0], 14, lerp(-6, 6, clamp((t - s.start) / 10)), 6, 540, 880);
  },

  draw2d(t, s, st) {
    const { stage, hm, he, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub, g = ENG.g;
    const kB = P(t, T.ele - .35, 1.2, eInOut), kC = P(t, T.small - .1, 1.2, eInOut);
    // ---- цифры ----
    const oB = 1 - P(t, T.small - .2, .4, eIn);
    // «600»: крупно в центре → левая колонка
    const x6 = lerp(540, 290, kB), s6 = lerp(250, 190, kB), y6 = lerp(500, 470, kB);
    atext('Мышь', x6, y6 - s6 * .86, T.mouse - .05, t, { size: 44, w: 600, col: sub, track: 0, dy: 14, out: T.small - .2 });
    atext('600', x6, y6, T.b600, t, { size: s6, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.small - .2 });
    atext('уд/мин', x6, y6 + s6 * .26, T.min - .05, t, { size: 42, w: 500, col: sub, track: 0, out: T.small - .2 });
    // «30» — правая колонка
    atext('Слон', 790, 470 - 190 * .86, T.ele + .05, t, { size: 44, w: 600, col: sub, track: 0, dy: 14, out: T.small - .2 });
    atext('30', 790, 470, T.b30, t, { size: 190, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.small - .2 });
    atext('уд/мин', 790, 470 + 190 * .26, T.b30 + .25, t, { size: 42, w: 500, col: sub, track: 0, out: T.small - .2 });
    // вертикальный разделитель колонок
    line(540, 300, 540, 560, sub, .35 * P(t, T.ele + .2, .6) * oB, 2);

    // ---- ЭКГ-ленты (окно 2.5 с; передний край — точка) ----
    const trace = (x0, x1, y, hz, ph0, a) => {
      if (a <= .003) return;
      const win = 2.5, N = Math.round((x1 - x0) / 1.5);
      g.save(); g.globalAlpha = a; g.strokeStyle = ink; g.lineWidth = 2.5; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
      for (let i = 0; i <= N; i++) {
        const tt = t - win + win * i / N, x = lerp(x0, x1, i / N);
        const yy = y - 64 * ecg((tt - ph0) * hz);
        // хвост ленты тает
        i ? g.lineTo(x, yy) : g.moveTo(x, yy);
      }
      g.stroke();
      const grd = g.createLinearGradient(x0, 0, x0 + 140, 0);
      grd.addColorStop(0, stage.bgc); grd.addColorStop(1, 'rgba(245,245,247,0)');
      g.fillStyle = grd; g.fillRect(x0 - 4, y - 90, 148, 130);
      g.restore();
      dot(x1, y - 64 * ecg((t - ph0) * hz), 6, ink, a);
    };
    const aM = P(t, T.b600 + .2, .7);
    const yT = 1215;
    // лента мыши: во всю ширину → левая колонка → снова во всю ширину
    const mx0 = 110, mx1 = lerp(lerp(930, 470, kB), 930, kC);
    trace(mx0, mx1, yT, HZ_M, 0, aM);
    trace(610, 930, yT, HZ_E, T.b30 - .12 - .3 / HZ_E, P(t, T.b30 + .1, .7) * oB);

    // ---- кольцо-волна на ударе слона ----
    if (he.visible) {
      const [ex, ey] = project(cam, he.position.x, he.position.y, 0);
      const ph = ((t - T.b30 + .12) * HZ_E) % 1, a = he.material.opacity * (1 - ph) * .5 * P(t, T.b30 - .2, .4);
      if (ph > 0 && a > .003) { g.save(); g.globalAlpha = a; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.arc(ex, ey, 110 + ph * 120, 0, 7); g.stroke(); g.restore(); }
    }

    // ---- h2: «живёт быстро» → «×20 энергии на килограмм» ----
    atext('Живёт быстро', 540, 470, T.small + .25, t, { size: 120, w: 600, col: ink, track: -.03, out: T.burn - .25, outDur: .35 });
    atext('×20', 540, 500, T.energy, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('энергии на килограмм', 540, 574, T.energy + .3, t, { size: 44, w: 500, col: sub, track: -.005 });
    atext('чем у слона', 540, 628, T.speed, t, { size: 44, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(T.mouse - .2, 'thud', .3, 1.2);
    add(T.b600, 'chime', .25, 1.1);
    add(T.ele - .3, 'whoosh', .3, .8);
    add(T.b30 + .12, 'thud', .4, .6);
    add(T.b30 + 2.12, 'thud', .3, .6);
    add(T.small - .1, 'whoosh', .25, 1.1);
    add(T.burn, 'shimmer', .3);
    add(T.energy, 'chime', .3);
  },
});
