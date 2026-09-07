/* Original compact geometry toolkit. Positions, normals and transforms are shared by all instances. */
const RTAU=Math.PI*2;
function rColor(hex,alpha=1){let n=parseInt(hex.replace('#',''),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,alpha];}
function rMultiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
function rOrtho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
function rLookAt(eye,tar){const norm=v=>{const l=Math.hypot(...v)||1;return v.map(a=>a/l)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);const z=norm(eye.map((x,i)=>x-tar[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function rModel(x=0,y=0,z=0,sx=1,sy=1,sz=1,yaw=0,rz=0,rx=0){const c=Math.cos(yaw),s=Math.sin(yaw),cz=Math.cos(rz),snz=Math.sin(rz),cx=Math.cos(rx),sn=Math.sin(rx);return [c*cz*sx,snz*sx,-s*cz*sx,0,(-c*snz*cx+s*sn)*sy,cz*cx*sy,(s*snz*cx+c*sn)*sy,0,(c*snz*sn+s*cx)*sz,-cz*sn*sz,(-s*snz*sn+c*cx)*sz,0,x,y,z,1];}
const RG_CACHE=new Map();
function rGeometry(type){
 if(RG_CACHE.has(type))return RG_CACHE.get(type);
 const p=[],n=[],uv=[],vcol=[];
 const tri=(a,b,c,na=null,nb=null,nc=null)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((w,i)=>w-a[i]),q=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...q)||1,normal=q.map(x=>x/l);p.push(...a,...b,...c);n.push(...(na||normal),...(nb||normal),...(nc||normal));};
 const quad=(a,b,c,d,na=null,nb=null,nc=null,nd=null)=>{tri(a,b,c,na,nb,nc);tri(a,c,d,na,nc,nd);};
 const normalize=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
 if(type==='rbox'||type==='softbox'||type==='box'){
  const N=type==='box'?1:type==='softbox'?4:3,r=type==='box'?.0001:type==='softbox'?.24:.12;
  for(const [axis,sign] of [[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]]){
   const V=(i,j)=>{const a=[0,0,0];a[axis]=.5*sign;a[(axis+1)%3]=i/N-.5;a[(axis+2)%3]=j/N-.5;const q=a.map(v=>Math.max(-.5+r,Math.min(.5-r,v))),nn=normalize(a.map((v,k)=>v-q[k]));return{p:q.map((v,k)=>v+nn[k]*r),n:type==='box'?[axis===0?sign:0,axis===1?sign:0,axis===2?sign:0]:nn}};
   for(let i=0;i<N;i++)for(let j=0;j<N;j++){const a=V(i,j),b=V(i+1,j),c=V(i+1,j+1),d=V(i,j+1);if(sign>0)quad(a.p,b.p,c.p,d.p,a.n,b.n,c.n,d.n);else quad(a.p,d.p,c.p,b.p,a.n,d.n,c.n,b.n);}
  }
 }else if(type==='coat'){
  const seg=20,rings=12;const V=(i,j)=>{const u=i/rings,a=j/seg*RTAU;const radial=.37+.11*Math.exp((-(((u-.78)/.26)**2)))+.025*Math.cos(u*Math.PI*3),x=Math.sin(a)*radial,z=Math.cos(a)*radial*.70;return {p:[x,.5-u,z],n:normalize([Math.sin(a),u<.15?.45:u>.90?-.15:0,Math.cos(a)*1.25])}};
  for(let i=0;i<rings;i++)for(let j=0;j<seg;j++){const a=V(i,j),b=V(i+1,j),c=V(i+1,j+1),d=V(i,j+1);quad(a.p,b.p,c.p,d.p,a.n,b.n,c.n,d.n);}
 }else if(['sphere','bead','cap','head','leaf','leaflow'].includes(type)){
  const seg=type==='leaflow'?6:type==='bead'?10:type==='head'?24:type==='leaf'?10:16,rings=type==='leaflow'?4:type==='head'?16:type==='bead'?6:10;
  const V=(i,j)=>{const lat=(i/rings)*(type==='cap'?Math.PI*.56:Math.PI),lon=j/seg*RTAU;let a=[Math.sin(lat)*Math.sin(lon),Math.cos(lat),Math.sin(lat)*Math.cos(lon)];
   if(type==='head'){a[0]*=.95+Math.max(0,-a[1])*.12;a[2]*=.89;if(a[2]>.45)a[2]=.45+(a[2]-.45)*.84;}if(type==='leaf'||type==='leaflow'){a[0]*=(1+a[1])*.6;a[2]*=.45;}
   return {p:a,n:normalize([a[0],a[1],a[2]*(type==='head'?1.15:type==='leaf'||type==='leaflow'?2:1)])}};
  for(let i=0;i<rings;i++)for(let j=0;j<seg;j++){const a=V(i,j),b=V(i+1,j),c=V(i+1,j+1),d=V(i,j+1);if(i>0)tri(a.p,b.p,d.p,a.n,b.n,d.n);if(i<rings-1||type==='cap')tri(b.p,c.p,d.p,b.n,c.n,d.n);}
 }else if(['cylinder','cone','trunk','hair','horn'].includes(type)){
  const seg=type==='hair'?8:12,rings=['hair','horn','trunk'].includes(type)?6:1;
  const V=(i,j)=>{const u=i/rings,y=.5-u,a=j/seg*RTAU;let rad=1,dx=0,dz=0;
   if(type==='cone')rad=u;
   if(type==='trunk')rad=.62+.35*u**4;
   if(type==='hair'){rad=Math.sin(Math.PI*(.12+u*.88))**.65;dx=u*u*.35;dz=u*u*.60;}
   if(type==='horn'){rad=u*.85+.025;dx=(-((1-u)**2))*.9;dz=(-((1-u)**2))*.12;}
   return {p:[Math.sin(a)*rad+dx,y,Math.cos(a)*rad+dz],n:normalize([Math.sin(a),type==='hair'?.35*(u-.5):type==='cone'?.45:0,Math.cos(a)])}};
  for(let i=0;i<rings;i++)for(let j=0;j<seg;j++){const a=V(i,j),b=V(i+1,j),c=V(i+1,j+1),d=V(i,j+1);quad(a.p,b.p,c.p,d.p,a.n,b.n,c.n,d.n);}
  for(let j=0;j<seg;j++){tri([0,.5,0],V(0,j).p,V(0,j+1).p);tri([0,-.5,0],V(rings,j+1).p,V(rings,j).p);}
 }else if(type==='torus'){
  const major=28,minor=8;
  const V=(i,j)=>{const a=i/major*RTAU,b=j/minor*RTAU;return {p:[Math.sin(a)*(.86+.14*Math.cos(b)),Math.cos(a)*(.86+.14*Math.cos(b)),.14*Math.sin(b)],n:[Math.sin(a)*Math.cos(b),Math.cos(a)*Math.cos(b),Math.sin(b)]}};
  for(let i=0;i<major;i++)for(let j=0;j<minor;j++){const a=V(i,j),b=V(i+1,j),c=V(i+1,j+1),d=V(i,j+1);quad(a.p,b.p,c.p,d.p,a.n,b.n,c.n,d.n);}
 }else if(type==='arch'){
  const outline=[[-.5,-.5],[.5,-.5],[.5,.04]];for(let i=0;i<=16;i++){let a=i/16*Math.PI;outline.push([Math.cos(a)*.5,.04+Math.sin(a)*.5]);}outline.push([-.5,-.5]);
  for(let j=0;j<outline.length-1;j++){const a=outline[j],b=outline[j+1];tri([0,0,.5],[...a,.5],[...b,.5],[0,0,1],[0,0,1],[0,0,1]);tri([0,0,-.5],[...b,-.5],[...a,-.5],[0,0,-1],[0,0,-1],[0,0,-1]);quad([...a,.5],[...a,-.5],[...b,-.5],[...b,.5]);}
 }else if(type==='roof'){
  const a=[-.5,-.5,-.5],b=[.5,-.5,-.5],c=[.5,-.5,.5],d=[-.5,-.5,.5],e=[0,.5,-.5],f=[0,.5,.5];quad(a,d,f,e);quad(b,e,f,c);tri(a,e,b);tri(d,c,f);quad(a,b,c,d);
 }else if(type==='plane'||type==='face'){
  if(type==='face')quad([-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0]);else quad([-1,0,-1],[-1,0,1],[1,0,1],[1,0,-1]);
 }else if(type==='star'){
  for(let i=0;i<10;i++){const a=i/10*RTAU,b=(i+1)/10*RTAU,ra=i%2?.42:1,rb=i%2?1:.42;tri([0,0,.05],[Math.sin(a)*ra,Math.cos(a)*ra,0],[Math.sin(b)*rb,Math.cos(b)*rb,0]);}
 }else if(type==='blade'){
  quad([-.14,0,0],[.14,0,0],[.09,1,0],[0,1.25,0]);quad([-.14,0,0],[0,0,.05],[0,1.25,0],[-.09,1,0]);quad([0,0,.05],[.14,0,0],[.09,1,0],[0,1.25,0]);
 }else if(type==='disk'||type.startsWith('ring:')||type.startsWith('sector:')||type.startsWith('slash:')){
  const arc=type==='disk'?RTAU:Number(type.split(':')[1]),N=Math.max(10,Math.ceil(arc*14));
  for(let i=0;i<N;i++){const a=-arc/2+i/N*arc,b=-arc/2+(i+1)/N*arc,ra=type.startsWith('slash')?1-Math.sin(i/N*Math.PI)*.14:type.startsWith('ring')?.91:0,rb=type.startsWith('slash')?1-Math.sin((i+1)/N*Math.PI)*.14:type.startsWith('ring')?.91:0;quad([Math.sin(a)*ra,0,Math.cos(a)*ra],[Math.sin(a),0,Math.cos(a)],[Math.sin(b),0,Math.cos(b)],[Math.sin(b)*rb,0,Math.cos(b)*rb]);}
 }
 const g={positions:new Float32Array(p),normals:new Float32Array(n),count:p.length/3,radius:type==='rbox'?.87:1.8};RG_CACHE.set(type,g);return g;
}


