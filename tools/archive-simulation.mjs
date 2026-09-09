import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {compileCatalog} from './skill-catalog.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function simulationSource(projectRoot=root){
  const definitions=compileCatalog(JSON.parse(await fs.readFile(path.join(projectRoot,'src/skills/catalog-source.json'),'utf8')));
  let code='// Generated immutable rules runtime. Regenerate with node tools/archive-simulation.mjs\nconst BL_SKILL_DEFINITIONS='+JSON.stringify(definitions)+';\n';
  for(const p of ['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js'])code+=await fs.readFile(path.join(projectRoot,'src',p),'utf8')+'\n';
  return code+'\nexport {Simulation};\n';
}
export async function liveBuild(projectRoot=root){
  const source=await simulationSource(projectRoot),rules=createHash('sha256').update(source).digest('hex');
  const registered=JSON.parse(await fs.readFile(path.join(projectRoot,'src/server/engines/registry.json'),'utf8'));
  if(!registered.includes(rules))throw Error('Archive the changed simulation before release: node tools/archive-simulation.mjs');
  for(const id of registered){
    if(!/^[a-f0-9]{64}$/.test(id))throw Error('Invalid rules archive');
    const bytes=await fs.readFile(path.join(projectRoot,'src/server/engines',id+'.mjs'));
    if(createHash('sha256').update(bytes).digest('hex')!==id)throw Error('Immutable rules archive was changed');
  }
  return {rules,supportedRules:registered};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const source=await simulationSource(),id=createHash('sha256').update(source).digest('hex'),dir=path.join(root,'src/server/engines');
  await fs.mkdir(dir,{recursive:true});
  let ids=[];try{ids=JSON.parse(await fs.readFile(path.join(dir,'registry.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!ids.includes(id)){await fs.writeFile(path.join(dir,id+'.mjs'),source,{flag:'wx'});ids.push(id);}
  await fs.writeFile(path.join(dir,'registry.json'),JSON.stringify(ids,null,2)+'\n');
  await fs.writeFile(path.join(dir,'registry.mjs'),ids.map((id,i)=>`import {Simulation as S${i}} from './${id}.mjs';`).join('\n')+`\nexport const engines={${ids.map((id,i)=>JSON.stringify(id)+':S'+i).join(',')}};\nexport const currentRules=${JSON.stringify(id)};\n`);
  console.log('Archived rules '+id);
}
