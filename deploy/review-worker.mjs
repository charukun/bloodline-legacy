// A separate developer-only Worker. No game API, save backend or Production binding.
const authorizationCache=new Map();
const common={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"};
const response=(body,status=200,headers={})=>new Response(body,{status,headers:{...common,...headers}});
export async function authorized(request,fetcher=fetch) {
 const header=request.headers.get('Authorization');if(!header?.startsWith('Basic '))return false;
 let token;try{const decoded=atob(header.slice(6)),separator=decoded.indexOf(':');token=decoded.slice(separator+1);if(separator<1||!/^[A-Za-z0-9_]{20,255}$/.test(token))return false;}catch{return false;}
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 if((authorizationCache.get(digest)||0)>Date.now())return true;
 const result=await fetcher('https://api.github.com/repos/charukun/bloodline-legacy',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'Bloodline-Legacy-Review-Lab','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(8000)});
 if(!result.ok)return false;const repo=await result.json();
 if(repo.full_name!=='charukun/bloodline-legacy'||!(repo.permissions?.push===true||repo.permissions?.admin===true||repo.permissions?.maintain===true))return false;
 if(authorizationCache.size>=128)authorizationCache.clear();authorizationCache.set(digest,Date.now()+60000);return true;
}
export function createWorker(fetcher=fetch) {return {async fetch(request,env){
 // Fail closed even if a review asset is accidentally shipped to a wrong worker.
 if(!['dev','preview'].includes(env.REVIEW_ENV))return response('Not found',404);
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return response('Method not allowed',405,{'Allow':'GET, HEAD'});
 if(!['/','/review','/review/skills','/review/enemies','/review/combat'].includes(url.pathname)&&!/^\/review\/(?:[a-z-]+\.(?:mjs|css|json|html)|assets\/[a-zA-Z0-9/_.-]+)$/.test(url.pathname))return response('Not found',404);
 try{if(!await authorized(request,fetcher))return response('Review Lab: GitHub username and a token with repository metadata read access are required. Only repository writers may enter.',401,{'WWW-Authenticate':'Basic realm="Bloodline Legacy developers - GitHub token", charset="UTF-8"'});}catch{return response('GitHub authorization is temporarily unavailable. Try again.',503);}
 const assetURL=new URL(request.url);assetURL.search='';
 if(['/', '/review','/review/skills','/review/enemies','/review/combat'].includes(url.pathname))assetURL.pathname='/review/index.html';
 // A pinned link is checked by the server before serving the application.
 const version=await env.ASSETS.fetch(new Request(new URL('/review/version.json',request.url)));
 if(!version.ok)return response('Review build unavailable',503);const info=await version.json();
 if(info.environment!==env.REVIEW_ENV||info.commit!==env.REVIEW_SHA)return response('Review build identity mismatch',503);
 if(env.REVIEW_ENV==='preview'&&String(info.pr)!==String(env.REVIEW_PR))return response('Review PR identity mismatch',503);
 if(url.searchParams.has('sha')&&url.searchParams.get('sha')!==info.commit)return response('The requested commit is not deployed at this URL.',409);
 const asset=await env.ASSETS.fetch(new Request(assetURL,{method:request.method}));
 const headers=new Headers(asset.headers);for(const [k,v]of Object.entries(common))headers.set(k,v);
 return new Response(request.method==='HEAD'?null:asset.body,{status:asset.status,headers});
}};}
export default createWorker();
