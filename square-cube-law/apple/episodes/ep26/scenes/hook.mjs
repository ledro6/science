import {defineScene,THREE,P,Wd,atext,eApple} from '../../../engine.mjs';
import {moonModel} from './moon-model.mjs';import {stageFor,header,label} from './shared.mjs';
defineScene('hook',{
 setup(){const stage=stageFor('black'),moon=moonModel(THREE,{marker:false});moon.group.scale.setScalar(.94);moon.group.position.set(0,.45,0);stage.root.add(moon.group);return {stage,moon};},
 update(t,s,st){const q=P(t,Wd('h1','вращается'),2.1);st.moon.group.rotation.set(.10,-.4+.72*q,-.1);st.stage.scene.userData.staticKey=q===1?'hook-turned':null;},
 draw2d(t,s,st){header(t,Wd('h1','Луна'),st,'Луна','вращается',Wd('h2','Звучит')-.35);header(t,Wd('h2','странно'),st,'Одна сторона','благодаря вращению');label(t,'Сейчас покажем почему',500,1220,Wd('h2','покажу'),st);},
 sfx(add){add(Wd('h1','вращается'),'swell',.16,.7);}
});
