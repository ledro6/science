// Сцена «Прочность» (35.7–54.4 с), чёрный фон.
// s1: заголовок-вдох → керамическая кость из темноты → срез clipping-плоскостью, макро-проезд над «die-shot» сечения → графитовый куб-масса давит сверху.
// s2: огромные цифры ×1 000 000 / ×10 000 и две тонкие полосы (длинная и в 100 раз короче), муравей-ориентир.
// s3: гигантский керамический муравей снизу, «Хруст» — лапы подламываются, красные трещины, осколки, пыль.
// s4: слон на медленной орбите, ноги превращаются в колонны с каннелюрами; тонкая и толстая кость с выносками.
import {
  defineScene, makeStage, orbit, project, atext, atextWords, acount, line, dot, callout, measure,
  P, FIO, Wd, WdE, C, E, rng, clamp, lerp, eApple, eIn, eInOut, eEase, eExpo, eSpring, eStd,
  THREE, MAT, roundedBox, shadowsOn, W, H, C_WHITE, C_GRAY, C_RED, g,
} from '../engine.mjs';
import { makeAnt, makeElephant, makeBone } from '../models.mjs';

// ---------- общие помощники ----------
// Камера на орбите, точка взгляда выводится в экранную точку (sx, sy) через view offset.
function frame(cam, target, dist, az, el, sx = 540, sy = 960, fov = 26) {
  if (cam.fov !== fov) cam.fov = fov;
  orbit(cam, target, dist, az, el);
  cam.setViewOffset(W, H, W / 2 - sx, H / 2 - sy, W, H);
  cam.updateMatrixWorld();
}
// «Вдох»: окно затемнения 3D-слоя (пик в момент at).
const dipA = (t, at, din = .3, dout = .45) => t < at ? P(t, at - din, din, eIn) : 1 - P(t, at, dout, eEase);
function veil(ctx, col, a) { if (a <= .003) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
// Подпись выноски: заголовок + серая строка под ним.
function label(x, y, title, sub, t0, t, o = {}) {
  const { align = 'left', out = null, ink = C_WHITE, size = 44, subSize = 34 } = o;
  atext(title, x, y, t0, t, { size, w: 600, col: ink, align, dur: .7, dy: 22, blur: 10, out, track: -.012 });
  if (sub) atext(sub, x, y + subSize * 1.35, t0 + .18, t, { size: subSize, w: 500, col: C_GRAY, align, dur: .7, dy: 18, blur: 8, out, track: -.005 });
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// ---------- тайминги (по словам) ----------
const T = {};
function times() {
  if (T.ok) return T;
  T.title = Wd('s1', 'А');            // «А теперь главное.»
  T.strong = Wd('s1', 'Прочность');
  T.area = Wd('s1', 'площади');
  T.sect = Wd('s1', 'сечения');
  T.weight = Wd('s1', 'вес');
  T.volume = Wd('s1', 'объёма');
  T.ant = Wd('s2', 'Муравей');
  T.hund = Wd('s2', 'сто');
  T.heavy = Wd('s2', 'тяжелее');
  T.mil = Wd('s2', 'миллион');
  T.legs = Wd('s2', 'ноги');
  T.stronger = Wd('s2', 'прочнее');
  T.tenk = Wd('s2', 'десять');
  T.crunch = Wd('s3', 'Хруст');
  T.breaks = Wd('s3', 'ломается');
  T.own = Wd('s3', 'весом');
  T.why = Wd('s4', 'Вот');
  T.eleph = Wd('s4', 'слона');
  T.legs4 = Wd('s4', 'ноги');
  T.cols = Wd('s4', 'колонны');
  T.S2 = E('s1') + .07;     // смена подсцен (пик «вдоха»)
  T.S3 = 47.72;
  T.S4 = C('s4') - .13;
  T.ok = 1;
  return T;
}

// ---------- геометрия ----------
// Колонна с каннелюрами: база, ствол, эхин, абака (вдоль Y, низ в 0).
function makeColumn(mat, r = .3, h = 1.45) {
  const grp = new THREE.Group();
  const fl = 20, shaftH = h - .28;
  const geo = new THREE.CylinderGeometry(r * .94, r, shaftH, fl * 4, 1, false);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const rr = Math.hypot(v.x, v.z); if (rr < 1e-4) continue;
    const th = Math.atan2(v.z, v.x), k = 1 - .085 * Math.pow(Math.max(0, Math.cos(fl * th)), 2);
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  geo.computeVertexNormals();
  const shaft = new THREE.Mesh(geo, mat); shaft.position.y = .1 + shaftH / 2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.22, r * 1.28, .1, 48), mat); base.position.y = .05;
  const ech = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.28, r * .95, .1, 48), mat); ech.position.y = .1 + shaftH + .05;
  const aba = new THREE.Mesh(new THREE.BoxGeometry(r * 2.7, .08, r * 2.7), mat); aba.position.y = h - .04;
  grp.add(shaft, base, ech, aba);
  return shadowsOn(grp);
}

