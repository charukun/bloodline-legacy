/* A new, deliberately small character. No CM01 mesh, texture, or rig data. */
const TravelerModel = (()=>{
 const definitions=[
  {id:'human',name:'人族',description:'柔らかな髪。旅を継ぐ人々。',body:[1,1,1],head:[1,1,1],skin:'#efbc8c',hair:'#75402b',cape:'#4c674b',pants:'#525b48'},
  {id:'elf',name:'森人',description:'長い耳。細身の森の民。',body:[.90,1.08,.98],head:[.97,.98,1],skin:'#dfcaa8',hair:'#98643a',cape:'#365f5d',pants:'#495d51'},
  {id:'dwarf',name:'山人',description:'小さく頑丈。豊かな髪と髭。',body:[1.18,.84,1.13],head:[1.01,.95,1.04],skin:'#d8a080',hair:'#87462c',cape:'#9a7338',pants:'#574b3c'},
  {id:'fox',name:'狐人',description:'獣の耳と、大きな尾。',body:[.98,.96,1],head:[.97,.96,.99],skin:'#e5b388',hair:'#9b4f2e',cape:'#754752',pants:'#625444'}
 ];
 function create(id='human',lod=0){
 const gender=id==='elf'||id==='fox'?'female':'male';
 const female=gender==='female';if(!['male','female'].includes(gender))throw Error('Unknown sample: '+gender);
 const cfg=definitions.find(r=>r.id===id);if(!cfg)throw Error('Unknown race: '+id);

 const V={add:(a,b)=>a.map((x,i)=>x+b[i]),sub:(a,b)=>a.map((x,i)=>x-b[i]),mul:(a,k)=>a.map(x=>x*k),dot:(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]};
 V.unit=a=>V.mul(a,1/(Math.hypot(...a)||1));
 const skin=cfg.skin,hair=cfg.hair,cream='#efe0ba',green=cfg.cape,leather='#855739',pants=cfg.pants;
 const positions=[],normals=[],colors=[],joints=[],weights=[],surfaces=[],regions=[],materials=[],rigidFeet=[],indices=[];let regionOverride=null,footwear=false;
 const rgb=h=>h.replace('#','').match(/../g).map(x=>parseInt(x,16)/255);
 const pivots=[[0,0,0],[0,1.09,-.018],[.295,.88,0],[-.295,.88,0],[.16,.47,0],[-.16,.47,0],[0,.94,-.168]];
 if(id==='fox')pivots.push([0,.43,-.28]);
 const bodyPoint=p=>p.map((x,i)=>x*cfg.body[i]);
 const headPoint=p=>[p[0]*cfg.head[0],1.01*cfg.body[1]+(p[1]-1.01)*cfg.head[1],p[2]*cfg.head[2]];
 for(let i=0;i<pivots.length;i++)pivots[i]=i===1?headPoint(pivots[i]):bodyPoint(pivots[i]);
 function palette(color){
  if(id==='human')return rgb(color);
  const c=rgb(color),oldHair=rgb('#75402b'),newHair=rgb(hair),oldCape=rgb('#4c674b'),newCape=rgb(green);
  if(['#81492e','#75402b','#874d30','#78432c','#79442c','#7d452c','#7e462e','#774c32'].includes(color))return c.map((x,i)=>Math.max(0,Math.min(1,x+newHair[i]-oldHair[i])));
  if(['#405a40','#627957','#516d4c','#476044'].includes(color))return c.map((x,i)=>Math.max(0,Math.min(1,x+newCape[i]-oldCape[i])));
  return c;
 }
 function mesh(vertices,faces,color,joint=0,rough=.8,metal=0,blend=null){
  const source=vertices;
  vertices=vertices.map((p,i)=>{
   const j=Array.isArray(joint)?joint[i]:joint,w=blend?.[i]??1;
   if(j===1)return headPoint([p[0]*.78,1.01+(p[1]-1.01)*.80,p[2]*1.05-.018]);
   const depth=j===2||j===3?1.20:j===4||j===5?1.25+.15*(1-w):1.40;
   return bodyPoint([p[0],p[1],p[2]*depth]);
  });
  const start=positions.length/3,ns=vertices.map(()=>[0,0,0]);
  for(const f of faces){const n=V.cross(V.sub(vertices[f[1]],vertices[f[0]]),V.sub(vertices[f[2]],vertices[f[0]]));for(const i of f)ns[i]=V.add(ns[i],n);}
  const c=palette(color);
  vertices.forEach((p,i)=>{
   const j=Array.isArray(joint)?joint[i]:joint,s=source[i];let tint=c;
   if(j===1&&color===skin&&s[2]>.25){const blush=.40*Math.exp(-Math.pow((Math.abs(s[0])-.27)/.082,2)-Math.pow((s[1]-1.365)/.059,2));const rose=rgb('#e69b7c');tint=c.map((x,k)=>x*(1-blush)+rose[k]*blush);}
   rigidFeet.push(footwear);positions.push(...p);normals.push(...V.unit(ns[i]));colors.push(...tint);joints.push(j);weights.push(blend?.[i]??1);surfaces.push(rough,metal);regions.push(regionOverride??(j===2?2:j===3?3:j===4?4:j===5?5:0));materials.push(color===skin?0:j===1&&[hair,'#774c32','#81492e','#874d30'].includes(color)?1:2);
  });
  for(const f of faces)indices.push(...f.map(i=>i+start));
 }
 function surface(fn,nu,nv,color,joint=0,rough=.8,metal=0,closedU=true){
  if(lod){nu=Math.max(3,Math.round(nu*.65));nv=Math.max(1,Math.round(nv*.7));}const v=[],f=[],cols=closedU?nu:nu+1;
  for(let i=0;i<=nv;i++)for(let j=0;j<cols;j++)v.push(fn(j/nu,i/nv));
  for(let i=0;i<nv;i++)for(let j=0;j<nu;j++){let a=i*cols+j,b=i*cols+(j+1)%cols,c=a+cols,d=b+cols;f.push([a,b,c],[b,d,c]);}
  mesh(v,f,color,joint,rough,metal);
 }
 function catmull(a,b,c,d,t){return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
 function rings(rows,n,color,joint=0,rough=.8,metal=0,profile=null){
  n=Math.min(n,joint===1?32:24);if(lod)n=Math.max(8,Math.round(n*.65));
  const v=[],f=[],count=(rows.length-1)*(joint===1?3:2);
  for(let i=0;i<=count;i++){
   const u=i/count*(rows.length-1),k=Math.min(rows.length-2,Math.floor(u)),t=u-k;
   const r=rows[0].map((_,axis)=>catmull(rows[Math.max(0,k-1)][axis],rows[k][axis],rows[k+1][axis],rows[Math.min(rows.length-1,k+2)][axis],t));
   for(let j=0;j<n;j++){const a=j/n*Math.PI*2;v.push([r[3]+Math.sin(a)*Math.max(.001,r[1]),r[0]+(profile?profile(a,i/count):0),r[4]+Math.cos(a)*Math.max(.001,r[2])]);}
  }
  for(let i=0;i<count;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=a+n,d=b+n;f.push([a,b,c],[b,d,c]);}
  const bottom=v.length;v.push([rows[0][3],rows[0][0],rows[0][4]]);const top=v.length;v.push([rows.at(-1)[3],rows.at(-1)[0],rows.at(-1)[4]]);
  for(let j=0;j<n;j++){f.push([bottom,(j+1)%n,j]);f.push([top,count*n+j,count*n+(j+1)%n]);}
  mesh(v,f,color,joint,rough,metal);
 }
 function oval(c,r,color,joint=0,rough=.8,metal=0,n=20,m=12){
  n=Math.min(n,16);m=Math.min(m,10);
  surface((u,v)=>{const a=u*Math.PI*2,b=(.0001+v*.9998)*Math.PI;return [c[0]+Math.sin(a)*Math.sin(b)*r[0],c[1]-Math.cos(b)*r[1],c[2]+Math.cos(a)*Math.sin(b)*r[2]];},n,m,color,joint,rough,metal);
 }
 function curve(points,t){let p=points.map(x=>[...x]);for(let k=p.length-1;k>0;k--)for(let i=0;i<k;i++)p[i]=p[i].map((x,j)=>x*(1-t)+p[i+1][j]*t);return p[0];}
 function lock(points,width,depth,color=hair,joint=1,rough=.59){
  const v=[],f=[],n=lod?7:10,m=lod?8:12;
  for(let i=0;i<=m;i++){
   const t=.0001+i/m*.9998,c=curve(points,t),tangent=V.unit(V.sub(curve(points,Math.min(1,t+.001)),curve(points,Math.max(0,t-.001))));
   const side=V.unit(V.cross(tangent,[0,0,1])),out=V.unit(V.cross(side,tangent));
   const size=Math.pow(Math.sin(Math.PI*t),.42)*(1-.30*t);
   for(let j=0;j<n;j++){const a=j/n*Math.PI*2;v.push(V.add(c,V.add(V.mul(side,Math.cos(a)*width*size),V.mul(out,Math.sin(a)*depth*size))));}
  }
  for(let i=0;i<m;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=a+n,d=b+n;f.push([a,c,b],[b,c,d]);}
  mesh(v,f,color,joint,rough);
 }
 function smile(){
  // Small painted-looking smile laid onto the curved cheek surface.
  surface((u,v)=>{const x=(u-.5)*.112,y=1.348+.021*Math.pow(x/.056,2)+(v-.5)*.007;return [x,y,.412-.18*x*x];},16,1,'#805344',1,.9,0,false);
 }
 // Rounded tunic body: one continuous pear-shaped shell from hem to neck.
 rings([[.43,.22,.125,0,0],[.48,.285,.16,0,0],[.61,.315,.19,0,0],[.76,.29,.175,0,0],[.88,.27,.14,0,0],[.98,.145,.105,0,0],[1.02,.12,.092,0,0]],28,cream);
 // Equipment shell shares the body rig and character draw. Hidden when unarmored.
 regionOverride=10;
 rings([[.545,.283,.174,0,0],[.60,.332,.207,0,0],[.75,.311,.193,0,0],[.87,.290,.164,0,0],[.94,.195,.130,0,0]],24,leather,0,.72);
 regionOverride=null;
 // One connected pair of trousers. The waist and curved crotch share vertices;
 // the upper fabric stays with the pelvis while the lower legs swing.
 {
  const v=[],f=[],js=[],ws=[],shared=new Map(),n=28,steps=14;
  const ease=t=>t*t*(3-2*t);
  for(const side of [-1,1]){
   const rows=[];
   for(let i=0;i<=steps;i++){
    const t=i/steps,s=ease(t),row=[];
    for(let k=0;k<n;k++){
     const a=k/n*Math.PI*2,sn=Math.sin(a),cs=Math.cos(a),outer=Math.max(0,sn);
     const topY=sn>=0?.56:.36+.20*cs*cs;
     const x=side*((1-s)*(.16+.085*sn)+s*.29*outer);
     const y=.14+t*(topY-.14),z=((1-s)*.082+s*.17+.012*Math.sin(t*Math.PI))*cs;
     const key=i===steps&&sn<1e-8?y.toFixed(8)+':'+z.toFixed(8):null;
     let index=key!==null?shared.get(key):undefined;
     if(index===undefined){index=v.length;v.push([Math.abs(x)<1e-8?0:x,y,z]);js.push(side>0?4:5);ws.push(1-ease(Math.max(0,Math.min(1,(t-.38)/.62))));if(key!==null)shared.set(key,index);}
     row.push(index);
    }
    rows.push(row);
   }
   for(let i=0;i<steps;i++)for(let k=0;k<n;k++){
    const a=rows[i][k],b=rows[i][(k+1)%n],c=rows[i+1][k],d=rows[i+1][(k+1)%n];
    if(side>0)f.push([a,b,c],[b,d,c]);else f.push([a,c,b],[b,c,d]);
   }
  }
  mesh(v,f,pants,js,.92,0,ws);
 }
 // Keep each boot and its cuff rigid when the runtime bends the short legs.
 footwear=true;
 for(const side of [-1,1]){
  const joint=side>0?4:5,x=side*.16;
  rings([[.024,.085,.13,x,.036],[.038,.117,.165,x,.048],[.08,.12,.17,x,.054],[.125,.112,.15,x,.05],[.17,.087,.093,x,.005],[.205,.085,.086,x,0]],24,leather,joint,.7);
  rings([[.018,.09,.14,x,.043],[.026,.12,.17,x,.05],[.047,.12,.17,x,.05],[.055,.11,.16,x,.045]],24,'#4c392c',joint,.83);
  rings([[.180,.092,.092,x,0],[.193,.108,.104,x,0],[.235,.107,.103,x,0],[.251,.090,.088,x,0]],20,'#a47a4d',joint,.81);
 }
 footwear=false;
 // Short sleeves are continuous shaped tubes; hands are closed mitten forms.
 for(const side of [-1,1]){
  const joint=side>0?2:3;
  rings([[.60,.08,.08,side*.40,.005],[.65,.106,.105,side*.395,0],[.76,.112,.11,side*.357,0],[.87,.10,.10,side*.302,0],[.92,.052,.063,side*.257,0],[.943,.008,.013,side*.237,0]],20,cream,joint,.88);
  rings([[.594,.086,.088,side*.402,.005],[.61,.091,.092,side*.403,.005],[.64,.093,.094,side*.397,0]],20,'#baac81',joint,.9);
  rings([[.435,.025,.035,side*.414,.025],[.454,.070,.065,side*.42,.02],[.51,.086,.071,side*.422,.009],[.567,.079,.073,side*.412,.007],[.611,.059,.058,side*.40,.005]],20,skin,joint,.72);
  oval([side*.354,.526,.051],[.038,.049,.037],skin,joint,.72,0,12,8);
 }
 // One broad belt and one small pouch; no layered micro-detail.
 rings([[.47,.279,.16,0,0],[.485,.297,.174,0,0],[.538,.306,.18,0,0],[.55,.302,.177,0,0]],28,leather,0,.72);
 oval([0,.516,.181],[.043,.038,.016],'#cfa557',0,.35,.75,16,8);
 rings([[.374,.047,.025,-.225,.162],[.397,.067,.036,-.225,.17],[.51,.072,.034,-.225,.17],[.535,.058,.028,-.225,.166]],16,leather,0,.73);
 rings([[.461,.034,.010,-.225,.204],[.472,.064,.014,-.225,.204],[.526,.066,.014,-.225,.195],[.536,.059,.014,-.225,.190]],16,'#936441',0,.76);
 oval([-.225,.478,.218],[.010,.010,.006],'#cfa557',0,.42,.6,10,6);
 // Cloth thickness and a folded hood follow the generated side/back design.
 const cape=(u,v,inset=0)=>{const a=.94+u*(Math.PI*2-1.88),r=.17+v*.24-inset;return [Math.sin(a)*r,.98-v*((id==='fox'?.40:.48)+.025*Math.cos(a)),Math.cos(a)*(.14+v*.12-inset)-.035];};
 surface((u,v)=>cape(u,1-v),24,10,green,6,.92,0,false);
 surface((u,v)=>cape(1-u,1-v,.009),24,10,'#405a40',6,.94,0,false);
 surface((u,v)=>{const a=cape(u,1),b=cape(u,1,.009);return a.map((x,i)=>x*(1-v)+b[i]*v);},24,1,'#627957',6,.91,0,false);
 for(const edge of [0,1])surface((u,v)=>{const a=cape(edge,u),b=cape(edge,u,.009);return a.map((x,i)=>x*(1-v)+b[i]*v);},12,1,green,6,.92,0,false);
 rings([[.66,.014,.013,0,-.24],[.71,.10,.035,0,-.242],[.82,.182,.066,0,-.223],[.92,.198,.073,0,-.184],[.974,.165,.06,0,-.135]],24,'#516d4c',6,.90);
 lock([[0,.69,-.269],[0,.77,-.288],[0,.86,-.29],[0,.93,-.253]],.003,.0025,'#476044',6,.95);
 // A thick, continuous collar hides the head/neck junction naturally.
 rings([[.90,.15,.125,0,0],[.925,.202,.15,0,0],[.974,.207,.154,0,0],[1.005,.175,.138,0,0],[1.017,.145,.11,0,0]],28,green,0,.88);
 oval([0,.948,.157],[.030,.037,.020],'#d9b064',0,.35,.8,16,8);
 // New head topology: soft jaw, wide cheeks, large forehead. About half the height.
 const headRows=[[1.005,.055,.05,0,.01],[1.03,.20,.18,0,.01],[1.11,.355,.285,0,.009],[1.25,.463,.363,0,.008],[1.43,.515,.408,0,0],[1.62,.511,.409,0,-.014],[1.8,.437,.352,0,-.025],[1.96,.277,.224,0,-.025],[2.015,.025,.022,0,-.025]];
 rings(headRows,40,skin,1,.73);
 for(const side of [-1,1]){
  if(id!=='elf'&&id!=='fox'){oval([side*.502,1.40,-.007],[.073,.105,.054],skin,1,.76,0,16,10);
  oval([side*.528,1.402,.039],[.030,.051,.007],'#d99a76',1,.9,0,12,8);}
  // Button eyes with very small highlights; no separate white eyeballs.
  oval([side*.168,1.491,.397],[.039,.057,.022],'#38291f',1,.48,0,20,12);
  oval([side*.168-.011,1.515,.417],[.0085,.010,.003],'#fff0d4',1,.34,0,10,8);
  const x=side*.168;
  lock([[x-.048,1.581,.391],[x-.020,1.601,.407],[x+.020,1.601,.407],[x+.048,1.584,.391]],.012,.007,'#774c32',1,.84);
 }
 oval([0,1.414,.411],[.025,.024,.024],'#edb487',1,.81,0,16,10);
 smile();

 // Species silhouettes use curved volumes, not texture-only recolors.
 if(id==='elf')for(const s of [-1,1]){
  const v=[],f=[],n=16,m=12;
  for(let i=0;i<=m;i++){
   const t=i/m,width=.115*Math.pow(Math.sin(Math.PI*(.20+.80*t)),.75)+.001;
   for(let k=0;k<n;k++){const a=k/n*Math.PI*2;v.push([s*(.47+.37*t),1.39+.25*t+Math.cos(a)*width,-.014-.20*t+Math.sin(a)*width*.52]);}
  }
  for(let i=0;i<m;i++)for(let k=0;k<n;k++){const a=i*n+k,b=i*n+(k+1)%n,c=a+n,d=b+n;if(s>0)f.push([a,c,b],[b,c,d]);else f.push([a,b,c],[b,d,c]);}
  const cap=v.length;v.push([s*.47,1.39,-.014]);for(let k=0;k<n;k++)f.push([cap,k,(k+1)%n]);
  const tip=v.length;v.push([s*.84,1.64,-.214]);for(let k=0;k<n;k++)f.push([tip,m*n+(k+1)%n,m*n+k]);
  mesh(v,f,skin,1,.76);
  surface((u,v)=>{const t=.12+.76*v,w=.061*Math.sin(Math.PI*v);return [s*(.47+.37*t),1.39+.25*t+(u-.5)*2*w,.039-.20*t+.01*Math.sin(Math.PI*v)];},6,10,'#c89977',1,.9,0,false);
 }
 if(id==='dwarf'&&!female){
  regionOverride=13;
  // A single rounded beard shell hugs the jaw; the mouth remains visible.
  rings([[.998,.045,.035,0,.19],[1.03,.17,.073,0,.23],[1.12,.30,.108,0,.28],[1.23,.39,.110,0,.31],[1.30,.375,.086,0,.345]],28,hair,1,.84,0,(a,t)=>.09*Math.sin(a)**2*t*t);
  for(const s of [-1,1]){
   lock([[s*.40,1.42,.20],[s*.43,1.28,.32],[s*.34,1.10,.36],[s*.17,1.035,.30]],.070,.036,hair,1,.84);
   lock([[s*.055,1.40,.41],[s*.14,1.42,.445],[s*.21,1.365,.447],[s*.27,1.37,.40]],.040,.035,hair,1,.8);
  }
 }
 regionOverride=null;
 if(id==='fox')for(const s of [-1,1]){
  rings([[1.88,.11,.083,s*.36,-.003],[2.015,.133,.098,s*.405,0],[2.20,.080,.057,s*.455,-.012],[2.33,.002,.002,s*.465,-.025]],18,hair,1,.81);
  surface((u,v)=>{const y=1.985+.29*v,w=.084*Math.pow(Math.sin(Math.PI*v),.65);return [s*(.40+.065*v)+(u-.5)*2*w,y,.090-.10*v];},8,12,'#ead4ae',1,.93,0,false);
 }
 // Four separate hairstyles, sharing only curve construction and the head bone.
 const hairStart=positions.length/3;
 // One connected hair shell: its perimeter, roots and flowing ridges share
 // vertices. The hairline conforms to the very same loft as the face.
 const pi=Math.PI,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 function headSection(y){
  let k=0;while(k<headRows.length-2&&headRows[k+1][0]<y)k++;
  const evalAt=(axis,t)=>catmull(headRows[Math.max(0,k-1)][axis],headRows[k][axis],headRows[k+1][axis],headRows[Math.min(headRows.length-1,k+2)][axis],t);
  let lo=0,hi=1;for(let i=0;i<14;i++){const t=(lo+hi)/2;if(evalAt(0,t)<y)lo=t;else hi=t;}
  return [evalAt(1,(lo+hi)/2),evalAt(2,(lo+hi)/2),evalAt(4,(lo+hi)/2)];
 }
 function profile(keys,a){
  a=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));
  let k=0;while(k<keys.length-2&&keys[k+1][0]<a)k++;
  const t=ease((a-keys[k][0])/(keys[k+1][0]-keys[k][0]));return keys[k][1]*(1-t)+keys[k+1][1]*t;
 }
 function hairShell(){
  const settings={
   human:{edge:[[0,1.67],[.65,1.62],[1.05,1.53],[1.45,1.40],[1.8,1.40],[2.3,1.24],[pi,1.23]],lift:.105,sweep:.48,ridge:.059},
   elf:{edge:[[0,1.875],[.30,1.845],[.62,1.785],[1.10,1.57],[1.45,1.49],[1.8,1.42],[2.4,1.255],[pi,1.27]],lift:.081,sweep:-.28,ridge:.034},
   dwarf:{edge:[[0,1.77],[.40,1.795],[.82,1.69],[1.15,1.57],[1.5,1.44],[1.9,1.43],[2.5,1.255],[pi,1.25]],lift:.115,sweep:-.65,ridge:.058},
   fox:{edge:[[0,1.66],[.72,1.665],[.95,1.61],[1.12,1.22],[1.45,1.16],[2.1,1.19],[pi,1.20]],lift:.079,sweep:0,ridge:.031}
  }[id];
  const v=[],f=[],shade=[],n=lod?48:id==='dwarf'?60:80,m=lod?11:id==='dwarf'?20:14,top=2.015+settings.lift;
  for(let i=-1;i<m;i++)for(let k=0;k<n;k++){
   const a=k/n*2*pi,front=Math.max(0,Math.cos(a)),side=Math.abs(Math.sin(a));
   // Small perimeter variations are designed tufts, not a straight cap cut.
   const wave=(1+Math.cos(a*(id==='human'?9:12)+.45))/2;
   let edge=profile(settings.edge,a);
   if(id==='human')edge-=.075*Math.pow(wave,3)*front+.033*Math.sin(a*2+.3)*front+.027*Math.pow((1+Math.cos(a*13))/2,4)*(1-front);
   if(id==='dwarf'||id==='elf')edge+=.011*Math.sin(a*15)*Math.sin(a*5);
   if(id==='fox')edge-=.009*Math.pow((1+Math.cos(a*15))/2,5)*front;
   const t=Math.max(0,i)/m,arc=Math.sin(t*pi/2),y=edge+(top-edge)*arc;
   const section=headSection(y-settings.lift*ease(t));
   let rx=section[0],rz=section[1],cz=section[2];
   // A bob needs a continuous hanging curtain, not detached side sausages.
   const bob=id==='fox'?ease((Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))-.85)/.4):0;
   const skirt=bob*(1-ease((y-1.48)/.45));
   rx=rx*(1-skirt)+(.478+.062*Math.sin(clamp((y-1.14)/.7)*pi))*skirt;
   rz=rz*(1-skirt)+(.385+.035*Math.sin(clamp((y-1.14)/.7)*pi))*skirt;
   const flow=a+settings.sweep*ease(t)*(id==='elf'?Math.sign(Math.sin(a)):1);
   const ridge=Math.pow((1+Math.cos(flow*(id==='human'?9:10)))/2,2);
   const emergence=ease(t/.17),envelope=Math.pow(Math.sin(pi*t),.85);
   let thickness=.005+.018*envelope+settings.ridge*ridge*envelope*emergence;
   if(id==='fox')thickness+=.024*front*envelope;
   if(id==='elf')thickness-=.020*Math.exp(-Math.pow(Math.sin(a)/.06,2))*front*envelope;
   if(i===-1)thickness=-.007;
   const radial=i===-1&&bob>.1?-.014:thickness;
   const crest=id==='dwarf'&&i>=0?front*front*envelope:0;
   const tousle=id==='human'&&i>=0?.032*side*ridge*envelope:0;
   v.push([Math.sin(a)*(rx+radial+tousle),y+(i===-1?.012:0)+.065*crest,Math.cos(a)*(rz+radial)+cz+.065*crest]);
   shade.push(i===-1?.82:.96+.065*ridge*envelope);
  }
  for(let i=0;i<m;i++)for(let k=0;k<n;k++){const a=i*n+k,b=i*n+(k+1)%n,c=a+n,d=b+n;f.push([a,b,c],[b,d,c]);}
  const apex=v.length;v.push([0,top,-.025]);shade.push(1);
  for(let k=0;k<n;k++)f.push([m*n+k,m*n+(k+1)%n,apex]);
  const start=positions.length/3;mesh(v,f,hair,1,.70);
  for(let i=0;i<v.length;i++)for(let c=0;c<3;c++)colors[(start+i)*3+c]*=shade[i];
 }
 // Stable circular frame for a broad ponytail. No hair physics or added bones.
 function pony(points){
  const v=[],f=[],n=lod?8:12,m=lod?16:24;
  for(let i=0;i<=m;i++){
   const t=i/m,c=curve(points,t),tan=V.unit(V.sub(curve(points,Math.min(1,t+.002)),curve(points,Math.max(0,t-.002)))),side=V.unit(V.cross(tan,[1,0,0])),out=V.unit(V.cross(side,tan));
   const r=.036*(1-t)+.155*Math.pow(Math.sin(Math.PI*t),.65);
   for(let k=0;k<n;k++){const a=k/n*Math.PI*2;v.push(V.add(c,V.add(V.mul(side,r*Math.cos(a)),V.mul(out,r*.88*Math.sin(a)))));}
  }
  for(let i=0;i<m;i++)for(let k=0;k<n;k++){const a=i*n+k,b=i*n+(k+1)%n,c=a+n,d=b+n;f.push([a,c,b],[b,c,d]);}
  mesh(v,f,hair,1,.71);
 }
 hairShell();
 if(id==='human'){
  // Only the free crown tip is separate; its narrow root is buried in the shell.
  lock([[.045,2.075,-.025],[.17,2.17,-.045],[.13,2.25,-.04],[-.025,2.235,-.05]],.046,.030,hair);
 }
 if(id==='elf'){
  pony([[.08,2.00,-.24],[.05,2.50,-.48],[.20,2.20,-.78],[.26,1.38,-.72],[.29,1.20,-.42]]);
  oval([.084,2.014,-.294],[.101,.064,.038],green,1,.89,0,14,8);
 }
 const hairEnd=positions.length/3;
 if(female)for(const side of [-1,1])lock([[side*.190,1.520,.413],[side*.205,1.526,.414],[side*.216,1.537,.406]],.006,.005,'#38291f',1,.8);
 if(id==='fox'){
  const v=[],f=[],m=lod?16:24,n=lod?10:16;
  const path=[[0,.43,-.21],[.03,.28,-.48],[.38,.33,-.65],[.68,.59,-.69],[.49,.95,-.60]];
  for(let i=0;i<=m;i++){
   const t=i/m,c=curve(path,t),tan=V.unit(V.sub(curve(path,Math.min(1,t+.002)),curve(path,Math.max(0,t-.002))));
   const side=V.unit(V.cross(tan,[0,0,1])),out=V.unit(V.cross(side,tan));
   const r=.019*(1-t)+.194*Math.pow(Math.sin(Math.PI*t),.76);
   for(let k=0;k<n;k++){const a=k/n*Math.PI*2;v.push(V.add(c,V.add(V.mul(side,r*Math.cos(a)),V.mul(out,r*Math.sin(a)))));}
  }
  for(let i=0;i<m;i++)for(let k=0;k<n;k++){const a=i*n+k,b=i*n+(k+1)%n,c=a+n,d=b+n;f.push([a,c,b],[b,c,d]);}
  const start=positions.length/3;mesh(v,f,hair,7,.87);
  const tip=rgb('#ead8b7'),base=rgb(hair);
  for(let i=0;i<v.length;i++){const t=Math.floor(i/n)/m,ring=i%n,edge=.715+.022*Math.cos(ring/n*Math.PI*6),mix=Math.max(0,Math.min(1,(t-edge)/.038));for(let k=0;k<3;k++)colors[(start+i)*3+k]=base[k]*(1-mix)+tip[k]*mix;}
 }
 const data={positions,normals,colors,joints,weights,surfaces,indices,regions,materials,rigidFeet,pivots,race:id,gender,hairRange:[hairStart,hairEnd]};
 return {data,definition:cfg,gender};
 }
 return {definitions,create};
})();
if(typeof module!=='undefined')module.exports=TravelerModel;
