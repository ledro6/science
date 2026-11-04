// WORLD (29,1 – 39,2 с), светлый фон.
// c1 — лестница 1 / r вырастает с чистыми кубиками; на «городов» кубики волной поворачиваются и показывают
//      силуэт города, на «компаний» — портфель, на «посещаемости» — окно сайта; сверху подпись рубрики.
// c2 — «Джордж Ципф», серым «XX век»; на «почему» — крупное «Почему?», кубики медленно поворачиваются
//      обратно к чистой грани, свет обходит лестницу.
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeStair, frame, keys, wordsAt, NB, G } from './kit.mjs';

function TT() {
  return {
    razm: Wd('c1', 'размерах'), gor: Wd('c1', 'городов'), komp: Wd('c1', 'компаний'), pos: Wd('c1', 'посещаемости'), sayt: Wd('c1', 'сайтов'),
    dzh: Wd('c2', 'Джордж'), cipf: Wd('c2', 'Ципф'), prosh: Wd('c2', 'прошлом'), poch: Wd('c2', 'почему'), spor: Wd('c2', 'спорят'),
  };
}
// повороты: [момент, на сколько четвертей]
const TURNS = T => [[T.razm - .05, 1], [T.komp - .45, 1], [T.pos - .2, 1], [T.poch + .1, 1]];
const quarter = (t, T, i) => TURNS(T).reduce((A, [t0]) => A + eInOut(clamp((t - (t0 + i * .055)) / .75)), 0);

defineScene('world', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const stair = makeStair({ faces: Array.from({ length: NB }, () => [-1, G.city, G.firm, G.site]) });
    stage.root.add(stair.grp);
    return { stage, T: TT(), stair };
  },

  update(t, s, st) {
    const { stage, T, stair } = st, cam = stage.camera, L = stage.lights;
    for (let i = 0; i < NB; i++) {
      const g = eSpring(clamp((t - (s.start + .1 + i * .06)) / .9));
      const q = quarter(t, T, i);
      const lift = .12 * Math.sin(Math.PI * (q % 1));
      // видимость граней: та, что смотрит на камеру, и соседняя в момент поворота
      const gl = [0, 1, 2, 3].map(j => clamp(1 - Math.abs(((q - j) % 4 + 4) % 4 > 2 ? ((q - j) % 4 + 4) % 4 - 4 : ((q - j) % 4 + 4) % 4)));
      stair.set(i, { grow: g, rot: q * Math.PI / 2, dy: lift, glyph: gl });
    }
    L.key.position.set(lerp(-2, 1.5, clamp((t - s.start) / (s.end - s.start))), 9, 6);
    const [ty, dist, az, el, sy] = keys([
      [s.start, 2.4, 32, 14, 9, 975], [T.gor, 2.4, 29, 10, 10, 985], [T.dzh, 2.4, 30, 4, 10, 980], [T.poch, 2.4, 31, -4, 10, 975], [s.end, 2.4, 31.5, -10, 12, 975],
    ], t, eInOut);
    frame(cam, [0, ty, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st;
    const ink = stage.ink, sub = stage.sub;
    const hd = { size: 120, w: 600, col: ink, track: -.03 }, lab = { size: 50, w: 500, col: sub, track: -.005 };
    atext('Города', 540, 450, T.gor - .1, t, { ...hd, out: T.komp - .3 });
    atext('по размеру', 540, 530, T.gor + .2, t, { ...lab, out: T.komp - .3 });
    atext('Компании', 540, 450, T.komp - .05, t, { ...hd, out: T.sayt - .4 });
    atext('по размеру', 540, 530, T.komp + .2, t, { ...lab, out: T.sayt - .4 });
    atext('Сайты', 540, 450, T.sayt - .3, t, { ...hd, out: T.dzh - .3 });
    atext('по посещаемости', 540, 530, T.sayt, t, { ...lab, out: T.dzh - .3 });
    // c2
    const oc = T.poch - .3;
    wordsAt(['Джордж', 'Ципф'], [T.dzh - .05, T.cipf - .05], 540, 450, t, { size: 112, w: 600, col: ink, track: -.03, out: oc });
    atext('XX век', 540, 530, T.prosh - .05, t, { ...lab, out: oc });
    atext('Почему?', 540, 480, T.poch - .05, t, { size: 200, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('спорят до сих пор', 540, 560, T.spor - .05, t, lab);
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .22, .8);
    TURNS(T).forEach(([t0], k) => { add(t0 + .6, 'click', .16, .9 + k * .05); add(t0 + .9, 'click', .1, 1.0 + k * .05); });
    add(T.dzh, 'bloom', .24, .85);
    add(T.poch, 'chime', .22, .95);
  },
});
