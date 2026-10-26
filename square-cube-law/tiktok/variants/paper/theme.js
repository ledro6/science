// PAPER / SWISS EDITORIAL — тема поверх engine.js (без blur, жёсткая типографика)
Object.assign(COL, {
  bg: hex('#F2EEE6'), ink: hex('#141414'), dim: hex('#6B665E'), faint: hex('#D6D0C4'),
  cube: hex('#CFCAC0'), area: hex('#E5322D'), vol: hex('#1F4FD8'), red: hex('#E5322D'),
  heat: hex('#F07A1A'), green: hex('#1E8C4E'),
});
FONT = '"Liberation Serif", "DejaVu Serif", Georgia, serif';
var PAPER_SANS = 'Inter, "DejaVu Sans", sans-serif';

// Текст: маска-шторка снизу вверх (clip), без размытия.
atext = function (s, x, y, t0, t, o = {}) {
  const { size = 64, w = 700, col = COL.ink, a = 1, align = 'center', base = 'middle', ls = 0,
    dur = .9, out = null, outDur = .45, grad = null, gradSpan = null } = o;
  const p = P(t, t0, Math.min(dur, .55), eexp);
  const q = out == null ? 0 : P(t, out, Math.min(outDur, .35), eio);
  if (p <= .002 || q >= .998 || a <= .002) return;
  g.save();
  g.globalAlpha *= a;
  g.font = `${w} ${size}px ${FONT}`; g.textAlign = align; g.textBaseline = base; g.letterSpacing = ls + 'px';
  const tw = g.measureText(s).width;
  const x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  const top = base === 'middle' ? y - size * .62 : base === 'top' ? y - size * .1 : base === 'bottom' ? y - size * 1.15 : y - size * .95;
  const hh = size * 1.3;
  // окно маски: снизу вверх при входе, уходит вверх при выходе
  const clipTop = top + hh * (1 - p), clipBot = top + hh * (1 - q);
  g.beginPath(); g.rect(x0 - size, clipTop, tw + size * 2, Math.max(0, clipBot - clipTop)); g.clip();
  const dy = (1 - p) * size * .55 - q * size * .55;
  if (grad) {
    const gr = gradSpan ? g.createLinearGradient(gradSpan[0], 0, gradSpan[1], 0) : g.createLinearGradient(x0, 0, x0 + tw, 0);
    gr.addColorStop(0, rgba(grad[0])); gr.addColorStop(1, rgba(grad[1])); g.fillStyle = gr;
  } else g.fillStyle = rgba(col);
  g.fillText(s, x, y + dy);
  g.restore();
};

// Фон: бумага + зерно + модульная сетка + поля
makeBg = function () {
  BG = document.createElement('canvas'); BG.width = W; BG.height = H;
  const b = BG.getContext('2d');
  b.fillStyle = rgba(COL.bg); b.fillRect(0, 0, W, H);
  const R = rng(7);
  for (let i = 0; i < 26000; i++) {
    const v = R() < .5 ? 0 : 255;
    b.fillStyle = `rgba(${v},${v},${v},${(R() * .05).toFixed(3)})`;
    b.fillRect(R() * W, R() * H, 1.4, 1.4);
  }
  b.strokeStyle = 'rgba(20,20,20,0.045)'; b.lineWidth = 1;
  for (let x = 60; x < W; x += 80) { b.beginPath(); b.moveTo(x + .5, 0); b.lineTo(x + .5, H); b.stroke(); }
  for (let y = 40; y < H; y += 80) { b.beginPath(); b.moveTo(0, y + .5); b.lineTo(W, y + .5); b.stroke(); }
  b.fillStyle = rgba(COL.ink); b.fillRect(60, 170, W - 120, 3);
  b.fillRect(60, 1640, W - 120, 1.5);
  b.font = `600 22px ${PAPER_SANS}`; b.textBaseline = 'middle'; b.fillStyle = rgba(COL.ink);
  b.letterSpacing = '3px'; b.textAlign = 'left'; b.fillText('ЗАКОН КВАДРАТА–КУБА', 60, 145);
  b.textAlign = 'right'; b.fillText('№ 01 · ФИЗИКА МАСШТАБА', W - 60, 145);
};
drawBg = function (t) {
  g.drawImage(BG, 0, 0);
  // таймлайн-линейка внизу
  const p = clamp(t / TL.total);
  g.fillStyle = rgba(COL.red); g.fillRect(60, 1636, (W - 120) * p, 6);
};

