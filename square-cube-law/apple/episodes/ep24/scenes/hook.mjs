import { defineScene, makeStage, atext, P, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, makePlane, posePlane } from '../kit.mjs';

defineScene('hook', {
  setup() {
    const stage=makeStage({bg:'black',shadow:.5});
    const plane=makePlane();stage.root.add(plane.object);
    return {stage,plane,holes:Wd('h1','пробоинами'),question:Wd('h1','Куда')};
  },
  update(t,s,{stage,plane,holes}) {
    posePlane(plane,t,s,holes);
    frame(stage.camera,[0,.35,0],lerp(27,24.5,P(t,s.start,s.end-s.start,eInOut)),12,64,520,900);
  },
  draw2d(t,s,{stage,question}) {
    atext('Куда добавить броню?',520,365,question-.1,t,{size:91,col:stage.ink});
    atext('Какие машины мы видим?',520,470,Wd('h2','какие'),t,{size:56,w:500,col:stage.sub});
    atext('Условная схема повреждений',520,1248,s.start+.5,t,{size:34,w:500,col:stage.sub});
  },
  sfx(add,s) {
    add(s.start+.1,'bloom',.25,.8);
    add(Wd('h1','пробоинами'),'tick',.16,.94);
    add(Wd('h1','Куда'),'chime',.18,.89);
    add(Wd('h2','спроси'),'thud',.16,.8);
  },
});
