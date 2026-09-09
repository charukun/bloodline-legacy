// CI-only browser acceptance of the exact PR-head artifact. No production login.
import fs from 'node:fs/promises';import http from 'node:http';import path from 'node:path';import assert from 'node:assert/strict';
import {chromium} from '../deploy/node_modules/playwright/index.mjs';
const root=path.resolve('dist'),evidence=path.resolve('deploy/evidence/review-browser');await fs.mkdir(evidence,{recursive:true});
const info=JSON.parse(await fs.readFile(path.join(root,'review/version.json'),'utf8'));
if(info.commit!==process.env.REVIEW_SHA)throw Error('Browser test must check the built head SHA');
const server=http.createServer(async(req,res)=>{try{
 let pathname=new URL(req.url,'http://localhost').pathname;if(/^\/review\/(skills|enemies|combat)$/.test(pathname))pathname='/review/index.html';
 if(!pathname.startsWith('/review/')||pathname.includes('..')){res.writeHead(404);res.end();return;}
 const file=path.join(root,pathname),content=await fs.readFile(file);res.setHeader('Content-Type',({'.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(content);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
let browser,activePage;const results=[];
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const viewport of [{width:1280,height:800},{width:393,height:851}]){
  const context=await browser.newContext({viewport});await context.addInitScript(()=>{localStorage.setItem('bloodline-review-save-sentinel','unchanged');});
  const page=await context.newPage(),errors=[],network=[];activePage=page;page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>network.push(r.url()));
  for(const mode of ['skills','enemies','combat']){
   console.log(`Review browser: ${mode} at ${viewport.width}px`);
   await page.goto(base+`/review/${mode}?skill=4001&enemy=rime-guard&sha=${info.commit}`);await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
   await page.waitForFunction(()=>document.getElementById('stats').textContent.includes('calls')||document.getElementById('error').textContent,null,{timeout:60000});
   assert.equal(await page.locator('#error').textContent(),'');assert.equal(await page.locator('#sha').textContent(),info.commit);
   assert.equal(await page.locator('#enemy').inputValue(),'rime-guard');
   if(mode==='enemies'){
    for(const pose of ['run','windup','strike','guard','hit','death']){await page.locator('#pose').selectOption(pose);await page.waitForTimeout(150);}
    await page.locator('#broken').selectOption('bothLegs');await page.locator('#vitality').press('Home');for(let i=0;i<25;i++)await page.locator('#vitality').press('ArrowRight');await page.locator('#pose').selectOption('run');
   }else{
    assert.equal(await page.locator('#skill').inputValue(),'4001');await page.locator('#single').click();await page.waitForTimeout(500);await page.locator('#combo').click();await page.waitForTimeout(1200);
    await page.locator('#speed').selectOption('.25');await page.locator('#view').selectOption('1.57');await page.locator('#effects').uncheck();await page.locator('#effects').check();
   }
   assert.equal(await page.locator('#error').textContent(),'');assert.equal(errors.length,0,errors.join('\n'));
   const state=await page.evaluate(()=>({save:localStorage.getItem('bloodline-review-save-sentinel'),keys:Object.keys(localStorage),width:document.documentElement.scrollWidth,view:innerWidth,stats:document.getElementById('stats').textContent,readout:document.getElementById('readout').textContent}));
   assert.equal(state.save,'unchanged');assert.deepEqual(state.keys,['bloodline-review-save-sentinel']);assert.ok(state.width<=state.view,'no horizontal overflow');assert.doesNotMatch(state.readout,/NaN|undefined/);
   const unexpected=network.filter(url=>/^https?:/.test(url)&&(new URL(url).pathname.startsWith('/api/')||new URL(url).origin!==base));
   assert.deepEqual(unexpected,[],'no game API or external HTTP requests; local blob/data decodes are allowed');
   await page.screenshot({path:path.join(evidence,`${mode}-${viewport.width}.png`),fullPage:true,timeout:15000});console.log(`Review browser passed: ${mode} at ${viewport.width}px`);results.push({mode,viewport,...state});
  }
  if(viewport.width===1280){
   await page.getByText('負荷計測',{exact:true}).click();
   const download=page.waitForEvent('download',{timeout:90000});await page.locator('#measure').click();const file=await download;await file.saveAs(path.join(evidence,'performance.json'));
   const measured=JSON.parse(await fs.readFile(path.join(evidence,'performance.json'),'utf8'));assert.equal(measured.build.commit,info.commit);assert.equal(measured.runs.length,3);assert.ok(measured.runs.every(r=>r.raw.length>0&&Number.isFinite(r.p95Ms)));
  }
  await page.goto(base+'/review/skills?skill=missing');await page.locator('#error').filter({hasText:'指定された技'}).waitFor();
  await page.goto(base+'/review/skills?sha='+'0'.repeat(40));await page.locator('#error').filter({hasText:'異なります'}).waitFor();
  await context.close();
 }
 await fs.writeFile(path.join(evidence,'result.json'),JSON.stringify({commit:info.commit,passed:true,results,note:'Software WebGL; target-device FPS not evaluated'},null,2));
 console.log('Review browser acceptance passed: desktop/mobile routes, real WebGL, controls, deep links, isolation and measurement');
}catch(error){if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:path.join(evidence,'failure.png'),fullPage:true,timeout:15000}).catch(()=>{});await fs.writeFile(path.join(evidence,'failure.txt'),(error.stack||String(error))+'\n'+await activePage.locator('body').innerText().catch(()=>''));}throw error;}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
