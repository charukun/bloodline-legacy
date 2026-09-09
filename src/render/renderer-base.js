class Renderer{
 constructor(canvas,size=null){this.canvas=canvas;this.logicalSize=size;this.gl=canvas.getContext('webgl2',{alpha:!!size,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:true});if(!this.gl)throw new Error('WebGL 2 を利用できません。Chromeで開いてください。');this.frame=0;this.stats={};this.lost=false;this.camera={x:0,z:5,zoom:16.8,yaw:.42,pitch:.68};this.quality='auto';this.scale=1;this.static=new Map();this.dynamic=new Map();this.fxBatches=new Map();this.impactFX=new Map();this.groundFX=new Map();this.geo=new Map();this.labels=[];this.effects=[];this.art=new ArtDirector(this);this.sceneKey='';this.staticShadowDirty=true;this.lastShadow=[1e9,1e9];this.program=this.programOf(RVERT,RFRAG);this.depthProgram=this.programOf(RVERT,RDEPTH);this.post=this.programOf(RPOSTV,RPOSTF);this.shadowStatic=this.shadowTarget(1536);this.shadowDynamic=this.shadowTarget(1024);this.lastSize='';this.diorama=new TiltShiftPass(this);this.resize();this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});this.canvas.addEventListener('webglcontextrestored',()=>location.reload());this.frameMs=16;this.stableFrames=0;}
 programOf(v,f){const gl=this.gl;const shader=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));p.u=new Map();return p;}
 uniform(p,name,value){const gl=this.gl;let u=p.u.get(name);if(u===undefined){u=gl.getUniformLocation(p,name);p.u.set(name,u);}if(u===null)return;if(value instanceof Float32Array&&value.length===16)gl.uniformMatrix4fv(u,false,value);else if(Array.isArray(value)){if(value.length===2)gl.uniform2fv(u,value);else if(value.length===3)gl.uniform3fv(u,value);}else gl.uniform1f(u,value);}
 int(p,name,v){let u=p.u.get(name);if(u===undefined){u=this.gl.getUniformLocation(p,name);p.u.set(name,u);}if(u!==null)this.gl.uniform1i(u,v);}
 shadowTarget(size){const gl=this.gl,tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,tex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('影バッファを確保できません');gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return{fb,tex,size};}
 resize(){const gl=this.gl,w=this.logicalSize?.width||this.canvas.clientWidth||innerWidth,h=this.logicalSize?.height||this.canvas.clientHeight||innerHeight;const dpr=Math.min(devicePixelRatio||1,this.quality==='high'?1.65:1.35)*this.scale,ww=Math.round(w*dpr),hh=Math.round(h*dpr);const key=ww+'x'+hh;if(key===this.lastSize)return;this.lastSize=key;this.diorama?.releaseTargets();this.canvas.width=ww;this.canvas.height=hh;this.width=w;this.height=h;if(this.target){gl.deleteFramebuffer(this.target.fb);for(const t of [this.target.image,this.target.normals,this.target.depth])gl.deleteTexture(t);}
 const tex=(depth=false)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,depth?gl.DEPTH_COMPONENT24:gl.RGBA8,ww,hh,0,depth?gl.DEPTH_COMPONENT:gl.RGBA,depth?gl.UNSIGNED_INT:gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,depth?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,depth?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;};const fb=gl.createFramebuffer(),image=tex(),normals=tex(),depth=tex(true);gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,image,0);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,normals,0);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('描画バッファを確保できません');gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.target={fb,image,normals,depth};}
 setQuality(q){this.quality=q;this.scale=q==='low'?.75:1;this.lastSize='';this.resize();}
 put(type,m,c,surface=0,alpha=1,target=this.dynamic){let batch=target.get(type);if(!batch){batch=[];target.set(type,batch);}const col=Array.isArray(c)?c:rColor(c);batch.push([...m,col[0],col[1],col[2],alpha,surface]);}
 add(type,x,y,z,sx,sy,sz,c,yaw=0,rz=0,rx=0,surf=0,alpha=1,target=this.dynamic){this.put(type,rModel(x,y,z,sx,sy,sz,yaw,rz,rx),c,surf,alpha,target);}
 blob(x,z,sx,sz,a=.28,target=this.fxBatches){this.add('disk',x,.27,z,sx,1,sz,'#665b42',0,0,0,2,a,target);}
 geometry(type){if(this.geo.has(type))return this.geo.get(type);const gl=this.gl,g=rGeometry(type);if(!g.count)throw new Error('Unknown mesh: '+type);const vao=gl.createVertexArray();gl.bindVertexArray(vao);const data=new Float32Array(g.count*6);for(let i=0;i<g.count;i++){data.set(g.positions.subarray(i*3,i*3+3),i*6);data.set(g.normals.subarray(i*3,i*3+3),i*6+3);}const vertex=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);for(let i=0;i<2;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,24,i*12);}const instance=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instance);for(let i=0;i<4;i++){gl.enableVertexAttribArray(2+i);gl.vertexAttribPointer(2+i,4,gl.FLOAT,false,84,i*16);gl.vertexAttribDivisor(2+i,1);}gl.enableVertexAttribArray(6);gl.vertexAttribPointer(6,4,gl.FLOAT,false,84,64);gl.vertexAttribDivisor(6,1);gl.enableVertexAttribArray(7);gl.vertexAttribPointer(7,1,gl.FLOAT,false,84,80);gl.vertexAttribDivisor(7,1);gl.bindVertexArray(null);const out={...g,vao,vertex,instance};this.geo.set(type,out);return out;}
 geometryBounds(type){
  const g=rGeometry(type);
  // Mesh coordinates need not be unit sized or centered on the instance origin.
  // Regenerated grout/trails replace their RG_CACHE entry, invalidating this cache.
  if(!g.cullBounds){
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<g.positions.length;i+=3)for(let k=0;k<3;k++){min[k]=Math.min(min[k],g.positions[i+k]);max[k]=Math.max(max[k],g.positions[i+k]);}
   g.cullBounds={center:min.map((v,k)=>(v+max[k])*.5),extent:min.map((v,k)=>(max[k]-v)*.5)};
  }
  return g.cullBounds;
 }
 visible(m,vp,padding=0,bounds=null){
  if(bounds){
   // Project the actual local AABB through the instance and this pass's camera.
   // Includes rotated/nonuniform instances and the independent shadow camera.
   const c=bounds.center,e=bounds.extent;
   for(let axis=0;axis<2;axis++){
    const a=vp[axis]*m[0]+vp[axis+4]*m[1]+vp[axis+8]*m[2];
    const b=vp[axis]*m[4]+vp[axis+4]*m[5]+vp[axis+8]*m[6];
    const d=vp[axis]*m[8]+vp[axis+4]*m[9]+vp[axis+8]*m[10];
    const center=a*c[0]+b*c[1]+d*c[2]+vp[axis]*m[12]+vp[axis+4]*m[13]+vp[axis+8]*m[14]+vp[axis+12];
    if(Math.abs(center)>1+padding+Math.abs(a)*e[0]+Math.abs(b)*e[1]+Math.abs(d)*e[2])return false;
   }
   return true;
  }
  // Skinned characters supply their existing conservative animation envelope.
  const x=m[12],y=m[13],z=m[14];const r=Math.max(Math.hypot(m[0],m[1],m[2]),Math.hypot(m[4],m[5],m[6]),Math.hypot(m[8],m[9],m[10]))*1.75;const clipX=vp[0]*x+vp[4]*y+vp[8]*z+vp[12],clipY=vp[1]*x+vp[5]*y+vp[9]*z+vp[13];return Math.abs(clipX)<1+r*this.unitsToClip+padding&&Math.abs(clipY)<1+r*this.unitsToClip+padding;
 }
 drawBatches(map,program,shadow=false){
  const gl=this.gl,buckets=new Map(),pixelScale=this.width/this.viewWidth,scenery=map===this.static;
  for(const [type,items] of map){const bounds=this.geometryBounds(type);for(const m of items){
   if(shadow&&(m[20]===1||m[20]===2||m[20]===4||m[19]<.85))continue;
   // Roof shells already cast the building silhouette. Millimetre paving relief
   // and overlapping tile faces do not need a second copy in the static shadow.
   if(shadow&&scenery&&(m[20]===20||type==='gltf:roof-shingle'||type==='golden:slate'))continue;
   if(!this.visible(m,shadow?this.lightVP:this.vp,shadow?.4:.09,bounds))continue;
   const radius=Math.max(Math.hypot(m[0],m[1],m[2]),Math.hypot(m[4],m[5],m[6]),Math.hypot(m[8],m[9],m[10])),pixels=radius*pixelScale;
   let lod=type;if(type==='sphere'&&(pixels<11||shadow))lod='bead';else if(type==='rbox'&&(pixels<7||shadow&&radius<.65))lod='box';else if(type==='leaf'&&(pixels<7||shadow))lod='leaflow';
   // Environment only: retain character geometry, animation and silhouette.
   if(scenery){
    if((type==='sphere'||type==='bead')&&(shadow||pixels<11))lod='beadlow';
    if(type==='torus'&&(shadow||pixels<32))lod='toruslow';
    if(shadow&&(type==='rbox'||type==='softbox'))lod='box';
   }
   if(lod!==type)this.stats.lodInstances++;
   if(!buckets.has(lod))buckets.set(lod,[]);buckets.get(lod).push(m);
  }}
  this.instanceScratch??=new Map();
  for(const [type,rows]of buckets){const g=this.geometry(type),length=rows.length*21;let data=this.instanceScratch.get(type);
   if(!data||data.length<length){data=new Float32Array(2**Math.ceil(Math.log2(Math.max(64,length))));this.instanceScratch.set(type,data);}
   for(let i=0;i<rows.length;i++)data.set(rows[i],i*21);
   gl.bindVertexArray(g.vao);gl.bindBuffer(gl.ARRAY_BUFFER,g.instance);gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,length),gl.DYNAMIC_DRAW);gl.drawArraysInstanced(gl.TRIANGLES,0,g.count,rows.length);this.stats.calls++;this.stats.triangles+=g.count/3*rows.length;if(!shadow)this.stats.instances+=rows.length;
  }
 }

 // Composition only: the world and the ordinary camera-follow target do not move.
 framePanel(snapshot,dt,options={}){
  if(options.portrait||options.clan||options.freezeCamera){this.panelShift=0;this.panelShiftSide=0;return;}
  const c=this.camera,p=snapshot.player,top=options.skillPanelTop,left=options.skillPanelLeft,side=Number.isFinite(left)&&left>0;let target=0,targetSide=0;
  if(p&&(side||Number.isFinite(top)&&top>0)){
   const foe=snapshot.actors?.find(e=>e.id===p.autoFight&&e.alive),x=p.x+(foe?(foe.x-p.x)*.5:0),z=p.z+(foe?(foe.z-p.z)*.5:0);
   const height=c.zoom/Math.min(1,this.width/this.height*.90),pitch=Math.sin(c.pitch);
   if(side){
    const right=Math.cos(c.yaw)*(x-c.x)-Math.sin(c.yaw)*(z-c.z);
    targetSide=right+(.5-clamp(left*.5,.14,.44))*height*this.width/this.height;
   }else{
    const up=Math.cos(c.pitch)*(1.1-(c.y??1))-pitch*(Math.sin(c.yaw)*(x-c.x)+Math.cos(c.yaw)*(z-c.z));
    target=((.5-clamp(top*.53,.14,.36))*height-up)/Math.max(.2,pitch);
   }
  }
  const blend=options.reducedMotion?1:-Math.expm1(-Math.max(0,dt)/.10);
  this.panelShift=(this.panelShift||0)+(target-(this.panelShift||0))*blend;
  this.panelShiftSide=(this.panelShiftSide||0)+(targetSide-(this.panelShiftSide||0))*blend;
  if(Math.abs(this.panelShift)<.0001)this.panelShift=0;
  if(Math.abs(this.panelShiftSide)<.0001)this.panelShiftSide=0;
 }
 matrix(){const c=this.camera,aspect=this.width/this.height;this.viewHeight=c.zoom/Math.min(1,aspect*.90);this.viewWidth=this.viewHeight*aspect;
 const x=c.x+Math.sin(c.yaw)*(this.panelShift||0)+Math.cos(c.yaw)*(this.panelShiftSide||0),z=c.z+Math.cos(c.yaw)*(this.panelShift||0)-Math.sin(c.yaw)*(this.panelShiftSide||0),y=c.y??1;
 this.viewCenter={x,z,y};const target=[x,y,z],distance=38,eye=[x+Math.sin(c.yaw)*Math.cos(c.pitch)*distance,y+Math.sin(c.pitch)*distance,z+Math.cos(c.yaw)*Math.cos(c.pitch)*distance];this.eye=eye;this.view=rLookAt(eye,target);this.vp=rMultiply(rOrtho(-this.viewWidth/2,this.viewWidth/2,-this.viewHeight/2,this.viewHeight/2,.1,120),this.view);this.unitsToClip=2/Math.min(this.viewWidth,this.viewHeight);const shadowCenter=[c.x,0,c.z],lightEye=[c.x-22,38,c.z+19];this.lightVP=rMultiply(rOrtho(-24,24,-24,24,.1,100),rLookAt(lightEye,shadowCenter));}
 screenToWorld(dx,dy){const y=this.camera.yaw,p=this.camera.pitch;return{x:Math.cos(y)*dx+Math.sin(y)*dy/Math.sin(p),z:-Math.sin(y)*dx+Math.cos(y)*dy/Math.sin(p)};}
 pointToWorld(x,y){const dx=(x/this.width-.5)*this.viewWidth,dy=(y/this.height-.5)*this.viewHeight;const v=this.screenToWorld(dx,dy),c=this.viewCenter||this.camera,viewY=c.y??1;return{x:c.x+v.x-viewY*Math.sin(this.camera.yaw)/Math.tan(this.camera.pitch),z:c.z+v.z-viewY*Math.cos(this.camera.yaw)/Math.tan(this.camera.pitch)};}
 project(x,y,z){const m=this.vp;if(!m)return{x:-999,y:-999,visible:false};const xx=m[0]*x+m[4]*y+m[8]*z+m[12],yy=m[1]*x+m[5]*y+m[9]*z+m[13],zz=m[2]*x+m[6]*y+m[10]*z+m[14];return{x:(xx+1)*this.width/2,y:(1-yy)*this.height/2,visible:Math.abs(xx)<1.15&&Math.abs(yy)<1.15&&Math.abs(zz)<1};}
 effect(ev,t){if(['hit','wound','partbreak','blocked','guard','guarded','parry','skill','death','status','release','released','learn'].includes(ev.type)){this.effects.push({...ev,born:t,life:ev.type==='partbreak'?1.25:ev.type==='skill'?1.1:.8});if(this.effects.length>100)this.effects.splice(0,20);}}
 combatFX(snapshot,t){const entities=[...snapshot.players||[],...snapshot.actors||[]];if(snapshot.player&&!entities.some(x=>x.id===snapshot.player.id))entities.push(snapshot.player);const find=id=>entities.find(x=>x.id===id);for(const p of entities){if(p.alive===false)continue;const sk=skillById(p.pendingSkill?.id??p.attackSkill);const pt=t;
 if(p.autoFight){for(let j=0;j<10;j++){const a=t*.8+j*TAU/10,rad=1.3+(j%3)*.18;this.add('bead',p.x+Math.sin(a)*rad,.21+(j%3)*.07,p.z+Math.cos(a)*rad,.32,.13,.20,'#e9d9b8',a,0,0,0,.17+(j%2)*.07,this.fxBatches);}}
 if(p.telegraph){const q=p.telegraph,u=clamp((t-q.started)/Math.max(.05,q.at-q.started),0,1);this.add('sector:1.7',p.x,.28,p.z,2.3,1,2.3,'#be735d',q.dir??p.dir,0,0,4,.13+u*.19,this.fxBatches);this.add('ring:1.7',p.x,.29,p.z,2.3,1,2.3,'#bc806a',q.dir??p.dir,0,0,4,.42,this.fxBatches);}
 if(sk&&p.action==='attack'&&p.actionUntil>t){const u=clamp((pt-p.actionStarted)/Math.max(.01,p.actionUntil-p.actionStarted),0,1),beat=(u*(sk.hits||1))%1;if(beat>.18&&beat<.83){const a=p.dir+(beat-.43)*2.2,fade=Math.sin((beat-.18)/.65*Math.PI),size=sk.animation==='spin'?2.05:1.65;for(let k=0;k<3;k++)this.add('slash:2.7',p.x,.8+k*.15,p.z,size+k*.15,.4,size+k*.15,['#fff4ce','#edc983','#d8bd83'][k],a,0,k===2?.15:-.18,4,fade*(.62-k*.12),this.fxBatches);}}
 }
 this.effects=this.effects.filter(e=>t-e.born<e.life);for(const e of this.effects){const p=find(e.id||e.target||e.player),source=find(e.source);let x=Number.isFinite(e.x)?e.x:p?.x,z=Number.isFinite(e.z)?e.z:p?.z;if(x===undefined||z===undefined)continue;if(source&&p){const d=Math.hypot(source.x-p.x,source.z-p.z)||1;const off=p.elite?.62:.32;x+=(source.x-p.x)/d*off;z+=(source.z-p.z)/d*off;}const age=t-e.born,u=clamp(age/e.life,0,1);if(e.type==='skill'||e.type==='death'||e.type==='released'||e.type==='release')continue;const broken=e.type==='partbreak',hit=['hit','wound','blocked','parry','guard'].includes(e.type),palette=e.type==='wound'?['#fff1db','#d99175']:['#fff8df','#f0c77c'];if(hit||broken){const count=broken?20:12;for(let j=0;j<count;j++){let a=j*2.399963+(e.id?.length||0),vel=(broken?2.4:1.5)+(j%3)*.35,y=1.25+Math.cos(a)*age*vel-age*age*2;this.add(broken&&j%3===0?'rbox':'leaf',x+Math.sin(a)*age*vel,y,z+Math.cos(a*2)*age*vel,.045*(1-u)+.015,.24*(1-u)+.035,.034,palette[j%2],a,a*2+age*5,age*3,j%3===0?9:4,1-u,this.fxBatches);}
 if(age<.22){this.add('star',x,1.48,z,.86*(1-u),.95*(1-u),.06,broken?'#eeb271':'#f4ce80',this.camera.yaw,.11,-this.camera.pitch,4,(1-u)*.9,this.impactFX);this.add('star',x,1.48,z,.48*(1-u),.59*(1-u),.07,'#fff9df',this.camera.yaw,-.13,-this.camera.pitch,4,1-u,this.impactFX);}
 this.add('ring:6.283185307179586',x,.30,z,.4+age*2.2,1,.4+age*2.2,broken?'#d5a367':'#ede0b3',0,0,0,4,(1-u)*.55,this.fxBatches);
 if(broken&&e.severed){this.add('softbox',x+age*1.4,.6+Math.sin(u*Math.PI)*1.1,z-age*.6,.3,.55,.3,'#b1a289',age*3,age*5,age*2,0,1-u*.6,this.fxBatches);}}
 }
 }
 updateCamera(snapshot,dt=.016,options={}){
  const c=this.camera,p=snapshot.player||snapshot.players?.[0];
  if(options.clan&&options.preview){const q=options.preview;this.cameraFollow=null;c.x+=(q.x-c.x)*Math.min(1,dt*8);c.z+=(q.z-c.z)*Math.min(1,dt*8);c.zoom+=(4.2-c.zoom)*Math.min(1,dt*8);c.yaw=.12;c.pitch=.24;return;}
  if(!p||options.freezeCamera||options.portrait||this.logicalSize)return;
  dt=Math.max(0,Math.min(.1,dt));
  const time=Number.isFinite(p.renderPoseTime)?p.renderPoseTime:snapshot.t||0;
  const room=snapshot.room?.id??snapshot.room?.kind;
  let f=this.cameraFollow;
  const reset=!f||f.id!==p.id||f.room!==room||time<f.time-.001||time-f.time>.5||Math.hypot(p.x-f.x,p.z-f.z)>8;
  if(reset)f=this.cameraFollow={id:p.id,room,time,x:p.x,z:p.z,vx:0,vz:0,leadX:0,leadZ:0,velocity:{},target:{}};
  const sampleDt=time-f.time;
  if(sampleDt>1e-6){const dx=p.x-f.x,dz=p.z-f.z,speed=Math.hypot(dx,dz)/sampleDt,scale=speed>.12?Math.min(1,10/speed)/sampleDt:0;f.vx=dx*scale;f.vz=dz*scale;f.x=p.x;f.z=p.z;f.time=time;}
  const foe=p.autoFight&&[...(snapshot.actors||[]),...(snapshot.players||[])].find(e=>e.id===p.autoFight&&e.alive!==false);
  let leadX=foe?0:f.vx*.22,leadZ=foe?0:f.vz*.22;
  const leadLength=Math.hypot(leadX,leadZ);if(leadLength>1.25){leadX*=1.25/leadLength;leadZ*=1.25/leadLength;}
  const leadBlend=1-Math.exp(-dt*6),lx=(leadX-f.leadX)*leadBlend,lz=(leadZ-f.leadZ)*leadBlend;
  const leadStep=Math.min(1,2.5*dt/Math.max(1e-9,Math.hypot(lx,lz)));
  f.leadX+=lx*leadStep;f.leadZ+=lz*leadStep;
  const aspect=this.width/this.height,aspectScale=Math.min(1,aspect*.90);
  // Reference composition: lower three-quarter view, readable facades, feet at 62%.
  // Keep the existing orthographic projection and input/world-space conversion.
  const yaw=options.yaw??.30,pitch=.52;
  let viewHeight=Math.max(18,12.4/aspect),cx=p.x,cz=p.z;
  if(foe){
   const dx=foe.x-p.x,dz=foe.z-p.z,distance=Math.hypot(dx,dz),weight=.35*Math.min(1,8/Math.max(.001,distance));
   cx+=dx*weight;cz+=dz*weight;
   const side=Math.abs(Math.cos(yaw)*dx-Math.sin(yaw)*dz),depth=Math.abs(Math.sin(yaw)*dx+Math.cos(yaw)*dz)*Math.sin(pitch);
   viewHeight=Math.max(viewHeight,(side+3.5)/(aspect*.72),(depth+3.5)/.48);
  }
  const zoom=Math.max(7,Math.min(34,viewHeight*aspectScale+(options.zoomOffset||0)));
  // Exact critically damped response to a linearly moving target. Frame-rate
  // independent damping has no Euler clamp and carries momentum through turns.
  const damp=(key,target,rate)=>{
   if(reset){c[key]=target;f.velocity[key]=0;f.target[key]=target;return;}
   if(dt===0)return;
   const previous=f.target[key]??target,slope=(target-previous)/dt;
   const lag=2*slope/rate,error=c[key]-previous+lag,relative=(f.velocity[key]||0)-slope;
   const j=(relative+rate*error)*dt,decay=Math.exp(-rate*dt);
   c[key]=target-lag+(error+j)*decay;f.velocity[key]=slope+(relative-rate*j)*decay;f.target[key]=target;
  };
  const yawTarget=c.yaw+Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));
  damp('yaw',yawTarget,9);damp('pitch',pitch,9);damp('zoom',zoom,7);
  const height=c.zoom/aspectScale,anchor=options.anchorY??.62;
  const ahead=((anchor-.5)*height-((c.y??1)-.18)*Math.cos(c.pitch))/Math.sin(c.pitch);
  damp('x',cx-Math.sin(c.yaw)*ahead+f.leadX,12);
  damp('z',cz-Math.cos(c.yaw)*ahead+f.leadZ,12);
 }
 drawLooseItems(snapshot,options={}){
  if(options.clan||options.portrait||snapshot.room?.kind!=='village')return;
  for(const item of snapshot.room.items||[]){
   if(item.ready>snapshot.t||Math.hypot(item.x-this.camera.x,item.z-this.camera.z)>33)continue;
   const x=item.x,z=item.z,put=(type,dx,y,dz,sx,sy,sz,color,rx=0)=>this.add(type,x+dx,y,z+dz,sx,sy,sz,color,0,0,rx,0);
   // Existing instanced primitives: no textures, lights, particles or new passes.
   if(item.item==='bell'){
    put('cylinder',0,.34,0,.19,.22,.19,'#c5a464');put('torus',0,.46,0,.09,.09,.035,'#e3c98b');put('bead',0,.21,0,.05,.05,.05,'#685842');
   }else if(item.item==='feather'){
    put('leaf',0,.23,0,.15,.52,.04,'#e6dec4',Math.PI/2);put('cylinder',0,.23,0,.012,.50,.012,'#b6a383',Math.PI/2);
   }else if(item.item==='net'){
    for(let i=-2;i<=2;i++){put('rbox',i*.11,.22,0,.018,.022,.52,'#b3a37b');put('rbox',0,.225,i*.11,.52,.022,.018,'#b3a37b');}
   }else put('bead',0,.29,0,.23,.14,.18,item.item==='charcoal'?'#50463c':'#b6aa8d');
  }
 }
 render(snapshot,dt=.016,options={}){if(this.lost||!snapshot)return;this.resize();const gl=this.gl,t=snapshot.t||0,p=snapshot.player||snapshot.players?.[0],area=snapshot.room?.kind||'village';let key=options.portrait?'portrait':options.clan?'showcase':area==='village'?'village'+snapshot.map.seed:'front'+Math.floor(-(p?.z||0)/44);if(key!==this.sceneKey){this.sceneKey=key;this.static.clear();if(options.portrait){this.groundFX.clear();this.labels=[];}else if(options.clan)this.art.showcase();else if(area==='village')this.art.village(snapshot.map);else this.art.front(snapshot.map.seed,Math.floor(-(p?.z||0)/44));this.staticShadowDirty=true;}
 this.diorama.update(snapshot,dt,options);
 this.updateCamera(snapshot,dt,options);
 this.framePanel(snapshot,dt,options);this.matrix();this.stats={calls:0,triangles:0,instances:0,lodInstances:0,resolution:this.canvas.width+'×'+this.canvas.height,scale:this.scale,meshTypes:this.geo.size};this.dynamic.clear();this.fxBatches.clear();this.impactFX.clear();
 let entities=[...snapshot.actors||[],...snapshot.players||[]];if(p&&!entities.some(e=>e.id===p.id))entities.push(p);if(options.clan&&options.preview)entities=[options.preview];entities.sort((a,b)=>(a.id===p?.id)-(b.id===p?.id));
 for(const e of entities){if(Math.hypot(e.x-this.camera.x,e.z-this.camera.z)>33)continue;const lod=Math.hypot(e.x-this.camera.x,e.z-this.camera.z)>18;this.art.low=lod;let et=t;this.art.doll(e,et,e.id===p?.id);this.art.statuses(e,t);if(e.id===p?.id)this.art.parentScene(e,t);}
 this.drawLooseItems(snapshot,options);
 this.combatFX(snapshot,t);
 // Static buildings reuse their shadow map until the light's tracked region changes.
 if(Math.hypot(this.camera.x-this.lastShadow[0],this.camera.z-this.lastShadow[1])>1.7){this.staticShadowDirty=true;}
 if(this.quality!=='low'){
  if(this.staticShadowDirty){this.shadowVP=new Float32Array(this.lightVP);this.lastShadow=[this.camera.x,this.camera.z];this.drawShadow(this.shadowStatic,this.static);this.staticShadowDirty=false;}else this.lightVP=this.shadowVP;
  this.drawShadow(this.shadowDynamic,this.dynamic);
 }
 gl.bindFramebuffer(gl.FRAMEBUFFER,this.target.fb);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);const clear=this.weatherState?.fogColor||[.38,.44,.48];gl.clearColor(...clear,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.useProgram(this.program);this.uniform(this.program,'vp',this.vp);this.uniform(this.program,'lightVP',this.lightVP);this.uniform(this.program,'eye',this.eye);this.uniform(this.program,'focus',[this.camera.x,this.camera.z]);this.uniform(this.program,'time',t);this.int(this.program,'shadows',this.quality!=='low'?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadowStatic.tex);this.int(this.program,'shadowTex',0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.shadowDynamic.tex);this.int(this.program,'dynamicShadow',1);
 this.setupSurfaceUniforms?.(options);this.drawBatches(this.static,this.program);this.drawBatches(this.dynamic,this.program);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);this.drawBatches(this.groundFX,this.program);this.drawBatches(this.fxBatches,this.program);this.drawWeather?.(snapshot);this.drawBatches(this.impactFX,this.program);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
 this.diorama.render();
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.disable(gl.DEPTH_TEST);gl.useProgram(this.post);this.diorama.bindComposite(this.post);gl.bindVertexArray(null);for(const [i,name,tex]of [[0,'image',this.target.image],[1,'depth',this.target.depth],[2,'normals',this.target.normals]]){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);this.int(this.post,name,i);}this.uniform(this.post,'texel',[1/this.canvas.width,1/this.canvas.height]);this.uniform(this.post,'occlusion',this.quality==='low'?.35:1);this.uniform(this.post,'bloom',this.quality==='low'?0:.22);this.uniform(this.post,'exposure',this.weatherState?.exposure||1.25);this.uniform(this.post,'portrait',options.portrait?2:options.clan?1:0);gl.drawArrays(gl.TRIANGLES,0,3);this.stats.calls++;this.frame++;

 }
 drawShadow(target,map){const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,target.fb);gl.viewport(0,0,target.size,target.size);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.2,2.0);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(this.depthProgram);this.uniform(this.depthProgram,'vp',this.lightVP);this.uniform(this.depthProgram,'lightVP',this.lightVP);this.drawBatches(map,this.depthProgram,true);gl.disable(gl.POLYGON_OFFSET_FILL);}
}
