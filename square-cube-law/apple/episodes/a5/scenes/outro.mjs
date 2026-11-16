import {defineScene,makeStage,atext,atextWords,P,Wd,lerp,eInOut} from '../../../engine.mjs';
import {makeTyre,road,frame,pill} from '../kit.mjs';
defineScene('outro',{
 setup(){
  const stage=makeStage({bg:'black',shadow:.5}),tyre=makeTyre(),path=road(true);
  path.wedge.visible=false;stage.root.add(path.group,tyre.group);
  return {stage,tyre,card:Wd('o2','Подпишись'),press:Wd('o2','рулём')};
 },
 update(t,s,{stage,tyre,card}){
  tyre.group.position.y=1.08;tyre.spin.rotation.z=-t*.25;
  const p=P(t,card-.22,.95,eInOut),q=P(t,s.start,s.end-s.start,eInOut);
  frame(stage.camera,[0,.90,0],lerp(16.5,23.5,p),lerp(21,7,q),15,520,lerp(1005,858,p));
 },
 draw2d(t,s,{stage,card,press}){
  const out=card-.3;
  atext('Шине нужен контакт',520,356,Wd('o1','шине')-.1,t,{size:94,col:stage.ink,out});
  atext('с дорогой',520,465,Wd('o1','дорогой')-.15,t,{size:100,col:stage.ink,out});
  atextWords('Аквапланирование',520,354,card+.05,t,{size:87,col:stage.ink});
  atext('Вода между шиной и дорогой',520,462,card+.22,t,{size:47,w:500,col:stage.sub});
  pill(t,card+.58,press);
 },
 sfx(add,s){add(s.start+.1,'swell',.22,.75);add(Wd('o1','контакт'),'chime',.17,.9);add(Wd('o2','Подпишись')+.12,'thud',.2,.83);add(Wd('o2','рулём'),'click',.43,.94);}
});
