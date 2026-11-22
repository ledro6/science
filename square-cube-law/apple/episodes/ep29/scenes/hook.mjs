import {E,stage,frame,network,setNetwork,title,Wd,P,atext} from './kit.mjs';
E.defineScene('hook',{
 setup(){const st=stage('black');return {stage:st,n:network(st)};},
 update(t,s,st){frame(st.stage,12.2,880,10);setNetwork(st.n,t,Wd('h1','Почему'));st.stage.scene.userData.staticKey=t>Wd('h1','Почему')+1.5?'ep29-hook':null;},
 draw2d(t,s,st){const end=Wd('h1','Это')-.08;title('Почему у друзей','друзей больше?',t,Wd('h1','Почему')-.08,st.stage,{out:end});atext('Парадокс дружбы',500,355,Wd('h1','парадокс'),t,{size:76,col:st.stage.ink});},
 sfx(add){add(Wd('h1','Почему'),'bloom',.15,.8);add(Wd('h1','парадокс'),'chime',.14,.9);}
});
