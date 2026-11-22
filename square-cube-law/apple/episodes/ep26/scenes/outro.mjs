import {defineScene,Wd,P,atext,atextWords,THREE} from '../../../engine.mjs';
import {moonModel,earthModel} from './moon-model.mjs';import {stageFor,label,pill} from './shared.mjs';
defineScene('outro',{
 setup(){const stage=stageFor('black'),earth=earthModel(THREE),moon=moonModel(THREE,{marker:false});earth.scale.setScalar(.9);earth.position.set(-.55,.40,0);moon.group.scale.setScalar(.30);moon.group.position.set(.95,.55,0);moon.group.rotation.set(0,0,0);stage.root.add(earth,moon.group);return {stage,earth,moon};},
 update(t,s,st){st.stage.scene.userData.staticKey='outro-model';},
 draw2d(t,s,st){
  const card=Wd('o1','Секрет'),q=Wd('o2','Какое'),sub=Wd('o2','подпишись');
  atextWords('Синхронное',500,327,card,t,{size:88,col:st.stage.ink});atextWords('вращение',500,420,card+.10,t,{size:88,col:st.stage.ink});
  label(t,'T орбиты = T вращения',500,512,Wd('o1','двух'),st,{size:43});
  label(t,'Какое движение разобрать?',500,1085,q,st,{size:43,col:st.stage.ink});
  pill(t,Wd('o2','Напиши'),sub);
 },
 sfx(add){add(Wd('o1','двух'),'chime',.14,.75);add(Wd('o2','подпишись'),'click',.18,.85);}
});
