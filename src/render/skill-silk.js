/* Silk slash: continuous, tapered surfaces with a time-continuous material.
 * Design: tension -> advancing edge -> open crescent -> contact -> erosion.
 * No simulation state, global time, textures or per-frame random sampling.
 * Surface 24 reuses the normal attribute for (longitudinal UV, transverse UV,
 * erosion phase). Other material/character attribute contracts are unchanged. */
const SkillSilk=(()=>{
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
 const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
 const point=(path,u)=>{
  if(path==='pierce')return [.06*Math.sin(u*Math.PI),1.12,.2+u*2.1];
  if(path==='fall')return [.04*Math.sin(u*4),2.6-u*1.9,.35+u*1.92];
  const a=(path==='orbit'?-5:-1.55)+(path==='orbit'?6.4:1.98)*u;
  return [Math.sin(a)*(path==='orbit'?1.45:1.65),.6+.85*Math.sin(u*Math.PI),.05+Math.cos(a)*1.8];
 };
 const difference=(a,b)=>a.map((v,i)=>v-b[i]);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const normal=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
 function surface(path,start,end,width,age,alpha,segments,offset=0){
  const sections=[];
  for(let j=0;j<=segments;j++){
   const u=j/segments,t=lerp(start,end,u),p=point(path,t),axis=path==='fall'?[1,0,0]:[0,.72,.69];
   const tangent=difference(point(path,t+.002),point(path,t-.002)),side=normal(cross(tangent,axis));
   // Zero-width endpoints, long fine tail and fullness just behind the tip.
   const envelope=Math.pow(Math.sin(Math.PI*u),.75)*(.32+.68*u),w=width*envelope;
   const center=p.map((x,i)=>x+side[i]*offset);
   sections.push({a:center,b:center.map((x,i)=>x+side[i]*w)});
  }
  return {kind:'ribbon',sections,age,alpha,color:'#fff0d4'};
 }
 function stroke(recipe,u,quality='high'){
  if(!Number.isFinite(u)||u<0||u>1)return [];
  const n=quality==='low'?24:48,grow=smooth(0,.42,u),fade=1-smooth(.76,1,u);
  if(grow*fade<.002)return [];
  const head=clamp(u),start=Math.max(0,head-(recipe.path==='orbit'?.48:.63)*grow);
  const age=smooth(.48,1,u),width=(recipe.path==='pierce'?.23:.58)*grow;
  const out=[surface(recipe.path,start,head,width,age,.95*fade,n)];
  // Two fine inner filaments separate from the broad translucent wake.
  for(let j=0;j<(quality==='low'?1:2);j++){
   const lag=.035+j*.045;
   out.push(surface(recipe.path,Math.max(0,start-lag),Math.max(0,head-lag),.055-j*.018,age,.32*fade,n/2,.12+j*.12));
  }
  return out;
 }
 // Same analytic mask as surface 24 in shaders.js. Values are smooth in time;
 // the inspection adapter samples this function without texture frame stepping.
 function mask(u,v,age){
  const warp=Math.sin(u*19+age*.9)*.055+Math.sin(u*43-age)*.012;
  const fiber=Math.pow(.5+.5*Math.sin((v+warp)*82+Math.sin(u*23)*2.2),7);
  const core=Math.exp(-Math.pow((v-.12)/.065,2));
  const wake=Math.exp(-v*3.8)*(.14+.64*fiber);
  const grain=.5+.5*Math.sin(u*39+v*16+Math.sin(u*17-v*6)*1.7);
  const erosion=smooth(age*.95-.22,age*.95+.06,grain+.18*(1-v));
  const edge=smooth(0,.025,v)*(1-smooth(.86,1,v));
  const ends=smooth(0,.045,u)*(1-smooth(.93,1,u));
  return {alpha:clamp((core*.9+wake)*erosion*edge*ends),light:core};
 }
 function geometry(ribbon,transform=v=>v){
  const sections=ribbon.sections.map(s=>({a:transform(s.a),b:transform(s.b)}));
  const center=sections[Math.floor(sections.length/2)].a;
  const P=[],N=[];let radius=0;
  const vertex=(p,u,v)=>{const q=difference(p,center);radius=Math.max(radius,Math.hypot(...q));P.push(...q);N.push(u,v,ribbon.age);};
  const count=sections.length-1;
  for(let j=0;j<count;j++){
   const a=sections[j],b=sections[j+1],u=j/count,v=(j+1)/count;
   vertex(a.a,u,0);vertex(a.b,u,1);vertex(b.b,v,1);
   vertex(a.a,u,0);vertex(b.b,v,1);vertex(b.a,v,0);
  }
  return {positions:new Float32Array(P),normals:new Float32Array(N),count:P.length/3,radius,center,dirty:true};
 }
 function trail(samples,eye,time,quality='high'){
  if(samples.length<2)return null;
  const pts=[...samples].reverse().map(s=>s.p),n=quality==='low'?20:36,sections=[];
  const curve=u=>{
   if(u<=0)return [...pts[0]];if(u>=1)return [...pts.at(-1)];
   const x=clamp(u)*(pts.length-1),j=Math.min(pts.length-2,Math.floor(x)),t=x-j;
   const a=pts[Math.max(0,j-1)],b=pts[j],c=pts[j+1],d=pts[Math.min(pts.length-1,j+2)];
   return b.map((v,i)=>.5*((2*v)+(-a[i]+c[i])*t+(2*a[i]-5*v+4*c[i]-d[i])*t*t+(-a[i]+3*v-3*c[i]+d[i])*t*t*t));
  };
  const fade=clamp(1-(time-samples[0].t)/.105);
  for(let j=0;j<=n;j++){
   const u=j/n,p=curve(u),tangent=difference(curve(clamp(u+.002)),curve(clamp(u-.002)));
   const view=eye?difference(eye,p):[0,10,10],side=normal(cross(tangent,view));
   const width=.26*Math.pow(Math.sin(Math.PI*u),.8)*fade;
   sections.push({a:p,b:p.map((v,i)=>v+side[i]*width)});
  }
  return {kind:'ribbon',sections,age:1-fade,alpha:fade*.88,color:'#fff0d4'};
 }
 return Object.freeze({stroke,mask,geometry,trail,surface:24});
})();
