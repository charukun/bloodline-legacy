// Download-only adult character fixture. Production source remains unchanged.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [commit,output]=process.argv.slice(2);
assert(/^[a-f0-9]{40}$/.test(commit||''),'Provide the verified source commit');
assert(output&&path.isAbsolute(output),'Provide an absolute output path');
execFileSync(process.execPath,['build.mjs'],{cwd:root,stdio:'inherit',env:{...process.env,BLOODLINE_BUILD_ENV:'local',BLOODLINE_BUILD_COMMIT:commit}});
let html=await fs.readFile(path.join(root,'dist/index.html'),'utf8');
const marker='AudioEngine=WorldAudio;new Game();';
assert.equal(html.split(marker).length,2,'Bootstrap changed: review fixture before packaging');
html=html.replace(marker,`AudioEngine=WorldAudio;const demo=new Game();
// Download-only reference review fixture. Authoritative input/combat/update remain active.
Object.assign(demo.profile,{online:false,mode:'normal',race:0,name:'エリン',quality:'medium',sound:false,uiExplained:true});
demo.sim=new Simulation({seed:7349,mode:'normal'});demo.loadedMode='normal';demo.mapCache.clear();
const hero=demo.sim.addPlayer('reference-playtest',{...demo.profile,inherit:[]});demo.sim.releaseFromParent(hero);
Object.assign(hero,{age:24,ageFraction:0,gender:0,race:0,hair:0,appearanceSeed:16,x:0,z:4,dir:.25,prologue:false,introUntil:-100,releaseAt:-100,motherText:'',motherUntil:-100,farewellStage:3});
demo.renderer.setQuality('medium');demo.renderer.diorama.configure('normal','subtle');await demo.start();`);
const prefixes=[...html.matchAll(/const STORAGE_PREFIX='[^']+';/g)];
assert.equal(prefixes.length,1,'Storage contract changed');
html=html.replace(prefixes[0][0],`const STORAGE_PREFIX='bloodline.reference.${commit.slice(0,8)}.';`);
html=html.replace('</head>',`<meta name="character-review" content="${commit}; reference reconstruction WIP; age24 male offline fixture"></head>`);
assert(!/<script\b[^>]*\bsrc=/i.test(html),'Unexpected external script');
for(const [,script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))execFileSync(process.execPath,['--check','--input-type=commonjs'],{input:script});
await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,html);
console.log(JSON.stringify({source:commit,bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex'),output}));
