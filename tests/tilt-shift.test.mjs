import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context=vm.createContext({console:{warn(){}},Float32Array});
for(const file of ['src/legacy/render_math.js','src/render/tilt-shift.js','src/render/shaders.js'])
 vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),context);
const {TiltShiftPass,rLookAt}=vm.runInContext('({TiltShiftPass,rLookAt})',context);
function renderer(){
 let serial=0;const textures=new Set(),framebuffers=new Set();
 const gl={FRAMEBUFFER_COMPLETE:1,TEXTURE0:100,TEXTURE1:101,TEXTURE3:103,complete:true,
  createTexture(){const x=++serial;textures.add(x);return x;},deleteTexture(x){textures.delete(x);},
  createFramebuffer(){const x=++serial;framebuffers.add(x);return x;},deleteFramebuffer(x){framebuffers.delete(x);},
  checkFramebufferStatus(){return this.complete?1:0;},bindFramebuffer(_kind,fb){this.bound=fb;},
  deleteProgram(){},bindTexture(){},texImage2D(){},texParameteri(){},framebufferTexture2D(){},drawBuffers(){},
  disable(){},bindVertexArray(){},useProgram(){},activeTexture(){},viewport(){},drawArrays(){}};
 const r={gl,canvas:{width:1001,height:853},width:741,height:632,camera:{x:0,z:0,yaw:.42,pitch:.68},viewWidth:20,viewHeight:18,
  target:{image:'scene',depth:'depth'},stats:{calls:0},uniforms:{},compiled:0,
  programOf(){this.compiled++;return{};},int(){},uniform(_p,name,value){this.uniforms[name]=value;}};
 r.view=rLookAt([10,20,30],[0,1,0]);r.resources={textures,framebuffers};return r;
}
const scene=()=>({room:{kind:'village'},player:{x:0,z:0,alive:true,action:'idle'}});
function enabled(){const r=renderer(),d=new TiltShiftPass(r);d.configure('tilt-shift');d.update(scene(),.016);return{r,d};}
function close(a,b,tol=1e-5){assert(Math.abs(a-b)<tol,`${a} != ${b}`);}

