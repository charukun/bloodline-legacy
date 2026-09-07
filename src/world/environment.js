/* Keep every gameplay location and collision footprint. This layer only authors
 * the visible surfaces, modular buildings and incidental dressing of the village. */
class VillageArt extends ArtDirector{
 constructor(r){super(r);this.buildingVillage=false;this.sources=[];}
 p(type,x,y,z,sx,sy,sz,c,ry=0,rz=0,rx=0,surf=0,alpha=1){
  if(this.target===this.r.static){
   // The authored terrain replaces the flat green platter and rectangular road slabs.
   if(this.buildingVillage&&((type==='cylinder'&&sx>40&&y>-.5)||(type==='plane'&&surf===12)||(type==='rbox'&&y<.2&&sy<=.11&&sx>2&&sz>2)||(type==='disk'&&surf===9&&sx>3)))return;
   if(surf===0&&['leaf','sphere','bead','leaflow'].includes(type)&&!this.roofWork){const rgb=Array.isArray(c)?c:rColor(c);if(rgb[1]>rgb[0]*.94&&rgb[2]<rgb[1]*.99)surf=13;}
   if(surf===8){const a=Array.isArray(c)?c:rColor(c);c=[a[0]*.77,a[1]*.69,a[2]*.60,1];}
   if(surf===9){const a=Array.isArray(c)?c:rColor(c);c=[a[0]*.89,a[1]*.89,a[2]*.88,1];}
  }else if(surf===0){if(RACES.some(r=>r.tone===c))surf=14;else if(['#80674e','#a48660','#68584c','#b09772','#8b7053','#685e56','#ddd9c6','#b1ac98'].includes(c))surf=15;}
  super.p(type,x,y,z,sx,sy,sz,c,ry,rz,rx,surf,alpha);
 }
 S(x,y,z,sx,sy,sz,c,ry=0,rz=0,rx=0,surf=0){
  if(this.target===this.r.static&&surf===9)return this.p('gltf:stone-sculpt',x,y,z,sx,sy,sz,c,ry,rz,rx,9);
  super.S(x,y,z,sx,sy,sz,c,ry,rz,rx,surf);
 }
 tuft(x,y,z,s=1,c='#70834e'){
  for(let i=0;i<4;i++)this.p('gltf:grass-blade',x+(i-1.5)*.075*s,y,z,.7*s,(.30+.09*(i%3))*s,.65*s,c,i*2.40,(i-1.5)*.12,0,13);
 }
 tree(x,z,scale=1,tint='#6e824d',seed=1){const rnd=random(seed);const pine=seed%3===0;this.with(rModel(x,0,z,scale,scale,scale,seed%6),()=>{
  this.p('trunk',0,1.6,0,.19,3.3,.19,'#846746',0,0,.02,8);
  for(let j=0;j<4;j++){const a=j*2.4;this.line([0,.20,0],[Math.sin(a)*.62,.1,Math.cos(a)*.62],.105,'#856742');}
  if(pine){for(let j=0;j<5;j++){const radius=1.50-j*.245;this.p('gltf:pine-tier',0,1.70+j*.58,0,radius,1.6-j*.1,radius,['#425c42','#4c6647','#5b744e','#678358','#7d935d'][j],j*.41,0,0,13);}}
  else{for(let j=0;j<6;j++){const a=j*2.39,xx=Math.sin(a)*.95,zz=Math.cos(a)*.84;this.line([0,1.5,0],[xx,2.85,zz],.095,'#89704e');this.p('gltf:leaf-crown',xx,3.03+rnd()*.6,zz,1.08+rnd()*.2,.86+rnd()*.3,1.1,['#65784a','#758553','#819259','#5b754b'][j%4],a,.07,0,13);}this.p('gltf:leaf-crown',.08,4.03,0,.99,.82,1.,'#829758',0,0,0,13);}
 });this.r.blob(x+.1,z,1.8*scale,1.5*scale,.48,this.r.groundFX);}
 roof(width,depth,base,height,col){this.roofWork=true;
  const raw=rColor(col);col=raw[2]>raw[0]*.98?'#66778a':raw[0]>raw[1]*1.035?'#93654f':raw[1]>raw[0]*1.03?'#647f73':'#7b7266';
  this.p('roof',0,base+height/2,0,width,height,depth,'#836749',0,0,0,8);
  const rows=6,cols=Math.max(4,Math.ceil(depth/.55)),angle=Math.atan(height/(width/2));
  for(const side of [-1,1])for(let row=0;row<rows;row++)for(let j=0;j<cols;j++){
   const u=(row+.46)/rows,xx=side*u*width*.5,yy=base+height*(1-u)+.11,zz=(j-(cols-1)/2)*depth/cols+(row%2)*.065;
   const color=rColor(col).map((v,k)=>k<3?v*(.94+((row*7+j*13)%7)*.018):v);
   // Curved, bevel-lit tiles are reused from the original GLB asset, not flat slabs.
   super.p('gltf:roof-shingle',xx,yy,zz,width/rows*.67,.62,depth/cols*1.12,color,0,-side*angle,0,18);
  }
  for(let j=0;j<cols;j++)this.C(0,base+height+.17,(j-(cols-1)/2)*depth/cols,.14,depth/cols*1.02,.13,'#829180',0,0,Math.PI/2,18);
  for(const end of [-1,1])for(const side of [-1,1]){this.line([0,base+height+.08,end*depth*.505],[side*width*.52,base-.06,end*depth*.505],.12,'#8e6a44');}
  for(const side of [-1,1])this.B(side*width*.5,base-.06,0,.15,.18,depth*1.04,'#a1865e');this.roofWork=false;
 }
 lantern(x,y,z){super.lantern(x,y,z);if(this.target===this.r.static){const m=rMultiply(this.root,rModel(x,y,z));this.sources.push({x:m[12],y:m[13],z:m[14],kind:'lamp'});}}
 chapel(x,z){super.chapel(x,z);this.with(rModel(x,0,z),()=>{
  for(const side of [-1,1]){for(let j=0;j<6;j++)this.B(side*2.55,1.0+j*.48,1.34,.37,.45,.44,j%2?'#b5b4a4':'#c9c6b3',0,0,0,9);this.C(side*2.2,.52,3,.27,.7,.27,'#c5c1a3',0,0,0,9);this.pot(side*2.2,3.0,.65);}
  // Rose-window spokes and colored glass stay on the existing facade.
  this.p('torus',0,4.30,2.02,.66,.66,.32,'#b9b69e',0,0,0,9);
  for(let j=0;j<8;j++){const a=j/8*TAU;this.S(Math.sin(a)*.37,4.30+Math.cos(a)*.37,2.045,.17,.19,.035,['#d6b875','#9fb0b1','#b89084','#8caba0'][j%4],0,-a,0,11);}
  this.S(0,4.30,2.073,.12,.12,.045,'#ecd09a',0,0,0,4);
 });}
 armory(x,z){super.armory(x,z);this.with(rModel(x,0,z),()=>{this.barrel(-3.0,1.5,.73);this.C(2.45,.18,2.9,.56,.32,.56,'#aaa182',0,0,0,9);for(let j=0;j<3;j++)this.B(2.4,.41+j*.085,2.9,.72,.08,.40,['#929973','#b5b298','#79886a'][j],.14,0,0,0);});}
 dojo(x,z){this.cottage(x,z,1.12,2,0);this.with(rModel(x,0,z),()=>{
  this.B(0,.24,2.6,4.8,.24,1.45,'#ac8457');for(let j=0;j<8;j++)this.B(-2.05+j*.59,.37,2.6,.53,.07,1.5,'#d3ae7e');
  for(const side of [-1,1]){this.C(side*2.5,1.45,2.15,.065,2.5,.065,'#977849');this.B(side*2.5,1.9,2.16,.64,1.1,.06,'#856353',0,0,0,0);this.p('leaf',side*2.5,1.94,2.20,.15,.26,.025,'#ddc99d',0,0,0,0);}
  this.B(.7,.52,3.3,.72,.11,.49,'#c5b58e');this.p('face',.7,.587,3.3,.32,.21,1,'#d4c4a2',0,0,-Math.PI/2,0);
 });}
 library(x,z){this.cottage(x,z,1.06,1,0);this.with(rModel(x,0,z),()=>{
  this.B(-2.0,.75,2.6,1.25,1.40,.38,'#826246');for(let k=0;k<2;k++){this.B(-2.0,.42+k*.52,2.6,1.3,.075,.5,'#ba9466');for(let j=0;j<6;j++)this.B(-2.5+j*.19,.66+k*.5,2.65,.14,.37+(j%3)*.035,.31,['#6e8b79','#936e5d','#788797','#b0976a'][j%4],0,j%2*.06,0,0);}
  this.B(.8,.75,2.9,1.5,.12,.80,'#b79669');for(const side of [-1,1])this.B(.8+side*.55,.38,2.9,.09,.74,.6,'#8d7151');for(let k=0;k<3;k++)this.B(.5+k*.23,.85+k*.034,2.9,.55,.055,.39,'#c5b088',k*.12,0,0,0);this.lantern(1.4,1.09,2.87);
 });}
 village(map){this.buildingVillage=true;this.sources=[];super.village(map);this.buildingVillage=false;
  const r=this.r,rng=random(map.seed+775);r.terrainData=makeTerrainMap(map);r.terrainDirty=true;this.target=r.static;this.root=rModel();
  this.p('slice-terrain',0,.10,0,1,1,1,'#a4ab76',0,0,0,12);
  for(const s of map.schools){
   // Ground-level history: worn paths, stacks of split firewood, tiny flower beds.
   this.r.blob(s.x,s.z-1,4.2,3.2,.5,this.r.groundFX);
   if(s.id==='forge'){this.sources.push({x:s.x+2.9,y:.8,z:s.z+.7,kind:'fire'});for(let j=0;j<9;j++)this.C(s.x-3.4+(j%3)*.25,.18+Math.floor(j/3)*.19,s.z+1.7,.105,.9,.105,'#987144',0,0,Math.PI/2);}
   for(const side of [-1,1]){for(let j=0;j<10;j++){const xx=s.x+side*(3.9+rng()),zz=s.z-1+rng()*5;this.tuft(xx,.1,zz,.8+rng()*.65,j%2?'#75884c':'#8c995c');}}
  }
  for(let j=0;j<650;j++){const x=(rng()-.5)*70,z=(rng()-.5)*65-7;if(Math.abs(x)<2.8||Math.abs(z-7)<1.6||Math.abs(z+19)<1.6||map.schools.some(s=>Math.hypot(x-s.x,z-s.z)<5)||map.houses.some(h=>Math.hypot(x-h.x,z-h.z)<3))continue;this.tuft(x,.11,z,.65+rng()*.65,j%3?'#7c8b51':'#9a9d63');}
  // Distant wooded banks hide the geometrical horizon without screen blur.
  for(let j=0;j<32;j++){const a=j/32*TAU;this.tree(Math.sin(a)*43,Math.cos(a)*43-7,.9+rng()*.4,'#697e59',j+99);}
 }
 // Override the old role-to-art dispatch without touching map schools or core rules.
}
function makeTerrainMap(map){const size=768,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),rng=random(map.seed+19),im=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;const n=.5+.15*Math.sin(x*.017)*Math.sin(y*.021)+.11*Math.sin(x*.13+y*.07);im.data[i]=0;im.data[i+1]=255;im.data[i+2]=Math.round(n*255);im.data[i+3]=255;}ctx.putImageData(im,0,0);
 const point=(x,z)=>[(x+48)/96*size,(z+55)/96*size];const roads=document.createElement('canvas');roads.width=roads.height=size;const d=roads.getContext('2d');d.lineCap='round';d.lineJoin='round';const path=(x,z,xx,zz,w)=>{d.beginPath();d.moveTo(...point(x,z));d.lineTo(...point(xx,zz));d.lineWidth=w/96*size;d.strokeStyle='#ffffff';d.stroke();};
 path(0,-48,0,28,3.5);path(-31,-19,32,-19,2.4);path(-31,7,31,7,2.3);path(-17,-23,-17,18,2.15);path(17,-23,17,18,2.15);
 for(const s of map.schools){path(0,s.z+3.6,s.x,s.z+3.6,2.5);const [x,y]=point(s.x,s.z+1);d.beginPath();d.ellipse(x,y,4.4/96*size,4./96*size,0,0,TAU);d.fill();}
 for(const h of map.houses)path(h.x,h.z+1.3,h.x,Math.abs(h.z-7)<Math.abs(h.z+19)?7:-19,1.4);
 const edge=document.createElement('canvas');edge.width=edge.height=size;const e=edge.getContext('2d');e.filter='blur(3px)';e.drawImage(roads,0,0);const red=e.getImageData(0,0,size,size);
 // Fixed building contact AO is baked into a separate channel of the terrain atlas.
 d.clearRect(0,0,size,size);d.fillStyle='#fff';d.filter='blur(5px)';for(const s of map.schools){const[x,y]=point(s.x,s.z-1.6);d.fillRect(x-3.4/96*size,y-2.9/96*size,6.8/96*size,5.5/96*size);}for(const h of map.houses){const[x,y]=point(h.x,h.z);d.fillRect(x-2.1/96*size,y-1.8/96*size,4.2/96*size,3.6/96*size);}const ao=d.getImageData(0,0,size,size);
 for(let i=0;i<im.data.length;i+=4){im.data[i]=red.data[i+3];im.data[i+1]=255-Math.round(ao.data[i+3]*.36);}
 ctx.putImageData(im,0,0);return c;
}
function installTerrainGeometry(){const p=[],n=[],N=72;const vertex=(i,j)=>{const x=-44+i/N*88,z=-51+j/N*88;const edge=Math.sqrt((x/42)**2+((z+7)/42)**2);let y=edge<.90?.007*Math.sin(x*.8)*Math.cos(z*.7):-.30*Math.max(0,edge-.90);return[x,y,z];};for(let j=0;j<N;j++)for(let i=0;i<N;i++){const center=vertex(i+.5,j+.5);if(center[0]**2+(center[2]+7)**2>42.2**2)continue;const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i+1,j+1),d=vertex(i,j+1);p.push(...a,...c,...b,...a,...d,...c);for(let k=0;k<6;k++)n.push(0,1,0);}RG_CACHE.set('slice-terrain',{positions:new Float32Array(p),normals:new Float32Array(n),count:p.length/3,radius:44});}
