import {defineScene,makeStage,Wd,P,orbit,atext,accent} from '../../../engine.mjs';
import {coin,studio,txt} from './objects.mjs';
defineScene('hook',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);const hero=coin(.72);stage.root.add(hero);return{stage,hero}},
 update(t,s,st){const p=P(t,.1,2.4);st.hero.position.set(0,.42,0);st.hero.rotation.set(.12,.18+p*.35,-.12);st.hero.scale.setScalar(.92);orbit(st.stage.camera,[.1,.65,0],13,0,4);st.stage.scene.userData.staticKey=t>2.5?'hook-held':null},
 draw2d(t,s,st){txt('Сколько стоит',360,Wd('h1','Сколько'),t,st,92);txt('такая игра?',465,Wd('h1','игру'),t,st,92);atext('∞',500,750,Wd('h1','бесконечен'),t,{size:240,col:accent()});txt('средний выигрыш',1285,Wd('h1','средний'),t,st,40,{col:st.stage.sub})},
 sfx(add){add(.2,'whoosh',.1,.8);add(Wd('h1','бесконечен'),'chime',.12,.8)}
});
