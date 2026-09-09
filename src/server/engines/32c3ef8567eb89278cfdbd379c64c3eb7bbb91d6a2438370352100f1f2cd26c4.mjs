// Generated immutable rules runtime. Regenerate with node tools/archive-simulation.mjs
const SkillComposition=(function createSkillComposition(){
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
  const anchors=new Map();for(const d of authored)if(!d.passive&&!d.composition&&(!anchors.has(d.family)||d.id<anchors.get(d.family).id))anchors.set(d.family,d);
  const out=[];for(const f of forms){const anchor=anchors.get(f.family);if(!anchor)continue;
   for(const c of cadences)for(const w of feet)for(const r of reactions)for(const e of endings)
    out.push(build({form:f.key,cadence:c.key,footwork:w.key,reaction:r.key,ending:e.key},anchor));
  }return out;
 }
 return Object.freeze({version:1,tables,id,resolve,build,expand});
})();
const BL_SKILL_DEFINITIONS=[{"key":"bl.skill.hammer.opening","tags":["weight","rhythm","craft"],"requiresExperience":[["craft","weight"]],"color":"#dcab72","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":9,"fatigue":0.7,"charge":0.24,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.38,"hits":1,"anim":"slam","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":1.3,"stagger":1.35},"id":60000,"phase":0,"ja":"炉打ち","en":"Hearth Knock","desc":"短く叩いて重心を崩す。威力は控えめ。","descEn":"A short blow upsets balance without much damage.","entry":[],"exit":["offbalance"],"family":"hammer","names":{"ja":"炉打ち","en":"Hearth Knock"},"descriptions":{"ja":"短く叩いて重心を崩す。威力は控えめ。","en":"A short blow upsets balance without much damage."}},{"key":"bl.skill.hammer.turn","tags":["weight","rhythm","craft"],"requiresExperience":[["craft","weight"]],"color":"#dcab72","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":14,"fatigue":0.7,"charge":0.22,"swing":0.57,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.48,"hits":2,"anim":"double","school":"life","requires":["rightArm"],"weapon":-1},"id":60001,"phase":1,"ja":"鉄返し","en":"Iron Rebound","desc":"反動を返して二度打つ。崩れた相手を拾いやすい。","descEn":"Return the recoil in two blows; catches an unbalanced foe.","entry":["offbalance"],"exit":["rhythm"],"connection":{"charge":0.68,"tracking":0.42},"family":"hammer","names":{"ja":"鉄返し","en":"Iron Rebound"},"descriptions":{"ja":"反動を返して二度打つ。崩れた相手を拾いやすい。","en":"Return the recoil in two blows; catches an unbalanced foe."}},{"key":"bl.skill.hammer.close","tags":["weight","rhythm","craft"],"requiresExperience":[["craft","weight"]],"color":"#dcab72","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":23,"fatigue":0.7,"charge":0.55,"swing":0.4,"recovery":1.15,"reach":2.15,"arc":1.6,"power":1.55,"hits":1,"anim":"slam","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":3},"id":60002,"phase":2,"ja":"炉底割り","en":"Hearthbreaker","desc":"深く振り下ろして構えを砕く。外すと隙が大きい。","descEn":"A committed downward strike breaks guards; a miss leaves you open.","entry":["rhythm"],"exit":["offbalance"],"connection":{"recovery":0.68,"knockback":0.35},"family":"hammer","names":{"ja":"炉底割り","en":"Hearthbreaker"},"descriptions":{"ja":"深く振り下ろして構えを砕く。外すと隙が大きい。","en":"A committed downward strike breaks guards; a miss leaves you open."}},{"key":"bl.skill.thread.opening","tags":["patience","precision","craft"],"requiresExperience":[["care","patience","craft"]],"color":"#bcb7d0","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":9,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.7,"arc":0.6,"power":0.62,"hits":1,"anim":"thrust","school":"life","requires":["rightArm"],"weapon":-1,"step":0.25},"id":60010,"phase":0,"ja":"糸通し","en":"Thread the Needle","desc":"細く踏み込む一撃。正面以外には届きにくい。","descEn":"A precise forward strike with a narrow line of contact.","entry":[],"exit":["close"],"affinities":["net","care"],"family":"thread","names":{"ja":"糸通し","en":"Thread the Needle"},"descriptions":{"ja":"細く踏み込む一撃。正面以外には届きにくい。","en":"A precise forward strike with a narrow line of contact."}},{"key":"bl.skill.thread.turn","tags":["patience","precision","craft"],"requiresExperience":[["care","patience","craft"]],"color":"#bcb7d0","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":12,"fatigue":0.7,"charge":0.22,"swing":0.5,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.44,"hits":2,"anim":"cross","school":"life","requires":["rightArm"],"weapon":-1},"id":60011,"phase":1,"ja":"綾返し","en":"Woven Return","desc":"二つの拍子で打ち返す。近くの相手と繋がる。","descEn":"Two alternating beats weave into a nearby foe.","entry":["close"],"exit":["rhythm"],"connection":{"reach":0.3,"tracking":0.6},"affinities":["net","care"],"family":"thread","names":{"ja":"綾返し","en":"Woven Return"},"descriptions":{"ja":"二つの拍子で打ち返す。近くの相手と繋がる。","en":"Two alternating beats weave into a nearby foe."}},{"key":"bl.skill.thread.close","tags":["patience","precision","craft"],"requiresExperience":[["care","patience","craft"]],"color":"#bcb7d0","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":12,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.42,"reach":2.15,"arc":1.1,"power":0.64,"hits":1,"anim":"slide","school":"life","requires":["rightArm"],"weapon":-1,"status":"slow","duration":1.7},"id":60012,"phase":2,"ja":"結び止め","en":"Last Knot","desc":"低く払って足を鈍らせる。広くは届かない。","descEn":"A low sweep briefly slows the target in front.","entry":["rhythm"],"exit":["close"],"connection":{"cost":0.78,"recovery":0.8},"affinities":["net","care"],"family":"thread","names":{"ja":"結び止め","en":"Last Knot"},"descriptions":{"ja":"低く払って足を鈍らせる。広くは届かない。","en":"A low sweep briefly slows the target in front."}},{"key":"bl.skill.footwork.opening","tags":["play","light","rhythm"],"requiresExperience":[["play","light","rhythm"]],"color":"#bdd09c","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":7,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.48,"hits":1,"anim":"kick","school":"life","requires":["rightLeg"],"weapon":-1,"step":0.45},"id":60020,"phase":0,"ja":"毬拍子","en":"Skipping Beat","desc":"弾むように近づき、小さく打つ。","descEn":"A bouncing step carries a light strike forward.","entry":[],"exit":["rhythm"],"family":"footwork","names":{"ja":"毬拍子","en":"Skipping Beat"},"descriptions":{"ja":"弾むように近づき、小さく打つ。","en":"A bouncing step carries a light strike forward."}},{"key":"bl.skill.footwork.turn","tags":["play","light","rhythm"],"requiresExperience":[["play","light","rhythm"]],"color":"#bdd09c","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":14,"fatigue":0.7,"charge":0.22,"swing":0.6,"recovery":0.56,"reach":2.15,"arc":3.6,"power":0.37,"hits":2,"anim":"spin","school":"life","requires":["rightArm"],"weapon":-1,"maxTargets":2},"id":60021,"phase":1,"ja":"くるり舞","en":"Turning Dance","desc":"回りながら二度払う。周囲の相手も巻き込む。","descEn":"Two circular blows can catch nearby enemies.","entry":["rhythm"],"exit":["close"],"connection":{"reach":0.3,"tracking":0.6},"family":"footwork","names":{"ja":"くるり舞","en":"Turning Dance"},"descriptions":{"ja":"回りながら二度払う。周囲の相手も巻き込む。","en":"Two circular blows can catch nearby enemies."}},{"key":"bl.skill.footwork.close","tags":["play","light","rhythm"],"requiresExperience":[["play","light","rhythm"]],"color":"#bdd09c","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":6,"fatigue":0.7,"charge":0.12,"swing":0.4,"recovery":0.22,"reach":2.15,"arc":1.6,"power":0.68,"hits":1,"anim":"kick","school":"life","requires":["rightLeg"],"weapon":-1},"id":60022,"phase":2,"ja":"遊び終い","en":"Playful Farewell","desc":"素早く蹴って構え直す。消耗は小さい。","descEn":"A quick finishing kick returns to a ready stance.","entry":["close"],"exit":["rhythm"],"connection":{"cost":0.78,"recovery":0.8},"family":"footwork","names":{"ja":"遊び終い","en":"Playful Farewell"},"descriptions":{"ja":"素早く蹴って構え直す。消耗は小さい。","en":"A quick finishing kick returns to a ready stance."}},{"key":"bl.skill.trail.opening","tags":["explore","track","precision"],"requiresExperience":[["explore","track"]],"color":"#a4c5ad","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":9,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.9,"arc":0.7,"power":0.72,"hits":1,"anim":"thrust","school":"life","requires":["rightArm"],"weapon":-1,"step":0.4},"id":60030,"phase":0,"ja":"足跡突き","en":"Trail Point","desc":"一歩先へ届く突き。狭い間合いを縫う。","descEn":"A long narrow thrust reaches one step farther.","entry":[],"exit":["close"],"affinities":["weapon","precision"],"family":"trail","names":{"ja":"足跡突き","en":"Trail Point"},"descriptions":{"ja":"一歩先へ届く突き。狭い間合いを縫う。","en":"A long narrow thrust reaches one step farther."}},{"key":"bl.skill.trail.turn","tags":["explore","track","precision"],"requiresExperience":[["explore","track"]],"color":"#a4c5ad","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":13,"fatigue":0.7,"charge":0.22,"swing":0.55,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.42,"hits":2,"anim":"zigzag","school":"life","requires":["rightArm"],"weapon":-1,"step":0.35},"id":60031,"phase":1,"ja":"追い枝","en":"Following Bough","desc":"角度を変えて追い打つ。近い相手を逃しにくい。","descEn":"Turn into a follow-up against a nearby target.","entry":["close"],"exit":["offbalance"],"connection":{"reach":0.3,"tracking":0.6},"affinities":["weapon","precision"],"family":"trail","names":{"ja":"追い枝","en":"Following Bough"},"descriptions":{"ja":"角度を変えて追い打つ。近い相手を逃しにくい。","en":"Turn into a follow-up against a nearby target."}},{"key":"bl.skill.trail.close","tags":["explore","track","precision"],"requiresExperience":[["explore","track"]],"color":"#a4c5ad","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":17,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.86,"reach":3.1,"arc":1,"power":1.26,"hits":1,"anim":"slash","school":"life","requires":["rightArm"],"weapon":-1},"id":60032,"phase":2,"ja":"獣道断ち","en":"Trail Sever","desc":"長く届く一撃で締める。空振り後の戻りは遅い。","descEn":"A long finishing cut takes time to recover after a miss.","entry":["offbalance"],"exit":["close"],"connection":{"cost":0.78,"recovery":0.8},"affinities":["weapon","precision"],"family":"trail","names":{"ja":"獣道断ち","en":"Trail Sever"},"descriptions":{"ja":"長く届く一撃で締める。空振り後の戻りは遅い。","en":"A long finishing cut takes time to recover after a miss."}},{"key":"bl.skill.contest.opening","tags":["combat","weight","tension"],"requiresExperience":[["combat"]],"color":"#cf9b87","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":9,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.44,"hits":1,"anim":"thrust","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":1.5,"stagger":1.35},"id":60040,"phase":0,"ja":"間割り","en":"Opening Wedge","desc":"低く打ち込み、押し合いの隙を作る。","descEn":"Drive a low blow into the opening of an exchange.","entry":[],"exit":["offbalance"],"family":"contest","names":{"ja":"間割り","en":"Opening Wedge"},"descriptions":{"ja":"低く打ち込み、押し合いの隙を作る。","en":"Drive a low blow into the opening of an exchange."}},{"key":"bl.skill.contest.turn","tags":["combat","weight","tension"],"requiresExperience":[["combat"]],"color":"#cf9b87","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":15,"fatigue":0.7,"charge":0.22,"swing":0.55,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.55,"hits":2,"anim":"cross","school":"life","requires":["rightArm"],"weapon":-1},"id":60041,"phase":1,"ja":"せめぎ返し","en":"Contested Return","desc":"崩れた構えへ重ねて打ち込む。","descEn":"A forceful return presses an unbalanced guard.","entry":["offbalance"],"exit":["rhythm"],"connection":{"reach":0.3,"tracking":0.6},"family":"contest","names":{"ja":"せめぎ返し","en":"Contested Return"},"descriptions":{"ja":"崩れた構えへ重ねて打ち込む。","en":"A forceful return presses an unbalanced guard."}},{"key":"bl.skill.contest.close","tags":["combat","weight","tension"],"requiresExperience":[["combat"]],"color":"#cf9b87","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":22,"fatigue":0.7,"charge":0.45,"swing":0.4,"recovery":0.9,"reach":2.15,"arc":1.6,"power":1.2,"hits":1,"anim":"slam","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":3},"id":60042,"phase":2,"ja":"断ち拍子","en":"Decisive Beat","desc":"溜めて叩き、強固な構えも崩す。消耗は大きい。","descEn":"A committed heavy blow can break a formidable guard.","entry":["rhythm"],"exit":["offbalance"],"connection":{"cost":0.78,"recovery":0.8},"family":"contest","names":{"ja":"断ち拍子","en":"Decisive Beat"},"descriptions":{"ja":"溜めて叩き、強固な構えも崩す。消耗は大きい。","en":"A committed heavy blow can break a formidable guard."}},{"key":"bl.skill.patient.opening","tags":["patience","observe","rest"],"requiresExperience":[["patience","rest","study","tension"]],"color":"#9eafb0","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":5,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.35,"reach":2.15,"arc":0.8,"power":0.35,"hits":1,"anim":"thrust","school":"life","requires":["rightArm"],"weapon":-1},"id":60050,"phase":0,"ja":"待ち針","en":"Patient Needle","desc":"小さく刺して次の拍子へ備える。","descEn":"A small precise strike prepares the next beat.","entry":[],"exit":["rhythm"],"affinities":["defeat","rest"],"family":"patient","names":{"ja":"待ち針","en":"Patient Needle"},"descriptions":{"ja":"小さく刺して次の拍子へ備える。","en":"A small precise strike prepares the next beat."}},{"key":"bl.skill.patient.turn","tags":["patience","observe","rest"],"requiresExperience":[["patience","rest","study","tension"]],"color":"#9eafb0","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":5,"fatigue":0.7,"charge":0.13,"swing":0.38,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.52,"hits":1,"anim":"slash","school":"life","requires":["rightArm"],"weapon":-1},"id":60051,"phase":1,"ja":"息継ぎ打ち","en":"Breath Between","desc":"大振りせずに繋ぐ。長い連携でも息を残しやすい。","descEn":"An economical linking blow leaves breath for later.","entry":["rhythm"],"exit":["close"],"connection":{"reach":0.3,"tracking":0.6},"affinities":["defeat","rest"],"family":"patient","names":{"ja":"息継ぎ打ち","en":"Breath Between"},"descriptions":{"ja":"大振りせずに繋ぐ。長い連携でも息を残しやすい。","en":"An economical linking blow leaves breath for later."}},{"key":"bl.skill.patient.close","tags":["patience","observe","rest"],"requiresExperience":[["patience","rest","study","tension"]],"color":"#9eafb0","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":7,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.24,"reach":2.15,"arc":1.6,"power":0.45,"hits":1,"anim":"counter","school":"life","requires":["leftArm"],"weapon":-1,"breakPower":1.7},"id":60052,"phase":2,"ja":"静の掌","en":"Quiet Palm","desc":"近い相手を押し崩し、短く終える。","descEn":"A close palm blow breaks balance and settles quickly.","entry":["close"],"exit":["offbalance"],"connection":{"cost":0.78,"recovery":0.8},"affinities":["defeat","rest"],"family":"patient","names":{"ja":"静の掌","en":"Quiet Palm"},"descriptions":{"ja":"近い相手を押し崩し、短く終える。","en":"A close palm blow breaks balance and settles quickly."}},{"key":"bl.skill.bell.opening","tags":["memory","rhythm","bell"],"requiresExperience":[["bell"],["rhythm","combat","craft","play"]],"color":"#ceb778","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":6,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.38,"hits":1,"anim":"thrust","school":"life","requires":["rightArm"],"weapon":-1},"id":60060,"phase":0,"ja":"鈴触れ","en":"Bell Touch","desc":"軽い一撃が、遅い次の響きを誘う。","descEn":"A light touch sets the rhythm for a later resonance.","entry":[],"exit":["ringing"],"affinities":["family"],"family":"bell","names":{"ja":"鈴触れ","en":"Bell Touch"},"descriptions":{"ja":"軽い一撃が、遅い次の響きを誘う。","en":"A light touch sets the rhythm for a later resonance."}},{"key":"bl.skill.bell.turn","tags":["memory","rhythm","bell"],"requiresExperience":[["bell"],["rhythm","combat","craft","play"]],"color":"#ceb778","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":14,"fatigue":0.7,"charge":0.22,"swing":0.85,"recovery":0.56,"reach":2.05,"arc":1.6,"power":0.58,"hits":2,"anim":"double","school":"life","requires":["rightArm"],"weapon":-1},"id":60061,"phase":1,"ja":"残響打ち","en":"Echoing Blow","desc":"間をおいて二度響く。相手が離れると二打目を外す。","descEn":"Two separated blows; the second can miss a departing foe.","entry":["ringing"],"exit":["rhythm"],"connection":{"reach":0.3,"tracking":0.6},"affinities":["family"],"family":"bell","names":{"ja":"残響打ち","en":"Echoing Blow"},"descriptions":{"ja":"間をおいて二度響く。相手が離れると二打目を外す。","en":"Two separated blows; the second can miss a departing foe."}},{"key":"bl.skill.bell.close","tags":["memory","rhythm","bell"],"requiresExperience":[["bell"],["rhythm","combat","craft","play"]],"color":"#ceb778","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":19,"fatigue":0.7,"charge":0.42,"swing":0.4,"recovery":0.95,"reach":2.15,"arc":1.6,"power":1.4,"hits":1,"anim":"slam","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":2},"id":60062,"phase":2,"ja":"鳴り納め","en":"Closing Chime","desc":"響きを重ねて振り切る。大きな隙が残る。","descEn":"Finish the resonance with a committed, slow-recovering sweep.","entry":["rhythm"],"exit":["ringing"],"connection":{"cost":0.78,"recovery":0.8},"affinities":["family"],"family":"bell","names":{"ja":"鳴り納め","en":"Closing Chime"},"descriptions":{"ja":"響きを重ねて振り切る。大きな隙が残る。","en":"Finish the resonance with a committed, slow-recovering sweep."}},{"key":"bl.skill.feather.opening","tags":["feather","light","explore"],"requiresExperience":[["feather"],["light","explore","track","play"]],"color":"#b7cfce","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":5,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":2.4,"power":0.4,"hits":1,"anim":"slash","school":"life","requires":["rightArm"],"weapon":-1},"id":60070,"phase":0,"ja":"羽先払い","en":"Feathertip","desc":"浅く払って、近い間合いを保つ。","descEn":"A shallow sweep keeps the exchange close.","entry":[],"exit":["close"],"family":"feather","names":{"ja":"羽先払い","en":"Feathertip"},"descriptions":{"ja":"浅く払って、近い間合いを保つ。","en":"A shallow sweep keeps the exchange close."}},{"key":"bl.skill.feather.turn","tags":["feather","light","explore"],"requiresExperience":[["feather"],["light","explore","track","play"]],"color":"#b7cfce","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":10,"fatigue":0.7,"charge":0.12,"swing":0.45,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.36,"hits":2,"anim":"double","school":"life","requires":["rightArm"],"weapon":-1},"id":60071,"phase":1,"ja":"風羽返し","en":"Turning Feather","desc":"軽く二度返す。接近した相手へ向く。","descEn":"Two light reversals work best at close range.","entry":["close"],"exit":["rhythm"],"connection":{"reach":0.3,"tracking":0.6},"family":"feather","names":{"ja":"風羽返し","en":"Turning Feather"},"descriptions":{"ja":"軽く二度返す。接近した相手へ向く。","en":"Two light reversals work best at close range."}},{"key":"bl.skill.feather.close","tags":["feather","light","explore"],"requiresExperience":[["feather"],["light","explore","track","play"]],"color":"#b7cfce","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":15,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.68,"reach":2.15,"arc":1.6,"power":1.1,"hits":1,"anim":"leap","school":"life","requires":["rightArm"],"weapon":-1,"step":0.45},"id":60072,"phase":2,"ja":"落羽","en":"Falling Feather","desc":"跳ねて打ち下ろす。着地には小さな隙がある。","descEn":"A rising motion ends in a downward strike and exposed landing.","entry":["rhythm"],"exit":["offbalance"],"connection":{"cost":0.78,"recovery":0.8},"family":"feather","names":{"ja":"落羽","en":"Falling Feather"},"descriptions":{"ja":"跳ねて打ち下ろす。着地には小さな隙がある。","en":"A rising motion ends in a downward strike and exposed landing."}},{"key":"bl.skill.feather.storm_swallow","tags":["feather","light","explore"],"requiresExperience":[["feather"],["explore","combat"]],"color":"#b7cfce","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":22,"fatigue":2,"charge":0.28,"swing":0.6,"recovery":0.76,"reach":2.3,"arc":1.5,"power":0.86,"hits":1,"anim":"leap","school":"life","requires":["rightArm"],"weapon":-1,"unarmed":true,"approach":{"distance":1.85,"angle":0,"turn":0},"finishStep":{"distance":0.9,"angle":3.141592653589793},"motionPath":"fall","presentation":"stormleap"},"id":60073,"phase":2,"ja":"雷渡り","en":"Storm Swallow","desc":"稲妻を引いて飛び込み、着地の一打から身を引く。踏切と着地に隙がある。","descEn":"Leap behind branching lightning, strike on landing, then draw back. Takeoff and landing remain exposed.","entry":["offbalance"],"exit":["rhythm"],"connection":{"tracking":0.35,"recovery":0.82},"family":"feather","names":{"ja":"雷渡り","en":"Storm Swallow"},"descriptions":{"ja":"稲妻を引いて飛び込み、着地の一打から身を引く。踏切と着地に隙がある。","en":"Leap behind branching lightning, strike on landing, then draw back. Takeoff and landing remain exposed."}},{"key":"bl.skill.stone.opening","tags":["stone","weight","memory"],"requiresExperience":[["stone"],["weight","combat","explore","study"]],"color":"#c0b2a0","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":8,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.3,"hits":1,"anim":"slam","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":1.6,"stagger":1.35},"id":60080,"phase":0,"ja":"石据え","en":"Set the Stone","desc":"重心を落として打つ。軽い構えを崩す。","descEn":"A grounded blow breaks a light stance.","entry":[],"exit":["offbalance"],"family":"stone","names":{"ja":"石据え","en":"Set the Stone"},"descriptions":{"ja":"重心を落として打つ。軽い構えを崩す。","en":"A grounded blow breaks a light stance."}},{"key":"bl.skill.stone.turn","tags":["stone","weight","memory"],"requiresExperience":[["stone"],["weight","combat","explore","study"]],"color":"#c0b2a0","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":15,"fatigue":0.7,"charge":0.22,"swing":0.62,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.5,"hits":2,"anim":"cross","school":"life","requires":["rightArm"],"weapon":-1},"id":60081,"phase":1,"ja":"転がし返し","en":"Rolling Return","desc":"崩れた相手へ連続して重さを乗せる。","descEn":"Roll two weighty blows into an unbalanced enemy.","entry":["offbalance"],"exit":["rhythm"],"connection":{"charge":0.68,"tracking":0.42},"family":"stone","names":{"ja":"転がし返し","en":"Rolling Return"},"descriptions":{"ja":"崩れた相手へ連続して重さを乗せる。","en":"Roll two weighty blows into an unbalanced enemy."}},{"key":"bl.skill.stone.close","tags":["stone","weight","memory"],"requiresExperience":[["stone"],["weight","combat","explore","study"]],"color":"#c0b2a0","rarity":0.7,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":21,"fatigue":0.7,"charge":0.55,"swing":0.4,"recovery":1,"reach":2.15,"arc":1.6,"power":1.25,"hits":1,"anim":"slam","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":3},"id":60082,"phase":2,"ja":"礎落とし","en":"Foundation Drop","desc":"重さを一点へ落とす。硬い構えにも通じる。","descEn":"Drop weight into one point to break a strong guard.","entry":["rhythm"],"exit":["offbalance"],"connection":{"recovery":0.68,"knockback":0.35},"family":"stone","names":{"ja":"礎落とし","en":"Foundation Drop"},"descriptions":{"ja":"重さを一点へ落とす。硬い構えにも通じる。","en":"Drop weight into one point to break a strong guard."}},{"key":"bl.skill.ember.opening","tags":["charcoal","craft","memory"],"requiresExperience":[["charcoal"],["craft","weight","study"]],"color":"#de996d","rarity":0.55,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":8,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":2.6,"power":0.4,"hits":1,"anim":"slide","school":"life","requires":["rightArm"],"weapon":-1},"id":60090,"phase":0,"ja":"炭掻き","en":"Ember Rake","desc":"低く広く払って、次の火種を残す。","descEn":"A broad low sweep prepares the next ember.","entry":[],"exit":["ember"],"family":"ember","names":{"ja":"炭掻き","en":"Ember Rake"},"descriptions":{"ja":"低く広く払って、次の火種を残す。","en":"A broad low sweep prepares the next ember."}},{"key":"bl.skill.ember.turn","tags":["charcoal","craft","memory"],"requiresExperience":[["charcoal"],["craft","weight","study"]],"color":"#de996d","rarity":0.55,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":15,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.35,"hits":2,"anim":"double","school":"life","requires":["rightArm"],"weapon":-1,"status":"burn","duration":1.2},"id":60091,"phase":1,"ja":"熾し返し","en":"Rekindling","desc":"細かな二打で火種を拾う。触れた相手に熱を残す。","descEn":"Two small blows kindle a brief burn on contact.","entry":["ember"],"exit":["rhythm"],"connection":{"reach":0.3,"tracking":0.6},"family":"ember","names":{"ja":"熾し返し","en":"Rekindling"},"descriptions":{"ja":"細かな二打で火種を拾う。触れた相手に熱を残す。","en":"Two small blows kindle a brief burn on contact."}},{"key":"bl.skill.ember.close","tags":["charcoal","craft","memory"],"requiresExperience":[["charcoal"],["craft","weight","study"]],"color":"#de996d","rarity":0.55,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":16,"fatigue":0.7,"charge":0.4,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.9,"hits":1,"anim":"slam","school":"life","requires":["rightArm"],"weapon":-1,"status":"weak","duration":1.5},"id":60092,"phase":2,"ja":"灰かぶり","en":"Ashfall","desc":"灰を落とすように叩く。短く相手の力を削ぐ。","descEn":"A downward strike briefly weakens the target.","entry":["rhythm"],"exit":["offbalance"],"connection":{"cost":0.78,"recovery":0.8},"family":"ember","names":{"ja":"灰かぶり","en":"Ashfall"},"descriptions":{"ja":"灰を落とすように叩く。短く相手の力を削ぐ。","en":"A downward strike briefly weakens the target."}},{"key":"bl.skill.ember.cinderbrand","tags":["charcoal","craft","memory"],"requiresExperience":[["charcoal"],["craft","combat"]],"color":"#de996d","rarity":0.55,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":17,"fatigue":1.6,"charge":0.24,"swing":0.48,"recovery":0.62,"reach":2.65,"arc":2.3,"power":0.72,"hits":1,"anim":"slash","school":"life","requires":["rightArm"],"weapon":0,"approach":{"distance":0.95,"angle":0,"turn":0},"finishStep":{"distance":0.65,"angle":3.141592653589793},"motionPath":"sweep","presentation":"cinderblade"},"id":60093,"phase":1,"ja":"煤火の剣","en":"Cinderbrand","desc":"刃に火の筋を纏わせ、踏み込んで薙ぐ。払い終わりに間合いを開く。","descEn":"A blade draws a wake of fire, then opens distance after the cut.","entry":["rhythm"],"exit":["offbalance"],"connection":{"charge":0.82,"recovery":0.85},"family":"ember","names":{"ja":"煤火の剣","en":"Cinderbrand"},"descriptions":{"ja":"刃に火の筋を纏わせ、踏み込んで薙ぐ。払い終わりに間合いを開く。","en":"A blade draws a wake of fire, then opens distance after the cut."}},{"key":"bl.skill.weave.opening","tags":["craft","combat","cross"],"requiresExperience":[["craft","care"],["combat","study"]],"color":"#c6b18c","rarity":0.65,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":7,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.45,"hits":1,"anim":"counter","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":1.3},"id":60100,"phase":0,"ja":"打ち合わせ","en":"Meeting Blows","desc":"仕事で覚えた拍子を、敵の構えへ合わせる。","descEn":"Bring a practiced working rhythm into an enemy guard.","entry":[],"exit":["rhythm"],"family":"weave","names":{"ja":"打ち合わせ","en":"Meeting Blows"},"descriptions":{"ja":"仕事で覚えた拍子を、敵の構えへ合わせる。","en":"Bring a practiced working rhythm into an enemy guard."}},{"key":"bl.skill.weave.turn","tags":["craft","combat","cross"],"requiresExperience":[["craft","care"],["combat","study"]],"color":"#c6b18c","rarity":0.65,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":12,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":0.7,"power":0.7,"hits":1,"anim":"thrust","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":2.2},"id":60101,"phase":1,"ja":"縫い崩し","en":"Seam Break","desc":"拍子を拾い、狭い一点を崩す。","descEn":"Follow a rhythm into a narrow break in the stance.","entry":["rhythm"],"exit":["offbalance"],"connection":{"reach":0.3,"tracking":0.6},"family":"weave","names":{"ja":"縫い崩し","en":"Seam Break"},"descriptions":{"ja":"拍子を拾い、狭い一点を崩す。","en":"Follow a rhythm into a narrow break in the stance."}},{"key":"bl.skill.weave.close","tags":["craft","combat","cross"],"requiresExperience":[["craft","care"],["combat","study"]],"color":"#c6b18c","rarity":0.65,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":21,"fatigue":0.7,"charge":0.22,"swing":0.85,"recovery":0.7,"reach":2.15,"arc":1.6,"power":0.48,"hits":3,"anim":"cross","school":"life","requires":["rightArm"],"weapon":-1},"id":60102,"phase":2,"ja":"折り返し三打","en":"Threefold Return","desc":"崩れを三つの打撃へ変える。長くその場へ留まる。","descEn":"Three blows exploit lost balance but commit you to the exchange.","entry":["offbalance"],"exit":["rhythm"],"connection":{"cost":0.78,"recovery":0.8},"family":"weave","names":{"ja":"折り返し三打","en":"Threefold Return"},"descriptions":{"ja":"崩れを三つの打撃へ変える。長くその場へ留まる。","en":"Three blows exploit lost balance but commit you to the exchange."}},{"key":"bl.skill.unexpected.opening","tags":["explore","rest","cross"],"requiresExperience":[["explore","track"],["rest","patience","pray"]],"color":"#9eb4a8","rarity":0.5,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":6,"fatigue":0.7,"charge":0.22,"swing":0.4,"recovery":0.56,"reach":2.15,"arc":1.6,"power":0.4,"hits":1,"anim":"thrust","school":"life","requires":["rightArm"],"weapon":-1,"step":0.28},"id":60110,"phase":0,"ja":"木陰の間","en":"Underleaf Pause","desc":"慌てず小さく踏み込む。近さを次へ残す。","descEn":"An unhurried small step leaves the next exchange close.","entry":[],"exit":["close"],"family":"unexpected","names":{"ja":"木陰の間","en":"Underleaf Pause"},"descriptions":{"ja":"慌てず小さく踏み込む。近さを次へ残す。","en":"An unhurried small step leaves the next exchange close."}},{"key":"bl.skill.unexpected.turn","tags":["explore","rest","cross"],"requiresExperience":[["explore","track"],["rest","patience","pray"]],"color":"#9eb4a8","rarity":0.5,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":11,"fatigue":0.7,"charge":0.22,"swing":0.52,"recovery":0.56,"reach":2.15,"arc":3.5,"power":0.66,"hits":1,"anim":"spin","school":"life","requires":["rightArm"],"weapon":-1,"maxTargets":2},"id":60111,"phase":1,"ja":"流れ枝","en":"Drifting Bough","desc":"大きく弧を描き、二人までを巻き込む。","descEn":"A flowing arc can catch two nearby targets.","entry":["close"],"exit":["rhythm"],"connection":{"reach":0.3,"tracking":0.6},"family":"unexpected","names":{"ja":"流れ枝","en":"Drifting Bough"},"descriptions":{"ja":"大きく弧を描き、二人までを巻き込む。","en":"A flowing arc can catch two nearby targets."}},{"key":"bl.skill.unexpected.close","tags":["explore","rest","cross"],"requiresExperience":[["explore","track"],["rest","patience","pray"]],"color":"#9eb4a8","rarity":0.5,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":20,"fatigue":0.7,"charge":0.52,"swing":0.4,"recovery":1.1,"reach":2.15,"arc":1.6,"power":1.55,"hits":1,"anim":"slam","school":"life","requires":["rightArm"],"weapon":-1,"breakPower":2.8},"id":60112,"phase":2,"ja":"夕凪返し","en":"Evening Stillness","desc":"静かに強く打ち下ろす。外すと戻りが遅い。","descEn":"A calm heavy fall lands hard but recovers slowly after a miss.","entry":["rhythm"],"exit":["offbalance"],"connection":{"cost":0.78,"recovery":0.8},"family":"unexpected","names":{"ja":"夕凪返し","en":"Evening Stillness"},"descriptions":{"ja":"静かに強く打ち下ろす。外すと戻りが遅い。","en":"A calm heavy fall lands hard but recovers slowly after a miss."}},{"key":"bl.skill.knot.opening","tags":["net","care","precision"],"requiresExperience":[["net"],["care","track","combat"]],"color":"#a5c9bb","rarity":0.65,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":9,"fatigue":0.6,"charge":0.27,"swing":0.4,"recovery":0.55,"reach":1.85,"arc":1.4,"power":0.45,"hits":1,"anim":"thrust","school":"life","requires":["rightArm"],"weapon":-1,"status":"slow","duration":1.4},"id":60120,"phase":0,"ja":"糸口","en":"Loose End","desc":"短く差し込み、結び目のように相手の足を迷わせる。","descEn":"A short thrust tangles the opponent's footing.","entry":[],"exit":["close"],"family":"knot","names":{"ja":"糸口","en":"Loose End"},"descriptions":{"ja":"短く差し込み、結び目のように相手の足を迷わせる。","en":"A short thrust tangles the opponent's footing."}},{"key":"bl.skill.knot.turn","tags":["net","care","precision"],"requiresExperience":[["net"],["care","track","combat"]],"color":"#a5c9bb","rarity":0.65,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":12,"fatigue":0.6,"charge":0.27,"swing":0.4,"recovery":0.55,"reach":1.65,"arc":1.4,"power":0.3,"hits":1,"anim":"kick","school":"life","requires":["rightLeg"],"weapon":-1,"breakPower":1.4},"id":60121,"phase":1,"ja":"絡め返し","en":"Knot Turn","desc":"近づいた相手の足元を払う。遠い相手は拾えない。","descEn":"Sweep a nearby opponent's footing; cannot catch a distant target.","entry":["close"],"exit":["offbalance"],"connection":{"breakPower":0.35,"recovery":0.72},"family":"knot","names":{"ja":"絡め返し","en":"Knot Turn"},"descriptions":{"ja":"近づいた相手の足元を払う。遠い相手は拾えない。","en":"Sweep a nearby opponent's footing; cannot catch a distant target."}},{"key":"bl.skill.knot.close","tags":["net","care","precision"],"requiresExperience":[["net"],["care","track","combat"]],"color":"#a5c9bb","rarity":0.65,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":11,"fatigue":0.6,"charge":0.27,"swing":0.4,"recovery":0.65,"reach":1.85,"arc":1.4,"power":0.55,"hits":1,"anim":"slash","school":"life","requires":["rightArm"],"weapon":-1,"knockback":0.55},"id":60122,"phase":2,"ja":"結び解き","en":"Untying","desc":"崩れを拾って押し離す。結末を、次の間合いに変える。","descEn":"Catch an imbalance and push away, making space for the next exchange.","entry":["offbalance"],"exit":["rhythm"],"connection":{"knockback":0.4,"cost":0.82},"family":"knot","names":{"ja":"結び解き","en":"Untying"},"descriptions":{"ja":"崩れを拾って押し離す。結末を、次の間合いに変える。","en":"Catch an imbalance and push away, making space for the next exchange."}},{"key":"bl.skill.rescue_call.opening","tags":["combat","tension","patience"],"requiresExperience":[["combat","tension"]],"color":"#e8c983","rarity":1,"inheritance":{"bias":0.22,"copy":false},"action":{"cost":12,"fatigue":1,"charge":0.35,"swing":0.45,"recovery":0.7,"reach":0,"arc":6.28,"power":0,"hits":1,"anim":"counter","step":0,"school":"life","requires":[],"weapon":-1,"lure":true},"id":60390,"phase":0,"ja":"引き受けの声","en":"Rallying Call","desc":"対峙相手のいない近くの敵をひとり引き受ける。味方を横から狙う敵を優先。呼び声はしばらく届き、続けては使えない。","descEn":"Draw one nearby unengaged foe toward you, prioritizing free attackers threatening an ally. The call fades and needs time to renew.","entry":[],"exit":[],"family":"rescue_call","names":{"ja":"引き受けの声","en":"Rallying Call"},"descriptions":{"ja":"対峙相手のいない近くの敵をひとり引き受ける。味方を横から狙う敵を優先。呼び声はしばらく届き、続けては使えない。","en":"Draw one nearby unengaged foe toward you, prioritizing free attackers threatening an ally. The call fades and needs time to renew."}},{"id":60900,"key":"bl.skill.hearth_breath","ja":"炉辺の息","en":"Hearth Breath","desc":"仕事の合間に覚えた呼吸。自然に息が戻りやすい。","descEn":"A working rhythm helps breath return naturally.","tags":["craft","rest","patience"],"requiresExperience":[["craft"],["rest","patience"]],"effect":"regen","value":0.45,"action":{},"color":"#c7c09b","inheritance":{"bias":0.16,"copy":false},"family":"hearth_breath","phase":0,"passive":true,"entry":[],"exit":[],"names":{"ja":"炉辺の息","en":"Hearth Breath"},"descriptions":{"ja":"仕事の合間に覚えた呼吸。自然に息が戻りやすい。","en":"A working rhythm helps breath return naturally."},"rarity":0.8},{"id":60901,"key":"bl.skill.quiet_capacity","ja":"静穏の余白","en":"Quiet Reserve","desc":"落ち着いた暮らしが、疲れた息の上限を少し戻す。","descEn":"Quiet habits help recover a little exhausted stamina capacity.","tags":["pray","rest","patience"],"requiresExperience":[["pray","rest"],["patience"]],"effect":"capRegen","value":0.1,"action":{},"color":"#c7c09b","inheritance":{"bias":0.16,"copy":false},"family":"quiet_capacity","phase":0,"passive":true,"entry":[],"exit":[],"names":{"ja":"静穏の余白","en":"Quiet Reserve"},"descriptions":{"ja":"落ち着いた暮らしが、疲れた息の上限を少し戻す。","en":"Quiet habits help recover a little exhausted stamina capacity."},"rarity":0.8},{"id":60902,"key":"bl.skill.weight_memory","ja":"重みの記憶","en":"Remembered Weight","desc":"経験した押し合いに、少しだけ踏みとどまる。","descEn":"Remembered contests give a small advantage in a clash.","tags":["combat","weight"],"requiresExperience":[["combat"],["weight"]],"effect":"clash","value":0.06,"action":{},"color":"#c7c09b","inheritance":{"bias":0.16,"copy":false},"family":"weight_memory","phase":0,"passive":true,"entry":[],"exit":[],"names":{"ja":"重みの記憶","en":"Remembered Weight"},"descriptions":{"ja":"経験した押し合いに、少しだけ踏みとどまる。","en":"Remembered contests give a small advantage in a clash."},"rarity":0.8},{"id":60903,"key":"bl.skill.work_economy","ja":"手仕事の無駄なし","en":"Economy of Labor","desc":"重い技を扱うとき、少しだけ息を節約する。","descEn":"Spend slightly less breath on heavy techniques.","tags":["craft","care","weight"],"requiresExperience":[["craft"],["care","weight"]],"effect":"heavyCost","value":0.07,"action":{},"color":"#c7c09b","inheritance":{"bias":0.16,"copy":false},"family":"work_economy","phase":0,"passive":true,"entry":[],"exit":[],"names":{"ja":"手仕事の無駄なし","en":"Economy of Labor"},"descriptions":{"ja":"重い技を扱うとき、少しだけ息を節約する。","en":"Spend slightly less breath on heavy techniques."},"rarity":0.8},{"id":60904,"key":"bl.skill.deep_faith","ja":"篤い信仰","en":"Deep Devotion","desc":"祈りを重ね、心に灯を宿す。奇跡を受け入れ、その祈りが少し届きやすくなる。","descEn":"Repeated prayer kindles devotion. Open your heart to miracles and make them a little more likely to answer.","tags":["pray","patience"],"requiresExperience":[["pray"]],"effect":"faith","value":2,"action":{"school":"church"},"color":"#dec78e","inheritance":{"bias":0.16,"copy":false},"family":"deep_faith","phase":0,"passive":true,"entry":[],"exit":[],"names":{"ja":"篤い信仰","en":"Deep Devotion"},"descriptions":{"ja":"祈りを重ね、心に灯を宿す。奇跡を受け入れ、その祈りが少し届きやすくなる。","en":"Repeated prayer kindles devotion. Open your heart to miracles and make them a little more likely to answer."},"rarity":0.8},{"id":60905,"key":"bl.skill.nimble_vault","ja":"身軽な乗り越え","en":"Nimble Vault","desc":"探索とよじ登りで身につけた身軽さ。低い柵や石垣を素早く飛び越える。高台は手を使って登る。","descEn":"Agility learned by exploring and climbing. Vault low fences and walls quickly; climb raised ledges with your hands.","tags":["explore","light"],"requiresExperience":[["explore"],["light"]],"effect":"vault","value":1,"action":{"requires":["leftArm","rightArm","leftLeg","rightLeg"]},"color":"#b9cda5","inheritance":{"bias":0.16,"copy":false},"family":"nimble_vault","phase":0,"passive":true,"entry":[],"exit":[],"names":{"ja":"身軽な乗り越え","en":"Nimble Vault"},"descriptions":{"ja":"探索とよじ登りで身につけた身軽さ。低い柵や石垣を素早く飛び越える。高台は手を使って登る。","en":"Agility learned by exploring and climbing. Vault low fences and walls quickly; climb raised ledges with your hands."},"rarity":0.8}];
BL_SKILL_DEFINITIONS.push(...SkillComposition.expand(BL_SKILL_DEFINITIONS));

/* Authored dialogue. Simulation consumes this data; it contains no DOM or timers. */
const ACTIVITY_DEFS = Object.freeze({
  shipPrayer:{id:'pray',label:'祈る',motion:'pray',verb:'旅の無事を祈る'},
  sword:{id:'study',label:'指南書を読む',motion:'study',verb:'武術の稽古'},
  magic:{id:'read',label:'魔術書を読む',motion:'read',verb:'書物をひらく'},
  church:{id:'pray',label:'祈る',motion:'pray',verb:'静かな祈り'},
  forge:{id:'observe',label:'仕事を見学する',motion:'observe',verb:'火と鉄を見つめる'},
  dance:{id:'play',label:'遊ぶ',motion:'play',verb:'広場で遊ぶ'},
  hunter:{id:'track',label:'足跡を学ぶ',motion:'track',verb:'野の知恵を学ぶ'},
  armory:{id:'care',label:'手入れをする',motion:'care',verb:'身支度を整える'}
});
const ACTIVITY_LINES = {
 shipPrayer:['潮風に、そっと願いを託した。','みんなで、無事に帰れますように。','波の音に合わせて、息を整える。','灯の向こうに、家族の顔を思い浮かべた。','帆を渡る風が、頬をなでた。','帰りを待つ人のために、祈った。'],
 study:['重心を、もう少し低く。','絵の足運びをなぞってみる。','踵を返すと、景色が回った。','力を抜いたほうが、速い。','相手の足を見る。','頁の端に、小さな書き込み。','倒れ方にも、作法がある。','踏み込む前に、息を吐く。','紙の上の達人を真似てみた。','一歩だけ、無駄が減った。','手ではなく、腰から動かす。','足を払う。その先を読む。','古い墨の匂いがした。','同じ構えを、もう一度。','受けた力を、横へ逃がす。','剣がなくても、身は守れる。'],
 read:['栞の先に、知らない文字。','頁が、ひとりでにめくれた。','指先で、術式をなぞる。','小石の重みに、意味がある。','火は、どこへ帰るのだろう。','銀の鈴と、古い挿絵。','読めなかった一行が読めた。','余白に、風の結び方。','栞をひとつ、先へ送る。','窓の光が文字を照らす。','ふたつの品を、並べて考える。','羽根が、かすかに震えた。','頁の奥で、灯がまたたく。','閉じた本にも、声がある。','黒い背表紙が気にかかる。','今はまだ、続きを読まない。'],
 pray:['鐘の余韻に、息を重ねる。','小さな願いを、胸に置く。','誰かの無事を祈った。','蝋燭の火が、ふっと揺れた。','答えはない。それでも祈る。','冷たい石に、膝をつく。','名前を呼ぶように、祈った。','風が聖堂を通り抜ける。','焦る心が、静まっていく。','今日の無事を、ありがとう。','届くかどうかは、神さま次第。','指の隙間に、光が落ちる。','小さな鈴が、ひとつ鳴った。','帰ってくる場所を思い出す。','言葉にならない願いもある。','胸の奥に、灯がともる。'],
 observe:['槌の音に、耳を澄ます。','赤い鉄が、白く光った。','一打ごとに、形が変わる。','握り方を、そっと真似た。','打つ前の、静かな間。','火花が袖の前を飛んだ。','水桶から、湯気が立つ。','重さを、腕ではなく足で受ける。','刃の厚みを見比べる。','煤のついた図面を眺めた。','鉄が歌う音がする。','ひびの音は、少し高い。','待つことも、鍛冶のうち。','槌を振るう肩を覚えた。','布で刃を、ひと拭き。','炭の火が、静かに息をする。'],
 play:['敷石の継ぎ目を、跳び越える。','小石が、ころころ転がった。','葉っぱの舟を浮かべた。','影を追いかけて、ひと回り。','風に向かって、腕をひらく。','靴先で、輪を描いた。','落ち葉を、空へ放った。','片足立ち。もう少し。','どこまで跳べるだろう。','くるりと回って、着地。','木陰の涼しさが心地よい。','花びらが、手のひらに乗った。','遊びの中で、足が覚える。','もう一度だけ、遠くへ。','噴水に、小さな虹。','息が弾んで、笑ってしまう。'],
 track:['土に残った足跡をなぞる。','折れた枝は、まだ新しい。','草の倒れ方を見比べる。','音を立てず、一歩。','風下の匂いを覚える。','羽根の落ちた先を見る。','苔の湿りを、指で確かめる。','獣と人では、歩幅が違う。','遠くの物音に耳を向ける。','石を避けて、足を置く。','帰り道の目印を探す。','枝の影が、道を教える。','足元から、景色を読む。','焦らなければ、見えてくる。'],
 care:['布のほつれを、結び直す。','小物をふたつ、並べてみる。','留め具を、ひとつ確かめる。','手に馴染む重さを探す。','盾の縁を指でなぞった。','鞘の埃を、払い落とす。','革紐を、きゅっと締める。','持ち替えると、構えも変わる。','刃には、薄く油をひく。','手の届く場所にしまった。','古い傷にも、持ち主の癖。','身軽さも、大切な備え。','次の旅へ、少しずつ。','布の襟を、整えた。']
};
const MOTHER_LINES = {
 cradle:[
  '生まれてきてくれて、ありがとう。',
  'ぎゅっ。あったかいね。',
  '行きたいほうへ、指を動かしてごらん。',
  'さっと指を払うと、走っていけるよ。',
  '止まりたいときは、地面をちょん。',
  'あら、笑った。お母さんもうれしいな。',
  'ちょんと触って、ひと休みしようね。',
  '大好きだよ。一緒に見て回ろうね。'
 ],
 church:['あの扉の前で、お祈りできるよ。','元気に育ちますように。'],
 magic:['外の読書机で、魔術の本が読めるよ。','どんなお話が好きになるかな。'],
 sword:['道場の書見台で、技の本が読めるよ。','人形のそばでは、稽古ができるよ。'],
 forge:['金床の前で、お仕事を見せてもらおう。','熱いから、近づきすぎないでね。'],
 armory:['七つになったら、外の棚で武具を借りよう。','棚の前では、お手入れもできるよ。'],
 dance:['噴水の前に、おもちゃがあるよ。','ここで遊ぶと、足腰が強くなるよ。'],
 hunter:['小屋の前の足跡を、調べてみよう。','誰が歩いたのかな。一緒に見ようね。'],
 outside:['柵の外は危ないよ。お母さんと戻ろう。','敵が来たら、衛兵さんの後ろへ逃げてね。']
};
const GIFT_LINES = {
 stone:'すべすべだね。あなたにあげる。',
 bell:'かわいい音だね。大切にしてね。',
 feather:'ふわふわ。くすぐったいね。',
 charcoal:'真っ黒なおてて。一緒に洗おうね。',
 net:'何が見つかるかな。楽しみだね。'
};
const FAREWELL_LINES=[
 'わあ、立てたね！ ゆっくりでいいよ。',
 '疲れたら、地面を長く押して座ろうね。',
 'いってらっしゃい。大好きだよ。'
];
const GUARD_LINES = {
 young:['そこから先は危ないぞ。私の後ろへ！','小さな足で、よく来たな。無理はするなよ。','まだ背負うには重い戦いだ。村へお帰り。','怪我はないか？ 下がって息を整えろ。'],
 helper:['助太刀、感謝する！','その一打、見事だ。こちらは任せろ。','背中を預けるぞ。無理はせずにな。','いい間合いだ。息を切らすな！'],
 veteran:['頼もしい顔が来たな！','この戦列は、お前と守ろう。','その技を、次の者にも残してやれ。','助かった。さすがの腕だ。'],
 hurt:['深手だな。下がれ、私が受ける！','今は休め。戻る道は私が守る。','立てるか？ 無理をするな！']
};



const RESCUE_LINES={approach:'そこで待て。今、助けに行く！',lift:'つかまっていろ。村まで運ぶぞ。',arrival:'ここなら大丈夫だ。ゆっくり息を整えろ。'};

const MEDIC_LINES={approach:'大丈夫、いま助けに行きます！',lift:'もう一人にしません。治療所まで運びますね。',arrival:'ここは安全です。ゆっくり息をしてください。'};


/* Shared, renderer-independent simulation. All gameplay decisions stay here. */
const VERSION = '0.6.0';
const GAME_TITLE='血脈の系譜';
const EQUIP_AGE=7;
const MAX_ITEMS=2;
// Approved damage-feedback follow-up: 3–4 clean ordinary hits are dangerous.
// Armor, resistance, wound escalation and the existing death rules still apply.
const PLAYER_WOUND_DAMAGE=Object.freeze({light:30,heavy:46,lost:56});
const MAX_PHASE_SKILLS=5;
const DASH={speed:1.72,cost:9,start:3};
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a,b) => Math.hypot(a.x-b.x, a.z-b.z);
const angleDiff = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
function random(seed = 1) { let s=seed>>>0; const next=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};next.getState=()=>s;next.setState=value=>{s=value>>>0;};return next; }
function cleanText(s, max=18) { return String(s??'').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,max); }
const RACES = [
 {id:'human',name:'人族',tone:'#ecc5a4',color:'#65866c',desc:'柔らかな髪。旅を継ぐ人々。'},
 {id:'elf',name:'森人',tone:'#dfcaa8',color:'#709984',desc:'長い耳。細身の森の民。'},
 {id:'dwarf',name:'山人',tone:'#d8a080',color:'#b98954',desc:'小さく頑丈。豊かな髪と髭。'},
 {id:'fox',name:'狐人',tone:'#e5b388',color:'#bf7a53',desc:'獣の耳と、大きな尾。'}
];
const GENDERS = ['男性','女性','中性'];
const WEAPONS = [
 {id:'sword',name:'片手剣',reach:2.55,arc:1.9,power:2,weight:3,cd:.57},
 {id:'dagger',name:'短剣',reach:1.7,arc:2.05,power:3,weight:1,cd:.39},
 {id:'greatsword',name:'大剣',reach:2.9,arc:2.25,power:2,weight:7,cd:.92},
 {id:'spear',name:'槍',reach:4.15,arc:.95,power:1,weight:4,cd:.72},
 {id:'axe',name:'戦斧',reach:2.2,arc:2.15,power:3,weight:6,cd:.81},
 {id:'staff',name:'杖',reach:2.0,arc:1.2,power:1,weight:2,cd:.86}
];
const ARMORS = [{id:'cloth',name:'布の服',weight:0},{id:'medium',name:'軽鎧',weight:4},{id:'heavy',name:'重鎧',weight:7}];
const SKINS = [
 {id:'hearth',name:'炉辺の旅人',color:'#d9ad65',metal:'#dedccf',cloak:'#587d6c'},
 {id:'moon',name:'月白の騎士',color:'#8ebec6',metal:'#d6e5e5',cloak:'#667995'},
 {id:'ember',name:'残火の誓い',color:'#d58667',metal:'#c9aca0',cloak:'#a1584b'},
 {id:'forest',name:'常緑の守り',color:'#a9bb72',metal:'#d7d3a6',cloak:'#446858'}
];
const SCHOOLS = [
 {id:'sword',name:'武術道場',short:'武術道場',x:-6.5,z:17.7,r:5,color:'#c8b18b'},
 {id:'magic',name:'木洩れ日の図書館',short:'図書館',x:-12,z:-6,r:5,color:'#a8bcba'},
 {id:'church',name:'灯守の教会',short:'教会',x:-3,z:-10,r:5,color:'#e4d591'},
 {id:'armory',name:'村の武具棚',short:'武器庫',x:10,z:7,r:5,color:'#9fadb9'},
 {id:'hunter',name:'森番の小屋',short:'森番小屋',x:-13,z:18,r:4.5,color:'#aed1a1'},
 {id:'forge',name:'鍛冶場',short:'鍛冶場',x:9,z:-6,r:5,color:'#cf9371'},
 {id:'dance',name:'風待ちの広場',short:'広場',x:0,z:12,r:4.5,color:'#c5cfa2'}
];
// Equipment coordinates are shared by drawing, proximity UI and server authority.
// z grows towards the front of each village building, including mirrored villages.
function facilityStation(s){
 const offsets={sword:[Math.sign(s.x)*1.65,.85,'書見台'],magic:[.8,.9,'読書机'],church:[0,.36,'教会の扉'],armory:[-2.18,1.3,'武具棚'],forge:[-.6,-.58,'金床'],hunter:[0,1.3,'足跡'],dance:[0,2.3,'遊び場'],shipPrayer:[0,-.55,'船の祈り台']};
 const o=offsets[s?.id];return o?{id:s.id,x:s.x+o[0],z:s.z+o[1],name:o[2]}:null;
}
function atFacilityStation(p,s){
 const a=facilityStation(s);if(!a)return false;
 const dz=p.z-a.z;
 return Math.abs(p.x-a.x)<=1.15&&dz>=.35&&dz<=2.15;
}
function nearbyActivity(p,room){
 if(room?.kind!=='village')return null;
 if(room.map.ship&&onShipDeck(p)&&atFacilityStation(p,room.map.ship.shrine))return room.map.ship.shrine;
 return room.map.schools.find(s=>atFacilityStation(p,s));
}
function motherTopic(p,room){
 if(p.z<-26)return 'outside';
 const stations=(room?.map?.schools||[]).map(facilityStation).filter(Boolean);
 return stations.filter(a=>p.z>=a.z+.15&&dist(p,a)<4).sort((a,b)=>dist(p,a)-dist(p,b))[0]?.id||'cradle';
}
const FORMS = [
 {name:'一閃',trigger:'attack',arc:1,reach:1,speed:1},
 {name:'旋回',trigger:'attack',arc:2.3,reach:.85,speed:.93},
 {name:'穿ち',trigger:'attack',arc:.65,reach:1.45,speed:.96},
 {name:'連牙',trigger:'attack',arc:1.15,reach:1,speed:1.4},
 {name:'返し',trigger:'guard',arc:1.15,reach:1.05,speed:1.1},
 {name:'踏み込み',trigger:'attack',arc:1.3,reach:1.2,speed:1.2},
 {name:'崩し',trigger:'attack',arc:1.1,reach:.85,speed:.8},
 {name:'円環',trigger:'attack',arc:3.3,reach:.9,speed:.86}
];
const ELEMENTS = ['白樺','星灯','蒼風','残火','霧雨','月影','鉄樹','暁光'];
const EXPRESSIONS = ['鋭','流','迅','重','静','連','守','翔'];
const EFFECT_NAMES = ['貫通','押し返し','早業','武装崩し','受け流し','追撃','守勢','踏み込み'];
const BODY_PARTS = ['head','torso','rightArm','leftArm','rightLeg','leftLeg'];
const BODY_NAMES = {head:'頭部',torso:'胴体',rightArm:'右腕',leftArm:'左腕',rightLeg:'右脚',leftLeg:'左脚'};
const WOUND_NAMES = {light:'軽傷',heavy:'重傷',lost:'欠損'};
const STAMINA = Object.freeze({max:100,minCap:22,regen:14,capRegen:.2,delay:.55,capDelay:6,fatiguePerCost:.18,seatedRegen:32,seatedCapRegen:8});
const REST_HEALING = Object.freeze({quiet:12,healthRegen:3.6,woundRate:4});
const PASSIVES = [
 {id:3072,name:'炉辺の呼吸',school:'village',deed:'村で落ち着いて過ごす',need:35,effect:'regen',value:3,desc:'スタミナの自然回復を小さく高める。'},
 {id:3073,name:'剣士の手ほどき',school:'sword',deed:'剣術学校で訓練する',need:10,effect:'attackCost',value:.2,desc:'通常攻撃のスタミナ消費を小さく軽減する。'},
 {id:3074,name:'静謐の祈り',school:'church',deed:'教会で歩みを止め、祈る',need:25,effect:'capRegen',value:.35,desc:'疲労したスタミナ上限の回復を小さく高める。'},
 {id:3075,name:'狩人の足運び',school:'hunter',deed:'狩人の小屋の周囲を歩く',need:28,effect:'walk',value:.10,desc:'歩行速度を小さく高める。欠損した脚は回復しない。'},
 {id:3076,name:'鍛冶師の構え',school:'forge',deed:'鍛冶場で武具を構える',need:20,effect:'guardCost',value:.25,desc:'ガードで受けた時のスタミナ消費を小さく軽減する。'},
 {id:3077,name:'風舞いの呼吸',school:'dance',deed:'風舞いの庭で歩く',need:30,effect:'skillFatigue',value:.2,desc:'技によるスタミナ上限の減少を小さく軽減する。'},
 {id:3078,name:'術式の記憶',school:'magic',deed:'魔術学校で訓練する',need:10,effect:'charge',value:.12,desc:'技の溜め時間を小さく短縮する。'},
 {id:3079,name:'受けの心得',school:'front',deed:'敵の攻撃をガードで受ける',need:8,effect:'parry',value:.15,desc:'正面ガードで無傷の受け流しが少し発生しやすくなる。'}
];
function passiveValue(p,effect){return (p.passives||[]).reduce((n,id)=>n+(PASSIVES.find(s=>s.id===id&&s.effect===effect)?.value||0),0);}
function injuryModifiers(p){
 const out={move:1,attack:1,guard:true,cast:1,cap:100};
 for(const [part,w] of Object.entries(p.wounds||{})){
  if(!w)continue;const heavy=w.severity==='heavy',lost=w.severity==='lost';
  if(part.endsWith('Leg'))out.move*=lost?.48:heavy?.7:.92;
  if(part.endsWith('Arm'))out.attack*=lost?.5:heavy?.78:.95;
  if(part==='leftArm'&&lost)out.guard=false;
  if(part==='head')out.cast*=heavy?1.4:1.1;
  if(part==='torso')out.cap-=heavy?15:5;
 }
 return out;
}
// User-approved enemy readability rules. Existing limb injury multipliers stay
// authoritative; HP adds fatigue and post-strike recovery, never damage scaling.
function enemyCondition(p){
 const enabled=!!ENEMY_FORMS[p?.kind],lost=part=>enabled&&p.wounds?.[part]?.severity==='lost';
 const hp=Number.isFinite(p?.hp)&&Number.isFinite(p?.hpMax)&&p.hpMax>0?clamp(p.hp/p.hpMax,0,1):1;
 const fatigue=enabled?clamp((.70-hp)/.45,0,1):0;
 const rightLeg=lost('rightLeg'),leftLeg=lost('leftLeg'),rightArm=lost('rightArm'),leftArm=lost('leftArm');
 const legs=Number(rightLeg)+Number(leftLeg),arms=Number(rightArm)+Number(leftArm);
 const family=['soldier','elite','goblin','boss','mushroom'].includes(p?.kind)?'biped':['maw','stag'].includes(p?.kind)?'beast':p?.kind==='crawler'?'insect':'spirit';
 return {enabled,hp,fatigue,critical:enabled&&hp<=.25,rightLeg,leftLeg,rightArm,leftArm,legs,arms,family,
  crawl:enabled&&family==='biped'&&legs===2,drag:enabled&&family==='beast'&&(legs===2||arms===2),
  move:1-fatigue*.16,recovery:enabled?fatigue*.55+(legs===2?.40:legs*.16)+arms*.10:0};
}
function skillRestriction(p,sk){
 if(!sk||sk.passive)return '';
 const lost=part=>p.wounds?.[part]?.severity==='lost';
 if(p.statuses?.sleep?.until>(p.statusClock||0))return '眠り';
 if(sk.lure&&(p.lureReadyAt||0)>(p.statusClock||0))return '呼び声を整えている';
 if(sk.school==='shield'&&!p.shield)return '盾が必要';
 if(sk.weapon>=0&&sk.weapon!==p.weapon)return '異なる武器の技';
 for(const part of sk.requires||[]){if(lost(part))return BODY_NAMES[part]+'を失っているため使えない';}
 if(sk.magic&&p.wounds?.head?.severity==='heavy')return '頭の重傷で集中できない';
 if(sk.resource&&((p.ammo||{})[sk.resource]||0)<(sk.amount||1))return '残数が足りない';
 if(sk.item&&!(p.inventory||[]).includes(sk.item))return '小物が必要';
 if(sk.items&&!sk.items.every(item=>(p.inventory||[]).includes(item)))return '小物の組み合わせが違う';
 if(sk.requiresPassive&&!p.passives?.includes(sk.requiresPassive)&&!(sk.requiresPassive===4061&&effectsOf(p,'faith')>0))return 'まだ理を知らない';
 if((p.skillReady?.[sk.id]||0)>(p.age+p.ageFraction))return '今は使えない';
 return '';
}
function legacySkillById(id) {
 if(id===null||id===''||id===undefined||!Number.isInteger(+id)||id<0||id>=3080)return null;
 id=+id;if(id>=3072){const p=PASSIVES[id-3072];return {...p,passive:true,trigger:'passive',color:'#a8cba8',weapon:-1,charge:0,cost:0,fatigue:0,requirements:[],motion:'常時効果'};}
 const w=Math.floor(id/512),f=Math.floor(id/64)%8,e=Math.floor(id/8)%8,v=id%8,form=FORMS[f],weapon=WEAPONS[w];
 const charge=[.12,.55,.72,0,.35,.48,1.25,1.55][f]+(v===3?.2:0);
 const cost=[24,32,29,23,26,28,37,43][f]+(w===2?3:0);
 return {id,passive:false,weapon:w,form:f,element:e,variant:v,name:`${ELEMENTS[e]}・${form.name}［${EXPRESSIONS[v]}］`,
  trigger:'skill',school:['sword','magic','dance','forge','church','hunter','church','dance'][v],affinity:e,gender:(f+v)%3,weight:(v%4)*2+1,
  chance:1,charge,cost,fatigue:[8,11,10,9,9,10,13,15][f],recovery:[.55,.75,.65,.6,.55,.6,.95,1.1][f]/(form.speed*(v===2?1.2:1)*[1,.98,1.12,.93,1.05,1.08,.9,1.02][e]),
  reach:form.reach*(1+(v===7?.12:0))*[1,1.03,1.06,.94,1.04,.98,.93,1.01][e],arc:form.arc,
  speed:form.speed*(v===2?1.2:1)*[1,.98,1.12,.93,1.05,1.08,.9,1.02][e],power:(f===6?3:1)+(v===3?1:0),effect:v,
  motion:['横一閃','回転斬り','突き上げ','三連撃','受け返し','踏み込み斬り','振り下ろし','円環放射'][f],
  desc:`${weapon.name} / ${['横一閃','回転斬り','長射程の突き','三連撃','守りから反撃','一歩踏み込んで斬る','重い振り下ろし','周囲へ円環を放つ'][f]}。${EFFECT_NAMES[v]}。`,
  color:['#ded397','#e8ce95','#86d0ce','#e99d70','#9cbad8','#baa7df','#c2cca6','#f4dba4'][e]};
}
// A walk-in aid station beside the inner gate; the central passage stays clear.
const GATE_CLINIC=Object.freeze({x:8,z:-23,r:3,beds:[{x:7,z:-23},{x:9,z:-23}],staff:[{x:6,z:-21},{x:10,z:-21}],recovery:6,woundRate:24});
function atClinic(p,r){return r?.kind==='village'&&!!r.map?.clinic&&dist(p,r.map.clinic)<r.map.clinic.r;}
function combatMaturity(p){return p?.kind==='player'?clamp(.18+((p.age||0)+(p.ageFraction||0)-4)*.82/11,.12,1):1;}
function outmatchedChild(p,e){return p?.kind==='player'&&p.age<7&&(e.elite||e.kind==='boss');}
// The same footprint drives collision, support, boarding, activities and art.
// The gangway rises continuously; the ship has no interior or climbable rails.
const VILLAGE_SHIP=Object.freeze({deckY:1.2,stern:34,bow:56,gangwayStart:29.5,gangwayHalf:1.5,
 shrine:{id:'shipPrayer',x:-3.4,z:38.5,r:1.75},
 dummies:[{x:3.5,z:39},{x:3.5,z:43.5},{x:3.5,z:48}],
 masts:[{x:0,z:40},{x:0,z:49}],
 obstacles:[{x:0,z:40,r:.28},{x:0,z:49,r:.28},{x:-3.4,z:37.95,r:.65},{x:-4.8,z:47,r:.72},{x:4.8,z:47,r:.72}]});
