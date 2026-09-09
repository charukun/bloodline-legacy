/* Wind-waiting square / central street: render-only, seed-stable district art.
 * No Simulation writes, colliders, character overrides or screen-space effects.
 * Meshes are original geometry, shared by all instances and all village seeds.
 */
const GOLDEN_DISTRICT=Object.freeze({minX:-16,maxX:16,minZ:-14,maxZ:22});
function inGoldenDistrict(x,z){const b=GOLDEN_DISTRICT;return x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ;}
function installGoldenGeometry(){
 if(RG_CACHE.has('golden:slate'))return;
 // Bevelled six-sided stone: broad faces, chipped corners, closed undersides.
 const prism=(name,outline,bevel=.06)=>{const p=[],n=[];
  const tri=(a,b,c)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]);let nn=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...nn);nn=nn.map(v=>v/len);p.push(...a,...b,...c);n.push(...nn,...nn,...nn);};
  for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],A=[a[0],.5-bevel,a[1]],B=[b[0],.5-bevel,b[1]],C=[a[0]*(1-bevel),.5,a[1]*(1-bevel)],D=[b[0]*(1-bevel),.5,b[1]*(1-bevel)],E=[a[0],-.5,a[1]],F=[b[0],-.5,b[1]];
   tri([0,.5,0],D,C);tri(C,D,B);tri(C,B,A);tri(A,B,F);tri(A,F,E);tri([0,-.5,0],E,F);
  }
  RG_CACHE.set(name,{positions:new Float32Array(p),normals:new Float32Array(n),count:p.length/3,radius:1});
 };
 prism('golden:stone',[[-.50,-.34],[-.31,-.5],[.45,-.48],[.50,.24],[.27,.50],[-.48,.41]],.09);
 prism('golden:slate',[[-.5,-.48],[.46,-.5],[.50,.36],[.35,.5],[-.49,.46]],.10);
 // A leaf spray has a branched silhouette instead of a smooth green sphere.
 const p=[],n=[];for(let i=0;i<19;i++){const a=i*2.399963,r=.12+.30*Math.sqrt(i/19),y=.18+Math.sin(i*7.1)*.18+(1-r)*.38;
  const c=[Math.sin(a)*r,y,Math.cos(a)*r],dx=Math.cos(a)*(.12+i%3*.025),dz=-Math.sin(a)*(.12+i%3*.025);
  const pts=[[c[0]-dx,c[1]-.04,c[2]-dz],[c[0]+Math.sin(a)*.30,c[1]+.12,c[2]+Math.cos(a)*.30],[c[0]+dx,c[1]-.04,c[2]+dz],[c[0],c[1]-.12,c[2]]];
  for(const ids of [[0,1,2],[0,2,3]]){for(const j of ids){p.push(...pts[j]);n.push(Math.sin(a)*.25,.93,Math.cos(a)*.25);}}
 }RG_CACHE.set('golden:spray',{positions:new Float32Array(p),normals:new Float32Array(n),count:p.length/3,radius:1});
 // One opaque, instanced bough: folded leaves leave real gaps in the silhouette.
 // 192 triangles replace the 252-triangle solid crowns; no alpha cards or new pass.
 const cp=[],cn=[];
 // A small interior closes distant pinholes; only the perimeter is individual leaf mesh.
 const core=rGeometry('beadlow');
 for(let i=0;i<core.positions.length;i+=3){
  const [x,y,z]=core.positions.subarray(i,i+3),ruffle=1+.06*Math.sin(x*7+z*5);
  cp.push(x*.63*ruffle,y*.34,z*.61*ruffle);
  const d=Math.hypot(x,y*1.7,z);cn.push(x/d,y*1.7/d,z/d);
 }
 for(let i=0;i<36;i++){
  const a=i*2.399963,h=1-2*(i+.5)/36,r=Math.sqrt(1-h*h),
   c=[Math.sin(a)*r*.68,h*.35,Math.cos(a)*r*.66],
   yaw=a+Math.sin(i*3.7)*.6,len=.18+(i%4)*.015,w=.095+(i%3)*.010,
   along=[Math.sin(yaw)*len,.02+Math.sin(i*1.7)*.04,Math.cos(yaw)*len],
   across=[Math.cos(yaw)*w,0,-Math.sin(yaw)*w],
   ring=[c.map((v,k)=>v+along[k]),c.map((v,k)=>v+across[k]),c.map((v,k)=>v-along[k]),c.map((v,k)=>v-across[k])],
   ridge=[c[0],c[1]+.025,c[2]];
  for(let j=0;j<4;j++)for(const q of [ridge,ring[j],ring[(j+1)%4]]){
   cp.push(...q);
   // Broad bough normals retain canopy volume without harsh card-to-card flicker.
   const normal=[q[0]*.8,.30+(q[1]+.35)*1.1,q[2]*.8],d=Math.hypot(...normal);
   cn.push(...normal.map(v=>v/d));
  }
 }
 RG_CACHE.set('golden:canopy',{positions:new Float32Array(cp),normals:new Float32Array(cn),count:cp.length/3,radius:1.3});
 // Five rounded petals, authored together instead of five instanced spheres.
 const fp=[],fn=[];
 for(let j=0;j<5;j++){
  const a=j*TAU/5,s=Math.sin(a),c=Math.cos(a),shape=[[0,.025],[.075,.08],[.075,.17],[0,.205],[-.075,.17],[-.075,.08]],
   pts=shape.map(([x,z],i)=>[x*c+z*s,i===0?.014:.005,x*-s+z*c]);
  for(let k=1;k<5;k++)for(const q of [pts[0],pts[k],pts[k+1]]){fp.push(...q);fn.push(0,1,0);}
 }
 RG_CACHE.set('golden:blossom',{positions:new Float32Array(fp),normals:new Float32Array(fn),count:fp.length/3,radius:.23});
}
class GoldenArt extends VillageArt{
 constructor(r){super(r);installGoldenGeometry();PlazaCraft.paving();this.goldenActive=false;}
 local(x=0,y=0,z=0){const m=rMultiply(this.root,rModel(x,y,z));return this.goldenActive&&this.target===this.r.static&&inGoldenDistrict(m[12],m[14]);}
 g(type,x,y,z,sx,sy,sz,c,ry=0,rz=0,rx=0,surf=21){ArtDirector.prototype.p.call(this,type,x,y,z,sx,sy,sz,c,ry,rz,rx,surf);}
 p(type,x,y,z,sx,sy,sz,c,ry=0,rz=0,rx=0,surf=0,alpha=1){
  if(this.local(x,y,z)){
   // Only legacy path stones; steps, thresholds and ground outside the district survive.
   if(this.buildingVillage&&type==='rbox'&&surf===9&&y===.205&&sy===.10)return;
   if(surf===9&&y>.25){surf=21;const a=Array.isArray(c)?c:rColor(c);c=[a[0]*.94,a[1]*.90,a[2]*.84,1];}
   else if(surf===8)surf=22;
   if(surf===0&&['sphere','bead'].includes(type)){const a=Array.isArray(c)?c:rColor(c);if(sx>.24&&sy>.18&&a[1]>a[0]*1.015&&a[2]<a[1]*.99){type='golden:spray';surf=13;c='#5e774a';sy*=1.8;}}
  }
  super.p(type,x,y,z,sx,sy,sz,c,ry,rz,rx,surf,alpha);
 }
 roof(width,depth,base,height,col){
  if(!this.local())return super.roof(width,depth,base,height,col);
  const a=rColor(col),palette=a[2]>a[0]*.98?'#526779':a[0]>a[1]*1.035?'#865d51':a[1]>a[0]*1.03?'#526c66':'#696375';
  this.g('roof',0,base+height/2-.055,0,width,height,depth,'#514e46',0,0,0,22);
  const rows=6,cols=Math.ceil(depth/.58),slope=Math.atan2(height,width/2),run=Math.hypot(width/2,height)/rows;
  for(const side of [-1,1])for(let row=0;row<rows;row++)for(let j=0;j<cols;j++){
   const u=(row+.48)/rows,zz=(j-(cols-1)/2)*depth/cols,ink=rColor(palette).map((v,k)=>k<3?v*(.91+((row*17+j*7)%11)*.016):v);
   this.g('golden:slate',side*u*width/2,base+height*(1-u)+.055+(rows-row)*.017,zz,run*1.13,.085,depth/cols*.99,ink,0,-side*slope,0,23);
  }
  for(let j=0;j<cols;j++)this.g('golden:slate',0,base+height+.08,(j-(cols-1)/2)*depth/cols,.22,.12,depth/cols*1.02,'#797e83',0,0,0,23);
  if(width>3.5)for(const end of [-1,1]){
   this.g('roof',0,base+height*.43,end*depth*.504,width*.85,height*.86,.10,'#b0ac96',0,0,0,21);
   this.g('box',0,base+height*.39,end*depth*.517,.12,height*.80,.09,'#75644c',0,0,0,22);
   this.g('box',0,base+.04,end*depth*.517,width*.87,.12,.09,'#75644c',0,0,0,22);
  }
  for(const end of [-1,1])for(const side of [-1,1])this.line([0,base+height-.02,end*depth*.51],[side*width*.51,base-.06,end*depth*.51],.085,'#7d6248',22);
  for(const side of [-1,1])this.g('box',side*width*.5,base-.11,0,.14,.18,depth*1.03,'#776048',0,0,0,22);
 }
 window(x,y,z,s=.85,glass){
  if(!this.local(x,y,z))return super.window(x,y,z,s,glass);
  super.window(x,y,z,s,'#b8a27a');
  // Recessed warm pane, opaque frame and shutters. Existing lamps light the frontage.
  this.g('arch',x,y,z+.135,s*.66,s*.91,.035,'#dfad62',0,0,0,4);
  for(const side of [-1,1]){
   this.g('box',x+side*s*.60,y,z+.05,s*.26,s*1.06,.09,'#647567',side*.23,0,0,22);
   for(let j=0;j<3;j++)this.g('box',x+side*s*.60,y+(j-1)*s*.28,z+.11,s*.24,.035,.025,'#8b8d6d',0,0,0,22);
  }
 }
 flower(x,z,c='#faf0d8',s=1){
  if(!this.local(x,0,z))return super.flower(x,z,c,s);
  this.line([x,.13,z],[x,.50*s,z],.013*s,'#7d8c54',13);
  this.g('golden:spray',x,.17,z,.25*s,.20*s,.25*s,'#7e8b50',x+z,0,0,13);
  this.g('golden:blossom',x,.53*s,z,s,1,s,c,x+z,0,0,0);
  this.g('beadlow',x,.545*s,z,.045*s,.018*s,.045*s,'#c3a451',0,0,0,0);
 }
 cottage(x,z,scale=1,variant=0,yaw=0){
  if(this.local(x,0,z)&&this.craftHouse&&x===this.craftHouse.x&&z===this.craftHouse.z-2){
   this.with(rModel(x,.08,z,scale,scale,scale,yaw),()=>{
    this.g('craft:cottage',0,0,0,1,1,1,'#ffffff',0,0,0,28);
    this.lantern(-.97,2.02,1.99);this.pot(-1.39,2.11,.84);
    for(const side of [-1,1]){this.g('box',side*2.49,.26,.12,.46,.28,1.66,'#9a8560',0,0,0,22);for(let j=0;j<4;j++)this.flower(side*2.49,-.49+j*.41,j%2?'#e8dcb6':'#adb19a',.67);}
   });this.r.blob(x,z,3.5*scale,2.7*scale,.3,this.r.groundFX);return;
  }
  super.cottage(x,z,scale,variant,yaw);if(!this.local(x,0,z))return;
  this.with(rModel(x,.08,z,scale,scale,scale,yaw),()=>{
   for(const side of [-1,1])for(let j=0;j<6;j++)this.g('golden:stone',side*2.34,.39+j*.43,1.86,j%2?.38:.56,.38,.22,j%3?'#aca28b':'#8e9184');
   for(let j=0;j<7;j++)this.g('golden:stone',-2.03+j*.66,.29,1.9,.62,.32,.22,j%2?'#979886':'#aba28b');
   this.g('roof',0,3.47,2.10,4.80,.94,.11,'#bbb39b',0,0,0,21);
   this.g('box',0,3.36,2.18,.13,.78,.12,'#756049',0,0,0,22);
   for(const side of [-1,1])this.line([side*1.8,3.06,2.18],[0,3.9,2.18],.065,'#796449',22);
   // A compact espalier stays against the side wall, clear of the door/steps.
   for(const zz of [-.90,-.25,.40])this.g('box',-2.48,1.17,zz,.055,1.75,.055,'#897652',0,0,0,22);
   for(const yy of [.65,1.15,1.65])this.g('box',-2.49,yy,-.25,.045,.05,1.68,'#a18b62',0,0,0,22);
   for(let j=0;j<5;j++)this.g('golden:canopy',-2.54,.52+j*.29,-.68+Math.sin(j*2.1)*.35,.28,.37,.53,j%2?'#74804b':'#909058',j*.8,0,0,13);
   this.g('box',-2.48,.26,-.28,.53,.32,1.87,'#9c8662',0,0,0,22);
   this.g('box',-2.48,.435,-.28,.43,.025,1.71,'#625c3f',0,0,0,16);
  });
 }
 garden(x,z){
  if(!this.local(x,0,z))return super.garden(x,z);
  this.with(rModel(x,0,z),()=>{
   this.g('craft:well',0,0,0,1,1,1,'#ffffff',0,0,0,28);
   this.g('cylinder',0,.19,0,.71,.02,.71,'#426065',0,0,0,1);
   this.lantern(-1.20,2.08,.28);
  });
 }
 tree(x,z,scale=1,tint,seed=1){
  if(this.goldenActive&&terrainFootprint(this.r.traversalMap,x,z,1))return;
  if(!this.local(x,0,z))return super.tree(x,z,scale,tint,seed);
  // Asymmetric boughs, exposed forks and a planted root skirt. Existing wind only.
  this.with(rModel(x,0,z,scale,scale,scale,seed%6),()=>{
   this.g('trunk',0,1.7,0,.15,3.4,.18,'#71644c',0,0,.025,22);
   if(seed%3===0){for(let j=0;j<6;j++){const rad=1.30-j*.19;this.g('gltf:pine-tier',Math.sin(j*2)*.07,1.45+j*.52,0,rad,1.30,rad,['#3f6147','#486c49','#52754c','#608051','#6e8b57','#7f965e'][j],j*.53,0,0,13);if(j<5)for(let k=0;k<3;k++){const a=k*TAU/3+j*2.4;this.g('golden:spray',Math.sin(a)*rad*.80,1.09+j*.52,Math.cos(a)*rad*.80,.85,.55,.85,'#60814c',a,0,0,13);}}}
   else{for(let j=0;j<7;j++){const a=j*2.399963+seed*.17,rad=j<5?.76:.30,xx=Math.sin(a)*rad,zz=Math.cos(a)*rad,
     yy=j<5?2.77+(j%3)*.29:3.76+(j-5)*.30;
    if(j<5)this.line([0,1.65,0],[xx*1.28,yy-.12,zz*1.28],.063,'#807052',22);
    this.g('golden:canopy',xx,yy,zz,1.08+(j%2)*.16,.83,1.08,['#566f44','#6a7e49','#7b8c51','#697d48','#859457','#7c9254','#91a062'][j],a,.08*Math.sin(a),0,13);
   }}
   for(let j=0;j<3;j++){const a=j*2.399963;this.line([0,.27,0],[Math.sin(a)*.46,.12,Math.cos(a)*.46],.07,'#786b4e',22);
    this.g('golden:canopy',Math.sin(a)*.54,.28,Math.cos(a)*.54,.56,.39,.54,j%2?'#6c7945':'#858951',a,0,0,13);}
  });this.r.blob(x,z,1.4*scale,1.4*scale,.34,this.r.groundFX);
 }
 village(map){
  this.craftHouse=map.schools.find(s=>s.id==='hunter');this.goldenActive=true;super.village(map);this.target=this.r.static;this.root=rModel();
  const well=map.schools.find(s=>s.id==='dance'),rng=random(map.seed+8301),stone=['#a29a85','#b3a68e','#beb095','#a69e89','#c0b39b'];
  // Connected, irregular coursed paving. Low relief stays below the existing foot plane.
  const paved=(x,z)=>!terrainFootprint(map,x,z,.1)&&inGoldenDistrict(x,z)&&((Math.abs(x)<2.35&&z<20)||(x*x/42+(z-well.z)**2/31<1)||(Math.abs(z-7)<1.45&&Math.abs(x)<15)||map.schools.some(s=>s.id!=='dance'&&Math.abs(z-(s.z+3.6))<1.40&&x>=Math.min(0,s.x)-.5&&x<=Math.max(0,s.x)+.5));
  const grout=[];
  for(let row=0,z=-13.7;z<21.7;row++){
   const depth=.49+rng()*.24;
   for(let x=-15.7+(row%2)*.31;x<15.7;){const width=.50+rng()*.49,cx=x+width/2,cz=z+depth/2;
    if(paved(cx,cz)){
     // Dark earth/grout substrate is shared with the paver, no large overlay plane.
     const a=[x/18,0,z/18],b=[(x+width)/18,0,z/18],c=[(x+width)/18,0,(z+depth)/18],d=[x/18,0,(z+depth)/18];grout.push(...a,...c,...b,...a,...d,...c);
     const edge=!paved(cx+width*.7,cz)||!paved(cx-width*.7,cz)||!paved(cx,cz+depth*.7)||!paved(cx,cz-depth*.7);
     const wear=Math.sin(cx*1.7+cz*.43)+Math.cos(cz*1.23-cx*.32);
     const inset=edge?.12:.055;
     // Earth showing between worn, uneven courses breaks up the tiled carpet.
     // Shared UV material in one instanced batch; the layout stays seed-stable.
     if(wear<1.58||Math.hypot(cx-well.x,cz-well.z)<1.8)
      this.g('craft:paving',cx,.148+(rng()-.5)*.009,cz,width-inset,.053,depth-inset*.8,['#fff5dc','#fff9e8','#eadfc7','#f8efd9'][Math.floor(rng()*4)],(rng()-.5)*(edge?.14:.07),0,0,29);
     if(rng()<.035&&Math.abs(cx)>2.8)this.g('golden:spray',cx+width*.40,.14,cz,.22,.10,.30,'#6b8050',rng()*6,0,0,13);
    }x+=width;
   }z+=depth;
  }
  const gn=new Float32Array(grout.length);for(let i=1;i<gn.length;i+=3)gn[i]=1;
  RG_CACHE.set('golden:grout',{positions:new Float32Array(grout),normals:gn,count:grout.length/3,radius:1.6,dirty:true});
  this.g('golden:grout',0,.124,0,18,1,18,'#82775e',0,0,0,16);
  // Groups hug existing school footprints and leave all approaches / crossroads open.
  for(const s of map.schools){if(s.id==='dance'||!inGoldenDistrict(s.x,s.z))continue;
   const side=s.x<0?-1:1,bx=s.x+side*3.7,bz=s.z-3.0;
   for(let j=0;j<6;j++)this.g('golden:stone',bx,.24+(j%2)*.06,bz+j*.57,.68,.45,.60,stone[j%stone.length],j*.15);
   for(let j=0;j<7;j++)this.g('golden:canopy',bx-side*.25+(rng()-.5)*.55,.34,bz+rng()*3.0,.55+rng()*.3,.45+rng()*.35,.65,j%2?'#718048':'#8a9156',rng()*6,0,0,13);
   // The taller backdrop sits behind the building, never in front of its interaction.
   for(let j=0;j<2;j++){const tx=s.x+side*(1.7+j*1.5),tz=s.z-5.0;if(inGoldenDistrict(tx,tz))this.tree(tx,tz,1.08+rng()*.42,'#607f50',s.x*17+j+87);}
  }
  for(const side of [-1,1]){
   const x=side*(side<0?5.7:6.0),z=well.z+(side<0?.2:1.3);
   if(terrainFootprint(map,x,z,2.5))continue;
   this.g('gltf:stone-sculpt',x+side*.6,.08,z-.3,1.1,.26,2.7,'#73774e',.12,0,0,16);
   for(let j=0;j<7;j++){this.g('golden:stone',x+side*Math.sin(j*.45)*.45,.23,z-2.2+j*.65,.75,.38,.64,stone[j%5],j*.22);this.g('golden:canopy',x+side*.5,.37,z-2.2+j*.65,.85,.53+(j%3)*.14,.78,j%2?'#667b45':'#899252',j,0,0,13);
    if(j%2===0){this.flower(x+side*.22,z-2.1+j*.65,'#e6d8ae',.53);this.tuft(x-side*.25,.12,z-2+j*.65,.7,'#859453');}}
   this.tree(x+side*.8,z-(side<0?3.6:2.1),1.09+(side+1)*.09,'#698251',side+212);
   // Worn bench and stacked baskets beside the planted edge, away from the well.
   this.with(rModel(x-side*.9,0,z+1,1,1,1,side*.18),()=>{
    for(const zz of [-.19,.0,.19])this.g('box',0,.64,zz,1.65,.10,.17,'#947b53',0,0,0,22);
    for(const a of [-1,1])this.g('golden:stone',a*.60,.35,0,.24,.51,.54,'#939585');
    this.g('box',0,1.0,-.28,1.72,.20,.08,'#9d845c',0,0,0,22);
    for(const a of [-1,1])this.g('box',a*.65,.78,-.29,.07,.76,.08,'#806c4c',0,0,0,22);
   });
   this.barrel(x+side*.25,z+3,.67);
   for(let j=0;j<4;j++)this.flower(x+side*.25+(j%2)*.3,z-1+j*.47,j%2?'#c9b987':'#adacc2',.46+j%2*.10);
   if(side<0)this.cart(x-1.1,z+3.0);
  }
  // Low planting pockets soften the grass/path join, without covering walking space.
  for(const side of [-1,1])for(let j=0;j<3;j++){
   const x=side*(3.25+j*.49),z=well.z-4.6-j*.65;
   if(paved(x,z)||map.schools.some(s=>s.id!=='dance'&&Math.hypot(x-s.x,z-s.z)<4.8))continue;
   this.g('golden:canopy',x,.29,z,.66,.42,.62,j%2?'#7c8950':'#687b48',j+side,0,0,13);
   for(let k=0;k<3;k++)this.flower(x-side*.40+Math.sin(k*2.4)*.22,z+.35+Math.cos(k*2.4)*.23,k===1?'#d4bc9b':'#e9dfbe',.65+(k%2)*.13);
  }
  this.goldenActive=false;
 }
}
