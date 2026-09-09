/* The approved four travelers in the current game renderer.
 * Consumes snapshots only. Simulation, collision, clocks and saves remain authoritative.
 * Model vertices are authored once; only a small bone palette changes each frame. */
const Travelers = (()=>{
 const V={add:(a,b)=>a.map((x,i)=>x+b[i]),sub:(a,b)=>a.map((x,i)=>x-b[i]),mul:(a,s)=>a.map(x=>x*s),dot:(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const l=Math.hypot(...a);return l>1e-9?a.map(x=>x/l):[0,0,0];},lerp:(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t)};
 const Q={identity:()=>[0,0,0,1],mul:(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]],axis:(a,v)=>[a[0]*Math.sin(v/2),a[1]*Math.sin(v/2),a[2]*Math.sin(v/2),Math.cos(v/2)],inv:q=>[-q[0],-q[1],-q[2],q[3]]};
 Q.euler=(x=0,y=0,z=0)=>Q.mul(Q.mul(Q.axis([0,1,0],y),Q.axis([0,0,1],z)),Q.axis([1,0,0],x));
 Q.rotate=(q,v)=>{const t=V.mul(V.cross(q,v),2);return V.add(v,V.add(V.mul(t,q[3]),V.cross(q,t)));};
 Q.fromTo=(a,b)=>{a=V.norm(a);b=V.norm(b);const d=V.dot(a,b);if(d<-.9999){let axis=V.cross(a,[1,0,0]);if(Math.hypot(...axis)<.01)axis=V.cross(a,[0,0,1]);return Q.axis(V.norm(axis),Math.PI);}const c=V.cross(a,b),q=[...c,1+d],l=Math.hypot(...q);return q.map(x=>x/l);};
 Q.slerp=(a,b,t)=>{let dot=a.reduce((s,v,i)=>s+v*b[i],0);if(dot<0){b=b.map(v=>-v);dot=-dot;}if(dot>.9995){const c=a.map((v,i)=>v+(b[i]-v)*t),l=Math.hypot(...c);return c.map(v=>v/l);}const w=Math.acos(Math.min(1,dot)),s=Math.sin(w);return a.map((v,i)=>(v*Math.sin((1-t)*w)+b[i]*Math.sin(t*w))/s);};
 function matrix(pos,q,scale=[1,1,1]){const[x,y,z,w]=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;return new Float32Array([(1-yy-zz)*scale[0],(xy+wz)*scale[0],(xz-wy)*scale[0],0,(xy-wz)*scale[1],(1-xx-zz)*scale[1],(yz+wx)*scale[1],0,(xz+wy)*scale[2],(yz-wx)*scale[2],(1-xx-yy)*scale[2],0,...pos,1]);}
 function point(m,p){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];}
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const VS=`#version 300 es
 precision highp float;
 layout(location=0)in vec3 pos;layout(location=1)in vec3 nor;layout(location=2)in vec2 uv;layout(location=3)in vec4 color;
 layout(location=4)in vec4 joints;layout(location=5)in vec4 weights;layout(location=6)in float region;layout(location=7)in float surface;
 uniform sampler2D cmBones;uniform mat4 vp;uniform mat4 lightVP;
 out vec3 vWorld;out vec3 vNormal;out vec4 vInk;out float vSurface;out vec4 vShadow;out vec3 vLocal;out vec2 vUv;flat out int vRegion;
 mat4 bone(int j){return mat4(texelFetch(cmBones,ivec2(0,j),0),texelFetch(cmBones,ivec2(1,j),0),texelFetch(cmBones,ivec2(2,j),0),texelFetch(cmBones,ivec2(3,j),0));}
 ${TravelerExpression.glsl}
 ${TravelerAge.glsl}
 void main(){vec3 facePos=pos,faceNor=nor;travelerFace(facePos,faceNor,region);mat4 m=bone(int(joints.x))*weights.x+bone(int(joints.y))*weights.y+bone(int(joints.z))*weights.z+bone(int(joints.w))*weights.w;bool head=joints.x==2.;vec4 w=m*vec4(agePosition(facePos,head,region==13.),1.);vWorld=w.xyz;vNormal=normalize(mat3(m)*ageNormal(faceNor,facePos,head));vInk=color;vSurface=surface;vLocal=pos;vUv=uv;vRegion=int(region+.5);vShadow=lightVP*w;gl_Position=vp*w;}`;
 const regionHeader=`in vec2 vUv;flat in int vRegion;uniform vec4 cmLoss;uniform float cmArmor;uniform float cmBeard;uniform vec4 cmFace;
 bool hidden(){return ((vRegion==22||vRegion==23)&&cmFace.x<.3)||(vRegion==13&&cmBeard<.005)||(vRegion==2&&cmLoss.x>.5)||(vRegion==3&&cmLoss.y>.5)||(vRegion==4&&cmLoss.z>.5)||(vRegion==5&&cmLoss.w>.5)||(vRegion==10&&cmArmor<.5)||(vRegion==11&&(cmArmor<1.5||cmLoss.x>.5))||(vRegion==12&&(cmArmor<1.5||cmLoss.y>.5));}`;
 const FS=RFRAG.slice(0,RFRAG.indexOf('void main()'))+regionHeader+`
 uniform vec3 cmHairTint;uniform float cmSilhouette;uniform vec2 cmAgeColor;
 void main(){if(hidden())discard;vec3 pigment=vInk.rgb;
 if(abs(vSurface-1.)<.1)pigment=mix(pigment*cmHairTint,vec3(.82,.81,.76),cmAgeColor.x);
 if(abs(vSurface)<.1)pigment=mix(pigment,pigment*vec3(.98,.96,.96),cmAgeColor.y*.35);
 float rough=vSurface<.5?.73:vSurface<1.5?.70:vSurface<2.5?.90:vSurface<3.5?.73:.34;
 float metal=vSurface>5.5?.75:0.,ao=1.;
 if(vRegion==10){pigment=cmArmor>1.5?vec3(.64,.71,.70):vec3(.43,.27,.17);rough=cmArmor>1.5?.38:.74;metal=cmArmor>1.5?.70:0.;}
 vec3 N=normalize(vNormal),V=normalize(eye-vWorld),L=normalize(vec3(-.48,.85,.42));
 if(!gl_FrontFacing)N=-N;
 bool skin=abs(vSurface)<.1;float wet=skin?0.:wetness*clamp(N.y*.65+.4,.1,1.);rough=mix(rough,max(.22,rough*.5),wet);pigment*=1.-wet*.12;
 vec3 base=lin(pigment);float shade=0.;if(shadows){vec3 s=vShadow.xyz/vShadow.w*.5+.5;if(all(greaterThan(s,vec3(0.)))&&all(lessThan(s,vec3(1.)))){float bias=max(.00055,.00105*(1.-dot(N,L)));shade=max(shadowValue(shadowTex,s,bias),shadowValue(dynamicShadow,s,bias));}}
 vec3 hemi=mix(groundColor,skyColor,clamp(N.y*.5+.5,0.,1.));vec3 lit=base*hemi*skyStrength*ao;lit+=brdf(base,N,V,L,rough,metal,sunColor*sunStrength*(1.-shade*.85));
 vec3 reflected=reflect(-V,N),f0=mix(vec3(.035),base,metal);lit+=mix(groundColor,skyColor,reflected.y*.5+.5)*f0*(1.-rough*.8)*skyStrength*.4;
 if(skin)lit+=base*vec3(.32,.17,.09)*pow(1.-max(0.,dot(N,V)),3.)*.17;
 lit+=localLight(localPos0,localColor0,base,N,V,rough,metal)+localLight(localPos1,localColor1,base,N,V,rough,metal)+localLight(localPos2,localColor2,base,N,V,rough,metal)+localLight(localPos3,localColor3,base,N,V,rough,metal);
 float fog=1.-exp(-length(vWorld.xz-focus)*fogDensity*(.45+.55*exp(-max(0.,vWorld.y)*.15)));fog*=smoothstep(8.,35.,length(vWorld.xz-focus));lit=mix(lit,lin(fogColor),min(.84,fog));if(cmSilhouette>.5)lit=vec3(.001);
 outColor=vec4(lit/(1.+lit),1.);outNormal=vec4(N*.5+.5,1.);}`;
 const DS=`#version 300 es\nprecision highp float;${regionHeader}\nvoid main(){if(hidden())discard;}`;
 const names=['root','torso','head','arm.R','elbow.R','hand.R','arm.L','elbow.L','hand.L','thigh.R','knee.R','foot.R','thigh.L','knee.L','foot.L','cape','tail'];
 const parents=[-1,0,1,1,3,4,1,6,7,0,9,10,0,12,13,1,0];
 const eligible=(p,local)=>!!(p&&local&&p.kind==='player'&&Number.isFinite(p.age)&&p.age>=0&&[0,1,0,1][p.race]===p.gender);
 const modelCache=new Map();
 function prepare(race){
  if(modelCache.has(race))return modelCache.get(race);
  const id=TravelerModel.definitions[race].id,high=TravelerModel.create(id),cfg=high.definition,body=cfg.body,scale=1.50;
  const bp=(x,y,z)=>[x*body[0]*scale,y*body[1]*scale,z*body[2]*scale];
  const bind=[[0,0,0],bp(0,.60,0),high.data.pivots[1].map(v=>v*scale)];
  for(const side of [1,-1])bind.push(bp(side*.295,.88,0),bp(side*.385,.665,.006),bp(side*.414,.515,.020));
  for(const side of [1,-1])bind.push(bp(side*.16,.47,0),bp(side*.16,.28,0),bp(side*.16,.105,.006));
  bind.push(high.data.pivots[6].map(v=>v*scale));if(race===3)bind.push(high.data.pivots[7].map(v=>v*scale));
  function convert(d){
   const attrs={POSITION:new Float32Array(d.positions.map(v=>v*scale)),NORMAL:new Float32Array(d.normals),TEXCOORD_0:new Float32Array(d.joints.length*2),COLOR_0:new Float32Array(d.joints.length*4),JOINTS_0:new Uint16Array(d.joints.length*4),WEIGHTS_0:new Float32Array(d.joints.length*4),_REGION:new Float32Array(d.regions),_SURFACE:new Float32Array(d.joints.length)};
   for(let i=0;i<d.joints.length;i++){
    const j=d.joints[i],y=d.positions[i*3+1]/body[1],w=d.weights[i];let js=[0,1,0,0],ws=[1-smooth((y-.48)/.40),smooth((y-.48)/.40),0,0];
    if(j===1){js=[2,0,0,0];ws=[1,0,0,0];}
    if(j===2||j===3){const a=j===2?3:6,e=smooth((.75-y)/.15),h=smooth((.60-y)/.09);js=[a,a+1,a+2,0];ws=[1-e,e*(1-h),e*h,0];}
    if(j===4||j===5){const a=j===4?9:12,k=smooth((.34-y)/.10),f=smooth((.245-y)/.055);js=[0,a,a+1,a+2];ws=[1-w,w*(1-k),w*k*(1-f),w*k*f];}
    if(d.rigidFeet[i]){js=[j===4?11:14,0,0,0];ws=[1,0,0,0];}
    if(j===6){js=[15,0,0,0];ws=[1,0,0,0];}if(j===7){js=[16,0,0,0];ws=[1,0,0,0];}
    attrs.JOINTS_0.set(js,i*4);attrs.WEIGHTS_0.set(ws,i*4);attrs.COLOR_0.set([...d.colors.slice(i*3,i*3+3),1],i*4);
    attrs._SURFACE[i]=d.materials[i]<2?d.materials[i]:d.surfaces[i*2+1]>.5?6:d.surfaces[i*2]>.83?2:3;
   }
   return {attrs,indices:new Uint16Array(d.indices)};
  }
  const lods=[convert(high.data),convert(TravelerModel.create(id,1).data)],ibm=bind.map(p=>matrix(V.mul(p,-1),Q.identity())),hulls=bind.map(()=>[]);
  // Six extreme rest points per dominant bone, used only for non-standing poses.
  const d=lods[0].attrs;
  for(let bone=0;bone<bind.length;bone++)for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){let best=-Infinity,point=null;
   for(let i=0;i<d.POSITION.length/3;i++){let bi=0;for(let k=1;k<4;k++)if(d.WEIGHTS_0[i*4+k]>d.WEIGHTS_0[i*4+bi])bi=k;if(d.JOINTS_0[i*4+bi]!==bone)continue;const score=d.POSITION[i*3+axis]*sign;if(score>best){best=score;point=Array.from(d.POSITION.slice(i*3,i*3+3));}}
   if(point)hulls[bone].push(point);
  }
  const damageProfile={vertical:body[1]*.70,torso:clamp(body[2]/body[1],.85,1.1),lateral:clamp(body[0]/body[1],.85,1.15),head:.78};
  const asset={id,race,bind,ibm,lods,hulls,parents:parents.slice(0,bind.length),names:names.slice(0,bind.length),scale,body,damageProfile,clips:typeof TravelerClips==='undefined'?null:TravelerClips.prepare(race,bind.length)};
  if(modelCache.size>=2)modelCache.delete(modelCache.keys().next().value);modelCache.set(race,asset);return asset;
 }
 // Local choreography only: the simulation position and collision hull never
 // move here. The existing swept collision query clips a disposable visual root.
 const driveShapes=new Set(['slash','double','cross','thrust','dash','zigzag','slide','slam']);
 function clipDrive(p,r,delta){
  const snapshot=r.currentSnapshot,room=snapshot?.room;
  if(!room||(room.kind==='village'&&!r.traversalMap))return delta;
  const proxy={id:p.id,kind:p.kind,x:p.x,z:p.z,room:p.room,supportHeight:p.supportHeight||0,rescueTarget:p.rescueTarget};
  const query={collisionRadius:Simulation.prototype.collisionRadius,contactSpacing:Simulation.prototype.contactSpacing,bound:Simulation.prototype.bound,
   players:{values:()=>(snapshot.players||[]).filter(a=>a.id!==p.id)}};
  Simulation.prototype.moveAttackStep.call(query,proxy,{...room,map:r.traversalMap,actors:(snapshot.actors||[]).filter(a=>a.id!==p.id)},delta[0],delta[2]);
  return [proxy.x-p.x,delta[1],proxy.z-p.z];
 }
 function bodyDrive(p,r,pose,st,asset,t){
  const c=pose.motionClock,sk=c?.sk,prior=st.drive;
  const allowed=!incapacitated(p)&&!p.traversal&&!p.seated&&!p.activity&&!p.rescueTarget&&!pose.air&&
   !['leftLeg','rightLeg'].some(k=>p.wounds?.[k]?.severity==='lost')&&!hasStatus(p,'root',t)&&!(p.hitReactUntil>t);
  const active=allowed&&c&&driveShapes.has(c.shape)&&!sk.ranged&&!sk.magic&&!sk.retreat;
  if(!active){
   if(allowed&&c?.stage==='charge'&&prior){
    prior.handoff??={from:[...prior.value]};prior.value=V.mul(prior.handoff.from,1-smooth(c.u/SkillMotion.phrasing(p,c).entryEnd));prior.stage='handoff';prior.u=c.u;return prior;
   }
   if(allowed&&p.action==='recover'&&prior){
    prior.recovery??={from:[...prior.value]};const u=smooth((t-p.actionStarted)/Math.max(.001,p.actionUntil-p.actionStarted));
    prior.value=V.mul(prior.recovery.from,1-u);prior.stage='recover';prior.u=u;return prior;
   }
   st.drive=null;return null;
  }
  const key=sk.id+':'+(p.combo?.total||0),fresh=!prior||prior.key!==key||(c.stage==='charge'&&prior.stage!=='charge');
  if(fresh){
   const lead=prior?-prior.lead:1;
   st.drive={key,lead,from:prior?[...prior.value]:[0,0,0],value:prior?[...prior.value]:[0,0,0],stage:c.stage,u:0};
  }
  const d=st.drive,phrase=SkillMotion.phrasing(p,c),heavy=c.shape==='slam',thrust=['thrust','dash','zigzag','slide'].includes(c.shape);
  const scale=asset.body[1]*clamp(injuryModifiers(p).move,.35,1),side=d.lead;
  // A counter-shift loads the rear leg. The hand still reaches its original
  // contact key at .43; the pelvis travels into it, then settles off centre.
  const load=[side*(thrust?.045:.10)*scale,-(heavy?.14:.085)*scale,-(heavy?.20:thrust?.29:.24)*scale];
  const follow=[-side*(thrust?.025:.095)*scale,-(heavy?.09:.025)*scale,(thrust?.11:.055)*scale];
  const finish=[-side*.055*scale,-.025*scale,.025*scale],cs=Math.cos(p.dir||0),sn=Math.sin(p.dir||0);
  const world=v=>[cs*v[0]+sn*v[2],v[1],-sn*v[0]+cs*v[2]];
  let local;
  if(c.stage==='charge')local=V.lerp(d.from,world(load),smooth(c.u/phrase.chargeEnd));
  else local=world(load.map((v,i)=>SkillMotion.curve(v,0,follow[i],(c.index+1<c.hits?load:finish)[i],c.beat,c.index>0?0:Math.max(0,phrase.start-.045),phrase.follow,c.index+1<c.hits?1:phrase.settleAt)));
  d.value=clipDrive(p,r,local);d.stage=c.stage;d.u=c.stage==='charge'?c.u:c.beat;d.index=c.index;d.phrase=phrase;d.scale=scale;d.recovery=null;
  return d;
 }
 function driveFoot(p,d,foot,side,width){
  const rear=side!==d.lead,u=d.u,phase=d.stage,cs=Math.cos(p.dir||0),sn=Math.sin(p.dir||0);
  let start,end,z,tag;
  if(phase==='recover'){start=rear?0:.48;end=rear?.44:1;z=(p.autoFight?side*.045:0);tag='recover';}
  else if(phase==='charge'&&rear){start=.30;end=.99;z=-.24*d.scale;tag='load';}
  else if(phase==='attack'&&!rear){start=Math.max(0,d.phrase.start-.09);end=.42;z=.23*d.scale;tag='plant';}
  // Transfer onto the planted lead at contact. Holding the rear sole until
  // late follow-through over-spreads short legs as the authored hips rotate.
  else if(phase==='attack'&&rear){start=.43;end=.79;z=-.10*d.scale;tag='gather';}
  if(!tag||u<start){foot.swing=false;foot.lift=0;return;}
  const key=d.key+':'+d.index+':'+tag,progress=clamp((u-start)/(end-start),0,1);
  if(foot.driveKey!==key){foot.driveKey=key;foot.driveStep={from:[...foot.anchor],yaw:foot.yaw};}
  const step=foot.driveStep;if(!step)return;
  const x=side*(width+.025*d.scale),target=[p.x+cs*x+sn*z,p.z-sn*x+cs*z],amount=smooth(progress);
  foot.anchor=V.lerp(step.from,target,amount);foot.lift=Math.sin(Math.PI*progress)*.105*d.scale;foot.swing=progress<1;
  const yaw=p.dir||0,turn=Math.atan2(Math.sin(yaw-step.yaw),Math.cos(yaw-step.yaw));foot.yaw=step.yaw+turn*amount;
  if(progress===1){foot.driveStep=null;foot.lift=0;}
 }
 class Character {
  constructor(r,race=0){
   this.r=r;this.asset=prepare(race);const gl=r.gl;this.program=r.programOf(VS,FS);this.depth=r.programOf(VS,DS);
   this.lods=this.asset.lods.map(l=>{const vao=gl.createVertexArray(),buffers=[];gl.bindVertexArray(vao);for(const [i,[key,n]]of [['POSITION',3],['NORMAL',3],['TEXCOORD_0',2],['COLOR_0',4],['JOINTS_0',4],['WEIGHTS_0',4],['_REGION',1],['_SURFACE',1]].entries()){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,l.attrs[key],gl.STATIC_DRAW);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,key==='JOINTS_0'?gl.UNSIGNED_SHORT:gl.FLOAT,false,0,0);}const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,l.indices,gl.STATIC_DRAW);return{vao,buffers,count:l.indices.length,type:gl.UNSIGNED_SHORT};});
   this.boneTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.boneTex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,4,this.asset.bind.length,0,gl.RGBA,gl.FLOAT,null);
   this.restAsset=this.asset;this.ageKey=null;
   this.palette=new Float32Array(this.asset.bind.length*16);this.transforms=this.asset.bind.map(()=>rModel());this.state=null;this.lod=0;this.lastFrame=-1;this.footDebug=[];
  }
  setAge(p,t){
   const profile=TravelerAge.sample(p,t),key=profile.visual;
   this.ageProfile=profile;
   if(this.ageKey===key)return;
   const rest=this.restAsset,bind=rest.bind.map((v,i)=>TravelerAge.point(v,i===2,profile,rest));
   this.asset={...rest,bind,ibm:bind.map(v=>matrix(V.mul(v,-1),Q.identity())),body:[rest.body[0]*profile.body[2],rest.body[1]*profile.body[0],rest.body[2]*profile.body[3]]};
   // Hulls contain rest points; deform with the same rule as the shader.
   this.asset.hulls=rest.hulls.map((h,i)=>h.map(v=>TravelerAge.point(v,i===2,profile,rest)));
   this.ageKey=key;
  }
  groundAt(x,z){return SkillMotion.groundAt(this.r,x,z);}
  update(source,t){
   if(!eligible(source,true)||source.race!==this.asset.race){this.lastFrame=-1;return;}
   const start=performance.now();this.setAge(source,t);
   const p=carriedVisualPose(source),r=this.r,asset=this.asset;this.owner=p;this.lastFrame=r.frame;
   const motionT=Number.isFinite(p.renderPoseTime)?p.renderPoseTime:t;
   let st=this.state;if(!st||st.id!==p.id||st.room!==p.room||t<st.t||t-st.t>.35||Math.hypot(p.x-st.x,p.z-st.z)>1.5)st=this.state={id:p.id,room:p.room,t,motionT,x:p.x,z:p.z,phase:0,speed:0,feet:[],pelvisDrop:0};
   const dt=clamp(motionT-st.motionT,0,.1),distance=Math.hypot(p.x-st.x,p.z-st.z),moving=['run','guardWalk','dash'].includes(p.action)&&(distance>1e-7||dt===0&&st.moving);
   if(dt>0)st.speed+=((moving?distance/dt:0)-st.speed)*(1-Math.exp(-dt*18));
   st.expression=TravelerExpression.update(p,motionT,dt,st.expression);this.expression=st.expression;
   const run=!!p.dash||st.speed>3.1,gaitWeight=clamp(st.speed/.6,0,1),stride=(run?(p.dash?1.70:1.38):1.04)*asset.body[1],duty=run?.46:.60;
   if(moving&&!st.moving){st.phase=duty*.5+distance/stride;for(const f of st.feet)if(f)f.settle=null;}else if(moving)st.phase+=distance/stride;
   st.moving=moving;st.gaitMode=run?'run':'walk';const phase=st.phase*TAU;
   const reaction=damagePose(r,p,t,st.feet,asset.damageProfile),pose=damageArtPose(r,p,t,artPose(p,t,SkillMotion.stateFor(r,p,t))),ail=ailmentPose(p,t),guard=SkillMotion.ready(p,t);
   const fall=!p.alive?(p.wasDownedOnDeath?1:smooth((t-(p.deathAt??t))/1.12)):0;
   const sampledGround=p.traversal?Math.max(.10,p.supportHeight||0):this.groundAt(p.x,p.z);if(p.traversal||!Number.isFinite(st.ground))st.ground=sampledGround;st.ground+=(sampledGround-st.ground)*(1-Math.exp(-dt*14));
   const authored=asset.clips&&!pose.combatIdle?CM01.selectClip(p,t,st,phase,moving||['run','guardWalk','dash'].includes(p.action),run,reaction,asset.clips):null;
   const injury=TravelerExpression.body(st.expression,phase,moving);this.injury=injury;
   const transition=SkillMotion.chargeTransition(st,p,reaction.amount>.02?null:pose.motionClock),drive=bodyDrive(p,r,pose,st,asset,t);
   let rootQ=Q.euler((authored?0:pose.pitch)+reaction.pitch+ail.pitch+injury.pitch+fall*1.48,(p.dir||0)+(authored?0:pose.yaw),(authored?0:pose.roll)+reaction.roll+ail.roll+injury.roll);
   let rootOffset=[reaction.x+Math.cos(p.dir||0)*(authored?0:pose.weightX||0)+Math.sin(p.dir||0)*(authored?0:pose.weightZ||0),(authored?0:pose.y)+ail.y-reaction.drop,reaction.z-Math.sin(p.dir||0)*(authored?0:pose.weightX||0)+Math.cos(p.dir||0)*(authored?0:pose.weightZ||0)];
   if(transition?.from){rootQ=Q.slerp(transition.from.rootQ,rootQ,transition.amount);rootOffset=V.lerp(transition.from.rootOffset,rootOffset,transition.amount);}
   st.lastRootQ=rootQ;st.lastRootOffset=rootOffset;
   if(drive)rootOffset=V.add(rootOffset,drive.value);
   const rootM=matrix([p.x+rootOffset[0],(p.baseY??st.ground)+(p.verticalOffset||0)+rootOffset[1],p.z+rootOffset[2]],rootQ);
   const q=asset.bind.map(()=>Q.identity()),offset=asset.bind.map(()=>[0,0,0]),qi=(i,x=0,y=0,z=0)=>q[i]=Q.euler(x,y,z),wave=Math.cos(phase);
   qi(1,this.ageProfile.posture+(authored?0:pose.torso)+reaction.torso+(run?.035:0)*gaitWeight,(authored?0:pose.torsoYaw||0)+reaction.yaw,reaction.torsoRoll);
   qi(2,-this.ageProfile.posture*.65+pose.head+reaction.head+ail.head,pose.headYaw||0,reaction.headRoll);
   for(const [side,a]of [[1,3],[-1,6]]){
    const key=side===1?'right':'left';let x=wave*side*(run?.31:.22)*gaitWeight,z=side*.025;
    if(pose.active){x=pose[key+'Arm'];z+=pose[key+'ArmZ'];}else if(guard)x=-.6;
    if(p.action==='carry')x=-1.1;if(p.action==='wave'&&side===1){x=-2.25;z=.15+Math.sin(t*5)*.14;}
    qi(a,x+reaction[key+'Arm']+ail.arm,0,z+reaction[key+'ArmZ']);
    const protecting=reaction.amount>0&&!reaction.blocked;
    qi(a+1,(pose[key+'Elbow']??0)-(protecting?reaction.amount*(reaction.part===key+'Arm'?.65:.38):0));qi(a+2,pose[key+'Wrist']??0);
   }
   if(p.prologue){const hold=1-this.ageProfile.lower;qi(3,-.45*hold,0,.10*hold);qi(6,-.45*hold,0,-.10*hold);qi(4,-.35*hold);qi(7,-.35*hold);}
   qi(15,Math.sin(phase-.5)*.025*gaitWeight);if(q[16])qi(16,0,Math.sin(phase*.5)*.065*gaitWeight);
   if(authored){
    if(st.clipName!==authored.name){st.clipFrom=st.lastQ;st.clipFromOffset=st.lastOffset;st.clipChanged=motionT;st.clipName=authored.name;}
    TravelerClips.sample(authored.clip,authored.u,q,offset,Q);
    // Retarget translation deltas into the visual age; keep clip rotations,
    // selector and combat phase exactly as authored by the motion pipeline.
    for(let i=0;i<offset.length;i++){
     const b=this.restAsset.bind[i],to=TravelerAge.point(V.add(b,offset[i]),i===2,this.ageProfile,this.restAsset);
     offset[i]=V.sub(to,asset.bind[i]);
    }
    const entry=authored.stage==='ready'?smooth((motionT-st.clipChanged)/.14):1;
    if(st.clipFrom&&entry<1)for(let i=0;i<q.length;i++){q[i]=Q.slerp(st.clipFrom[i],q[i],entry);if(st.clipFromOffset)offset[i]=V.lerp(st.clipFromOffset[i],offset[i],entry);}
    this.clipDebug={name:authored.name,stage:authored.stage,u:authored.u,contact:authored.clip.contact};
   }else{st.clipName=null;this.clipDebug=null;for(const foot of st.feet)if(foot)foot.clipStep=null;}
   if(transition?.from&&transition.amount<1)for(let i=0;i<q.length;i++){q[i]=Q.slerp(transition.from.q[i],q[i],transition.amount);offset[i]=V.lerp(transition.from.offset[i],offset[i],transition.amount);}
   if(injury.weight>0){
    q[2]=Q.mul(q[2],Q.euler(injury.head));
    for(const [key,a,side]of [['rightArm',3,1],['leftArm',6,-1]]){
     const amount=injury[key];if(!amount)continue;
     // Fold beside the chest, keeping the hand outside the torso silhouette.
     q[a]=Q.slerp(q[a],Q.euler(-.25,0,side*.10),amount*.85);
     q[a+1]=Q.slerp(q[a+1],Q.euler(-.85),amount*.85);
    }
   }
   const blend=pose.combatIdle&&reaction.amount<=.1?1-Math.exp(-dt*18):authored||(pose.active&&!moving)||reaction.amount>.1||fall>0?1:1-Math.exp(-dt*18);
   if(st.lastQ)for(let i=0;i<q.length;i++){q[i]=Q.slerp(st.lastQ[i],q[i],blend);if(st.lastOffset)offset[i]=V.lerp(st.lastOffset[i],offset[i],blend);}
   st.lastQ=q;st.lastOffset=offset;
   const localM=[],globalM=[];
   for(let i=0;i<q.length;i++){const par=asset.parents[i];localM[i]=matrix(V.add(V.sub(asset.bind[i],par>=0?asset.bind[par]:[0,0,0]),offset[i]),q[i]);globalM[i]=par>=0?rMultiply(globalM[par],localM[i]):localM[i];}
   const gripping=authored?null:SkillMotion.grip(p,pose,{arm:globalM[3],elbow:globalM[4],hand:globalM[5]},{arm:globalM[6],elbow:globalM[7],hand:globalM[8]},-.035);
   this.skillGripDebug=gripping;if(gripping)for(const [i,c]of [[3,gripping.right],[6,gripping.left]]){globalM[i]=c.arm;globalM[i+1]=c.elbow;globalM[i+2]=c.hand;}
   const useGroundIK=!p.prologue&&!incapacitated(p)&&!p.traversal&&!p.seated&&!p.activity&&fall===0&&!pose.air&&Math.abs(pose.pitch+reaction.pitch)<.8;
   if(pose.skillMotion&&!st.skillFeet)st.skillFeet=st.feet.map(f=>f?{anchor:[...f.anchor],yaw:f.yaw,t,motionT,rootX:p.x,rootZ:p.z,lift:0}:null);if(!pose.skillMotion)st.skillFeet=null;
   const targets=[];this.footDebug=[];
   for(const [side,si,ti]of [[1,0,9],[-1,1,12]]){
    const ki=ti+1,fi=ti+2,facing=p.dir||0,cs=Math.cos(facing),sn=Math.sin(facing),width=Math.abs(asset.bind[ti][0]),toWorld=(x,z)=>[p.x+cs*x+sn*z,p.z-sn*x+cs*z];
    const desired=toWorld(side*width,.015+(guard?side*.045:0));
    let foot=st.feet[si];if(!foot)foot=st.feet[si]={anchor:[...desired],target:[...desired],start:[...desired],swing:false,lift:0,yaw:facing,startPhase:0};
    const normalized=((st.phase+(si?.5:0))%1+1)%1,isSwing=normalized>duty&&gaitWeight>.12;
    if(!drive){foot.driveKey=null;foot.driveStep=null;}
    if(drive){
     driveFoot(p,drive,foot,side,width);foot.clipStep=null;foot.settle=null;foot.damageAnchor=null;foot.damageKey=null;
    }else if(authored){
     foot.driveKey=null;foot.driveStep=null;
     const baked=point(rootM,[globalM[fi][12],globalM[fi][13],globalM[fi][14]]),lift=Math.max(0,baked[1]-(p.baseY??st.ground)-(asset.bind[fi][1]-.027*asset.body[1]));
     const airborne=lift>.025,reach=Math.hypot(foot.anchor[0]-baked[0],foot.anchor[1]-baked[2]);
     if(!foot.clipStep&&!foot.swing&&(airborne||reach>.16*asset.body[1]))foot.clipStep={from:[...foot.anchor],started:motionT,lift:foot.lift};
     if(foot.clipStep&&p.hitstopUntil>t)foot.clipStep.started+=dt;
     if(foot.clipStep){const step=foot.clipStep,u=clamp((motionT-step.started)/.12,0,1);foot.anchor=V.lerp(step.from,[baked[0],baked[2]],smooth(u));foot.lift=Math.max(lift,step.lift*(1-u)+Math.sin(Math.PI*u)*.075);foot.swing=true;if(u===1){foot.clipStep=null;foot.swing=airborne;if(!airborne)foot.lift=0;}}
     else if(foot.swing){foot.anchor=[baked[0],baked[2]];foot.lift=airborne?lift:0;foot.swing=airborne;}else foot.lift=0;
     const worldFoot=rMultiply(rootM,globalM[fi]);foot.yaw=Math.atan2(worldFoot[8],worldFoot[10]);foot.settle=null;foot.damageAnchor=null;foot.damageKey=null;
    }else if(pose.skillMotion){foot.damageAnchor=null;foot.damageKey=null;}
    else if(useGroundIK&&!moving&&reaction.amount>0)damageFoot(p,reaction,side,foot,.72*asset.body[1]);
    else if(!moving){
     foot.damageAnchor=null;foot.damageKey=null;const turn=Math.atan2(Math.sin(facing-foot.yaw),Math.cos(facing-foot.yaw)),needsStep=Math.hypot(...V.sub(foot.anchor,desired))>(foot.damageSettled?.23:.035)||Math.abs(turn)>.22;
     if(!foot.settle&&(foot.swing||needsStep&&!st.feet.some(f=>f?.settle)))foot.settle={from:[...foot.anchor],to:desired,yaw:foot.yaw,turn,lift:foot.lift,elapsed:0};
     if(foot.settle){const s=foot.settle;s.elapsed+=dt;const u=clamp(s.elapsed/.20,0,1);foot.anchor=V.lerp(s.from,s.to,smooth(u));foot.lift=s.lift*(1-u)+Math.sin(Math.PI*u)*.095;foot.yaw=s.yaw+s.turn*smooth(u);foot.swing=u<1;if(u>=1){foot.settle=null;foot.lift=0;}}
     else{foot.swing=false;foot.lift=0;}
    }else if(isSwing){
     foot.damageAnchor=null;foot.damageKey=null;foot.damageSettled=false;
     if(!foot.swing){foot.start=[...foot.anchor];foot.startPhase=normalized;foot.target=toWorld(side*width,.015+stride*(1-normalized+duty*.5));foot.swing=true;}
     const predicted=toWorld(side*width,.015+stride*(1-normalized+duty*.5));foot.target=V.lerp(foot.target,predicted,1-Math.exp(-dt*22));
     const u=clamp((normalized-foot.startPhase)/Math.max(.001,1-foot.startPhase),0,1);foot.anchor=V.lerp(foot.start,foot.target,smooth(u));foot.lift=Math.sin(Math.PI*u)*(run?.16:.11)*gaitWeight;foot.yaw=facing;
    }else{foot.damageAnchor=null;foot.damageKey=null;if(foot.swing){foot.anchor=[...foot.target];foot.swing=false;}foot.lift=0;}
    const maxReach=.34*asset.body[1],reach=Math.hypot(...V.sub(foot.anchor,desired));if(!authored&&moving&&reach>maxReach){foot.swing=true;foot.lift=Math.max(foot.lift,.055);foot.anchor=desired.map((v,i)=>v+(foot.anchor[i]-v)*maxReach/reach);}
    if(!drive&&!authored&&pose.skillMotion){const planted=SkillMotion.foot(p,pose,motionT,side,st.skillFeet,.70*asset.body[1]);Object.assign(foot,planted,{target:[...planted.anchor],settle:null});}
    // A lifted foot may shorten its travel when collision/torso rotation makes
    // the old target unreachable. A planted foot must keep its world anchor.
    if(!drive&&(authored||pose.skillMotion)&&foot.swing){
     const hipWorld=point(rootM,Array.from(globalM[ti].slice(12,15))),limit=(Math.hypot(...V.sub(asset.bind[ki],asset.bind[ti]))+Math.hypot(...V.sub(asset.bind[fi],asset.bind[ki])))*.85;
     const dx=foot.anchor[0]-hipWorld[0],dz=foot.anchor[1]-hipWorld[2],reach=Math.hypot(dx,dz);
     if(reach>limit)foot.anchor=[hipWorld[0]+dx*limit/reach,hipWorld[2]+dz*limit/reach];
    }
    if(foot.swing&&moving&&(!authored||['walk','run'].includes(authored.stage))&&!pose.skillMotion){const hurt=side===1?injury.rightLeg:injury.leftLeg;foot.lift*=1-.30*hurt;}
    const floor=Math.max(this.groundAt(...foot.anchor),this.groundAt(foot.anchor[0]+Math.sin(foot.yaw)*.13,foot.anchor[1]+Math.cos(foot.yaw)*.13));
    const soleOffset=asset.bind[fi][1]-.018*asset.body[1]*asset.scale,worldAnkle=[foot.anchor[0],floor+soleOffset+foot.lift,foot.anchor[1]];
    targets.push({side,si,ti,ki,fi,foot,floor,soleOffset,worldAnkle,hip:Array.from(globalM[ti].slice(12,15)),knee:Array.from(globalM[ki].slice(12,15)),lost:p.wounds?.[side===1?'rightLeg':'leftLeg']?.severity==='lost'});
   }
   if(drive)st.skillFeet=st.feet.map(f=>f?{anchor:[...f.anchor],yaw:f.yaw,t,motionT,rootX:p.x,rootZ:p.z,lift:f.lift}:null);
   // Keep the pelvis inside the two leg reach discs. Moving a planted ankle
   // would make it slide; constrain the body's translation before solving IK.
   if(drive&&useGroundIK){
    const before=[rootM[12],rootM[14]];
    // Release the previous reach constraint over a short transfer, so lifting
    // the supporting foot cannot snap the pelvis back to the clip's root.
    if(drive.constraintStage===drive.stage&&drive.constraint){const keep=p.hitstopUntil>t?1:Math.exp(-dt*20);rootM[12]+=drive.constraint[0]*keep;rootM[14]+=drive.constraint[1]*keep;}
    for(let pass=0;pass<3;pass++){
     const passX=rootM[12],passZ=rootM[14];
     for(const {ti,ki,fi,hip,worldAnkle,lost,foot}of targets){
      if(lost||foot.swing)continue;const H=point(rootM,hip),limit=(Math.hypot(...V.sub(asset.bind[ki],asset.bind[ti]))+Math.hypot(...V.sub(asset.bind[fi],asset.bind[ki])))*.88;
      const dx=H[0]-worldAnkle[0],dz=H[2]-worldAnkle[2],len=Math.hypot(dx,dz);
      if(len>limit){rootM[12]-=dx*(1-limit/len);rootM[14]-=dz*(1-limit/len);}
     }
     // The first pass always checks scenery. Later passes need another sweep
     // only if leg projection changed the already checked position.
     if(pass>0&&Math.abs(rootM[12]-passX)+Math.abs(rootM[14]-passZ)<1e-7)break;
     // Check the resulting visual pelvis too, including the source clip's
     // root translation. Leg reach correction must not bypass a wall or body.
     const pelvis=point(rootM,Array.from(globalM[0].slice(12,15))),safe=clipDrive(p,r,[pelvis[0]-p.x,0,pelvis[2]-p.z]);
     rootM[12]+=p.x+safe[0]-pelvis[0];rootM[14]+=p.z+safe[2]-pelvis[2];
    }
    drive.constraint=[rootM[12]-before[0],rootM[14]-before[1]];drive.constraintStage=drive.stage;
    drive.value[0]+=drive.constraint[0];drive.value[2]+=drive.constraint[1];
   }
   let requiredDrop=0;
   if(useGroundIK){
    for(const {ti,ki,fi,worldAnkle,lost,hip}of targets){if(lost)continue;const target=Q.rotate(Q.inv(rootQ),V.sub(worldAnkle,[rootM[12],rootM[13],rootM[14]])),H=hip,L=V.sub(asset.bind[ki],asset.bind[ti]),S=V.sub(asset.bind[fi],asset.bind[ki]),reach=Math.hypot(...L)+Math.hypot(...S)-.003,xz=Math.hypot(target[0]-H[0],target[2]-H[2]);requiredDrop=Math.max(requiredDrop,H[1]-target[1]-Math.sqrt(Math.max(.005,reach*reach-xz*xz)));}
    st.pelvisDrop=Math.max(requiredDrop,(st.pelvisDrop||0)*Math.exp(-(p.hitstopUntil>t?0:dt)*14));
    for(let i=0;i<globalM.length;i++)globalM[i][13]-=st.pelvisDrop;
   }else st.pelvisDrop=0;
   for(const {side,si,ti,ki,fi,foot,floor,soleOffset,worldAnkle,lost,hip,knee}of targets){
    const upper=V.sub(asset.bind[ki],asset.bind[ti]),lower=V.sub(asset.bind[fi],asset.bind[ki]);
    // A kick or lifted reposition uses this body's actual leg length. Keep its
    // target reachable after pelvis settling; never relocate a planted sole.
    if(useGroundIK&&!lost&&foot.swing&&(pose.skillMotion||drive)){
     const H=point(rootM,[hip[0],hip[1]-st.pelvisDrop,hip[2]]),v=V.sub(worldAnkle,H),length=Math.hypot(...v),limit=Math.hypot(...upper)+Math.hypot(...lower)-.003;
     if(length>limit){const target=V.add(H,V.mul(v,limit/length));worldAnkle.splice(0,3,...target);foot.anchor=[target[0],target[2]];foot.lift=Math.max(0,target[1]-floor-soleOffset);}
    }
    if(useGroundIK&&!lost){
     const target=Q.rotate(Q.inv(rootQ),V.sub(worldAnkle,[rootM[12],rootM[13],rootM[14]])),H=[hip[0],hip[1]-st.pelvisDrop,hip[2]],L1=Math.hypot(...upper),L2=Math.hypot(...lower),diff=V.sub(target,H),len=Math.hypot(...diff),dist=clamp(len,Math.abs(L1-L2)+.001,L1+L2-.001),D=V.norm(diff),a=(L1*L1-L2*L2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,L1*L1-a*a));
     const bend=authored?V.sub([knee[0],knee[1]-st.pelvisDrop,knee[2]],H):[0,0,1],pole=V.norm(V.sub(bend,V.mul(D,V.dot(bend,D)))),K=V.add(H,V.add(V.mul(D,a),V.mul(pole,h))),F=V.add(H,V.mul(D,dist));
     globalM[ti]=matrix(H,Q.fromTo(upper,V.sub(K,H)));globalM[ki]=matrix(K,Q.fromTo(lower,V.sub(F,K)));globalM[fi]=matrix(F,Q.mul(Q.inv(rootQ),Q.euler(0,foot.yaw,0)));
     const actual=point(rootM,F);this.footDebug.push({side,swing:foot.swing,floor,soleY:actual[1]-soleOffset,target:worldAnkle,actual,error:Math.hypot(...V.sub(actual,worldAnkle))});
    }else{
     const key=side===1?'right':'left';globalM[ti]=rMultiply(globalM[0],matrix(asset.bind[ti],Q.euler(pose[key+'Leg']+reaction[key+'Leg']-(p.prologue?.55*(1-this.ageProfile.lower):0))));globalM[ki]=rMultiply(globalM[ti],matrix(upper,Q.euler(pose[key+'Knee']+reaction[key+'Knee']+ail.knee+(p.prologue?.8*(1-this.ageProfile.lower):0))));globalM[fi]=rMultiply(globalM[ki],matrix(lower,Q.identity()));st.feet[si]=null;
    }
   }
   for(let i=0;i<q.length;i++){this.transforms[i]=rMultiply(rootM,globalM[i]);this.palette.set(rMultiply(this.transforms[i],asset.ibm[i]),i*16);}
   // A seated/fallen body rests on its own mesh envelope. Carried and airborne
   // bodies keep their existing authored vertical offsets and support state.
   if(!useGroundIK&&!p.prologue&&!p.traversal&&p.lifeState!=='carried'&&!pose.air){let minimum=Infinity;
    for(let i=0;i<asset.hulls.length;i++){if((i>=3&&i<=5&&p.wounds?.rightArm?.severity==='lost')||(i>=6&&i<=8&&p.wounds?.leftArm?.severity==='lost')||(i>=9&&i<=11&&p.wounds?.rightLeg?.severity==='lost')||(i>=12&&i<=14&&p.wounds?.leftLeg?.severity==='lost'))continue;for(const v of asset.hulls[i])minimum=Math.min(minimum,point(this.palette.subarray(i*16,i*16+16),v)[1]);}
    const lift=Math.max(0,st.ground-minimum);for(let i=0;i<q.length;i++){this.transforms[i][13]+=lift;this.palette[i*16+13]+=lift;}
   }
   st.x=p.x;st.z=p.z;st.t=t;st.motionT=motionT;
   const gl=r.gl;gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.boneTex);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,4,asset.bind.length,gl.RGBA,gl.FLOAT,this.palette);
   const px=3*this.ageProfile.head[1]*r.canvas.height/Math.max(1,r.viewHeight||r.camera.zoom);if(this.lod===0&&px<125)this.lod=1;else if(this.lod===1&&px>150)this.lod=0;
   this.metrics={expression:this.expression.name,injuryWeight:injury.weight,character:'TRAVELER',race:asset.id,age:this.ageProfile.age,visualAge:this.ageProfile.visual,lod:this.lod,triangles:this.lods[this.lod].count/3,bones:q.length,solveMs:performance.now()-start,pelvisDrop:st.pelvisDrop,contactError:Math.max(0,...this.footDebug.filter(f=>!f.swing).map(f=>f.error)),contacts:this.footDebug.filter(f=>!f.swing).length,animation:p.prologue?'cradle':fall?'death':incapacitated(p)?p.lifeState||'downed':p.traversal?'traverse':p.seated?'rest':p.activity|| (reaction.amount>.1?'hit':p.action==='attack'||p.pendingSkill?'attack':guard?'combat_idle':gaitWeight>.15?(run?'run':'walk'):'idle')};
  }
  draw(shadow=false){
   const r=this.r,gl=r.gl;if(this.lastFrame!==r.frame)return;const p=shadow?this.depth:this.program;gl.useProgram(p);r.uniform(p,'vp',shadow?r.lightVP:r.vp);r.uniform(p,'lightVP',r.lightVP);r.uniform(p,'eye',r.eye);r.uniform(p,'focus',[r.camera.x,r.camera.z]);r.uniform(p,'time',r.currentTime);r.int(p,'shadows',r.quality!=='low'?1:0);
   if(!shadow){r.setupSurfaceUniforms({},p);r.uniform(p,'cmHairTint',[[1,1,1],[1.24,1.22,1.14],[.72,.76,.80],[1.40,1.40,1.34],[1.10,.91,.91],[.60,.65,.70]][(this.owner.hair||0)%6]);r.uniform(p,'cmSilhouette',this.silhouette?1:0);}
   const age=this.ageProfile;gl.uniform4fv(gl.getUniformLocation(p,'cmAgeBody'),age.body);r.uniform(p,'cmAgeHead',age.head);r.uniform(p,'cmAgeLandmarks',TravelerAge.landmarks(this.restAsset));gl.uniform4fv(gl.getUniformLocation(p,'cmAgeBeard'),[...TravelerAge.beardOrigin(this.restAsset),age.beard]);r.uniform(p,'cmBeard',age.beard);r.uniform(p,'cmAgeColor',[age.gray,age.old]);
   const cfg=TravelerModel.definitions[this.asset.race],h=cfg.head,b=cfg.body;
   gl.uniform4fv(gl.getUniformLocation(p,'cmFace'),this.expression.uniform);r.uniform(p,'cmFaceScale',[.78*h[0]*1.5,.80*h[1]*1.5,1.05*h[2]*1.5]);r.uniform(p,'cmFaceOffset',[0,(1.01*b[1]-1.01*.8*h[1])*1.5,-.018*h[2]*1.5]);
   gl.uniform4fv(gl.getUniformLocation(p,'cmLoss'),['rightArm','leftArm','rightLeg','leftLeg'].map(k=>this.owner.wounds?.[k]?.severity==='lost'?1:0));r.uniform(p,'cmArmor',this.owner.armor||0);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.boneTex);r.int(p,'cmBones',5);
   const lod=this.lods[this.lod];gl.bindVertexArray(lod.vao);gl.drawElements(gl.TRIANGLES,lod.count,lod.type,0);r.stats.calls++;r.stats.triangles+=lod.count/3;if(!shadow){r.stats.skinnedCharacters=(r.stats.skinnedCharacters||0)+1;r.stats.characterMaster={...this.metrics};}gl.useProgram(shadow?r.depthProgram:r.program);
  }
  dispose(){const gl=this.r.gl;for(const l of this.lods){gl.deleteVertexArray(l.vao);for(const b of l.buffers)gl.deleteBuffer(b);}gl.deleteTexture(this.boneTex);gl.deleteProgram(this.program);gl.deleteProgram(this.depth);}
 }
 return {Character,eligible,prepare,modelCache,shaders:{VS,FS,DS}};
})();
const TRAVELER_PREVIOUS_DOLL=VillageArt.prototype.doll;
VillageArt.prototype.doll=function(p,t,local){
 if(!Travelers.eligible(p,local)||!this.r.rigs)return TRAVELER_PREVIOUS_DOLL.call(this,p,t,local);
 const r=this.r;if(!(r.characterMaster instanceof Travelers.Character)||r.characterMaster.asset.race!==p.race){r.characterMaster?.dispose();r.characterMaster=new Travelers.Character(r,p.race);}
 const c=r.characterMaster;
 let visual=p;
 if(p.prologue){
  const lower=TravelerAge.sample(p,t).lower;
  TRAVELER_PREVIOUS_DOLL.call(this,{...p,id:p.id+'parent',kind:'parent',prologue:false,age:34,gender:1,weapon:-1,skin:0,action:'carry',carryWalking:p.action==='run',wounds:{},baseY:-.34*lower},t,false);
  visual={...p,baseY:1.20*(1-lower)+.10*lower,x:p.x+Math.sin(p.dir)*(.32*(1-lower)),z:p.z+Math.cos(p.dir)*(.32*(1-lower)),dir:p.dir+.2*(1-lower),action:'idle',weapon:-1,shield:false};
 }
 c.update(visual,t);const root=this.root,target=this.target;this.target=r.dynamic;
 const armed=p.age>=7&&!p.prologue&&!(p.rescueTarget||incapacitated(p)||p.traversal);
 r.rigs.begin(p,t);try{
  const stowed=SkillMotion.unarmed(p);
  if(armed&&p.weapon>=0&&p.wounds?.rightArm?.severity!=='lost'){this.root=c.transforms[stowed?1:5];this.with(stowed?rModel(.32,.06,-.34,1,1,1,0,0,-.6):rModel(0,-.035,.03,1,1,1,0,-.06,Math.PI-.12),()=>this.weapon(p.weapon,.84*Math.min(1,c.ageProfile.body[1])));if(stowed)r.weaponTips?.delete(p.id);}
  if(armed&&p.shield&&p.wounds?.leftArm?.severity!=='lost'){this.root=c.transforms[stowed?1:8];this.shield(stowed?-.22:-.08,.09,stowed?-.32:.19,.94*Math.min(1,c.ageProfile.body[1]));}
 }finally{if(r.rigs.pending.parts.length)r.rigs.end();else r.rigs.pending=null;this.root=root;this.target=target;}
 r.blob(p.x,p.z,.55,.39,.32,r.fxBatches);if(local&&p.alive)r.add('ring:6.283',p.x,.23,p.z,.58,1,.58,'#f5e3b2',0,0,0,4,.62,r.fxBatches);
};
