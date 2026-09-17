const common={
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Cross-Origin-Resource-Policy':'same-origin',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
};
const response=(body,status=200,headers={})=>new Response(body,{status,headers:{...common,...headers}});

export default {
  async fetch(request,env){
    if(!['GET','HEAD'].includes(request.method))return response('Method not allowed',405,{'Allow':'GET, HEAD'});
    const url=new URL(request.url);
    if(url.pathname==='/'||url.pathname==='/review'){
      const target=new URL('/review/combat?skill=4001&enemy=soldier',url.origin);
      return Response.redirect(target,302);
    }
    if(!['/review/skills','/review/enemies','/review/combat'].includes(url.pathname)&&
       !/^\/review\/(?:[a-z-]+\.(?:mjs|css|json|html)|assets\/[a-zA-Z0-9/_.-]+)$/.test(url.pathname)){
      return response('Not found',404);
    }
    const assetURL=new URL(request.url);
    assetURL.search='';
    if(['/review/skills','/review/enemies','/review/combat'].includes(url.pathname))assetURL.pathname='/review/index.html';
    const asset=await env.ASSETS.fetch(new Request(assetURL,{method:request.method}));
    const headers=new Headers(asset.headers);
    for(const [key,value] of Object.entries(common))headers.set(key,value);
    return new Response(request.method==='HEAD'?null:asset.body,{status:asset.status,headers});
  }
};
