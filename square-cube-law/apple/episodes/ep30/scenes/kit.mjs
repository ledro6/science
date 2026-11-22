import {THREE,defineScene,makeStage,orbit,atext,P,Wd,C,E,clamp,lerp,line,g,FONT} from '../../../engine.mjs';
import {makeHeadphone} from '../product.mjs';

const N=116;
function wave(color,complex=false) {
  const pts=[];for(let i=0;i<=N;i++){const u=i/N,x=-1.75+u*3.5;
    const y=complex ? (.56*Math.sin(u*27)+.25*Math.sin(u*61)+.14*Math.sin(u*103))*Math.pow(Math.sin(Math.PI*u),.6) : .42*Math.sin(u*Math.PI*4);
    pts.push(new THREE.Vector3(x,y,0));}
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),N,.018,6,false),new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.12}));
}
function title(t,s,st,a,b,key,word){
  const t0=Wd(key,word);atext(a,500,340,t0,t,{size:86,col:st.stage.ink,track:-.035});
  if(b)atext(b,500,438,t0+.14,t,{size:86,col:st.stage.ink,track:-.035});
}
function sub(text,y,t0,t,st,size=36){atext(text,500,y,t0,t,{size,col:st.stage.sub,w:500,track:-.01,dy:18});}
function stage(bg){const st=makeStage({bg});st.floor.visible=false;st.lights.key.castShadow=false;return st;}
function frame(st,dist=9.5,az=0,el=2){orbit(st.camera,[.16,.45,0],dist,az,el);}

