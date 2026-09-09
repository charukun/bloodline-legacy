/* Original Bloodline Legacy forms. Simulation owns identity and all combat;
 * this module owns silhouettes, articulated parts and presentation sockets. */
const EnemyLooks=(()=>{
 const profiles={
  'rime-guard':{scale:[1.30,1.52,1.32],cloth:[.32,.48,.55],metal:[.77,.86,.89],stride:1.7,swing:.16},
  'oath-breaker':{scale:[1.48,1.40,1.44],cloth:[.49,.33,.29],metal:[.71,.72,.65],stride:1.5,swing:-.25},
  'stone-colossus':{scale:[2.08,1.89,2.0],cloth:[.42,.42,.32],metal:[.75,.77,.68],stride:1.55,swing:-.13},
  'veil-duelist':{scale:[1.58,2.02,1.62],cloth:[.31,.31,.39],metal:[.77,.81,.82],stride:2.1,swing:.36},
  'grave-warden':{scale:[1.49,1.34,1.44],cloth:[.34,.37,.29],metal:[.68,.73,.68],stride:1.45,swing:-.12},
  'cinder-knight':{scale:[1.22,1.51,1.26],cloth:[.60,.30,.20],metal:[.63,.63,.61],stride:1.85,swing:.24},
  'thorn-reaver':{scale:[1.72,1.94,1.72],cloth:[.34,.46,.29],metal:[.78,.71,.58],stride:2,swing:.27},
  'bell-executioner':{scale:[2.03,1.73,1.95],cloth:[.31,.33,.44],metal:[.85,.69,.44],stride:1.5,swing:-.17}
 };
 const id=p=>enemyForm(p)?.id||p.kind;
 return {id,profile:p=>profiles[id(p)]};
})();

