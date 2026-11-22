// Standalone geometry, shared by scenes and the unrendered cover hero
export function makeHeadphone(THREE) {
  const object = new THREE.Group();
  const ceramic = new THREE.MeshStandardMaterial({color:'#D4D4D2',roughness:.32,metalness:.18});
  const cushion = new THREE.MeshStandardMaterial({color:'#262628',roughness:.85});
  const metal = new THREE.MeshStandardMaterial({color:'#A0A2A6',roughness:.3,metalness:.55});
  const cups=[];
  for(const side of [-1,1]) {
    const cup=new THREE.Group();cup.position.set(side*.91,-.28,0);cup.rotation.y=side*-.22;
    const shell=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),ceramic);shell.scale.set(.62,.85,.28);shell.position.z=-.12;
    const pad=new THREE.Mesh(new THREE.TorusGeometry(.48,.12,10,40),cushion);pad.scale.set(1,1.4,1);pad.position.z=.11;
    const driver=new THREE.Mesh(new THREE.CircleGeometry(.43,36),cushion);driver.scale.y=1.4;driver.position.z=.19;
    const mic=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),cushion);mic.position.set(side*.48,-.15,.1);
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.65,12),metal);arm.position.set(side*.08,.82,-.05);
    cup.add(shell,pad,driver,mic,arm);object.add(cup);cups.push(cup);
  }
  const pts=[];for(let i=0;i<=48;i++){const a=Math.PI*i/48;pts.push(new THREE.Vector3(1.03*Math.cos(a),.38+1.36*Math.sin(a),-.07));}
  const band=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,.095,8,false),ceramic);
  object.add(band);return {object,cups,band};
}
