import {THREE, MAT, orbit, P, atext, g, FONT, accent, lerp} from '../../../engine.mjs';
import {rod} from '../../../models.mjs';
export function studio(stage){stage.floor.visible=false;stage.lights.key.castShadow=false;stage.lights.key.position.set(2,5,7);stage.lights.hemi.intensity=1;}
export function clock(){
 const root=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.64,.64,.19,48),MAT.aluminium());body.rotation.x=Math.PI/2;root.add(body);
 const face=new THREE.Mesh(new THREE.CylinderGeometry(.565,.565,.018,48),MAT.ceramicWhite());face.rotation.x=Math.PI/2;face.position.z=.107;root.add(face);
 const bezel=new THREE.Mesh(new THREE.TorusGeometry(.60,.035,8,48),MAT.graphite());bezel.position.z=.12;root.add(bezel);
 const ticks=new THREE.InstancedMesh(new THREE.BoxGeometry(.014,.053,.014),MAT.graphite(),60);const temp=new THREE.Object3D();
 for(let i=0;i<60;i++){const a=i/60*2*Math.PI;temp.position.set(.50*Math.sin(a),.50*Math.cos(a),.13);temp.rotation.set(0,0,-a);temp.scale.set(1,i%5===0?1:.45,1);temp.updateMatrix();ticks.setMatrixAt(i,temp.matrix)}root.add(ticks);
 const hand=new THREE.Group();const bar=new THREE.Mesh(new THREE.BoxGeometry(.025,.40,.02),MAT.graphite());bar.position.set(0,.17,.15);hand.add(bar);root.add(hand);
 const short=new THREE.Group();const h2=new THREE.Mesh(new THREE.BoxGeometry(.04,.25,.025),MAT.graphite());h2.position.set(0,.10,.17);short.add(h2);root.add(short);
 const pin=new THREE.Mesh(new THREE.SphereGeometry(.045,16,10),MAT.aluminium());pin.position.z=.19;root.add(pin);
 return {root,hand,short,pose(years){hand.rotation.set(0,0,-years/12*Math.PI*2);short.rotation.set(0,0,-years/144*Math.PI*2)}};
}
export function pair(stage){const earth=clock(),ship=clock();stage.root.add(earth.root,ship.root);return{earth,ship,pose(t,a=10,b=6,scale=1){earth.root.position.set(-.86,.8,0);ship.root.position.set(.86,.8,0);earth.root.rotation.set(0,.05,0);ship.root.rotation.set(0,-.05,0);earth.root.scale.setScalar(scale);ship.root.scale.setScalar(scale);earth.pose(a);ship.pose(b)}}}
export function pairCamera(stage){orbit(stage.camera,[.14,.4,0],16,0,7)}
export const A=[-.8,.4,0],B=[-.8,2.5,0],T=[.85,1.45,0];
export function diagram(stage){const root=new THREE.Group();stage.root.add(root);
 const earth=rod(MAT.aluminium(),.045,12),out=rod(MAT.ceramicWhite(),.06,12),back=rod(MAT.ceramicWhite(),.06,12);root.add(earth,out,back);
 const nodes=[A,B].map(p=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.11,24,16),MAT.graphite());m.position.fromArray(p);root.add(m);return m});
 const turn=new THREE.Mesh(new THREE.TorusGeometry(.13,.025,8,32),MAT.red());turn.position.fromArray(T);turn.position.z=.1;root.add(turn);
 const frames=[-1,1].map(sign=>{const pts=[[-.46,-.23,0],[.46,-.23,0],[.46,.23,0],[-.46,.23,0],[-.46,-.23,0]].map(p=>new THREE.Vector3(...p));const f=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#6E6E73',transparent:true,opacity:.85}));f.position.set(.15,sign<0?.98:1.92,-.07);f.rotation.z=sign*.57;root.add(f);return f});
 return{root,turn,frames,pose(p=1,showFrames=false){root.position.set(0,.261,0);root.rotation.set(0,0,0);root.scale.setScalar(.82);root.visible=true;const q=Math.max(.001,p);earth.set(A,A.map((x,i)=>lerp(x,B[i],q)));out.set(A,A.map((x,i)=>lerp(x,T[i],Math.min(1,q*2))));back.set(T,T.map((x,i)=>lerp(x,B[i],Math.max(.001,q*2-1))));nodes.forEach(m=>m.visible=p>.02);turn.visible=p>.5;turn.rotation.set(0,0,0);turn.scale.setScalar(1);frames.forEach(f=>f.visible=showFrames)}};
}
export function diagramCamera(stage){orbit(stage.camera,[.05,1.37,0],14,0,4)}
export function pill(t,t0){const p=P(t,t0,.7);if(p<.003)return;g.save();g.globalAlpha=p;const x=500,y=1210,w=540,h=90;g.fillStyle=accent();g.beginPath();g.roundRect(x-w/2,y-h/2,w,h,h/2);g.fill();g.font=`600 38px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.fillText('Подписаться на L³',x,y);g.restore()}
export function txt(text,y,t0,t,st,size=84,extra={}){atext(text,500,y,t0,t,{size,col:st.stage.ink,...extra})}
