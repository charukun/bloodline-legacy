import fs from 'node:fs/promises';import vm from 'node:vm';
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1],at=code.indexOf('// SOURCE MODULE: bootstrap.js');if(at<0)throw Error('Build first');
code=code.slice(0,at)+(await fs.readFile(new URL('skill-composition-lab.js',import.meta.url),'utf8'))+'\n})();';
// The trial has no BGM; keep the renderer/models, omit unused embedded recordings.
code=code.replace(/^const MUSIC_ASSETS=.*;$/m,'const MUSIC_ASSETS={};');new vm.Script(code);
const output=(await fs.readFile(new URL('skill-composition-lab.html',import.meta.url),'utf8')).replace('/*__SCRIPT__*/',()=>code.replace(/<\/script/gi,'<\\/script'));
await fs.writeFile(new URL('../dist/Bloodline_Legacy_Skill_Composition.html',import.meta.url),output);console.log('Composition lab: '+Buffer.byteLength(output)+' bytes');
