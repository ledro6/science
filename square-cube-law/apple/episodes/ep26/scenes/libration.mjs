import {defineScene,THREE,P,Wd,atext,g} from '../../../engine.mjs';
import {moonModel} from './moon-model.mjs';import {stageFor,header,label} from './shared.mjs';
defineScene('libration',{
 setup(){const stage=stageFor('white'),moon=moonModel(THREE,{accent:stage.accent});moon.group.scale.setScalar(.91);moon.group.position.set(0,.45,0);stage.root.add(moon.group);return {stage,moon};},
 update(t,s,st){const a=Math.max(0,t-Wd('l2','покачивание'));const p=P(t,Wd('l2','покачивание'),.8);st.moon.group.rotation.set(.06*Math.sin(a*1.5)*p,.95+.11*Math.sin(a*1.4)*p,.02*Math.sin(a)*p);st.stage.scene.userData.staticKey=t<=Wd('l2','покачивание')?'libration-rest':null;},
 draw2d(t,s,st){const T=Wd('l2','либрация');header(t,Wd('l1','реальности'),st,'Почти одна','сторона',T-.45);header(t,T,st,'Либрация');label(t,'Видимое покачивание',500,430,T+.16,st,{size:40});label(t,'Заглядываем немного за края',500,1225,Wd('l2','заглянуть'),st,{size:39});},
 sfx(add){add(Wd('l2','либрация'),'bloom',.14,.75);}
});
