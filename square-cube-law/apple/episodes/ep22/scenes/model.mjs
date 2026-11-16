import { defineScene,makeStage,atext,P,Wd,THREE,MAT,lerp,eInOut } from '../../../engine.mjs';
import { frame } from './kit.mjs';
defineScene('model', {
  setup() {
    const stage=makeStage({bg:'white',shadow:.27});
    const geo=new THREE.BoxGeometry(.125,.035,.125),tiles=new THREE.InstancedMesh(geo,MAT.graphite(),365);
    tiles.castShadow=true;tiles.receiveShadow=true;
    stage.root.add(tiles);
    return {stage,tiles,matrix:new THREE.Matrix4(),q:new THREE.Quaternion(),v:new THREE.Vector3(),scale:new THREE.Vector3(),model:Wd('m1','модель'),uniform:Wd('m1','равновероятны'),real:Wd('m1','реальности')};
  },
  update(t,s,{stage,tiles,matrix,q,v,scale,uniform}) {
    const even=P(t,uniform-.3,1.3,eInOut);
    for(let i=0;i<365;i++) {
      const reveal=P(t,s.start+(i%19)*.025+Math.floor(i/19)*.014,.7,eInOut);
      v.set((i%19-9)*.16,lerp(.02+(i%7)*.027,.025,even)+(1-reveal)*.2,(Math.floor(i/19)-9.5)*.16);
      scale.setScalar(Math.max(.001,reveal));matrix.compose(v,q,scale);tiles.setMatrixAt(i,matrix);
    }
    tiles.instanceMatrix.needsUpdate=true;
    frame(stage.camera,[0,.05,0],lerp(17,15.7,P(t,s.start,s.end-s.start,eInOut)),lerp(10,-8,P(t,s.start,s.end-s.start)),66,520,919);
  },
  draw2d(t,s,{stage,model,uniform,real}) {
    atext('365 равных шансов',520,354,model,t,{size:88,col:stage.ink,out:real-.3});
    atext('Независимые даты',520,454,Wd('m1','независимы'),t,{size:49,w:500,col:stage.sub,out:real-.3});
    atext('Реальность сложнее',520,354,real,t,{size:86,col:stage.ink});
    atext('Результат для модели',520,454,real+.3,t,{size:49,w:500,col:stage.sub});
  },
  sfx(add,s) {add(s.start+.15,'swell',.19,.8);add(Wd('m1','равновероятны'),'chime',.18,.9);add(Wd('m1','реальности'),'tick',.14,.9);},
});
