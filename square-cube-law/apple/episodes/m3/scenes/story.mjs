// STORY (s1–s2), светлый фон. История Эрасто Мпембы.
// s1 — на «тысяча» огромное красное «1963» (единственный акцент сцены), на «Эрасто» серым «Эрасто Мпемба, Танзания»;
//      внизу две керамические формочки со смесью для мороженого; на «горячая» над левой поднимается пар,
//      на «смесь» подпись «смесь для мороженого»; на «застыла» левая смесь матовеет и покрывается инеем: «застыла раньше»;
// s2 — «лента»: формочки уезжают влево, справа приезжает лист статьи; на «шесть» серым «1969»,
//      на «Денисом» «Мпемба и Осборн»; на «эффект» заголовок «Эффект Мпембы».
import { defineScene, makeStage, atext, project, P, Wd, THREE, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeCup, makeSteam, frame, keys, wideShadow, slab, fit } from './kit.mjs';

function TT() {
  return {
    tys: Wd('s1', 'тысяча'), tanz: Wd('s1', 'танзанийский'), era: Wd('s1', 'Эрасто'), gor: Wd('s1', 'горячая'), smes: Wd('s1', 'смесь'),
    zast: Wd('s1', 'застыла'), rann: Wd('s1', 'раньше'), hol: Wd('s1', 'холодной'),
    cher: Wd('s2', 'Через'), shest: Wd('s2', 'шесть'), stat: Wd('s2', 'статью'), fiz: Wd('s2', 'физиком'), den: Wd('s2', 'Денисом'), osb: Wd('s2', 'Осборном'),
    eff: Wd('s2', 'эффект'), naz: Wd('s2', 'назвали'), imen: Wd('s2', 'именем'),
  };
}
const CX = .72;

// лист статьи: белая плита с напечатанной полосой (заголовок, строки, маленький график остывания)
function makeSheet() {
  const g = new THREE.Group();
  const W = 1.7, Hh = 2.2;
  const c = document.createElement('canvas'); c.width = 680; c.height = 880;
  const x = c.getContext('2d');
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 680, 880);
  x.fillStyle = '#1D1D1F'; x.fillRect(60, 70, 420, 34); x.fillRect(60, 118, 300, 34);
  x.fillStyle = '#A1A1A6'; x.fillRect(60, 178, 240, 16);
  const R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(9);
  x.fillStyle = '#C7C7CC';
  for (let col = 0; col < 2; col++) for (let i = 0; i < 26; i++) {
    const y = 236 + i * 24; if (col === 1 && i > 5 && i < 15) continue;
    x.fillRect(60 + col * 290, y, (i % 9 === 8 ? .5 : .88 + R() * .1) * 250, 9);
  }
  // график: две кривые остывания
  const gx = 350, gy = 380, gw = 250, gh = 200;
  x.strokeStyle = '#86868B'; x.lineWidth = 3; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx, gy + gh); x.lineTo(gx + gw, gy + gh); x.stroke();
  x.lineWidth = 4;
  [[.95, '#1D1D1F'], [.45, '#86868B']].forEach(([a, col]) => {
    x.strokeStyle = col; x.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40, v = Math.max(.12, a * Math.exp(-u * 2.6 / (a + .3))); x[i ? 'lineTo' : 'moveTo'](gx + u * gw, gy + gh - v * gh); }
    x.stroke();
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const body = new THREE.Mesh(slab(W, .03, Hh, .012, 1), new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .6 }));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W * .985, Hh * .985), new THREE.MeshStandardMaterial({ map: tex, roughness: .7 }));
  face.rotation.x = -Math.PI / 2; face.position.y = .0155;
  g.add(body, face);
  body.castShadow = true; face.receiveShadow = true;
  return g;
}

