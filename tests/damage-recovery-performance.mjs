/* CPU submission comparison only; no browser GPU or mobile FPS claim. */
import {motionRuntime} from './skill-motion-harness.mjs';
const base='b0174532818b078a9bc59dec83c11b9e06b00bad';
const result={base,environment:process.version,characters:32,composition:'1 CM01, 15 legacy humans, 16 humanoid enemies',warmupFrames:60,sampleFrames:240,runs:3};
for(const revision of [base,null]){
 const api=await motionRuntime(revision),runs=[];
 for(let run=0;run<3;run++){
  const r=api.renderer();r.put=()=>{};const art=new api.VillageArt(r),cm=new api.CM01.Character(r);
  const ps=Array.from({length:32},(_,i)=>({...api.player(),id:'bench'+i,x:i*.2,z:0,kind:i<16?'player':'soldier',action:'hit',hitMotionId:1,hitReactAt:0,hitReactUntil:.72,hitDir:Math.PI/2,hitStrength:1,hitPart:'leftLeg',hitSeverity:'heavy'}));
  const samples=[];
  for(let i=0;i<300;i++){
   const t=i/60;for(const p of ps)if(i%24===0){p.hitMotionId++;p.hitReactAt=t;p.hitReactUntil=t+.72;p.hitDir+=Math.PI;}
   r.frame++;const start=performance.now();cm.update(ps[0],t);for(const p of ps.slice(1))art.doll(p,t,false);if(i>=60)samples.push(performance.now()-start);
  }
  samples.sort((a,b)=>a-b);runs.push({p50:samples[120],p95:samples[228],p99:samples[237]});
 }
 result[revision?'before':'after']=runs;
}
console.log(JSON.stringify(result,null,2));
