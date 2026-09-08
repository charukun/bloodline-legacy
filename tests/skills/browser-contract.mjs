/* Runs inside the repository's existing CI smoke runner, on its disposable local origin. */
import assert from 'node:assert/strict';
import path from 'node:path';
export async function verifySkillSlice(page,evidence,viewport) {
 const prefix=path.join(evidence,`skills-${viewport.width}`),report={fixture:'Age/location/time may be prepared through existing QA. Gift, activity, loadout and detail use real UI. No direct skill grant. Skill captures use existing medium quality on CI SwiftShader; the reveal frame is held only for still capture and menu checks.'};
 const initial=await page.evaluate(()=>{const a=window.AERIN_QA.app;return {world:a.sim.exportState(),profile:structuredClone(a.profile),playerId:a.playerId};});
 await page.evaluate(()=>window.AERIN_QA.app.renderer.setQuality('medium'));
 await page.evaluate(()=>{const q=window.AERIN_QA,p=q.player();p.prologue=true;p.releaseAt=q.sim().time+300;p.giftOffer=['bell','stone','feather'];q.app.ui.lastGifts=null;});
 await page.locator('[data-gift="bell"]').click();
 assert.equal(await page.evaluate(()=>window.AERIN_QA.player().skillLife.memories.bell.origin),'family');
 await page.locator('#leave-arms').click();
 await page.evaluate(()=>{const q=window.AERIN_QA;q.age(18);const forge=q.sim().getRoom(q.player()).map.schools.find(a=>a.id==='forge');q.place(forge.x,forge.z);});
 await page.locator('[data-context="activity"][data-value="observe"]').click();
 report.discovery=await page.evaluate(()=>{const q=window.AERIN_QA,p=q.player(),before=p.skillLife.discovered.length;for(let i=0;i<9000&&p.skillLife.discovered.length===before;i++)q.sim().tick(1/30);return p.skillLife.discovered.at(-1);});
 assert.ok(report.discovery?.id&&report.discovery.reasons.some(r=>r.includes('鍛冶')),'A real activity must create an explained discovery');
 // Software WebGL screenshots may take longer than the nonmodal reveal.
 // Freeze the existing RAF only after its real UI has revealed the name;
 // keep the actual handlers and storage path, then reload into normal RAF.
 await page.waitForFunction(()=>{const a=window.AERIN_QA.app,el=document.getElementById('skill-revelation');if(el?.classList.contains('visible')&&el.classList.contains('named')){a.closed=true;return true;}return false;});
 await page.screenshot({path:prefix+'-discovery.png'});
 await page.locator('.reveal-open').click();
 const id=report.discovery.id,active=await page.evaluate(id=>window.AERIN_QA.player().skills.includes(id),id);
 if(active) {
  const tile=page.locator(`[data-skill="${id}"]`);await tile.click();assert.equal(await tile.getAttribute('aria-pressed'),'true');
  await page.locator(`[data-detail="${id}"]`).click();
 } else await page.locator(`[data-passive="${id}"]`).click();
 assert.ok((await page.locator('#skill-detail').innerText()).includes('鍛冶'),'Discovery cause remains available in details');
 await page.screenshot({path:prefix+'-loadout.png'});
 report.saved=await page.evaluate(()=>{const a=window.AERIN_QA.app;a.saveWorld();return {skills:a.snapshot.player.skills,weights:a.snapshot.player.phaseWeights,memories:a.snapshot.player.skillLife.memories,discovered:a.snapshot.player.skillLife.discovered};});
 await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.AERIN_QA?.app.renderer.frame>3);
 await page.locator('#begin-life').click();await page.locator('#hud').waitFor({state:'visible'});
 report.restored=await page.evaluate(()=>{const p=window.AERIN_QA.player();return {skills:p.skills,weights:p.phaseWeights,memories:p.skillLife.memories,discovered:p.skillLife.discovered};});
 assert.deepEqual(report.restored,report.saved,'Real-origin localStorage reload must preserve the skill state');
 // Representative three-life fixtures were produced using actual Simulation activity commands.
 const {readFile}=await import('node:fs/promises');
 for(let i=0;i<3;i++) {
  const fixture=JSON.parse(await readFile(new URL(`./generated/life-${i}.json`,import.meta.url),'utf8'));
  await page.evaluate(f=>{const q=window.AERIN_QA,a=q.app;const s=a.sim.constructor.restore(f.world);a.sim=s;a.profile={...a.profile,...f.profile};a.playerId=[...s.players.values()].find(p=>p.owner===f.profile.owner).id;a.seq=s.seq;a.snapshot=a.decorate(s.snapshot(a.playerId,s.seq));const p=q.player(),r=s.getRoom(p),dummy=r.actors.find(e=>e.kind==='dummy');q.place(dummy.x,dummy.z-1.1);p.phaseWeights=[{},{},{}];for(const id of p.skills){for(let b=0;b<3;b++){a.command({type:'weights',phase:b,weights:{...p.phaseWeights[b],[id]:100}});}}a.renderer.setQuality('medium');a.ui.showGame();},fixture);
  // Normal RAF renders and drives the existing contact auto combat.
  await page.waitForFunction(()=>window.AERIN_QA.player().skillUses&&Object.keys(window.AERIN_QA.player().skillUses).some(k=>+k>=60000),{},{timeout:60000});
  await page.screenshot({path:prefix+`-life-${i}.png`});
 }
 report.metrics=await page.evaluate(()=>{const a=window.AERIN_QA.app,r=a.renderer,g=r.gl,ext=g.getExtension('WEBGL_debug_renderer_info');return {stats:r.stats,frame:r.frame,backend:ext?g.getParameter(ext.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),frameError:a.frameError?.message||null,overflow:document.documentElement.scrollWidth>innerWidth+2};});
 assert.equal(report.metrics.frameError,null);assert.equal(report.metrics.overflow,false);
 // Leave the next independent renderer smoke in the original scene, without
 // carrying a combat fixture, open menu or active activity across test suites.
 await page.evaluate(f=>{const a=window.AERIN_QA.app,s=a.sim.constructor.restore(f.world);a.sim=s;a.profile=f.profile;a.playerId=f.playerId;a.seq=s.seq;a.snapshot=a.decorate(s.snapshot(a.playerId,s.seq));a.renderer.setQuality(f.profile.quality);a.ui.closeModal();a.ui.showGame();a.saveProfile();a.saveWorld();},initial);
 return report;
}
