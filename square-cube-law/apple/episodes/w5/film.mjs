import {defineScene,makeStage,atext,atextWords,line,dot,project,P,Wd,C,lerp,eInOut,clamp} from '../../engine.mjs';
import {frame,pill} from '../ep18/scenes/kit.mjs';
import {makeTunnelWorld,setTrip,radius} from './tunnel.mjs';

const modes=[['hook','black'],['force','white'],['rise','black'],['time','white'],['outro','black']];
function arrow(x,y,tx,ty,ink,alpha=1){
  const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy);
  if(length<4)return;
  const ux=dx/length,uy=dy/length;
  line(x,y,tx,ty,ink,alpha,3);
  line(tx,ty,tx-13*ux-7*uy,ty-13*uy+7*ux,ink,alpha,3);
  line(tx,ty,tx-13*ux+7*uy,ty-13*uy-7*ux,ink,alpha,3);
}
for(const [id,bg] of modes)defineScene(id,{
  setup(){
    const stage=makeStage({bg,shadow:.32});stage.floor.visible=false;
    const world=makeTunnelWorld();stage.root.add(world.object);
    return {stage,world,card:Wd('o2','Подпишись'),press:Wd('o2','природы')};
  },
  update(t,s,{stage,world,card}){
    const q=clamp((t-s.start)/(s.end-s.start));
    let trip=0;
    if(id==='hook')trip=.84*P(t,Wd('h1','Прыгнешь'),6,eInOut);
    if(id==='force')trip=.5*P(t,Wd('f1','разгоняет')-.15,Wd('f2','центре')-Wd('f1','разгоняет')+.35,eInOut);
    if(id==='rise')trip=.5+.5*P(t,C('r1')-.15,Wd('r2','остановишься')-C('r1')+.35,eInOut);
    if(id==='time')trip=P(t,s.start+.5,s.end-s.start-1,eInOut);
    if(id==='outro')trip=(1-Math.cos((t-s.start)*.8))*.5;
    setTrip(world,trip);
    const out=id==='outro'?P(t,card-.23,1.1,eInOut):0;
    const cameraDist=id==='force'?19.8:id==='rise'?20.0:20.2;
    frame(stage.camera,[0,0,0],lerp(cameraDist,29,out),lerp(13,3,q),lerp(6,9,q),520,lerp(905,866,out));
    stage.lights.key.position.set(3,8,7);stage.lights.rimL.intensity=bg==='black'?3.3:1.2;
  },
  draw2d(t,s,{stage,world,card,press}){
    const {ink,sub,camera}=stage;
    const heading={size:90,col:ink,track:-.033};
    if(id==='hook'){
      atext('Тоннель сквозь Землю',520,350,Wd('h1','тоннель')-.08,t,{...heading,size:82});
      atext('Идеальная модель',520,448,Wd('h1','модели')-.15,t,{size:51,w:500,col:sub});
      atext('Без вращения, воздуха и трения',520,1290,C('h2')+.25,t,{size:37,w:500,col:sub});
    }
    if(id==='force'){
      const center=Wd('f2','центре'), zero=Wd('f2','нулевое');
      atext('Ближе к центру',520,352,Wd('f1','центру')-.08,t,{...heading,out:center-.3});
      atext('Слабее притяжение',520,450,Wd('f1','слабее')-.10,t,{size:62,w:500,col:sub,out:center-.3});
      atext('В центре сила нулевая',520,352,zero-.12,t,{...heading,size:77});
      atext('Скорость максимальная',520,450,Wd('f2','максимальная')-.15,t,{size:58,w:500,col:sub});
      const y=world.capsule.position.y;
      const [x0,y0]=project(camera,.46,y,.13),[x1,y1]=project(camera,.46,y*.35,.13);
      arrow(x0,y0,x1,y1,ink,P(t,Wd('f1','притяжение'),.65));
      const [cx,cy]=project(camera,0,0,.18);
      dot(cx,cy,4,sub,P(t,center,.7));
    }
    if(id==='rise'){
      const stop=Wd('r2','остановишься');
      atext('После центра',520,352,Wd('r1','центр')-.05,t,{...heading,out:stop-.3});
      atext('Сила тормозит движение',520,450,Wd('r1','тормозит')-.10,t,{size:60,w:500,col:sub,out:stop-.3});
      atext('Поворотная точка',520,352,stop-.1,t,{...heading,size:86});
      atext('Скорость снова нулевая',520,450,stop+.25,t,{size:58,w:500,col:sub});
      const y=world.capsule.position.y;
      const [x0,y0]=project(camera,.45,y,.13),[x1,y1]=project(camera,.45,y*.38,.13);
      arrow(x0,y0,x1,y1,ink,P(t,Wd('r1','назад'),.6));
    }
    if(id==='time'){
      const reveal=Wd('t1','сорок');
      atext('До другой стороны',520,348,C('t1')-.04,t,{size:79,col:ink,out:reveal-.20});
      atext('≈ 42 мин',520,435,reveal-.04,t,{size:158,col:stage.accent,scale0:1.12,blur:16});
      atext('Для однородной Земли',520,540,reveal+.28,t,{size:49,w:500,col:sub});
      atext('Реальная Земля сложнее',520,1290,C('t2')+.14,t,{size:40,w:500,col:sub});
    }
    if(id==='outro'){
      atext('Гравитационные качели',520,355,Wd('o1','качели')-.2,t,{...heading,size:80,out:card-.38});
      atextWords('Тоннель сквозь',520,355,card+.04,t,{size:95,col:ink});
      atextWords('Землю',520,464,card+.18,t,{size:104,col:ink});
      pill(t,card+.58,press);
    }
  },
  sfx(add,s){
    add(s.start+.14,id==='hook'?'bloom':'swell',.22,.8);
    if(id==='hook')add(Wd('h1','Прыгнешь')+.05,'whoosh',.2,.83);
    if(id==='force'){
      add(Wd('f1','слабее'),'tick',.14,.9);
      add(Wd('f2','нулевое'),'chime',.2,.9);
    }
    if(id==='rise'){
      add(Wd('r1','тормозит'),'whoosh',.19,.82);
      add(Wd('r2','остановишься'),'tick',.16,.94);
    }
    if(id==='time'){
      add(Wd('t1','сорок')-1.5,'riser',.17,.92);
      add(Wd('t1','сорок'),'impact',.26,.87);
      add(Wd('t1','сорок')+.08,'chime',.22,1.04);
    }
    if(id==='outro')add(Wd('o2','природы'),'click',.43,.94);
  }
});
