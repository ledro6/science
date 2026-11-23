import * as THREE from 'three';
import {SC,Wd,WdE,P,atext,defineScene,makeStage,orbit,lerp,line,dot} from '../../../engine.mjs';
import {kit} from './props.mjs';
import {compositeShot,glide} from './cinematography.mjs';

const K = kit(THREE);
const INK = '#f5f5f7', GRAY = '#a8adb7', RED = '#ff453a';
const text = (s,y,t0,t,size=76,o={}) => atext(s,510,y,t0,t,{size,w:650,col:INK,...o});
const card = (label,title,t,s) => {
  text(label,292,s.start+.15,t,33,{w:500,col:GRAY,track:.08});
  text(title,390,s.start+.25,t,78);
};
const progress = (t,a,d=.65) => P(t,a,d);
const move = (t,a,d) => glide((t-a)/d);

function setup(id) {
  const stage=makeStage({fov:28});
  stage.scene.userData.staticKey=id;
  stage.floor.visible=false;
  stage.lights.key.castShadow=false;
  const add=o=>stage.root.add(o);
  const camera=(dist,target=[0,0,0],az=0,el=0)=>orbit(stage.camera,target,dist,az,el);
  let model={};
  if (id==='hook'||id==='outro') {
    model=K.doors(); add(model.object); camera(12,[0,.12,0]);
    if(id==='outro') {
      const seam=K.glow(0x75221e);
      model.object.add(K.box(.48,4.0,.07,seam,0,0,.025));
      model.blackout=WdE('o32','вышло')+.07;
    }
  } else if (id==='panel') {
    add(K.box(1.17,2.18,.20,K.standard(0x62676e,.65),0,-.13));
    camera(10,[0,0,0]);
  } else if(id==='hall'||id==='escape') {
    add(K.corridor()); model=K.doors();
    model.object.children[0].visible=false;
    model.object.position.z=1.50; add(model.object);
    if(id==='escape') {
      model.person=K.silhouette();
      model.person.position.set(.28,-.55,-.72);
      add(model.person);
    }
    camera(12,[0,0,0]);
  } else if(id==='phone') {
    model=K.phone(); model.object.position.x=-.80; model.object.position.y=-.15; add(model.object);
    const mirror=K.box(1.45,2.6,.10,K.standard(0x3e4a55,.53),1.13,.26,-.32);
    add(mirror);
    model.person=K.silhouette(); model.person.scale.setScalar(.78);
    model.person.traverse(o=>{
      if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=0}
    });
    model.person.position.set(1.13,.13,-.18); add(model.person);
    camera(11,[0,0,0]);
  } else {
    add(K.mobile()); camera(10,[0,0,0]);
  }
  stage.root.position.y=.34;
  if(id==='hook'||id==='hall'||id==='escape'||id==='outro')stage.root.scale.setScalar(.66);
  return {stage,...model};
}

const six=Wd('h01','шестом'), lights=Wd('p01','свет'), extra=Wd('p02','ещё');
const glove=Wd('a01','варежка'), mirror=Wd('t02','отражение'), pickup=Wd('t02','трубку');
const close=Wd('e02','закрытия'), playback=Wd('m02','запись');
const returnBell=Wd('o31','звякнул'), returnOpen=Wd('o31','поползли');
const cliff=WdE('o32','вышло');
const bellTime=Wd('t01','зазвонил');
const thresholds={hall:SC.hall.start+.55,escape:close};
const positions=[636,741,846,951,1056,1161];
const words = ['6','5','4','3','2','1'];

