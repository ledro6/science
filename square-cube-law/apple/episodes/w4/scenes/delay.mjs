import {defineScene,makeStage,atext,P,Wd,C,lerp,clamp,eInOut} from '../../../engine.mjs';
import {frame} from '../../ep18/scenes/kit.mjs';
import {makeRayPath} from './kit.mjs';

defineScene('delay',{
  setup(){
    const stage=makeStage({bg:'black'});stage.floor.visible=false;
    const model=makeRayPath();stage.root.add(model.group);
    return {stage,model,off:Wd('d1','исчезнет'),start:Wd('d2','Последние'),eight:Wd('d2','восемь'),end:Wd('d2','секунд')};
  },
  update(t,s,{stage,model,off,start,end}){
    const fade=P(t,off,.7);
    model.source.scale.setScalar(Math.max(.001,1-fade));
    const travel=clamp((t-start)/(end-start+.3));
    model.photons.forEach((dot,i)=>{
      const q=travel*1.2+i*.13;
      dot.visible=q<1;
      dot.position.x=lerp(-1.37,1.18,clamp(q));
    });
    model.earth.rotation.y=t*.13;
    model.earth.traverse(o=>{if(o.isMesh&&o.material.color) o.material.color.setScalar(lerp(1,.2,P(t,end,.8)));});
    frame(stage.camera,[0,0,0],17,lerp(4,-4,P(t,s.start,s.end-s.start,eInOut)),12,520,907);
  },
  draw2d(t,s,{stage,eight,end}){
    const out=eight-.18;
    atext('Последние лучи',520,355,C('d1'),t,{size:97,col:stage.ink,out});
    atext('≈ 8 мин 20 с',520,418,eight-.08,t,{size:121,col:stage.accent});
    atext('свет в пути',520,501,eight+.14,t,{size:48,w:500,col:stage.sub});
    atext('Солнце',184,1130,s.start+.6,t,{size:41,w:500,col:stage.sub});
    atext('Земля',864,1130,s.start+.6,t,{size:41,w:500,col:stage.sub});
    atext('Схема времени сжата',520,1225,end-.12,t,{size:33,w:400,col:stage.sub});
  },
  sfx(add){
    const n=Wd('d2','восемь');
    add(Wd('d1','исчезнет'),'swell',.2,.7);
    add(n-1.5,'riser',.18,.9);
    add(n,'chime',.26,.9);
    add(Wd('d2','секунд'),'thud',.17,.7);
  }
});
