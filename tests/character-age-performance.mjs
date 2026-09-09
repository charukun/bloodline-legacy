/* Alternating completed-frame diagnostic. Uses production HTML and the same
 * native game fixture as age verification; no substitute renderer or GL mock. */
import fs from 'node:fs/promises';import http from 'node:http';import assert from 'node:assert/strict';
import {chromium} from '../deploy/node_modules/playwright/index.mjs';
const source=await fs.readFile(new URL('character-age-browser.mjs',import.meta.url),'utf8');
const start=source.indexOf('  await page.evaluate(()=>{const a=AERIN_QA.app;'),end=source.indexOf('  await page.evaluate(()=>new Promise',start);
assert(start>0&&end>start);const install=source.slice(start,end);
const files={before:await fs.readFile(process.env.CHARACTER_BASELINE),after:await fs.readFile(new URL('../dist/index.html',import.meta.url))};
const server=http.createServer((req,res)=>{const k=new URL(req.url,'http://local').pathname.split('/')[1];res.setHeader('Content-Type',k==='api'?'application/json':'text/html; charset=utf-8');res.end(k==='api'?'{"online":false}':files[k]||'');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={base:process.env.CHARACTER_BASE_SHA,method:'80-year-old human; 3 warmup pairs, 15 measured alternating pairs; each completed render bracketed by synchronous one-pixel readback. UI update timed separately. Two quiescent pages; no concurrent rendering.',backend:'Chromium / SwiftShader, not native device performance',samples:[],summary:{}};
try{
 const pages={};for(const version of ['before','after']){const context=await browser.newContext({viewport:{width:600,height:620},deviceScaleFactor:1}),page=await context.newPage();page.setDefaultTimeout(120000);await page.goto('http://127.0.0.1:'+server.address().port+'/'+version+'/?qa');await page.waitForFunction('window.AERIN_QA&&AERIN_QA.app.renderer.frame>1');await page.locator('#begin-life').click();const n=await page.locator('.guide-pages i').count();for(let i=0;i<n;i++)await page.locator('#guide-next').click();await page.waitForFunction('AERIN_QA.app.screen==="game"');await new Function('page','return (async()=>{'+install+'})()')(page);
  await page.evaluate(()=>{ageFixture(0,80);const a=AERIN_QA.app;a.renderer.camera={x:0,z:2.5,zoom:16,yaw:.42,pitch:.68};ageDraw();});pages[version]=page;
 }
 for(let pair=0;pair<18;pair++)for(const version of pair%2?['after','before']:['before','after']){
  const sample=await pages[version].evaluate(()=>{const a=AERIN_QA.app;a.snapshot=a.decorate(a.sim.snapshot(a.playerId,a.seq));ageDrain();const start=performance.now();a.renderer.render(a.snapshot,1/30,{freezeCamera:true});const submit=performance.now()-start;ageDrain();const complete=performance.now()-start,uiStart=performance.now();a.ui.update(a.snapshot);return {complete,submit,ui:performance.now()-uiStart,calls:a.renderer.stats.calls,triangles:a.renderer.stats.triangles,solve:a.renderer.stats.characterMaster?.solveMs??null,gl:a.renderer.gl.getError()};});assert.equal(sample.gl,0);if(pair>=3)report.samples.push({pair,version,...sample});
 }
 const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];for(const version of ['before','after']){const a=report.samples.filter(x=>x.version===version);report.summary[version]={frames:a.length,medianCompleteMs:median(a.map(x=>x.complete)),medianSubmitMs:median(a.map(x=>x.submit)),medianUiMs:median(a.map(x=>x.ui)),medianSolveMs:a[0].solve==null?null:median(a.map(x=>x.solve)),calls:a[0].calls,triangles:a[0].triangles};}
 report.summary.ratio=report.summary.after.medianCompleteMs/report.summary.before.medianCompleteMs;await fs.writeFile(new URL('../docs/character/ages/evidence/paired-performance.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
}finally{await browser.close();await new Promise(r=>server.close(r));}
