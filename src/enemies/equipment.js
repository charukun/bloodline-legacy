/* Original Bloodline Legacy silhouette kit, built from existing shared meshes.
 * Short iron sallet / split tower shield for soldiers; antler crown / axe and
 * round buckler for elites. All pieces follow authored glTF sockets. */
VillageArt.prototype.sentinelEquipment=function(p,rec){
 const elite=p.kind==='elite',wear=String(p.id).length%3,iron=elite?'#9b8b6e':'#87918b',edge='#c3bca1',leather='#66574b',cloth=elite?'#8b4139':'#426a61';
 this.root=rec.sockets.head;
 if(elite){
  this.p('cap',0,.84,-.01,.455,.21,.46,'#7b725e',0,0,0,10);
  // Unequal, branching ivory antlers read as a crown from the gameplay camera.
  for(const side of [-1,1]){const s=side===1?1:.84;
   this.line([side*.39,.88,-.08],[side*.54,1.10,-.13],.065,edge,9);
   this.line([side*.54,1.10,-.13],[side*.64,1.30*s+.15,-.17],.039,'#d8c8a0',9);
   this.line([side*.51,1.05,-.13],[side*.80,1.15,-.11],.041,edge,9);
   this.line([side*.80,1.15,-.11],[side*.89,1.25*s+.12,-.15],.018,'#e2d4ae',9);
   this.p('horn',side*.63,1.30*s+.14,-.16,.026,.23,.026,'#e2d4ae',0,-side*.35,0,9);
  }
  this.p('box',0,.97,.408,.11,.13,.045,'#bc9156',0,0,0,10);
 }else{
  // Open face sallet, brow band and one damaged cheek plate.
  this.p('cap',0,.81,-.03,.455,.24,.46,iron,0,0,0,10);
  this.p('box',0,.73,.406,.77,.064,.065,edge,0,0,0,10);
  for(const side of [-1,1])this.p('box',side*.413,.49,.12,.06,side>0?.32:.24,.38,iron,0,side*.1,0,10);
  this.p('box',-.09,1.02,-.02,.065,.15,.35,'#6d7e74',0,0,-.13,10);
 }
 // Visible seam / fracture across the brow, safely clear of the eye sockets.
 this.p('box',.16,.74,.446,.10,.012,.012,'#413d34',0,0,.42,0);
 this.root=rec.sockets.chest;
 for(const side of [-1,1]){
  this.p('bead',side*.31,-.05,-.005,elite?.20:.16,.095,.21,iron,0,0,side*.25,10);
  if(elite)this.p('horn',side*.39,.08,-.05,.045,.28,.05,edge,0,-side*.40,-.15,9);
 }
 if(elite){for(let i=0;i<3;i++)this.p('box',(i-1)*.21,-.48,-.35,.23,.83+(i%2)*.12,.065,cloth,0,0,(i-1)*.035);}
 this.p('box',0,-.16,.20,.19,.20,.038,cloth,0,0,.07,0);
 // Three brass rivets form the broken-branch emblem used across this faction.
 for(let i=0;i<3;i++)this.p('bead',-.057+i*.053,-.15+Math.abs(i-1)*.037,.225,.017,.017,.01,'#bd9a60',0,0,0,10);
 if(p.wounds?.rightArm?.severity!=='lost'){
  this.root=rec.sockets.rightHand;
  // KayKit handslot has its authored weapon axis along local +Y.
  this.C(0,.18,0,.033,.74,.033,leather,0,0,0,8);
  for(let i=0;i<4;i++)this.p('box',0,-.055+i*.048,.025,.083,.018,.06,'#98866c',0,0,0,8);
  if(elite){
   this.p('box',0,.56,0,.14,.25,.10,iron,0,0,0,10);
   for(const side of [-1,1])this.p('leaf',side*.22,.59,0,.22,.32,.13,edge,0,side*.60,0,10);
   this.p('horn',0,.87,0,.044,.24,.04,'#c9b58d',0,0,0,9);
  }else{
   this.p('box',0,.65,0,.14,.70,.052,iron,0,0,.025,10);
   this.p('cone',0,1.04,0,.069,.14,.027,edge,0,0,0,10);
   this.p('box',0,.29,0,.33,.046,.08,edge,0,0,.10,10);
   this.p('box',.048,.67,.029,.016,.58,.014,'#c4c6af',0,0,0,10);
  }
  const m=this.root;rWeaponTip(this.r,p,m,elite?.88:1.08);
 }
 if(p.wounds?.leftArm?.severity!=='lost'){
  this.root=rec.sockets.leftHand;
  // Shield offset is in the socket frame; the front face points outward.
  this.with(rModel(0,.12,.055,1,1,1,0,0,0),()=>{
   if(elite){
    this.p('cylinder',0,0,.035,.30,.12,.30,iron,0,0,Math.PI/2,10);
    this.p('cylinder',0,0,.108,.245,.035,.245,cloth,0,0,Math.PI/2,0);
    this.p('bead',0,0,.145,.10,.10,.065,edge,0,0,0,10);
   }else{
    this.p('box',0,-.02,.04,.49,.82,.10,iron,0,0,0,10);
    for(const side of [-1,1])this.p('box',side*.116,-.035,.104,.208,.72,.045,side>0?'#7f6f54':'#69715c',0,0,side*.025,8);
    this.p('box',0,-.01,.141,.034,.63,.02,edge,0,0,0,10);
    for(const side of [-1,1])this.p('box',side*.075,.085,.143,.19,.031,.022,edge,0,0,side*.65,10);
    this.p('box',.17,-.22,.145,.08,.014,.012,'#3c3930',0,0,.4+wear*.1,0);
    for(const side of [-1,1])for(const y of [-.34,.30])this.p('bead',side*.19,y,.121,.018,.018,.012,'#c2ad80',0,0,0,10);
   }
  });
 }
};
function rWeaponTip(r,p,m,length){r.weaponTips?.set(p.id,[m[12]+m[4]*length,m[13]+m[5]*length,m[14]+m[6]*length]);}

// Wound records stay legible on the replacement body. Place marks in the
// deformation palette of the corresponding source bone, including its back.
VillageArt.prototype.sentinelScars=function(p,rec){EnemyDamage.sentinel(this,p,rec);};
