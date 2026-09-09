/* Focused native gameplay evidence, using the actual renderer and simulation. */
import fs from 'node:fs/promises';import http from 'node:http';import assert from 'node:assert/strict';
import {chromium} from '../deploy/node_modules/playwright/index.mjs';import {createCanvas,loadImage} from '@napi-rs/canvas';
const out=new URL('../docs/character/expression/evidence/',import.meta.url);await fs.mkdir(out,{recursive:true});
const after=await fs.readFile(new URL('../dist/index.html',import.meta.url)),before=await fs.readFile(process.env.CHARACTER_BASELINE);
const server=http.createServer((q,s)=>{s.setHeader('Content-Type',q.url.includes('/api/')?'application/json':'text/html');s.end(q.url.includes('/api/')?'{"online":false}':q.url.startsWith('/before')?before:after);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={base:process.env.CHARACTER_BASE_SHA,checks:[],states:[],limitations:['Chromium / SwiftShader; native Pixel Fold performance unverified.','Race, camera and pose fixtures are deterministic; wounds, healing and input are verified through the actual game runtime.']};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const check=(name,ok,details)=>{report.checks.push({name,pass:!!ok,details});assert(ok,name+' '+JSON.stringify(details));console.log('PASS '+name);};
const pictures={};
try{
 for(const version of ['before','after']){
  const context=await browser.newContext({viewport:{width:560,height:600},deviceScaleFactor:1}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(120000);
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+version+'/?qa');await page.waitForFunction('window.AERIN_QA&&AERIN_QA.app.renderer.frame>1');await page.locator('#begin-life').click();const n=await page.locator('.guide-pages i').count();for(let i=0;i<n;i++)await page.locator('#guide-next').click();await page.waitForFunction('AERIN_QA.app.screen==="game"');
  await page.evaluate(()=>{const a=AERIN_QA.app;a.closed=true;a.stopInput();a.ui.closeModal();a.renderer.setQuality('medium');a.renderer.weather.setOverride('clear');a.renderer.diorama.configure('normal','subtle');const pixel=new Uint8Array(4);
   window.expressionDraw=()=>{a.snapshot=a.decorate(a.sim.snapshot(a.playerId,a.seq));a.renderer.render(a.snapshot,1/30,{freezeCamera:true});a.ui.update(a.snapshot);const g=a.renderer.gl;g.readPixels(0,0,1,1,g.RGBA,g.UNSIGNED_BYTE,pixel);};
   window.expressionFixture=(race,state='calm')=>{a.sim.time=12;const p=AERIN_QA.player();Object.assign(p,{x:0,z:4,age:24,ageFraction:0,race,gender:[0,1,0,1][race],kind:'player',hair:0,appearanceSeed:16,dir:3.42,prologue:false,born:0,introUntil:-100,releaseAt:-100,action:'idle',actionStarted:0,actionUntil:0,alive:true,weapon:-1,armor:0,shield:false,input:{x:0,z:0},dash:null,seated:false,guard:false,autoFight:null,autoSuppressedUntil:0,pendingSkill:null,combo:null,cooldown:0,stun:0,hitstopUntil:0,hitReactUntil:0,wounds:{},statuses:{},health:100,stamina:100,staminaCap:100,activity:null,lifeState:'active',speech:'',speechUntil:0,standUpUntil:0});a.renderer.effects=[];
    if(state==='talk'){p.speech='こんにちは';p.speechUntil=18;}
    if(state==='focused')p.autoFight='fixture-enemy';
    if(state==='hurt'){p.wounds={rightArm:{severity:'heavy'}};}
    if(state==='sleep')p.statuses={sleep:{until:18}};
    a.renderer.camera={x:0,z:4,zoom:3.8,yaw:3.42,pitch:.27};if(a.renderer.characterMaster)a.renderer.characterMaster.state=null;expressionDraw();};expressionFixture(0);
  });
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  async function shot(name){const data=await page.screenshot({type:'jpeg',quality:88});pictures[name]=data;await fs.writeFile(new URL(name+'.jpg',out),data);}
  const races=version==='before'?[0]:[0,1,2,3],states=version==='before'?['calm','hurt']:['calm','talk','focused','hurt','sleep'];
  for(const race of races)for(const state of states){const result=await page.evaluate(({race,state})=>{expressionFixture(race,state);const a=AERIN_QA.app,c=a.renderer.characterMaster,old=JSON.stringify(a.sim.exportState());expressionDraw();return {expression:c.expression?.name,uniform:c.expression?.uniform,finite:c.palette.every(Number.isFinite),immutable:old===JSON.stringify(a.sim.exportState()),gl:a.renderer.gl.getError(),calls:a.renderer.stats.calls,triangles:a.renderer.stats.triangles};},{race,state});report.states.push({version,race,state,...result});check(version+' '+race+' '+state,result.finite&&result.immutable&&result.gl===0&&(version==='before'||result.expression===state),result.expression);await shot(version+'-'+race+'-'+state);}
  if(version==='after'){
   await page.evaluate(()=>{expressionFixture(0);const a=AERIN_QA.app,p=AERIN_QA.player();a.sim.inflictWound(p,'rightLeg','heavy',{id:'fixture',x:p.x,z:p.z+1,alive:true});a.sim.time+=2;p.stun=0;p.hitstopUntil=0;p.hitReactUntil=0;p.action='idle';expressionDraw();});
   await page.keyboard.down('d');const move=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player(),start=[p.x,p.z],rows=[];a.renderer.camera.zoom=7;for(let i=0;i<8;i++){a.updateMove();a.sim.tick(1/30);expressionDraw();const c=a.renderer.characterMaster;rows.push({face:c.expression.name,leg:c.injury.rightLeg,error:c.metrics.contactError,finite:c.palette.every(Number.isFinite)});}return {distance:Math.hypot(p.x-start[0],p.z-start[1]),rows};});await page.keyboard.up('d');check('native wounded movement',move.distance>.1&&move.rows.every(r=>r.face==='hurt'&&r.leg>.5&&r.error<.035&&r.finite),move);await shot('wounded-walk');
   const healed=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();p.wounds.rightLeg.healsAt=p.age+p.ageFraction-.1;a.updateMove();a.sim.tick(1/30);for(let i=0;i<25;i++){a.sim.tick(1/30);a.snapshot=a.decorate(a.sim.snapshot(a.playerId,a.seq));a.renderer.characterMaster.update(a.snapshot.players.find(x=>x.id===p.id),a.sim.time);}expressionDraw();return {wound:!!p.wounds.rightLeg,face:a.renderer.characterMaster.expression.name};});check('simulation healing clears hurt face',!healed.wound&&healed.face!=='hurt',healed);
   const down=await page.evaluate(()=>{const a=AERIN_QA.app,p=AERIN_QA.player();a.sim.inflictWound(p,'torso','fatal',{id:'fixture',x:p.x,z:p.z+1,alive:true});expressionDraw();return {state:p.lifeState,face:a.renderer.characterMaster.expression.name,weight:a.renderer.characterMaster.injury.weight};});check('downing owns pose and closes eyes',down.face==='downed'&&down.weight===0,down);
  }
  check(version+' no page errors',errors.length===0,errors);await context.close();
 }
 const canvas=createCanvas(1400,1320),g=canvas.getContext('2d');g.fillStyle='#ece9df';g.fillRect(0,0,1400,1320);g.font='15px sans-serif';
 for(let race=0;race<4;race++)for(const [x,state]of ['calm','talk','focused','hurt','sleep'].entries()){g.drawImage(await loadImage(pictures['after-'+race+'-'+state]),x*280,race*330+30,280,300);g.fillStyle='#25342c';g.fillText(['Human','Elf','Dwarf','Fox'][race]+' / '+state,x*280+9,race*330+21);}await fs.writeFile(new URL('four-races-expressions.jpg',out),canvas.toBuffer('image/jpeg',88));
 const compare=createCanvas(1120,630),cg=compare.getContext('2d');cg.fillStyle='#ece9df';cg.fillRect(0,0,1120,630);cg.font='18px sans-serif';for(const [i,key]of ['before-0-hurt','after-0-hurt'].entries()){cg.drawImage(await loadImage(pictures[key]),i*560,30);cg.fillStyle='#25342c';cg.fillText(i?'AFTER / persistent wound':'BEFORE / persistent wound',i*560+12,23);}await fs.writeFile(new URL('before-after.jpg',out),compare.toBuffer('image/jpeg',88));
 report.passed=true;
}finally{await fs.writeFile(new URL('browser.json',out),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));}
