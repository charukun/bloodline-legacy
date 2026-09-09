// CI-owned browser only. Production HTML/WebGL and real UI input; QA positions
// and fixed simulation ticks make the five-year wait repeatable without a timer.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from '../deploy/node_modules/playwright/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'verification/current/ship');
await fs.mkdir(out,{recursive:true});
const html=await fs.readFile(path.join(root,'dist/index.html'));
const server=http.createServer((req,res)=>{if(req.url.startsWith('/api/')||req.url==='/version.json'){res.setHeader('Content-Type','application/json');return res.end('{"online":false}');}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={head:process.env.GITHUB_SHA,backend:'Chromium / SwiftShader',checks:[],errors:[],passed:false,limitations:['QA fixtures position adult players and advance the simulation clock.','Software WebGL verifies rendering and input, not mobile hardware performance.','The sea passage uses the existing direct transition to the front.']};
let browser,page;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1000,height:800},deviceScaleFactor:1});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/?qa');await page.waitForFunction('window.AERIN_QA');
 await page.locator('#begin-life').click();const pages=await page.locator('.guide-pages i').count();assert.ok(pages>0&&pages<=10);for(let i=0;i<pages;i++)await page.locator('#guide-next').click();await page.waitForFunction('AERIN_QA.app.screen==="game"');
 await page.evaluate(()=>{
  const a=AERIN_QA.app,p=AERIN_QA.player();a.closed=true;a.stopInput();a.ui.closeModal();a.renderer.setQuality('medium');a.renderer.weather.setOverride('clear');
  Object.assign(p,{age:24,ageFraction:0,prologue:false,introUntil:-100,releaseAt:-100,x:0,z:27,stun:0,cooldown:0,action:'idle',actionUntil:0,activity:null});
  a.renderer.camera={x:0,z:37,zoom:30,yaw:0,pitch:.7};
  window.shipDraw=()=>{a.snapshot=a.decorate(a.sim.snapshot(p.id,a.seq));a.renderer.render(a.snapshot,1/30,{freezeCamera:true});a.ui.update(a.snapshot);const g=a.renderer.gl;g.readPixels(0,0,1,1,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array(4));};
  window.shipStep=n=>{for(let i=0;i<n;i++){a.updateMove();a.sim.tick(1/30);}shipDraw();};shipDraw();
 });
 const check=async(name,fn)=>{const value=await page.evaluate(fn);report.checks.push({name,pass:!!value});assert.ok(value,name);console.log('PASS '+name);};
 const shot=async name=>page.screenshot({path:path.join(out,name+'.png')});
 await page.keyboard.down('s');await page.evaluate(()=>shipStep(72));await page.keyboard.up('s');
 await check('keyboard walks from pier onto raised deck',()=>{const p=AERIN_QA.player();return p.queued&&p.z>34&&p.supportHeight===1.2&&!p.traversal;});
 await shot('boarded');
 await page.keyboard.down('w');await page.evaluate(()=>shipStep(84));await page.keyboard.up('w');
 await check('keyboard disembarks without a reservation button',()=>{const p=AERIN_QA.player();return !p.queued&&p.z<29.5&&!document.querySelector('[data-context=boat]');});
 await page.evaluate(()=>{const p=AERIN_QA.player();Object.assign(p,{x:-3.4,z:39.1,supportHeight:1.2});AERIN_QA.app.renderer.camera={x:0,z:44,zoom:30,yaw:.65,pitch:.78};shipDraw();});
 await shot('whole-ship');
 await page.setViewportSize({width:393,height:852});
 await page.evaluate(()=>{const a=AERIN_QA.app;a.renderer.resize();a.renderer.camera={x:-3.4,z:36.5,zoom:15,yaw:.3,pitch:.52};shipDraw();});
 await page.locator('[data-context=activity][data-facility=shipPrayer]').click();await page.evaluate(()=>shipStep(120));
 await check('foot action starts actual prayer and learning',()=>{const p=AERIN_QA.player();return p.activity==='pray'&&p.activityClock>3&&p.skillLife.serial>0;});
 await shot('portrait-prayer');await page.locator('[data-context=activity]').click();
 await page.evaluate(()=>{const p=AERIN_QA.player(),a=AERIN_QA.app,d=a.snapshot.actors.find(d=>d.shipStation===1);Object.assign(p,{x:d.x,z:d.z-.95,supportHeight:1.2});a.renderer.camera={x:3.5,z:41,zoom:15,yaw:.3,pitch:.52};shipDraw();});
 await page.locator('[data-context=practice]').click();await page.evaluate(()=>shipStep(120));
 await check('practice UI engages the selected ship dummy',()=>{const a=AERIN_QA.app,p=AERIN_QA.player(),d=a.snapshot.actors.find(d=>d.shipStation===1);return p.autoFight===d.id&&a.sim.events.some(e=>e.kind==='practice'&&e.target===d.id);});
 await shot('portrait-practice');
 await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.stopInput();Object.assign(p,{x:-3.6,z:44.7,autoFight:null,cooldown:0,stamina:10,staminaCap:35});a.renderer.camera={x:-3.6,z:42,zoom:15,yaw:.3,pitch:.52};shipDraw();});
 await page.keyboard.press('r');await page.evaluate(()=>shipStep(90));
 await check('seated deck recovery',()=>AERIN_QA.player().seated&&AERIN_QA.player().stamina>30);await shot('portrait-rest');
 await page.evaluate(()=>{const a=AERIN_QA.app;a.sim.time=a.sim.boatInterval-.05;a.saveWorld();a.loadMode();a.screen='game';AERIN_QA.step(4);a.renderer.render(a.snapshot,1/30);a.ui.update(a.snapshot);});
 await check('saved passenger departs once at five-year boundary',()=>{const a=AERIN_QA.app;return a.snapshot.room.kind==='front'&&a.sim.events.filter(e=>e.type==='depart').length===1&&AERIN_QA.player().supportHeight===0;});
 await shot('arrival');await check('no WebGL errors',()=>AERIN_QA.app.renderer.gl.getError()===0);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=error.message;report.state=await page?.evaluate(()=>({screen:window.AERIN_QA?.app.screen,player:window.AERIN_QA?.player(),body:document.body.innerText.slice(-2000)})).catch(()=>null);await page?.screenshot({path:path.join(out,'failure.png'),timeout:30000}).catch(()=>{});throw error;}finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
