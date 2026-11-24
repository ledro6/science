import {defineScene,makeStage,THREE,atext,atextWords,P,Wd,lerp} from '../../../engine.mjs';
import {makeJar,frame,pill,settle} from './kit.mjs';
defineScene('outro',{
 setup(){const stage=makeStage({bg:'black',shadow:.2}),jar=makeJar(THREE,{dark:true});stage.root.add(jar);return{stage,jar}},
 update(t,s,st){const p=P(t,s.start+.2,1.2);st.jar.scale.setScalar(1.5);st.jar.position.set(0,.1,0);st.jar.rotation.y=lerp(-.25,.08,p);frame(st.stage.camera,[0,.75,0],10.4,0,8,510,920);settle(st.stage,t,s.start+.2,1.2,'outro-hold')},
 draw2d(t,s,st){const c=st.stage.ink,sub=st.stage.sub,card=Wd('o2','Подпишись');atext('Парадокс бывает',510,350,Wd('o1','парадокс'),t,{size:97,col:c,out:card-.3});atext('Правила для всех нет',510,480,Wd('o1','правила'),t,{size:81,col:c,out:card-.3});atextWords('Парадокс выбора',510,360,card,t,{size:99,col:c});atext('Больше ≠ хуже',510,480,card+.25,t,{size:59,col:sub,w:500});atext('Мир в кубе',510,585,card+.4,t,{size:39,col:sub,w:500});pill(t,card+.7)},
 sfx(add){add(Wd('o1','бывает'),'chime',.16,.85);add(Wd('o2','Подпишись'),'swell',.14,.8)}
});