export function register(id) {
  const light=['hum','cancel','fit'].includes(id);
  defineScene(id,{
    setup(){
      const stage0=stage(light?'white':'black');
      const hp=makeHeadphone(THREE);stage0.root.add(hp.object);
      const waves=[wave(light?'#555558':'#DDDDDC'),wave('#C2C2C4'),wave(light?'#353538':'#ECECEA'),wave('#E8E8E6',true)];
      waves.forEach(w=>stage0.root.add(w));
      const ear=new THREE.Mesh(new THREE.TorusGeometry(.52,.025,8,48),new THREE.MeshStandardMaterial({color:'#86868B',roughness:.5}));ear.scale.set(1,1.45,1);stage0.root.add(ear);
      const core=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.1,32),new THREE.MeshStandardMaterial({color:'#B8BABC',roughness:.4,metalness:.3}));core.rotation.x=Math.PI/2;stage0.root.add(core);
      return {stage:stage0,hp,waves,ear,core};
    },
    update(t,s,st){
      const {stage,hp,waves,ear,core}=st;
      hp.object.visible=['hook','detect','fit','outro'].includes(id);
      hp.object.position.set(0,.45,0);hp.object.rotation.set(0,0,0);hp.object.scale.setScalar(.62);
      hp.cups.forEach((c,i)=>{c.position.set((i?1:-1)*.91,-.28,0);c.rotation.set(0,(i?1:-1)*-.22,0);});
      hp.band.visible=true;hp.cups.forEach(c=>c.children[4].visible=!['detect','fit'].includes(id));ear.visible=false;core.visible=false;
      waves.forEach((w,i)=>{w.visible=false;w.position.set(0,0,0);w.rotation.set(0,0,0);w.scale.set(.53,1,1);w.material.color.set(i===1?'#C2C2C4':light?'#555558':'#DDDDDC');});
      frame(stage,9.5,0,2);stage.scene.userData.staticKey=null;
      if(id==='hook'){
        const p=P(t,Wd('h1','шумодав'),1.3);hp.object.scale.setScalar(lerp(.59,.62,p));frame(stage,9.7,lerp(20,13,p),4);
        if(p===1)stage.scene.userData.staticKey='hook-settled';
      }
      if(id==='hum'){
        hp.object.visible=false;waves[0].visible=true;waves[0].position.set(0,.45,0);waves[0].rotation.y=-.16;
        waves[0].scale.set(.53,P(t,Wd('u1','плавную'),1.1)*.7+.3,1);frame(stage,9.4,5,7);
        if(t>=Wd('u1','плавную')+1.1)stage.scene.userData.staticKey='hum-settled';
      }
      if(id==='detect'){
        hp.band.visible=false;hp.cups[0].visible=false;hp.cups[1].visible=true;
        const p=P(t,Wd('d1','Электроника'),1.1);hp.object.position.set(-.73,.8,0);hp.object.scale.setScalar(.8);
        core.visible=true;core.position.set(.12,.58,.75*p);frame(stage,8.3,15,3);
        if(p===1)stage.scene.userData.staticKey='detect-open';
      } else hp.cups.forEach(c=>c.visible=true);
      if(id==='cancel'){
        const merge=P(t,Wd('c1','складываются'),1.25);waves[0].visible=waves[1].visible=true;
        waves[0].position.set(0,lerp(1.15,.65,merge),0);waves[1].position.set(0,lerp(-.1,.65,merge),.04);waves[1].scale.y=-.8;
        waves[1].material.color.set(t>=Wd('c1','складываются')&&t<Wd('c1','компенсируются')+.65?'#D70015':'#A0A0A4');
        const residue=P(t,Wd('c1','частично'),.65);
        waves[0].visible=waves[1].visible=residue<.97;
        waves[2].visible=residue>.01;waves[2].position.set(0,.65,0);waves[2].scale.set(.53,.2,1);
        frame(stage,9.4,0,0);
        if(residue===1&&t>=Wd('c1','компенсируются')+.65)stage.scene.userData.staticKey='cancel-residue';
      }
      if(id==='speech'){
        const quiet=P(t,Wd('s1','часть'),.9);waves[3].visible=true;waves[3].position.set(0,.75,0);waves[3].scale.set(.53,lerp(.8,.35,quiet),1);frame(stage,9.8,0,3);
        stage.scene.userData.staticKey=quiet===0?'speech-complex':quiet===1?'speech-residue':null;
      }
      if(id==='fit'){
        hp.band.visible=false;hp.cups[0].visible=false;hp.object.position.set(-.65,.8,0);hp.object.scale.setScalar(.72);
        const p=P(t,Wd('f1','Плотное'),1.2);ear.visible=true;ear.position.set(0,.598,lerp(.7,.14,p));ear.scale.set(.72,.99,1);frame(stage,7.2,26,4);
        if(p===1)stage.scene.userData.staticKey='fit-sealed';
      }
      if(id==='outro'){
        const p=P(t,C('o2'),1.0);hp.object.scale.setScalar(lerp(.62,.48,p));hp.object.position.set(0,lerp(.45,.35,p),0);frame(stage,9.8,15,4);
        if(p===1)stage.scene.userData.staticKey='outro-card';
      }
    },
    draw2d(t,s,st){
      if(id==='hook'){title(t,s,st,'Гул тише','Речь слышна?','h1','Почему');sub('Один шумодав, разные звуки',1190,Wd('h1','рядом'),t,st);}
      if(id==='hum'){title(t,s,st,'Устойчивый','низкий фон','u1','Гул');sub('Условная форма звукового давления',1150,Wd('u1','волну'),t,st,31);sub('Низкие частоты',1230,Wd('u1','низкие'),t,st,40);}
      if(id==='detect'){
        title(t,s,st,'Услышать','и ответить','d1','Микрофон');
        const labels=[['Микрофон','Микрофон'],['Расчёт','Электроника'],['Динамик','динамик']];
        labels.forEach(([tx,w],i)=>atext(tx,215+i*285,1240,Wd('d1',w),t,{size:33,w:500,col:st.stage.sub,dy:18}));
      }
      if(id==='cancel'){
        title(t,s,st,'Волны','складываются','c1','Там');
        const m=Wd('c1','складываются');const rem=Wd('c1','частично');
        if(t<rem+.3){atext('Шум + противофаза',500,1150,m-.3,t,{size:41,w:500,col:st.stage.ink,out:rem+.1});}
        sub('Меньше колебания у уха',1190,rem,t,st,41);
        sub('Схема, компенсация неполная',1250,rem+.3,t,st,29);
      }
      if(id==='speech'){
        title(t,s,st,'Речь','быстро меняется','s1','речь');
        sub('Сложная форма звукового давления',1150,Wd('s1','высокочастотные'),t,st,31);
        sub('Часть речи остаётся',1240,Wd('s1','часть'),t,st,42);
      }
      if(id==='fit'){title(t,s,st,'Посадка','тоже важна','f1','Посадка');sub('Плотное прилегание',1280,Wd('f1','Плотное'),t,st,42);}
      if(id==='outro'){
        const card=C('o2');
        atext('Лучше всего',500,330,Wd('o1','Лучший'),t,{size:84,col:st.stage.ink,out:card-.35});
        atext('низкий фон',500,430,Wd('o1','низкий'),t,{size:92,col:st.stage.ink,out:card-.35});
        atext('Активное',500,330,card,t,{size:79,col:st.stage.ink});atext('шумоподавление',500,425,card+.12,t,{size:79,col:st.stage.ink});
        sub('Мир в кубе',520,card+.25,t,st,40);
        const p=P(t,Wd('o2','Подпишись'),.75);if(p>.003){g.save();g.globalAlpha=p;g.fillStyle='#FF453A';g.beginPath();g.roundRect(200,1165,600,100,50);g.fill();g.font=`600 42px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#FFFFFF';g.fillText('Подписаться на L³',500,1215);g.restore();}
      }
    },
    sfx(add){if(id==='cancel')add(Wd('c1','складываются'),'chime',.15,.8);if(id==='detect')add(Wd('d1','динамик'),'click',.12,.8);}
  });
}
