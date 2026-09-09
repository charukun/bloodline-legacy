// Native Canvas contact sheet/animation. Not a browser screenshot or device QA.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createCanvas} from '@napi-rs/canvas';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const context=vm.createContext({});for(const f of ['src/render/skill-silk.js','src/render/skill-effects.js','tools/skill-fx-lab/renderer.js'])vm.runInContext(await fs.readFile(path.join(root,f),'utf8'),context);
const {FX,Stage}=vm.runInContext('({FX:SkillEffects,Stage:SkillFxStage})',context),out=path.join(root,'dist/skill-fx-frames');await fs.mkdir(out,{recursive:true});
const canvas=createCanvas(960,660),ctx=canvas.getContext('2d');
for(let frame=0;frame<45;frame++){
 ctx.fillStyle='#10171b';ctx.fillRect(0,0,960,660);
 for(let i=0;i<6;i++){
  ctx.save();ctx.translate(i%3*320,Math.floor(i/3)*330);Stage.draw(ctx,318,290,FX.presets[i].recipe,frame/30,{label:`0${i+1} / ${['BLADE','RESONANCE','STONE','THREAD','EMBER','SHADOW'][i]}`,still:true});
  ctx.fillStyle='#d9c4a9';ctx.font='12px sans-serif';ctx.fillText(['THIN CUT / VANISH','WAVEFRONTS / RETURN','FRACTURE / FALL','TENSION / SNAP','GATHER / ERUPT','PULL IN / TEAR'][i],18,314);ctx.restore();
 }
 await fs.writeFile(path.join(out,String(frame).padStart(3,'0')+'.png'),canvas.toBuffer('image/png'));
}
console.log(out);
