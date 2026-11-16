import { THREE, MAT, defineScene, makeStage, atext, atextWords, P, Wd, C, project, line, lerp, clamp, eInOut } from '../../engine.mjs';
import { frame, pill } from '../ep18/scenes/kit.mjs';
import { makeCapillaries } from './apparatus.mjs';

const modes = [
  {id:'hook',bg:'black',first:'h1',second:'h2',cue:'поднимется',end:'вверх',title:'Вода поднимается сама',sub:'Без насоса'},
  {id:'wetting',bg:'white',first:'w1',second:'w2',cue:'смачивает',end:'вверх',title:'Вода смачивает стекло',sub:'Поверхностное натяжение'},
  {id:'balance',bg:'black',first:'b1',second:'b2',cue:'вес',end:'бесконечно',title:'Столб становится тяжелее',sub:'Силы приходят в равновесие'},
  {id:'compare',bg:'white',first:'c1',second:'c2',cue:'радиус',end:'вдвое',title:'Радиус вдвое меньше',sub:'Высота вдвое больше'},
  {id:'outro',bg:'black',first:'o1',second:'o2',cue:'баланс',end:'природы',title:'Баланс поверхности и веса',sub:'Капиллярный подъём'},
];

function arrow(camera, points, progress, color, alpha=1) {
  const [a,b] = points.map(p=>project(camera,...p));
  const x=lerp(a[0],b[0],progress),y=lerp(a[1],b[1],progress);
  line(a[0],a[1],x,y,color,alpha,3);
  const dx=x-a[0],dy=y-a[1],d=Math.hypot(dx,dy);
  if(d>3){
    const ux=dx/d,uy=dy/d;
    line(x,y,x-ux*14-uy*7,y-uy*14+ux*7,color,alpha,3);
    line(x,y,x-ux*14+uy*7,y-uy*14-ux*7,color,alpha,3);
  }
}
for (const mode of modes) defineScene(mode.id, {
  setup() {
    const stage=makeStage({bg:mode.bg,shadow:.40});
    const model=makeCapillaries(THREE,MAT,mode.bg==='black');
    const pair=mode.id==='compare'||mode.id==='outro';
    if(!pair){ model.tubes[0].position.x=0;model.tubes[1].visible=false;model.reservoir.scale.x=.72;model.base.scale.x=.72; }
    stage.root.add(model.group);
    return {stage,model,pair,cue:Wd(mode.first,mode.cue),next:Wd(mode.second,mode.end),card:mode.id==='outro'?Wd('o2','Подпишись'):0};
  },
  update(t,s,{stage,model,pair,cue,card}) {
    const q=clamp((t-s.start)/(s.end-s.start));
    const lift=mode.id==='hook'?P(t,cue-.16,1.5,eInOut):mode.id==='balance'?P(t,s.start+.18,1.4,eInOut):1;
    for(let i=0;i<2;i++)model.tubes[i].userData.setHeight(lerp(.04,i?2:1,lift));
    const exit=mode.id==='outro'?P(t,card-.2,.95,eInOut):0;
    const macro=mode.id==='wetting'?1:0;
    model.group.scale.setScalar(lerp(1,.82,exit));
    frame(stage.camera,[0,macro?1.25:1.19,0],lerp(macro?14.2:16.2,18.2,exit),lerp(6,-6,q),macro?8:12,520,lerp(860,845,exit));
    stage.lights.key.intensity=mode.bg==='white'?2.2:2.6;
    stage.lights.rimL.intensity=mode.bg==='white'?1.2:3.2;
    stage.lights.rimR.intensity=mode.bg==='white'?.9:2.4;
  },
  draw2d(t,s,{stage,model,cue,next,card}) {
    const {camera,ink,sub,accent}=stage;
    if(mode.id==='outro'){
      atext('Тоньше трубка',520,356,C('o1'),t,{size:97,col:ink,out:card-.33});
      atext('выше столб',520,466,Wd('o1','выше')-.08,t,{size:97,col:ink,out:card-.33});
      atextWords('Капиллярный',520,353,card+.03,t,{size:94,col:ink});
      atextWords('подъём',520,461,card+.16,t,{size:94,col:ink});
      pill(t,card+.58,next);
      return;
    }
    const cut=C(mode.second)-.34;
    atext(mode.title,520,357,cue-.1,t,{size:mode.id==='balance'?74:82,col:ink,out:cut});
    atext(mode.sub,520,357,next-.12,t,{size:mode.id==='balance'?66:mode.id==='wetting'?74:83,col:ink});
    atext('Вода и чистое стекло',520,1248,s.start+.25,t,{size:35,w:500,col:sub});
    if(mode.id==='wetting'){
      const top=1.36, p=P(t,C('w2')-.04,.85);
      arrow(camera,[[.23,top,.06],[.23,top+.52,.06]],p,ink,p);
      arrow(camera,[[-.23,top,.06],[-.23,top+.52,.06]],p,ink,p);
      const [x,y]=project(camera,.05,top+.05,.08);
      atext('изгиб поверхности',x+85,y-26,cue+.3,t,{size:35,w:500,col:sub,align:'left',out:cut});
    }
    if(mode.id==='balance'){
      const p=P(t,cue-.12,.8);
      arrow(camera,[[-.43,.70,.1],[-.43,1.50,.1]],p,ink,p);
      arrow(camera,[[.44,1.50,.1],[.44,.70,.1]],p,ink,p);
      const [x,y]=project(camera,0,1.10,.06);
      atext('натяжение',x-103,y-32,cue+.22,t,{size:36,col:sub,align:'right'});
      atext('вес',x+105,y+47,cue+.34,t,{size:36,col:sub,align:'left'});
    }
    if(mode.id==='compare'){
      const p=P(t,next-.12,.85,eInOut);
      const top1=project(camera,-.62,1.36,.05),top2=project(camera,.62,2.36,.05);
      line(top1[0]+43,top1[1],top2[0]-33,top1[1],sub,p*.65,2,[3,7]);
      arrow(camera,[[.94,.36,.05],[.94,2.36,.05]],p,ink,p);
      atext('2×',790,650,next-.08,t,{size:114,col:accent,blur:16,dur:.75,out:s.end-.35});
      atext('r',317,1212,cue-.12,t,{size:43,col:sub});
      atext('r / 2',710,1212,cue+.18,t,{size:43,col:sub});
    }
  },
  sfx(add,s){
    add(s.start+.13,'swell',.20,.78);
    add(Wd(mode.first,mode.cue),'tick',.15,.94);
    add(C(mode.second)-.10,'whoosh',.17,.86);
    if(mode.id==='compare'){
      add(Wd('c2','вдвое')-1.5,'riser',.16,.91);
      add(Wd('c2','вдвое'),'impact',.27,.87);
    }else add(Wd(mode.second,mode.end),'chime',.15,1.02);
    if(mode.id==='outro')add(Wd('o2','природы'),'click',.43,.94);
  }
});
