// CI owns browser execution. Fixtures set age/location; all interactions use the game UI.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from '../deploy/node_modules/playwright/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'verification/current/onboarding-polish');await fs.mkdir(out,{recursive:true});
const html=await fs.readFile(path.join(root,'dist/index.html')),version=JSON.parse(await fs.readFile(path.join(root,'deploy/out/dev/version.json'),'utf8'));
const server=http.createServer((req,res)=>{if(req.url.startsWith('/api/')||req.url==='/version.json'){res.setHeader('Content-Type','application/json');return res.end('{"online":false}');}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={head:process.env.GITHUB_SHA,checks:[],errors:[],passed:false,limitations:['Software WebGL; mobile hardware performance and speakers are not verified.','Age, locations and discovery events are prepared by fixtures; input and UI use the real game.']};let browser,page;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});page=await browser.newPage({viewport:{width:1000,height:800},deviceScaleFactor:1});page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));
 const check=async(name,fn)=>{const ok=await page.evaluate(fn);report.checks.push({name,pass:!!ok});assert.ok(ok,name);console.log('PASS '+name);};const shot=async name=>page.screenshot({path:path.join(out,name+'.png')});
 await page.goto('http://127.0.0.1:'+server.address().port+'/?qa');await page.waitForFunction('window.AERIN_QA');
 assert.equal(await page.locator('#clan-screen [data-build-version]').innerText(),version.displayVersion);console.log('PASS lineage build identity');
 await page.locator('#begin-life').click();const pages=await page.locator('.guide-pages i').count();for(let i=0;i<pages;i++)await page.locator('#guide-next').click();await page.waitForFunction('AERIN_QA.app.screen==="game"');
 await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.closed=true;a.stopInput();a.ui.closeModal();a.renderer.setQuality('medium');a.renderer.weather.setOverride('clear');Object.assign(p,{prologue:true,age:0,x:0,z:0,releaseAt:a.sim.time+100,introUntil:a.sim.time+112,motherUntil:0});const r=a.sim.getRoom(p);r.actors=r.actors.filter(e=>e.kind==='dummy');r.waveAt=1e9;
  window.polishDraw=()=>{a.snapshot=a.decorate(a.sim.snapshot(a.playerId,a.seq));for(const e of a.snapshot.events){a.ui.event(e);a.audio.fx(e);}a.seq=a.snapshot.seq;for(let i=0;i<4;i++)a.renderer.render({...a.snapshot,t:a.snapshot.t+i/30},1/30,{freezeCamera:true});a.ui.update(a.snapshot);a.buildingLabels?.update(a.snapshot,a.renderer);};
  window.polishStep=n=>{for(let i=0;i<n;i++)a.sim.tick(1/30);polishDraw();};
  window.polishStation=id=>{const s=a.snapshot.map.schools.find(s=>s.id===id),o={church:[0,.36],sword:[Math.sign(s.x)*1.65,.85],magic:[.8,.9],armory:[-2.18,1.3],forge:[-.6,-.58],hunter:[0,1.3],dance:[0,2.3]}[id];return {x:s.x+o[0],z:s.z+o[1]+1};};a.renderer.camera={x:0,z:0,zoom:16,yaw:.3,pitch:.68};polishDraw();
 });
 await page.mouse.move(420,490);await page.mouse.down();await page.mouse.move(420,570);await page.mouse.up();
 await check('carried flick starts dash',()=>!!AERIN_QA.player().dash);await page.evaluate(()=>polishStep(15));
 await check('carried dash moves with a running parent pose',()=>AERIN_QA.player().action==='dash'&&AERIN_QA.player().stamina<100);await shot('carried-dash');
 await page.mouse.click(420,490);await check('tap stops carried dash',()=>!AERIN_QA.player().dash);
 await page.setViewportSize({width:393,height:852});await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.renderer.resize();Object.assign(p,polishStation('church'),{motherUntil:0});a.sim.tickMother(p,1/30);a.renderer.camera={x:p.x,z:p.z-1,zoom:17,yaw:.1,pitch:.65};polishDraw();});
 await check('church arrival teaches its door with a short maternal line',()=>{const p=AERIN_QA.player();return p.motherText.includes('扉の前')&&[...p.motherText].length<28&&document.querySelector('#mother-dialogue').style.display!=='none';});await shot('mother-church');
 await check('hint button sits below settings with a full touch target',()=>{const h=document.querySelector('#hud-hints').getBoundingClientRect(),s=document.querySelector('#hud-settings').getBoundingClientRect();return h.top>=s.bottom+4&&h.width>=44&&h.height>=44&&h.right<=innerWidth;});
 await page.locator('#hud-hints').click();await check('carried hints are contextual and fit the phone',()=>{const r=document.querySelector('#journey-hints').getBoundingClientRect();return document.querySelector('[data-hint=carried]')&&r.left>=0&&r.right<=innerWidth;});await shot('carried-hints');await page.locator('.panel-close').click();
 await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();Object.assign(p,{prologue:false,age:18,introUntil:-100,releaseAt:-100,motherUntil:0,farewellStage:3},polishStation('church'));polishDraw();});
 await page.locator('[data-context=activity]').click();await page.evaluate(()=>polishStep(30));await check('door action starts prayer and its rising text',()=>AERIN_QA.player().activity==='pray'&&!!document.querySelector('.progress-float'));await shot('prayer-door');
 await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.sim.stopActivity(p);p.x+=2.6;polishDraw();});await check('church side has no prayer action',()=>!document.querySelector('[data-context=activity]'));
 await page.setViewportSize({width:1000,height:800});await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.renderer.resize();Object.assign(p,polishStation('sword'));a.renderer.camera={x:p.x,z:p.z-1,zoom:18,yaw:.15,pitch:.7};polishDraw();});
 await page.locator('[data-context=activity]').click();await page.evaluate(()=>polishStep(30));await check('courtyard lectern starts study',()=>AERIN_QA.player().activity==='study');await shot('dojo-lectern');
 await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.sim.stopActivity(p);const target=a.sim.getRoom(p).actors.find(e=>e.kind==='dummy');Object.assign(p,{x:target.x,z:target.z+1.1,health:100,stamina:100});a.renderer.camera={x:p.x,z:p.z-1,zoom:16,yaw:.25,pitch:.7};polishStep(30);});
 await check('practice combat is active before the discovery',()=>!!AERIN_QA.player().autoFight);
 for(const viewport of [{width:1000,height:800},{width:393,height:852},{width:852,height:393}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>{const a=AERIN_QA.app;a.renderer.resize();polishDraw();a.ui.event({type:'insight',id:60000,player:a.playerId,t:a.snapshot.t});});
  await check('golden discovery remains below combat at '+viewport.width+'x'+viewport.height,()=>{const a=AERIN_QA.app,p=a.snapshot.player,b=document.querySelector('#skill-revelation'),r=b.getBoundingClientRect(),feet=a.renderer.project(p.x,0,p.z);return !a.ui.blocksWorldInput()&&getComputedStyle(b).pointerEvents==='none'&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&(r.top>feet.y+10||r.left>feet.x+60)&&document.querySelectorAll('.revelation-rays i').length===12;});
  await shot('revelation-'+viewport.width+'x'+viewport.height);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await check('reduced motion preserves the seal without moving rays',()=>getComputedStyle(document.querySelector('.revelation-rays i')).display==='none'&&getComputedStyle(document.querySelector('.revelation-word')).animationName==='none');
 await page.evaluate(()=>polishStep(40));await check('combat continues after learning',()=>!!AERIN_QA.player().autoFight);
 await page.setViewportSize({width:393,height:852});await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.stopInput();a.sim.stopActivity(p);Object.assign(p,{x:0,z:0,autoFight:null,stamina:12,health:65,wounds:{torso:{severity:'light',healsAt:p.age+2}}});a.renderer.resize();polishDraw();});
 await page.locator('#hud-hints').click();await check('low stamina and injury produce rest guidance',()=>!!document.querySelector('[data-hint=rest]')&&!!document.querySelector('[data-hint=wounds]'));await shot('rest-hints');await page.locator('.panel-close').click();
 await page.locator('#hud-settings').click();assert.equal(await page.locator('#modal-root [data-build-version]').innerText(),version.displayVersion);await shot('build-version');
 await check('WebGL remains healthy',()=>AERIN_QA.app.renderer.gl.getError()===0);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=error.message;report.state=await page?.evaluate(()=>({player:window.AERIN_QA?.player(),body:document.body.innerText.slice(-1500),reveal:document.querySelector('#skill-revelation')?.getBoundingClientRect().toJSON()})).catch(()=>null);await page?.screenshot({path:path.join(out,'failure.png'),timeout:30000}).catch(()=>{});throw error;}finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
