const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./ui-fixture.cjs');
const prefix='aerin.tactics.v3.';
test('actual Game.saveWorld rejects stale-tab writes and preserves the newer record',t=>{
 const {g,w}=fixture(t);g.profile.mode='normal';assert.equal(g.saveWorld(),true);
 const newer=JSON.parse(w.localStorage.getItem(prefix+'world4.normal'));newer.time+=10;
 const raw=JSON.stringify(newer);w.localStorage.setItem(prefix+'world4.normal',raw);
 assert.equal(g.saveWorld(),false);assert.equal(w.localStorage.getItem(prefix+'world4.normal'),raw);assert.equal(g.blockSave,true);
});
test('actual loadMode blocks unknown schema and never replaces the unreadable world or profile',t=>{
 const {g,w,api}=fixture(t);g.saveProfile=api.Game.prototype.saveProfile;g.profile.mode='normal';const raw=JSON.stringify({schema:99,precious:'future journey'});
 w.localStorage.setItem(prefix+'world4.normal',raw);g.loadMode();assert.equal(g.blockSave,true);
 assert.equal(g.saveWorld(),false);assert.equal(w.localStorage.getItem(prefix+'world4.normal'),raw);assert.equal(g.saveProfile(),false);
});
test('actual schema-3 startup backs up exact source bytes before first schema-4 write',t=>{
 const {g,w,sim,p}=fixture(t);g.profile.mode='normal';p.inventory=['bell'];const old=sim.exportState();old.schema=3;
 const raw=JSON.stringify(old);w.localStorage.setItem(prefix+'world.normal',raw);g.loadMode();
 assert.equal(w.localStorage.getItem(prefix+'backup.schema3.normal'),raw);assert.equal(g.saveWorld(),true);
 const saved=JSON.parse(w.localStorage.getItem(prefix+'world4.normal'));assert.equal(saved.schema,4);assert.equal(saved._profile.owner,g.profile.owner);
 assert.deepEqual(saved.players.find(([id])=>id===p.id)[1].inventory,['bell']);
 w.localStorage.setItem(prefix+'world.normal',JSON.stringify({...old,time:999}));g.loadMode();assert.equal(g.sim.time,saved.time,'an old JS tab cannot overwrite the schema-4 journey');
});
test('quota failure reports failure while preserving the last valid save',t=>{
 const {g,w}=fixture(t);g.profile.mode='normal';assert.equal(g.saveWorld(),true);const raw=w.localStorage.getItem(prefix+'world4.normal');
 w.Storage.prototype.setItem=function(){throw Error('QuotaExceededError');};g.sim.time+=2;
 assert.equal(g.saveWorld(),false);assert.equal(w.localStorage.getItem(prefix+'world4.normal'),raw);
});
test('pending bequest survives reload and resume; choosing it persists without creating a new player',async t=>{
 const {g,w,p,sim}=fixture(t);g.profile.mode='normal';g.profile.uiExplained=true;g.renderer.camera={};g.renderer.effects=[];
 p.skills=[4000];sim.die(p,'老衰');assert.equal(g.saveWorld(),true);g.loadMode();assert.equal(g.canResume(),true);await g.start();
 assert.equal(g.playerId,p.id);assert.equal(g.sim.players.size,1);assert.equal(g.snapshot.player.legacyChoice.state,'pending');
 assert.equal(g.command({type:'choose-legacy',skill:4000}),true);
 const saved=JSON.parse(w.localStorage.getItem(prefix+'world4.normal'));assert.equal(saved.legacies[p.owner].records.length,1);assert(saved.legacies[p.owner].archive.includes(4000));
 g.loadMode();assert.equal(g.canResume(),false);assert.equal(g.sim.legacy(p.owner).records.length,1);
});
test('portable pending bequest imports back into the same life',async t=>{
 const {g,w,p,sim,api}=fixture(t);g.profile.mode='normal';g.profile.uiExplained=true;g.renderer.camera={};g.renderer.effects=[];w.confirm=()=>true;
 p.skills=[4000];sim.die(p,'老衰');const data=JSON.stringify({format:'AERIN-portable-1',profile:g.profile,world:sim.exportState()});
 await api.Game.prototype.importSave.call(g,{size:data.length,text:async()=>data});assert.equal(g.playerId,p.id);assert.equal(g.canResume(),true);await g.start();
 assert.equal(g.sim.players.size,1);assert.equal(g.snapshot.player.legacyChoice.state,'pending');
});
