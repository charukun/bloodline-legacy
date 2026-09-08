// Optional EGL review of the actual scene and before/after post shaders.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {loadScene,writeScene,repository} from './export_scene.mjs';
const [base,out]=process.argv.slice(2);
if(!base||!out)throw Error('Usage: node tests/diorama-offline.mjs BASE_COMMIT OUTPUT_DIR');
for(const weather of ['clear','rain']){
 const scene=await loadScene(repository,{width:720,height:900,x:1.8,z:16,zoom:16,weather});
 const kernels={};
 for(const revision of ['before','after']){
  const files=['src/legacy/render_math.js','src/render/tilt-shift.js','src/render/shaders.js'];
  const code=(await Promise.all(files.map(f=>revision==='before'?execFileSync('git',['show',`${base}:${f}`],{encoding:'utf8'}):fs.readFile(path.join(repository,f),'utf8')))).join('\n');
  const ctx=vm.createContext({console,renderer:scene.r,snapshot:scene.snapshot});
  vm.runInContext(code,ctx);
  kernels[revision]=vm.runInContext(`(()=>{
   const d=new TiltShiftPass(renderer);d.configure('tilt-shift','strong');d.update(snapshot,.1);
   return {vertex:RPOSTV,post:RPOSTF,blur:DIORAMA_BLUR_GLSL,
    coc:typeof DIORAMA_COC_GLSL==='undefined'?null:DIORAMA_COC_GLSL,
    focus:d.focusUniforms(),...DIORAMA_PRESETS.strong};
  })()`,ctx);
 }
 const dir=path.join(out,weather);await writeScene(scene,dir);
 await fs.writeFile(path.join(dir,'kernels.json'),JSON.stringify(kernels));
 console.log(`Exported ${weather}`);
}
