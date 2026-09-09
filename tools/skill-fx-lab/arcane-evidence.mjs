// Real GLSL inputs and a synchronized twelve-form motion study. Not browser QA.
import fs from 'node:fs/promises';import vm from 'node:vm';import path from 'node:path';
const root=process.cwd(),ctx=vm.createContext({});vm.runInContext('const DIORAMA_FOCUS_GLSL=""',ctx);
for(const f of ['src/render/skill-silk.js','src/render/skill-arcane.js','src/render/skill-effects.js','tools/skill-fx-lab/renderer.js','src/render/shaders.js','src/legacy/render_math.js','src/render/combat-presentation.js','src/character/rig.js']){let s=await fs.readFile(f,'utf8');if(f.endsWith('/rig.js'))s=s.slice(0,s.indexOf('class RigRenderer'));vm.runInContext(s,ctx);}
const {FX,Arc,Stage,vertex,fragment,skin,ortho,look,multiply}=vm.runInContext('({FX:SkillEffects,Arc:SkillArcane,Stage:SkillFxStage,vertex:RVERT,fragment:RFRAG,skin:SKINVERT,ortho:rOrtho,look:rLookAt,multiply:rMultiply})',ctx);
const shaders=await fs.readFile('src/render/shaders.js','utf8'),common=shaders.slice(shaders.indexOf('float silkLattice('),shaders.indexOf('float shadowValue('));
vm.runInContext('const FX_ARCANE_GLSL='+JSON.stringify(common),ctx);vm.runInContext(await fs.readFile('tools/skill-fx-lab/webgl.js','utf8'),ctx);
const lab=vm.runInContext('({vertex:SkillFxGPU.vertex,fragment:SkillFxGPU.fragment})',ctx);
const out=path.join(root,'dist/arcane-review');await fs.mkdir(out,{recursive:true});const compare=process.env.FX_MIST_COMPARE==='1',presets=compare?['blade','lotus','pillar','eclipse','thread','stone'].flatMap(f=>[0,.85].map(mist=>({name:f+(mist?' / MIST':' / BEFORE'),recipe:FX.resolve({...FX.presets.find(p=>p.recipe.family===f).recipe,mist})}))):FX.presets.slice(6);
const {Presentation,geo,model,color}=vm.runInContext('({Presentation:CombatPresentation,geo:rGeometry,model:rModel,color:rColor})',ctx);
function capture(primitives){const result=[],r={quality:'high',eye,fxBatches:new Map(),arcaneFX:new Map(),add:(type,x,y,z,sx,sy,sz,ink,yaw,rz,rx,surface,alpha,target)=>{const g=geo(type);result.push({positions:[...g.positions],normals:[...g.normals],center:[x,y,z],model:model(x,y,z,sx,sy,sz,yaw,rz,rx),alpha,ink:typeof ink==='string'?color(ink).slice(0,3):ink,surface,additive:target===r.arcaneFX});}};new Presentation(r).composition(primitives,v=>v);return result;}

const eye=[3.8,3.7,5.8],vp=[...multiply(ortho(-3.3,3.3,-2.6,2.6,.1,30),look(eye,[0,1.1,0]))],frames=[];
for(const p of presets)for(const age of (compare?[.28,.40,.50]:[.04,.16,.34])){const fields=compare?FX.frame(p.recipe,age):Arc.impact(p.recipe,age,'high',.035),geometry=capture(fields);frames.push({path:p.recipe.family+(compare?'-'+p.recipe.mist:''),u:age,geometry});}
await fs.writeFile(path.join(out,'egl-input.json'),JSON.stringify({vertex,fragment,skin,lab,frames,eye,vp}));console.log(out);

const stream=await fs.open(path.join(out,'animation.jsonl'),'w');
for(let i=0;i<75;i++)for(const [index,p] of presets.entries()){
 const time=i/30,fields=compare?FX.frame(p.recipe,time):Arc.impact(p.recipe,time-.18,'high',.035);
 const geometry=capture(fields);
 await stream.write(JSON.stringify({frame:i,index,name:compare?p.name:p.recipe.family,geometry})+'\n');
}await stream.close();
