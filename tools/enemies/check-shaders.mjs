// Validate the shader strings actually embedded in a delivered HTML file.
// Definitions are evaluated in a VM, then compiled/linked unchanged by GLES3.
// This is a shader gate, not an attempt to execute a browser or emulate a phone.
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const html=fs.readFileSync(process.argv[2]||'dist/Bloodline_Legacy_Enemy_Review.html','utf8');
const modules=new Map([...html.matchAll(/\/\/ SOURCE MODULE: ([^\n]+)\n([\s\S]*?)(?=\n\/\/ SOURCE MODULE: |$)/g)].map(m=>[m[1],m[2]]));
const context=vm.createContext({});
vm.runInContext('class VillageArt {} const AssetBank={load:async()=>{}};',context);
for(const name of ['render/tilt-shift.js','render/shaders.js','character/rig.js','enemies/damage.js','enemies/sentinel.js']){
 if(!modules.has(name))throw Error('Missing embedded shader module: '+name);
 vm.runInContext(modules.get(name),context,{filename:name});
}
const programs=vm.runInContext(`[
 {name:'world',vertex:RVERT,fragment:RFRAG},
 {name:'world-shadow',vertex:RVERT,fragment:RDEPTH},
 {name:'display',vertex:RPOSTV,fragment:RPOSTF},
 {name:'rig',vertex:SKINVERT,fragment:RFRAG},
 {name:'rig-shadow',vertex:SKINVERT,fragment:RDEPTH},
 {name:'sentinel',vertex:EnemySentinel.VS,fragment:EnemySentinel.FS},
 {name:'sentinel-shadow',vertex:EnemySentinel.VS,fragment:EnemySentinel.DS},
 {name:'diorama-coc',vertex:RPOSTV,fragment:DIORAMA_COC_GLSL},
 {name:'diorama-blur',vertex:RPOSTV,fragment:DIORAMA_BLUR_GLSL}
]`,context);
const compiler=fileURLToPath(new URL('compile-gles.py',import.meta.url));
const result=spawnSync('python3',[compiler],{input:JSON.stringify(programs),encoding:'utf8',timeout:30000});
if(result.error)throw result.error;
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
process.exitCode=result.status??1;
