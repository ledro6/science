// PITCH (20.2 – 29.4 с), чёрный фон.
// p1 — керамическая клавиатура пианино из темноты; «100 км/ч» крупно; на «приближением» опускается и светится G
//      (выноска «приближение»), на «удалением» — E («удаление»); на «почти три» дуги-шаги E → F → F♯ → G,
//      огромное красное «≈ 3» (главная цифра выпуска), подпись «полутона на 100 км/ч».
// p2 — клавиатура гаснет; из темноты вагон-платформа на рельсах, три трубача-фигурки, от труб расходятся кольца
//      (спереди сжаты); у пути стоит слушатель; «1845» крупно и подпись «трубачи на поезде».
import { defineScene, makeStage, project, atext, line, callout, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeKeyboard, makeWagon, makeTrack, makeTrumpeter, makeFigure, makeWaveField, rings, frame, keys, glow, ctx, collectMats, setLit, KEY } from './kit.mjs';

function TT() {
  return {
    sta: Wd('p1', 'ста'), km: Wd('p1', 'километрах'), razn: Wd('p1', 'разница'), pribl: Wd('p1', 'приближением'), udal: Wd('p1', 'удалением'),
    poch: Wd('p1', 'почти'), tri: Wd('p1', 'три'), polu: Wd('p1', 'полутона'),
    v: Wd('p2', 'В'), tys: Wd('p2', 'тысяча'), god: Wd('p2', 'году'), eto: Wd('p2', 'это'), prov: Wd('p2', 'проверили'),
    trub: Wd('p2', 'трубачами'), poezd: Wd('p2', 'поезде'),
  };
}
const NE = 4, NF = 5, NFS = 6, NG = 7;          // E, F, F♯, G в полутоновой нумерации клавиатуры
const WV = 1.5, CS = 3.6, OBS = [2.2, -2.7];
const cut = T => T.v;                      // момент смены кадра (оба объекта в темноте)
const wagX = (t, T) => WV * (t - T.trub - .2) - .6;

