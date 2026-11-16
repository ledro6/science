import { defineScene,makeStage,atext,P,Wd,lerp,eInOut } from '../../../engine.mjs';
import { bench,settings } from '../models.mjs';
defineScene('hook',{
 setup(){const stage=makeStage({bg:'black',shadow:.45});const workshop=bench();stage.root.add(workshop.object);return{stage,workshop,first:Wd('h2','первый')};},
 update(t,s,{stage,workshop,first}){
  const p=P(t,first-.2,.9,eInOut);workshop.tool.object.visible=p>.001;
  workshop.tool.object.position.y=.10+(1-p)*.65;workshop.tool.object.scale.setScalar(Math.max(.001,p));
  workshop.tool.pose(Math.max(0,t-first));
  settings(stage,t,s,{distance:20.5,sy:925,target:[0,.55,0],az:23});
 },
 draw2d(t,s,{stage,first}){
  atext('Почему догонять',540,356,Wd('h1','Почему'),t,{size:104,col:stage.ink,out:first-.35});
  atext('иногда проще?',540,471,Wd('h1','иногда')-.08,t,{size:104,col:stage.ink,out:first-.35});
  atext('Первый станок',540,384,first,t,{size:107,col:stage.ink});
  atext('Часть работы берёт машина',540,486,Wd('h2','машина'),t,{size:47,w:500,col:stage.sub});
 },
 sfx(add,s){add(s.start+.1,'bloom',.3,.8);add(Wd('h1','мастерской'),'tick',.16,.9);add(Wd('h2','первый')-.14,'whoosh',.22,.84);add(Wd('h2','машина'),'chime',.18,.95);}
});
