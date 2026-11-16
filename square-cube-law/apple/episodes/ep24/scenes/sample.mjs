import { defineScene, makeStage, atext, P, Wd, lerp, eInOut } from '../../../engine.mjs';
import { frame, makePlane, posePlane } from '../kit.mjs';
defineScene('sample', {
  setup() {
    const stage=makeStage({bg:'white',shadow:.3}),planes=[];
    for(let i=0;i<3;i++){
      const plane=makePlane();
      plane.object.scale.setScalar(.54);
      stage.root.add(plane.object);planes.push(plane);
    }
    return {stage,planes,cue:Wd('s1','вернуться'),missing:Wd('s2','нет')};
  },
  update(t,s,{stage,planes,cue,missing}) {
    const vanish=P(t,missing-.32,.85,eInOut);
    planes.forEach((plane,i)=>{
      posePlane(plane,t,s,cue+i*.16);
      plane.object.position.set((i-1)*2.04, .08, 0);
      const p=i===2 ? 1-vanish : P(t,cue-.5+i*.14,.65);
      plane.object.visible=p>.002;
      plane.object.scale.setScalar(Math.max(.001,.54*p));
    });
    frame(stage.camera,[0,.28,0],lerp(30,28.5,P(t,s.start,s.end-s.start,eInOut)),3,65,520,894);
  },
  draw2d(t,s,{stage,cue,missing}) {
    atext('Вернувшиеся самолёты',520,365,cue-.15,t,{size:83,col:stage.ink,out:missing-.27});
    atext('Часть картины отсутствует',520,365,missing-.08,t,{size:77,col:stage.ink});
    atext('Повреждения, которые пережили',520,474,Wd('s1','пережили'),t,{size:47,w:500,col:stage.sub,out:missing-.25});
  },
  sfx(add,s){
    add(s.start+.1,'swell',.2,.8);add(Wd('s1','повреждения'),'tick',.16,1);
    add(Wd('s2','нет'),'whoosh',.22,.8);
  },
});