function shipHalfWidth(z){return z<38?4.8+(z-34)*.3:z<50?6:6-(z-50)*.65;}
function onShipDeck(p,margin=0){return p.z>=VILLAGE_SHIP.stern+margin&&p.z<=VILLAGE_SHIP.bow-margin&&Math.abs(p.x)<=shipHalfWidth(p.z)-margin;}
function villageActivityAt(map,p){return map?.ship&&onShipDeck(p)&&atFacilityStation(p,map.ship.shrine)?map.ship.shrine:map?.schools.find(s=>dist(p,s)<s.r);}
function shipSupport(x,z){
 if(onShipDeck({x,z}))return VILLAGE_SHIP.deckY;
 if(z>=28.5&&z<29.5&&Math.abs(x)<=VILLAGE_SHIP.gangwayHalf)return (z-28.5)*.275;
 if(z>=VILLAGE_SHIP.gangwayStart&&z<34&&Math.abs(x)<=VILLAGE_SHIP.gangwayHalf)return .275+(z-29.5)/4.5*(VILLAGE_SHIP.deckY-.275);
 return 0;
}
function makeVillage(seed=1,terrainRevision=1,shipRevision=1) {
 const rng=random(seed),houses=[];
 // Two compact residential crescents: exactly 30 independent clan plots.
 for(let side of [-1,1])for(let i=0;i<15;i++) {
  const row=Math.floor(i/5),col=i%5;
  houses.push({id:houses.length,x:side*(18+row*6)+(rng()-.5)*.45,z:-22+col*6.5+(rng()-.5)*.4,rotation:side<0?Math.PI/2:-Math.PI/2,
   roof:Math.floor(rng()*4),scale:.86+rng()*.22});
 }
 const mirror=rng()<.5?-1:1;
 const traversables=[];for(let x=-32;x<32;x+=4)if(Math.abs(x)>=6)traversables.push({id:'fence:'+x,kind:'vault',x,z:-28,width:3.7,depth:.24,height:1.18,gripHeight:.985});
 // Walkable landings and retaining walls share their exact footprint with art.
 for(let i=0;i<3;i++)traversables.push({id:'terrace:'+i,kind:'step',x:-9*mirror,z:12.8-i*1.5,width:3.4,depth:1.5,height:.3*(i+1)});
 if(terrainRevision>=1){
 traversables[traversables.length-1].width=6.4;
 const stair=(id,x,z,base,count)=>{for(let i=0;i<count;i++)traversables.push({id:id+':'+i,kind:'step',stair:true,x:(x-(i+.5)*.3)*mirror,z,width:.3,depth:1.8,height:base+(i+1)*.1});};
 stair('terrace:walk',-3.1,9.8,0,9);
 traversables.push({id:'north:lower',kind:'step',terrace:true,x:-10.5*mirror,z:-15.2,width:8,depth:5.6,height:.6});
 traversables.push({id:'north:upper',kind:'step',terrace:true,x:-11.5*mirror,z:-15.2,width:3.6,depth:3.2,height:1.2});
 stair('north:walk-low',-4.7,-15.2,0,6);stair('north:walk-high',-7.9,-15.2,.6,6);
 traversables.push({id:'green:wall',kind:'vault',stone:true,x:9*mirror,z:16,width:5,depth:.34,height:1.05});
 }
 return {seed,terrainRevision,shipRevision:terrainRevision>=1?shipRevision:0,houses,traversables,clinic:GATE_CLINIC,ship:terrainRevision>=1&&shipRevision>=1?VILLAGE_SHIP:undefined,schools:SCHOOLS.map(x=>({...x,x:x.x*mirror,z:x.z+(x.id==='church'?0:(rng()-.5)*1.2)})),port:{x:0,z:28},gate:{x:0,z:-29}};
}
function supportHeight(map,x,z){return (map?.traversables||[]).reduce((y,o)=>o.kind==='step'&&Math.abs(x-o.x)<=o.width/2&&Math.abs(z-o.z)<=o.depth/2?Math.max(y,o.height):y,map?.ship?shipSupport(x,z):0);}
function stairAt(map,x,z){return (map?.traversables||[]).some(o=>o.stair&&Math.abs(x-o.x)<=o.width/2+.001&&Math.abs(z-o.z)<=o.depth/2);}
function terrainFootprint(map,x,z,margin=0){return (map?.traversables||[]).some(o=>o.kind==='step'&&Math.abs(x-o.x)<=o.width/2+margin&&Math.abs(z-o.z)<=o.depth/2+margin);}
const TRAVERSAL_RULES=Object.freeze({maxVault:1.25,maxStep:.95,walkStep:.12,radius:.42,cooldown:.16});
// Shared normalized phases; older live snapshots keep their original trajectory.
function traversalFrame(a,u){
 const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);},from=a.from.supportHeight,to=a.to.supportHeight;
 if(a.profile!==1||a.kind==='vault'){const travel=ease(u);return {travel,floor:from+(to-from)*travel,lift:Math.sin(Math.PI*u)*(a.kind==='vault'?1.16:.26)};}
 // Reach, pull vertically, carry the feet across, then lower onto known support.
 const travel=ease((u-.34)/.48),floor=from+(to-from)*travel;
 const rise=ease((u-.10)/.24),lower=ease((u-.82)/.18),peak=a.obstacle?Math.max(from,to)+a.top*.48:a.top+.10;
 const height=from+(peak-from)*rise+(to-peak)*lower;
 return {travel,floor,lift:height-floor};
}

