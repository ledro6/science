import {
  THREE, MAT, defineScene, makeStage, atext, atextWords, line, project, P, Wd, C, lerp, eInOut,
} from '../../engine.mjs';
import { frame, pill } from '../ep18/scenes/kit.mjs';
import { makeMirror, makePerson, makeDepthArrow } from './mirror.mjs';

function studio(bg) {
  const stage = makeStage({ bg, shadow: .4 });
  const mirror = makeMirror(THREE, MAT, bg === 'black');
  stage.root.add(mirror);
  return stage;
}

function pose(stage, t, s, dist = 20, az = 38) {
  const q = P(t, s.start, s.end-s.start, eInOut);
  frame(stage.camera, [0,1.48,0], dist-.6*q, lerp(az+4,az-4,q), 13, 520, 890);
  stage.lights.key.position.set(3,8,6);
  stage.lights.rimL.intensity = stage.bg === 'black' ? 3.0 : 1.2;
}

function lineAcross(stage,y,z,time,t) {
  const A=project(stage.camera,-.86,y,z), B=project(stage.camera,.86,y,z);
  const p=P(t,time,.8,eInOut);
  line(A[0],A[1],lerp(A[0],B[0],p),lerp(A[1],B[1],p),stage.ink,p*.66,2,[5,8]);
}

defineScene('hook',{
  setup() {
    const stage=studio('black');
    const front=makePerson(THREE,MAT), image=makePerson(THREE,MAT,true);
    front.object.position.set(-.16,0,1.25);
    image.object.position.set(-.16,0,-1.25); image.object.scale.z=-1;
    stage.root.add(front.object,image.object);
    return { stage,front,image };
  },
  update(t,s,{stage,front,image}) {
    const up=P(t,Wd('h1','Подними')-.12,1.35,eInOut);
    front.arm.rotation.z=1.65*up; image.arm.rotation.z=1.65*up;
    pose(stage,t,s,20,42);
  },
  draw2d(t,s,{stage}) {
    atext('Зеркало меняет',520,350,Wd('h1','Кажется')-.1,t,{size:100,col:stage.ink});
    atext('лево и право?',520,465,Wd('h1','левую')-.1,t,{size:104,col:stage.ink});
  },
  sfx(add,s) {
    add(s.start+.12,'bloom',.25,.85);
    add(Wd('h1','Подними'),'whoosh',.2,.9);
    add(Wd('h1','левую'),'tick',.16,.95);
    add(C('h2'),'swell',.18,.7);
  },
});

defineScene('depth',{
  setup() {
    const stage=studio('white');
    const arrow=makeDepthArrow(THREE,MAT), image=makeDepthArrow(THREE,MAT,true);
    arrow.position.set(-.25,1.45,1.05);
    image.position.set(-.25,1.45,-1.05); image.scale.z=-1;
    const high=new THREE.Mesh(new THREE.SphereGeometry(.11,24,16),MAT.aluminium());
    high.position.set(.8,2.5,.8);
    const copy=high.clone(); copy.position.z=-.8;
    stage.root.add(arrow,image,high,copy);
    return {stage,arrow,image,high,copy};
  },
  update(t,s,{stage,arrow,image,high,copy}) {
    const move=.12*P(t,Wd('d1','перпендикулярное')-.2,1.2,eInOut);
    arrow.position.z=1.05-move; image.position.z=-arrow.position.z;
    const slide=.34*P(t,Wd('d2','справа')-.2,1,eInOut);
    high.position.x=.80+slide; copy.position.x=high.position.x;
    pose(stage,t,s,19.5,51);
  },
  draw2d(t,s,{stage}) {
    const swapped=Wd('d1','вперёд'), side=Wd('d2','сверху');
    atext('Вперёд и назад',520,354,swapped-.12,t,{size:99,col:stage.ink,out:side-.32});
    atext('Меняется глубина',520,447,Wd('d1','перпендикулярное'),t,{size:65,w:500,col:stage.sub,out:side-.32});
    atext('Верх остаётся верхом',520,354,side-.1,t,{size:76,col:stage.ink});
    atext('Сторона та же',520,447,Wd('d2','справа'),t,{size:65,w:500,col:stage.sub});
    lineAcross(stage,2.5,.8,side,t);
  },
  sfx(add,s) {
    add(s.start+.15,'swell',.2,.75);
    add(Wd('d1','вперёд'),'whoosh',.2,.88);
    add(Wd('d2','сверху'),'tick',.15,.94);
    add(Wd('d2','справа'),'click',.14,.94);
  },
});

