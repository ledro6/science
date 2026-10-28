// CRYPTO (35.1 – 42.0 с), белый фон. Минималистичный алюминиевый замок (продуктовая подача, медленная орбита)
// и столбик хэш-строк. Строки «прокручиваются» и встают на места; у двух строк совпадают хвосты —
// хвосты инвертируются в чёрные плашки, их соединяет скобка; дужка замка поднимается и поворачивается — замок открыт;
// на «атаки дней рождения» — заголовок «Атака дней рождения».
import { defineScene, makeStage, atext, atextWords, line, measure, P, Wd, E, THREE, MAT, roundedBox, shadowsOn, clamp, lerp, eApple, eIn, eInOut, eSpring, rng, FONT } from '../../../engine.mjs';
import { ctx, bump, frame } from './kit.mjs';

const BW = 1.3, BH = 1.0, BD = .46, SR = .37, ST = .085, SL = .34;
const NR = 8, HIT = [1, 5];                        // строки с совпавшими хвостами
const HEX = '0123456789abcdef';
const HASHES = (() => {
  const R = rng(4242), out = [];
  for (let i = 0; i < NR; i++) { let s = ''; for (let k = 0; k < 16; k++) s += HEX[Math.floor(R() * 16)]; out.push(s); }
  out[HIT[0]] = out[HIT[0]].slice(0, 12) + '9e4c'; out[HIT[1]] = out[HIT[1]].slice(0, 12) + '9e4c';
  return out;
})();
const grp4 = s => s.match(/.{4}/g).join(' ');

function TT() {
  return {
    na: Wd('x1', 'На'), eff: Wd('x1', 'эффекте'), str: Wd('x1', 'строятся'), at: Wd('x1', 'атаки'), shifr: Wd('x1', 'шифрование'),
    ih: Wd('x1', 'Их'), naz: Wd('x1', 'называют'), at2: Wd('x1', 'атаки', 1), dn: Wd('x1', 'дней'), roz: Wd('x1', 'рождения'),
  };
}
const rowAt = (i, T) => T.eff - .2 + i * .2;
const hitAt = T => T.shifr + .55;                  // найдено совпадение
const openAt = T => T.shifr + .8;                  // замок открывается

