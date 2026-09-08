const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname,'..');
const sourceFiles = ['legacy/dialogue.js','legacy/core.js','ui/presentation.js','ui/lineage.js','legacy/ui.js','legacy/game.js'];
const flush = () => new Promise(resolve=>queueMicrotask(resolve));
function fixture(t, uiSource) {
 const code=sourceFiles.map(n=>n==='legacy/ui.js'&&uiSource?uiSource:fs.readFileSync(path.join(root,'src',n),'utf8')).join('\n');
 const dom = new JSDOM('<canvas id="world" tabindex="0"></canvas><div id="clan-screen"></div><div id="hud"></div><div id="world-labels"></div><div id="modal-root"></div><div id="toasts"></div><div id="joystick"><i></i></div>', {url:'https://ui.test/',runScripts:'outside-only'});
 const w = dom.window;
 // DOM unit tests: no browser, GPU, layout or network is simulated or claimed.
 const drawing = new Proxy({}, {get:(_,k)=>()=>{}});
 w.HTMLCanvasElement.prototype.getContext=()=>drawing;
 w.eval(code+'\nwindow.testAPI={UI,Game,Simulation,UINoticeQueue,uiCondition,uiPickup,uiActiveStatuses,EQUIP_AGE,MAX_ITEMS};');
 const {UI,Game,Simulation}=w.testAPI, sim=new Simulation({seed:7349,mode:'normal'}),p=sim.addPlayer('ui-player',{owner:'ui-owner',name:'リオ'});
 Object.assign(p,{age:17,prologue:false,introUntil:-100,motherUntil:0,health:100,x:0,z:0,stamina:100});
 const g=Object.create(Game.prototype);
 Object.assign(g,{sim,playerId:p.id,profile:{owner:p.owner,name:p.name,clan:'暁風',inherit:[],sound:false,quality:'auto'},screen:'game',online:false,loadedMode:'normal',seq:sim.seq,mapCache:new Map(),keys:new Set(),input:{x:0,z:0},walkTarget:null,audio:{enable(){},disable(){}},renderer:{diorama:{mode:'normal',dof:'subtle',suspended:false,configure(mode,dof){if(mode)this.mode=mode;if(dof)this.dof=dof;}},canvas:w.document.getElementById('world'),labels:[],project:(x,y,z)=>({x:180+x*5,y:300-y*10,visible:true}),screenToWorld:(x,y)=>({x,z:y}),pointToWorld:(x,y)=>({x,z:y}),setQuality(){}},saveProfile(){},exportSave(){},importSave(){}});
 g.makeClanPreview();g.snapshot=g.decorate(sim.snapshot(p.id,sim.seq));g.ui=new UI(g);g.ui.showGame();g.ui.update(g.snapshot);
 t.after(()=>{w.clearTimeout(g.ui.noticeTimer);dom.window.close();});
 const sync=()=>{g.snapshot=g.decorate(sim.snapshot(p.id,sim.seq));g.ui.update(g.snapshot);};
 return {w,d:w.document,g,p,sim,ui:g.ui,api:w.testAPI,sync};
}

module.exports={fixture,flush};
