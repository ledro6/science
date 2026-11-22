import * as E from '../../../engine.mjs';
export const {THREE, MAT, P, Wd, C, atext, atextWords, line, project, lerp, clamp, FONT} = E;

const POS = [[0,0,0], ...Array.from({length:5},(_,i)=>{const a=(90+i*72)*Math.PI/180;return [1.12*Math.cos(a),1.12*Math.sin(a),.02];})];
export function stage(bg){
 const st=E.makeStage({bg});st.floor.visible=false;st.lights.key.castShadow=false;
 return st;
}
export function frame(st, dist=12.2, sy=850, az=10){
 E.orbit(st.camera,[0,0,0],dist,az,7);
 st.camera.setViewOffset(1080,1920,40,960-sy,1080,1920);st.camera.updateMatrixWorld();
}
export function meshNode(mat,r=.17){return new THREE.Mesh(new THREE.SphereGeometry(r,28,18),mat);}
export function network(st){
 const group=new THREE.Group();const white=MAT.ceramicWhite(),dark=MAT.graphite();
 const nodes=POS.map((p,i)=>{const m=meshNode(i?dark:white,i?.145:.23);m.position.fromArray(p);group.add(m);return m;});
 const links=POS.slice(1).map(p=>{
  const v=new THREE.Vector3(...p),c=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,v.length(),12,1),MAT.glass(.6));
  c.position.copy(v).multiplyScalar(.5);c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());group.add(c);return c;
 });st.root.add(group);return {group,nodes,links};
}
export function setNetwork(n,t,start,mode='star'){
 n.group.visible=true;n.group.rotation.set(0,0,0);n.group.scale.setScalar(1);n.group.position.set(0,0,0);
 n.nodes.forEach((m,i)=>{
  const p=P(t,start+i*.12,.7);m.visible=p>.001;m.scale.setScalar(Math.max(.001,p));
  const target=mode==='row'?[(i-2.5)*.4,0,0]:POS[i];m.position.fromArray(target);m.rotation.set(0,0,0);
 });n.links.forEach((m,i)=>{m.visible=mode==='star';m.material.opacity=.56*P(t,start+.3+i*.11,.7);});
}
export function degrees(n,st,t,t0,opacity=1,leafTime=t0){
 n.nodes.forEach((m,i)=>{const p=m.position.clone().applyMatrix4(n.group.matrixWorld);const [x,y]=project(st.camera,...p.toArray());atext(i?'1':'5',x,y-51,i?leafTime+(i-1)*.08:t0,t,{size:i?44:60,col:st.ink,a:opacity,dy:12});});
}
export function lists(st){
 const group=new THREE.Group(),cards=[],nodes=[];const mat=MAT.ceramicWhite();
 for(let i=0;i<5;i++){
  const card=new THREE.Group(),geo=new THREE.BoxGeometry(1.6,.35,.045);
  const panel=new THREE.Mesh(geo,MAT.glass(.11));const edges=E.glassEdges(geo,'#FFFFFF',.35);card.add(panel,edges);
  const n=meshNode(mat,.105);n.position.set(-.57,0,.10);card.add(n);card.position.set(.4,.7-i*.35,0);group.add(card);cards.push(card);nodes.push(n);
 }
 const original=meshNode(mat,.25);original.position.set(-1.05,0,.1);group.add(original);st.root.add(group);
 return {group,cards,nodes,original};
}
export function setLists(L,t,start){
 L.group.position.set(0,0,0);L.group.rotation.set(0,0,0);L.group.scale.setScalar(1);L.group.visible=true;
 L.original.visible=true;L.original.scale.setScalar(1);
 L.cards.forEach((c,i)=>{const p=P(t,start+i*.35,.65);c.visible=p>.001;c.position.set(.4+(1-p)*.3,.7-i*.35,0);c.scale.setScalar(Math.max(.001,p));c.rotation.set(0,0,0);});
}
export function listLabels(L,st,t,t0){
 L.cards.forEach((c,i)=>{const q=c.position.clone();const [x,y]=project(st.camera,q.x+.10,q.y,q.z+.08);atext('5 друзей',x,y+12,t0+i*.35,t,{size:34,col:st.ink,dy:8});});
 const [x,y]=project(st.camera,-1.05,0,.1);atext('один человек',x,y+103,t0-.3,t,{size:29,col:st.sub,dy:10});
}
export function entries(st){
 const g=new THREE.Group(),ms=[];const a=MAT.ceramicWhite(),b=MAT.graphite();
 for(let i=0;i<10;i++){const m=meshNode(i<5?a:b,.125);g.add(m);ms.push(m);}st.root.add(g);return {g,ms};
}
export function setEntries(e,t,t0,t1=t0+.9){
 e.g.visible=true;e.g.rotation.set(0,0,0);e.g.position.set(0,-.2,0);e.g.scale.setScalar(1);
 e.ms.forEach((m,i)=>{const p=P(t,i<5?t0+i*.12:t1+(i-5)*.12,.6);m.position.set(((i%5)-2)*.47,i<5?.35:-.5,0);m.visible=p>.001;m.scale.setScalar(Math.max(.001,p));m.rotation.set(0,0,0);});
}
export function entryLabels(e,st,t,t0,t1=t0+.9){
 e.ms.forEach((m,i)=>{const p=m.position.clone().add(e.g.position);const [x,y]=project(st.camera,...p.toArray());atext(i<5?'5':'1',x,y+68,i<5?t0+i*.12:t1+(i-5)*.12,t,{size:35,col:st.ink,dy:10});});
}
export function title(a,b,t,t0,st,options={}){atext(a,500,340,t0,t,{size:82,col:st.ink,...options});if(b)atext(b,500,433,t0+.13,t,{size:82,col:st.ink,...options});}
export function pill(t,t0,press){
 const g=E.g,p=P(t,t0,.8),down=P(t,press,.14,E.eStd),up=P(t,press+.14,.6);if(p<.001)return;
 g.save();g.globalAlpha=p;g.translate(500,1200+(1-p)*28);const k=1-.055*down+.055*up;g.scale(k,k);g.fillStyle='#FF453A';g.beginPath();g.roundRect(-300,-55,600,110,55);g.fill();g.font=`600 43px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#FFFFFF';g.fillText('Подписаться на L³',0,1);g.restore();
}
export {E};
