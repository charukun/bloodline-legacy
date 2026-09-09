/* KayKit-based sentinels. Snapshot consumer only: clocks, wounds, hitstop and
 * gameplay roots belong to Simulation. No attack/AI/save rule is changed here. */
const EnemySentinel=(()=>{
 let asset=null;
 const clamp01=x=>Math.max(0,Math.min(1,x));
 function slerp(a,b,u){let d=a.reduce((s,v,i)=>s+v*b[i],0),sign=d<0?-1:1;d=Math.abs(d);let x=1-u,y=u;if(d<.9995){const ang=Math.acos(Math.min(1,d)),sn=Math.sin(ang);x=Math.sin((1-u)*ang)/sn;y=Math.sin(u*ang)/sn;}const q=a.map((v,i)=>v*x+b[i]*y*sign),l=Math.hypot(...q);return q.map(v=>v/(l||1));}
 function trs(t,q,s){const[x,y,z,w]=q;return new Float32Array([(1-2*y*y-2*z*z)*s[0],(2*x*y+2*z*w)*s[0],(2*x*z-2*y*w)*s[0],0,(2*x*y-2*z*w)*s[1],(1-2*x*x-2*z*z)*s[1],(2*y*z+2*x*w)*s[1],0,(2*x*z+2*y*w)*s[2],(2*y*z-2*x*w)*s[2],(1-2*x*x-2*y*y)*s[2],0,...t,1]);}
 function load(encoded){
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),dv=new DataView(bytes.buffer),fail=s=>{throw Error('Enemy asset: '+s);};
  if(bytes.length<28||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==bytes.length||dv.getUint32(16,true)!==0x4e4f534a)fail('invalid GLB');
  const jl=dv.getUint32(12,true),bo=jl+28;if(jl%4||bo>bytes.length||dv.getUint32(jl+24,true)!==0x004e4942||bo+dv.getUint32(jl+20,true)!==bytes.length)fail('binary bounds');
  const g=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+jl)));
  if(g.extras?.bloodlineEnemy!==1||g.meshes?.length!==1||g.skins?.[0]?.joints.length!==23||g.nodes?.length>32||g.buffers?.some(b=>b.uri)||g.images?.length||g.extensionsRequired?.length)fail('unsupported schema');
  const types={5126:Float32Array,5123:Uint16Array},sizes={SCALAR:1,VEC3:3,VEC4:4,MAT4:16};
  function access(i){const a=g.accessors?.[i],v=g.bufferViews?.[a?.bufferView],T=types[a?.componentType],n=sizes[a?.type];if(!a||!v||!T||!n||a.sparse||a.normalized||v.byteStride||v.buffer!==0||!Number.isInteger(a.count)||a.count<1)fail('unsupported accessor');const o=v.byteOffset||0,ao=a.byteOffset||0,len=a.count*n*T.BYTES_PER_ELEMENT;if(o<0||ao<0||o+v.byteLength>g.buffers[0].byteLength||ao+len>v.byteLength||bo+o+ao+len>bytes.length)fail('accessor bounds');const arr=new T(bytes.buffer.slice(bo+o+ao,bo+o+ao+len));if(!arr.every(Number.isFinite))fail('non-finite accessor');return arr;}
  const p=g.meshes[0].primitives[0],attrs=Object.fromEntries(Object.entries(p.attributes).map(([k,v])=>[k,access(v)])),indices=access(p.indices),count=attrs.POSITION.length/3;
  const fields={POSITION:3,NORMAL:3,COLOR_0:4,JOINTS_0:4,WEIGHTS_0:4,_REGION:1,_SURFACE:1};for(const[k,n]of Object.entries(fields))if(attrs[k]?.length!==count*n)fail('attribute size');
  if(count>10000||indices.length%3||indices.some(x=>x>=count)||attrs.JOINTS_0.some(x=>x>=23))fail('mesh budget/index');
  for(let i=0;i<count;i++){let sum=0;for(let j=0;j<4;j++){const w=attrs.WEIGHTS_0[i*4+j];if(w<0||w>1)fail('skin weight');sum+=w;}if(Math.abs(sum-1)>.001)fail('skin sum');}
  const parent=g.nodes.map(()=>-1);g.nodes.forEach((n,i)=>{for(const c of n.children||[]){if(!Number.isInteger(c)||c<0||c>=g.nodes.length||parent[c]!==-1)fail('node hierarchy');parent[c]=i;}});
  for(let i=0;i<parent.length;i++){let n=i,steps=0;while(n!==-1){n=parent[n];if(++steps>parent.length)fail('node cycle');}}
  const clips={};for(const a of g.animations){const channels=a.channels.map(c=>{const s=a.samplers[c.sampler],times=access(s.input),values=access(s.output),size=c.target.path==='rotation'?4:3;if(!['translation','rotation','scale'].includes(c.target.path)||!g.nodes[c.target.node]||s.interpolation!=='LINEAR'||values.length!==times.length*size||times.some((x,i)=>x<0||i>0&&x<=times[i-1]))fail('animation');return {node:c.target.node,path:c.target.path,times,values,size};});clips[a.name]={channels,duration:Math.max(...channels.map(c=>c.times[c.times.length-1]))};}
  for(const name of ['idle','walk','run','chop','guard','hit','death','unarmed'])if(!clips[name])fail('missing '+name);
  const ibm=access(g.skins[0].inverseBindMatrices);if(ibm.length!==23*16)fail('bind palette');
  for(const n of [...g.skins[0].joints,...Object.values(g.extras.sockets)])if(!Number.isInteger(n)||!g.nodes[n])fail('socket/joint');
  const mirror=g.nodes.map((n,i)=>{const name=n.name?.replace(/\.(r|l)$/,(_,side)=>side==='r'?'.l':'.r');return Math.max(0,g.nodes.findIndex(x=>x.name===name));});
  asset={g,attrs,indices,clips,ibm,parent,mirror};return asset;
 }
 function sample(name,t){const a=asset,clip=a.clips[name],local=a.g.nodes.map(n=>({translation:n.translation||[0,0,0],rotation:n.rotation||[0,0,0,1],scale:n.scale||[1,1,1]}));t=Math.max(0,Math.min(t,clip.duration));
  for(const c of clip.channels){let i=0;while(i<c.times.length-2&&c.times[i+1]<t)i++;const j=Math.min(i+1,c.times.length-1),u=clamp01((t-c.times[i])/Math.max(.00001,c.times[j]-c.times[i])),v0=Array.from(c.values.subarray(i*c.size,(i+1)*c.size)),v1=Array.from(c.values.subarray(j*c.size,(j+1)*c.size));local[c.node][c.path]=c.path==='rotation'?slerp(v0,v1,u):v0.map((v,k)=>v+(v1[k]-v)*u);}
  // Imported root motion is presentation-only. The simulation supplies x/z.
  const root=a.g.nodes.findIndex(n=>n.name==='root');local[root].translation=[0,local[root].translation[1],0];
  // The source jab uses the right arm. Mirror its symmetric named hierarchy
  // for a lost-right-arm response: the surviving left hand/shield strikes.
  if(name==='unarmed')return a.mirror.map(i=>{const n=local[i],[x,y,z,w]=n.rotation;return{translation:[-n.translation[0],n.translation[1],n.translation[2]],rotation:[x,-y,-z,w],scale:n.scale};});
  return local;
 }
 const settings=p=>{const variant=typeof EnemyLooks==='undefined'?null:EnemyLooks.profile(p);if(variant)return {...variant,impact:.61};return p.kind==='elite'?{scale:[1.91,1.86,1.82],cloth:[.64,.29,.24],metal:[.87,.81,.69],stride:1.8,impact:.61}:{scale:[1.34,1.42,1.34],cloth:[.29,.48,.45],metal:[.68,.79,.78],stride:1.65,impact:.61};};
 function clock(p,t,phase=0){const c=settings(p),clip=p.wounds?.rightArm?.severity==='lost'?'unarmed':'chop',impact=clip==='chop'?c.impact:.50;
  if(p.alive===false)return{name:'death',time:Math.max(0,t-(p.deathAt??t)),key:'death'};
  if(p.hitReactUntil>t)return{name:'hit',time:clamp01((t-(p.hitReactAt||0))/Math.max(.01,p.hitReactUntil-(p.hitReactAt||0)))*asset.clips.hit.duration,key:'hit:'+p.hitReactAt};
  if(p.telegraph){const u=clamp01((t-p.telegraph.started)/Math.max(.001,p.telegraph.at-p.telegraph.started));return{name:clip,time:impact*u,key:'attack:'+p.telegraph.started};}
  if(p.action==='attack'&&p.actionUntil>t){const u=clamp01((t-p.actionStarted)/Math.max(.001,p.actionUntil-p.actionStarted));return{name:clip,time:impact+(asset.clips[clip].duration-impact)*u,key:'attack-recover'};}
  if(p.action==='run')return{name:'run',time:(phase%1)*asset.clips.run.duration,key:'run'};
  if(p.guard||p.action==='guard')return{name:'guard',time:asset.clips.guard.duration*.55,key:'guard'};
  const seed=String(p.id).split('').reduce((n,c)=>n+c.charCodeAt(0),0)%29;return{name:'idle',time:((t*.85+seed*.11)%asset.clips.idle.duration+asset.clips.idle.duration)%asset.clips.idle.duration,key:'idle'};
 }
 function pose(p,t,rec={}){const config=settings(p),motionT=p.renderPoseTime??t,dt=Math.max(0,Math.min(.1,motionT-(rec.time??motionT))),distance=Math.hypot(p.x-(rec.x??p.x),p.z-(rec.z??p.z));
  if(distance<1.5&&motionT>=(rec.time??motionT)&&p.action==='run')rec.phase=(rec.phase||0)+distance/config.stride;else if(distance>=1.5||motionT<(rec.time??motionT))rec.phase=0;
  const timing=clock(p,motionT,rec.phase||0),local=sample(timing.name,timing.time),critical=['death','hit','chop','unarmed'].includes(timing.name);
  if(rec.key!==timing.key){rec.from=rec.local;rec.transition=motionT;rec.key=timing.key;}
  const blend=critical||p.hitstopUntil>t?1:clamp01((motionT-(rec.transition??motionT))/.12);
  if(rec.from&&blend<1)for(let i=0;i<local.length;i++){for(const k of ['translation','scale'])local[i][k]=local[i][k].map((v,j)=>rec.from[i][k][j]+(v-rec.from[i][k][j])*blend);local[i].rotation=slerp(rec.from[i].rotation,local[i].rotation,blend);}
  const matrices=local.map(n=>trs(n.translation,n.rotation,n.scale)),world=[];if(config.swing&&timing.name==='chop'){const chest=asset.g.nodes.findIndex(n=>n.name==='chest'),u=timing.time/asset.clips.chop.duration;matrices[chest]=rMultiply(matrices[chest],rModel(0,0,0,1,1,1,Math.sin(u*Math.PI)*config.swing));}function node(i){if(world[i])return world[i];return world[i]=asset.parent[i]<0?matrices[i]:rMultiply(node(asset.parent[i]),matrices[i]);}for(let i=0;i<local.length;i++)node(i);
  const reaction=damagePose(rec.renderer||{},p,t),ail=ailmentPose(p,t),root=new Float32Array(rModel(p.x+reaction.x,.20+ail.y-reaction.drop,p.z+reaction.z,...config.scale,p.dir||0,ail.roll+reaction.roll,ail.pitch+reaction.pitch));
  const palette=new Float32Array(23*16);asset.g.skins[0].joints.forEach((n,i)=>palette.set(rMultiply(root,rMultiply(world[n],asset.ibm.subarray(i*16,(i+1)*16))),i*16));
  const sockets=Object.fromEntries(Object.entries(asset.g.extras.sockets).map(([k,i])=>[k,rMultiply(root,world[i])]));
  Object.assign(rec,{damage:EnemyDamage.state(p),time:motionT,x:p.x,z:p.z,local,world,palette,sockets,timing,config,root,dt});return rec;
 }
 const VS=`#version 300 es
 precision highp float;
 layout(location=0)in vec3 pos;layout(location=1)in vec3 nor;layout(location=2)in vec4 color;layout(location=3)in vec4 joints;layout(location=4)in vec4 weights;layout(location=5)in float region;layout(location=6)in float surface;
 uniform sampler2D enemyBones;uniform mat4 vp;uniform mat4 lightVP;uniform vec3 enemyCloth;uniform vec3 enemyMetal;uniform float enemyVariation;
 out vec3 vWorld;out vec3 vNormal;out vec4 vInk;out float vSurface;out vec4 vShadow;out vec3 vLocal;flat out int enemyRegion;
 mat4 bone(int j){return mat4(texelFetch(enemyBones,ivec2(0,j),0),texelFetch(enemyBones,ivec2(1,j),0),texelFetch(enemyBones,ivec2(2,j),0),texelFetch(enemyBones,ivec2(3,j),0));}
 void main(){mat4 m=bone(int(joints.x))*weights.x+bone(int(joints.y))*weights.y+bone(int(joints.z))*weights.z+bone(int(joints.w))*weights.w;vec4 w=m*vec4(pos,1.);vWorld=w.xyz;vNormal=normalize(mat3(m)*(nor/max(vec3(.00001),vec3(dot(m[0].xyz,m[0].xyz),dot(m[1].xyz,m[1].xyz),dot(m[2].xyz,m[2].xyz)))));vec3 c=pow(max(color.rgb,vec3(0.)),vec3(1./2.2));if(surface<.5)c=enemyCloth*(.62+dot(c,vec3(.333))*.70);if(surface>9.5&&surface<10.5)c*=enemyMetal;vInk=vec4(c*enemyVariation,1.);vSurface=surface;vLocal=pos;vShadow=lightVP*w;enemyRegion=int(region+.5);gl_Position=vp*w;}`;
 const loss=`flat in int enemyRegion;uniform vec4 enemyLoss;bool enemyHidden(){return(enemyRegion==1&&enemyLoss.x>.5)||(enemyRegion==2&&enemyLoss.y>.5)||(enemyRegion==3&&enemyLoss.z>.5)||(enemyRegion==4&&enemyLoss.w>.5);}`;
 const FS=RFRAG.replace('void main(){',loss+'\n'+EnemyDamage.GLSL+'\nvoid main(){if(enemyHidden())discard;').replace('vec3 pigment=vInk.rgb;','vec3 pigment=enemyPatina(vInk.rgb);');
 const DS='#version 300 es\nprecision highp float;'+loss+'\nvoid main(){if(enemyHidden())discard;}';
 class RendererAdapter{
  constructor(r){this.r=r;const gl=r.gl;this.program=r.programOf(VS,FS);this.depth=r.programOf(VS,DS);this.records=new Map();this.buffers=[];this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);
   [['POSITION',3],['NORMAL',3],['COLOR_0',4],['JOINTS_0',4],['WEIGHTS_0',4],['_REGION',1],['_SURFACE',1]].forEach(([key,n],i)=>{const b=gl.createBuffer();this.buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,asset.attrs[key],gl.STATIC_DRAW);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,key==='JOINTS_0'?gl.UNSIGNED_SHORT:gl.FLOAT,false,0,0);});const b=gl.createBuffer();this.buffers.push(b);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,asset.indices,gl.STATIC_DRAW);gl.bindVertexArray(null);
  }
  update(p,t){const gl=this.r.gl;this.prune();let rec=this.records.get(p.id);if(!rec){rec={renderer:this.r,texture:gl.createTexture()};this.records.set(p.id,rec);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,rec.texture);for(const name of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,name,gl.NEAREST);for(const name of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,name,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,4,23,0,gl.RGBA,gl.FLOAT,null);}
   pose(p,t,rec);rec.owner=p;rec.frame=this.r.frame;gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,rec.texture);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,4,23,gl.RGBA,gl.FLOAT,rec.palette);return rec;
  }
  prune(){for(const[k,v]of this.records)if(this.r.frame-v.frame>2){this.r.gl.deleteTexture(v.texture);this.records.delete(k);}}
  draw(shadow){this.prune();const r=this.r,gl=r.gl,p=shadow?this.depth:this.program;gl.useProgram(p);r.uniform(p,'vp',shadow?r.lightVP:r.vp);r.uniform(p,'lightVP',r.lightVP);r.uniform(p,'eye',r.eye);r.uniform(p,'focus',[r.camera.x,r.camera.z]);r.uniform(p,'time',r.currentTime);r.int(p,'shadows',r.quality!=='low'?1:0);if(!shadow)r.setupSurfaceUniforms({},p);
   for(const rec of this.records.values()){if(rec.frame!==r.frame||!r.visible(rModel(rec.owner.x,1.6,rec.owner.z,2.5,4,2.5),shadow?r.lightVP:r.vp,.3))continue;
    r.uniform(p,'enemyCloth',rec.config.cloth);r.uniform(p,'enemyMetal',rec.config.metal);r.uniform(p,'enemyVariation',variation(rec.owner));const damage=rec.damage;r.uniform(p,'enemyDamageBody',[damage.parts.torso.amount,damage.parts.head.amount,damage.wear]);gl.uniform4fv(gl.getUniformLocation(p,'enemyDamageLimbs'),['rightArm','leftArm','rightLeg','leftLeg'].map(k=>damage.parts[k].amount));gl.uniform4fv(gl.getUniformLocation(p,'enemyLoss'),['rightArm','leftArm','rightLeg','leftLeg'].map(k=>rec.owner.wounds?.[k]?.severity==='lost'?1:0));gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,rec.texture);r.int(p,'enemyBones',5);gl.bindVertexArray(this.vao);gl.drawElements(gl.TRIANGLES,asset.indices.length,gl.UNSIGNED_SHORT,0);r.stats.calls++;r.stats.triangles+=asset.indices.length/3;if(!shadow){r.stats.enemySentinels=(r.stats.enemySentinels||0)+1;r.stats.enemyAssetTriangles=asset.indices.length/3;}}
   gl.useProgram(shadow?r.depthProgram:r.program);
  }
  dispose(){const gl=this.r.gl;for(const rec of this.records.values())gl.deleteTexture(rec.texture);this.records.clear();this.buffers.forEach(b=>gl.deleteBuffer(b));gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);gl.deleteProgram(this.depth);}
 }
 const eligible=p=>p&&['soldier','elite'].includes(p.kind);
 const top=p=>settings(p).scale[1]*2.6;
 const variation=p=>.96+(String(p.id).split('').reduce((n,c)=>n+c.charCodeAt(0),0)%9)*.009;
 return {load,sample,pose,clock,settings,variation,RendererAdapter,eligible,top,VS,FS,DS,get asset(){return asset;}};
})();
const ENEMY_PREVIOUS_LOAD=AssetBank.load.bind(AssetBank);
AssetBank.load=async function(){await ENEMY_PREVIOUS_LOAD();EnemySentinel.load(VISUAL_ASSETS['enemies/sentinel.glb']);};
const ENEMY_PREVIOUS_MONSTER=VillageArt.prototype.monster;
VillageArt.prototype.monster=function(p,t){if(!EnemySentinel.asset||!EnemySentinel.eligible(p)||!this.r.rigs)return ENEMY_PREVIOUS_MONSTER.call(this,p,t);
 const r=this.r;if(!r.enemySentinels)r.enemySentinels=new EnemySentinel.RendererAdapter(r);const rec=r.enemySentinels.update(p,t),oldRoot=this.root,oldTarget=this.target;this.target=r.dynamic;
 // Original equipment has its own silhouette and remains attached during every clip.
 r.rigs.begin(p,t);try{this.sentinelEquipment(p,rec);this.sentinelScars(p,rec);}finally{
  // This skin has already blended its pose. A second rigid-part crossfade can
  // detach a hand-held item during hit/attack transitions.
  const gear=r.rigs.records.get(p.id);if(gear){gear.parts=null;gear.from=null;}
  if(r.rigs.pending.parts.length)r.rigs.end();else r.rigs.pending=null;this.root=oldRoot;this.target=oldTarget;
 }
 r.blob(p.x,p.z,p.kind==='elite'?.92:.63,p.kind==='elite'?.68:.46,.31,r.fxBatches);
};
const ENEMY_PREVIOUS_DRAW=RigRenderer.prototype.draw;
RigRenderer.prototype.draw=function(shadow=false){ENEMY_PREVIOUS_DRAW.call(this,shadow);this.r.enemySentinels?.draw(shadow);};
