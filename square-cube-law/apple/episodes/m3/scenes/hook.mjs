// HOOK (h1–h2), чёрный фон. Минималистичная белая керамическая морозилка с графитовой камерой, дверь открыта.
// h1 — морозилка проявляется из темноты, внутри два стеклянных стакана с водой; на «горячая» над левым
//      поднимается пар и подпись «горячая», на «холодной» — подпись «холодная» у правого;
//      на «замерзает» вопрос сверху «Горячая быстрее?», на «быстрее» левый стакан покрывается льдом, пар гаснет;
// h2 — «Разбираемся» серым и заголовок «Миф или нет?» по словам (как в m1, m2).
import { defineScene, makeStage, atext, project, P, Wd, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeGlass, makeSteam, makeFreezer, frame, keys, wordsAt, glow, wideShadow, FREEZER, GLASS } from './kit.mjs';

function TT() {
  return {
    gor: Wd('h1', 'горячая'), voda: Wd('h1', 'вода'), moroz: Wd('h1', 'морозилке'), zam: Wd('h1', 'замерзает'),
    bystr: Wd('h1', 'быстрее'), hol: Wd('h1', 'холодной'),
    razb: Wd('h2', 'Разбираемся'), mif: Wd('h2', 'миф'), ili: Wd('h2', 'или'), net: Wd('h2', 'нет'),
  };
}
const GX = .62, GZ = -.72;

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    wideShadow(stage, 6, 1.4);
    const fr = makeFreezer();
    const hot = makeGlass(), cold = makeGlass();
    const y0 = fr.floorY;
    hot.position.set(-GX, y0, GZ); cold.position.set(GX, y0, GZ);
    const steam = makeSteam({ n: 18, op: .5, height: .62, spread: .12 });
    steam.position.set(-GX, y0 + GLASS.h - .1, GZ);
    stage.root.add(fr, hot, cold, steam);
    return { stage, fr, hot, cold, steam, T: TT() };
  },

  update(t, s, st) {
    const { stage, fr, hot, steam, T } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, 0, 1.5, eApple);
    L.key.intensity = 2.6 * lit; L.hemi.intensity = .55 * lit; L.rimL.intensity = 3.2 * P(t, 0, 1.0); L.rimR.intensity = 2.4 * P(t, .1, 1.0);
    fr.setOpen(lerp(1.2, 1.78, P(t, 0, 2.4, eApple)));
    // горячий стакан: пар с «горячая», на «быстрее» вода становится льдом
    const ice = P(t, T.bystr - .05, 1.0, eInOut);
    hot.setIce(ice);
    steam.set(t, P(t, T.gor - .15, .9) * (1 - .9 * ice));
    const [d, el, sy] = keys([[0, 20.5, 13, 900], [T.zam, 19.2, 11, 910], [T.razb, 19.0, 12, 960], [s.end, 18.6, 13, 970]], t, eInOut);
    frame(cam, [.62, .95, -.5], d, -16 + t * 1.6, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, hot, cold, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    const y0 = FREEZER.t;
    const [hx, hy] = project(cam, hot.position.x, y0 + .45, GZ), [cx, cy] = project(cam, cold.position.x, y0 + .45, GZ);
    glow(hx, hy - 60, 220, .05 * P(t, T.gor, .8) * (1 - P(t, T.bystr, .8)));
    // подписи к стаканам — под потолком графитовой камеры
    const lo = T.razb - .25, yl = y0 + FREEZER.H - .34;
    const [hlx, hly] = project(cam, -GX, yl, GZ), [clx, cly] = project(cam, GX, yl, GZ);
    atext('горячая', hlx, hly + 14, T.gor + .05, t, { size: 44, w: 500, col: ink, a: .85, track: 0, dy: 14, out: lo });
    atext('холодная', clx, cly + 14, T.hol - .05, t, { size: 44, w: 500, col: ink, a: .85, track: 0, dy: 14, out: lo });
    void hx; void hy; void cx; void cy;
    // h1: вопрос
    atext('Горячая быстрее?', 540, 340, T.zam - .05, t, { size: 104, w: 600, col: ink, track: -.03, out: T.razb - .25 });
    // h2: рубрика
    atext('Разбираемся', 540, 330, T.razb, t, { size: 48, w: 500, col: sub, track: -.005 });
    wordsAt(['Миф', 'или', 'нет?'], [T.mif - .05, T.ili - .05, T.net - .05], 540, 490, t, { size: 150, w: 600, col: ink, track: -.035, blur: 16, dur: .6 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(.4, 'swell', .2, .7);
    add(T.gor, 'whoosh', .16, 1.3);
    add(T.zam, 'tick', .14);
    add(T.bystr, 'shimmer', .2, 1.1);
    add(T.hol, 'tick', .12, .9);
    add(T.razb, 'swell', .22, .8);
    add(T.mif - .05, 'bloom', .3, .85);
    add(T.net, 'chime', .22, 1.05);
  },
});
