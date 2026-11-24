import {defineScene,makeStage,Wd,atext} from '../../../engine.mjs';
import {studio,camera,bars,txt} from './objects.mjs';
defineScene('odds',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,bar:bars(stage)}},
 update(t,s,st){st.bar.pose(t,Wd('p1','вероятность'));camera(st.stage);st.stage.scene.userData.staticKey=t>Wd('p1','вероятность')+1.2?'odds-held':null},
 draw2d(t,s,st){txt('Приз выше',350,Wd('p1','вероятность'),t,st,90);txt('Шанс меньше',455,Wd('p1','меньше'),t,st,80);const ts=[Wd('p1','половина'),Wd('p1','четверть'),Wd('p1','восьмая')];['½','¼','⅛'].forEach((q,i)=>{const x=220+i*280;atext(q,x,690,ts[i],t,{size:120,col:st.stage.ink});atext(['2 ₽','4 ₽','8 ₽'][i],x,1280,ts[i],t,{size:44,col:st.stage.sub})})},
 sfx(add){add(Wd('p1','меньше'),'click',.08,.8)}
});
