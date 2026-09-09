/** CI-owned browser verification. Never attaches to the Work cloud browser.
 * Fixture changes are recorded; actual keyboard/pointer handlers drive actions.
 * Native HTTP origin/localStorage, unmodified production HTML, real WebGL2.
 */
import fs from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from '../deploy/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mode=process.env.CHARACTER_MODE||'all';
assert(['all','functional','performance','motion'].includes(mode),'Unknown verification mode');
const out=path.join(root,'verification/current',mode);
await fs.mkdir(out,{recursive:true});
const files={before:await fs.readFile(process.env.CHARACTER_BASELINE),after:await fs.readFile(path.join(root,'dist/index.html'))};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end('{"online":false}');}
  const key=pathname.split('/')[1];
  if(!files[key]){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(files[key]);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const report={mode,base:process.env.CHARACTER_BASE_SHA||'f94513ed65342de1674a716b33c2ebb4a9c523d1',head:process.env.GITHUB_SHA||null,checks:[],versions:{},passed:false,
  limitations:['SwiftShader is software rendering, not Desktop GPU or Pixel Fold performance approval.','Screenshots and videos require visual review; numeric success is not Golden Master approval.']};
const flush=()=>writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
const check=(name,ok,details)=>{report.checks.push({name,pass:!!ok,details});flush();assert(ok,name+' '+JSON.stringify(details||''));console.log('PASS '+name);};
const groundedSlip=rows=>Math.max(0,...rows.slice(1).flatMap((s,i)=>s.feet.map((f,j)=>{
  const previous=rows[i].feet[j];
  return !f.swing&&!previous.swing?Math.hypot(f.actual[0]-previous.actual[0],f.actual[2]-previous.actual[2]):0;
})));
let browser,page;
async function fixture(page,{close=false}={}){
  await page.evaluate(({close})=>{
    const a=AERIN_QA.app,p=AERIN_QA.player();a.closed=true;a.stopInput();a.ui.closeModal();
    a.sim.time=12;Object.assign(p,{x:0,z:4,age:24,ageFraction:0,gender:0,race:0,kind:'player',hair:0,appearanceSeed:16,dir:.25,
      prologue:false,introUntil:-100,releaseAt:-100,action:'idle',actionStarted:0,actionUntil:0,alive:true,weapon:-1,armor:0,shield:false,
      input:{x:0,z:0},dash:null,seated:false,guard:false,autoFight:null,autoSuppressedUntil:0,pendingSkill:null,combo:null,cooldown:0,stun:0,
      hitstopUntil:0,hitReactUntil:0,wounds:{},statuses:{},health:100,stamina:100,staminaCap:100,activity:null});
    a.snapshot=a.decorate(a.sim.snapshot(p.id,a.seq));a.renderer.effects=[];a.renderer.setQuality('medium');a.renderer.weather.setOverride('clear');a.renderer.diorama.configure('normal','subtle');
    a.renderer.camera=close?{x:0,z:4,zoom:4.6,yaw:.28,pitch:.25}:{x:0,z:2.5,zoom:16,yaw:.42,pitch:.68};
    if(a.renderer.characterMaster)a.renderer.characterMaster.state=null;
    a.renderer.render(a.snapshot,1/30,{freezeCamera:true});a.ui.update(a.snapshot);
    window.characterTrace=[];
    window.characterStep=(n,draw=true)=>{for(let i=0;i<n;i++){a.updateMove();a.sim.tick(1/30);a.snapshot=a.decorate(a.sim.snapshot(a.playerId,a.seq));
      if(draw){a.renderer.render(a.snapshot,1/30,{freezeCamera:true});const cm=a.renderer.characterMaster;
        if(a.renderer.stats.characterMaster)window.characterTrace.push({t:a.sim.time,x:p.x,z:p.z,action:p.action,metrics:{...cm.metrics},finite:cm.palette.every(Number.isFinite),feet:structuredClone(cm.footDebug)});}
    }a.ui.update(a.snapshot);};
  },{close});
  // Drain the old, now-closed frame callback before starting a new live loop.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function shot(name){await page.screenshot({path:path.join(out,name+'.png')});report.lastScreenshot=name;flush();}
try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const version of mode==='motion'||process.env.CHARACTER_AFTER_ONLY==='1'?['after']:['before','after']){
    const context=await browser.newContext({viewport:{width:1000,height:900},deviceScaleFactor:1,...(mode==='performance'||process.env.CHARACTER_NO_VIDEO==='1'?{}:{recordVideo:{dir:out,size:{width:1000,height:900}}})});
    page=await context.newPage();page.setDefaultTimeout(120000);
    const record=report.versions[version]={errors:[],consoleErrors:[],states:[],performance:[]};
    page.on('pageerror',e=>record.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))record.consoleErrors.push(m.text());});
    await page.goto(origin+'/'+version+'/?qa',{waitUntil:'load'});
    await page.waitForFunction('window.AERIN_QA && AERIN_QA.app.renderer.frame>2');
    record.backend=await page.evaluate(()=>{const r=AERIN_QA.app.renderer,g=r.gl,e=g.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,gpu:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),dpr:devicePixelRatio,viewport:[innerWidth,innerHeight]};});
    await page.locator('#begin-life').click();
    for(let i=0;i<3;i++)await page.locator('#guide-next').click();
    await page.waitForFunction('AERIN_QA.app.screen==="game"');
    check(version+' native onboarding',await page.evaluate(()=>AERIN_QA.player().prologue));
    if(mode==='motion'){
      await fixture(page);
      for(const [name,key,ticks]of [['run','d',20],['turn','a',30],['stop',null,30]]){
        if(key)await page.keyboard.down(key);
        await page.evaluate(n=>characterStep(n),ticks);
        if(key)await page.keyboard.up(key);
        const rows=await page.evaluate(n=>characterTrace.slice(-n),ticks);record[name+'Contact']=rows;
        check(name+' pelvis and joints',rows.length===ticks&&rows.every(s=>s.finite&&s.metrics.pelvisDrop<.38&&s.feet.every(f=>f.error<.035)),{maxPelvisDrop:Math.max(...rows.map(s=>s.metrics.pelvisDrop))});
        check(name+' planted soles',groundedSlip(rows)<.012,{maxSlip:groundedSlip(rows)});
        await shot('after-'+name);
      }
      await fixture(page);await page.mouse.move(550,470);await page.mouse.down();await page.mouse.move(565,470);
      await page.evaluate(()=>characterStep(24));await page.mouse.up();
      record.walkContact=await page.evaluate(()=>characterTrace);
      check('walk support and joints',record.walkContact.every(s=>s.finite&&s.metrics.pelvisDrop<.38&&s.feet.every(f=>f.error<.035))&&groundedSlip(record.walkContact)<.012);
      await shot('after-walk');
      check('motion render has no WebGL error',await page.evaluate(()=>AERIN_QA.app.renderer.gl.getError()===0));
      check('motion has no page exception',record.errors.length===0,record.errors);
      check('motion has no game frame exception',await page.evaluate(()=>!AERIN_QA.app.frameError));
      if(page.video())record.video=path.basename(await page.video().path());await context.close();continue;
    }
    if(mode!=='performance'){
    await fixture(page);await shot(version+'-gameplay');
    record.stats=await page.evaluate(()=>AERIN_QA.stats());
    check(version+' WebGL has no error',await page.evaluate(()=>AERIN_QA.app.renderer.gl.getError()===0));
    check(version+' comparison has no diorama blur',await page.evaluate(()=>AERIN_QA.app.renderer.diorama.mode==='normal'&&!AERIN_QA.app.renderer.diorama.active));
    check(version+' target renderer dispatch',(record.stats.characterMaster?.character==='TRAVELER')===(version==='after'));
    await fixture(page,{close:true});await shot(version+'-close');
    if(version==='after'){
      for(const [label,yaw]of [['quarter',1.1],['side',1.82],['back',3.2]]){
        await page.evaluate(yaw=>{const a=AERIN_QA.app;a.renderer.camera.yaw=yaw;a.renderer.render(a.snapshot,0,{freezeCamera:true});},yaw);await shot('after-'+label);
      }
    }
    await fixture(page);
    // Live native input. The frame loop is paused only to make observation timing deterministic.
    await page.keyboard.down('d');await page.evaluate(()=>characterStep(20));
    const move=await page.evaluate(()=>({x:AERIN_QA.player().x,z:AERIN_QA.player().z,animation:AERIN_QA.stats().characterMaster?.animation}));
    await shot(version+'-run');await page.keyboard.up('d');
    check(version+' keyboard movement',Math.hypot(move.x,move.z-4)>.5,move);record.states.push(move);
    if(version==='after'){
      record.runContact=await page.evaluate(()=>characterTrace);
      check('run joints and support reach',record.runContact.length>0&&record.runContact.every(s=>s.finite&&s.metrics.pelvisDrop<.38&&s.feet.filter(f=>!f.swing).every(f=>f.error<.035)));
      check('acceleration preserves grounded soles',groundedSlip(record.runContact)<.012,{maxSlip:groundedSlip(record.runContact)});
      await page.keyboard.down('a');await page.evaluate(()=>characterStep(30));await shot('after-turn');await page.keyboard.up('a');
      record.turnContact=await page.evaluate(()=>characterTrace.slice(-30));
      check('turn keeps finite joints and plausible pelvis height',record.turnContact.every(s=>s.finite&&s.metrics.pelvisDrop<.38&&s.feet.every(f=>f.error<.035)));
      await page.evaluate(()=>characterStep(30));await shot('after-run-stop');record.stopContact=await page.evaluate(()=>characterTrace.slice(-30));
      check('stopping preserves grounded soles',groundedSlip(record.stopContact)<.012,{maxSlip:groundedSlip(record.stopContact)});
    }
    await fixture(page);
    await page.mouse.move(550,470);await page.mouse.down();await page.mouse.move(565,470);
    await page.evaluate(()=>characterStep(24));await shot(version+'-walk');
    const walk=await page.evaluate(()=>({x:AERIN_QA.player().x,z:AERIN_QA.player().z,animation:AERIN_QA.stats().characterMaster?.animation}));
    check(version+' pointer walk',Math.hypot(walk.x,walk.z-4)>.1,walk);record.states.push(walk);await page.mouse.up();
    if(version==='after'){
      record.walkContact=await page.evaluate(()=>characterTrace);
      check('walk joints and support reach',record.walkContact.length>0&&record.walkContact.every(s=>s.finite&&s.metrics.pelvisDrop<.38&&s.feet.filter(f=>!f.swing).every(f=>f.error<.035)));
    }
    await fixture(page);
    await page.mouse.move(550,470);await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();
    check(version+' long press rests',await page.evaluate(()=>AERIN_QA.player().seated));await page.evaluate(()=>characterStep(15));await shot(version+'-rest');
    await page.keyboard.press('t');check(version+' talk wakes',await page.evaluate(()=>!AERIN_QA.player().seated));
    await fixture(page);
    // Move into the existing dummy with native keyboard; no attack command is fabricated.
    await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player(),d=a.sim.getRoom(p).actors.find(e=>e.kind==='dummy');p.x=d.x;p.z=d.z+2.1;p.dir=Math.PI;a.snapshot=a.decorate(a.sim.snapshot(p.id,a.seq));a.renderer.camera={x:d.x,z:d.z+.5,zoom:16,yaw:0,pitch:.68};a.renderer.render(a.snapshot,0,{freezeCamera:true});});
    await page.keyboard.down('w');await page.evaluate(()=>characterStep(10));await page.keyboard.up('w');
    // Settle the existing gameplay combat camera; a forced village yaw hid the
    // actor behind a roof and could not serve as attack visual evidence.
    await page.evaluate(()=>{const a=AERIN_QA.app;a.renderer.render(a.snapshot,1);});
    const combat={charged:false,attack:false,states:[],animations:[]};
    for(let i=0;i<150;i++){
      const state=await page.evaluate(({draw,capturedCharge,capturedPeak})=>{characterStep(1,false);const a=AERIN_QA.app,p=AERIN_QA.player(),u=(a.sim.time-p.actionStarted)/Math.max(.001,p.actionUntil-p.actionStarted),peak=p.action==='attack'&&u>=.3&&u<=.65;
        if(draw||p.pendingSkill&&!capturedCharge||peak&&!capturedPeak)a.renderer.render(a.snapshot,1/30,{freezeCamera:true});
        return {action:p.action,charged:!!p.pendingSkill,target:p.autoFight,peak,animation:AERIN_QA.stats().characterMaster?.animation};
      },{draw:i%3===0,capturedCharge:combat.charged,capturedPeak:combat.peak});
      if(state.charged&&!combat.charged)await shot(version+'-combat-charge');
      if(state.peak&&!combat.peak)await shot(version+'-attack');
      combat.peak||=state.peak;
      combat.charged||=state.charged;combat.attack||=state.action==='attack';combat.target=state.target;
      if(!combat.states.includes(state.action))combat.states.push(state.action);
      if(state.animation&&!combat.animations.includes(state.animation))combat.animations.push(state.animation);
    }
    check(version+' real contact combat',combat.charged&&combat.attack&&combat.peak&&!!combat.target,combat);record.combat=combat;await shot(version+'-combat');
    if(version==='after'){
      await fixture(page,{close:true});
      await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.sim.inflictWound(p,'torso','light',{id:'qa-hit',x:p.x,z:p.z+1,alive:true});characterStep(3);});
      check('hit is consumed from simulation',await page.evaluate(()=>AERIN_QA.player().health<100&&AERIN_QA.stats().characterMaster.animation==='hit'));await shot('after-hit');
      await fixture(page);
      check('renderer is simulation immutable',await page.evaluate(()=>{const a=AERIN_QA.app,b=JSON.stringify(a.sim.exportState());a.renderer.render(a.snapshot,.016,{freezeCamera:true});return b===JSON.stringify(a.sim.exportState());}));
      const scope=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player(),rows=[];for(const [age,gender,race,kind,prologue,expected]of [[17,0,0,'player',false,false],[18,0,0,'player',false,true],[34,0,0,'player',false,true],[35,0,0,'player',false,false],[24,1,0,'player',false,false],[24,0,1,'player',false,false],[24,1,1,'player',false,true],[24,0,2,'player',false,true],[24,1,3,'player',false,true],[24,1,2,'player',false,false],[24,0,3,'player',false,false],[24,0,0,'portrait',false,false],[1,0,0,'player',true,false]]){Object.assign(p,{age,gender,race,kind,prologue});a.snapshot=a.decorate(a.sim.snapshot(p.id,a.seq));a.renderer.render(a.snapshot,.016,{freezeCamera:true});rows.push({age,gender,race,kind,prologue,expected,actual:!!a.renderer.stats.characterMaster});}return rows;});
      check('scope dispatch all boundaries',scope.every(s=>s.expected===s.actual),scope);
      await fixture(page,{close:true});
      const equipment=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player(),rack=a.snapshot.map.schools.find(s=>s.id==='armory');p.x=rack.x;p.z=rack.z+3;const ok=[a.command({type:'equip',slot:'weapon',value:0}),a.command({type:'equip',slot:'armor',value:2}),a.command({type:'equip',slot:'shield',value:true})];a.renderer.camera.x=p.x;a.renderer.camera.z=p.z;a.renderer.render(a.snapshot,.016,{freezeCamera:true});return {ok,weapon:p.weapon,armor:p.armor,shield:p.shield,tip:a.renderer.weaponTips.has(p.id)};});
      check('equipment commands and attachments',equipment.ok.every(Boolean)&&equipment.tip&&equipment.armor===2&&equipment.shield,equipment);await shot('after-equipment');
      const loss=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.sim.inflictWound(p,'rightArm','lost',{id:'qa-hit',x:p.x+1,z:p.z,alive:true});characterStep(3);return p.wounds.rightArm.severity==='lost'&&!a.renderer.weaponTips.has(p.id);});
      check('lost arm removes attachment',loss);await shot('after-limb-loss');
    }
    await fixture(page);
    const saved=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.profile.sound=false;p.name='Character QA';a.saveWorld();return {id:p.id,name:p.name,age:p.age,gender:p.gender,race:p.race,legacy:JSON.stringify(a.sim.legacy(p.owner)),keys:Object.keys(localStorage)};});
    await page.reload({waitUntil:'load'});await page.waitForFunction('window.AERIN_QA && AERIN_QA.app.renderer.frame>2');await page.locator('#begin-life').click();await page.waitForFunction('AERIN_QA.app.screen==="game"');
    const restored=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();return {id:p.id,name:p.name,age:p.age,gender:p.gender,race:p.race,legacy:JSON.stringify(a.sim.legacy(p.owner)),keys:Object.keys(localStorage)};});
    check(version+' native save reload',JSON.stringify(saved)===JSON.stringify(restored),{saved,restored});
    await page.setViewportSize({width:393,height:852});await fixture(page);await shot(version+'-mobile-gameplay');
    check(version+' mobile layout',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2&&!AERIN_QA.app.renderer.gl.isContextLost()));
    await page.setViewportSize({width:1000,height:900});
    }
    // Actual render-loop timestamps, no simulation-clamped dt, no instantaneous FPS averaging.
    // Three steady village runs plus rain/combat. Keep the viewport and workload
    // unchanged; slow software GPU samples extend to obtain at least 12 intervals.
    for(const scenario of mode==='functional'?[]:['clear-1','clear-2','clear-3','rain','combat']){
      await fixture(page);
      await page.evaluate(scenario=>{const a=AERIN_QA.app,p=AERIN_QA.player();if(scenario==='rain')a.renderer.weather.setOverride('rain');
        if(scenario==='combat'){const d=a.sim.getRoom(p).actors.find(e=>e.kind==='dummy');p.x=d.x;p.z=d.z+1.3;}
        const original=a.renderer.render.bind(a.renderer);window.characterPerf=[];
        if(!a.renderer.qaRenderOriginal){a.renderer.qaRenderOriginal=original;a.renderer.render=function(...args){const t=performance.now(),result=this.qaRenderOriginal(...args);if(window.characterPerfOn)window.characterPerf.push({t,calls:this.stats.calls,triangles:this.stats.triangles,cpu:this.stats.cpuSubmitMs});return result;};}
        a.closed=false;a.lastFrame=0;requestAnimationFrame(t=>a.frame(t));
      },scenario);
      await page.waitForTimeout(10000);await page.evaluate(()=>{window.characterPerf=[];window.characterPerfOn=true;window.characterPerfStart=performance.now();});
      try{await page.waitForFunction(()=>performance.now()-window.characterPerfStart>=30000&&window.characterPerf.length>=13,{},{timeout:90000,polling:1000});}
      catch(error){if(error.name!=='TimeoutError')throw error;record.sampleTimeout=scenario;}
      const sample=await page.evaluate(()=>{window.characterPerfOn=false;const a=AERIN_QA.app;a.closed=true;return {frames:window.characterPerf,stats:a.renderer.stats,age:AERIN_QA.player().age};});
      const dt=sample.frames.slice(1).map((f,i)=>f.t-sample.frames[i].t),sorted=[...dt].sort((a,b)=>a-b),percentile=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
      record.performance.push({scenario,frames:sample.frames.length,elapsedMs:dt.reduce((a,b)=>a+b,0),fps:dt.length?dt.length*1000/dt.reduce((a,b)=>a+b,0):null,p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),max:dt.length?Math.max(...dt):null,over100ms:dt.filter(x=>x>100).length,raw:sample});
      flush();check(version+' '+scenario+' rendered frames',dt.length>=12,{frames:dt.length});
      await shot(version+'-perf-'+scenario);
    }
    check(version+' no page exception',record.errors.length===0,record.errors);
    check(version+' no game frame exception',await page.evaluate(()=>!AERIN_QA.app.frameError));
    if(page.video())record.video=path.basename(await page.video().path());await context.close();
    await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
  }
  report.passed=true;
}catch(e){report.failure=e.stack;console.error(e);if(page)await shot('failure').catch(()=>{});process.exitCode=1;}
finally{flush();await browser?.close();await new Promise(resolve=>server.close(resolve));flush();}
