import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Small DOM sink: count allocations/writes without a GPU or a new dependency.
// Projection and the frame/HUD methods below are the actual production code.
function fixture(){
 const counts={created:0,writes:0,attached:0};
 const document={createElement(){counts.created++;return new Node();},getElementById(){return root;}};
 class Node {
  constructor(){this.ownerDocument=document;this.parentNode=null;this.children=[];this.text='';
   this.style=new Proxy({},{set:(target,key,value)=>{counts.writes++;target[key]=value;return true;}});}
  set textContent(value){counts.writes++;this.text=String(value);}
  get textContent(){return this.text;}
  set innerHTML(value){this.html=value;for(const node of this.children)node.parentNode=null;this.children=[];}
  appendChild(node){node.remove();node.parentNode=this;this.children.push(node);counts.attached++;}
  remove(){if(this.parentNode){const list=this.parentNode.children;list.splice(list.indexOf(this),1);this.parentNode=null;}}
 }
 const root=new Node();
 const context=vm.createContext({document,console,performance,requestAnimationFrame(){},innerWidth:960,innerHeight:720});
 for(const file of ['legacy/render_math.js','render/renderer-base.js','ui/presentation.js','legacy/ui.js','ui/building-labels.js','legacy/game.js'])
  vm.runInContext(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),context);
 const {BuildingLabels,Renderer,Game,UI}=vm.runInContext('({BuildingLabels,Renderer,Game,UI})',context);
 const renderer=Object.assign(Object.create(Renderer.prototype),{
  width:960,height:720,camera:{x:0,z:0,zoom:16,yaw:.42,pitch:.68},
  labels:[{id:'well',x:0,y:4.7,z:0,text:'広場'}]
 });
 renderer.matrix();
 const snapshot={player:{x:0,z:0},players:[],actors:[],room:{kind:'village'},t:0};
 const layer=new BuildingLabels(root);
 return{root,counts,layer,renderer,snapshot,Game,UI};
}
function position(node){
 const match=/^translate3d\(([^p]+)px,([^p]+)px,0\)/.exec(node.style.transform);
 assert.ok(match,'building label uses a fractional-pixel translation');
 return{x:Number(match[1]),y:Number(match[2])};
}
function assertAttached(f){
 for(const [label,entry]of f.layer.nodes){
  const expected=f.renderer.project(label.x,label.y,label.z),actual=position(entry.node);
  assert.ok(Math.abs(actual.x-expected.x)<1e-8);
  assert.ok(Math.abs(actual.y-expected.y)<1e-8);
  assert.equal(entry.node.parentNode,f.root);
 }
}

test('building names follow every rendered frame while the HUD stays throttled',()=>{
 for(const interval of [1000/60,1000/120,33.3]){
  const f=fixture();let renders=0,hudUpdates=0,ticks=0;
  const game=Object.assign(Object.create(f.Game.prototype),{
   renderer:f.renderer,snapshot:f.snapshot,screen:'game',lastFrame:0,lastUI:0,
   accumulator:0,sinceSave:0,seq:0,sim:{tick(){ticks++;}},
   audio:{setListener(){},updateFootsteps(){}},updateMove(){},saveWorld(){}
  });
  const ui=Object.assign(Object.create(f.UI.prototype),{g:game,floatLines:[],portraitQueue:[],worldNodes:new Map(),
   update(s){hudUpdates++;this.updateWorldLabels(s);},toast(){}});
  game.ui=ui;
  // A moving camera projects the same world anchor differently on every frame.
  f.renderer.render=()=>{renders++;f.renderer.camera.x+=.006;f.renderer.camera.z+=.003;f.renderer.matrix();};
  let firstNode;
  for(let i=0;i<180;i++){
   game.frame(100+i*interval);
   assert.equal(game.frameError,undefined);
   assert.ok(game.buildingLabels,'the Game frame updates the building layer');
   f.layer=game.buildingLabels;
   assert.equal(f.root.children.length,1,'no duplicate labels after a HUD rebuild');
   const node=f.root.children[0];firstNode??=node;assert.equal(node,firstNode);
   assertAttached(f);
  }
  assert.equal(renders,180);assert.ok(hudUpdates<renders/2);
  assert.equal(f.counts.created,1,'the HUD no longer reallocates the building name');
  assert.ok(ticks>0,'the existing fixed-step simulation still advances');
  game.screen='clan';game.clanScene={};game.frame(100+181*interval);
  assert.equal(f.root.children.length,0);assert.equal(game.buildingLabels.nodes.size,0);
 }
});

