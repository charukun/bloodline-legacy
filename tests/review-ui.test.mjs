// Delivered modules with the actual renderer and asset decoders. GL submissions
// are recorded; this test does not claim visual quality or target-device FPS.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
import {JSDOM} from 'jsdom';import {createCanvas,Image} from '@napi-rs/canvas';
import {buildReview} from '../tools/build-review-lab.mjs';
const out=path.resolve('verification/current/review-fixture');await buildReview({out});
const read=name=>fs.readFileSync(path.join(out,name),'utf8');
async function openReview(t,mode,query=''){
 const dom=new JSDOM(read('index.html'),{url:'https://review.test/review/'+mode+query,pretendToBeVisual:true}),d=dom.window.document,frames=[],errors=[],blobs=new Map();t.after(()=>dom.window.close());
 const saved='keep-this-game-save';dom.window.localStorage.setItem('bloodline-save',saved);
 const record={draws:0},constants=new Map();
 const gl=new Proxy({}, {get(target,key){if(key in target)return target[key];if(/^[A-Z][A-Z_0-9]*$/.test(key)){if(!constants.has(key))constants.set(key,constants.size+1);return constants.get(key);}return target[key]=key==='getExtension'?()=>null:key==='checkFramebufferStatus'?()=>gl.FRAMEBUFFER_COMPLETE:key==='getShaderParameter'||key==='getProgramParameter'?()=>true:key.startsWith('create')||key==='getUniformLocation'?()=>({}):key.startsWith('drawArrays')||key.startsWith('drawElements')?()=>record.draws++:()=>{};}});
 d.getElementById('world').getContext=()=>gl;const create=d.createElement.bind(d);d.createElement=type=>type==='canvas'?createCanvas(1,1):create(type);
 class AssetImage extends Image{set src(value){if(blobs.has(value)){blobs.get(value).arrayBuffer().then(b=>{super.src=Buffer.from(b);});}else super.src=value;}}
 class ReviewURL extends URL{static createObjectURL(blob){const key='blob:review-'+blobs.size;blobs.set(key,blob);return key;}static revokeObjectURL(key){blobs.delete(key);}}
 const ctx=vm.createContext({window:dom.window,document:d,location:dom.window.location,navigator:{userAgent:'Recorded GL test',clipboard:{writeText:async()=>{}}},history:dom.window.history,URL:ReviewURL,URLSearchParams,Image:AssetImage,Blob,TextDecoder,atob,btoa,performance,Uint8Array,Uint16Array,Uint32Array,Float32Array,ArrayBuffer,DataView,innerWidth:1200,innerHeight:850,devicePixelRatio:1,requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},setTimeout,console:{...console,error:e=>errors.push(e)},fetch:async url=>{
  const pathname=new URL(url).pathname;if(!pathname.startsWith('/review/assets/'))throw Error('Unexpected network: '+pathname);const bytes=fs.readFileSync(path.join(out,pathname.slice('/review/'.length)));return new Response(bytes);
 }});
 const runtime=read('runtime.mjs').replaceAll('import.meta.url',JSON.stringify('https://review.test/review/runtime.mjs')).replace(/export \{([^}]+)\};\s*$/,'window.R={$1};');
 await vm.runInContext('(async()=>{'+runtime+'})()',ctx);
 const model=read('model.mjs').replace(/^export /gm,'');
 const app=read('app.mjs').replace(/^import[^\n]+\n/,'').replace("await import('./runtime.mjs')",'window.R');
 await vm.runInContext('(async()=>{'+model+'\n'+app+'})()',ctx);
 assert.equal(errors.length,0,errors[0]?.stack);assert.equal(frames.length,1);
 let time=10;const frame=()=>{assert.equal(frames.length,1);frames.shift()(time+=100);assert.equal(errors.length,0,errors[0]?.stack);};
 const change=(id,value,type='change')=>{const el=d.getElementById(id);el.value=value;el.dispatchEvent(new dom.window.Event(type,{bubbles:true}));};
 return {dom,d,frame,change,record,errors,saved};
}
test('skill and combat routes start, apply deep links and draw using shared game assets without touching saves',async t=>{
 for(const mode of ['skills','combat']){
  const r=await openReview(t,mode,'?skill=4001&enemy=rime-guard');r.frame();assert.ok(r.record.draws>0);
  assert.equal(r.d.getElementById('skill').value,'4001');assert.equal(r.d.getElementById('enemy').value,'rime-guard');
  for(const button of ['single','combo','combat','random','previous','restart']){r.d.getElementById(button).click();r.frame();assert.equal(r.d.getElementById('error').textContent,'',button);}
  r.change('speed','.25');r.change('view','1.57');r.d.getElementById('effects').click();r.frame();
  assert.doesNotMatch(r.d.getElementById('readout').textContent,/NaN|undefined/);
  r.d.getElementById('pause').click();r.frame();const pausedDraws=r.record.draws;r.frame();assert.equal(r.record.draws,pausedDraws,'paused scene leaves the GPU idle');
  r.change('view','0');r.frame();assert.ok(r.record.draws>pausedDraws,'paused camera controls still redraw');
  assert.equal(r.dom.window.localStorage.getItem('bloodline-save'),r.saved);assert.equal(r.dom.window.localStorage.length,1);
  for(const a of r.d.querySelectorAll('nav a'))assert.ok(new URL(a.href).searchParams.has('sha'));
 }
});
test('enemy route draws every registered form and pose, vitality loss and lost limbs',async t=>{
 const r=await openReview(t,'enemies','?enemy=scorpion');r.frame();
 for(const o of r.d.getElementById('enemy').options){r.change('enemy',o.value);r.frame();assert.equal(r.d.getElementById('error').textContent,'',o.value);}
 for(const pose of ['idle','run','windup','strike','attack','guard','hit','death']){
  r.change('pose',pose);for(const vitality of ['100','25','0']){r.change('vitality',vitality,'input');r.change('broken','bothLegs');const before=r.record.draws;r.frame();assert.ok(r.record.draws>before);}
 }
 r.change('seek','600','input');r.frame();assert.equal(r.d.getElementById('pause').textContent,'再生');
 assert.equal(r.dom.window.localStorage.getItem('bloodline-save'),r.saved);assert.equal(r.dom.window.localStorage.length,1);
});
