import {defineScene,makeStage,Wd,P,orbit,atext} from '../../../engine.mjs';
import {coin,stacks,studio,camera,txt} from './objects.mjs';
defineScene('rules',{
 setup(){const stage=makeStage({bg:'white'});studio(stage);const hero=coin(.66);stage.root.add(hero);return{stage,hero,stack:stacks(stage)}},
 update(t,s,st){const many=t>=Wd('r2','На');st.hero.visible=!many;st.hero.position.set(0,.5,0);st.hero.rotation.set(.05,(1-P(t,Wd('r1','монетку'),1.1))*Math.PI*2+.1,-.07);st.hero.scale.setScalar(1);st.stack.pose(many?P(t,Wd('r2','На'),.8):0);camera(st.stage);st.stage.scene.userData.staticKey=many&&t>Wd('r2','На')+.8?'rules-stacks':t>Wd('r1','монетку')+1.1&&!many?'rules-coin':null},
 draw2d(t,s,st){const many=Wd('r2','На');txt('До первого орла',355,Wd('r1','Бросаем'),t,st,88,{out:many-.4});txt('Честная монета',455,Wd('r1','честную'),t,st,42,{col:st.stage.sub,out:many-.4});atext('2 ₽',500,710,Wd('r1','два'),t,{size:180,col:st.stage.ink,out:many-.4});txt('Приз удваивается',365,many,t,st,86);const ts=[many,Wd('r2','четыре'),Wd('r2','восемь')];['2','4','8'].forEach((q,i)=>{const x=220+i*280;atext(q,x,680,ts[i],t,{size:148,col:st.stage.ink});atext('₽',x,748,ts[i],t,{size:40,col:st.stage.sub});atext(['1-й бросок','2-й бросок','3-й бросок'][i],x,1205,ts[i],t,{size:33,col:st.stage.sub})})},
 sfx(add){add(Wd('r1','орла'),'click',.1);add(Wd('r2','четыре'),'tick',.07);add(Wd('r2','восемь'),'tick',.07)}
});