defineScene('crypto', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .35 });
    const lock = new THREE.Group();
    const body = new THREE.Mesh(roundedBox(1, .07, 4), MAT.aluminium());
    body.scale.set(BW, BH, BD); body.position.y = BH / 2;
    const dark = MAT.ceramicBlack();
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .04, 32), dark);
    hole.rotation.x = Math.PI / 2; hole.position.set(0, BH * .55, BD / 2 + .005);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .04), dark); slot.position.set(0, BH * .55 - .11, BD / 2 + .005);
    const steel = new THREE.MeshPhysicalMaterial({ color: '#9A9AA0', roughness: .22, metalness: .55, clearcoat: .8, clearcoatRoughness: .12 });
    // дужка: полукольцо + две ножки; поворачивается вокруг левой ножки
    const pivot = new THREE.Group(); pivot.position.set(-SR, BH, 0);
    const sh = new THREE.Group(); sh.position.x = SR;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(SR, ST, 20, 64, Math.PI), steel); arc.position.y = SL;
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(ST, ST, SL + .2, 24), steel); legL.position.set(-SR, SL / 2 - .1, 0);
    const legR = legL.clone(); legR.position.x = SR;
    sh.add(arc, legL, legR); pivot.add(sh);
    lock.add(body, hole, slot, pivot);
    shadowsOn(lock);
    stage.root.add(lock);
    return { stage, lock, pivot, T: TT() };
  },

  update(t, s, st) {
    const { stage, lock, pivot, T } = st, L = stage.lights;
    const k = eSpring(clamp((t - s.start - .1) / 1.1));
    lock.scale.setScalar(lerp(.9, 1, k));
    lock.rotation.y = lerp(-.5, .35, eInOut(clamp((t - s.start) / (s.end - s.start))));
    const op = P(t, openAt(T), .5, eApple), sw = P(t, openAt(T) + .3, .9, eInOut);
    pivot.position.y = BH + .3 * op;
    pivot.rotation.y = -1.05 * sw;
    L.key.position.set(lerp(-3, 4, clamp((t - s.start) / 5)), 9, 6); L.key.intensity = 2.2; L.hemi.intensity = 1.1;
    L.rimL.intensity = 1.2 + 1.2 * bump(t, openAt(T) + .3, .6); L.rimR.intensity = .9;
    frame(stage.camera, [0, .72, 0], lerp(27, 25.5, P(t, s.start, 6, eApple)), 8, 12, 540, 735);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, ink = stage.ink, sub = stage.sub, g = ctx();
    const size = 40, wgt = 500, tr = .02, y0 = 965, dy = 48;
    const full = grp4(HASHES[0]);
    const wFull = measure(full, size, wgt, tr), xR = 540 + wFull / 2;      // правый край столбика
    const hit = P(t, hitAt(T), .45, eApple);
    const R = rng(Math.floor(t * 24) + 7);
    for (let i = 0; i < NR; i++) {
      const t0 = rowAt(i, T);
      if (t < t0 - .05) continue;
      const settle = clamp((t - t0) / .55);
      let s2 = HASHES[i];
      if (settle < 1) s2 = s2.split('').map((c, k) => (k / 16 < settle * 1.25 - .2 ? c : HEX[Math.floor(R() * 16)])).join('');
      const txt = grp4(s2), y = y0 + i * dy;
      const isHit = HIT.includes(i);
      const head = txt.slice(0, 14), tail = txt.slice(15);
      const wTail = measure(tail, size, wgt, tr);
      const col = sub;
      const dim = isHit ? 1 : 1 - .45 * hit;
      atext(head, xR - wTail - 1.9 * measure(' ', size, wgt, tr), y, t0, t, { size, w: wgt, col, align: 'right', track: tr, dy: 16, dur: .5, blur: 8, a: dim });
      // хвост: на совпадении — инвертированная плашка
      if (isHit && hit > .003) {
        const pw = wTail + 24, ph = 50;
        g.save(); g.globalAlpha = hit; g.fillStyle = ink;
        g.beginPath(); g.roundRect(xR - wTail - 12, y - 36, pw, ph, 12); g.fill(); g.restore();
      }
      atext(tail, xR, y, t0, t, { size, w: isHit ? 600 : wgt, col: isHit && hit > .5 ? '#FFFFFF' : col, align: 'right', track: tr, dy: 16, dur: .5, blur: 8, a: dim });
    }
    // скобка между совпавшими строками
    const bl = P(t, hitAt(T) + .2, .5, eApple);
    if (bl > .003) {
      const xb = xR + 34, ya = y0 + HIT[0] * dy - 11, yb = y0 + HIT[1] * dy - 11;
      line(xR + 16, ya, xb, ya, ink, bl, 2); line(xR + 16, yb, xb, yb, ink, bl, 2);
      line(xb, ya, xb, lerp(ya, yb, bl), ink, bl, 2);
    }
    atext('совпадение', xR + 52, y0 + (HIT[0] + HIT[1]) / 2 * dy - 1, T.ih - .05, t, { size: 30, w: 500, col: sub, align: 'left', track: 0, dy: 14 });
    // заголовок
    atext('Атака', 540, 330, T.at2 - .05, t, { size: 116, w: 600, col: ink, track: -.03 });
    atextWords('дней рождения', 540, 455, T.dn - .05, t, { size: 116, w: 600, col: ink, track: -.03, stagger: T.roz - T.dn });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .15, 'thud', .3, .9);
    for (let i = 0; i < NR; i++) add(rowAt(i, T) + .45, 'tick', .07, 1 + i * .04);
    add(hitAt(T), 'chime', .25, 1);
    add(openAt(T) + .05, 'click', .4, .8);
    add(T.at2 - .05, 'bloom', .3, .8);
  },
});
