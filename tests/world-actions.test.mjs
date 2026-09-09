import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fixture} from './ui-fixture.cjs';

const cameraCode=['legacy/render_math.js','render/renderer-base.js','render/adapter.js'].map(p=>fs.readFileSync(new URL('../src/'+p,import.meta.url),'utf8')).join('\n');
function camera(width,height,x,z,yaw){
 const ctx=vm.createContext({Float32Array,Math,Map,clamp:(n,a,b)=>Math.max(a,Math.min(n,b))});
 vm.runInContext(cameraCode+'\nglobalThis.RenderClass=SliceRenderer;',ctx);
 const r=Object.assign(Object.create(ctx.RenderClass.prototype),{width,height,camera:{x,z:z-1.5,zoom:16,yaw,pitch:.68},shakeOffset:[0,0]});r.matrix();return r;
}
function rect(node){
 const m=/translate3d\(([-\d.]+)px,([-\d.]+)px,0\)/.exec(node.style.transform);assert.ok(m);
 return {left:+m[1],top:+m[2],right:+m[1]+160,bottom:+m[2]+44};
}
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;

test('all seven activities follow the rendered feet, not the facility or HUD refresh',t=>{
 const {p,g,ui,d,sim,sync}=fixture(t);sim.getRoom(p).actors=[];
 for(const school of g.snapshot.map.schools){
  Object.assign(p,{x:school.x,z:school.z+1});sync();const row=d.querySelector('[data-anchor=feet]'),button=row.querySelector('[data-context=activity]');assert.equal(button.dataset.facility,school.id);
  const r=camera(393,852,p.x,p.z,.42);g.renderer=r;ui.updateWorld(g.snapshot);
  const point=r.project(p.x,.2,p.z),box=rect(row);assert.ok(box.top>=point.y+14-1e-8);assert.equal(row.style.display,'');
  const before=row.style.transform,rendered={...g.snapshot,player:{...g.snapshot.player,x:p.x+.013}};ui.updateWorld(rendered);assert.notEqual(row.style.transform,before);assert.equal(row.querySelector('[data-context=activity]'),button);
 }
});

test('practice starts above the real dummy and moves the stop action to the player feet',t=>{
 const {p,g,ui,d,sim,sync}=fixture(t),dummy=sim.getRoom(p).actors.find(a=>a.kind==='dummy');Object.assign(p,{x:dummy.x,z:dummy.z+1.1});sync();
 const button=d.querySelector('[data-context=practice]'),row=button.parentElement;assert.equal(d.querySelector('#context [data-context=practice]'),null);assert.equal(row.dataset.anchor,'practice:'+dummy.id);
 g.renderer=camera(393,852,p.x,p.z,.42);ui.updateWorld(g.snapshot);const head=g.renderer.project(dummy.x,2.95,dummy.z);assert.ok(rect(row).bottom<head.y);assert.equal(row.style.display,'');
 const before=row.style.transform,rendered={...g.snapshot,actors:g.snapshot.actors.map(a=>a.id===dummy.id?{...a,x:a.x+.05}:a)};ui.updateWorld(rendered);assert.notEqual(row.style.transform,before);assert.equal(row.querySelector('button'),button);
 button.click();assert.deepEqual({...g.walkTarget},{x:dummy.x,z:dummy.z,until:g.walkTarget.until});
 for(let i=0;i<50;i++)sim.tick(1/30);sync();assert.equal(p.autoFight,dummy.id);assert.ok(sim.events.some(e=>e.type==='hit'&&e.kind==='practice'));
 const stop=d.querySelector('[data-context=practice]');assert.match(stop.textContent,/やめる/);assert.equal(stop.parentElement.dataset.anchor,'feet');assert.equal(row.isConnected,false);stop.click();assert.equal(p.autoFight,null);
 sync();assert.equal(d.querySelector('[data-context=practice]').parentElement.dataset.anchor,'practice:'+dummy.id);
});

test('practice stop stays below skill names through camera orbit and portrait/landscape resize',t=>{
 const {p,g,ui,d,w,sim,sync}=fixture(t),dummy=sim.getRoom(p).actors.find(a=>a.kind==='dummy');Object.assign(p,{x:dummy.x,z:dummy.z+1.1});
 for(let i=0;i<120&&!p.combo;i++)sim.tick(1/30);sync();assert.equal(p.autoFight,dummy.id);assert.ok(p.combo);
 for(const [width,height]of [[320,568],[393,852],[852,393],[1280,720]])for(let i=0;i<16;i++){
  const yaw=i*Math.PI/8;w.innerWidth=width;w.innerHeight=height;Object.assign(p,{x:dummy.x+Math.sin(yaw)*1.2,z:dummy.z+Math.cos(yaw)*1.2});g.renderer=camera(width,height,p.x,p.z,yaw);sync();
  const stop=d.querySelector('[data-context=practice]'),row=stop.parentElement,callout=d.querySelector('.combat-callout');
  assert.equal(row.style.display,'');assert.equal(row.dataset.anchor,'feet');assert.ok(row.querySelector('[data-context=activity]'),'nearby facility shares the foot row');
  assert.ok(callout.querySelector('span').textContent,'current skill name remains present');
  // The callout ends at its projected top coordinate (translateY(-100%)).
  assert.ok(rect(row).top>parseFloat(callout.style.top)+14,`${width}x${height} ${yaw}`);
  assert.ok(rect(row).top>=g.renderer.project(p.x,.2,p.z).y+14-1e-8);
  const before=row.style.transform,rendered={...g.snapshot,player:{...g.snapshot.player,x:p.x+.05}};ui.updateWorld(rendered);assert.notEqual(row.style.transform,before);assert.equal(row.querySelector('[data-context=practice]'),stop);
 }
});

