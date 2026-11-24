import {defineScene,makeStage,THREE,atext,P,Wd,lerp} from '../../../engine.mjs';
import {makeJar,makeDisplay,frame,settle} from './kit.mjs';
defineScene('hook',{
 setup(){const stage=makeStage({bg:'black',shadow:.2}),jar=makeJar(THREE,{dark:true}),rack=makeDisplay(THREE,24,{dark:true});jar.scale.setScalar(1.8);jar.position.set(.25,.06,.7);rack.scale.setScalar(.75);rack.position.set(0,0,-.6);stage.root.add(jar,rack);return{stage,jar,rack}},
 update(t,s,st){const p=P(t,Wd('h1','Знаменитый'),1.4),q=P(t,.15,1.4);st.jar.scale.setScalar(lerp(1.8,.9,p));st.jar.position.set(lerp(.05,1.1,p),.08,.8);st.rack.scale.setScalar(.75*P(t,Wd('h1','опыт')-.3,1.2));frame(st.stage.camera,[0,1,0],lerp(10.5,13.2,p),lerp(-12,8,p),10,510,940);st.stage.lights.key.intensity=2.6*q;st.stage.lights.rimL.intensity=3.2*q;settle(st.stage,t,Wd('h1','опыт')-.3,1.6,'hook-hold')},
 draw2d(t,s,st){const c=st.stage.ink;atext('Больше вариантов,',510,330,Wd('h1','больше'),t,{size:99,col:c});atext('меньше покупок?',510,450,Wd('h1','меньше'),t,{size:103,col:c});atext('Миф или нет?',510,575,Wd('h1','пересказывают'),t,{size:48,w:500,col:st.stage.sub})},
 sfx(add){add(.15,'swell',.19,.75);add(Wd('h1','опыт'),'click',.15,.8)}
});
