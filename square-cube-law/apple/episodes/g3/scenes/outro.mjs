import { defineScene,makeStage,atext,atextWords,P,Wd,lerp,eInOut } from '../../../engine.mjs';
import { pill } from '../../ep18/scenes/kit.mjs';
import { bench,settings } from '../models.mjs';
defineScene('outro',{
 setup(){const stage=makeStage({bg:'black',shadow:.45}),workshop=bench();stage.root.add(workshop.object);return{stage,workshop,card:Wd('o2','Подпишись'),press:Wd('o2','геоэкономики')};},
 update(t,s,{stage,workshop,card}){
  workshop.tool.pose(t);
  const p=P(t,card-.28,.9,eInOut);
  settings(stage,t,s,{distance:lerp(21.5,25.5,p),sy:lerp(933,845,p),target:[0,.45,0],az:22});
 },
 draw2d(t,s,{stage,card,press}){
  atext('Разрыв сам не исчезнет',540,394,Wd('o1','Догонять'),t,{size:84,col:stage.ink,out:card-.4});
  atextWords('Догоняющее',540,355,card,t,{size:102,col:stage.ink});
  atextWords('развитие',540,474,card+.14,t,{size:106,col:stage.ink});
  pill(t,card+.58,press);
 },
 sfx(add,s){add(s.start+.16,'swell',.22,.7);add(Wd('o2','Подпишись')+.12,'thud',.20,.85);add(Wd('o2','геоэкономики'),'click',.43,.96);}
});
