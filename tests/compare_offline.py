"""Paired software-render timing; alternating order reduces shared-host drift.

python3 tests/compare_offline.py BEFORE_SCENE BEFORE_ASSETS AFTER_SCENE AFTER_ASSETS OUTPUT
This is an offline diagnostic, never a native WebGL or hardware FPS claim.
"""
import json, sys, time
from pathlib import Path
import numpy as np
from render_offline import OfflineScene

before=OfflineScene(sys.argv[1],sys.argv[2])
after=OfflineScene(sys.argv[3],sys.argv[4],context=before.ctx)
assert before.data['options']==after.data['options'], 'Comparison conditions differ'
assert before.data['camera']==after.data['camera'], 'Comparison cameras differ'
values=[[],[]]
scenes=[before,after]
for pair in range(72):
    # Both frames receive the same animation clock; reverse order on every pair.
    for i in ([0,1] if pair%2==0 else [1,0]):
        start=time.perf_counter()
        scenes[i].render(time_override=pair/6)
        before.ctx.finish()
        if pair>=12:values[i].append((time.perf_counter()-start)*1000)
result={'backend':before.ctx.info['GL_RENDERER'], 'method':'12 warmup pairs + 60 timed pairs, alternating AB/BA, shared EGL context',
        'options':before.data['options'], 'unverified':['browser','hardware GPU','Pixel Fold','native frame pacing'],
        'before_ms':values[0], 'after_ms':values[1],
        'median_paired_ratio':float(np.median(np.array(values[1])/values[0]))}
for i,name in enumerate(['before','after']):
    result[name]={f'p{p}_ms':float(np.percentile(values[i],p)) for p in [50,95,99]}
Path(sys.argv[5]).write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['before_ms','after_ms']}))
