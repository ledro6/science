import { defineScene, makeStage, atext, atextWords, project, P, C, Wd, eIn, eInOut } from '../../../engine.mjs';
import { frame, keys, makeRoad, makeCutCar, makeDrive, arrow, WR } from '../../a3/scenes/kit.mjs';

function timing() {
  return { speed: Wd('s1','километры'), divide: Wd('s1','делим'), change: C('s2'), turn: Wd('s2','вертикально') };
}

defineScene('air', {
  setup(s) {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    const road = makeRoad({ x0: -40, x1: 490, lanes: [0, 3.8], dark: false });
    road.line(0);
    const car = makeCutCar({ dark: false });
    car.pend.visible = false; car.balloon.visible = false;
    stage.root.add(road, car);
    return { stage, car, T: timing(), drive: makeDrive(() => 0, s.start - 1, s.end + 1, 100/3.6) };
  },
  update(t, s, { stage, T, car, drive }) {
    const x = drive.x(t);
    car.position.x = x; car.spin(x / WR);
    const { key, hemi } = stage.lights;
    key.position.set(x+3,9,7); key.target.position.set(x,0,0); key.target.updateMatrixWorld();
    key.intensity = 2.0; hemi.intensity = 1.15;
    const [tx,ty,d,az,el,sy] = keys([
      [s.start, -.3,.85,21,8,6,980], [T.speed-.3,-.3,.85,20,7,5,980],
      [T.divide,-.42,.92,14.2,3,3,1000], [T.change-.2,-.42,.92,14.4,2,3,1000],
      [T.change+1.8,-.42,.92,13.8,1,3,1010], [s.end,-.42,.92,14.4,-2,3,1010],
    ],t,eInOut);
    frame(stage.camera,[x+tx,ty,0],d,az,el,540,sy);
  },
  draw2d(t,s,{stage,T,car}) {
    const { ink, sub } = stage;
    const end = T.change-.28;
    atext('Километры в час',540,333,T.speed-.08,t,{size:86,col:ink,out:end});
    atext('100 ÷ 3,6 ≈ 27,8 м/с',540,438,T.divide-.05,t,{size:61,w:500,col:sub,out:end});
    atextWords('Одна скорость',540,340,T.change+.04,t,{size:91,col:ink,out:s.end-.4});
    atext('Два направления',540,433,T.change+.55,t,{size:54,w:500,col:sub,out:s.end-.4});
    const [x,y] = project(stage.camera,car.position.x,1.65,.38);
    const p = P(t,T.change+.45,.75,eInOut) * (1-P(t,s.end-.45,.35,eIn));
    const angle = Math.PI/2 * P(t,T.turn-.1,.86,eInOut);
    const length = 260*p;
    const center = x+132*P(t,T.turn-.1,.86,eInOut);
    const dx = length/2*Math.cos(angle), dy = length/2*Math.sin(angle);
    arrow(center-dx,y-50-dy,center+dx,y-50+dy,ink,p,4,17);
    atext('27,8 м/с',x,y-82,T.change+.68,t,{size:43,col:ink,out:T.turn-.2});
  },
  sfx(add,s) {
    const T = timing();
    add(T.speed,'shimmer',.12,.9);
    add(T.divide-.18,'swell',.16,.7);
    add(T.divide+.25,'tick',.14,.9);
    add(T.change,'thud',.16,.9);
    add(T.change+.45,'whoosh',.23,.9);
    add(T.change+.85,'tick',.14,1.05);
    add(T.turn-.09,'whoosh',.2,.85);
    add(T.turn+.65,'click',.17,.96);
  },
});
