/* Opt-in presentation only. The existing orthographic camera/depth convention
 * is retained; this pass never owns simulation time, inputs or saved data. */
const DIORAMA_PRESETS=Object.freeze({
 off:Object.freeze({width:4,falloff:7,radius:0,strength:0}),
 subtle:Object.freeze({width:4,falloff:7,radius:8,strength:.72,samples:16}),
 strong:Object.freeze({width:3.2,falloff:6.5,radius:14,strength:1,samples:32})
});

// Shared by the half-resolution blur and the existing display resolve. Depth is
// orthographic, near=.1 / far=120, NOT perspective device-Z or screen height.
const DIORAMA_FOCUS_GLSL=`
uniform vec2 focusSpan;
uniform vec3 focusView;
uniform vec3 focusNormal;
uniform float focusWidth;
uniform float focusFalloff;
float dioramaCoC(vec2 coord,float d){
 vec3 viewPoint=vec3((coord-.5)*focusSpan,-(.1+d*119.9));
 float distanceToPlane=dot(viewPoint-focusView,focusNormal);
 return sign(distanceToPlane)*smoothstep(focusWidth,focusWidth+focusFalloff,abs(distanceToPlane));
}`;
// Store signed circle-of-confusion beside scene color once, at half resolution.
// This replaces repeated depth reconstruction inside the two separable gathers.
const DIORAMA_COC_GLSL=`#version 300 es
precision highp float;
in vec2 uv;out vec4 color;
uniform sampler2D image;uniform sampler2D depth;
${DIORAMA_FOCUS_GLSL}
void main(){
 float d=texture(depth,uv).r;
 float coc=d>.99999?-1.:dioramaCoC(uv,d);
 color=vec4(texture(image,uv).rgb,coc*.5+.5);
}`;
const DIORAMA_BLUR_GLSL=`#version 300 es
precision highp float;
in vec2 uv;out vec4 color;
uniform sampler2D image;
uniform vec2 blurRadius;uniform int diskSamples;
vec3 decodeDiorama(vec3 x){return x/max(vec3(.015),1.-x);}
void main(){
 vec4 center=texture(image,uv);float cc=center.a*2.-1.;
 float radius=abs(cc),nearC=0.;
 // Positive CoC is in front of the tilted focal plane. Let foreground bokeh
 // cover neighboring pixels while rejecting background color at silhouettes.
 for(int j=0;j<4;j++){
  float a=float(j)*1.5707963;
  float c=texture(image,uv+vec2(cos(a),sin(a))*blurRadius*.65).a*2.-1.;
  nearC=max(nearC,c*.83);
 }
 radius=max(radius,nearC);
 if(radius<.025){color=vec4(center.rgb,0.);return;}
 vec3 sum=decodeDiorama(center.rgb);float total=1.,foreground=0.;
 // Equal-area golden-angle disk: 16 taps for SUBTLE, 32 for the wider
 // STRONG footprint. Both presets reuse the same targets and two draw calls.
 for(int i=0;i<32;i++){
  if(i>=diskSamples)break;
  float fi=float(i)+.5,rr=sqrt(fi/float(diskSamples)),a=fi*2.399963;
  vec2 at=clamp(uv+vec2(cos(a),sin(a))*rr*radius*blurRadius,vec2(0.),vec2(1.));
  vec4 sampleColor=texture(image,at);float sc=sampleColor.a*2.-1.,travel=rr*radius;
  float weight=smoothstep(travel-.13,travel+.05,abs(sc));
  if(sc<cc-.15)weight*=1.-smoothstep(.05,.40,cc-sc);
  if(abs(sc)<.06)weight*=.12;
  if(sc>.06){float cover=smoothstep(travel-.1,travel+.1,sc);foreground+=cover/float(diskSamples);weight=max(weight,cover);}
  sum+=decodeDiorama(sampleColor.rgb)*weight;total+=weight;
 }
 vec3 linear=sum/total;
 float coverage=max(smoothstep(.025,.26,abs(cc)),smoothstep(.06,.52,foreground)*.90);
 color=vec4(linear/(1.+linear),coverage);
}`;

