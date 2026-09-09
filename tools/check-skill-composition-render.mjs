// Offline DOM + real renderer submission. GL calls are stubbed; this is not browser or GPU verification.
import fs from 'node:fs';import {resolveObjectURL} from 'node:buffer';
import {JSDOM} from 'jsdom';
import {Image,createCanvas} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';
const root=(process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:null)||fileURLToPath(new URL('../',import.meta.url)),html=fs.readFileSync(root+'dist/Bloodline_Legacy_Skill_Composition.html','utf8');
const dom=new JSDOM(html,{url:'https://composition.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;let frame,draws=0;
w.TextDecoder=TextDecoder;w.Blob=Blob;w.URL.createObjectURL=URL.createObjectURL;w.URL.revokeObjectURL=URL.revokeObjectURL;w.Image=class extends Image{set src(v){if(v.startsWith('blob:'))resolveObjectURL(v).arrayBuffer().then(b=>{super.src=Buffer.from(b);});else super.src=v;}};w.requestAnimationFrame=f=>(frame=f,1);w.cancelAnimationFrame=()=>{};
const enums=new Map([['FRAMEBUFFER_COMPLETE',42]]),gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getExtension:()=>null,getUniformLocation:()=>({}),checkFramebufferStatus:()=>enums.get('FRAMEBUFFER_COMPLETE'),drawArrays:()=>draws++,drawArraysInstanced:()=>draws++,drawElements:()=>draws++},{get:(o,k)=>k in o?o[k]:/^[A-Z0-9_]+$/.test(k)?(enums.has(k)||enums.set(k,enums.size+1),enums.get(k)):k.startsWith('create')?()=>({}):()=>{}});
const can=createCanvas(2,2);w.HTMLCanvasElement.prototype.getContext=function(k){return k==='webgl2'?gl:can.getContext('2d');};Object.defineProperty(w.HTMLCanvasElement.prototype,'clientWidth',{get:()=>800});Object.defineProperty(w.HTMLCanvasElement.prototype,'clientHeight',{get:()=>600});
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];code=code.replace("const CompositionLab=(()=>{", "window.__review={SliceRenderer,Travelers,rGeometry,RVERT,RFRAG,SKINVERT};const CompositionLab=(()=>{").replace('getTrial:()=>trial','getRenderer:()=>renderer,getTrial:()=>trial');
code=code.replace('(async()=>{','window.__startup=(async()=>{');w.eval(code);await w.__startup;
if(!w.CompositionLab)throw Error(w.document.getElementById('loading').textContent);
const lab=w.CompositionLab;const captures=[],poses=[],geometry={};let wall=100;let asset;
const baseline=process.argv.includes('--baseline'),readyOnly=process.argv.includes('--ready'),cases=readyOnly?[-1,0,2].map(weapon=>({weapon,ready:true,label:'ready '+weapon})):[0,1,2,3,4,5].map(preset=>({preset,label:'composition '+preset}));
if(!baseline&&!readyOnly)for(const [weapon,skill]of [[0,4001],[1,4002],[2,4003],[3,4004],[4,4005],[5,4006],[0,4016],[4,4017],[1,4019],[2,null]])cases.push({weapon,skill,label:skill?'weapon '+skill:'stowed greatsword'});
const change=(id,value)=>{w.document.getElementById(id).value=value;w.document.getElementById(id).dispatchEvent(new w.Event('change'));};
for(const spec of cases){
 if(spec.preset!==undefined)change('preset',spec.preset);else{change('weapon',spec.weapon);if(spec.skill)change('weapon-skill',spec.skill);else change('preset',0);}
 change('distance',2.5);if(spec.ready)w.document.getElementById('ready').click();const times=[];let fxPeak=0,tipFrames=0,maxTravel=0;
 for(let i=0;i<180;i++){const start=performance.now();frame(wall);if(i>10)times.push(performance.now()-start);wall+=1000/60;
  const r=lab.getRenderer(),p=lab.getTrial().p;fxPeak=Math.max(fxPeak,[...r.fxBatches].filter(([k])=>k.startsWith('skillfx:')||k.startsWith('trail:')).reduce((sum,[,v])=>sum+v.length,0));if(r.weaponTips.has(p.id))tipFrames++;maxTravel=Math.max(maxTravel,Math.hypot(p.x,p.z));
  if(!r.characterMaster.palette.every(Number.isFinite))throw Error('invalid palette '+spec.label);
  if(spec.ready?i%6===0:[20,65,120].includes(i)){const r=lab.getRenderer(),cm=r.characterMaster;asset={attrs:Object.fromEntries(Object.entries(cm.asset.lods[0].attrs).map(([k,v])=>[k,Array.from(v)])),indices:Array.from(cm.asset.lods[0].indices)};const parts=[];
   for(const [type,rows]of r.dynamic){if(!geometry[type]){const g=w.__review.rGeometry(type);geometry[type]={positions:Array.from(g.positions),normals:Array.from(g.normals)};}for(const row of rows)parts.push({type,m:row.slice(0,16),c:[...row.slice(16,19),1]});}
   for(const rec of r.rigs.active)for(let j=0;j<rec.parts.length;j++){const {type}=rec.parts[j];if(!geometry[type]){const g=w.__review.rGeometry(type);geometry[type]={positions:Array.from(g.positions),normals:Array.from(g.normals)};}parts.push({type,m:Array.from(rec.palette.slice(j*24,j*24+16)),c:Array.from(rec.palette.slice(j*24+16,j*24+20))});}
   poses.push({t:lab.getTrial().sim.time,label:spec.label,p:{x:lab.getTrial().p.x,z:lab.getTrial().p.z},palette:Array.from(cm.palette),parts});
  }}
 const r=lab.getRenderer();times.sort((a,b)=>a-b);captures.push({label:spec.label,stats:r.stats,hits:lab.getTrial().sim.events.filter(e=>e.type==='hit').length,fxPeak,tipFrames,maxTravel,cpuMedianMs:times[Math.floor(times.length*.5)],cpuP95Ms:times[Math.floor(times.length*.95)]});if(!spec.ready&&!fxPeak)throw Error('No skill VFX '+spec.label);if(spec.skill&&!tipFrames)throw Error('No held weapon path '+spec.label);if(spec.ready&&(maxTravel>1e-5||r.characterMaster.metrics.animation!=='combat_idle'))throw Error('Stance preview moved the actor or lost combat stance');
}
if(!draws||captures.some(x=>!x.stats.instances))throw Error('empty scene');
console.log(JSON.stringify({kind:'JSDOM real renderer submission, stub GL; not a browser or GPU test',draws,captures},null,2));
fs.writeFileSync(root+'dist/composition-render-check.json',JSON.stringify({kind:'DOM + stub GL; CPU submission only, not GPU FPS',captures},null,2));
fs.writeFileSync(root+'dist/composition-poses.json',JSON.stringify({asset,geometry,frames:poses}));dom.window.close();
