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
 void main(){mat4 m=bone(int(joints.x))*weights.x+bone(int(joints.y))*weights.y+bone(int(joints.z))*weights.z+bone(int(joints.w))*weights.w;vec4 w=m*vec4(pos,1.);vWorld=w.xyz;vNormal=normalize(mat3(m)*nor);vInk=color;vSurface=surface;vLocal=pos;vUv=uv;vRegion=int(region+.5);vShadow=lightVP*w;gl_Position=vp*w;}`;
 const regionHeader=`in vec2 vUv;flat in int vRegion;uniform vec4 cmLoss;uniform float cmArmor;
 bool hidden(){return (vRegion==2&&cmLoss.x>.5)||(vRegion==3&&cmLoss.y>.5)||(vRegion==4&&cmLoss.z>.5)||(vRegion==5&&cmLoss.w>.5)||(vRegion==10&&cmArmor<.5)||(vRegion==11&&(cmArmor<1.5||cmLoss.x>.5))||(vRegion==12&&(cmArmor<1.5||cmLoss.y>.5));}`;
 const FS=RFRAG.slice(0,RFRAG.indexOf('void main()'))+regionHeader+`
 uniform vec3 cmHairTint;uniform float cmSilhouette;
 void main(){if(hidden())discard;vec3 pigment=vInk.rgb;
 if(abs(vSurface-1.)<.1)pigment*=cmHairTint;
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
 const eligible=(p,local)=>!!(p&&local&&p.kind==='player'&&!p.prologue&&p.age>=18&&p.age<35&&[0,1,0,1][p.race]===p.gender);
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
  const asset={id,race,bind,ibm,lods,hulls,parents:parents.slice(0,bind.length),names:names.slice(0,bind.length),scale,body};
  if(modelCache.size>=2)modelCache.delete(modelCache.keys().next().value);modelCache.set(race,asset);return asset;
 }
 class Character {
  constructor(r,race=0){
   this.r=r;this.asset=prepare(race);const gl=r.gl;this.program=r.programOf(VS,FS);this.depth=r.programOf(VS,DS);
   this.lods=this.asset.lods.map(l=>{const vao=gl.createVertexArray(),buffers=[];gl.bindVertexArray(vao);for(const [i,[key,n]]of [['POSITION',3],['NORMAL',3],['TEXCOORD_0',2],['COLOR_0',4],['JOINTS_0',4],['WEIGHTS_0',4],['_REGION',1],['_SURFACE',1]].entries()){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,l.attrs[key],gl.STATIC_DRAW);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,key==='JOINTS_0'?gl.UNSIGNED_SHORT:gl.FLOAT,false,0,0);}const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,l.indices,gl.STATIC_DRAW);return{vao,buffers,count:l.indices.length,type:gl.UNSIGNED_SHORT};});
   this.boneTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.boneTex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,4,this.asset.bind.length,0,gl.RGBA,gl.FLOAT,null);
   this.palette=new Float32Array(this.asset.bind.length*16);this.transforms=this.asset.bind.map(()=>rModel());this.state=null;this.lod=0;this.lastFrame=-1;this.footDebug=[];
  }
  groundAt(x,z){return SkillMotion.groundAt(this.r,x,z);}
  update(source,t){
   if(!eligible(source,true)||source.race!==this.asset.race){this.lastFrame=-1;return;}
   const p=carriedVisualPose(source),r=this.r,asset=this.asset,start=performance.now();this.owner=p;this.lastFrame=r.frame;
   const motionT=Number.isFinite(p.renderPoseTime)?p.renderPoseTime:t;
   let st=this.state;if(!st||st.id!==p.id||t<st.t||t-st.t>.35||Math.hypot(p.x-st.x,p.z-st.z)>1.5)st=this.state={id:p.id,t,motionT,x:p.x,z:p.z,phase:0,speed:0,feet:[],pelvisDrop:0};
   const dt=clamp(motionT-st.motionT,0,.1),distance=Math.hypot(p.x-st.x,p.z-st.z),moving=['run','guardWalk','dash'].includes(p.action)&&(distance>1e-7||dt===0&&st.moving);
   if(dt>0)st.speed+=((moving?distance/dt:0)-st.speed)*(1-Math.exp(-dt*18));
   const run=!!p.dash||st.speed>3.1,gaitWeight=clamp(st.speed/.6,0,1),stride=(run?(p.dash?1.70:1.38):1.04)*asset.body[1],duty=run?.46:.60;
   if(moving&&!st.moving){st.phase=duty*.5+distance/stride;for(const f of st.feet)if(f)f.settle=null;}else if(moving)st.phase+=distance/stride;
   st.moving=moving;st.gaitMode=run?'run':'walk';const phase=st.phase*TAU;
   const reaction=damagePose(r,p,t,st.feet),pose=damageArtPose(r,p,t,artPose(p,t,SkillMotion.stateFor(r,p,t))),ail=ailmentPose(p,t),guard=p.guard||p.guardUntil>t||p.autoFight;
   const fall=!p.alive?(p.wasDownedOnDeath?1:smooth((t-(p.deathAt??t))/1.12)):0;
   const sampledGround=p.traversal?Math.max(.10,p.supportHeight||0):this.groundAt(p.x,p.z);if(!Number.isFinite(st.ground))st.ground=sampledGround;st.ground+=(sampledGround-st.ground)*(1-Math.exp(-dt*14));
   const rootQ=Q.euler(pose.pitch+reaction.pitch+ail.pitch+fall*1.48,(p.dir||0)+pose.yaw,pose.roll+reaction.roll+ail.roll);
   const rootM=matrix([p.x+reaction.x+Math.cos(p.dir||0)*(pose.weightX||0)+Math.sin(p.dir||0)*(pose.weightZ||0),(p.baseY??st.ground)+(p.verticalOffset||0)+pose.y+ail.y-reaction.drop,p.z+reaction.z-Math.sin(p.dir||0)*(pose.weightX||0)+Math.cos(p.dir||0)*(pose.weightZ||0)],rootQ);
   const q=asset.bind.map(()=>Q.identity()),qi=(i,x=0,y=0,z=0)=>q[i]=Q.euler(x,y,z),wave=Math.cos(phase);
   qi(1,pose.torso+reaction.torso*.7+(run?.035:0)*gaitWeight,pose.torsoYaw||0,reaction.torsoRoll*.6);
   qi(2,pose.head+reaction.head+ail.head,pose.headYaw||0,reaction.headRoll);
   for(const [side,a]of [[1,3],[-1,6]]){
    const key=side===1?'right':'left';let x=wave*side*(run?.31:.22)*gaitWeight,z=side*.025;
    if(pose.active){x=pose[key+'Arm'];z+=pose[key+'ArmZ'];}else if(guard)x=-.6;
    if(p.action==='carry')x=-1.1;if(p.action==='wave'&&side===1){x=-2.25;z=.15+Math.sin(t*5)*.14;}
    qi(a,x+reaction[key+'Arm']+ail.arm,0,z+reaction[key+'ArmZ']);
    qi(a+1,pose[key+'Elbow']??0);qi(a+2,pose[key+'Wrist']??0);
   }
   qi(15,Math.sin(phase-.5)*.025*gaitWeight);if(q[16])qi(16,0,Math.sin(phase*.5)*.065*gaitWeight);
   const blend=pose.active||reaction.amount>.1||fall>0?1:1-Math.exp(-dt*18);if(st.lastQ)for(let i=1;i<q.length;i++)q[i]=Q.slerp(st.lastQ[i],q[i],blend);st.lastQ=q;
   const localM=[],globalM=[];
   for(let i=0;i<q.length;i++){const par=asset.parents[i];localM[i]=matrix(V.sub(asset.bind[i],par>=0?asset.bind[par]:[0,0,0]),q[i]);globalM[i]=par>=0?rMultiply(globalM[par],localM[i]):localM[i];}
   const gripping=SkillMotion.grip(p,pose,{arm:globalM[3],elbow:globalM[4],hand:globalM[5]},{arm:globalM[6],elbow:globalM[7],hand:globalM[8]},-.035);
   this.skillGripDebug=gripping;if(gripping)for(const [i,c]of [[3,gripping.right],[6,gripping.left]]){globalM[i]=c.arm;globalM[i+1]=c.elbow;globalM[i+2]=c.hand;}
   const useGroundIK=!incapacitated(p)&&!p.traversal&&!p.seated&&!p.activity&&fall===0&&!pose.air&&Math.abs(pose.pitch+reaction.pitch)<.8;
   if(pose.skillMotion&&!st.skillFeet)st.skillFeet=st.feet.map(f=>f?{anchor:[...f.anchor],yaw:f.yaw,t,motionT,rootX:p.x,rootZ:p.z,lift:0}:null);if(!pose.skillMotion)st.skillFeet=null;
   const targets=[];this.footDebug=[];
   for(const [side,si,ti]of [[1,0,9],[-1,1,12]]){
    const ki=ti+1,fi=ti+2,facing=p.dir||0,cs=Math.cos(facing),sn=Math.sin(facing),width=Math.abs(asset.bind[ti][0]),toWorld=(x,z)=>[p.x+cs*x+sn*z,p.z-sn*x+cs*z];
    const desired=toWorld(side*width,.015+(guard?side*.045:0));
    let foot=st.feet[si];if(!foot)foot=st.feet[si]={anchor:[...desired],target:[...desired],start:[...desired],swing:false,lift:0,yaw:facing,startPhase:0};
    const normalized=((st.phase+(si?.5:0))%1+1)%1,isSwing=normalized>duty&&gaitWeight>.12;
    if(pose.skillMotion){foot.damageAnchor=null;foot.damageKey=null;}
    else if(useGroundIK&&!moving&&reaction.amount>0)damageFoot(p,reaction,side,foot,.72*asset.body[1]);
    else if(!moving){
     foot.damageAnchor=null;foot.damageKey=null;const turn=Math.atan2(Math.sin(facing-foot.yaw),Math.cos(facing-foot.yaw)),needsStep=Math.hypot(...V.sub(foot.anchor,desired))>.035||Math.abs(turn)>.22;
     if(!foot.settle&&(foot.swing||needsStep&&!st.feet.some(f=>f?.settle)))foot.settle={from:[...foot.anchor],to:desired,yaw:foot.yaw,turn,lift:foot.lift,elapsed:0};
     if(foot.settle){const s=foot.settle;s.elapsed+=dt;const u=clamp(s.elapsed/.20,0,1);foot.anchor=V.lerp(s.from,s.to,smooth(u));foot.lift=s.lift*(1-u)+Math.sin(Math.PI*u)*.095;foot.yaw=s.yaw+s.turn*smooth(u);foot.swing=u<1;if(u>=1){foot.settle=null;foot.lift=0;}}
     else{foot.swing=false;foot.lift=0;}
    }else if(isSwing){
     foot.damageAnchor=null;foot.damageKey=null;
     if(!foot.swing){foot.start=[...foot.anchor];foot.startPhase=normalized;foot.target=toWorld(side*width,.015+stride*(1-normalized+duty*.5));foot.swing=true;}
     const predicted=toWorld(side*width,.015+stride*(1-normalized+duty*.5));foot.target=V.lerp(foot.target,predicted,1-Math.exp(-dt*22));
     const u=clamp((normalized-foot.startPhase)/Math.max(.001,1-foot.startPhase),0,1);foot.anchor=V.lerp(foot.start,foot.target,smooth(u));foot.lift=Math.sin(Math.PI*u)*(run?.16:.11)*gaitWeight;foot.yaw=facing;
    }else{foot.damageAnchor=null;foot.damageKey=null;if(foot.swing){foot.anchor=[...foot.target];foot.swing=false;}foot.lift=0;}
    const maxReach=.34*asset.body[1],reach=Math.hypot(...V.sub(foot.anchor,desired));if(moving&&reach>maxReach){foot.swing=true;foot.lift=Math.max(foot.lift,.055);foot.anchor=desired.map((v,i)=>v+(foot.anchor[i]-v)*maxReach/reach);}
    if(pose.skillMotion){const planted=SkillMotion.foot(p,pose,motionT,side,st.skillFeet,.70*asset.body[1]);Object.assign(foot,planted,{target:[...planted.anchor],settle:null});}
    const floor=Math.max(this.groundAt(...foot.anchor),this.groundAt(foot.anchor[0]+Math.sin(foot.yaw)*.13,foot.anchor[1]+Math.cos(foot.yaw)*.13));
    const soleOffset=asset.bind[fi][1]-.018*asset.body[1]*asset.scale,worldAnkle=[foot.anchor[0],floor+soleOffset+foot.lift,foot.anchor[1]];
    targets.push({side,si,ti,ki,fi,foot,floor,soleOffset,worldAnkle,lost:p.wounds?.[side===1?'rightLeg':'leftLeg']?.severity==='lost'});
   }
   let requiredDrop=0;
   if(useGroundIK){
    for(const {ti,ki,fi,worldAnkle,lost}of targets){if(lost)continue;const target=Q.rotate(Q.inv(rootQ),V.sub(worldAnkle,[rootM[12],rootM[13],rootM[14]])),H=asset.bind[ti],L=V.sub(asset.bind[ki],H),S=V.sub(asset.bind[fi],asset.bind[ki]),reach=Math.hypot(...L)+Math.hypot(...S)-.003,xz=Math.hypot(target[0]-H[0],target[2]-H[2]);requiredDrop=Math.max(requiredDrop,H[1]-target[1]-Math.sqrt(Math.max(.005,reach*reach-xz*xz)));}
    st.pelvisDrop=Math.max(requiredDrop,(st.pelvisDrop||0)*Math.exp(-dt*14));
    for(let i=0;i<globalM.length;i++)globalM[i][13]-=st.pelvisDrop;
   }else st.pelvisDrop=0;
   for(const {side,si,ti,ki,fi,foot,floor,soleOffset,worldAnkle,lost}of targets){
    const upper=V.sub(asset.bind[ki],asset.bind[ti]),lower=V.sub(asset.bind[fi],asset.bind[ki]);
    if(useGroundIK&&!lost){
     const target=Q.rotate(Q.inv(rootQ),V.sub(worldAnkle,[rootM[12],rootM[13],rootM[14]])),H=[asset.bind[ti][0],asset.bind[ti][1]-st.pelvisDrop,asset.bind[ti][2]],L1=Math.hypot(...upper),L2=Math.hypot(...lower),diff=V.sub(target,H),len=Math.hypot(...diff),dist=clamp(len,Math.abs(L1-L2)+.001,L1+L2-.001),D=V.norm(diff),a=(L1*L1-L2*L2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,L1*L1-a*a));
     const pole=V.norm(V.sub([0,0,1],V.mul(D,V.dot([0,0,1],D)))),K=V.add(H,V.add(V.mul(D,a),V.mul(pole,h))),F=V.add(H,V.mul(D,dist));
     globalM[ti]=matrix(H,Q.fromTo(upper,V.sub(K,H)));globalM[ki]=matrix(K,Q.fromTo(lower,V.sub(F,K)));globalM[fi]=matrix(F,Q.mul(Q.inv(rootQ),Q.euler(0,foot.yaw,0)));
     const actual=point(rootM,F);this.footDebug.push({side,swing:foot.swing,floor,soleY:actual[1]-soleOffset,target:worldAnkle,actual,error:Math.hypot(...V.sub(actual,worldAnkle))});
    }else{
     const key=side===1?'right':'left';globalM[ti]=rMultiply(globalM[0],matrix(asset.bind[ti],Q.euler(pose[key+'Leg']+reaction[key+'Leg'])));globalM[ki]=rMultiply(globalM[ti],matrix(upper,Q.euler(pose[key+'Knee']+reaction[key+'Knee']+ail.knee)));globalM[fi]=rMultiply(globalM[ki],matrix(lower,Q.identity()));st.feet[si]=null;
    }
   }
   for(let i=0;i<q.length;i++){this.transforms[i]=rMultiply(rootM,globalM[i]);this.palette.set(rMultiply(this.transforms[i],asset.ibm[i]),i*16);}
   // A seated/fallen body rests on its own mesh envelope. Carried and airborne
   // bodies keep their existing authored vertical offsets and support state.
   if(!useGroundIK&&!p.traversal&&p.lifeState!=='carried'&&!pose.air){let minimum=Infinity;
    for(let i=0;i<asset.hulls.length;i++){if((i>=3&&i<=5&&p.wounds?.rightArm?.severity==='lost')||(i>=6&&i<=8&&p.wounds?.leftArm?.severity==='lost')||(i>=9&&i<=11&&p.wounds?.rightLeg?.severity==='lost')||(i>=12&&i<=14&&p.wounds?.leftLeg?.severity==='lost'))continue;for(const v of asset.hulls[i])minimum=Math.min(minimum,point(this.palette.subarray(i*16,i*16+16),v)[1]);}
    const lift=Math.max(0,st.ground-minimum);for(let i=0;i<q.length;i++){this.transforms[i][13]+=lift;this.palette[i*16+13]+=lift;}
   }
   st.x=p.x;st.z=p.z;st.t=t;st.motionT=motionT;
   const gl=r.gl;gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.boneTex);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,4,asset.bind.length,gl.RGBA,gl.FLOAT,this.palette);
   const px=3*r.canvas.height/Math.max(1,r.viewHeight||r.camera.zoom);if(this.lod===0&&px<125)this.lod=1;else if(this.lod===1&&px>150)this.lod=0;
   this.metrics={character:'TRAVELER',race:asset.id,lod:this.lod,triangles:this.lods[this.lod].count/3,bones:q.length,solveMs:performance.now()-start,pelvisDrop:st.pelvisDrop,contactError:Math.max(0,...this.footDebug.filter(f=>!f.swing).map(f=>f.error)),contacts:this.footDebug.filter(f=>!f.swing).length,animation:fall?'death':incapacitated(p)?p.lifeState||'downed':p.traversal?'traverse':p.seated?'rest':p.activity|| (reaction.amount>.1?'hit':p.action==='attack'||p.pendingSkill?'attack':guard?'combat_idle':gaitWeight>.15?(run?'run':'walk'):'idle')};
  }
  draw(shadow=false){
   const r=this.r,gl=r.gl;if(this.lastFrame!==r.frame)return;const p=shadow?this.depth:this.program;gl.useProgram(p);r.uniform(p,'vp',shadow?r.lightVP:r.vp);r.uniform(p,'lightVP',r.lightVP);r.uniform(p,'eye',r.eye);r.uniform(p,'focus',[r.camera.x,r.camera.z]);r.uniform(p,'time',r.currentTime);r.int(p,'shadows',r.quality!=='low'?1:0);
   if(!shadow){r.setupSurfaceUniforms({},p);r.uniform(p,'cmHairTint',[[1,1,1],[1.24,1.22,1.14],[.72,.76,.80],[1.40,1.40,1.34],[1.10,.91,.91],[.60,.65,.70]][(this.owner.hair||0)%6]);r.uniform(p,'cmSilhouette',this.silhouette?1:0);}
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
 const c=r.characterMaster;c.update(p,t);const root=this.root,target=this.target;this.target=r.dynamic;
 const armed=!(p.rescueTarget||incapacitated(p)||p.traversal);
 r.rigs.begin(p,t);try{
  if(armed&&p.weapon>=0&&p.wounds?.rightArm?.severity!=='lost'){this.root=c.transforms[5];this.with(rModel(0,-.035,.03,1,1,1,0,-.06,Math.PI-.12),()=>this.weapon(p.weapon,.84));}
  if(armed&&p.shield&&p.wounds?.leftArm?.severity!=='lost'){this.root=c.transforms[8];this.shield(-.08,.09,.19,.94);}
 }finally{if(r.rigs.pending.parts.length)r.rigs.end();else r.rigs.pending=null;this.root=root;this.target=target;}
 r.blob(p.x,p.z,.55,.39,.32,r.fxBatches);if(local&&p.alive)r.add('ring:6.283',p.x,.23,p.z,.58,1,.58,'#f5e3b2',0,0,0,4,.62,r.fxBatches);
};
