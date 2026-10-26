(() => {
  // ---------- локальные хелперы ----------
  const CX = LAYOUT.cx;
  // зум вокруг точки (точка остаётся на месте)
  const zoomAt = (px, py, z, fn) => { g.save(); g.translate(px, py); g.scale(z, z); g.translate(-px, -py); fn(); g.restore(); };
  // слой с прозрачностью и размытием
  const layer = (a, b, fn) => {
    if (a <= .002) return;
    g.save(); g.globalAlpha *= a; if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`; fn(); g.restore();
  };
  // появление из размытия (t0) и уход в размытие (t1)
  const vis = (t, t0, t1 = null, din = .6, dout = .35, bl = 22) => {
    const p = P(t, t0, din, eexp), q = t1 == null ? 0 : P(t, t1, dout, eio);
    return { a: p * (1 - q), b: (1 - p) * bl + q * bl, k: lerp(.9, 1, P(t, t0, din * 1.2, espr)) * (1 - .05 * q) };
  };
  // плавное затухание у краёв сцены (для бесконечной шахты)
  const edge = y => clamp((y - 270) / 90) * clamp((1240 - y) / 90);
  const vgrad = (col, a) => {
    const gr = g.createLinearGradient(0, 270, 0, 1240);
    gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(90 / 970, rgba(col, a));
    gr.addColorStop(880 / 970, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
    return gr;
  };
  function check(x, y, r, p, a) {
    if (a <= .002 || p <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.strokeStyle = rgba(COL.green); g.lineWidth = 7; g.lineCap = g.lineJoin = 'round';
    g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p * 1.6)); g.stroke();
    const q = clamp(p * 1.6 - .6);
    if (q > 0) {
      const pts = [[x - r * .42, y + r * .02], [x - r * .1, y + r * .32], [x + r * .45, y - r * .3]];
      const L1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), L2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
      const d = q * (L1 + L2);
      g.beginPath(); g.moveTo(...pts[0]);
      if (d <= L1) g.lineTo(lerp(pts[0][0], pts[1][0], d / L1), lerp(pts[0][1], pts[1][1], d / L1));
      else { g.lineTo(...pts[1]); const u = (d - L1) / L2; g.lineTo(lerp(pts[1][0], pts[2][0], u), lerp(pts[1][1], pts[2][1], u)); }
      g.stroke();
    }
    g.restore();
  }
  // стрелки сил у тела: вверх — сопротивление (янтарь), вниз — вес (голубой)
  function forces(x, yTop, yBot, up, down, a) {
    if (a <= .002) return;
    if (up > 4) arrow(x, yTop - 10, x, yTop - 10 - up, COL.area, a, 7, 24);
    if (down > 4) arrow(x, yBot + 10, x, yBot + 10 + down, COL.vol, a, 7, 24);
  }

  defineScene('fall', {
    chapter: 'ПАДЕНИЕ',
    draw(t, s) {
      const f1 = C('f1'), f2 = C('f2');
      const tPad = Wd('f1', 'падение');
      const tMouse = Wd('f1', 'Мышь');
      const tFall = Wd('f1', 'упавшая');
      const tShake = Wd('f1', 'отряхнётся');
      const tLand = tShake - .1;
      const tRun = Wd('f1', 'убежит');
      const tHuman = Wd('f2', 'Человек');
      const tHLand = Wd('f2', 'разобьётся') + .24;
      const tA = Wd('f2', 'А');
      const tHorse = Wd('f2', 'лошадь');
      const tHLand2 = tHorse + .34;
      const tBetter = Wd('f2', 'лучше');

      // общая камера-«удар»
      const pz = 1 + punch(t, tPad, .05) + punch(t, tHLand, .07) + punch(t, tHLand2, .11, .6)
        + .1 * P(t, tHLand + .1, 1.2, eio) * (1 - P(t, tA - .15, .5, eio));
      const [shx, shy] = (() => {
        const a = shake(t, tHLand, 20, .45), b = shake(t, tHLand2, 34, .7);
        return [a[0] + b[0], a[1] + b[1]];
      })();

      g.save(); g.translate(shx, shy);
      zoomAt(CX, LAYOUT.stageY, pz, () => {
        // =========== 1. идея: сопротивление ∝ L², вес ∝ L³ ===========
        const tIdeaOut = tMouse - .3;
        if (t < tIdeaOut + .5) {
          const v = vis(t, f1 + .02, tIdeaOut, .6, .35);
          layer(v.a, v.b, () => {
            const grow = P(t, tPad + 1.0, .65, espr);
            const k = lerp(1, 1.35, grow);
            const bx = 320, by = 720, r = 88 * k;
            const up = 95 * k * k * P(t, tPad, .55, espr);
            const down = 95 * k * k * k * P(t, tPad + .5, .55, espr);
            glow(bx, by, r * 2.4, COL.ink, .06);
            circle(bx, by, r, COL.ink, 1);
            forces(bx, by - r, by + r, up, down, 1);
            // подписи у наконечников стрел
            const yU = by - r - 10 - up, yD = by + r + 10 + down;
            const tU = tPad, tD = tPad + .5;
            atext('сопротивление', 440, yU - 34, tU + .05, t, { size: 40, w: 600, col: COL.dim, align: 'left', blur: 14, dy: 14 });
            atext('∝ площади · L²', 440, yU + 22, tU + .12, t, { size: 58, w: 800, col: COL.area, align: 'left', blur: 18, dy: 18 });
            atext('вес', 440, yD - 34, tD + .05, t, { size: 40, w: 600, col: COL.dim, align: 'left', blur: 14, dy: 14 });
            atext('∝ объёму · L³', 440, yD + 22, tD + .12, t, { size: 58, w: 800, col: COL.vol, align: 'left', blur: 18, dy: 18 });
          });
        }

        // =========== 2. мышь в шахте (камера следует за падением) ===========
        const tShaftOut = f2 - .22;
        if (t > tMouse - .3 && t < tShaftOut + .45) {
          const v = vis(t, tMouse - .15, tShaftOut, .6, .38);
          const DEPTH = 1800, WL = 330, WR = 710;
          const dur = tLand - tFall;
          const u = clamp((t - tFall) / dur);
          const fe = x => (x + (Math.exp(-x * 5) - 1) / 5) / (1 + (Math.exp(-5) - 1) / 5); // выход на предельную скорость
          let wy = DEPTH * fe(u);
          let wx = lerp(215, CX, P(t, tFall - .05, .45, eio));
          wy -= 70 * Math.sin(Math.PI * clamp((t - tFall + .05) / .4)) * (u < .3 ? 1 : 0);
          // камера
          const zF = lerp(1, 1.18, P(t, tFall, .5, eio)) * (1 - .18 * P(t, tLand, .9, eexp));
          let camY;
          if (t < tLand) camY = Math.max(140, wy + 140);
          else camY = lerp(DEPTH + 140, DEPTH - 240, P(t, tLand, .9, eexp));
          if (t < tFall) camY = 140;
          const z = zF;
          const SX = x => clamp(CX + (x - CX) * z, 70, 940), SY = y => LAYOUT.stageY + (y - camY) * z;

          layer(v.a, v.b, () => {
            // стенки шахты (с затуханием у краёв)
            const yTop = SY(0), yBot = SY(DEPTH), yTun = SY(DEPTH - 150);
            g.save(); g.lineCap = 'round';
            g.lineWidth = 4 * z; g.strokeStyle = vgrad(COL.dim, .9);
            g.beginPath();
            g.moveTo(SX(WL), Math.max(260, yTop)); g.lineTo(SX(WL), Math.min(1260, yBot));
            g.moveTo(SX(WR), Math.max(260, yTop)); g.lineTo(SX(WR), Math.min(1260, yTun));
            // поверхность
            if (yTop > 260) { g.moveTo(SX(90), yTop); g.lineTo(SX(WL), yTop); g.moveTo(SX(WR), yTop); g.lineTo(SX(950), yTop); }
            // дно + тоннель вправо
            if (yBot < 1260) { g.moveTo(SX(WL), yBot); g.lineTo(SX(940), yBot); }
            if (yTun < 1260 && yTun > 260) { g.moveTo(SX(WR), yTun); g.lineTo(SX(940), yTun); }
            g.stroke();
            // «кирпичи» на стенках — дают ощущение скорости
            g.lineWidth = 2.5 * z; g.strokeStyle = vgrad(COL.faint, 1);
            g.beginPath();
            for (let k = 1; k < DEPTH / 90; k++) {
              const y = SY(k * 90); if (y < 260 || y > 1260) continue;
              const o = (k % 2) * 18;
              g.moveTo(SX(WL - 60 + o), y); g.lineTo(SX(WL - 8), y);
              if (k * 90 < DEPTH - 150) { g.moveTo(SX(WR + 8), y); g.lineTo(SX(WR + 60 - o), y); }
            }
            g.stroke(); g.restore();
            // заливка земли за стенками
            g.save(); g.fillStyle = vgrad(COL.faint, .35);
            g.fillRect(SX(90), Math.max(260, yTop), SX(WL) - SX(90), Math.min(1260, yBot) - Math.max(260, yTop));
            g.fillRect(SX(WR), Math.max(260, yTop), SX(940) - SX(WR), Math.min(1260, yTun) - Math.max(260, yTop));
            g.restore();
            // отметки глубины
            for (let k = 1; k <= 8; k++) {
              const y = SY(k * 200), e = edge(y);
              if (e > 0) txt(`${k * 5} м`, SX(WL - 80), y, { size: 30 * z, w: 600, col: COL.dim, a: e, align: 'right' });
            }

            // мышь
            const SXr = x => CX + (x - CX) * z;
            let mx = SXr(wx), my = SY(wy), sqx = 1, sqy = 1, rotA = 0, ma = 1;
            if (t >= tFall && t < tLand) rotA = Math.sin((t - tFall) * 9) * .18 + .25 * P(t, tFall, .3);
            if (t >= tLand) {
              const d = t - tLand;
              const sq = Math.exp(-d * 9) * Math.sin(Math.min(d * 14, Math.PI)) * .28;
              sqy = 1 - sq; sqx = 1 + sq * .7;
              if (t > tShake && t < tShake + .7) mx += Math.sin((t - tShake) * 55) * 9 * (1 - (t - tShake) / .7);
              const run = P(t, tRun + .05, .6, eio);
              mx = lerp(mx, SXr(1000), run);
              my -= Math.abs(Math.sin((t - tRun) * 22)) * 10 * (t > tRun ? 1 : 0);
              ma = 1 - clamp((mx - 760) / 120);
            }
            // линии скорости
            if (t > tFall && t < tLand + .1) {
              const r = rng(7), sp = clamp((t - tFall) * 4) * (1 - P(t, tLand - .05, .15));
              for (let i = 0; i < 9; i++) {
                const ox = (r() - .5) * 220, len = 90 + 160 * r(), oy = 40 + 120 * r();
                line(mx + ox, my - oy - len, mx + ox, my - oy, COL.ink, .18 * sp * (.5 + r()), 3);
              }
            }
            // пыль при приземлении
            if (t > tLand && t < tLand + .9) {
              const r = rng(21), d = t - tLand;
              for (let i = 0; i < 12; i++) {
                const dir = i % 2 ? 1 : -1, sp = 120 + 160 * r();
                circle(mx + dir * (40 + sp * eexp(d)), my - 10 - 40 * r() * eexp(d), 5 + 6 * r(), COL.dim, .6 * (1 - d / .9));
              }
            }
            // отряхивается — летят пылинки
            if (t > tShake && t < tShake + 1) {
              const r = rng(33), d = t - tShake;
              for (let i = 0; i < 14; i++) {
                const ang = -Math.PI * (.1 + .8 * r()), sp = 140 + 160 * r(), tt = d - r() * .4;
                if (tt <= 0) continue;
                circle(mx + Math.cos(ang) * sp * tt, my - 40 + Math.sin(ang) * sp * tt + 300 * tt * tt, 3 + 3 * r(), COL.ink, .7 * (1 - clamp(tt / .6)));
              }
            }
            // силы во время падения: уравновешены → маленькая предельная скорость
            const fa = P(t, tFall + .25, .4, eexp) * (1 - P(t, tLand - .15, .2));
            forces(mx, my - 80 * z, my + 6, 80, 80, fa);
            atext('=', mx + 120, my - 40, tFall + .35, t, { size: 56, w: 800, col: COL.ink, a: fa, blur: 12, dy: 0 });
            // мышь
            g.save(); g.translate(mx, my); g.rotate(rotA); g.scale(sqx, sqy);
            drawMouse(0, 0, 1.0 * z, { a: ma });
            g.restore();
            // галочка
            const tc = tRun + .25;
            const ca = P(t, tc, .4, eexp);
            layer(ca, (1 - ca) * 14, () => {
              const yy = SY(DEPTH) - 290 * z;
              check(CX - 90, yy, 52, P(t, tc, .7, eout), 1);
              atext('цела!', CX - 20, yy + 4, tc + .1, t, { size: 64, w: 800, col: COL.green, align: 'left', blur: 16 });
            });
          });
        }

        // =========== 3. человек и лошадь ===========
        if (t > f2 - .3) {
          const vAll = vis(t, f2 - .15, null, .6);
          const GY = 1090;
          const bl = P(t, tBetter, .55, eio); // уход в размытие на «лучше не представлять»
          layer(vAll.a * (1 - .82 * bl), vAll.b + bl * 22, () => {
            line(110, GY, 930, GY, COL.dim, .7, 3);
            // ---------- человек ----------
            const hr = 72;
            const shift = P(t, tA - .05, .55, eio);
            const hx = lerp(CX, 235, shift), hk = lerp(1, .62, shift);
            const hu = clamp((t - (tHuman + .05)) / (tHLand - tHuman - .05));
            const hy0 = 380, hyL = GY - hr * hk;
            const hy = t < tHLand ? lerp(hy0, GY - hr, hu * hu) : hyL;
            const ha = P(t, tHuman - .1, .4, eexp);
            if (t < tHLand) {
              layer(ha, (1 - ha) * 18, () => {
                // линии скорости
                const sp = hu * hu;
                const r = rng(5);
                for (let i = 0; i < 7; i++) {
                  const ox = (r() - .5) * 120, len = 140 * sp + 60 * r() * sp;
                  line(hx + ox, hy - hr - 20 - len, hx + ox, hy - hr - 20, COL.ink, .25 * sp, 3);
                }
                circle(hx, hy, hr, COL.ink);
                const fa = P(t, tHuman + .15, .3, eexp);
                forces(hx, hy - hr, hy + hr, 38, 150, fa);
              });
            } else {
              const d = t - tHLand, spl = P(t, tHLand, .35, eexp) * 18 * hk;
              const crack = P(t, tHLand, .25, eout);
              g.save();
              for (const sgn of [-1, 1]) {
                g.save(); g.translate(hx + sgn * spl, hyL); g.rotate(sgn * spl * .014);
                g.beginPath(); g.arc(0, 0, hr * hk, sgn < 0 ? Math.PI / 2 : -Math.PI / 2, sgn < 0 ? Math.PI * 1.5 : Math.PI / 2);
                g.fillStyle = rgba(mix(COL.ink, COL.red, .35 * crack)); g.fill(); g.restore();
              }
              g.restore();
              // зигзаг трещины
              const pts = [[0, -1.15], [.18, -.55], [-.14, -.1], [.16, .35], [-.05, 1.15]];
              g.save(); g.globalAlpha *= crack; g.strokeStyle = rgba(COL.red); g.lineWidth = 6 * hk; g.lineJoin = g.lineCap = 'round';
              g.beginPath(); pts.forEach(([px, py], i) => { const X = hx + px * hr * hk, Y = hyL + py * hr * hk; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
              g.restore();
              // осколки
              const r = rng(9);
              for (let i = 0; i < 10; i++) {
                const ang = -Math.PI * (.1 + .8 * r()), sp = 160 + 220 * r(), tt = d;
                const px = hx + Math.cos(ang) * sp * tt * hk, py = GY - 6 + Math.sin(ang) * sp * tt + 900 * tt * tt;
                if (py < GY) circle(px, py, 4 + 4 * r(), COL.red, 1 - clamp(tt / .7));
              }
              glow(hx, GY, 180 * hk, COL.red, .25 * (1 - P(t, tHLand, .8)));
            }
            atext('человек', hx, GY + 48, tHuman, t, { size: 34, w: 600, col: COL.dim, blur: 12, dy: 10 });

            // ---------- лошадь ----------
            if (t > tA) {
              const R = 145, lx = 620;
              const lu = clamp((t - tHorse) / (tHLand2 - tHorse));
              const la = P(t, tA, .3, eexp);
              const ly = lerp(450, GY - R, lu * lu);
              if (t < tHLand2) {
                layer(la, (1 - la) * 22, () => {
                  const r = rng(12), sp = clamp(lu * 2);
                  for (let i = 0; i < 9; i++) {
                    const ox = (r() - .5) * 240, len = (220 + 200 * r()) * sp;
                    line(lx + ox, Math.max(310, ly - R - 10 - len), lx + ox, ly - R + 40, COL.ink, .28 * sp, 4);
                  }
                  circle(lx, ly, R, COL.ink);
                  forces(lx, ly - R, ly + R, 0, 240 * la * (1 - lu * .5), 1);
                });
              } else {
                const d = t - tHLand2;
                // вспышка
                glow(lx, GY - 60, 330, COL.ink, .45 * Math.exp(-d * 6));
                glow(lx, GY - 40, 280, COL.red, .28 * (1 - clamp(d / 1.2)));
                // лепёшка
                const fl = P(t, tHLand2, .18, eout);
                ellipse(lx, GY - lerp(R, 22, fl), lerp(R, R * 1.75, fl), lerp(R, 22, fl), 0, COL.ink, 1);
                // брызги
                const r = rng(11);
                for (let k = 0; k < 60; k++) {
                  const ang = -Math.PI * (.06 + .88 * r()), sp = 420 + 820 * r(), tt = d * (.75 + .25 * r());
                  const vx = Math.max(-330, Math.min(300, Math.cos(ang) * sp));
                  const px = lx + vx * tt * 1.3, py = GY - 10 + Math.sin(ang) * sp * tt + 1500 * tt * tt;
                  const rr = (5 + 11 * r()) * (1 - clamp(tt / 1.4));
                  if (py < GY - rr) circle(px, py, rr, k % 4 ? COL.ink : COL.red, 1 - clamp(tt / 1.3));
                }
                // трещины в земле
                const ca = P(t, tHLand2, .25, eout);
                [-1, 1].forEach(sg => {
                  g.save(); g.strokeStyle = rgba(COL.red, .8 * ca * (1 - P(t, tHLand2 + .9, .5))); g.lineWidth = 4; g.lineJoin = 'round';
                  g.beginPath(); g.moveTo(lx + sg * R * 1.5, GY);
                  g.lineTo(lx + sg * (R * 1.5 + 30 * ca), GY + 16); g.lineTo(lx + sg * (R * 1.5 + 60 * ca), GY + 6); g.lineTo(lx + sg * (R * 1.5 + 85 * ca), GY + 22);
                  g.stroke(); g.restore();
                });
              }
              atext('лошадь', lx, GY + 48, tHorse - .1, t, { size: 34, w: 600, col: COL.dim, blur: 12, dy: 10 });
            }
          });

          // ---------- «…лучше не представлять» ----------
          if (t > tBetter) {
            const tf = tBetter + .3;
            const fa = P(t, tf, .6, eexp);
            // затемнение
            g.save(); g.fillStyle = rgba(COL.bg, .55 * P(t, tBetter, .5, eio)); g.fillRect(-100, 250, W + 200, 1050); g.restore();
            // мордочка, закрывающая глаза ладошками
            layer(fa, (1 - fa) * 20, () => {
              const fx = CX, fy = 560, R = 92;
              g.save(); g.strokeStyle = rgba(COL.ink); g.lineWidth = 7;
              g.beginPath(); g.arc(fx, fy, R, 0, Math.PI * 2); g.stroke();
              // рот «о»
              g.beginPath(); g.ellipse(fx, fy + 44, 12, 9 + 3 * Math.sin(t * 6), 0, 0, Math.PI * 2); g.stroke();
              g.restore();
              // зажмуренные глаза
              g.save(); g.strokeStyle = rgba(COL.ink); g.lineWidth = 6; g.lineCap = 'round';
              for (const sg of [-1, 1]) { g.beginPath(); g.arc(fx + sg * 34, fy - 8, 14, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
              g.restore();
              const hp = P(t, tf + .25, .7, espr);
              const hy = lerp(fy + 190, fy - 12, hp);
              for (const sg of [-1, 1]) {
                g.save(); g.translate(fx + sg * 44, hy); g.rotate(sg * .22); g.globalAlpha *= clamp(hp * 3);
                g.fillStyle = rgba(COL.area); g.beginPath(); g.roundRect(-40, -46, 80, 92, 34); g.fill();
                g.strokeStyle = rgba(COL.bg, .55); g.lineWidth = 4; g.lineCap = 'round';
                for (const fxo of [-14, 0, 14]) { g.beginPath(); g.moveTo(fxo, -40); g.lineTo(fxo, -8); g.stroke(); }
                g.restore();
              }
            });
            atext('…лучше', CX, 790, tf, t, { size: 92, w: 800, col: COL.ink, blur: 26 });
            atext('не представлять', CX, 900, tf + .18, t, { size: 84, w: 800, grad: [COL.area, COL.red], blur: 26 });
          }
        }
      });
      g.restore();
    },
    sfx(add, s) {
      const tPad = Wd('f1', 'падение');
      add(tPad, 'pop', .6, 1.1);
      add(tPad + .5, 'pop', .55, .8);
      add(tPad + 1.0, 'swell', .5, 1.0);
      add(Wd('f1', 'Мышь') - .1, 'pop', .5, 1.5);
      add(Wd('f1', 'упавшая'), 'fall', .55, 1.4);
      const tLand = Wd('f1', 'отряхнётся') - .1;
      add(tLand, 'pop', .45, 1.6);
      add(tLand + .2, 'tick', .35, 1.5);
      add(tLand + .4, 'tick', .3, 1.7);
      add(tLand + .6, 'tick', .25, 1.9);
      add(Wd('f1', 'убежит'), 'whoosh', .35, 1.6);
      add(Wd('f1', 'убежит') + .25, 'chime', .6, 1.2);
      add(Wd('f2', 'Человек') - .05, 'pop', .4, 1.0);
      add(Wd('f2', 'Человек') + .15, 'fall', .6, 1.0);
      const tH = Wd('f2', 'разобьётся') + .24;
      add(tH, 'crack', .85, 1.0);
      add(tH + .13, 'thud', .8, 1.0);
      add(Wd('f2', 'лошадь') - .05, 'fall', .7, .7);
      const tL = Wd('f2', 'лошадь') + .34;
      add(tL, 'impact', 1.0, 1.0);
      add(tL + .13, 'splash', .8, 1.0);
      add(Wd('f2', 'лучше') + .05, 'swell', .4, .8);
      add(Wd('f2', 'лучше') + .55, 'boing', .35, 1.2);
    },
  });
})();
