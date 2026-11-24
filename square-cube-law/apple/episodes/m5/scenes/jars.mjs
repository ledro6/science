// Original m5 jar model; no engine dependency so the cover uses exactly the same objects
export function makeJar(THREE, {dark=false}={}) {
  const g=new THREE.Group();
  const glass=new THREE.MeshPhysicalMaterial({color:'#E0E1E4',roughness:.17,metalness:.05,clearcoat:.7,transparent:true,opacity:.28,depthWrite:false});
  const fill=new THREE.MeshStandardMaterial({color:dark?'#353538':'#58585D',roughness:.56});
  const paper=new THREE.MeshStandardMaterial({color:'#F1F1EE',roughness:.58});
  const metal=new THREE.MeshStandardMaterial({color:'#B9BBC0',roughness:.26,metalness:.6});
  const ink=new THREE.MeshStandardMaterial({color:'#28282B',roughness:.5});
  const profile=[[.21,.025],[.27,.04],[.29,.095],[.29,.60],[.28,.66],[.23,.72],[.23,.78]].map(([r,y])=>new THREE.Vector2(r,y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(profile,32),glass));
  const content=new THREE.Mesh(new THREE.CylinderGeometry(.264,.264,.54,32),fill);content.position.y=.33;g.add(content);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.272,.25,.045,32),glass);base.position.y=.03;g.add(base);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.253,.253,.11,32),metal);lid.position.y=.79;g.add(lid);
  const seam=new THREE.Mesh(new THREE.TorusGeometry(.25,.012,6,32),ink);seam.rotation.x=Math.PI/2;seam.position.y=.75;g.add(seam);
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.294,.294,.29,32,1,true,-1.15,2.3),paper);label.position.y=.37;g.add(label);
  for(let i=0;i<3;i++){const print=new THREE.Mesh(new THREE.CylinderGeometry(.296,.296,.012,22,1,true,-.55,.9-i*.12),ink);print.position.y=.42-i*.047;g.add(print)}
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  return g;
}
export function makeDisplay(THREE,n,{dark=false}={}) {
  const g=new THREE.Group(), jars=[], cols=n===24?6:3, rows=n===24?4:2;
  const mat=new THREE.MeshStandardMaterial({color:dark?'#242427':'#DDDEE1',roughness:.4,metalness:.2});
  const w=cols*.38+.13;
  for(let row=0;row<rows;row++){
    const shelf=new THREE.Mesh(new THREE.BoxGeometry(w,.07,.49),mat);shelf.position.set(0,.10+row*.64,-row*.11);g.add(shelf);
    for(let col=0;col<cols;col++){
      const jar=makeJar(THREE,{dark});jar.scale.setScalar(.64);jar.position.set((col-(cols-1)/2)*.38,.135+row*.64,-row*.11);g.add(jar);jars.push(jar);
    }
  }
  const plate=new THREE.Mesh(new THREE.BoxGeometry(w+.16,.12,.85),mat);plate.position.set(0,.02,-.1);g.add(plate);
  g.userData.jars=jars;return g;
}
