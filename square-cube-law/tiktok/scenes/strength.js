(() => {
  // ---------- локальные хелперы ----------
  // группа с прозрачностью и размытием
  const fx = (a, b, fn) => {
    if (a <= .002) return;
    g.save(); g.globalAlpha *= a; if (b > .3) g.filter = `blur(${b.toFixed(2)}px)`; fn(); g.restore();
  };
  // появление (blur-in) в tin, исчезновение (blur-out) в tout → [альфа, размытие, прогресс появления]
  const vis = (t, tin, tout = 1e9, din = .7, dout = .45, blur = 20) => {
    const p = P(t, tin, din, eexp), q = P(t, tout, dout, eio);
    return [p * (1 - q), (1 - p) * blur + q * blur, p];
  };
  // зум вокруг точки (точка остаётся на месте)
  const zoomAt = (px, py, z, fn) => { g.save(); g.translate(px, py); g.scale(z, z); g.translate(-px, -py); fn(); g.restore(); };
  const fmt = v => '×' + Math.round(v).toLocaleString('ru-RU').replace(/\s/g, ' ');

  function bar(x, y, w, h, p, col, a, minW = 0) {
    if (a <= .002) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fill();
    const fw = Math.max(minW * clamp(p * 8), w * p);
    if (fw > 1) {
      const gr = g.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, rgba(mix(col, COL.bg, .25))); gr.addColorStop(1, rgba(col));
      g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, fw, h, h / 2); g.fill();
      g.shadowColor = rgba(col, .8); g.shadowBlur = 26; g.fill();
    }
    g.restore();
  }

  // колонна поверх ноги слона (в локальных координатах drawElephant)
  function columnOver(lx, q, col, p) {
    const top = -150 + q, w = 46;
    g.fillStyle = rgba(col);
    const cw = w + 22 * p, ch = 16 * p;
    g.beginPath(); g.roundRect(lx + w / 2 - cw / 2, top - ch, cw, ch + 2, 3); g.fill();          // капитель
    g.beginPath(); g.roundRect(lx + w / 2 - cw / 2 + 3, top - ch - 7 * p, cw - 6, 7 * p, 2); g.fill();
    g.beginPath(); g.roundRect(lx + w / 2 - cw / 2, -10 * p, cw, 10 * p, 2); g.fill();             // база
    g.strokeStyle = rgba(mix(col, COL.bg, .55), p); g.lineWidth = 3;
    for (let i = 1; i < 4; i++) { const x = lx + i * w / 4; g.beginPath(); g.moveTo(x, top + 6); g.lineTo(x, -14); g.stroke(); }
  }

  defineScene('strength', {
    chapter: 'ПРОЧНОСТЬ',
    draw(t, s) {
      const CX = LAYOUT.cx;

      // ============ A. «А теперь главное» ============
      {
        const tA = Wd('s1', 'А'), tG = Wd('s1', 'главное'), out = Wd('s1', 'Прочность') - .35;
        const z = 1 + .05 * P(t, s.start, 2.4, eio) + punch(t, tG, .07, .6);
        if (t < out + .6) zoomAt(CX, 740, z, () => {
          atext('А теперь', CX, 620, tA, t, { size: 76, w: 700, col: COL.dim, out, ls: -1 });
          atext('главное', CX, 770, tG, t, { size: 196, w: 800, grad: [COL.area, COL.vol], out, ls: -6, blur: 30, scale0: 1.12, dur: 1.0 });
          const gp = P(t, tG, .8, eexp) * (1 - P(t, out, .45, eio));
          glow(CX, 770, 520, COL.area, .09 * gp);
        });
      }

      // ============ B. кость: сечение (L²) и объём (L³) ============
      {
        const tP = Wd('s1', 'Прочность'), tK = Wd('s1', 'кости'), tZ = Wd('s1', 'зависит'),
          tS = Wd('s1', 'площади'), tSe = Wd('s1', 'сечения'), tV = Wd('s1', 'вес'), tO = Wd('s1', 'объёма');
        const out = E('s1') + .05;
        if (t > tP - .3 && t < out + .6) {
          const zo = P(t, tV - .25, .9, eio);
          const z = lerp(1.22, 1, zo) + punch(t, tS, .05, .5) + punch(t, tO, .05, .5);
          const cyTop = 470;
          zoomAt(CX, cyTop, z, () => {
            // кость
            const [ab, bb, pb] = vis(t, tP, tS - .1, .7, .5);
            fx(ab, bb, () => {
              const k = lerp(.9, 1, pb);
              zoomAt(CX, cyTop, k, () => drawBone(CX, cyTop, 600, 104, COL.ink, 1));
            });
            atext('кость', CX, cyTop - 130, tK, t, { size: 40, w: 600, col: COL.dim, ls: 6, out: tS - .1, dy: 14 });
            // линия разреза
            const pc = P(t, tZ, .45, eexp) * (1 - P(t, tS + .2, .4, eio));
            if (pc > 0) line(CX, cyTop - 95 * pc, CX, cyTop + 95 * pc, COL.area, pc, 5, [10, 10]);
            // сечение: «поворачивается» к зрителю
            const [ac, bc] = vis(t, tS, out, .6, .45);
            const turn = P(t, tS, .8, espr);
            fx(ac, bc, () => {
              const R = 118, rx = Math.max(4, R * turn);
              glow(CX, cyTop, 260, COL.area, .22 * turn);
              ellipse(CX, cyTop, rx, R, 0, COL.area, 1);
              ellipse(CX, cyTop, rx * .52, R * .52, 0, mix(COL.area, COL.bg, .6), 1);
              g.strokeStyle = rgba(mix(COL.area, COL.ink, .5), .8); g.lineWidth = 3;
              g.beginPath(); g.ellipse(CX, cyTop, rx, R, 0, 0, Math.PI * 2); g.stroke();
            });
            atext('площадь сечения', CX, cyTop + 175, tSe - .1, t, { size: 36, w: 600, col: COL.dim, ls: 3, out, dy: 14 });
            atext('прочность ∝ L²', CX, cyTop + 245, tSe + .1, t, { size: 70, w: 800, col: COL.area, out });

            // куб тела
            const cyB = 945;
            const [av, bv] = vis(t, tV, out, .6, .45);
            const drop = P(t, tV, .75, espr);
            const fill = P(t, tO, .6, eexp);
            fx(av, bv, () => {
              const cc = cam(.62 + .35 * (t - tV) * .25, .5, CX, cyB - (1 - drop) * 120, 92);
              glow(CX, cyB, 300, COL.vol, .16 * fill);
              drawCubes(cc, [{ p: [-1, -1, -1], s: 2, col: mix(COL.cube, COL.vol, .2 + .6 * fill), a: 1, ea: .55 }]);
            });
            atext('вес ∝ L³', CX, 1165, tO, t, { size: 70, w: 800, col: COL.vol, out });
          });
        }
      }

      // ============ C. муравей ×100 и два счётчика ============
      {
        const tM = Wd('s2', 'Муравей'), t100 = Wd('s2', 'сто'), tT = Wd('s2', 'тяжелее'), tMil = Wd('s2', 'миллион'),
          tN = Wd('s2', 'ноги'), t10 = Wd('s2', 'десять'), tTh = Wd('s2', 'тысяч');
        const out = E('s2') - .22;
        if (t > tM - .3 && t < out + .6) {
          const grow = P(t, t100, .8, espr), move = P(t, tT - .25, .7, eio);
          // муравей: маленький → ×100 → уезжает в «шапку»
          const S = lerp(lerp(.75, 2.3, grow), .78, move);
          const cx = lerp(CX, 300, move), cy = lerp(720, 445, move);
          const [aa, ba] = vis(t, tM - .1, out, .6, .45);
          fx(aa, ba, () => drawAnt(cx - 8 * S, cy + 56 * S, S, { col: COL.ink }));
          const z100 = 1 + punch(t, t100, .25, .6);
          const sx = lerp(CX, 640, move), sy = lerp(400, 440, move), ss = lerp(130, 104, move) * z100;
          atext('×100', sx, sy, t100, t, { size: ss, w: 800, col: COL.ink, out, align: 'center' });
          if (move > 0) line(110, 540, 930, 540, COL.faint, move * (1 - P(t, out, .45, eio)), 2);

          // ряд «вес»
          const L = 110, BW = 820;
          atext('вес', L, 620, tT, t, { size: 40, w: 600, col: COL.dim, align: 'left', ls: 4, out, dy: 14 });
          const pv = 1 + punch(t, tMil, .12, .5);
          acount(1e6, L, 705, tMil, t, { prefix: '×', size: 108 * pv, w: 800, col: COL.vol, align: 'left', out, dur: 1.1 });
          const [abv] = vis(t, tT + .1, out, .5);
          bar(L, 780, BW, 30, P(t, tMil, 1.1, eexp), COL.vol, abv);

          // ряд «прочность ног»
          atext('прочность ног', L, 905, tN, t, { size: 40, w: 600, col: COL.dim, align: 'left', ls: 4, out, dy: 14 });
          const pa = 1 + punch(t, t10, .12, .5);
          acount(1e4, L, 990, t10, t, { prefix: '×', size: 108 * pa, w: 800, col: COL.area, align: 'left', out, dur: .9 });
          const [aba] = vis(t, tN + .1, out, .5);
          bar(L, 1065, BW, 30, .01 * P(t, t10, .9, eexp), COL.area, aba, 14);
          atext('в 100 раз меньше', L + BW, 1160, tTh - .05, t, { size: 46, w: 700, col: COL.red, align: 'right', out, dy: 16 });
        }
      }

      // ============ D. гигант ломается ============
      {
        const tIn = E('s2') - .03, tH = Wd('s3', 'Хруст'), tL = Wd('s3', 'ломается'),
          tSo = Wd('s3', 'собственным'), tVe = Wd('s3', 'весом');
        const out = E('s3') - .12;
        if (t > tIn - .1 && t < out + .6) {
          const [a, b, p] = vis(t, tIn, out, .4, .4, 26);
          const GY = 1010, S = 3.35, X0 = CX - 8 * S;
          const b1 = clamp(eback(clamp((t - tH) / .35)), 0, 1.15) * .55;
          const b2 = clamp(eback(clamp((t - tL) / .4)), 0, 1.1) * .5;
          const tremble = t < tH ? .03 * Math.sin(t * 60) * P(t, tIn, .5) : 0;
          const buckle = Math.max(0, tremble + b1 + b2);
          const [sx1, sy1] = shake(t, tH, 30, .55), [sx2, sy2] = shake(t, tL, 18, .45);
          const z = lerp(1.08, 1, p) + punch(t, tH, .07, .6) + punch(t, tL, .04, .5) + .03 * P(t, tL + .3, 1.5, eio);
          fx(a, b, () => {
            g.save(); g.translate(sx1 + sx2, sy1 + sy2);
            zoomAt(CX, 820, z, () => {
              // красное зарево нагрузки
              glow(CX, 820, 560, COL.red, .12 * P(t, tH, .3) * (1 - .5 * P(t, tH + .4, 1)));
              line(80, GY, 960, GY, COL.faint, 1, 3);
              drawAnt(X0, GY, S, { col: COL.ink, buckle, crack: P(t, tH, .12) });
              // вспышки в коленях
              const legs = [[4, 26], [12, 6], [20, -26]];
              legs.forEach(([hx, kx], i) => {
                const kxx = hx + kx * (1 + buckle * .7), kyy = lerp(-64, -26, buckle);
                const fl = P(t, tH + i * .04, .08) * (1 - P(t, tH + .1 + i * .04, .5, eout));
                glow(X0 + kxx * S, GY + kyy * S, 130, COL.ink, .55 * fl);
              });
              // осколки
              if (t > tH) {
                const r = rng(31);
                for (let i = 0; i < 26; i++) {
                  const leg = legs[i % 3], kxx = leg[0] + leg[1] * 1.385, kyy = lerp(-64, -26, .55);
                  const t0 = tH + (i % 3) * .04 + r() * .05, u = clamp((t - t0) / (.9 + .5 * r()));
                  if (u <= 0 || u >= 1) { r(); r(); r(); continue; }
                  const ang = -Math.PI * (.1 + .8 * r()), sp = 220 + 380 * r(), gv = 900;
                  const tt = u * 1.2;
                  const px = X0 + kxx * S + Math.cos(ang) * sp * tt, py = GY + kyy * S + Math.sin(ang) * sp * tt + .5 * gv * tt * tt;
                  if (py > GY) continue;
                  g.save(); g.translate(px, py); g.rotate(t * 8 + i);
                  g.fillStyle = rgba(i % 4 ? COL.ink : COL.red, 1 - u);
                  const sz = 5 + 8 * r(); g.fillRect(-sz / 2, -sz / 3, sz, sz * .66); g.restore();
                }
              }
              // пыль по земле при падении
              if (t > tL) {
                const r = rng(77);
                for (let i = 0; i < 30; i++) {
                  const u = clamp((t - tL - .15 - r() * .1) / 1.4), side = i % 2 ? 1 : -1;
                  const x = X0 + (r() * 160 - 40) * S * .5 + side * eout(u) * (120 + 260 * r());
                  const y = GY - 10 - eout(u) * (20 + 70 * r());
                  circle(x, y, (10 + 20 * r()) * (.4 + u), COL.dim, .28 * (1 - u) * clamp(u * 6));
                }
              }
            });
            g.restore();
          });
          // стрелка «вес» давит сверху
          const pw = P(t, tSo, .5, espr);
          const [aw, bw] = vis(t, tSo, out, .45, .45);
          fx(aw, bw, () => {
            const ax = X0 - 52 * S, yTip = lerp(620, 810, pw) + punch(t, tVe, 40, .5);
            glow(ax, yTip - 60, 200, COL.vol, .25);
            arrow(ax, yTip - 230, ax, yTip, COL.vol, 1, 18, 50);
          });
          atext('вес ×1 000 000', CX, 450, tVe - .15, t, { size: 64, w: 800, col: COL.vol, out });
        }
      }

      // ============ E. слон: ноги-колонны ============
      {
        const tIn = Wd('s4', 'Вот') - .02, tSl = Wd('s4', 'слона'), tN = Wd('s4', 'ноги'), tKo = Wd('s4', 'колонны');
        if (t > tIn - .1) {
          const [a, b, p] = vis(t, tIn, 1e9, .7, .45, 24);
          const S = 1.72, GY = 905, X0 = CX - 40 * S;
          const z = lerp(1.1, 1, P(t, tIn, 1.2, eexp)) + punch(t, tN, .04, .5) + punch(t, tKo, .07, .6) + .03 * P(t, tKo, 1.2, eio);
          const lp = P(t, tN, .5, eexp), cp = P(t, tKo, .55, espr);
          fx(a, b, () => zoomAt(CX, 760, z, () => {
            glow(CX, GY - 80, 380, COL.area, .14 * lp);
            line(90, GY, 950, GY, COL.faint, 1, 3);
            drawElephant(X0, GY, S, { col: COL.ink, legCol: mix(COL.ink, COL.area, lp) });
            if (cp > 0) withT(X0, GY, S, 1, () => {
              [[-88, mix(mix(COL.ink, COL.area, lp), COL.bg, .4)], [84, mix(mix(COL.ink, COL.area, lp), COL.bg, .4)],
                [-112, mix(COL.ink, COL.area, lp)], [56, mix(COL.ink, COL.area, lp)]]
                .forEach(([lx, c], i) => { g.save(); g.globalAlpha *= clamp(cp * 1.3 - i * .08); columnOver(lx, 0, c, clamp(cp)); g.restore(); });
            });
          }));
          // кости Галилея: тонкая vs толстая
          const [ab1, bb1, pb1] = vis(t, tN + .2, 1e9, .6);
          fx(ab1, bb1, () => drawBone(270, 1080, 260 * lerp(.85, 1, pb1), 26, COL.dim, 1));
          const [ab2, bb2, pb2] = vis(t, tN + .45, 1e9, .6);
          fx(ab2, bb2, () => drawBone(700, 1080, 290 * lerp(.85, 1, pb2), 96 * lerp(.7, 1, P(t, tN + .45, .7, espr)), COL.area, 1));
          atext('мышь', 270, 1175, tN + .3, t, { size: 38, w: 600, col: COL.dim, ls: 3, dy: 12 });
          atext('слон', 700, 1175, tN + .55, t, { size: 38, w: 600, col: COL.area, ls: 3, dy: 12 });
          atext('ноги-колонны', CX, 400, tKo, t, { size: 84, w: 800, grad: [COL.area, COL.ink], scale0: 1.1 });
        }
      }
    },

    sfx(add, s) {
      add(Wd('s1', 'А') - .05, 'swell', .4);
      add(Wd('s1', 'главное'), 'bloom', .85);
      add(Wd('s1', 'Прочность'), 'pop', .5);
      add(Wd('s1', 'зависит'), 'tick', .4);
      add(Wd('s1', 'площади'), 'chime', .75, 1.0);
      add(Wd('s1', 'вес'), 'thud', .6);
      add(Wd('s1', 'объёма'), 'chime', .7, .75);

      add(Wd('s2', 'Муравей'), 'pop', .5, 1.3);
      add(Wd('s2', 'сто'), 'boing', .6);
      add(Wd('s2', 'тяжелее') - .2, 'whoosh', .35);
      add(Wd('s2', 'миллион'), 'chime', .8, 1.2);
      add(Wd('s2', 'ноги'), 'pop', .4);
      add(Wd('s3', 'Хруст') - 1.5, 'riser', .5);  // ведёт к «Хруст»
      add(Wd('s2', 'десять'), 'chime', .55, .7);
      add(Wd('s2', 'тысяч') + .1, 'tick', .45);

      add(Wd('s3', 'Хруст') - .02, 'crack', 1.0);
      add(Wd('s3', 'Хруст') + .12, 'impact', .9);
      add(Wd('s3', 'ломается'), 'thud', .9);
      add(Wd('s3', 'ломается') + .15, 'fall', .35);
      add(Wd('s3', 'собственным'), 'whoosh', .45);
      add(Wd('s3', 'весом'), 'impact', .5, 1.2);

      add(Wd('s4', 'Вот') - .1, 'swell', .4);
      add(Wd('s4', 'ноги'), 'chime', .6, 1.1);
      add(Wd('s4', 'ноги') + .45, 'pop', .4);
      add(Wd('s4', 'колонны'), 'bloom', .8);
    },
  });
})();
