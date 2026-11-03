// OUTRO (o1–o2), чёрный фон. Бутерброд-«продукт» парит в темноте (контровые → ключ), медленно вращается.
// o1 — «Вердикт» белым и огромное красное «не миф» (акцент финала); на «физика» бутерброд в воздухе
//      делает те самые пол-оборота и показывает масло снизу, серым «это физика, а не подлость»;
// o2 — финальная карточка как в m1: «Вращение при падении» (по словам, белым), серым «бутерброд маслом вниз: не миф»,
//      красная пилюля «Подписаться на L³» с нажатием на «нет».
import { defineScene, makeStage, atext, atextWords, measure, project, P, Wd, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeToast, frame, glow, pill } from './kit.mjs';

function TT() {
  return {
    ver: Wd('o1', 'Вердикт'), ne: Wd('o1', 'не'), mif: Wd('o1', 'миф'), eto: Wd('o1', 'Это'), fiz: Wd('o1', 'физика'), podl: Wd('o1', 'подлость'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'нет'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .45 });
    const toast = makeToast();
    stage.root.add(toast);
    return { stage, toast, T: TT() };
  },

  update(t, s, st) {
    const { stage, toast, T } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.6 * lk; L.hemi.intensity = .5 * lk;
    // парит над полом; на «физика» — пол-оборота вокруг длинной оси (масло вниз), затем медленный разворот
    const flip = P(t, T.fiz - .1, 1.4, eInOut);
    toast.position.set(0, 1.6 + .06 * Math.sin((t - s.start) * 1.3), 0);
    toast.rotation.set(.32 - .05 * flip, (t - s.start) * .22 - .5, -Math.PI * flip, 'YXZ');
    toast.scale.setScalar(1);
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [0, 1.5, 0], lerp(9.4, 10.6, o2) - .05 * (t - s.start), -10 + (t - s.start) * 1.4, lerp(16, 20, o2), 540, lerp(1010, 880, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, ink = '#FFFFFF', sub = stage.sub;
    const [gx, gy] = project(cam, 0, 1.6, 0);
    glow(gx, gy, 380, .05 * P(t, s.start + .3, 1.0));
    // o1: вердикт
    const o1 = T.card - .35;
    atext('Вердикт', 540, 330, T.ver - .05, t, { size: 84, w: 600, col: ink, track: -.03, out: o1 });
    atext('не миф', 540, 590, T.ne - .05, t, { size: 240, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: o1 });
    atext('это физика, а не подлость', 540, 690, T.fiz, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      const law = 'Вращение при падении', ls = Math.min(112, 112 * 900 / measure(law, 112, 600, -.035));
      atextWords(law, 540, 380, T.card + .05, t, { size: ls, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('бутерброд маслом вниз: не миф', 540, 480, T.card + .5, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.ver, 'tick', .16, .9);
    add(T.ne - 1.5, 'riser', .2);
    add(T.ne, 'impact', .36, .9);
    add(T.fiz, 'whoosh', .2, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
