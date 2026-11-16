import { defineScene,makeStage,atext,P,Wd,lerp,eInOut,THREE } from '../../../engine.mjs';
import { frame,numberedDisc } from './kit.mjs';
defineScene('distinct', {
  setup() {
    const stage=makeStage({bg:'black',shadow:.4});
    const discs=[-.9,0,.9].map(x=>{const d=numberedDisc();d.group.scale.setScalar(.64);d.group.position.set(x,0,0);stage.root.add(d.group);return d;});
    return {stage,discs,first:Wd('d1','Второй'),third:Wd('d1','третий'),product:Wd('d2','Перемножаем'),minus:Wd('d2','вычитаем')};
  },
  update(t,s,{stage,discs,first,third}) {
    discs.forEach((d,i)=>{
      const reveal=P(t,s.start+i*.12,.75,eInOut);d.group.position.y=(1-reveal)*.12;
      d.group.scale.setScalar(Math.max(.001,.64*reveal));
      d.needle.rotation.y=P(t,i===0?first:i===1?third:third+.6,1.25,eInOut)*Math.PI*(1.3+i*.1);
    });
    frame(stage.camera,[0,.12,0],lerp(13,12.2,P(t,s.start,s.end-s.start,eInOut)),lerp(7,-8,P(t,s.start,s.end-s.start)),57,520,915);
  },
  draw2d(t,s,{stage,first,third,product,minus}) {
    atext('Все даты разные',520,362,s.start+.18,t,{size:92,col:stage.ink,out:product-.34});
    atext('Считаем по очереди',520,454,s.start+.4,t,{size:46,w:500,col:stage.sub,out:product-.34});
    atext('364 / 365',276,1103,first,t,{size:39,w:500,col:stage.sub});
    atext('363 / 365',520,1103,third,t,{size:39,w:500,col:stage.sub});
    atext('362 / 365',767,1103,third+.45,t,{size:39,w:500,col:stage.sub});
    atext('P(совпадения)',520,350,product,t,{size:78,col:stage.ink});
    atext('1 − P(все разные)',520,448,minus,t,{size:69,w:500,col:stage.ink});
    atext('⋯',922,1102,third+.8,t,{size:49,col:stage.sub});
  },
  sfx(add,s) {
    add(s.start+.11,'bloom',.2,.77);add(Wd('d1','Второй'),'click',.16,.9);
    add(Wd('d1','третий'),'click',.16,1);add(Wd('d2','вычитаем'),'tick',.19,.9);
  },
});
