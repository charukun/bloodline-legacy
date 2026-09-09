import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const nativeOptions={skip:process.platform!=='linux'?'Native EGL check runs on Linux / CI (Python 3 + Mesa EGL)':false};
function programs(){
 const result=[],stop={};
 const context=vm.createContext({console,AssetBank:{load(){}},VillageArt:class{},RigRenderer:class{draw(){}}});
 for(const file of ['src/render/tilt-shift.js','src/render/shaders.js','src/weather/weather.js','src/character/golden-master.runtime.js'])vm.runInContext(read(file),context,{filename:file});
 const rig=read('src/character/rig.js');vm.runInContext(rig.slice(0,rig.indexOf('class RigRenderer')),context);
 result.push(...vm.runInContext(`[
  {name:'world/material',vertex:RVERT,fragment:RFRAG},
  {name:'world/depth',vertex:RVERT,fragment:RDEPTH},
  {name:'character/material',vertex:SKINVERT,fragment:RFRAG},
  {name:'character/depth',vertex:SKINVERT,fragment:RDEPTH},
  {name:'post/resolve',vertex:RPOSTV,fragment:RPOSTF},
  {name:'post/focus',vertex:RPOSTV,fragment:DIORAMA_COC_GLSL},
  {name:'post/blur',vertex:RPOSTV,fragment:DIORAMA_BLUR_GLSL}
 ]`,context));
 // Capture actual constructor arguments, before any buffers/textures are needed.
 context.capture={programOf(vertex,fragment){result.push({name:'rain',vertex,fragment});throw stop;}};
 try{vm.runInContext('new RainPass(capture)',context);}catch(error){if(error!==stop)throw error;}
 let count=0;context.capture={programOf(vertex,fragment){result.push({name:'golden-master/'+(count++?'depth':'material'),vertex,fragment});if(count===2)throw stop;return {};}};
 try{vm.runInContext('new CM01.Character(capture)',context);}catch(error){if(error!==stop)throw error;}
 assert.equal(result.length,10);return result;
}
function compile(input){
 const r=spawnSync('python3',[new URL('../tools/check-gles-shaders.py',import.meta.url).pathname],{input:JSON.stringify(input),encoding:'utf8',timeout:20000});
 assert.ifError(r.error);assert.ok(r.stdout,r.stderr);const result=JSON.parse(r.stdout);assert.ok(Array.isArray(result.programs),JSON.stringify(result));return {status:r.status,...result};
}
test('all shipped renderer programs compile and link as original GLSL ES 300',nativeOptions,()=>{
 const r=compile(programs());assert.equal(r.status,0,JSON.stringify(r));assert.equal(r.ok,true);assert.equal(r.programs.length,10);
 console.log(`GLSL ES: ${r.programs.length} programs compiled and linked in ${r.milliseconds}ms (${r.backend})`);
});
test('native compiler rejects the float-plus-int startup regression without desktop coercion',nativeOptions,()=>{
 const original=programs().find(p=>p.name==='world/material');assert.ok(original.fragment.includes('seed+89.'));
 const broken={...original,fragment:original.fragment.replace('seed+89.','seed+89')},r=compile([broken]);
 assert.equal(r.status,1);assert.equal(r.ok,false);assert.match(r.programs[0].error,/type|operand|arithmetic/i);
});

test('native compiler rejects reserved GLSL identifiers in the character material',nativeOptions,()=>{
 const original=programs().find(p=>p.name==='golden-master/material');assert.ok(original.fragment.includes('ormSample'));
 const broken={...original,fragment:original.fragment.replaceAll('ormSample','packed')},r=compile([broken]);
 assert.equal(r.status,1);assert.equal(r.ok,false);assert.match(r.programs[0].error,/PACKED|reserved|syntax/i);
});
