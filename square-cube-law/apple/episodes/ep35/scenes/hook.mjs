import {defineScene,makeStage,Wd,P,atext,accent} from '../../../engine.mjs';
import {setupPasta,camera,text,note} from './kit.mjs';
defineScene('hook',{
 setup(){const stage=makeStage({bg:'black'});return{stage,pasta:setupPasta(stage)}},
 update(t,s,st){const q=P(t,Wd('h1','три')-.15,1.1);st.pasta.pose({release:.06*q,second:q>.1,split:q,gap:.07*q});camera(st.stage,t,s);st.pasta.object.rotation.set(0,0,0);st.pasta.object.position.set(0,0,0);st.pasta.object.scale.setScalar(.85);st.stage.scene.userData.staticKey=`hook-${q.toFixed(5)}`},
 draw2d(t,s,st){const at=Wd('h1','три'),h=Wd('h2','Эта');text('Почему не пополам?',350,Wd('h1','Сгибаешь'),t,st.stage,78,{out:at-.35});atext('3–4',500,420,at,t,{size:175,col:accent(),out:h-.35});text('куска вместо двух',495,at+.2,t,st.stage,41,{col:st.stage.sub,out:h-.35});text('Загадка Фейнмана',350,h,t,st.stage,80);note(t,0,st.stage)},
 sfx(add){add(Wd('h1','три'),'crack',.14,.85);add(Wd('h2','Фейнмана'),'chime',.12,.8)}
});