defineScene('pitch', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const T = TT();
    const kb = makeKeyboard();
    const keyMats = new Set(kb.keys.map(k => k.mesh.material));
    const kbMats = collectMats(kb).filter(m => !keyMats.has(m));
    const train = new THREE.Group();
    const wagon = makeWagon(), track = makeTrack(-30, 40);
    const tr = [-1.25, 0, 1.25].map((x, i) => { const f = makeTrumpeter(null, .82); f.position.set(x, .87, i === 1 ? .25 : -.25); return f; });
    wagon.add(...tr);
    const man = makeFigure(null, .95); man.position.set(OBS[0], 0, OBS[1]); man.rotation.y = -.5;
    const field = makeWaveField(40, { lw: 1.6, fade: .5 });
    train.add(wagon, track, man, field);
    stage.root.add(kb, train);
    return { stage, T, kb, kbMats, train, wagon, field, trMats: collectMats(train) };
  },

  update(t, s, st) {
    const { stage, T, kb, train, wagon, field } = st, cam = stage.camera, L = stage.lights;
    const p2 = t >= cut(T);
    // свет: p1 — проявление клавиатуры, гаснет к «В»; p2 — вагон из темноты
    const k1 = P(t, s.start, 1.2) * (1 - P(t, T.v - .42, .4, eIn));
    const k2 = P(t, cut(T), 1.0);
    const lr = p2 ? k2 : P(t, s.start, .9);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    L.hemi.intensity = .4 * (p2 ? k2 : k1); L.key.intensity = 2.5 * (p2 ? k2 : k1);
    kb.visible = !p2 && k1 > .01; train.visible = p2;
    if (!p2) {
      L.key.position.set(lerp(-3, 4, clamp((t - s.start) / 5)), 9, 6); L.key.target.position.set(0, 0, 0); L.key.target.updateMatrixWorld();
      setLit(st.kbMats, lerp(.1, 1, k1));
      // нажатия: G на «приближением», E на «удалением»; F, F♯ подсвечиваются шагами на «почти три»
      const pG = P(t, T.pribl - .05, .35), pE = P(t, T.udal - .05, .35);
      const step = i => P(t, T.poch + i * .14, .3) * (1 - P(t, T.tri + .2, .5));
      // фокус: остальные клавиши притухают, пока звучат две ноты
      const foc = P(t, T.pribl - .1, .6) * (1 - P(t, T.v - .6, .4, eIn));
      kb.keys.forEach((k, i) => {
        let p = 0, lit = 0, dm = 1;
        if (i !== NE && i !== NG) dm = lerp(1, i === NF || i === NFS ? lerp(.3, 1, step(i === NF ? 0 : 1)) : .3, foc);
        if (i === NG) { p = pG; lit = pG; }
        if (i === NE) { p = pE; lit = pE; }
        if (i === NF) lit = .5 * step(0);
        if (i === NFS) lit = .8 * step(1);
        kb.press(i, p, lit, lerp(.1, 1, k1) * dm);
      });
      const [az, el, d] = keys([[s.start, 24, 30, 17], [T.pribl, 16, 34, 16], [T.tri, 10, 38, 16.5], [cut(T), 6, 40, 17]], t, eInOut);
      frame(cam, [.1, .1, .1], d, az, el, 540, 1040);
    } else {
      setLit(st.trMats, lerp(.1, 1, k2));
      const x = wagX(t, T);
      wagon.position.set(x, 0, 0); wagon.spin(x / .3);
      wagon.children.filter(c => c.isGroup).forEach((f, i) => { f.rotation.z = .03 * Math.sin(t * 3 + i); });
      L.key.position.set(x * .6 + 3, 9, 7); L.key.target.position.set(x * .6, 0, 0); L.key.target.updateMatrixWorld();
      const R = rings(t, τ => wagX(τ, T) + 1.8, { dt: .32, c: CS, maxAge: 2.6, a: k2 * .85, z: 0 });
      field.position.set(x, 0, 0);
      field.set(R, 1, x, 0);
      const [tx, d, az, el] = keys([[cut(T), -1.5, 30, 30, 20], [s.end, 1.2, 28, 24, 17]], t, eInOut);
      frame(cam, [tx, .8, -.4], d, az, el, 540, 1010);
    }
  },

  draw2d(t, s, st) {
    const { stage, T, kb } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const p2 = t >= cut(T);
    if (!p2) {
      const [fx, fy] = project(cam, 0, 0, 0);
      glow(fx, fy + 30, 520, .05 * P(t, s.start + .2, 1));
      // 100 км/ч
      const o100 = T.poch - .25;
      atext('100', 540, 560, T.sta - .1, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o100 });
      atext('км/ч', 540, 650, T.km, t, { size: 50, w: 500, col: sub, track: -.005, out: o100 });
      // выноски на нотах: от передней кромки клавиши вниз, подписи под клавиатурой
      const front = i => { const k = kb.keys[i].mesh.position; return project(cam, k.x, k.y + .09, k.z + (kb.keys[i].black ? KEY.BL : KEY.L) / 2 - .05); };
      const back = i => { const k = kb.keys[i].mesh.position; return project(cam, k.x, k.y + .1, -KEY.L / 2 + .12); };
      const oC = T.v - .4, aC = 1 - P(t, oC, .3, eIn);
      const [gx, gy] = front(NG), [ex, ey] = front(NE);
      const LY = 1262;
      if (t > T.pribl - .05 && aC > .003) {
        callout(gx, gy, gx + 40, LY - 48, T.pribl - .05, t, ink, aC);
        atext('приближение', gx + 22, LY, T.pribl + .05, t, { size: 42, w: 500, col: ink, a: aC, align: 'left', track: -.005, dy: 14 });
      }
      if (t > T.udal - .05 && aC > .003) {
        callout(ex, ey, ex - 40, LY - 48, T.udal - .05, t, ink, aC);
        atext('удаление', ex - 22, LY, T.udal + .05, t, { size: 42, w: 500, col: sub, a: aC, align: 'right', track: -.005, dy: 14 });
      }
      // три шага-полутона: дуги E → F → F♯ → G над клавишами
      const seq = [NE, NF, NFS, NG], yb = Math.min(...seq.map(i => back(i)[1])) - 24;
      for (let i = 0; i < 3; i++) {
        const a = P(t, T.poch + i * .14, .35) * aC;
        if (a <= .003) continue;
        const [x1, y1] = back(seq[i]), [x2, y2] = back(seq[i + 1]);
        const g = ctx(); g.save(); g.globalAlpha = a; g.strokeStyle = ink; g.lineWidth = 2.5; g.lineCap = 'round';
        const y0 = yb, mx = (x1 + x2) / 2, my = y0 - 40 - 16 * (1 - a);
        g.beginPath(); g.moveTo(x1, y0); g.quadraticCurveTo(mx, my, x2, y0); g.stroke(); g.restore();
      }
      // ≈ 3 полутона — главный акцент
      atext('≈ 3', 540, 600, T.tri - .05, t, { size: 330, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: oC });
      atext('полутона на 100 км/ч', 540, 690, T.polu + .05, t, { size: 48, w: 500, col: sub, track: -.005, out: oC });
    } else {
      const [fx, fy] = project(cam, wagX(t, T) * .6, 0, 0);
      glow(fx, fy + 20, 560, .045 * P(t, cut(T), 1));
      atext('1845', 540, 560, T.tys - .05, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
      atext('трубачи на поезде', 540, 650, T.trub - .05, t, { size: 50, w: 500, col: sub, track: -.005 });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.sta - .1, 'bloom', .26, .85);
    add(T.pribl, 'chime', .22, 1.09);
    add(T.udal, 'chime', .22, .92);
    add(T.poch, 'tick', .14, 1.0); add(T.poch + .14, 'tick', .14, 1.06); add(T.poch + .28, 'tick', .14, 1.12);
    add(T.tri - 1.5, 'riser', .24);
    add(T.tri, 'impact', .4, .9);
    add(T.tys - .05, 'swell', .24, .8);
    add(T.trub, 'chime', .2, 1.0);
    add(T.poezd, 'whoosh', .22, .8);
  },
});
