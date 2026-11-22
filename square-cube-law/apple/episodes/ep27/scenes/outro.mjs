import {defineScene,atextWords} from '../../../engine.mjs';
import {setup,pose,atext,P,Wd,pill} from './kit.mjs';
defineScene('outro',{
 setup(){return setup('black','all')},
 update(t,s,st){pose(t,s,st,{merge:1,scale:1-.15*P(t,Wd('o2','Подпишись'),.8)});st.stage.root.visible=t<Wd('o2','Подпишись')+.8;st.stage.scene.userData.staticKey=t>Wd('o2','Подпишись')+.9?'outro-card':null},
 draw2d(t,s,st){
  const card=Wd('o2','Подпишись'),ink=st.stage.ink;
  atext('Состав групп',520,325,Wd('o1','Общий'),t,{size:96,col:ink,out:card-.1});
  atext('меняет итог',520,430,Wd('o1','зависит'),t,{size:96,col:ink,out:card-.1});
  atext('Кого именно сравнивают?',520,565,Wd('o1','кого'),t,{size:45,col:st.stage.sub,out:card-.1});
  atextWords('Парадокс Симпсона',520,380,card,t,{size:80,col:ink});
  atext('Сравнивай состав групп',520,490,card+.3,t,{size:44,col:st.stage.sub});
  pill(t,card+.5,Wd('o2','кубе'));
 },sfx(add){add(Wd('o2','Подпишись'),'thud',.15,.8);add(Wd('o2','кубе'),'click',.2,.9)}
});
