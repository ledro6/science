// STORY (34,6 – 43,6 с), светлый фон. Журнальная полоса лежит на столе: шапка, три колонки строк,
// во врезке три двери (третья открыта).
// y1 — на «тысяча девятьсот девяностом» крупно «1990», на «Мэрилин вос Савант» подпись под ним;
//      на «ответ» выноска к врезке «ответ: менять»; на «пришли» рядом со страницей волной падают конверты
//      и складываются в стопку, сверху «≈ 10 000» досчитывает, «писем с возражениями»;
//      на «в том числе» подпись меняется на «в том числе от учёных».
import { defineScene, makeStage, project, atext, acount, callout, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makePage, makeLetters, frame, keys } from './kit.mjs';

function TT() {
  return {
    tys: Wd('y1', 'тысяча'), dev: Wd('y1', 'девяностом'), mer: Wd('y1', 'Мэрилин'), sav: Wd('y1', 'Савант'), otv: Wd('y1', 'ответ'),
    zh: Wd('y1', 'журнале'), pri: Wd('y1', 'пришли'), ok: Wd('y1', 'около'), des: Wd('y1', 'десяти'), pis: Wd('y1', 'писем'),
    voz: Wd('y1', 'возражениями'), vtom: Wd('y1', 'том') - .06, uch: Wd('y1', 'учёных'),
  };
}
const PX = -.7, PZ = 0, SX = 1.55, SZ = .45;     // страница и стопка писем
const NL = 72;
const fallAt = (i, T) => T.pri - .05 + Math.pow(i / NL, .8) * 2.6;

defineScene('story', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const page = makePage();
    page.position.set(PX, 0, PZ); page.rotation.y = .12;
    const letters = makeLetters(NL);
    letters.mesh.position.set(SX, 0, SZ);
    stage.root.add(page, letters.mesh);
    return { stage, T: TT(), page, letters };
  },

  update(t, s, st) {
    const { stage, T, page, letters } = st, cam = stage.camera;
    stage.lights.key.position.set(lerp(-3, 3, clamp((t - s.start) / (s.end - s.start))), 9, 6);
    // страница «приезжает» снизу и ложится
    const pin = P(t, s.start + .05, 1.2, eApple);
    page.position.set(PX, 0, PZ + (1 - pin) * 1.2);
    letters.set(i => clamp((t - fallAt(i, T)) / .55));
    const [tx, tz, dist, az, el, sy] = keys([
      [s.start, -.6, 0, 19.5, 8, 56, 960], [T.otv - .3, -.6, 0, 18.5, 4, 54, 960], [T.pri + .2, -.25, .1, 19.5, 2, 46, 990],
      [T.des + .8, -.05, .3, 20, -6, 40, 1040], [s.end, -.05, .3, 20, -9, 38, 1040],
    ], t, eInOut);
    frame(cam, [tx, 0, tz], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, page } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const o1 = T.ok - .2;
    atext('1990', 540, 450, T.tys + .1, t, { size: 240, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('Мэрилин вос Савант', 540, 545, T.mer - .05, t, { size: 56, w: 600, col: ink, track: -.015, out: o1 });
    // выноска к врезке с дверями (средняя колонка, верхняя треть страницы)
    {
      const W = page.W, H = page.H, ry = page.rotation.y;
      const lx = (370 + 142) / 1024 * W - W / 2, lz = (560 + 125) / 1400 * H - H / 2;
      const wx = page.position.x + lx * Math.cos(ry) + lz * Math.sin(ry), wz = page.position.z - lx * Math.sin(ry) + lz * Math.cos(ry);
      const [ax, ay] = project(cam, wx, .04, wz);
      const a = 1 - P(t, o1, .35, eIn);
      callout(ax, ay, ax + 250, ay - 110, T.otv - .1, t, ink, a);
      atext('ответ: менять', ax + 262, ay - 122, T.otv + .05, t, { size: 40, w: 500, col: ink, align: 'left', track: -.005, dy: 14, out: o1 });
    }
    // письма
    acount(10000, 560, 450, T.des - .1, t, { size: 200, w: 700, col: ink, prefix: '≈ ', dur: 1.3 });
    atext('писем с возражениями', 540, 535, T.pis, t, { size: 52, w: 500, col: sub, track: -.005, out: T.vtom - .15 });
    atext('в том числе от учёных', 540, 535, T.vtom + .05, t, { size: 52, w: 500, col: sub, track: -.005 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .15, 'whoosh', .18, .9);
    add(T.tys + .1, 'chime', .2, .9);
    add(T.otv, 'tick', .14, 1.0);
    for (let k = 0; k < 12; k++) add(fallAt(Math.round(k * NL / 12), T) + .45, 'tick', .06, .85 + k * .03);
    add(T.des - .1, 'swell', .2, .9);
    add(T.uch, 'click', .14, 1.0);
  },
});
