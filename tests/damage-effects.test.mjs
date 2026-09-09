import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});
vm.runInContext(`const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const SkillMotion={groundAt:()=>.1};`,ctx);
for(const file of ['render/combat-presentation.js','legacy/audio.js'])vm.runInContext(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),ctx);
const {CombatPresentation,AudioEngine}=vm.runInContext('({CombatPresentation,AudioEngine})',ctx);
test('player contact follows actual body part, stays at impact, and keeps low-quality effects bounded',()=>{
 const p={id:'hero',age:24,alive:false,x:0,z:0,dir:0},r={camera:{x:0,z:0,yaw:0},quality:'low',effects:[],weatherState:{rain:0},art:{sources:[]}};
 const fx=new CombatPresentation(r),needles=[];fx.needle=(...args)=>needles.push(args);
 const s={t:1.01,player:p,players:[p],actors:[],room:{id:'test'}};
 const burst=part=>{r.effects=[{type:'wound',player:p.id,target:p.id,part,severity:'heavy',dir:0,x:0,z:0,born:1}];needles.length=0;fx.update(s);return {center:[...r.effects[0].contact],count:needles.length};};
 const head=burst('head'),leg=burst('leftLeg');assert(head.center[1]-leg.center[1]>1.5);assert(head.count<=8&&leg.count<=8);
 const old=[...r.effects[0].contact];p.x=3;s.t=1.07;fx.update(s);assert.deepEqual(Array.from(r.effects[0].contact),old,'burst must not follow a recoiling target');
 r.effects=[{type:'guarded',player:p.id,part:'leftArm',born:1,x:0,z:0}];s.t=1.01;needles.length=0;fx.update(s);assert(needles.length>0,'actual guarded event reaches defense VFX');
 s.t=2;fx.update(s);assert.equal(r.effects.length,0);
});
test('nearby enemy impacts cannot throttle local damage audio and rapid local repeats remain bounded',()=>{
 const a=new AudioEngine(),tones=[];Object.assign(a,{enabled:true,ctx:{currentTime:1},listener:{id:'hero',x:0,z:0}});a.tone=(...v)=>tones.push(v);a.noise=()=>{};
 assert(a.fx({type:'wound',player:'remote',x:1,z:0,severity:'light'}));
 assert(a.fx({type:'wound',player:'hero',x:0,z:0,severity:'heavy'}));assert.equal(tones.length,4);
 assert.equal(a.fx({type:'wound',player:'hero',x:0,z:0}),false);
 a.ctx.currentTime=1.1;assert(a.fx({type:'wound',player:'hero',x:0,z:0,severity:'light'}));
});
