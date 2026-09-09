// Versioned, authored grammar. Numeric codes are permanent identity digits;
// array ordering, colour and cosmetic seeds never determine a technique ID.
export function createSkillComposition(){
 const forms=[
  {code:0,key:'needle',name:'針拳',family:'thread',anim:'thrust',path:'pierce',reach:2.4,arc:.65,targets:['torso'],requires:['rightArm'],text:'細い間合いをまっすぐ突く。'},
  {code:1,key:'hammer',name:'炉拳',family:'hammer',anim:'slam',path:'fall',reach:1.9,arc:1.4,targets:['head'],requires:['rightArm'],text:'頭上から重さを落とす。'},
  {code:2,key:'heel',name:'毬蹴',family:'footwork',anim:'kick',path:'pierce',reach:1.8,arc:1,targets:['torso'],requires:['rightLeg'],text:'片足を支えに、正面へ蹴り込む。'},
  {code:3,key:'chase',name:'追枝',family:'trail',anim:'zigzag',path:'pierce',reach:2.7,arc:.8,targets:['rightArm'],requires:['rightArm'],text:'角度を返しながら、遠い腕を捉える。'},
  {code:4,key:'cross',name:'割拍',family:'contest',anim:'cross',path:'sweep',reach:2.1,arc:2.3,targets:['torso'],requires:['rightArm'],text:'身体の前を交差する打撃を放つ。'},
  {code:5,key:'palm',name:'静掌',family:'patient',anim:'counter',path:'pierce',reach:1.5,arc:1.3,targets:['torso'],requires:['leftArm'],text:'懐で左の掌を短く打ち込む。'},
  {code:6,key:'echo',name:'響打',family:'bell',anim:'double',path:'sweep',reach:2,arc:1.7,targets:['leftArm'],requires:['rightArm'],text:'手首を返して相手の腕を打つ。'},
  {code:7,key:'wheel',name:'羽輪',family:'feather',anim:'spin',path:'orbit',reach:2,arc:5.4,targets:['torso'],requires:['rightArm'],maxTargets:3,text:'身を回し、周囲の相手を巻き込む。'},
  {code:8,key:'drop',name:'礎落',family:'stone',anim:'leap',path:'fall',reach:2.2,arc:1.2,targets:['torso'],requires:['rightArm','rightLeg'],text:'跳ね上がる姿勢から、一点へ打ち下ろす。'},
  {code:9,key:'rake',name:'炭払',family:'ember',anim:'slide',path:'sweep',reach:2.1,arc:2.8,targets:['leftLeg'],requires:['rightArm'],maxTargets:2,text:'身を低くして、足元を広く払う。'},
  {code:10,key:'edge',name:'綾刃',family:'weave',anim:'slash',path:'sweep',reach:2.3,arc:2.1,targets:['rightArm','leftArm'],requires:['rightArm'],text:'横へ振り抜き、構えた腕を切り開く。'},
  {code:11,key:'trip',name:'結脚',family:'knot',anim:'kick',path:'orbit',reach:1.65,arc:2.7,targets:['rightLeg'],requires:['rightLeg'],text:'近い相手の脚を横から払う。'}
 ];
 const cadences=[
  {code:0,key:'single',name:'一閃',cuts:[0,1],text:'一撃に息を乗せる。'},
  {code:1,key:'return',name:'双返',cuts:[0,.5,1],text:'等しい二拍で返す。'},
  {code:2,key:'delay',name:'間返',cuts:[0,.26,1],text:'短い一打のあと、間を置いて返す。'},
  {code:3,key:'triple',name:'三綴',cuts:[0,.24,.57,1],text:'三つの打撃を畳みかける。'}
 ];
 const feet=[
  {code:0,key:'plant',name:'据える',distance:0,angle:0,text:'足場を保つ。'},
  {code:1,key:'drive',name:'踏み込む',distance:1.9,angle:0,text:'大きく踏み込んで間合いを詰める。'},
  {code:2,key:'side',name:'横へ回る',distance:1.25,angle:Math.PI/2,text:'横へ大きく足を運び、攻める軸をずらす。'},
  {code:3,key:'draw',name:'引き足',distance:.9,angle:Math.PI,text:'一歩引いて間合いを測る。'}
 ];
 const reactions=[
  {code:0,key:'break',name:'姿勢崩し',action:{stagger:.65},entry:'offbalance',fx:'fracture',text:'姿勢を崩す。'},
  {code:1,key:'bind',name:'足止め',action:{status:'slow',duration:1.4},entry:'close',fx:'pinch',text:'命中した相手の動きを鈍らせる。'},
  {code:2,key:'drain',name:'力を削ぐ',action:{status:'weak',duration:1.2},entry:'rhythm',fx:'cleave',text:'短く相手の力を削ぐ。'},
  {code:3,key:'push',name:'押し離す',action:{knockback:.48},entry:'offbalance',fx:'ripple',text:'打点から相手を押し離す。'}
 ];
 const endings=[
  {code:0,key:'follow',name:'間合いを詰める',phase:0,distance:.8,angle:0,exit:'close',recovery:.55,text:'打ち終わりに踏み出し、近さを残す。'},
  {code:1,key:'settle',name:'構えを整える',phase:1,distance:0,angle:0,exit:'rhythm',recovery:.28,text:'その場で構えを整え、次の拍子へ渡す。'},
  {code:2,key:'withdraw',name:'間合いを開ける',phase:2,distance:1.35,angle:Math.PI,exit:'rhythm',recovery:.65,text:'打ち終わりに大きく引き、間合いを開ける。'}
 ];
 const tables={form:forms,cadence:cadences,footwork:feet,reaction:reactions,ending:endings};
 // Display-only vocabulary, indexed by permanent recipe codes. Each entry is
 // an authored Japanese/English pair; neither locale exposes internal tokens.
 // Technique imagery + epithet gives a readable title, not a recipe or phase.
 const titles=[
  [['糸通し','Needlework'],['縫い返し','Returning Stitch'],['待ち針','Patient Needle'],['三重縫い','Triple Stitch']],
  [['炉打ち','Forge Strike'],['金床返し','Anvil Rebound'],['火床起こし','Hearth Rousing'],['鍛え打ち','Tempering Blows']],
  [['毬蹴り','Ball Kick'],['蹴り返し','Returning Kick'],['爪先待ち','Patient Heel'],['弾み蹴り','Bounding Kicks']],
  [['枝渡り','Branch Crossing'],['燕返し','Swallow Return'],['道草打ち','Wandering Strike'],['千鳥追い','Plover Chase']],
  [['交差打ち','Cross Strike'],['綾重ね','Layered Weave'],['拍子外し','Broken Rhythm'],['畳み打ち','Folding Blows']],
  [['掌打ち','Palm Strike'],['波返し','Returning Wave'],['息合わせ','Measured Breath'],['水切り掌','Skipping Palm']],
  [['鐘打ち','Bell Strike'],['こだま返し','Echo Return'],['残響打ち','Lingering Chime'],['連ね鐘','Pealing Bells']],
  [['羽払い','Feather Sweep'],['風車返し','Windmill Return'],['風待ち輪','Patient Whirl'],['羽衣巡り','Feather Dance']],
  [['礎落とし','Foundation Drop'],['石跳ね返し','Stone Rebound'],['雫落とし','Falling Droplet'],['段落とし','Cascading Drops']],
  [['炭払い','Cinder Sweep'],['灰返し','Ashen Return'],['熾火起こし','Ember Rousing'],['火掻き','Hearth Raking']],
  [['綾断ち','Silken Cut'],['織り返し','Shuttle Return'],['糸切り待ち','Patient Shear'],['機織り刃','Loom Blades']],
  [['脚絡め','Leg Snare'],['結び返し','Returning Knot'],['ほつれ払い','Unraveling Sweep'],['組み紐蹴り','Braided Kicks']]
 ];
 // Footwork / contact / finish choose one complete image, never three
 // single-kanji suffixes. These are titles, not claims about discovery history.
 const epithets=[
  [[['根張り','Deep Root'],['岩戸','Stone Gate'],['落葉','Falling Leaf']],
   [['苔庭','Moss Garden'],['夕凪','Evening Calm'],['朝露','Morning Dew']],
   [['埋み火','Banked Ember'],['灯守り','Lamplighter'],['薄明かり','Fading Light']],
   [['山鳴り','Mountain Roar'],['潮騒','Ocean Murmur'],['引き潮','Ebb Tide']]],
  [[['山崩れ','Landslide'],['雷鳴','Thunder'],['通り雨','Passing Rain']],
   [['蔦這い','Climbing Ivy'],['結び目','Tied Cord'],['送り糸','Trailing Thread']],
   [['野火','Wildfire'],['残り火','Last Ember'],['夕焼け','Sunset']],
   [['押し潮','Rising Tide'],['滝壺','Waterfall Basin'],['波送り','Parting Wave']]],
  [[['風切り','Wind Shear'],['木枯らし','Winter Gale'],['舞い葉','Dancing Leaf']],
   [['糸車','Spinning Wheel'],['花籠','Flower Basket'],['花吹雪','Petal Storm']],
   [['辻風','Whirlwind'],['砂時計','Hourglass'],['砂流れ','Drifting Sand']],
   [['渦潮','Whirlpool'],['水車','Waterwheel'],['波紋','Rippling Water']]],
  [[['返り風','Returning Wind'],['雪待ち','Waiting Snow'],['雪解け','Snowmelt']],
   [['返り糸','Returning Thread'],['月待ち','Moon Watch'],['夜露','Night Dew']],
   [['遠火','Distant Flame'],['冬灯り','Winter Lantern'],['星明かり','Starlight']],
   [['返り潮','Returning Tide'],['入江','Sheltered Cove'],['帰り道','Homeward Path']]]
 ];
 function names(f,c,w,r,e){
  const title=titles[f.code][c.code],epithet=epithets[w.code][r.code][e.code];
  return {ja:`${epithet[0]}の${title[0]}`,en:`${epithet[1]} ${title[1]}`};
 }
 const motif={thread:'thread',hammer:'stone',footwork:'bell',trail:'blade',contest:'blade',patient:'shadow',bell:'bell',feather:'blade',stone:'stone',ember:'ember',weave:'thread',knot:'thread'};
 function resolve(input){
  if(input?.version!==undefined&&input.version!==1)throw Error('未対応の技構成です');
  const parts={};for(const [key,choices]of Object.entries(tables)){
   parts[key]=choices.find(v=>v.key===input?.[key]);if(!parts[key])throw Error('不明な技の部品: '+key);
  }return parts;
 }
 function id(input){const p=resolve(input);return 700000+p.form.code*10000+p.cadence.code*1000+p.footwork.code*100+p.reaction.code*10+p.ending.code;}
 function build(input,anchor){
  const {form:f,cadence:c,footwork:w,reaction:r,ending:e}=resolve(input),skillId=id(input),hits=c.cuts.length-1,phase=(f.code+c.code+e.phase)%3;
  const recipe=Object.freeze({version:1,...Object.fromEntries(Object.keys(tables).map(k=>[k,input[k]]))});
  const requiresExperience=anchor.requiresExperience.map(g=>[...g]);
  // Added ideas need a second lived source. Existing memento/cross families
  // already have two groups and retain their provenance requirements.
  if(requiresExperience.length===1)requiresExperience.push(['combat','play','rest','care','explore']);
  const desc=f.text+c.text+w.text+r.text+e.text;
  const action={weapon:-1,unarmed:true,school:'life',anim:f.anim,requires:f.requires,targets:f.targets,
   reach:f.reach,arc:f.arc,maxTargets:f.maxTargets||1,charge:f.anim==='slam'||f.anim==='leap'?.36:.2,
   swing:hits===1?.4:hits===2?.58:.76,recovery:e.recovery,cost:7+hits*3+(w.distance>0?2:0)+(r.key==='break'?2:0),
   fatigue:.45+hits*.2,power:(f.maxTargets?.8:1.05)/hits,hits,step:0,beatCuts:c.cuts,motionPath:f.path,
   approach:{distance:w.distance,angle:w.angle,turn:w.key==='side'?.9:0},finishStep:{distance:e.distance,angle:e.angle},...r.action,
   fx:{version:1,family:motif[f.family],path:f.path,rhythm:hits===1?'single':hits===2?'double':'triplet',impact:r.fx,release:e.key==='withdraw'?'recoil':e.key==='settle'?'vanish':'drift',seed:skillId,mist:.85,thickness:2.2,variation:.65,layers:{sigil:false,body:true,motes:true}}};
  return {id:skillId,key:`bl.skill.v1.${f.key}.${c.key}.${w.key}.${r.key}.${e.key}`,family:f.family,phase,
   names:names(f,c,w,r,e),
   descriptions:{ja:desc,en:`${f.key} with ${c.key} timing, ${w.key} footwork, ${r.key} contact and ${e.key} finish.`},
   tags:[...anchor.tags],requiresExperience,rarity:anchor.rarity,inheritance:anchor.inheritance,color:anchor.color,
   entry:phase===0?[]:[r.entry],exit:[e.exit],connection:phase===1?{recovery:.72}:{cost:.82},composition:recipe,action};
 }
 function expand(authored){
  const anchors=new Map();for(const d of authored)if(!d.passive&&!d.composition&&!anchors.has(d.family))anchors.set(d.family,d);
  const out=[];for(const f of forms){const anchor=anchors.get(f.family);if(!anchor)continue;
   for(const c of cadences)for(const w of feet)for(const r of reactions)for(const e of endings)
    out.push(build({form:f.key,cadence:c.key,footwork:w.key,reaction:r.key,ending:e.key},anchor));
  }return out;
 }
 return Object.freeze({version:1,tables,id,resolve,build,expand});
}
export const SkillComposition=createSkillComposition();
