'use strict';
// Тема «BLUEPRINT / ИНЖЕНЕРНЫЙ ЧЕРТЁЖ». Подключается после engine.js, до сцен.
COL.bg = hex('#0B3A75'); COL.ink = hex('#F2F8FF'); COL.dim = hex('#9DBBE0'); COL.faint = hex('#2C5C96');
COL.cube = hex('#1C4F8E'); COL.area = hex('#FFD84A'); COL.vol = hex('#9FE3FF'); COL.red = hex('#FF7A6B');
COL.heat = hex('#FF9A3C'); COL.green = hex('#8FF0B0');
FONT = '"JetBrains Mono", "DejaVu Sans Mono", monospace';

(function () {
  const MONO_K = .86; // моноширинный шрифт шире — слегка ужимаем кегль
  const tickCol = () => rgba(COL.vol, .9);

  // ---------- текст: проявление слева направо через clip-маску с курсором ----------
  atext = function (s, x, y, t0, t, o = {}) {
    const { size = 64, w = 700, col = COL.ink, a = 1, align = 'center', base = 'middle', ls = 0,
      dur = .9, out = null, outDur = .45, grad = null, gradSpan = null } = o;
    const p = P(t, t0, dur * .9, eout);
    const q = out == null ? 0 : P(t, out, outDur, eio);
    const al = a * (p > 0 ? 1 : 0) * (1 - q);
    if (al <= .002 || p <= 0) return;
    const fs = size * MONO_K;
    g.save();
    g.globalAlpha *= al;
    g.font = `${Math.min(w, 700)} ${fs}px ${FONT}`; g.textAlign = align; g.textBaseline = base;
    g.letterSpacing = (ls + fs * .04) + 'px';
    const tw = g.measureText(s).width, x0 = x + (align === 'center' ? -tw / 2 : align === 'right' ? -tw : 0);
    const yc = base === 'middle' ? y : base === 'top' ? y + fs * .5 : y - fs * .4;
    const h = fs * 1.3;
    // уход: стирание справа налево
    const reveal = p * (1 - q);
    const rx = x0 + tw * reveal;
    g.save();
    g.beginPath(); g.rect(x0 - 4, yc - h / 2 - 6, tw * reveal + 4, h + 12); g.clip();
    if (grad) {
      const gr = gradSpan ? g.createLinearGradient(gradSpan[0], 0, gradSpan[1], 0) : g.createLinearGradient(x0, 0, x0 + tw, 0);
      gr.addColorStop(0, rgba(grad[0])); gr.addColorStop(1, rgba(grad[1])); g.fillStyle = gr;
    } else g.fillStyle = rgba(col);
    g.fillText(s, x, y);
    g.restore();
    // курсор и размерные засечки во время построения
    const cur = (p < 1 ? 1 - p : 0) + q * (1 - q) * 4;
    if (cur > .01) {
      const ca = Math.min(1, cur * 3);
      g.strokeStyle = rgba(COL.vol, ca); g.lineWidth = 2;
      g.beginPath(); g.moveTo(rx, yc - h / 2 - 10); g.lineTo(rx, yc + h / 2 + 10); g.stroke();
      // размерная линия под текстом
      const dyL = yc + h / 2 + 8;
      g.strokeStyle = rgba(COL.vol, ca * .7); g.lineWidth = 1.5; g.setLineDash([6, 6]);
      g.beginPath(); g.moveTo(x0, dyL); g.lineTo(rx, dyL); g.stroke(); g.setLineDash([]);
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0, dyL - 9); g.lineTo(x0, dyL + 9);
      g.moveTo(x0 - 6, dyL + 6); g.lineTo(x0 + 6, dyL - 6);
      g.moveTo(rx - 6, dyL + 6); g.lineTo(rx + 6, dyL - 6); g.stroke();
    }
    g.restore();
  };

  atextWords = function (s, x, y, t0, t, o = {}) {
    // для чертёжного стиля — строка целиком, длительность растёт с числом слов
    const { stagger = .08 } = o;
    const n = s.split(' ').length;
    atext(s, x, y, t0, t, { ...o, dur: (o.dur || .9) + stagger * (n - 1) });
  };

  // ---------- плашка: техническая рамка с угловыми метками ----------
  glass = function (x, y, w, h, r, a = 1) {
    if (a <= .002) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(8,40,86,0.55)'; g.fillRect(x, y, w, h);
    g.strokeStyle = rgba(COL.ink, .55); g.lineWidth = 1.5; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
    g.strokeStyle = rgba(COL.vol, .95); g.lineWidth = 3;
    const c = Math.min(18, w / 4, h / 4);
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) => {
      g.beginPath(); g.moveTo(px + sx * c, py); g.lineTo(px, py); g.lineTo(px, py + sy * c); g.stroke();
    });
    g.restore();
  };

  // ---------- фон: лист чертежа ----------
  makeBg = function () {
    BG = document.createElement('canvas'); BG.width = W; BG.height = H;
    const b = BG.getContext('2d');
    b.fillStyle = rgba(COL.bg); b.fillRect(0, 0, W, H);
    // мелкая сетка 20px, крупная 100px
    for (let i = 0; i <= W; i += 20) { b.fillStyle = i % 100 === 0 ? 'rgba(170,210,255,0.20)' : 'rgba(170,210,255,0.07)'; b.fillRect(i, 0, i % 100 === 0 ? 2 : 1, H); }
    for (let j = 0; j <= H; j += 20) { b.fillStyle = j % 100 === 0 ? 'rgba(170,210,255,0.20)' : 'rgba(170,210,255,0.07)'; b.fillRect(0, j, W, j % 100 === 0 ? 2 : 1); }
    // виньетка
    const gr = b.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1250);
    gr.addColorStop(0, 'rgba(0,10,30,0)'); gr.addColorStop(1, 'rgba(0,10,30,0.55)');
    b.fillStyle = gr; b.fillRect(0, 0, W, H);
    // рамка чертежа
    b.strokeStyle = 'rgba(235,245,255,0.75)'; b.lineWidth = 4; b.strokeRect(36, 36, W - 72, H - 72);
    b.strokeStyle = 'rgba(235,245,255,0.35)'; b.lineWidth = 1.5; b.strokeRect(50, 50, W - 100, H - 100);
    // зоны по краю
    b.font = `500 18px ${FONT}`; b.fillStyle = 'rgba(235,245,255,0.5)'; b.textAlign = 'center'; b.textBaseline = 'middle';
    for (let k = 0; k < 6; k++) { const xx = 50 + (W - 100) * (k + .5) / 6; b.fillText(String(k + 1), xx, 43); b.fillRect(50 + (W - 100) * k / 6, 36, 1.5, 14); }
    'ABCDEFGHI'.split('').forEach((L, k) => { const yy = 50 + (H - 100) * (k + .5) / 9; b.fillText(L, 43, yy); });
    // штамп (внизу слева, выше y=1560)
    const sx = 64, sy = 1446, sw = 430, sh = 100;
    b.fillStyle = 'rgba(8,40,86,0.7)'; b.fillRect(sx, sy, sw, sh);
    b.strokeStyle = 'rgba(235,245,255,0.8)'; b.lineWidth = 2; b.strokeRect(sx, sy, sw, sh);
    b.lineWidth = 1.2; b.beginPath();
    b.moveTo(sx, sy + 34); b.lineTo(sx + sw, sy + 34); b.moveTo(sx, sy + 67); b.lineTo(sx + sw, sy + 67);
    b.moveTo(sx + 120, sy); b.lineTo(sx + 120, sy + 34); b.moveTo(sx + 300, sy + 67); b.lineTo(sx + 300, sy + sh); b.stroke();
    b.textAlign = 'left'; b.font = `700 18px ${FONT}`; b.fillStyle = 'rgba(240,248,255,0.95)';
    b.fillText('ЛИСТ 1', sx + 14, sy + 18); b.fillText('ЗАКОН КВАДРАТА–КУБА', sx + 14, sy + 51);
    b.font = `500 16px ${FONT}`; b.fillStyle = 'rgba(200,225,255,0.85)';
    b.fillText('ЧЕРТЁЖ · S ∝ L² · V ∝ L³', sx + 134, sy + 18);
    b.fillText('ИЗМ. · ЛИСТОВ 1', sx + 14, sy + 84); b.fillText('М 1:1', sx + 316, sy + 84);
  };
  drawBg = function (t) {
    g.drawImage(BG, 0, 0);
    // медленная сканирующая линия плоттера
    const y = 60 + ((t * 38) % (H - 120));
    g.fillStyle = 'rgba(159,227,255,0.06)'; g.fillRect(50, y - 30, W - 100, 60);
    g.fillStyle = 'rgba(159,227,255,0.18)'; g.fillRect(50, y, W - 100, 1);
    // таймкод в правом верхнем углу рамки
    g.save(); g.font = `500 20px ${FONT}`; g.fillStyle = 'rgba(220,238,255,0.6)'; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText('T+' + t.toFixed(2).padStart(6, '0') + 'S', W - 70, 76); g.restore();
  };

  // ---------- субтитры: моноширинный капслок в тонкой рамке ----------
  drawCaptions = function (t) {
    const c = CAPS.find(c => t >= c.t0 - .05 && t < c.t1);
    if (!c) return;
    const size = 56, y = LAYOUT.capY;
    g.save(); g.font = `800 ${size}px ${FONT}`; g.letterSpacing = '2px';
    const words = c.words.map(w => w.w.toUpperCase());
    const sp = g.measureText(' ').width, ws = words.map(w => g.measureText(w).width);
    const total = ws.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
    const q = P(t, c.t1 - .12, .12, eio), pin = P(t, c.t0 - .05, .25, eout);
    const bw = (total + 56) * pin, bx = LAYOUT.cx - (total + 56) / 2, bh = size + 40;
    g.globalAlpha = 1 - q;
    g.fillStyle = 'rgba(6,34,74,0.72)'; g.fillRect(bx, y - bh / 2, bw, bh);
    g.strokeStyle = rgba(COL.ink, .85); g.lineWidth = 1.5; g.strokeRect(bx + .5, y - bh / 2 + .5, bw - 1, bh - 1);
    // засечки
    g.beginPath(); g.moveTo(bx - 12, y - bh / 2); g.lineTo(bx + 12, y - bh / 2); g.moveTo(bx, y - bh / 2 - 12); g.lineTo(bx, y - bh / 2 + 12);
    g.moveTo(bx + bw - 12, y + bh / 2); g.lineTo(bx + bw + 12, y + bh / 2); g.moveTo(bx + bw, y + bh / 2 - 12); g.lineTo(bx + bw, y + bh / 2 + 12); g.stroke();
    g.beginPath(); g.rect(bx, y - bh / 2, bw, bh); g.clip();
    let x = LAYOUT.cx - total / 2;
    g.textAlign = 'left'; g.textBaseline = 'middle';
    c.words.forEach((w, i) => {
      const said = t >= w.t, active = said && t < w.t + w.d + .05;
      if (active) {
        const k = P(t, w.t, .15, eout);
        g.fillStyle = rgba(COL.area, .95); g.fillRect(x - 8, y - size * .55, (ws[i] + 16) * k, size * 1.1);
      }
      g.fillStyle = active ? rgba(COL.bg) : rgba(COL.ink, said ? 1 : .42);
      g.fillText(words[i], x, y + 2);
      x += ws[i] + sp;
    });
    g.restore();
  };

  // ---------- метка главы: табличка со скобками ----------
  chapterPill = function (label, t, s) {
    const p = P(t, s.start + .15, .6, eout);
    if (p <= 0) return;
    const L = label.toUpperCase();
    g.save(); g.font = `700 26px ${FONT}`; g.letterSpacing = '6px';
    const tw = g.measureText(L).width; g.restore();
    const w = tw + 70, x = LAYOUT.cx - w / 2, y = LAYOUT.top - 30;
    glass(x, y, w * p, 58, 0, 1);
    g.save(); g.font = `500 16px ${FONT}`; g.fillStyle = rgba(COL.vol, .8 * p); g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText('§ ' + String(TL.scenes.indexOf(s) + 1).padStart(2, '0'), x, y - 6); g.restore();
    atext(L, LAYOUT.cx, y + 30, s.start + .2, t, { size: 26 / MONO_K, w: 700, col: COL.ink, ls: 2 });
  };

  // размерная линия по вертикали — для перехода
  function bpDimV(x, y1, y2, a) {
    if (a <= .01) return;
    g.save(); g.strokeStyle = rgba(COL.vol, a); g.lineWidth = 2; g.setLineDash([10, 8]);
    g.beginPath(); g.moveTo(x, y1); g.lineTo(x, y2); g.stroke(); g.setLineDash([]);
    [y1, y2].forEach(yy => { g.beginPath(); g.moveTo(x - 14, yy); g.lineTo(x + 14, yy); g.moveTo(x - 7, yy + 7); g.lineTo(x + 7, yy - 7); g.stroke(); });
    g.font = `600 20px ${FONT}`; g.fillStyle = rgba(COL.vol, a); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('Δ ' + Math.round(Math.abs(y2 - y1)) + ' MM', x + 18, (y1 + y2) / 2);
    g.restore();
  }

  // ---------- кадр: «сдвиг листа» ----------
  render = function (t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    drawBg(t);
    const first = TL.scenes[0].id, last = TL.scenes[TL.scenes.length - 1].id;
    for (const s of TL.scenes) {
      const def = SCENE_DEFS[s.id];
      if (!def || t < s.start - .01 || t > s.end + .01) continue;
      const pin = s.id === first ? 1 : P(t, s.start, .6, eexp);
      const pout = s.id === last ? P(t, TL.total - 1.2, 1.1, eio) : P(t, s.end - .38, .38, eio);
      const a = Math.min(1, pin * 1.4) * (1 - pout);
      if (a <= .002) continue;
      const dy = (1 - pin) * H * .55 - pout * H * .45;
      g.save(); g.globalAlpha = a; g.translate(0, dy);
      if (def.chapter) chapterPill(def.chapter, t, s);
      def.draw(t, s);
      g.restore();
      // пунктирные размерные линии сдвига
      if (pin < .98 && s.id !== first) {
        const k = 1 - pin; bpDimV(W - 110, 300, 300 + dy, k * 1.2);
        g.save(); g.strokeStyle = rgba(COL.vol, k * .9); g.lineWidth = 2; g.setLineDash([14, 10]);
        g.beginPath(); g.moveTo(60, 300 + dy); g.lineTo(W - 60, 300 + dy); g.stroke(); g.restore();
      }
      if (pout > .02 && s.id !== last) {
        g.save(); g.strokeStyle = rgba(COL.ink, pout * .6); g.lineWidth = 1.5; g.setLineDash([4, 8]);
        g.beginPath(); g.moveTo(60, 1220 + dy); g.lineTo(W - 60, 1220 + dy); g.stroke(); g.restore();
      }
    }
    drawCaptions(t);
  };
})();