const EnemyCreatures=(()=>{
 const profiles={
  'bone-shaman':{scale:[.84,1.02,.87],skin:'#a6b293',cloth:'#735a63',stride:1.5},
  'mushroom-goblin':{scale:[.96,.92,.94],skin:'#acb48a',cloth:'#9e7457',stride:1.25},
  'burrow-spider':{scale:[1.18,.91,1.12],skin:'#625f60',cloth:'#a38970',stride:1.2},
  scorpion:{scale:[1.04,1.07,1.04],skin:'#9e9b7c',cloth:'#c8bb94',stride:1.15},
  'cave-bear':{scale:[1.14,1.15,1.02],skin:'#787c78',cloth:'#4d5351',stride:1.6},
  'marsh-lizard':{scale:[.94,.86,1.18],skin:'#7e9c81',cloth:'#c0bd7d',stride:1.8},
  'rift-jelly':{scale:[1.04,1.01,1.04],skin:'#9ba2b4',cloth:'#b5c9cc',stride:1.6},
  'dusk-bat':{scale:[1.03,.94,1.02],skin:'#83788b',cloth:'#b4a290',stride:1.8},
  goblin:{scale:[.88,.92,.90],skin:'#99ac73',cloth:'#536b57',stride:1.35},
  'bog-goblin':{scale:[.83,1.03,.83],skin:'#849d92',cloth:'#655575',stride:1.65},
  'scrap-goblin':{scale:[1.03,.87,1],skin:'#b1a27a',cloth:'#936847',stride:1.2},
  crawler:{scale:[1,1,1],skin:'#7e9180',cloth:'#b6b18b',stride:1.25},
  'amber-scarab':{scale:[1.14,1.04,1.06],skin:'#a28146',cloth:'#d1b67b',stride:1.1},
  'needle-mantis':{scale:[.78,1.26,.93],skin:'#8b9c69',cloth:'#c6c5a1',stride:1.7},
  maw:{scale:[1.04,1.08,1.02],skin:'#8a9480',cloth:'#b4ad92',stride:1.55},
  'bristle-boar':{scale:[1.03,.96,1.04],skin:'#99856e',cloth:'#6d6154',stride:1.35},
  'moss-wolf':{scale:[.86,1.12,1.10],skin:'#9da99b',cloth:'#536b5b',stride:1.95},
  wraith:{scale:[1,1,1],skin:'#879698',cloth:'#b9c6b6',stride:1.6},
  'lantern-wraith':{scale:[.93,1.08,.92],skin:'#716d89',cloth:'#d7b978',stride:1.5},
  'thorn-wraith':{scale:[1.06,1.06,1],skin:'#82795c',cloth:'#9caf84',stride:1.9},
  boss:{scale:[2.1,2.1,2.1],skin:'#838c82',cloth:'#794c47',stride:2.1},
  stag:{scale:[1,1.05,1],skin:'#a3ad8a',cloth:'#77875c',stride:1.85},
  mushroom:{scale:[1,1,1],skin:'#e0d3ac',cloth:'#ae816b',stride:1.1}
 };
 const eligible=p=>!!profiles[EnemyLooks.id(p)],profile=p=>profiles[EnemyLooks.id(p)];
 const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 function motion(p,t,rec={}){
  const time=p.renderPoseTime??t,c=profile(p),condition=enemyCondition(p),stride=c.stride*(condition.crawl||condition.drag?.35:condition.legs||condition.arms?.65:1),dt=time-(rec.time??time),distance=Math.hypot(p.x-(rec.x??p.x),p.z-(rec.z??p.z));
  if(dt<0||distance>=1.5)rec.phase=0;
  else if(dt>0&&p.action==='run')rec.phase=(rec.phase||0)+distance/stride*TAU;
  const wind=p.telegraph?smooth((time-p.telegraph.started)/Math.max(.001,p.telegraph.at-p.telegraph.started)):0;
  const recovery=p.action==='attack'?clamp((time-p.actionStarted)/Math.min(.75,Math.max(.001,p.actionUntil-p.actionStarted)),0,1):null;
  // Contact is the same pose at telegraph.at and actionStarted. No new deadline.
  const strike=p.telegraph?smooth((wind-.66)/.34):recovery!==null?1-smooth(recovery):0;
  const lift=p.telegraph&&wind<1?Math.sin(wind*Math.PI)*.9:0;
  const fall=p.alive===false?smooth((time-(p.deathAt??time))/1.1):0;
  Object.assign(rec,{time,x:p.x,z:p.z});
  return {time,phase:rec.phase||0,run:p.action==='run',wind,recovery,strike,lift,fall,
   breathe:Math.sin(time*2+(p.stance||0))*.025,guard:!!p.guard||p.action==='guard'};
 }
 // Shared sculpted ring meshes; no per-enemy geometry or texture allocation.
 function install(){
  if(RG_CACHE.has('enemy:body'))return;
  const hull=(name,rings,sides)=>{const P=[],N=[],point=(r,i)=>{const a=i/sides*TAU;return [Math.sin(a)*r[1],r[0],Math.cos(a)*r[2]+(r[3]||0)];};
   const tri=(a,b,c)=>{const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);if(len<1e-8)return;P.push(...a,...b,...c);for(let i=0;i<3;i++)N.push(...n.map(x=>x/len));};
   for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){const a=point(rings[j],i),b=point(rings[j+1],i),c=point(rings[j+1],i+1),d=point(rings[j],i+1);tri(a,c,b);tri(a,d,c);}
   RG_CACHE.set('enemy:'+name,{positions:new Float32Array(P),normals:new Float32Array(N),count:P.length/3,radius:2});
  };
  hull('body',[[-1,0,0],[-.75,.65,.65],[-.1,1,.86],[.55,.86,.82],[1,.38,.47],[1.06,0,0]],12);
  hull('head',[[-1,0,0],[-.72,.68,.67,.1],[-.05,1,.90],[.55,.91,.88],[.9,.55,.65],[1,0,0]],12);
  hull('shell',[[-.25,0,0],[-.16,.90,.90],[.1,1,1],[.6,.78,.84],[.92,.36,.51],[1,0,0]],12);
  hull('snout',[[-.7,0,0],[-.6,.7,.7,.12],[-.05,1,1,.12],[.6,.78,.76],[.85,0,0]],10);
 }
 const point=(m,v)=>v.map((_,i)=>m[12+i]+m[i]*v[0]+m[4+i]*v[1]+m[8+i]*v[2]);
 function socket(art,rec,part,v,normal=[0,0,1],size=.14,mark=v){rec.sockets[part]=point(art.root,v);EnemyDamage.anchor(art,rec,part,mark,normal,size);}
 function draw(art,p,t){
  install();const r=art.r,records=r.enemyCreatures??=new Map();
  for(const[id,rec]of records)if(r.frame-rec.frame>2)records.delete(id);
  let rec=records.get(p.id);if(!rec){rec={};records.set(p.id,rec);}
  const c=profile(p),m=motion(p,t,rec),react=damagePose(r,p,t),ail=ailmentPose(p,t),id=EnemyLooks.id(p);
  const weakness=EnemyWeakness.sample(p,t,m.phase),weakRoot=EnemyWeakness.root(weakness,c.scale[1]);m.weakness=weakness;
  const sideFall=['maw','stag','crawler'].includes(p.kind);
  const root=rModel(p.x+react.x,(p.baseY??(.20+(p.supportHeight||0)))+(p.verticalOffset||0)+ail.y-react.drop+weakRoot.y+(p.kind==='wraith'?.18+m.breathe:0)+m.fall*.48*c.scale[1],p.z+react.z,...c.scale,p.dir||0,react.roll+ail.roll+weakRoot.roll+m.fall*(sideFall?1.48:.14),react.pitch+ail.pitch+weakRoot.pitch+m.fall*(sideFall?.08:1.42));
  const oldRoot=art.root,oldTarget=art.target;art.root=root;art.target=r.dynamic;rec.sockets={};rec.damageAnchors={};rec.breaks=[];rec.frame=r.frame;rec.root=root;rec.motion=m;rec.config=c;
  const ctx={p,c,m,id,rec,root,react};
  try{
   if(p.kind==='goblin'||p.kind==='boss')humanoid(art,ctx);
   else if(p.kind==='crawler')crawler(art,ctx);
   else if(p.kind==='maw'||p.kind==='stag')beast(art,ctx);
   else if(id==='dusk-bat'||id==='rift-jelly')floater(art,ctx);
   else if(p.kind==='wraith')wraith(art,ctx);
   else fungus(art,ctx);
   EnemyDamage.draw(art,p,rec);
   art.root=rModel();r.blob(p.x,p.z,.70*c.scale[0],.59*c.scale[2],.31,r.fxBatches);
  }finally{art.root=oldRoot;art.target=oldTarget;}
 }
 const missing=(p,part)=>p.wounds?.[part]?.severity==='lost';
 function eyes(a,x,y,z,size,color='#d9bd78'){
  for(const s of [-1,1]){a.p('bead',s*x,y,z,size*1.4,size,.035,'#373e36');a.p('bead',s*x,y,z+.026,size*.67,size*.62,.018,color,0,0,0,4);}
 }
 function branch(a,start,side,height,color){
  const[x,y,z]=start;a.line([x,y,z],[x+side*.13,y+height*.52,z-.07],.056,color,9);a.line([x+side*.13,y+height*.52,z-.07],[x+side*.22,y+height,z-.13],.027,color,9);
  a.line([x+side*.12,y+height*.44,z-.07],[x+side*.40,y+height*.66,z-.03],.028,color,9);
 }
 function humanoid(a,{p,c,m,id,rec,root,react}){
  const boss=p.kind==='boss',bog=id==='bog-goblin',miner=id==='scrap-goblin',shaman=id==='bone-shaman',fungal=id==='mushroom-goblin';
  const step=Math.sin(m.phase),bend=-m.lift*.18+m.strike*.18+(m.weakness.dead?0:m.weakness.bend),body=rMultiply(root,rModel(0,0,0,1,1,1,bog?m.strike*.22:0,0,bend));a.root=body;
  a.p('enemy:body',0,1.16,0,.50,.63,.38,c.skin);
  a.p('enemy:shell',0,1.31,-.03,.55,.35,.39,c.cloth,0,0,0,0);
  a.B(0,.98,.03,.84,.12,.66,'#655445');a.B(.12,.98,.38,.16,.15,.05,'#bd9e69',0,0,0,10);
  for(let i=-1;i<=1;i++)a.p('leaf',i*.23,.76,.27,.18,.32,.07,c.cloth,0,i*.15,0,0);
  socket(a,rec,'torso',[0,1.35,.42],[0,0,1],.23,[.09,1.30,.37]);
  EnemyDamage.onSurface(a,rec,'torso','enemy:shell',rModel(0,1.31,-.03,.55,.35,.39),[-.25,.30,.70],[0,0,1],.46);
  a.with(rModel(0,1.91,.05,1,1,1,Math.sin(m.time*.75)*.025,react.headRoll,react.head-m.lift*.08-(m.weakness.crawl?.80:0)),()=>{
   a.p('enemy:head',0,.10,0,.55,.52,.46,c.skin);a.p('enemy:snout',0,-.11,.38,.29,.18,.22,c.skin);
   for(const s of [-1,1]){a.p('leaf',s*.54,.21,-.01,bog?.31:.25,.38,.10,c.skin,0,-s*1.01,0);a.B(s*.20,.27,.40,.26,.068,.09,'#5c7153',0,s*.15,0,0);a.p('horn',s*.18,-.17,.57,.048,.15,.044,'#e4d5ad',0,0,0,9);}
   eyes(a,.21,.14,.443,.087);a.B(0,-.18,.588,.22,.029,.019,'#424238',0,0,0,0);
   if(shaman){a.p('enemy:head',0,.06,.41,.38,.37,.10,'#d9ceb0',0,0,0,9);eyes(a,.14,.10,.51,.084,'#92b99c');for(const s of [-1,1])a.p('horn',s*.26,.50,.36,.055,.32,.05,'#cebd91',0,-s*.4,0,9);a.B(0,-.10,.523,.05,.15,.027,'#665b49');}
   else if(fungal){a.p('cap',-.09,.48,-.05,.69,.36,.55,c.cloth);for(let i=0;i<4;i++)a.p('bead',-.36+i*.18,.69+(i%2)*.06,.13,.08,.025,.08,'#e2cca3');a.p('cap',.38,.40,-.18,.28,.18,.25,'#c29e74');}
   else if(miner){a.p('cap',0,.39,-.01,.59,.23,.49,'#82765f',0,0,0,10);a.B(0,.49,.40,.25,.17,.14,'#c8b27b',0,0,0,10);a.p('bead',0,.49,.49,.076,.073,.025,'#e8d897',0,0,0,4);}
   else if(bog){a.p('cap',0,.40,-.10,.53,.17,.43,c.cloth);for(const s of [-1,1])a.p('horn',s*.35,.57,-.14,.072,.45,.07,'#879572',0,-s*.55,0,9);}
   else if(boss){for(const s of [-1,1]){branch(a,[s*.43,.40,-.04],s,.81,'#c8b990');a.p('box',s*.36,.09,.43,.15,.44,.07,'#867250',0,0,s*.22,10);}a.p('cap',0,.45,-.07,.58,.22,.48,'#9d977e',0,0,0,10);}
   else {a.p('hair',-.12,.55,-.03,.29,.29,.29,'#53634c',0,0,.28);a.B(-.30,.02,.433,.14,.14,.04,'#665d4a',0,0,.1);}
   socket(a,rec,'head',[0,.08,.48],[0,0,1],.13,[.29,.06,.398]);
   EnemyDamage.onSurface(a,rec,'head','enemy:head',shaman?rModel(0,.06,.41,.38,.37,.10):rModel(0,.10,0,.55,.52,.46),[-.60,-.16,.70],[0,0,1],.34);
  });
  for(const s of [-1,1]){
   const leg=s===1?'rightLeg':'leftLeg';a.root=root;if(missing(p,leg))EnemyDamage.broken(a,rec,leg,[s*.26,.80,0],.17);if(!missing(p,leg)){a.root=root;a.with(rModel(s*.26,.82,0,1,1,1,0,0,(m.run?step*s*.50:0)+react[leg]),()=>{
    a.p('bead',0,-.22,0,.19,.33,.19,c.skin);a.with(rModel(0,-.42,0,1,1,1,0,0,m.run?Math.max(0,-step*s)*.6:0),()=>{a.B(0,-.16,.11,.36,.27,.48,'#6d674f');socket(a,rec,leg,[0,-.11,.25]);});});}
   const arm=s===1?'rightArm':'leftArm';a.root=body;if(missing(p,arm)){EnemyDamage.broken(a,rec,arm,[s*.48,1.53,0],.17,[s,-.4,0]);continue;}
   const swing=m.weakness.crawl&&m.strike<.05?-1.05+(m.run?step*s*.3:0):s===1||missing(p,'rightArm')?-m.lift*2.4-m.strike*.95:(m.guard?-1.1:.1)-m.lift*.40;
   a.with(rModel(s*.55,1.56,0,1,1,1,0,s*.24+react[arm+'Z'],swing+react[arm]),()=>{
    a.p('bead',0,-.24,0,.19,.35,.20,c.skin);a.p('bead',0,-.53,.04,.21,.20,.20,c.skin);socket(a,rec,arm,[0,-.52,.14],[0,0,1],.11,[0,-.52,.241]);
    if(s===1){a.with(rModel(0,-.58,.02,1,1,1,0,0,Math.PI),()=>{
     a.C(0,.24,0,.045,.95,.045,'#745d43');
     if(shaman){a.p('enemy:head',0,.72,0,.17,.20,.15,'#c7b990',0,0,0,9);for(const side of [-1,1])a.p('bead',side*.06,.74,.13,.034,.043,.024,'#514f41');a.p('horn',.12,.91,0,.034,.25,.035,'#c7b990',0,-.3,0,9);}
     else if(fungal){a.p('enemy:body',0,.65,0,.18,.27,.17,'#88785d');a.p('cap',0,.84,0,.30,.18,.25,'#b89571');}
     else if(miner){a.B(0,.66,0,.24,.18,.14,'#9b9f92',0,0,0,10);for(const side of [-1,1])a.p('horn',side*.28,.59,0,.07,.43,.07,'#b8bbaa',0,side*1.22,0,10);}
     else if(bog){a.p('horn',.06,.61,0,.12,.47,.06,'#b9c4b4',0,-.5,0,10);a.B(0,.37,0,.18,.21,.07,'#929f8e',0,0,0,10);}
     else{a.p('enemy:head',0,.61,0,boss?.29:.20,.29,.22,boss?'#a0a290':'#8b785b',0,0,0,boss?10:8);for(let i=-1;i<=1;i++)a.p('horn',i*.15,.81,0,.033,.13,.033,'#c9b992',0,-i*.2,0,9);}
     rWeaponTip(a.r,p,a.root,.86);
    });}else if(miner||boss)a.B(0,-.45,.20,.40,.51,.11,miner?'#937b51':'#999b83',0,0,0,10);
   });
  }
  a.root=body;
  if(bog){a.C(-.43,.84,-.31,.11,.28,.11,'#b1ac7c');a.B(-.43,1.02,-.31,.10,.05,.10,'#5a5844');}
  if(miner){a.B(0,1.15,-.41,.62,.61,.23,'#735b43');for(let i=-1;i<=1;i++)a.p('bead',i*.16,1.49,-.49,.14,.15,.14,'#b2b09a',0,0,0,9);}
  if(boss){a.B(0,1.37,-.45,.91,1.16,.12,c.cloth);for(const s of [-1,1]){if(missing(p,s===1?'rightArm':'leftArm'))continue;a.p('enemy:shell',s*.58,1.68,0,.28,.24,.30,'#ada68c',0,0,0,10);a.p('horn',s*.62,1.98,-.02,.065,.37,.065,'#d0c29e',0,-s*.33,0,9);}for(let i=0;i<4;i++)a.B((i-1.5)*.20,1.39,.40,.14,.18,.04,i<(p.seals??4)?'#c4d3ae':'#674f42',0,0,0,4);}
 }
 function crawler(a,{p,c,m,id,rec,root}){
  const scarab=id==='amber-scarab',mantis=id==='needle-mantis',spider=id==='burrow-spider',scorpion=id==='scorpion',step=m.phase;
  a.p('enemy:body',0,.62,-.13,mantis?.36:.54,.36,mantis?.76:.63,c.skin,0,0,-m.lift*.12);
  a.p('enemy:shell',0,.77,-.20,scarab?.67:.49,scarab?.57:.30,.61,c.skin,0,0,0,scarab?10:9);
  for(const s of [-1,1])a.p('enemy:shell',s*(scarab?.28:.22),.94,-.24,scarab?.32:.25,scarab?.26:.20,.55,c.cloth,0,0,s*.17,9);
  socket(a,rec,'torso',[0,1.12,-.08],[0,1,0],.25,spider?[0,1.27,-.55]:scarab?[0,1.345,-.20]:[.22,1.145,-.24]);
  EnemyDamage.onSurface(a,rec,'torso','enemy:shell',rModel(0,.77,-.20,scarab?.67:.49,scarab?.57:.30,.61),[-.25,.5,.25],[0,1,0],.42);
  if(spider){EnemyDamage.onSurface(a,rec,'torso','enemy:body',rModel(0,.78,-.55,.58,.46,.61),[-.3,.7,0],[0,1,0],.42);a.p('enemy:body',0,.78,-.55,.58,.46,.61,c.skin);for(const s of [-1,1])a.p('leaf',s*.19,1.13,-.60,.085,.24,.035,c.cloth,0,s*.4,Math.PI/2);}
  if(scorpion){let x=0,y=.79,z=-.69;for(let i=0;i<5;i++){const yy=y+.24,zz=z+(i<2?-.18:.16+m.strike*.06);a.line([x,y,z],[x,yy,zz],.115-i*.014,c.cloth,9);a.p('bead',x,yy,zz,.12-i*.012,.13,.12-i*.012,c.skin);y=yy;z=zz;}a.p('horn',0,y,z+.06,.06,.43,.08,c.cloth,0,0,1.65+m.strike*.4,9);}
  a.with(rModel(0,.73,.52,1,1,1,0,0,m.strike*.50-m.lift*.50),()=>{
   a.p('enemy:head',0,0,0,.34,.23,.30,c.skin);eyes(a,.17,.08,.27,.065);
   for(const s of [-1,1]){a.line([s*.18,.18,.13],[s*.30,.50,.27],.018,c.cloth,9);a.p('bead',s*.30,.50,.27,.035,.035,.035,c.cloth);a.p('horn',s*.19,-.07,.24,.065,.34,.06,'#d4c59c',0,s*.47,1.23-m.strike*.35,9);}
   if(scarab)a.p('horn',0,.28,.05,.09,.63,.11,'#d9c18f',0,0,.42,9);
   if(spider)eyes(a,.08,.21,.255,.038,'#cb8d76');
   socket(a,rec,'head',[0,.08,.30],[0,1,0],.11,[0,.235,-.035]);
  });
  const legs=spider?4:3;
  for(const s of [-1,1])for(let i=0;i<legs;i++){
   const part=(s===1?'right':'left')+(i===legs-1?'Arm':'Leg');a.root=root;if(missing(p,part)){EnemyDamage.broken(a,rec,part,[s*.35,.60,(i-1)*.47],.09,[s,0,0]);continue;}
   const cycle=step+(s>0?Math.PI:0)+i*Math.PI*.72,gait=m.run?Math.sin(cycle):0,z=(i-1)*.47;
   a.root=root;a.with(rModel(s*.35,.60,z,1,1,1,0,0,0),()=>{
    const front=i===legs-1,tip=front&&(mantis||scorpion),attack=front?m.strike:0;
    const knee=[s*(tip?.49:.42),tip?.50+m.lift*.35:.03+Math.max(0,gait)*.13,gait*.13+attack*.24];
    const foot=[s*(tip?.60:.67),tip?.10-attack*.10:-.54+Math.max(0,gait)*.16,.12+gait*.22+attack*.32];
    a.line([0,0,0],knee,tip?.075:.055,c.skin,9);a.line(knee,foot,tip?.06:.036,c.cloth,9);a.p('bead',...knee,.075,.075,.075,c.skin);
    if(tip)a.p('horn',...foot,.085,.46,.08,'#d9d5b6',0,s*.32,1.1-m.strike*.7,9);
    if(front&&scorpion)a.p('horn',foot[0]+s*.14,foot[1]+.1,foot[2],.085,.35,.075,c.cloth,0,-s*.42,.80,9);
    if(front||i===0)socket(a,rec,part,foot,[0,0,1],tip?.07:.045,[knee[0],knee[1],knee[2]+.075]);
   });
  }
 }
 function beast(a,{p,c,m,id,rec,root}){
  const w=m.weakness,wolf=id==='moss-wolf',boar=id==='bristle-boar',bear=id==='cave-bear',lizard=id==='marsh-lizard',stag=p.kind==='stag',step=Math.sin(m.phase);
  a.p('enemy:body',0,.99,-.18,wolf?.46:bear?.65:boar?.61:.57,lizard?.32:bear?.57:.49,lizard?1.02:.87,c.skin,0,0,-.10);
  if(bear){a.p('enemy:body',0,1.23,.12,.60,.51,.61,c.skin);for(const s of [-1,1])a.p('enemy:shell',s*.33,1.29,.36,.33,.32,.43,c.cloth);}
  else if(lizard){for(let i=0;i<6;i++)a.p('leaf',0,1.42,-.81+i*.27,.05,.19,.17,c.cloth,0,0,.3,9);}
  else if(!wolf&&!boar&&!stag)for(let i=0;i<3;i++)a.p('enemy:shell',0,1.19,-.64+i*.42,.62,.34,.33,i%2?c.skin:c.cloth,0,0,0,9);
  else for(let i=0;i<(boar?5:3);i++)a.p('leaf',0,1.39,-.65+i*.24,boar?.12:.32,boar?.22:.24,.25,c.cloth,0,0,-.35,0);
  socket(a,rec,'torso',[0,1.28,.32],[1,0,0],.25,[wolf?.44:bear?.61:boar?.59:.55,1.09,.10]);
  EnemyDamage.onSurface(a,rec,'torso','enemy:body',rModel(0,.99,-.18,wolf?.46:bear?.65:boar?.61:.57,lizard?.32:bear?.57:.49,lizard?1.02:.87,0,0,-.10),[-.8,.15,.20],[-1,0,0],.48);
  for(const s of [-1,1])for(const front of [false,true]){
   const part=(s===1?'right':'left')+(front?'Arm':'Leg');a.root=root;if(missing(p,part)){EnemyDamage.broken(a,rec,part,[s*.39,.87,front?.48:-.70],wolf?.12:.16);continue;}
   a.root=root;a.with(rModel(s*.39,.88,front?.48:-.70,1,1,1,0,0,m.run?step*s*(front?1:-1)*(w.drag?.28:w.limp?.32:.53):0),()=>{
    a.p('bead',0,-.24,0,wolf?.12:.17,.31,.16,c.skin);
    a.with(rModel(0,-.42,0,1,1,1,0,0,(m.run?Math.max(0,-step*s*(front?1:-1))*.67:.10)+(w.drag?.65:w.limp?.18:0)),()=>{
     a.p('bead',0,-.19,.045,.11,.23,.13,c.skin);a.B(0,-.32,.09,.22,.16,.30,stag?'#72694f':'#706b5c',0,0,0,9);socket(a,rec,part,[0,-.21,.10],[0,0,1],.075,[0,-.18,.177]);
    });
   });
  }
  a.root=root;a.with(rModel(0,lizard?1.06:bear?1.37:1.26,.59,1,1,1,0,0,-m.lift*.40+m.strike*.43+w.bend*.65),()=>{
   a.p('enemy:head',0,.10,0,wolf?.34:bear?.47:lizard?.38:.43,stag?.46:lizard?.24:.36,.37,c.skin);
   a.p('enemy:snout',0,-.09,wolf?.39:lizard?.40:.31,wolf?.18:lizard?.30:.25,lizard?.12:.17,wolf?.37:lizard?.41:.24,c.skin);a.p('bead',0,-.06,wolf?.68:.54,wolf?.13:.22,.11,.06,'#4e5146');
   eyes(a,wolf?.20:.26,.22,.295,.066);
   for(const s of [-1,1]){
    if(bear)a.p('bead',s*.28,.40,-.13,.13,.14,.07,c.cloth);
    else if(lizard)a.p('leaf',s*.33,.1,-.12,.28,.37,.06,c.cloth,0,-s*.72,0,9);
    else a.p('leaf',s*.31,.41,-.13,.16,wolf?.33:.23,.10,c.skin,0,-s*.35,0);
    if(stag)branch(a,[s*.25,.44,-.05],s,.96,'#d0c69f');
    else if(!wolf&&!bear&&!lizard)a.p('horn',s*.26,-.14,.48,.06,boar?.40:.48,.067,'#e3d5ae',0,-s*.41,.20,9);
   }
   a.with(rModel(0,-.21,.15,1,1,1,0,0,m.strike*.33),()=>{
    a.p('enemy:snout',0,-.015,.18,.23,.085,wolf?.31:.22,'#6a6553');
    if(wolf)for(const s of [-1,1])for(let i=0;i<3;i++)a.p('cone',s*.15,.045,.09+i*.12,.026,.075,.024,'#ded4b7',0,0,0,9);
   });socket(a,rec,'head',[0,.16,.38],[0,1,0],.14,[0,lizard?.345:stag?.59:.488,-.02]);EnemyDamage.onSurface(a,rec,'head','enemy:head',rModel(0,.10,0,wolf?.34:bear?.47:lizard?.38:.43,stag?.46:lizard?.24:.36,.37),[-.45,.40,.5],[0,1,0],.33);
  });
  a.root=root;a.with(rModel(0,1.17,-.93,1,1,1,Math.sin(m.time*2)*.13*(1-w.fatigue*.8),0,(wolf?-.55:.35)+w.fatigue*.45),()=>{
   if(lizard){a.line([0,0,0],[.12,-.35,-.65],.14,c.skin);a.line([.12,-.35,-.65],[.3,-.51,-1.05],.065,c.cloth);a.p('horn',.32,-.50,-1.07,.048,.34,.05,c.cloth,0,0,-1.3,9);}
   else a.p('leaf',0,-.14,-.20,wolf?.20:.09,wolf?.54:.27,wolf?.20:.09,c.cloth,0,0,.8);
  });
 }
 function floater(a,{p,c,m,id,rec,root}){
  const jelly=id==='rift-jelly',pulse=Math.sin(m.time*(m.run?5:2.6));
  if(jelly){
   a.p('cap',0,1.91,0,.71+pulse*.04,.50-pulse*.035,.64,c.skin);a.p('bead',0,1.93,.12,.26,.19,.24,c.cloth,0,0,0,4);
   a.p('torus',0,1.86,0,.58,.58,.075,c.cloth,0,0,Math.PI/2,9);
   for(let i=0;i<6;i++){
    const side=Math.sin(i*TAU/6)>0?'right':'left',part=side+(i%2?'Arm':'Leg');if(missing(p,part)){EnemyDamage.broken(a,rec,part,[Math.sin(i*TAU/6)*.44,1.85,Math.cos(i*TAU/6)*.39],.052);continue;}
    const x=Math.sin(i*TAU/6)*.44,z=Math.cos(i*TAU/6)*.39;
    let from=[x,1.85,z];for(let j=0;j<3;j++){const to=[x+Math.sin(m.time*2+i+j)*(.07+j*.035),1.55-j*.35,z+m.strike*.18*j];a.line(from,to,.033-j*.007,c.cloth,9);from=to;}
    socket(a,rec,part,from,[0,0,1],.028,[from[0],from[1]+.12,from[2]+.024]);
   }
   eyes(a,.17,1.99,.48,.047,'#e4d5ac');socket(a,rec,'head',[0,2.24,.30],[0,1,0],.23,[0,2.416-pulse*.035,0]);EnemyDamage.onSurface(a,rec,'head','cap',rModel(0,1.91,0,.71+pulse*.04,.50-pulse*.035,.64),[-.25,.65,.20],[0,1,0],.32);socket(a,rec,'torso',[0,1.95,.36],[0,0,1],.14);
  }else{
   a.p('enemy:body',0,1.44,0,.25,.47,.26,c.skin);a.p('enemy:head',0,1.99,.02,.30,.30,.28,c.cloth);
   for(const s of [-1,1]){a.p('leaf',s*.23,2.34,-.02,.13,.34,.08,c.skin,0,-s*.24,0);a.p('horn',s*.085,1.84,.25,.026,.10,.026,'#d6ceb3',0,0,Math.PI,9);}
   eyes(a,.13,2.04,.272,.06,'#d7b47d');socket(a,rec,'head',[0,2,.29]);socket(a,rec,'torso',[0,1.50,.25]);
   for(const s of [-1,1]){
    const arm=s===1?'rightArm':'leftArm';a.root=root;if(missing(p,arm))EnemyDamage.broken(a,rec,arm,[s*.20,1.78,0],.075,[s,0,0]);if(!missing(p,arm))a.with(rModel(s*.20,1.78,0,1,1,1,0,s*(.15+pulse*.30-m.strike*.62),0),()=>{
     a.line([0,0,0],[s*.59,.22,-.06],.043,c.cloth,9);a.line([s*.59,.22,-.06],[s*1.13,.32,-.09],.025,c.cloth,9);
     for(let i=0;i<3;i++){const x=s*(.37+i*.27);a.p('leaf',x,-.09-i*.02,-.025,.22,.49-i*.08,.045,c.skin,0,s*(.15+i*.18),0);a.line([s*.58,.19,-.05],[x,-.45+i*.06,-.015],.016,c.cloth,9);}
     socket(a,rec,arm,[s*1.10,.26,-.06],[0,0,1],.12,[s*.65,-.08,.027]);
    });
    const leg=s===1?'rightLeg':'leftLeg';if(missing(p,leg))EnemyDamage.broken(a,rec,leg,[s*.13,1.13,0],.05);if(!missing(p,leg)){a.line([s*.13,1.13,0],[s*.20,.91,.1],.045,c.cloth,9);a.p('horn',s*.21,.83,.1,.034,.20,.03,c.cloth,0,-s*.2,.5,9);socket(a,rec,leg,[s*.20,.91,.1],[0,0,1],.04,[s*.18,1.0,.10]);}
   }
  }
 }
 function wraith(a,{p,c,m,id,rec,root}){
  const lantern=id==='lantern-wraith',thorn=id==='thorn-wraith',sway=Math.sin(m.time*1.7)*.06;
  if(thorn){
   a.p('bead',0,1.42,.02,.23,.34,.21,'#bcd4a0',0,0,0,4);
   for(let i=0;i<6;i++){const ang=i*TAU/6,x=Math.sin(ang),z=Math.cos(ang);a.line([x*.14,.58,z*.14],[x*.47,1.26,z*.37],.05,c.skin);a.line([x*.47,1.26,z*.37],[x*.23,1.96,z*.18],.041,c.skin);}
  }else{
   a.p('enemy:body',0,1.14,0,.46,.68,.34,c.skin);
   for(let i=0;i<6;i++){const ang=i*TAU/6;a.p('leaf',Math.sin(ang)*.33,.57,Math.cos(ang)*.26,.20,.57,.07,i%2?c.skin:c.cloth,ang,sway*(i%2?1:-1),.16+Math.sin(m.time*2+i)*.10,0);}
   a.B(0,1.48,.32,.10,.30,.044,c.cloth,0,0,0,10);
  }
  socket(a,rec,'torso',[0,1.42,.32],[0,0,1],thorn?.14:.21,thorn?[0,1.42,.236]:[.14,1.33,.305]);
  EnemyDamage.onSurface(a,rec,'torso',thorn?'bead':'enemy:body',thorn?rModel(0,1.42,.02,.23,.34,.21):rModel(0,1.14,0,.46,.68,.34),[-.22,.20,.8],[0,0,1],.48);
  a.with(rModel(0,1.99,0,1,1,1,0,0,-m.lift*.2+m.strike*.17),()=>{
   a.p('enemy:head',0,.08,-.03,.44,.51,.37,c.skin);a.p('bead',0,.02,.32,.31,.33,.055,'#364448');
   if(thorn){for(const s of [-1,1])branch(a,[s*.25,.34,-.01],s,.52,'#a79e75');a.B(0,.12,.392,.11,.49,.04,c.cloth,0,0,0,9);}
   else a.p('arch',0,.10,.31,.69,.82,.16,c.cloth);
   eyes(a,.13,.02,.385,.066,lantern?'#e8c884':'#bedcd0');socket(a,rec,'head',[0,.05,.40]);
  });
  for(const s of [-1,1]){
   const part=s===1?'rightArm':'leftArm';a.root=root;if(missing(p,part)){EnemyDamage.broken(a,rec,part,[s*.40,1.62,0],.13,[s,-.2,0]);continue;}
   a.with(rModel(s*.43,1.64,0,1,1,1,0,-s*(.25+m.lift*.38),-m.lift*1.9-m.strike*.95),()=>{
    if(thorn){a.line([0,0,0],[s*.25,-.36,.12],.075,c.skin);a.line([s*.25,-.36,.12],[s*.33,-.61,.31],.046,c.cloth);}
    else a.p('leaf',s*.15,-.37,.02,.24,.62,.13,c.skin,0,-s*.22,0);
    a.p('bead',s*.28,-.55,.25,.12,.16,.11,c.cloth);for(let i=-1;i<=1;i++)a.p('horn',s*.28+i*.063,-.69,.28,.02,.20,.022,c.cloth,0,0,-.5,9);
    socket(a,rec,part,[s*.28,-.56,.28],[0,0,1],.09,[s*.28,-.55,.362]);
    if(lantern&&s===1)a.with(rModel(.29,-.65,.32,1,1,1,0,0,-.2),()=>{
     a.line([0,0,0],[0,-.20,0],.018,'#b59d66',10);a.p('bead',0,-.38,0,.12,.18,.12,'#edc681',0,0,0,4);
     for(const side of [-1,1])for(const front of [-1,1])a.B(side*.14,-.37,front*.14,.026,.38,.026,'#756448',0,0,0,10);a.B(0,-.57,0,.33,.06,.32,'#b49a65',0,0,0,10);
    });
   });
  }
  // The lower streamers are separate limbs and honor existing part loss.
  a.root=root;for(const s of [-1,1]){const part=s===1?'rightLeg':'leftLeg';if(missing(p,part))EnemyDamage.broken(a,rec,part,[s*.18,.64,0],.095);else{a.p('leaf',s*.18,.35,0,.14,.38,.12,c.skin,0,sway*s,0);socket(a,rec,part,[s*.18,.35,0],[0,0,1],.07,[s*.18,.38,.09]);}}
 }
 function fungus(a,{p,c,m,rec}){
  a.p('enemy:body',0,.62,0,.34,.58,.33,c.skin);socket(a,rec,'torso',[0,.79,.34]);
  const loss=(missing(p,'rightArm')?1:0)+(missing(p,'leftArm')?2:0);
  a.with(rModel(0,1.20,0,1,1,1,0,Math.sin(m.time*1.7)*.025,-m.lift*.14+m.strike*.17),()=>{
   a.p(loss?'cap-loss:'+loss:'cap',0,0,0,.89,.48,.77,c.cloth);
   a.p(loss?'cap-loss:'+loss:'cylinder',0,-.10,0,.73,.065,.65,'#d9c6a0',0,0,0,9);
   for(let i=0;i<7;i++){const ang=i*2.4,x=Math.sin(ang)*.46;if(loss&1&&x>.30||loss&2&&x<-.30)continue;a.p('bead',x,.24+(i%3)*.06,Math.cos(ang)*.43,.12,.042,.12,'#ead8b0');}
   socket(a,rec,'head',[0,.38,.1],[0,1,0],.24,[0,.484,0]);EnemyDamage.onSurface(a,rec,'head','cap',rModel(0,0,0,.89,.48,.77),[-.25,.6,.2],[0,1,0],.40);for(const s of [-1,1]){const part=s===1?'rightArm':'leftArm';if(missing(p,part))EnemyDamage.broken(a,rec,part,[s*.30,.07,0],.22,[s,0,0]);else{socket(a,rec,part,[s*.65,.07,0]);EnemyDamage.onSurface(a,rec,part,'cap',rModel(0,0,0,.89,.48,.77),[s*.60,.45,.15],[0,1,0],.23);}}
  });eyes(a,.115,.79,.32,.048);
  for(const s of [-1,1]){const part=s===1?'rightLeg':'leftLeg';if(missing(p,part))EnemyDamage.broken(a,rec,part,[s*.22,.29,.10],.13);else{a.p('bead',s*.22,.19,.10,.18,.19,.23,c.skin,0,0,m.run?Math.sin(m.phase)*s*.4:0);socket(a,rec,part,[s*.22,.21,.22],[0,0,1],.10,[s*.22,.20,.329]);}}
 }
 return {eligible,profile,motion,draw,install,point};
})();
const BESTIARY_PREVIOUS_MONSTER=VillageArt.prototype.monster;
VillageArt.prototype.monster=function(p,t){if(EnemyCreatures.eligible(p))return EnemyCreatures.draw(this,p,t);return BESTIARY_PREVIOUS_MONSTER.call(this,p,t);};

