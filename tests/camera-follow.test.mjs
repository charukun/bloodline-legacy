import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context=vm.createContext({console,performance,clamp:(n,a,b)=>Math.max(a,Math.min(n,b))});
for(const name of ['legacy/render_math.js','render/renderer-base.js','render/adapter.js'])
 vm.runInContext(fs.readFileSync(new URL('../src/'+name,import.meta.url),'utf8'),context);
const Renderer=vm.runInContext('SliceRenderer',context);
function fixture(width=640,height=1000){
 const r=Object.assign(Object.create(Renderer.prototype),{width,height,canvas:{width,height},
  camera:{x:0,z:5,zoom:16.8,yaw:.42,pitch:.68},shakeOffset:[0,0]});
 const p={id:'hero',x:0,z:16,alive:true},s={t:0,player:p,players:[p],actors:[],room:{id:'village'}};
 const frame=(dt=1/60,options={})=>{r.updateCamera(s,dt,options);r.matrix();};
 frame();return{r,p,s,frame};
}
const screen=(r,e)=>{const q=r.project(e.x,.18,e.z);return{x:q.x/r.width,y:q.y/r.height};};

test('reference framing shows facades and anchors feet below center on phone and landscape',()=>{
 for(const [w,h] of [[540,960],[640,1000],[1000,640]]){
  const {r,p}=fixture(w,h),q=screen(r,p);
  assert.ok(Math.abs(q.x-.5)<1e-6);assert.ok(Math.abs(q.y-.62)<1e-6);
  assert.equal(r.camera.pitch,.52);assert.ok(Math.abs(r.camera.yaw-.30)<1e-9);
  const body=(r.project(p.x,.18,p.z).y-r.project(p.x,2.6,p.z).y)/h;
  assert.ok(body>.09&&body<.14,`character frame fraction ${body}`);
 }
});

test('movement, reversal and stopping stay smooth at 30, 60 and 120 Hz',()=>{
 const finals=[];
 for(const hz of [30,60,120]){
  const f=fixture(),positions=[];
  for(let i=1;i<=hz*4;i++){
   const t=i/hz;f.s.t=t;
   f.p.x=t<1?5*t:t<2?5-(t-1)*5:0;
   const before=JSON.stringify(f.s);f.frame(1/hz);
   assert.equal(JSON.stringify(f.s),before,'camera must not write simulation snapshots');
   const q=screen(f.r,f.p);
   assert.ok(q.x>.22&&q.x<.78&&q.y>.42&&q.y<.78,'player remains readable through reversal');
   positions.push({...f.r.camera});
  }
  const speeds=positions.slice(1).map((v,i)=>Math.hypot(v.x-positions[i].x,v.z-positions[i].z)*hz);
  assert.ok(Math.max(...speeds)<8,`no camera jump: ${hz} Hz, ${Math.max(...speeds)} units/s`);
  assert.ok(speeds.at(-1)<.01,'settles when movement stops');
  finals.push(positions[hz*2-1]);
 }
 for(const a of finals)assert.ok(Math.hypot(a.x-finals[0].x,a.z-finals[0].z)<.07,'follow response independent of refresh rate');
});

test('look-ahead follows actual travel, stays bounded, and ignores facing-only turns',()=>{
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const f=fixture();
  for(let i=1;i<=120;i++){f.s.t=i/60;f.p.x=dx*i/60*5;f.p.z=16+dz*i/60*5;f.frame();}
  const lead=f.r.cameraFollow;
  assert.ok(lead.leadX*dx+lead.leadZ*dz>.9);assert.ok(Math.hypot(lead.leadX,lead.leadZ)<=1.25);
 }
 const f=fixture(),start={...f.r.camera};
 for(let i=1;i<=60;i++){f.s.t=i/60;f.p.dir=i;f.frame();}
 assert.deepEqual(f.r.camera,start,'idle direction changes do not move the camera');
});