// Субтитры: чёрные плашки, белый текст, активное слово — красная плашка
drawCaptions = function (t) {
  const c = CAPS.find(c => t >= c.t0 - .05 && t < c.t1);
  if (!c) return;
  const size = 64, y = LAYOUT.capY, padX = 16, gap = 10, hgt = size * 1.32;
  g.save(); g.font = `800 ${size}px ${PAPER_SANS}`; g.letterSpacing = '-1px';
  const ws = c.words.map(w => g.measureText(w.w).width + padX * 2);
  g.restore();
  const total = ws.reduce((A, B) => A + B, 0) + gap * (ws.length - 1);
  let x = LAYOUT.cx - total / 2;
  const q = P(t, c.t1 - .1, .1, eio);
  c.words.forEach((w, i) => {
    const said = t >= w.t, active = said && t < w.t + w.d + .05;
    const p = P(t, Math.max(c.t0 - .05, w.t - .12), .18, eout);
    if (p > .002 && q < .998) {
      g.save();
      const top = y - hgt / 2;
      const hp = hgt * p * (1 - q);
      g.beginPath(); g.rect(x, top + hgt - hp, ws[i], hp); g.clip();
      g.fillStyle = rgba(active ? COL.red : COL.ink); g.fillRect(x, top, ws[i], hgt);
      g.font = `800 ${size}px ${PAPER_SANS}`; g.letterSpacing = '-1px'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = said ? '#FFFFFF' : 'rgba(255,255,255,0.45)';
      g.fillText(w.w, x + ws[i] / 2, y + 3);
      g.restore();
    }
    x += ws[i] + gap;
  });
};

// Глава: номер + подчёркнутый заголовок, журнальный стиль
chapterPill = function (label, t, s) {
  const p = P(t, s.start + .1, .5, eexp);
  if (p <= 0) return;
  const idx = TL.scenes.findIndex(q => q.id === s.id) + 1;
  const num = String(idx).padStart(2, '0');
  const y = LAYOUT.top + 4, x = 60;
  g.save();
  g.fillStyle = rgba(COL.red); g.fillRect(x, y - 34, 76 * p, 68);
  g.font = `800 38px ${PAPER_SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFFFFF';
  g.globalAlpha *= p > .6 ? 1 : 0; g.fillText(num, x + 38, y + 2);
  g.restore();
  atext(label, x + 100, y + 2, s.start + .18, t, { size: 40, w: 700, col: COL.ink, align: 'left', ls: 1 });
  g.save(); g.font = `700 40px ${FONT}`; g.letterSpacing = '1px';
  const tw = g.measureText(label).width; g.restore();
  const u = P(t, s.start + .35, .5, eexp);
  g.fillStyle = rgba(COL.ink); g.fillRect(x + 100, y + 30, tw * u, 3);
};

// Стеклянные карточки → бумажные карточки с жёсткой тенью
glass = function (x, y, w, h, r, a = 1) {
  if (a <= .002) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(20,20,20,0.9)'; g.fillRect(x + 8, y + 8, w, h);
  g.fillStyle = '#FBF9F4'; g.fillRect(x, y, w, h);
  g.strokeStyle = rgba(COL.ink); g.lineWidth = 2.5; g.strokeRect(x, y, w, h);
  g.restore();
};

// Кадр: переходы — горизонтальная красная шторка-вайп
render = function (t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
  drawBg(t);
  const sc = TL.scenes, last = sc[sc.length - 1];
  for (const s of sc) {
    const def = SCENE_DEFS[s.id];
    if (!def || t < s.start - .01 || t > s.end + .01) continue;
    const isLast = s.id === last.id;
    const fadeEnd = isLast ? 1 - P(t, TL.total - 1.0, .9, eio) : 1;
    // вход: сцена раскрывается слева направо за краем шторки
    const pin = s.id === sc[0].id ? 1 : P(t, s.start, .45, eio);
    // выход: шторка закрывает сцену слева направо
    const pout = isLast ? 0 : P(t, s.end - .4, .4, eio);
    const L = W * pout, R = W * pin;
    if (R - L <= 1 || fadeEnd <= .002) continue;
    g.save(); g.globalAlpha = fadeEnd;
    g.beginPath(); g.rect(L, 0, R - L, H); g.clip();
    if (def.chapter) chapterPill(def.chapter, t, s);
    def.draw(t, s);
    g.restore();
  }
  // красная плашка-вайп через стык сцен
  for (let i = 1; i < sc.length; i++) {
    const b = sc[i].start, k = (t - (b - .4)) / .85;
    if (k <= 0 || k >= 1) continue;
    const e = eio(k), bw = 220;
    const x = lerp(-bw, W, e);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    g.fillStyle = rgba(COL.red); g.fillRect(x, 0, bw, H);
    g.fillStyle = rgba(COL.ink); g.fillRect(x + bw - 14, 0, 14, H);
    g.restore();
  }
  drawCaptions(t);
};

// Свечения на бумаге — приглушить (печать не светится)
(function () { const base = glow; glow = function (x, y, r, col, a) { base(x, y, r * .8, col, a * .45); }; })();
