// Node integration test of the delivered HTML entry point. GL submissions are
// recorded, not rendered: this is not browser, shader or device verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {createCanvas, Image} from '@napi-rs/canvas';

const root=new URL('../',import.meta.url);
execFileSync(process.execPath,['tools/enemies/build-review.mjs'],{cwd:root});
const html=fs.readFileSync(new URL('dist/Bloodline_Legacy_Enemy_Review.html',root),'utf8');

async function openReview(t){
 const dom=new JSDOM(html),document=dom.window.document,frames=[],errors=[],blobs=new Map();
 t.after(()=>dom.window.close());
 const recorded={draws:0,fail:false},constants=new Map();
 const gl=new Proxy({}, {get(target,key){
  if(key in target)return target[key];
  if(/^[A-Z][A-Z_0-9]*$/.test(key)){if(!constants.has(key))constants.set(key,constants.size+1);return constants.get(key);}
  return target[key]=key==='getExtension'?()=>null:
   key==='checkFramebufferStatus'?()=>gl.FRAMEBUFFER_COMPLETE:
   key==='getShaderParameter'||key==='getProgramParameter'?()=>true:
   key.startsWith('create')||key==='getUniformLocation'?()=>({}):
   key.startsWith('drawArrays')||key.startsWith('drawElements')?()=>{if(recorded.fail)throw Error('test draw failure');recorded.draws++;}:()=>{};
 }});
 const world=document.getElementById('world');
 world.getContext=type=>{assert.equal(type,'webgl2');return gl;};
 const createElement=document.createElement.bind(document);
 document.createElement=type=>type==='canvas'?createCanvas(1,1):createElement(type);
 class AssetImage extends Image{
  set src(value){if(blobs.has(value)){blobs.get(value).arrayBuffer().then(bytes=>{super.src=Buffer.from(bytes);});}else super.src=value;}
 }
 const ctx=vm.createContext({document,Image:AssetImage,Blob,TextDecoder,atob,performance,
  Uint8Array,Uint16Array,Uint32Array,Float32Array,ArrayBuffer,DataView,
  innerWidth:393,innerHeight:650,devicePixelRatio:1,requestAnimationFrame:fn=>frames.push(fn),
  console:{...console,error:e=>errors.push(e)},
  URL:{createObjectURL:blob=>{const url='blob:test-'+blobs.size;blobs.set(url,blob);return url;},revokeObjectURL:url=>blobs.delete(url)}});
 await vm.runInContext(document.querySelector('script').textContent,ctx);
 const deadline=performance.now()+10000;
 while(!frames.length&&!errors.length&&performance.now()<deadline)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(errors.length,0,errors[0]?.stack);assert.equal(frames.length,1,'startup must schedule a frame');
 let now=100;
 const step=()=>{assert.equal(frames.length,1);frames.shift()(now+=250);};
 const change=(id,value)=>{const el=document.getElementById(id);el.value=value;el.dispatchEvent(new dom.window.Event(id==='seek'?'input':'change'));};
 return{document,frames,errors,recorded,step,change,status:()=>document.getElementById('status').textContent};
}

test('delivered enemy review submits its first world frame and both versions in every pose',async t=>{
 const r=await openReview(t);
 r.step();assert(r.recorded.draws>0);assert.match(r.status(),/改善後.*calls.*tris/);
 assert(!r.status().includes('準備完了'));
 for(const version of ['before','after'])for(const pose of ['idle','attack','run','guard','hit','death','lost']){
  r.change('version',version);r.change('pose',pose);
  for(const seek of ['0','430','550']){
   r.change('seek',seek);const before=r.recorded.draws;r.step();
   assert(r.recorded.draws>before,version+' '+pose);assert.match(r.status(),/calls.*tris/);
  }
 }
 for(const form of r.document.querySelectorAll('#form optgroup option')){
  r.change('form',form.value);r.change('pose','sequence');
  assert.equal(r.document.getElementById('pause').textContent,'⏸ 停止');
  for(const seek of ['100','410','700','900']){r.change('seek',seek);r.step();assert.match(r.status(),/calls.*tris/,form.value);}
 }
 r.change('pose','attack');assert.equal(r.document.getElementById('pause').textContent,'⏸ 停止');
 r.change('form','all');
 for(const count of ['8','24'])for(const quality of ['low','medium','high']){
  r.change('count',count);r.change('quality',quality);r.step();assert.match(r.status(),/calls.*tris/);
 }
 assert.equal(r.errors.length,0);
});

test('scheduled render failures are visible and do not reschedule a broken frame',async t=>{
 const r=await openReview(t);r.step();r.recorded.fail=true;r.step();
 assert.match(r.status(),/表示できませんでした: test draw failure/);
 assert.equal(r.frames.length,0);assert.equal(r.errors.length,1);
});
