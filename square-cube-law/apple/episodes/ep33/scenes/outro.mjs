import {defineScene,makeStage,Wd,atext,accent} from '../../../engine.mjs';
import {studio,camera,coin,txt,pill} from './objects.mjs';
defineScene('outro',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);const hero=coin(.57);stage.root.add(hero);return{stage,hero}},
 update(t,s,st){st.hero.position.set(0,.35,0);st.hero.rotation.set(.1,.2,-.12);st.hero.scale.setScalar(.9);camera(st.stage);st.stage.scene.userData.staticKey='outro-held'},
 draw2d(t,s,st){const card=Wd('o2','Петербургский');txt('Бесконечное ожидание',355,Wd('o1','Бесконечное'),t,st,70,{out:card-.4});txt('Конечный выигрыш',460,Wd('o1','конечный'),t,st,76,{out:card-.4});atext('∞',500,720,Wd('o1','ожидание'),t,{size:190,col:accent(),out:card-.4});txt('Петербургский',340,card,t,st,77);txt('парадокс',435,Wd('o2','парадокс'),t,st,99);txt('2 × ½ + 4 × ¼ + ⋯ = ∞',660,card+.2,t,st,47,{col:st.stage.sub});pill(t,Wd('o2','Подпишись'))},
 sfx(add){add(Wd('o2','Подпишись'),'click',.1,.8)}
});