// Колени муравья в его локальных координатах — повтор формулы из makeAnt.pose (walk = null).
function antKnees(buckle, drop = 0) {
  const by = lerp(.42, .14, buckle) - drop, kneeX = [.4, .12, -.22], spread = 1 + buckle * .45, out = [];
  for (let i = 0; i < 3; i++) for (const side of [1, -1])
    out.push(new THREE.Vector3(kneeX[i] * spread, lerp(by + .2, by + .06, buckle), side * lerp(.32, .5, buckle)));
  return out;
}

defineScene('strength', {
  setup(s) {
    times();
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const { root, lights } = stage;
    const L0 = { key: lights.key.intensity, rimL: lights.rimL.intensity, rimR: lights.rimR.intensity, hemi: lights.hemi.intensity };

    // ===== s1: кость со срезом =====
    const H_CUT = 1.8;
    const planeLow = new THREE.Plane(new THREE.Vector3(0, -1, 0), H_CUT);   // оставляет y ≤ H_CUT
    const planeUp = new THREE.Plane(new THREE.Vector3(0, 1, 0), -H_CUT);    // оставляет y ≥ H_CUT (в локальной СК верхней половины)
    const boneMatLo = new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25, clippingPlanes: [planeLow] });
    const boneMatUp = new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25, clippingPlanes: [planeUp], transparent: true });
    const boneLo = makeBone(3, .6, boneMatLo), boneUp = makeBone(3, .6, boneMatUp);
    for (const b of [boneLo, boneUp]) { b.rotation.z = Math.PI / 2; b.position.y = 1.5; }
    const boneGrp = new THREE.Group(); boneGrp.add(boneLo, boneUp); root.add(boneGrp);

    // «die-shot» сечения: кортикальное кольцо, костномозговой канал, ламеллы-кольца, остеоны (InstancedMesh)
    const cap = new THREE.Group(); cap.position.y = H_CUT + .0015; cap.rotation.x = -Math.PI / 2;
    const RO = .3, RI = .165;
    const cortex = new THREE.Mesh(new THREE.RingGeometry(RI, RO, 96, 1), new THREE.MeshStandardMaterial({ color: '#FBFAF6', roughness: .55 }));
    const marrow = new THREE.Mesh(new THREE.CircleGeometry(RI, 96), new THREE.MeshPhysicalMaterial({ color: '#1C1C1E', roughness: .3, clearcoat: 1 }));
    cap.add(cortex, marrow);
    const lamellae = [];
    for (let i = 0; i < 7; i++) {
      const r = lerp(RI + .012, RO - .008, i / 6), pts = [];
      for (let k = 0; k <= 128; k++) { const a = k / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, .0008)); }
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2a2a2c', transparent: true, opacity: .25 }));
      cap.add(ln); lamellae.push(ln);
    }
    // концентрические кольца в канале — «трабекулы», светлые тонкие
    for (let i = 0; i < 3; i++) {
      const r = RI * (.35 + i * .2), pts = [];
      for (let k = 0; k <= 96; k++) { const a = k / 96 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, .0008)); }
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .12 }));
      cap.add(ln); lamellae.push(ln);
    }
    const NOST = 46, ost = new THREE.InstancedMesh(new THREE.RingGeometry(.55, 1, 20, 1), new THREE.MeshBasicMaterial({ color: '#8E8E93' }), NOST);
    { const R = rng(11), m = new THREE.Matrix4();
      for (let i = 0; i < NOST; i++) {
        const a = i / NOST * Math.PI * 2 + R() * .12, r = lerp(RI + .03, RO - .025, R()), sz = lerp(.008, .014, R());
        m.makeScale(sz, sz, 1).setPosition(Math.cos(a) * r, Math.sin(a) * r, .0012); ost.setMatrixAt(i, m);
      } }
    cap.add(ost);
    root.add(cap);
    // «лазер» — тонкое светящееся кольцо, скользящее вниз по кости
    const laser = new THREE.Mesh(new THREE.TorusGeometry(RO + .012, .005, 8, 96), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true }));
    laser.rotation.x = Math.PI / 2; root.add(laser);
    // масса — цельный графитовый куб
    const cube = new THREE.Mesh(roundedBox(1.1, .05, 3), MAT.graphite()); shadowsOn(cube); root.add(cube);

    // ===== муравей (s2 — маленький ориентир, s3 — гигант) =====
    const antMat = MAT.ceramicWhite();
    const ant = makeAnt(antMat); root.add(ant);
    // осколки
    const NSH = 66, shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1, 0), new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .4, clearcoat: .4 }), NSH);
    shards.castShadow = true; shards.frustumCulled = false; root.add(shards);
    const shardData = []; { const R = rng(77);
      for (let i = 0; i < NSH; i++) shardData.push({ k: i % 6, v: [(R() - .5) * 3.2, 1.4 + R() * 2.8, (R() - .5) * 3.2], s: lerp(.035, .09, R()), ax: new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize(), w: 6 + R() * 10, d: R() * .05 }); }
    // пыль
    const NDU = 40, dust = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: '#6E6E73', transparent: true, depthWrite: false, opacity: 0 }), NDU);
    dust.frustumCulled = false; root.add(dust);
    const dustData = []; { const R = rng(5);
      for (let i = 0; i < NDU; i++) dustData.push({ a: R() * Math.PI * 2, r0: .6 + R() * 1.6, sp: .8 + R() * 1.4, s: .06 + R() * .1, x0: (R() - .5) * 2.4 }); }

    // ===== s4: слон, колонны, две кости =====
    const ele = makeElephant(MAT.ceramicWhite()); root.add(ele);
    const colPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const colMat = new THREE.MeshPhysicalMaterial({ color: '#E9E7E2', roughness: .38, clearcoat: .5, clearcoatRoughness: .25, clippingPlanes: [colPlane] });
    const cols = [[.72, .42], [.72, -.42], [-.7, .42], [-.7, -.42]].map(([x, z]) => { const c = makeColumn(colMat); c.position.set(x, 0, z); ele.add(c); return c; });
    const growRing = new THREE.Group(); // светящиеся кольца на фронте роста
    const ringMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true });
    [[.72, .42], [.72, -.42], [-.7, .42], [-.7, -.42]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.TorusGeometry(.37, .006, 6, 64), ringMat); r.rotation.x = Math.PI / 2; r.position.set(x, 0, z); growRing.add(r); });
    ele.add(growRing);
    const bones2 = new THREE.Group();
    const bThinMat = new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25, transparent: true });
    const bThickMat = new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25, transparent: true });
    const bThin = makeBone(1.5, .11, bThinMat), bThick = makeBone(1.5, .4, bThickMat);
    bThin.position.x = -1.15; bThick.position.x = 1.15;
    bones2.add(bThin, bThick); root.add(bones2);

    return { stage, L0, H_CUT, boneGrp, boneLo, boneUp, boneMatUp, cap, lamellae, ost, laser, cube, ant, antMat, shards, shardData, dust, dustData,
      ele, cols, colPlane, growRing, ringMat, bones2, bThin, bThick, bThinMat, bThickMat, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3() };
  },

  update(t, s, st) {
    const T = times(), { stage, L0 } = st, cam = stage.camera, L = stage.lights;
    const sub = t < T.S2 ? 1 : t < T.S3 ? 2 : t < T.S4 ? 3 : 4;
    for (const o of [st.boneGrp, st.cap, st.laser, st.cube, st.ant, st.shards, st.dust, st.ele, st.bones2]) o.visible = false;
    let lk = 1;  // общий множитель света («объект выходит из темноты»)
    L.key.position.set(3, 9, 6);

    if (sub === 1) {
      // ---- кость ----
      const rise = P(t, T.title + 1.65, 1.6, eApple);
      lk = P(t, T.title + 1.6, 1.5, eEase);
      st.boneGrp.visible = true;
      st.boneGrp.position.y = lerp(-.25, 0, rise);
      // свет скользит по кости
      const sweep = P(t, T.title + 1.5, 2.6, eInOut);
      L.key.position.set(lerp(-6, 3, sweep), 9, 6);
      // лазер-срез
      const pl = P(t, T.strong, .7, eInOut);
      st.laser.visible = pl > 0 && pl < 1 || (t > T.strong && t < T.strong + .95);
      st.laser.position.y = lerp(3.05, st.H_CUT, pl) + st.boneGrp.position.y;
      st.laser.material.opacity = Math.min(P(t, T.strong, .15), 1 - P(t, T.strong + .7, .25, eIn));
      st.laser.scale.setScalar(lerp(1.15, 1, smooth(0, .25, pl)));
      // верхняя половина уходит вверх и растворяется
      const lift = P(t, T.strong + .75, 1.3, eInOut);
      st.boneUp.position.y = 1.5 + lift * 1.9;
      st.boneUp.visible = lift < .999;
      st.boneMatUp.opacity = 1 - P(t, T.strong + .95, .6, eEase);
      st.boneMatUp.clippingPlanes[0].constant = -(st.H_CUT + lift * 1.9);
      st.cap.visible = lift > 0;
      st.cap.position.y = st.H_CUT + .0015 + st.boneGrp.position.y;
      // die-shot: кольца подсвечиваются волной, остеоны мерцают
      const wave = (t - T.area) / 1.1;
      st.lamellae.forEach((ln, i) => {
        const ph = i < 7 ? i / 6 : .2 + (i - 7) * .1;
        const hit = Math.exp(-Math.pow((wave - ph) * 5, 2));
        ln.material.opacity = i < 7 ? .22 + .7 * hit * P(t, T.area, .2) : .2 + .5 * hit;
        ln.material.color.set(i < 7 ? (hit > .3 ? '#5a5a5e' : '#2a2a2c') : '#FFFFFF');
      });
      st.ost.material.color.setScalar(lerp(.45, .62, Math.exp(-Math.pow((wave - .5) * 2.5, 2))));
      // масса
      const fall = P(t, T.weight - .2, .55, eIn);
      st.cube.visible = t > T.weight - .25;
      const cubeY = lerp(7.5, st.H_CUT + .55, fall);
      const press = fall >= 1 ? .018 * Math.exp(-(t - (T.weight + .35)) * 9) * Math.max(0, Math.sin((t - T.weight - .35) * 40)) : 0;
      st.cube.position.set(0, cubeY - press, 0);
      st.cube.rotation.y = lerp(.55, .38, fall);
      // камера: герой → макро-проезд над срезом → общий план
      const mIn = P(t, T.strong + .9, 1.45, eInOut), mOut = P(t, T.sect + .55, 1.0, eInOut);
      const hero = { tg: [0, 1.5, 0], d: 15, az: lerp(-28, -12, P(t, T.title + 1.4, 3, eEase)), el: 7 };
      const macro = { tg: [0, st.H_CUT, 0], d: lerp(4.7, 4.0, P(t, T.strong + 2, 1.8, eEase)), az: lerp(-12, 34, P(t, T.strong + .9, 2.8, eEase)), el: lerp(66, 76, mIn) };
      const wide = { tg: [0, 1.85, 0], d: 16, az: lerp(18, 26, P(t, T.sect + .55, 2.5, eEase)), el: 15 };
      const A = mOut > 0 ? macro : hero, B = mOut > 0 ? wide : macro, k = mOut > 0 ? mOut : mIn;
      const tg = [0, 1, 2].map(i => lerp(A.tg[i], B.tg[i], k));
      // дистанция — логарифмически (плавный макро-наезд)
      const d = Math.exp(lerp(Math.log(A.d), Math.log(B.d), k));
      const SY = { h: 760, m: 720, w: 780 }; let sy = lerp(mOut > 0 ? SY.m : SY.h, mOut > 0 ? SY.w : SY.m, k);
      // микротолчок от массы
      const sh = fall >= 1 ? .06 * Math.exp(-(t - T.weight - .35) * 8) * Math.sin((t - T.weight) * 55) : 0;
      frame(cam, [tg[0], tg[1] + sh, tg[2]], d, lerp(A.az, B.az, k), lerp(A.el, B.el, k), 540, sy);
    } else if (sub === 2) {
      // ---- маленький муравей-ориентир ----
      lk = P(t, T.ant - .1, .9, eEase) * (1 - P(t, T.S3 - .5, .4, eIn));
      st.ant.visible = true; st.ant.scale.setScalar(1); st.ant.position.set(0, 0, 0); st.ant.rotation.y = 0;
      st.ant.pose({ walk: (t - T.ant) * 9 });
      frame(cam, [.05, .38, 0], 24, lerp(28, 40, P(t, T.ant, 5, eEase)), 9, 250, 405);
    } else if (sub === 3) {
      // ---- гигант ломается ----
      lk = P(t, T.S3 + .02, .55, eEase);
      L.key.position.set(-2, 8, 7);
      const ant = st.ant; ant.visible = true; ant.scale.setScalar(3); ant.position.set(0, 0, 0); ant.rotation.y = 0;
      const b1 = P(t, T.crunch, .42, eStd) * .72, b2 = P(t, T.breaks, .7, eApple) * .28, buckle = b1 + b2;
      const drop = P(t, T.own - .05, .6, eApple) * .07;
      ant.pose({ buckle, drop });
      ant.children[0].rotation.x = P(t, T.breaks, .8, eApple) * .05;
      // осколки
      const dt0 = t - T.crunch;
      st.shards.visible = dt0 > 0;
      if (dt0 > 0) {
        const kn = antKnees(.25), G = 15, sc = 3;
        st.shardData.forEach((d, i) => {
          const p0 = kn[d.k].clone().multiplyScalar(sc);
          const dt = Math.max(0, dt0 - d.d);
          // время касания пола
          const tf = (d.v[1] + Math.sqrt(d.v[1] * d.v[1] + 2 * G * p0.y)) / G;
          const tt = Math.min(dt, tf);
          st.v.set(p0.x + d.v[0] * tt, Math.max(d.s * .5, p0.y + d.v[1] * tt - .5 * G * tt * tt), p0.z + d.v[2] * tt);
          st.q.setFromAxisAngle(d.ax, d.w * tt);
          const sz = dt0 < d.d ? 0 : d.s;
          st.m4.compose(st.v, st.q, new THREE.Vector3(sz, sz, sz)); st.shards.setMatrixAt(i, st.m4);
        });
        st.shards.instanceMatrix.needsUpdate = true;
      }
      // пыль на «весом»
      const du = t - T.own;
      st.dust.visible = du > 0;
      if (du > 0) {
        const fa = Math.min(P(t, T.own, .2), 1 - P(t, T.own + .5, 1.1, eEase));
        st.dust.material.opacity = .2 * fa;
        st.dustData.forEach((d, i) => {
          const r = d.r0 + d.sp * eExpo(clamp(du / 1.4)) * 1.2;
          st.v.set(d.x0 * .4 + Math.cos(d.a) * r, .1 + d.s * .6 + du * .18, Math.sin(d.a) * r * .8);
          const sz = d.s * (1 + du * 1.2);
          st.m4.compose(st.v, st.q.identity(), new THREE.Vector3(sz, sz * .6, sz)); st.dust.setMatrixAt(i, st.m4);
        });
        st.dust.instanceMatrix.needsUpdate = true;
      }
      // камера: низкая, длиннофокусная, медленный наезд + микротряска на «Хруст»
      const tr = t - T.crunch, amp = tr > 0 ? Math.exp(-tr * 6) * .09 : 0;
      const tr2 = t - T.own, amp2 = tr2 > 0 ? Math.exp(-tr2 * 7) * .05 : 0;
      const shx = amp * Math.sin(tr * 71) + amp2 * Math.sin(tr2 * 63), shy = amp * Math.sin(tr * 53 + 1) + amp2 * Math.sin(tr2 * 47 + 2);
      frame(cam, [.25 + shx, 1.05 + shy, 0], lerp(41, 37.5, P(t, T.S3, 3.5, eEase)), lerp(32, 38, P(t, T.S3, 3.5, eEase)), 1.5, 515, 860, 19);
    } else {
      // ---- слон, колонны, кости ----
      lk = P(t, T.S4 + .02, .7, eEase);
      st.ele.visible = true; st.ele.position.set(0, 0, 0); st.ele.rotation.y = 0;
      st.ele.pose({ trunk: Math.sin((t - T.S4) * 1.3) * .3 });
      const az = lerp(24, 46, P(t, T.S4, 3.4, eEase));
      frame(cam, [.15, 1.55, 0], 22.5, az, 6, 520, 950);
      // колонны «вырастают» из пола (clipping)
      const gr = P(t, T.cols - .2, 1.0, eInOut);
      st.colPlane.constant = gr * 1.47;
      st.cols.forEach(c => c.visible = gr > 0);
      st.growRing.visible = gr > 0 && gr < 1;
      st.growRing.children.forEach(r => r.position.y = gr * 1.47);
      st.ringMat.opacity = Math.min(P(t, T.cols - .2, .15), 1 - smooth(.85, 1, gr));
      st.ele.children.slice(1, 5).forEach(l => l.visible = gr < .98);
      // две кости над слоном, обращены к камере
      const bi = P(t, T.why + .25, 1.0, eApple);
      st.bones2.visible = bi > 0;
      st.bones2.position.set(0, lerp(3.75, 4.05, bi), 0);
      st.bones2.rotation.y = az * Math.PI / 180;
      st.bThin.rotation.x = st.bThick.rotation.x = (t - T.S4) * .35;
      st.bThinMat.opacity = bi; st.bThickMat.opacity = P(t, T.why + .4, 1.0, eApple);
      st.bThick.visible = st.bThickMat.opacity > .01;
    }
    L.key.intensity = L0.key * lk; L.rimL.intensity = L0.rimL * lk; L.rimR.intensity = L0.rimR * lk; L.hemi.intensity = L0.hemi * lk;
    stage.floor.material.opacity = .5 * lk;
  },

  draw2d(t, s, st) {
    const T = times(), cam = st.stage.camera, ink = C_WHITE;
    // «вдохи» между подсценами (поверх 3D, под текстом)
    veil(g, '#000', Math.max(dipA(t, T.S2), dipA(t, T.S3, .2, .3), dipA(t, T.S4, .3, .4)));

    if (t < T.S2) {
      // заголовок-вдох
      atextWords('А теперь главное.', 510, 905, T.title, t, { size: 112, w: 600, col: ink, out: T.title + 1.2, outDur: .4 });
      // выноска «площадь сечения» во время макро
      const [ax, ay] = project(cam, -.3 * Math.cos(.35), st.H_CUT, .3 * Math.sin(.35));
      const outA = T.sect + .5;
      if (t < outA + .5) {
        callout(ax, ay, 250, 395, T.area + .15, t, ink, 1 - P(t, outA, .35, eIn));
        label(96, 335, 'Площадь сечения', 'прочность ∝ L²', T.area + .4, t, { out: outA });
      }
      // общий план: обе выноски
      const [bx, by] = project(cam, .3 * Math.cos(-.6), st.H_CUT - .25, .3 * Math.sin(.6));
      const fo = E('s1') - .3;
      callout(bx, by, 630, 1100, T.weight - .05, t, ink, 1 - P(t, fo, .3, eIn));
      label(630, 1100 + 44, 'Площадь сечения', 'прочность ∝ L²', T.weight + .1, t, { out: fo, size: 40 });
      const [cx, cy] = project(cam, -.4, st.H_CUT + .9, .4);
      callout(cx, cy, 300, 520, T.volume - .2, t, ink, 1 - P(t, fo, .3, eIn));
      label(96, 470, 'Объём', 'вес ∝ L³', T.volume, t, { out: fo });
    } else if (t < T.S3) {
      const out = T.S3 - .2, X = 96, R = 944;
      // ориентир: ×100 рядом с муравьём
      atext('×100', 470, 440, T.hund, t, { size: 120, w: 600, col: ink, align: 'left', out, track: -.04 });
      atext('размер', 476, 494, T.hund + .25, t, { size: 38, w: 500, col: C_GRAY, align: 'left', out });
      // вес ×1 000 000
      acount(1000000, X - 4, 690, T.heavy + .05, t, { size: 150, w: 700, col: ink, align: 'left', prefix: '×', out, dur: 1.1 });
      atext('вес', X, 752, T.mil + .1, t, { size: 44, w: 500, col: C_GRAY, align: 'left', out });
      const pb = P(t, T.mil + .15, 1.1, eApple), qo = 1 - P(t, out, .35, eIn);
      if (pb > 0) { g.save(); g.globalAlpha = qo; g.fillStyle = ink; roundRect(g, X, 790, (R - X) * pb, 12, 6); g.fill(); g.restore(); }
      // прочность ×10 000
      acount(10000, X - 4, 1000, T.stronger + .1, t, { size: 150, w: 700, col: ink, align: 'left', prefix: '×', out, dur: 1.0 });
      atext('прочность ног', X, 1062, T.tenk, t, { size: 44, w: 500, col: C_GRAY, align: 'left', out });
      const ps = P(t, T.tenk + .15, .6, eApple);
      if (ps > 0) { g.save(); g.globalAlpha = qo; g.fillStyle = ink; roundRect(g, X, 1100, Math.max(12, (R - X) / 100 * ps), 12, 6); g.fill(); g.restore(); }
      // недостающая длина — пунктирный контур
      const pg = P(t, T.tenk + .45, .7, eApple);
      if (pg > 0) {
        g.save(); g.globalAlpha = qo * pg * .55; g.strokeStyle = C_GRAY; g.lineWidth = 1.5; g.setLineDash([6, 7]);
        roundRect(g, X + 1, 1100.75, lerp(12, R - X - 2, pg), 10.5, 5.25); g.stroke(); g.restore();
        atext('в 100 раз меньше', R, 1172, T.tenk + .6, t, { size: 36, w: 500, col: C_GRAY, align: 'right', out });
      }
    } else if (t < T.S4) {
      // красные трещины на изломах (единственный акцент сцены)
      const dt = t - T.crunch;
      if (dt > -.02) {
        const kn = antKnees(clamp(P(t, T.crunch, .42, eStd) * .72 + P(t, T.breaks, .7, eApple) * .28), P(t, T.own - .05, .6, eApple) * .07);
        const fade = 1 - P(t, E('s3') - .1, .35, eIn);
        kn.forEach((k, i) => {
          k.multiplyScalar(3);
          const [x, y] = project(cam, k.x, k.y, k.z);
          const fl = Math.exp(-Math.max(0, dt) * 5);
          // вспышка
          g.save(); g.globalAlpha = .5 * fl * fade;
          const gr = g.createRadialGradient(x, y, 0, x, y, 46); gr.addColorStop(0, C_RED); gr.addColorStop(1, 'rgba(255,69,58,0)');
          g.fillStyle = gr; g.fillRect(x - 50, y - 50, 100, 100); g.restore();
          // ломаные трещины
          const R = rng(300 + i), grow = P(t, T.crunch, .22, eExpo);
          g.save(); g.globalAlpha = fade * (.55 + .45 * fl); g.strokeStyle = C_RED; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
          for (let b = 0; b < 3; b++) {
            let px = x, py = y, a = R() * Math.PI * 2; g.beginPath(); g.moveTo(px, py);
            const n = 4; for (let j = 0; j < n; j++) { a += (R() - .5) * 1.4; const l = (8 + R() * 10) * grow; px += Math.cos(a) * l; py += Math.sin(a) * l; g.lineTo(px, py); }
            g.stroke();
          }
          g.restore();
        });
        // выноска к излому передней лапы
        const k0 = kn[0];
        const [x0, y0] = project(cam, k0.x, k0.y, k0.z);
        callout(x0, y0, 600, 470, T.breaks + .15, t, ink, fade);
        label(600, 430, 'Предел', 'прочности превышен', T.breaks + .35, t, { out: E('s3') - .1, align: 'left' });
      }
    } else {
      // кости над слоном
      const ob = E('s4') + .05;
      const b1 = st.bThin.getWorldPosition(new THREE.Vector3()), b2 = st.bThick.getWorldPosition(new THREE.Vector3());
      const [x1, y1] = project(cam, b1.x, b1.y + .08, b1.z), [x2, y2] = project(cam, b2.x, b2.y + .24, b2.z);
      callout(x1, y1, x1, 380, T.why + .7, t, ink, 1 - P(t, ob, .3, eIn));
      label(x1, 340, 'Газель', 'тонкая кость', T.why + .85, t, { align: 'center', out: ob });
      callout(x2, y2, x2, 380, T.eleph, t, ink, 1 - P(t, ob, .3, eIn));
      label(x2, 340, 'Слон', 'кость-колонна', T.eleph + .15, t, { align: 'center', out: ob });
    }
  },

  sfx(add, s) {
    const T = times();
    add(T.title + .02, 'swell', .3);
    add(T.title + 1.55, 'thud', .5, .8);          // кость выходит из темноты
    add(T.strong, 'shimmer', .25);                  // лазер-срез
    add(T.strong + .75, 'whoosh', .35, .8);         // половинки расходятся
    add(T.area + .15, 'click', .3);                 // выноска
    add(T.weight + .33, 'thud', .8, .7);           // масса ложится
    add(T.volume, 'click', .25);
    add(T.ant, 'whoosh', .3, 1.1);
    add(T.heavy + .05, 'tick', .25);
    add(T.mil + .05, 'bloom', .45);
    add(T.stronger + .1, 'tick', .25);
    add(T.tenk + .05, 'click', .35);
    add(T.crunch - 1.5, 'riser', .45);
    add(T.crunch, 'crack', 1);
    add(T.crunch + .03, 'impact', .8);
    add(T.breaks, 'crack', .45, .8);
    add(T.own, 'thud', .7, .6);
    add(T.why + .25, 'whoosh', .3, .8);
    add(T.cols - .2, 'rise', .3);
    add(T.cols + .8, 'click', .35);
  },
});
