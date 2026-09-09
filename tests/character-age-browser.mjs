/* Native game evidence for visual age continuity; no alternate game renderer. */
import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {chromium} from '../deploy/node_modules/playwright/index.mjs';
const out=new URL('../docs/character/ages/evidence/',import.meta.url);await fs.mkdir(out,{recursive:true});
const files={after:await fs.readFile(new URL('../dist/index.html',import.meta.url)),before:await fs.readFile(process.env.CHARACTER_BASELINE)};
let report={base:process.env.CHARACTER_BASE_SHA,backend:null,checks:[],samples:[],performance:[],limitations:['SwiftShader only; native Pixel Fold performance unverified.','Ages/races are fixture setup. Movement, parent release and save/reload use existing handlers.']};
const reviewOnly=process.env.AGE_REVIEW_ONLY==='1',resume=reviewOnly||process.env.AGE_RESUME==='1';if(resume){report=JSON.parse(await fs.readFile(new URL('browser-report.json',out),'utf8'));if(reviewOnly)assert(report.passed,'A review-only run requires a passed functional run');const failed=report.checks.filter(c=>!c.pass);assert(failed.every(c=>c.name.startsWith('keyboard movement')||c.name.startsWith('native ')),'Resume cannot skip failed model or performance capture checks');report.checks=report.checks.filter(c=>c.pass);}
const check=(name,ok,data)=>{report.checks.push({name,pass:!!ok,data});assert(ok,name+' '+JSON.stringify(data));console.log('PASS '+name);};
const server=http.createServer((req,res)=>{const v=new URL(req.url,'http://local').pathname.split('/')[1];res.setHeader('Content-Type',v==='api'?'application/json':'text/html; charset=utf-8');res.end(v==='api'?'{"online":false}':files[v]||'');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pics=new Map();if(resume)for(const name of await fs.readdir(out))if(name.endsWith('.jpg'))pics.set(name.slice(0,-4),await fs.readFile(new URL(name,out)));
try{
 for(const version of resume?['after']:['before','after']){
  const context=await browser.newContext({viewport:{width:600,height:620},deviceScaleFactor:1}),page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+version+'/?qa');await page.waitForFunction('window.AERIN_QA&&AERIN_QA.app.renderer.frame>1');await page.locator('#begin-life').click();const n=await page.locator('.guide-pages i').count();for(let i=0;i<n;i++)await page.locator('#guide-next').click();await page.waitForFunction('AERIN_QA.app.screen==="game"');
  await page.evaluate(()=>{const a=AERIN_QA.app;a.closed=true;a.stopInput();a.ui.closeModal();a.renderer.setQuality('medium');a.renderer.weather.setOverride('clear');a.renderer.diorama.configure('normal','subtle');
   const px=new Uint8Array(4);window.ageDrain=()=>{const g=a.renderer.gl;g.readPixels(0,0,1,1,g.RGBA,g.UNSIGNED_BYTE,px);};
   window.ageDraw=()=>{a.snapshot=a.decorate(a.sim.snapshot(a.playerId,a.seq));a.renderer.render(a.snapshot,1/30,{freezeCamera:true});a.ui.update(a.snapshot);ageDrain();};
   window.ageFixture=(race,age)=>{a.sim.time=100;const p=AERIN_QA.player();Object.assign(p,{x:0,z:4,age,ageFraction:0,race,gender:[0,1,0,1][race],kind:'player',hair:0,appearanceSeed:16,dir:3.42,prologue:false,born:0,introUntil:-100,releaseAt:-100,action:'idle',actionStarted:0,actionUntil:0,alive:true,weapon:-1,armor:0,shield:false,input:{x:0,z:0},dash:null,seated:false,guard:false,autoFight:null,autoSuppressedUntil:0,pendingSkill:null,combo:null,cooldown:0,stun:0,hitstopUntil:0,hitReactUntil:0,wounds:{},statuses:{},health:100,stamina:100,staminaCap:100,activity:null,lifeState:'active',lifespan:100});a.renderer.effects=[];a.renderer.camera={x:0,z:4,zoom:5.5,yaw:3.42,pitch:.35};if(a.renderer.characterMaster)a.renderer.characterMaster.state=null;ageDraw();};
   ageFixture(0,24);
  });
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  if(version==='after')report.backend=await page.evaluate(()=>{const g=AERIN_QA.app.renderer.gl,e=g.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,gpu:g.getParameter(e.UNMASKED_RENDERER_WEBGL)};});
  async function shot(name){await page.evaluate(()=>ageDrain());const data=await page.screenshot({type:'jpeg',quality:84});pics.set(name,data);await fs.writeFile(new URL(name+'.jpg',out),data);}
  for(const race of resume?[]:version==='after'?[0,1,2,3]:[0])for(const age of version==='after'?[4,10,24,55,80]:[4,24,80]){
   const sample=await page.evaluate(({race,age})=>{ageFixture(race,age);const a=AERIN_QA.app,c=a.renderer.characterMaster,before=JSON.stringify(a.sim.exportState());ageDraw();return {race,age,stats:a.renderer.stats,finite:c?.palette.every(Number.isFinite),immutable:before===JSON.stringify(a.sim.exportState()),gl:a.renderer.gl.getError()};},{race,age});
   check(version+' immutable/error-free '+race+'/'+age,sample.immutable&&sample.gl===0,sample.gl);if(version==='after')check('age model '+race+'/'+age,sample.stats.characterMaster?.age===age&&sample.finite);report.samples.push({version,...sample});await shot(version+'-'+race+'-'+age);
  }
  for(const age of resume?[]:[4,24,80]){
   const perf=await page.evaluate(async age=>{ageFixture(0,age);const a=AERIN_QA.app;a.renderer.camera={x:0,z:2.5,zoom:16,yaw:.42,pitch:.68};const times=[],cpu=[];for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);ageDrain();const t=performance.now();ageDraw();if(i>=3){times.push(performance.now()-t);cpu.push(a.renderer.stats.cpuSubmitMs);}}const median=v=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)];return {age,method:"9 completed frames after 3 warmups; synchronous pixel readback; sequential same-scene software comparison",frames:times.length,completedFrameMedianMs:median(times),cpuSubmitMedianMs:median(cpu),calls:a.renderer.stats.calls,triangles:a.renderer.stats.triangles};},age);report.performance.push({version,...perf});console.log('PERF '+version+' '+age+' '+perf.completedFrameMedianMs);
  }
  if(version==='after'){
   // Same native inputs used at short-legged childhood and old age.
   for(const age of reviewOnly?[]:[4,80]){
    await page.evaluate(age=>ageFixture(0,age),age);await page.keyboard.down('d');const result=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player(),x=p.x,z=p.z,rows=[];for(let i=0;i<8;i++){a.updateMove();a.sim.tick(1/30);ageDraw();const c=a.renderer.characterMaster;rows.push({finite:c.palette.every(Number.isFinite),error:c.metrics.contactError});}return {moved:Math.hypot(p.x-x,p.z-z),rows};});await page.keyboard.up('d');check('keyboard movement age '+age,result.moved>.1&&result.rows.every(x=>x.finite&&x.error<.035),result.moved);
    await page.evaluate(()=>{const a=AERIN_QA.app;for(let i=0;i<8;i++){a.updateMove();a.sim.tick(1/30);ageDraw();}});await shot('walk-stop-'+age);
   }
   for(const age of [4,24,80])for(const [name,yaw]of [['side',3.42+Math.PI/2],['back',3.42+Math.PI]]){
    await page.evaluate(({age,yaw})=>{ageFixture(0,age);AERIN_QA.player().dir=6.84-yaw;ageDraw();},{age,yaw});await shot(name+'-'+age);
   }
   if(!reviewOnly){
   // Observe actual existing simulation release, with an approved identity.
   await page.evaluate(()=>{ageFixture(0,0);const a=AERIN_QA.app,p=AERIN_QA.player();a.sim.time=0;Object.assign(p,{prologue:true,born:0,releaseAt:30,introUntil:42,motherNextAt:100});ageDraw();});await shot('cradle');
   const release=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player(),c=a.renderer.characterMaster,lods=c.lods;a.sim.time=28.55;const rows=[];for(let i=0;i<46;i++){a.sim.tick(1/30);if([0,20,40,42,43,44,45].includes(i))ageDraw();rows.push({age:p.age,prologue:p.prologue,finite:c.palette.every(Number.isFinite),sameGeometry:c.lods===lods,error:c.metrics.contactError});}return {age:p.age,prologue:p.prologue,rows};});check('native parent release to age 4',release.age===4&&!release.prologue&&release.rows.every(x=>x.finite&&x.sameGeometry),{age:release.age,prologue:release.prologue});await shot('released');
   const save=await page.evaluate(()=>{ageFixture(3,80);const a=AERIN_QA.app,p=AERIN_QA.player();a.profile.sound=false;a.saveWorld();return {id:p.id,age:p.age,race:p.race};});await page.reload();await page.waitForFunction('window.AERIN_QA&&AERIN_QA.app.renderer.frame>1');await page.locator('#begin-life').click();await page.waitForFunction('AERIN_QA.app.screen==="game"');const restored=await page.evaluate(()=>({id:AERIN_QA.player().id,age:AERIN_QA.player().age,race:AERIN_QA.player().race}));check('native old-age save/reload',JSON.stringify(save)===JSON.stringify(restored),restored);
   }
  }
  check(version+' no browser exceptions',errors.length===0,errors);await context.close();
 }
 // Contact sheets are compositions of unaltered native game screenshots.
 async function sheet(name,rows,labels){const w=300,h=310,canvas=createCanvas(rows[0].length*w,rows.length*(h+30)),g=canvas.getContext('2d');g.fillStyle='#ece9df';g.fillRect(0,0,canvas.width,canvas.height);g.font='16px sans-serif';for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){g.drawImage(await loadImage(pics.get(rows[y][x])),x*w,y*(h+30)+30,w,h);g.fillStyle='#242d29';g.fillText(labels[y][x],x*w+10,y*(h+30)+22);}await fs.writeFile(new URL(name+'.jpg',out),canvas.toBuffer('image/jpeg',85));}
 await sheet('four-races-ages',[0,1,2,3].map(r=>[4,10,24,55,80].map(a=>'after-'+r+'-'+a)),['Human','Elf','Dwarf','Fox'].map(r=>[4,10,24,55,80].map(a=>r+' / '+a)));
 await sheet('human-turnaround',[4,24,80].map(a=>['after-0-'+a,'side-'+a,'back-'+a]),[4,24,80].map(a=>['Age '+a+' / front','side','back']));
 await sheet('before-after',[['before-0-4','before-0-24','before-0-80'],['after-0-4','after-0-24','after-0-80']],[['BEFORE / 4','BEFORE / 24','BEFORE / 80'],['AFTER / 4','AFTER / 24','AFTER / 80']]);
 report.passed=true;
}finally{await fs.writeFile(new URL('browser-report.json',out),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));}
