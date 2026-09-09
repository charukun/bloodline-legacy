// Offline asset/license consistency gate; no network or browser needed.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {harness} from '../../tests/enemies/harness.mjs';
const dir=new URL('../../public/assets/enemies/',import.meta.url),read=f=>fs.readFileSync(new URL(f,dir));
const manifest=JSON.parse(read('provenance.json')),report=JSON.parse(read('asset-report.json')),asset=manifest.assets[0],bytes=read('sentinel.glb'),sha=crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.assets.length,1);for(const key of ['assetName','author','distributor','sourceURL','sourceCommit','sourceSHA256','license','commercialUse','modification','gameEmbedding','redistribution','attribution','acquiredAt','runtimeFile','runtimeSHA256'])assert(typeof asset[key]==='string'&&asset[key].length>0,key);
assert.equal(asset.license,'CC0-1.0');assert.equal(asset.sourceCommit,'15b62b9bad122f72926c10fb14d622c73819fa54');assert.equal(asset.sourceSHA256,report.sourceSHA256);assert.equal(asset.runtimeSHA256,sha);assert.equal(report.sha256,sha);assert.equal(report.runtimeBytes,bytes.length);
assert.match(read('KayKit-LICENSE.txt').toString(),/personal, educational and commercial/);assert.match(read('KayKit-LICENSE.txt').toString(),/not mandatory/);assert.match(read('CC0-1.0.txt').toString(),/CC0 1.0 Universal/);
const {api}=harness();assert.equal(api.asset.g.extras.sourceSHA256,asset.sourceSHA256);assert.equal(api.asset.g.meshes[0].primitives.length,1);assert.equal(api.asset.indices.length/3,report.triangles);assert(!api.asset.g.images?.length);assert.equal(Object.keys(api.asset.clips).length,8);
console.log(JSON.stringify({result:'PASS',runtimeSHA256:sha,triangles:report.triangles,bytes:bytes.length,externalAssets:1,license:'CC0-1.0',gameUse:asset.gameUse},null,2));