// Inner forecourt: clear of the reading stand and inside the existing
// dojo activity area and village shore boundary in either mirrored layout.
function villagePracticePosition(map){const dojo=map.schools.find(s=>s.id==='sword');return {x:dojo.x-(Math.sign(dojo.x)||1)*1.75,z:dojo.z+3};}
const ZONES = [
 {name:'白樺の渡り',sub:'THE BIRCH MARCH',ground:'#6c8970',tree:'#75946e'},
 {name:'霧鳴りの峡谷',sub:'THE HOLLOW WIND',ground:'#657f7d',tree:'#799b98'},
 {name:'忘れられた聖域',sub:'THE LOST SANCTUARY',ground:'#777e8b',tree:'#8c829e'},
 {name:'燠の戦場',sub:'THE EMBER FIELD',ground:'#826e60',tree:'#a37c67'},
 {name:'黒棘の城門',sub:'THE BLACKTHORN GATE',ground:'#676b78',tree:'#76708b'},
 {name:'魔王の玉座',sub:'THE LAST OATH',ground:'#655e70',tree:'#a38ca8'}
];
const C_NAMES=['フィン','リアン','エナ','セリ','ノア','リズ','オリン','ティア','ルゥ','ネリ','アイル','ロアン','シア','ニール','リーフ','イヴ'];
function weightedChoice(items, weights, rng) { let n=rng()*weights.reduce((a,b)=>a+b,0); for(let i=0;i<items.length;i++){if(weights[i]<=0)continue;n-=weights[i];if(n<0)return items[i];}return items.at(-1); }
function safeWeights(ids, raw) {const out={}; for(const id of ids)out[id]=clamp(Number.isFinite(+raw?.[id])?+raw[id]:1,0,100);if(!Object.values(out).some(v=>v>0))for(const id of ids)out[id]=1;return out;}

// Hand-authored tactical vocabulary. Internal numbers never appear in player-facing descriptions.
// Melee only. Fists use weapon = -1; no hidden ranged equipment.
// The archive and its forbidden arts are not available in this version.
const PHASES=['序','破','急'];
const PHASE_COLORS=['#60d8c0','#edbb58','#ef796a'];
const CORPSE_SECONDS=70;
const GESTURES=['tap','hold','flick'];
const GESTURE_NAMES={tap:'タップ',hold:'長押し',flick:'フリック'};
const STATUS_DEFS={stun:{name:'眩暈',color:'#f2d76e'},slow:{name:'鈍足',color:'#8dcced'},root:{name:'縛足',color:'#93b988'},burn:{name:'炎上',color:'#ed995c'},poison:{name:'毒',color:'#b4ca71'},sleep:{name:'眠り',color:'#bdaae4'},weak:{name:'脱力',color:'#b8a0d1'},bleed:{name:'出血',color:'#c88382'},blind:{name:'暗闇',color:'#79778d'}};
const hasStatus=(p,id,t)=>(p.statuses?.[id]?.until||0)>t;
const skillPhase=sk=>sk?.band??0;
// Player action tempo is shared by offline play, the server and the rehearsal.
// Resource costs, hit reactions, collision and enemy telegraphs are not sped up.
const ACTION_TUNING=Object.freeze({move:1.10,charge:1.55,swing:2.05,recovery:1.16,recoveryTail:.14,comboGrace:.24,buffer:.16,moveCharge:.32,moveCombo:.55,moveRecovery:.85});
function actionTiming(sk){return {charge:Math.max(.28,(sk.charge||0)*ACTION_TUNING.charge),swing:Math.max(.78,(sk.swing||.3)*ACTION_TUNING.swing),recovery:(sk.recovery||0)*ACTION_TUNING.recovery+ACTION_TUNING.recoveryTail};}
// Shared by simulation, procedural motion and baked-clip time warping.
function skillBeat(sk,u){const hits=sk.hits||1,cuts=sk.beatCuts;
 const index=cuts?Math.min(hits-1,Math.max(0,cuts.findIndex((v,i)=>i>0&&u<v)-1)):Math.min(hits-1,Math.floor(u*hits));
 const i=cuts&&u>=1?hits-1:index,start=cuts?cuts[i]:i/hits,end=cuts?cuts[i+1]:(i+1)/hits;
 return {index:i,beat:clamp((u-start)/(end-start),0,1),start,end};}
const ITEMS={stone:{name:'丸い小石',desc:'土の理を宿す。',icon:'stone'},net:{name:'結び糸の網',desc:'繋ぎ、絡める。',icon:'net'},bell:{name:'銀の鈴',desc:'祈りに澄む音。',icon:'bell'},charcoal:{name:'炭の欠片',desc:'火の記憶。',icon:'fire'},feather:{name:'渡り鳥の羽',desc:'風の道しるべ。',icon:'feather'}};
const staminaTier=sk=>!sk||sk.passive?0:sk.cost<=4?1:sk.cost<=7?2:sk.cost<=10?3:sk.cost<=14?4:5;
const book=new Map();
function art(id,name,opt={}){
 const s={id,name,weapon:-1,form:0,element:0,variant:0,trigger:'combo',school:'sword',color:'#dfc58b',cost:10,fatigue:1,charge:.22,swing:.30,recovery:.65,reach:2.0,arc:1.7,power:1,breakPower:0,targets:['torso'],requires:['rightArm'],motion:'打撃',desc:'隙を見つけて打つ。',flow:.08,chance:1,maxTargets:1,...opt};
 book.set(id,s);return s;
}
art(4000,'殴る',{unarmed:true,cost:6,fatigue:.25,charge:.13,swing:.26,reach:1.3,recovery:.5,flow:.18,requires:[],targets:['torso','head'],desc:'踏み込んで拳を打つ。'});
art(4001,'斬る',{weapon:0,cost:10,charge:.22,reach:2.55,targets:['rightArm','leftArm'],motion:'横斬り',desc:'腕を狙う基本の剣技。崩れた敵には深く入る。',flow:.22});
art(4002,'斬り裂く',{weapon:1,cost:9,charge:.10,swing:.23,reach:1.75,power:2,targets:['torso'],flow:.30,motion:'連ね斬り',desc:'懐で深く裂く。間合いは小、連携しやすさは大。'});
art(4003,'叩き斬る',{weapon:2,cost:19,fatigue:3,charge:.56,swing:.40,reach:2.95,power:2,targets:['torso','leftArm'],recovery:1.05,motion:'袈裟斬り',desc:'重い刃で叩き斬る。消費・威力・隙は大。'});
art(4004,'突く',{weapon:3,cost:12,charge:.28,reach:4.0,arc:.7,targets:['torso'],flow:.17,form:2,motion:'突き',desc:'長い間合いから胴を狙う。威力は小。'});
art(4005,'叩く',{weapon:4,cost:16,charge:.4,reach:2.25,power:2,targets:['leftArm','rightArm'],recovery:.85,motion:'叩き割り',desc:'近い間合いで腕を叩く。消費と隙は中。'});
art(4006,'杖で打つ',{weapon:5,cost:9,charge:.27,reach:2.5,targets:['rightLeg','leftLeg'],desc:'魔力を使わず脚を狙う。威力は小。'});
art(4007,'射る',{weapon:6,cost:17,fatigue:2,charge:.85,swing:.25,reach:14,arc:.7,power:3,resource:'arrows',requires:['rightArm','leftArm'],targets:['torso'],ranged:true,form:2,motion:'弓を引く',color:'#b4d3a0',desc:'長い間合いから強い矢を放つ。矢を使い切ると射てない。'});
art(4010,'足払い',{cost:15,fatigue:2,charge:.64,swing:.28,reach:1.45,arc:1.3,targets:['leftLeg','rightLeg'],requires:['rightLeg','leftLeg'],breakPower:1.7,humanoidOnly:true,power:0,form:1,motion:'低い足払い',desc:'人型だけの体勢を崩す。間合いは小、溜めと隙は大。指南所で学べる。',recovery:.85});
art(4011,'じりじりと下がる',{cost:5,fatigue:0,charge:0,swing:.65,reach:0,requires:[],retreat:1.35,flow:.06,motion:'構えたまま後退',desc:'敵に正面を向けたままゆっくり退く。無敵にはならない。'});
art(4012,'バックステップ',{cost:30,fatigue:7,charge:.12,swing:.3,reach:0,requires:['leftLeg','rightLeg'],retreat:3.7,recovery:.8,motion:'後方への跳躍',desc:'素早く間合いを離す。消費は大。無敵にはならない。'});
art(4013,'迎え撃つ',{cost:15,fatigue:2,charge:.23,swing:.55,reach:0,counter:true,requires:['leftArm'],form:4,motion:'受けの構え',desc:'受け流しや反撃に備える。成功率は低め。意識と前後の技が結果に影響する。'});
art(4014,'先制攻撃',{cost:18,fatigue:3,charge:.05,swing:.28,reach:2.4,power:2,recovery:1.15,reckless:true,flow:.12,motion:'前へ打ち込む',desc:'相手の反撃を顧みず踏み込む。発生は速いが、反撃を受ける危険は大。'});
art(4015,'柄で崩す',{cost:18,fatigue:3,charge:.30,reach:1.8,power:0,breakPower:2.5,targets:['torso'],requires:['rightArm'],motion:'柄を押し込む',desc:'武器の柄で体勢を崩す。人型以外にも有効だが、巨大な敵には届きにくい。'});
art(4016,'巻き落とし',{weapon:0,cost:21,fatigue:4,charge:.40,reach:2.5,power:1,breakPower:2.3,targets:['rightArm'],motion:'刃を巻き落とす',desc:'敵の刃を絡め、腕と体勢を狙う。受けの後につながりやすい。',flow:.32});
art(4017,'唐竹割り',{weapon:4,cost:36,fatigue:11,charge:.95,swing:.5,reach:2.45,power:4,targets:['head'],recovery:1.65,requires:['rightArm','leftArm'],form:6,motion:'頭上から振り下ろす',desc:'頭部を叩き割る大技。消費と技後の隙は大。体勢を崩してから使う。'});
art(4018,'薙ぎ払う',{cost:29,fatigue:7,charge:.65,swing:.44,reach:2.8,arc:5.0,maxTargets:4,power:1,breakPower:1.1,targets:['leftArm','rightArm'],form:1,motion:'大きな横薙ぎ',desc:'周囲の敵をまとめて押し返す。多勢を倒し切るより、離脱の道を作る。',recovery:1.05});
art(4019,'脚を断つ',{weapon:1,cost:25,fatigue:6,charge:.44,reach:1.85,power:3,targets:['leftLeg','rightLeg'],form:1,motion:'低い斬り込み',desc:'懐から脚を狙う。相手の追跡を鈍らせる。'});
art(4020,'投石',{cost:12,fatigue:1,charge:.45,reach:9,arc:.8,power:1,breakPower:1.25,targets:['head'],resource:'stones',ranged:true,form:2,motion:'石を振りかぶる',desc:'小石を投げて頭を狙う。石調達も同時に身につく。'});
art(4021,'網をかける',{cost:23,fatigue:5,charge:.75,reach:4.5,arc:1.8,power:0,breakPower:3.2,resource:'nets',item:'net',targets:['leftLeg','rightLeg'],form:7,motion:'網を広げる',desc:'漁網を投げて足を絡める。網の残数を使い、硬い敵の追跡も止める。'});
art(4022,'火矢',{weapon:6,cost:25,fatigue:5,charge:1.05,reach:14,power:4,resource:'arrows',requires:['rightArm','leftArm'],ranged:true,targets:['torso'],color:'#eea36d',form:2,motion:'火矢をつがえる',desc:'強い火矢を放つ。矢を消費する。被弾で溜めが止まる。'});
art(4030,'火の矢',{weapon:5,cost:26,fatigue:6,charge:.9,reach:12,power:4,magic:true,resource:'magic',ranged:true,targets:['torso'],color:'#f3b477',form:2,motion:'火を紡ぐ',desc:'魔力を使って強い火の矢を放つ。魔力の残数は自然には戻らない。'});
art(4031,'炎壁',{cost:32,fatigue:9,charge:.8,reach:5,magic:true,resource:'magic',area:'fire',power:2,maxTargets:8,color:'#ee9760',form:7,motion:'炎の壁を立てる',desc:'前方に炎を立て、追跡を止める。敵を足止めして撤退するための術。'});
art(4050,'石調達',{passive:true,trigger:'passive',effect:'stoneGather',value:1,requires:[],cost:0,fatigue:0,charge:0,motion:'歩きながら石を探す',desc:'移動中、ときどき投石の残数が戻る。何も投げずに増え続けることはない。',color:'#abc7a4'});
art(4051,'不動の呼吸',{passive:true,trigger:'passive',effect:'capRegen',value:.3,requires:[],cost:0,fatigue:0,charge:0,motion:'落ち着いた呼吸',desc:'祈りや静かな暮らしで、疲れた息力の上限が少し戻りやすくなる。',color:'#b5d0bb'});
art(4052,'刃の記憶',{passive:true,trigger:'passive',effect:'clash',value:.12,requires:[],cost:0,fatigue:0,charge:0,motion:'重心を落とす',desc:'鍔迫り合いの経験が、次の押し合いを少し有利にする。',color:'#c5d1cf'});
art(4053,'風読み',{passive:true,trigger:'passive',effect:'flow',value:.09,requires:[],cost:0,fatigue:0,charge:0,motion:'流れる足運び',desc:'同じ局面で技がもう一度つながりやすくなる。',color:'#b9cda5'});

// Fixed phase vocabulary. Movement is in world units and is swept against bodies/scenery.
const CLASSIC_PHASES={4000:0,4001:0,4002:1,4003:2,4004:0,4005:1,4006:0,4007:0,4010:1,4011:2,4012:2,4013:0,4014:0,4015:1,4016:1,4017:2,4018:2,4019:2,4020:0,4021:1,4022:2,4030:0,4031:1};
for(const sk of book.values())if(!sk.passive){sk.band=CLASSIC_PHASES[sk.id]??0;sk.travel=sk.retreat?0:sk.ranged||sk.magic||sk.counter?0:sk.id===4014?1.7:sk.form===2?.9:.45;sk.animation=sk.form===6?'slam':sk.form===1?'spin':sk.form===2?'thrust':'slash';sk.hits=1;}
art(4100,'蹴り崩し',{band:1,travel:.55,power:1,cost:9,fatigue:.45,breakPower:1.2,requires:['rightLeg'],targets:['leftLeg','torso'],motion:'蹴り崩し',animation:'kick',desc:'蹴って崩す。'});
art(4101,'押し退く',{band:2,travel:.18,exit:1.25,power:1,cost:10,fatigue:.6,targets:['torso'],motion:'掌打から離脱',animation:'backflip',desc:'打って離れる。'});
// Four arts per gesture and phase. Gesture-exclusive arts may be auto-selected too,
// but a manual binding is accepted only for its matching gesture.
const GESTURE_ARTS=[
 ['双打',0,'tap','double',.55,2,1,null,'拳を二度打つ。'],
 ['砂打ち',0,'tap','slash',.2,1,.6,'blind','砂で視界を奪う。'],
 ['刺し足',0,'tap','kick',.85,1,1,'slow','脚を打ち、鈍らせる。'],
 ['疾突',0,'tap','thrust',2.2,1,1.3,null,'懐へ鋭く入る。'],
 ['三連牙',1,'tap','cross',1.05,3,.9,null,'三度、斬りつなぐ。'],
 ['崩し連打',1,'tap','double',.65,2,.75,'stun','連打でふらつかせる。'],
 ['毒針',1,'tap','thrust',.3,1,.65,'poison','毒を打ち込む。'],
 ['裂き傷',1,'tap','cross',1.0,2,.7,'bleed','浅い傷を重ねる。'],
 ['飛燕落とし',2,'tap','leap',1.5,2,1.25,null,'跳んで叩き落とす。'],
 ['五連星',2,'tap','cross',1.1,5,.65,null,'五つの打撃を畳みかける。'],
 ['砕心',2,'tap','slam',.45,1,1.7,'weak','重い一打で力を奪う。'],
 ['眠り打ち',2,'tap','thrust',.25,1,.5,'sleep','一打で眠りへ誘う。'],
 ['受け流し',0,'hold','counter',0,1,0,null,'構えて受け流す。'],
 ['踏ん張り',0,'hold','counter',0,1,0,null,'低く構えて受け止める。'],
 ['牽制構え',0,'hold','thrust',.2,1,.6,'slow','足元を牽制する。'],
 ['威圧',0,'hold','roar',0,1,0,'weak','気迫で攻め手を鈍らせる。'],
 ['鉄山靠',1,'hold','slam',1.4,1,1.4,'stun','体ごとぶつかる。'],
 ['回天',1,'hold','spin',.7,3,.8,null,'回転しながら三度打つ。'],
 ['束縛陣',1,'hold','cast',0,1,0,'root','足元を縛る。'],
 ['氷花',1,'hold','cast',0,2,.55,'slow','氷片で動きを鈍らせる。'],
 ['獅子吼',2,'hold','roar',.3,1,1,'stun','周囲をひるませる。'],
 ['轟槌',2,'hold','slam',.8,1,2.8,null,'溜めて叩き伏せる。'],
 ['渦払い',2,'hold','spin',1.05,4,.75,null,'渦を巻いて薙ぐ。'],
 ['炎輪',2,'hold','cast',0,3,.55,'burn','炎の輪で焼く。'],
 ['風抜け',0,'flick','dash',2.6,1,.8,null,'素早く踏み込む。'],
 ['滑り込み',0,'flick','slide',1.8,1,.8,'slow','低く滑って脚を狙う。'],
 ['払う風',0,'flick','spin',1.2,1,.6,'blind','砂塵を巻き上げる。'],
 ['跳び突き',0,'flick','leap',2.1,1,1.4,null,'跳んで間合いを詰める。'],
 ['交差斬り',1,'flick','cross',1.6,2,1,null,'交差する二連撃。'],
 ['蛇行連牙',1,'flick','zigzag',2.2,3,.75,null,'左右に振って三連撃。'],
 ['絡め取り',1,'flick','spin',.9,1,.4,'root','足を絡めて止める。'],
 ['火走り',1,'flick','dash',2.4,2,.7,'burn','火花を引いて駆ける。'],
 ['燕返し',2,'flick','backflip',.5,2,1.05,null,'斬り返して後ろへ跳ぶ。'],
 ['旋風脚',2,'flick','spin',1.4,3,.9,null,'回し蹴りを重ねる。'],
 ['彗星砕き',2,'flick','leap',2.8,1,2.3,'stun','跳躍から叩きつける。'],
 ['薙ぎ逃げ',2,'flick','backflip',.25,1,1.15,'slow','薙いで間合いを離す。']
];
const GESTURE_SKILL_IDS=[];
for(const [i,row] of GESTURE_ARTS.entries()){
 const [name,band,gesture,animation,travel,hits,power,status,desc]=row,id=4200+i;
 const aoe=['spin','roar','cast'].includes(animation),cast=animation==='cast',counter=animation==='counter';
 const sk=art(id,name,{band,gesture,animation,travel,hits,power,status:status?{id:status,duration:status==='stun'?1.25:status==='sleep'?3.2:5}:null,
  cost:gesture==='tap'?9+band*4+Math.max(0,hits-2):gesture==='hold'?14+band*5:12+band*4,
  fatigue:1+band*.6,charge:gesture==='hold'?.38+band*.05:gesture==='flick'?.12:.09,
  swing:hits>1?.28+hits*.19:.38,recovery:band===2?.52:.32,reach:aoe?3.2:2.2,arc:aoe?TAU:2.5,maxTargets:aoe?4:1,
  counter,magic:cast,requires:animation==='kick'||animation==='slide'?['rightLeg']:counter?['leftArm']:['rightArm'],
  form:animation==='spin'?1:['thrust','dash','cast'].includes(animation)?2:animation==='slam'||animation==='leap'?6:hits>1?3:0,
  exit:animation==='backflip'?2.25:0,targets:animation==='kick'||animation==='slide'?['leftLeg','rightLeg']:['torso','rightArm'],motion:name,desc,
  color:status?STATUS_DEFS[status].color:PHASE_COLORS[band],flow:0});
 GESTURE_SKILL_IDS.push(id);
}
const DEFAULT_BINDINGS=[{tap:4200,hold:4212,flick:4224},{tap:4204,hold:4216,flick:4228},{tap:4208,hold:4220,flick:4232}];
const PHASE_STARTERS=[4000,4100,4101];
const REMOVED_ARTS=new Set([4007,4020,4021,4022,4030,4031,4032,4033,4034,4035,4050,3078]);
// Former gesture arts are normal discoveries. Gear, not an input binding, determines the school.
for(const sk of book.values()){
 delete sk.gesture;
 if(!sk.passive){sk.cost=Math.round(sk.cost*.62*10)/10;sk.fatigue=Math.round(sk.fatigue*.28*100)/100;sk.magic=false;
 sk.school=sk.counter?'shield':sk.animation==='slam'?'heavy':['dash','slide','zigzag','backflip'].includes(sk.animation)?'light':['double','kick','roar'].includes(sk.animation)?'unarmed':'blade';}
}
// Reading and faith unlock schools. Combat remains contact-led; no bows or guns.
art(4060,'術理の基礎',{passive:true,trigger:'passive',school:'magic',effect:'arcane',value:1,requires:[],cost:0,fatigue:0,desc:'小物に眠る理を読む。',color:'#91bcb7'});
art(4061,'小さな信仰',{passive:true,trigger:'passive',school:'church',effect:'faith',value:1,requires:[],cost:0,fatigue:0,desc:'祈りを、灯に変える。',color:'#dec78e'});
art(4062,'受け身',{passive:true,trigger:'passive',school:'sword',effect:'fallResist',value:.12,requires:[],cost:0,fatigue:0,desc:'受けた衝撃を逃がす。',color:'#b1baa6'});
art(4063,'しなやかな足',{passive:true,trigger:'passive',school:'dance',effect:'walk',value:.07,requires:[],cost:0,fatigue:0,desc:'足運びが軽くなる。',color:'#c0cdaa'});
art(4064,'鉄の目利き',{passive:true,trigger:'passive',school:'forge',effect:'heavyCost',value:.1,requires:[],cost:0,fatigue:0,desc:'重い武具を無駄なく振る。',color:'#cfad89'});
const SPELLS=[
 [4300,'火種の掌',0,['charcoal'],'burn','掌に火を灯す。','cast',1.35,8],
 [4301,'風縫い',0,['feather'],'slow','風で足を鈍らせる。','thrust',.8,7],
 [4302,'石鎧の拳',1,['stone'],'stun','石の重みを拳に。','slam',1.7,10],
 [4303,'鈴のまどろみ',1,['bell'],'sleep','鈴音で眠りを誘う。','cast',.3,10],
 [4304,'結びの手',0,['net'],'root','糸で足を縛る。','cast',.4,8],
 [4310,'熔石砕き',2,['stone','charcoal'],'burn','熔ける石で打ち砕く。','slam',3.4,18],
 [4311,'風鈴の護り',2,['bell','feather'],'weak','清い風で力を奪う。','cast',1.8,15],
 [4312,'風の縫い目',1,['net','feather'],'root','風と糸を結びつける。','cross',1.6,12],
 [4313,'鳴石の震撃',2,['stone','bell'],'stun','響く石が、大地を打つ。','slam',2.6,16],
 [4314,'燻りの縛糸',1,['net','charcoal'],'burn','火を結んで逃がさない。','cast',1.7,12]
];
for(const [id,name,band,items,status,desc,animation,power,cost] of SPELLS)art(id,name,{band,school:'magic',items,requiresPassive:4060,magic:true,animation,power,cost,fatigue:.8,charge:.35,swing:.5,recovery:.7,reach:3.6,arc:2.8,maxTargets:2,travel:0,form:animation==='slam'?6:2,hits:1,status:{id:status,duration:4.2},desc,color:STATUS_DEFS[status].color});
art(4320,'神の裁き',{band:2,school:'church',requiresPassive:4061,magic:true,miracle:true,procChance:.36,animation:'judgement',power:5,cost:15,fatigue:.6,charge:.6,swing:.65,recovery:.8,reach:4.8,arc:TAU,maxTargets:4,travel:0,hits:1,targets:['torso'],status:{id:'stun',duration:1.8},desc:'裁きが降るかは、信仰心次第。',color:'#f6de9c'});
art(4321,'灯守の加護',{band:0,school:'church',requiresPassive:4061,magic:true,miracle:true,procChance:.58,ward:true,animation:'cast',cost:8,power:0,charge:.45,swing:.45,recovery:.5,reach:0,arc:TAU,travel:0,hits:1,desc:'祈りが届けば、身を護る。',color:'#f1dfa0'});
art(4330,'影喰いの頁',{band:2,school:'occult',requiresPassive:4060,magic:true,occult:true,animation:'eclipse',power:3.8,cost:17,fatigue:1.7,charge:.55,swing:.6,recovery:.8,reach:4.1,arc:TAU,maxTargets:3,travel:0,hits:2,status:{id:'weak',duration:5},selfCost:6,desc:'影を放つ。己の身も削る。',color:'#bd90c4'});
// Public balancing helpers are also used by tests and UI, never duplicated there.
const insightMultiplier = target=>!target||target.kind==='dummy'?1:target.kind==='boss'?4.5:target.elite?3.2:1.35+(target.tier||0)*.4;
function itemAffinity(p){const inv=p.inventory||[];return TACTICAL_SKILLS.filter(sk=>sk.items?.every(i=>inv.includes(i))&&(!sk.requiresPassive||p.passives?.includes(sk.requiresPassive)));}

const GEAR_RACKS=['weapon','armor','shield'];
function staminaMaximum(p){return 100+Math.min(60,Math.floor(Math.sqrt(Math.max(0,p.enduranceXP||0)/10)));}
function appearanceStage(p){return p.age<4?0:p.age<10?1:p.age<18?2:p.age<35?3:p.age<55?4:p.age<72?5:6;}
function gearSchool(p){return p.shield?'shield':p.armor===2?'heavy':p.weapon<0?'unarmed':p.armor===1||p.weapon===1?'light':'blade';}
function strongestMemory(p){return Object.entries(p.skillUses||{}).filter(([id,n])=>n>0&&skillById(+id)&&!skillById(+id).passive).sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0]))[0]?.[0]??null;}


const TACTICAL_SKILLS=[...book.values()].filter(sk=>!REMOVED_ARTS.has(sk.id));
function skillById(id){if(REMOVED_ARTS.has(+id))return null;const s=book.get(+id);if(s)return s;const old=legacySkillById(id);return old?{...old,band:old.passive?undefined:Math.floor(old.form/3)%3,travel:.4,hits:old.form===3?3:1,animation:old.form===1?'spin':old.form===6?'slam':old.form===3?'cross':'slash'}:null;}
function qualitative(n,small,large){return n<=small?'小':n>=large?'大':'中';}
function ageName(p){return p.age<4?'腕の中':p.age<15?'幼年':p.age<35?'青年':p.age<60?'壮年':p.age<75?'熟年':'老境';}
const basicId=w=>4001+clamp(w,0,6);
const enemiesOnly=e=>!['guard','villager','dummy'].includes(e.kind);
// Shared by combat, rescue and traversal. alive remains true until death is confirmed.
const incapacitated=p=>!!p?.alive&&['downed','carried','recovering'].includes(p.lifeState);
const canAct=p=>!!p?.alive&&!incapacitated(p);
const LIFE_RULES=Object.freeze({rescueRange:2.2,safeRecovery:12,fieldRecovery:40,finishGrace:2.2,carrySpeed:.62});
const COMBAT_AWARENESS=Object.freeze({engagedAvoid:.48,unawareFatal:.32,unawareHeavy:.55,lureRange:8,lureDuration:5,lureCooldown:12});
function legacyCandidates(p){return [...new Set(p.skills||[])].filter(id=>{const s=skillById(id);return s&&!s.passive;});}
const effectsOf=(p,effect)=>(p.passives||[]).reduce((n,id)=>n+(skillById(id)?.effect===effect?(skillById(id).value||0):0),0);
const phaseSkillCount=weights=>Object.values(weights||{}).filter(n=>Number(n)>0).length;
const miracleChance=(p,sk)=>clamp(sk.procChance+.06*Math.max(0,effectsOf(p,'faith')-1),0,.9);
const v3Weights=(ids,raw)=>{const out={};for(const id of ids){const n=Number(raw?.[id]);out[id]=Number.isFinite(n)?clamp(n,0,100):0;}if(!Object.values(out).some(x=>x>0)&&!ids.some(id=>Object.hasOwn(raw||{},id)&&Number.isFinite(+raw[id]))){const fallback=ids.includes(4000)?4000:ids[0];if(fallback!==undefined)out[fallback]=1;}return out;};