test('facility foot row and practice button stay separate through orbit and portrait/landscape resize',t=>{
 const {p,g,ui,d,sim,sync}=fixture(t),dummy=sim.getRoom(p).actors.find(a=>a.kind==='dummy');
 for(const [width,height]of [[320,568],[393,852],[852,393],[1280,720]])for(let i=0;i<16;i++){
  const yaw=i*Math.PI/8;Object.assign(p,{x:dummy.x+Math.sin(yaw)*1.2,z:dummy.z+Math.cos(yaw)*1.2});sync();g.renderer=camera(width,height,p.x,p.z,yaw);ui.updateWorld(g.snapshot);
  const feet=d.querySelector('[data-anchor=feet]'),target=d.querySelector('[data-context=practice]').parentElement;
  assert.equal(feet.style.display,'',`${width}x${height} ${yaw}`);assert.equal(target.style.display,'');
  assert.ok(!overlap(rect(feet),rect(target)),`${width}x${height} ${yaw}`);
  assert.ok(rect(feet).top>=g.renderer.project(p.x,.2,p.z).y+14-1e-8);assert.ok(rect(target).bottom<g.renderer.project(dummy.x,2.95,dummy.z).y);
 }
});

test('stale practice/rescue actions hide and cannot dispatch after range, life or room changes',t=>{
 const {p,g,ui,d,sim,sync}=fixture(t),dummy=sim.getRoom(p).actors.find(a=>a.kind==='dummy');Object.assign(p,{x:dummy.x,z:dummy.z+1});sync();const button=d.querySelector('[data-context=practice]'),row=button.parentElement;
 p.x+=10;ui.updateWorld(g.snapshot);assert.equal(row.style.display,'none');button.click();assert.equal(g.walkTarget,null);
 p.x=dummy.x;sync();const active=d.querySelector('[data-context=practice]');p.activity='study';ui.updateWorld(g.snapshot);assert.equal(active.parentElement.style.display,'none');active.click();assert.equal(g.walkTarget,null);
 p.activity=null;const q=sim.addPlayer('casualty',{owner:'other',name:'フィン'});Object.assign(q,{prologue:false,age:18,x:p.x,z:p.z+1});sim.downPlayer(q,'深手');sync();
 const rescue=d.querySelector('[data-rescue]');assert.equal(rescue.parentElement.dataset.anchor,'rescue:'+q.id);assert.equal(d.querySelector('#rescue-actions [data-rescue]'),null);
 q.carrierId='someone-else';ui.updateWorld(g.snapshot);assert.equal(rescue.parentElement.style.display,'none');rescue.click();assert.ok(!p.rescueTarget);
 g.snapshot={...g.snapshot,actors:[],players:[p]};ui.updateWorld(g.snapshot);assert.equal(active.parentElement.style.display,'none');assert.equal(rescue.parentElement.style.display,'none');
});

test('target actions and pickup immediately hide in menus, offscreen, and when carrying/downed',t=>{
 const {p,g,ui,d,sim,sync}=fixture(t),dummy=sim.getRoom(p).actors.find(a=>a.kind==='dummy');Object.assign(p,{x:dummy.x,z:dummy.z+1});sim.getRoom(p).items=[{id:'near',item:'stone',x:p.x,z:p.z,ready:0}];sync();
 const pickup=d.querySelector('#world-pickup'),target=d.querySelector('[data-context=practice]').parentElement;
 for(const [field,value]of [['modal','skills'],['rescueTarget','other'],['lifeState','downed'],['traversal',{}]]){
  const obj=field==='modal'?ui:p,old=obj[field];obj[field]=value;ui.updateWorld(g.snapshot);assert.ok(pickup.classList.contains('hidden'));assert.equal(target.style.display,'none');obj[field]=old;
 }
 ui.updateWorld(g.snapshot);assert.equal(target.style.display,'');assert.equal(pickup.className,'');
 g.renderer.project=()=>({x:-1,y:300,visible:true});ui.updateWorld(g.snapshot);assert.equal(target.style.display,'none');assert.ok(pickup.classList.contains('hidden'));
});
