/* Existing Simulation movement + gait, offline rigid-pose review.
 * Not native bone-palette crossfades and not a real-time FPS recording.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadScene,writeScene,repository} from './export_scene.mjs';
const out=path.resolve(process.argv[2]||'tests/current/walk');await fs.mkdir(out,{recursive:true});
const scene=await loadScene(repository,{width:768,height:576,x:1.8,z:16,weather:'rain'});
const r=scene.r,player=scene.sim.players.get(scene.snapshot.player.id),route=[];
scene.sim.command(player.id,{type:'move',x:0,z:-1});
for(let frame=0;frame<32;frame++){
 for(let i=0;i<4;i++)scene.sim.tick(1/60);
 const snapshot=scene.sim.snapshot(player.id);r.dynamic.clear();r.fxBatches.clear();r.art.doll(player,scene.sim.time,true);
 for(const actor of snapshot.actors||[])if(Math.hypot(actor.x-player.x,actor.z-player.z)<33)r.art.doll(actor,scene.sim.time,false);
 // Same camera-follow equations and timestep as the gameplay renderer.
 r.camera.x+=(player.x-r.camera.x)*.4;r.camera.z+=(player.z-1.5-r.camera.z)*.4;r.matrix();
 let mesh,rows,current;const passes={};
 r.gl.bindVertexArray=v=>{mesh=v;};r.gl.bufferData=(t,a)=>{rows=Array.from(a);};
 r.gl.drawArraysInstanced=(mode,start,count,n)=>{current.push({mesh,rows,count,instances:n});};
 r.stats={calls:0,triangles:0,instances:0,lodInstances:0};r.currentTime=scene.sim.time;r.setupSurfaceUniforms();
 for(const [name,map,shadow]of [['staticShadow',r.static,true],['dynamicShadow',r.dynamic,true],['static',r.static,false],['dynamic',r.dynamic,false],['ground',r.groundFX,false],['fx',r.fxBatches,false]]){current=passes[name]=[];r.drawBatches(map,{},shadow);}
 for(const pass of Object.values(passes))for(const batch of pass){if(!scene.geometries[batch.mesh]){const g=r.geometry(batch.mesh);scene.geometries[batch.mesh]={positions:Array.from(g.positions),normals:Array.from(g.normals),count:g.count};}}
 Object.assign(scene,{passes,stats:r.stats});scene.options.time=scene.sim.time;
 const dir=path.join(out,'frame');await writeScene(scene,dir);
 const result=spawnSync('python3',[path.join(repository,'tests/render_offline.py'),dir,path.join(repository,'public/assets')],{encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr||result.stdout);
 await fs.rename(path.join(dir,'render.png'),path.join(out,String(frame).padStart(3,'0')+'.png'));
 route.push({frame,t:scene.sim.time,x:player.x,z:player.z,action:player.action});
}
await fs.writeFile(path.join(out,'route.json'),JSON.stringify({backend:'offline EGL; existing Simulation and gait; 15 fps export, not measured frame pacing',route},null,2));
const video=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','15','-i',path.join(out,'%03d.png'),'-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-y',path.join(out,'golden-walk-offline.mp4')],{encoding:'utf8'});
if(video.status!==0)throw Error(video.stderr);console.log(path.join(out,'golden-walk-offline.mp4'));
