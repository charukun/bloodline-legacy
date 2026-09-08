import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium, request} from 'playwright';
import {root, sha256} from './build.mjs';
import {environments} from './config.mjs';
import {verifySkillSlice} from '../tests/skills/browser-contract.mjs';

const environment = process.argv[2];
assert(environments[environment], 'Unknown environment');
const local = process.argv[3] === '--local';
const base = local ? 'http://127.0.0.1:4173' : process.env.FIXED_URL;
assert(base, 'FIXED_URL must be the provider-confirmed stable environment URL');
const parsed = new URL(base);
assert(!parsed.username && !parsed.password && !parsed.search && !parsed.hash && parsed.pathname === '/');
assert(local || (parsed.protocol === 'https:' && parsed.hostname.startsWith(environments[environment].worker+'.') && parsed.hostname.endsWith('.workers.dev')),
  'Environment URL does not match the selected Worker');
const expected = JSON.parse(await fs.readFile(path.join(root,'deploy/out',environment,'version.json')));
const evidence = path.join(root,'deploy/evidence',environment,local?'local':'published');
await fs.mkdir(evidence,{recursive:true});
let server, browser, api, activePage;
const report = {environment, url:parsed.origin, expected, passed:false, viewports:[]};
try {
  if (local) server = spawn(process.execPath, ['deploy/node_modules/wrangler/bin/wrangler.js','dev','--config',`deploy/wrangler.${environment}.json`,'--port','4173','--ip','127.0.0.1','--local'],
    {cwd:root,stdio:['ignore','inherit','inherit']});
  api = await request.newContext({baseURL:parsed.origin,timeout:15000});
  // Retry only propagation/version readiness; a stale page must never pass.
  let ready = false;
  for (let attempt=0; attempt<30; attempt++) {
    try {
      const v = await api.get('/version.json');
      if (v.ok() && (await v.json()).commit === expected.commit && (await v.json()).environment === environment) {ready=true;break;}
    } catch {}
    if (server && server.exitCode !== null) throw new Error('Local Wrangler exited');
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
  assert(ready,'Expected deployment version did not become available');
  const versionResponse = await api.get('/version.json');
  assert.deepEqual(await versionResponse.json(),expected,'Published manifest mismatch');
  const htmlResponse = await api.get('/');
  assert.equal(htmlResponse.status(),200);
  assert.match(htmlResponse.headers()['content-type']||'',/^text\/html/);
  assert.match(htmlResponse.headers()['cache-control']||'',/no-cache/);
  assert.match(versionResponse.headers()['cache-control']||'',/no-cache/);
  assert.equal(sha256(await htmlResponse.body()),expected.htmlSha256,'Published game bytes differ from tested build');
  if (environment !== 'production' || expected.mode === 'holding') assert.match(htmlResponse.headers()['x-robots-tag']||'',/noindex/);
  const health = await api.get('/api/health');
  assert.equal(health.status(),200);
  assert.match(health.headers()['content-type']||'',/application\/json/);
  assert.deepEqual(await health.json(),{online:false,environment});
  assert.equal((await api.get('/assets/deployment-smoke-missing.glb')).status(),404,'Missing model must not receive HTML fallback');
  assert.equal((await api.post('/api/join',{data:{}})).status(),501,'Online API must not reach another environment');
  browser = await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for (const viewport of [{width:1280,height:800},{width:393,height:852}]) {
    const context = await browser.newContext({viewport,deviceScaleFactor:1});
    const page = await context.newPage();
    activePage=page;
    // Software WebGL on shared CI runners can block input while a village is built.
    page.setDefaultTimeout(120000);
    const record = {viewport,errors:[],consoleErrors:[],failedRequests:[],httpErrors:[]};
    report.viewports.push(record);
    page.on('pageerror',e=>record.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error') record.consoleErrors.push(m.text());});
    page.on('requestfailed',r=>record.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
    page.on('response',r=>{if(r.status()>=400) record.httpErrors.push({url:r.url(),status:r.status()});});
    await page.goto(parsed.origin+(expected.mode==='game'?'/?qa':''),{waitUntil:'load'});
    if (expected.mode === 'holding') {
      await page.locator('#release-pending').waitFor();
      assert.equal(await page.locator('canvas').count(),0);
    } else {
      await page.waitForFunction(()=>window.AERIN_QA?.app.renderer.frame>3,{},{timeout:60000});
      assert.equal(await page.evaluate(()=>window.AERIN_QA.app.renderer.gl.isContextLost()),false);
      await page.locator('#begin-life').click();
      for (let i=0;i<4;i++) {
        if (await page.locator('#hud').isVisible()) break;
        await page.locator('#guide-next').click();
      }
      await page.locator('#hud').waitFor({state:'visible'});
      await page.waitForFunction(()=>window.AERIN_QA.app.screen==='game' && window.AERIN_QA.app.renderer.frame>8);
      record.game = await page.evaluate(()=>{
        const app=window.AERIN_QA.app, canvas=document.getElementById('world');
        const bounds=canvas.getBoundingClientRect();
        return {screen:app.screen,webgl2:app.renderer.gl instanceof WebGL2RenderingContext,contextLost:app.renderer.gl.isContextLost(),
          width:canvas.width,height:canvas.height,cssWidth:bounds.width,cssHeight:bounds.height,
          overflow:document.documentElement.scrollWidth>innerWidth+2,
          brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length,
          frame:app.renderer.frame};
      });
      assert(record.game.webgl2 && !record.game.contextLost && record.game.width>0 && record.game.height>0);
      assert.equal(record.game.overflow,false,'Fatal horizontal mobile overflow');
      assert.equal(record.game.brokenImages,0);
      // Sample real framebuffer colors. A present-but-blank canvas must fail.
      record.framebufferColors=await page.evaluate(()=>{
        const g=window.AERIN_QA.app.renderer.gl, data=new Uint8Array(4), colors=new Set();
        for(let y=1;y<7;y++) for(let x=1;x<7;x++) {
          g.readPixels(Math.floor(g.drawingBufferWidth*x/8),Math.floor(g.drawingBufferHeight*y/8),1,1,g.RGBA,g.UNSIGNED_BYTE,data);
          colors.add([...data].join(','));
        }
        return colors.size;
      });
      assert(record.framebufferColors>4,'WebGL framebuffer appears blank');
      if(local)record.skills=await verifySkillSlice(page,evidence,viewport);
    }
    await page.screenshot({path:path.join(evidence,`${viewport.width}x${viewport.height}.png`)});
    if(local && expected.mode==='game' && process.argv.includes('--tilt-shift')) {
      const {verifyTiltShift}=await import('../tests/tilt-shift.browser.mjs');
      await verifyTiltShift(page,evidence,viewport,record);
    }
    assert.deepEqual(record.errors,[],'JavaScript page errors');
    assert.deepEqual(record.consoleErrors,[],'Browser console errors');
    assert.deepEqual(record.failedRequests,[],'Asset/network request failures');
    assert.deepEqual(record.httpErrors,[],'Browser 404/HTTP failures');
    await context.close();
    activePage=null;
  }
  report.passed=true;
  console.log(`Smoke verification passed: ${environment} (${expected.mode}) ${parsed.origin}`);
} catch(error) {
  report.failure=String(error);
  if(activePage) await activePage.screenshot({path:path.join(evidence,'failure.png'),timeout:15000}).catch(()=>{});
  console.error(JSON.stringify(report,null,2));
  throw error;
} finally {
  await fs.writeFile(path.join(evidence,'smoke.json'),JSON.stringify(report,null,2)+'\n');
  await browser?.close();
  await api?.dispose();
  server?.kill('SIGTERM');
}
