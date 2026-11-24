import {THREE,MAT,orbit,P,atext,g,FONT,accent,lerp,roundedBox} from '../../../engine.mjs';
export function studio(stage){stage.floor.visible=false;stage.lights.key.castShadow=false;stage.lights.key.position.set(2,5,7);stage.lights.hemi.intensity=.95;}
export function coin(radius=.5){
 const root=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.11,48),MAT.aluminium());body.rotation.x=Math.PI/2;root.add(body);
 const face=new THREE.Mesh(new THREE.CylinderGeometry(radius*.89,radius*.89,.015,48),MAT.graphite());face.rotation.x=Math.PI/2;face.position.z=.061;root.add(face);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*.94,.017,8,48),MAT.aluminium());ring.position.z=.069;root.add(ring);
 const crest=new THREE.Group();crest.position.z=.083;root.add(crest);
 const head=new THREE.Mesh(new THREE.SphereGeometry(radius*.13,16,12),MAT.aluminium());head.scale.set(.8,1,.2);head.position.y=radius*.2;crest.add(head);
 const torso=new THREE.Mesh(new THREE.ConeGeometry(radius*.14,radius*.48,3),MAT.aluminium());torso.rotation.z=Math.PI;torso.position.y=-radius*.1;torso.scale.z=.2;crest.add(torso);
 for(const sign of [-1,1])for(let i=0;i<4;i++){const wing=new THREE.Mesh(new THREE.BoxGeometry(radius*(.46-i*.06),radius*.055,.018),MAT.aluminium());wing.position.set(sign*radius*.19,radius*(.13-i*.09),0);wing.rotation.z=sign*(.25+i*.12);crest.add(wing)}
 const reverse=new THREE.Mesh(new THREE.TorusGeometry(radius*.39,.032,8,32),MAT.aluminium());reverse.position.z=-.066;root.add(reverse);
 const reeding=new THREE.InstancedMesh(new THREE.BoxGeometry(.013,.052,.118),MAT.graphite(),48),tmp=new THREE.Object3D();
 for(let i=0;i<48;i++){const a=i/48*Math.PI*2;tmp.position.set(radius*Math.sin(a),radius*Math.cos(a),0);tmp.rotation.z=-a;tmp.updateMatrix();reeding.setMatrixAt(i,tmp.matrix)}root.add(reeding);
 return root;
}
export function camera(stage){orbit(stage.camera,[.12,.62,0],15,0,8)}
export function stacks(stage){const groups=[1,2,4].map((n,i)=>{const group=new THREE.Group();for(let j=0;j<n;j++){const c=coin(.33);c.rotation.x=-Math.PI/2+.18;c.position.y=j*.12;group.add(c)}stage.root.add(group);return group});return {groups,pose(p=1){groups.forEach((m,i)=>{m.position.set((i-1)*1.12,.28,0);m.rotation.set(0,0,0);m.scale.setScalar(Math.max(.001,p));m.visible=p>.001})}}}
export function bars(stage){const items=[0,1,2].map(i=>{const m=new THREE.Mesh(roundedBox(1,.04,2),MAT.aluminium());stage.root.add(m);return m});return{items,pose(t,a,morph=0){items.forEach((m,i)=>{const p=P(t,a+i*.16,.8),w=lerp(.8/2**i,.55,morph),h=lerp(.44*2**i,.55,morph);m.position.set((i-1)*1.12,-.3+h/2,0);m.rotation.set(0,-.12,0);m.scale.set(w,h*Math.max(.001,p),.22);m.visible=p>.001})}}}
export function txt(text,y,t0,t,st,size=80,extra={}){atext(text,500,y,t0,t,{size,col:st.stage.ink,...extra})}
export function pill(t,t0){const p=P(t,t0,.7);if(p<.003)return;g.save();g.globalAlpha=p;g.fillStyle=accent();g.beginPath();g.roundRect(230,1160,540,90,45);g.fill();g.font=`600 38px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.fillText('Подписаться на L³',500,1205);g.restore()}
