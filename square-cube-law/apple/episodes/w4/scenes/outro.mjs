import {defineScene,makeStage,atext,atextWords,P,Wd,lerp,eInOut} from '../../../engine.mjs';
import {frame,pill} from '../../ep18/scenes/kit.mjs';
import {makeSystem,pose} from './kit.mjs';

defineScene('outro',{
  setup(){
    const stage=makeStage({bg:'black'});stage.floor.visible=false;
    const system=makeSystem();system.sun.visible=false;stage.root.add(system.group);
    return {stage,system,card:Wd('o2','Подпишись'),press:Wd('o2','природы')};
  },
  update(t,s,{stage,system,card}){
    pose(system,t,.45);
    const p=P(t,card-.2,1.2,eInOut);
    frame(stage.camera,[0,0,0],lerp(20.2,27.8,p),lerp(-7,9,P(t,s.start,s.end-s.start,eInOut)),56,520,lerp(920,879,p));
  },
  draw2d(t,s,{stage,card,press}){
    const opt={size:86,col:stage.ink,out:card-.32};
    atext('Мысленный опыт',520,355,Wd('o1','мысленный')-.08,t,opt);
    atext('Солнце так не закончит',520,456,Wd('o1','хватает')-.08,t,{...opt,size:76});
    atextWords('Та же масса',520,355,card+.03,t,{size:104,col:stage.ink});
    atextWords('та же орбита',520,466,card+.18,t,{size:99,col:stage.ink});
    pill(t,card+.58,press);
  },
  sfx(add,s){
    add(s.start+.18,'swell',.21,.75);
    add(Wd('o2','Подпишись')+.08,'thud',.2,.8);
    add(Wd('o2','природы'),'click',.43,.94);
  }
});
