import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.argv[2]||'b8c3183a681c8eb01911c8123e16ee1e21153856';
if(!/^[0-9a-f]{40}$/.test(base))throw Error('Pass the full comparison base SHA');
const beforeSha=execFileSync('git',['rev-parse',base+'^{commit}'],{cwd:root,encoding:'utf8'}).trim();
const afterSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const html=await fs.readFile(path.join(root,'dist/index.html'),'utf8');
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const boot=code.indexOf('// SOURCE MODULE: bootstrap.js');if(boot<0)throw Error('Build is missing its entry point');
code=code.slice(0,boot)+(await fs.readFile(path.join(root,'tools/skill-motion-review-runtime.js'),'utf8'))+'\nawait MotionReview.start(__MOTION_REVIEW_SESSION__);\n})();';
const beforeAsset=execFileSync('git',['show',beforeSha+':public/assets/character/young-human-male-cm01.glb'],{cwd:root,maxBuffer:16*1024*1024}).toString('base64');
const before={};
for(const file of ['legacy/motion.js','legacy/art.js','character/rig.js','character/golden-master.runtime.js','render/combat-presentation.js'])before[file]=execFileSync('git',['show',beforeSha+':src/'+file],{cwd:root,encoding:'utf8'});
new vm.Script(code);let old=code;
for(const [file,source]of Object.entries(before)){const marker='// SOURCE MODULE: '+file+'\n',start=old.indexOf(marker),end=old.indexOf('// SOURCE MODULE:',start+marker.length);if(start<0||end<0)throw Error('Missing module '+file);old=old.slice(0,start)+marker+source+'\n\n'+old.slice(end);}
old=old.replace('// SOURCE MODULE: legacy/dialogue.js',()=>`VISUAL_ASSETS['character/young-human-male-cm01.glb']=${JSON.stringify(beforeAsset)};\n// SOURCE MODULE: legacy/dialogue.js`);
new vm.Script(old);
const template=await fs.readFile(path.join(root,'tools/skill-motion-review.html'),'utf8');
const output=template.replace('/*__PAYLOAD__*/',()=>JSON.stringify({code,before,beforeAsset,beforeSha,afterSha}).replace(/</g,'\\u003c'));
new vm.Script(output.match(/<script>([\s\S]*?)<\/script>/)[1]);
const target=path.resolve(process.argv[3]||path.join(root,'dist/Bloodline_Legacy_Skill_Motion_Review.html'));
await fs.writeFile(target,output);console.log(JSON.stringify({target,bytes:Buffer.byteLength(output),beforeSha,afterSha}));