class TiltShiftPass{
 constructor(renderer){
  this.r=renderer;this.mode='normal';this.dof='subtle';this.debug=false;
  this.suspended=false;this.eligible=false;this.blend=0;this.focus=null;
  this.program=null;this.cocProgram=null;this.targets=[];this.size='';this.error=null;
 }
 configure(mode=this.mode,dof=this.dof){
  if(!['normal','tilt-shift'].includes(mode)||!Object.hasOwn(DIORAMA_PRESETS,dof))throw Error('Unknown diorama setting');
  if(mode!==this.mode||dof!==this.dof)this.error=null;
  this.mode=mode;this.dof=dof;
  if(mode==='normal'||dof==='off')this.releaseTargets();
 }
 update(snapshot,dt,options={}){
  const p=snapshot.player||snapshot.players?.[0];
  this.eligible=!!p&&snapshot.room?.kind==='village'&&p.z>=-28&&
   p.alive!==false&&!p.autoFight&&p.action!=='attack'&&!p.telegraph&&
   !options.clan&&!options.portrait&&!this.r.logicalSize&&!this.suspended;
  const enabled=this.mode==='tilt-shift'&&this.eligible;
  const seconds=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
  this.blend=enabled?this.blend+(1-this.blend)*(-Math.expm1(-seconds/.18)):0;
  if(!enabled){this.focus=null;return;}
  const next=[p.x,(p.baseY||0)+1.1,p.z];
  if(!this.focus||Math.hypot(next[0]-this.focus[0],next[2]-this.focus[2])>16)this.focus=next;
  else{const a=-Math.expm1(-seconds/.11);for(let i=0;i<3;i++)this.focus[i]+=(next[i]-this.focus[i])*a;}
 }
 get active(){return this.eligible&&this.mode==='tilt-shift'&&this.dof!=='off'&&this.blend>0&&!this.error;}
 // Use camera basis and player world position, so camera motion, zoom and
 // portrait aspect changes cannot detach the focus plane from the village.
 focusUniforms(){
  const r=this.r,v=r.view,f=this.focus||[r.camera.x,1.1,r.camera.z];
  const n=[Math.sin(r.camera.yaw)*Math.cos(.30),Math.sin(.30),Math.cos(r.camera.yaw)*Math.cos(.30)];
  const transform=(x,translation)=>[0,1,2].map(i=>v[i]*x[0]+v[4+i]*x[1]+v[8+i]*x[2]+(translation?v[12+i]:0));
  const preset=DIORAMA_PRESETS[this.dof];
  return{focusSpan:[r.viewWidth,r.viewHeight],focusView:transform(f,true),focusNormal:transform(n,false),focusWidth:preset.width,focusFalloff:preset.falloff};
 }
 setFocusUniforms(program){for(const [name,value]of Object.entries(this.focusUniforms()))this.r.uniform(program,name,value);}
 releaseTargets(){
  const gl=this.r.gl;
  for(const t of this.targets){gl.deleteFramebuffer(t.fb);gl.deleteTexture(t.image);}
  this.targets=[];this.size='';
 }
 dispose(){this.releaseTargets();for(const p of [this.program,this.cocProgram])if(p)this.r.gl.deleteProgram(p);this.program=null;this.cocProgram=null;}
 ensureTargets(){
  const gl=this.r.gl,w=Math.max(1,Math.ceil(this.r.canvas.width/2)),h=Math.max(1,Math.ceil(this.r.canvas.height/2));
  const size=w+'x'+h;if(size===this.size)return;
  this.releaseTargets();
  try{
   for(let i=0;i<2;i++){
    const image=gl.createTexture(),fb=gl.createFramebuffer();this.targets.push({image,fb,w,h});
    if(!image||!fb)throw Error('Diorama target allocation failed');
    gl.bindTexture(gl.TEXTURE_2D,image);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);
    for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,image,0);gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Diorama framebuffer unavailable');
   }
   this.size=size;
  }catch(e){this.releaseTargets();throw e;}
  finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
 }
 render(){
  const r=this.r,gl=r.gl;
  Object.assign(r.stats,{dioramaMode:this.mode,dof:this.dof,dofActive:false,dofPasses:0,dofTargetSize:this.size||null,dofBytes:this.targets.length?this.targets[0].w*this.targets[0].h*8:0,dofError:this.error,focusWorld:this.focus?[...this.focus]:null});
  if(!this.active)return;
  try{
   // Lazy compilation/allocation: NORMAL and OFF incur no extra GPU passes.
   if(!this.cocProgram)this.cocProgram=r.programOf(RPOSTV,DIORAMA_COC_GLSL);
   if(!this.program)this.program=r.programOf(RPOSTV,DIORAMA_BLUR_GLSL);
   this.ensureTargets();
   const preset=DIORAMA_PRESETS[this.dof];
   gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.bindVertexArray(null);
   // CSS-pixel radius scales once with DPR; normalized UVs work at half res.
   const radius=preset.radius*r.canvas.width/r.width;
   for(let i=0;i<2;i++){
    const p=i===0?this.cocProgram:this.program,target=this.targets[i];
    gl.useProgram(p);gl.bindFramebuffer(gl.FRAMEBUFFER,target.fb);gl.viewport(0,0,target.w,target.h);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,i===0?r.target.image:this.targets[0].image);r.int(p,'image',0);
    if(i===0){
     this.setFocusUniforms(p);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,r.target.depth);r.int(p,'depth',1);
    }else{r.uniform(p,'blurRadius',[radius/r.canvas.width,radius/r.canvas.height]);r.int(p,'diskSamples',preset.samples);}
    gl.drawArrays(gl.TRIANGLES,0,3);r.stats.calls++;
   }
   Object.assign(r.stats,{dofActive:true,dofPasses:2,dofTargetSize:this.size,dofBytes:this.targets[0].w*this.targets[0].h*8,focusWorld:[...this.focus]});
  }catch(e){
   this.error=String(e.message||e);this.releaseTargets();Object.assign(r.stats,{dofError:this.error,dofBytes:0,dofTargetSize:null});
   console.warn('Tilt-Shift disabled; using the normal display resolve.',this.error);
  }finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
 }
 bindComposite(program){
  const r=this.r,on=this.active&&this.targets.length===2,gl=r.gl;
  // Bind a valid texture even when disabled, avoiding an incomplete sampler.
  gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,on?this.targets[1].image:r.target.image);r.int(program,'dioramaBlur',3);
  r.uniform(program,'dioramaAmount',on?DIORAMA_PRESETS[this.dof].strength*this.blend:0);
  r.uniform(program,'dioramaDebug',on&&this.debug?1:0);
  if(on)this.setFocusUniforms(program);
 }
}
