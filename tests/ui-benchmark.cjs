// DOM-only benchmark. This is not a browser, FPS or GPU measurement.
const {execFileSync} = require('node:child_process');
const {performance} = require('node:perf_hooks');
const {fixture} = require('./ui-fixture.cjs');
const base = process.argv[2];
if(!base || !/^[a-f0-9]{40}$/.test(base)) throw Error('Pass the verified 40-character baseline commit');
const source = execFileSync('git',['show',base+':src/legacy/ui.js'],{encoding:'utf8'});
const result={kind:'JSDOM stationary UI update; no rendering or frame pacing',node:process.version,baseline:base,runs:[]};
for(const variant of ['before','after']) for(let run=1;run<=3;run++) {
 let cleanup;const {g,ui,w,d}=fixture({after:f=>{cleanup=f}},variant==='before'?source:undefined);
 for(let i=0;i<100;i++)ui.update(g.snapshot);
 const observer=new w.MutationObserver(()=>{});for(const id of ['hud','world-labels'])observer.observe(d.getElementById(id),{subtree:true,childList:true,attributes:true,characterData:true});
 const samples=[];for(let i=0;i<1000;i++){const start=performance.now();ui.update(g.snapshot);samples.push(performance.now()-start);}
 const mutations=observer.takeRecords().length;observer.disconnect();samples.sort((a,b)=>a-b);
 result.runs.push({variant,run,updates:1000,domMutations:mutations,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p50Ms:samples[499],p95Ms:samples[949],p99Ms:samples[989],maxMs:samples.at(-1)});cleanup();
}
console.log(JSON.stringify(result,null,2));
