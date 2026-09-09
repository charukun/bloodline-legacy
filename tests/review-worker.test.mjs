import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorker} from '../deploy/review-worker.mjs';
const sha='a'.repeat(40),pat='github_pat_'+ 'x'.repeat(60);
const request=(path='/review/skills',token=pat,method='GET')=>new Request('https://review.example'+path,{method,headers:token?{Authorization:'Basic '+btoa('reviewer:'+token)}:{}});
function env(environment='preview') {return {REVIEW_ENV:environment,REVIEW_SHA:sha,REVIEW_PR:'81',ASSETS:{fetch:async req=>new URL(req.url).pathname==='/review/version.json'?Response.json({commit:sha,environment:'preview',pr:81}):new Response('<html>Review</html>',{headers:{'Content-Type':'text/html'}})}};}
const writer=async()=>Response.json({full_name:'charukun/bloodline-legacy',permissions:{push:true}});
test('anonymous and read-only accounts cannot fetch HTML, code, manifests or assets',async()=>{
 const worker=createWorker(async()=>Response.json({full_name:'charukun/bloodline-legacy',permissions:{pull:true,push:false}}));
 for(const p of ['/review/skills','/review/runtime.mjs','/review/version.json','/review/assets/enemies/sentinel.glb']){
  for(const token of [null,'github_pat_'+'r'.repeat(60)]){const r=await worker.fetch(request(p,token),env());assert.equal(r.status,401);assert.match(r.headers.get('WWW-Authenticate'),/Basic/);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.doesNotMatch(await r.text(),/<html>Review/);}
 }
});
test('writers enter; SHA and PR mismatch fail closed; API and Production are unavailable',async()=>{
 const worker=createWorker(writer);
 const ok=await worker.fetch(request('/review/skills?sha='+sha),env());assert.equal(ok.status,200);assert.match(await ok.text(),/Review/);
 assert.match(ok.headers.get('Content-Security-Policy'),/connect-src 'self'/);
 assert.equal((await worker.fetch(request('/review/skills?sha='+'b'.repeat(40)),env())).status,409);
 assert.equal((await worker.fetch(request('/review/skills'),{...env(),REVIEW_PR:'82'})).status,503);
 assert.equal((await worker.fetch(request('/review/skills'),{...env(),REVIEW_SHA:'b'.repeat(40)})).status,503);
 for(const environment of ['production','staging',''])assert.equal((await worker.fetch(request(),env(environment))).status,404);
 for(const path of ['/api/join','/api/checkpoint','/index.html','/review/other'])assert.equal((await worker.fetch(request(path),env())).status,404);
 assert.equal((await worker.fetch(request('/review/skills',pat,'POST'),env())).status,405);
});
test('GitHub errors never allow access and an unrelated repository permission cannot authorize',async()=>{
 const unavailable=createWorker(async()=>{throw Error('network down');});assert.equal((await unavailable.fetch(request('/review/skills','github_pat_'+'n'.repeat(60)),env())).status,503);
 const unrelated=createWorker(async()=>Response.json({full_name:'someone/else',permissions:{admin:true}}));assert.equal((await unrelated.fetch(request('/review/skills','github_pat_'+'e'.repeat(60)),env())).status,401);
});

import {verifyReviewAccess} from '../deploy/verify-review.mjs';
test('new-host propagation may retry 404; public content or authorization failures cannot pass',async()=>{
 let requests=0,waits=0;
 await verifyReviewAccess(['https://review.example/review/skills'],{fetcher:async()=>++requests===1?new Response('',{status:404}):new Response('',{status:401,headers:{'WWW-Authenticate':'Basic','Cache-Control':'no-store'}}),wait:async()=>waits++});
 assert.equal(requests,2);assert.equal(waits,1);
 for(const status of [200,403,404,503])await assert.rejects(verifyReviewAccess(['https://review.example/review/runtime.mjs'],{fetcher:async()=>new Response('',{status}),wait:async()=>{},attempts:2}),/authorization gate failed/);
});
