import {defineScene,makeStage,atext,P,Wd,lerp,eInOut} from '../../../engine.mjs';
import {makeTyre,road,frame} from '../kit.mjs';
defineScene('hook',{
  setup(){
    const stage=makeStage({bg:'black',shadow:.5}),tyre=makeTyre(),path=road(true);
    stage.root.add(path.group,tyre.group);
    return {stage,tyre,path,clue:Wd('h2','клин')};
  },
  update(t,s,{stage,tyre,path,clue}){
    const p=P(t,clue-.3,1.1,eInOut),q=P(t,s.start,s.end-s.start,eInOut);
    tyre.group.position.y=1.08+p*.19;tyre.spin.rotation.z=-t*.55;
    path.wedge.scale.y=Math.max(.001,p);path.wedge.visible=p>.002;
    path.stripe.scale.x=lerp(1,.25,p);
    frame(stage.camera,[.08,.95,0],lerp(16,14.7,q),lerp(24,10,q),12,520,890);
    stage.lights.rimL.intensity=3.4;stage.lights.rimR.intensity=2.8;
  },
  draw2d(t,s,{stage,clue}){
    const o=Wd('h2','Между')-.25;
    atext('Колесо на воде',520,356,Wd('h1','луже')-.1,t,{size:104,col:stage.ink,out:o});
    atext('Почему пропадает сцепление?',520,456,Wd('h1','Почему')-.1,t,{size:50,w:500,col:stage.sub,out:o});
    atext('Водяной клин',520,356,clue-.1,t,{size:104,col:stage.ink});
    atext('Схема увеличена',520,1247,clue+.2,t,{size:38,w:500,col:stage.sub});
  },
  sfx(add,s){add(s.start+.1,'bloom',.27,.83);add(Wd('h1','луже'),'swell',.19,.7);add(Wd('h2','клин'),'whoosh',.22,.9);}
});