// The four added skeletal forms retain the audited shared body and skeleton.
const BESTIARY_PREVIOUS_EQUIPMENT=VillageArt.prototype.sentinelEquipment;
VillageArt.prototype.sentinelEquipment=function(p,rec){
 const id=EnemyLooks.id(p);EnemyCreatures.install();if(!EnemyLooks.profile(p))return BESTIARY_PREVIOUS_EQUIPMENT.call(this,p,rec);
 if(['rime-guard','oath-breaker','stone-colossus','veil-duelist'].includes(id))return this.sentinelSpecial(p,rec,id);
 const grave=id==='grave-warden',cinder=id==='cinder-knight',thorn=id==='thorn-reaver',bell=id==='bell-executioner';
 const iron=bell?'#a18a5d':grave?'#838c7b':cinder?'#767f78':'#919479',edge='#c6bc9f',cloth=grave?'#65715a':cinder?'#9f5740':thorn?'#64774e':'#62647b';
 this.root=rec.sockets.head;
 this.p('cap',0,.81,-.04,.46,grave?.34:.24,.46,iron,0,0,0,10);
 if(bell){this.p('cone',0,.91,-.03,.32,.45,.31,iron,0,0,0,10);for(const side of [-1,1])this.B(side*.35,.47,.23,.13,.42,.28,iron,0,0,0,10);this.B(0,.65,.435,.65,.07,.06,'#3d4138',0,0,0,0);}
 else if(grave){this.B(0,.68,.43,.77,.07,.06,edge,0,0,0,10);this.B(-.28,.45,.31,.14,.37,.20,iron,0,0,.18,10);this.B(0,1.10,-.04,.09,.26,.25,edge,0,0,0,10);}
 else for(const s of [-1,1]){this.line([s*.34,.89,-.03],[s*.48,1.28,-.14],.056,edge,9);this.p('horn',s*.52,1.39,-.14,.046,thorn?.47:.26,.045,edge,0,-s*.3,0,9);if(thorn){this.line([s*.45,1.16,-.11],[s*.77,1.29,-.08],.033,edge,9);this.p('horn',s*.77,1.32,-.08,.034,.28,.035,edge,0,-s*.45,0,9);}}
 this.root=rec.sockets.chest;
 for(const s of [-1,1]){this.p('enemy:shell',s*.31,-.03,-.03,bell?.26:.20,.17,.24,iron,0,0,s*.24,10);if(thorn)this.p('horn',s*.42,.18,-.05,.06,.39,.06,edge,0,-s*.40,0,9);}
 this.B(0,-.26,.21,bell?.59:.42,.44,.065,iron,0,0,0,10);this.B(0,-.19,.25,.075,.24,.028,edge,0,0,0,10);
 for(let i=-1;i<=1;i++)this.B(i*.20,-.59,-.32,.23,grave?.64:1.05,.055,cloth,0,0,i*.045,0);
 if(cinder)for(const s of [-1,1])this.B(s*.11,-.27,.252,.014,.24,.014,'#c18455',0,0,s*.22,0);
 if(p.wounds?.rightArm?.severity!=='lost'){
  this.root=rec.sockets.rightHand;this.C(0,.25,0,.04,.94,.04,'#746149');this.B(0,.15,0,.10,.20,.08,cloth);
  if(grave||bell){this.B(0,.68,0,bell?.61:.32,bell?.37:.28,bell?.27:.25,iron,0,0,0,10);for(const s of [-1,1])this.B(s*(bell?.28:.16),.68,0,.075,bell?.42:.35,.30,edge,0,0,0,10);if(grave)for(const s of [-1,1])this.p('horn',s*.17,.86,0,.036,.16,.036,edge,0,-s*.3,0,9);}
  else if(thorn){this.C(0,.53,0,.038,.80,.038,iron,0,0,0,10);this.p('leaf',.23,.86,0,.31,.36,.12,edge,0,.64,0,10);this.p('horn',0,1.05,0,.037,.26,.037,edge,0,0,0,9);}
  else{this.B(0,.64,0,.14,.73,.05,iron,0,0,0,10);this.p('cone',0,1.07,0,.075,.19,.029,edge,0,0,0,10);for(let i=0;i<3;i++)this.B(.055,.53+i*.16,0,.075,.14,.053,edge,0,0,.30,10);this.B(0,.25,0,.29,.05,.07,edge,0,0,0,10);}
  rWeaponTip(this.r,p,this.root,grave||bell?.9:1.12);
 }
 if(p.wounds?.leftArm?.severity!=='lost'){
  this.root=rec.sockets.leftHand;
  if(grave){this.p('enemy:body',0,.10,.06,.30,.58,.07,'#5c6856',0,0,0,10);this.B(0,.11,.14,.05,.90,.025,edge,0,0,0,10);this.B(0,.29,.14,.43,.047,.025,edge,0,0,0,10);}
  else{this.p('cylinder',0,.12,.05,bell?.23:.28,.11,bell?.23:.28,iron,0,0,Math.PI/2,10);this.p('bead',0,.12,.13,.12,.13,.08,edge,0,0,0,10);}
 }
};
VillageArt.prototype.sentinelSpecial=function(p,rec,id){
 const ice=id==='rime-guard',chain=id==='oath-breaker',stone=id==='stone-colossus',veil=id==='veil-duelist';
 const metal=stone?'#9c9e8e':chain?'#79776a':'#a4b3ad',cloth=ice?'#657f89':veil?'#646375':'#745b4c',edge='#d1c7aa';
 this.root=rec.sockets.head;
 if(stone){
  this.B(0,.73,-.12,.96,.60,.66,metal,0,0,0,9);this.B(0,.59,.405,.80,.12,.09,'#555e52',0,0,0,9);
  this.B(-.24,.84,.31,.08,.35,.09,'#666e5d',0,0,.18,9);this.B(.27,.93,-.01,.33,.17,.67,'#bcc0a9',0,0,.08,9);
 }else if(veil){
  this.p('cap',0,.80,-.12,.47,.23,.45,cloth);this.p('enemy:head',0,.57,.39,.32,.29,.09,'#c6c7b6',0,0,0,10);
  for(const s of [-1,1])this.B(s*.11,.62,.468,.13,.027,.025,'#424b49',0,0,s*.16,0);
  this.p('horn',-.31,1.10,-.02,.07,.59,.065,edge,0,.45,0,9);this.p('leaf',.18,.65,-.45,.26,.65,.07,cloth,0,0,-.12);
 }else if(chain){
  this.p('cap',0,.84,-.06,.46,.32,.45,metal,0,0,0,10);this.B(0,.57,.43,.12,.47,.055,metal,0,0,0,10);
  for(const s of [-1,1])this.B(s*.21,.46,.32,.22,.18,.23,metal,0,0,s*.14,10);
  this.p('toruslow',.31,.80,.20,.12,.12,.024,edge,0,0,0,10);
 }else{
  this.p('cap',0,.80,-.03,.46,.21,.46,metal,0,0,0,10);
  for(let i=-2;i<=2;i++)this.p('cone',i*.17,1.02+(2-Math.abs(i))*.07,-.04,.082,.37+(2-Math.abs(i))*.12,.082,i%2?'#b4ced0':'#d4dfd6',0,-i*.18,0,9);
 }
 this.root=rec.sockets.chest;
 if(stone){for(const s of [-1,1]){this.B(s*.38,-.03,-.015,.46,.33,.54,metal,0,0,s*.15,9);this.B(s*.17,-.31,.22,.29,.45,.13,'#adb09b',0,0,-s*.08,9);}this.B(0,-.04,.35,.19,.13,.07,'#77856d',0,0,0,9);}
 else if(veil){this.p('leaf',-.28,-.31,-.25,.41,.84,.12,cloth,0,0,-.22);this.B(.31,-.07,0,.26,.14,.35,metal,0,0,-.25,10);this.B(0,-.23,.22,.12,.40,.035,cloth,0,0,.35,0);}
 else {for(const s of [-1,1]){this.p('enemy:shell',s*.32,-.06,-.02,.21,.15,.25,metal,0,0,s*.23,10);if(ice)this.p('cone',s*.39,.10,-.04,.083,.35,.085,'#c6ddda',0,-s*.45,0,9);}this.B(0,-.27,.20,.50,.43,.07,metal,0,0,0,10);}
 for(let i=-1;i<=1;i++)this.B(i*.19,-.54,-.29,.21,veil?1.14:.67,.05,cloth,0,0,i*.035,0);
 if(chain){for(let i=0;i<5;i++)this.p('toruslow',-.24+i*.12,-.22+Math.abs(i-2)*.09,.27,.053,.063,.014,edge,0,i%2?Math.PI/2:0,0,10);}
 if(p.wounds?.rightArm?.severity!=='lost'){
  this.root=rec.sockets.rightHand;this.C(0,.24,0,.036,.88,.036,'#746149');
  if(stone){this.B(0,.66,0,.69,.37,.34,metal,0,0,.04,9);this.B(0,.67,0,.13,.43,.39,'#696d5d',0,0,0,10);rWeaponTip(this.r,p,this.root,.9);}
  else if(veil){this.B(0,.61,0,.072,.77,.038,'#bfcac2',0,0,-.08,10);this.p('cone',.036,1.05,0,.036,.18,.023,edge,0,0,-.16,10);this.B(0,.24,0,.23,.035,.075,metal,0,0,0,10);rWeaponTip(this.r,p,this.root,1.15);}
  else if(ice){for(let i=0;i<4;i++){const ang=i*Math.PI/2;this.p('cone',Math.sin(ang)*.12,.73,Math.cos(ang)*.12,.09,.46,.09,i%2?'#c8ded9':'#9fbfc2',0,Math.sin(ang)*.24,Math.cos(ang)*.24,9);}rWeaponTip(this.r,p,this.root,1.0);}
  else{
   // Short authored flail curve follows the hand; no physics or reach change.
   const bend=Math.sin(rec.timing.time*3)*.07;
   for(let i=0;i<4;i++)this.p('toruslow',bend*i,.51+i*.09,0,.041,.059,.011,edge,0,i%2?Math.PI/2:0,0,10);
   this.p('enemy:head',bend*4,.91,0,.16,.17,.16,metal,0,0,0,10);for(const s of [-1,1])this.p('horn',bend*4+s*.16,.94,0,.03,.18,.03,edge,0,-s*.9,0,10);
   const tip=EnemyCreatures.point(this.root,[bend*4,1.03,0]);this.r.weaponTips?.set(p.id,tip);
  }
 }
 if(p.wounds?.leftArm?.severity!=='lost'){
  this.root=rec.sockets.leftHand;
  if(stone){this.B(0,.10,.06,.53,.83,.15,metal,0,0,0,9);this.B(-.12,.19,.15,.06,.53,.025,'#67745d',0,0,.19,9);}
  else if(ice){this.p('enemy:body',0,.11,.045,.27,.51,.075,metal,0,0,0,10);this.p('cone',0,.48,.13,.075,.34,.055,'#cfdfd7',0,0,0,9);}
  else if(veil){this.B(0,.12,.04,.18,.41,.09,metal,0,0,0,10);this.p('horn',0,.40,.04,.039,.25,.031,edge,0,0,0,10);}
  else{this.p('cylinder',0,.11,.06,.28,.11,.28,metal,0,0,Math.PI/2,10);this.p('horn',0,.11,.15,.061,.32,.06,edge,0,0,Math.PI/2,10);}
 }
};

// Preserve all authored equipment variants while applying their wound state.
const DAMAGE_PREVIOUS_EQUIPMENT=VillageArt.prototype.sentinelEquipment;
VillageArt.prototype.sentinelEquipment=function(p,rec){return EnemyDamage.equipment(this,p,rec,()=>DAMAGE_PREVIOUS_EQUIPMENT.call(this,p,rec));};
