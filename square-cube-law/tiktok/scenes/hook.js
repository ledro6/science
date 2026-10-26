// Хук (k1–k3): муравей-гигант ломается, блоха ×100 против слона, «закон квадрата и куба».
(() => {
  // Первая сцена должна быть видна уже на кадре t=0 (движок пропускает t < start − 0.01).
  if (TL.scenes[0].id === 'hook') TL.scenes[0].start = 0;

  // группа с общей прозрачностью и размытием (для blur-in / blur-out подсцен)
  function grp(a, b, fn) {
    if (a <= .002) return;
    g.save(); g.globalAlpha *= a;
    if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`;
    fn(); g.restore();
  }

  // ---------------- k1: муравей размером со слона ----------------
  const GY = 1060, AX = 290, EX = 728;
  function antScene(t) {
    const tUp = Wd('k1', 'увеличить'), tEl = Wd('k1', 'слона'), tDie = Wd('k1', 'погибнет');
    const q = P(t, C('k2') - .3, .4, eio);
    const a = 1 - q;
    if (a <= .002) return;
    const gu = P(t, tUp, 2.0, espr);          // рост муравья — пружина
    const zu = P(t, tUp - .08, .75, eexp);          // камера отъезжает
    const sc = lerp(.26, 2.1, gu);
    const z = lerp(3.2, 1, zu) * (1 + punch(t, tDie, .06, .6) + punch(t, tUp, .03, .5));
    const [sx, sy] = shake(t, tDie, 24, .6);
    const cx = lerp(AX, 540, zu) - sx / z, cy = lerp(GY - 22, 960, zu) - sy / z;
    const die = P(t, tDie, .3, eout);

    grp(a, q * 22, () => {
      withCam(cx, cy, z, () => {
        // красная вспышка при «гибели»
        glow(AX, GY - 120, 420, COL.red, .38 * die * (1 - .5 * P(t, tDie + .5, .6)));
        // мягкий свет под крошечным муравьём в начале
        glow(AX, GY - 20, 90, COL.area, .22 * (1 - zu));
        line(70, GY, 950, GY, COL.faint, 1, 2.5);
        // слон для сравнения
        const ea = P(t, tEl - .3, .8, eexp);
        grp(ea, (1 - ea) * 18, () => {
          drawElephant(EX, GY, .92, { col: mix(COL.ink, COL.bg, .45), squat: .25 * die });
        });
        // муравей: рост → излом
        const bk = Math.min(1.08, P(t, tDie, .45, espr));
        const col = mix(COL.ink, COL.red, .55 * die);
        drawAnt(AX, GY, sc, { col, buckle: bk, crack: P(t, tDie + .05, .25, eout) });
      });
      // подписи (экранные координаты)
      atext('5 мм', 540, 1110, -1, t, { size: 44, w: 600, col: COL.dim, out: tUp - .05, outDur: .3 });
      const lw = 80 * (1 - P(t, tUp - .05, .3, eio));
      if (lw > 1) {
        line(540 - lw, 1050, 540 + lw, 1050, COL.dim, .8, 3);
        line(540 - lw, 1040, 540 - lw, 1060, COL.dim, .8, 3);
        line(540 + lw, 1040, 540 + lw, 1060, COL.dim, .8, 3);
      }
      atext('муравей', AX, GY + 56, tUp + .5, t, { size: 34, w: 600, col: COL.dim, ls: 3 });
      atext('слон', EX, GY + 56, tEl, t, { size: 34, w: 600, col: COL.dim, ls: 3 });
      atext('3 м', AX, GY - 300, tUp + .55, t, { size: 64, w: 800, col: COL.area, out: tDie - .1, outDur: .3 });
      atext('✕', AX, GY - 330, tDie + .05, t, { size: 120, w: 800, col: COL.red, dur: .5, scale0: 1.6 });
    });
  }

  // ---------------- k2: блоха ×100 и слон «0 см» ----------------
  const GY2 = 1120, FA = 200, FB = 430, JH = 640, PER = 1.45, JD = .85;
  const arcY = u => GY2 - 4 * u * (1 - u) * JH;
  function fleaScene(t) {
    const t0 = C('k2'), tJ = Wd('k2', 'прыгает'), t100 = Wd('k2', 'сто');
    const tEl = Wd('k2', 'слон'), tUp = Wd('k2', 'подпрыгнуть');
    const pin = P(t, t0 - .2, .6, eexp), q = P(t, C('k3') - .3, .4, eio);
    const a = pin * (1 - q);
    if (a <= .002) return;
    const zu = P(t, tJ - .3, .6, eexp);
    const z = lerp(1.8, 1, zu) * (1 + punch(t, t100, .04, .5) + punch(t, tUp + .35, .05, .5));
    const cx = lerp(FA + 40, 540, zu), cy = lerp(GY2 - 40, 960, zu);

    // положение блохи
    let fx = FA, fy = GY2, dir = 1;
    if (t > tJ) {
      const n = Math.floor((t - tJ) / PER), u = clamp((t - tJ - n * PER) / JD);
      const from = n % 2 ? FB : FA, to = n % 2 ? FA : FB;
      dir = n % 2 ? -1 : 1;
      fx = lerp(from, to, u); fy = arcY(u);
    }
    grp(a, (1 - pin) * 20 + q * 22, () => {
      withCam(cx, cy, z, () => {
        line(70, GY2, 950, GY2, COL.faint, 1, 2.5);
        // пунктирная дуга прыжка
        const pr = clamp((t - tJ) / JD);
        if (pr > 0) {
          g.save(); g.setLineDash([4, 14]); g.strokeStyle = rgba(COL.area, .55); g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath();
          for (let i = 0; i <= 60; i++) { const u = pr * i / 60; g.lineTo(lerp(FA, FB, u), arcY(u)); }
          g.stroke(); g.restore();
        }
        // стрелка высоты ×100
        const ha = P(t, t100 - .1, .7, eexp);
        if (ha > 0) {
          const top = lerp(GY2, GY2 - JH, ha);
          arrow(112, GY2 - 8, 112, top, COL.area, .85, 4, 22);
          line(94, GY2 - JH, 130, GY2 - JH, COL.area, .85 * ha, 3);
        }
        glow(fx, fy - 12, 70, COL.area, .3);
        g.save(); g.translate(fx, 0); g.scale(dir, 1);
        drawFlea(0, fy, 1.8, { a: P(t, t0 - .2, .5, eexp) });
        g.restore();
        // слон
        const ea = P(t, tEl - .3, .7, eexp);
        const sq = Math.abs(Math.sin(clamp((t - tUp + .05) / 1.3) * Math.PI * 2));
        grp(ea, (1 - ea) * 18, () => drawElephant(715, GY2, .8, { squat: sq }));
        // «потолок» прыжка слона
        const za = P(t, tUp + .3, .5, eexp);
        if (za > 0) line(570, GY2 - 236, 900, GY2 - 236, COL.red, .8 * za, 3, [8, 10]);
      });
      atext('блоха', FA, GY2 + 56, t0, t, { size: 34, w: 600, col: COL.dim, ls: 3 });
      atext('×100', 680, 520, t100 - .05, t, { size: 180, w: 800, grad: [COL.area, COL.heat], dy: 40, scale0: 1.25 });
      atext('своего роста', 680, 630, t100 + .25, t, { size: 38, w: 600, col: COL.dim, ls: 2 });
      atext('слон', 715, GY2 + 56, tEl - .1, t, { size: 34, w: 600, col: COL.dim, ls: 3 });
      atext('0 см', 735, 800, tUp + .3, t, { size: 110, w: 800, col: COL.red, scale0: 1.4, dur: .6 });
    });
  }

  // ---------------- k3: геометрия → закон квадрата и куба ----------------
  function lawScene(t) {
    const t0 = C('k3'), tG = Wd('k3', 'геометрия'), tE = Wd('k3', 'это');
    const tZ = Wd('k3', 'закон'), tQ = Wd('k3', 'квадрата'), tI = Wd('k3', 'и'), tK = Wd('k3', 'куба');
    if (t < t0) return;
    const z = 1 + punch(t, tZ, .05, .55) + punch(t, tK, .06, .55);
    withCam(540, 960, z, () => {
      // вращающийся каркас куба
      const ap = P(t, tG - .2, .9, eexp);
      const sp = lerp(.35, 1, P(t, tG - .2, 1.0, espr));
      const mv = P(t, tE - .05, 1.0, eio);
      const yaw = .62 + 2.2 * eexp(clamp((t - tG + .2) / 1.8)) + .35 * (t - tG);
      const c = cam(yaw, .5, LAYOUT.cx, lerp(740, 470, mv), lerp(165, 95, mv));
      const s = 2 * sp, p0 = [-s / 2, -s / 2, -s / 2];
      grp(ap, (1 - ap) * 24, () => {
        glow(LAYOUT.cx, lerp(740, 470, mv), lerp(520, 300, mv), COL.vol, .16);
        // объём (голубая заливка) на «куба»
        const va = P(t, tK - .05, .6, eexp);
        if (va > 0) drawCubes(c, [{ p: p0, s, col: mix(COL.cube, COL.vol, .7), a: .85 * va, ea: 0 }]);
        // площадь (янтарная грань) на «квадрата»
        const fa = P(t, tQ - .05, .5, eexp) * (1 - .25 * va);
        const v = corners(p0, s);
        // грань, обращённая к зрителю сильнее всего
        let best = 0, bz = -9;
        FACES.forEach(([n], i) => { const r = rot(c, n)[2]; if (r > bz) { bz = r; best = i; } });
        quad3(c, FACES[best][1].map(k => v[k]), COL.area, .9 * fa);
        drawWire(c, p0, s, COL.ink, .95, 3);
      });
      // заголовок: слова проявляются синхронно с речью
      const size = 104, L1 = ['Закон', 'квадрата'], L2 = ['и', 'куба'];
      const T1 = [tZ - .05, tQ - .05], T2 = [tI - .05, tK - .05];
      g.save(); g.font = `800 ${size}px ${FONT}`; g.letterSpacing = '-2px';
      const sp_ = g.measureText(' ').width, MW = {}; [...L1, ...L2].forEach(w => MW[w] = g.measureText(w).width); const m = w => MW[w] ?? g.measureText(w).width;
      const w1 = m(L1.join(' ')), w2 = m(L2.join(' '));
      const span = [LAYOUT.cx - Math.max(w1, w2) / 2, LAYOUT.cx + Math.max(w1, w2) / 2];
      const row = (ws, ts, y, tw) => {
        let x = LAYOUT.cx - tw / 2;
        ws.forEach((w, i) => {
          atext(w, x, y, ts[i], t, { size, w: 800, ls: -2, align: 'left', grad: [COL.area, COL.vol], gradSpan: span, dy: 36, blur: 26 });
          x += m(w) + sp_;
        });
      };
      g.restore();
      row(L1, T1, 790, w1);
      row(L2, T2, 905, w2);
      // формулы на стеклянных плашках
      const fq = P(t, tQ, .7, eexp), fk = P(t, tK, .7, eexp);
      glass(LAYOUT.cx - 400, 1020, 370, 130, 34, fq);
      glass(LAYOUT.cx + 30, 1020, 370, 130, 34, fk);
      atext('S ∝ L²', LAYOUT.cx - 215, 1087, tQ, t, { size: 70, w: 700, col: COL.area });
      atext('V ∝ L³', LAYOUT.cx + 215, 1087, tK, t, { size: 70, w: 700, col: COL.vol });
    });
  }

  defineScene('hook', {
    draw(t) {
      antScene(t);
      fleaScene(t);
      lawScene(t);
    },
    sfx(add) {
      add(.05, 'tick', .35);
      add(Wd('k1', 'увеличить'), 'rise', .8);
      add(Wd('k1', 'слона') - .2, 'bloom', .5);
      add(Wd('k1', 'погибнет'), 'crack', 1.0);
      add(Wd('k1', 'погибнет') + .13, 'impact', .9);
      add(C('k2') - .15, 'whoosh', .5);
      add(Wd('k2', 'блоха'), 'pop', .5, 1.3);
      add(Wd('k2', 'прыгает'), 'boing', .8);
      add(Wd('k2', 'сто'), 'chime', .8, 1.2);
      add(Wd('k2', 'слон') - .2, 'thud', .6);
      add(Wd('k2', 'подпрыгнуть') + .3, 'thud', .6, .8);
      add(Wd('k2', 'подпрыгнуть') + .45, 'tick', .5);
      add(C('k3') - .15, 'whoosh', .5);
      add(Wd('k3', 'геометрия') - .2, 'shimmer', .6);
      add(Wd('k3', 'закон') - 1.5, 'riser', .8);
      add(Wd('k3', 'закон'), 'impact', 1.0);
      add(Wd('k3', 'квадрата'), 'chime', .7, 1.0);
      add(Wd('k3', 'куба'), 'chime', .8, 1.5);
      add(Wd('k3', 'куба') + .13, 'bloom', .6);
    },
  });
})();