// Named enemy forms share their family's existing combat rules. Stable IDs are
// serialized with actors; selection never consumes the combat random stream.
const ENEMY_FORMS=Object.freeze(Object.fromEntries(Object.entries({
 goblin:[['goblin','森潜みの小鬼'],['bog-goblin','沼鉤の小鬼'],['scrap-goblin','鉄屑の鉱夫'],['bone-shaman','骨面の呪兵'],['mushroom-goblin','菌冠の小鬼'],['root-treant','根抱きの古木'],['ash-raptor','灰嘴の走鳥']],
 soldier:[['soldier','盾持ちの異形'],['grave-warden','墓守の鉄衛'],['cinder-knight','燻火の剣兵'],['rime-guard','霜棘の衛兵'],['oath-breaker','破戒の鎖兵']],
 elite:[['elite','冠角の執行者'],['thorn-reaver','茨角の断頭者'],['bell-executioner','弔鐘の処刑者'],['stone-colossus','墓石の巨兵'],['veil-duelist','黒紗の決闘者']],
 crawler:[['crawler','鎌脚の蟲'],['amber-scarab','琥珀甲の蟲'],['needle-mantis','針鎌の蟲'],['burrow-spider','洞穴の大蜘蛛'],['scorpion','骨尾の蠍'],['rubble-crab','崩壁の大蟹'],['iron-centipede','鎖殻の百足']],
 maw:[['maw','殻喰い'],['bristle-boar','石牙の猪'],['moss-wolf','苔鬣の狼'],['cave-bear','洞窟の鉄熊'],['marsh-lizard','沼鱗の蜥蜴'],['mire-toad','泥袋の大蛙'],['reliquary-mimic','食らう聖櫃']],
 wraith:[['wraith','裂け目の亡霊'],['lantern-wraith','灯籠の亡霊'],['thorn-wraith','荊籠の精霊'],['rift-jelly','裂界の水母'],['dusk-bat','宵羽の魔蝙蝠'],['cairn-idol','石環の偶像'],['mourning-bloom','弔花の魔草']],
 boss:[['boss','魔王']],stag:[['stag','苔角の獣']],mushroom:[['mushroom','眠る菌傘']]
}).map(([kind,rows])=>[kind,Object.freeze(rows.map(([id,name])=>Object.freeze({id,name,kind})))])));
function enemyForm(p){const forms=ENEMY_FORMS[p?.kind];return forms?.find(f=>f.id===p.enemyForm)||forms?.[0]||null;}
function assignEnemyForm(p){const forms=ENEMY_FORMS[p.kind];if(!forms)return p;
 let hash=2166136261;for(const c of p.kind+':'+p.id)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 const form=forms[hash%forms.length];p.enemyForm=form.id;p.name=form.name;return p;
}

class Simulation {
 constructor({seed=7349,mode='normal'}={}){
  this.seed=seed;this.rng=random(seed);this.mode=mode==='normal'?'normal':'demo';this.yearSeconds=this.mode==='normal'?60:20;this.boatInterval=this.yearSeconds*5;
  this.time=0;this.players=new Map();this.rooms=new Map();this.legacies={};this.events=[];this.seq=0;this.eid=0;this.roomSeq=0;this.abandoned=[];this.makeRoom('village');
 }
 emit(type,data={}){const event={seq:++this.seq,t:this.time,type,...data};this.events.push(event);if(this.events.length>400)this.events.splice(0,100);SkillSystem.onEvent(this,event);}
 getRoom(p){return this.rooms.get(p?.room)||[...this.rooms.values()].find(r=>r.actors.includes(p));}
 entity(r,id){return this.players.get(id)?.room===r.id?this.players.get(id):r.actors.find(a=>a.id===id);}
 combatReady(a){return canAct(a)&&!a.prologue&&!a.seated&&!a.rescueTarget&&!a.traversal&&!(a.stun>this.time)&&!hasStatus(a,'sleep',this.time);}
 opponent(a){return a.telegraph?.target||a.pendingSkill?.target||a.chain?.target||(a.kind==='player'?a.autoFight||((a.focusUntil||0)>this.time?a.focusTarget:null):a.target);}
 mutualEngagement(a,b){
  if(!this.combatReady(a)||!this.combatReady(b)||this.opponent(a)!==b.id||this.opponent(b)!==a.id||dist(a,b)>6)return false;
  const dir=Math.atan2(b.x-a.x,b.z-a.z);return Math.abs(angleDiff(a.dir,dir))<1.6&&Math.abs(angleDiff(b.dir,dir+Math.PI))<1.6;
 }
 awareness(defender,attacker){
  const engaged=this.mutualEngagement(defender,attacker),facing=Math.abs(angleDiff(defender.dir,Math.atan2(attacker.x-defender.x,attacker.z-defender.z)))<1.6;
  return {engaged,unaware:!engaged&&(!facing||!!this.opponent(defender)&&this.opponent(defender)!==attacker.id||!this.combatReady(defender))};
 }
 freeAttacker(e,r){
  if(!this.combatReady(e)||!enemiesOnly(e)||e.neutral&&!e.aggro)return false;
  const opponent=this.entity(r,this.opponent(e));return !opponent||!this.mutualEngagement(e,opponent);
 }
 lureCandidates(p,r=this.getRoom(p)){
  return r.actors.filter(e=>this.freeAttacker(e,r)&&!(e.luredUntil>this.time)&&dist(p,e)<=COMBAT_AWARENESS.lureRange&&this.clearPath(p,e,r)).sort((a,b)=>{
   const ally=e=>this.entity(r,this.opponent(e)),help=e=>{const q=ally(e);return q&&q.id!==p.id&&(q.kind==='player'||q.kind==='guard')?0:1;};
   return help(a)-help(b)||dist(a,p)-dist(b,p)||a.id.localeCompare(b.id);
  });
 }
 performLure(p,r){
  if(!this.combatReady(p)||p.lureReadyAt>this.time)return false;
  const e=this.lureCandidates(p,r)[0];if(!e){this.notice(p,'引き受けられる相手がいない');return false;}
  p.lureReadyAt=this.time+COMBAT_AWARENESS.lureCooldown;e.luredBy=p.id;e.luredUntil=this.time+COMBAT_AWARENESS.lureDuration;e.target=p.id;e.aggro=true;
  // An already committed attack finishes along its original arc and target.
  // The next approach/attack uses the lure; it never redirects a hit in flight.
  this.emit('lured',{player:p.id,room:r.id,target:e.id,x:e.x,z:e.z,text:'こちらだ！'});return true;
 }
 recordDamage(e,part,power,contact=true){
  e.damageMarks??={};const old=e.damageMarks[part]||{hits:0,depth:0};
  e.damageMarks[part]={hits:Math.min(4,old.hits+(contact?1:power/2)),depth:Math.min(5,old.depth+Math.max(contact?.25:0,power))};
  if(!e.wounds[part])e.wounds[part]={severity:power>=2?'heavy':'light'};
 }
 cancelAction(p){
  this.stopTraversal(p);this.stopDash(p);this.stopActivity(p);p.input={x:0,z:0};p.autoFight=null;p.autoSkill=null;p.chain=null;p.combo=null;p.pendingSkill=null;p.attackStep=null;p.telegraph=null;p.guard=false;p.guardPending=false;p.seated=false;p.queued=false;p.retreatUntil=0;p.exitPending=0;p.attackBufferedUntil=0;p.engagement=null;p.hitRecoil=null;SkillSystem.reset(p);
 }
 safeGround(p,r=this.getRoom(p)){
  return r?.kind==='village'?(p.z>=-25.5&&p.z<=22||onShipDeck(p)):r?.kind==='front'&&p.z>=2&&p.z<=8&&Math.abs(p.x)<=5;
 }
 releaseRescue(carrier){
  if(!carrier?.rescueTarget)return false;
  const target=this.entity(this.getRoom(carrier),carrier.rescueTarget);carrier.rescueTarget=null;carrier.rescueRoute=null;
  if(target?.carrierId===carrier.id){target.carrierId=null;target.lifeState='downed';target.action='downed';delete target.baseY;target.input={x:0,z:0};target.rescueClaim=null;this.emit('rescueDrop',{room:target.room,player:target.id,x:target.x,z:target.z});}
  return true;
 }
 downPlayer(p,cause,source=null,part='torso'){
  if(!canAct(p))return false;
  this.releaseRescue(p);this.cancelAction(p);
  p.room=this.getRoom(p).id;if(p.kind==='guard'){p.hp=0;p.npcResolve=0;p.rescueReturn=false;}p.lifeState='downed';p.downedAt=this.time;p.downedCause=cause;p.recoveryProgress=0;p.health=0;p.action='downed';p.actionStarted=this.time;p.actionUntil=0;p.rescueAt=null;p.stun=0;p.hitstopUntil=0;p.hitReactUntil=0;
  if(BODY_PARTS.includes(part)&&p.wounds[part]?.severity!=='lost')p.wounds[part]={severity:'heavy',since:(p.age||28)+(p.ageFraction||0),healsAt:(p.age||28)+(p.ageFraction||0)+5};
  // The strike that caused the fall cannot also finish it, including multi-hit chains.
  this.emit('downed',{player:p.id,room:p.room,source:source?.id,cause,x:p.x,z:p.z});return true;
 }
 finishPlayer(p,source,tg){
  if(!incapacitated(p)||!canAct(source)||this.time-p.downedAt<LIFE_RULES.finishGrace||!Number.isFinite(tg.started)||tg.started<=p.downedAt)return false;
  const r=this.getRoom(p);if(this.entity(r,source.id)!==source||dist(p,source)>(tg.reach??2.3)+.35||!this.clearPath(source,p,r))return false;
  if(p.kind==='player')this.die(p,'トドメを受けた');else this.killActor(p,source,r,true);return true;
 }
 canRescue(carrier,target,r){
  return canAct(carrier)&&!carrier.prologue&&(carrier.kind==='guard'||carrier.age>=4)&&!carrier.rescueTarget&&!carrier.traversal&&carrier.stun<=this.time&&!hasStatus(carrier,'sleep',this.time)&&!hasStatus(carrier,'root',this.time)&&!['leftArm','rightArm','leftLeg','rightLeg'].some(k=>carrier.wounds?.[k]?.severity==='lost')&&target!==carrier&&target&&['player','guard'].includes(target.kind)&&this.getRoom(target)===r&&target.lifeState==='downed'&&target.alive&&!target.carrierId&&dist(carrier,target)<=LIFE_RULES.rescueRange&&this.clearPath(carrier,target,r);
 }
 startRescue(carrier,target){
  const r=carrier.kind==='player'?this.getRoom(carrier):[...this.rooms.values()].find(r=>r.actors.includes(carrier));
  if(!r||!this.canRescue(carrier,target,r))return false;
  this.cancelAction(carrier);carrier.rescueTarget=target.id;carrier.lastInput=this.time;
  target.room=r.id;target.carrierId=carrier.id;target.rescueClaim=null;target.lifeState='carried';target.action='carried';target.baseY=1.32;target.dir=carrier.dir;
  this.emit('rescueLift',{player:target.id,room:r.id,source:carrier.id,x:target.x,z:target.z});return true;
 }
 syncRescue(carrier,r){
  const target=this.entity(this.getRoom(carrier),carrier.rescueTarget);if(!target)return this.releaseRescue(carrier);
  if(!canAct(carrier)||!target.alive||target.room!==r.id||target.carrierId!==carrier.id||carrier.kind==='player'&&this.time-carrier.lastInput>8){this.releaseRescue(carrier);return;}
  target.x=carrier.x;target.z=carrier.z;target.dir=carrier.dir;target.supportHeight=carrier.supportHeight||0;target.baseY=1.32+target.supportHeight;target.action='carried';
  if(carrier.role==='medic'?dist(target,GATE_CLINIC.beds[carrier.id.endsWith(':1')?1:0])<.35:this.safeGround(target,r)){this.releaseRescue(carrier);target.lifeState='recovering';target.action='recovering';this.emit('rescueSafe',{room:r.id,player:target.id,source:carrier.id,x:target.x,z:target.z});if(carrier.kind==='guard'){carrier.rescueReturn=carrier.role!=='medic';this.rescueSay(carrier,r,'arrival');}}
 }
 tickLifeState(p,r,dt){
  if(!incapacitated(p))return false;
  p.input={x:0,z:0};p.queued=false;
  if(p.lifeState==='carried'){
   const carrier=this.entity(r,p.carrierId);if(!carrier||!canAct(carrier)||carrier.rescueTarget!==p.id){p.carrierId=null;p.lifeState='downed';delete p.baseY;}else{this.syncRescue(carrier,r);if(p.lifeState==='carried')return true;}
  }
  const safe=this.safeGround(p,r);p.lifeState=safe?'recovering':'downed';p.action=p.lifeState;delete p.baseY;
  p.recoveryProgress=Math.min(1,(p.recoveryProgress||0)+dt/(atClinic(p,r)?GATE_CLINIC.recovery:safe?LIFE_RULES.safeRecovery:p.kind==='guard'?90:LIFE_RULES.fieldRecovery));
  if(p.recoveryProgress>=1){p.lifeState='active';p.action='recover';p.actionStarted=this.time;p.actionUntil=this.time+.8;p.cooldown=this.time+.8;p.standUpAt=this.time;p.standUpUntil=this.time+.8;p.health=35;if(p.kind==='player')p.stamina=Math.min(p.staminaCap,30);p.stun=this.time+.8;p.sleepUntil=0;p.carrierId=null;p.rescueClaim=null;p.autoSuppressedUntil=this.time+2;if(p.kind==='guard'){p.hp=p.hpMax*.6;p.npcResolve=p.npcResolveMax*.6;p.clinicRestUntil=atClinic(p,r)?this.time+11:0;p.rescueReturn=p.role!=='medic';}this.emit('revived',{room:r.id,player:p.id,x:p.x,z:p.z});}
  return true;
 }
 rescueSay(g,r,key){if(r.actors.some(a=>a!==g&&a.alive&&a.kind==='guard'&&a.speech&&a.speechUntil>this.time))return;const text=g.role==='medic'?MEDIC_LINES[key]:RESCUE_LINES[key];g.speech=text;g.speechUntil=this.time+5;g.nextSpeechAt=this.time+8;this.emit('guardline',{room:r.id,target:g.id,text,x:g.x,z:g.z});}
 tickGuardRescue(g,r,ps,dt){
  if(g.kind!=='guard'||g.role==='medic'||r.kind!=='village')return false;
  if(g.rescueReturn){const goal=g.z>-30?{x:0,z:-31.5}:{x:g.homeX,z:-32},d=dist(g,goal);if(d<.2){if(g.z<=-30&&Math.abs(g.x-g.homeX)<.2)g.rescueReturn=false;}else{g.dir=Math.atan2(goal.x-g.x,goal.z-g.z);this.moveWalk(g,r,Math.sin(g.dir)*Math.min(d,2.8*dt),Math.cos(g.dir)*Math.min(d,2.8*dt));g.action='run';}return true;}
  if(g.rescueTarget){
   const target=this.entity(r,g.rescueTarget);if(!target?.alive||target.room!==r.id){this.releaseRescue(g);return true;}
   const goal=Math.abs(g.x)>.7&&g.z<-29.5?{x:0,z:-31.5}:{x:0,z:-24};
   const d=dist(g,goal);if(d>.1){g.dir=Math.atan2(goal.x-g.x,goal.z-g.z);this.moveWalk(g,r,Math.sin(g.dir)*2.8*LIFE_RULES.carrySpeed*dt,Math.cos(g.dir)*2.8*LIFE_RULES.carrySpeed*dt);g.action='run';}
   this.syncRescue(g,r);return true;
  }
  if(r.actors.some(a=>a.role==='medic'&&canAct(a)))return false;
  // A guard already exchanging blows finishes that exchange before rescuing.
  if(g.telegraph||g.action==='attack'&&g.actionUntil>this.time)return false;
  const targets=ps.filter(p=>p.lifeState==='downed'&&!p.carrierId&&p.z<-25.5&&dist(g,p)<14&&(!p.rescueClaim||p.rescueClaim.until<=this.time||p.rescueClaim.id===g.id)).sort((a,b)=>a.downedAt-b.downedAt||dist(a,g)-dist(b,g));
  const target=targets[0];if(!target){if(g.z>-29.6){g.rescueReturn=true;return true;}return false;}
  if(!target.rescueClaim||target.rescueClaim.id!==g.id){target.rescueClaim={id:g.id,until:this.time+3};this.rescueSay(g,r,'approach');}
  target.rescueClaim.until=this.time+3;g.target=null;
  if(dist(g,target)<=LIFE_RULES.rescueRange&&this.startRescue(g,target)){this.rescueSay(g,r,'lift');return true;}
  let goal=target;if((g.z+28)*(target.z+28)<0)goal=Math.abs(g.x)>.6?{x:0,z:g.z<-28?-31.5:-25.8}:{x:0,z:target.z<-28?-31.5:-25.8};
  g.dir=Math.atan2(goal.x-g.x,goal.z-g.z);this.moveWalk(g,r,Math.sin(g.dir)*2.8*dt,Math.cos(g.dir)*2.8*dt);g.action='run';return true;
 }
 clearPath(a,b,r){
  const floorA=a.supportHeight||0,floorB=b.supportHeight||0;if(Math.abs(floorA-floorB)>TRAVERSAL_RULES.maxStep)return false;
  const n=Math.max(1,Math.ceil(dist(a,b)/.18));
  for(let i=1;i<=n;i++){const q={x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n,supportHeight:Math.max(floorA,floorB)},old={...q};this.bound(q,r);if(dist(q,old)>.001)return false;}return true;
 }
 traversalEligible(p){return this.combatReady(p)&&p.kind==='player'&&p.age>=4&&!p.pendingSkill&&!p.combo&&!p.chain&&!p.traversal&&!(p.traversalReadyAt>this.time)&&!hasStatus(p,'root',this.time)&&!['leftArm','rightArm','leftLeg','rightLeg'].some(k=>['heavy','lost'].includes(p.wounds?.[k]?.severity));}
 canLand(p,q,r,ignored=null,landing=true){
  const test={...q},before={...q};this.bound(test,r,this.collisionRadius(p),ignored);if(dist(test,before)>.001)return false;
  const bodies=[...r.actors,...this.players.values()].filter(a=>a!==p&&a.alive&&!a.carrierId&&(a.kind!=='player'||a.room===r.id));
  if(bodies.some(a=>dist(a,q)<this.collisionRadius(p)+this.collisionRadius(a)))return false;
  if(landing){for(const [x,z] of [[-.4,-.4],[-.4,.4],[.4,-.4],[.4,.4]])if(Math.abs(supportHeight(r.map,q.x+x,q.z+z)-(q.supportHeight||0))>.05)return false;}
  return true;
 }
 tryTraversal(p,r,dx,dz){
  if(r.kind!=='village'||!this.traversalEligible(p))return false;
  if(p.z>29||p.z+dz>29)return false;
  const n=Math.hypot(dx,dz);if(n<.001)return false;dx/=n;dz/=n;
  const from={x:p.x,z:p.z,supportHeight:p.supportHeight||0},probe={x:p.x+dx*.65,z:p.z+dz*.65};
  let obstacle=(r.map.traversables||[]).find(o=>o.kind==='vault'&&Math.abs(probe.x-o.x)<o.width/2+.2&&Math.abs(probe.z-o.z)<o.depth/2+.5),to,kind;
  if(obstacle){
   if(obstacle.height>TRAVERSAL_RULES.maxVault||Math.abs(dz)<.6||Math.sign(dz)!==Math.sign(obstacle.z-p.z))return false;
   const distance=(Math.abs(obstacle.z-p.z)+obstacle.depth/2+.72)/Math.abs(dz);to={x:p.x+dx*distance,z:p.z+dz*distance,supportHeight:0};kind=effectsOf(p,'vault')>0?'vault':'climb';
   if(Math.abs(to.x-obstacle.x)>obstacle.width/2-.48)return false;
  }else{
   if(stairAt(r.map,probe.x,probe.z)||stairAt(r.map,p.x,p.z))return false;
   const ahead=supportHeight(r.map,probe.x,probe.z),rise=ahead-from.supportHeight;if(Math.abs(rise)<.18||Math.abs(rise)>TRAVERSAL_RULES.maxStep)return false;
   to={x:p.x+dx*1.12,z:p.z+dz*1.12};to.supportHeight=supportHeight(r.map,to.x,to.z);kind='climb';
   if(Math.abs(to.supportHeight-from.supportHeight)<.18||Math.abs(to.supportHeight-from.supportHeight)>TRAVERSAL_RULES.maxStep)return false;
  }
  if(!this.canLand(p,to,r)||!this.canLand(p,from,r))return false;
  // Validate the full body corridor before committing. Only the chosen fence is ignored.
  const samples=Math.max(2,Math.ceil(dist(from,to)/.15));for(let i=1;i<samples;i++){
   const q={x:from.x+(to.x-from.x)*i/samples,z:from.z+(to.z-from.z)*i/samples,supportHeight:Math.max(from.supportHeight,to.supportHeight)};
   if(supportHeight(r.map,q.x,q.z)>q.supportHeight+.05)return false;
   if(!this.canLand(p,q,r,obstacle?.id||'steps',false))return false;
  }
  // Freeze the selected action and handhold in the authoritative snapshot.
  // A learned passive changes future crossings, never one already in progress.
  const descending=!obstacle&&to.supportHeight<from.supportHeight,top=obstacle?.height??Math.max(from.supportHeight,to.supportHeight);
  let grip;
  if(obstacle){const f=(obstacle.z-from.z)/(to.z-from.z);grip={x:from.x+(to.x-from.x)*f,z:obstacle.z,y:obstacle.gripHeight??top};}
  else {let edge=0;for(let i=1;i<=80;i++){const f=i/80,h=supportHeight(r.map,from.x+(to.x-from.x)*f,from.z+(to.z-from.z)*f);if(Math.abs(h-from.supportHeight)>.1){edge=f;break;}}grip={x:from.x+(to.x-from.x)*edge,z:from.z+(to.z-from.z)*edge,y:top};}
  this.cancelAction(p);p.dir=Math.atan2(dx,dz)+(descending?Math.PI:0);p.traversal={kind,profile:1,top,grip,descending,obstacle:obstacle?.id||null,room:r.id,from,to,started:this.time,duration:kind==='vault'?.68:obstacle?1.35:1.05+Math.abs(to.supportHeight-from.supportHeight)*.2,progress:0};p.grounded=false;p.action=kind;p.actionStarted=this.time;p.actionUntil=this.time+p.traversal.duration;this.emit('traverse',{player:p.id,room:r.id,kind,x:p.x,z:p.z});return true;
 }
 stopTraversal(p){
  const a=p.traversal;if(!a)return;
  // Return to the last supported side; never leave a saved body inside scenery.
  const q=a.progress>=.75&&this.canLand(p,a.to,this.getRoom(p))?a.to:a.from;
  p.x=q.x;p.z=q.z;p.supportHeight=q.supportHeight;p.verticalOffset=0;p.grounded=true;p.traversal=null;p.traversalReadyAt=this.time+TRAVERSAL_RULES.cooldown;
 }
 tickTraversal(p,r){
  const a=p.traversal;if(!a)return false;if(!canAct(p)||a.room!==r.id){this.stopTraversal(p);return false;}
  const u=clamp((this.time-a.started)/a.duration,0,1);a.progress=u;
  if(!this.canLand(p,a.to,r)){this.stopTraversal(p);return true;}
  const frame=traversalFrame(a,u);p.x=a.from.x+(a.to.x-a.from.x)*frame.travel;p.z=a.from.z+(a.to.z-a.from.z)*frame.travel;
  p.supportHeight=frame.floor;p.verticalOffset=frame.lift;p.action=a.kind;p.input={x:0,z:0};
  if(u>=1){p.x=a.to.x;p.z=a.to.z;p.supportHeight=a.to.supportHeight;p.verticalOffset=0;p.grounded=true;p.traversal=null;p.traversalReadyAt=this.time+TRAVERSAL_RULES.cooldown;p.action='land';p.actionStarted=this.time;p.actionUntil=this.time+.16;this.emit('landed',{player:p.id,room:r.id,x:p.x,z:p.z,kind:a.kind,obstacle:a.obstacle,profile:a.profile});}
  return true;
 }
 chooseLegacy(p,id){
  if(p.alive||p.legacyChoice?.state!=='pending'||!Number.isInteger(id)||!p.legacyChoice.candidates.includes(id)||!legacyCandidates(p).includes(id))return false;
  p.legacyChoice={...p.legacyChoice,state:'chosen',skill:id};this.bank(p);return true;
 }
 makeRoom(kind,id){
  const index=++this.roomSeq,seed=(this.seed+index*977)>>>0;
  const code=((Math.imul(seed,2654435761)>>>0).toString(36).toUpperCase().padStart(7,'0'))+'-'+index.toString(36).toUpperCase();
  const r={id:id||kind+'-'+index,code,kind,seed,actors:[],born:this.time,waveAt:0,stage:0,kills:0,quota:0,cleared:[],bossDefeated:false,partySize:0,boatCycle:Math.floor(this.time/this.boatInterval),clans:{},score:0,expedition:[],departedAt:this.time,abandoned:false};
  this.rooms.set(r.id,r);
  if(kind==='village'){
   r.map=makeVillage(seed);r.name=['白樺','霧鐘','琥珀','星灯'][seed%4]+'の入り江';
   r.items=[[-6,9,'stone'],[5,19,'net'],[-3,-13,'bell'],[19,15,'charcoal'],[-19,10,'feather'],[4,-23,'stone'],[-6,22,'stone'],[15,-9,'stone']].map(([x,z,item],i)=>({id:'item-'+i,x,z,item,ready:0}));
   this.spawnVillageNPCs(r);
  }
  return r;
 }
 legacy(owner){return this.legacies[owner]||(this.legacies[owner]={archive:[],records:[],generation:1});}
 addPlayer(id,config={}){
  if(this.players.has(id))return this.players.get(id);
  if([...this.players.values()].some(p=>p.owner===(config.owner||id)&&p.legacyChoice?.state==='pending'))throw Error('遺す技を選んでから、次の人生へ進もう');
  let r;
  if(config.villageCode){r=[...this.rooms.values()].find(r=>r.kind==='village'&&!r.abandoned&&r.code===cleanText(config.villageCode,24).toUpperCase());if(!r)throw Error('その座標の村は見つからないか、すでに廃村です。');if(Object.keys(r.clans).length>=30)throw Error('この村に空き家がありません。');}
  else r=[...this.rooms.values()].find(r=>r.kind==='village'&&!r.abandoned&&Object.keys(r.clans).length<30)||this.makeRoom('village');
  const owner=cleanText(config.owner||id,80),legacy=this.legacy(owner),occupied=new Set(Object.values(r.clans));let house=0;while(occupied.has(house))house++;
  const p={id,owner,kind:'player',name:cleanText(config.name,12)||C_NAMES[Math.floor(this.rng()*C_NAMES.length)],clan:cleanText(config.clan,16)||'暁風',race:clamp(Math.trunc(+config.race||0),0,3),gender:Math.floor(this.rng()*2),weapon:-1,armor:0,shield:false,skin:Math.floor(this.rng()*4),hair:Math.floor(this.rng()*6),appearanceSeed:Math.floor(this.rng()*100000),enduranceXP:0,skillUses:{},training:{},inventory:[],introUntil:this.time+42,releaseAt:this.time+30,prologue:true,dash:null,openingVersion:6,motherIndex:0,motherNextAt:this.time+.2,motherText:'',motherUntil:0,giftOffer:['bell','stone','feather'],farewellStage:-1,age:0,ageFraction:0,lifespan:80+Math.floor(this.rng()*21),x:0,z:4,dir:Math.PI,room:r.id,home:r.id,house,alive:true,action:'idle',actionUntil:0,actionStarted:0,cooldown:0,guard:false,guardPending:false,guardStart:-10,guardHits:0,stun:0,dodgeUntil:0,stamina:100,staminaCap:100,lastExertion:-10,lastSkillAt:-10,wounds:{},passives:[],deeds:{},pendingSkill:null,attackStep:null,hitReactAt:0,hitReactUntil:0,hitDir:0,hitSeverity:null,hitUntil:0,input:{x:0,z:0},lastInput:this.time,born:this.time,kills:0,parries:0,clashes:0,skills:[4000],phaseWeights:[{4000:1},{},{}],weights:{4000:1},inherit:Array.isArray(config.inherit)?[...new Set(config.inherit.filter(x=>skillById(x)))].slice(0,1):[],usages:{attack:0,guard:0,skill:0},queued:false,zone:'village',cause:'',gen:legacy.generation,bornMode:this.mode,ammo:{arrows:0,magic:0,stones:0,nets:0},trinket:null,skillReady:{},combo:null,comboQueued:false,activity:null,activitySince:0,permanentFatigue:0,experience:0,speech:'',speechUntil:0,lastChat:-10,bankedSkills:[],recorded:false,returned:0,exertionLevel:0};
  const plot=r.map.houses[house];p.x=plot.x+(plot.x<0?2.8:-2.8);p.z=plot.z;p.introX=p.x;p.introZ=p.z;p.introHomeX=plot.x;p.introHomeZ=plot.z;p.introDir=plot.rotation;p.dir=p.introDir;
  this.preparePlayer(p);r.everOccupied=true;r.clans[id]=house;this.players.set(id,p);this.emit('birth',{player:id,room:r.id});return p;
 }
 removePlayer(id){const p=this.players.get(id);if(!p)return;this.releaseRescue(p);if(p.carrierId)this.releaseRescue(this.entity(this.getRoom(p),p.carrierId));const r=this.rooms.get(p.home);if(r){delete r.clans[id];this.checkAbandoned(r);}if(p.legacyChoice?.state!=='pending')this.players.delete(id);}
 checkAbandoned(r){if(r?.kind==='village'&&!r.abandoned&&Object.keys(r.clans).length===0&&r.everOccupied){r.abandoned=true;this.abandoned.push(r.code);this.emit('abandoned',{room:r.id,code:r.code});}}
 actor(kind,x,z,tier=0){
  if(kind==='archer')kind='soldier';if(kind==='mage')kind='wraith';
  const guard=kind==='guard',elite=kind==='elite',neutral=['stag','mushroom'].includes(kind),humanoid=['guard','goblin','soldier','elite','archer','mage','dummy'].includes(kind);
  return assignEnemyForm({id:'e'+(++this.eid),kind,x,z,dir:0,tier,alive:true,action:'idle',actionUntil:0,actionStarted:0,cooldown:this.time+this.rng(),target:null,telegraph:null,stun:0,dodgeUntil:0,armor:elite?6:tier>0?2:0,guard:kind==='soldier',stance:this.rng()*TAU,homeX:x,homeZ:z,seals:kind==='boss'?4:0,attackCount:0,npcResolve:guard?18:elite?22:tier>0?14:10,npcResolveMax:guard?18:elite?22:tier>0?14:10,hp:guard?130:elite?120:tier>0?70:42,hpMax:guard?130:elite?120:tier>0?70:42,statuses:{},elite,lane:clamp(Math.round((x+10.5)/7),0,3),humanoid,neutral,aggro:false,smart:['soldier','elite'].includes(kind),bodyScale:elite?1.6:kind==='boss'?2.8:kind==='maw'?1.2:1,wounds:{},experience:guard?12:tier*5,hitUntil:0,hitReactAt:0,hitReactUntil:0,hitDir:0,hitSeverity:null,ammo:kind==='archer'?10:kind==='mage'?3:0,name:({elite:'冠角の執行者',crawler:'鎌脚の蟲',wraith:'裂け目の亡霊',maw:'殻喰い',stag:'苔角の獣',mushroom:'眠る菌傘',soldier:'盾持ちの異形',archer:'骨弓の異形',mage:'呪灯の亡霊'})[kind]||''});
 }
 spawnVillageNPCs(r){
  for(let i=0;i<4;i++){const g=this.actor('guard',-10.5+i*7,-32);g.lane=i;r.actors.push(g);const e=this.actor(['crawler','wraith','maw','goblin'][i],-10.5+i*7,-39,i===2?1:0);e.lane=i;r.actors.push(e);}
  r.actors.push(this.actor('stag',-19,-38,1),this.actor('mushroom',18,-42,0));
  // No ambient villagers. Parents are rendered only for the opening scene.
  const spot=villagePracticePosition(r.map),dummy=this.actor('dummy',spot.x,spot.z);dummy.name='稽古人形';r.actors.push(dummy);this.ensureClinicStaff(r);this.ensureShipActors(r);
 }
 ensureClinicStaff(r){
  for(const [i,spot]of GATE_CLINIC.staff.entries()){
   const id='gate-medic:'+r.id+':'+i;if(r.actors.some(a=>a.id===id))continue;
   const state=this.rng.getState(),eid=this.eid,a=this.actor('guard',spot.x,spot.z);this.rng.setState(state);this.eid=eid;
   Object.assign(a,{id,room:r.id,role:'medic',name:i?'救護班のオリン':'救護班のエナ',age:28,ageFraction:0,weapon:-1,armor:0,shield:false,guard:false,lifeState:'active'});r.actors.push(a);
  }
 }
 tickClinicCare(p,r,dt){
  if(!atClinic(p,r)||!canAct(p)||!(p.seated||p.kind==='guard')||this.time-(p.lastHurtAt??-100)<REST_HEALING.quiet)return;
  p.health=Math.min(100,(p.health??100)+dt*8);
  if(p.kind==='guard'){p.hp=Math.min(p.hpMax,p.hp+dt*8);p.npcResolve=p.npcResolveMax*p.hp/p.hpMax;}
  for(const [part,w]of Object.entries(p.wounds||{})){
   if(w.severity==='lost')continue;
   if(p.kind==='player'&&Number.isFinite(w.healsAt))w.healsAt-=dt/this.yearSeconds*(GATE_CLINIC.woundRate-1);
   else {w.care=(w.care||0)+dt;if(w.care>=10){delete p.wounds[part];this.emit('healed',{room:r.id,target:p.id,part,x:p.x,z:p.z});}}
  }
 }
 medicWalk(g,goal,r,dt,carrying=false){
  let next=goal;
  if(goal.x>=5&&goal.z>-26){
   const key=goal.x+':'+goal.z;
   if(g.careRoute?.key!==key)g.careRoute={key,index:0,points:atClinic(g,r)?[goal]:[{x:0,z:-20.5},{x:goal.x,z:-20.5},goal]};
   const route=g.careRoute;while(route.index<route.points.length-1&&dist(g,route.points[route.index])<.16)route.index++;
   next=route.points[route.index];
  }else g.careRoute=null;
  if((g.z+28)*(next.z+28)<0)next=Math.abs(g.x)>.5?{x:0,z:g.z<-28?-31.5:-25.8}:{x:0,z:next.z<-28?-31.5:-25.8};
  const d=dist(g,next);if(d<.12){g.action='idle';return;}
  g.dir=Math.atan2(next.x-g.x,next.z-g.z);const n=Math.min(d,2.8*(carrying?LIFE_RULES.carrySpeed:1)*dt);
  this.moveWalk(g,r,Math.sin(g.dir)*n,Math.cos(g.dir)*n);g.action='run';
 }
 tickMedic(g,r,ps,dt){
  if(g.stun>this.time||hasStatus(g,'sleep',this.time)||hasStatus(g,'root',this.time))return;
  g.guard=false;g.target=null;g.telegraph=null;
  if(g.rescueTarget){this.medicWalk(g,GATE_CLINIC.beds[g.id.endsWith(':1')?1:0],r,dt,true);this.syncRescue(g,r);return;}
  const targets=[...ps,...r.actors].filter(p=>p!==g&&['player','guard'].includes(p.kind)&&p.alive&&p.lifeState==='downed'&&!p.carrierId&&dist(p,GATE_CLINIC)<32&&(!p.rescueClaim||p.rescueClaim.until<=this.time||p.rescueClaim.id===g.id)).sort((a,b)=>a.downedAt-b.downedAt||dist(a,g)-dist(b,g));
  const target=targets[0];
  if(target){
   if(target.rescueClaim?.id!==g.id){target.rescueClaim={id:g.id,until:this.time+3};this.rescueSay(g,r,'approach');}
   target.rescueClaim.until=this.time+3;
   if(this.startRescue(g,target)){this.rescueSay(g,r,'lift');return;}
   this.medicWalk(g,target,r,dt);return;
  }
  this.medicWalk(g,{x:g.homeX,z:g.homeZ},r,dt);this.tickClinicCare(g,r,dt);
 }
 ensureShipActors(r){
  for(const [i,spot]of VILLAGE_SHIP.dummies.entries()){
   let a=r.actors.find(a=>a.shipStation===i);
   if(!a){
    // Fixed fixtures must not consume the combat/life RNG or enemy ID stream.
    const rngState=this.rng.getState(),eid=this.eid;
    a=this.actor('dummy',spot.x,spot.z);this.rng.setState(rngState);this.eid=eid;
    a.id='ship-dummy:'+r.id+':'+i;a.shipStation=i;a.name='甲板の稽古人形';r.actors.push(a);
   }
   a.x=a.homeX=spot.x;a.z=a.homeZ=spot.z;a.supportHeight=VILLAGE_SHIP.deckY;
  }
 }
 preparePlayer(p){
  p.lifeState??=p.alive?'active':'dead';p.health??=100;p.statuses??={};p.statusClock=this.time;p.lastHurtAt??=-100;
  p.skillUses??={};p.training??={};p.inventory??=[];p.enduranceXP??=0;p.shield??=false;p.appearanceSeed??=(p.house||0)*1389+(p.gen||1)*37;
  if(p.systemVersion!==6){
   p.inventory=(Array.isArray(p.inventory)?p.inventory:[]).filter(id=>ITEMS[id]).slice(-MAX_ITEMS);
   if(!p.inventory.length&&ITEMS[p.trinket])p.inventory=[p.trinket];p.trinket=p.inventory[0]||null;
   p.dash=null;p.input={x:0,z:0};p.lastMoveInput=this.time;p.lastMotherTopic='';p.activity=null;
   p.motherIndex??=0;p.motherNextAt??=this.time+.2;p.farewellStage??=-1;p.giftOffer??=['bell','stone','feather'];
   p.activityClock=0;p.progressLines=[];p.systemVersion=6;
  }
  if(p.loadoutVersion!==5){
   const old=p.phaseWeights||[p.weights||{},{},{}];
   p.skills=[...new Set((p.skills||[4000]).filter(id=>skillById(id)&&!skillById(id).passive))];
   if(!p.skills.length)p.skills=[4000];p.passives=(p.passives||[]).filter(id=>skillById(id));p.inherit=(p.inherit||[]).filter(id=>skillById(id)).slice(0,1);
   p.phaseWeights=[0,1,2].map(b=>Object.fromEntries(p.skills.filter(id=>skillPhase(skillById(id))===b).map(id=>[id,Math.max(0,+old[b]?.[id]||0)])));
   if(!p.phaseWeights[0][4000]&&p.skills.length===1)p.phaseWeights[0][4000]=1;
   p.weights=p.phaseWeights[0];p.bindings=null;p.loadoutVersion=5;p.gestureKit=false;p.autoFight=null;p.autoSkill=null;p.chain=null;p.seated=false;
   p.race=(p.race||0)%4;if(p.weapon>=WEAPONS.length)p.weapon=-1;if(p.age<EQUIP_AGE){p.weapon=-1;p.armor=0;p.shield=false;}
  }
  if(p.phaseLimitVersion!==1){
   // Keep every learned technique and the original allocation; only the active set is bounded.
   for(const weights of p.phaseWeights){
    const active=Object.keys(weights).filter(id=>weights[id]>0).sort((a,b)=>weights[b]-weights[a]||Number(a)-Number(b));
    if(active.length>MAX_PHASE_SKILLS){p.phaseWeightsBeforeLimit??=p.phaseWeights.map(w=>({...w}));for(const id of active.slice(MAX_PHASE_SKILLS))weights[id]=0;}
   }
   p.weights=p.phaseWeights[0];p.phaseLimitVersion=1;
  }
  SkillSystem.prepare(this,p);
 }
 stopDash(p){p.dash=null;}
 stopActivity(p){p.activity=null;p.activitySince=0;p.activityClock=0;}
 wake(p){p.seated=false;p.sitSince=0;if(p.action==='sit')p.action='idle';}
 motherSay(p,text,duration=3.4){p.motherText=text;p.motherUntil=this.time+duration;this.emit('mother',{player:p.id,room:p.room,text,x:p.x,z:p.z});}
 receiveItem(p,id,{gift=false}={}){
  if(!ITEMS[id])return false;
  if(p.inventory.length>=MAX_ITEMS){this.notice(p,'手荷物は、ふたつまで');return false;}
  p.inventory.push(id);p.trinket=p.inventory[0]||null;
  if(gift){p.giftAt=this.time;p.giftItem=id;this.motherSay(p,GIFT_LINES[id],5);p.motherNextAt=this.time+5.2;}
  this.emit('pickup',{player:p.id,room:p.room,item:id,gift,x:p.x,z:p.z});return true;
 }
 releaseFromParent(p){
  if(!p.prologue)return false;
  p.prologue=false;p.age=Math.max(4,p.age);p.ageFraction=0;p.releaseAt=this.time;p.introUntil=this.time+12;
  this.wake(p);this.stopDash(p);this.stopActivity(p);
  p.input={x:0,z:0};p.autoFight=null;p.combo=null;p.pendingSkill=null;p.chain=null;p.attackStep=null;p.retreatUntil=0;p.attackBufferedUntil=0;
  p.action='idle';p.actionStarted=this.time;p.actionUntil=this.time;p.cooldown=this.time;p.stun=0;
  // Spawn outside the house's collision hull, even when restoring a v5 opening.
  const r=this.getRoom(p),dir=p.dir;
  p.introX=p.x;p.introZ=p.z;p.introDir=dir;
  p.x=(p.introX??p.x)+Math.sin(dir)*.82;p.z=(p.introZ??p.z)+Math.cos(dir)*.82;this.bound(p,r);
  p.farewellStage=0;this.motherSay(p,FAREWELL_LINES[0],4.4);
  this.emit('released',{player:p.id,room:p.room,x:p.x,z:p.z});return true;
 }
 tickMother(p,dt){
  if(p.prologue){
   const topic=motherTopic(p,this.getRoom(p)),seen=p.motherTopicsAt??={};
   const newPlace=topic!=='cradle'&&this.time-(seen[topic]??-100)>=30;
   if(this.time>=p.motherUntil&&(newPlace||this.time>=p.motherNextAt)){
    const chosen=newPlace?topic:'cradle',lines=MOTHER_LINES[chosen],index=p.motherIndex||0;
    this.motherSay(p,lines[newPlace?0:index%lines.length]);p.motherIndex=index+1;
    seen[chosen]=this.time;p.motherNextAt=this.time+8;
   }
   return;
  }
  if(p.farewellStage>=0&&p.farewellStage<2&&this.time-p.releaseAt>=(p.farewellStage+1)*4){p.farewellStage++;this.motherSay(p,FAREWELL_LINES[p.farewellStage],4.7);}
 }
 bindGesture(){return false;}
 equip(p,cmd){
  const r=this.getRoom(p),rack=r.kind==='village'?r.map.schools.find(s=>s.id==='armory'):null;
  if(!rack||!atFacilityStation(p,rack)){this.notice(p,'武具棚の前で着替えよう');return false;}
  if(p.age<EQUIP_AGE){this.notice(p,'武具棚は、七つになってから');return false;}
  if(p.autoFight||p.pendingSkill||p.stun>this.time||p.hitstopUntil>this.time)return false;
  const value=Number(cmd.value);
  if(cmd.slot==='weapon'&&Number.isInteger(value)&&value>=-1&&value<WEAPONS.length){
   p.weapon=value;const id=value<0?4000:4001+value;this.learn(p,id);const weights=p.phaseWeights[skillPhase(skillById(id))];
   if(weights[id]>0||phaseSkillCount(weights)<MAX_PHASE_SKILLS)weights[id]=weights[id]||1;
   else this.notice(p,'新しい得物の技は、意識から入れ替えよう');
  }else if(cmd.slot==='armor'&&Number.isInteger(value)&&value>=0&&value<=2)p.armor=value;
  else if(cmd.slot==='shield'&&typeof cmd.value==='boolean')p.shield=cmd.value;
  else return false;
  this.emit('equipped',{player:p.id,room:r.id,slot:cmd.slot,x:p.x,z:p.z});return true;
 }
 impact(source,target,part='torso',heavy=false){
  const pause=heavy?.18:.115;
  for(const q of [source,target])if(q?.alive){q.hitstopUntil=Math.max(q.hitstopUntil||0,this.time+pause);q.lastImpactAt=this.time;}
  if(target?.hitReactAt!==undefined)target.hitReactAt=this.time-.085;
 }
 tickHitStop(p,dt){
  const remain=(p.hitstopUntil||0)-(this.time-dt);if(remain<=0)return false;const pause=Math.min(dt,remain);
  for(const k of ['actionStarted','actionUntil','cooldown','stun','hitReactAt','hitReactUntil','hitUntil','retreatUntil'])if(Number.isFinite(p[k])&&p[k]>0)p[k]+=pause;
  if(p.pendingSkill){p.pendingSkill.started+=pause;p.pendingSkill.at+=pause;}
  if(p.combo?.awaitUntil)p.combo.awaitUntil+=pause;
  if(p.chain)p.chain.start+=pause;
  if(p.attackStep){p.attackStep.started+=pause;p.attackStep.until+=pause;}
  if(p.telegraph){p.telegraph.at+=pause;p.telegraph.started+=pause;}
  return true;
 }
 setSeated(p,active){
  if(p.age<4||p.hitstopUntil>this.time||p.stun>this.time||hasStatus(p,'sleep',this.time))return false;
  const next=typeof active==='boolean'?active:!p.seated;
  p.seated=next;p.sitSince=this.time;this.stopDash(p);this.stopActivity(p);p.autoFight=null;p.autoSuppressedUntil=this.time+1;
  p.input={x:0,z:0};p.guard=false;p.guardPending=false;p.combo=null;p.pendingSkill=null;p.chain=null;p.attackStep=null;p.retreatUntil=0;p.attackBufferedUntil=0;
  p.action=next?'sit':'idle';p.actionStarted=this.time;p.actionUntil=this.time;
  this.emit('sit',{player:p.id,room:p.room,x:p.x,z:p.z,active:next});return true;
 }
 interrupt(){return false;}
 detectContact(p,r){
  if(!canAct(p)||p.rescueTarget||p.traversal||p.age<4||p.prologue||p.activity||p.autoFight||p.seated||p.guard||p.guardPending||(p.autoSuppressedUntil||0)>this.time)return;
  const target=r.actors.filter(e=>e.alive&&(enemiesOnly(e)||e.kind==='dummy')&&(!e.neutral||e.aggro)&&dist(e,p)<=this.collisionRadius(p)+this.collisionRadius(e)+.55).sort((a,b)=>dist(a,p)-dist(b,p))[0];
  if(target){this.stopDash(p);p.autoFight=target.id;p.autoRestUntil=0;target.aggro=true;this.emit('engage',{player:p.id,room:r.id,target:target.id,x:p.x,z:p.z});}
 }
 tickAutoCombat(p,r,dt){
  if(!canAct(p)||p.rescueTarget||p.traversal||!p.autoFight){p.autoSkill=null;return;}
  const target=r.actors.find(e=>e.id===p.autoFight),l=Math.hypot(p.input.x,p.input.z);
  const away=target?((p.x-target.x)*p.input.x+(p.z-target.z)*p.input.z)/Math.max(.001,dist(p,target)):0;
  if(!target?.alive||dist(p,target)>4.6||p.seated||away>.2&&l>.15){p.autoFight=null;p.autoSkill=null;p.autoSuppressedUntil=this.time+.8;return;}
  if(p.stun>this.time||hasStatus(p,'sleep',this.time)||hasStatus(p,'stun',this.time)||p.guard||p.guardPending)return;
  // A technique owns its follow-through and withdrawal; chasing must wait.
  if(p.combo){p.comboQueued=true;return;}
  if(p.pendingSkill||p.chain||p.cooldown>this.time||p.autoRestUntil>this.time)return;
  let sk=p.autoSkill?.target===target.id?skillById(p.autoSkill.id):null;
  if(!sk||!p.skills.includes(sk.id)||!(p.phaseWeights[0][sk.id]>0)||skillPhase(sk)!==0||skillRestriction(p,sk)||sk.cost>p.stamina){sk=this.chooseSkill(p,0);p.autoSkill=sk?{id:sk.id,target:target.id}:null;}
  if(!sk){p.autoRestUntil=this.time+.8;return;}
  if(l<.1){
   p.dir=Math.atan2(target.x-p.x,target.z-p.z);
   const approach=sk.approach?sk.approach.distance*Math.cos(sk.approach.angle):this.attackStepDistance(p,sk);
   const gap=Math.max(this.contactSpacing(p,target)+.10,Math.min(3.8,sk.reach*.82+approach));
   if(dist(p,target)>gap+.08&&!hasStatus(p,'root',this.time)){
    const amount=Math.min(dist(p,target)-gap,dt*4.8*injuryModifiers(p).move*(hasStatus(p,'slow',this.time)?.5:1));
    const moved=this.moveAttackStep(p,r,Math.sin(p.dir)*amount,Math.cos(p.dir)*amount);
    if(moved>.001){p.action='run';p.actionUntil=this.time+dt*2;}return;
   }
  }
  p.combo={band:0,repeats:0,total:0,awaitUntil:0};p.comboQueued=true;
  p.autoSkill=null;if(!this.beginComboStrike(p,sk.id)){p.combo=null;p.autoRestUntil=this.time+.8;}
 }
 tickChain(p){
  const c=p.chain;
  if(c&&p.alive&&p.combo&&p.stun<=this.time){
   const sk=SkillSystem.active(p,c.id),r=this.getRoom(p);
   while(c.next<c.count&&this.time>=c.start+(c.offsets?c.offsets[c.next]:c.next*c.interval)){
    const step=this.attackStepDistance(p,sk)/c.count;if(step>0)this.moveAttackStep(p,r,Math.sin(p.dir)*step,Math.cos(p.dir)*step);
    const index=c.next++;this.performStrike(p,r,sk);this.emit('skillbeat',{player:p.id,room:r.id,id:sk.id,index,x:p.x,z:p.z,dir:p.dir});
    if(!p.chain||p.stun>this.time||p.hitstopUntil>this.time||!p.alive)break;
   }
   if(c.next>=c.count){p.chain=null;if(sk.finishStep?.distance&&p.stun<=this.time&&canAct(p)&&!hasStatus(p,'root',this.time)){
    p.attackStep={finishing:true,started:this.time+.04,until:p.actionUntil,distance:sk.finishStep.distance*injuryModifiers(p).move*(p.age<15?.8:1),progress:0,moved:0,dir:p.dir+sk.finishStep.angle,blocked:false,sounded:false};
   }}
  }
  if(p.exitPending&&p.action==='attack'&&this.time>=p.actionUntil-.07){
   const distance=p.exitPending;p.exitPending=0;p.retreatUntil=this.time+.24;p.retreatSpeed=distance/.24;
  }
 }
 applyStatus(target,id,duration,source,r){
  if(!canAct(target)||!STATUS_DEFS[id]||!Number.isFinite(duration)||duration<=0)return false;
  target.statuses??={};const durationScale=target.kind==='boss'?.35:target.elite?.65:1;
  const until=this.time+clamp(duration*durationScale,.2,9),old=target.statuses[id];
  target.statuses[id]={until:Math.max(until,old?.until||0),nextTick:old?.nextTick??this.time+1,source:source?.id||null};
  target.statusClock=this.time;
  if(id==='stun'||id==='sleep'){
   target.telegraph=null;target.pendingSkill=null;target.chain=null;target.attackStep=null;target.combo=null;target.comboQueued=false;target.retreatUntil=0;target.exitPending=0;target.guard=false;target.guardPending=false;target.seated=false;
   target.action=id==='sleep'?'sleep':'stagger';target.actionStarted=this.time;target.actionUntil=until;
   if(id==='stun')target.stun=Math.max(target.stun||0,until);else target.sleepUntil=until;
  }
  this.emit('status',{room:r.id,target:target.id,player:source?.kind==='player'?source.id:undefined,status:id,x:target.x,z:target.z});return true;
 }
 tickStatuses(a,r,dt){
  a.statuses??={};a.statusClock=this.time;
  for(const [id,status] of Object.entries(a.statuses)){
   if(!STATUS_DEFS[id]||status.until<=this.time){delete a.statuses[id];if(id==='sleep')a.sleepUntil=0;continue;}
   if(!incapacitated(a)&&['poison','burn','bleed'].includes(id)&&status.nextTick<=this.time){
    status.nextTick=this.time+1;const damage=id==='burn'?5:id==='poison'?4:3;
    if(a.kind==='player'){a.health=Math.max(0,(a.health??100)-damage);a.lastHurtAt=this.time;if(a.health===0){this.downPlayer(a,STATUS_DEFS[id].name);return;}}
    else if(a.kind!=='dummy'){a.hp=(a.hp??70)-damage;this.recordDamage(a,'torso',damage/9,false);if(a.hp<=0){const owner=this.players.get(status.source)||r.actors.find(e=>e.id===status.source);this.killActor(a,owner,r);return;}}
   }
  }
 }

