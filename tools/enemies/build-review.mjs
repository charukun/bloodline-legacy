import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),base='717931fd92271104b89a9c5645ed4792bbf06c2e';
const html=await fs.readFile(path.join(root,'dist/index.html'),'utf8');let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const boot=code.indexOf('// SOURCE MODULE: bootstrap.js');if(boot<0)throw Error('Missing build bootstrap');
code=code.slice(0,boot)+(await fs.readFile(path.join(root,'tools/enemies/review-runtime.js'),'utf8')).replace('__BASE_SHA__',base)+'\n})();';new vm.Script(code);
const shell=`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>血脈の系譜 — 敵比較</title><style>
*{box-sizing:border-box}body{margin:0;background:#333c31;color:#ede3ca;font:14px system-ui;display:flex;flex-direction:column;height:100dvh}header,footer{padding:10px 14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}h1{font-size:17px;margin:0}main{flex:1;min-height:120px}canvas{display:block;width:100%;height:100%}label{display:flex;align-items:center;gap:5px}select,button{font:inherit;color:inherit;background:#4c5544;border:1px solid #a59570;padding:9px;border-radius:4px;min-height:40px}input{accent-color:#d5b975}output{font-size:12px}small{font-size:11px;opacity:.8}#seek{flex:1;min-width:120px}
</style><header><h1>血脈の系譜 · 敵の比較</h1><output id="status">準備中…</output></header><main><canvas id="world"></canvas></main><footer>
<label>表示<select id="version"><option value="after">改善後</option><option value="before">変更前</option></select></label>
<label>動作<select id="pose"><option value="idle">待機</option><option value="attack">予兆 → 攻撃</option><option value="run">移動</option><option value="guard">防御</option><option value="hit">被弾・傷</option><option value="death">死亡</option><option value="lost">欠損・片腕攻撃</option></select></label>
<label>数<select id="count"><option>2</option><option>8</option><option>24</option></select></label><label>品質<select id="quality"><option value="medium">中</option><option value="low">低</option><option value="high">高</option></select></label>
<label>視点<select id="angle"><option value=".32">斜め</option><option value="0">正面</option><option value="1.57">横</option><option value="3.14">背面</option></select></label>
<label>速度<select id="speed"><option value="1">通常</option><option value=".25">¼</option></select></label><button id="pause">一時停止</button><input id="seek" aria-label="再生位置" type="range" min="0" max="1000" value="0"><button id="measure">40秒測定・JSON保存</button>
<small>同じ描画エンジンと敵の試験シーンです。セーブは作成しません。測定は準備10秒＋10秒×3回。実戦・端末での確認も必要です。</small></footer><script>__CODE__</script></html>`;
const target=path.join(root,'dist/Bloodline_Legacy_Enemy_Review.html');await fs.writeFile(target,shell.replace('__CODE__',()=>code.replace(/<\/script/gi,'<\\/script')));console.log(target);
