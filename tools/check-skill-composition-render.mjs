// Offline DOM + real renderer submission. GL calls are stubbed; this is not browser or GPU verification.
import fs from 'node:fs';import {resolveObjectURL} from 'node:buffer';
import {JSDOM} from 'jsdom';
import {Image,createCanvas} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),html=fs.readFileSync(root+'dist/Bloodline_Legacy_Skill_Composition.html','utf8');
const dom=new JSDOM(html,{url:'https://composition.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;let frame,draws=0;
w.TextDecoder=TextDecoder;w.Blob=Blob;w.URL.createObjectURL=URL.createObjectURL;w.URL.revokeObjectURL=URL.revokeObjectURL;w.Image=class extends Image{set src(v){if(v.startsWith('blob:'))resolveObjectURL(v).arrayBuffer().then(b=>{super.src=Buffer.from(b);});else super.src=v;}};w.requestAnimationFrame=f=>(frame=f,1);w.cancelAnimationFrame=()=>{};
const enums=new Map([['FRAMEBUFFER_COMPLETE',42]]),gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getExtension:()=>null,getUniformLocation:()=>({}),checkFramebufferStatus:()=>enums.get('FRAMEBUFFER_COMPLETE'),drawArrays:()=>draws++,drawArraysInstanced:()=>draws++,drawElements:()=>draws++},{get:(o,k)=>k in o?o[k]:/^[A-Z0-9_]+$/.test(k)?(enums.has(k)||enums.set(k,enums.size+1),enums.get(k)):k.startsWith('create')?()=>({}):()=>{}});
const can=createCanvas(2,2);w.HTMLCanvasElement.prototype.getContext=function(k){return k==='webgl2'?gl:can.getContext('2d');};Object.defineProperty(w.HTMLCanvasElement.prototype,'clientWidth',{get:()=>800});Object.defineProperty(w.HTMLCanvasElement.prototype,'clientHeight',{get:()=>600});
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];code=code.replace("const CompositionLab=(()=>{", "window.__review={SliceRenderer,Travelers,rGeometry,RVERT,RFRAG,SKINVERT};const CompositionLab=(()=>{").replace('getTrial:()=>trial','getRenderer:()=>renderer,getTrial:()=>trial');
code=code.replace('(async()=>{','window.__startup=(async()=>{');w.eval(code);await w.__startup;
if(!w.CompositionLab)throw Error(w.document.getElementById('loading').textContent);
const lab=w.CompositionLab;const captures=[],poses=[],geometry={};let wall=100;let asset;
for(const preset of [0,1,2,3,4,5]){
 w.document.getElementById('preset').value=preset;w.document.getElementById('preset').dispatchEvent(new w.Event('change'));
 for(let i=0;i<140;i++){frame(wall);wall+=1000/60;
  if([30,55,80].includes(i)){const r=lab.getRenderer(),cm=r.characterMaster;asset={attrs:Object.fromEntries(Object.entries(cm.asset.lods[0].attrs).map(([k,v])=>[k,Array.from(v)])),indices:Array.from(cm.asset.lods[0].indices)};const parts=[];
   for(const [type,rows]of r.dynamic){if(!geometry[type]){const g=w.__review.rGeometry(type);geometry[type]={positions:Array.from(g.positions),normals:Array.from(g.normals)};}for(const row of rows)parts.push({type,m:row.slice(0,16),c:[...row.slice(16,19),1]});}
   poses.push({t:lab.getTrial().sim.time,label:'preset '+preset,p:{x:lab.getTrial().p.x,z:lab.getTrial().p.z},palette:Array.from(cm.palette),parts});
  }}
 const r=lab.getRenderer();captures.push({preset,stats:r.stats,hits:lab.getTrial().sim.events.filter(e=>e.type==='hit').length});
}
if(!draws||captures.some(x=>!x.stats.instances))throw Error('empty scene');
console.log(JSON.stringify({kind:'JSDOM real renderer submission, stub GL; not a browser or GPU test',draws,captures},null,2));
fs.writeFileSync(root+'dist/composition-poses.json',JSON.stringify({asset,geometry,frames:poses}));dom.window.close();
