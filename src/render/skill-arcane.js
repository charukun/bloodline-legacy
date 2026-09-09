/* Original layered spell VFX. Reference technique: ICS MEDIA /entry/11401/.
 * Authored forms + analytic soft surfaces + billboard motes, driven by effect
 * time. No article assets, Three.js replacement, timers, or simulation writes. */
const SkillArcane=(()=>{
 const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
 const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
 const rand=(seed,i)=>{let x=(seed^Math.imul(i+1,0x9e3779b1))>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);return ((x^(x>>>13))>>>0)/4294967296;};
 const definitions=Object.freeze([
  ['pillar','天環','逆に流れる二重の光柱。三層の紋が開き、光の粒が上へ抜ける。','fall','single','ripple','drift'],
  ['vortex','巻天','地を這う渦が巻き上がり、二重螺旋をほどいて消える。','orbit','double','pinch','recoil'],
  ['nova','星砕','一点に光を圧縮し、長短の光芒と粒を放射状に撃ち出す。','pierce','single','fracture','vanish'],
  ['lotus','蓮華','八枚の光の花弁が順に開き、中心から花粉が舞う。','sweep','single','ripple','drift'],
  ['gate','双門','向かい合う二つの紋が立ち、間を光の帯が往復する。','pierce','double','cleave','recoil'],
  ['comet','彗尾','長い尾を引く光が斜めに走り、打点で尾が扇状に裂ける。','fall','single','cleave','drift'],
  ['cage','天牢','六本の光の肋が立ち上がり、頭上で閉じて内側へ収束する。','orbit','triplet','pinch','recoil'],
  ['tide','潮牙','幅広い波面がせり上がって巻き返し、飛沫が前へ散る。','sweep','single','ripple','drift'],
  ['thorn','荊冠','曲がった荊が円周から生え、互い違いの高さで鋭く伸びる。','fall','triplet','fracture','vanish'],
  ['eclipse','月蝕','暗い円盤の周りで光冠が回り、収縮とともに周囲の光を吸い込む。','orbit','single','pinch','recoil'],
  ['wings','双翼','左右の光の羽が一斉に開き、羽先から細い残光が離れる。','sweep','double','cleave','drift'],
  ['fulgur','雷紋','枝分かれした雷紋が空間を裂き、枝先だけが遅れて明滅する。','pierce','triplet','fracture','vanish']
 ].map(([id,name,description,path,rhythm,impact,release])=>Object.freeze({id,name,description,path,rhythm,impact,release})));
 const forms=new Set(definitions.map(d=>d.id)),has=id=>forms.has(id);
 const life=r=>r.release==='drift'?.75:r.release==='recoil'?.68:.58;
 const sample=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));
 const annulus=(n,r,width,y,turn=0,vertical=false,x=0)=>sample(n,u=>{
  const a=u*TAU+turn,point=q=>vertical?[x+Math.cos(a)*q,y+Math.sin(a)*q,0]:[Math.cos(a)*q,y,Math.sin(a)*q];
  return {a:point(Math.max(0,r-width)),b:point(r)};
 });
 const band=(n,fn,width,axis=[0,1,0])=>sample(n,u=>{
  const p=fn(u),w=width*Math.pow(Math.sin(Math.PI*u),.65);return {a:p.map((v,i)=>v-axis[i]*w*.5),b:p.map((v,i)=>v+axis[i]*w*.5)};
 });
 function field(mode,strips,age,clock,alpha,recipe){return {kind:'field',mode,strips,age,clock,alpha,flutter:recipe.flutter??.65,color:'#c8efff',seed:recipe.seed};}
 function mask(mode,u,v,age,clock,flutter=.65){
  const edge=smooth(0,.035,v)*(1-smooth(.94,1,v)),ends=smooth(0,.03,u)*(1-smooth(.97,1,u));
  const drift=flutter*SkillSilk.noise(u*6,clock*2.1,19)*.12;
  if(mode===0){const lanes=Math.pow(.5+.5*Math.sin((u+clock*.14+drift)*TAU*9),9);return clamp(edge*(.13+lanes*.85)*Math.pow(1-v,1.35)*smooth(0,.05,v));}
  if(mode===1)return clamp(edge*ends*(Math.exp(-Math.pow((v-.42-drift)*4,2))*.72+.2*Math.pow(.5+.5*Math.sin(u*37-clock*12+v*9),5)));
  if(mode===2){const lines=Math.exp(-Math.pow((v-.12)*42,2))+Math.exp(-Math.pow((v-.9)*48,2));const x=((u*12)%1+1)%1-.5;const rune=Math.exp(-Math.pow((Math.abs(x)-Math.abs(v-.5)*.58)*42,2))*smooth(.22,.32,v)*(1-smooth(.70,.8,v));return clamp(edge*(lines+rune*.85));}
  if(mode===3)return clamp(edge*ends*(.24+Math.exp(-Math.pow((v-.5-drift)*3.4,2))*.76)*(.78+.22*Math.sin(u*18-clock*9)));
  if(mode===4){const x=u*2-1,y=v*2-1,r=x*x+y*y;return clamp((Math.exp(-r*10)+Math.exp(-Math.abs(x)*50-Math.abs(y)*4)*.45+Math.exp(-Math.abs(y)*50-Math.abs(x)*4)*.45)*smooth(1,.65,Math.sqrt(r))*age);}
  if(mode===5)return 1-smooth(.80,1,v);
  return clamp(edge*ends*(Math.exp(-Math.pow((v-.5)*6,2))+.2)*(.72+.28*Math.sin(clock*35+u*12)));
 }
 function stroke(recipe,u,quality='high'){
  if(!has(recipe.family)||!Number.isFinite(u)||u<0||u>1||recipe.layers?.sigil===false)return [];
  const n=quality==='low'?24:40,grow=smooth(0,.38,u),fade=1-smooth(.6,1,u),r=(.28+grow*.54);
  return [field(2,[annulus(n,r,.14,.035,u),annulus(n,r*.65,.11,.06,-u*1.2)],u,u,.46*fade,recipe)];
 }
 function impact(recipe,age,quality='high',ground=-1.065){
  if(!has(recipe.family)||!Number.isFinite(age)||age<0||age>=life(recipe))return [];
  const low=quality==='low',n=low?24:40,m=low?12:20,u=age/life(recipe),rise=1-Math.pow(1-clamp(u*3),3),fade=1-smooth(.48,1,u),clock=u+(recipe.seed%251)*.01;
  const recoil=recipe.release==='recoil'?1-smooth(.48,1,u)*.82:1,drift=recipe.release==='drift'?smooth(.4,1,u)*.35:0;
  const size=(.82+(recipe.thickness??2.2)*.08)*rise*recoil,out=[],y=ground;
  const add=(mode,strips,alpha=1)=>out.push(field(mode,strips,u,clock,alpha*fade,recipe));
  const xy=(angle,r,h)=>[Math.cos(angle)*r,h,Math.sin(angle)*r];
  if(recipe.layers?.sigil!==false){
   const rings=recipe.family==='pillar'?3:recipe.family==='gate'?0:1;
   if(rings)add(2,Array.from({length:rings},(_,j)=>annulus(n,(1.12-j*.22)*size,.16,y+.02+j*.025,(j%2?-1:1)*u*.85)),.65);
  }
  if(recipe.layers?.body!==false)builders[recipe.family]({recipe,u,rise,size,n,m,y,clock,add,xy,low});
  if(recipe.layers?.motes!==false){
   const points=[],count=low?12:22,explodes=['nova','fulgur','comet','thorn'].includes(recipe.family),pull=recipe.family==='eclipse';
   for(let j=0;j<count;j++){
    const delay=rand(recipe.seed,j)*.14,q=clamp((u-delay)/(1-delay)),a=j*2.399+rand(recipe.seed,j+50),r=(pull?1-q:q)*size*(explodes?2:1.12),h=explodes?Math.sin(a*3)*q*.85:q*(1.5+rand(recipe.seed,j+9)*1.4);
    const p=xy(a,r,y+.3+h);p[0]+=(recipe.flutter??.65)*SkillSilk.noise(j*.7,clock*3,23)*q*.18;
    points.push({p,size:(j%4===0?.115:.05)*(1-q*.6),alpha:Math.sin(q*Math.PI)**.6});
   }
   out.push({kind:'motes',mode:4,points,age:u,clock,alpha:fade,flutter:recipe.flutter??.65,color:'#d7f3ff',seed:recipe.seed});
  }
  // Path, contact choice and ending remain independent composition controls.
  const angle={sweep:-.35,pierce:0,fall:.55,orbit:Math.PI/2}[recipe.path]??0;
  const contactScale=recipe.impact==='pinch'?1-smooth(.1,.9,u)*.36:recipe.impact==='ripple'?1+u*.22:1;
  const transform=v=>{
   let x=v[0]*contactScale,z=v[2]*contactScale;
   if(recipe.impact==='cleave'){x*=1.2;z*=.78;}else if(recipe.impact==='fracture'){x*=1+.08*Math.sin(v[1]*9);}
   return [Math.cos(angle)*x+Math.sin(angle)*z,v[1]+drift,Math.cos(angle)*z-Math.sin(angle)*x];
  };
  return out.map(p=>p.kind==='motes'?{...p,points:p.points.map(q=>({...q,p:transform(q.p)}))}:{...p,strips:p.strips.map(s=>s.map(q=>({a:transform(q.a),b:transform(q.b)})))});
 }
 const builders={
  pillar:({n,y,size,u,add})=>{for(let j=0;j<2;j++)add(0,[sample(n,t=>{const a=t*TAU+(j?-1:1)*u*1.8,r=(j?.60:.78)*size;return {a:[Math.cos(a)*r,y,Math.sin(a)*r],b:[Math.cos(a)*r*1.1,y+3.2*size,Math.sin(a)*r*1.1]};})],j?.55:.78);},
  vortex:({n,y,size,u,add})=>add(1,[0,1].map(j=>band(n,t=>{const a=t*TAU*1.7+j*Math.PI-u*4,r=(1-t*.7)*size;return [Math.cos(a)*r,y+t*2.6*size,Math.sin(a)*r];},.42*size))),
  nova:({m,y,size,u,add,xy,low})=>add(3,Array.from({length:low?8:12},(_,j)=>{const a=j*2.399,h=Math.sin(j*1.8),r=(1.4+j%3*.3)*size;return band(m,t=>xy(a,r*t,y+1.1+h*t),.32*size,[Math.cos(a+1.57),.7,Math.sin(a+1.57)]);})),
  lotus:({m,y,size,u,add,xy,low})=>add(3,Array.from({length:low?6:8},(_,j)=>{const a=j*TAU/(low?6:8);return band(m,t=>xy(a,t*1.6*size,y+.1+Math.sin(t*Math.PI)*(.45+u)*size),.66*size,[-Math.sin(a),0,Math.cos(a)]);})),
  gate:({n,m,y,size,u,add})=>{add(2,[-1,1].map(side=>annulus(n,.8*size,.28,y+1.05,side*u*2,true,side*.78*size)));add(1,[-1,1].map(side=>band(m,t=>[(t-.5)*1.65*size,y+1.05+side*Math.sin(t*Math.PI)*.45,Math.sin(t*TAU+u*5)*.22],.23*size)));},
  comet:({m,y,size,u,add,low})=>add(3,Array.from({length:low?4:6},(_,j)=>band(m,t=>[-2.1*size*(1-t)+(j-2)*.12,y+.7+2*(1-t)*size,Math.sin(t*3+j)*.14+(j-2)*.08],(.22+j%2*.08)*size))),
  cage:({m,y,size,u,add,xy,low})=>add(1,Array.from({length:low?5:6},(_,j)=>band(m,t=>xy(j*TAU/(low?5:6)+t*.18,(1-Math.pow(t,3))*.92*size,y+t*2.4*size),.22*size,[1,0,.2]))),
  tide:({n,y,size,u,add})=>{for(let j=0;j<2;j++)add(1,[sample(n,t=>{const x=(t-.5)*2.9*size,h=Math.sin(t*Math.PI)*1.65*size;return {a:[x,y,.15+j*.17],b:[x,y+h,.15+j*.17-Math.sin(t*Math.PI)*(.4+u*.55)]};})],j?.5:.9);},
  thorn:({m,y,size,u,add,xy,low})=>add(3,Array.from({length:low?6:9},(_,j)=>band(m,t=>xy(j*2.399+t*t*.8,(.55+t*.35)*size,y+Math.pow(t,.72)*(1.4+j%3*.35)*size),.34*size,[Math.cos(j*2.399),.12,Math.sin(j*2.399)]))),
  eclipse:({n,y,size,u,add})=>{add(5,[annulus(n,.95*size,.95*size,y+1.1,0,true)],.94);add(1,[annulus(n,1.07*size,.16,y+1.1,u*2,true),annulus(n,1.25*size,.05,y+1.1,-u*3,true)],.95);},
  wings:({m,y,size,u,add,low})=>add(3,[-1,1].flatMap(side=>Array.from({length:low?4:5},(_,j)=>band(m,t=>[side*t*(1.7-j*.20)*size,y+.7+Math.sin(t*1.8)*(1.2-j*.25)*size,-t*t*.65+j*.1],(.28-j*.015)*size,[0,1,.3])))),
  fulgur:({m,y,size,u,add,recipe,low})=>add(6,Array.from({length:low?5:8},(_,j)=>{const a=j*2.399;return band(m,t=>{const r=t*1.7*size,w=(rand(recipe.seed,Math.floor(t*m)+j*19)-.5)*.18*Math.sin(t*Math.PI);return [Math.cos(a)*r+w,y+1.0+Math.sin(a)*r,Math.sin(j)*t*.25];},.14*size,[-Math.sin(a),Math.cos(a),0]);}))
 };
 function geometry(p,transform=v=>v,eye=[0,6,8]){
  const P=[],N=[],strips=p.strips||[];
  const vertex=(v,u,w,z)=>{P.push(...v);N.push(u,w,z);};
  const quad=(a,b,c,d,u=0,v=1,z=p.age)=>{vertex(a,u,0,z);vertex(b,u,1,z);vertex(c,v,1,z);vertex(a,u,0,z);vertex(c,v,1,z);vertex(d,v,0,z);};
  for(const strip of strips){const s=strip.map(q=>({a:transform(q.a),b:transform(q.b)}));for(let j=0;j<s.length-1;j++)quad(s[j].a,s[j].b,s[j+1].b,s[j+1].a,j/(s.length-1),(j+1)/(s.length-1));}
  if(p.points)for(const q of p.points){
   const c=transform(q.p),v=eye.map((x,i)=>x-c[i]),h=Math.hypot(v[0],v[2])||1,right=[v[2]/h,0,-v[0]/h],up=[-right[2]*v[1],right[2]*v[0]-right[0]*v[2],right[0]*v[1]],len=Math.hypot(...up)||1;
   const at=(x,y)=>c.map((v,i)=>v+(right[i]*x+up[i]/len*y)*q.size);
   quad(at(-1,-1),at(-1,1),at(1,1),at(1,-1),0,1,q.alpha);
  }
  if(!P.length)return null;
  const center=[0,1,2].map(i=>(Math.min(...P.filter((_,j)=>j%3===i))+Math.max(...P.filter((_,j)=>j%3===i)))/2);let radius=0;
  for(let j=0;j<P.length;j+=3){for(let i=0;i<3;i++)P[j+i]-=center[i];radius=Math.max(radius,Math.hypot(P[j],P[j+1],P[j+2]));}
  return {positions:new Float32Array(P),normals:new Float32Array(N),count:P.length/3,radius,center,dirty:true};
 }
 return Object.freeze({definitions,has,life,stroke,impact,mask,geometry,surface:25,cost:p=>p.points?.length??p.strips.reduce((n,s)=>n+s.length-1,0),ink:p=>[p.mode,p.clock,p.flutter]});
})();
