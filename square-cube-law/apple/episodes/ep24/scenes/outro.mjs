import { defineScene, makeStage, atext, atextWords, P, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, pill, makePlane, posePlane } from '../kit.mjs';
defineScene('outro',{
  setup(){
    const stage=makeStage({bg:'black',shadow:.5}),plane=makePlane();stage.root.add(plane.object);
    return {stage,plane,card:Wd('o2','Подпишись'),press:Wd('o2','природы')};
  },
  update(t,s,{stage,plane,card}){
    posePlane(plane,t,s,s.start-1,.98);
    const p=P(t,card-.22,.95,eInOut);
    frame(stage.camera,[0,.30,0],lerp(26,33,p),lerp(15,-8,P(t,s.start,s.end-s.start,eInOut)),65,520,lerp(930,860,p));
  },
  draw2d(t,s,{stage,card,press}){
    atext('Кого мы не видим?',520,365,Wd('o1','нужны')-.15,t,{size:95,col:stage.ink,out:card-.4});
    atextWords('Ошибка',520,350,card+.03,t,{size:109,col:stage.ink});
    atextWords('выжившего',520,468,card+.17,t,{size:109,col:stage.ink});
    pill(t,card+.6,press);
  },
  sfx(add,s){
    add(s.start+.15,'swell',.21,.76);add(Wd('o1','нужны'),'tick',.17,.95);
    add(Wd('o2','Подпишись')+.12,'thud',.2,.82);add(Wd('o2','природы'),'click',.43,.94);
  },
});