test('combat keeps the reference angle and both participants inside the useful screen',()=>{
 for(const [dx,dz] of [[3,0],[-3,0],[0,3],[0,-3],[5,3]]){
  const f=fixture(),foe={id:'foe',x:dx,z:16+dz,alive:true};
  f.p.autoFight=foe.id;f.s.actors=[foe];
  for(let i=1;i<=90;i++){f.s.t=i/60;f.frame();}
  assert.ok(Math.abs(f.r.camera.yaw-.30)<1e-9,'contact must not orbit the village');
  for(const e of [f.p,foe]){const q=screen(f.r,e);assert.ok(q.x>.08&&q.x<.92&&q.y>.2&&q.y<.8);}
  const yaw=f.r.camera.yaw;foe.alive=false;f.s.t+=1/60;f.frame();assert.equal(f.r.camera.yaw,yaw);
 }
});

test('teleports and room transfers snap safely, while frontline chunk changes do not reset follow',()=>{
 const f=fixture();f.s.t=.1;f.p.x=30;f.p.z=-80;f.s.room.id='front';f.frame();
 assert.ok(Math.abs(screen(f.r,f.p).y-.62)<1e-6);
 const follow=f.r.cameraFollow;f.r.sceneKey='front3';f.s.t+=1/60;f.p.z-=.1;f.frame();
 assert.equal(f.r.cameraFollow,follow);
 f.s.room.id='village2';f.p.x=0;f.p.z=16;f.s.t+=1/60;f.frame();
 assert.ok(Math.abs(screen(f.r,f.p).x-.5)<1e-6);
});

test('camera freeze, portraits, zoom and world input projection keep their contracts',()=>{
 const f=fixture(),before={...f.r.camera};f.p.x=5;f.s.t=.1;f.frame(1/60,{freezeCamera:true});
 assert.deepEqual(f.r.camera,before);f.frame(1/60,{portrait:true});assert.deepEqual(f.r.camera,before);
 for(let i=1;i<=120;i++){f.s.t=.1+i/60;f.frame(1/60,{zoomOffset:3,yaw:.8,anchorY:.65});}
 assert.ok(Math.abs(f.r.camera.zoom-(12.4*.9+3))<.01);
 assert.ok(Math.abs(screen(f.r,f.p).y-.65)<.001);
 for(const [x,z] of [[5,16],[0,10],[8,20]]){
  const q=f.r.project(x,0,z),world=f.r.pointToWorld(q.x,q.y);
  assert.ok(Math.hypot(world.x-x,world.z-z)<1e-5,'tap projection must match rendered ground');
 }
});

test('reference follow and current skill panel framing compose in portrait and landscape',()=>{
 for(const [w,h,options] of [[540,960,{skillPanelTop:.4}],[1000,640,{skillPanelLeft:.56}]]){
  const f=fixture(w,h),foe={id:'foe',x:2,z:16,alive:true};
  f.p.autoFight=foe.id;f.s.actors=[foe];
  for(let i=1;i<=120;i++){
   f.s.t=i/60;f.frame();f.r.framePanel(f.s,1/60,options);f.r.matrix();
   const q=f.r.project(f.p.x,0,f.p.z),hit=f.r.pointToWorld(q.x,q.y);
   assert.ok(Math.hypot(hit.x-f.p.x,hit.z-f.p.z)<1e-5,'picking matches the composed camera');
  }
  const focus=f.r.project(1,1.1,16);
  if(options.skillPanelTop)assert.ok(Math.abs(focus.y/h-.4*.53)<.001);
  else assert.ok(Math.abs(focus.x/w-.56*.5)<.001);
  assert.ok(Math.abs(f.r.camera.yaw-.3)<1e-9,'panel does not restore the encounter orbit');
  for(let i=0;i<120;i++){f.s.t+=1/60;f.frame();f.r.framePanel(f.s,1/60,{});f.r.matrix();}
  assert.equal(f.r.panelShift,0);assert.equal(f.r.panelShiftSide,0);
 }
});
