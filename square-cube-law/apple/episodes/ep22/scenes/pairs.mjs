import { defineScene,makeStage,atext,line,project,P,Wd,lerp,eInOut } from '../../../engine.mjs';
import { frame, people, gridPosition } from './kit.mjs';
defineScene('pairs', {
  setup() {
    const stage=makeStage({bg:'white',shadow:.3}),crowd=people(70,false);stage.root.add(crowd.grp);
    return {stage,crowd,change:Wd('p2','семидесяти'),value:Wd('p2','две'),start:Wd('p1','всех')};
  },
  update(t,s,{stage,crowd,change}) {
    const changeP=P(t,change-.25,.95,eInOut);
    for(let i=0;i<70;i++) {
      const a=gridPosition(i,23),b=gridPosition(i,70);
      const appear=i<23?1:changeP;
      crowd.set(i,lerp(a[0],b[0],changeP),0,lerp(a[1],b[1],changeP),Math.max(.0001,.62*appear),1);
    }
    crowd.commit();
    frame(stage.camera,[0,.22,0],lerp(19.7,22,changeP),lerp(-9,11,P(t,s.start,s.end-s.start,eInOut)),55,520,950);
  },
  draw2d(t,s,{stage,start,change,value}) {
    const p=P(t,change-.25,.95,eInOut), n=p<.5?23:70;
    atext('23 человека',520,343,start,t,{size:82,col:stage.ink,out:change-.32});
    atext('253 пары',520,454,Wd('p1','двести'),t,{size:98,col:stage.ink,out:change-.32});
    atext('70 человек',520,343,change,t,{size:82,col:stage.ink});
    atext('2415 пар',520,454,value,t,{size:100,col:stage.ink});
    atext('n × (n − 1) / 2',520,546,value+.27,t,{size:45,w:500,col:stage.sub});
    const alpha=P(t,start,.75)*.16;
    const count=Math.min(n-1,Math.floor(P(t,start,1.8)*(n-1)));
    const a=gridPosition(0,n), aP=project(stage.camera,a[0],.5,a[1]);
    for(let j=1;j<=count;j++) {
      const b=gridPosition(j,n),bP=project(stage.camera,b[0],.5,b[1]);
      line(...aP,...bP,stage.ink,alpha,1.5);
    }
  },
  sfx(add) {
    add(Wd('p1','всех'),'swell',.19,.8);add(Wd('p1','двести'),'tick',.15,.95);
    add(Wd('p2','семидесяти'),'whoosh',.22,.9);add(Wd('p2','две'),'thud',.22,.9);
  },
});
