/* Enemy-only presentation of existing hp / hpMax and actual limb loss.
 * No event counters, random calls, actor writes, new damage rules or textures. */
const EnemyDamage=(()=>{
 const parts=['head','torso','rightArm','leftArm','rightLeg','leftLeg'];
 const bounded=(value,max=1)=>Number.isFinite(value)?Math.max(0,Math.min(max,value)):0;
 function state(p){
  const health=Number.isFinite(p.hp)&&Number.isFinite(p.hpMax)&&p.hpMax>0?bounded(1-p.hp/p.hpMax):0;
  // Whole-body wear follows remaining vitality, independent of local hit
  // counts/severity. Only actual loss records control destroyed geometry.
  const regions={};
  for(const part of parts){
   regions[part]={amount:health,lost:p.wounds?.[part]?.severity==='lost',stage:health>=.70?3:health>=.40?2:health>0?1:0};
  }
  return {parts:regions,wear:health,health};
 }
 function style(p){
  const id=p.enemyForm||p.kind;
  if(p.kind==='wraith'&&id!=='dusk-bat')return {type:'spirit',dirt:'#536368',cut:'#34444d',edge:'#a7c2b2',inside:'#61797a',surface:4};
  if(p.kind==='crawler'||id==='stone-colossus'||id==='rime-guard')return {type:'shell',dirt:'#70654e',cut:'#403e36',edge:'#c2b591',inside:'#747567',surface:9};
  if(['soldier','elite'].includes(p.kind))return {type:'bone',dirt:'#73654f',cut:'#50443b',edge:'#c5b38b',inside:'#756550',surface:9};
  return {type:'organic',dirt:'#75654e',cut:'#694e43',edge:'#b99c79',inside:'#6a5144',surface:0};
 }
 function install(){
  if(RG_CACHE.has('enemy:stain'))return;
  const polygon=(name,points)=>{const P=[],N=[];for(let i=1;i<points.length-1;i++)for(const k of [0,i,i+1]){P.push(...points[k],0);N.push(0,0,1);}RG_CACHE.set(name,{positions:new Float32Array(P),normals:new Float32Array(N),count:P.length/3,radius:1.5});};
  polygon('enemy:stain',[[-.90,-.24],[-.57,-.76],[.02,-.69],[.52,-.83],[.91,-.21],[.72,.34],[.34,.86],[-.30,.69],[-.77,.39]]);
  polygon('enemy:split',[[-.20,-1.],[-.07,-.29],[-.30,.06],[.18,1.],[.04,.17],[.24,-.12]]);
  const P=[],N=[],segments=10;
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2,ra=i%3===0?1.13:1,rb=(i+1)%3===0?1.13:1;
   const vertices=[[Math.cos(a)*ra,Math.sin(a)*ra,0],[Math.cos(b)*rb,Math.sin(b)*rb,0],[Math.cos(b)*.66,Math.sin(b)*.66,.035],[Math.cos(a)*.66,Math.sin(a)*.66,.035]];
   for(const k of [0,1,2,0,2,3]){P.push(...vertices[k]);N.push(0,0,1);}
  }
  RG_CACHE.set('enemy:break-rim',{positions:new Float32Array(P),normals:new Float32Array(N),count:P.length/3,radius:1.2});
 }
 // A local tangent frame makes marks follow the actual bone/part rotation.
 function frame(matrix,point,normal=[0,0,1]){
  const length=Math.hypot(...normal)||1,n=normal.map(v=>v/length),ref=Math.abs(n[1])>.9?[0,0,1]:[0,1,0];
  let x=[ref[1]*n[2]-ref[2]*n[1],ref[2]*n[0]-ref[0]*n[2],ref[0]*n[1]-ref[1]*n[0]],l=Math.hypot(...x);x=x.map(v=>v/l);
  const y=[n[1]*x[2]-n[2]*x[1],n[2]*x[0]-n[0]*x[2],n[0]*x[1]-n[1]*x[0]];
  return rMultiply(matrix,new Float32Array([...x,0,...y,0,...n,0,...point,1]));
 }
 function anchor(a,rec,part,point,normal=[0,0,1],size=.14){
  rec.damageAnchors??={};rec.damageAnchors[part]={matrix:a.root,point,normal,size};
 }
 // Project once onto a shared mesh face, then follow its authored transform.
 // This avoids floating patches on curved shells/fur without new decal buffers.
 const surfaceCache=new Map();
 function onSurface(a,rec,part,type,transform,point,normal,size){
  const key=type+':'+point+':'+normal;let hit=surfaceCache.get(key);
  if(!hit){
   const g=rGeometry(type),P=g.positions,origin=point.map((v,i)=>v+normal[i]*3),dir=normal.map(v=>-v);
   const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
   let nearest=Infinity;
   for(let i=0;i<P.length;i+=9){
    const v=Array.from(P.subarray(i,i+3)),e1=sub(Array.from(P.subarray(i+3,i+6)),v),e2=sub(Array.from(P.subarray(i+6,i+9)),v),h=cross(dir,e2),det=dot(e1,h);if(Math.abs(det)<1e-7)continue;
    const from=sub(origin,v),u=dot(from,h)/det;if(u<0||u>1)continue;
    const q=cross(from,e1),b=dot(dir,q)/det;if(b<0||u+b>1)continue;
    const distance=dot(e2,q)/det;if(distance<=0||distance>=nearest)continue;
    nearest=distance;let n=cross(e1,e2),length=Math.hypot(...n);n=n.map(x=>x/length);if(dot(n,normal)<0)n=n.map(x=>-x);
    hit={point:origin.map((v,j)=>v+dir[j]*distance+n[j]*.006),normal:n};
   }
   if(!hit)hit={point,normal};surfaceCache.set(key,hit);
  }
  rec.damageAnchors??={};rec.damageAnchors[part]={matrix:rMultiply(a.root,transform),point:hit.point,normal:hit.normal,size};
 }
 function broken(a,rec,part,point,radius,normal=[0,-1,0]){
  rec.breaks??=[];rec.breaks.push({part,matrix:a.root,point,normal,size:radius});
 }
 function mark(a,p,part,at,s,material){
  const local=s.parts[part],dirt=s.wear;if(!local.amount&&dirt<.10)return;
  a.root=frame(at.matrix,at.point,at.normal);const size=at.size;
  // Opaque irregular islands, bounded at three per part; no transparency sorting.
  const count=a.r.quality==='low'?1:dirt>.55?3:1;
  if(dirt>=.10)for(let i=0;i<count;i++)a.p('enemy:stain',(i-1)*size*.36,((i%2)-.5)*size*.31,.004,
   size*(.42+dirt*.44),size*(.31+dirt*.40),1,material.dirt,0,(i-1)*.63,0,0);
  if(local.amount<=0||local.lost)return;
  const cuts=a.r.quality==='low'?1:local.stage;
  for(let i=0;i<cuts;i++){
   const onset=Math.min(1,local.amount/.22);
   const x=(i-(cuts-1)/2)*size*.48,angle=.38+(i%2)*.35,wide=size*(.21+local.amount*.23)*onset,long=size*(.57+local.amount*.43)*onset;
   if(local.stage>=2)a.p('enemy:split',x-size*.04,0,.008,wide*1.45,long*1.10,1,material.edge,0,angle,0,0);
   a.p('enemy:split',x,0,.011,wide,long,1,material.cut,0,angle,0,0);
   if(local.stage===3&&material.type==='spirit')a.p('enemy:split',x,0,.014,wide*.25,long*.80,1,material.edge,0,angle,0,4);
  }
 }
 function draw(a,p,rec){
  const s=state(p);rec.damage=s;if(s.wear<=0&&!rec.breaks?.length)return;
  install();const old=a.root,material=style(p);
  try{
   for(const[part,at]of Object.entries(rec.damageAnchors||{}))if(!s.parts[part].lost)mark(a,p,part,at,s,material);
   for(const at of rec.breaks||[]){
    a.root=frame(at.matrix,at.point,at.normal);
    a.p('enemy:stain',0,0,.002,at.size*.95,at.size*.95,1,material.inside,0,0,0,0);
    a.p('enemy:break-rim',0,0,.005,at.size,at.size,at.size,material.edge,0,.2,0,material.surface);
    if(material.type==='spirit')a.p('enemy:split',0,-at.size*.38,.011,at.size*.21,at.size*.87,1,material.edge,0,-.3,0,4);
   }
  }finally{a.root=old;}
 }
 function sentinel(a,p,rec){
  const asset=EnemySentinel.asset;if(!asset)return;
  rec.damageAnchors={};rec.breaks=[];
  const nodes=asset.g.nodes,joints=asset.g.skins[0].joints;
  const specs={head:['head',[.17,1.81,.396],.14],torso:['chest',[0,.86,.35],.20],rightArm:['lowerarm.r',[-.66,1.10,.115],.075],leftArm:['lowerarm.l',[.66,1.10,.115],.075],rightLeg:['lowerleg.r',[-.17,.25,.12],.085],leftLeg:['lowerleg.l',[.17,.25,.12],.085]};
  const old=a.root;
  try{
   for(const[part,[bone,point,size]]of Object.entries(specs)){
    const index=joints.findIndex(n=>nodes[n].name===bone);a.root=rec.palette.subarray(index*16,(index+1)*16);
    anchor(a,rec,part,point,[0,0,1],size);
   }
   for(const part of parts.filter(k=>k.endsWith('Arm')||k.endsWith('Leg')))if(p.wounds?.[part]?.severity==='lost'){
    const right=part.startsWith('right'),arm=part.endsWith('Arm'),bone=(arm?'upperarm':'upperleg')+(right?'.r':'.l');
    const index=nodes.findIndex(n=>n.name===bone);a.root=rMultiply(rec.root,rec.world[index]);
    broken(a,rec,part,[0,.022,0],arm?.11:.13,[0,1,0]);
   }
   draw(a,p,rec);
  }finally{a.root=old;}
 }
 function equipment(a,p,rec,render){
  const s=rec.damage||state(p),old=a.p;
  // Keep equipment socket reach unchanged. Lost shoulders lose their attached
  // armor; heavy wear tears cloth hems and chips decorative crests only.
  a.p=function(type,x,y,z,sx,sy,sz,color,ry=0,rz=0,rx=0,surface=0,alpha=1){
   const chest=this.root===rec.sockets.chest,head=this.root===rec.sockets.head;
   if(chest&&Math.abs(x)>.25&&y>-.18&&s.parts[x<0?'rightArm':'leftArm'].lost)return;
   if(chest&&surface===0&&z<-.20&&sy>.40&&s.wear>.40){const cut=sy*s.wear*(x<-.05?.34:x>.05?.16:.27);sy-=cut;y+=cut*.5;}
   if(head&&s.parts.head.amount>=.70&&['horn','cone'].includes(type)&&y>.90&&x<0){sy*=.62;}
   return old.call(this,type,x,y,z,sx,sy,sz,color,ry,rz,rx,surface,alpha);
  };
  try{return render();}finally{a.p=old;}
 }
 // Bind-space patina follows the skinned body; no world-space swimming or
 // vertex/fragment texture is added. GLES constants deliberately stay floats.
 const GLSL=`uniform vec4 enemyDamageLimbs;uniform vec3 enemyDamageBody;
 float enemyTrauma(){return enemyRegion==1?enemyDamageLimbs.x:enemyRegion==2?enemyDamageLimbs.y:enemyRegion==3?enemyDamageLimbs.z:enemyRegion==4?enemyDamageLimbs.w:vLocal.y>1.4?enemyDamageBody.y:enemyDamageBody.x;}
 vec3 enemyPatina(vec3 c){
  float injury=enemyTrauma(),wear=enemyDamageBody.z;
  if(wear<=0.&&injury<=0.)return c;
  vec3 q=vLocal*vec3(19.,13.,23.);
  float cloud=.5+.25*sin(q.x+q.y*.43)*sin(q.z-q.y*.27)+.18*sin(q.y*.57+q.z*.41);
  float grime=smoothstep(.58-wear*.22,.76-wear*.18,cloud)*wear;
  float stroke=1.-smoothstep(.015,.075,abs(sin(vLocal.y*43.+vLocal.x*17.+sin(vLocal.z*21.)*.7)));
  float fracture=stroke*smoothstep(.45,.82,cloud)*injury;
  c=mix(c,c*vec3(.68,.61,.48),grime*.53);
  c=mix(c,vec3(.35,.29,.22),fracture*.72);
  return c;
 }`;
 return {parts,state,style,install,frame,anchor,onSurface,broken,draw,sentinel,equipment,GLSL};
})();
