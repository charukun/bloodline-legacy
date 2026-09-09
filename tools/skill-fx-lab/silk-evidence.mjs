// Native Canvas before/after plus game-shader input for the offline EGL check.
// This is visual evidence, never a browser/device performance claim.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),ctx=vm.createContext({});
vm.runInContext('const DIORAMA_FOCUS_GLSL=""',ctx);
for(const file of ['src/render/skill-silk.js','src/render/skill-effects.js','tools/skill-fx-lab/renderer.js','src/render/shaders.js','src/character/rig.js','src/legacy/render_math.js']){
 let source=await fs.readFile(path.join(root,file),'utf8');if(file.endsWith('/rig.js'))source=source.slice(0,source.indexOf('class RigRenderer'));
 vm.runInContext(source,ctx);
}
const {FX,Silk,Stage,vertex,fragment,skin,ortho,look,multiply}=vm.runInContext('({FX:SkillEffects,Silk:SkillSilk,Stage:SkillFxStage,vertex:RVERT,fragment:RFRAG,skin:SKINVERT,ortho:rOrtho,look:rLookAt,multiply:rMultiply})',ctx);
const out=path.join(root,'dist/silk-review');await fs.mkdir(out,{recursive:true});
const canvas=createCanvas(1080,460),g=canvas.getContext('2d'),recipe=FX.presets[0].recipe;
for(let i=0;i<108;i++){
 const t=i/72;g.fillStyle='#111b20';g.fillRect(0,0,1080,460);
 Stage.draw(g,540,430,FX.resolve({...recipe,flutter:0,thickness:1}),t,{label:'A / STILL - THIN'});
 g.save();g.translate(540,0);Stage.draw(g,540,430,recipe,t,{label:'B / FLUTTER - FULL'});g.restore();
 g.fillStyle='#c8b698';g.font='12px sans-serif';g.fillText('0.5x PLAYBACK / ONLY THICKNESS AND FLUTTER DIFFER',22,450);
 await fs.writeFile(path.join(out,String(i).padStart(3,'0')+'.png'),canvas.toBuffer('image/png'));
}
const frames=[];
for(const path of Object.keys(FX.options.path))for(const u of [.3,.6,.85]){
 const r=FX.resolve({...recipe,path}),ribbons=Silk.stroke(r,u,'high');
 frames.push({path,u,geometry:ribbons.map(p=>{const geo=Silk.geometry(p);return {positions:[...geo.positions],normals:[...geo.normals],center:geo.center,alpha:p.alpha,ink:Silk.ink(p)};})});
}
const eye=[3.8,3.7,5.8],vp=[...multiply(ortho(-2.1,2.1,-1.5,1.5,.1,30),look(eye,[-.3,1.05,1.0]))];
await fs.writeFile(path.join(out,'egl-input.json'),JSON.stringify({vertex,fragment,skin,frames,eye,vp}));
console.log(out);
