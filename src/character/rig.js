/* GPU bone-palette skinning adapter. Existing pose functions supply the semantic
 * animation states, while the meshes remain in local joint coordinates.
 * Rigid equipment/face pieces use one joint; the glTF cape uses weighted joints.
 * The body skeleton is articulated exactly as in the game, with pose crossfades.
 */
const SKINVERT=`#version 300 es
precision highp float;layout(location=0)in vec3 pos;layout(location=1)in vec3 nor;layout(location=8)in float joint;
uniform sampler2D bonePalette;uniform mat4 vp;uniform mat4 lightVP;
out vec3 vWorld;out vec3 vNormal;out vec4 vInk;out float vSurface;out vec4 vShadow;out vec3 vLocal;
void main(){int j=int(joint+.5);mat4 m=mat4(texelFetch(bonePalette,ivec2(0,j),0),texelFetch(bonePalette,ivec2(1,j),0),texelFetch(bonePalette,ivec2(2,j),0),texelFetch(bonePalette,ivec2(3,j),0));vec4 w=m*vec4(pos,1.);vWorld=w.xyz;vNormal=normalize(mat3(m)*(nor/max(vec3(.00001),vec3(dot(m[0].xyz,m[0].xyz),dot(m[1].xyz,m[1].xyz),dot(m[2].xyz,m[2].xyz)))));vInk=texelFetch(bonePalette,ivec2(4,j),0);vSurface=texelFetch(bonePalette,ivec2(5,j),0).x;vLocal=pos;vShadow=lightVP*w;gl_Position=vp*w;}`;
class RigRenderer{
 constructor(r){this.r=r;const gl=r.gl;this.program=r.programOf(SKINVERT,RFRAG);this.depthProgram=r.programOf(SKINVERT,RDEPTH);this.records=new Map();this.active=[];this.pending=null;}
 begin(p,t){this.pending={p,t,parts:[]};}
 capture(type,m,c,surf,alpha){const col=Array.isArray(c)?c:rColor(c),size=Math.max(Math.hypot(m[0],m[1],m[2]),Math.hypot(m[4],m[5],m[6]),Math.hypot(m[8],m[9],m[10]));if(type==='sphere'&&size<.24)type='bead';this.pending.parts.push({type,m:[...m],c:[col[0],col[1],col[2],alpha],surf});}
 end(){const frame=this.pending;if(!frame)return;this.pending=null;const gl=this.r.gl,key=frame.p.id,signature=frame.parts.map(p=>p.type).join('|');let rec=this.records.get(key);
  if(!rec){rec={signature:null,texture:gl.createTexture(),lastT:frame.t,parts:null};this.records.set(key,rec);gl.bindTexture(gl.TEXTURE_2D,rec.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
  if(rec.signature!==signature){if(rec.vao){gl.deleteVertexArray(rec.vao);gl.deleteBuffer(rec.buffer);}const verts=[];frame.parts.forEach((part,j)=>{const g=rGeometry(part.type);for(let i=0;i<g.count;i++)verts.push(g.positions[i*3],g.positions[i*3+1],g.positions[i*3+2],g.normals[i*3],g.normals[i*3+1],g.normals[i*3+2],j);});rec.count=verts.length/7;rec.vao=gl.createVertexArray();gl.bindVertexArray(rec.vao);rec.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,rec.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);for(let i=0;i<2;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,28,i*12);}gl.enableVertexAttribArray(8);gl.vertexAttribPointer(8,1,gl.FLOAT,false,28,24);rec.signature=signature;rec.palette=new Float32Array(frame.parts.length*24);rec.parts=null;gl.bindTexture(gl.TEXTURE_2D,rec.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,6,frame.parts.length,0,gl.RGBA,gl.FLOAT,null);}
  // Crossfade at state boundaries, not across a confirmed impact freeze.
  const state=frame.p.alive===false?'death':frame.p.hitReactUntil>frame.t?'hit':frame.p.activity?.kind||frame.p.action||'idle';
  if(rec.state!==state){rec.transition=frame.t;rec.state=state;rec.from=rec.parts?.map(p=>({...p,m:[...p.m]}));}
  const blend=(SkillMotion.clock(frame.p,frame.t)||frame.p.action==='recover'||frame.p.hitstopUntil>frame.t||state==='hit'||state==='death')?1:clamp((frame.t-(rec.transition??frame.t))/.10,0,1);
  for(let j=0;j<frame.parts.length;j++){const p=frame.parts[j],old=rec.from?.[j];let matrix=p.m;if(old&&blend<1){matrix=p.m.map((v,k)=>v*blend+old.m[k]*(1-blend));}rec.palette.set(matrix,j*24);rec.palette.set(p.c,j*24+16);rec.palette[j*24+20]=p.surf;}
  rec.parts=frame.parts;rec.lastT=frame.t;rec.owner=frame.p;rec.lastFrame=this.r.frame;gl.bindTexture(gl.TEXTURE_2D,rec.texture);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,6,frame.parts.length,gl.RGBA,gl.FLOAT,rec.palette);this.active.push(rec);
  // Dead actors/old generations never accumulate GPU resources without a bound.
  if(this.records.size>48)for(const[k,v]of this.records){if(this.r.frame-v.lastFrame>120){gl.deleteTexture(v.texture);gl.deleteVertexArray(v.vao);gl.deleteBuffer(v.buffer);this.records.delete(k);}}
 }
 draw(shadow=false){const r=this.r,gl=r.gl,p=shadow?this.depthProgram:this.program;gl.useProgram(p);r.uniform(p,'vp',shadow?r.lightVP:r.vp);r.uniform(p,'lightVP',r.lightVP);r.uniform(p,'eye',r.eye);r.uniform(p,'focus',[r.camera.x,r.camera.z]);r.uniform(p,'time',r.currentTime);r.int(p,'shadows',r.quality!=='low'?1:0);
 if(!shadow)r.setupSurfaceUniforms({},p);for(const rec of this.active){if(!r.visible(rModel(rec.owner.x,1,rec.owner.z,2,3,2),shadow?r.lightVP:r.vp,shadow?.4:.2))continue;gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,rec.texture);r.int(p,'bonePalette',5);gl.bindVertexArray(rec.vao);gl.drawArrays(gl.TRIANGLES,0,rec.count);r.stats.calls++;r.stats.triangles+=rec.count/3;if(!shadow)r.stats.skinnedCharacters=(r.stats.skinnedCharacters||0)+1;}gl.useProgram(shadow?r.depthProgram:r.program);
 }
}
const BASE_DOLL=VillageArt.prototype.doll;
// Two-bone contact for the original age/race rigs. This submits the same leg
// meshes and equipment; no extra draw calls, colliders, or gameplay root motion.
VillageArt.prototype.skillGround=function(p,pose,t,scale,reaction={amount:0}){
 const r=this.r,root=this.root,motionT=p.renderPoseTime??t;
 this.skillFeet??=new Map();let rec=this.skillFeet.get(p.id);
 if(!rec||rec.room!==p.room){rec={room:p.room,feet:[]};this.skillFeet.set(p.id,rec);}
 const dt=clamp(motionT-(rec.t??motionT),0,.1);
 if(motionT<(rec.t??motionT)||motionT-(rec.t??motionT)>.35)rec.drop=0;
 rec.t=motionT;
 if(this.skillFeet.size>48)for(const [id,value]of this.skillFeet)if(motionT-value.t>2)this.skillFeet.delete(id);
 let drop=0;rec.targets=[];
 for(const side of [1,-1]){
  const index=side===1?0:1;
  // Advance authored support only when damage does not own the planted anchor.
  let foot=rec.feet[index];
  if(!foot||pose.skillMotion||reaction.amount<=0)foot=SkillMotion.foot(p,pose,motionT,side,rec.feet,scale);
  if(!pose.skillMotion){damageFoot(p,reaction,side,foot,scale);foot.t=motionT;foot.rootX=p.x;foot.rootZ=p.z;}
  const ground=Math.max(SkillMotion.groundAt(r,...foot.anchor),SkillMotion.groundAt(r,foot.anchor[0]+Math.sin(foot.yaw)*.15*scale,foot.anchor[1]+Math.cos(foot.yaw)*.15*scale));
  const H=[0,1,2].map(i=>root[12+i]+root[i]*side*.21+root[4+i]*1.08),F=[foot.anchor[0],ground+.125*scale+foot.lift,foot.anchor[1]];
  const horizontal=Math.hypot(H[0]-F[0],H[2]-F[2]);
  if(p.wounds?.[side===1?'rightLeg':'leftLeg']?.severity!=='lost')drop=Math.max(drop,H[1]-F[1]-Math.sqrt(Math.max(.01,(1.024*scale)**2-horizontal**2)));
  rec.targets[side===1?0:1]={foot,ground,F};
 }
 rec.drop=Math.max(drop,(rec.drop||0)*Math.exp(-dt*14));this.root=[...root];this.root[13]-=rec.drop;
};
VillageArt.prototype.skillLeg=function(p,pose,t,side,scale,pants){
 const root=this.root,rec=this.skillFeet.get(p.id),{foot,ground,F}=rec.targets[side===1?0:1];
 const H=[0,1,2].map(i=>root[12+i]+root[i]*side*.21+root[4+i]*1.08);
 const diff=F.map((v,i)=>v-H[i]),raw=Math.hypot(...diff),L1=.505*scale,L2=.521*scale;
 const len=clamp(raw,.1*scale,L1+L2-.0001),D=diff.map(v=>v/(raw||1));
 const along=(L1*L1-L2*L2+len*len)/(2*len),height=Math.sqrt(Math.max(0,L1*L1-along*along));
 const forward=[Math.sin(p.dir||0),0,Math.cos(p.dir||0)],dot=forward.reduce((s,v,i)=>s+v*D[i],0),pole=forward.map((v,i)=>v-D[i]*dot),pl=Math.hypot(...pole)||1;
 const K=H.map((v,i)=>v+D[i]*along+pole[i]/pl*height),actual=H.map((v,i)=>v+D[i]*len);
 const segment=(a,b)=>{const d=b.map((v,i)=>v-a[i]),l=Math.hypot(...d);return rModel(...a,scale,scale,scale,Math.atan2(d[0],d[2]),0,-Math.acos(clamp(-d[1]/l,-1,1)));};
 this.root=segment(H,K);this.S(0,-.25,0,.16,.29,.17,pants);
 this.root=segment(K,actual);this.S(0,-.22,0,.14,.25,.14,pants);
 this.root=rModel(...actual,scale,scale,scale,foot.yaw);
 this.B(0,.03,.075,.29,.29,.44,'#9b886b',0,0,0,8);this.B(0,.17,.025,.3,.12,.30,'#c1aa82',0,0,0,0);this.B(0,-.103,.07,.31,.045,.45,'#7f755b');
 this.root=root;
 (rec.debug??=[])[side===1?0:1]={side,swing:foot.swing,actual,target:F,error:Math.hypot(...actual.map((v,i)=>v-F[i])),soleY:actual[1]-.1255*scale,floor:ground};
};
VillageArt.prototype.gait=function(p,t){if(!this.gaits)this.gaits=new Map();let g=this.gaits.get(p.id);if(!g){g={x:p.x,z:p.z,phase:0};this.gaits.set(p.id,g);}const d=Math.hypot(p.x-g.x,p.z-g.z);if(d<1.5){const scale=p.age<10?.65:p.age<18?.88:1;g.phase+=d/(1.84*scale)*TAU;}g.x=p.x;g.z=p.z;return Math.sin(g.phase);};
VillageArt.prototype.doll=function(p,t,local){const human=['player','guard','parent','portrait'].includes(p.kind||'player');if(!human||p.prologue||!this.r.rigs)return BASE_DOLL.call(this,p,t,local);this.r.rigs.begin(p,t);try{BASE_DOLL.call(this,p,t,local);}finally{this.r.rigs.end();}};