test('NORMAL is opt-in: zero shader compilation, target allocation and extra passes',()=>{
 const r=renderer(),d=new TiltShiftPass(r);d.update(scene(),.016);d.render();d.bindComposite({});
 assert.equal(d.mode,'normal');assert.equal(d.active,false);assert.equal(r.compiled,0);
 assert.equal(r.resources.textures.size,0);assert.equal(r.stats.calls,0);assert.equal(r.uniforms.dioramaAmount,0);
});
test('invalid settings fail atomically',()=>{
 const {d}=enabled();assert.throws(()=>d.configure('bad','strong'));
 assert.equal(d.mode,'tilt-shift');assert.equal(d.dof,'subtle');
 assert.throws(()=>d.configure('normal','bad'));assert.equal(d.mode,'tilt-shift');
});
for(const [name,change,options]of [
 ['front',s=>s.room.kind='front',{}],['unknown room',s=>delete s.room,{}],
 ['outside village',s=>s.player.z=-29,{}],['auto combat',s=>s.player.autoFight='enemy',{}],
 ['attack',s=>s.player.action='attack',{}],['telegraph',s=>s.player.telegraph={},{}],
 ['death',s=>s.player.alive=false,{}],['clan',()=>{},{clan:true}],['portrait',()=>{},{portrait:true}]
])test(`${name} bypasses DOF and resets focus`,()=>{
 const {r,d}=enabled(),s=scene();change(s);d.update(s,.016,options);d.render();d.bindComposite({});
 assert.equal(d.active,false);assert.equal(d.blend,0);assert.equal(d.focus,null);assert.equal(r.uniforms.dioramaAmount,0);
});
test('logical portrait renderer and lineage suspension cannot inherit village DOF',()=>{
 const {r,d}=enabled();r.logicalSize={width:224,height:280};d.update(scene(),.016);assert.equal(d.active,false);
 r.logicalSize=null;d.suspended=true;d.update(scene(),.016);assert.equal(d.active,false);
 d.suspended=false;d.update(scene(),.016);assert.equal(d.active,true);
});
test('snapshot and player remain unchanged, including nested gameplay/save fields',()=>{
 const {d}=enabled(),s=scene();s.player.inventory=['wood'];s.player.skills={1:2};s.map={seed:7349};
 Object.freeze(s.player.inventory);Object.freeze(s.player.skills);Object.freeze(s.player);Object.freeze(s.map);Object.freeze(s);
 const before=JSON.stringify(s);d.update(s,.016);d.render();assert.equal(JSON.stringify(s),before);
});
test('focus transitions are smooth and independent of 30/60 Hz frame cadence',()=>{
 const a=enabled().d,b=enabled().d,s=scene();s.player.x=4;s.player.z=-2;
 a.update(s,1/30);assert(a.focus[0]>0&&a.focus[0]<4);
 for(let i=1;i<30;i++)a.update(s,1/30);for(let i=0;i<60;i++)b.update(s,1/60);
 for(let i=0;i<3;i++)close(a.focus[i],b.focus[i],1e-10);
 assert(Math.abs(a.focus[0]-4)<.001);
});
test('real-time focus follows moving player with bounded lag',()=>{
 const {d}=enabled(),s=scene();let previous=0;
 for(let i=1;i<=180;i++){s.player.x=i/60*2;d.update(s,1/60);assert(d.focus[0]>=previous);assert(d.focus[0]<=s.player.x);previous=d.focus[0];}
 assert(s.player.x-d.focus[0]<.25);
});
test('teleports and scene returns snap focus, invalid/negative deltas never produce NaN',()=>{
 const {d}=enabled(),s=scene();s.player.x=40;d.update(s,.016);assert.equal(d.focus[0],40);
 for(const dt of [NaN,Infinity,-3,0]){d.update(s,dt);assert(d.focus.every(Number.isFinite));assert(Number.isFinite(d.blend));}
});
test('focus plane reconstructs world depth across camera rotation, zoom and aspect',()=>{
 for(const yaw of [0,.42,2.1])for(const pitch of [.48,.78])for(const aspect of [.46,1.6]){
  const {r,d}=enabled();r.camera.yaw=yaw;r.camera.pitch=pitch;r.viewHeight=20;r.viewWidth=20*aspect;
  const target=[3,1,-4],eye=[target[0]+Math.sin(yaw)*Math.cos(pitch)*38,target[1]+Math.sin(pitch)*38,target[2]+Math.cos(yaw)*Math.cos(pitch)*38];
  r.view=rLookAt(eye,target);d.focus=[2,1.1,-3];const u=d.focusUniforms(),v=r.view;
  const viewPoint=p=>[0,1,2].map(i=>v[i]*p[0]+v[4+i]*p[1]+v[8+i]*p[2]+v[12+i]);
  const distance=p=>{const view=viewPoint(p),uv=[view[0]/r.viewWidth+.5,view[1]/r.viewHeight+.5],depth=(-view[2]-.1)/119.9;
   const reconstructed=[(uv[0]-.5)*u.focusSpan[0],(uv[1]-.5)*u.focusSpan[1],-(.1+depth*119.9)];
   return reconstructed.reduce((a,x,i)=>a+(x-u.focusView[i])*u.focusNormal[i],0);};
  close(distance(d.focus),0); // Center and full character height stay in gameplay band.
  assert(Math.abs(distance([2,3,-3]))<u.focusWidth);
  close(distance([2+Math.sin(yaw)*15,1.1,-3+Math.cos(yaw)*15]),15*Math.cos(.3),2e-5);
  close(distance([2-Math.sin(yaw)*15,1.1,-3-Math.cos(yaw)*15]),-15*Math.cos(.3),2e-5);
  // At identical screen XY, differing depth yields differing focus (not top/bottom blur).
  assert(Math.abs(u.focusNormal[2])>.6);
 }
});
test('SUBTLE/STRONG reuse two half-resolution targets, OFF frees them',()=>{
 const {r,d}=enabled();d.render();assert.equal(r.compiled,1);assert.equal(r.resources.textures.size,2);
 assert.equal(d.size,'501x427');assert.equal(r.stats.dofBytes,501*427*8);assert.equal(r.stats.dofPasses,2);
 const ids=[...r.resources.textures];d.configure(undefined,'strong');d.render();assert.deepEqual([...r.resources.textures],ids);
 d.configure(undefined,'off');d.render();d.bindComposite({});assert.equal(r.resources.textures.size,0);
 assert.equal(r.resources.framebuffers.size,0);assert.equal(r.stats.dofPasses,0);assert.equal(r.uniforms.dioramaAmount,0);
});
test('repeated mode changes and odd-size resizes do not retain abandoned GPU targets',()=>{
 const {r,d}=enabled();for(let i=0;i<20;i++){
  r.canvas.width=393+i;r.canvas.height=852+i;d.configure('tilt-shift','subtle');d.update(scene(),.016);d.render();
  assert.equal(r.resources.textures.size,2);assert.equal(r.resources.framebuffers.size,2);
  d.configure('normal');assert.equal(r.resources.textures.size,0);assert.equal(r.resources.framebuffers.size,0);
 }
 d.dispose();assert.equal(d.program,null);
});
test('retained targets remain counted while combat/lineage temporarily bypasses blur',()=>{
 const {r,d}=enabled();d.render();const bytes=r.stats.dofBytes;d.suspended=true;d.update(scene(),.016);d.render();
 assert.equal(r.stats.dofActive,false);assert.equal(r.stats.dofBytes,bytes);assert.equal(r.stats.dofPasses,0);
});
test('framebuffer allocation failure safely resolves through NORMAL, without leaks or per-frame retries',()=>{
 const {r,d}=enabled();r.gl.complete=false;d.render();d.bindComposite({});
 assert(d.error);assert.equal(d.active,false);assert.equal(r.resources.textures.size,0);assert.equal(r.resources.framebuffers.size,0);
 assert.equal(r.uniforms.dioramaAmount,0);assert.equal(r.stats.dofBytes,0);d.render();assert.equal(r.compiled,1);
 r.gl.complete=true;d.configure('normal');d.configure('tilt-shift');d.update(scene(),.016);d.render();assert.equal(r.stats.dofActive,true);
});
test('null GPU allocation handles fall back before binding the default framebuffer as a blur target',()=>{
 for(const method of ['createTexture','createFramebuffer']){
  const {r,d}=enabled();r.gl[method]=()=>null;d.render();d.bindComposite({});
  assert.match(d.error,/allocation failed/);assert.equal(r.stats.dofPasses,0);
  assert.equal(r.resources.textures.size,0);assert.equal(r.resources.framebuffers.size,0);
  assert.equal(r.uniforms.dioramaAmount,0);
 }
});
