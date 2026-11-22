import {THREE,makeStage,orbit,atext,g,P,eApple,lerp,clamp} from '../../../engine.mjs';
import {moonModel,earthModel} from './moon-model.mjs';
export const R=1.25, CY=.55;
export function stageFor(bg){const stage=makeStage({bg});stage.floor.visible=false;stage.lights.key.castShadow=false;stage.lights.rimL.intensity=1.4;stage.lights.rimR.intensity=1;stage.lights.hemi.intensity=bg==='white'?.85:.48;orbit(stage.camera,[.16,0,0],17,0,0);return stage;}
export function orbitSetup(bg){
 const stage=stageFor(bg),earth=earthModel(THREE),moon=moonModel(THREE,{accent:stage.accent});earth.scale.setScalar(.65);earth.position.set(0,CY,0);moon.group.scale.setScalar(.30);
 const pts=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;pts.push(new THREE.Vector3(R*Math.cos(a),CY+R*Math.sin(a),-.1))}
 const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:bg==='white'?'#B9B9BD':'#626266'}));stage.root.add(earth,moon.group,ring);
 return {stage,earth,moon,ring};
}
export function poseOrbit(st,theta,spin,mark=true){st.moon.group.position.set(R*Math.cos(theta),CY+R*Math.sin(theta),0);st.moon.group.rotation.set(0,0,spin);st.moon.mark.visible=mark;st.earth.rotation.set(0,0,0);}
export function header(t,t0,st,a,b='',out=null){atext(a,500,327,t0,t,{size:87,w:600,col:st.stage.ink,out});if(b)atext(b,500,418,t0+.12,t,{size:87,w:600,col:st.stage.ink,out});}
export function label(t,text,x,y,t0,st,opts={}){atext(text,x,y,t0,t,{size:36,w:500,col:st.stage.sub,dy:16,...opts});}
export function foot(t,t0,st){label(t,'Вид сверху · масштаб условный',500,1280,t0,st,{size:29});}
export function pill(t,t0,press){const p=P(t,t0,.8),dn=P(t,press,.14),up=P(t,press+.14,.6),k=(1-.055*dn+.055*up)*lerp(1.04,1,p);if(p<.003)return;g.save();g.globalAlpha=p;g.translate(500,1205+(1-p)*32);g.scale(k,k);g.fillStyle='#FF453A';g.beginPath();g.roundRect(-300,-56,600,112,56);g.fill();g.fillStyle='#FFFFFF';g.font='600 44px "Inter Display"';g.textAlign='center';g.textBaseline='middle';g.fillText('Подписаться на L³',0,2);g.restore();}
