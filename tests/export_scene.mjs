/* Export the REAL art, geometry, camera, material uniforms and drawBatches result.
 * No browser is launched. This is an offline diagnostic, not Browser QA.
 * Run against a frozen develop checkout for the Before capture.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, Image } from '@napi-rs/canvas';

export const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function loadScene(root = repository, options = {}) {
  const files = ['legacy/dialogue.js', 'legacy/core.js', 'legacy/render_math.js',
    'legacy/motion.js', 'legacy/art.js', 'render/tilt-shift.js', 'render/shaders.js', 'render/renderer-base.js',
    'assets/loader.js', 'world/environment.js'];
  // The optional life-skill extension is part of the target core's dependencies.
  // Frozen pre-skill checkouts remain supported by this diagnostic exporter.
  let skillDefinitions = [];
  const hasSkills = await fs.access(path.join(root, 'src/skills/engine.js')).then(() => true, e => {
    if (e.code === 'ENOENT') return false;
    throw e;
  });
  if (hasSkills) {
    files.splice(2, 0, 'skills/engine.js', 'skills/runtime.js');
    const {compileCatalog} = await import(pathToFileURL(path.join(root, 'tools/skill-catalog.mjs')));
    skillDefinitions = compileCatalog(JSON.parse(await fs.readFile(path.join(root, 'src/skills/catalog-source.json'), 'utf8')));
  }
  try { await fs.access(path.join(root, 'src/world/golden-slice.js')); files.push('world/golden-slice.js'); } catch {}
  files.push('weather/weather.js', 'character/rig.js', 'render/combat-presentation.js', 'render/adapter.js');
  const assets = {};
  for (const file of await fs.readdir(path.join(root, 'public/assets'))) {
    if (/\.(png|glb)$/.test(file)) assets[file] = (await fs.readFile(path.join(root, 'public/assets', file))).toString('base64');
  }
  const ctx = vm.createContext({ console, Image, TextDecoder, Uint8Array, Uint16Array,
    Uint32Array, Float32Array, DataView, ArrayBuffer, performance, Buffer,
    document: { createElement(type) { if (type !== 'canvas') throw Error(type); return createCanvas(1, 1); } },
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    options: { width: 960, height: 720, x: 1.8, z: 16, zoom: 16, yaw: .42, pitch: .68,
      seed: 7349, time: 0, weather: 'clear', quality: 'medium', ...options },
    VISUAL_ASSETS: assets, BL_SKILL_DEFINITIONS: skillDefinitions,
  });
  const code = (await Promise.all(files.map(f => fs.readFile(path.join(root, 'src', f), 'utf8')))).join('\n');
  vm.runInContext(code, ctx);
  return await vm.runInContext(`(async()=>{
    await AssetBank.load(); installTerrainGeometry();
    if(typeof installGoldenGeometry==='function')installGoldenGeometry();
    const sim=new Simulation({seed:options.seed,mode:'normal'});
    const player=sim.addPlayer('qa-hero',{owner:'qa-owner',race:0,name:'リオ'});
    Object.assign(player,{age:options.age??24,prologue:false,introUntil:-100,x:options.x,z:options.z,
      hair:0,appearanceSeed:18,dir:.3,weapon:-1,armor:0,shield:false,action:'idle'});
    const snapshot=sim.snapshot(player.id); snapshot.map=makeVillage(snapshot.room.seed);snapshot.t=options.time;
    const r=Object.create(SliceRenderer.prototype);
    Object.assign(r,{width:options.width,height:options.height,canvas:{width:options.width,height:options.height},
      camera:{x:options.x,z:options.z-1.5,zoom:options.zoom,yaw:options.yaw,pitch:options.pitch},
      shakeOffset:[0,0],static:new Map(),dynamic:new Map(),groundFX:new Map(),fxBatches:new Map(),
      labels:[],effects:[],geo:new Map(),stats:{calls:0,triangles:0,instances:0,lodInstances:0},
      quality:options.quality,sceneKey:'village'+snapshot.map.seed,currentTime:options.time,
      program:{},shadowStatic:{tex:0},shadowDynamic:{tex:0},weather:new WeatherState(),frame:0});
    r.put=Renderer.prototype.put;
    r.art=new (typeof GoldenArt==='undefined'?VillageArt:GoldenArt)(r);
    const artStart=performance.now();r.art.village(snapshot.map);const artMs=performance.now()-artStart;
    if(options.isolatedMaterials){r.static.clear();r.art.root=rModel();r.art.target=r.static;r.art.B(0,-.20,options.z,20,.4,16,'#424a3d');}
    // Existing poses are flattened into rigid instance matrices for this offline
    // environment review; browser bone-palette crossfades are not verified here.
    if(options.actorCases){snapshot.actors=options.actorCases.map((fixture,i)=>Object.assign(sim.actor(fixture.kind,fixture.x,fixture.z),fixture));}
    if(options.characters!==false){if(!options.actorCases)r.art.doll(player,options.time,true);
      for(const actor of snapshot.actors||[])if(Math.hypot(actor.x-options.x,actor.z-options.z)<33)r.art.doll(actor,options.time,false);}
    if(options.gameplayCamera)r.updateCamera(snapshot,1/60);
    r.matrix();r.weather.setOverride(options.weather);r.weatherState=r.weather.sample(options.time,snapshot.map.seed);
    const uniforms={};r.uniform=(p,n,v)=>{uniforms[n]=v;};r.int=r.uniform;
    let rows,mesh,currentPass;const passes={};
    r.gl={TEXTURE0:0,TEXTURE_2D:0,ARRAY_BUFFER:0,DYNAMIC_DRAW:0,TRIANGLES:4,
      activeTexture(){},bindTexture(){},bindVertexArray(v){mesh=v;},bindBuffer(){},
      bufferData(t,a){rows=Array.from(a);},drawArraysInstanced(mode,start,count,n){
        currentPass.push({mesh,rows,count,instances:n});}};
    r.geometry=type=>{const g=rGeometry(type);if(!g.count)throw Error('Unknown geometry '+type);return{...g,vao:type};};
    r.terrainDirty=false;r.setupSurfaceUniforms();
    const submitStart=performance.now();
    for(const [name,map,shadow]of [['staticShadow',r.static,true],['dynamicShadow',r.dynamic,true],
      ['static',r.static,false],['dynamic',r.dynamic,false],['ground',r.groundFX,false],['fx',r.fxBatches,false]]){
      currentPass=passes[name]=[];Renderer.prototype.drawBatches.call(r,map,{},shadow);}
    const submitMs=performance.now()-submitStart;
    const geometries={};for(const pass of Object.values(passes))for(const batch of pass){
      if(geometries[batch.mesh])continue;const g=rGeometry(batch.mesh);
      geometries[batch.mesh]={positions:Array.from(g.positions),normals:Array.from(g.normals),count:g.count};}
    let rainShaders; r.programOf=(v,f)=>{rainShaders={vertex:v,fragment:f};return{};};
    Object.assign(r.gl,{createVertexArray(){return 'rain';},createBuffer(){return 0;},
      enableVertexAttribArray(){},vertexAttribPointer(){},vertexAttribDivisor(){}});
    new RainPass(r);const rainSeeds=rows;
    const staticRows=Object.fromEntries([...r.static].map(([k,v])=>[k,v.map(m=>Array.from(m))]));
    return {r,sim,snapshot,staticRows,geometries,passes,uniforms,rainSeeds,rainShaders,
      shaders:{skinVertex:SKINVERT,vertex:RVERT,fragment:RFRAG,depth:RDEPTH,postVertex:RPOSTV,postFragment:RPOSTF},
      options,artMs,submitMs,stats:r.stats,totalStaticTriangles:[...r.static].reduce((s,[k,v])=>s+rGeometry(k).count/3*v.length,0),meshBytes:[...RG_CACHE.values()].reduce((s,g)=>s+g.positions.byteLength+g.normals.byteLength,0)};
  })()`, ctx);
}

export async function writeScene(scene, directory) {
  await fs.mkdir(directory, { recursive: true });
  const { r, sim, snapshot, ...serializable } = scene;
  Object.assign(serializable,{camera:r.camera,eye:r.eye,vp:Array.from(r.vp),lightVP:Array.from(r.lightVP),
    weather:r.weatherState,map:snapshot.map,staticInstances:[...r.static.values()].reduce((a,b)=>a+b.length,0),
    totalStaticTriangles:scene.totalStaticTriangles});
  await fs.writeFile(path.join(directory,'scene.json'),JSON.stringify(serializable));
  await fs.writeFile(path.join(directory,'terrain.png'),r.terrainData.toBuffer('image/png'));
  return serializable;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [root=repository, out=path.join(repository,'tests/current/offline'), json='{}']=process.argv.slice(2);
  const scene=await loadScene(root,JSON.parse(json));await writeScene(scene,out);
  console.log(JSON.stringify({out,artMs:scene.artMs,submitMs:scene.submitMs,stats:scene.stats,
    camera:scene.r.camera,map:scene.snapshot.map.schools.map(s=>({id:s.id,x:s.x,z:s.z}))}));
}
