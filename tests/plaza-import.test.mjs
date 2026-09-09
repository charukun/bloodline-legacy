import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
const glb=await fs.readFile(new URL('public/assets/plaza-craft.glb',root));
const source=await fs.readFile(new URL('src/assets/plaza-craft.js',root),'utf8');
const jsonSize=glb.readUInt32LE(12),binOffset=28+jsonSize;
const doc=JSON.parse(glb.subarray(20,20+jsonSize));
function load(bytes,cache=new Map()){
  vm.runInNewContext(source+';PlazaCraft.load();',{
    VISUAL_ASSETS:{'plaza-craft.glb':bytes.toString('base64')},RG_CACHE:cache,
    atob:s=>Buffer.from(s,'base64').toString('binary'),TextDecoder,Uint8Array,Float32Array,DataView,
  });return cache;
}
test('plaza import loads the recorded asset and keeps the environment contract separate',async()=>{
  const meta=JSON.parse(await fs.readFile(new URL('public/assets/plaza-craft.json',root)));
  assert.equal(createHash('sha256').update(glb).digest('hex'),meta.glb_sha256);
  const cache=load(glb);
  assert.equal(cache.size,4);
  assert.equal(cache.get('craft:well').shadowMesh,'craft:well-shadow');
  const html=await fs.readFile(new URL('dist/index.html',root),'utf8');
  assert.ok(html.includes(glb.toString('base64')));
});
test('corrupt plaza header or late nonfinite UV rejects atomically before installing any geometry',()=>{
  const invalidHeader=Buffer.from(glb);invalidHeader.writeUInt32LE(glb.length+4,8);
  const invalidUV=Buffer.from(glb);
  const index=doc.meshes[1].primitives[0].attributes.TEXCOORD_0;
  const accessor=doc.accessors[index],view=doc.bufferViews[accessor.bufferView];
  invalidUV.writeFloatLE(NaN,binOffset+(view.byteOffset||0)+(accessor.byteOffset||0));
  for(const bytes of [invalidHeader,invalidUV]){
    const cache=new Map([['existing-character',{count:3}]]);
    assert.throws(()=>load(bytes,cache),/Invalid plaza GLB|Nonfinite plaza geometry/);
    assert.deepEqual([...cache.keys()],['existing-character']);
  }
});