 getArea(p){if(this.getRoom(p)?.kind!=='village')return'front';return villageActivityAt(this.getRoom(p).map,p)?.id||(onShipDeck(p)?'ship':'village');}
 notice(p,text){if((p.lastNotice??-10)+.8>this.time)return;p.lastNotice=this.time;this.emit('notice',{player:p.id,room:p.room,text});}
 learn(p,id){
  const sk=skillById(id);if(!sk)return false;const list=sk.passive?p.passives:p.skills;if(list.includes(id))return false;list.push(id);
  if(!sk.passive){for(let band=0;band<3;band++)p.phaseWeights[band][id]=0; // New discoveries never silently overwrite the player's strategy.
   p.weights=p.phaseWeights[0];}
  this.emit(sk.passive?'passive':'insight',{player:p.id,room:p.room,id,x:p.x,z:p.z});if(id===4020)this.learn(p,4050);return true;
 }
 progressDeed(p,key,amount){p.deeds[key]=(p.deeds[key]||0)+amount;}
 tryInsight(p,trigger){if(p.age>=4)this.progressDeed(p,trigger,1);}
 spend(p,cost,fatigue=0){
  if(!Number.isFinite(cost)||cost<0||p.stamina+.0001<cost)return false;
  // Tie fatigue to actual exertion, including per-frame running and cost discounts.
  p.staminaCap=Math.max(STAMINA.minCap,p.staminaCap-Math.max(0,fatigue,cost*STAMINA.fatiguePerCost));p.stamina=Math.min(p.staminaCap,p.stamina-cost);p.lastExertion=this.time;
  if(p.age>=4&&(p.autoFight||this.getRoom(p)?.actors.some(e=>e.alive&&dist(e,p)<4&&e.kind==='dummy'))){p.enduranceXP=(p.enduranceXP||0)+cost*.32;}
  return true;
 }
 command(id,cmd){
  const p=this.players.get(id);if(!p||!cmd||typeof cmd.type!=='string')return false;
  if(cmd.type==='choose-legacy')return this.chooseLegacy(p,cmd.skill);
  if(!canAct(p))return false;const r=this.getRoom(p);
  if(p.traversal&&!['weights','skill-read','cancel-buffer'].includes(cmd.type))return false;
  if(cmd.type==='rescue')return this.startRescue(p,this.entity(r,cmd.target));
  if(cmd.type==='treatment'){if(!atClinic(p,r))return false;return this.command(id,{type:'sit',active:!p.seated});}
  if(cmd.type==='rescue-drop')return this.releaseRescue(p);
  if(p.rescueTarget&&!['move','chat','weights','skill-read','cancel-buffer'].includes(cmd.type))return false;
  this.preparePlayer(p);
  if(cmd.type==='bind'||cmd.type==='interrupt'||cmd.type==='guard')return false;
  if(cmd.type==='equip')return this.equip(p,cmd);
  if(cmd.type==='leaveIntro')return this.releaseFromParent(p);
  if(cmd.type==='gift'){
   if(!p.prologue||!p.giftOffer?.includes(cmd.item))return false;
   if(!this.receiveItem(p,cmd.item,{gift:true}))return false;p.giftOffer=p.giftOffer.filter(i=>i!==cmd.item);return true;
  }
  if(cmd.type==='talk'){
   this.wake(p);this.stopDash(p);p.input={x:0,z:0};
   if(p.prologue){const topic=motherTopic(p,r),lines=MOTHER_LINES[topic]||MOTHER_LINES.cradle;this.motherSay(p,lines[(p.motherIndex++)%lines.length]);p.motherNextAt=this.time+8;}
   return true;
  }
  if(cmd.type==='dash'){
   const x=Number(cmd.x),z=Number(cmd.z),n=Math.hypot(x,z);
   if(!Number.isFinite(n)||n<.05||(!p.prologue&&p.age<4)||p.stamina<DASH.start||p.stun>this.time||hasStatus(p,'root',this.time)||hasStatus(p,'sleep',this.time))return false;
   this.wake(p);this.stopActivity(p);p.dash={x:x/n,z:z/n,started:this.time,blocked:0};p.input={x:x/n,z:z/n};p.lastInput=this.time;
   this.emit('dash',{player:p.id,room:r.id,x:p.x,z:p.z,dir:Math.atan2(x,z)});return true;
  }
  if(cmd.type==='sit')return this.setSeated(p,cmd.active);
  if(cmd.type==='move'){
   const x=+cmd.x,z=+cmd.z;if(!Number.isFinite(x)||!Number.isFinite(z))return false;
   this.stopDash(p);const l=Math.hypot(x,z);p.lastInput=this.time;
   p.input={x:x/Math.max(1,l),z:z/Math.max(1,l)};
   if(l>.1){this.stopActivity(p);this.wake(p);}return true;
  }
  if(cmd.type==='cancel-buffer'){p.attackBufferedUntil=0;return true;}
  if(cmd.type==='skill-read'){p.skillLife.unread=[];return true;}
  if(cmd.type==='weights'){
   const phase=clamp(Math.trunc(+cmd.phase||0),0,2),weights=v3Weights(p.skills,cmd.weights);
   for(const key of Object.keys(weights))if(skillPhase(skillById(key))!==phase)weights[key]=0;
   if(phaseSkillCount(weights)>MAX_PHASE_SKILLS){this.notice(p,'ひとつの段に込める技は、五つまで');return false;}
   p.phaseWeights[phase]=weights;p.weights=p.phaseWeights[0];return true;
  }
  if(cmd.type==='chat'){const text=cleanText(cmd.text,60);if(!text||this.time-p.lastChat<2.5)return false;this.wake(p);this.stopDash(p);p.input={x:0,z:0};p.speech=text;p.speechUntil=this.time+6;p.lastChat=this.time;this.emit('speech',{player:id,room:r.id,text,x:p.x,z:p.z});return true;}
  // Boarding is physical: a stale reservation command cannot board from shore.
  if(cmd.type==='board')return false;
  if(cmd.type==='return'){if(r.kind!=='front'||p.rescueAt)return false;p.rescueAt=this.time+this.yearSeconds;this.emit('rescue',{player:id,room:r.id,x:p.x,z:p.z});return true;}
  if(cmd.type==='discard'){
   const slot=Number.isInteger(cmd.slot)?cmd.slot:0;if(slot<0||slot>=p.inventory.length)return false;
   p.inventory.splice(slot,1);p.trinket=p.inventory[0]||null;return true;
  }
  if(cmd.type==='pickup'){
   if(r.kind!=='village'||p.prologue)return false;
   const item=r.items.find(i=>i.id===cmd.id&&this.time>=i.ready&&dist(i,p)<3.5);if(!item)return false;
   if(!this.receiveItem(p,item.item))return false;item.ready=this.time+this.yearSeconds*2;return true;
  }
  if(p.age<4||p.prologue)return false;
  if(cmd.type==='activity'){
   const station=nearbyActivity(p,r),definition=ACTIVITY_DEFS[station?.id];
   if(!definition||definition.id!==cmd.activity)return false;
   if(p.activity===definition.id){this.stopActivity(p);p.action='idle';return true;}
   if(r.actors.some(e=>e.alive&&enemiesOnly(e)&&!e.neutral&&dist(p,e)<3.5))return false;
   this.wake(p);this.stopDash(p);p.autoFight=null;p.autoSuppressedUntil=this.time+1;
   p.combo=null;p.pendingSkill=null;p.chain=null;p.attackStep=null;p.retreatUntil=0;p.attackBufferedUntil=0;p.input={x:0,z:0};
   const equipment=facilityStation(station);p.dir=Math.atan2(equipment.x-p.x,equipment.z-p.z);
   p.activity=definition.id;p.activitySince=this.time;p.activityClock=0;p.activityNextAt=this.time+.8;p.lastActivityLine=-1;
   p.action=definition.motion;p.actionStarted=this.time;p.actionUntil=this.time;p.cooldown=this.time;return true;
  }
  if(cmd.type==='guard'){
   if(!cmd.active){p.guard=false;p.guardPending=false;return true;}
   p.attackBufferedUntil=0;
   p.seated=false;if(!injuryModifiers(p).guard)return false;
   if(p.stun>this.time||p.cooldown>this.time||p.pendingSkill||p.combo){p.guardPending=true;return true;}
   if(p.stamina<4)return false;
   if(!p.guard){p.guardStart=this.time;this.tryInsight(p,'guard');}p.guard=true;p.activity=null;return true;
  }
  if(cmd.type==='attack'||cmd.type==='skill'){
   if(p.stun>this.time||p.hitstopUntil>this.time||hasStatus(p,'sleep',this.time)||hasStatus(p,'stun',this.time))return false;p.activity=null;p.seated=false;
   if(p.combo){if(this.time-p.lastTap<.15)return false;p.lastTap=this.time;p.comboQueued=true;return true;}
   if(p.cooldown>this.time){if(p.cooldown-this.time<=ACTION_TUNING.buffer){p.attackBufferedUntil=p.cooldown+ACTION_TUNING.buffer;return true;}return false;}
   p.attackBufferedUntil=0;
   p.combo={band:0,repeats:0,total:0,awaitUntil:0};p.lastTap=this.time;p.comboQueued=false;
   if(!this.beginComboStrike(p)){p.combo=null;return false;}return true;
  }
  if(cmd.type==='epilogue'&&r.bossDefeated){return this.command(id,{type:'return'});}
  return false;
 }
 chooseSkill(p,band){
  const raw=p.phaseWeights[band],available=p.skills.map(skillById).filter(s=>s&&!s.passive&&skillPhase(s)===band&&!skillRestriction(p,s)&&s.cost<=p.stamina&&(raw[s.id]||0)>0);
  if(!available.length)return null;
  return weightedChoice(available,available.map(s=>raw[s.id]*(s.chance||1)),this.rng);
 }
 // One paid strike owns one short step. Ranged/support/retreat arts keep their footing.
 attackStepDistance(p,sk){
  if(hasStatus(p,'root',this.time)||sk.lure||sk.ranged||sk.magic||sk.retreat||sk.counter||sk.ward||sk.area||!sk.reach||sk.id===4021)return 0;
  const base=sk.travel??(sk.id===4000?.36:.48);
  return base*injuryModifiers(p).move*(p.age<15?.8:1);
 }
 collisionRadius(a){return a.kind==='player'?.42:a.kind==='dummy'?.40:a.kind==='boss'?1.35:a.elite?1.05:['maw','stag'].includes(a.kind)?.65:.44;}
 contactSpacing(a,b){
  const combatPair=(a.kind==='player'&&b.kind!=='player'&&enemiesOnly(b))||(b.kind==='player'&&a.kind!=='player'&&enemiesOnly(a));
  return this.collisionRadius(a)+this.collisionRadius(b)+(combatPair?.18:0);
 }
 moveAttackStep(p,r,dx,dz,slide=false){
  // Small swept substeps retain the existing scenery and body collision hulls.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.045)),sx=dx/steps,sz=dz/steps;
  // Cull against the entire short sweep once, then use squared distances.
  // Enemy approach shares this path; do not scan the room at every substep.
  const bodies=[],addBody=a=>{if(a===p||!a.alive||a.carrierId||a.id===p.rescueTarget||(a.kind==='player'&&a.room!==r.id))return;const radius=this.contactSpacing(p,a);if(Math.abs(a.x-p.x)<=radius+Math.abs(dx)&&Math.abs(a.z-p.z)<=radius+Math.abs(dz))bodies.push({a,radius2:radius*radius});};
  for(const a of r.actors)addBody(a);for(const a of this.players.values())addBody(a);
  const bounded={x:0,z:0,kind:p.kind,age:p.age,prologue:p.prologue,rescueTarget:p.rescueTarget,supportHeight:p.supportHeight||0},bodyRadius=this.collisionRadius(p);
  const sceneryBlocked=q=>{
   const floor=supportHeight(r.map,q.x,q.z),from=p.supportHeight||0;
   if(Math.abs(floor-from)>TRAVERSAL_RULES.walkStep)return true;
   // Preserve current contact spacing while rejecting unsupported retaining-wall edges.
   if(terrainFootprint(r.map,p.x,p.z)&&from>TRAVERSAL_RULES.walkStep&&!stairAt(r.map,p.x,p.z)&&!stairAt(r.map,q.x,q.z)){
    for(const [x,z] of [[-bodyRadius,0],[bodyRadius,0],[0,-bodyRadius],[0,bodyRadius]])if(supportHeight(r.map,q.x+x,q.z+z)<from-TRAVERSAL_RULES.walkStep)return true;
   }
   q.supportHeight=floor;bounded.x=q.x;bounded.z=q.z;bounded.supportHeight=floor;this.bound(bounded,r,bodyRadius);return Math.hypot(bounded.x-q.x,bounded.z-q.z)>1e-6;
  };
  const bodyBlocked=q=>bodies.some(({a,radius2})=>{const after=(a.x-q.x)**2+(a.z-q.z)**2;return after<radius2&&after<(a.x-p.x)**2+(a.z-p.z)**2-1e-7;});
  let travelled=0;
  for(let i=0;i<steps;i++){
   let q={x:p.x+sx,z:p.z+sz,supportHeight:p.supportHeight||0};
   if(sceneryBlocked(q)){
    if(!slide)break;
    // Only locomotion slides; attack lunge and retreat keep their stop-on-contact behavior.
    const axes=Math.abs(sx)>Math.abs(sz)?[[sx,0],[0,sz]]:[[0,sz],[sx,0]];
    q=axes.filter(([x,z])=>Math.hypot(x,z)>1e-8).map(([x,z])=>({x:p.x+x,z:p.z+z,supportHeight:p.supportHeight||0})).find(a=>!sceneryBlocked(a)&&!bodyBlocked(a));
    if(!q)break;
   }else if(bodyBlocked(q))break;
   travelled+=Math.hypot(q.x-p.x,q.z-p.z);p.x=q.x;p.z=q.z;if(q.supportHeight||p.supportHeight!=null)p.supportHeight=q.supportHeight;
  }
  return travelled;
 }
 moveWalk(p,r,dx,dz){if(this.tryTraversal(p,r,dx,dz))return Math.hypot(dx,dz);const moved=this.moveAttackStep(p,r,dx,dz,true);if(p.kind==='player'&&!p.traversal){p.supportHeight=supportHeight(r.map,p.x,p.z);p.grounded=true;}return moved;}
 tickCarriedMove(p,r,dt){
  if(p.dash){
   if(p.stamina<.4||p.stun>this.time||hasStatus(p,'root',this.time)||hasStatus(p,'sleep',this.time)){this.stopDash(p);p.input={x:0,z:0};}
   else{p.input={x:p.dash.x,z:p.dash.z};p.lastInput=this.time;this.spend(p,Math.min(p.stamina,DASH.cost*dt),0);}
  }else if(this.time-p.lastInput>1.5)p.input={x:0,z:0};
  const l=Math.hypot(p.input.x,p.input.z),speed=3.8*ACTION_TUNING.move*(p.dash?DASH.speed:1);
  const moved=l>.001?this.moveWalk(p,r,p.input.x*speed*dt,p.input.z*speed*dt):0;
  if(l>.1)p.dir=Math.atan2(p.input.x,p.input.z);
  if(p.dash){p.dash.blocked=moved<.002?(p.dash.blocked||0)+dt:0;if(p.dash.blocked>.18){this.stopDash(p);p.input={x:0,z:0};}}
  p.action=moved>1e-6?(p.dash?'dash':'run'):'idle';p.zone=this.getArea(p);this.bound(p,r);
 }
 tickAttackStep(p){
  const a=p.attackStep;if(!a||!canAct(p)||(!p.pendingSkill&&!(a.finishing&&p.action==='attack'))||p.stun>this.time)return;if(hasStatus(p,'root',this.time)){p.attackStep=null;return;}
  const u=clamp((this.time-a.started)/Math.max(.001,a.until-a.started),0,1),progress=1-(1-u)**2;
  const amount=Math.max(0,(progress-a.progress)*a.distance);a.progress=progress;
  if(!amount||a.blocked)return;
  const moved=this.moveAttackStep(p,this.getRoom(p),Math.sin(a.dir)*amount,Math.cos(a.dir)*amount);
  a.moved+=moved;if(moved<amount-.00001)a.blocked=true;
  if(a.aimTarget&&moved>0){const target=this.getRoom(p).actors.find(e=>e.id===a.aimTarget&&e.alive);if(target)p.dir=a.aimFrom+clamp(angleDiff(Math.atan2(target.x-p.x,target.z-p.z),a.aimFrom),-a.turn,a.turn)*progress;}
  if(!a.sounded&&moved>.001){a.sounded=true;this.emit('step',{player:p.id,room:p.room,x:p.x,z:p.z,kind:'lunge'});}
 }
 reactToHit(target,source,part,severity='light',strength=null,blocked=false){
  const duration=blocked?.28:severity==='lost'?.95:severity==='heavy'?.72:.48;
  // Reaction metadata; repeated wound resolution for one contact shares an ID.
  const fresh=target.hitMotionAt!==this.time;
  if(fresh)target.hitMotionId=(target.hitMotionId||0)+1;
  target.hitMotionAt=this.time;target.hitGuard=blocked;
  if(strength!==null||fresh)target.hitStrength=strength??(severity==='lost'?1.15:severity==='heavy'?1:.48);
  target.hitPart=part;target.hitSeverity=severity;target.hitReactAt=this.time;target.hitReactUntil=this.time+duration;
  target.hitDir=source?Math.atan2(target.x-source.x,target.z-source.z):(target.dir||0)+Math.PI;
  // A bounded, authoritative catch step. Repeated contacts replace the remaining
  // travel, never accumulate an impulse or extend the combat action clocks.
  if(fresh&&target.kind==='player'){
   target.hitRecoil=null;
   if(source&&canAct(target)&&!target.prologue&&!target.traversal&&!hasStatus(target,'root',this.time)){
    const length=blocked?.025:clamp(.08+(target.hitStrength-.6)*.40,.035,.24);
    target.hitRecoil={id:target.hitMotionId,room:target.room,dir:target.hitDir,length,age:0,duration:.20,progress:0,x:0,z:0,lastX:target.x,lastZ:target.z};
   }
  }
 }
 tickHitRecoil(p,r,dt){
  const a=p.hitRecoil;if(!a)return;
  if(!canAct(p)||p.prologue||p.traversal||p.seated||p.activity||p.rescueTarget||a.room!==r.id||a.id!==p.hitMotionId||hasStatus(p,'root',this.time)||Math.hypot(p.x-a.lastX,p.z-a.lastZ)>1.5){p.hitRecoil=null;return;}
  if(a.age<a.duration){
   a.age=Math.min(a.duration,a.age+dt);const u=a.age/a.duration,progress=1-(1-u)**3,amount=(progress-a.progress)*a.length;a.progress=progress;
   const x=p.x,z=p.z,moved=this.moveAttackStep(p,r,Math.sin(a.dir)*amount,Math.cos(a.dir)*amount);
   a.x+=p.x-x;a.z+=p.z-z;
   if(moved<amount-1e-6)a.age=a.duration;
   p.supportHeight=supportHeight(r.map,p.x,p.z);
  }
  a.lastX=p.x;a.lastZ=p.z;
  // Retain the completed displacement through recovery for the planted feet.
  if(this.time>p.hitReactUntil+.25)p.hitRecoil=null;
 }
 beginComboStrike(p,forcedId=null){
  let sk=forcedId===null?this.chooseSkill(p,p.combo.band):skillById(forcedId);if(sk&&(skillPhase(sk)!==p.combo.band||!p.skills.includes(sk.id)||skillRestriction(p,sk)))return false;if(!sk){this.notice(p,PHASES[p.combo.band]+'の技が出せない');return false;}
  if(p.wounds.rightArm?.severity==='lost'&&p.wounds.leftArm?.severity==='lost'&&!sk.magic&&!sk.retreat)return false;
  sk=SkillSystem.prepareCast(this,p,sk);
  if(!this.spend(p,sk.cost*(sk.school==='heavy'?1-effectsOf(p,'heavyCost'):1),sk.fatigue)){SkillSystem.reset(p);return false;}
  if(sk.resource)p.ammo[sk.resource]-=sk.amount||1;
  if(sk.coolYears)p.skillReady[sk.id]=p.age+p.ageFraction+sk.coolYears;
  if(sk.sacrifice){p.lifespan-=sk.sacrifice;p.permanentFatigue+=12;if(p.age+p.ageFraction>=p.lifespan){this.die(p,'禁術に命を捧げた');return true;}}
  p.skillUses[sk.id]=(p.skillUses[sk.id]||0)+1;p.lastSkillAt=this.time;p.seated=false;p.chain=null;p.guard=false;p.guardPending=false;p.usages.attack++;p.combo.total++;
  this.tryInsight(p,'attack');
  const r=this.getRoom(p),target=r.actors.filter(e=>e.alive&&enemiesOnly(e)&&(!e.neutral||e.aggro||dist(e,p)<sk.reach+.5)&&dist(e,p)<Math.max(5,sk.reach+1)).sort((a,b)=>dist(a,p)-dist(b,p))[0];
  const dummies=r.actors.filter(e=>e.kind==='dummy'&&e.alive&&dist(e,p)<4).sort((a,b)=>dist(a,p)-dist(b,p)),dummy=dummies.find(e=>e.id===p.autoFight)||dummies[0];
  const facing=target||dummy;if(facing){p.focusTarget=facing.id;p.focusUntil=this.time+4;}if(facing&&!p.flickAim)p.dir=Math.atan2(facing.x-p.x,facing.z-p.z);
  p.flickAim=false;const stepDistance=this.attackStepDistance(p,sk)/Math.max(1,sk.hits||1),timing=actionTiming(sk);
  const approach=sk.approach,approachDistance=approach?(hasStatus(p,'root',this.time)?0:approach.distance*injuryModifiers(p).move*(p.age<15?.8:1)):stepDistance;
  p.attackStep=approachDistance?{started:this.time+Math.max(0,timing.charge-(approach?clamp(approachDistance/6,.16,.34):.12)),until:this.time+Math.max(.001,timing.charge),distance:approachDistance,progress:0,moved:0,dir:p.dir+(approach?.angle||0),aimFrom:p.dir,aimTarget:approach?.turn?facing?.id:null,turn:approach?.turn||0,blocked:false,sounded:false}:null;
  p.pendingSkill={id:sk.id,target:facing?.id||null,started:this.time,at:this.time+timing.charge,dir:p.dir,stage:'charge'};p.action='charge';p.motion=sk.form;p.actionStarted=this.time;p.actionUntil=this.time+timing.charge;p.attackSkill=sk.id;p.attackReach=sk.reach;p.attackArc=sk.arc;
  this.emit('charge',{player:p.id,room:p.room,id:sk.id,duration:timing.charge,x:p.x,z:p.z});
  if(timing.charge===0)this.releaseSkill(p);return true;
 }
 releaseSkill(p){
  if(!p.pendingSkill||!p.alive)return;this.tickAttackStep(p);const sk=SkillSystem.active(p,p.pendingSkill.id);p.pendingSkill=null;
  if(!sk||(sk.requires||[]).some(part=>p.wounds[part]?.severity==='lost')){this.finishCombo(p);return;}
  const target=p.skillCast?.linked?this.getRoom(p).actors.find(e=>e.id===p.skillCast.target&&e.alive):null;
  if(target&&sk.tracking){const turn=clamp(angleDiff(Math.atan2(target.x-p.x,target.z-p.z),p.dir),-sk.tracking,sk.tracking);p.dir+=turn;}
  const timing=actionTiming(sk);p.action='attack';p.actionStarted=this.time;p.actionUntil=this.time+timing.swing;p.currentSkill=sk.id;
  if(p.combo)p.combo.awaitUntil=this.time+timing.swing+ACTION_TUNING.comboGrace;
  this.emit('skill',{player:p.id,room:p.room,id:sk.id,x:p.x,z:p.z,dir:p.dir});
  const hits=sk.hits||1;
  // Contact occurs at the visible impact pose, never at the start of the swing.
  p.chain={id:sk.id,target:p.focusTarget,start:this.time+timing.swing/hits*.43,interval:timing.swing/hits,next:0,count:hits};
  if(sk.beatCuts){p.chain.start=this.time;p.chain.offsets=sk.beatCuts.slice(0,-1).map((v,i)=>(v+(sk.beatCuts[i+1]-v)*.43)*timing.swing);}
  p.comboQueued=!!p.autoFight||p.comboQueued;if(sk.exit)p.exitPending=sk.exit;
 }
 finishCombo(p){
  const sk=SkillSystem.active(p,p.currentSkill)||book.get(4000);SkillSystem.reset(p);p.attackStep=null;p.chain=null;p.combo=null;p.comboQueued=false;p.pendingSkill=null;p.exitPending=0;p.cooldown=Math.max(p.cooldown,this.time+actionTiming(sk).recovery);p.action='recover';p.actionStarted=this.time;p.actionUntil=p.cooldown;
  this.emit('recovery',{player:p.id,room:p.room,x:p.x,z:p.z});
 }
 resolveClash(a,b,r){
  if(a.clashUntil>this.time||b.clashUntil>this.time)return;
  const child=outmatchedChild(a,b)?a:outmatchedChild(b,a)?b:null;
  if(child){const enemy=child===a?b:a;child.pendingSkill=null;child.chain=null;child.combo=null;return;}
  const physique=p=>p.kind==='player'?([1, .9, 1.32, .86, .76, 1.35,1.08,1.1][p.race]||1)*combatMaturity(p):p.bodyScale||1;
  const strength=p=>physique(p)+Math.min(.4,(p.experience||0)*.014)+effectsOf(p,'clash')+(p.kind==='boss'?.9:0)+(p.elite?.22:0);
  const chance=clamp(.5+(strength(a)-strength(b))*.30,.12,.88),winner=this.rng()<chance?a:b,loser=winner===a?b:a;
  for(const p of [a,b]){p.attackStep=null;p.chain=null;p.telegraph=null;p.pendingSkill=null;p.comboQueued=false;p.action='clash';p.actionStarted=this.time;p.actionUntil=this.time+.7;p.stun=this.time+.7;p.clashUntil=this.time+.7;p.clashWith=p===a?b.id:a.id;p.experience=(p.experience||0)+1;if(p.kind==='player'){p.clashes++;p.combo=null;}}
  r.clashResult??=[];r.clashResult.push({at:this.time+.7,winner:winner.id,loser:loser.id});
  this.emit('clash',{room:r.id,player:a.kind==='player'?a.id:b.kind==='player'?b.id:undefined,x:(a.x+b.x)/2,z:(a.z+b.z)/2,winner:winner.id});
 }
 performStrike(p,r,sk){
  if(!canAct(p)||p.rescueTarget||p.traversal)return;
  if(sk.lure){this.performLure(p,r);return;}
  const retreat=sk.retreat;
  if(sk.miracle&&this.rng()>=miracleChance(p,sk)){this.emit('miracleQuiet',{player:p.id,room:r.id,x:p.x,z:p.z,text:'祈りは、静かにほどけた。'});return;}
  if(sk.selfCost){p.health=Math.max(1,(p.health??100)-sk.selfCost);p.lastHurtAt=this.time;}
  if(retreat){const swing=actionTiming(sk).swing;p.retreatUntil=this.time+swing;p.retreatSpeed=retreat/swing;p.guard=sk.id===4011&&injuryModifiers(p).guard;return;}
  if(sk.counter){p.counterUntil=this.time+2.8;p.guard=injuryModifiers(p).guard;return;}
  if(sk.ward){this.emit('blessing',{player:p.id,room:r.id,x:p.x,z:p.z});for(const q of this.players.values())if(q.alive&&q.room===r.id&&dist(q,p)<7){q.wardUntil=this.time+7;q.wardCharges=3;}return;}
  if(sk.area){r.fields??=[];r.fields.push({type:sk.area,x:p.x+(sk.area==='fire'?Math.sin(p.dir)*3:0),z:p.z+(sk.area==='fire'?Math.cos(p.dir)*3:0),dir:p.dir,until:this.time+(sk.area==='fire'?5:sk.area==='sleep'?5:1.3),owner:p.id});}
  if(sk.area==='eclipse')this.emit('eclipse',{room:r.id,player:p.id,x:p.x,z:p.z});
  const potential=r.actors.filter(e=>e.alive&&(enemiesOnly(e)||e.kind==='dummy')&&dist(e,p)<sk.reach+.4).sort((a,b)=>dist(a,p)-dist(b,p));let count=0;
  for(const e of potential){
   if(!this.clearPath(p,e,r)||Math.abs(angleDiff(Math.atan2(e.x-p.x,e.z-p.z),p.dir))>sk.arc/2&&!['sleep','eclipse','ring'].includes(sk.area))continue;
   if(count++>=(sk.maxTargets||1))break;
   if(e.kind==='dummy'){e.action='hit';e.actionStarted=this.time;e.actionUntil=this.time+.5;this.reactToHit(e,p,sk.targets[0]);this.impact(p,e,sk.targets[0],sk.power>=2);this.emit('hit',{room:r.id,target:e.id,source:p.id,x:e.x,z:e.z,kind:'practice',part:sk.targets[0],weapon:p.weapon,skill:sk.id});SkillSystem.contact(this,p,e,sk);continue;}
   e.aggro=true;
   if(sk.area==='sleep'){e.sleepUntil=this.time+(e.elite||e.kind==='boss'?1.4:5.5);e.telegraph=null;continue;}
   if(sk.humanoidOnly&&!e.humanoid){this.notice(p,'足払いはこの姿には通じない。');continue;}
   if(sk.status&&sk.power===0)this.applyStatus(e,sk.status.id,sk.status.duration,p,r);
   if(sk.breakPower){const resistance=e.kind==='boss'?2.8:e.elite?1.65:1,success=sk.breakPower>=resistance&&(sk.id!==4010||this.rng()<.8);
    if(success){e.stun=this.time+(sk.breakPower>=3?2.2:1.55);e.exposedUntil=e.stun+.8;e.telegraph=null;e.action='stagger';e.actionStarted=this.time;e.actionUntil=e.stun;this.reactToHit(e,p,sk.targets[0],'heavy');this.emit('parry',{room:r.id,player:p.id,x:e.x,z:e.z});if(sk.power===0)continue;}else if(sk.power===0)continue;
   }
   const attacking=e.telegraph&&e.telegraph.at-this.time<.60&&e.telegraph.at>this.time-.05;
   if(attacking&&!sk.ranged&&!sk.magic&&!sk.breakPower&&!outmatchedChild(p,e)){this.resolveClash(p,e,r);break;}
   const facing=Math.abs(angleDiff(e.dir,Math.atan2(p.x-e.x,p.z-e.z)))<1.4;
   if(e.guard&&e.stun<=this.time&&facing&&!sk.magic&&!(sk.ranged&&sk.power>=3)){
    e.counterOpportunity=this.time+1;e.action='guard';this.reactToHit(e,p,'leftArm','light',.32,true);this.emit('blocked',{room:r.id,x:e.x,z:e.z});continue;
   }
   if(e.kind==='boss'&&!(e.exposedUntil>this.time)&&!sk.magic){this.emit('blocked',{room:r.id,x:e.x,z:e.z});continue;}
   const part=sk.targets[Math.floor(this.rng()*sk.targets.length)];const landed=this.damageActor(e,p,part,(sk.power+(e.exposedUntil>this.time?.5:0))*(hasStatus(p,'weak',this.time)?.65:1),r);if(sk.power>0&&!landed)continue;if(e.alive&&sk.status&&sk.power>0)this.applyStatus(e,sk.status.id,sk.status.duration,p,r);if(e.alive&&sk.knockback&&e.kind!=='boss')this.moveAttackStep(e,r,Math.sin(p.dir)*sk.knockback,Math.cos(p.dir)*sk.knockback);SkillSystem.contact(this,p,e,sk);
  }
  this.emit('swing',{player:p.id,room:r.id,x:p.x,z:p.z,dir:p.dir,reach:sk.reach,arc:sk.arc,skill:sk.id,weapon:p.weapon});
 }
 damageActor(e,source,part,power,r){
  if(!canAct(e)||power<=0)return false;power*=combatMaturity(source);const awareness=source?this.awareness(e,source):{engaged:false,unaware:false};
  if(awareness.engaged&&this.rng()<COMBAT_AWARENESS.engagedAvoid){this.emit('evaded',{room:r.id,target:e.id,x:e.x,z:e.z});return false;}
  power*=awareness.unaware?1.35:1;if(e.wounds[part]?.severity==='lost')part='torso';
  const exposed=e.exposedUntil>this.time,committed=!!e.telegraph,prev=e.wounds[part]?.severity;
  e.hp??=e.hpMax??70;e.hpMax??=e.hp;e.hp-=Math.max(3*combatMaturity(source),power*9);this.recordDamage(e,part,power);
  e.aggro=true;e.sleepUntil=0;if(e.statuses)delete e.statuses.sleep;this.reactToHit(e,source,part,power>=2?'heavy':'light',clamp(.25+power*.30,.25,1.25));e.hitUntil=this.time+.1;
  this.impact(source,e,part,power>=2);this.emit('hit',{room:r.id,target:e.id,source:source?.id,x:e.x,z:e.z,part,weapon:source?.weapon,skill:source?.currentSkill});
  if(e.hp<=0&&e.kind!=='boss'){this.killActor(e,source,r);return true;}
  if(e.kind==='boss'){
   e.seals--;e.hp=Math.max(0,e.hpMax*e.seals/4);e.exposedUntil=0;e.telegraph=null;if(source?.kind==='player'&&!['head','torso'].includes(part)&&this.rng()<.68){e.wounds[part]={severity:'lost'};this.reactToHit(e,source,part,'lost');this.emit('partbreak',{room:r.id,target:e.id,source:source.id,part,severed:true,x:e.x,z:e.z});}e.stun=this.time+.65;e.action='hit';e.actionStarted=this.time;e.actionUntil=e.stun;
   if(e.seals<=0){this.killActor(e,source,r);r.bossDefeated=true;for(const p of this.players.values())if(p.room===r.id)p.victory=true;this.emit('victory',{room:r.id});}return true;
  }
  if((['head','torso'].includes(part)&&prev==='heavy'&&exposed&&power>=3)||power>=7){this.killActor(e,source,r);return true;}
  const limb=!['head','torso'].includes(part);
  // A clean hit into a broken posture can take a limb. Light taps alone cannot
  // repeatedly cancel a committed swing; otherwise pure button spam dominates.
  const severeBreak=source?.kind==='player'&&(combatMaturity(source)>=1||power>=(e.elite?1.2:.65))&&this.rng()<.68;
  const severity=limb&&(e.elite||e.kind==='boss')&&severeBreak?'lost':severeBreak||prev==='heavy'||power>=2?'heavy':'light';
  e.wounds[part]={...e.wounds[part],severity};this.reactToHit(e,source,part,severity);if(exposed)e.exposedUntil=0;
  const interrupts=severity!=='light'||!committed||exposed;
  if(interrupts){e.telegraph=null;e.actionStarted=this.time;e.stun=this.time+(severity==='lost'?1.25:part.endsWith('Leg')?.95:.65);e.actionUntil=e.stun;e.action=severity==='lost'?'break':'hit';}
  if(severeBreak||severity==='lost'){
   this.impact(source,e,part,true);this.emit('partbreak',{room:r.id,target:e.id,source:source?.id,part,severed:severity==='lost',x:e.x,z:e.z});
   if(!e.elite&&Object.values(e.wounds).filter(w=>w.severity==='lost').length>=2){this.killActor(e,source,r);return true;}
  }
  if(e.wounds.leftArm?.severity==='lost')e.guard=false;
  return true;
 }
 killActor(e,source,r,confirmed=false){if(!e.alive)return;if(e.kind==='guard'&&!confirmed){this.downPlayer(e,'深手',source);return;}if(e.carrierId){const carrier=this.entity(r,e.carrierId);if(carrier)this.releaseRescue(carrier);}e.lifeState='dead';this.releaseRescue(e);e.alive=false;e.statuses={};e.deathAt=this.time;e.action='fall';e.actionStarted=this.time;if(source?.kind==='player'&&enemiesOnly(e)){source.kills++;source.experience++;r.kills++;r.score++;}this.emit('kill',{room:r.id,player:source?.kind==='player'?source.id:undefined,target:e.id,x:e.x,z:e.z});}
 hitPlayer(p,e,tg={}){
  if(!p.alive)return;if(incapacitated(p)){this.finishPlayer(p,e,tg);return;}if(p.hitUntil>this.time)return;
  if(!outmatchedChild(p,e)&&p.pendingSkill&&p.pendingSkill.at-this.time<.4&&!skillById(p.pendingSkill.id)?.ranged&&!skillById(p.pendingSkill.id)?.magic&&!skillById(p.pendingSkill.id)?.breakPower&&!tg.ranged){this.resolveClash(p,e,this.getRoom(p));return;}
  const facing=Math.abs(angleDiff(p.dir,Math.atan2(e.x-p.x,e.z-p.z)))<1.5;
  if(!outmatchedChild(p,e)&&p.guard&&facing&&p.stun<=this.time&&injuryModifiers(p).guard){
   if(this.spend(p,tg.unblockable?23:13,tg.unblockable?4:1)){
    const weights=p.phaseWeights[p.combo?.band??0],sum=Object.values(weights).reduce((a,b)=>a+b,0)||1,focus=(weights[4013]||0)/sum;
    const chance=p.counterUntil>this.time?clamp(.18+focus*.16+(p.skills.includes(4011)?.05:0),0,.40):.12;
    if(!tg.unblockable&&this.rng()<chance){e.stun=this.time+1.8;e.exposedUntil=this.time+2.5;e.telegraph=null;p.parries++;p.counterUntil=0;this.emit('parry',{player:p.id,room:p.room,x:e.x,z:e.z});return;}
    if(!tg.unblockable){this.reactToHit(p,e,'leftArm','light',.32,true);this.emit('guarded',{player:p.id,target:p.id,source:e.id,part:'leftArm',room:p.room,x:p.x,z:p.z});return;}
   }
   p.guard=false;p.guardPending=false;
  }
  if(p.wardUntil>this.time&&p.wardCharges>0){p.wardCharges--;this.emit('guarded',{player:p.id,room:p.room,x:p.x,z:p.z});return;}
  if(hasStatus(e,'blind',this.time)&&this.rng()<.35)return;
  if(!outmatchedChild(p,e)&&p.shield&&facing&&p.stamina>=5&&this.rng()<.38){this.spend(p,5,.08);p.guardUntil=this.time+.55;this.reactToHit(p,e,'leftArm','light',.32,true);this.emit('guarded',{player:p.id,target:p.id,source:e.id,part:'leftArm',room:p.room,x:p.x,z:p.z});return;}
  const awareness=this.awareness(p,e);
  if(awareness.engaged&&this.rng()<COMBAT_AWARENESS.engagedAvoid*combatMaturity(p)){this.emit('evaded',{room:p.room,player:p.id,x:p.x,z:p.z});return;}
  const part=tg.part||BODY_PARTS[Math.floor(this.rng()*BODY_PARTS.length)],old=p.wounds[part]?.severity;
  let severity=outmatchedChild(p,e)?'fatal':e.elite||e.kind==='boss'||tg.unblockable?'heavy':'light';
  if(severity!=='fatal'&&old==='light')severity='heavy';if(severity!=='fatal'&&old==='heavy')severity=['head','torso'].includes(part)?'fatal':e.elite||e.kind==='boss'?'lost':'heavy';
  if(awareness.unaware){if(['head','torso'].includes(part)&&this.rng()<COMBAT_AWARENESS.unawareFatal)severity='fatal';else if(severity==='light'&&this.rng()<COMBAT_AWARENESS.unawareHeavy)severity='heavy';}
  const strength=e.elite||e.kind==='boss'||tg.unblockable?1:.60;
  if(old==='lost'){this.inflictWound(p,'torso',p.wounds.torso?.severity==='heavy'?'fatal':'heavy',e,strength);return;}
  const before=p.health;this.inflictWound(p,part,severity,e,strength);if(p.alive&&p.health<before&&e.attackCount%3===0){const status={crawler:'poison',wraith:'slow',maw:'root',goblin:'blind',mage:'burn',soldier:'bleed',elite:'weak'}[e.kind];if(status)this.applyStatus(p,status,4.5,e,this.getRoom(p));}
}
inflictWound(p,part,severity,source=null,strength=null){
  if(!canAct(p)||!BODY_PARTS.includes(part)||!['light','heavy','lost','fatal'].includes(severity))return false;
  this.stopTraversal(p);this.releaseRescue(p);
  const previousSeverity=p.wounds[part]?.severity;
  const report=level=>this.emit('wound',{player:p.id,target:p.id,source:source?.id,room:p.room,part,severity:level,strength:strength??(level==='light'?.60:1),dir:source?Math.atan2(p.x-source.x,p.z-source.z):(p.dir||0)+Math.PI,upgraded:previousSeverity!==level,x:p.x,z:p.z});
  if(severity==='fatal'||severity==='lost'&&['head','torso'].includes(part)){report('fatal');this.downPlayer(p,BODY_NAMES[part]+'への致命傷',source,part);return true;}
  if(p.wounds[part]?.severity==='lost')return false;
  if(p.wounds[part]?.severity==='heavy'&&severity==='light')severity='heavy';
  this.stopDash(p);this.stopActivity(p);p.seated=false;p.chain=null;p.sleepUntil=0;if(p.statuses)delete p.statuses.sleep;p.lastHurtAt=this.time;p.health=Math.max(0,(p.health??100)-PLAYER_WOUND_DAMAGE[severity]/combatMaturity(p)*(p.armor===2?.70:p.armor===1?.85:1)*(1-effectsOf(p,'fallResist'))-(part==='head'?7:part==='torso'?3:0));if(p.health<=0){report('fatal');this.downPlayer(p,'深手',source,part);return true;}
  p.wounds[part]={severity,since:p.age+p.ageFraction,healsAt:severity==='lost'?null:p.age+p.ageFraction+(severity==='heavy'?5:1)};
  this.reactToHit(p,source,part,severity,strength);this.impact(source,p,part,severity!=='light');p.attackStep=null;p.retreatUntil=0;p.hitUntil=this.time+.48;p.stun=this.time+(severity==='lost'?1.35:severity==='heavy'?.85:.50);p.action=severity==='lost'?'break':'hit';p.actionStarted=this.time;p.actionUntil=p.stun;p.pendingSkill=null;p.combo=null;p.comboQueued=false;p.cooldown=Math.max(p.cooldown,p.stun+.35);p.guard=false;p.guardPending=false;
  report(severity);return true;
 }
 tickRestHealing(p,dt){
  if(!p.seated||!canAct(p)||p.prologue||p.rescueTarget||p.traversal||this.time-(p.sitSince||0)<=.35||p.stun>this.time||hasStatus(p,'sleep',this.time)||this.time-(p.lastHurtAt??-100)<=REST_HEALING.quiet)return;
  p.health=Math.min(100,(p.health??100)+dt*REST_HEALING.healthRegen);
  // Advance only the existing injury deadline; age, lifespan and lost limbs are unchanged.
  const bonus=dt/this.yearSeconds*(REST_HEALING.woundRate-1);
  for(const w of Object.values(p.wounds))if((w.severity==='light'||w.severity==='heavy')&&Number.isFinite(w.healsAt))w.healsAt-=bonus;
 }
 tickRecovery(p,dt){
  const mods=injuryModifiers(p),max=Math.max(STAMINA.minCap,staminaMaximum(p)-(100-mods.cap)-(p.permanentFatigue||0));p.staminaMax=staminaMaximum(p);
  const resting=p.seated&&this.time-(p.sitSince||0)>.35&&p.stun<=this.time&&!hasStatus(p,'sleep',this.time);
  if(resting){p.staminaCap=Math.min(max,p.staminaCap+dt*(STAMINA.seatedCapRegen+effectsOf(p,'capRegen')));p.stamina=Math.min(p.staminaCap,p.stamina+dt*(STAMINA.seatedRegen+effectsOf(p,'regen')));}
  if(!p.autoFight&&!p.seated&&this.time-(p.lastHurtAt??-100)>12&&this.getRoom(p)?.kind==='village'&&p.z>-27)p.health=Math.min(100,(p.health??100)+dt*1.8);
  this.tickRestHealing(p,dt);this.tickClinicCare(p,this.getRoom(p),dt);
  // Seated and ordinary recovery are exclusive, so sitting cannot double-dip.
  if(!p.seated){
   if(!p.dash&&this.time-p.lastExertion>STAMINA.delay&&!p.pendingSkill&&p.stun<=this.time)p.stamina=Math.min(p.staminaCap,p.stamina+dt*(STAMINA.regen+effectsOf(p,'regen'))*(p.guard?.28:(p.autoFight||p.combo||p.cooldown>this.time)?.45:1));
   if(this.time-p.lastSkillAt>STAMINA.capDelay&&!p.pendingSkill&&this.time-p.lastExertion>1.4)p.staminaCap=Math.min(max,p.staminaCap+dt*(STAMINA.capRegen+effectsOf(p,'capRegen'))*(p.guard?.35:1));
  }
  p.staminaCap=Math.min(p.staminaCap,max);p.stamina=clamp(p.stamina,0,p.staminaCap);
  const age=p.age+p.ageFraction;for(const [part,w] of Object.entries(p.wounds))if(w.severity!=='lost'&&age>=w.healsAt){delete p.wounds[part];this.emit('healed',{player:p.id,room:p.room,part,x:p.x,z:p.z});}
 }
 tickExploration(p,dt){
  if(p.age<4||p.prologue)return;const area=this.getArea(p),moving=!!p.dash||Math.hypot(p.input.x,p.input.z)>.1;
  if(moving)p.enduranceXP=(p.enduranceXP||0)+dt*(p.dash?.13:.06);
  if(p.activity){
   if(ACTIVITY_DEFS[nearbyActivity(p,this.getRoom(p))?.id]?.id!==p.activity||p.autoFight){this.stopActivity(p);return;}
   p.activityClock+=dt;this.progressDeed(p,p.activity,dt);
   if(this.time>=p.activityNextAt){const lines=ACTIVITY_LINES[area]||ACTIVITY_LINES[p.activity];let n=Math.floor(this.rng()*lines.length);if(n===p.lastActivityLine)n=(n+1)%lines.length;
    p.lastActivityLine=n;p.activityNextAt=this.time+4.1+this.rng()*2.3;
    this.emit('progress',{player:p.id,room:p.room,text:lines[n],x:p.x,z:p.z});
   }
   if(p.activity==='play')p.enduranceXP+=dt*.18;
  }
  SkillSystem.sample(this,p);
 }
 bound(p,r,bodyRadius=this.collisionRadius(p),ignored=null){
  if(r.kind==='village'){
   p.x=clamp(p.x,-35,35);p.z=clamp(p.z,-46,VILLAGE_SHIP.bow-bodyRadius);
   if(p.z>29.5){
    if(p.kind==='player'&&(p.age<15||p.prologue)){p.z=29.5;}
    else{
     const margin=bodyRadius,opening=VILLAGE_SHIP.gangwayHalf-margin;
     // Inset the stern rail, except for the open gangway in its centre.
     const width=p.z<34+margin?opening:shipHalfWidth(p.z)-margin*1.2;
     p.x=clamp(p.x,-width,width);
     for(const m of VILLAGE_SHIP.obstacles){const d=dist(p,m),radius=m.r+margin;if(d<radius){const angle=Math.atan2(p.x-m.x,p.z-m.z);p.x=m.x+Math.sin(angle)*radius;p.z=m.z+Math.cos(angle)*radius;}}
     p.x=clamp(p.x,-width,width);p.supportHeight=shipSupport(p.x,p.z);return;
    }
   }
   // Shared fence and landing geometry is also used by ArtDirector.village.
   const onStairs=stairAt(r.map,p.x,p.z);
   for(const o of r.map.traversables||[]){
    if(o.id===ignored||o.kind==='step'&&(o.stair||ignored==='steps'||(p.supportHeight||0)>=o.height-.05||onStairs&&o.height-(p.supportHeight||0)<=.22))continue;
    const rx=o.width/2+bodyRadius,rz=o.depth/2+bodyRadius,dx=p.x-o.x,dz=p.z-o.z;
    if(Math.abs(dx)<rx&&Math.abs(dz)<rz){if(Math.abs(dx)/rx>Math.abs(dz)/rz)p.x=o.x+Math.sign(dx||1)*rx;else p.z=o.z+Math.sign(dz||1)*rz;}
   }
   for(const x of [-4.1,4.1]){const dx=p.x-x,dz=p.z+28;if(Math.abs(dx)<1.1&&Math.abs(dz)<1.1){if(Math.abs(dx)>Math.abs(dz))p.x=x+Math.sign(dx||1)*1.1;else p.z=-28+Math.sign(dz||1)*1.1;}}
   if(p.z>23&&Math.abs(p.x)>4)p.z=23;
   if(p.z>23)p.supportHeight=r.map?.ship?shipSupport(p.x,p.z):0;
   for(const h of r.map.houses){const dx=p.x-h.x,dz=p.z-h.z;if(Math.abs(dx)<2&&Math.abs(dz)<1.8){if(Math.abs(dx)/2>Math.abs(dz)/1.8)p.x=h.x+Math.sign(dx||1)*2;else p.z=h.z+Math.sign(dz||1)*1.8;}}
   for(const s of r.map.schools.filter(s=>s.id!=='dance')){const dx=p.x-s.x,dz=p.z-(s.z-2);if(Math.abs(dx)<2.5&&Math.abs(dz)<1.5){if(Math.abs(dx)/2.5>Math.abs(dz)/1.5)p.x=s.x+Math.sign(dx||1)*2.5;else p.z=s.z-2+Math.sign(dz||1)*1.5;}}
   for(const o of r.map.clinic?[{x:8,z:-25,r:.55},{x:5.3,z:-24.7,r:.22},{x:10.7,z:-24.7,r:.22}]:[]){const d=dist(p,o),radius=o.r+bodyRadius;if(d<radius){const a=Math.atan2(p.x-o.x,p.z-o.z);p.x=o.x+Math.sin(a)*radius;p.z=o.z+Math.cos(a)*radius;}}
   // The square is walkable, but its stone well and posts occupy a 1.30m radius.
   // Use the same bound for walking, dash, attack steps and restored positions.
   const well=r.map.schools.find(s=>s.id==='dance');
   if(well){const dx=p.x-well.x,dz=p.z-well.z,d=Math.hypot(dx,dz),radius=1.30+bodyRadius;
    if(d<radius){p.x=well.x+(d>1e-8?dx/d:0)*radius;p.z=well.z+(d>1e-8?dz/d:1)*radius;}}
  }else{p.x=clamp(p.x,-13,13);p.z=clamp(p.z,-(r.stage*44+43),9);}
 }
 tick(dt){
  dt=clamp(dt,0,.1);this.time+=dt;
  for(const p of this.players.values()){
   if(!p.alive)continue;this.preparePlayer(p);let r=this.getRoom(p);this.tickStatuses(p,r,dt);if(!p.alive)continue;r.everOccupied=true;
   const oldAge=p.age;this.tickMother(p,dt);if(p.prologue){p.age=Math.min(3,Math.floor((this.time-p.born)/9));p.ageFraction=0;if(this.time>=p.releaseAt)this.releaseFromParent(p);}else p.ageFraction+=dt/this.yearSeconds;while(p.ageFraction>=1){p.ageFraction--;p.age++;}if(oldAge!==p.age&&[4,6,7,8,15,35,55,60,72,75].includes(p.age))this.emit('age',{player:p.id,room:p.room,age:p.age});
   // Lifetime is checked before rescue, including simultaneous arrival/death.
   if(p.age+p.ageFraction>=p.lifespan){this.die(p,'寿命');continue;}
   if(p.rescueAt&&this.time>=p.rescueAt){this.returnHome(p);r=this.getRoom(p);}
   if(this.tickLifeState(p,r,dt))continue;if(this.tickTraversal(p,r))continue;
   this.tickRecovery(p,dt);this.tickExploration(p,dt);if(this.tickHitStop(p,dt)){this.bound(p,r);continue;}if(p.prologue){this.tickCarriedMove(p,r,dt);continue;}this.tickHitRecoil(p,r,dt);this.tickAutoCombat(p,r,dt);this.tickChain(p);
   this.tickAttackStep(p);
   if(p.pendingSkill&&this.time>=p.pendingSkill.at)this.releaseSkill(p);
   if(p.combo&&!p.pendingSkill&&p.combo.awaitUntil&&this.time>=p.actionUntil){
    if(p.comboQueued){SkillSystem.complete(this,p);const sk=skillById(p.currentSkill)||book.get(4000);p.comboQueued=false;
     const continuation=false;
     if(continuation)p.combo.repeats++;else{p.combo.band++;p.combo.repeats=0;}
     if(p.combo.band>2||p.combo.total>=7||!this.beginComboStrike(p))this.finishCombo(p);
    }else if(this.time>=p.combo.awaitUntil)this.finishCombo(p);
   }
   if(p.attackBufferedUntil){if(p.attackBufferedUntil<this.time||p.stun>this.time||p.guard||p.guardPending)p.attackBufferedUntil=0;else if(!p.combo&&!p.pendingSkill&&p.cooldown<=this.time){p.attackBufferedUntil=0;this.command(p.id,{type:'attack'});}}
   if(p.dash){
    if(p.stamina<.4||p.seated||p.autoFight||p.stun>this.time||hasStatus(p,'root',this.time)){this.stopDash(p);p.input={x:0,z:0};}
    else{p.input={x:p.dash.x,z:p.dash.z};p.lastInput=this.time;this.spend(p,Math.min(p.stamina,DASH.cost*dt),0);}
   }else if(this.time-p.lastInput>1.5)p.input={x:0,z:0};
   if(p.guardPending&&p.stun<=this.time&&!p.pendingSkill&&!p.combo&&p.cooldown<=this.time)this.command(p.id,{type:'guard',active:true});
   const l=Math.hypot(p.input.x,p.input.z),mods=injuryModifiers(p);
   if(p.stun<=this.time&&!hasStatus(p,'sleep',this.time)){
    let speed=(p.age<4?3.8:p.age<15?4.5:5.15)*ACTION_TUNING.move*(p.dash?DASH.speed:1)*(p.rescueTarget?LIFE_RULES.carrySpeed:1)*(1+effectsOf(p,'walk'))*(p.age>65?1-(p.age-65)*.004:1)*mods.move*(hasStatus(p,'slow',this.time)?.5:1)*(hasStatus(p,'root',this.time)||p.seated?0:1)*(p.guard?.42:1)*(p.pendingSkill?ACTION_TUNING.moveCharge:p.combo?ACTION_TUNING.moveCombo:p.cooldown>this.time?ACTION_TUNING.moveRecovery:1);
    if(p.retreatUntil>this.time&&!hasStatus(p,'root',this.time)){this.moveAttackStep(p,r,-Math.sin(p.dir)*p.retreatSpeed*dt*mods.move,-Math.cos(p.dir)*p.retreatSpeed*dt*mods.move);}
    else if(p.attackStep&&p.combo){this.moveAttackStep(p,r,p.input.x*speed*dt,p.input.z*speed*dt);}
    else if(l>.001&&speed>0){const moved=this.moveWalk(p,r,p.input.x*speed*dt,p.input.z*speed*dt);if(p.dash){p.dash.blocked=moved<.002?(p.dash.blocked||0)+dt:0;if(p.dash.blocked>.18){this.stopDash(p);p.input={x:0,z:0};}}}
    if(p.guard){const e=r.actors.filter(e=>e.alive&&(enemiesOnly(e)||e.kind==='dummy')&&(!e.neutral||e.aggro)&&dist(e,p)<7).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(e)p.dir=Math.atan2(e.x-p.x,e.z-p.z);}
    else if(l>.1&&!p.pendingSkill&&!p.combo)p.dir=Math.atan2(p.input.x,p.input.z);
    if(p.actionUntil<=this.time&&!p.pendingSkill)p.action=p.seated?'sit':p.activity?(ACTIVITY_DEFS[this.getArea(p)]?.motion||p.activity):p.guard?(l>.1?'guardWalk':'guard'):l>.1?(p.dash?'dash':'run'):'idle';
   }
   this.bound(p,r);p.zone=this.getArea(p);p.queued=r.kind==='village'&&p.age>=15&&onShipDeck(p);
   if(p.speechUntil<=this.time)p.speech='';this.detectContact(p,r);if(p.rescueTarget)this.syncRescue(p,r);
  }
  for(const r of this.rooms.values()){
   if(r.abandoned)continue;const ps=[...this.players.values()].filter(p=>p.alive&&p.room===r.id);
   if(r.kind==='village'){
    if(this.time>=r.waveAt){
     const active=r.actors.filter(e=>e.alive&&enemiesOnly(e)&&!e.neutral),helpers=ps.filter(p=>p.z<-28).length,target=4+Math.min(4,helpers);
     if(active.length<target){const counts=[0,0,0,0];for(const e of active)counts[e.lane]++;const lane=counts.indexOf(Math.min(...counts)),elite=this.time-r.born>18&&!active.some(e=>e.elite)&&this.rng()<.07;
      const e=this.actor(elite?'elite':['crawler','maw','wraith','goblin'][Math.floor(this.rng()*4)],-10.5+lane*7,-41,elite?2:this.rng()<.35?1:0);e.lane=lane;r.actors.push(e);if(elite)this.emit('elite',{room:r.id,x:e.x,z:e.z});}
     const guards=r.actors.filter(e=>e.alive&&e.kind==='guard'&&e.role!=='medic');if(guards.length<4){const lane=[0,1,2,3].find(i=>!guards.some(g=>g.lane===i))??0,g=this.actor('guard',-10.5+lane*7,-30.5);g.lane=lane;r.actors.push(g);}
     this.ensureClinicStaff(r);r.waveAt=this.time+2;
    }
    const cycle=Math.floor(this.time/this.boatInterval);if(cycle>r.boatCycle){r.boatCycle=cycle;const travelers=ps.filter(p=>canAct(p)&&!p.rescueTarget&&!p.prologue&&p.age>=15&&onShipDeck(p));if(travelers.length)this.depart(r,travelers);}
   }else if(ps.length&&!r.bossDefeated){
    const alive=r.actors.filter(e=>e.alive);if(r.stage<5&&r.kills>=r.quota&&!alive.length){r.cleared.push(r.stage);r.stage++;r.kills=0;r.quota=this.frontQuota(r.partySize);this.emit('advance',{room:r.id,stage:r.stage});this.spawnFrontWave(r);}
    else if(r.stage<5&&alive.length<Math.min(8,2+Math.ceil(r.partySize/5))&&this.time>r.waveAt&&r.kills+alive.length<r.quota)this.spawnFrontWave(r);
   }
   for(const e of r.actors)if(e.alive){if(this.tickLifeState(e,r,dt))continue;this.tickStatuses(e,r,dt);if(e.alive&&!this.tickHitStop(e,dt))this.tickActor(e,r,ps,dt);}
   for(const c of r.clashResult||[])if(c.at<=this.time&&!c.done){c.done=true;const a=this.players.get(c.winner)||r.actors.find(e=>e.id===c.winner),b=this.players.get(c.loser)||r.actors.find(e=>e.id===c.loser);if(canAct(a)&&canAct(b)){if(b.kind==='player')this.hitPlayer(b,a,{part:'torso'});else this.damageActor(b,a,'torso',1,r);a.cooldown=this.time+.9;}}
   r.clashResult=(r.clashResult||[]).filter(c=>!c.done);
   for(const field of r.fields||[])if(field.until>this.time)for(const e of r.actors.filter(e=>e.alive&&enemiesOnly(e))){if(dist(e,field)<(field.type==='fire'?3:6)){if(field.type==='fire'){e.stun=Math.max(e.stun,this.time+.22);e.telegraph=null;e.action='hit';e.hitPart='torso';}if(field.type==='sleep'&&!e.elite)e.sleepUntil=Math.max(e.sleepUntil||0,this.time+.6);}}
   r.fields=(r.fields||[]).filter(f=>f.until>this.time);this.separateActors(r,dt);r.actors=r.actors.filter(e=>e.alive||this.time-e.deathAt<CORPSE_SECONDS);const dead=r.actors.filter(e=>!e.alive);if(dead.length>64){const oldest=new Set(dead.slice(0,dead.length-64).map(e=>e.id));r.actors=r.actors.filter(e=>!oldest.has(e.id));}
  }
 }
 frontQuota(party){return this.mode==='demo'?Math.max(3,Math.ceil(party*.6)):Math.max(16,party*7);}
 depart(r,travelers){const front=this.makeRoom('front');front.partySize=travelers.length;front.quota=this.frontQuota(travelers.length);front.expedition=travelers.map(p=>p.id);front.home=r.id;
  for(const [i,p] of travelers.entries()){this.cancelAction(p);p.hitReactUntil=0;p.hitstopUntil=0;p.action='idle';p.actionUntil=this.time;p.grounded=true;p.autoFight=null;p.autoSkill=null;p.chain=null;p.statuses={};p.seated=false;p.room=front.id;p.supportHeight=0;p.verticalOffset=0;p.expedition=front.id;p.x=(i%6-2.5)*1.6;p.z=5+Math.floor(i/6)*1.1;p.queued=false;p.activity=null;p.input={x:0,z:0};p.guard=false;p.combo=null;p.pendingSkill=null;p.attackStep=null;p.retreatUntil=0;this.emit('depart',{player:p.id,room:front.id});}this.spawnFrontWave(front);
 }
 spawnFrontWave(r){const center=-(r.stage*44+20);if(r.stage===5){if(!r.actors.some(a=>a.kind==='boss'))r.actors.push(this.actor('boss',0,center,3));return;}
  const count=Math.min(4,Math.max(1,r.quota-r.kills-r.actors.filter(e=>e.alive).length));for(let i=0;i<count;i++){const kinds=r.stage===0?['goblin','maw','crawler']:r.stage===1?['soldier','crawler','archer']:['elite','soldier','mage','maw'];const kind=kinds[Math.floor(this.rng()*kinds.length)];r.actors.push(this.actor(kind,(this.rng()-.5)*17,center+(this.rng()-.5)*15,kind==='crawler'?0:kind==='elite'?2:1));}r.waveAt=this.time+4;
 }
 tickActor(e,r,ps,dt){
  if(e.clinicRestUntil>this.time&&atClinic(e,r)){e.seated=true;e.sitSince??=this.time;this.tickClinicCare(e,r,dt);e.action='sit';return;}if(e.clinicRestUntil){e.clinicRestUntil=0;e.seated=false;}
  if(e.role==='medic'){this.tickMedic(e,r,ps,dt);return;}
  if(e.kind==='dummy'){if(e.actionUntil<=this.time)e.action='idle';return;}
  if(e.kind==='villager'){e.dir+=Math.sin(this.time*.23+e.stance)*dt*.5;e.x+=Math.sin(e.dir)*dt*.35;e.z+=Math.cos(e.dir)*dt*.35;if(Math.abs(e.x)>13||Math.abs(e.z)>20)e.dir+=Math.PI*dt;e.action='run';return;}
  if(e.telegraph?.ranged&&(e.wounds.rightArm?.severity==='lost'||e.wounds.leftArm?.severity==='lost'))e.telegraph=null;
  if(e.sleepUntil>this.time||hasStatus(e,'sleep',this.time)){e.action='sleep';e.telegraph=null;return;}
  if(e.stun>this.time){e.telegraph=null;if(e.actionUntil<=this.time)e.action='stagger';return;}
  if(this.tickGuardRescue(e,r,ps,dt))return;
  const hostile=e.kind!=='guard';let targets=hostile?[...ps.filter(p=>r.kind!=='village'||p.z<-28),...r.actors.filter(g=>g.alive&&g.kind==='guard'&&!e.neutral)]:r.actors.filter(a=>a.alive&&enemiesOnly(a)&&!a.neutral);
  if(e.neutral&&!e.aggro){e.action='idle';return;}
  if(e.neutral)targets=ps.filter(p=>p.alive&&p.z<-28);
  const scored=targets.filter(t=>t.alive&&(e.kind!=='guard'||r.kind!=='village'||Math.abs(t.x-e.homeX)<5.2));
  const score=t=>dist(e,t)+(e.target===t.id?-.5:0)+(t.kind==='player'&&(t.cooldown>this.time||Math.abs(angleDiff(t.dir,Math.atan2(e.x-t.x,e.z-t.z)))>2)?-2:0);
  const committed=e.telegraph?this.entity(r,e.telegraph.target):null;
  const lured=this.entity(r,e.luredBy);if(e.luredBy&&(!(e.luredUntil>this.time)||!canAct(lured)||lured.rescueTarget||dist(e,lured)>COMBAT_AWARENESS.lureRange+4)){e.luredBy=null;e.luredUntil=0;}
  const target=committed?.alive?committed:e.luredBy&&scored.includes(lured)?lured:scored.sort((a,b)=>score(a)-score(b))[0];if(!target||dist(e,target)>(r.kind==='village'?13:18)){e.action='idle';if(e.kind==='guard'){e.x+=(e.homeX-e.x)*dt*.5;e.z+=(-32-e.z)*dt*.5;}return;}
  e.target=target.id;
  if(e.kind==='guard'&&this.time>=(e.nextSpeechAt||0)){
   e.nextSpeechAt=this.time+10+this.rng()*10;
   const helper=ps.filter(p=>p.alive&&dist(p,e)<9).sort((a,b)=>dist(a,e)-dist(b,e))[0];
   if(helper){
    const type=(helper.health??100)<55?'hurt':helper.age<10?'young':helper.experience>30?'veteran':'helper',lines=GUARD_LINES[type],speech=lines[Math.floor(this.rng()*lines.length)];
    // Keep the normal retry time and RNG draws even when another guard has the floor.
    if(!r.actors.some(g=>g!==e&&g.alive&&g.kind==='guard'&&g.speech&&g.speechUntil>this.time)){
     e.speech=speech;e.speechUntil=this.time+4.6;this.emit('guardline',{room:r.id,target:e.id,text:e.speech,x:e.x,z:e.z});
    }
   }
  }
  const condition=enemyCondition(e),ranged=false,reach=ranged?11:e.wounds.rightArm?.severity==='lost'?1.2:e.kind==='boss'?5:e.elite?3.4:2.3;
  if(e.telegraph){
   e.action='windup';if(target.kind!=='player'&&target.telegraph&&!ranged&&Math.abs(target.telegraph.at-e.telegraph.at)<.5&&Math.min(target.telegraph.at,e.telegraph.at)-this.time<.25&&dist(e,target)<reach+.4){this.resolveClash(e,target,r);return;}
   if(this.time>=e.telegraph.at){const tg=e.telegraph;e.telegraph=null;e.guard=false;e.action='attack';e.actionStarted=this.time;e.actionUntil=this.time+.75+condition.recovery;e.cooldown=this.time+(e.elite?2.3:1.9)+condition.recovery;if(e.kind==='boss')e.exposedUntil=this.time+1.65;if(ranged)e.ammo--;
    this.emit('enemySwing',{room:r.id,source:e.id,target:target.id,x:e.x,z:e.z,dir:tg.dir,reach:tg.reach,arc:tg.arc,kind:e.kind,unblockable:tg.unblockable});
    for(const t of targets){if(!t.alive||!this.clearPath(e,t,r)||dist(e,t)>tg.reach+.35||Math.abs(angleDiff(Math.atan2(t.x-e.x,t.z-e.z),tg.dir))>tg.arc/2)continue;
     if(t.kind==='player')this.hitPlayer(t,e,tg);else{if(incapacitated(t)){this.finishPlayer(t,e,tg);continue;}if(this.awareness(t,e).engaged&&this.rng()<COMBAT_AWARENESS.engagedAvoid)continue;this.releaseRescue(t);this.recordDamage(t,'torso',e.elite?1.05:.7);t.sleepUntil=0;if(t.statuses)delete t.statuses.sleep;const amount=(e.elite?1.05:.7)*(hasStatus(e,'weak',this.time)?.65:1);t.npcResolve-=amount;t.hp=(t.hp??70)-amount*(t.hpMax??70)/(t.npcResolveMax||12);this.reactToHit(t,e,'torso',e.elite?'heavy':'light');this.impact(e,t,'torso',e.elite);t.action='hit';t.actionStarted=this.time;t.actionUntil=this.time+.65;t.stun=t.actionUntil;if(t.npcResolve<=0||t.hp<=0)this.killActor(t,e,r);else this.emit('hit',{room:r.id,target:t.id,source:e.id,x:t.x,z:t.z,part:'torso'});if(t.alive&&e.attackCount%4===0){const status=e.kind==='guard'?'stun':({crawler:'poison',wraith:'slow',maw:'root',goblin:'blind',mage:'burn',elite:'weak'})[e.kind];if(status)this.applyStatus(t,status,3,e,r);}}if(ranged)break;
    }
   }return;
  }
  if(e.actionUntil>this.time)return;e.dir=Math.atan2(target.x-e.x,target.z-e.z);
  const distance=dist(e,target),injury=injuryModifiers(e),vulnerable=target.cooldown>this.time||target.action==='recover'||Math.abs(angleDiff(target.dir,Math.atan2(e.x-target.x,e.z-target.z)))>1.9;
  if(e.smart&&distance<reach+1&&distance>reach*.7&&this.time>e.cooldown&&!vulnerable&&e.counterOpportunity<this.time){e.guard=e.wounds.leftArm?.severity!=='lost';e.action='guard';return;}
  if(e.smart&&e.counterOpportunity===undefined)e.counterOpportunity=0;
  if(distance>reach*.82){const speed=(e.kind==='guard'?2.8:e.kind==='boss'?2.6:3.1)*injury.move*condition.move*(hasStatus(e,'slow',this.time)?.5:1)*(hasStatus(e,'root',this.time)?0:1);this.moveAttackStep(e,r,Math.sin(e.dir)*speed*dt,Math.cos(e.dir)*speed*dt,true);e.action='run';e.guard=false;if(r.kind==='village')e.z=Math.min(-29.6,e.z);}
  else if(this.time>=e.cooldown){e.attackCount++;const unblockable=(e.kind==='boss'&&e.attackCount%3===0)||(e.elite&&e.attackCount%4===0),duration=e.elite?1.55:e.smart&&vulnerable?1.05:1.35;e.guard=false;e.telegraph={target:target.id,at:this.time+duration,started:this.time,dir:e.dir,reach,arc:ranged?.65:unblockable?2.5:1.7,unblockable,ranged,part:e.elite&&e.attackCount%2===0?'rightArm':undefined};e.action='windup';}
  else e.action='idle';
 }
 separateActors(r,dt){const list=r.actors.filter(e=>canAct(e)&&e.role!=='medic'&&!e.rescueTarget&&!e.rescueReturn&&!(e.hitstopUntil>this.time)&&!['villager','dummy'].includes(e.kind));for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j],d=dist(a,b),min=a.elite||b.elite?1.8:1.4;if(d<min){const angle=d<.001?(i+j)*2.4:Math.atan2(b.x-a.x,b.z-a.z),v=(min-d)*Math.min(.5,dt*5);a.x-=Math.sin(angle)*v;a.z-=Math.cos(angle)*v;b.x+=Math.sin(angle)*v;b.z+=Math.cos(angle)*v;}}
  if(r.kind==='village')for(const e of list){const rescuing=e.kind==='guard'&&[...this.players.values()].some(p=>p.rescueClaim?.id===e.id&&p.rescueClaim.until>this.time);if(rescuing){this.bound(e,r);continue;}e.x=clamp(e.x,-25,25);e.z=clamp(e.z,-45,-29.6);if(e.kind==='guard')e.x=clamp(e.x,e.homeX-2.2,e.homeX+2.2);}
  const players=[...this.players.values()].filter(p=>p.room===r.id&&canAct(p)&&!p.prologue&&!p.traversal);
  for(const e of list)for(const p of players){const d=dist(e,p),gap=this.contactSpacing(e,p)-d;if(gap<=0)continue;const dir=d>1e-6?Math.atan2(e.x-p.x,e.z-p.z):(p.dir||0)+Math.PI,step=Math.min(gap,dt*2.4);this.moveAttackStep(e,r,Math.sin(dir)*step,Math.cos(dir)*step);}
 }
 bank(p,witness=null){
  if(p.alive||p.recorded||p.legacyChoice?.state==='pending')return false;
  const legacy=this.legacy(p.owner),memory=p.legacyChoice?p.legacyChoice.skill:strongestMemory(p),id=memory===null||memory===undefined?null:Number(memory);
  if(id!==null)legacy.archive=[...new Set([...legacy.archive,id])];
  p.bankedSkills=id===null?[]:[id];
  const record={id:p.id,clan:p.clan,name:p.name,gen:p.gen,age:p.age,skills:[...p.bankedSkills],skill:id,uses:id===null?0:p.skillUses[id],kills:p.kills,cause:p.cause,alive:false,mode:this.mode,skillHistory:SkillSystem.remember(p),appearance:{race:p.race,gender:p.gender,hair:p.hair,skin:p.skin,age:p.age,appearanceSeed:p.appearanceSeed,weapon:p.weapon,armor:p.armor,shield:p.shield,wounds:JSON.parse(JSON.stringify(p.wounds))}};
  const n=legacy.records.findIndex(r=>r.id===p.id);if(n>=0)legacy.records[n]=record;else legacy.records.push(record);p.recorded=true;
  this.emit('banked',{player:p.id,room:p.room,skill:id});return true;
 }
 returnHome(p){
  const front=this.getRoom(p);if(front.kind!=='front'||incapacitated(p)||p.rescueTarget)return false;
  this.bank(p);for(const id of front.expedition||[]){const dead=this.players.get(id)||front.fallen?.[id];if(dead&&!dead.alive)this.bank(dead,p);}
  let home=this.rooms.get(p.home);if(!home||home.abandoned){home=this.makeRoom('village');home.clans[p.id]=0;p.home=home.id;}
  p.autoFight=null;p.autoSkill=null;p.chain=null;p.statuses={};p.seated=false;p.attackBufferedUntil=0;p.room=home.id;p.supportHeight=0;p.verticalOffset=0;p.x=0;p.z=24;p.rescueAt=null;p.returned++;p.guard=false;p.attackStep=null;p.retreatUntil=0;p.combo=null;p.pendingSkill=null;p.cooldown=this.time+1;p.input={x:0,z:0};p.action='idle';p.activity=null;
  this.emit('returned',{player:p.id,room:home.id,witnessed:(front.expedition||[]).filter(id=>!this.players.get(id)?.alive).length});return true;
 }
 die(p,cause){
  if(!p.alive)return;p.wasDownedOnDeath=incapacitated(p);this.stopTraversal(p);this.releaseRescue(p);if(p.carrierId)this.releaseRescue(this.entity(this.getRoom(p),p.carrierId));p.lifeState='dead';delete p.baseY;
  const candidates=legacyCandidates(p);p.legacyChoice={state:candidates.length?'pending':'chosen',candidates,skill:null};
  p.dash=null;p.attackBufferedUntil=0;p.alive=false;p.health=0;p.statuses={};p.autoFight=null;p.autoSkill=null;p.chain=null;p.seated=false;p.deathAt=this.time;p.cause=cause;p.attackStep=null;p.retreatUntil=0;p.input={x:0,z:0};p.guard=false;p.pendingSkill=null;p.combo=null;p.queued=false;p.activity=null;p.action='fall';p.actionStarted=this.time;
  const room=this.getRoom(p);if(room?.kind==='front'){room.fallen||={};room.fallen[p.id]=JSON.parse(JSON.stringify({...p,speech:'',speechUntil:0}));}const home=this.rooms.get(p.home);if(home){delete home.clans[p.id];this.checkAbandoned(home);}this.bank(p);const legacy=this.legacy(p.owner);legacy.generation=Math.max(legacy.generation,p.gen+1);
  this.emit('death',{player:p.id,room:p.room,cause,age:p.age,kills:p.recorded?p.kills:0,skills:p.bankedSkills,x:p.x,z:p.z});
 }
 snapshot(id,after=0){const p=this.players.get(id);if(!p)return null;const r=this.getRoom(p);return {version:VERSION,t:this.time,seq:this.seq,mode:this.mode,player:p,room:{id:r.id,kind:r.kind,seed:r.seed,terrainRevision:r.map?.terrainRevision||0,shipRevision:r.map?.shipRevision||0,code:r.code,name:r.name,stage:r.stage,kills:r.kills,quota:r.quota,cleared:r.cleared,clans:r.clans,bossDefeated:r.bossDefeated,partySize:r.partySize,fields:r.fields||[],items:r.items||[],abandoned:r.abandoned},actors:r.actors,players:[...this.players.values()].filter(q=>q.room===r.id),boatIn:this.boatInterval-this.time%this.boatInterval,yearSeconds:this.yearSeconds,legacy:this.legacy(p.owner),events:this.events.filter(e=>e.seq>after&&(e.room===r.id||e.player===id))};}
 exportState({live=false}={}){const data={schema:4,version:VERSION,seed:this.seed,rngState:this.rng.getState(),mode:this.mode,time:this.time,seq:this.seq,eid:this.eid,roomSeq:this.roomSeq,rooms:[...this.rooms],players:[...this.players].map(([id,p])=>[id,live?p:{...p,speech:'',speechUntil:0}]),legacies:this.legacies,abandoned:this.abandoned};return JSON.parse(JSON.stringify(data));}
 static migrateSave(input){
  const data=JSON.parse(JSON.stringify(input));
  if(!data||![3,4].includes(data.schema))throw Error('この記録には対応する新しい版が必要です。');
  if(!Array.isArray(data.players)||!Array.isArray(data.rooms)||data.players.length>200||!data.legacies||typeof data.legacies!=='object')throw Error('記録の形式を確認できません。');
  const rooms=new Set();for(const entry of data.rooms){if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!entry[1]||!Array.isArray(entry[1].actors)||rooms.has(entry[0]))throw Error('村の記録が不正です。');rooms.add(entry[0]);}
  const ids=new Set();for(const entry of data.players){const [id,p]=Array.isArray(entry)?entry:[];if(typeof id!=='string'||!p||id!==p.id||ids.has(id)||!rooms.has(p.room)||!Number.isFinite(p.x)||!Number.isFinite(p.z)||!Number.isFinite(p.age)||!Array.isArray(p.skills)||!Array.isArray(p.inventory))throw Error('旅人の記録が不正です。');ids.add(id);}
  if(!Number.isFinite(data.time)||data.time<0||!Number.isSafeInteger(data.seq)||data.seq<0)throw Error('記録の時刻が不正です。');
  // Schema 4 formalizes validated state; gameplay fields and schema-3 values are retained.
  data.schema=4;return data;
 }
 reconcileTerrain(){
  for(const p of this.players.values()){const r=this.getRoom(p);if(r.kind!=='village'||p.traversal)continue;
   const wall=r.map.traversables.find(o=>o.id==='green:wall');if(!terrainFootprint(r.map,p.x,p.z)&&!p.supportHeight&&!(wall&&Math.abs(p.x-wall.x)<wall.width/2+.42&&Math.abs(p.z-wall.z)<wall.depth/2+.42))continue;
   p.supportHeight=supportHeight(r.map,p.x,p.z);this.bound(p,r);p.supportHeight=supportHeight(r.map,p.x,p.z);
   if(p.lifeState==='carried')p.baseY=1.32+p.supportHeight;
  }
 }
 static restoreLive(input){
  const d=this.migrateSave(input),s=new Simulation({seed:d.seed,mode:d.mode});
  for(const key of ['time','seq','eid','roomSeq','legacies','abandoned'])s[key]=d[key];
  s.rooms=new Map(d.rooms);s.players=new Map(d.players);s.rng.setState(d.rngState);s.events=[];
  for(const r of s.rooms.values())if(r.kind==='village'){const upgradeShip=!r.map?.ship,upgradeClinic=!r.map?.clinic;r.map=makeVillage(r.seed);if(upgradeShip)s.ensureShipActors(r);if(upgradeClinic)s.ensureClinicStaff(r);}
  s.reconcileTerrain();return s;
 }
 static restore(data){data=this.migrateSave(data);if(data?.schema!==4||!Array.isArray(data.players)||!Array.isArray(data.rooms)||data.players.length>200)throw Error('この改修より前の進行中データは別保管されています。');const s=new Simulation({seed:data.seed,mode:data.mode});s.time=+data.time||0;s.seq=+data.seq||0;s.eid=+data.eid||0;s.roomSeq=+data.roomSeq||1;s.rooms=new Map(data.rooms);s.players=new Map(data.players);s.legacies=data.legacies||{};s.abandoned=data.abandoned||[];if(Number.isInteger(data.rngState))s.rng.setState(data.rngState);for(const p of s.players.values()){if(!s.rooms.has(p.room))throw Error('村の記録がありません。');p.attackBufferedUntil=0;p.attackStep??=null;p.hitReactAt??=0;p.hitReactUntil??=0;p.hitDir??=0;p.hitSeverity??=null;p.input={x:0,z:0};p.guard=false;p.guardPending=false;p.speech='';p.speechUntil=0;p.phaseLimitVersion=0;s.preparePlayer(p);p.dash=null;p.autoFight=null;p.autoSkill=null;p.chain=null;p.pendingSkill=null;p.combo=null;p.attackStep=null;delete p.hitRecoil;s.stopTraversal(p);p.action=incapacitated(p)?p.lifeState:p.alive?(p.seated?'sit':'idle'):'fall';SkillSystem.restore(s,p);}for(const r of s.rooms.values()){if(r.kind==='village'){r.map=makeVillage(r.seed);const spot=villagePracticePosition(r.map);for(const a of r.actors)if(a.kind==='dummy'&&a.shipStation==null){a.x=a.homeX=spot.x;a.z=a.homeZ=spot.z;}s.ensureShipActors(r);s.ensureClinicStaff(r);}r.actors=r.actors.filter(a=>a.kind!=='villager');for(const a of r.actors){if(a.kind==='archer')a.kind='soldier';if(a.kind==='mage')a.kind='goblin';a.statuses??={};a.hp??=a.kind==='guard'?130:a.elite?120:70;a.hpMax??=a.hp;a.npcResolveMax??=a.kind==='guard'?18:14;if(data.version!==VERSION)a.npcResolve=a.npcResolveMax;}}for(const p of s.players.values()){const r=s.getRoom(p);if(r.kind==='village'){if(p.z>29.5){s.bound(p,r);p.supportHeight=supportHeight(r.map,p.x,p.z);}if(p.queued||onShipDeck(p))p.queued=p.age>=15&&onShipDeck(p);}}for(const l of Object.values(s.legacies))l.archive=l.archive.filter(id=>skillById(id));s.reconcileTerrain();return s;}
}

