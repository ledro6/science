// WAVES (8.0 – 20.2 с), светлый фон. Вид сверху-сбоку: та же скорая, кольца волн давления на полу (графит).
// w1 — машина стоит: кольца ровные; «Волны давления» + ряд частиц воздуха, которые сгущаются и разрежаются;
//      на «Машина» скорая трогается, кольца смещаются по ходу: спереди сжимаются (размер «λ короче»).
// w2 — сзади растягиваются (размер «λ длиннее»); на «Короче» — две осциллограммы: спереди частая (выше), сзади редкая (ниже).
import { defineScene, makeStage, project, atext, dot, line, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeAmbulance, makeWaveField, rings, rampX, frame, keys, sine, dim, ctx, TAU } from './kit.mjs';

function TT() {
  return {
    zv: Wd('w1', 'Звук'), vol: Wd('w1', 'волн'), dav: Wd('w1', 'давления'), mash: Wd('w1', 'Машина'), dog: Wd('w1', 'догоняет'),
    sob: Wd('w1', 'собственные'), spe: Wd('w1', 'спереди'), szh: Wd('w1', 'сжимаются'),
    sza: Wd('w2', 'сзади'), rast: Wd('w2', 'растягиваются'), kor: Wd('w2', 'Короче'), vys: Wd('w2', 'выше'), zvuk: Wd('w2', 'звук'),
  };
}
const V = 1.9, CS = 3.4, DT = .5, CK = .62, SIREN = -.45 * CK;
const go = T => T.mash - .1;
const carX = (t, T) => rampX(t, go(T), 1.8, V);
const MARK_N = 26, MARK_SP = 3.2;

