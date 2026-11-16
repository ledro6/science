import { THREE, MAT, defineScene, makeStage, atext, atextWords, line, P, Wd, C, project, lerp, clamp, eInOut } from '../../engine.mjs';
import { frame, pill } from '../ep18/scenes/kit.mjs';
import { makeCoffeeCup } from './coffee.mjs';

const modes=[
  {id:'hook',bg:'black',first:'h1',cue:'молоко',second:'h2',next:'сразу'},
  {id:'difference',bg:'white',first:'d1',cue:'прохладнее',second:'d2',next:'разница'},
  {id:'capacity',bg:'black',first:'c1',cue:'теплоёмкость',second:'c2',next:'затем'},
  {id:'compare',bg:'white',first:'r1',cue:'горячее',second:'r2',next:'исключаем'},
  {id:'outro',bg:'black',first:'o1',cue:'один',second:'o2',next:'природы'},
];
const earlyColor=new THREE.Color('#9A9A9E'), coffeeColor=new THREE.Color('#19191C');
const count=24;
const blackTemperature=t=>Math.exp(-.6*t);
const earlyTemperature=t=>Math.exp(-.6*t/1.2)/1.2;
const lateTemperature=t=>blackTemperature(t)/1.2;

function arrow(cam, from, to, p, col, alpha=1) {
  const [x,y]=project(cam,...from);
  const [tx,ty]=project(cam,lerp(from[0],to[0],p),lerp(from[1],to[1],p),lerp(from[2],to[2],p));
  const dx=tx-x,dy=ty-y,len=Math.hypot(dx,dy);
  if(len<2)return;
  line(x,y,tx,ty,col,alpha,3);
  const ux=dx/len,uy=dy/len;
  line(tx,ty,tx-13*ux-7*uy,ty-13*uy+7*ux,col,alpha,3);
  line(tx,ty,tx-13*ux+7*uy,ty-13*uy-7*ux,col,alpha,3);
}
function curve(cam, points, alpha, color) {
  for(let i=1;i<points.length;i++){
    const a=project(cam,...points[i-1]),b=project(cam,...points[i]);
    line(a[0],a[1],b[0],b[1],color,alpha,3);
  }
}
for(const mode of modes)defineScene(mode.id,{
  setup(){
    const stage=makeStage({bg:mode.bg,shadow:.36});
    const cups=[makeCoffeeCup(THREE,MAT),makeCoffeeCup(THREE,MAT)];
    cups[0].group.position.x=-1.92;cups[1].group.position.x=1.42;
    cups.forEach(c=>stage.root.add(c.group));
    const blocks=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.18,.18),MAT.aluminium(),count);
    blocks.frustumCulled=false;blocks.castShadow=true;stage.root.add(blocks);
    const matrix=new THREE.Matrix4();
    return {stage,cups,blocks,matrix,cue:Wd(mode.first,mode.cue),next:Wd(mode.second,mode.next),
      card:mode.id==='outro'?C('o2'):0};
  },
  update(t,s,st){
    const {stage,cups,blocks,matrix,cue,next,card}=st;
    const progress=clamp((t-s.start)/(s.end-s.start));
    let firstMilk=1,secondMilk=0,firstPour=-100,secondPour=-100;
    if(mode.id==='hook'){
      firstPour=next-.15;firstMilk=P(t,firstPour,.85);
    }else if(mode.id==='difference'){
      firstMilk=1;
    }else if(mode.id==='capacity'){
      firstMilk=1;secondPour=next-.15;secondMilk=P(t,secondPour,.85);
    }else{
      firstMilk=1;secondMilk=1;
    }
    cups.forEach((cup,i)=>{
      const fraction=i===0?firstMilk:secondMilk;
      const pourStart=i===0?firstPour:secondPour;
      const active=P(t,pourStart,.3)*(1-P(t,pourStart+.90,.28));
      cup.surface.material.color.copy(coffeeColor).lerp(earlyColor,fraction);
      cup.surface.position.y=lerp(.95,1.13,fraction);
      cup.milk.visible=active>.002;cup.jug.visible=active>.002;
      cup.milk.scale.set(1,Math.max(.001,active*.95),1);
      cup.milk.position.y=1.76+.07*(1-active);
      cup.jug.rotation.z=-.66*active;
      cup.jug.position.set(.34+.16*(1-active),2.20+.12*(1-active),0);
      cup.group.rotation.y=lerp(.08,-.12,progress);
    });
    blocks.visible=mode.id==='capacity';
    for(let i=0;i<count;i++){
      const show=i<20?1:P(t,cue-.12+(i-20)*.08,.5);
      matrix.makeScale(show,show,show);
      matrix.setPosition(-.65+(i%6)*.26,.45+Math.floor(i/6)*.25,-1.0);
      blocks.setMatrixAt(i,matrix);
    }
    blocks.instanceMatrix.needsUpdate=true;
    const outro=mode.id==='outro'?P(t,card-.25,.9,eInOut):0;
    const dist=mode.id==='difference'?26:mode.id==='capacity'?27.4:26.8;
    const elevation=mode.id==='hook'?39:mode.id==='compare'?33:36;
    frame(stage.camera,[0,.70,0],lerp(dist,31,outro),lerp(8,-5,progress),elevation,520,lerp(897,861,outro));
    const reveal=P(t,s.start+.05,.9);
    stage.lights.key.intensity=(mode.bg==='black'?2.6:2.15)*reveal;
    stage.lights.rimL.intensity=(mode.bg==='black'?3.2:1.2)*reveal;
  },
  draw2d(t,s,st){
    const {stage,cups,cue,next,card}=st;
    const {camera,ink,sub}=stage;
    const [lx,ly]=project(camera,-1.92,0,1.10);
    const [rx,ry]=project(camera,1.42,0,1.10);
    const out=mode.id==='outro'?card-.35:s.end-.35;
    atext('Молоко сразу',lx,Math.min(1257,ly+55),s.start+.2,t,{size:39,col:sub,out});
    atext('Молоко позже',rx,Math.min(1257,ry+55),s.start+.2,t,{size:39,col:sub,out});
    if(mode.id==='hook'){
      atext('Когда добавить молоко?',520,364,cue-.1,t,{size:88,col:ink});
      atext('Одинаковое время ожидания',520,455,C('h2'),t,{size:45,w:500,col:sub});
    }
    if(mode.id==='difference'){
      atext('Сначала прохладнее',520,364,cue-.08,t,{size:91,col:ink,out:C('d2')-.25});
      atext('Меньше разница',520,364,next-.08,t,{size:100,col:ink});
      atext('Слабее поток тепла',520,460,next+.20,t,{size:54,w:500,col:sub});
      const q=P(t,next,.9);
      for(let i=0;i<2;i++){
        const cx=cups[i].group.position.x;
        const length=i===0?.42:.93;
        arrow(camera,[cx,.95,.40],[cx,.95+length,.40],q,ink,.76);
        arrow(camera,[cx-.55,.73,.10],[cx-.55-length,.85,.10],q,ink,.76);
      }
    }
    if(mode.id==='capacity'){
      atext('Больше теплоёмкость',520,364,cue-.06,t,{size:91,col:ink,out:C('c2')-.30});
      atext('Одна потеря тепла',520,364,C('c2')+.06,t,{size:91,col:ink});
      atext('Меньше падение температуры',520,457,C('c2')+.25,t,{size:47,w:500,col:sub});
    }
    if(mode.id==='compare'){
      const reveal=P(t,cue,.65);
      atext('После ожидания',520,364,s.start+.08,t,{size:100,col:ink,out:cue-.2});
      atext('Раннее молоко',520,364,cue-.04,t,{size:103,col:stage.accent});
      atext('В этой модели теплее',520,458,cue+.20,t,{size:51,w:500,col:sub});
      const span=2.1, x0=-1.10,y0=2.25;
      const a=[],b=[];
      for(let j=0;j<=48;j++){
        const q=j/48;
        a.push([x0+q*span,y0+earlyTemperature(q)*.72,-.76]);
        b.push([x0+q*span,y0+blackTemperature(q)*.72,-.76]);
      }
      b.push([x0+span,y0+lateTemperature(1)*.72,-.76]);
      curve(camera,a,reveal,stage.accent);
      curve(camera,b,.75*reveal,ink);
      atext('Иллюстративные кривые',520,1239,next+.08,t,{size:31,w:500,col:sub});
    }
    if(mode.id==='outro'){
      atext('Сравнивай в один момент',520,364,cue-.08,t,{size:84,col:ink,out:card-.35});
      atextWords('Кофе и молоко',520,356,card+.03,t,{size:98,col:ink});
      atext('Закон охлаждения Ньютона',520,452,card+.25,t,{size:45,w:500,col:sub});
      pill(t,card+.58,next);
    }
  },
  sfx(add,s){
    add(s.start+.13,'swell',.20,.78);
    add(Wd(mode.first,mode.cue),'tick',.13,.94);
    add(C(mode.second)-.08,'whoosh',.16,.86);
    if(mode.id==='compare'){
      add(Wd('r1','горячее')-1.5,'riser',.16,.91);
      add(Wd('r1','горячее'),'chime',.23,1.04);
    }
    if(mode.id==='outro')add(Wd('o2','природы'),'click',.43,.94);
  },
});