/* Event-driven life experience. Uses its own saved RNG; never the combat/world RNG. */
const BloodlineSkills = (() => {
 'use strict';
 const REVISION = 4, MAX_JOURNAL = 96, MAX_CONTEXTS = 192;
 const ACTIVE_PACING = Object.freeze({gain:.4,threshold:3.65,perKnown:.25,maxThreshold:9.5,cooldown:105,perKnownSeconds:15,maxCooldown:300,cost:4.6,perKnownCost:.35});
 const TAGS = new Set(['weight','rhythm','craft','care','patience','play','light','explore','track','precision','combat','tension','observe','rest','study','pray','read','memory','bell','feather','stone','charcoal','net','cross','family','defeat','weapon']);
 const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
 const object = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
 const list = v => Array.isArray(v) ? v : [];
 const validTags = v => [...new Set(list(v).filter(t => TAGS.has(t)))];
 function hash(value) { let h=2166136261; for (const c of String(value)) { h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0||1; }
 function next(state) { let x=state.rng>>>0; x^=x<<13; x^=x>>>17; x^=x<<5; state.rng=x>>>0||1; return state.rng/4294967296; }
 function pick(items, weight, state) {
  const weights=items.map(d=>Math.max(0,finite(weight(d)))), total=weights.reduce((a,b)=>a+b,0);
  if (!total) return null;
  let n=next(state)*total;
  for(let i=0;i<items.length;i++) { n-=weights[i]; if(n<0) return items[i]; }
  return items.at(-1);
 }
 function create(seed, life) {
  return {version:1,revision:REVISION,life:String(life),lifeSeed:hash(seed+':'+life),rng:hash(seed+':'+life),experience:{},recent:{},contexts:{},acceptedAt:{},journal:[],discovered:[],memories:{},charge:0,lastDiscovery:-100,lastOpportunity:-100,activeInspiration:{charge:0,lastDiscovery:-100,rng:hash(seed+':'+life+':active')},lastEvent:-100,serial:0,unread:[],seenRegions:[],sampleAt:0,sampleX:null,sampleZ:null,connections:{},glimpses:{lastAt:-100,seen:[]},equipmentSeen:[],inheritedTags:[],inspiration:{route:null,sourceSerials:[]}};
 }
 function restore(raw,seed,life) {
  const s=create(seed,life);
  if(!raw || raw.version!==1) return s;
  s.lifeSeed=Number.isInteger(raw.lifeSeed)&&raw.lifeSeed>0?raw.lifeSeed>>>0:s.lifeSeed;
  s.rng=Number.isInteger(raw.rng)&&raw.rng>0?raw.rng>>>0:s.rng;
  for(const field of ['experience','recent']) for(const [k,v] of Object.entries(object(raw[field]))) if(TAGS.has(k)&&Number.isFinite(v)&&v>=0) s[field][k]=Math.min(v,10000);
  for(const field of ['contexts','acceptedAt']) s[field]=Object.fromEntries(Object.entries(object(raw[field])).filter(([k,v])=>k.length<120&&Number.isFinite(v)&&v>=0).slice(-MAX_CONTEXTS));
  s.journal=list(raw.journal).filter(e=>e&&Number.isFinite(e.at)&&Array.isArray(e.tags)&&typeof e.text==='string').slice(-MAX_JOURNAL).map(e=>({at:e.at,serial:finite(e.serial),kind:String(e.kind).slice(0,32),context:String(e.context).slice(0,110),tags:validTags(e.tags),text:e.text.slice(0,180)}));
  s.discovered=list(raw.discovered).filter(e=>e&&Number.isInteger(e.id)&&typeof e.key==='string').slice(-1024).map(e=>({id:e.id,key:e.key.slice(0,100),family:String(e.family||'').slice(0,64),at:finite(e.at),trigger:finite(e.trigger),route:['main','cross','deviation'].includes(e.route)?e.route:'main',reasons:list(e.reasons).slice(0,4).map(x=>String(x).slice(0,180)),tags:validTags(e.tags),sourceSerials:list(e.sourceSerials).filter(Number.isInteger).slice(0,4)}));
  s.unread=[...new Set(list(raw.unread).filter(Number.isInteger))].slice(-1024);
  for(const [k,m] of Object.entries(object(raw.memories))) if(TAGS.has(k)&&m&&typeof m.text==='string') s.memories[k]={text:m.text.slice(0,180),at:finite(m.at),origin:m.origin==='family'?'family':'found'};
  for(const k of ['charge','lastDiscovery','lastEvent','serial','sampleAt']) s[k]=finite(raw[k],s[k]);
  s.charge=Math.max(0,Math.min(s.charge,12));s.serial=Math.max(0,Math.floor(s.serial));
  s.lastOpportunity=finite(raw.lastOpportunity,s.lastDiscovery);
  const active=object(raw.activeInspiration);
  s.activeInspiration={charge:Math.max(0,Math.min(finite(active.charge,s.charge*ACTIVE_PACING.gain),12)),lastDiscovery:finite(active.lastDiscovery,s.lastDiscovery),rng:Number.isInteger(active.rng)&&active.rng>0?active.rng>>>0:hash(s.lifeSeed+':active')};
  for(const k of ['sampleX','sampleZ']) s[k]=Number.isFinite(raw[k])?raw[k]:null;
  s.seenRegions=list(raw.seenRegions).filter(x=>typeof x==='string').slice(-96);
  s.inheritedTags=validTags(raw.inheritedTags).slice(0,6);s.equipmentSeen=list(raw.equipmentSeen).filter(x=>typeof x==='string').slice(0,64);
  s.connections=Object.fromEntries(Object.entries(object(raw.connections)).filter(([k,v])=>/^\d+:\d+$/.test(k)&&Number.isFinite(v)&&v>0).slice(-256).map(([k,v])=>[k,Math.min(10000,v)]));
  s.glimpses={lastAt:finite(raw.glimpses?.lastAt,-100),seen:list(raw.glimpses?.seen).filter(k=>GLIMPSES.some(g=>g.key===k)).slice(-16)};
  s.inspiration={route:['main','cross','deviation'].includes(raw.inspiration?.route)?raw.inspiration.route:null,sourceSerials:list(raw.inspiration?.sourceSerials).filter(Number.isInteger).slice(0,4)};
  return s;
 }
 // A crossing needs distinct kinds of experience, not two tags emitted by one task.
 function witnesses(def,state) {
  const groups=def.requiresExperience;
  const memories=Object.entries(state.memories).map(([tag,m])=>({...m,kind:'memento',tags:[tag,'memory'],serial:0}));
  const choices=groups.map(group=>[...state.journal].reverse().concat(memories).filter(r=>r.tags.some(t=>group.includes(t))));
  if(choices.some(xs=>!xs.length)) return [];
  if(groups.length===1) return [choices[0][0]];
  for(const first of choices[0]) {
   const result=[first];
   for(const xs of choices.slice(1)) {
    const found=xs.find(r=>result.every(other=>r.kind!==other.kind));
    if(found) result.push(found);
   }
   if(result.length===groups.length) return result;
  }
  return [];
 }
 class Catalog {
  constructor(defs) {
   this.defs=defs;this.byId=new Map();this.byKey=new Map();this.families=new Map();this.index=new Map();this.conditions=new Map();this.metrics={events:0,evaluated:0,pools:0};
   for(const d of defs) {
    if(this.byId.has(d.id)||this.byKey.has(d.key)) throw Error('Duplicate skill identity');
    this.byId.set(d.id,d);this.byKey.set(d.key,d);
    this.conditions.set(d.id,JSON.stringify(d.requiresExperience));
    if(!this.families.has(d.family)) this.families.set(d.family,[]);
    this.families.get(d.family).push(d);
    for(const tag of new Set(d.requiresExperience.flat())) { if(!this.index.has(tag))this.index.set(tag,new Set());this.index.get(tag).add(d.family); }
   }
  }
  search(text,locale='ja',limit=30) { const q=String(text).toLowerCase().slice(0,100);return this.defs.filter(d=>(d.names[locale]||d.names.ja).toLowerCase().includes(q)||d.key.includes(q)).slice(0,Math.max(0,Math.min(100,limit))); }
  pool(state,event,context={}) {
   const families=new Set();
   for(const tag of event.tags) for(const family of this.index.get(tag)||[]) families.add(family);
   const learned=new Set([...(context.known||[]),...state.discovered.map(d=>d.id)]),result=[],proofCache=new Map();
   for(const family of families) {
    const variants=[];
    for(const d of this.families.get(family)) {
     this.metrics.evaluated++;
     if(learned.has(d.id))continue;
     if(d.action?.school==='shield'&&!context.shield||d.action?.weapon>=0&&d.action.weapon!==context.weapon||(d.action?.requires||[]).some(part=>context.lost?.includes(part)))continue;
     const proofKey=this.conditions.get(d.id);let proof=proofCache.get(proofKey);
     if(!proof){proof=d.requiresExperience.every(group=>group.some(t=>(state.experience[t]||0)>=(state.memories[t]?1:1.25)))?witnesses(d,state):[];proofCache.set(proofKey,proof);}if(!proof.length)continue;
     variants.push({def:d,proof});
    }
    if(variants.length)result.push({family,variants,anchor:this.families.get(family)[0]});
   }
   this.metrics.pools++;return result;
  }
  observe(state,event,context={}) {
   this.metrics.events++;
   const at=finite(event.at),tags=validTags(event.tags),key=String(event.context||event.kind).slice(0,110);
   if(!tags.length||typeof event.text!=='string'||at<state.lastEvent)return null;
   if(at-(state.acceptedAt[key]??-100)<3.8)return null;
   const n=state.contexts[key]||0,gain=Math.max(.06,1/Math.sqrt(1+n*.8));
   state.contexts[key]=n+1;state.acceptedAt[key]=at;
   for(const field of ['contexts','acceptedAt']) { const keys=Object.keys(state[field]);if(keys.length>MAX_CONTEXTS)delete state[field][keys[0]]; }
   for(const tag of Object.keys(state.recent))state.recent[tag]*=.89;
   for(const tag of tags){state.experience[tag]=Math.min(10000,(state.experience[tag]||0)+gain);state.recent[tag]=Math.min(12,(state.recent[tag]||0)+gain);}
   // Inspiration matures from accepted experience; it is not XP or a level-up currency.
   const inspirationGain=.35+.5*gain;
   state.lastEvent=at;state.serial++;state.charge=Math.min(12,state.charge+inspirationGain);
   const active=state.activeInspiration;active.charge=Math.min(12,active.charge+inspirationGain*ACTIVE_PACING.gain);
   const record={at,kind:String(event.kind),context:key,tags,text:event.text.slice(0,180),serial:state.serial};
   state.journal.push(record);if(state.journal.length>MAX_JOURNAL)state.journal.shift();
   if(event.memento&&TAGS.has(event.memento)&&!state.memories[event.memento])state.memories[event.memento]={text:record.text,at,origin:event.origin||'found'};
   state.inheritedTags=validTags(context.inheritedTags).slice(0,6);
   if(context.age<4||context.prologue||state.charge<3.65||at-state.lastOpportunity<30)return null;
   const pool=this.pool(state,{...event,tags},context);if(!pool.length)return null;
   const chance=Math.min(.92,.24+Math.max(0,state.charge-3.65)*.14+Math.max(0,at-state.lastOpportunity-90)*.001);
   if(next(state)>chance)return null;
   const recentFamilies=state.discovered.slice(-5).map(d=>d.family);
   const routeFor=v=>v.def.requiresExperience.length>1?'cross':v.def.tags.some(t=>tags.includes(t)&&!['memory','patience','rhythm'].includes(t))?'main':'deviation';
   const familyWeight=f=>{
    const d=f.anchor||f.variants[0].def,basis=d.requiresExperience.flat(),route=routeFor({def:d});
    const focus=basis.reduce((n,t)=>n+(state.recent[t]||0),0)/basis.length,history=basis.reduce((n,t)=>n+Math.sqrt(state.experience[t]||0),0)/basis.length;
    const inherited=basis.some(t=>state.inheritedTags.includes(t))?1+Math.min(.35,d.inheritance?.bias??.22):1;
    const affinity=(d.affinities||[]).some(t=>(state.experience[t]||0)>1)?1.25:1;
    const lifeBias=.7+(hash(state.lifeSeed+':'+f.family)%1000)/1000*.6;
    const familiar=1/(1+recentFamilies.filter(x=>x===f.family).length*.6);
    return d.rarity*(.55+focus*.35+history*.1)*({main:1,cross:1.7,deviation:.28}[route])*inherited*familiar*affinity*lifeBias;
   };
   let family=pick(pool,familyWeight,state);if(!family)return null;
   const phases=new Set([0,...(context.known||[]).map(id=>this.byId.get(id)).filter(d=>d&&!d.passive).map(d=>d.phase)]);
   const variantWeight=v=>(!v.def.passive&&!phases.has(v.def.phase)?1.5:1)*v.def.rarity;
   let selected=pick(family.variants,variantWeight,state);
   // Preserve the original opportunity cadence and mixed pool for passives.
   // A still-maturing active idea spends this opportunity, never grants a passive instead.
   state.lastOpportunity=at;state.charge=Math.max(0,state.charge-4.6);
   if(!selected.def.passive){
    const known=new Set([...(context.known||[]),...state.discovered.map(d=>d.id)]),count=[...known].filter(id=>{const d=this.byId.get(id);return d&&!d.passive;}).length;
    const threshold=Math.min(ACTIVE_PACING.maxThreshold,ACTIVE_PACING.threshold+count*ACTIVE_PACING.perKnown),interval=Math.min(ACTIVE_PACING.maxCooldown,ACTIVE_PACING.cooldown+count*ACTIVE_PACING.perKnownSeconds);
    if(active.charge<threshold||at-active.lastDiscovery<interval)return null;
    const lastFamily=state.discovered.findLast(d=>!this.byId.get(d.id)?.passive)?.family;
    const activePool=pool.map(f=>({...f,variants:f.variants.filter(v=>!v.def.passive)})).filter(f=>f.variants.length);
    family=pick(activePool,f=>familyWeight(f)*(routeFor(f.variants[0])==='cross'?1.6:1)*(f.family===lastFamily?.35:1),active);
    selected=pick(family.variants,variantWeight,active);
    active.charge=Math.max(0,active.charge-ACTIVE_PACING.cost-count*ACTIVE_PACING.perKnownCost);active.lastDiscovery=at;
   }
   const d=selected.def;
   const proof=[...selected.proof];
   for(const tag of tags)if(state.memories[tag]&&proof.length<3&&!proof.some(r=>r.text===state.memories[tag].text))proof.push({...state.memories[tag],serial:0});
   const discovery={id:d.id,key:d.key,family:d.family,at,reasons:[...new Set(proof.map(r=>r.text))],trigger:record.serial,tags:[...d.tags],route:routeFor(selected),sourceSerials:proof.map(r=>r.serial).filter(Boolean)};
   state.discovered.push(discovery);state.unread.push(d.id);state.lastDiscovery=at;
   state.inspiration={route:discovery.route,sourceSerials:discovery.sourceSerials};return discovery;
  }
 }
 // These are observations about lived contrasts, not recipes or pending skill IDs.
 const GLIMPSES = [
  {key:'craft-combat',groups:[['craft'],['combat']],text:'道具を扱う手つきが、戦いの手応えと重なる……'},
  {key:'rest-tension',groups:[['rest'],['tension','defeat']],text:'息を整えると、あの張りつめた一瞬が浮かぶ……'},
  {key:'explore-precision',groups:[['explore'],['precision']],text:'歩いて覚えた間合いが、狙いを定める感覚に重なる……'},
  {key:'play-rhythm',groups:[['play'],['rhythm']],text:'遊びの拍子が、別の動きの中にも聞こえる……'},
  {key:'family-patience',groups:[['family'],['patience']],text:'待つ静けさの中に、あの人と過ごした時間がよみがえる……'},
  {key:'memento-rhythm',groups:[['bell','stone','feather','charcoal','net'],['rhythm']],text:'手元の小さな思い出が、今日の動きに結びつきかける……'}
 ];
 function glimpse(state,at) {
  const seen=state.glimpses;
  if(state.serial<8||at-seen.lastAt<120||at-state.lastDiscovery<30)return null;
  const recent=state.journal.filter(r=>at-r.at<=180);
  const choices=GLIMPSES.filter(g=>!seen.seen.includes(g.key)&&g.groups.some(tags=>tags.some(t=>recent.at(-1)?.tags.includes(t))))
   .sort((a,b)=>hash(state.lifeSeed+':'+a.key)-hash(state.lifeSeed+':'+b.key));
  for(const g of choices) {
   const proof=witnesses({requiresExperience:g.groups},{journal:recent,memories:state.memories});
   if(proof.length!==g.groups.length)continue;
   seen.lastAt=at;seen.seen.push(g.key);
   return {text:g.text,sources:proof.map(r=>r.serial||0)};
  }
  return null;
 }
 function connection(def,link,target,time,band) { return !!(def&&link&&link.target===target&&link.until>=time&&link.band<band&&def.entry.some(tag=>link.tags.includes(tag))); }
 return {Catalog,create,restore,hash,next,connection,witnesses,glimpse,REVISION};
})();

/* Explicit adapters to the existing Simulation. No prototype overrides or extra loop. */
const BL_SKILL_CATALOG = new BloodlineSkills.Catalog(BL_SKILL_DEFINITIONS);
for (const def of BL_SKILL_DEFINITIONS) {
 const a=def.action||{};
 art(def.id,def.names.ja,{...a,animation:a.anim||'slash',travel:a.step??.25,form:['slam','leap'].includes(a.anim)?6:['thrust','zigzag'].includes(a.anim)?2:a.hits>1?3:0,status:a.status?{id:a.status,duration:a.duration}:null,school:a.anim==='slam'?'heavy':a.school||'life',band:def.phase,passive:!!def.passive,trigger:def.passive?'passive':'combo',effect:def.effect,value:def.value,color:def.color,desc:def.descriptions.ja,motion:def.names.ja,skillKey:def.key});
}
const SkillSystem = (() => {
 const activities={
  observe:{tags:['craft','weight','rhythm'],text:'鍛冶場で、道具が打ち返す拍子を見た'},
  care:{tags:['care','craft','patience'],text:'武具を手入れし、力の通り道を確かめた'},
  play:{tags:['play','light','rhythm'],text:'庭で遊び、弾む足の拍子を覚えた'},
  track:{tags:['track','explore','precision'],text:'狩人の足跡を学び、一歩先を読んだ'},
  study:{tags:['study','combat','patience'],text:'指南書と稽古で、構えの意味を学んだ'},
  read:{tags:['read','patience','rhythm'],text:'書物を読み、繰り返す形に気づいた'},
  pray:{tags:['pray','rest','patience'],text:'祈りの間、息と静けさを確かめた'}
 };
 const names={bell:'鈴',stone:'小石',feather:'羽根',charcoal:'炭の欠片',net:'糸の網'};
 const legacyTags={heavy:['weight','craft'],light:['light','explore'],blade:['combat','precision'],unarmed:['combat','rhythm'],shield:['patience','combat'],church:['rest','patience'],magic:['patience','rhythm']};
 const identity=p=>p.id+':'+p.gen+':'+p.appearanceSeed;
 function prepare(sim,p) {
  if(!p.skillLife) { p.skillLife=BloodlineSkills.create(sim.seed,identity(p));p.skillLife.sampleAt=sim.time;p.skillLife.equipmentSeen.push(p.weapon+':'+p.armor+':'+p.shield); }
  p.skillLifeNotice??='';
 }
 function restore(sim,p) {
  const raw=p.skillLife;p.skillLifeNotice='';
  if(raw&&(raw.version!==1||!Array.isArray(raw.journal)||!Array.isArray(raw.discovered)||typeof raw.experience!=='object')){p.skillLifeBackup??={raw:JSON.parse(JSON.stringify(raw)),reason:'invalid-skill-extension'};p.skillLifeNotice='技の記憶を修復しました。元の記録は別に保管しています。';}
  p.skillLife=BloodlineSkills.restore(raw,sim.seed,identity(p));
  p.skillLife.discovered=p.skillLife.discovered.filter(d=>BL_SKILL_CATALOG.byId.get(d.id)?.key===d.key&&(p.skills.includes(d.id)||p.passives.includes(d.id)));
  p.skillLife.unread=p.skillLife.unread.filter(id=>p.skills.includes(id)||p.passives.includes(id));
  reset(p);
 }
 function reset(p) { p.skillLink=null;p.skillCast=null;p.skillExit=null; }
 function withMemento(p,event) {
  const held=(p.inventory||[]).filter(id=>names[id]);if(!held.length)return event;
  const id=held[p.skillLife.serial%held.length];
  return {...event,tags:[...event.tags,id,'memory'],text:event.text+'。手元には'+names[id]+'があった'};
 }
 function record(sim,p,event) {
  if(!p?.alive)return;prepare(sim,p);
  const inherited=[...new Set((p.inherit||[]).flatMap(id=>BL_SKILL_CATALOG.byId.get(id)?.tags||legacyTags[skillById(id)?.school]||['combat']))];
  // A witnessed defeat influences a future idea, never grants the parent's technique.
  const ancestor=sim.legacy(p.owner).records.findLast(r=>(p.inherit||[]).includes(r.skill));
  if(ancestor?.skillHistory?.defeat)inherited.push('tension','patience');
  const serial=p.skillLife.serial;
  const d=BL_SKILL_CATALOG.observe(p.skillLife,{...event,at:sim.time},{age:p.age,prologue:p.prologue,known:[...p.skills,...p.passives],weapon:p.weapon,shield:p.shield,lost:Object.entries(p.wounds||{}).filter(([,v])=>v.severity==='lost').map(([k])=>k),inheritedTags:inherited});
  if(d)sim.learn(p,d.id);
  else if(p.skillLife.serial!==serial&&!p.prologue&&p.age>=4&&!p.autoFight) {
   const glimpse=BloodlineSkills.glimpse(p.skillLife,sim.time);
   if(glimpse)sim.emit('skillglimpse',{player:p.id,room:p.room,x:p.x,z:p.z,...glimpse});
  }
 }
 function onEvent(sim,e) {
  const p=sim.players.get(e.player||e.source);if(!p)return;
  prepare(sim,p);
  if(['insight','passive'].includes(e.type)) { e.discovery=p.skillLife.discovered.find(d=>d.id===e.id);return; }
  if(['wound','death','clash','depart','returned','released','sit'].includes(e.type))reset(p);
  if(!p.alive)return;
  let event=null;
  if(e.type==='progress'&&activities[p.activity])event={kind:p.activity,context:'work:'+p.activity,...activities[p.activity]};
  if(e.type==='pickup'&&names[e.item]) {
   const origin=e.gift?'family':'found',text=(e.gift?'家族から受け取った':'道で拾った')+names[e.item];
   // First provenance stays intact after discard/reacquisition and holding in later activities.
   p.skillLife.memories[e.item]??={origin,text,at:sim.time};
   event={kind:'memento',context:'pickup:'+e.item,tags:[e.item,'memory',...(e.gift?['family']:['explore'])],text,memento:e.item,origin};
  }
  if(e.type==='mother'&&p.prologue)event={kind:'family',context:'family:mother',tags:['family','patience'],text:'腕の中で、母の声を聞いた'};
  if(e.type==='equipped'&&!p.skillLife.equipmentSeen.includes(p.weapon+':'+p.armor+':'+p.shield)){p.skillLife.equipmentSeen.push(p.weapon+':'+p.armor+':'+p.shield);event={kind:'equipment',context:'gear:'+p.weapon+':'+p.armor+':'+p.shield,tags:['weapon','care',...(p.weapon===2||p.armor===2?['weight']:['precision'])],text:'武具棚で身支度を変え、重心を確かめた'};}
  if(e.type==='hit'&&e.source===p.id) {
   const def=BL_SKILL_CATALOG.byId.get(e.skill),target=sim.getRoom(p)?.actors.find(a=>a.id===e.target);
   if(target)event={kind:'contact',context:'contact:'+target.kind,tags:['combat','rhythm',...(target.kind==='dummy'?['patience']:['tension','weight'])],text:target.kind==='dummy'?'稽古人形に打ち込み、当たる拍子を確かめた':'敵に打ち込み、押し合う重みを知った'};
  }
  if(e.type==='wound'&&e.severity!=='fatal')event={kind:'setback',context:'combat:wound',tags:['combat','tension','defeat'],text:'傷を負い、攻め終わりの隙を思い知った'};
  if(e.type==='clash')event={kind:'clash',context:'combat:clash',tags:['combat','weight','tension'],text:'敵とぶつかり、踏みとどまる重みを知った'};
  if(e.type==='kill')event={kind:'victory',context:'combat:win',tags:['combat','precision'],text:'敵を倒し、最後の間合いを覚えた'};
  if(e.type==='landed'&&e.profile===1)event={kind:'traversal',context:'traversal:'+e.room+':'+(e.obstacle||'ledge'),tags:['light','precision'],text:e.kind==='vault'?'低い障害物を飛び越え、着地の拍子を覚えた':'縁に手をかけてよじ登り、体を支える足運びを覚えた'};
  if(e.type==='returned')event={kind:'return',context:'journey:return',tags:['explore','rest','tension'],text:'最前線から帰り、村の静けさを知った'};
  if(event)record(sim,p,withMemento(p,event));
 }
 function contact(sim,p,target,sk) {
  const def=BL_SKILL_CATALOG.byId.get(sk.id);if(!def)return;
  // Called after the original damage / reaction resolution, never on a miss or guard.
  if(target.alive&&sk.stagger&&target.kind!=='boss') {
   target.stun=Math.max(target.stun,sim.time+sk.stagger/(target.elite?1.65:1));
   target.actionUntil=Math.max(target.actionUntil,target.stun);target.telegraph=null;
  }
  const cast=p.skillCast;
  if(cast?.linked&&cast.id===def.id&&cast.target===target.id&&!cast.announced) {
   cast.announced=true;const key=cast.from+':'+def.id;
   p.skillLife.connections[key]=Math.min(10000,(p.skillLife.connections[key]||0)+1);
   const first=p.skillLife.connections[key]===1,signal=first?'discovery':sim.time-(p.skillConnectionAt??-100)>=6?'echo':'quiet';
   if(signal!=='quiet')p.skillConnectionAt=sim.time;
   sim.emit('skillconnection',{player:p.id,room:p.room,id:def.id,from:cast.from,target:target.id,x:target.x,z:target.z,dir:p.dir,connectionKind:cast.connectionKind,first,signal});
  }
  if(!target.alive){p.skillExit=null;return;}
  const tags=def.exit.filter(tag=>tag!=='offbalance'||target.kind==='dummy'||target.stun>sim.time||target.exposedUntil>sim.time).filter(tag=>tag!=='close'||dist(target,p)<=2.4);
  p.skillExit={id:def.id,target:target.id,tags,until:sim.time+5,band:p.combo?.band??0};
 }
 function sample(sim,p) {
  const s=p.skillLife;if(p.prologue||p.age<4||sim.time<s.sampleAt)return;
  s.sampleAt=sim.time+5;
  const moved=s.sampleX!==null&&Math.hypot(p.x-s.sampleX,p.z-s.sampleZ)>3;
  s.sampleX=p.x;s.sampleZ=p.z;
  if(p.activity)return;
  if(moved&&!p.autoFight) {
   const region=p.room+':'+(p.z<-28?'outskirts':sim.getArea(p)),fresh=!s.seenRegions.includes(region);
   if(fresh)s.seenRegions.push(region);if(s.seenRegions.length>96)s.seenRegions.shift();
   record(sim,p,withMemento(p,{kind:'explore',context:'walk:'+region,tags:['explore','light',...(fresh?['precision']:[])],text:fresh?'歩いて、新しい場所の間合いを覚えた':'歩き慣れた道の、足の運びを確かめた'}));
  } else if(p.seated&&sim.time-p.lastExertion<35)record(sim,p,withMemento(p,{kind:'rest',context:'rest:'+sim.getArea(p),tags:['rest','patience'],text:'動いたあとに腰を下ろし、息を整えた'}));
 }
 function prepareCast(sim,p,sk) {
  p.skillCast=null;
  const d=BL_SKILL_CATALOG.byId.get(sk.id);if(!d){p.skillLink=null;return sk;}
  const target=sim.getRoom(p)?.actors.find(e=>e.id===p.autoFight&&e.alive),link=p.skillLink;p.skillLink=null;
  if(!target||dist(target,p)>sk.reach+.8||!BloodlineSkills.connection(d,link,target.id,sim.time,p.combo?.band??0))return sk;
  if(d.entry.includes('offbalance')&&link.tags.includes('offbalance')&&target.kind!=='dummy'&&!(target.stun>sim.time||target.exposedUntil>sim.time))return sk;
  const bonus=d.connection||{},cast={id:sk.id,from:link.id,linked:true,target:target.id,announced:false,connectionKind:d.entry.find(tag=>link.tags.includes(tag))};
  for(const key of ['charge','recovery','cost'])if(bonus[key]!==undefined)cast[key]=sk[key]*bonus[key];
  for(const key of ['reach','breakPower','knockback','tracking'])if(bonus[key]!==undefined)cast[key]=(sk[key]||0)+bonus[key];
  p.skillCast=cast;return {...sk,...cast};
 }
 function active(p,id) { const sk=skillById(id);return sk&&p.skillCast?.id===id?{...sk,...p.skillCast}:sk; }
 function complete(sim,p) {
  p.skillLink=p.skillExit&&p.skillExit.id===p.currentSkill?p.skillExit:null;p.skillExit=null;
 }
 function remember(p) {
  return {revision:BloodlineSkills.REVISION,defeat:p.cause!=='寿命'&&!!p.cause,families:[...new Set(p.skillLife.discovered.map(d=>d.family))],discoveries:p.skillLife.discovered.slice(-8).map(d=>({id:d.id,reasons:d.reasons,route:d.route})),connections:{...p.skillLife.connections},signature:Object.entries(p.skillUses||{}).filter(([id,n])=>Number.isFinite(n)&&n>0&&skillById(+id)&&!skillById(+id).passive).sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0])).slice(0,3).map(([id])=>Number(id))};
 }
 return {prepare,restore,reset,record,onEvent,contact,sample,prepareCast,active,complete,remember};
})();


export {Simulation};
