/* Targeted in-game captures and same-scene software-render timing. No test doubles. */
import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';
import {encodeCharacterProof} from '../tools/character-proof-images.mjs';
import {chromium} from '../deploy/node_modules/playwright/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'docs/character/travelers/evidence');await fs.mkdir(out,{recursive:true});
const perfOnly=process.env.CHARACTER_PERFORMANCE_ONLY==='1',captureOnly=process.env.CHARACTER_CAPTURE_ONLY==='1';
const files={before:await fs.readFile(process.env.CHARACTER_BASELINE),after:await fs.readFile(path.join(root,'dist/index.html'))};
const server=http.createServer((req,res)=>{const key=new URL(req.url,'http://local').pathname.split('/')[1];if(key==='api'){res.setHeader('Content-Type','application/json');return res.end('{"online":false}');}if(!files[key]){res.writeHead(404);return res.end();}res.setHeader('Content-Type','text/html');res.end(files[key]);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={base:process.env.CHARACTER_BASE_SHA,head:process.env.GITHUB_SHA||null,backend:'Chromium / SwiftShader',scope:'four local young player samples',versions:{},limitations:['Software renderer timings do not certify Pixel Fold or native GPU FPS.','Fixture positioning and state sampling are distinct from the keyboard/input verification.']};
if(captureOnly)report.versions=JSON.parse(await fs.readFile(path.join(out,'browser-review.json'),'utf8')).versions;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const version of captureOnly?['after']:['before','after']){
 const context=await browser.newContext({viewport:{width:760,height:760},deviceScaleFactor:1}),page=await context.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+version+'/?qa');await page.waitForFunction('window.AERIN_QA&&AERIN_QA.app.renderer.frame>1');await page.locator('#begin-life').click();for(let i=0;i<3;i++)await page.locator('#guide-next').click();await page.waitForFunction('AERIN_QA.app.screen==="game"');
 await page.evaluate(()=>{const a=AERIN_QA.app;a.closed=true;a.stopInput();a.ui.closeModal();a.sim.time=12;const p=AERIN_QA.player();Object.assign(p,{x:0,z:4,age:24,ageFraction:0,gender:0,race:0,kind:'player',hair:0,appearanceSeed:16,dir:3.42,prologue:false,introUntil:-100,releaseAt:-100,action:'idle',actionStarted:0,actionUntil:0,alive:true,weapon:-1,armor:0,shield:false,input:{x:0,z:0},dash:null,seated:false,guard:false,autoFight:null,autoSuppressedUntil:0,pendingSkill:null,combo:null,cooldown:0,stun:0,hitstopUntil:0,hitReactUntil:0,wounds:{},statuses:{},health:100,stamina:100,staminaCap:100,activity:null});a.snapshot=a.decorate(a.sim.snapshot(p.id,a.seq));a.renderer.effects=[];a.renderer.setQuality('medium');a.renderer.weather.setOverride('clear');a.renderer.diorama.configure('normal','subtle');a.renderer.camera={x:0,z:2.5,zoom:16,yaw:.42,pitch:.68};
 window.travelerDraw=()=>{a.snapshot=a.decorate(a.sim.snapshot(p.id,a.seq));a.renderer.render(a.snapshot,1/30,{freezeCamera:true});a.ui.update(a.snapshot);};travelerDraw();});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 if(!perfOnly)await page.screenshot({path:path.join(out,version+'-gameplay.png')});
 await page.evaluate(()=>{AERIN_QA.app.renderer.camera={x:0,z:4,zoom:5.0,yaw:3.42,pitch:.40};travelerDraw();});if(!perfOnly)await page.screenshot({path:path.join(out,version+'-close.png')});
 const perf=captureOnly?report.versions[version].perf:await page.evaluate(async()=>{const a=AERIN_QA.app;a.renderer.camera={x:0,z:2.5,zoom:16,yaw:.42,pitch:.68};const intervals=[],cpu=[],gpu=[],pixel=new Uint8Array(4),sync=()=>a.renderer.gl.readPixels(0,0,1,1,a.renderer.gl.RGBA,a.renderer.gl.UNSIGNED_BYTE,pixel);
 for(let i=0;i<24;i++){await new Promise(requestAnimationFrame);sync();const now=performance.now();travelerDraw();const submit=performance.now()-now;sync();if(i>=4){intervals.push(performance.now()-now);cpu.push(submit);if(a.renderer.gpuMs!=null)gpu.push(a.renderer.gpuMs);}}
 const median=v=>v.length?[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)]:null;return{method:'20 completed renders after 4 warm-up frames; synchronous one-pixel readback brackets each frame; sequential baseline/current, no competing browser',frames:intervals.length,medianFrameMs:median(intervals),medianCpuSubmitMs:median(cpu),medianGpuMs:median(gpu),stats:{...a.renderer.stats}};});
 report.versions[version]={perf,errors};
 if(version==='after'&&!perfOnly){
  report.samples=[];
  for(const [race,name]of ['human','elf','dwarf','fox'].entries()){
   const result=await page.evaluate(race=>{const a=AERIN_QA.app,p=AERIN_QA.player();Object.assign(p,{race,gender:[0,1,0,1][race],x:0,z:4,weapon:-1,armor:0,shield:false,action:'idle',seated:false,activity:null});a.renderer.camera={x:0,z:4,zoom:5.0,yaw:3.42,pitch:.40};travelerDraw();return {metrics:a.renderer.characterMaster.metrics,gl:a.renderer.gl.getError()};},race);assert.equal(result.gl,0);report.samples.push(result);await page.screenshot({path:path.join(out,name+'-close.png')});
  }
  for(const [label,fields]of [['armed',{race:0,gender:0,weapon:0,armor:2,shield:true}],['rest',{weapon:-1,armor:0,shield:false,seated:true,sitSince:10}],['rescue',{seated:false,rescueTarget:'fixture-rescue'}],['downed',{rescueTarget:null,lifeState:'downed',downedAt:10}]]){
   await page.evaluate(fields=>{Object.assign(AERIN_QA.player(),fields);travelerDraw();},fields);await page.screenshot({path:path.join(out,label+'.png')});
  }
  await page.evaluate(()=>{const p=AERIN_QA.player();Object.assign(p,{lifeState:'active',downedAt:null,x:0,z:4,action:'run',dir:3.42});AERIN_QA.app.renderer.characterMaster.state=null;});
  for(let i=0;i<8;i++){await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.sim.time+=1/24;p.x-=.02;p.z-=.065;travelerDraw();});await page.screenshot({path:path.join(out,'walk-'+i+'.png')});}
  report.immutable=await page.evaluate(()=>{const a=AERIN_QA.app,b=JSON.stringify(a.sim.exportState());travelerDraw();return b===JSON.stringify(a.sim.exportState());});assert(report.immutable);
 }
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(await page.evaluate(()=>AERIN_QA.app.renderer.gl.getError()),0);await context.close();console.log(version+' captured');
}if(perfOnly){const prior=JSON.parse(await fs.readFile(path.join(out,'browser-review.json'),'utf8'));report.samples=prior.samples;report.immutable=prior.immutable;}await fs.writeFile(path.join(out,'browser-review.json'),JSON.stringify(report,null,2));if(!perfOnly)await encodeCharacterProof();console.log(JSON.stringify(report.versions));}finally{await browser.close();await new Promise(r=>server.close(r));}
