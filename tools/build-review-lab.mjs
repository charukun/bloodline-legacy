import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runtimeSources,visualAssetNames} from './runtime-sources.mjs';
import {catalogProgram} from './skill-catalog.mjs';
import {buildInfo} from '../deploy/build-info.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function buildReview({commit,pr=null,environment='local',out=path.join(root,'dist/review')}={}) {
 if(!['local','dev','preview'].includes(environment))throw Error('Review Lab cannot be built for Production or Staging');
 const actual=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 commit??=actual;
 if(!/^[a-f0-9]{40}$/.test(commit)||commit!==actual)throw Error('Review build must use the checked-out commit');
 if(environment==='preview'&&(!Number.isSafeInteger(pr)||pr<1))throw Error('Preview requires a PR number');
 const release=JSON.parse(await fs.readFile(path.join(root,'deploy/release.json'),'utf8'));
 const info={...buildInfo(release.baseVersion,environment==='local'?'local':'dev',commit),environment,pr};
 info.displayVersion=`v${info.baseVersion} · ${pr?`PR #${pr}`:environment.toUpperCase()} · ${info.shortCommit}`;
 await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
 const modules=runtimeSources.filter(f=>f!=='bootstrap.js');
 const read=p=>fs.readFile(path.join(root,p),'utf8');
 // The existing binary loaders accept base64. Fetch shared binary assets once,
 // adapt them at the boundary, and keep recordings/UI assets out of the HTML.
 let code=`const BUILD_INFO=Object.freeze(${JSON.stringify(info)});\nconst LIVE_BUILD={};const LINEAGE_VIEW={};const MUSIC_CATALOG={tracks:[]};const MUSIC_ASSETS={};\nconst VISUAL_ASSETS={};\n`;
 code+=`await Promise.all(${JSON.stringify(visualAssetNames)}.map(async name=>{const r=await fetch(new URL('./assets/'+name,import.meta.url));if(!r.ok)throw Error('Asset unavailable: '+name);const a=new Uint8Array(await r.arrayBuffer());let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));VISUAL_ASSETS[name]=btoa(s);}));\n`;
 code+=catalogProgram(JSON.parse(await read('src/skills/catalog-source.json')))+'\n';
 for(const f of modules)code+=`\n// SOURCE MODULE: ${f}\n`+(await read('src/'+f)).replace(/^export /gm,'')+'\n';
 code+=await read('tools/enemies/review-scenes.js');
 code+=`\nexport {BUILD_INFO,Simulation,book,BL_SKILL_CATALOG,SkillComposition,skillById,skillPhase,skillRestriction,WEAPONS,PHASES,ENEMY_FORMS,EnemyReview,AssetBank,installTerrainGeometry,SliceRenderer,rModel,SkillEffects,incapacitated};\n`;
 await fs.writeFile(path.join(out,'runtime.mjs'),code);
 for(const name of visualAssetNames){const target=path.join(out,'assets',name);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(root,'public/assets',name),target);}
 for(const name of ['index.html','app.mjs','model.mjs','style.css'])await fs.copyFile(path.join(root,'src/review',name),path.join(out,name));
 const hashes={};for(const name of ['runtime.mjs','app.mjs','model.mjs','style.css','index.html',...visualAssetNames.map(n=>'assets/'+n)])hashes[name]=createHash('sha256').update(await fs.readFile(path.join(out,name))).digest('hex');
 const manifest={...info,modules,assets:visualAssetNames,hashes};await fs.writeFile(path.join(out,'version.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(`Review Lab: ${info.displayVersion} (${modules.length} shared modules, ${visualAssetNames.length} external assets)`);return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildReview({environment:process.env.REVIEW_ENV||'local',commit:process.env.REVIEW_SHA,pr:process.env.REVIEW_PR?Number(process.env.REVIEW_PR):null});
