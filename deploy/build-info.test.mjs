import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildInfo} from './build-info.mjs';
const first='437c19a'+'0'.repeat(33),second='abcdef0'+'1'.repeat(33);

test('deployment labels identify environment and exact commit without advancing release version',()=>{
  for(const [environment,branch,suffix] of [['dev','develop','-dev'],['staging','staging','-rc'],['production','main','']]) {
    const before=buildInfo('0.6.0',environment,first),after=buildInfo('0.6.0',environment,second);
    assert.equal(before.displayVersion,`v0.6.0${suffix} · 437c19a`);
    assert.equal(after.displayVersion,`v0.6.0${suffix} · abcdef0`);
    assert.equal(before.commit,first);assert.equal(before.branch,branch);
    assert.equal(after.baseVersion,before.baseVersion);
  }
});
test('local builds are visibly local and invalid metadata cannot enter HTML',()=>{
  assert.equal(buildInfo('0.6.0','local','local-recovery').displayVersion,'v0.6.0-local · unbuilt');
  for(const args of [['<script>','dev',first],['01.2.3','dev',first],['1.2.3','unknown',first],['1.2.3','dev','short']])assert.throws(()=>buildInfo(...args));
});
