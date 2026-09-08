/* Reproducible Before/After exports, no browser automation. */
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadScene,writeScene,repository} from './export_scene.mjs';
const [baseline,out]=process.argv.slice(2);if(!baseline||!out)throw Error('Usage: node tests/capture_golden.mjs BASELINE_CHECKOUT EVIDENCE_DIR');
const views={
 'gameplay-clear':{x:1.8,z:16,zoom:16,weather:'clear'},
 'gameplay-rain':{x:1.8,z:16,zoom:16,weather:'rain'},
 'street-clear':{x:0,z:-1,zoom:16,weather:'clear'},
 'overview-clear':{x:0,z:6,zoom:23,width:1120,height:900,weather:'clear'},
 'portrait-rain':{x:1.8,z:16,zoom:16,width:780,height:1000,weather:'rain'},
};
for(const [label,root] of (process.argv.includes('--after-only')?[['after',repository]]:[['before',path.resolve(baseline)],['after',repository]])){
 for(const [view,options] of Object.entries(views)){
  const dir=path.resolve(out,`${label}-${view}`),scene=await loadScene(root,options);
  await writeScene(scene,dir);
  const result=spawnSync('python3',[path.join(repository,'tests/render_offline.py'),dir,path.join(root,'public/assets')],{encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr||result.stdout);
  console.log(result.stdout.trim());
 }
}
