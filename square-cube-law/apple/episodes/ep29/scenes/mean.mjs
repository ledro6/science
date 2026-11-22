import {E,stage,frame,network,setNetwork,degrees,title,Wd,atext} from './kit.mjs';
E.defineScene('mean',{
 setup(){const st=stage('white');return {stage:st,n:network(st)};},
 update(t,s,st){frame(st.stage,12.2,1000,0);setNetwork(st.n,t,Wd('m1','Сложим')-.2,'row');st.stage.scene.userData.staticKey=t>Wd('m1','Сложим')+1.3?'ep29-mean':null;},
 draw2d(t,s,st){title('Считаем людей',null,t,Wd('m1','Сложим'),st.stage);degrees(st.n,st.stage,t,Wd('m1','десять'));atext('1,67',500,650,Wd('m1','Меньше')-.1,t,{size:186,col:st.stage.ink});atext('друга на человека',500,730,Wd('m1','Меньше')+.12,t,{size:43,col:st.stage.sub});atext('10 в сумме / 6 человек',500,1170,Wd('m1','десять'),t,{size:38,col:st.stage.sub});},
 sfx(add){add(Wd('m1','Меньше'),'chime',.15,.9);}
});