for (const id of ['hook','panel','hall','phone','escape','morning','outro']) {
  defineScene(id,{
    setup:()=>setup(id),
    composite3d:compositeShot,
    update(t,s,st) {
      if(id==='hook') {
        const glimpse = move(t,six,1.25) - move(t,six+1.9,1.34);
        st.left.position.x=-.693-.105*glimpse;
        st.right.position.x=.693+.105*glimpse;
      } else if(id==='outro') {
        const open=.24*move(t,returnOpen,3.9);
        st.left.position.x=-.693-open;
        st.right.position.x=.693+open;
      } else if(id==='hall'||id==='escape') {
        const p=move(t,thresholds[id],id==='hall'?2.30:2.35);
        const shift=(id==='hall'?p:1-p)*1.35;
        st.left.position.x=-.693-shift; st.right.position.x=.693+shift;
        if(id==='escape') {
          const run=move(t,close-.24,2.25);
          st.person.position.z=lerp(-.72,1.05,run);
          st.person.position.x=lerp(.28,.05,run);
          st.person.position.y=-.55+.065*Math.sin(run*Math.PI*3)**2;
          st.person.rotation.y=.075*Math.sin(run*Math.PI*2);
        }
      } else if(id==='phone') {
        const p=move(t,pickup,1.55);
        const appear=move(t,mirror,1.45);
        st.person.traverse(o=>{if(o.isMesh)o.material.opacity=appear});
        st.receiver.position.set(-.21*p,.64+.82*p,.20+.32*p);
        st.receiver.rotation.z=-.40*p;
        st.person.rotation.y=-.26*appear;
      }
    },
    draw2d(t,s) {
      if(id==='hook') {
        card('МИСТИЧЕСКИЕ ИСТОРИИ','Шестой этаж',t,s);
        text('6',500,six,t,78,{col:RED});
        text('Художественный вымысел',1280,s.start+.4,t,36,{col:GRAY});
      } else if(id==='panel') {
        card('02:13','Лифт остановился',t,s);
        for(let i=0;i<words.length;i++) {
          if(i===0&&t<extra)continue;
          const color=i===0?RED:INK;
          if(i===0){const fade=move(t,extra,.75);dot(540,positions[i],45+5*fade,RED,.35*fade)}
          dot(540,positions[i],37,'#14161a',i===0?.96*move(t,extra,.75):.96);
          atext(words[i],540,positions[i]+14,i===0?extra:s.start+.3,t,{size:39,w:650,col:color});
        }
        const blink=(move(t,lights,.45)-move(t,lights+.72,.63))*.8;
        line(448,740,632,740,'#121416',blink,490);
      } else if(id==='hall') {
        card('ЗА ДВЕРЯМИ','Знакомый коридор',t,s);
        text('Та самая варежка',1238,glove,t,53,{col:GRAY});
      } else if(id==='phone') {
        card('ЗВОНОК','Кто у телефона?',t,s);
        if(t>=mirror) atext('В зеркале',745,1235,mirror,t,{size:42,col:GRAY});
        const bell=t-bellTime;
        for(let i=0;i<3;i++) {
          const p=move(bell,i*.19,1.58);
          const opacity=.7*Math.sin(Math.PI*p)**2;
          line(280-p*75,705-p*40,305-p*75,690-p*40,RED,opacity,3);
        }
      } else if(id==='escape') {
        card('ИЗ ТРУБКИ','Мой голос',t,s);
        text('«Оставь двери открытыми»',1265,Wd('e01','Оставь'),t,53,{col:RED});
      } else if(id==='morning') {
        card('НА СЛЕДУЮЩЕЕ УТРО','Запись вызова',t,s);
        const reveal=s.start+.45;
        atext('02:13',540,708,reveal,t,{size:77,w:700,col:RED});
        line(402,770,678,770,'#3b404a',progress(t,reveal),2);
        for(let i=0;i<25;i++) {
          const h=6+38*(.5+.5*Math.sin(i*1.64+t*4))*Math.sin(i*.35)**2;
          line(423+i*9.7,826-h,423+i*9.7,826+h,INK,progress(t,playback),3);
        }
        atext('Входящий вызов',540,926,reveal,t,{size:27,col:GRAY});
      } else {
        text('Домашний',390,s.start+.25,t,66,{out:returnBell-.4});
        text('6',490,returnBell,t,79,{col:RED,out:cliff-.08});
        text('Продолжение следует',930,cliff+.35,t,58,{dur:.4,blur:0,dy:0});
      }
    },
    sfx(add,s) {
      if(id==='hook')add(six,'thud',.38,.64);
      if(id==='panel') {add(lights,'click',.55,.60);add(extra,'tick',.38,.82)}
      if(id==='hall')add(s.start+.57,'swell',.22,.56);
      if(id==='phone') {
        for(const d of [.42,.63,1.45,1.66])add(bellTime+d-.35,'chime',.63,1.22);
        add(pickup,'click',.5,.73);
      }
      if(id==='escape') {add(close,'click',.72,.66);add(close+.19,'riser',.52,.73);add(close+2.35,'thud',.79,.62)}
      if(id==='morning')add(playback,'tick',.36,.94);
      if(id==='outro')add(returnBell,'chime',.35,.76);
    }
  });
}
