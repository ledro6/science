// LAB (l1), светлый фон. Опыт Ашера Шапиро (MIT, 1962): широкий мелкий бак — стеклянная стенка,
// алюминиевый обод, вода.
// «бак шириной почти два метра» — размерная линия по диаметру и «≈ 1,8 м»;
// «оставляют на сутки» — остаточное течение медленно гаснет, кольцо-таймер заполняется до «24 ч»;
// «открывают слив» — в центре медленно рождается воронка против часовой.
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, MAT, glassEdges, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeWater, simTracers, drawTracers, funnelY, frame, ringArrow, dim, circle, smooth, TAU } from './kit.mjs';

function TT() {
  return {
    kor: Wd('l1', 'Кориолис'), op: Wd('l1', 'опыте'), bak: Wd('l1', 'бак'), shir: Wd('l1', 'шириной'), dva: Wd('l1', 'два'), met: Wd('l1', 'метра'),
    ost: Wd('l1', 'оставляют'), sut: Wd('l1', 'сутки'), lish: Wd('l1', 'лишь'), otk: Wd('l1', 'открывают'), sliv: Wd('l1', 'слив'),
  };
}
const T0 = TT();
const RT = 1.6, HT = .34, YW = .27;
// остаточное течение (по часовой) гаснет за «сутки»; после «слив» — медленный вихрь против часовой
const omega = t => -.09 * (1 - smooth((t - T0.ost + .3) / (T0.sut + .9 - T0.ost + .3))) + .3 * smooth((t - T0.otk - .2) / 1.1);
const depthAt = t => .02 + .1 * smooth((t - T0.otk - .25) / 1.2);
const WR = RT - .03;

defineScene('lab', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .4 });
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(RT, RT, .04, 96), new THREE.MeshPhysicalMaterial({ color: '#E8E8EA', roughness: .4, clearcoat: .3 }));
    base.position.y = .02;
    const wallGeo = new THREE.CylinderGeometry(RT, RT, HT, 96, 1, true);
    const wall = new THREE.Mesh(wallGeo, MAT.glass(.16)); wall.position.y = HT / 2 + .02;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(RT, .022, 12, 128), MAT.aluminium());
    rim.rotation.x = Math.PI / 2; rim.position.y = HT + .02;
    const foot = new THREE.Mesh(new THREE.TorusGeometry(RT, .018, 12, 128), MAT.aluminium());
    foot.rotation.x = Math.PI / 2; foot.position.y = .03;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(.06, 32), new THREE.MeshBasicMaterial({ color: '#1D1D1F' }));
    hole.rotation.x = -Math.PI / 2; hole.position.y = .045;
    const water = makeWater({ R: WR, color: '#B9BEC6', base: .42, rim: .35, lit: .35 });
    water.position.y = YW;
    g.add(base, wall, rim, foot, hole, water);
    base.castShadow = rim.castShadow = foot.castShadow = true; base.receiveShadow = true;
    stage.root.add(g);
    return { stage, water, T: TT() };
  },

  update(t, s, st) {
    const { stage, water, T } = st, cam = stage.camera, L = stage.lights;
    L.key.intensity = 2.2;
    water.scale.y = depthAt(t);
    frame(cam, [0, .15, 0], lerp(15.4, 14.2, P(t, s.start, 7, eApple)), lerp(-10, 6, (t - s.start) / (s.end - s.start)), lerp(30, 34, P(t, T.otk, 1.4, eInOut)), 540, 990);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    // вода: трассеры видны, пока есть течение
    const P0 = simTracers(t, s.start - 2, omega, { N: 150, seed: 31, R: WR * .9, rc: .06, rref: .5, core: .2, inflow: .03 });
    const toW = (r, th) => [r * Math.cos(th), YW + funnelY(r, depthAt(t), WR) + .006, -r * Math.sin(th)];
    drawTracers(cam, P0, toW, { col: ink, a: .8 * smooth((Math.abs(omega(t)) - .006) / .05), lw: 2.2, tail: .5 });
    // заголовок
    atext('Опыт Ашера Шапиро', 540, 330, T.op - .1, t, { size: 84, w: 600, col: ink, track: -.03 });
    atext('MIT, 1962', 540, 400, T.op + .2, t, { size: 44, w: 500, col: sub, track: 0 });
    // размер бака
    const dA = P(t, T.bak, .6) * (1 - P(t, T.ost - .1, .4, eIn));
    const az = Math.atan2(cam.position.x, cam.position.z), ex = Math.cos(az), ez = -Math.sin(az);
    const [ax] = project(cam, -RT * ex, HT, -RT * ez), [bx] = project(cam, RT * ex, HT, RT * ez);
    const yb = project(cam, -RT * Math.sin(az), HT, -RT * Math.cos(az))[1] - 46;
    dim(ax, yb, bx, yb, dA, ink);
    line(ax, yb + 14, ax, project(cam, -RT * ex, HT, -RT * ez)[1] - 8, ink, dA * .35, 1.5, [4, 6]);
    line(bx, yb + 14, bx, project(cam, RT * ex, HT, RT * ez)[1] - 8, ink, dA * .35, 1.5, [4, 6]);
    const yl = yb - 34;
    atext('≈ 1,8 м', 540, yl, T.shir, t, { size: 96, w: 600, col: ink, track: -.035, blur: 18, scale0: 1.1, out: T.ost - .1 });
    // сутки: кольцо-таймер
    const cA = P(t, T.ost, .6) * (1 - P(t, T.otk - .1, .4, eIn));
    const cx = 400, cy = yl - 30;
    circle(cx, cy, 46, sub, cA * .35, 3);
    circle(cx, cy, 46, ink, cA, 4, null, P(t, T.ost + .1, T.sut + .8 - T.ost, eInOut));
    atext('24 ч', cx + 80, cy + 30, T.sut - .05, t, { size: 96, w: 600, col: ink, align: 'left', track: -.035, blur: 18, scale0: 1.1, out: T.otk - .1 });
    atext('вода успокаивается', 540, yb + 10, T.sut + .3, t, { size: 40, w: 500, col: sub, track: 0, out: T.otk - .1 });
    // слив: вихрь против часовой
    const vA = P(t, T.otk + .3, .8);
    ringArrow(cam, [0, HT + .12, 0], RT * .62, Math.PI / 2 - .8, Math.PI / 2 - .8 + 1.6 * P(t, T.otk + .3, 1.0, eInOut), { col: ink, a: vA * .9, lw: 3.5, hh: 18 });
    atext('против часовой', 540, yl - 10, T.otk + .35, t, { size: 72, w: 600, col: ink, track: -.03 });
    atext('как ураганы на севере', 540, yb + 10, T.otk + .6, t, { size: 40, w: 500, col: sub, track: 0 });
  },

  sfx(add) {
    const T = TT();
    add(T.op, 'bloom', .22, .8);
    add(T.bak, 'whoosh', .2, .8);
    add(T.dva, 'click', .28);
    add(T.ost, 'tick', .12);
    add(T.sut, 'chime', .2, .85);
    add(T.otk, 'thud', .2, .8);
    add(T.sliv, 'swell', .22, .7);
  },
});
