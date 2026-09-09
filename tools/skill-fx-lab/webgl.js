/* Lightweight preview of the shipped procedural material. Reuses one context,
 * shader and vertex buffer. Canvas remains available if WebGL2 is unavailable. */
const SkillFxGPU=(()=>{
 let canvas=null,gl=null,program=null,buffer=null,failed=false;
 const vertex=`#version 300 es
 precision highp float;in vec3 pos;in vec3 tex;out vec3 uv;uniform vec2 size;
 void main(){uv=tex;gl_Position=vec4(pos.x/size.x*2.-1.,1.-pos.y/size.y*2.,0.,1.);}`;
 const fragment=`#version 300 es
 precision highp float;in vec3 uv;out vec4 color;uniform vec3 effect;uniform float alpha;uniform float mono;
 const float PI=3.14159265;
 ${typeof FX_ARCANE_GLSL==='undefined'?'':FX_ARCANE_GLSL}
 void main(){float mode=mod(effect.x,8.),palette=floor(effect.x/8.);float a=alpha*arcaneMask(mode,uv.x,uv.y,uv.z,effect.y,effect.z);if(a<.003)discard;
 vec3 c=mode>4.5&&mode<5.5?vec3(.015,.025,.04):effectTint(palette,uv.z);
 if(mono>.5)c=vec3(dot(c,vec3(.2126,.7152,.0722)));color=vec4(c,a);}`;
 function initialize(){
  try{canvas=document.createElement('canvas');gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL2');
   const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
   program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   for(const [name,offset] of [['pos',0],['tex',12]]){const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,24,offset);}
   program.size=gl.getUniformLocation(program,'size');program.effect=gl.getUniformLocation(program,'effect');program.alpha=gl.getUniformLocation(program,'alpha');program.mono=gl.getUniformLocation(program,'mono');
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;});
  }catch{failed=true;}
 }
 function draw(primitives,width,height,project,mono=false){
  if(failed||!primitives.length)return null;if(!canvas)initialize();if(failed)return null;
  const dpr=Math.min(2,typeof devicePixelRatio==='number'?devicePixelRatio:1);
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
  gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(program.size,width,height);gl.uniform1f(program.mono,mono?1:0);gl.enable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const p of [...primitives].sort((a,b)=>(a.mode===5?-1:0)-(b.mode===5?-1:0))){
   const g=SkillArcane.geometry(p,v=>v,[6,3,-6]);if(!g)continue;const data=new Float32Array(g.count*6);
   for(let j=0;j<g.count;j++){const world=[0,1,2].map(i=>g.positions[j*3+i]+g.center[i]),screen=project(world);data.set([screen[0],screen[1],0,...g.normals.subarray(j*3,j*3+3)],j*6);}
   gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.uniform3fv(program.effect,SkillArcane.ink(p));gl.uniform1f(program.alpha,p.alpha);
   gl.blendFuncSeparate(gl.SRC_ALPHA,p.mode===5?gl.ONE_MINUS_SRC_ALPHA:gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,g.count);
  }
  return canvas;
 }
 return Object.freeze({draw,vertex,fragment});
})();
