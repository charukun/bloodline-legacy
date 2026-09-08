/* Differential regression against an explicitly supplied, frozen GitHub develop.
 * This is intentionally separate from CI: another WORK may legitimately update
 * the protected implementation. Integration compares against its new base again.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {loadScene,repository} from './export_scene.mjs';
const base=process.argv[2];if(!base)throw Error('Supply the frozen develop checkout');
const copy=o=>JSON.parse(JSON.stringify(o));
const protectedFiles=['legacy/core.js','legacy/dialogue.js','legacy/game.js','legacy/ui.js','legacy/labels.js','legacy/motion.js','legacy/art.js','legacy/render_math.js','world/environment.js','weather/weather.js','character/rig.js','render/combat-presentation.js','render/renderer-base.js','ui/base.css','ui/world-skin.css','shell.html'];
for(const file of protectedFiles)assert.deepEqual(await fs.readFile(path.join(base,'src',file)),await fs.readFile(path.join(repository,'src',file)),file);
const before=await loadScene(base),after=await loadScene(repository);
assert.deepEqual(copy(before.snapshot),copy(after.snapshot),'map, actors and gameplay snapshot');
assert.deepEqual(copy(Object.fromEntries(before.r.dynamic)),copy(Object.fromEntries(after.r.dynamic)),'existing character geometry / pose / materials');
// A different environment (frontier) must produce the same art, not inherit district changes.
for(const scene of [before,after]){scene.r.static.clear();scene.r.art.front(941,1);}
assert.deepEqual(copy(Object.fromEntries(before.r.static)),copy(Object.fromEntries(after.r.static)),'frontier static art');
// Replay commands through the actual Simulation, including serialization/restore.
const transcript=[{type:'move',x:0,z:-1},{type:'move',x:1,z:0},{type:'dash',x:0,z:1},{type:'move',x:0,z:0},{type:'sit',active:true},{type:'sit',active:false},{type:'talk'},{type:'pickup'},{type:'equip',slot:0},{type:'attack'}];
const returns=[];
for(const command of transcript){const values=[];for(const scene of [before,after]){const id=scene.snapshot.player.id;values.push(scene.sim.command(id,command));for(let frame=0;frame<120;frame++)scene.sim.tick(1/60);}
 assert.deepEqual(copy(before.sim.exportState()),copy(after.sim.exportState()),command.type);assert.deepEqual(values[0],values[1]);returns.push({command:command.type,result:values[0]??null});}
for(const scene of [before,after]){const data=scene.sim.exportState();scene.restored=scene.sim.constructor.restore(data);}
assert.deepEqual(copy(before.restored.exportState()),copy(after.restored.exportState()),'restore');
console.log(JSON.stringify({status:'PASS',protectedFiles,checks:['snapshot and map','character instance identity','frontier art identity','command replay / 1200 simulation steps','save / restore differential'],transcript:returns},null,2));
