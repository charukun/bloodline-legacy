/* Original Bloodline Legacy fauna. Each form has its own articulated construction;
 * only small geometry resources and the authoritative combat clock are shared. */
const EnemyFauna=(()=>{
 const bone='#daceac',dark='#3f473b',gold='#b39a69';
 const socket=EnemyCreatures.socket,lost=(p,k)=>p.wounds?.[k]?.severity==='lost';
 const sidePart=(s,front)=> (s>0?'right':'left')+(front?'Arm':'Leg');
 function eyes(a,x,y,z,size,color='#d0c28b'){
  for(const s of [-1,1]){a.p('bead',s*x,y,z,size,size*.85,size*.42,dark);a.p('bead',s*x,y,z+size*.33,size*.40,size*.56,size*.18,color,0,0,0,4);}
 }
 function surface(a,q,part,type,v,size,color,normal=[0,0,1],tag=0){
  a.p(type,...v,...size,color,0,0,0,tag);
  const at=v.map((x,i)=>x+normal[i]*size[i]);socket(a,q.rec,part,at,normal,Math.min(...size)*.7);
  EnemyDamage.onSurface(a,q.rec,part,type,rModel(...v,...size),normal.map(x=>x*.65),normal,Math.min(...size)*.8);
 }
 function limb(a,q,part,at,rx,rz,width,draw){
  if(lost(q.p,part)){EnemyDamage.broken(a,q.rec,part,at,width);return;}
  a.with(rModel(...at,1,1,1,0,rz,rx),draw);
 }
 const gait=(q,s,offset=0)=>q.m.run?Math.sin(q.m.phase+offset)*s*(1-q.m.weakness.fatigue*.35):0;
 function treant(a,q){
  const {p,c,m,rec}=q,w=m.weakness;
  a.with(rModel(0,0,0,1,1,1,0,0,m.strike*.18-m.lift*.18+w.bend),()=>{
   surface(a,q,'torso','enemy:body',[0,1.29,0],[.53,.84,.43],c.skin,[0,0,1],8);
   // Split trunk, a hollow mouth and a lopsided living crown.
   for(const s of [-1,1])a.p('trunk',s*.34,1.35,.15,.16,1.22,.20,s>0?'#928767':'#746e54',0,0,s*.10,8);
   a.B(-.07,1.35,.431,.28,.38,.025,dark,0,0,.17,0);
   a.with(rModel(0,2.03,0,1,1,1,0,0,-m.lift*.20-w.bend*.35-(w.crawl?.65:0)),()=>{
    surface(a,q,'head','enemy:head',[0,.12,0],[.45,.47,.39],c.skin,[0,0,1],8);eyes(a,.19,.14,.36,.08);
    for(const s of [-1,1]){a.line([s*.22,.42,0],[s*.44,.89,-.09],.09,c.skin,8);a.line([s*.44,.89,-.09],[s*.69,1.11,-.05],.05,c.skin,8);}
    for(let i=0;i<5;i++){const ang=i*2.4;a.p('enemy:shell',Math.sin(ang)*.48,.75+(i%2)*.22,Math.cos(ang)*.26,.33,.31,.27,c.cloth,ang,0,0);}
    a.p('cap',-.40,.02,-.28,.22,.13,.19,'#b5a279');
   });
   for(const s of [-1,1]){
    const arm=sidePart(s,true),swing=m.lift*1.1-m.strike*1.2+(w.crawl?-.8:gait(q,s)*.23);
    limb(a,q,arm,[s*.49,1.70,0],swing,-s*.19,.15,()=>{
     a.line([0,0,0],[s*.18,-.49,.07],.14,c.skin,8);a.line([s*.18,-.49,.07],[s*.31,-.94,.12],.10,c.skin,8);
     for(let j=-1;j<=1;j++)a.p('horn',s*.31+j*.10,-1.03,.18,.038,.34,.04,bone,0,0,2.65,9);
     socket(a,rec,arm,[s*.31,-.85,.20],[0,0,1],.10);
    });
   }
  });
  for(const s of [-1,1]){const part=sidePart(s,false);limb(a,q,part,[s*.30,.63,0],gait(q,s)*.30,0,.18,()=>{
   a.line([0,0,0],[s*.10,-.43,.12],.16,c.skin,8);
   for(let j=-1;j<=1;j++)a.line([s*.10,-.43,.12],[s*.12+j*.14,-.55,.38],.05,c.skin,8);
   socket(a,rec,part,[s*.10,-.43,.18],[0,0,1],.11);
  });}
 }
 function toad(a,q){
  const {c,m,rec}=q,w=m.weakness,hop=m.run?Math.max(0,Math.sin(m.phase))*.12*(1-w.fatigue):0;
  a.with(rModel(0,hop,0,1,1,1,0,0,-m.lift*.10+m.strike*.17+w.bend*.2),()=>{
   surface(a,q,'torso','enemy:body',[0,.57,-.18],[.68,.43,.74],c.skin,[0,1,0]);
   for(let i=0;i<5;i++)a.p('bead',Math.sin(i*2.4)*.42,.88,Math.cos(i*2.4)*.40-.18,.07,.05,.07,c.cloth);
   a.with(rModel(0,.72,.42,1,1,1,0,0,-m.lift*.24+m.strike*.34),()=>{
    surface(a,q,'head','enemy:head',[0,0,0],[.61,.28,.42],c.skin);
    for(const s of [-1,1]){a.p('bead',s*.38,.25,.06,.19,.19,.17,c.cloth);}
    eyes(a,.38,.27,.215,.10,'#dcc48e');
    a.B(0,-.075,.383,.87,.035,.04,dark,0,0,0,0);
    a.p('enemy:snout',0,-.22,.16,.44,.14+Math.sin(m.time*3)*.025,.27,'#c7bd8c');
    // A broad lower jaw opens during anticipation, closes at contact.
    a.with(rModel(0,-.13,-.04,1,1,1,0,0,m.lift*.68-m.strike*.05),()=>a.p('enemy:snout',0,-.06,.25,.47,.075,.28,c.cloth));
   });
  });
  for(const s of [-1,1])for(const front of [false,true]){
   const part=sidePart(s,front),step=gait(q,s,front?Math.PI:0),at=[s*(front?.44:.55),front?.49:.45,front?.38:-.50];
   limb(a,q,part,at,step*.27,0,front?.10:.20,()=>{
    const knee=[s*(front?.10:.23),front?-.19:.03,front?.13:-.27],foot=[s*.19,-.37+Math.max(0,step)*.10,.22];
    a.line([0,0,0],knee,front?.09:.20,c.skin,0);a.line(knee,foot,.075,c.cloth,0);
    a.p('leaf',...foot,.19,.21,.055,c.cloth,0,0,Math.PI/2);
    socket(a,rec,part,foot,[0,1,0],.08);
   });
  }
 }
 function mimic(a,q){
  const {c,m,rec}=q,wood=c.skin,iron=c.cloth;
  a.with(rModel(0,.02*Math.sin(m.phase)*(m.run?1:0),0,1,1,1,0,0,m.strike*.10-m.lift*.08),()=>{
   surface(a,q,'torso','box',[0,.79,0],[1.17,.58,.83],wood);
   a.p('box',0,1.08,0,1.10,.035,.74,dark,0,0,0,0);
   for(const s of [-1,1]){a.p('box',s*.41,.79,.424,.10,.63,.045,iron,0,0,0,10);a.p('box',s*.41,.79,-.424,.10,.63,.045,iron,0,0,0,10);}
   for(let i=-2;i<=2;i++)a.p('box',i*.20,.62,.441,.16,.04,.018,'#b49b72',0,0,0,8);
   // Lid hinges about its rear edge, rather than separating from the box.
   a.with(rModel(0,1.10,-.42,1,1,1,0,0,-(.16+m.lift*.95+(1-m.strike)*.10)),()=>{
    surface(a,q,'head','box',[0,.12,.42],[1.23,.25,.92],wood);
    for(const s of [-1,1])a.p('box',s*.41,.25,.42,.11,.07,.92,iron,0,0,0,10);
    a.p('box',0,.13,.896,.24,.22,.04,gold,0,0,0,10);eyes(a,.27,.10,.887,.062,'#d8be86');
    for(let i=-2;i<=2;i++)a.p('horn',i*.21,-.11,.78,.045,.21,.04,bone,0,0,Math.PI,9);
   });
   for(let i=-2;i<=2;i++)a.p('horn',i*.21,1.14,.35,.045,.18,.04,bone,0,0,0,9);
  });
  for(const s of [-1,1])for(const front of [false,true]){
   const part=sidePart(s,front),step=gait(q,s,front?0:Math.PI);
   limb(a,q,part,[s*.47,.61,front?.27:-.29],step*.32-(front?m.strike*.45:0),0,.095,()=>{
    a.line([0,0,0],[s*.15,-.24,.03],.075,'#7e7357',0);a.line([s*.15,-.24,.03],[s*.22,-.48,.22],.065,'#7e7357',0);
    for(let j=-1;j<=1;j++)a.p('horn',s*.22+j*.065,-.46,.29,.025,.15,.025,bone,0,0,1.0,9);
    socket(a,rec,part,[s*.22,-.41,.22],[0,0,1],.07);
   });
  }
 }
 function raptor(a,q){
  const {c,m,rec}=q,w=m.weakness;
  a.with(rModel(0,0,0,1,1,1,0,0,-m.lift*.19+m.strike*.28+w.bend),()=>{
   surface(a,q,'torso','enemy:body',[0,1.05,-.10],[.38,.54,.59],c.skin);
   a.p('enemy:body',0,1.33,.32,.22,.51,.23,c.skin,0,0,-.27);
   a.with(rModel(0,1.91,.53,1,1,1,0,0,-m.lift*.45+m.strike*.47-(w.crawl?.7:0)),()=>{
    surface(a,q,'head','enemy:head',[0,0,0],[.29,.30,.32],c.skin);eyes(a,.18,.08,.24,.073);
    a.p('horn',0,-.03,.43,.18,.47,.14,c.cloth,0,0,1.45,9);
    for(let i=0;i<3;i++)a.p('leaf',0,.26+i*.045,-.08-i*.11,.05,.28,.17,c.cloth,0,0,-.55);
   });
   for(const s of [-1,1]){
    const part=sidePart(s,true);limb(a,q,part,[s*.32,1.31,-.06],w.crawl?-.65+gait(q,s)*.15:.10+m.lift*.45-m.strike*.55,-s*(w.crawl?.45:.10+Math.abs(gait(q,s))*.12),.10,()=>{
     a.p('leaf',s*.08,-.29,-.15,.21,.44,.12,c.cloth,0,-s*.17,-.35);
     for(let j=0;j<3;j++)a.p('leaf',s*(.11+j*.07),-.42-j*.08,-.24,.075,.31,.08,c.skin,0,-s*.2,-.35);
     socket(a,rec,part,[s*.13,-.35,-.08],[0,0,1],.10);
    });
   }
   for(let i=-1;i<=1;i++)a.p('leaf',i*.14,.96,-.83,.14,.58,.11,c.cloth,0,-i*.16,1.20+w.fatigue*.25);
  });
  for(const s of [-1,1]){const part=sidePart(s,false),step=gait(q,s)*(w.legs?.28:.58);
   limb(a,q,part,[s*.23,.89,-.06],step,0,.10,()=>{
    a.line([0,0,0],[0,-.31,-.22],.10,c.skin,0);a.line([0,-.31,-.22],[0,-.75,.12],.055,c.cloth,9);
    for(let j=-1;j<=1;j++)a.line([0,-.75,.12],[j*.10,-.80,.37],.022,bone,9);
    socket(a,rec,part,[0,-.57,.065],[0,0,1],.06);
   });
  }
 }
 function crab(a,q){
  const {c,m,rec}=q;
  surface(a,q,'torso','enemy:shell',[0,.70,-.12],[.79,.51,.63],c.skin,[0,1,0],9);
  for(let i=-1;i<=1;i++)a.B(i*.39,1.10,-.17,.35,.20,.64,c.cloth,0,i*.08,i*.08,9);
  a.with(rModel(0,.74,.48,1,1,1,0,0,-m.lift*.16+m.strike*.22),()=>{
   surface(a,q,'head','enemy:head',[0,0,0],[.34,.18,.24],c.skin);
   for(const s of [-1,1])a.line([s*.19,.07,.10],[s*.27,.40,.14],.035,c.cloth,9);
   eyes(a,.27,.40,.155,.068);
  });
  for(const s of [-1,1]){
   const arm=sidePart(s,true);
   limb(a,q,arm,[s*.59,.77,.20],-m.lift*.65+m.strike*.43,-s*.12,.14,()=>{
    a.line([0,0,0],[s*.24,-.10,.29],.11,c.skin,9);
    a.with(rModel(s*.28,-.04,.43,1,1,1,0,0,-m.lift*.45),()=>{
     a.p('enemy:head',0,0,.13,s>0?.27:.21,.22,.32,c.cloth,0,0,0,9);
     for(const finger of [-1,1])a.p('horn',finger*.13,0,.44,.075,.37,.07,bone,0,finger*(.22+m.lift*.40-m.strike*.15),Math.PI/2,9);
     socket(a,rec,arm,[0,0,.43],[0,1,0],.13);
    });
   });
   for(let i=0;i<3;i++){const part=sidePart(s,false),z=.03-i*.31,step=gait(q,s,i*2.2);
    limb(a,q,part,[s*.64,.58,z],0,step*.08,.06,()=>{
     const knee=[s*.33,.02+Math.max(0,step)*.09,step*.10],foot=[s*.54,-.50+Math.max(0,step)*.15,step*.15];
     a.line([0,0,0],knee,.07,c.skin,9);a.line(knee,foot,.04,c.cloth,9);socket(a,rec,part,foot,[0,0,1],.05);
    });
   }
  }
 }
 function centipede(a,q){
  const {c,m,rec}=q;
  for(let i=0;i<5;i++){
   const sway=Math.sin(m.phase-i*.7)*(m.run?.08:.015),z=.35-i*.37;
   a.with(rModel(sway,.47,z,1,1,1,0,0,m.strike*(i===0?.18:0)),()=>{
    if(i===2)surface(a,q,'torso','enemy:shell',[0,0,0],[.38,.34,.30],c.skin,[0,1,0],9);
    else a.p('enemy:shell',0,0,0,.38-i*.018,.34,.30,c.skin,0,0,0,9);
    a.B(0,.24,0,.12,.085,.52,c.cloth,0,0,0,10);
    if(i===0)a.with(rModel(0,.08,.32,1,1,1,0,0,-m.lift*.6+m.strike*.5),()=>{
     surface(a,q,'head','enemy:head',[0,0,0],[.28,.20,.24],c.cloth,[0,0,1],9);eyes(a,.14,.04,.22,.055);
     for(const s of [-1,1]){a.line([s*.13,.14,.10],[s*.24,.43,.30],.022,bone,9);a.p('horn',s*.18,-.05,.30,.047,.29,.045,bone,0,-s*(.30+m.lift*.35),1.2,9);}
    });
    for(const s of [-1,1]){const part=sidePart(s,i<2),step=gait(q,s,i*.85);
     limb(a,q,part,[s*.28,-.02,0],0,0,.045,()=>{
      const knee=[s*.20,-.03+Math.max(0,step)*.10,step*.08],foot=[s*.34,-.40+Math.max(0,step)*.16,step*.16];
      a.line([0,0,0],knee,.043,c.cloth,9);a.line(knee,foot,.026,bone,9);socket(a,rec,part,foot,[0,0,1],.035);
     });
    }
   });
  }
 }
 function idol(a,q){
  const {c,m,rec}=q,pulse=Math.sin(m.time*1.8)*.05*(1-m.weakness.fatigue*.6);
  surface(a,q,'torso','enemy:head',[0,1.20,0],[.21,.27,.20],c.cloth,[0,0,1],9);
  a.p('bead',0,1.22,.195,.07,.13,.035,'#c7d4b0',0,0,0,4);
  for(let i=0;i<6;i++){const ang=i*TAU/6+pulse*.35;
   a.B(Math.sin(ang)*.47,1.23+Math.cos(ang)*.53,-.025,.30,.34,.34,c.skin,0,ang,.08,9);
   if(i%2===0)a.p('box',Math.sin(ang)*.47,1.23+Math.cos(ang)*.53,.151,.045,.19,.012,'#637462',0,ang,0,9);
  }
  a.with(rModel(0,1.98+pulse,0,1,1,1,0,0,-m.lift*.2+m.strike*.24),()=>{
   surface(a,q,'head','box',[0,0,0],[.64,.50,.44],c.skin,[0,0,1],9);
   a.B(0,.04,.225,.44,.055,.03,dark,0,0,0,0);eyes(a,.14,.04,.251,.039,'#bcd3b0');
   for(const s of [-1,1])a.p('horn',s*.26,.35,0,.06,.35,.07,c.skin,0,-s*.4,0,9);
  });
  for(const s of [-1,1])for(const front of [false,true]){const part=sidePart(s,front);
   limb(a,q,part,[s*(front?.69:.23),front?1.27:.51,0],front?-m.lift*.9-m.strike*1.25:gait(q,s)*.15,0,.12,()=>{
    a.B(0,-.13+pulse,.04,front?.27:.23,front?.34:.23,.28,c.skin,0,0,s*.12,9);
    a.B(0,-.48+pulse,front?.12:.02,front?.37:.25,front?.30:.21,front?.34:.27,c.skin,0,s*.12,-s*.10,9);
    if(front)for(let i=-1;i<=1;i++)a.B(i*.11,-.46+pulse,.30,.085,.20,.06,bone,0,0,0,9);
    socket(a,rec,part,[0,-.44+pulse,front?.30:.15],[0,0,1],.10);
   });
  }
 }
 function bloom(a,q){
  const {c,m,rec}=q,bend=m.lift*.32-m.strike*.48+m.weakness.bend;
  surface(a,q,'torso','enemy:body',[0,.87,0],[.27,.58,.27],c.skin);
  a.with(rModel(0,1.48,0,1,1,1,0,0,bend),()=>{
   surface(a,q,'head','enemy:head',[0,.13,0],[.42,.33,.40],'#685258');
   a.p('bead',0,.31,.20,.14,.13,.13,'#d2b778',0,0,0,4);
   // Six thick cupped petals close around the throat at the actual strike.
   for(let i=0;i<6;i++){const ang=i*TAU/6,open=.74+m.lift*.42-m.strike*.48;
    a.with(rModel(0,.07,0,1,1,1,ang,0,open),()=>{
     a.p('leaf',0,.28,.35,.27,.56,.10,c.cloth);
     a.p('leaf',0,.32,.42,.17,.35,.035,'#c1a298');
     a.p('horn',0,.62,.30,.025,.17,.03,bone,0,0,.35,9);
    });
   }
  });
  for(const s of [-1,1])for(const front of [false,true]){const part=sidePart(s,front),at=[s*.22,front?1.05:.39,0],step=gait(q,s,front?0:Math.PI);
   limb(a,q,part,at,front?m.lift*.35-m.strike*.58:0,0,.065,()=>{
    const knee=[s*(front?.43:.25),front?-.19:-.13,step*.09],tip=[s*(front?.65:.40),front?-.55:-.32,front?.20:.27+step*.10];
    a.line([0,0,0],knee,.065,c.skin,0);a.line(knee,tip,.043,c.skin,0);
    a.p('leaf',...tip,front?.14:.18,front?.34:.28,.065,c.skin,0,-s*.50,front?.2:Math.PI/2);
    socket(a,rec,part,tip,[0,0,1],.06);
   });
  }
 }
 const forms={
  'root-treant':{scale:[.92,.96,.92],skin:'#827756',cloth:'#8e9e72',stride:1.30,draw:treant},
  'ash-raptor':{scale:[.94,1.02,.98],skin:'#a49580',cloth:'#625c55',stride:1.85,crawlPose:{pitch:.55,drop:.28},draw:raptor},
  'mire-toad':{scale:[1.04,1.07,1.01],skin:'#92a080',cloth:'#687e61',stride:1.05,draw:toad},
  'reliquary-mimic':{scale:[1.02,1.06,1.04],skin:'#876746',cloth:'#9c997a',stride:.95,draw:mimic},
  'rubble-crab':{scale:[.93,1.03,.97],skin:'#929083',cloth:'#b4aa8c',stride:1.12,draw:crab},
  'iron-centipede':{scale:[1.04,1.12,1.10],skin:'#737e76',cloth:'#b09b71',stride:1.43,draw:centipede},
  'cairn-idol':{scale:[1.03,1.01,1.04],skin:'#a5a796',cloth:'#a9c39f',stride:1.65,draw:idol},
  'mourning-bloom':{scale:[1.02,1.07,1.02],skin:'#71856a',cloth:'#a77e87',stride:1.2,draw:bloom}
 };
 for(const[id,{draw,...config}]of Object.entries(forms))EnemyCreatures.register(id,config,draw);
 return {ids:Object.freeze(Object.keys(forms))};
})();
