


/* All models below are original articulated geometry, not image billboards. */
class ArtDirector{
 constructor(renderer){this.r=renderer;this.root=rModel();this.target=renderer.static;this.low=false;}
 p(type,x,y,z,sx,sy,sz,c,ry=0,rz=0,rx=0,surf=0,alpha=1){this.r.put(type,rMultiply(this.root,rModel(x,y,z,sx,sy,sz,ry,rz,rx)),c,surf,alpha,this.target);}
 B(x,y,z,sx,sy,sz,c,ry=0,rz=0,rx=0,surf=8){this.p('rbox',x,y,z,sx,sy,sz,c,ry,rz,rx,surf);}
 S(x,y,z,sx,sy,sz,c,ry=0,rz=0,rx=0,surf=0){this.p(this.low?'bead':'sphere',x,y,z,sx,sy,sz,c,ry,rz,rx,surf);}
 C(x,y,z,sx,sy,sz,c,ry=0,rz=0,rx=0,surf=8){this.p('cylinder',x,y,z,sx,sy,sz,c,ry,rz,rx,surf);}
 with(m,fn){const old=this.root;this.root=rMultiply(old,m);fn();this.root=old;}
 line(a,b,width,color,surf=8){const d=b.map((n,i)=>n-a[i]),len=Math.hypot(...d);if(!len)return;this.C((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,width,len,width,color,Math.atan2(d[0],d[2]),0,Math.acos(d[1]/len),surf);}
 tuft(x,y,z,s=1,c='#97a475'){
  for(let i=0;i<3;i++)this.p('leaf',x+(i-1)*.13*s,y+.18*s,z,.13*s,.30*s,.13*s,c,i*2.3,(i-1)*.34,0,0);
 }
 flower(x,z,c='#faf0d8',s=1){this.line([x,.13,z],[x,.51*s,z],.018*s,'#91a174',0);this.p('leaf',x+.09*s,.26*s,z,.1*s,.17*s,.08*s,'#a2ae82',0,-.8,0,0);for(let j=0;j<5;j++){const a=j/5*TAU;this.S(x+Math.sin(a)*.115*s,.53*s,z+Math.cos(a)*.115*s,.11*s,.045*s,.085*s,c,0,0,0,0);}this.S(x,.58*s,z,.06*s,.06*s,.06*s,'#ddb661');}
 pot(x,z,s=1){this.C(x,.28*s,z,.28*s,.52*s,.28*s,'#ba8463');this.p('torus',x,.54*s,z,.29*s,.29*s,.25*s,'#d3a07d',0,0,Math.PI/2,9);this.S(x,.56*s,z,.22*s,.035*s,.22*s,'#6a684d',0,0,0,9);this.tuft(x,.54*s,z,1.5*s);}
 tree(x,z,scale=1,tint='#9fa779',seed=1){const rand=random(seed);this.with(rModel(x,0,z,scale,scale,scale,seed%6),()=>{
  this.p('trunk',0,1.35,0,.24,2.7,.24,'#a08b67',0,0,.035,8);
  for(let k=0;k<3;k++)this.line([0,1.4,0],[Math.sin(k*2.1)*.9,2.5,Math.cos(k*2.1)*.85],.09,'#a49172');
  for(let k=0;k<13;k++){const a=k*2.39,r=.5+(k%3)*.36;this.S(Math.sin(a)*r,2.95+(rand()-.5)*1.3,Math.cos(a)*r,1.0+rand()*.3,.80+rand()*.28,.85+rand()*.3,k%3===0?'#b4bb8c':k%3===1?tint:'#96a375');}
  this.S(0,3.6,0,1.1,1.0,1.1,tint);
 });this.r.blob(x+.2,z+.15,2.1*scale,1.6*scale,.26,this.r.groundFX);}
 roof(width,depth,base,height,col){
  this.p('roof',0,base+height/2,0,width,height,depth,'#a49470',0,0,0,8);
  const rows=5,cols=Math.ceil(depth/.55),slope=Math.atan(height/(width/2));
  const colors=[col,col,col,'#b3b895'];
  for(const side of [-1,1])for(let row=0;row<rows;row++)for(let colN=0;colN<cols;colN++){
   const u=(row+.48)/rows,x=side*u*width/2,y=base+height*(1-u)+.10,z=(colN-(cols-1)/2)*depth/cols;
   this.B(x,y,z,width/(rows*2)*1.23,.21,depth/cols*1.13,col,0,-side*slope,0,0);
   if(row===4)this.B(x+side*.09,y-.01,z,.12,.15,depth/cols*.86,'#c4b795',0,-side*slope,0,0);
  }
  for(let i=0;i<cols;i++)this.C(0,base+height+.05,(i-(cols-1)/2)*depth/cols,.15,depth/cols*1.02,.15,'#cec4a4',0,0,Math.PI/2,0);
  for(const zz of [-depth/2,depth/2])for(const side of [-1,1])this.line([0,base+height,zz],[side*width/2,base-.02,zz],.095,'#ac9772');
 }
 window(x,y,z,s=.85,glass='#b5c8b5'){
  this.p('arch',x,y,z,s,s*1.25,.16,'#c6b18a',0,0,0,8);this.p('arch',x,y,z+.09,s*.78,s*1.04,.08,glass,0,0,0,11);
  this.B(x,y-.06,z+.15,.035,s*.9,.04,'#ece3ca');this.B(x,y-.03,z+.15,s*.7,.032,.04,'#ece3ca');
  this.B(x,y-s*.57,z+.17,s*1.15,.11,.34,'#e6d6b1');
 }
 door(x,z,y=1.1,s=1,col='#859c85'){
  this.p('arch',x,y,z,s*1.28,y*1.97,.28,'#bfaa7e',0,0,0,9);
  this.p('arch',x,y,z+.17,s,y*1.84,.15,col,0,0,0,0);
  for(let i=-2;i<=2;i++)this.B(x+i*s*.155,y-.09,z+.263,.013,y*1.51,.008,'#6c7f6d',0,0,0,0);
  this.S(x+s*.27,y-.06,z+.29,.055,.055,.038,'#e7c48a',0,0,0,10);
  this.B(x,.21,z+.49,s*1.56,.24,.86,'#e8d5b2',0,0,0,9);
 }
 lantern(x,y,z){this.B(x,y+.38,z,.34,.13,.34,'#756e55');this.B(x,y,z,.22,.55,.22,'#f8d48c',0,0,0,4);for(const side of [-1,1])this.B(x+side*.135,y,z+.13,.036,.57,.035,'#7c755c');this.B(x,y-.31,z,.34,.10,.34,'#756e55');this.p('torus',x,y+.55,z,.10,.13,.06,'#8d7b55',0,0,0,10);}
 cottage(x,z,scale=1,variant=0,yaw=0){
  const roof=['#a5b497','#bfb98c','#839e9f','#bfa083'][variant%4],door=['#a3b494','#91aa9d','#b8a087','#a1b1b5'][variant%4];
  this.with(rModel(x,.08,z,scale,scale,scale,yaw),()=>{
   this.B(0,.19,0,5.5,.38,4.5,'#d4c49f',0,0,0,9);this.B(0,1.55,0,4.8,2.9,3.65,'#eddfbd',0,0,0,9);
   for(let side of [-1,1]){this.B(side*2.20,1.48,1.82,.15,2.85,.18,'#b6a07d');this.B(side*2.20,1.48,-1.82,.15,2.85,.18,'#b6a07d');}
   this.B(0,.65,1.89,4.8,.13,.17,'#baa57f');this.B(0,2.98,1.89,4.85,.18,.22,'#b7a37e');
   this.roof(5.8,4.5,3,variant%2?1.68:1.30,roof);
   if(variant===2){this.with(rModel(.65,0,1.25,.48,.48,.48),()=>this.roof(2.8,2.2,7.4,.95,'#a9b8ac'));this.window(.65,3.72,1.58,.52);}
   if(variant===3){for(const side of [-1,1])this.B(side*1.1,1.3,2.6,.1,2.5,.11,'#b4a181');this.B(0,2.58,2.47,2.8,.15,1.34,'#c2b38e',0,0,.05,0);}this.door(variant%2?.30:-.25,1.89,1.03,1,door);this.window(variant%2?-1.45:1.48,1.78,1.9,.87);
   this.C(-1.2,4.13,-.5,.35,1.5,.35,'#d3c3a5',0,0,0,9);this.B(-1.2,4.87,-.5,.91,.18,.84,'#c2af8d',0,0,0,9);
   this.B(1.5,.6,2.26,1.13,.35,.50,'#b49b70');this.tuft(1.25,.67,2.26,.8);this.tuft(1.65,.67,2.26,.8);
   this.pot(-1.4,2.15,.9);this.lantern(-.92,1.94,2.10);
   if(variant%3===1){this.B(-2.4,.9,.5,.7,.10,2.8,'#b9a57f');for(let n=0;n<3;n++)this.C(-2.4,1.17,n*.6-.1,.2,.45,.2,'#d4c09a');}
  });this.r.blob(x+.1,z+.2,3.5*scale,2.7*scale,.3,this.r.groundFX);
 }
 chapel(x,z){this.with(rModel(x,0,z),()=>{
  this.B(0,.25,0,6.3,.5,5.8,'#ddd0b1',0,0,0,9);this.B(0,2,0,4.8,3.7,4.5,'#eee4ca',0,0,0,9);
  for(const side of [-1,1]){this.B(side*2.25,2.0,2.27,.26,3.65,.24,'#d1c09b',0,0,0,9);this.window(side*1.65,2.65,2.31,.72);this.pot(side*2.75,2.9,.8);}
  this.roof(5.8,5.5,3.7,2.05,'#9cafa3');this.door(0,2.36,1.55,1.36,'#a6b39a');
  for(let n=0;n<3;n++)this.B(0,.10+n*.12,3.80-n*.4,2.9-n*.15,.2,1.1,'#e9dabb',0,0,0,9);
  // Rose window: inset colored cloth-glass petals, pale stone tracery.
  this.p('torus',0,4.38,1.6,.70,.70,.6,'#e5d5b2',0,0,0,9);this.S(0,4.38,1.61,.52,.52,.08,'#c0d0c2',0,0,0,11);
  for(let i=0;i<6;i++){const a=i/6*TAU;this.S(Math.sin(a)*.26,4.38+Math.cos(a)*.26,1.72,.14,.23,.028,['#ddc18e','#adc7c2','#c3b3c7'][i%3],0,-a,0,11);}this.S(0,4.38,1.78,.11,.11,.07,'#f1d99b');
  // Distinct open bell tower, with no filled wall behind the bell.
  this.B(0,6.20,-1.3,1.9,.24,1.85,'#dfcfad',0,0,0,9);
  for(const a of [-1,1])for(const b of [-1,1])this.B(a*.7,7.1,-1.3+b*.66,.30,1.8,.30,'#e7d9bc',0,0,0,9);
  this.C(0,7.35,-1.3,.06,.9,.06,'#a59165');this.p('cone',0,6.91,-1.3,.38,.62,.38,'#d6b770',0,0,0,10);this.p('torus',0,6.6,-1.3,.42,.42,.25,'#d6b770',0,0,Math.PI/2,10);
  this.with(rModel(0,0,-1.3),()=>this.roof(2.5,2.4,7.95,1.05,'#9aada1'));
  this.B(0,9.35,-1.3,.15,1.10,.16,'#cbbb91');this.B(0,9.49,-1.3,.80,.14,.16,'#cbbb91');
  this.lantern(-1.1,2,2.8);this.lantern(1.1,2,2.8);
  for(let i=0;i<7;i++){this.flower(-2.8-i*.19,3.2+(i%3)*.27,'#fff6dd',.8);this.flower(2.6+i*.13,3.25+(i%3)*.22,'#ebd39d',.8);}
 });this.r.blob(x,z+.7,4,3.6,.28,this.r.groundFX);}
 anvil(x,y,z){this.C(x,y+.32,z,.48,.65,.40,'#a88c66');this.B(x,y+.70,z,.69,.17,.52,'#646e69',0,0,0,10);this.B(x,y+1,z,.45,.55,.4,'#6e7873',0,0,0,10);this.B(x,y+1.28,z,1.3,.26,.62,'#8e9690',0,0,0,10);this.p('cone',x+.90,y+1.25,z,.18,.67,.18,'#9aa29a',0,-Math.PI/2,0,10);}
 forge(x,z){this.with(rModel(x,0,z),()=>{
  this.B(0,.25,0,6.4,.5,5.5,'#c9b699',0,0,0,9);
  this.B(0,1.64,-1.9,5.5,3.1,.55,'#dccbaa',0,0,0,9);for(const side of [-1,1]){this.B(side*2.55,1.7,-.2,.45,3.3,4.3,'#dbcaab',0,0,0,9);this.B(side*2.6,1.9,2.3,.32,3.55,.32,'#af906b');}
  this.roof(6.5,5.5,3.7,1.65,'#c79c7e');
  for(let y=0;y<10;y++)for(let col=0;col<2;col++)this.B(1.85+(col-.5)*.73+(y%2)*.08,2.1+y*.48,-1.45,.72,.46,1.25,['#c2ad90','#d1b99c','#bea487'][y%3],0,0,0,9);
  this.B(1.88,6.8,-1.44,1.88,.29,1.75,'#b69f81',0,0,0,9);
  this.p('arch',.7,1.15,-1.52,2.12,2.05,.27,'#ae8e6b',0,0,0,9);this.p('arch',.7,1.14,-1.28,1.6,1.62,.15,'#544937',0,0,0,9);
  for(let i=0;i<6;i++)this.S(.17+i*.20,.72,-1.09,.21,.16,.2,i%2?'#f1b66b':'#da824b',0,0,0,4);
  this.B(.7,.5,-.65,2.1,.2,1.3,'#b5a087',0,0,0,9);this.anvil(-.6,.31,1.42);
  this.B(-1.82,1,-.2,1.04,.16,2.1,'#b6946b');for(const ss of [-1,1])for(const q of [-1,1])this.B(-1.82+ss*.38,.6,-.2+q*.81,.12,.8,.13,'#a98b64');
  this.B(-1.85,1.23,-.1,.15,.62,.17,'#ad8d60',0,0,.3);this.B(-1.85,1.55,.02,.54,.26,.30,'#838a7b',0,0,0,10);
  this.p('torus',-2.32,2,-1.56,.22,.29,.20,'#8b927d',0,0,0,10);
  this.lantern(2.6,2.6,2.5);this.pot(-3.3,1.7,.8);
 });this.r.blob(x,z+.3,4,3.8,.34,this.r.groundFX);}
 armory(x,z){this.with(rModel(x,0,z),()=>{
  this.B(0,.25,0,7,.5,5,'#d7c5a4',0,0,0,9);this.B(0,1.7,-.1,6.1,3.1,3.9,'#e6d6b4',0,0,0,9);
  for(const side of [-1,1]){this.B(side*2.85,1.9,1.97,.20,3.15,.22,'#ad9572');this.line([side*2.8,.4,1.98],[side*.9,3.2,1.98],.065,'#bea981');}
  this.roof(7.1,4.95,3.45,1.5,'#95aab0');this.door(0,1.97,1.3,1.2,'#a4aea0');
  // Melee rack and loose shields are part of the actual world.
  this.B(-2.18,.3,3.30,2.55,.25,.80,'#b39b75');for(const q of [-1,1])this.B(-2.18+q*1.1,1.25,3.3,.16,2.1,.19,'#a88c63');this.B(-2.18,1.72,3.33,2.5,.18,.18,'#af956e');
  for(let i=0;i<3;i++)this.with(rModel(-2.96+i*.7,1.58,3.30,1,1,1,0,Math.PI,0),()=>this.weapon(i===2?4:0,.72));
  this.with(rModel(2.2,.12,3.1),()=>{this.B(0,.2,0,1.1,.3,.9,'#b4a184');this.C(0,1.1,0,.07,1.8,.07,'#ad9772');this.B(0,1.35,0,.74,.80,.50,'#acb3a7',0,0,0,10);this.S(0,2,0,.36,.35,.3,'#b7bcae',0,0,0,10);this.B(0,2,.29,.52,.06,.06,'#67756f',0,0,0,10);this.shield(-.6,1.0,.25,.7);});
  this.B(-2.9,2.87,2.1,.72,1.14,.07,'#789198',0,0,0,0);this.B(-2.9,2.88,2.16,.07,.76,.035,'#e5d8b4',0,0,0,0);this.B(-2.9,2.95,2.17,.4,.06,.035,'#e5d8b4',0,0,0,0);this.lantern(.9,2.56,2.20);
 });this.r.blob(x,z+.5,4.1,3.5,.3,this.r.groundFX);}
 shield(x,y,z,s=1){this.S(x,y,z,.37*s,.45*s,.09*s,'#b4976e',0,0,0,8);this.p('torus',x,y,z+.07,.39*s,.48*s,.48*s,'#d0ba89',0,0,0,10);this.S(x,y,z+.15,.12*s,.13*s,.07*s,'#b6c0b2',0,0,0,10);for(const side of [-1,1])this.B(x+side*.14*s,y,z+.09,.035*s,.69*s,.025*s,'#987d5b',0,0,0,8);}
 weapon(id,s=1){this.with(rModel(0,0,0,s,s,s),()=>{
  if(id<0)return;
  if(id<=2){const length=id===2?1.4:id===1?.62:1.0;this.C(0,-.1,0,.055,.35,.055,'#836c50');this.S(0,-.29,0,.075,.075,.075,'#c9b27b',0,0,0,10);this.B(0,.08,0,id===2?.50:.40,.07,.12,'#cbb17c',0,0,0,10);this.p('blade',0,.12,0,id===2?1.2:.82,length,1,'#d4dbcb',0,0,0,10);this.B(0,.64*length,0,.018,.7*length,.06,'#eef2e0',0,0,0,10);}
  else if(id===3){this.C(0,.25,0,.045,2.0,.045,'#9e825b');this.p('leaf',0,1.41,0,.13,.39,.09,'#d6deca',0,0,0,10);this.C(0,1.06,0,.068,.15,.068,'#c6ad79',0,0,0,10);}
  else if(id===4){this.C(0,.28,0,.067,1.35,.067,'#9f8057');this.B(.1,.85,0,.68,.38,.14,'#98a79b',0,0,.07,10);this.p('leaf',-.27,.86,0,.24,.35,.12,'#c4cdba',0,-1.1,0,10);this.B(0,.58,0,.2,.2,.19,'#baab84',0,0,0,10);}
  else{this.p('trunk',0,.3,0,.07,1.8,.07,'#a18c60',0,0,0,8);this.p('torus',0,1.31,0,.20,.22,.13,'#c9b784',0,0,0,8);this.S(0,1.31,0,.13,.16,.13,'#b8c5a1');}
 });}
 fence(x,z,length=4,yaw=0){this.with(rModel(x,0,z,1,1,1,yaw),()=>{for(const side of [-1,1]){this.B(side*length/2,.59,0,.24,1.18,.24,'#bca780');this.S(side*length/2,1.20,0,.18,.13,.18,'#d3c29e');}for(const yy of [.47,.9])this.B(0,yy,0,length,.17,.14,'#cdb996');});}
 garden(x,z){this.with(rModel(x,0,z),()=>{
  this.C(0,.48,0,1.0,.8,1.0,'#b9b495',0,0,0,9);this.C(0,.86,0,1.1,.2,1.1,'#d2c9a8',0,0,0,9);this.C(0,.93,0,.80,.02,.80,'#7c9a94',0,0,0,1);
  for(const side of [-1,1])this.B(side*1.18,1.7,0,.16,2.9,.20,'#bba782');this.with(rModel(0,0,0),()=>this.roof(3,2.4,2.96,.83,'#b4b58a'));
  this.C(0,2.15,0,.075,2.7,.075,'#9b8663',0,0,Math.PI/2);this.line([0,2.15,0],[0,1.3,0],.022,'#d6cba9');this.C(0,1.3,0,.22,.38,.22,'#ae9370');
  for(let i=0;i<9;i++)this.flower(Math.sin(i*.65)*2.9,Math.cos(i*.65)*2.8,i%3?'#fff3d9':'#c0c5db',.6+(i%3)*.15);
 });}
 barrel(x,z,s=1){this.with(rModel(x,0,z,s,s,s),()=>{this.S(0,.5,0,.36,.46,.36,'#bca079',0,0,0,8);this.C(0,.51,0,.28,.83,.28,'#c4ac83');for(const y of [.25,.72])this.p('torus',0,y,0,.355,.355,.28,'#8c927e',0,0,Math.PI/2,10);this.C(0,.94,0,.28,.035,.28,'#dac29a');this.B(0,.97,0,.048,.022,.49,'#ad9169');});}
 herbBed(x,z,w=2){this.B(x,.21,z,w,.28,1.1,'#b59d73');this.B(x,.36,z,w-.17,.035,.85,'#9d9d72',0,0,0,9);for(let i=0;i<6;i++)this.tuft(x-w*.42+i*w*.17,.36,z,.85,'#91a67d');}
 stoneWall(x,z,len=4){for(let k=0;k<2;k++)for(let i=0;i<Math.floor(len/.6);i++)this.B(x-len/2+i*.62+(k%2)*.27,.24+k*.33,z,.62,.32,.42,k%2?'#d7c9a8':'#cabe9d',0,0,0,9);}
 cart(x,z){this.with(rModel(x,0,z,1,1,1,.3),()=>{this.B(0,.63,0,1.65,.17,1.01,'#b9a078');for(const side of [-1,1]){this.B(side*.75,.92,0,.12,.55,1.15,'#c5ae84');this.p('torus',side*.96,.51,0,.48,.48,.37,'#a48b61',Math.PI/2,0,0,8);for(let k=0;k<6;k++){const a=k/6*TAU;this.line([side*.98,.51,0],[side*.98,.51+Math.sin(a)*.4,Math.cos(a)*.4],.025,'#c6ae80');}this.B(side*.58,.6,1.2,.08,.09,1.7,'#b49b70');}for(let i=0;i<4;i++)this.S(-.45+(i%2)*.59,.9+Math.floor(i/2)*.1,-.19+Math.floor(i/2)*.45,.30,.37,.30,'#d8c8a2');});}
 showcase(){
  this.target=this.r.static;this.root=rModel();this.r.groundFX.clear();this.r.labels=[];
  this.p('plane',0,-.1,0,110,1,100,'#d4d5b8',0,0,0,12);
  this.C(0,-.2,0,3.1,.52,2.2,'#c8b793',0,0,0,9);this.C(0,.06,0,2.98,.12,2.09,'#e8dcc0',0,0,0,9);
  this.p('disk',0,.15,0,1.56,1,1.37,'#c1c8a7',0,0,0,0);
  for(let j=0;j<3;j++)this.p('ring:6.283185307179586',0,.16,0,1.5-j*.095,1,1.31-j*.082,'#aebc99',0,0,0,0);
  for(let i=0;i<8;i++){const a=i*TAU/8;this.flower(Math.sin(a)*3.4,Math.cos(a)*2.4,'#fbf1d6',.6);}
  this.cottage(-7,-8,.9,0,.10);this.chapel(6,-13);this.tree(-4.7,-3.0,1.2,'#aaba98',421);this.tree(4.8,-3.5,1.3,'#afc0a0',55);
  this.pot(-2.6,.25,.82);this.pot(2.4,.65,.67);
  this.B(-2.9,.41,-1.6,1.2,.14,.56,'#c1ac81');for(const side of [-1,1])this.B(-2.9+side*.45,.23,-1.6,.12,.44,.42,'#b39f78');
 }
 village(map){
  this.target=this.r.static;this.root=rModel();const rng=random(map.seed);this.r.groundFX.clear();this.r.labels=[];
  this.p('plane',0,-1.5,0,220,1,220,'#bad0c5',0,0,0,1);
  this.C(0,-1.6,-7,43,3.3,43,'#c3b492',0,0,0,9);this.C(0,-.28,-7,42.6,.50,42.6,'#e9d9b8',0,0,0,9);this.C(0,.02,-7,42.1,.12,42.1,'#d4d7b7',0,0,0,12);
  // Curved gravel links, with individual rounded stepping stones on the main path.
  const path=(x,z,xx,zz,w)=>{const len=Math.hypot(xx-x,zz-z),angle=Math.atan2(xx-x,zz-z);this.B((x+xx)/2,.13,(z+zz)/2,w,.10,len+.8,'#e8d9b7',angle,0,0,9);for(let i=0;i<len/.68;i++){const u=i/(len/.68);this.B(x+(xx-x)*u+(rng()-.5)*w*.58,.205,z+(zz-z)*u+(rng()-.5)*.2,.45+rng()*.35,.10,.34+rng()*.25,'#efdfbe',rng()*2,0,0,9);}};
  path(0,-43,0,26,3.8);path(-30,-19,31,-19,2.5);path(-29,7,30,7,2.4);path(-17,-22,-17,18,2.3);path(17,-22,17,18,2.3);
  for(const s of map.schools){path(0,s.z+3.6,s.x,s.z+3.6,2.7);this.p('disk',s.x,.14,s.z+1,4.4,1,4.1,'#e7d6b5',0,0,0,9);if(s.id==='church')this.chapel(s.x,s.z-2);else if(s.id==='forge')this.forge(s.x,s.z-2);else if(s.id==='sword')this.dojo(s.x,s.z-2);else if(s.id==='armory')this.armory(s.x,s.z-2);else if(s.id==='magic')this.library(s.x,s.z-2);else if(s.id==='dance')this.garden(s.x,s.z);else this.cottage(s.x,s.z-2,1.06,s.id==='magic'?1:0,0);this.r.labels.push({x:s.x,z:s.z,y:s.id==='church'?6:4.7,text:s.short,id:s.id});}
  for(const h of map.houses)this.cottage(h.x,h.z,.69*h.scale,h.id%4,h.rotation);
  for(let i=0;i<50;i++){let a=i/50*TAU,x=Math.sin(a)*38,z=Math.cos(a)*38-7;if(z>22&&Math.abs(x)<9)continue;this.S(x,-.68,z,1.7+rng(),1.5,1.4+rng(),'#c4bba0',a,0,0,9);if(i%3===0)this.tree(x*.9,z*.96,.85+rng()*.15,'#aab995',i+13);}
  for(let i=0;i<48;i++){const x=(rng()-.5)*72,z=(rng()-.5)*64-6;if(Math.abs(x)<5||Math.abs(z-7)<3||Math.abs(z+19)<3||map.schools.some(s=>Math.hypot(x-s.x,z-s.z)<7)||map.houses.some(h=>Math.hypot(x-h.x,z-h.z)<4))continue;this.tree(x,z,.60+rng()*.4,'#b2c0a0',i+61);}
  // Sparse grouped flowers, not a uniform noisy carpet.
  for(let i=0;i<180;i++){const x=(rng()-.5)*71,z=(rng()-.5)*62-4;if(Math.abs(x)<3||Math.abs(z-7)<2||Math.abs(z+19)<2||map.houses.some(h=>Math.abs(x-h.x)<2.1&&Math.abs(z-h.z)<2.2)||map.schools.some(s=>Math.hypot(x-s.x,z-s.z)<4.9))continue;for(let k=0;k<3;k++)this.flower(x+rng()*.7,z+rng()*.7,k?'#f7edce':'#dcc4a3',.45+rng()*.3);this.tuft(x+.5,.08,z,1.1);}
  // Small gardens, loose stonework and workshop clutter give each frontage a role.
  for(const s of map.schools){if(s.id==='dance')continue;for(const side of [-1,1]){this.herbBed(s.x+side*3.75,s.z+1,1.55);for(let i=0;i<5;i++)this.flower(s.x+side*(3.15+i*.26),s.z+3.9+Math.sin(i)*.33,i%2?'#f8eacc':'#d6c5b6',.66);}this.stoneWall(s.x+3.8,s.z-3.9,3.2);}
  const forge=map.schools.find(s=>s.id==='forge');this.cart(forge.x-3.1,forge.z+3.3);this.barrel(forge.x+3.2,forge.z+1.9,.9);this.barrel(forge.x+3.8,forge.z+2.4,.66);
  // The outside hearth is readable from the playing camera, not hidden below a roof.
  this.with(rModel(forge.x+2.9,0,forge.z+.7),()=>{this.B(0,.18,0,1.75,.30,1.60,'#c6b294',0,0,0,9);this.B(0,.61,-.5,1.6,.86,.35,'#c1aa88',0,0,0,9);for(const side of [-1,1])this.B(side*.65,.46,0,.28,.60,1.3,'#cbb99b',0,0,0,9);this.B(0,.35,.12,1.1,.12,1,'#b37645',0,0,0,4);for(let i=0;i<5;i++)this.p('leaf',(i-2)*.19,.62,.06,.13,.34+(i%2)*.16,.12,i%2?'#f4d38e':'#e9b575',0,0,0,4);});
  for(const h of map.houses.filter(h=>h.id%4===0)){this.barrel(h.x+2.1,h.z+1.0,.65);this.herbBed(h.x,h.z+2.3,1.55);}
  for(let i=0;i<28;i++){const x=(rng()-.5)*23,z=(rng()-.5)*34;if(Math.abs(x)<3||map.schools.some(s=>Math.hypot(x-s.x,z-s.z)<5)||Math.abs(z-7)<2)continue;for(let j=0;j<4;j++)this.S(x+Math.sin(j*2.3)*.38,.26,z+Math.cos(j*2.3)*.35,.50,.34,.42,j%2?'#becaa7':'#afbfa0',j,0,0,0);}
  for(let x=-32;x<32;x+=4){if(Math.abs(x)<6)continue;this.fence(x,-28,3.7);}
  // Gate has two different sentry caps, cloth banners and masonry piers.
  for(const side of [-1,1]){this.B(side*4.1,1.3,-28,1.35,2.5,1.4,'#d0c4a5',0,0,0,9);this.with(rModel(side*4.1,0,-28),()=>this.roof(2,2,2.7,.75,'#9da894'));this.B(side*4.1,2,-27.19,.66,1.12,.07,'#8fa59a',0,0,0,0);this.p('leaf',side*4.1,2.05,-27.13,.15,.32,.03,'#efe2bc');}
  for(let i=0;i<6;i++){this.B(0,.20,25+i*.76,4,.15,.62,'#c5ad82');if(i%2===0)for(const side of [-1,1])this.C(side*2.0,.32,25+i*.76,.10,1.05,.1,'#b09b71');}
  for(const [x,z] of [[-3,-6],[3,17],[-6,7],[7,-18],[-15,7],[17,-5]]){this.C(x,1.5,z,.08,3,.08,'#a38e67');this.lantern(x,2.5,z);}
 }
 front(seed,stage){this.target=this.r.static;this.root=rModel();this.r.groundFX.clear();this.r.labels=[];const rng=random(seed+stage*11),base=-stage*44;
  this.p('plane',0,-.10,base-15,150,1,160,stage>=3?'#c1b8a5':'#c5c6a4',0,0,0,12);this.B(0,.06,base-17,12,.1,66,'#ddccaa',0,0,0,9);
  for(let i=0;i<40;i++){const side=i%2?1:-1,x=side*(10+rng()*13),z=base+12-rng()*62;this.S(x,.4,z,1.2+rng()*1.5,.8+rng(),1.4,'#bfc2a6',rng()*5,0,0,9);if(i%3===0)this.tree(x,z,.75+rng()*.5,stage>=3?'#aba083':'#a7b287',i*31+seed);}
  for(let i=0;i<12;i++){const x=i%2?8:-8,z=base-i*3.4;this.B(x,1,z,.8,2,.9,'#cbb99b',0,0,0,9);if(i%3===0){this.B(x,2.3,z,.14,2.7,.13,'#a08867');this.B(x+.45,3,z,.9,1.35,.065,stage>=3?'#b57e6a':'#889e97',0,0,0,0);}}
  for(let i=0;i<125;i++){const x=(rng()-.5)*25,z=base-rng()*40;if(Math.abs(x)>3)this.flower(x,z,i%4?'#f2e4c6':'#b1bfae',.4+rng()*.4);}
 }
 doll(p,t,local=false){
  if(p.kind&&!['player','guard','parent','portrait'].includes(p.kind)){this.monster(p,t);return;}
  if(p.kind==='guard')p={...p,age:28,weapon:0,armor:2,shield:true,race:0,hair:2,appearanceSeed:14};
  const r=this.r,oldTarget=this.target;this.target=r.dynamic;this.root=rModel();
  if(p.kind==='player'&&p.prologue){const lower=clamp((t-(p.releaseAt-1.45))/1.45,0,1),ease=lower*lower*(3-2*lower);this.doll({...p,id:p.id+'parent',kind:'parent',prologue:false,age:34,gender:1,weapon:-1,skin:0,action:'carry',wounds:{},baseY:-.34*ease},t,false);this.doll({...p,kind:'portrait',prologue:false,age:1,scaleOverride:.34+ease*.30,baseY:1.20*(1-ease)+.18*ease,x:p.x+Math.sin(p.dir)*(.32+ease*.24),z:p.z+Math.cos(p.dir)*(.32+ease*.24),dir:p.dir+.2,action:'idle',weapon:-1},t,false);this.target=oldTarget;return;}
  const race=(p.race||0)%4,stage=appearanceStage(p),seed=p.appearanceSeed||4,age=p.age??25,child=age<10;
  let scale=p.scaleOverride??(age<4?.46:age<10?.64+(age-4)*.022:age<18?.78+(age-10)*.027:age>72?.96:1);
  const width=race===2?1.23:race===1?.88:1;scale*=race===2?.86:race===1?1.07:race===3?.95:1;
  const run=p.action==='run'||p.action==='guardWalk',walk=this.gait?this.gait(p,t):Math.sin(t*8.2),reaction=hitPose(p,t),pose=artPose(p,t),ail=ailmentPose(p,t),fall=!p.alive?clamp((t-(p.deathAt??t))/1.12,0,1):0;
  // Keep the established floor anchors through recovery/idle. Returning to the
  // old short-leg rest matrices here would pop both soles above the ground.
  const groundedMotion=p.alive!==false&&!run&&!p.seated&&!p.activity&&(pose.skillMotion||this.skillFeet?.has(p.id));
  if(p.kind==='guard'){const q=p.telegraph;if(q){const u=clamp((t-q.started)/Math.max(.01,q.at-q.started),0,1);pose.active=true;pose.rightArm=u<.65?-.55-u/.65*1.85:-2.4+((u-.65)/.35)**2*(3-2*(u-.65)/.35)*1.45;pose.leftArm=-1.0;pose.rightLeg=-.14;pose.leftLeg=.1;}else if(p.action==='attack'&&p.actionUntil>t){const u=clamp((t-p.actionStarted)/Math.max(.01,p.actionUntil-p.actionStarted),0,1);pose.active=true;pose.rightArm=-.95+u*1.2;pose.leftArm=-1.0;}}
  const dying=fall*fall*(3-2*fall),baseY=(p.baseY||.18)+(pose.skillMotion?0:run?Math.abs(walk)*.055:Math.sin(t*1.8+seed)*.015)+pose.y+ail.y-reaction.drop;
  const facing=(p.dir||0)+pose.yaw,guard=p.kind==='guard'||p.guard||p.guardUntil>t;
  this.root=rModel(p.x+reaction.x+scale*(Math.cos(p.dir||0)*(pose.weightX||0)+Math.sin(p.dir||0)*(pose.weightZ||0)),baseY,p.z+reaction.z+scale*(-Math.sin(p.dir||0)*(pose.weightX||0)+Math.cos(p.dir||0)*(pose.weightZ||0)),scale*width,scale,scale,facing,pose.roll+reaction.roll+ail.roll,dying*1.48+pose.pitch+reaction.pitch+ail.pitch+(age>65?.055:0));
  const palette=[['#e5d5b4','#8f9f80'],['#d9debf','#849b85'],['#e3cdb0','#b39771'],['#e9ceb1','#bd9473']][race];
  const cloth=p.kind==='guard'?'#8ca2a1':p.kind==='parent'?'#b6b49b':p.armor===2?'#9ca9a4':p.armor===1?'#b09e7d':palette[0],pants=p.kind==='guard'?'#6f8583':palette[1],skin=p.kind==='guard'?'#e2be9f':RACES[race].tone;
  const hairPalette=['#80674e','#a48660','#68584c','#b09772','#8b7053','#685e56'],gray=age>65?'#ddd9c6':age>48&&seed%3!==0?'#b1ac98':null,hair=gray||hairPalette[(p.hair||0)%6];
  const loss=k=>p.wounds?.[k]?.severity==='lost';
  if(groundedMotion&&this.skillGround)this.skillGround(p,pose,t,scale);
  const bodyRoot=this.root;
  const upperRoot=rMultiply(bodyRoot,rMultiply(rModel(0,1.27,0,1,1,1,pose.torsoYaw||0,0,pose.skillMotion?pose.torso:0),rModel(0,-1.27,0)));
  this.root=upperRoot;
  // Coat volume, folded hem, a visible collar, seams, belt and pouch.
  this.p('coat',0,1.48,0,1.05,.97,1.02,cloth,0,0,pose.skillMotion?0:pose.torso,0);this.S(0,1.17,0,.43,.18,.29,cloth);
  this.B(0,1.27,.012,.81,.075,.54,'#aa9069',0,0,0,8);this.B(.13,1.27,.292,.13,.12,.035,'#dcc596',0,0,0,10);this.B(.13,1.27,.316,.078,.069,.012,'#967d59');
  this.S(0,1.9,0,.27,.12,.25,'#eee2c7');this.p('softbox',-.07,1.80,.28,.28,.35,.07,'#eee2c7',0,.28,.06,0);
  for(let i=0;i<3;i++)this.S(.055,1.68-i*.12,.261,.023,.023,.019,'#c6ad77',0,0,0,10);
  this.B(.37,1.17,.09,.26,.29,.24,'#b69a70',0,0,.10,8);this.B(.38,1.26,.18,.25,.14,.09,'#c7ac80',0,0,.10,8);
  if(p.armor>0){this.B(0,1.56,.22,.66,.59,.12,p.armor===2?'#bcc4b7':'#9b8868',0,0,0,p.armor===2?10:8);for(const side of [-1,1]){this.B(side*.23,1.52,.3,.06,.54,.07,'#d9c5a0',0,side*.14,0,8);this.S(side*.33,1.45,.285,.029,.029,.025,'#eee0b9',0,0,0,10);}}
  this.root=bodyRoot;
  // Two-piece articulated legs, with rounded soft boots.
  for(const side of [-1,1]){const key=side===1?'rightLeg':'leftLeg';if(loss(key))continue;if(groundedMotion&&this.skillLeg){this.skillLeg(p,pose,t,side,scale,pants);continue;}let rx=(run?walk*side*.55:0)+(pose.active?pose[key]:0)+reaction[key],knee=(pose.active?pose[side===1?'rightKnee':'leftKnee']:run?Math.max(0,-walk*side)*.55:0)+reaction[side===1?'rightKnee':'leftKnee']+ail.knee;
   this.with(rModel(side*.21,1.08,0,1,1,1,0,0,rx),()=>{this.S(0,-.23,0,.16,.29,.17,pants);this.with(rModel(0,-.45,0,1,1,1,0,0,knee),()=>{this.S(0,-.13,0,.14,.25,.14,pants);this.B(0,-.28,.075,.29,.29,.44,'#9b886b',0,0,0,8);this.B(0,-.14,.025,.3,.12,.30,'#c1aa82',0,0,0,0);this.B(0,-.43,.07,.31,.045,.45,'#7f755b');});});
  }
  this.root=upperRoot;
  // Arms use elbow pivots, not a single rigid rod. Equipment follows the hand.
  for(const side of [-1,1]){const key=side===1?'rightArm':'leftArm';if(loss(key))continue;let rx=(run?-walk*side*.38:0)+(pose.active?pose[key]:0)+reaction[key]+ail.arm,rz=(pose.active?pose[key+'Z']:side*-.08);
   if(p.action==='carry'){rx=-1.12;rz=-side*.26;}if(p.action==='wave'&&side===1){rx=-2.3;rz=.15+Math.sin(t*5)*.18;}if(guard&&side===-1)rx=-1.08;
   const arm=rMultiply(this.root,rModel(side*.45,1.78,0,1,1,1,0,rz,rx));
   const root=this.root;this.root=arm;this.S(0,-.13,0,.20,.25,.20,cloth);if(p.armor===2)this.S(side*.02,.02,0,.24,.16,.24,'#b7c0b0',0,0,0,10);
   const elbow=rMultiply(arm,rModel(0,-.28,0,1,1,1,0,0,pose[side===1?'rightElbow':'leftElbow']??0));this.root=elbow;
   this.S(0,-.07,.01,.125,.22,.14,cloth);this.B(0,-.18,.015,.25,.10,.26,'#d9c7a4',0,0,0,0);
   const hand=rMultiply(elbow,rModel(0,-.27,.07,1,1,1,0,0,pose[side===1?'rightWrist':'leftWrist']??-.12));this.root=hand;this.S(0,0,0,.12,.14,.125,skin);
   if(side===1&&p.weapon>=0&&age>=7)this.with(rModel(0,-.035,.03,1,1,1,0,-.06,Math.PI-.12),()=>this.weapon(p.weapon,.84));
   if(side===-1&&(p.shield||p.kind==='guard')&&age>=7)this.shield(-.08,.09,.19,.94);
   this.root=root;
  }
  // Head is a smooth sculpted mesh. Facial features are actual geometry at close range.
  this.with(rModel(0,2.30,0,1,1,1,0,0,pose.head+reaction.head+ail.head),()=>{
   this.p('head',0,0,0,.51,.53,.5,skin,0,0,0,0);this.S(0,-.09,.424,.062,.064,.061,skin);
   for(const side of [-1,1]){if(race!==3)this.p(race===1?'leaf':'sphere',side*.48,-.01,0,race===1?.21:.085,race===1?.34:.135,.079,skin,0,-side*(race===1?1.06:.2),0,0);
    const blink=hasStatus(p,'sleep',t)||p.action==='sleep'||Math.sin(t*.9+seed)>.996,eyeH=blink?.019:.118*(seed%7===0?.81:1),eyeX=side*(seed%5===1?.218:.19),brow=hasStatus(p,'stun',t)||reaction.amount>.2?.14:0;
    if(!this.low){this.S(eyeX,.026,.420,.084,eyeH*.82,.036,'#efdfc8');}
    this.S(eyeX,.012,.472,.062,eyeH*.85,.031,hasStatus(p,'blind',t)?'#4e544f':'#64513d',0,0,0,10);
    if(!blink){this.S(eyeX,.012,.493,.040,eyeH*.70,.015,'#34372f',0,0,0,10);this.S(eyeX-.023,.055,.508,.017,.022,.013,'#fff8e4',0,0,0,4);this.S(eyeX+.027,-.026,.507,.007,.007,.009,'#cfcb9f',0,0,0,4);}
    this.B(eyeX,.206-brow*.3,.395,.15,.029,.031,hair,0,-side*.13-side*brow,0,0);
    if(!this.low)this.S(side*.29,-.155,.385,.095,.051,.013,'#dbb097');
   }
   // Three tiny mouth volumes preserve a gentle smile in profile too.
   for(let i=-2;i<=2;i++)this.S(i*.020,-.248+i*i*.003,.365,.016,.009,.012,'#9e7d60');
   const curly=(p.hair||0)%3===1,bald=age>=30&&seed%7===0,beard=(race===2||age>39&&p.gender===0&&seed%3===0)&&age>=18;
   if(!bald)this.p('cap',0,.052,-.046,.534,.536,.49,hair,0,0,0,0);
   const locks=this.low?8:curly?26:18;
   for(let i=0;i<locks;i++){const a=i/locks*TAU,front=Math.cos(a)>.35;if(bald&&front)continue;
    const yy=front?.33:.20,xx=Math.sin(a)*.41,zz=Math.cos(a)*.36-.01;
    if(curly)this.S(xx,yy+(i%3)*.055,zz,.165,.18,.145,i%4===0?'#ad9470':hair,a,.15*Math.sin(a),.2);
    else this.p('hair',xx,yy,zz,.135,front?.43:.52,.115,hair,a,Math.sin(a)*-.25,front?-.22:.3,0);
   }
   if(!bald&&!curly){for(let i=0;i<5;i++)this.p('hair',-.30+i*.135,.23,.383,.13,.36+(i%2)*.12,.07,hair,0,-.24+(i-2)*.1,-.07,0);}
   if(p.gender===1&&age>=4&&!bald){if(seed%3===0){for(const side of [-1,1]){this.S(side*.43,-.18,-.19,.20,.21,.20,hair);this.p('hair',side*.43,-.39,-.19,.15,.53,.14,hair,side*.2,-side*.14,.15,0);this.B(side*.44,-.28,-.07,.19,.045,.04,'#9fb69d');}}else if(seed%3===1){this.S(0,.13,-.49,.23,.24,.21,hair);for(let j=0;j<4;j++)this.p('hair',(j-1.5)*.08,-.03,-.45,.13,.48,.12,hair,0,(j-1.5)*.10,.1,0);}}
   if(age>48){for(const side of [-1,1])this.p('hair',side*.43,.002,-.02,.09,.31,.095,gray||'#b8b49e',side,0,0,0);}
   if(beard)for(let i=0;i<(this.low?5:11);i++){const a=(i/10-.5)*2.2;this.p('hair',Math.sin(a)*.30,-.31+(Math.abs(a)*.06),.16+Math.cos(a)*.19,.11,race===2?.53:.22,.10,hair,0,-a*.35,.1,0);}
   if(race===3){for(const side of [-1,1]){this.p('cone',side*.35,.61,-.08,.19,.57,.17,'#bd936c',0,-side*.16,0,0);this.p('leaf',side*.35,.58,.046,.115,.22,.045,'#eedbb5',0,-side*.16,0,0);}}
  });
  if(race===3){for(let i=0;i<5;i++){const u=i/4;this.S(Math.sin(u*2.2)*.22,1.08-u*.6,-.23-u*.53,.23+u*.06,.25,.32,i>=3?'#eee1bf':'#c39b6f',0,.2,-.5-u*.5);}}
  if(!this.low&&!child){for(let i=0;i<6;i++)this.B(-.31+i*.12,1.11,.253,.033,.012,.01,'#f0e3c7',0,0,0,0);}
  this.root=rModel();r.blob(p.x,p.z,.55*scale,.39*scale,.32,r.fxBatches);
  if(local&&p.alive)r.add('ring:6.283',p.x,.23,p.z,.58,1,.58,'#f5e3b2',0,0,0,4,.62,r.fxBatches);
  this.target=oldTarget;
 }
 monster(p,t){
  const oldTarget=this.target;this.target=this.r.dynamic;this.root=rModel();const step=Math.sin(t*6+(p.stance||0)),run=p.action==='run',react=hitPose(p,t),ail=ailmentPose(p,t),fall=!p.alive?clamp((t-(p.deathAt??t))/1.1,0,1):0;
  const kind=p.kind||'goblin',elite=p.elite||kind==='boss',sc=kind==='boss'?2.1:elite?1.45:1;
  this.root=rModel(p.x+react.x,.20+ail.y+(run?Math.abs(step)*.04:0)-react.drop,p.z+react.z,sc,sc,sc,p.dir||0,react.roll+ail.roll,fall*1.5+react.pitch+ail.pitch);
  let fur=elite?'#a7ac9b':kind==='goblin'?'#b3c394':kind==='guard'?'#aeb7a5':'#babfa0',top=2.3;
  if(kind==='dummy'){this.C(0,.9,0,.12,1.8,.12,'#bfa67c');this.S(0,1.6,0,.49,.60,.31,'#d7c9a2');this.S(0,2.2,0,.32,.35,.29,'#e5d4ad');this.B(0,1.6,.32,.035,.65,.022,'#a1916f');this.line([-.6,1.4,0],[.6,1.4,0],.08,'#ad9166');}
  else if(kind==='crawler'){
   this.S(0,.65,0,.57,.43,.68,'#b2b698');this.S(0,.95,-.16,.49,.35,.5,'#94a084');this.S(0,.69,.58,.40,.31,.34,'#c7c99f');
   for(const side of [-1,1])for(let i=0;i<3;i++){const x=side*(.8+(run?Math.sin(t*6+i)*.11:0)),z=(i-1)*.50;this.line([side*.36,.60,z],[x,.44,z+.11],.09,'#aaa98a',0);this.line([x,.44,z+.11],[side*1.03,.06,z+.25],.065,'#c5bc96',0);}
   for(let i=-1;i<=1;i++)this.S(i*.19,.79,.85,.07,.095,.038,'#645543',0,0,0,10);top=1.1;
  }else if(kind==='maw'||kind==='stag'){
   this.S(0,.89,-.15,.56,.56,.93,fur);this.S(0,1.34,.69,.45,.49,.43,'#c5c4a6');this.S(0,1.13,1.04,.26,.21,.20,'#a4a487');
   for(const side of [-1,1]){for(const zz of [-.62,.52])this.S(side*.37,.43,zz,.16,.48,.16,'#a9ad92');this.S(side*.18,1.47,1.02,.063,.084,.035,'#574f3d',0,0,0,10);
    if(kind==='stag'){this.line([side*.25,1.67,.61],[side*.4,2.65,.57],.072,'#d1c8a3');this.line([side*.35,2.15,.59],[side*.75,2.44,.63],.055,'#d1c8a3');}else this.p('horn',side*.28,1.16,1.1,.08,.49,.08,'#e8deba',0,side*.34,Math.PI*.74,0);}
  }else if(kind==='mushroom'){
   this.S(0,.63,0,.36,.61,.36,'#e4d8b3');this.p('cap',0,1.20,0,.89,.6,.80,'#bc9a81');for(let i=0;i<7;i++){const a=i*2.4;this.S(Math.sin(a)*.48,1.50+(i%3)*.08,Math.cos(a)*.48,.13,.058,.12,'#eadbb8');}for(const side of [-1,1])this.S(side*.12,.77,.33,.05,.07,.027,'#7a6850');top=1.9;
  }else if(kind==='wraith'){
   this.p('cone',0,1.13,0,.66,1.9,.59,'#b6b6b8');this.S(0,1.9,0,.49,.52,.42,'#b6b6ba');this.p('arch',0,1.86,.35,.68,.79,.17,'#626b74');for(const side of [-1,1]){this.S(side*.14,1.89,.46,.09,.12,.023,'#c4d8d1',0,0,0,4);this.p('hair',side*.60,1.05,0,.17,.89,.14,'#c3c1bc',0,side*.4,0,0);}this.B(0,1.18,.44,.50,.06,.04,'#e6d7b0');
  }else{
   this.S(0,1.26,0,.56,.63,.37,fur);this.B(0,1.29,.18,.81,.81,.43,elite?'#b08772':'#a5a884',0,0,0,0);this.B(0,1.10,.35,1.01,.13,.13,'#c2ac82');
   this.S(0,2.06,.01,.63,.58,.51,fur);this.S(0,1.83,.48,.34,.22,.23,'#c3be9b');this.S(0,1.88,.69,.18,.10,.035,'#766c52');
   for(const side of [-1,1]){
    this.p('leaf',side*.61,2.15,0,.22,.43,.12,fur,0,-side*.95,0,0);
    this.S(side*.23,2.13,.471,.135,.14,.031,'#e5d4a7');this.S(side*.23,2.12,.503,.062,.10,.022,'#5a5442',0,0,0,10);this.S(side*.215,2.15,.526,.022,.027,.01,'#fff1c9',0,0,0,4);
    this.B(side*.23,2.31,.41,.27,.07,.058,'#788172',0,side*.17,0,0);
    const k=side===1?'rightLeg':'leftLeg';if(p.wounds?.[k]?.severity!=='lost')this.with(rModel(side*.28,.89,0,1,1,1,0,0,(run?step*side*.42:0)+react[k]),()=>{this.S(0,-.26,0,.22,.35,.22,fur);this.B(0,-.52,.13,.43,.30,.55,'#a69f80',0,0,0,0);});
    const arm=side===1?'rightArm':'leftArm';if(p.wounds?.[arm]?.severity==='lost')continue;
    const attack=p.action==='attack'?clamp((t-p.actionStarted)/Math.max(.01,p.actionUntil-p.actionStarted),0,1):0,wind=p.telegraph?clamp((t-p.telegraph.started)/(p.telegraph.at-p.telegraph.started),0,1):0;
    this.with(rModel(side*.64,1.60,0,1,1,1,0,side*-.18,p.telegraph?(wind<.65?-.55-wind/.65*1.85:-2.4+((wind-.65)/.35)**2*(3-2*(wind-.65)/.35)*1.45):p.action==='attack'?-.95+attack*1.2:react[arm]+ail.arm),()=>{this.S(0,-.24,0,.22,.36,.23,fur);this.S(0,-.57,.07,.23,.24,.23,fur);if(side===1)this.with(rModel(0,-.6,0,1,1,1,0,0,Math.PI),()=>{this.C(0,.16,0,.08,1.05,.08,'#a18c68');this.B(0,.76,0,.50,.43,.50,elite?'#a0a796':'#b6a684',0,0,0,elite?10:8);});else if(p.kind==='soldier'||elite)this.shield(-.06,-.3,.22,1.05);});
   }
   if(elite){
    // Felt skull helm, cheek guards, curled horns and stitched red mantle.
    this.p('cap',0,2.24,-.04,.68,.47,.56,'#d4ccb0',0,0,0,9);
    for(const side of [-1,1]){this.p('horn',side*.49,2.86,-.10,.16,.86,.17,'#c1b89a',0,side*.31,0,9);this.B(side*.49,2.07,.18,.20,.52,.35,'#d1c6a6',0,side*.15,0,9);this.S(side*.52,1.63,-.01,.29,.19,.32,'#bea487',0,0,0,9);}
    this.B(0,1.39,-.37,.95,1.08,.15,'#b48575',0,0,.08,0);for(let i=0;i<7;i++)this.B(-.38+i*.12,1.83,-.48,.04,.02,.03,'#dfc89f',0,0,0,0);
   }
  }
  this.root=rModel();this.r.blob(p.x,p.z,.72*sc,.56*sc,.31,this.r.fxBatches);this.target=oldTarget;
 }
 parentScene(p,t){
  if(!p||p.prologue||t>p.introUntil+5||!p.alive)return;
  const age=t-(p.releaseAt||0),walk=age>5,u=clamp((age-5)/5,0,1),ix=p.introX??p.x,iz=p.introZ??p.z,hx=p.introHomeX??ix-2.8,hz=p.introHomeZ??iz;
  const x=ix+(hx-ix)*u,z=iz+(hz-iz)*u,dir=walk?Math.atan2(hx-ix,hz-iz):(p.introDir??p.dir??0);
  this.doll({...p,id:p.id+'parent',kind:'parent',prologue:false,age:34,gender:1,weapon:-1,armor:0,shield:false,x,z,dir,baseY:-.34*(1-clamp(age,0,1)),action:age<.8?'carry':walk?'run':'wave',seated:false,hitReactUntil:0,wounds:{},statuses:{},pendingSkill:null},t,false);
 }

 statuses(p,t){if(!p.alive)return;const old=this.target;this.target=this.r.fxBatches;this.root=rModel();const top=p.elite?3.5:p.kind==='crawler'?1.5:2.7;
  for(const [id,state] of Object.entries(p.statuses||{})){if(state.until<=t)continue;
   if(id==='stun')for(let i=0;i<5;i++){const a=t*2+i/5*TAU;this.p('star',p.x+Math.sin(a)*.64,top+.16+Math.sin(a*2)*.08,p.z+Math.cos(a)*.36,.14,.14,.14,'#f7d571',-this.r.camera.yaw,0,0,4,1);}
   else if(id==='root')for(let i=0;i<5;i++)this.p('ring:5.800',p.x,.22+i*.15,p.z,.59-i*.035,1,.59-i*.035,'#92a36d',t*.25+i,.08,0,0,.92);
   else if(id==='burn')for(let i=0;i<13;i++){const k=(t*.76+i/13)%1,a=i*2.4;this.p('leaf',p.x+Math.sin(a)*(.46-k*.18),.18+k*2.6,p.z+Math.cos(a)*.38,.13*(1-k),.37*(1-k),.13*(1-k),i%2?'#f4c37b':'#dc9260',a,0,0,4,1-k*.5);}
   else if(id==='slow')for(let i=0;i<6;i++){const a=i/6*TAU+t*.17,q=.5+.5*Math.sin(t*2.8+i);this.p('cone',p.x+Math.sin(a)*.52,.21+q*.08,p.z+Math.cos(a)*.52,.13,.46+q*.14,.13,'#acd3d2',a,.15,0,4,.64+q*.25);}
   else if(id==='sleep')for(let i=0;i<5;i++){const k=(t*.24+i/5)%1;this.p('sphere',p.x+.24+Math.sin(t*.7+i)*.22,top-.1+k*.7,p.z,.09+k*.1,.09+k*.1,.08,'#ded5e5',0,0,0,4,.75*(1-k));}
   else if(id==='blind')for(let i=0;i<6;i++){const a=t*1.6+i/6*TAU;this.p('hair',p.x+Math.sin(a)*.32,top-.50,p.z+Math.cos(a)*.39,.16,.56,.09,'#6c697c',a,Math.PI/2,0,0,.75);}
   else{const col=id==='poison'?'#b1adcc':id==='bleed'?'#bc847d':'#bbadd0';for(let i=0;i<10;i++){const k=(t*.36+i/10)%1,a=i*2.4;this.p('sphere',p.x+Math.sin(a+t*.4)*(.36+k*.22),.2+k*2.8,p.z+Math.cos(a+t*.4)*(.34+k*.2),.075+k*.065,.12+k*.08,.075+k*.065,col,a,0,0,4,Math.sin(k*Math.PI)*.75);}}
  }
  if(p.seated)for(let i=0;i<5;i++){const k=(t*.31+i/5)%1,a=i/5*TAU;this.p('leaf',p.x+Math.sin(a)*.6,.22+k*.9,p.z+Math.cos(a)*.6,.06,.12,.045,'#caddae',a,t,0,4,Math.sin(k*Math.PI)*.8);}
  this.target=old;
 }
}
