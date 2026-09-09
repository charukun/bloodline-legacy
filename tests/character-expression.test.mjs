import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {motionRuntime} from './skill-motion-harness.mjs';
const scope=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../src/character/traveler-expression.js',import.meta.url),'utf8'),scope);const E=vm.runInContext('TravelerExpression',scope);
const p={id:'face',alive:true,age:24,appearanceSeed:8,wounds:{},statuses:{},action:'idle',x:0,z:4};
test('face priority follows existing injury, speech, combat and sleep state',()=>{
 const name=(patch,t=10)=>E.target({...p,...patch},t).name;
 assert.equal(name({}),'calm');assert.equal(name({speech:'hello',speechUntil:12}),'talk');assert.equal(name({speech:'hello',speechUntil:9}),'calm');
 assert.equal(name({autoFight:'enemy',speech:'hello',speechUntil:12}),'focused');
 assert.equal(name({wounds:{rightLeg:{severity:'heavy'}},autoFight:'enemy'}),'hurt');
 assert.equal(name({hitReactUntil:11,wounds:{rightLeg:{severity:'heavy'}}}),'pain');
 assert.equal(name({statuses:{sleep:{until:12}},hitReactUntil:11}),'sleep');assert.equal(name({alive:false,hitReactUntil:11}),'downed');
 assert.equal(name({statuses:{poison:{until:9}}}),'calm');
});
test('face transitions settle after healing, repeat samples stay fixed, natural blinks remain bounded',()=>{
 const injured={...p,wounds:{head:{severity:'heavy'}}};let s=E.update(injured,10,0);
 for(let i=0;i<90;i++){const before=s.face[0];s=E.update(p,10+i/30,1/30,s);assert(s.face[0]>=before);}
 assert(Math.abs(s.face[0]-1)<1e-5);const before=JSON.stringify(s);E.update(p,10+89/30,0,s);assert.equal(JSON.stringify(s),before);
 let closed=0;for(let i=0;i<360;i++){const face=E.update(p,i/30,0).uniform;assert(face.every(Number.isFinite));assert(face[0]>=.045&&face[0]<=1);if(face[0]<.2)closed++;}assert(closed>0&&closed<20);
});
test('both LODs mark only existing face geometry and support all expressions without new bones',async()=>{
 const api=await motionRuntime(null,null,true);for(let race=0;race<4;race++){const asset=api.Travelers.prepare(race),cfg=[[1,1,1],[.97,.98,1],[1.01,.95,1.04],[.97,.96,.99]][race];
  for(const lod of asset.lods){for(let region=20;region<=26;region++)assert(lod.attrs._REGION.includes(region));
   for(let i=0;i<lod.attrs._REGION.length;i++){const region=lod.attrs._REGION[i];if(region<20||region>26)continue;assert.equal(lod.attrs.JOINTS_0[i*4],2);const a=Array.from(lod.attrs.POSITION.slice(i*3,i*3+3));const offset=[0,(1.01*asset.body[1]-1.01*.8*cfg[1])*1.5,-.018*cfg[2]*1.5],scale=[.78*cfg[0]*1.5,.8*cfg[1]*1.5,1.05*cfg[2]*1.5],v=a.map((x,k)=>(x-offset[k])/scale[k]);
    for(const face of [[1,0,1,0],[.045,.12,.1,0],[.22,.26,-.65,.25],[.9,.04,1.15,.6]]){const b=E.deform(v,region,face);assert(b.every(Number.isFinite));assert(Math.hypot(...b.map((x,k)=>x-v[k]))<.13);}
   }
  }assert(asset.bind.length<=17);
 }
});
test('persistent wounds preserve planted contacts and snapshots; overlays yield to skill ownership',async()=>{
 const api=await motionRuntime(null,null,true);let maximumError=0,maximumSlip=0;
 for(let race=0;race<4;race++)for(const weapon of [-1,0])for(const part of ['torso','rightArm','leftArm','rightLeg','leftLeg']){
  const r=api.renderer(),c=new api.Travelers.Character(r,race);let prev=[];const template={...p,kind:'player',race,gender:[0,1,0,1][race],weapon,armor:0,prologue:false,dir:0};
  for(let i=0;i<65;i++){const actor=Object.freeze({...template,action:i<45?'run':'idle',z:4+Math.min(i,44)*2/30,wounds:Object.freeze({[part]:Object.freeze({severity:'heavy'})})}),saved=JSON.stringify(actor);r.frame++;c.update(actor,10+i/30);assert.equal(JSON.stringify(actor),saved);assert(c.palette.every(Number.isFinite));assert.equal(c.expression.name,'hurt');assert(c.metrics.pelvisDrop<.38);
   for(let k=0;k<c.footDebug.length;k++){const f=c.footDebug[k],b=prev[k];maximumError=Math.max(maximumError,f.error);if(b&&!f.swing&&!b.swing)maximumSlip=Math.max(maximumSlip,Math.hypot(f.actual[0]-b.actual[0],f.actual[2]-b.actual[2]));}prev=structuredClone(c.footDebug);
  }
  const actor={...template,action:'attack',actionStarted:13,actionUntil:14,weapon:0,wounds:{[part]:{severity:'heavy'}}};r.frame++;c.update(actor,13.43);assert.equal(c.injury.weight,0);assert(c.palette.every(Number.isFinite));assert.equal(E.target({...actor,traversal:{}},13.43).bodyWeight,0);
 }
 assert(maximumError<.035,maximumError);assert(maximumSlip<.012,maximumSlip);
});
