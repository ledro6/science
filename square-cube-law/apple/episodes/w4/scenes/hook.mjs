import {defineScene,makeStage,atext,P,Wd,lerp,eInOut} from '../../../engine.mjs';
import {frame} from '../../ep18/scenes/kit.mjs';
import {makeSystem,pose} from './kit.mjs';

defineScene('hook',{
  setup(){
    const stage=makeStage({bg:'black'});
    stage.floor.visible=false;
    const system=makeSystem();stage.root.add(system.group);
    return {stage,system,collapse:Wd('h1','дыра'),orbit:Wd('h2','прежней')};
  },
  update(t,s,{stage,system,collapse}){
    pose(system,t,.45);
    const shrink=P(t,collapse-.15,1.25,eInOut);
    system.sun.visible=shrink<.998;
    system.sun.scale.setScalar(Math.max(.001,1-shrink));
    system.hole.visible=shrink>.35;
    system.hole.scale.setScalar(Math.max(.001,shrink));
    frame(stage.camera,[0,0,0],lerp(18.8,18.0,P(t,s.start,s.end-s.start,eInOut)),lerp(8,-7,P(t,s.start,s.end-s.start,eInOut)),55,520,910);
    stage.lights.rimL.intensity=3.5;stage.lights.rimR.intensity=3;
  },
  draw2d(t,s,{stage,collapse,orbit}){
    const cut=Wd('h2','Землю')-.3;
    atext('Вместо Солнца',520,350,Wd('h1','Солнца')-.15,t,{size:91,col:stage.ink,out:cut});
    atext('чёрная дыра',520,455,collapse-.12,t,{size:103,col:stage.ink,out:cut});
    atext('Орбита сохранится',520,365,orbit-.08,t,{size:90,col:stage.ink});
    atext('Та же масса',520,1195,collapse+.25,t,{size:44,w:500,col:stage.sub});
  },
  sfx(add,s){
    add(s.start+.1,'bloom',.25,.8);
    add(Wd('h1','дыра'),'whoosh',.23,.85);
    add(Wd('h2','прежней'),'chime',.23,.9);
  }
});