defineScene('story', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .45 });
    wideShadow(stage, 7, 1.4);
    const cups = new THREE.Group();
    const hot = makeCup(), cold = makeCup();
    hot.position.x = -CX; cold.position.x = CX;
    const steam = makeSteam({ n: 22, color: '#B8B8BD', op: .26, height: 1.1, spread: .14, seed: 8 });
    steam.position.set(-CX, hot.top, 0);
    cups.add(hot, cold, steam);
    const sheet = makeSheet();
    sheet.scale.setScalar(.82);
    stage.root.add(cups, sheet);
    return { stage, cups, hot, cold, steam, sheet, T: TT() };
  },

  update(t, s, st) {
    const { stage, cups, hot, cold, steam, sheet, T } = st, cam = stage.camera;
    const ice = P(t, T.zast - .1, 1.1, eInOut);
    hot.setIce(ice); cold.setIce(.18 * P(t, T.hol, 1.2));
    steam.set(t, P(t, T.gor - .2, .9) * (1 - ice));
    // «лента»: формочки уезжают влево, лист приезжает справа
    const push = P(t, T.cher - .05, 1.3, eInOut);
    cups.position.x = -6 * push;
    sheet.position.set(lerp(6, 0, push), .35 + .05 * Math.sin((t - s.start) * 1.1), -.2);
    sheet.rotation.set(1.0 + .05 * Math.sin((t - s.start) * .7), lerp(.5, -.12, push) - .02 * (t - T.cher), .05, 'YXZ');
    sheet.visible = push > .001;
    cups.visible = push < .999;
    const [d, el, sy] = keys([[s.start, 12.4, 28, 1040], [T.cher, 12.0, 25, 1040], [T.stat, 12.6, 18, 1090], [s.end, 12.2, 18, 1090]], t, eInOut);
    frame(cam, [0, .35, 0], d, -8 + (t - s.start) * .9, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, hot, cold, cups, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    const o1 = T.cher - .15;
    // s1: год и герой
    atext('1963', 540, 610, T.tys - .05, t, { size: 300, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: o1 });
    atext('Эрасто Мпемба, Танзания', 540, 710, T.era - .05, t, { size: 52, w: 500, col: sub, track: -.005, out: T.smes - .2 });
    atext('смесь для мороженого', 540, 710, T.smes, t, { size: 52, w: 500, col: sub, track: -.005, out: o1 });
    // подписи под формочками
    const xo = cups.position.x;
    const [hx, hy] = project(cam, xo - CX, 0, .62), [cx, cy] = project(cam, xo + CX, 0, .62);
    atext('горячая', hx, hy + 52, T.gor, t, { size: 40, w: 500, col: sub, track: 0, dy: 14, out: T.zast - .1, outDur: .25 });
    atext('застыла раньше', hx, hy + 52, T.zast + .05, t, { size: 40, w: 600, col: ink, track: 0, dy: 14, out: o1 });
    atext('холодная', cx, cy + 52, T.hol - .3, t, { size: 40, w: 500, col: sub, track: 0, dy: 14, out: o1 });
    void hot; void cold;
    // s2: статья
    const o2 = T.eff - .15;
    atext('1969', 540, 610, T.shest - .05, t, { size: 300, w: 700, col: sub, track: -.045, blur: 22, scale0: 1.12, dur: .9, out: o2 });
    atext('Мпемба и Осборн', 540, 710, T.den - .05, t, { size: 52, w: 500, col: ink, track: -.005, out: o2 });
    const h = 'Эффект Мпембы';
    atext(h, 540, 600, T.eff - .05, t, { size: fit(h, 130), w: 600, col: ink, track: -.035, blur: 16 });
    atext('назван именем школьника', 540, 690, T.naz + .1, t, { size: 48, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(T.tys, 'impact', .3, .95);
    add(T.era, 'tick', .12);
    add(T.gor, 'whoosh', .14, 1.3);
    add(T.zast, 'shimmer', .2, 1.05);
    add(T.cher, 'whoosh', .24, .9);
    add(T.shest, 'chime', .2, .9);
    add(T.stat, 'thud', .18, .9);
    add(T.eff, 'bloom', .24, .85);
  },
});
