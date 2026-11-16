import { defineScene,makeStage,atext,atextWords,P,Wd,lerp,eInOut } from '../../../engine.mjs';
import { frame,pill,people,poseCrowd } from './kit.mjs';
defineScene('outro', {
  setup() {
    const stage=makeStage({bg:'black',shadow:.45}),crowd=people();stage.root.add(crowd.grp);
    return {stage,crowd,card:Wd('o2','Подпишись'),press:Wd('o2','природы')};
  },
  update(t,s,{stage,crowd,card}) {
    poseCrowd(crowd,t,s.start-.9,70,.64);
    const p=P(t,card-.22,.95,eInOut),q=P(t,s.start,s.end-s.start,eInOut);
    frame(stage.camera,[0,.15,0],lerp(21,26,p),lerp(15,-10,q),48,520,lerp(975,880,p));
  },
  draw2d(t,s,{stage,card,press}) {
    atext('Больше людей',520,354,Wd('o1','Больше'),t,{size:99,col:stage.ink,out:card-.4});
    atext('Ещё больше пар',520,466,Wd('o1','ещё'),t,{size:94,col:stage.ink,out:card-.4});
    atextWords('Парадокс',520,350,card+.05,t,{size:99,col:stage.ink});
    atextWords('дней рождения',520,463,card+.2,t,{size:93,col:stage.ink});
    atext('70 человек → >99,9%',520,552,card+.38,t,{size:48,w:500,col:stage.sub});
    pill(t,card+.6,press);
  },
  sfx(add,s) {add(s.start+.18,'swell',.21,.76);add(Wd('o1','пар'),'tick',.18,.95);add(Wd('o2','Подпишись')+.12,'thud',.2,.82);add(Wd('o2','природы'),'click',.43,.94);},
});