test('zoom, yaw, pitch, camera settling and viewport changes use the current matrix without easing lag',()=>{
 const f=fixture();
 for(const [width,height]of [[393,852],[1280,800],[780,1000]]){
  Object.assign(f.renderer,{width,height});
  for(const [zoom,yaw,pitch]of [[16,.42,.68],[12,-.3,.52],[20,.7,.8]]){
   Object.assign(f.renderer.camera,{zoom,yaw,pitch});
   for(let i=0;i<30;i++){
    f.renderer.camera.x+=(.75-f.renderer.camera.x)*.08;f.renderer.matrix();
    f.layer.update(f.snapshot,f.renderer);assert.equal(f.layer.nodes.size,1);assertAttached(f);
   }
  }
 }
 const node=f.root.children[0],pos=position(node);
 assert.notEqual(pos.x,Math.round(pos.x),'retain subpixel movement');
 const before={...f.counts};
 for(let i=0;i<1000;i++)f.layer.update(f.snapshot,f.renderer);
 assert.deepEqual(f.counts,before,'stationary labels produce no extra DOM writes or allocations');
});

test('distance/frustum exits and scene replacement remove only building nodes',()=>{
 const f=fixture(),speech=f.root.ownerDocument.createElement('span');f.root.appendChild(speech);
 f.layer.update(f.snapshot,f.renderer);assert.equal(f.layer.nodes.size,1);
 f.snapshot.player.x=14;f.layer.update(f.snapshot,f.renderer);assert.equal(f.layer.nodes.size,1);
 f.snapshot.player.x=14.01;f.layer.update(f.snapshot,f.renderer);assert.equal(f.layer.nodes.size,0);
 assert.deepEqual(f.root.children,[speech]);
 f.snapshot.player.x=0;f.layer.update(f.snapshot,f.renderer);
 f.renderer.camera.x=100;f.renderer.matrix();f.layer.update(f.snapshot,f.renderer);
 assert.equal(f.layer.nodes.size,0);
 f.renderer.camera.x=0;f.renderer.matrix();f.layer.update(f.snapshot,f.renderer);
 const old=f.root.children[1];
 f.renderer.labels=[{x:1,y:4,z:1,text:'新しい地区'}];f.layer.update(f.snapshot,f.renderer);
 assert.equal(old.parentNode,null);assert.equal(f.layer.nodes.size,1);
 f.renderer.labels=[];f.layer.update(f.snapshot,f.renderer);assert.deepEqual(f.root.children,[speech]);
 f.layer.clear();assert.deepEqual(f.root.children,[speech]);
});

test('identical names at different buildings remain distinct and text stays literal',()=>{
 const f=fixture();f.renderer.labels=[{x:0,y:4,z:0,text:'<井戸>'},{x:2,y:4,z:1,text:'<井戸>'}];
 Object.freeze(f.snapshot.player);Object.freeze(f.snapshot);
 f.layer.update(f.snapshot,f.renderer);assert.equal(f.layer.nodes.size,2);
 assert.notEqual(f.root.children[0],f.root.children[1]);assertAttached(f);
 const node=f.root.children[0];assert.equal(node.textContent,'<井戸>');
 f.renderer.labels[0].text='鍛冶屋';f.layer.update(f.snapshot,f.renderer);
 assert.equal(f.root.children[0],node);assert.equal(node.textContent,'鍛冶屋');
 f.layer.update(null,f.renderer);assert.equal(f.layer.nodes.size,0);
});
