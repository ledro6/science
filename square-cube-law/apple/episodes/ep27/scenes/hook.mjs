import { defineScene } from '../../../engine.mjs';
import {setup,pose,labels,legend,atext,P,Wd} from './kit.mjs';
defineScene('hook',{
 setup(){return setup('black','all')},
 update(t,s,st){pose(t,s,st,{merge:0})},
 draw2d(t,s,st){
  const flip=Wd('k1','проигрывает'),card=Wd('k2','Это');
  atext('В каждой группе',520,320,Wd('k1','Школа'),t,{size:80,col:st.stage.ink,out:flip-.1});
  atext('лучше',520,415,Wd('k1','выигрывает'),t,{size:104,col:st.stage.ink,out:flip-.1});
  atext('В целом хуже?',520,370,flip,t,{size:92,col:st.stage.ink,out:card-.15});
  atext('Парадокс',520,320,card,t,{size:84,col:st.stage.ink});
  atext('Симпсона',520,415,Wd('k2','Симпсона'),t,{size:100,col:st.stage.ink});
  atext('Вымышленный пример',520,530,Wd('k2','вымышленные'),t,{size:37,col:st.stage.sub});
  labels(t,s.start+.25,st);legend(t,Wd('k2','экзамен'),st);
 },
 sfx(add){add(Wd('k1','выигрывает'),'thud',.18,.8);add(Wd('k1','проигрывает'),'click',.15,.9)}
});
