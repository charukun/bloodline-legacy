import {LiveContract} from '../src/live/contract.mjs';
import {currentRules} from '../src/server/engines/registry.mjs';
export {GameWorld} from '../src/server/world.mjs';
const versions=new WeakMap();
async function manifest(env){
 if(!versions.has(env)){
  const pending=env.ASSETS.fetch(new Request('https://assets.invalid/version.json')).then(async r=>{
   if(!r.ok)throw Error('RELEASE_UNAVAILABLE');const v=await r.json();
   if(v.environment!==env.APP_ENV||(v.mode==='game'&&(v.live?.rules!==currentRules||v.live?.protocol!==LiveContract.protocol||v.live?.save!==LiveContract.save)))throw Error('RELEASE_MISMATCH');return v;
  }).catch(error=>{versions.delete(env);throw error;});versions.set(env,pending);
 }
 return versions.get(env);
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  if(env.APP_ENV!=='production')headers['X-Robots-Tag']='noindex, nofollow';
  const json=(body,status=200)=>Response.json(body,{status,headers});
  if(url.pathname==='/api/health'&&['GET','HEAD'].includes(request.method)){
   let online=false,version;try{if(env.WORLDS){version=await manifest(env);online=version.mode==='game'&&!!version.live;}}catch{return json({code:'RELEASE_UNAVAILABLE',online:false},503);}
   return new Response(request.method==='HEAD'?null:JSON.stringify({online,environment:env.APP_ENV,...(online?{game:'AERIN',compatibility:LiveContract,build:version.commit}: {})}),{headers:{...headers,'Content-Type':'application/json'}});
  }
  if(url.pathname.startsWith('/api/')){
   if(!env.WORLDS)return json({error:'Online backend is not deployed'},501);
   try{
    const release=await manifest(env);if(release.mode!=='game')return json({code:'RELEASE_PENDING'},503);
    if(!['/api/join','/api/events','/api/command','/api/checkpoint','/api/presence'].includes(url.pathname))return json({code:'NOT_FOUND'},404);
    const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({code:'ORIGIN_REJECTED'},403);
    if(request.headers.get('Sec-Fetch-Site')==='cross-site')return json({code:'ORIGIN_REJECTED'},403);
    const mode=request.headers.get('X-Bloodline-Mode')||'normal';if(!['normal','demo'].includes(mode))return json({code:'INVALID_MODE'},400);
    const id=env.WORLDS.idFromName(env.APP_ENV+':'+mode);
    return await env.WORLDS.get(id).fetch(request);
   }catch{return json({code:'RELEASE_UNAVAILABLE'},503);}
  }
  if(url.pathname==='/favicon.ico')return new Response(null,{status:204,headers});
  if(['GET','HEAD'].includes(request.method)&&(url.pathname==='/'||url.pathname==='/index.html')){
   if(url.searchParams.has('build')){
    try{const active=await manifest(env);if(url.searchParams.get('build')!==active.commit)return new Response('新しい版の準備が変わりました。元の画面に戻り、もう一度更新してください。',{status:409,headers:{...headers,'Content-Type':'text/plain; charset=utf-8'}});}
    catch{return json({code:'RELEASE_UNAVAILABLE'},503);}
   }
   return env.ASSETS.fetch(request);
  }
  return new Response('Not found',{status:404,headers});
 }
};
