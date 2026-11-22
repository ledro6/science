import {E,stage,frame,network,setNetwork,degrees,title,Wd} from './kit.mjs';
E.defineScene('people',{
 setup(){const st=stage('white');return {stage:st,n:network(st)};},
 update(t,s,st){frame(st.stage,12.2,880,10);setNetwork(st.n,t,Wd('p1','шесть')-.2);st.stage.scene.userData.staticKey=t>Wd('p1','шесть')+1.3?'ep29-people':null;},
 draw2d(t,s,st){title('Шесть человек',null,t,Wd('p1','шесть'),st.stage,{size:82});degrees(st.n,st.stage,t,Wd('p1','пять'),1,Wd('p1','один'));},
 sfx(add){add(Wd('p1','пять'),'click',.15,.9);}
});
