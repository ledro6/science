import { defineScene, makeStage, atext, P, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, people, poseCrowd } from './kit.mjs';
defineScene('hook', {
  setup() {
    const stage=makeStage({bg:'black',shadow:.5});
    const crowd=people();stage.root.add(crowd.grp);
    return {stage,crowd,number:Wd('h1','Семьдесят'),chance:Wd('h2','Больше'),small:Wd('h2','хотя')};
  },
  update(t,s,{stage,crowd}) {
    poseCrowd(crowd,t,s.start,70,.64);
    const p=P(t,s.start,s.end-s.start,eInOut);
    frame(stage.camera,[0,.18,0],lerp(22,19.5,p),lerp(22,6,p),42,520,935);
  },
  draw2d(t,s,{stage,number,chance,small}) {
    atext('70 человек',520,375,number,t,{size:125,col:stage.ink,out:chance-.3});
    atext('Найдётся общая дата?',520,481,Wd('h1','шанс'),t,{size:59,col:stage.sub,out:chance-.3});
    atext('>99,9%',520,411,chance,t,{size:158,col:stage.accent,out:small-.25});
    atext('Хотя дней в году 365',520,410,small,t,{size:76,col:stage.ink});
    atext('Совпадёт хотя бы одна пара',520,507,chance+.42,t,{size:46,w:500,col:stage.sub});
  },
  sfx(add,s) {
    add(s.start+.08,'bloom',.26,.8);add(Wd('h1','Семьдесят'),'tick',.16,.9);
    add(Wd('h2','Больше')-1.5,'riser',.16,.92);add(Wd('h2','Больше'),'chime',.24,.91);
  },
});
