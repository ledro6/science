import { THREE, MAT, defineScene, makeStage, atext, atextWords, line, P, Wd, C, project, lerp, clamp, eInOut } from '../../engine.mjs';
import { frame, pill } from '../ep18/scenes/kit.mjs';
import { makeCup } from './cup.mjs';

const TAU=Math.PI*2;
const modes=[
  {id:'hook', bg:'black', first:'h1', second:'h2', title:'Чаинки в центре', sub:'Хотя вода вращается', cue:'собираются', secondCue:'дна'},
  {id:'spin', bg:'white', first:'s1', second:'s2', title:'Вращение и давление', sub:'У дна вода медленнее', cue:'давление', secondCue:'медленнее'},
  {id:'bottom', bg:'black', first:'b1', second:'b2', title:'Поток вдоль дна', sub:'От стенок к центру', cue:'давления', secondCue:'центру'},
  {id:'loop', bg:'white', first:'l1', second:'l2', title:'Замкнутая циркуляция', sub:'Чаинки остаются внизу', cue:'поднимается', secondCue:'внизу'},
  {id:'outro', bg:'black', first:'o1', second:'o2', title:'Секрет в трении', sub:'Попробуй сам', cue:'трении', secondCue:'природы'},
];
function pathArrow(cam, points, progress, color, alpha=1) {
  const n=(points.length-1)*clamp(progress);
  for(let i=0;i<Math.ceil(n);i++){
    const a=points[i], b=points[i+1],q=clamp(n-i);
    const [x,y]=project(cam,...a),[x2,y2]=project(cam,lerp(a[0],b[0],q),lerp(a[1],b[1],q),lerp(a[2],b[2],q));
    line(x,y,x2,y2,color,alpha,3);
    if(i===Math.ceil(n)-1){
      const dx=x2-x,dy=y2-y,len=Math.hypot(dx,dy);
      if(len>1){ const ux=dx/len,uy=dy/len;line(x2,y2,x2-ux*13-uy*7,y2-uy*13+ux*7,color,alpha,3);line(x2,y2,x2-ux*13+uy*7,y2-uy*13-ux*7,color,alpha,3);}
    }
  }
}
for(const mode of modes) defineScene(mode.id,{
  setup(){
    const stage=makeStage({bg:mode.bg,shadow:.36});
    const {cup,water}=makeCup(THREE,MAT);stage.root.add(cup);
    const leafGeo=new THREE.SphereGeometry(1,10,6);
    const leaves=new THREE.InstancedMesh(leafGeo,MAT.graphite(),42);
    leaves.castShadow=true; leaves.receiveShadow=true; leaves.frustumCulled=false;cup.add(leaves);
    const particles=new THREE.InstancedMesh(new THREE.SphereGeometry(.018,8,6),MAT.aluminium(),30);
    particles.frustumCulled=false;cup.add(particles);
    const matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();
    return {stage,cup,water,leaves,particles,matrix,pos,quat,scale,
      cue:Wd(mode.first,mode.cue),next:Wd(mode.second,mode.secondCue),
      card:mode.id==='outro'?Wd('o2','Подпишись'):0};
  },
  update(t,s,st){
    const {stage,cup,water,leaves,particles,matrix,pos,quat,scale,cue,next,card}=st;
    const whole=clamp((t-s.start)/(s.end-s.start));
    const reveal=P(t,s.start+.1,.8);
    const secondary=mode.id==='hook'?P(t,cue+.2,1.9):mode.id==='spin'?P(t,next-.4,1.2):1;
    const accumulation=mode.id==='hook'?P(t,cue+.3,2.7):mode.id==='spin'?.12:mode.id==='bottom'?P(t,C('b2')-.15,2.8):1;
    for(let i=0;i<42;i++){
      const phi=i*2.3999632297;
      const baseR=.22+.91*Math.sqrt((i+.5)/42);
      const r=lerp(baseR,.07+.29*Math.sqrt((i+.5)/42),accumulation);
      const a=phi+(t-s.start)*lerp(.8,.19,accumulation);
      pos.set(r*Math.cos(a),.246+.004*(i%4),r*Math.sin(a));
      quat.setFromEuler(new THREE.Euler(.04*(i%5),a,.07*(i%3)));
      scale.set(.062,.013,.025);matrix.compose(pos,quat,scale);leaves.setMatrixAt(i,matrix);
    }
    leaves.instanceMatrix.needsUpdate=true;
    particles.visible=mode.id!=='outro';
    for(let i=0;i<30;i++){
      const phi=i/30*TAU;
      const a=phi+(t-s.start)*.73;
      const travel=((i/30+(t-s.start)*.18)%1);
      const r=lerp(.22,1.10,.5+.5*Math.cos(travel*TAU));
      const y=.66-.42*Math.sin(travel*TAU);
      pos.set(lerp(.95,r,secondary)*Math.cos(a),lerp(1.02,y,secondary),lerp(.95,r,secondary)*Math.sin(a));
      quat.identity();scale.setScalar(reveal);matrix.compose(pos,quat,scale);particles.setMatrixAt(i,matrix);
    }
    particles.instanceMatrix.needsUpdate=true;
    water.material.opacity=mode.id==='hook'?.12:mode.id==='spin'?.07:0;
    const exit=mode.id==='outro'?P(t,card-.3,.9,eInOut):0;
    const high=mode.id==='hook'?50:mode.id==='spin'?35:mode.id==='bottom'?17:mode.id==='loop'?25:30;
    const dist=mode.id==='bottom'?16.5:mode.id==='hook'?16.5:17.0;
    frame(stage.camera,[0,.65,0],lerp(dist,18.7,exit),lerp(2,-7,whole),high,520,lerp(916,885,exit));
    stage.lights.key.intensity=(mode.bg==='black'?2.6:2.15)*reveal;
    stage.lights.rimL.intensity=(mode.bg==='black'?3.2:1.2)*reveal;
    cup.position.set(0,0,0);
  },
  draw2d(t,s,st){
    const {stage,cue,next,card}=st,cam=stage.camera;
    if(mode.id==='outro'){
      atext('Секрет в трении',520,367,cue-.06,t,{size:100,col:stage.ink,out:card-.35});
      atext('у дна',520,479,cue+.11,t,{size:100,col:stage.ink,out:card-.35});
      atextWords('Парадокс чаинок',520,356,card+.02,t,{size:93,col:stage.ink});
      atext('Попробуй сам',520,448,card+.25,t,{size:48,col:stage.sub});
      pill(t,card+.58,next);
      return;
    }
    const early={size:mode.id==='spin'?85:91,col:stage.ink,track:-.032,out:C(mode.second)-.32};
    atext(mode.title,520,368,cue-.06,t,early);
    atext(mode.sub,520,368,next-.06,t,{size:mode.id==='hook'?79:86,col:stage.ink,track:-.032});
    if(mode.id==='spin'){
      const [cx,cy]=project(cam,0,.44,.12);
      const p=P(t,cue+.12,.75)*(1-P(t,C('s2')-.35,.3));
      pathArrow(cam,[[.14,.44,.12],[.5,.44,.12],[.93,.44,.12]],p,stage.ink,p);
      atext('давление выше',cx+58,cy+75,cue+.35,t,{size:35,col:stage.sub,out:C('s2')-.35});
    }
    if(mode.id==='bottom'){
      const p=P(t,C('b2')-.07,.9);
      for(const side of [-1,1])pathArrow(cam,[[side*1.09,.29,.36],[side*.74,.29,.36],[side*.4,.29,.36],[side*.12,.29,.36]],p,stage.accent,p);
      atext('Вид в разрезе',520,1253,s.start+.4,t,{size:34,w:500,col:stage.sub});
    }
    if(mode.id==='loop'){
      const points=[[1.05,.28,.05],[.6,.28,.05],[.1,.30,.05],[0,.58,.05],[.1,1.02,.05],[.65,1.02,.05],[1.05,1.02,.05],[1.05,.65,.05],[1.05,.28,.05]];
      pathArrow(cam,points,P(t,cue-.18,1.6),stage.ink,.85);
      atext('Схема потока',520,1253,s.start+.3,t,{size:34,w:500,col:stage.sub});
    }
  },
  sfx(add,s){
    add(s.start+.13,'swell',.20,.78);
    add(Wd(mode.first,mode.cue),'tick',.14,.94);
    add(C(mode.second)-.10,'whoosh',.17,.85);
    add(Wd(mode.second,mode.secondCue),'chime',.14,1.02);
    if(mode.id==='outro') add(Wd('o2','природы'),'click',.43,.94);
  },
});
