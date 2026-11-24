import {defineScene,makeStage,Wd,P,lerp,atext,g,accent} from '../../../engine.mjs';
import {studio,camera,txt,hline,point} from './objects.mjs';
const first=[85,88,90,83,86,89],next=[60,64,58,90,56,66];
const y=v=>1160-(v-30)*8;
defineScene('repeat',{
 setup(){const stage=makeStage({bg:'white'});studio(stage);return{stage}},
 update(t,s,st){camera(st.stage)},
 draw2d(t,s,st){const low=Wd('r2','плохого'),q=P(t,low,.8);txt('В среднем ближе',335,Wd('r1','среднем'),t,st,89,{out:low-.4});txt('к обычному уровню',435,Wd('r1','обычному'),t,st,69,{out:low-.4});txt('После необычно плохого',335,low,t,st,65);txt('Тоже ближе к обычному',435,Wd('r2','возможен'),t,st,60);const a=P(t,Wd('r1','среднем'),.8),p=P(t,Wd('r1','следующий'),1.4);hline(140,870,y(60),st.stage.sub,a*.6,[10,9]);atext('Обычный уровень',500,1030,Wd('r1','обычному'),t,{size:32,col:st.stage.sub});for(let i=0;i<6;i++){const x=170+i*120;const v1=lerp(first[i],120-first[i],q),v2=lerp(next[i],120-next[i],q);const yy1=y(v1),yy2=y(v2);g.save();g.globalAlpha=a;g.strokeStyle=st.stage.sub;g.lineWidth=3;g.beginPath();g.moveTo(x-22,yy1);g.lineTo(x+22,lerp(yy1,yy2,p));g.stroke();g.restore();point(x-22,yy1,st.stage.sub,8,a);point(x+22,lerp(yy1,yy2,p),i===3?accent():st.stage.ink,9,a*p)}atext('Не каждый раз',500,550,Wd('r1','каждый'),t,{size:40,col:st.stage.sub,out:low-.4});atext('Слева отбор, справа повтор',500,610,Wd('r1','среднем'),t,{size:29,col:st.stage.sub});atext('Модель, не данные спортсменов',500,1300,Wd('r1','среднем'),t,{size:27,col:st.stage.sub})},
 sfx(add){add(Wd('r1','ближе'),'chime',.14,.9);add(Wd('r1','лучше'),'click',.1,1)}
});
