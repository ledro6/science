import {defineScene,makeStage,atext,P,Wd,C,lerp,eInOut} from '../../../engine.mjs';
import {frame} from '../../ep18/scenes/kit.mjs';
import {makeSystem,pose} from './kit.mjs';

defineScene('cold',{
  setup(){
    const stage=makeStage({bg:'white'});stage.floor.visible=false;
    const system=makeSystem();system.sun.visible=false;
    stage.root.add(system.group);
    return {stage,system,cold:Wd('c1','остывать'),orbit:Wd('c2','Орбита')};
  },
  update(t,s,{stage,system,cold}){
    pose(system,t,.45);
    system.earth.traverse(o=>{if(o.isMesh&&o.material.color)o.material.color.setScalar(lerp(.7,.32,P(t,cold,.9)));});
    frame(stage.camera,[0,0,0],18.8,lerp(10,-7,P(t,s.start,s.end-s.start,eInOut)),58,520,898);
  },
  draw2d(t,s,{stage,cold,orbit}){
    atext('Без солнечного нагрева',520,360,C('c1'),t,{size:80,col:stage.ink,out:orbit-.28});
    atext('Земля начнёт остывать',520,455,cold-.12,t,{size:75,col:stage.ink,out:orbit-.28});
    atext('Орбита та же',520,360,orbit-.04,t,{size:100,col:stage.ink});
    atext('Условия другие',520,459,Wd('c2','условия')-.05,t,{size:89,col:stage.ink});
  },
  sfx(add){
    add(Wd('c1','остывать'),'swell',.18,.68);add(Wd('c2','Орбита'),'tick',.15,.9);
  }
});
