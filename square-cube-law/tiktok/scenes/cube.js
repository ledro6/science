// Глава «КУБИК» (c1–c4): 1 → 2 → 3, плитки площади и кубики объёма, график L² vs L³, столбики ×100 / ×1000.
(() => {
  const CX = LAYOUT.cx, CY = 840, U = 125;

  function grp(a, b, fn) {
    if (a <= .002) return;
    g.save(); g.globalAlpha *= a;
    if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`;
    fn(); g.restore();
  }
  // зум камеры вокруг центра куба (CX, CY) — центр остаётся на месте
  const zcam = (z, fn) => withCam(CX + (540 - CX) / z, CY + (960 - CY) / z, z, fn);

  // n³ кубиков, падающих по очереди с «приземлением» (лёгкий pop масштаба)
  function drop(n, t, t0, step, col, aAll, hgt = 1.5, fall = .38) {
    const h = n / 2;
    return dropOrder(n).map(([x, y, z], k) => {
      const u = clamp((t - (t0 + k * step)) / fall);
      const land = t - (t0 + k * step + fall);
      const pop = land > 0 ? 1 + .16 * Math.exp(-land * 9) * Math.sin(Math.min(1, land / .1) * Math.PI) : 1;
      const s = pop, off = (1 - s) / 2;
      return { p: [x - h + off, y - h + hgt * (1 - u * u) + off, z - h + off], s, col, a: clamp(u * 4) * aAll, ea: .5 };
    });
  }
  const landT = (n, t0, step, fall = .38) => dropOrder(n).map((_, k) => t0 + k * step + fall);

  // ---------- c1–c3: кубик ----------
  function cubeStage(t) {
    const tK = Wd('c1', 'кубик'), tUv = Wd('c1', 'увеличим'), t2 = Wd('c1', 'два');
    const tS = Wd('c2', 'площадь'), t4 = Wd('c2', 'четыре'), tV = Wd('c2', 'объём'), t8 = Wd('c2', 'восемь');
    const t3 = Wd('c3', 'три'), tS3 = Wd('c3', 'площадь'), t9 = Wd('c3', 'девять'), tV3 = Wd('c3', 'объём'), t27 = Wd('c3', 'двадцать');
    const qo = P(t, C('c4') - .15, .45, eio);
    if (qo >= 1) return;

    const side = lerp(1, 2, P(t, t2 - .05, .9, espr)) + P(t, t3, .9, espr);
    let z = lerp(1.5, 1.6, P(t, C('c1'), 3, eio));
    z = lerp(z, 1.05, P(t, t2 - .1, 1.0, eio));
    z = lerp(z, .84, P(t, t3 - .05, 1.0, eio));
    z *= 1 + punch(t, t4, .05) + punch(t, t8, .06) + punch(t, t9, .05) + punch(t, t27, .07);
    const yaw = .62 + .14 * Math.sin(t * .45), pitch = .48;
    const c = cam(yaw, pitch, CX, CY, U);
    const pin = P(t, tK - .35, .8, eexp);

    // нижняя точка куба на экране (для подписи размера)
    const v = corners([-side / 2, -side / 2, -side / 2], side).map(p => proj(c, p));
    const bottom = CY + (Math.max(...v.map(p => p[1])) - CY) * z;

    grp(1 - qo, qo * 22, () => {
      zcam(z, () => {
        glow(CX, CY, 330 * side * .8, COL.vol, .1 * pin);
        const blue = mix(COL.cube, COL.vol, .6);
        const pop = lerp(.3, 1, P(t, tK - .3, .8, espr));
        // призрак 2× на «Увеличим»
        const ga = P(t, tUv, .5, eexp) * (1 - P(t, t2 + .5, .4, eio));
        drawWire(c, [-1, -1, -1], 2, COL.area, .55 * ga, 2.5);
        // сплошной серый куб: 1→2 (до «объём»), затем снова в 3× (до «объём» в c3)
        const aS = (1 - P(t, tV - .05, .35, eio)) + P(t, t3 + .25, .4, eexp) * (1 - P(t, tV3 - .05, .35, eio));
        const ss = side * (t < t3 ? pop : 1);
        const cubes = [];
        if (aS > .002) cubes.push({ p: [-ss / 2, -ss / 2, -ss / 2], s: ss, col: COL.cube, a: aS, ea: .6 });
        // 8 кубиков объёма
        const a8 = P(t, tV - .2, .2) * (1 - P(t, t3 - .1, .3, eio));
        if (a8 > .002) cubes.push(...drop(2, t, tV + .05, .15, blue, a8));
        // 27 кубиков
        const a27 = P(t, tV3 - .2, .2);
        if (a27 > .002) cubes.push(...drop(3, t, tV3 + .05, .045, blue, a27, 1.4, .34));
        grp(pin, (1 - pin) * 20, () => {
          drawCubes(c, cubes);
          // плитки площади
          const aT2 = 1 - P(t, tV - .05, .35, eio);
          if (t < t3 && aT2 > 0) frontTiles(c, 2, t, tS + .05, .22, aT2, COL.area);
          const aT3 = P(t, t3 + .5, .3) * (1 - P(t, tV3 - .05, .35, eio));
          if (aT3 > 0) frontTiles(c, 3, t, tS3 + .02, .085, aT3, COL.area);
          // каркас поверх, когда сплошной куб уходит
          const aW = P(t, tV - .15, .35) * (1 - P(t, t3 + .2, .4)) + P(t, tV3 - .15, .35);
          drawWire(c, [-side / 2, -side / 2, -side / 2], side, COL.ink, .75 * aW, 2.2);
        });
      });
      // подпись размера
      const ly = Math.min(bottom + 60, 1215);
      atext('1 см', CX, ly, tK + .25, t, { size: 40, w: 600, col: COL.dim, out: t2 - .15, outDur: .3 });
      atext('2 см', CX, ly, t2 + .25, t, { size: 40, w: 600, col: COL.dim, out: t3 - .15, outDur: .3 });
      atext('3 см', CX, ly, t3 + .45, t, { size: 40, w: 600, col: COL.dim });

      // счётчики площади и объёма
      const XA = CX - 220, XV = CX + 220, YN = 415, YL = 512;
      const ca = P(t, tS, .7, eexp), cv = P(t, tV, .7, eexp);
      glass(XA - 190, 318, 380, 238, 36, ca);
      glass(XV - 190, 318, 380, 238, 36, cv);
      atext('ПЛОЩАДЬ', XA, YL, tS, t, { size: 28, w: 700, col: COL.area, ls: 4, a: .8 });
      atext('ОБЪЁМ', XV, YL, tV, t, { size: 28, w: 700, col: COL.vol, ls: 4, a: .8 });
      const pend = 1 - .6 * P(t, t3, .4) ; // «в ожидании» нового значения
      acount(4, XA, YN, t4 - .08, t, { from: 1, prefix: '×', size: 128, w: 800, col: COL.area, dur: .6, out: t9 - .12, outDur: .25, a: pend, scale0: 1.3 });
      acount(9, XA, YN, t9 - .08, t, { from: 4, prefix: '×', size: 128, w: 800, col: COL.area, dur: .6, scale0: 1.3 });
      acount(8, XV, YN, t8 - .08, t, { from: 1, prefix: '×', size: 128, w: 800, col: COL.vol, dur: .6, out: t27 - .12, outDur: .25, a: pend, scale0: 1.3 });
      acount(27, XV, YN, t27 - .08, t, { from: 8, prefix: '×', size: 128, w: 800, col: COL.vol, dur: .7, scale0: 1.3 });
      // до «объём»: подсказка «?»
      atext('?', XV, YN, tV + .05, t, { size: 128, w: 800, col: COL.vol, a: .35, out: t8 - .1, outDur: .2 });
    });
  }

  // ---------- c4 (1): график L² vs L³ ----------
  function graph(t) {
    const tO = C('c4'), tOb = Wd('c4', 'обгоняет'), tPl = Wd('c4', 'площадь'), tUv = Wd('c4', 'увеличишь');
    const pin = P(t, tO - .1, .7, eexp), q = P(t, tUv - .2, .4, eio);
    const a = pin * (1 - q);
    if (a <= .002) return;
    const x0 = 150, y0 = 1110, x1 = 880, y1 = 420, Lmax = 4, Ymax = 64;
    const X = L => x0 + (x1 - x0) * L / Lmax, Y = v => y0 - (y0 - y1) * v / Ymax;
    const z = lerp(1.06, 1, pin) * (1 + punch(t, tOb, .04) + punch(t, tPl, .04));
    grp(a, (1 - pin) * 22 + q * 22, () => withCam(540, 960, z, () => {
      line(x0, y0, x1 + 20, y0, COL.dim, 1, 3); line(x0, y0, x0, y1 - 30, COL.dim, 1, 3);
      for (let i = 1; i <= 4; i++) {
        line(X(i), y0, X(i), y0 + 12, COL.dim, 1, 3);
        txt(String(i), X(i), y0 + 42, { size: 30, col: COL.dim, w: 600 });
      }
      txt('размер L', x1 + 10, y0 + 92, { size: 30, col: COL.dim, w: 600, align: 'right', ls: 2 });
      const p2 = P(t, tO + .15, 1.4, eio), p3 = P(t, tOb - .15, 1.4, eio);
      const fa = P(t, tPl - .1, .7, eexp);
      const Lf = Lmax * Math.min(p2, p3);
      if (fa > 0 && Lf > .01) {
        g.save(); g.beginPath();
        for (let i = 0; i <= 100; i++) { const L = Lf * i / 100; g.lineTo(X(L), Y(L ** 3)); }
        for (let i = 100; i >= 0; i--) { const L = Lf * i / 100; g.lineTo(X(L), Y(L ** 2)); }
        const gr = g.createLinearGradient(0, y1, 0, y0);
        gr.addColorStop(0, rgba(COL.vol, .35 * fa)); gr.addColorStop(1, rgba(COL.vol, .04 * fa));
        g.fillStyle = gr; g.fill(); g.restore();
      }
      for (const [pw, col, p] of [[2, COL.area, p2], [3, COL.vol, p3]]) {
        const Lp = Lmax * p;
        if (Lp < .01) continue;
        g.save(); g.beginPath();
        for (let i = 0; i <= 120; i++) { const L = Lp * i / 120; g.lineTo(X(L), Y(L ** pw)); }
        g.strokeStyle = rgba(col); g.lineWidth = 7; g.lineCap = g.lineJoin = 'round'; g.stroke(); g.restore();
        glow(X(Lp), Y(Lp ** pw), 50, col, .5);
        circle(X(Lp), Y(Lp ** pw), 11, col);
      }
      // разрыв на конце
      if (fa > 0) {
        const xr = X(Lf) - 70;
        const Lr = (xr - x0) / (x1 - x0) * Lmax;
        if (Lr > 2.2) arrow(xr, Y(Lr ** 2) - 14, xr, Y(Lr ** 3) + 16, COL.ink, .8 * fa, 4, 18);
      }
    }));
    // легенда
    atext('L³  объём', x0 + 40, 470, tOb - .15, t, { size: 52, w: 800, col: COL.vol, align: 'left', a: 1 - q, out: tUv - .2, outDur: .4 });
    atext('L²  площадь', x0 + 40, 545, tO + .15, t, { size: 52, w: 800, col: COL.area, align: 'left', a: 1 - q, out: tUv - .2, outDur: .4 });
  }

  // ---------- c4 (2): размер ×10 → площадь ×100, масса ×1000 ----------
  function bars(t) {
    const tUv = Wd('c4', 'увеличишь'), t10 = Wd('c4', 'десять'), tPl = Wd('c4', 'площадь', 1);
    const t100 = Wd('c4', 'сто'), tM = Wd('c4', 'масса'), t1000 = Wd('c4', 'тысячу');
    if (t < tUv - .3) return;
    const z = 1 + punch(t, t10, .04) + punch(t, t100, .04) + punch(t, t1000, .08, .6);
    const [sx, sy] = shake(t, t1000 + .05, 10, .35);
    withCam(540 - sx, 960 - sy, z, () => {
      atext('Размер', CX - 14, 372, tUv - .05, t, { size: 84, w: 800, align: 'right' });
      atext('×10', CX + 14, 372, t10 - .05, t, { size: 84, w: 800, align: 'left', grad: [COL.area, COL.vol], scale0: 1.3 });
      const base = 1130, full = 560, bw = 220, XA = CX - 210, XV = CX + 210;
      const sa = P(t, tPl - .1, .6, eexp), sv = P(t, tM - .1, .6, eexp);
      line(XA - 190, base, XV + 190, base, COL.faint, Math.max(sa, sv), 3);
      const pa = P(t, t100 - .05, .9, eexp), pv = P(t, t1000 - .05, 1.0, eexp);
      for (const [x, s, p, val, col, lab, t0, tl] of [
        [XA, sa, pa, 100, COL.area, 'площадь', t100, tPl], [XV, sv, pv, 1000, COL.vol, 'масса', t1000, tM]]) {
        if (s <= .002) continue;
        const h = Math.max(8, full * val / 1000 * p);
        grp(s, (1 - s) * 16, () => {
          glow(x, base - h, 160, col, .18 * p);
          const gr = g.createLinearGradient(0, base - h, 0, base);
          gr.addColorStop(0, rgba(col)); gr.addColorStop(1, rgba(mix(col, COL.bg, .45)));
          g.fillStyle = gr; g.beginPath(); g.roundRect(x - bw / 2, base - h, bw, h, [14, 14, 4, 4]); g.fill();
        });
        atext(lab, x, base + 48, tl - .05, t, { size: 36, w: 700, col: COL.dim, ls: 2 });
        acount(val, x, base - h - 60, t0 - .05, t, { from: 1, prefix: '×', size: 96, w: 800, col, dur: val > 100 ? 1.0 : .9, scale0: 1.3 });
      }
    });
  }

  defineScene('cube', {
    chapter: 'КУБИК',
    draw(t) {
      cubeStage(t);
      graph(t);
      bars(t);
    },
    sfx(add) {
      // события с приоритетом; лишние (ближе 0.12 с к более важным) отбрасываются
      const ev = [];
      const E_ = (time, type, gain, pitch = 1, pr = 1) => ev.push({ time, type, gain, pitch, pr });
      const tK = Wd('c1', 'кубик'), tUv = Wd('c1', 'увеличим'), t2 = Wd('c1', 'два');
      const tS = Wd('c2', 'площадь'), t4 = Wd('c2', 'четыре'), tV = Wd('c2', 'объём'), t8 = Wd('c2', 'восемь');
      const t3 = Wd('c3', 'три'), tS3 = Wd('c3', 'площадь'), t9 = Wd('c3', 'девять'), tV3 = Wd('c3', 'объём'), t27 = Wd('c3', 'двадцать');
      E_(tK - .3, 'pop', .7, 1, 3);
      E_(tUv, 'whoosh', .4, 1.2, 2);
      E_(t2, 'boing', .7, 1, 3);
      for (let i = 0; i < 4; i++) E_(tS + .05 + i * .22, 'tick', .5, 1 + i * .12, 2);
      E_(t4, 'chime', .8, 1, 5);
      landT(2, tV + .05, .15).forEach((x, k) => E_(x, 'pop', .45, 1 + k * .06, 1));
      E_(t8, 'chime', .9, 1.3, 5);
      E_(t3, 'swell', .7, 1, 3);
      E_(tS3, 'shimmer', .6, 1, 2);
      E_(t9, 'chime', .8, 1.2, 5);
      landT(3, tV3 + .05, .045, .34).forEach((x, k) => E_(x, 'pop', .3, 1 + (k % 9) * .05, 0));
      E_(t27, 'bloom', .9, 1, 5);
      const tO = C('c4'), tOb = Wd('c4', 'обгоняет'), tPl = Wd('c4', 'площадь'), tU2 = Wd('c4', 'увеличишь');
      const t10 = Wd('c4', 'десять'), tPl2 = Wd('c4', 'площадь', 1), t100 = Wd('c4', 'сто'), tM = Wd('c4', 'масса'), t1000 = Wd('c4', 'тысячу');
      E_(tO - .1, 'whoosh', .5, 1, 3);
      E_(tO + .2, 'swell', .5, 1, 2);
      E_(tOb, 'rise', .6, 1, 3);
      E_(tPl, 'shimmer', .5, 1, 3);
      E_(tU2 - .15, 'whoosh', .5, 1, 3);
      E_(t10, 'click', .7, 1, 4);
      E_(tPl2, 'tick', .4, 1, 2);
      E_(tM, 'tick', .4, 1.2, 2);
      E_(t100, 'rise', .6, 1, 4);
      E_(t1000 - 1.5, 'riser', .8, 1, 5);
      E_(t1000, 'impact', 1.0, 1, 6);
      const kept = [];
      ev.sort((a, b) => b.pr - a.pr || a.time - b.time).forEach(e => {
        if (kept.every(k => Math.abs(k.time - e.time) >= .12)) kept.push(e);
      });
      kept.sort((a, b) => a.time - b.time).forEach(e => add(e.time, e.type, e.gain, e.pitch));
    },
  });
})();