defineScene('waves', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const T = TT();
    const car = makeAmbulance({ dark: false });
    const field = makeWaveField(48, { col: '#1D1D1F', lw: 1.8, fade: .5 });
    const mm = new THREE.MeshStandardMaterial({ color: '#D2D2D7', roughness: .7 });
    const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, .006, .09), mm, MARK_N * 2);
    const _m = new THREE.Matrix4();
    for (let side = 0; side < 2; side++) for (let i = 0; i < MARK_N; i++) {
      _m.makeTranslation(-30 + i * MARK_SP, .003, side ? 1.6 : -1.6); marks.setMatrixAt(side * MARK_N + i, _m);
    }
    stage.root.add(car, field, marks);
    return { stage, T, car, field };
  },

  update(t, s, st) {
    const { stage, T, car, field } = st, cam = stage.camera, L = stage.lights;
    const x = carX(t, T);
    L.key.position.set(x + 3, 9, 7); L.key.target.position.set(x, 0, 0); L.key.target.updateMatrixWorld();
    car.position.set(x, 0, 0); car.scale.setScalar(CK); car.spin(x / (.36 * CK)); car.flash(t, 1);
    const R = rings(t, τ => carX(τ, T) + SIREN, { dt: DT, c: CS, maxAge: 3.8, a: .9 });
    field.position.x = x;
    field.set(R, P(t, s.start + .1, .6), x, 0);
    // камера: вид сверху-сбоку, едет за машиной; к осциллограммам — чуть выше и дальше
    const [d, el, sy, ox] = keys([[s.start, 30, 50, 960, 0], [T.dog, 34, 54, 980, .4], [T.spe, 36, 55, 990, 1.2], [T.sza - .2, 36, 55, 990, 1.2], [T.rast + .2, 38, 55, 990, -.8], [T.kor - .3, 40, 56, 1010, -.6], [s.end, 41, 58, 1040, -.4]], t, eInOut);
    frame(cam, [x + ox, 0, 0], d, -2 + Math.sin((t - s.start) * .25) * 2, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const x = carX(t, T), xs = x + SIREN;
    // w1: заголовок и частицы воздуха
    const o1 = T.mash - .3;
    atext('Волны давления', 540, 430, T.vol - .05, t, { size: 104, w: 600, col: ink, track: -.03, out: o1 });
    const aP = P(t, T.dav - .1, .7) * (1 - P(t, o1, .35, eIn));
    if (aP > .003) {
      const n = 40;
      for (let r = 0; r < 4; r++) for (let i = 0; i < n; i++) {
        const x0 = lerp(150, 930, (i + (r % 2) * .5) / n);
        const xx = x0 + 13 * Math.sin(TAU * x0 / 195 - (t - s.start) * 4.5);
        const e = clamp(Math.min(i, n - 1 - i) / 5);
        dot(xx, 520 + r * 24, 4.5, ink, aP * (.2 + .8 * e) * P(t, T.dav - .1 + i * .008, .5));
      }
      atext('воздух то сгущается, то разрежается', 540, 660, T.dav + .3, t, { size: 34, w: 500, col: sub, track: -.005, out: o1, dy: 14 });
    }
    // заголовки движения
    atext('Догоняет свои волны', 540, 430, T.dog - .05, t, { size: 88, w: 600, col: ink, track: -.03, out: T.sza - .35 });
    atext('Сзади растягиваются', 540, 430, T.sza - .05, t, { size: 88, w: 600, col: ink, track: -.03, out: T.kor - .35 });
    // размеры длины волны: прямо на оси движения, в установившемся режиме
    const lf = (CS - V) * DT, lb = (CS + V) * DT;
    const aF = P(t, T.spe - .1, .5) * (1 - P(t, T.kor - .3, .35, eIn));
    if (aF > .003) {
      const a0 = 2.35 * CK + .45, [x1, y1] = project(cam, x + a0, 0, 0), [x2, y2] = project(cam, x + a0 + lf, 0, 0);
      const yy = y1 - 70;
      line(x1, y1, x1, yy - 12, ink, aF * .5, 2); line(x2, y2, x2, yy - 12, ink, aF * .5, 2);
      dim(x1, yy, x2, yy, aF, ink, 10);
      atext('λ короче', Math.min((x1 + x2) / 2 + 30, 930 - 100), yy - 34, T.szh - .05, t, { size: 46, w: 600, col: ink, track: -.01, dy: 14, out: T.kor - .3 });
    }
    const aB = P(t, T.sza - .05, .5) * (1 - P(t, T.kor - .3, .35, eIn));
    if (aB > .003) {
      const a0 = 2.3 * CK + .2, [x1, y1] = project(cam, xs - a0 - lb, 0, 0), [x2, y2] = project(cam, xs - a0, 0, 0);
      const yy = y1 - 70;
      line(x1, y1, x1, yy - 12, ink, aB * .5, 2); line(x2, y2, x2, yy - 12, ink, aB * .5, 2);
      dim(x1, yy, x2, yy, aB, ink, 10);
      atext('λ длиннее', (x1 + x2) / 2, yy - 34, T.rast - .05, t, { size: 46, w: 600, col: ink, track: -.01, dy: 14, out: T.kor - .3 });
    }
    // w2: две осциллограммы
    const aO = P(t, T.kor - .1, .6);
    if (aO > .003) {
      const ph = (t - s.start) * 22;
      const hiA = lerp(.55, 1, P(t, T.vys - .05, .4)), loA = lerp(.55, 1, P(t, T.zvuk - .05, .4)) * .8 + .2 * hiA;
      atext('спереди', 150, 360, T.kor - .1, t, { size: 40, w: 500, col: sub, align: 'left', track: -.005, dy: 14 });
      sine(150, 930, 440, 34, 34, ph, ink, aO * hiA, 3, P(t, T.kor - .1, .8, eApple));
      atext('выше', 930, 360, T.vys - .05, t, { size: 40, w: 600, col: ink, align: 'right', track: -.005, dy: 14 });
      atext('сзади', 150, 560, T.kor + .15, t, { size: 40, w: 500, col: sub, align: 'left', track: -.005, dy: 14 });
      sine(150, 930, 640, 34, 98, ph, ink, aO * loA, 3, P(t, T.kor + .15, .8, eApple));
      atext('ниже', 930, 560, T.zvuk - .05, t, { size: 40, w: 600, col: ink, align: 'right', track: -.005, dy: 14 });
    }
    // пол уходит в фон к низу кадра (без жёсткой кромки под субтитрами)
    const g = ctx(), gr = g.createLinearGradient(0, 1220, 0, 1400);
    gr.addColorStop(0, 'rgba(245,245,247,0)'); gr.addColorStop(1, 'rgba(245,245,247,1)');
    g.fillStyle = gr; g.fillRect(0, 1220, 1080, 700);
  },

  sfx(add) {
    const T = TT();
    add(T.vol - .1, 'bloom', .24, .9);
    add(T.dav, 'swell', .2, .8);
    add(T.mash, 'whoosh', .26, .8);
    add(T.szh, 'tick', .2, 1.2);
    add(T.rast, 'tick', .2, .85);
    add(T.kor, 'chime', .2, 1.1);
    add(T.zvuk, 'chime', .2, .9);
  },
});
