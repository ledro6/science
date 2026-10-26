(() => {
  // ---------- локальные хелперы ----------
  const fx = (a, b, fn) => {
    if (a <= .002) return;
    g.save(); g.globalAlpha *= a; if (b > .3) g.filter = `blur(${b.toFixed(2)}px)`; fn(); g.restore();
  };
  const vis = (t, tin, tout = 1e9, din = .7, dout = .45, blur = 20) => {
    const p = P(t, tin, din, eexp), q = P(t, tout, dout, eio);
    return [p * (1 - q), (1 - p) * blur + q * blur, p];
  };
  const zoomAt = (px, py, z, fn) => { g.save(); g.translate(px, py); g.scale(z, z); g.translate(-px, -py); fn(); g.restore(); };

  // радиальные стрелки тепла, бегущие наружу
  function heatArrows(cx, cy, R, t, col, a, n = 10, speed = .7, len = 50, travel = 70, sy = 1) {
    if (a <= .002) return;
    for (let i = 0; i < n; i++) {
      const ang = i / n * Math.PI * 2 + .3, u = ((t * speed + i * .37) % 1);
      const r0 = R + u * travel;
      const c = Math.cos(ang), s = Math.sin(ang) * sy;
      arrow(cx + c * r0, cy + s * r0, cx + c * (r0 + len), cy + s * (r0 + len), col, a * Math.sin(u * Math.PI), 6, 18);
    }
  }
  // колеблющиеся струйки горячего воздуха
  function shimmer(x0, x1, yBot, h, t, col, a, n = 6) {
    if (a <= .002) return;
    g.save(); g.lineCap = 'round'; g.lineWidth = 5;
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + .5) / n), u = (t * .6 + i * .29) % 1;
      const y0 = yBot - u * h * .5;
      g.strokeStyle = rgba(col, a * Math.sin(u * Math.PI) * .8);
      g.beginPath();
      for (let k = 0; k <= 20; k++) {
        const yy = y0 - k / 20 * h * .5, xx = x + Math.sin(k * .6 + t * 6 + i) * 10;
        k ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
      }
      g.stroke();
    }
    g.restore();
  }

  defineScene('heat', {
    chapter: 'ТЕПЛО',
    draw(t, s) {
      const CX = LAYOUT.cx;

      // ============ A. «С теплом то же самое» ============
      {
        const tC = Wd('h1', 'С'), tTo = Wd('h1', 'то'), tSa = Wd('h1', 'самое');
        const out = Wd('h1', 'Тепло', 1) - .5;
        if (t < out + .6) {
          const z = 1 + .05 * P(t, s.start, 2.2, eio) + punch(t, Wd('h1', 'теплом'), .06, .6);
          const gp = P(t, tC, 1, eexp) * (1 - P(t, out, .45, eio));
          glow(CX, 700, 520, COL.heat, gp * (.13 + .04 * Math.sin(t * 4)));
          zoomAt(CX, 760, z, () => {
            atextWords('С теплом', CX, 640, tC, t, { size: 150, w: 800, grad: [COL.heat, COL.area], out, stagger: .16, ls: -4, blur: 28 });
            atextWords('то же самое', CX, 790, tTo, t, { size: 84, w: 700, col: COL.ink, out, stagger: .1, ls: -1 });
            const tL = tSa + .35;
            atext('L²', CX - 150, 960, tL, t, { size: 120, w: 800, col: COL.area, out });
            atext('vs', CX, 960, tL + .12, t, { size: 56, w: 600, col: COL.dim, out });
            atext('L³', CX + 150, 960, tL + .24, t, { size: 120, w: 800, col: COL.vol, out });
          });
        }
      }

      // ============ B. куб: тепло рождается в объёме, уходит через поверхность ============
      {
        const tIn = Wd('h1', 'Тепло', 1) - .25, tR = Wd('h1', 'рождается'), tO = Wd('h1', 'объёме'),
          tU = Wd('h1', 'уходит'), tPo = Wd('h1', 'поверхность');
        const out = E('h1') + .02;
        if (t > tIn - .1 && t < out + .6) {
          const [a, b, p] = vis(t, tIn, out, .7, .45, 24);
          const z = lerp(.9, 1, P(t, tIn, .9, espr)) + .06 * P(t, tR, 3, eio) + punch(t, tO, .06, .5) + punch(t, tPo, .06, .5);
          const hot = P(t, tR - .3, 1.2, eio), pulse = .5 + .5 * Math.sin(t * 5);
          const cool = P(t, tU, 1.2, eio);
          const surf = P(t, tPo, .5, eexp);
          fx(a, b, () => zoomAt(CX, 760, z, () => {
            glow(CX, 760, 420, COL.heat, (.12 + .08 * pulse) * hot);
            const cc = cam(.62 + .25 * Math.sin((t - tIn) * .5), .5, CX, 760, 130);
            const body = mix(mix(COL.cube, COL.heat, .55 * hot + .12 * pulse * hot), COL.heat, .1 * hot * (1 - cool * .4));
            const faceCol = mix(body, COL.area, .35 * surf);
            drawCubes(cc, [{ p: [-1, -1, -1], s: 2, col: body, faces: [faceCol, faceCol, faceCol, faceCol, faceCol, faceCol],
              a: 1, ea: .5 + .5 * surf, edge: mix(COL.ink, COL.area, surf), lw: 1.6 + 2.4 * surf }]);
            // ядро тепла внутри
            g.save(); g.globalCompositeOperation = 'lighter';
            glow(CX, 760, 150 + 30 * pulse, COL.heat, .45 * hot);
            glow(CX, 760, 60, hex('#FFD9A0'), .5 * hot);
            g.restore();
            heatArrows(CX, 760, 250, t, COL.area, P(t, tU, .5, eexp), 12, .9, 60, 90);
          }));
          atext('рождается в объёме', CX, 375, tO - .2, t, { size: 58, w: 800, col: COL.vol, out });
          atext('уходит через поверхность', CX, 1170, tPo - .1, t, { size: 54, w: 800, col: COL.area, out });
        }
      }

      // ============ C. землеройка ============
      {
        const tK = Wd('h2', 'Крошечная'), tZ = Wd('h2', 'землеройка'), tOs = Wd('h2', 'остывает'), tB = Wd('h2', 'быстро'),
          tCh = Wd('h2', 'что'), tSe = Wd('h2', 'съедает'), tV = Wd('h2', 'вес');
        const out = E('h2') + .02;
        if (t > tK - .3 && t < out + .6) {
          const [a, b] = vis(t, tK - .15, out, .6, .45);
          const big = P(t, tZ, .8, espr), up = P(t, tCh - .1, .7, eio);
          const S = lerp(lerp(1.0, 2.6, big), 1.5, up);
          const gx = CX, gy = lerp(760, 590, up);                // центр мыши
          const cold = P(t, tOs, 1.6, eio);
          const col = mix(mix(COL.ink, COL.heat, .55), mix(COL.ink, COL.vol, .6), cold);
          const z = 1 + punch(t, tZ, .06, .5) + punch(t, tB, .07, .5);
          fx(a, b, () => zoomAt(CX, 760, z, () => {
            glow(gx, gy, 260 * S / 2, COL.heat, .2 * (1 - cold) + .06);
            const ha = P(t, tOs, .4, eexp) * (1 - .5 * up);
            const spd = lerp(1.1, 2.2, P(t, tB, .4));
            heatArrows(gx, gy, 140 * S / 2.6 + 30, t, COL.heat, ha, 12, spd, 44, 80 + 40 * P(t, tB, .4), .75);
            drawMouse(gx + 20 * S, gy + 32 * S, S, { col });
          }));
          atext('землеройка · 5 г', CX, 900, tZ + .2, t, { size: 44, w: 600, col: COL.dim, ls: 2, out: tCh - .2, dy: 14 });

          // кольцо: еда за сутки ≈ вес тела
          const RX = CX, RY = 900, R = 160;
          const [ar, br] = vis(t, tCh, out, .6, .45);
          const pr = .95 * P(t, tSe, tV - tSe + .3, eio);
          const pk = 1 + punch(t, tV, .08, .5);
          fx(ar, br, () => zoomAt(RX, RY, pk, () => {
            g.save(); g.lineCap = 'round';
            g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 26;
            g.beginPath(); g.arc(RX, RY, R, 0, Math.PI * 2); g.stroke();
            if (pr > .002) {
              g.strokeStyle = rgba(COL.area); g.shadowColor = rgba(COL.area, .7); g.shadowBlur = 30;
              g.beginPath(); g.arc(RX, RY, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); g.stroke();
            }
            g.restore();
            // крошки еды летят к мыши
            if (t > tSe && t < tV + .6) {
              const r = rng(12);
              for (let i = 0; i < 10; i++) {
                const t0 = tSe + i * .11, u = clamp((t - t0) / .55);
                if (u <= 0 || u >= 1) continue;
                const ang = -Math.PI / 2 + Math.PI * 2 * pr * r();
                const x0 = RX + Math.cos(ang) * R, y0 = RY + Math.sin(ang) * R;
                const x1 = CX + 70, y1 = 580;
                const x = lerp(x0, x1, eio(u)), y = lerp(y0, y1, eio(u)) - Math.sin(u * Math.PI) * 60;
                circle(x, y, 7, COL.area, Math.sin(u * Math.PI));
              }
            }
          }));
          atext(Math.round(pr * 100) + '%', RX, RY, tSe - .1, t, { size: 96, w: 800, col: COL.area, out, dur: .6 });
          atext('еда за сутки ≈ вес тела', CX, 1150, tV - .1, t, { size: 52, w: 800, col: COL.ink, out });
        }
      }

      // ============ D. слону жарко — машет ушами ============
      {
        const tIn = Wd('h3', 'А') - .15, tSl = Wd('h3', 'слону'), tJ = Wd('h3', 'жарко'),
          tOb = Wd('h3', 'обмахивается'), tOg = Wd('h3', 'огромными'), tU = Wd('h3', 'ушами');
        if (t > tIn - .1) {
          const [a, b] = vis(t, tIn, 1e9, .7, .45, 24);
          const S = 1.85, GY = 1000, X0 = CX - 40 * S;
          const ex = X0 + 96 * S, ey = GY - 196 * S;          // ухо
          const amp = P(t, tOb - .1, .4, eexp) * lerp(.7, 1, P(t, tOg, .4));
          const flap = amp * (.5 + .5 * Math.sin((t - tOb) * 11 - Math.PI / 2));
          const hotP = P(t, tJ, .6, eexp), cool = P(t, tU, 1.0, eio);
          const hot = hotP * (1 - .7 * cool);
          const col = mix(COL.ink, COL.heat, .45 * hot);
          const zIn = P(t, tOg - .1, .9, eio);
          const z = lerp(1.06, 1, P(t, tIn, 1, eexp)) + punch(t, tJ, .06, .5) + punch(t, tU, .05, .5);
          fx(a, b, () => zoomAt(lerp(CX, ex, .5 * zIn), lerp(760, ey, .5 * zIn), z + .05 * zIn, () => {
            glow(CX, 760, 460, COL.red, .16 * hot);
            shimmer(X0 - 120 * S, X0 + 120 * S, 600, 240, t, COL.heat, hot * (1 - .6 * cool), 6);
            line(90, GY, 950, GY, COL.faint, 1, 3);
            drawElephant(X0, GY, S, { col, flap });
            // волны жара от уха
            const wa = P(t, tU - .15, .4, eexp);
            if (wa > 0) {
              g.save(); g.lineCap = 'round';
              for (let i = 0; i < 4; i++) {
                const u = ((t - tU) * 1.1 + i * .25) % 1;
                if (t < tU - .15) continue;
                const r = 80 + u * 170;
                g.strokeStyle = rgba(mix(COL.heat, COL.area, u), wa * Math.sin(u * Math.PI) * .9);
                g.lineWidth = 7 * (1 - u * .5);
                g.beginPath(); g.arc(ex, ey - 20, r, Math.PI * 1.3, Math.PI * 1.75); g.stroke();
              }
              g.restore();
            }
          }));
          const [at, bt] = vis(t, tJ, tOb - .1, .5, .4);
          fx(at, bt, () => atext('жарко', CX, 420, tJ, t, { size: 110, w: 800, grad: [COL.red, COL.heat], scale0: 1.15 }));
        }
      }
    },

    sfx(add, s) {
      add(Wd('h1', 'теплом'), 'swell', .5);
      add(Wd('h1', 'то'), 'tick', .35);
      add(Wd('h1', 'самое') + .35, 'pop', .45);
      add(Wd('h1', 'Тепло', 1) - .25, 'whoosh', .4);
      add(Wd('h1', 'рождается'), 'rise', .45);
      add(Wd('h1', 'объёме'), 'bloom', .7);
      add(Wd('h1', 'уходит'), 'shimmer', .55);
      add(Wd('h1', 'поверхность'), 'chime', .65);

      add(Wd('h2', 'Крошечная'), 'pop', .4, 1.5);
      add(Wd('h2', 'землеройка'), 'boing', .5, 1.4);
      add(Wd('h2', 'остывает'), 'shimmer', .6, 1.2);
      add(Wd('h2', 'быстро'), 'whoosh', .5);
      add(Wd('h2', 'что'), 'pop', .4);
      add(Wd('h2', 'съедает'), 'rise', .45);
      add(Wd('h2', 'вес'), 'chime', .8, 1.1);

      add(Wd('h3', 'слону'), 'thud', .6);
      add(Wd('h3', 'жарко'), 'swell', .55);
      add(Wd('h3', 'обмахивается'), 'whoosh', .4);
      add(Wd('h3', 'огромными'), 'whoosh', .35, .8);
      add(Wd('h3', 'ушами'), 'bloom', .6);
    },
  });
})();