defineScene('distance',{
  setup() {
    const stage=studio('black');
    const sphere=new THREE.Mesh(new THREE.SphereGeometry(.28,40,24),MAT.ceramicWhite());
    const image=new THREE.Mesh(sphere.geometry,MAT.graphite());
    sphere.position.set(.25,1.5,1.6); image.position.set(.25,1.5,-1.6);
    stage.root.add(sphere,image);
    return {stage,sphere,image};
  },
  update(t,s,{stage,sphere,image}) {
    const near=P(t,Wd('s1','Подвинем'),2.1,eInOut);
    sphere.position.z=lerp(1.6,.55,near); image.position.z=-sphere.position.z;
    pose(stage,t,s,21,43);
  },
  draw2d(t,s,{stage,sphere,image}) {
    const move=Wd('s1','Подвинем'), equal=Wd('s2','такое');
    atext('Равные расстояния',520,354,equal-.15,t,{size:90,col:stage.ink});
    atext('Изображение мнимое',520,451,Wd('s2','мнимое'),t,{size:59,w:500,col:stage.sub});
    const M=project(stage.camera,.25,1.5,0), A=project(stage.camera,...sphere.position.toArray()), B=project(stage.camera,...image.position.toArray());
    const alpha=P(t,move,.65);
    line(A[0],A[1]+70,M[0],M[1]+70,stage.ink,alpha*.75,2);
    line(M[0],M[1]+70,B[0],B[1]+70,stage.ink,alpha*.75,2,[5,7]);
    atext('d', (A[0]+M[0])/2,(A[1]+M[1])/2+112,move+.4,t,{size:43,col:stage.sub});
    atext('d', (B[0]+M[0])/2,(B[1]+M[1])/2+112,move+.6,t,{size:43,col:stage.sub});
  },
  sfx(add,s) {
    add(s.start+.1,'bloom',.2,.88);
    add(Wd('s1','Подвинем'),'whoosh',.19,.82);
    add(Wd('s2','такое'),'chime',.2,.95);
    add(Wd('s2','мнимое'),'tick',.14,.96);
  },
});

defineScene('person',{
  setup() {
    const stage=makeStage({bg:'white',shadow:.35});
    const real=makePerson(THREE,MAT), rotated=makePerson(THREE,MAT,true);
    real.object.position.x=-1.2; rotated.object.position.x=1.2;
    stage.root.add(real.object,rotated.object);
    return {stage,real,rotated};
  },
  update(t,s,{stage,real,rotated}) {
    real.arm.rotation.z=1.65; rotated.arm.rotation.z=1.65;
    const turn=P(t,Wd('p1','разворачиваем')-.1,1.55,eInOut);
    const reflect=P(t,Wd('p2','переворотом')-.2,1.2,eInOut);
    rotated.object.rotation.y=Math.PI*turn*(1-reflect);
    rotated.object.scale.z=lerp(1,-1,reflect);
    pose(stage,t,s,19.6,7);
  },
  draw2d(t,s,{stage}) {
    const contrast=C('p2');
    atext('Мысленный поворот',520,350,Wd('p1','мысленно'),t,{size:86,col:stage.ink,out:contrast-.35});
    atext('Отражение глубины',520,350,Wd('p2','переворотом')-.15,t,{size:85,col:stage.ink});
    atext('Поворот',290,1190,Wd('p1','повороте'),t,{size:43,w:500,col:stage.sub,out:contrast-.3});
    atext('≠',520,1190,Wd('p2','другим'),t,{size:63,col:stage.accent});
    atext('Отражение',755,1190,Wd('p2','преобразованием'),t,{size:43,w:500,col:stage.sub});
  },
  sfx(add,s) {
    add(s.start+.1,'swell',.2,.75);
    add(Wd('p1','разворачиваем'),'whoosh',.2,.88);
    add(Wd('p2','переворотом'),'chime',.2,.92);
  },
});

defineScene('outro',{
  setup() {
    const stage=studio('black');
    const arrow=makeDepthArrow(THREE,MAT), image=makeDepthArrow(THREE,MAT,true);
    arrow.position.set(-.25,1.4,1.05); image.position.set(-.25,1.4,-1.05); image.scale.z=-1;
    stage.root.add(arrow,image);
    return {stage,card:Wd('o2','Подпишись'),press:Wd('o2','природы')};
  },
  update(t,s,{stage,card}) {
    const p=P(t,card-.2,1,eInOut);
    pose(stage,t,s,lerp(19.5,24,p),40);
  },
  draw2d(t,s,{stage,card,press}) {
    atext('Проверь со стрелкой',520,350,Wd('o1','Попробуй'),t,{size:88,col:stage.ink,out:card-.4});
    atextWords('Секрет зеркала',520,350,card+.05,t,{size:100,col:stage.ink});
    atext('Меняется глубина',520,449,card+.3,t,{size:62,w:500,col:stage.sub});
    pill(t,card+.58,press);
  },
  sfx(add,s) {
    add(s.start+.1,'swell',.22,.73);
    add(Wd('o2','Подпишись')+.1,'thud',.2,.82);
    add(Wd('o2','природы'),'click',.43,.94);
  },
});
