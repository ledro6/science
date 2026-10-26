(() => {
  const CX = LAYOUT.cx;
  const zoomAt = (px, py, z, fn) => { g.save(); g.translate(px, py); g.scale(z, z); g.translate(-px, -py); fn(); g.restore(); };
  const layer = (a, b, fn) => {
    if (a <= .002) return;
    g.save(); g.globalAlpha *= a; if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`; fn(); g.restore();
  };

  defineScene('outro', {
    draw(t, s) {
      const o1 = C('o1'), o2 = C('o2');
      const tGiant = Wd('o1', 'гигантских');
      const tIns = Wd('o1', 'насекомых');
      const tEach = Wd('o1', 'У');
      const tOwn = Wd('o1', 'свой');
      const tSize = Wd('o1', 'размер');
      const tSub = Wd('o2', 'Подпишись');
      const tS = Wd('o2', 'чтобы'), tV = Wd('o2', 'пропустить');
      const tLaw = Wd('o2', 'закон');
      const tTap = Wd('o2', 'природы') + .1;

      const pz = 1 + punch(t, tGiant, .07) + punch(t, tIns + .05, .04) + punch(t, tSub, .04) + punch(t, tTap, .03);
      const [shx, shy] = shake(t, tIns + .05, 10, .35);
      g.save(); g.translate(shx, shy);
      zoomAt(CX, LAYOUT.stageY, pz, () => {
        // =========== 1. гигантский муравей ===========
        const tAntOut = tEach - .75;
        if (t < tAntOut + .8) {
          const gp = P(t, o1 + .05, 1.25, eexp);
          const sc = lerp(1.2, 4.1, gp);
          const ap = P(t, o1 + .05, .5, eexp);
          const dis = P(t, tAntOut, .7, eio);   // рассыпается в размытие
          const buck = P(t, tIns + .35, .5, espr);
          const GY = 1010;
          layer(ap * (1 - dis), (1 - ap) * 22 + dis * 34, () => {
            zoomAt(CX, GY, 1 + .08 * dis, () => {
              glow(CX, GY - 230, 520, COL.red, .12 * P(t, tIns, .4) * (1 - dis));
              line(120, GY, 920, GY, COL.faint, 1, 3);
              drawAnt(CX - 10, GY, sc, { buckle: buck * .9, crack: P(t, tIns + .3, .3), col: mix(COL.ink, COL.red, .25 * buck) });
              // красный крест
              const c1 = P(t, tIns, .22, eout), c2 = P(t, tIns + .12, .22, eout);
              const A = [[170, 560], [880, 1000]], B = [[880, 560], [170, 1000]];
              if (c1 > 0) line(A[0][0], A[0][1], lerp(A[0][0], A[1][0], c1), lerp(A[0][1], A[1][1], c1), COL.red, 1, 16);
              if (c2 > 0) line(B[0][0], B[0][1], lerp(B[0][0], B[1][0], c2), lerp(B[0][1], B[1][1], c2), COL.red, 1, 16);
            });
          });
          // пылинки рассыпающегося муравья
          if (dis > 0) {
            const r = rng(77), d = t - tAntOut;
            for (let i = 0; i < 70; i++) {
              const px0 = CX - 10 + (r() - .5) * 2 * 340, py0 = GY - 60 - r() * 330;
              const vx = (r() - .5) * 160, vy = -60 - 160 * r();
              const a = (1 - clamp(d / (0.7 + .5 * r()))) * clamp(d * 6);
              circle(px0 + vx * d, py0 + vy * d, 2 + 4 * r(), mix(COL.ink, COL.red, r() * .5), a * .8);
            }
          }
          atext('ГИГАНТСКИЕ НАСЕКОМЫЕ', CX, 420, tGiant - .05, t, { size: 44, w: 800, ls: 4, col: COL.ink, out: tAntOut, blur: 20 });
          atext('не бывают', CX, 480, tIns + .1, t, { size: 40, w: 700, col: COL.red, out: tAntOut, blur: 18 });
        }

        // =========== 2. ряд силуэтов по росту ===========
        const tRowOut = o2 - .3;
        if (t > tEach - .5 && t < tRowOut + .6) {
          const q = P(t, tRowOut, .45, eio);
          const camZ = lerp(1.14, 1, P(t, tEach - .2, 1.8, eio));
          const GY = 1040;
          layer(1 - q, q * 26, () => {
            zoomAt(CX, 900, camZ, () => {
              const ga = P(t, tEach - .2, .5, eexp);
              line(100, GY, 940, GY, COL.faint, ga, 3);
              const items = [
                { x: 125, f: (x, y, s, o) => drawFlea(x, y, s, o), s: 2.0, name: 'блоха' },
                { x: 250, f: (x, y, s, o) => drawAnt(x, y, s, o), s: .62, name: 'муравей' },
                { x: 465, f: (x, y, s, o) => drawMouse(x, y, s, o), s: 1.12, name: 'мышь' },
                { x: 735, f: (x, y, s, o) => drawElephant(x, y, s, o), s: .88, name: 'слон' },
              ];
              items.forEach((it, i) => {
                const t0 = tEach + i * .2;
                const p = P(t, t0, .55, eexp), k = lerp(.55, 1, P(t, t0, .7, espr));
                // волна «подпрыгиваний» на «идеальный размер»
                const hop = Math.max(0, Math.sin(clamp((t - (tSize - .1 + i * .09)) / .32) * Math.PI)) * 22;
                layer(p, (1 - p) * 18, () => {
                  zoomAt(it.x, GY, k, () => {
                    glow(it.x, GY - 40, 140 + i * 40, COL.area, .07 * P(t, tOwn, .6));
                    it.f(it.x, GY - hop, it.s, i === 3 ? { flap: .5 + .5 * Math.sin(t * 5) } : {});
                  });
                });
                atext(it.name, it.x + (i === 3 ? 30 : i === 2 ? -20 : 0), GY + 46, t0 + .1, t, { size: 30, w: 600, col: COL.dim, blur: 12, dy: 10 });
              });
            });
            atextWords('Свой идеальный', CX, 540, tOwn - .05, t, { size: 88, w: 800, stagger: .12 });
            atextWords('размер', CX, 650, tSize - .15, t, { size: 104, w: 800, grad: [COL.area, COL.vol] });
          });
        }

        // =========== 3. финальная карточка ===========
        if (t > tRowOut) {
          const t0 = tRowOut + .2;
          atextWords('Закон', CX, 470, t0, t, { size: 104, w: 800, grad: [COL.area, COL.vol] });
          atextWords('квадрата–куба', CX, 590, t0 + .15, t, { size: 104, w: 800, grad: [COL.area, COL.vol] });
          const lp = P(t, t0 + .5, .8, eexp);
          line(CX - 200 * lp, 680, CX + 200 * lp, 680, COL.faint, lp, 3);
          atext('S ∝ L²', CX - 190, 770, tS - .05, t, { size: 76, w: 800, col: COL.area });
          atext('V ∝ L³', CX + 190, 770, tV - .05, t, { size: 76, w: 800, col: COL.vol });
          // стеклянная кнопка «Подписаться»
          const bp = P(t, tSub - .05, .6, eexp), bk = lerp(.8, 1, P(t, tSub - .05, .8, espr));
          if (bp > .002) {
            const pulse = 1 + .025 * Math.sin(Math.max(0, t - tSub - .6) * Math.PI * 2 / 1.1) * P(t, tSub + .6, .5);
            const press = 1 - .07 * Math.exp(-Math.max(0, t - tTap) * 9) * Math.sin(Math.min(1, Math.max(0, t - tTap) * 8) * Math.PI) * (t > tTap ? 1 : 0);
            const fill = P(t, tTap + .05, .4, eexp);
            const bw = 520, bh = 128, by = 990;
            // кольцо-«рябь» от нажатия
            if (t > tTap) {
              const rp = P(t, tTap, .9, eout);
              g.save(); g.globalAlpha *= bp * (1 - rp) * .8; g.strokeStyle = rgba(COL.area); g.lineWidth = 4;
              g.beginPath(); g.roundRect(CX - bw / 2 - 40 * rp, by - bh / 2 - 40 * rp, bw + 80 * rp, bh + 80 * rp, bh / 2 + 40 * rp); g.stroke(); g.restore();
            }
            layer(bp, (1 - bp) * 20, () => {
              zoomAt(CX, by, bk * pulse * press, () => {
                glow(CX, by, 380, COL.area, (.08 + .05 * Math.sin(t * 5)) * (1 - fill * .3));
                glass(CX - bw / 2, by - bh / 2, bw, bh, bh / 2, 1);
                if (fill > 0) {
                  g.save(); g.globalAlpha *= fill;
                  const gr = g.createLinearGradient(CX - bw / 2, 0, CX + bw / 2, 0);
                  gr.addColorStop(0, rgba(COL.area)); gr.addColorStop(1, rgba(COL.vol));
                  g.fillStyle = gr; g.beginPath(); g.roundRect(CX - bw / 2, by - bh / 2, bw, bh, bh / 2); g.fill(); g.restore();
                }
                txt('Подписаться', CX, by + 2, { size: 54, w: 800, col: mix(COL.ink, COL.bg, fill) });
              });
            });
          }
        }
      });
      g.restore();
    },
    sfx(add, s) {
      const o1 = C('o1');
      add(o1 + .05, 'swell', .5, .9);
      add(Wd('o1', 'гигантских'), 'impact', .7, 1.1);
      const tIns = Wd('o1', 'насекомых');
      add(tIns, 'crack', .6, 1.1);
      add(tIns + .35, 'thud', .45, 1.2);
      add(Wd('o1', 'У') - .75, 'bloom', .45, 1.0);
      const tEach = Wd('o1', 'У');
      [1.7, 1.35, 1.1, .8].forEach((p, i) => add(tEach + i * .2, 'pop', .45, p));
      add(Wd('o1', 'свой'), 'chime', .6, 1.0);
      add(Wd('o1', 'размер') - .1, 'tick', .3, 1.4);
      add(C('o2') - .1, 'swell', .5, 1.0);
      add(Wd('o2', 'Подпишись'), 'pop', .6, 1.0);
      add(Wd('o2', 'чтобы'), 'tick', .4, 1.2);
      add(Wd('o2', 'пропустить'), 'tick', .4, 1.5);
      add(Wd('o2', 'закон'), 'shimmer', .5, 1.0);
      add(Wd('o2', 'природы') + .1, 'click', .6, 1.0);
      add(Wd('o2', 'природы') + .25, 'chime', .7, 1.2);
    },
  });
})();
