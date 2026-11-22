// ep28: physical unit cubes, retained interest layers, and an exact annual-credit comparison
import { defineScene, makeStage, orbit, project, atext, atextWords, line, P, Wd, E, THREE,
  roundedBox, clamp, lerp, eInOut, eStd, eApple, g, FONT } from '../../engine.mjs';

const STEP=.16, SIDE=.145;
const geo=roundedBox(SIDE,.009,1);
const white=()=>new THREE.MeshStandardMaterial({color:'#F2F2F0',roughness:.35,metalness:.08});
const grey=()=>new THREE.MeshStandardMaterial({color:'#818186',roughness:.32,metalness:.24});
const dark=()=>new THREE.MeshStandardMaterial({color:'#3A3A3C',roughness:.35,metalness:.18});
function stage(bg){const st=makeStage({bg});st.scene.remove(st.floor);st.lights.key.castShadow=false;return st;}
function camera(st,dist=10,az=20,el=18,target=[0,.6,0],sy=940){
 orbit(st.camera,target,dist,az,el);st.camera.setViewOffset(1080,1920,30,960-sy,1080,1920);st.camera.updateProjectionMatrix();
}
export function makeUnitStack(THREEArg=THREE,{amount=100,material=white(),max=250}={}){
 const root=new THREE.Group(),mesh=new THREE.InstancedMesh(geo,material,max),dummy=new THREE.Object3D();
 mesh.frustumCulled=false;root.add(mesh);
 const pose=(value,{x=0,y=0,z=0,scale=1,spread=0}={})=>{
  const n=Math.ceil(Math.max(0,value));mesh.count=n;root.position.set(x,y,z);root.scale.setScalar(scale);root.rotation.set(0,0,0);
  for(let i=0;i<n;i++){
   const layer=Math.floor(i/25),ix=i%5,iz=Math.floor(i/5)%5,f=clamp(value-i);
   dummy.position.set((ix-2)*(STEP+spread),layer*(STEP+spread)+SIDE*f/2,(iz-2)*(STEP+spread));
   dummy.rotation.set(0,0,0);dummy.scale.set(1,Math.max(.001,f),1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
 };
 pose(amount);return{root,mesh,pose};
}
function txt(st,text,x,y,at,t,size=64,o={}){atext(text,x,y,at,t,{size,col:st.ink,dy:22,...o});}
function sub(st,text,x,y,at,t,size=34,o={}){txt(st,text,x,y,at,t,size,{col:st.sub,w:500,track:0,...o});}
function stat(st,key,t,from){st.scene.userData.staticKey=t>=from?key:null;}

export function register(id){
if(id==='hook')defineScene(id,{
 setup(){const st=stage('black'),a=makeUnitStack(),b=makeUnitStack(undefined,{material:grey()});st.root.add(a.root,b.root);return{stage:st,a,b};},
 update(t,s,{stage:st,a,b}){
  const start=Wd('h1','Вклад'),twice=Wd('h1','двести'),show=P(t,twice,.9,eInOut),en=P(t,start,.9);
  a.pose(100,{x:-.48*show,y:-.08*(1-en),scale:.99,spread:.025*(1-en)});
  b.pose(100,{x:.48*show,y:0,scale:.99*show});b.root.visible=show>.002;
  camera(st,10.2,23,20,[0,.38,0],945);stat(st,'ep28-hook-complete',t,twice+.9);
 },
 draw2d(t,s,{stage:st}){
  const h=Wd('h1','Вклад'),d=Wd('h1','двести'),a=Wd('h2','примерно');
  txt(st,'Когда вклад удвоится?',510,330,h,t,66,{out:a-.1});
  txt(st,'100 → 200',510,485,d,t,112,{out:a-.1});
  sub(st,'12% годовых',510,1280,Wd('h1','двенадцать'),t,42);
  txt(st,'≈ 6',510,435,a,t,172,{col:st.accent});sub(st,'лет до удвоения',510,510,a+.15,t,38);
 },sfx(add){add(Wd('h1','Вклад'),'swell',.18,.7);add(Wd('h2','примерно'),'chime',.23,.8);}
});
if(id==='layers')defineScene(id,{
 setup(){const st=stage('white'),base=makeUnitStack(),one=makeUnitStack(undefined,{amount:12,material:grey()}),two=makeUnitStack(undefined,{amount:13.44,material:dark()});st.root.add(base.root,one.root,two.root);return{stage:st,base,one,two};},
 update(t,s,{stage:st,base,one,two}){
  const p=P(t,Wd('l1','проценты'),1.1,eInOut),q=P(t,Wd('l2','Новый'),1.2,eInOut);
  base.pose(100);one.pose(12,{y:lerp(1.28,.65,p)});one.root.visible=t>=Wd('l1','проценты');
  two.pose(13.44,{y:lerp(1.6,.82,q)});two.root.visible=t>=Wd('l2','Новый');
  camera(st,8.7,24,20,[0,.45,0],875);
  st.scene.userData.staticKey=t>=Wd('l2','Новый')+1.2?'ep28-layers-two':t>=Wd('l1','проценты')+1.1&&t<Wd('l2','Новый')?'ep28-layers-one':null;
 },
 draw2d(t,s,{stage:st}){
  const en=Wd('l1','рост'),mul=Wd('l2','умножается');
  txt(st,'Проценты на проценты',510,330,en,t,66);
  txt(st,'100 × 1,12ᵗ',510,475,mul,t,78);
  sub(st,'100',510,1210,en,t,52);
  const [x,y]=project(st.camera,.32,.7,.32),p=P(t,Wd('l1','проценты')+1.1,.5);
  line(x,y,790,790,st.sub,p,2);sub(st,'+12',810,770,Wd('l1','проценты')+1.1,t,46,{out:Wd('l2','Новый')-.1});
  sub(st,'+13,44',810,770,Wd('l2','Новый')+1.2,t,46);
  sub(st,'112 × 12%',510,1285,Wd('l2','тоже'),t,36);
 },sfx(add){add(Wd('l1','проценты')+1.1,'click',.13,.8);add(Wd('l2','Новый')+1.2,'click',.13,.85);}
});
if(id==='rule')defineScene(id,{
 setup(){const st=stage('black'),a=makeUnitStack(),b=makeUnitStack(undefined,{material:grey()});st.root.add(a.root,b.root);return{stage:st,a,b};},
 update(t,s,{stage:st,a,b}){const p=P(t,Wd('r1','Семьдесят'),1.1,eInOut);a.pose(100,{x:-.47,scale:.86,y:.2*(1-p)});b.pose(100,{x:.47,scale:.86,y:.2*(1-p)});camera(st,10.4,18,16,[0,.34,0],1010);stat(st,'ep28-rule',t,Wd('r1','Семьдесят')+1.1);},
 draw2d(t,s,{stage:st}){
  const a=Wd('r1','Семьдесят'),b=Wd('r1','шесть'),c=Wd('r1','оценка');
  sub(st,'Правило 72',510,320,a,t,44);
  txt(st,'72 / 12',510,475,a,t,130);
  txt(st,'≈ 6 лет',510,660,b,t,136,{col:st.accent});
  sub(st,'Удобная оценка',510,1280,c,t,40);
 },sfx(add){add(Wd('r1','шесть'),'bloom',.2,.7);}
});
if(id==='exact')defineScene(id,{
 setup(){const st=stage('white'),a=makeUnitStack(undefined,{material:grey()}),b=makeUnitStack();st.root.add(a.root,b.root);return{stage:st,a,b};},
 update(t,s,{stage:st,a,b}){
  const annual=Wd('e2','ежегодном'),p=P(t,annual,1.1,eInOut),q=P(t,Wd('e2','Двести'),1.2,eInOut);
  a.pose(lerp(100,197.3822685,p),{x:-.7,y:0,scale:1});b.pose(lerp(100,221.0681407,q),{x:.7,y:0,scale:1});
  a.root.visible=t>=annual;b.root.visible=t>=Wd('e2','Двести');camera(st,11.7,0,12,[0,.67,0],920);
  st.scene.userData.staticKey=t<annual?'ep28-exact-empty':t>=annual+1.1&&t<Wd('e2','Двести')?'ep28-exact-six':t>=Wd('e2','Двести')+1.2?'ep28-exact-seven':null;
 },
 draw2d(t,s,{stage:st}){
  const a=Wd('e1','Точная'),b=Wd('e2','ежегодном'),d=Wd('e2','Двести');
  txt(st,'Точный расчёт',510,330,a,t,76,{out:b-.15});
  txt(st,'1,12ᵗ = 2',510,540,a+.2,t,96,{out:b-.15});
  txt(st,'t = ln 2 / ln 1,12',510,710,a+.45,t,68,{out:b-.15});
  txt(st,'≈ 6,116 лет',510,900,Wd('e1','даёт'),t,104,{out:b-.15});
  sub(st,'Решение для плавной кривой',510,1050,Wd('e1','плавной'),t,36,{out:b-.15});
  txt(st,'Начисление раз в год',510,330,b,t,66);
  txt(st,'197,38',280,500,Wd('e2','семь'),t,82);sub(st,'6 лет',280,565,Wd('e2','шесть'),t,38);
  txt(st,'221,07',740,500,d,t,82);sub(st,'7 лет',740,565,Wd('e2','седьмого'),t,38);
  const [x0,y0]=project(st.camera,-1.08,1.28,0),[x1,y1]=project(st.camera,1.08,1.28,0),p=P(t,b,.8);
  line(x0,y0,x0+(x1-x0)*p,y1,st.sub,p,.0+2,[7,7]);
  sub(st,'200',510,y1-20,b+.2,t,34);
  sub(st,'Удвоение после 7-го начисления',510,1260,Wd('e2','седьмого'),t,33);
 },sfx(add){add(Wd('e1','даёт'),'chime',.17,.8);add(Wd('e2','Двести'),'click',.15,.8);}
});
if(id==='conditions')defineScene(id,{
 setup(){const st=stage('black'),a=makeUnitStack(undefined,{amount:200});st.root.add(a.root);return{stage:st,a};},
 update(t,s,{stage:st,a}){const p=P(t,Wd('c1','Здесь'),1.0,eInOut);a.pose(200,{x:-.75,scale:.74,spread:.04*(1-p)});camera(st,10.8,18,18,[-.1,.5,0],1000);stat(st,'ep28-conditions',t,Wd('c1','Здесь')+1.0);},
 draw2d(t,s,{stage:st}){
  txt(st,'Условия модели',510,335,Wd('c1','Здесь'),t,76);
  txt(st,'12% = const',510,485,Wd('c1','постоянна'),t,78);
  sub(st,'Без налогов',650,850,Wd('c1','налогов'),t,42);
  sub(st,'Без комиссий',650,925,Wd('c1','комиссий'),t,42);
  sub(st,'Без пополнений',650,1000,Wd('c1','пополнений'),t,42);
 }
});
if(id==='outro')defineScene(id,{
 setup(){const st=stage('black'),a=makeUnitStack(undefined,{amount:200});st.root.add(a.root);return{stage:st,a};},
 update(t,s,{stage:st,a}){const p=P(t,Wd('o2','Мир'),1,eInOut);a.pose(200,{scale:lerp(.8,.58,p)});camera(st,9.2,24,17,[0,.48,0],915);stat(st,'ep28-outro-card',t,Wd('o2','Мир')+1);},
 draw2d(t,s,{stage:st}){
  const a=Wd('o1','прикинуть'),b=Wd('o2','Мир'),press=Wd('o2','разбор');
  txt(st,'Прикинуть время',510,355,a,t,82,{out:b-.1});sub(st,'Не выбор вклада',510,470,Wd('o1','выбрать'),t,44,{out:b-.1});
  atextWords('Правило 72',510,335,b,t,{size:88,col:st.ink});sub(st,'T ≈ 72 / ставка в %',510,445,b+.15,t,44);
  sub(st,'Мир в кубе',510,590,b,t,38);
  const p=P(t,Wd('o2','Подпишись'),.8),dn=P(t,press,.14,eStd),up=P(t,press+.14,.6,eApple);
  if(p>.003){g.save();g.globalAlpha=p;g.translate(510,1200+(1-p)*30);g.scale((1-.055*dn+.055*up)*lerp(1.04,1,p),(1-.055*dn+.055*up)*lerp(1.04,1,p));g.fillStyle=st.accent;g.beginPath();g.roundRect(-300,-56,600,112,56);g.fill();g.font=`600 44px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.letterSpacing='-.4px';g.fillStyle='#FFF';g.fillText('Подписаться на L³',0,2);g.restore();}
 },sfx(add){add(Wd('o2','Подпишись'),'click',.17,.8);}
});
}
