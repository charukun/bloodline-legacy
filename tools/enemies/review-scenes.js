/* Deterministic review snapshots shared by the interactive page and diagnostics. */
const EnemyReview={
 forms:Object.values(ENEMY_FORMS).flat(),
 mixed:Array.from({length:5},(_,i)=>Object.values(ENEMY_FORMS).flatMap(rows=>rows[i]?[rows[i]]:[])).flat(),
 duration:pose=>pose==='sequence'?13:3.6,
 vitality(p,remaining=100,brokenPart='none'){
  p.hpMax=p.hpMax||100;p.hp=p.hpMax*(Number.isFinite(remaining)?Math.max(0,Math.min(100,remaining)):100)/100;
  // Independent synthetic controls: vitality never creates a lost limb;
  // restoring vitality does not repair a limb still selected as broken.
  p.wounds={};p.damageMarks={};
  const parts=({bothLegs:['rightLeg','leftLeg'],bothArms:['rightArm','leftArm'],rightArmLeftLeg:['rightArm','leftLeg']})[brokenPart]||[brokenPart];
  for(const part of parts)if(['rightArm','leftArm','rightLeg','leftLeg'].includes(part))p.wounds[part]={severity:'lost'};
  return p;
 },
 damage(p,level='auto',part='torso'){
  if(level==='auto')return p;
  const fraction={clean:0,light:.18,medium:.48,heavy:.78,depleted:1,lost:.82}[level]??0;
  return this.vitality(p,100*(1-fraction),level==='lost'?part:'none');
 },
 sample(templates,{form='soldier',count=1,pose='sequence',time=0,vitality=100,brokenPart='none'}){
  const duration=this.duration(pose),cycle=Math.floor(time/duration),local=time%duration,start=cycle*duration;
  let mode=pose,at=local,offset=start;
  if(pose==='sequence'){
   if(local<1){mode='idle';at=local;}
   else if(local<4){mode='run';at=local-1;offset=start+1;}
   else if(local<8){mode='attack';at=local-4;offset=start+4;}
   else if(local<9){mode='guard';at=local-8;offset=start+8;}
   else if(local<10.1){mode='hit';at=local-9;offset=start+9;}
   else{mode='death';at=local-10.1;offset=start+10.1;}
  }
  const selected=this.forms.find(f=>f.id===form)||this.forms.find(f=>f.id==='soldier');
  const actors=Array.from({length:count},(_,i)=>{
   const f=form==='all'?this.mixed[i%this.mixed.length]:selected,kind=f.kind,impact=kind==='elite'?1.55:1.35;
   const p={...templates[kind],enemyForm:f.id,name:f.name,id:'review-'+i,alive:true,guard:false,action:'idle',wounds:{},statuses:{},
    x:count<=2?(i-(count-1)/2)*4:(i%4-1.5)*4.4,z:-34-Math.floor(i/4)*4.4,dir:.15};
   this.vitality(p,vitality,brokenPart);
   const condition=enemyCondition(p);
   if(mode==='run'){p.action='run';p.x+=Math.sin(at*1.7)*1.4*injuryModifiers(p).move*condition.move;p.dir=Math.cos(at*1.7)>0?Math.PI/2:-Math.PI/2;}
   if(mode==='attack'){
    if(at<impact)Object.assign(p,{action:'windup',telegraph:{started:offset,at:offset+impact}});
    else if(at<impact+.75+condition.recovery)Object.assign(p,{action:'attack',actionStarted:offset+impact,actionUntil:offset+impact+.75+condition.recovery});
   }
   if(mode==='guard')p.guard=true;
   if(mode==='hit')Object.assign(p,{hitReactAt:offset,hitReactUntil:offset+.7,hitSeverity:'heavy',hitDir:.8});
   if(mode==='death')Object.assign(p,{alive:false,deathAt:offset});
   return p;
  });
  const a=actors[0],label=a.alive===false?'死亡':a.hitReactUntil>time?'被弾':a.telegraph?'予備動作':a.action==='attack'?(time-a.actionStarted>.75?'体勢を立て直す':'攻撃 → 戻し'):a.action==='run'?'移動':a.guard?'防御':'待機';
  return {actors,label:label+' · '+EnemyWeakness.sample(a,time).label,duration};
 }
};
