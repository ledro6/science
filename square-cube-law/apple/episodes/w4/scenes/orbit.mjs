import {defineScene,makeStage,atext,line,project,P,Wd,C,lerp,eInOut} from '../../../engine.mjs';
import {frame} from '../../ep18/scenes/kit.mjs';
import {makeSystem,pose} from './kit.mjs';

defineScene('orbit',{
  setup(){
    const stage=makeStage({bg:'white'});stage.floor.visible=false;
    const system=makeSystem();system.sun.visible=false;
    stage.root.add(system.group);
    return {stage,system,mass:Wd('a1','массы'),distance:Wd('a1','расстояния'),same:Wd('a2','сохранили')};
  },
  update(t,s,{stage,system}){
    pose(system,t,.45);
    frame(stage.camera,[0,0,0],20.2,lerp(-8,7,P(t,s.start,s.end-s.start,eInOut)),62,520,894);
  },
  draw2d(t,s,{stage,system,mass,distance,same}){
    const {camera,ink,sub}=stage;
    atext('Масса и расстояние',520,350,C('a1'),t,{size:88,col:ink,out:C('a2')-.25});
    atext('F = GMm / r²',520,455,mass-.05,t,{size:70,w:500,col:sub,out:C('a2')-.25});
    const [x0,y0]=project(camera,0,0,0),[x1,y1]=project(camera,...system.earth.position.toArray());
    const p=P(t,distance,.8);
    line(x0,y0,lerp(x0,x1,p),lerp(y0,y1,p),ink,.75*p,2,[3,8]);
    atext('M',x0,y0-54,mass,t,{size:49,col:ink});
    atext('r',(x0+x1)/2,(y0+y1)/2-20,distance,t,{size:45,col:ink});
    atext('Притяжение прежнее',520,370,same,t,{size:87,col:ink});
    atext('Схема, масштабы условные',520,1228,s.start+.6,t,{size:32,w:400,col:sub});
  },
  sfx(add){
    add(Wd('a1','массы'),'tick',.17,.9);add(Wd('a1','расстояния'),'tick',.17,1);
    add(Wd('a2','сохранили'),'thud',.2,.8);
  }
});
