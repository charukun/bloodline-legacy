
/* Shared, renderer-independent simulation. All gameplay decisions stay here. */
const VERSION = '0.6.0';
const GAME_TITLE='血脈の系譜';
const EQUIP_AGE=7;
const MAX_ITEMS=2;
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
const STAMINA = Object.freeze({max:100,minCap:22,regen:19,capRegen:1.1,delay:.38,capDelay:3.2});
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
function skillRestriction(p,sk){
 if(!sk||sk.passive)return '';
 const lost=part=>p.wounds?.[part]?.severity==='lost';
 if(p.statuses?.sleep?.until>(p.statusClock||0))return '眠り';
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
function makeVillage(seed=1) {
 const rng=random(seed),houses=[];
 // Two compact residential crescents: exactly 30 independent clan plots.
 for(let side of [-1,1])for(let i=0;i<15;i++) {
  const row=Math.floor(i/5),col=i%5;
  houses.push({id:houses.length,x:side*(18+row*6)+(rng()-.5)*.45,z:-22+col*6.5+(rng()-.5)*.4,rotation:side<0?Math.PI/2:-Math.PI/2,
   roof:Math.floor(rng()*4),scale:.86+rng()*.22});
 }
 const mirror=rng()<.5?-1:1;return {seed,houses,schools:SCHOOLS.map(x=>({...x,x:x.x*mirror,z:x.z+(x.id==='church'?0:(rng()-.5)*1.2)})),port:{x:0,z:28},gate:{x:0,z:-29}};
}
// Open forecourt: inside the dojo activity area and the village shore boundary.
function villagePracticePosition(map){const dojo=map.schools.find(s=>s.id==='sword');return {x:dojo.x,z:dojo.z+3};}
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
const ITEMS={stone:{name:'丸い小石',desc:'土の理を宿す。',icon:'stone'},net:{name:'結び糸の網',desc:'繋ぎ、絡める。',icon:'net'},bell:{name:'銀の鈴',desc:'祈りに澄む音。',icon:'bell'},charcoal:{name:'炭の欠片',desc:'火の記憶。',icon:'fire'},feather:{name:'渡り鳥の羽',desc:'風の道しるべ。',icon:'feather'}};
const staminaTier=sk=>!sk||sk.passive?0:sk.cost<=4?1:sk.cost<=7?2:sk.cost<=10?3:sk.cost<=14?4:5;
const book=new Map();
function art(id,name,opt={}){
 const s={id,name,weapon:-1,form:0,element:0,variant:0,trigger:'combo',school:'sword',color:'#dfc58b',cost:10,fatigue:1,charge:.22,swing:.30,recovery:.65,reach:2.0,arc:1.7,power:1,breakPower:0,targets:['torso'],requires:['rightArm'],motion:'打撃',desc:'隙を見つけて打つ。',flow:.08,chance:1,maxTargets:1,...opt};
 book.set(id,s);return s;
}
art(4000,'殴る',{cost:6,fatigue:.25,charge:.13,swing:.26,reach:1.3,recovery:.5,flow:.18,requires:[],targets:['torso','head'],desc:'踏み込んで拳を打つ。'});
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
const effectsOf=(p,effect)=>(p.passives||[]).reduce((n,id)=>n+(skillById(id)?.effect===effect?(skillById(id).value||0):0),0);
const phaseSkillCount=weights=>Object.values(weights||{}).filter(n=>Number(n)>0).length;
const miracleChance=(p,sk)=>clamp(sk.procChance+.06*Math.max(0,effectsOf(p,'faith')-1),0,.9);
const v3Weights=(ids,raw)=>{const out={};for(const id of ids){const n=Number(raw?.[id]);out[id]=Number.isFinite(n)?clamp(n,0,100):0;}if(!Object.values(out).some(x=>x>0)&&!ids.some(id=>Object.hasOwn(raw||{},id)&&Number.isFinite(+raw[id]))){const fallback=ids.includes(4000)?4000:ids[0];if(fallback!==undefined)out[fallback]=1;}return out;};

class Simulation {
 constructor({seed=7349,mode='normal'}={}){
  this.seed=seed;this.rng=random(seed);this.mode=mode==='normal'?'normal':'demo';this.yearSeconds=this.mode==='normal'?60:20;this.boatInterval=this.yearSeconds*5;
  this.time=0;this.players=new Map();this.rooms=new Map();this.legacies={};this.events=[];this.seq=0;this.eid=0;this.roomSeq=0;this.abandoned=[];this.makeRoom('village');
 }
 emit(type,data={}){const event={seq:++this.seq,t:this.time,type,...data};this.events.push(event);if(this.events.length>400)this.events.splice(0,100);SkillSystem.onEvent(this,event);}
 getRoom(p){return this.rooms.get(p.room);}
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
  let r;
  if(config.villageCode){r=[...this.rooms.values()].find(r=>r.kind==='village'&&!r.abandoned&&r.code===cleanText(config.villageCode,24).toUpperCase());if(!r)throw Error('その座標の村は見つからないか、すでに廃村です。');if(Object.keys(r.clans).length>=30)throw Error('この村に空き家がありません。');}
  else r=[...this.rooms.values()].find(r=>r.kind==='village'&&!r.abandoned&&Object.keys(r.clans).length<30)||this.makeRoom('village');
  const owner=cleanText(config.owner||id,80),legacy=this.legacy(owner),occupied=new Set(Object.values(r.clans));let house=0;while(occupied.has(house))house++;
  const p={id,owner,kind:'player',name:cleanText(config.name,12)||C_NAMES[Math.floor(this.rng()*C_NAMES.length)],clan:cleanText(config.clan,16)||'暁風',race:clamp(Math.trunc(+config.race||0),0,3),gender:Math.floor(this.rng()*2),weapon:-1,armor:0,shield:false,skin:Math.floor(this.rng()*4),hair:Math.floor(this.rng()*6),appearanceSeed:Math.floor(this.rng()*100000),enduranceXP:0,skillUses:{},training:{},inventory:[],introUntil:this.time+42,releaseAt:this.time+30,prologue:true,dash:null,openingVersion:6,motherIndex:0,motherNextAt:this.time+.2,motherText:'',motherUntil:0,giftOffer:['bell','stone','feather'],farewellStage:-1,age:0,ageFraction:0,lifespan:80+Math.floor(this.rng()*21),x:0,z:4,dir:Math.PI,room:r.id,home:r.id,house,alive:true,action:'idle',actionUntil:0,actionStarted:0,cooldown:0,guard:false,guardPending:false,guardStart:-10,guardHits:0,stun:0,dodgeUntil:0,stamina:100,staminaCap:100,lastExertion:-10,lastSkillAt:-10,wounds:{},passives:[],deeds:{},pendingSkill:null,attackStep:null,hitReactAt:0,hitReactUntil:0,hitDir:0,hitSeverity:null,hitUntil:0,input:{x:0,z:0},lastInput:this.time,born:this.time,kills:0,parries:0,clashes:0,skills:[4000],phaseWeights:[{4000:1},{},{}],weights:{4000:1},inherit:Array.isArray(config.inherit)?[...new Set(config.inherit.filter(x=>skillById(x)))].slice(0,1):[],usages:{attack:0,guard:0,skill:0},queued:false,zone:'village',cause:'',gen:legacy.generation,bornMode:this.mode,ammo:{arrows:0,magic:0,stones:0,nets:0},trinket:null,skillReady:{},combo:null,comboQueued:false,activity:null,activitySince:0,permanentFatigue:0,experience:0,speech:'',speechUntil:0,lastChat:-10,bankedSkills:[],recorded:false,returned:0,exertionLevel:0};
  const plot=r.map.houses[house];p.x=plot.x+(plot.x<0?2.8:-2.8);p.z=plot.z;p.introX=p.x;p.introZ=p.z;p.introHomeX=plot.x;p.introHomeZ=plot.z;p.introDir=plot.rotation;p.dir=p.introDir;
  this.preparePlayer(p);r.everOccupied=true;r.clans[id]=house;this.players.set(id,p);this.emit('birth',{player:id,room:r.id});return p;
 }
 removePlayer(id){const p=this.players.get(id);if(!p)return;const r=this.rooms.get(p.home);if(r){delete r.clans[id];this.checkAbandoned(r);}this.players.delete(id);}
 checkAbandoned(r){if(r?.kind==='village'&&!r.abandoned&&Object.keys(r.clans).length===0&&r.everOccupied){r.abandoned=true;this.abandoned.push(r.code);this.emit('abandoned',{room:r.id,code:r.code});}}
 actor(kind,x,z,tier=0){
  if(kind==='archer')kind='soldier';if(kind==='mage')kind='wraith';
  const guard=kind==='guard',elite=kind==='elite',neutral=['stag','mushroom'].includes(kind),humanoid=['guard','goblin','soldier','elite','archer','mage','dummy'].includes(kind);
  return {id:'e'+(++this.eid),kind,x,z,dir:0,tier,alive:true,action:'idle',actionUntil:0,actionStarted:0,cooldown:this.time+this.rng(),target:null,telegraph:null,stun:0,dodgeUntil:0,armor:elite?6:tier>0?2:0,guard:kind==='soldier',stance:this.rng()*TAU,homeX:x,homeZ:z,seals:kind==='boss'?4:0,attackCount:0,npcResolve:guard?18:elite?22:tier>0?14:10,npcResolveMax:guard?18:elite?22:tier>0?14:10,hp:guard?130:elite?120:tier>0?70:42,hpMax:guard?130:elite?120:tier>0?70:42,statuses:{},elite,lane:clamp(Math.round((x+10.5)/7),0,3),humanoid,neutral,aggro:false,smart:['soldier','elite'].includes(kind),bodyScale:elite?1.6:kind==='boss'?2.8:kind==='maw'?1.2:1,wounds:{},experience:guard?12:tier*5,hitUntil:0,hitReactAt:0,hitReactUntil:0,hitDir:0,hitSeverity:null,ammo:kind==='archer'?10:kind==='mage'?3:0,name:({elite:'冠角の執行者',crawler:'鎌脚の蟲',wraith:'裂け目の亡霊',maw:'殻喰い',stag:'苔角の獣',mushroom:'眠る菌傘',soldier:'盾持ちの異形',archer:'骨弓の異形',mage:'呪灯の亡霊'})[kind]||''};
 }
 spawnVillageNPCs(r){
  for(let i=0;i<4;i++){const g=this.actor('guard',-10.5+i*7,-32);g.lane=i;r.actors.push(g);const e=this.actor(['crawler','wraith','maw','goblin'][i],-10.5+i*7,-39,i===2?1:0);e.lane=i;r.actors.push(e);}
  r.actors.push(this.actor('stag',-19,-38,1),this.actor('mushroom',18,-42,0));
  // No ambient villagers. Parents are rendered only for the opening scene.
  const spot=villagePracticePosition(r.map),dummy=this.actor('dummy',spot.x,spot.z);dummy.name='稽古人形';r.actors.push(dummy);
 }
 preparePlayer(p){
  p.health??=100;p.statuses??={};p.statusClock=this.time;p.lastHurtAt??=-100;
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
   p.weights=p.phaseWeights[0];p.bindings=null;p.loadoutVersion=5;p.gestureKit=false;p.autoFight=null;p.chain=null;p.seated=false;
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
 motherSay(p,text,duration=6){p.motherText=text;p.motherUntil=this.time+duration;this.emit('mother',{player:p.id,room:p.room,text,x:p.x,z:p.z});}
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
   if(this.time>=p.motherNextAt){const lines=MOTHER_LINES.cradle,index=p.motherIndex||0;this.motherSay(p,lines[index%lines.length],5.8);p.motherIndex=index+1;p.motherNextAt=this.time+5.9;}
   return;
  }
  if(p.farewellStage>=0&&p.farewellStage<2&&this.time-p.releaseAt>=(p.farewellStage+1)*4){p.farewellStage++;this.motherSay(p,FAREWELL_LINES[p.farewellStage],4.7);}
 }
 bindGesture(){return false;}
 equip(p,cmd){
  const r=this.getRoom(p),rack=r.kind==='village'?r.map.schools.find(s=>s.id==='armory'):null;
  if(!rack||dist(p,{x:rack.x,z:rack.z+3})>5.4){this.notice(p,'武具棚のそばで着替えよう');return false;}
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
  if(!p.alive||p.age<4||p.prologue||p.activity||p.autoFight||p.seated||p.guard||p.guardPending||(p.autoSuppressedUntil||0)>this.time)return;
  const target=r.actors.filter(e=>e.alive&&(enemiesOnly(e)||e.kind==='dummy')&&(!e.neutral||e.aggro)&&dist(e,p)<=this.collisionRadius(p)+this.collisionRadius(e)+.55).sort((a,b)=>dist(a,p)-dist(b,p))[0];
  if(target){this.stopDash(p);p.autoFight=target.id;p.autoRestUntil=0;target.aggro=true;this.emit('engage',{player:p.id,room:r.id,target:target.id,x:p.x,z:p.z});}
 }
 tickAutoCombat(p,r,dt){
  if(!p.autoFight)return;
  const target=r.actors.find(e=>e.id===p.autoFight),l=Math.hypot(p.input.x,p.input.z);
  const away=target?((p.x-target.x)*p.input.x+(p.z-target.z)*p.input.z)/Math.max(.001,dist(p,target)):0;
  if(!target?.alive||dist(p,target)>4.6||p.seated||away>.2&&l>.15){p.autoFight=null;p.autoSuppressedUntil=this.time+.8;return;}
  if(p.stun>this.time||hasStatus(p,'sleep',this.time)||hasStatus(p,'stun',this.time)||p.guard||p.guardPending)return;
  if(l<.1&&!p.pendingSkill&&!p.chain){
   p.dir=Math.atan2(target.x-p.x,target.z-p.z);
   if(dist(p,target)>1.45&&!hasStatus(p,'root',this.time)&&p.cooldown<=this.time){const amount=Math.min(dist(p,target)-1.4,dt*4.8*(hasStatus(p,'slow',this.time)?.5:1));this.moveAttackStep(p,r,Math.sin(p.dir)*amount,Math.cos(p.dir)*amount);}
  }
  if(p.combo){p.comboQueued=true;return;}
  if(p.cooldown>this.time||p.autoRestUntil>this.time)return;
  const sk=this.chooseSkill(p,0);if(!sk){p.autoRestUntil=this.time+.8;return;}
  p.combo={band:0,repeats:0,total:0,awaitUntil:0};p.comboQueued=true;
  if(!this.beginComboStrike(p)){p.combo=null;p.autoRestUntil=this.time+.8;}
 }
 tickChain(p){
  const c=p.chain;
  if(c&&p.alive&&p.combo&&p.stun<=this.time){
   const sk=SkillSystem.active(p,c.id),r=this.getRoom(p);
   while(c.next<c.count&&this.time>=c.start+c.next*c.interval){
    const step=this.attackStepDistance(p,sk)/c.count;if(step>0)this.moveAttackStep(p,r,Math.sin(p.dir)*step,Math.cos(p.dir)*step);
    const index=c.next++;this.performStrike(p,r,sk);this.emit('skillbeat',{player:p.id,room:r.id,id:sk.id,index,x:p.x,z:p.z,dir:p.dir});
    if(!p.chain||p.stun>this.time||p.hitstopUntil>this.time||!p.alive)break;
   }
   if(c.next>=c.count)p.chain=null;
  }
  if(p.exitPending&&p.action==='attack'&&this.time>=p.actionUntil-.07){
   const distance=p.exitPending;p.exitPending=0;p.retreatUntil=this.time+.24;p.retreatSpeed=distance/.24;
  }
 }
 applyStatus(target,id,duration,source,r){
  if(!target?.alive||!STATUS_DEFS[id]||!Number.isFinite(duration)||duration<=0)return false;
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
   if(['poison','burn','bleed'].includes(id)&&status.nextTick<=this.time){
    status.nextTick=this.time+1;const damage=id==='burn'?5:id==='poison'?4:3;
    if(a.kind==='player'){a.health=Math.max(0,(a.health??100)-damage);a.lastHurtAt=this.time;if(a.health===0){this.die(a,STATUS_DEFS[id].name);return;}}
    else if(a.kind!=='dummy'){a.hp=(a.hp??70)-damage;if(a.hp<=0){const owner=this.players.get(status.source)||r.actors.find(e=>e.id===status.source);this.killActor(a,owner,r);return;}}
   }
  }
 }

 getArea(p){if(this.getRoom(p)?.kind!=='village')return'front';return this.getRoom(p).map.schools.find(s=>Math.hypot(p.x-s.x,p.z-s.z)<s.r)?.id||'village';}
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
  p.staminaCap=Math.max(STAMINA.minCap,p.staminaCap-Math.max(0,fatigue));p.stamina=Math.min(p.staminaCap,p.stamina-cost);p.lastExertion=this.time;
  if(p.age>=4&&(p.autoFight||this.getRoom(p)?.actors.some(e=>e.alive&&dist(e,p)<4&&e.kind==='dummy'))){p.enduranceXP=(p.enduranceXP||0)+cost*.32;}
  return true;
 }
 command(id,cmd){
  const p=this.players.get(id);if(!p?.alive||!cmd||typeof cmd.type!=='string')return false;const r=this.getRoom(p);
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
   if(p.prologue){const topic=p.z<-28?'outside':this.getArea(p),lines=MOTHER_LINES[topic]||MOTHER_LINES.cradle;this.motherSay(p,lines[(p.motherIndex++)%lines.length],5.8);p.motherNextAt=this.time+6;}
   return true;
  }
  if(cmd.type==='dash'){
   const x=Number(cmd.x),z=Number(cmd.z),n=Math.hypot(x,z);
   if(!Number.isFinite(n)||n<.05||p.age<4||p.prologue||p.stamina<DASH.start||p.stun>this.time||hasStatus(p,'root',this.time)||hasStatus(p,'sleep',this.time))return false;
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
  if(cmd.type==='board'){if(r.kind!=='village'||p.age<15||Math.hypot(p.x,p.z-28)>5)return false;p.queued=!p.queued;p.activity=null;this.emit('board',{player:id,room:r.id,queued:p.queued});return true;}
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
   const area=this.getArea(p),definition=ACTIVITY_DEFS[area];
   if(!definition||definition.id!==cmd.activity)return false;
   if(p.activity===definition.id){this.stopActivity(p);p.action='idle';return true;}
   if(r.actors.some(e=>e.alive&&enemiesOnly(e)&&!e.neutral&&dist(p,e)<3.5))return false;
   this.wake(p);this.stopDash(p);p.autoFight=null;p.autoSuppressedUntil=this.time+1;
   p.combo=null;p.pendingSkill=null;p.chain=null;p.attackStep=null;p.retreatUntil=0;p.attackBufferedUntil=0;p.input={x:0,z:0};
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
  if(hasStatus(p,'root',this.time)||sk.ranged||sk.magic||sk.retreat||sk.counter||sk.ward||sk.area||!sk.reach||sk.id===4021)return 0;
  const base=sk.travel??(sk.id===4000?.36:.48);
  return base*injuryModifiers(p).move*(p.age<15?.8:1);
 }
 collisionRadius(a){return a.kind==='player'?.42:a.kind==='dummy'?.40:a.kind==='boss'?1.35:a.elite?1.05:['maw','stag'].includes(a.kind)?.65:.44;}
 moveAttackStep(p,r,dx,dz,slide=false){
  // Small swept substeps retain the existing scenery and body collision hulls.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.045)),sx=dx/steps,sz=dz/steps;
  const bodies=[...r.actors,...this.players.values()].filter(a=>a!==p&&a.alive&&(a.kind!=='player'||a.room===r.id));
  const sceneryBlocked=q=>{const bounded={...q};this.bound(bounded,r,this.collisionRadius(p));return Math.hypot(bounded.x-q.x,bounded.z-q.z)>1e-6;};
  const bodyBlocked=q=>bodies.some(a=>{const before=dist(a,p),after=dist(a,q),radius=this.collisionRadius(p)+this.collisionRadius(a);return after<radius&&after<before-.000001;});
  let travelled=0;
  for(let i=0;i<steps;i++){
   let q={x:p.x+sx,z:p.z+sz};
   if(sceneryBlocked(q)){
    if(!slide)break;
    // Only locomotion slides; attack lunge and retreat keep their stop-on-contact behavior.
    const axes=Math.abs(sx)>Math.abs(sz)?[[sx,0],[0,sz]]:[[0,sz],[sx,0]];
    q=axes.filter(([x,z])=>Math.hypot(x,z)>1e-8).map(([x,z])=>({x:p.x+x,z:p.z+z})).find(a=>!sceneryBlocked(a)&&!bodyBlocked(a));
    if(!q)break;
   }else if(bodyBlocked(q))break;
   travelled+=Math.hypot(q.x-p.x,q.z-p.z);p.x=q.x;p.z=q.z;
  }
  return travelled;
 }
 moveWalk(p,r,dx,dz){return this.moveAttackStep(p,r,dx,dz,true);}
 tickCarriedMove(p,r,dt){
  if(this.time-p.lastInput>1.5)p.input={x:0,z:0};
  const l=Math.hypot(p.input.x,p.input.z),speed=3.8*ACTION_TUNING.move;
  const moved=l>.001?this.moveWalk(p,r,p.input.x*speed*dt,p.input.z*speed*dt):0;
  if(l>.1)p.dir=Math.atan2(p.input.x,p.input.z);
  p.action=moved>1e-6?'run':'idle';p.zone=this.getArea(p);this.bound(p,r);
 }
 tickAttackStep(p){
  const a=p.attackStep;if(!a||!p.alive||!p.pendingSkill||p.stun>this.time)return;if(hasStatus(p,'root',this.time)){p.attackStep=null;return;}
  const u=clamp((this.time-a.started)/Math.max(.001,a.until-a.started),0,1),progress=1-(1-u)**2;
  const amount=Math.max(0,(progress-a.progress)*a.distance);a.progress=progress;
  if(!amount||a.blocked)return;
  const moved=this.moveAttackStep(p,this.getRoom(p),Math.sin(a.dir)*amount,Math.cos(a.dir)*amount);
  a.moved+=moved;if(moved<amount-.00001)a.blocked=true;
  if(!a.sounded&&moved>.001){a.sounded=true;this.emit('step',{player:p.id,room:p.room,x:p.x,z:p.z,kind:'lunge'});}
 }
 reactToHit(target,source,part,severity='light',strength=null,blocked=false){
  const duration=blocked?.28:severity==='lost'?.95:severity==='heavy'?.72:.48;
  // Visual metadata only; repeated wound resolution for one contact shares an ID.
  const fresh=target.hitMotionAt!==this.time;
  if(fresh)target.hitMotionId=(target.hitMotionId||0)+1;
  target.hitMotionAt=this.time;target.hitGuard=blocked;
  if(strength!==null||fresh)target.hitStrength=strength??(severity==='lost'?1.15:severity==='heavy'?1:.48);
  target.hitPart=part;target.hitSeverity=severity;target.hitReactAt=this.time;target.hitReactUntil=this.time+duration;
  target.hitDir=source?Math.atan2(target.x-source.x,target.z-source.z):(target.dir||0)+Math.PI;
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
  const dummy=r.actors.find(e=>e.kind==='dummy'&&dist(e,p)<4);
  const facing=target||dummy;if(facing&&!p.flickAim)p.dir=Math.atan2(facing.x-p.x,facing.z-p.z);
  p.flickAim=false;const stepDistance=this.attackStepDistance(p,sk)/Math.max(1,sk.hits||1),timing=actionTiming(sk);
  p.attackStep=stepDistance?{started:this.time+Math.max(0,timing.charge-.12),until:this.time+Math.max(.001,timing.charge),distance:stepDistance,progress:0,moved:0,dir:p.dir,blocked:false,sounded:false}:null;
  p.pendingSkill={id:sk.id,started:this.time,at:this.time+timing.charge,dir:p.dir,stage:'charge'};p.action='charge';p.motion=sk.form;p.actionStarted=this.time;p.actionUntil=this.time+timing.charge;p.attackSkill=sk.id;p.attackReach=sk.reach;p.attackArc=sk.arc;
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
  p.chain={id:sk.id,start:this.time+timing.swing/hits*.43,interval:timing.swing/hits,next:0,count:hits};
  p.comboQueued=!!p.autoFight||p.comboQueued;if(sk.exit)p.exitPending=sk.exit;
 }
 finishCombo(p){
  const sk=SkillSystem.active(p,p.currentSkill)||book.get(4000);SkillSystem.reset(p);p.attackStep=null;p.chain=null;p.combo=null;p.comboQueued=false;p.pendingSkill=null;p.exitPending=0;p.cooldown=Math.max(p.cooldown,this.time+actionTiming(sk).recovery);p.action='recover';p.actionStarted=this.time;p.actionUntil=p.cooldown;
  this.emit('recovery',{player:p.id,room:p.room,x:p.x,z:p.z});
 }
 resolveClash(a,b,r){
  if(a.clashUntil>this.time||b.clashUntil>this.time)return;
  const physique=p=>p.kind==='player'?([1, .9, 1.32, .86, .76, 1.35,1.08,1.1][p.race]||1)*(p.age<15?.59+p.age*.027:1):p.bodyScale||1;
  const strength=p=>physique(p)+Math.min(.4,(p.experience||0)*.014)+effectsOf(p,'clash')+(p.kind==='boss'?.9:0)+(p.elite?.22:0);
  const chance=clamp(.5+(strength(a)-strength(b))*.30,.12,.88),winner=this.rng()<chance?a:b,loser=winner===a?b:a;
  for(const p of [a,b]){p.attackStep=null;p.chain=null;p.telegraph=null;p.pendingSkill=null;p.comboQueued=false;p.action='clash';p.actionStarted=this.time;p.actionUntil=this.time+.7;p.stun=this.time+.7;p.clashUntil=this.time+.7;p.clashWith=p===a?b.id:a.id;p.experience=(p.experience||0)+1;if(p.kind==='player'){p.clashes++;p.combo=null;}}
  r.clashResult??=[];r.clashResult.push({at:this.time+.7,winner:winner.id,loser:loser.id});
  this.emit('clash',{room:r.id,player:a.kind==='player'?a.id:b.kind==='player'?b.id:undefined,x:(a.x+b.x)/2,z:(a.z+b.z)/2,winner:winner.id});
 }
 performStrike(p,r,sk){
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
   if(Math.abs(angleDiff(Math.atan2(e.x-p.x,e.z-p.z),p.dir))>sk.arc/2&&!['sleep','eclipse','ring'].includes(sk.area))continue;
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
   if(attacking&&!sk.ranged&&!sk.magic&&!sk.breakPower){this.resolveClash(p,e,r);break;}
   const facing=Math.abs(angleDiff(e.dir,Math.atan2(p.x-e.x,p.z-e.z)))<1.4;
   if(e.guard&&e.stun<=this.time&&facing&&!sk.magic&&!(sk.ranged&&sk.power>=3)){
    e.counterOpportunity=this.time+1;e.action='guard';this.reactToHit(e,p,'leftArm','light',.32,true);this.emit('blocked',{room:r.id,x:e.x,z:e.z});continue;
   }
   if(e.kind==='boss'&&!(e.exposedUntil>this.time)&&!sk.magic){this.emit('blocked',{room:r.id,x:e.x,z:e.z});continue;}
   const part=sk.targets[Math.floor(this.rng()*sk.targets.length)];this.damageActor(e,p,part,(sk.power+(e.exposedUntil>this.time?.5:0))*(hasStatus(p,'weak',this.time)?.65:1),r);if(e.alive&&sk.status&&sk.power>0)this.applyStatus(e,sk.status.id,sk.status.duration,p,r);if(e.alive&&sk.knockback&&e.kind!=='boss')this.moveAttackStep(e,r,Math.sin(p.dir)*sk.knockback,Math.cos(p.dir)*sk.knockback);SkillSystem.contact(this,p,e,sk);
  }
  this.emit('swing',{player:p.id,room:r.id,x:p.x,z:p.z,dir:p.dir,reach:sk.reach,arc:sk.arc,skill:sk.id,weapon:p.weapon});
 }
 damageActor(e,source,part,power,r){
  if(!e.alive||power<=0)return;if(e.wounds[part]?.severity==='lost')part='torso';
  e.hp??=e.hpMax??70;e.hpMax??=e.hp; e.hp-=Math.max(3,power*9);
  const exposed=e.exposedUntil>this.time,committed=!!e.telegraph,prev=e.wounds[part]?.severity,injured=Object.keys(e.wounds).length;
  e.aggro=true;e.sleepUntil=0;if(e.statuses)delete e.statuses.sleep;this.reactToHit(e,source,part,power>=2?'heavy':'light',clamp(.25+power*.30,.25,1.25));e.hitUntil=this.time+.1;
  this.impact(source,e,part,power>=2);this.emit('hit',{room:r.id,target:e.id,source:source?.id,x:e.x,z:e.z,part,weapon:source?.weapon,skill:source?.currentSkill});
  if(e.hp<=0&&e.kind!=='boss'){this.killActor(e,source,r);return;}
  if(e.kind==='boss'){
   e.seals--;e.hp=Math.max(0,e.hpMax*e.seals/4);e.exposedUntil=0;e.telegraph=null;if(source?.kind==='player'&&!['head','torso'].includes(part)&&this.rng()<.68){e.wounds[part]={severity:'lost'};this.reactToHit(e,source,part,'lost');this.emit('partbreak',{room:r.id,target:e.id,source:source.id,part,severed:true,x:e.x,z:e.z});}e.stun=this.time+.65;e.action='hit';e.actionStarted=this.time;e.actionUntil=e.stun;
   if(e.seals<=0){this.killActor(e,source,r);r.bossDefeated=true;for(const p of this.players.values())if(p.room===r.id)p.victory=true;this.emit('victory',{room:r.id});}return;
  }
  if((['head','torso'].includes(part)&&prev==='heavy'&&exposed&&power>=3)||power>=7){this.killActor(e,source,r);return;}
  const limb=!['head','torso'].includes(part);
  // A clean hit into a broken posture can take a limb. Light taps alone cannot
  // repeatedly cancel a committed swing; otherwise pure button spam dominates.
  const severeBreak=source?.kind==='player'&&this.rng()<.68;
  const severity=limb&&(e.elite||e.kind==='boss')&&severeBreak?'lost':severeBreak||prev==='heavy'||power>=2?'heavy':'light';
  e.wounds[part]={severity};this.reactToHit(e,source,part,severity);if(exposed)e.exposedUntil=0;
  const interrupts=severity!=='light'||!committed||exposed;
  if(interrupts){e.telegraph=null;e.actionStarted=this.time;e.stun=this.time+(severity==='lost'?1.25:part.endsWith('Leg')?.95:.65);e.actionUntil=e.stun;e.action=severity==='lost'?'break':'hit';}
  if(severeBreak||severity==='lost'){
   this.impact(source,e,part,true);this.emit('partbreak',{room:r.id,target:e.id,source:source?.id,part,severed:severity==='lost',x:e.x,z:e.z});
   if(!e.elite&&Object.values(e.wounds).filter(w=>w.severity==='lost').length>=2){this.killActor(e,source,r);return;}
  }
  if(e.wounds.leftArm?.severity==='lost')e.guard=false;
 }
 killActor(e,source,r){if(!e.alive)return;e.alive=false;e.statuses={};e.deathAt=this.time;e.action='fall';e.actionStarted=this.time;if(source?.kind==='player'){source.kills++;source.experience++;r.kills++;r.score++;}this.emit('kill',{room:r.id,player:source?.kind==='player'?source.id:undefined,target:e.id,x:e.x,z:e.z});}
 hitPlayer(p,e,tg={}){
  if(!p.alive||p.hitUntil>this.time)return;
  if(p.pendingSkill&&p.pendingSkill.at-this.time<.4&&!skillById(p.pendingSkill.id)?.ranged&&!skillById(p.pendingSkill.id)?.magic&&!skillById(p.pendingSkill.id)?.breakPower&&!tg.ranged){this.resolveClash(p,e,this.getRoom(p));return;}
  const facing=Math.abs(angleDiff(p.dir,Math.atan2(e.x-p.x,e.z-p.z)))<1.5;
  if(p.guard&&facing&&p.stun<=this.time&&injuryModifiers(p).guard){
   if(this.spend(p,tg.unblockable?23:13,tg.unblockable?4:1)){
    const weights=p.phaseWeights[p.combo?.band??0],sum=Object.values(weights).reduce((a,b)=>a+b,0)||1,focus=(weights[4013]||0)/sum;
    const chance=p.counterUntil>this.time?clamp(.18+focus*.16+(p.skills.includes(4011)?.05:0),0,.40):.12;
    if(!tg.unblockable&&this.rng()<chance){e.stun=this.time+1.8;e.exposedUntil=this.time+2.5;e.telegraph=null;p.parries++;p.counterUntil=0;this.emit('parry',{player:p.id,room:p.room,x:e.x,z:e.z});return;}
    if(!tg.unblockable){this.reactToHit(p,e,'leftArm','light',.32,true);this.emit('guarded',{player:p.id,room:p.room,x:p.x,z:p.z});return;}
   }
   p.guard=false;p.guardPending=false;
  }
  if(p.wardUntil>this.time&&p.wardCharges>0){p.wardCharges--;this.emit('guarded',{player:p.id,room:p.room,x:p.x,z:p.z});return;}
  if(hasStatus(e,'blind',this.time)&&this.rng()<.35)return;
  if(p.shield&&facing&&p.stamina>=5&&this.rng()<.38){this.spend(p,5,.08);p.guardUntil=this.time+.55;this.reactToHit(p,e,'leftArm','light',.32,true);this.emit('guarded',{player:p.id,room:p.room,x:p.x,z:p.z});return;}
  const part=tg.part||BODY_PARTS[Math.floor(this.rng()*BODY_PARTS.length)],old=p.wounds[part]?.severity;
  let severity=e.elite||e.kind==='boss'||tg.unblockable?'heavy':'light';
  if(old==='light')severity='heavy';if(old==='heavy')severity=['head','torso'].includes(part)?'fatal':e.elite||e.kind==='boss'?'lost':'heavy';
  if(old==='lost'){this.inflictWound(p,'torso',p.wounds.torso?.severity==='heavy'?'fatal':'heavy',e);return;}
  const before=p.health;this.inflictWound(p,part,severity,e);if(p.alive&&p.health<before&&e.attackCount%3===0){const status={crawler:'poison',wraith:'slow',maw:'root',goblin:'blind',mage:'burn',soldier:'bleed',elite:'weak'}[e.kind];if(status)this.applyStatus(p,status,4.5,e,this.getRoom(p));}
 }
 inflictWound(p,part,severity,source=null){
  if(!BODY_PARTS.includes(part)||!['light','heavy','lost','fatal'].includes(severity))return false;
  if(severity==='fatal'||severity==='lost'&&['head','torso'].includes(part)){this.emit('wound',{player:p.id,room:p.room,part,severity:'fatal',x:p.x,z:p.z});this.die(p,BODY_NAMES[part]+'への致命傷');return true;}
  if(p.wounds[part]?.severity==='lost')return false;
  if(p.wounds[part]?.severity==='heavy'&&severity==='light')severity='heavy';
  this.stopDash(p);this.stopActivity(p);p.seated=false;p.chain=null;p.sleepUntil=0;if(p.statuses)delete p.statuses.sleep;p.lastHurtAt=this.time;p.health=Math.max(0,(p.health??100)-({light:19,heavy:30,lost:40}[severity]||19)*(p.armor===2?.70:p.armor===1?.85:1)*(1-effectsOf(p,'fallResist'))-(part==='head'?7:part==='torso'?3:0));if(p.health<=0){this.die(p,'深手');return true;}
  p.wounds[part]={severity,since:p.age+p.ageFraction,healsAt:severity==='lost'?null:p.age+p.ageFraction+(severity==='heavy'?5:1)};
  this.reactToHit(p,source,part,severity);this.impact(source,p,part,severity!=='light');p.attackStep=null;p.retreatUntil=0;p.hitUntil=this.time+.48;p.stun=this.time+(severity==='lost'?1.35:severity==='heavy'?.85:.50);p.action=severity==='lost'?'break':'hit';p.actionStarted=this.time;p.actionUntil=p.stun;p.pendingSkill=null;p.combo=null;p.comboQueued=false;p.cooldown=Math.max(p.cooldown,p.stun+.35);p.guard=false;p.guardPending=false;
  this.emit('wound',{player:p.id,room:p.room,part,severity,x:p.x,z:p.z});return true;
 }
 tickRecovery(p,dt){
  const mods=injuryModifiers(p),max=Math.max(STAMINA.minCap,staminaMaximum(p)-(100-mods.cap)-(p.permanentFatigue||0));p.staminaMax=staminaMaximum(p);
  if(p.seated&&this.time-(p.sitSince||0)>.35&&p.stun<=this.time&&!hasStatus(p,'sleep',this.time)){p.staminaCap=Math.min(max,p.staminaCap+dt*17);p.stamina=Math.min(p.staminaCap,p.stamina+dt*32);}
  if(!p.autoFight&&!p.seated&&this.time-(p.lastHurtAt??-100)>12&&this.getRoom(p)?.kind==='village'&&p.z>-27)p.health=Math.min(100,(p.health??100)+dt*1.8);
  if(!p.dash&&this.time-p.lastExertion>STAMINA.delay&&!p.pendingSkill&&p.stun<=this.time)p.stamina=Math.min(p.staminaCap,p.stamina+dt*(STAMINA.regen+effectsOf(p,'regen'))*(p.guard?.28:p.combo?.45:1));
  if(this.time-p.lastSkillAt>STAMINA.capDelay&&!p.pendingSkill&&this.time-p.lastExertion>1.4)p.staminaCap=Math.min(max,p.staminaCap+dt*(STAMINA.capRegen+effectsOf(p,'capRegen'))*(p.guard?.35:1));
  p.staminaCap=Math.min(p.staminaCap,max);p.stamina=clamp(p.stamina,0,p.staminaCap);
  const age=p.age+p.ageFraction;for(const [part,w] of Object.entries(p.wounds))if(w.severity!=='lost'&&age>=w.healsAt){delete p.wounds[part];this.emit('healed',{player:p.id,room:p.room,part,x:p.x,z:p.z});}
 }
 tickExploration(p,dt){
  if(p.age<4||p.prologue)return;const area=this.getArea(p),moving=!!p.dash||Math.hypot(p.input.x,p.input.z)>.1;
  if(moving)p.enduranceXP=(p.enduranceXP||0)+dt*(p.dash?.13:.06);
  if(p.activity){
   if(ACTIVITY_DEFS[area]?.id!==p.activity||p.autoFight){this.stopActivity(p);return;}
   p.activityClock+=dt;this.progressDeed(p,p.activity,dt);
   if(this.time>=p.activityNextAt){const lines=ACTIVITY_LINES[p.activity];let n=Math.floor(this.rng()*lines.length);if(n===p.lastActivityLine)n=(n+1)%lines.length;
    p.lastActivityLine=n;p.activityNextAt=this.time+4.1+this.rng()*2.3;
    this.emit('progress',{player:p.id,room:p.room,text:lines[n],x:p.x,z:p.z});
   }
   if(p.activity==='play')p.enduranceXP+=dt*.18;
  }
  SkillSystem.sample(this,p);
 }
 bound(p,r,bodyRadius=this.collisionRadius(p)){
  if(r.kind==='village'){
   p.x=clamp(p.x,-35,35);p.z=clamp(p.z,-46,29.5);
   if(p.z<-27&&p.z>-30&&Math.abs(p.x)>4.8)p.z=-27;
   if(p.z>23&&Math.abs(p.x)>4)p.z=23;
   for(const h of r.map.houses){const dx=p.x-h.x,dz=p.z-h.z;if(Math.abs(dx)<2&&Math.abs(dz)<1.8){if(Math.abs(dx)/2>Math.abs(dz)/1.8)p.x=h.x+Math.sign(dx||1)*2;else p.z=h.z+Math.sign(dz||1)*1.8;}}
   for(const s of r.map.schools.filter(s=>s.id!=='dance')){const dx=p.x-s.x,dz=p.z-(s.z-2);if(Math.abs(dx)<2.5&&Math.abs(dz)<1.5){if(Math.abs(dx)/2.5>Math.abs(dz)/1.5)p.x=s.x+Math.sign(dx||1)*2.5;else p.z=s.z-2+Math.sign(dz||1)*1.5;}}
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
   this.tickRecovery(p,dt);this.tickExploration(p,dt);if(this.tickHitStop(p,dt)){this.bound(p,r);continue;}if(p.prologue){this.tickCarriedMove(p,r,dt);continue;}this.tickAutoCombat(p,r,dt);this.tickChain(p);
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
    let speed=(p.age<4?3.8:p.age<15?4.5:5.15)*ACTION_TUNING.move*(p.dash?DASH.speed:1)*(1+effectsOf(p,'walk'))*(p.age>65?1-(p.age-65)*.004:1)*mods.move*(hasStatus(p,'slow',this.time)?.5:1)*(hasStatus(p,'root',this.time)||p.seated?0:1)*(p.guard?.42:1)*(p.pendingSkill?ACTION_TUNING.moveCharge:p.combo?ACTION_TUNING.moveCombo:p.cooldown>this.time?ACTION_TUNING.moveRecovery:1);
    if(p.retreatUntil>this.time&&!hasStatus(p,'root',this.time)){this.moveAttackStep(p,r,-Math.sin(p.dir)*p.retreatSpeed*dt*mods.move,-Math.cos(p.dir)*p.retreatSpeed*dt*mods.move);}
    else if(p.attackStep&&p.combo){this.moveAttackStep(p,r,p.input.x*speed*dt,p.input.z*speed*dt);}
    else if(l>.001&&speed>0){const moved=this.moveWalk(p,r,p.input.x*speed*dt,p.input.z*speed*dt);if(p.dash){p.dash.blocked=moved<.002?(p.dash.blocked||0)+dt:0;if(p.dash.blocked>.18){this.stopDash(p);p.input={x:0,z:0};}}}
    if(p.guard){const e=r.actors.filter(e=>e.alive&&(enemiesOnly(e)||e.kind==='dummy')&&(!e.neutral||e.aggro)&&dist(e,p)<7).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(e)p.dir=Math.atan2(e.x-p.x,e.z-p.z);}
    else if(l>.1&&!p.pendingSkill&&!p.combo)p.dir=Math.atan2(p.input.x,p.input.z);
    if(p.actionUntil<=this.time&&!p.pendingSkill)p.action=p.seated?'sit':p.activity?(ACTIVITY_DEFS[this.getArea(p)]?.motion||p.activity):p.guard?(l>.1?'guardWalk':'guard'):l>.1?(p.dash?'dash':'run'):'idle';
   }
   this.bound(p,r);p.zone=this.getArea(p);if(p.queued&&Math.hypot(p.x,p.z-28)>6)p.queued=false;
   if(p.speechUntil<=this.time)p.speech='';this.detectContact(p,r);
  }
  for(const r of this.rooms.values()){
   if(r.abandoned)continue;const ps=[...this.players.values()].filter(p=>p.alive&&p.room===r.id);
   if(r.kind==='village'){
    if(this.time>=r.waveAt){
     const active=r.actors.filter(e=>e.alive&&enemiesOnly(e)&&!e.neutral),helpers=ps.filter(p=>p.z<-28).length,target=4+Math.min(4,helpers);
     if(active.length<target){const counts=[0,0,0,0];for(const e of active)counts[e.lane]++;const lane=counts.indexOf(Math.min(...counts)),elite=this.time-r.born>18&&!active.some(e=>e.elite)&&this.rng()<.07;
      const e=this.actor(elite?'elite':['crawler','maw','wraith','goblin'][Math.floor(this.rng()*4)],-10.5+lane*7,-41,elite?2:this.rng()<.35?1:0);e.lane=lane;r.actors.push(e);if(elite)this.emit('elite',{room:r.id,x:e.x,z:e.z});}
     const guards=r.actors.filter(e=>e.alive&&e.kind==='guard');if(guards.length<4){const lane=[0,1,2,3].find(i=>!guards.some(g=>g.lane===i))??0,g=this.actor('guard',-10.5+lane*7,-30.5);g.lane=lane;r.actors.push(g);}
     r.waveAt=this.time+2;
    }
    const cycle=Math.floor(this.time/this.boatInterval);if(cycle>r.boatCycle){r.boatCycle=cycle;const travelers=ps.filter(p=>p.queued&&p.age>=15&&Math.hypot(p.x,p.z-28)<6);if(travelers.length)this.depart(r,travelers);}
   }else if(ps.length&&!r.bossDefeated){
    const alive=r.actors.filter(e=>e.alive);if(r.stage<5&&r.kills>=r.quota&&!alive.length){r.cleared.push(r.stage);r.stage++;r.kills=0;r.quota=this.frontQuota(r.partySize);this.emit('advance',{room:r.id,stage:r.stage});this.spawnFrontWave(r);}
    else if(r.stage<5&&alive.length<Math.min(8,2+Math.ceil(r.partySize/5))&&this.time>r.waveAt&&r.kills+alive.length<r.quota)this.spawnFrontWave(r);
   }
   for(const e of r.actors)if(e.alive){this.tickStatuses(e,r,dt);if(e.alive&&!this.tickHitStop(e,dt))this.tickActor(e,r,ps,dt);}
   for(const c of r.clashResult||[])if(c.at<=this.time&&!c.done){c.done=true;const a=this.players.get(c.winner)||r.actors.find(e=>e.id===c.winner),b=this.players.get(c.loser)||r.actors.find(e=>e.id===c.loser);if(a?.alive&&b?.alive){if(b.kind==='player')this.hitPlayer(b,a,{part:'torso'});else this.damageActor(b,a,'torso',1,r);a.cooldown=this.time+.9;}}
   r.clashResult=(r.clashResult||[]).filter(c=>!c.done);
   for(const field of r.fields||[])if(field.until>this.time)for(const e of r.actors.filter(e=>e.alive&&enemiesOnly(e))){if(dist(e,field)<(field.type==='fire'?3:6)){if(field.type==='fire'){e.stun=Math.max(e.stun,this.time+.22);e.telegraph=null;e.action='hit';e.hitPart='torso';}if(field.type==='sleep'&&!e.elite)e.sleepUntil=Math.max(e.sleepUntil||0,this.time+.6);}}
   r.fields=(r.fields||[]).filter(f=>f.until>this.time);this.separateActors(r,dt);r.actors=r.actors.filter(e=>e.alive||this.time-e.deathAt<CORPSE_SECONDS);const dead=r.actors.filter(e=>!e.alive);if(dead.length>64){const oldest=new Set(dead.slice(0,dead.length-64).map(e=>e.id));r.actors=r.actors.filter(e=>!oldest.has(e.id));}
  }
 }
 frontQuota(party){return this.mode==='demo'?Math.max(3,Math.ceil(party*.6)):Math.max(16,party*7);}
 depart(r,travelers){const front=this.makeRoom('front');front.partySize=travelers.length;front.quota=this.frontQuota(travelers.length);front.expedition=travelers.map(p=>p.id);front.home=r.id;
  for(const [i,p] of travelers.entries()){p.autoFight=null;p.chain=null;p.statuses={};p.seated=false;p.room=front.id;p.expedition=front.id;p.x=(i%6-2.5)*1.6;p.z=5+Math.floor(i/6)*1.1;p.queued=false;p.activity=null;p.input={x:0,z:0};p.guard=false;p.combo=null;p.pendingSkill=null;p.attackStep=null;p.retreatUntil=0;this.emit('depart',{player:p.id,room:front.id});}this.spawnFrontWave(front);
 }
 spawnFrontWave(r){const center=-(r.stage*44+20);if(r.stage===5){if(!r.actors.some(a=>a.kind==='boss'))r.actors.push(this.actor('boss',0,center,3));return;}
  const count=Math.min(4,Math.max(1,r.quota-r.kills-r.actors.filter(e=>e.alive).length));for(let i=0;i<count;i++){const kinds=r.stage===0?['goblin','maw','crawler']:r.stage===1?['soldier','crawler','archer']:['elite','soldier','mage','maw'];const kind=kinds[Math.floor(this.rng()*kinds.length)];r.actors.push(this.actor(kind,(this.rng()-.5)*17,center+(this.rng()-.5)*15,kind==='crawler'?0:kind==='elite'?2:1));}r.waveAt=this.time+4;
 }
 tickActor(e,r,ps,dt){
  if(e.kind==='dummy'){if(e.actionUntil<=this.time)e.action='idle';return;}
  if(e.kind==='villager'){e.dir+=Math.sin(this.time*.23+e.stance)*dt*.5;e.x+=Math.sin(e.dir)*dt*.35;e.z+=Math.cos(e.dir)*dt*.35;if(Math.abs(e.x)>13||Math.abs(e.z)>20)e.dir+=Math.PI*dt;e.action='run';return;}
  if(e.telegraph?.ranged&&(e.wounds.rightArm?.severity==='lost'||e.wounds.leftArm?.severity==='lost'))e.telegraph=null;
  if(e.sleepUntil>this.time||hasStatus(e,'sleep',this.time)){e.action='sleep';e.telegraph=null;return;}
  if(e.stun>this.time){e.telegraph=null;if(e.actionUntil<=this.time)e.action='stagger';return;}
  const hostile=e.kind!=='guard';let targets=hostile?[...ps.filter(p=>r.kind!=='village'||p.z<-28),...r.actors.filter(g=>g.alive&&g.kind==='guard'&&!e.neutral)]:r.actors.filter(a=>a.alive&&enemiesOnly(a)&&!a.neutral);
  if(e.neutral&&!e.aggro){e.action='idle';return;}
  if(e.neutral)targets=ps.filter(p=>p.alive&&p.z<-28);
  const scored=targets.filter(t=>t.alive&&(e.kind!=='guard'||r.kind!=='village'||Math.abs(t.x-e.homeX)<5.2));
  const score=t=>dist(e,t)+(e.target===t.id?-.5:0)+(t.kind==='player'&&(t.cooldown>this.time||Math.abs(angleDiff(t.dir,Math.atan2(e.x-t.x,e.z-t.z)))>2)?-2:0);
  const target=scored.sort((a,b)=>score(a)-score(b))[0];if(!target||dist(e,target)>(r.kind==='village'?13:18)){e.action='idle';if(e.kind==='guard'){e.x+=(e.homeX-e.x)*dt*.5;e.z+=(-32-e.z)*dt*.5;}return;}
  e.target=target.id;
  if(e.kind==='guard'&&this.time>=(e.nextSpeechAt||0)){
   e.nextSpeechAt=this.time+10+this.rng()*10;
   const helper=ps.filter(p=>p.alive&&dist(p,e)<9).sort((a,b)=>dist(a,e)-dist(b,e))[0];
   if(helper){const type=(helper.health??100)<55?'hurt':helper.age<10?'young':helper.experience>30?'veteran':'helper',lines=GUARD_LINES[type];e.speech=lines[Math.floor(this.rng()*lines.length)];e.speechUntil=this.time+4.6;this.emit('guardline',{room:r.id,target:e.id,text:e.speech,x:e.x,z:e.z});}
  }
  const ranged=false,reach=ranged?11:e.wounds.rightArm?.severity==='lost'?1.2:e.kind==='boss'?5:e.elite?3.4:2.3;
  if(e.telegraph){
   e.action='windup';if(target.kind!=='player'&&target.telegraph&&!ranged&&Math.abs(target.telegraph.at-e.telegraph.at)<.5&&Math.min(target.telegraph.at,e.telegraph.at)-this.time<.25&&dist(e,target)<reach+.4){this.resolveClash(e,target,r);return;}
   if(this.time>=e.telegraph.at){const tg=e.telegraph;e.telegraph=null;e.guard=false;e.action='attack';e.actionStarted=this.time;e.actionUntil=this.time+.75;e.cooldown=this.time+(e.elite?2.3:1.9);if(e.kind==='boss')e.exposedUntil=this.time+1.65;if(ranged)e.ammo--;
    this.emit('enemySwing',{room:r.id,source:e.id,target:target.id,x:e.x,z:e.z,dir:tg.dir,reach:tg.reach,arc:tg.arc,kind:e.kind,unblockable:tg.unblockable});
    for(const t of targets){if(!t.alive||dist(e,t)>tg.reach+.35||Math.abs(angleDiff(Math.atan2(t.x-e.x,t.z-e.z),tg.dir))>tg.arc/2)continue;
     if(t.kind==='player')this.hitPlayer(t,e,tg);else{t.sleepUntil=0;if(t.statuses)delete t.statuses.sleep;const amount=(e.elite?1.05:.7)*(hasStatus(e,'weak',this.time)?.65:1);t.npcResolve-=amount;t.hp=(t.hp??70)-amount*(t.hpMax??70)/(t.npcResolveMax||12);this.reactToHit(t,e,'torso',e.elite?'heavy':'light');this.impact(e,t,'torso',e.elite);t.action='hit';t.actionStarted=this.time;t.actionUntil=this.time+.65;t.stun=t.actionUntil;if(t.npcResolve<=0||t.hp<=0)this.killActor(t,e,r);else this.emit('hit',{room:r.id,target:t.id,source:e.id,x:t.x,z:t.z,part:'torso'});if(t.alive&&e.attackCount%4===0){const status=e.kind==='guard'?'stun':({crawler:'poison',wraith:'slow',maw:'root',goblin:'blind',mage:'burn',elite:'weak'})[e.kind];if(status)this.applyStatus(t,status,3,e,r);}}if(ranged)break;
    }
   }return;
  }
  if(e.actionUntil>this.time)return;e.dir=Math.atan2(target.x-e.x,target.z-e.z);
  const distance=dist(e,target),injury=injuryModifiers(e),vulnerable=target.cooldown>this.time||target.action==='recover'||Math.abs(angleDiff(target.dir,Math.atan2(e.x-target.x,e.z-target.z)))>1.9;
  if(e.smart&&distance<reach+1&&distance>reach*.7&&this.time>e.cooldown&&!vulnerable&&e.counterOpportunity<this.time){e.guard=e.wounds.leftArm?.severity!=='lost';e.action='guard';return;}
  if(e.smart&&e.counterOpportunity===undefined)e.counterOpportunity=0;
  if(distance>reach*.82){const speed=(e.kind==='guard'?2.8:e.kind==='boss'?2.6:3.1)*injury.move*(hasStatus(e,'slow',this.time)?.5:1)*(hasStatus(e,'root',this.time)?0:1);e.x+=Math.sin(e.dir)*speed*dt;e.z+=Math.cos(e.dir)*speed*dt;e.action='run';e.guard=false;if(r.kind==='village')e.z=Math.min(-29.6,e.z);}
  else if(this.time>=e.cooldown){e.attackCount++;const unblockable=(e.kind==='boss'&&e.attackCount%3===0)||(e.elite&&e.attackCount%4===0),duration=e.elite?1.55:e.smart&&vulnerable?1.05:1.35;e.guard=false;e.telegraph={at:this.time+duration,started:this.time,dir:e.dir,reach,arc:ranged?.65:unblockable?2.5:1.7,unblockable,ranged,part:e.elite&&e.attackCount%2===0?'rightArm':undefined};e.action='windup';}
  else e.action='idle';
 }
 separateActors(r,dt){const list=r.actors.filter(e=>e.alive&&!(e.hitstopUntil>this.time)&&!['villager','dummy'].includes(e.kind));for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j],d=dist(a,b),min=a.elite||b.elite?1.8:1.4;if(d<min){const angle=d<.001?(i+j)*2.4:Math.atan2(b.x-a.x,b.z-a.z),v=(min-d)*Math.min(.5,dt*5);a.x-=Math.sin(angle)*v;a.z-=Math.cos(angle)*v;b.x+=Math.sin(angle)*v;b.z+=Math.cos(angle)*v;}}
  if(r.kind==='village')for(const e of list){e.x=clamp(e.x,-25,25);e.z=clamp(e.z,-45,-29.6);if(e.kind==='guard')e.x=clamp(e.x,e.homeX-2.2,e.homeX+2.2);}
 }
 bank(p,witness=null){
  if(p.alive)return false;
  const legacy=this.legacy(p.owner),memory=strongestMemory(p),id=memory===null?null:Number(memory);
  if(id!==null)legacy.archive=[...new Set([...legacy.archive,id])];
  p.bankedSkills=id===null?[]:[id];
  const record={id:p.id,clan:p.clan,name:p.name,gen:p.gen,age:p.age,skills:[...p.bankedSkills],skill:id,uses:id===null?0:p.skillUses[id],kills:p.kills,cause:p.cause,alive:false,mode:this.mode,skillHistory:SkillSystem.remember(p),appearance:{race:p.race,gender:p.gender,hair:p.hair,skin:p.skin,age:p.age,appearanceSeed:p.appearanceSeed,weapon:p.weapon,armor:p.armor,shield:p.shield,wounds:JSON.parse(JSON.stringify(p.wounds))}};
  const n=legacy.records.findIndex(r=>r.id===p.id);if(n>=0)legacy.records[n]=record;else legacy.records.push(record);p.recorded=true;
  this.emit('banked',{player:p.id,room:p.room,skill:id});return true;
 }
 returnHome(p){
  const front=this.getRoom(p);if(front.kind!=='front')return false;
  this.bank(p);for(const id of front.expedition||[]){const dead=this.players.get(id)||front.fallen?.[id];if(dead&&!dead.alive)this.bank(dead,p);}
  let home=this.rooms.get(p.home);if(!home||home.abandoned){home=this.makeRoom('village');home.clans[p.id]=0;p.home=home.id;}
  p.autoFight=null;p.chain=null;p.statuses={};p.seated=false;p.attackBufferedUntil=0;p.room=home.id;p.x=0;p.z=24;p.rescueAt=null;p.returned++;p.guard=false;p.attackStep=null;p.retreatUntil=0;p.combo=null;p.pendingSkill=null;p.cooldown=this.time+1;p.input={x:0,z:0};p.action='idle';p.activity=null;
  this.emit('returned',{player:p.id,room:home.id,witnessed:(front.expedition||[]).filter(id=>!this.players.get(id)?.alive).length});return true;
 }
 die(p,cause){
  if(!p.alive)return;p.dash=null;p.attackBufferedUntil=0;p.alive=false;p.health=0;p.statuses={};p.autoFight=null;p.chain=null;p.seated=false;p.deathAt=this.time;p.cause=cause;p.attackStep=null;p.retreatUntil=0;p.input={x:0,z:0};p.guard=false;p.pendingSkill=null;p.combo=null;p.queued=false;p.activity=null;p.action='fall';p.actionStarted=this.time;
  const room=this.getRoom(p);if(room?.kind==='front'){room.fallen||={};room.fallen[p.id]=JSON.parse(JSON.stringify({...p,speech:'',speechUntil:0}));}const home=this.rooms.get(p.home);if(home){delete home.clans[p.id];this.checkAbandoned(home);}this.bank(p);const legacy=this.legacy(p.owner);legacy.generation=Math.max(legacy.generation,p.gen+1);
  this.emit('death',{player:p.id,room:p.room,cause,age:p.age,kills:p.recorded?p.kills:0,skills:p.bankedSkills,x:p.x,z:p.z});
 }
 snapshot(id,after=0){const p=this.players.get(id);if(!p)return null;const r=this.getRoom(p);return {version:VERSION,t:this.time,seq:this.seq,mode:this.mode,player:p,room:{id:r.id,kind:r.kind,seed:r.seed,code:r.code,name:r.name,stage:r.stage,kills:r.kills,quota:r.quota,cleared:r.cleared,clans:r.clans,bossDefeated:r.bossDefeated,partySize:r.partySize,fields:r.fields||[],items:r.items||[],abandoned:r.abandoned},actors:r.actors,players:[...this.players.values()].filter(q=>q.room===r.id),boatIn:this.boatInterval-this.time%this.boatInterval,yearSeconds:this.yearSeconds,legacy:this.legacy(p.owner),events:this.events.filter(e=>e.seq>after&&(e.room===r.id||e.player===id))};}
 exportState(){const data={schema:3,version:VERSION,seed:this.seed,rngState:this.rng.getState(),mode:this.mode,time:this.time,seq:this.seq,eid:this.eid,roomSeq:this.roomSeq,rooms:[...this.rooms],players:[...this.players].map(([id,p])=>[id,{...p,speech:'',speechUntil:0}]),legacies:this.legacies,abandoned:this.abandoned};return JSON.parse(JSON.stringify(data));}
 static restore(data){if(data?.schema!==3||!Array.isArray(data.players)||!Array.isArray(data.rooms)||data.players.length>200)throw Error('この改修より前の進行中データは別保管されています。');const s=new Simulation({seed:data.seed,mode:data.mode});s.time=+data.time||0;s.seq=+data.seq||0;s.eid=+data.eid||0;s.roomSeq=+data.roomSeq||1;s.rooms=new Map(data.rooms);s.players=new Map(data.players);s.legacies=data.legacies||{};s.abandoned=data.abandoned||[];if(Number.isInteger(data.rngState))s.rng.setState(data.rngState);for(const p of s.players.values()){if(!s.rooms.has(p.room))throw Error('村の記録がありません。');p.attackBufferedUntil=0;p.attackStep??=null;p.hitReactAt??=0;p.hitReactUntil??=0;p.hitDir??=0;p.hitSeverity??=null;p.input={x:0,z:0};p.guard=false;p.guardPending=false;p.speech='';p.speechUntil=0;p.phaseLimitVersion=0;s.preparePlayer(p);p.dash=null;p.autoFight=null;p.chain=null;p.pendingSkill=null;p.combo=null;p.attackStep=null;p.action=p.seated?'sit':'idle';SkillSystem.restore(s,p);}for(const r of s.rooms.values()){if(r.kind==='village'){r.map=makeVillage(r.seed);const spot=villagePracticePosition(r.map);for(const a of r.actors)if(a.kind==='dummy'){a.x=a.homeX=spot.x;a.z=a.homeZ=spot.z;}}r.actors=r.actors.filter(a=>a.kind!=='villager');for(const a of r.actors){if(a.kind==='archer')a.kind='soldier';if(a.kind==='mage')a.kind='goblin';a.statuses??={};a.hp??=a.kind==='guard'?130:a.elite?120:70;a.hpMax??=a.hp;a.npcResolveMax??=a.kind==='guard'?18:14;if(data.version!==VERSION)a.npcResolve=a.npcResolveMax;}}for(const l of Object.values(s.legacies))l.archive=l.archive.filter(id=>skillById(id));return s;}
}
