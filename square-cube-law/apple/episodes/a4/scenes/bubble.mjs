import { defineScene, makeStage, atext, dot, P, Wd, C, THREE, MAT, clamp, lerp, project, eInOut } from '../../../engine.mjs';
import { frame, keys, arrow, collectMats, setLit } from '../../a3/scenes/kit.mjs';

const v = 100 / 3.6, gravity = 9.81, seconds = v / gravity;
const top = 3.55, bottom = .33;
const yAt = u => lerp(top,bottom,u*u);
function timing() {
  return { begin: C('f1'), release: Wd('f1','вниз')-.08 };
}
defineScene('bubble', {
  setup() {
    const stage = makeStage({ bg:'black',shadow:.55 });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(.33,48,32), MAT.ceramicWhite());
    sphere.castShadow = true;
    stage.root.add(sphere);
    return { stage, sphere, T: timing(), mats: collectMats(sphere) };
  },
  update(t,s,{stage,T,sphere,mats}) {
    const q = clamp((t-T.release)/seconds);
    sphere.position.y = yAt(q);
    const { key, hemi, rimL, rimR } = stage.lights;
    const lk = P(t,T.begin,1.3), lr = P(t,s.start+.1,1);
    setLit(mats,.3+.7*lk);
    key.position.set(2,9,7); key.target.position.set(0,1.6,0); key.target.updateMatrixWorld();
    key.intensity = 2.3*lk; hemi.intensity=.45; rimL.intensity=3.2*lr; rimR.intensity=2.4*lr;
    const [tx,ty,d,el,sy] = keys([
      [s.start,0,top,11.5,9,905], [T.begin+.65,0,top,10.6,7,905],
      [T.release-.15,0,top,10.4,6,905], [T.release+1.1,.10,1.95,19,6,905],
      [s.end,.10,1.95,19.7,5,905],
    ],t,eInOut);
    frame(stage.camera,[tx,ty,0],d,lerp(-6,4,clamp((t-s.start)/(s.end-s.start))),el,540,sy);
  },
  draw2d(t,s,{stage,T}) {
    const { ink, sub, camera } = stage;
    const q = clamp((t-T.release)/seconds);
    atext('Свободное падение',540,340,T.begin-.05,t,{size:84,col:ink,track:-.03});
    atext('g ≈ 9,8 м/с²',540,410,T.begin+.65,t,{size:44,w:500,col:sub});
    const [,y0]=project(camera,0,top,0), [,y1]=project(camera,0,bottom,0);
    const p = P(t,T.release,.7);
    const ax = 773;
    arrow(ax,Math.max(523,y0),ax,lerp(Math.max(523,y0),Math.min(1280,y1),p),ink,p,3,15);
    for(let j=0;j<6;j++) {
      const u=j/5, [x,y]=project(camera,0,yAt(u),0);
      if(q>u+.06) dot(x,y,3,sub,.58);
    }
    const speed = Math.round(100*q);
    atext(`${speed} км/ч`,823,1137,T.release,t,{size:48,col:ink,align:'left'});
    atext('≈ 2,8 с',823,1210,T.release+seconds-.18,t,{size:44,w:500,col:sub,align:'left'});
  },
  sfx(add,s) {
    const T = timing();
    add(s.start+.16,'bloom',.27,.85);
    add(T.begin+.36,'swell',.19,.75);
    add(T.release,'whoosh',.24,.8);
    add(T.release+.94,'tick',.16,.9);
    add(T.release+1.88,'tick',.16,1.04);
    add(T.release+seconds,'chime',.23,.88);
  },
});
