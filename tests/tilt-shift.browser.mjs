import assert from 'node:assert/strict';
import path from 'node:path';

// Run against the built game in CI's existing Chromium/Workers smoke session.
// QA changes only the disposable browser save; production code stays untouched.
export async function verifyTiltShift(page, evidence, viewport, record) {
  const prefix = `${viewport.width}x${viewport.height}-tilt`;
  const report = {passed:false, renderer:'CI Chromium / SwiftShader', stills:[]};
  record.tiltShift=report; // Retain partial evidence if a later assertion fails.
  const defaults = await page.evaluate(() => {
    const q=window.AERIN_QA, a=q.app, r=a.renderer;
    const result={mode:r.diorama.mode,dof:r.diorama.dof,passes:r.stats.dofPasses};
    a.closed=true; a.stopInput(); a.ui.closeModal();
    q.age(17); q.place(0,0); q.step(1); a.ui.update(a.snapshot);
    r.setQuality('medium'); r.effects=[]; r.weather.setOverride('clear');
    window.__tiltFixture={snapshot:structuredClone(a.snapshot),camera:{x:0,z:-1.5,zoom:16,yaw:.42,pitch:.68},buffers:{}};
    return result;
  });
  assert.deepEqual(defaults,{mode:'normal',dof:'subtle',passes:0});

  async function still(name,mode,dof,weather='clear',debug=false) {
    const sample=await page.evaluate(({name,mode,dof,weather,debug})=>{
      const a=AERIN_QA.app,r=a.renderer,g=r.gl,f=window.__tiltFixture,d=r.diorama;
      const before=JSON.stringify(f.snapshot);
      r.camera={...f.camera}; r.weather.setOverride(weather); d.configure(mode,dof); d.debug=debug;
      // Settle presentation without advancing the authoritative frozen scene.
      for(let i=0;i<20;i++)d.update(f.snapshot,.1);
      const start=performance.now();r.render(f.snapshot,.016,{freezeCamera:true});g.finish();
      const finishMs=performance.now()-start;
      const pixels=new Uint8Array(r.canvas.width*r.canvas.height*4);
      g.readPixels(0,0,r.canvas.width,r.canvas.height,g.RGBA,g.UNSIGNED_BYTE,pixels);
      f.buffers[name]=pixels;
      const counts={blue:0,green:0,orange:0};
      for(let i=0;i<pixels.length;i+=4){
        const [red,green,blue]=pixels.subarray(i,i+3);
        if(blue>red*1.3&&blue>green*1.3)counts.blue++;
        if(green>red*1.3&&green>blue*1.3)counts.green++;
        if(red>green*1.3&&red>blue*1.3)counts.orange++;
      }
      return {name,mode,dof,weather,width:r.canvas.width,height:r.canvas.height,
        stats:{...r.stats},wet:r.weatherState.wet,rain:r.weatherState.rain,
        error:g.getError(),contextLost:g.isContextLost(),finishMs,debugPixels:counts,
        snapshotUnchanged:before===JSON.stringify(f.snapshot)};
    },{name,mode,dof,weather,debug});
    assert.equal(sample.error,0,`${name}: WebGL error`);
    assert.equal(sample.contextLost,false);
    assert.equal(sample.stats.dofError,null);
    assert.equal(sample.snapshotUnchanged,true,'Rendering mutated the input snapshot');
    const active=mode==='tilt-shift'&&dof!=='off';
    assert.equal(sample.stats.dofActive,active,name);
    assert.equal(sample.stats.dofPasses,active?2:0,name);
    if(active){
      assert.equal(sample.stats.dofTargetSize,`${Math.ceil(sample.width/2)}x${Math.ceil(sample.height/2)}`);
      assert.equal(sample.stats.dofBytes,Math.ceil(sample.width/2)*Math.ceil(sample.height/2)*8);
    }else assert.equal(sample.stats.dofBytes,0);
    await page.screenshot({path:path.join(evidence,`${prefix}-${name}.png`)});
    report.stills.push(sample);
    return sample;
  }

  await still('normal','normal','subtle');
  await still('off','tilt-shift','off');
  await still('subtle','tilt-shift','subtle');
  await still('strong','tilt-shift','strong');
  const debug=await still('focus-debug','tilt-shift','strong','clear',true);
  for(const [region,count]of Object.entries(debug.debugPixels))assert(count>100,`Missing ${region} depth/focus region`);
  report.pixelDifferences=await page.evaluate(()=>{
    const b=window.__tiltFixture.buffers,normal=b.normal;
    const delta=other=>{let sum=0;for(let i=0;i<normal.length;i++)if(i%4!==3)sum+=Math.abs(normal[i]-other[i]);return sum/(normal.length*.75);};
    return{off:delta(b.off),subtle:delta(b.subtle),strong:delta(b.strong)};
  });
  assert(report.pixelDifferences.off<.1,'DOF OFF changed the frozen scene/display transform');
  assert(report.pixelDifferences.subtle>.005,'SUBTLE did not affect the real framebuffer');
  assert(report.pixelDifferences.strong>.005,'STRONG did not affect the real framebuffer');
  const rainNormal=await still('rain-normal','normal','subtle','rain');
  const rainStrong=await still('rain-strong','tilt-shift','strong','rain');
  for(const sample of [rainNormal,rainStrong]){
    assert.equal(sample.stats.weather,'rain');assert.equal(sample.wet,1);assert.equal(sample.rain,1);
    assert(sample.stats.rainParticles>0,'Rain draw pass is absent');
  }

  // Exercise the actual settings handlers and modal/input path.
  await page.locator('[data-menu="settings"]').click();
  // Opening any existing menu stops input and updates lastInput. Compare the
  // toggles with that established modal state, not the pre-menu input timestamp.
  const saved=await page.evaluate(()=>({profile:JSON.stringify(AERIN_QA.app.profile),world:JSON.stringify(AERIN_QA.sim().exportState())}));
  await page.locator('[data-diorama-mode="normal"]').click();
  await page.locator('[data-diorama-mode="tilt-shift"]').click();
  await page.locator('[data-diorama-dof="off"]').click();
  await page.locator('[data-diorama-dof="subtle"]').click();
  assert.equal(await page.locator('[data-diorama-mode="tilt-shift"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-diorama-dof="subtle"]').getAttribute('aria-pressed'),'true');
  for(const selector of ['#sound-toggle','#help-nav','#export-save','#import-save','#lineage-nav'])assert.equal(await page.locator(selector).count(),1);
  await page.screenshot({path:path.join(evidence,`${prefix}-settings.png`)});
  assert.deepEqual(await page.evaluate(()=>({profile:JSON.stringify(AERIN_QA.app.profile),world:JSON.stringify(AERIN_QA.sim().exportState())})),saved,'Presentation toggles changed save/simulation state');
  await page.locator('#lineage-nav').click();
  const lineage=await page.evaluate(()=>{const r=AERIN_QA.app.renderer;r.render(window.__tiltFixture.snapshot,.016);return{active:r.stats.dofActive,suspended:r.diorama.suspended};});
  assert.deepEqual(lineage,{active:false,suspended:true});
  await page.keyboard.press('Escape');
  report.exclusions=await page.evaluate(()=>{
    const r=AERIN_QA.app.renderer,s=structuredClone(window.__tiltFixture.snapshot),result={};
    r.render(s,.016);result.village=r.stats.dofActive;
    s.player.action='attack';r.render(s,.016);result.attack=r.stats.dofActive;
    s.player.action='idle';s.player.z=-35;r.render(s,.016);result.outside=r.stats.dofActive;
    r.render(window.__tiltFixture.snapshot,.016,{clan:true});result.clan=r.stats.dofActive;
    return result;
  });
  assert.deepEqual(report.exclusions,{village:true,attack:false,outside:false,clan:false});

  // Golden UI keeps nested modal history, so Escape from lineage returns to
  // settings. Close that parent before exercising real movement input.
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>AERIN_QA.app.ui.modal===null);

  // Resume the real application frame loop, then move using its keyboard input.
  await page.evaluate(()=>{
    const q=AERIN_QA,a=q.app,r=a.renderer;
    q.place(0,0);q.step(1);r.weather.setOverride('rain');r.diorama.configure('tilt-shift','subtle');
    window.__tiltMotion={start:{x:q.player().x,z:q.player().z},samples:[],running:true};
    a.closed=false;a.lastFrame=performance.now();requestAnimationFrame(t=>a.frame(t));
    const sample=()=>{const m=window.__tiltMotion,p=q.player(),f=r.diorama.focus;
      if(!m.running)return;
      m.samples.push({x:p.x,z:p.z,focus:f?[...f]:null,frame:r.frame,frameMs:r.stats.frameMs,gpuMs:r.stats.gpuMs,active:r.stats.dofActive,camera:{...r.camera}});
      requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
  });
  // The first RAF sample can run between enabling the pass and its first
  // render. Begin the movement assertion only after the real frame loop has
  // activated DOF, then keep every subsequent sample strict.
  await page.waitForFunction(()=>{const r=AERIN_QA.app.renderer;return r.stats.dofActive&&r.diorama.focus;},{},{timeout:60000});
  const firstActive=await page.evaluate(()=>window.__tiltMotion.samples.length);
  await page.keyboard.down('ArrowRight');
  try{
    await page.waitForFunction(first=>{const m=window.__tiltMotion,p=AERIN_QA.player();return m.samples.length>=first+4&&Math.hypot(p.x-m.start.x,p.z-m.start.z)>.8;},firstActive,{timeout:60000});
  }finally{await page.keyboard.up('ArrowRight');}
  const stopFrame=await page.evaluate(()=>AERIN_QA.app.renderer.frame);
  await page.waitForFunction(frame=>AERIN_QA.app.renderer.frame>=frame+8,stopFrame,{timeout:60000});
  report.motion=await page.evaluate(()=>{
    const q=AERIN_QA,a=q.app,r=a.renderer,m=window.__tiltMotion,p=q.player();
    m.running=false;a.closed=true;a.stopInput();
    return{samples:m.samples,start:m.start,end:{x:p.x,z:p.z},
      finalError:Math.hypot(p.x-r.diorama.focus[0],p.z-r.diorama.focus[2]),
      frameError:String(a.frameError||''),glError:r.gl.getError(),contextLost:r.gl.isContextLost()};
  });
  assert.equal(report.motion.frameError,'');assert.equal(report.motion.glError,0);assert.equal(report.motion.contextLost,false);
  const motionSamples=report.motion.samples.slice(firstActive).filter(s=>s.active&&s.focus);
  assert(motionSamples.length>=4,'Too few active village motion samples');
  const travel=points=>Math.hypot(points.at(-1)[0]-points[0][0],points.at(-1)[1]-points[0][1]);
  assert(Math.hypot(report.motion.end.x-report.motion.start.x,report.motion.end.z-report.motion.start.z)>.8,'Character did not move through the village');
  assert(travel(motionSamples.map(s=>[s.focus[0],s.focus[2]]))>.2,'Focus did not follow the moving character');
  assert(motionSamples.some(s=>Math.hypot(s.x-s.focus[0],s.z-s.focus[2])>.001),'Focus snapped instead of following smoothly');
  assert(report.motion.finalError<.5,'Focus did not converge after movement stopped');
  await page.screenshot({path:path.join(evidence,`${prefix}-moving-rain.png`)});
  report.passed=true;
  return report;
}
