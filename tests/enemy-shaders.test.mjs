// Linux CI must exercise GLES typing; desktop GLSL accepts conversions that
// WebGL2 rejects. Missing EGL is an error on Linux, never a silent PASS.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const options={skip:process.platform!=='linux'?'GLES shader gate requires Linux / Mesa libEGL':false};
function run(command,args,input){
 const result=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:30000,input});
 assert.ifError(result.error);return result;
}
test('built enemy shaders compile and link as GLSL ES 300',options,()=>{
 // The production build is generated before tests start. Reading it also
 // avoids racing the review integration test's separate HTML generation.
 const result=run(process.execPath,['tools/enemies/check-shaders.mjs','dist/index.html']);
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 const report=JSON.parse(result.stdout);
 assert.equal(report.programs.length,9);assert(report.programs.every(p=>p.passed));
 assert.match(report.language,/GLSL ES 3/);
});
test('GLES gate rejects float plus int instead of accepting desktop coercion',options,()=>{
 const input=JSON.stringify([{name:'invalid-mixed-types',
  vertex:'#version 300 es\nvoid main(){gl_Position=vec4(0.);}',
  fragment:'#version 300 es\nprecision highp float;out vec4 color;void main(){float value=gl_FragCoord.x+1;color=vec4(value);}'}]);
 const result=run('python3',['tools/enemies/compile-gles.py'],input);
 assert.equal(result.status,1,result.stdout+'\n'+result.stderr);
 const report=JSON.parse(result.stdout);
 assert.equal(report.programs[0].passed,false);
 assert.equal(report.programs[0].failures[0].stage,'fragment');
 assert.match(report.programs[0].failures[0].log,/float|int|operand|type/);
});
