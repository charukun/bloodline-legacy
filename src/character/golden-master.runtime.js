/* CM01 Character Golden Master candidate — presentation only.
 * Loaded after the existing rig adapter. The build embeds the reviewed GLB asset.
 * No player/simulation/input/save/UI/environment property is written by this module.
 */
const CM01 = (()=>{
 const V={add:(a,b)=>a.map((x,i)=>x+b[i]),sub:(a,b)=>a.map((x,i)=>x-b[i]),mul:(a,s)=>a.map(x=>x*s),dot:(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const l=Math.hypot(...a);return l>1e-9?a.map(x=>x/l):[0,0,0];},lerp:(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t)};
 const Q={identity:()=>[0,0,0,1],mul:(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]],axis:(a,v)=>[a[0]*Math.sin(v/2),a[1]*Math.sin(v/2),a[2]*Math.sin(v/2),Math.cos(v/2)],inv:q=>[-q[0],-q[1],-q[2],q[3]]};
 Q.euler=(x=0,y=0,z=0)=>Q.mul(Q.mul(Q.axis([0,1,0],y),Q.axis([0,0,1],z)),Q.axis([1,0,0],x));
 Q.rotate=(q,v)=>{const t=V.mul(V.cross(q,v),2);return V.add(v,V.add(V.mul(t,q[3]),V.cross(q,t)));};
 Q.fromTo=(a,b)=>{a=V.norm(a);b=V.norm(b);const d=V.dot(a,b);if(d<-.9999){let axis=V.cross(a,[1,0,0]);if(Math.hypot(...axis)<.01)axis=V.cross(a,[0,0,1]);return Q.axis(V.norm(axis),Math.PI);}const c=V.cross(a,b),q=[...c,1+d],l=Math.hypot(...q);return q.map(x=>x/l);};
 Q.slerp=(a,b,t)=>{let dot=a.reduce((s,v,i)=>s+v*b[i],0);if(dot<0){b=b.map(v=>-v);dot=-dot;}if(dot>.9995){const c=a.map((v,i)=>v+(b[i]-v)*t),l=Math.hypot(...c);return c.map(v=>v/l);}const w=Math.acos(Math.min(1,dot)),s=Math.sin(w);return a.map((v,i)=>(v*Math.sin((1-t)*w)+b[i]*Math.sin(t*w))/s);};
 function matrix(pos,q,scale=[1,1,1]){const[x,y,z,w]=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;return new Float32Array([(1-yy-zz)*scale[0],(xy+wz)*scale[0],(xz-wy)*scale[0],0,(xy-wz)*scale[1],(1-xx-zz)*scale[1],(yz+wx)*scale[1],0,(xz+wy)*scale[2],(yz-wx)*scale[2],(1-xx-yy)*scale[2],0,...pos,1]);}
 function point(m,p){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];}
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 let asset=null;
 function readClips(g,access){
  const clips=new Map();
  for(const animation of g.animations||[]){
   if(!animation.name?.startsWith('cm01/'))continue;
   const tracks=animation.channels.map(channel=>{
    const sampler=animation.samplers[channel.sampler],path=channel.target.path,node=channel.target.node;
    if(!['rotation','translation'].includes(path)||!g.extras.boneNames[node]||!['LINEAR','STEP'].includes(sampler.interpolation||'LINEAR'))throw Error('CM01: unsupported motion channel');
    const times=access(sampler.input),values=access(sampler.output),width=path==='rotation'?4:3;
    if(times.length<1||values.length!==times.length*width||!times.every((v,i)=>Number.isFinite(v)&&(i===0||v>times[i-1]))||!values.every(Number.isFinite))throw Error('CM01: invalid motion sampler');
    if(path==='rotation')for(let i=0;i<values.length;i+=4)if(Math.abs(Math.hypot(...values.subarray(i,i+4))-1)>.001)throw Error('CM01: non-unit motion rotation');
    const parent=g.extras.parents[node],bind=g.extras.bindWorldPositions;
    const keys=Array.from(times,(_,i)=>Array.from(values.subarray(i*width,(i+1)*width),(v,k)=>path==='translation'?v-(bind[node][k]-(parent>=0?bind[parent][k]:0)):v));
    const constant=keys.every(key=>key.every((v,k)=>Math.abs(v-keys[0][k])<1e-7));
    return {node,path,times,keys,constant,step:sampler.interpolation==='STEP'};
   });
   const duration=Math.max(...tracks.map(track=>track.times.at(-1)));
   if(!Number.isFinite(duration)||duration<=0||clips.has(animation.name.slice(5)))throw Error('CM01: invalid motion duration/name');
   const {release,contact,follow}=animation.extras||{};if(![release,contact,follow].every(Number.isFinite)||contact>0&&!(0<=release&&release<contact&&contact<follow&&follow<=1))throw Error('CM01: invalid motion markers');
   clips.set(animation.name.slice(5),{tracks,duration,...animation.extras});
  }
  return clips;
 }
 function sampleClip(clip,u,q,offset){
  const time=clamp(u,0,1)*clip.duration;
  for(const {node,path,times,keys,constant,step}of clip.tracks){
   if(constant){if(path==='rotation')q[node]=keys[0];else offset[node]=keys[0];continue;}
   let lo=0,hi=times.length-1;
   while(lo+1<hi){const mid=(lo+hi)>>1;if(times[mid]<=time)lo=mid;else hi=mid;}
   const b=Math.min(lo+1,times.length-1),mix=step?0:clamp((time-times[lo])/Math.max(1e-7,times[b]-times[lo]),0,1);
   if(path==='rotation')q[node]=Q.slerp(keys[lo],keys[b],mix);
   else offset[node]=V.lerp(keys[lo],keys[b],mix);
  }
 }
 function selectClip(p,t,st,phase,moving,run,reaction){
  if(incapacitated(p)||p.traversal||p.rescueTarget||!asset.clips?.size||p.weapon!==0||!p.alive||p.seated||p.activity||p.guard||p.guardUntil>t||reaction.amount>.02||Object.keys(p.statuses||{}).length||Object.values(p.wounds||{}).some(w=>w.severity==='lost')||['carry','wave','sleep','sit','interact'].includes(p.action)){st.clipCut=null;return null;}
  const clock=SkillMotion.clock(p,t);
  if(clock){
   if(clock.shape!=='slash'||clock.hits!==1){st.clipCut=null;return null;}
   const name=['diagonal','horizontal','chop'][Math.max(0,(p.combo?.total||1)-1)%3],clip=asset.clips.get(name);if(!clip)return null;
   st.clipCut=name;
   // A Hermite time warp keeps a fast, continuous strike through the fixed .43 hit.
   const hermite=(a,b,ma,mb,u)=>{const u2=u*u,u3=u2*u;return (2*u3-3*u2+1)*a+(u3-2*u2+u)*ma+(-2*u3+3*u2)*b+(u3-u2)*mb;};
   const velocity=Math.min(3*(clip.contact-clip.release)/.43,3*(clip.follow-clip.contact)/.57)*.85;
   const u=clock.stage==='charge'?clip.release*smooth(clock.u):clock.beat<.43?hermite(clip.release,clip.contact,0,velocity*.43,clock.beat/.43):hermite(clip.contact,clip.follow,velocity*.57,0,(clock.beat-.43)/.57);
   return {name,clip,u,stage:clock.stage,entry:clock.stage==='charge'?smooth(clock.u/.3):1};
  }
  if(p.action==='recover'){if(!st.clipCut)return null;const clip=asset.clips.get(st.clipCut),u=smooth((t-p.actionStarted)/Math.max(.001,p.actionUntil-p.actionStarted));return {name:st.clipCut,clip,u:clip.follow+(1-clip.follow)*u,stage:'recover',entry:1};}
  if(!['idle','run','guardWalk','dash','recover'].includes(p.action)){st.clipCut=null;return null;}
  const name=moving?(run?'run':'walk'):'ready',clip=asset.clips.get(name);if(!clip)return null;
  return {name,clip,u:moving?((phase/TAU)%1+1)%1:(t/clip.duration)%1,stage:name,entry:1};
 }
 async function load(base64){const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),dv=new DataView(bytes.buffer);
  if(bytes.length<28||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==bytes.length||dv.getUint32(16,true)!==0x4e4f534a)throw new Error('CM01: invalid glTF 2.0 header');
  const jl=dv.getUint32(12,true),bo=28+jl;
  if(jl%4||bo>bytes.length||dv.getUint32(24+jl,true)!==0x004e4942||bo+dv.getUint32(20+jl,true)!==bytes.length)throw new Error('CM01: invalid binary chunk');
  const g=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+jl)));
  if(g.extras?.boneNames?.length!==31||g.extras?.parents?.length!==31||g.extras?.bindWorldPositions?.length!==31||g.meshes?.length!==2||g.images?.length!==3)throw new Error('CM01: unsupported character schema');
  const types={5126:Float32Array,5123:Uint16Array,5125:Uint32Array},sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
  for(const v of g.bufferViews){if(v.buffer!==0||!Number.isInteger(v.byteLength)||v.byteLength<0||(v.byteOffset||0)<0||bo+(v.byteOffset||0)+v.byteLength>bytes.length)throw new Error('CM01: buffer view bounds');}
  function access(i){const a=g.accessors[i],v=g.bufferViews[a?.bufferView],T=types[a?.componentType];if(!T||!v||v.byteStride||a.sparse||!sizes[a.type]||!Number.isInteger(a.count)||a.count<0)throw new Error('CM01: unsupported accessor');const offset=a.byteOffset||0,off=bo+(v.byteOffset||0)+offset,length=a.count*sizes[a.type];if(offset<0||offset+length*T.BYTES_PER_ELEMENT>v.byteLength)throw new Error('CM01: accessor bounds');return new T(bytes.buffer.slice(off,off+length*T.BYTES_PER_ELEMENT));}
  const images=await Promise.all(g.images.map(im=>new Promise((ok,fail)=>{const v=g.bufferViews[im.bufferView],blob=new Blob([bytes.subarray(bo+(v.byteOffset||0),bo+(v.byteOffset||0)+v.byteLength)],{type:im.mimeType}),url=URL.createObjectURL(blob),i=new Image();i.onload=()=>{URL.revokeObjectURL(url);ok(i);};i.onerror=()=>{URL.revokeObjectURL(url);fail(new Error('CM01: atlas decode failed'));};i.src=url;})));
  asset={g,images,bind:g.extras.bindWorldPositions,parents:g.extras.parents,names:g.extras.boneNames,clips:readClips(g,access),lods:g.meshes.map(m=>{const p=m.primitives[0];return {attrs:Object.fromEntries(Object.entries(p.attributes).map(([k,v])=>[k,access(v)])),indices:access(p.indices)};}),ibm:access(g.skins[0].inverseBindMatrices)};return asset;
 }
 const VS=`#version 300 es
 precision highp float;
 layout(location=0)in vec3 pos;layout(location=1)in vec3 nor;layout(location=2)in vec2 uv;layout(location=3)in vec4 color;
 layout(location=4)in vec4 joints;layout(location=5)in vec4 weights;layout(location=6)in float region;layout(location=7)in float surface;
 uniform sampler2D cmBones;uniform mat4 vp;uniform mat4 lightVP;
 out vec3 vWorld;out vec3 vNormal;out vec4 vInk;out float vSurface;out vec4 vShadow;out vec3 vLocal;out vec2 vUv;flat out int vRegion;
 mat4 bone(int j){return mat4(texelFetch(cmBones,ivec2(0,j),0),texelFetch(cmBones,ivec2(1,j),0),texelFetch(cmBones,ivec2(2,j),0),texelFetch(cmBones,ivec2(3,j),0));}
 void main(){mat4 m=bone(int(joints.x))*weights.x+bone(int(joints.y))*weights.y+bone(int(joints.z))*weights.z+bone(int(joints.w))*weights.w;vec4 w=m*vec4(pos,1.);vWorld=w.xyz;vNormal=normalize(mat3(m)*nor);vInk=color;vSurface=surface;vLocal=pos;vUv=uv;vRegion=int(region+.5);vShadow=lightVP*w;gl_Position=vp*w;}`;
 const regionHeader=`in vec2 vUv;flat in int vRegion;uniform vec4 cmLoss;uniform float cmArmor;
 bool hidden(){return (vRegion==2&&cmLoss.x>.5)||(vRegion==3&&cmLoss.y>.5)||(vRegion==4&&cmLoss.z>.5)||(vRegion==5&&cmLoss.w>.5)||(vRegion==10&&cmArmor<.5)||(vRegion==11&&(cmArmor<1.5||cmLoss.x>.5))||(vRegion==12&&(cmArmor<1.5||cmLoss.y>.5));}`;
 const FS=RFRAG.slice(0,RFRAG.indexOf('void main()'))+regionHeader+`
 uniform sampler2D cmBase;uniform sampler2D cmOrm;uniform sampler2D cmNormal;uniform vec3 cmHairTint;uniform float cmSilhouette;
 void main(){if(hidden())discard;vec2 uv=vUv;if(vRegion==10&&cmArmor<1.5)uv+=vec2(-.75,0.);vec3 pigment=texture(cmBase,uv).rgb*vInk.rgb;if(abs(vSurface-1.)<.1)pigment*=cmHairTint;
 vec3 ormSample=texture(cmOrm,uv).rgb;float rough=clamp(ormSample.g,.18,1.),metal=ormSample.b,ao=ormSample.r;vec3 N=normalize(vNormal),V=normalize(eye-vWorld),L=normalize(vec3(-.48,.85,.42));
 vec3 dp1=dFdx(vWorld),dp2=dFdy(vWorld);vec2 duv1=dFdx(uv),duv2=dFdy(uv);vec3 T=cross(dp2,N)*duv1.x+cross(N,dp1)*duv2.x;vec3 B=cross(dp2,N)*duv1.y+cross(N,dp1)*duv2.y;
 float denom=max(dot(T,T),dot(B,B));if(denom>1e-10){float inv=inversesqrt(denom);vec3 n=texture(cmNormal,uv).rgb*2.-1.;N=normalize(mat3(T*inv,B*inv,N)*normalize(vec3(n.xy*.30,n.z)));}
 bool skin=abs(vSurface)<.1;float wet=skin?0.:wetness*clamp(N.y*.65+.4,.1,1.);rough=mix(rough,max(.22,rough*.5),wet);pigment*=1.-wet*.12;
 vec3 base=lin(pigment);float shade=0.;if(shadows){vec3 s=vShadow.xyz/vShadow.w*.5+.5;if(all(greaterThan(s,vec3(0.)))&&all(lessThan(s,vec3(1.)))){float bias=max(.00055,.00105*(1.-dot(N,L)));shade=max(shadowValue(shadowTex,s,bias),shadowValue(dynamicShadow,s,bias));}}
 vec3 hemi=mix(groundColor,skyColor,clamp(N.y*.5+.5,0.,1.));vec3 lit=base*hemi*skyStrength*ao;lit+=brdf(base,N,V,L,rough,metal,sunColor*sunStrength*(1.-shade*.85));
 vec3 reflected=reflect(-V,N),f0=mix(vec3(.035),base,metal);lit+=mix(groundColor,skyColor,reflected.y*.5+.5)*f0*(1.-rough*.8)*skyStrength*.4;
 if(skin)lit+=base*vec3(.32,.17,.09)*pow(1.-max(0.,dot(N,V)),3.)*.17;
 lit+=localLight(localPos0,localColor0,base,N,V,rough,metal)+localLight(localPos1,localColor1,base,N,V,rough,metal)+localLight(localPos2,localColor2,base,N,V,rough,metal)+localLight(localPos3,localColor3,base,N,V,rough,metal);
 float fog=1.-exp(-length(vWorld.xz-focus)*fogDensity*(.45+.55*exp(-max(0.,vWorld.y)*.15)));fog*=smoothstep(8.,35.,length(vWorld.xz-focus));lit=mix(lit,lin(fogColor),min(.84,fog));if(cmSilhouette>.5)lit=vec3(.001);
 outColor=vec4(lit/(1.+lit),1.);outNormal=vec4(N*.5+.5,1.);}`;
 const DS=`#version 300 es\nprecision highp float;${regionHeader}\nvoid main(){if(hidden())discard;}`;
 const eligible=(p,local)=>!!(p&&local&&p.kind==='player'&&!p.prologue&&p.race===0&&p.gender===0&&p.age>=18&&p.age<35);
 class Character {
  constructor(r){this.r=r;const gl=r.gl;this.program=r.programOf(VS,FS);this.depth=r.programOf(VS,DS);this.lods=asset.lods.map(l=>{const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffers=[];const fields=[['POSITION',3],['NORMAL',3],['TEXCOORD_0',2],['COLOR_0',4],['JOINTS_0',4],['WEIGHTS_0',4],['_REGION',1],['_SURFACE',1]];fields.forEach(([key,n],i)=>{const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,l.attrs[key],gl.STATIC_DRAW);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,key==='JOINTS_0'?gl.UNSIGNED_SHORT:gl.FLOAT,false,0,0);});const index=gl.createBuffer();buffers.push(index);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,l.indices,gl.STATIC_DRAW);return {vao,buffers,count:l.indices.length,type:l.indices instanceof Uint16Array?gl.UNSIGNED_SHORT:gl.UNSIGNED_INT};});
   this.textures=asset.images.map(i=>{const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,i);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);return tx;});
   this.boneTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.boneTex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,4,asset.bind.length,0,gl.RGBA,gl.FLOAT,null);this.palette=new Float32Array(asset.bind.length*16);this.transforms=asset.bind.map(()=>rModel());this.globalQ=asset.bind.map(()=>Q.identity());this.lastFrame=-1;this.state=null;this.lod=0;this.silhouette=false;
  }
  groundAt(x,z){return SkillMotion.groundAt(this.r,x,z);}

  update(p,t){if(!eligible(p,true)){this.lastFrame=-1;return;}p=carriedVisualPose(p);const start=performance.now(),r=this.r;this.owner=p;this.lastFrame=r.frame;let st=this.state;
   const motionT=Number.isFinite(p.renderPoseTime)?p.renderPoseTime:t;
   if(!st||st.id!==p.id||t<st.t||t-st.t>.35||Math.hypot(p.x-st.x,p.z-st.z)>1.5){st=this.state={id:p.id,t,motionT,x:p.x,z:p.z,phase:0,speed:0,feet:[],lastQ:null};}
   // Simulation snapshots run at 30 Hz; extra render frames must not restart
   // the gait merely because no new authoritative movement sample arrived.
   // Rendered displacement uses its own sample time; combat poses still use t.
   const dt=Math.max(0,Math.min(.1,motionT-st.motionT)),dx=p.x-st.x,dz=p.z-st.z,d=Math.hypot(dx,dz),moving=['run','guardWalk','dash'].includes(p.action)&&(d>1e-7||dt===0&&st.moving),vel=dt>0?d/dt:st.speed;
   if(dt>0)st.speed+=( (moving?vel:0)-st.speed)*(1-Math.exp(-dt*18));
   const run=!!p.dash||st.speed>3.1,gaitWeight=clamp(st.speed/.65,0,1),stride=run?(p.dash?3.65:3.05):1.60;
   const duty=run?(p.dash?.285:.34):.62, gaitMode=run?'run':'walk';
   // A resting foot starts at mid-stance, not at the forward touchdown phase.
   // Otherwise the first stance demands almost a full stride behind the hip.
   // Keep planted world anchors when acceleration changes the gait. Recreating
   // feet at the current root teleports a support sole by one movement sample.
   if(moving&&!st.moving){st.phase=duty*.5+d/stride;for(const foot of st.feet)if(foot)foot.settle=null;}
   else if(moving)st.phase+=d/stride;
   st.moving=moving;st.gaitMode=gaitMode;
   const phase=st.phase*TAU,reaction=damagePose(r,p,t,st.feet),pose=damageArtPose(r,p,t,artPose(p,t,SkillMotion.stateFor(r,p,t))),ail=ailmentPose(p,t),guard=p.guard||p.guardUntil>t||p.autoFight;
   const fall=!p.alive?(p.wasDownedOnDeath?1:smooth((t-(p.deathAt??t))/1.12)):0;const sampledGround=p.traversal?Math.max(.10,p.supportHeight||0):this.groundAt(p.x,p.z);if(!Number.isFinite(st.ground))st.ground=sampledGround;st.ground+=(sampledGround-st.ground)*(1-Math.exp(-dt*14));const baseY=(p.baseY!=null?p.baseY:st.ground-.020)+(p.verticalOffset||0);
   const authored=selectClip(p,t,st,phase,moving,run,reaction);
   const rootQ=Q.euler((authored?0:pose.pitch)+reaction.pitch+ail.pitch+fall*1.48,(p.dir||0)+(authored?0:pose.yaw),(authored?0:pose.roll)+reaction.roll+ail.roll);
   const rootM=matrix([p.x+reaction.x+(authored?0:Math.cos(p.dir||0)*(pose.weightX||0)+Math.sin(p.dir||0)*(pose.weightZ||0)),baseY+(authored?0:pose.y)+ail.y-reaction.drop,p.z+reaction.z+(authored?0:-Math.sin(p.dir||0)*(pose.weightX||0)+Math.cos(p.dir||0)*(pose.weightZ||0))],rootQ);
   const q=asset.bind.map(()=>Q.identity()),offset=asset.bind.map(()=>[0,0,0]),scale=asset.bind.map(()=>[1,1,1]);
   const qi=(name,x=0,y=0,z=0)=>q[asset.names.indexOf(name)]=Q.euler(x,y,z);
   const sway=Math.sin(phase),breathe=Math.sin(t*1.8+1.1);
   if(!authored){
   offset[1]=[.011*Math.sin(t*.7)*(1-gaitWeight),-.030-gaitWeight*(run?.106:.072)+Math.cos(phase*2)*.016*gaitWeight,0];
   qi('pelvis',0,Math.sin(phase)*.055*gaitWeight+reaction.yaw*.3,.018*Math.sin(phase)*gaitWeight);
   qi('spine',pose.torso+reaction.torso*.65+(run?.10:.035)*gaitWeight+breathe*.007,(pose.torsoYaw||0)-sway*.068*gaitWeight+reaction.yaw*.7,reaction.torsoRoll*.5);
   qi('chest',reaction.torso*.35,-sway*.028*gaitWeight,.015*Math.sin(t*.9)*(1-gaitWeight)+reaction.torsoRoll*.5);
   qi('neck',-.02+pose.head*.3+reaction.head*.3+ail.head*.3,pose.skillMotion?(pose.headYaw||0):-(pose.torsoYaw||0)*.65+Math.sin(t*.41)*.023*(1-gaitWeight));
   qi('head',pose.head*.7+reaction.head*.7+ail.head*.7,-sway*.024*gaitWeight,Math.sin(t*.73)*.008+reaction.headRoll);
   }
   scale[3]=[1+breathe*.0025,1+breathe*.003,1+breathe*.005];
   const blinkU=(t+1.73)%4.73,blink=hasStatus(p,'sleep',t)||p.action==='sleep'?0.08:blinkU<.15?Math.max(.06,Math.abs(blinkU/.075-1)):1;scale[7]=[1,blink,1];scale[8]=[1,blink,1];
   if(!authored)for(const side of [1,-1]){const s=side===1?'R':'L',key=side===1?'rightArm':'leftArm';let ax=-.055-sway*side*(run?.61:.36)*gaitWeight+reaction[key]+ail.arm,az=-side*.13;
    if(pose.active){ax=pose[key]+reaction[key]+ail.arm;az=pose[key+'Z']-side*.10;}else if(guard){ax=-.66-sway*side*.10*gaitWeight;az=-side*.16;ax+=reaction[key];}
    az+=reaction[key+'Z'];
    if(p.action==='carry'){ax=-1.12;az=-side*.26;}if(p.action==='wave'&&side===1){ax=-2.3;az=.15+Math.sin(t*5)*.18;}
    qi('arm.'+s,ax,side*.025,az);qi('elbow.'+s,pose[side===1?'rightElbow':'leftElbow']??(-.18-(run?.32:0)*gaitWeight-(guard?.24:0)-Math.max(0,-ax-1)*.14),0,0);qi('hand.'+s,pose[side===1?'rightWrist':'leftWrist']??-.04,0,side*.035);qi('fingers.'+s,p.weapon>=0&&side===1?-.28:0);qi('thumb.'+s,0,0,p.weapon>=0&&side===1?-.20:0);
   }
   qi('hair',Math.sin(t*4)*.008+gaitWeight*Math.sin(phase-1)*.025,0,0);
   qi('mantle',-.04-gaitWeight*.16+Math.sin(t*2)*.015,Math.sin(phase-.5)*gaitWeight*.06,0);qi('mantle.tip',-.07+Math.sin(phase-1)*gaitWeight*.12,0,Math.sin(t*2.3)*.025);qi('coat.R',Math.sin(phase-.6)*gaitWeight*.06);qi('coat.L',-Math.sin(phase-.6)*gaitWeight*.06);
   // Rotational blending preserves orthonormal transforms, unlike matrix-entry lerp.
   if(authored){
    // A charge and its release share the same baked pose. Blend only entry,
    // never filter the contact frame or drive the weapon on another clock.
    if(st.clipName!==authored.name){st.clipFrom=st.lastQ?.map(v=>[...v]);st.clipFromOffset=st.lastOffset?.map(v=>[...v]);st.clipChanged=t;st.clipName=authored.name;}
    sampleClip(authored.clip,authored.u,q,offset);
    const entry=authored.stage==='charge'?authored.entry:['ready','walk','run'].includes(authored.stage)?smooth((t-st.clipChanged)/.14):1;
    if(st.clipFrom&&entry<1)for(let i=0;i<q.length;i++){q[i]=Q.slerp(st.clipFrom[i],q[i],entry);if(st.clipFromOffset)offset[i]=V.lerp(st.clipFromOffset[i],offset[i],entry);}
    this.clipDebug={name:authored.name,stage:authored.stage,u:authored.u,contact:authored.clip.contact};
   }else{st.clipName=null;for(const foot of st.feet)if(foot)foot.clipStep=null;this.clipDebug=null;}
   const amount=authored||pose.skillMotion||reaction.amount>.1||fall>0?1:1-Math.exp(-dt*22);
   if(st.lastQ)for(let i=1;i<q.length;i++)q[i]=Q.slerp(st.lastQ[i],q[i],amount);st.lastQ=q.map(v=>[...v]);
   st.lastOffset=offset.map(v=>[...v]);
   const localM=asset.bind.map(()=>rModel()),globalM=asset.bind.map(()=>rModel());
   for(let i=0;i<q.length;i++){const par=asset.parents[i],translation=V.add(V.sub(asset.bind[i],par>=0?asset.bind[par]:[0,0,0]),offset[i]);localM[i]=matrix(translation,q[i],scale[i]);globalM[i]=par>=0?rMultiply(globalM[par],localM[i]):localM[i];this.globalQ[i]=par>=0?Q.mul(this.globalQ[par],q[i]):q[i];}
   const gripping=authored?null:SkillMotion.grip(p,pose,{arm:globalM[9],elbow:globalM[10],hand:globalM[11]},{arm:globalM[14],elbow:globalM[15],hand:globalM[16]},-.075);
   this.skillGripDebug=gripping;
   if(gripping){
    for(const [start,chain]of [[9,gripping.right],[14,gripping.left]]){
     globalM[start]=chain.arm;globalM[start+1]=chain.elbow;globalM[start+2]=chain.hand;
     for(let i=start+3;i<=start+4;i++)globalM[i]=rMultiply(globalM[asset.parents[i]],localM[i]);
    }
   }
   const useGroundIK=!incapacitated(p)&&!p.traversal&&!p.seated&&!p.activity&&fall===0&&(pose.skillMotion||Math.abs(pose.y)<.22&&Math.abs(pose.rightLeg)<1.2&&Math.abs(pose.leftLeg)<1.2);
   if(pose.skillMotion&&!st.skillFeet)st.skillFeet=st.feet.map(f=>f?{anchor:[...f.anchor],yaw:f.yaw,t,motionT,rootX:p.x,rootZ:p.z,lift:0}:null);
   if(!pose.skillMotion)st.skillFeet=null;
   let contactError=0,contacts=0;this.footDebug=[];const targets=[];
   for(const side of [1,-1]){const si=side===1?0:1,s=side===1?'R':'L',ti=asset.names.indexOf('thigh.'+s),ki=ti+1,fi=ti+2,toi=ti+3;const facing=p.dir||0,cs=Math.cos(facing),sn=Math.sin(facing),toWorld=(x,z)=>[p.x+cs*x+sn*z,p.z-sn*x+cs*z];
    let foot=st.feet[si];if(!foot){foot=st.feet[si]={anchor:toWorld(side*.165,.025),swing:false,start:toWorld(side*.165,.025),target:toWorld(side*.165,.025),lift:0,yaw:facing,startPhase:0};}
    const normalized=((st.phase+(si?.5:0))%1+1)%1,isSwing=normalized>duty&&gaitWeight>.12;
    let desired=toWorld(side*.177,.025+(guard?side*.08:0));
    const bracing=useGroundIK&&!moving&&reaction.amount>0&&!pose.skillMotion;
    const footKey=side===1?'rightFoot':'leftFoot';
    if(authored){
     const baked=point(rootM,[globalM[fi][12],globalM[fi][13],globalM[fi][14]]),lift=Math.max(0,baked[1]-baseY-.125);
     const airborne=lift>.028,reach=Math.hypot(foot.anchor[0]-baked[0],foot.anchor[1]-baked[2]);
     // Keep world-space soles across charge/release and clip boundaries. A
     // collision or changed stance releases into a visible step, never a snap.
     if(!foot.clipStep&&!foot.swing&&(airborne||reach>.32))foot.clipStep={from:[...foot.anchor],started:motionT,lift:foot.lift};
     if(foot.clipStep&&p.hitstopUntil>t)foot.clipStep.started+=dt;
     if(foot.clipStep){const step=foot.clipStep,u=clamp((motionT-step.started)/.12,0,1);foot.anchor=V.lerp(step.from,[baked[0],baked[2]],smooth(u));foot.lift=Math.max(lift,step.lift*(1-u)+Math.sin(Math.PI*u)*.085);foot.swing=true;if(u===1){foot.clipStep=null;foot.swing=airborne;if(!airborne)foot.lift=0;}}
     else if(foot.swing){foot.anchor=[baked[0],baked[2]];foot.lift=airborne?lift:0;foot.swing=airborne;}
     else foot.lift=0;
     foot.yaw=facing+Math.atan2(globalM[fi][8],globalM[fi][10]);foot.settle=null;foot.damageAnchor=null;foot.damageKey=null;
    }else if(pose.skillMotion){
     foot.damageAnchor=null;foot.damageKey=null;
     /* Shared authored combat footwork is applied below. */
    }else if(bracing){
     damageFoot(p,reaction,side,foot);
    }else if(!moving){
     foot.damageAnchor=null;foot.damageKey=null;
     // Recover a stationary stance with an actual small step. Interpolating a
     // planted anchor on the floor makes both soles skate when motion stops.
     const turn=Math.atan2(Math.sin(facing-foot.yaw),Math.cos(facing-foot.yaw));
     const needsStep=Math.hypot(...V.sub(foot.anchor,desired))>(foot.damageSettled?.20:.045)||Math.abs(turn)>.22;
     if(!foot.settle&&(foot.swing||(needsStep&&!st.feet.some(f=>f?.settle))))foot.settle={from:[...foot.anchor],to:desired,yaw:foot.yaw,turn,lift:foot.lift,elapsed:0};
     if(foot.settle){const step=foot.settle;step.elapsed+=dt;const u=clamp(step.elapsed/.24,0,1);foot.anchor=V.lerp(step.from,step.to,smooth(u));foot.lift=step.lift*(1-u)+Math.sin(Math.PI*u)*.11;foot.yaw=step.yaw+step.turn*smooth(u);foot.swing=u<1;if(u>=1){foot.settle=null;foot.lift=0;}}
     else{foot.swing=false;foot.lift=0;}
    }else if(isSwing){
     foot.damageSettled=false;
     foot.damageAnchor=null;foot.damageKey=null;
     if(!foot.swing){foot.start=[...foot.anchor];foot.startPhase=normalized;foot.target=toWorld(side*.18,.025+stride*(1-normalized+duty*.5));foot.swing=true;}
     const predicted=toWorld(side*.18,.025+stride*(1-normalized+duty*.5));foot.target=V.lerp(foot.target,predicted,1-Math.exp(-dt*22));
     const u=clamp((normalized-foot.startPhase)/Math.max(.001,1-foot.startPhase),0,1);foot.anchor=V.lerp(foot.start,foot.target,smooth(u));foot.lift=Math.sin(Math.PI*u)*(run?.27:.17)*gaitWeight;foot.yaw=facing;
    }else{
     foot.damageAnchor=null;foot.damageKey=null;
     if(foot.swing){foot.anchor=[...foot.target];foot.swing=false;}foot.lift=0;
    }
    // A reversal can move the hip away before the scheduled toe-off. Release
    // that foot into a short recovery swing instead of pulling the pelvis down
    // toward an unreachable old anchor. Only an airborne foot is repositioned.
    const reach=Math.hypot(foot.anchor[0]-desired[0],foot.anchor[1]-desired[1]);
    if(!authored&&moving&&reach>.60){foot.swing=true;foot.lift=Math.max(foot.lift,.055);foot.anchor=desired.map((v,i)=>v+(foot.anchor[i]-v)*.60/reach);}
    if(!authored&&pose.skillMotion){const planted=SkillMotion.foot(p,pose,motionT,side,st.skillFeet);Object.assign(foot,planted,{target:[...planted.anchor],settle:null});}
    const floor=Math.max(this.groundAt(foot.anchor[0],foot.anchor[1]),this.groundAt(foot.anchor[0]+Math.sin(foot.yaw)*.15,foot.anchor[1]+Math.cos(foot.yaw)*.15));
    const worldAnkle=[foot.anchor[0],floor+.125+foot.lift,foot.anchor[1]];
    targets.push({side,si,s,ti,ki,fi,toi,foot,floor,worldAnkle});
   }
   // Fit the pelvis to BOTH planted feet before solving either chain. A stone under
   // the root must not lift a foot which is resting on the lower adjacent soil.
   let requiredDrop=0;
   if(useGroundIK){for(const {ti,worldAnkle}of targets){const target=Q.rotate(Q.inv(rootQ),V.sub(worldAnkle,[rootM[12],rootM[13],rootM[14]]));const H=point(globalM[1],V.sub(asset.bind[ti],asset.bind[1]));const xz=Math.hypot(target[0]-H[0],target[2]-H[2]);const vertical=Math.sqrt(Math.max(.01,1.014*1.014-xz*xz));requiredDrop=Math.max(requiredDrop,H[1]-target[1]-vertical);}
    st.pelvisDrop=Math.max(requiredDrop,(st.pelvisDrop||0)*Math.exp(-dt*14));
    for(let i=1;i<globalM.length;i++)globalM[i][13]-=st.pelvisDrop;
   }else st.pelvisDrop=0;
   for(const {side,si,s,ti,ki,fi,toi,foot,floor,worldAnkle}of targets){
    if(useGroundIK){const rootPos=[rootM[12],rootM[13],rootM[14]],target=Q.rotate(Q.inv(rootQ),V.sub(worldAnkle,rootPos));const H=point(globalM[1],V.sub(asset.bind[ti],asset.bind[1]));const L1=.505,L2=Math.hypot(.520,.025);const diff=V.sub(target,H),len=Math.hypot(...diff),dist=Math.min(L1+L2-.001,Math.max(.10,len)),D=V.norm(diff);const a=(L1*L1-L2*L2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,L1*L1-a*a));const authoredPole=authored?V.sub([globalM[ki][12],globalM[ki][13],globalM[ki][14]],H):[0,0,1];let pole=V.sub(authoredPole,V.mul(D,V.dot(authoredPole,D)));if(Math.hypot(...pole)<1e-6)pole=V.sub([0,0,1],V.mul(D,D[2]));pole=V.norm(pole);const K=V.add(H,V.add(V.mul(D,a),V.mul(pole,h))),F=V.add(H,V.mul(D,dist));
     const thighQ=Q.fromTo([0,-.505,0],V.sub(K,H)),shinQ=Q.fromTo([0,-.520,.025],V.sub(F,K)),flatQ=Q.mul(Q.inv(rootQ),Q.euler(0,foot.yaw,0));globalM[ti]=matrix(H,thighQ);globalM[ki]=matrix(K,shinQ);globalM[fi]=matrix(F,flatQ);globalM[toi]=rMultiply(globalM[fi],matrix(V.sub(asset.bind[toi],asset.bind[fi]),Q.identity()));
     const actual=point(rootM,F);if(!foot.swing&&moving){contactError=Math.max(contactError,Math.hypot(...V.sub(actual,worldAnkle)));contacts++;}this.footDebug.push({side,swing:foot.swing,floor,soleY:actual[1]-.125,target:worldAnkle,actual,error:Math.hypot(...V.sub(actual,worldAnkle))});
    }else{let leg=pose[side===1?'rightLeg':'leftLeg']+reaction[side===1?'rightLeg':'leftLeg'],knee=pose[side===1?'rightKnee':'leftKnee']+reaction[side===1?'rightKnee':'leftKnee']+ail.knee;
     globalM[ti]=rMultiply(globalM[1],matrix(V.sub(asset.bind[ti],asset.bind[1]),Q.euler(leg)));globalM[ki]=rMultiply(globalM[ti],matrix(V.sub(asset.bind[ki],asset.bind[ti]),Q.euler(knee)));globalM[fi]=rMultiply(globalM[ki],matrix(V.sub(asset.bind[fi],asset.bind[ki]),Q.euler(-.06)));globalM[toi]=rMultiply(globalM[fi],matrix(V.sub(asset.bind[toi],asset.bind[fi]),Q.identity()));st.feet[si]=null;
    }
   }
   for(let i=0;i<q.length;i++){this.transforms[i]=rMultiply(rootM,globalM[i]);const m=rMultiply(this.transforms[i],asset.ibm.subarray(i*16,i*16+16));this.palette.set(m,i*16);}
   st.x=p.x;st.z=p.z;st.t=t;st.motionT=motionT;const gl=r.gl;gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.boneTex);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,4,asset.bind.length,gl.RGBA,gl.FLOAT,this.palette);
   const px=3*r.canvas.height/Math.max(1,r.viewHeight||r.camera.zoom);if(this.lod===0&&px<100)this.lod=1;else if(this.lod===1&&px>120)this.lod=0;
   this.metrics={character:'CM01',lod:this.lod,triangles:this.lods[this.lod].count/3,solveMs:performance.now()-start,contactError,contacts,pelvisDrop:st.pelvisDrop,animation:reaction.amount>.1?'hit':p.action==='attack'||p.pendingSkill?'attack':guard?'combat_idle':gaitWeight>.15?(run?'run':'walk'):'idle',bones:31};
  }
  draw(shadow){const r=this.r,gl=r.gl;if(this.lastFrame!==r.frame)return;const p=shadow?this.depth:this.program;gl.useProgram(p);r.uniform(p,'vp',shadow?r.lightVP:r.vp);r.uniform(p,'lightVP',r.lightVP);r.uniform(p,'eye',r.eye);r.uniform(p,'focus',[r.camera.x,r.camera.z]);r.uniform(p,'time',r.currentTime);r.int(p,'shadows',r.quality!=='low'?1:0);
   if(!shadow){r.setupSurfaceUniforms({},p);['cmBase','cmOrm','cmNormal'].forEach((name,i)=>{gl.activeTexture(gl.TEXTURE7+i);gl.bindTexture(gl.TEXTURE_2D,this.textures[i]);r.int(p,name,7+i);});const hair=[[1,1,1],[1.45,1.42,1.29],[.77,.83,.89],[1.55,1.63,1.57],[1.14,.91,.91],[.69,.76,.81]][(this.owner.hair||0)%6];r.uniform(p,'cmHairTint',hair);r.uniform(p,'cmSilhouette',this.silhouette?1:0);}
   const loss=['rightArm','leftArm','rightLeg','leftLeg'].map(k=>this.owner.wounds?.[k]?.severity==='lost'?1:0);gl.uniform4fv(gl.getUniformLocation(p,'cmLoss'),loss);r.uniform(p,'cmArmor',this.owner.armor||0);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.boneTex);r.int(p,'cmBones',5);const lod=this.lods[this.lod];gl.bindVertexArray(lod.vao);gl.drawElements(gl.TRIANGLES,lod.count,lod.type,0);r.stats.calls++;r.stats.triangles+=lod.count/3;if(!shadow){r.stats.skinnedCharacters=(r.stats.skinnedCharacters||0)+1;r.stats.characterMaster={...this.metrics};}gl.useProgram(shadow?r.depthProgram:r.program);
  }
  dispose(){const gl=this.r.gl;for(const l of this.lods){gl.deleteVertexArray(l.vao);l.buffers.forEach(b=>gl.deleteBuffer(b));}this.textures.forEach(t=>gl.deleteTexture(t));gl.deleteTexture(this.boneTex);gl.deleteProgram(this.program);gl.deleteProgram(this.depth);}
 }
 return {load,Character,get asset(){return asset;},eligible};
})();
const CM01_PREVIOUS_LOAD=AssetBank.load.bind(AssetBank);
AssetBank.load=async function(){await CM01_PREVIOUS_LOAD();await CM01.load(VISUAL_ASSETS['character/young-human-male-cm01.glb']);};
const CM01_PREVIOUS_DOLL=VillageArt.prototype.doll;
VillageArt.prototype.doll=function(p,t,local){if(p.rescueTarget||incapacitated(p)||p.traversal)p={...p,weapon:-1,shield:false};if(!CM01.asset||!CM01.eligible(p,local)||!this.r.rigs)return CM01_PREVIOUS_DOLL.call(this,p,t,local);const r=this.r;if(!r.characterMaster)r.characterMaster=new CM01.Character(r);const cm=r.characterMaster;cm.update(p,t);
 const root=this.root,target=this.target;this.target=r.dynamic;
 // Keep the original equipment geometry and the existing tip/trail registration.
 r.rigs.begin(p,t);try{if(p.weapon>=0&&p.wounds?.rightArm?.severity!=='lost'){this.root=cm.transforms[11];this.with(rModel(0,-.075,.03,1,1,1,0,-.06,Math.PI-.12),()=>this.weapon(p.weapon,.84));}if(p.shield&&p.wounds?.leftArm?.severity!=='lost'){this.root=cm.transforms[16];this.shield(-.08,.06,.19,.94);}}finally{if(r.rigs.pending.parts.length)r.rigs.end();else r.rigs.pending=null;this.root=root;this.target=target;}
 r.blob(p.x,p.z,.55,.39,.32,r.fxBatches);if(local&&p.alive)r.add('ring:6.283',p.x,.23,p.z,.58,1,.58,'#f5e3b2',0,0,0,4,.62,r.fxBatches);
};
const CM01_PREVIOUS_DRAW=RigRenderer.prototype.draw;
RigRenderer.prototype.draw=function(shadow=false){CM01_PREVIOUS_DRAW.call(this,shadow);this.r.characterMaster?.draw(shadow);};
