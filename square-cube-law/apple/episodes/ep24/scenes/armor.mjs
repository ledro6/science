import { defineScene, makeStage, atext, P, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, makePlane, posePlane } from '../kit.mjs';
defineScene('armor', {
  setup(){
    const stage=makeStage({bg:'white',shadow:.3}),plane=makePlane();stage.root.add(plane.object);
    return {stage,plane,correct:Wd('a2','уязвимость')};
  },
  update(t,s,{stage,plane,correct}){
    posePlane(plane,t,s,s.start-1,P(t,correct-.15,1.1,eInOut));
    frame(stage.camera,[0,.40,0],lerp(25.5,24,P(t,s.start,s.end-s.start,eInOut)),lerp(-14,12,P(t,s.start,s.end-s.start,eInOut)),61,520,900);
  },
  draw2d(t,s,{stage,correct}){
    atext('Абрахам Вальд',520,350,Wd('a1','Вальд')-.15,t,{size:104,col:stage.ink,out:correct-.35});
    atext('Исследование уязвимости',520,350,correct-.1,t,{size:77,col:stage.ink});
    atext('Учесть тех, кто не вернулся',520,455,Wd('a2','выживших')-.15,t,{size:59,w:500,col:stage.sub});
    atext('Защита на схеме условная',520,1248,s.start+.3,t,{size:35,w:500,col:stage.sub});
  },
  sfx(add,s){
    add(s.start+.15,'swell',.2,.8);add(Wd('a1','Вальд'),'tick',.15,.95);
    add(Wd('a2','уязвимость'),'click',.22,1);
    add(Wd('a2','выживших'),'chime',.17,.94);
  },
});
