/* Read-only presentation state, derived from authoritative room time/seed.
 * This never consumes Simulation.rng, mutates actors, or changes combat rules. */
const SKY_PRESETS={
 clear:{sky:[.57,.70,.84],ground:[.26,.25,.18],sun:[1.,.84,.60],strength:2.45,ambient:.83,fog:[.65,.72,.69],density:.012,exposure:1.20,rain:0,wet:0,wind:.65},
 dusk:{sky:[.35,.44,.65],ground:[.15,.16,.19],sun:[1.,.55,.27],strength:1.60,ambient:.68,fog:[.48,.48,.55],density:.018,exposure:1.25,rain:0,wet:.05,wind:.45},
 rain:{sky:[.36,.46,.60],ground:[.12,.16,.19],sun:[.60,.68,.80],strength:.44,ambient:.76,fog:[.43,.50,.54],density:.030,exposure:1.18,rain:1,wet:1,wind:1.55}
};
class WeatherState{
 constructor(){this.override=null;this.current={...SKY_PRESETS.clear};this.kind='clear';}
 setOverride(kind=null){if(kind!==null&&!SKY_PRESETS[kind])throw Error('Unknown weather');this.override=kind;}
 sample(t,seed=0,showcase=false){let from,to,mix=0;
  if(showcase){from=to='clear';}
  else if(this.override){from=to=this.override;}
  else {const phases=['clear','clear','dusk','rain','rain','clear'];const clock=t/180,idx=Math.floor(clock)%phases.length;from=phases[idx];to=phases[(idx+1)%phases.length];mix=clamp((clock%1-.85)/.15,0,1);mix=mix*mix*(3-2*mix);}
  this.kind=mix>.5?to:from;const a=SKY_PRESETS[from],b=SKY_PRESETS[to];const lerp=(x,y)=>x+(y-x)*mix;const state={kind:this.kind};for(const k of Object.keys(a))state[k]=Array.isArray(a[k])?a[k].map((v,i)=>lerp(v,b[k][i])):lerp(a[k],b[k]);this.current=state;return state;
 }
}
class RainPass{
 constructor(r){this.r=r;const gl=r.gl;this.program=r.programOf(`#version 300 es
 precision highp float;layout(location=0) in vec4 seed;uniform mat4 vp;uniform float time;uniform vec2 focus;uniform float wind;out float fade;
 void main(){int corner=gl_VertexID%6;vec2 v=corner==0?vec2(-1.,0.):corner==1?vec2(1.,0.):corner==2?vec2(1.,1.):corner==3?vec2(-1.,0.):corner==4?vec2(1.,1.):vec2(-1.,1.);float yy=mod(seed.z*17.-time*(8.+seed.w*4.),17.);vec3 p=vec3(focus.x+seed.x*40.-20.+yy*.045*wind,yy,focus.y+seed.y*40.-20.);p+=vec3(v.x*.014+v.y*.025*wind,-v.y*(.48+seed.w*.5),0.);fade=(.16+seed.w*.22)*smoothstep(0.,1.,yy);gl_Position=vp*vec4(p,1.);}`,
 `#version 300 es
 precision highp float;in float fade;uniform float rain;layout(location=0)out vec4 col;layout(location=1)out vec4 norm;
 void main(){col=vec4(.48,.57,.64,fade*rain);norm=vec4(.5,1.,.5,0.);}`);
 this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);const seeds=new Float32Array(1400*4),rng=random(51828);for(let i=0;i<seeds.length;i++)seeds[i]=rng();this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,4,gl.FLOAT,false,16,0);gl.vertexAttribDivisor(0,1);gl.bindVertexArray(null);
 }
 draw(s){const r=this.r,w=r.weatherState;if(!w||w.rain<.01||r.logicalSize)return;const gl=r.gl,p=this.program,count=r.quality==='low'?260:r.quality==='high'?1100:600;gl.useProgram(p);r.uniform(p,'vp',r.vp);r.uniform(p,'time',s.t);r.uniform(p,'focus',[r.camera.x,r.camera.z]);r.uniform(p,'wind',w.wind);r.uniform(p,'rain',w.rain);gl.bindVertexArray(this.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,6,count);r.stats.calls++;r.stats.triangles+=count*2;r.stats.rainParticles=count;gl.useProgram(r.program);}
}
