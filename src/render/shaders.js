/* Stylized metallic/roughness pipeline. All lighting is linear until display resolve.
 * The atlas contains authored color variation, roughness, tangent detail and AO.
 * Four nearest local lights. One cached sun shadow + one moving-actor shadow. */
const RVERT=`#version 300 es
precision highp float;
layout(location=0) in vec3 pos;layout(location=1) in vec3 nor;
layout(location=9) in vec3 craft;
layout(location=2) in mat4 model;layout(location=6) in vec4 ink;layout(location=7) in float surface;
uniform mat4 vp;uniform mat4 lightVP;uniform float time;uniform float wind;
out vec3 vWorld;out vec3 vNormal;out vec4 vInk;out float vSurface;out vec4 vShadow;out vec3 vLocal;
void main(){vec4 w=model*vec4(pos,1.);if(surface>12.5&&surface<13.5){float bend=max(0.,pos.y+.35);w.x+=sin(time*1.8+w.z*.72+model[3].x)*.042*bend*wind;w.z+=cos(time*1.1+w.x*.43)*.028*bend*wind;}vWorld=w.xyz;vNormal=normalize(mat3(model)*(nor/max(vec3(.00001),vec3(dot(model[0].xyz,model[0].xyz),dot(model[1].xyz,model[1].xyz),dot(model[2].xyz,model[2].xyz)))));vInk=ink;vSurface=surface;vShadow=lightVP*w;vLocal=surface>=28.&&surface<29.5?craft:pos;if(surface>23.5&&surface<25.5){vLocal=nor;vNormal=vec3(0.,1.,0.);}if(surface>=27.&&surface<27.5)vNormal=nor;gl_Position=vp*w;}`;
const RFRAG=`#version 300 es
precision highp float;
in vec3 vWorld;in vec3 vNormal;in vec4 vInk;in float vSurface;in vec4 vShadow;in vec3 vLocal;
uniform sampler2D shadowTex;uniform sampler2D dynamicShadow;uniform sampler2D materialAtlas;uniform sampler2D detailAtlas;uniform sampler2D terrainMap;uniform sampler2D goldenAtlas;
uniform sampler2D craftColor;uniform sampler2D craftDetail;
uniform vec3 eye;uniform float time;uniform bool shadows;uniform vec2 focus;
uniform vec3 skyColor;uniform vec3 groundColor;uniform vec3 sunColor;uniform vec3 fogColor;
uniform float sunStrength;uniform float skyStrength;uniform float wetness;uniform float fogDensity;
uniform vec3 localPos0;uniform vec3 localPos1;uniform vec3 localPos2;uniform vec3 localPos3;
uniform vec3 localColor0;uniform vec3 localColor1;uniform vec3 localColor2;uniform vec3 localColor3;
uniform float terrainEnabled;
layout(location=0) out vec4 outColor;layout(location=1) out vec4 outNormal;
const float PI=3.14159265;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,53.7)))*43758.5453);}
vec3 lin(vec3 c){return pow(max(c,vec3(0.)),vec3(2.2));}
float silkLattice(vec2 p,float seed){float h=mod(p.x*37.+p.y*71.+seed*13.,251.);return mod((h*34.+1.)*h,251.)/125.5-1.;}
float silkNoise(vec2 p,float seed){vec2 i=floor(p),f=fract(p),s=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(silkLattice(i,seed),silkLattice(i+vec2(1.,0.),seed),s.x),mix(silkLattice(i+vec2(0.,1.),seed),silkLattice(i+vec2(1.,1.),seed),s.x),s.y);}
float silkFlow(float u,float clock,float seed){return .72*silkNoise(vec2(u*4.7,clock*2.2),seed)+.28*silkNoise(vec2(u*10.8,clock*4.8),seed+41.);}
// Layered spell material; same analytic masks as SkillArcane.mask.
float arcaneBaseMask(float mode,float u,float v,float age,float clock,float flutter){
 float edge=smoothstep(0.,.035,v)*(1.-smoothstep(.94,1.,v)),ends=smoothstep(0.,.03,u)*(1.-smoothstep(.97,1.,u));
 float drift=flutter*silkNoise(vec2(u*6.,clock*2.1),19.)*.12;
 if(mode<.5){float lanes=pow(.5+.5*sin((u+clock*.14+drift)*PI*18.),9.);return clamp(edge*(.13+lanes*.85)*pow(1.-v,1.35)*smoothstep(0.,.05,v),0.,1.);}
 if(mode<1.5)return clamp(edge*ends*(exp(-pow((v-.42-drift)*4.,2.))*.72+.2*pow(.5+.5*sin(u*37.-clock*12.+v*9.),5.)),0.,1.);
 if(mode<2.5){float lines=exp(-pow((v-.12)*42.,2.))+exp(-pow((v-.9)*48.,2.)),x=fract(u*12.)-.5;float rune=exp(-pow((abs(x)-abs(v-.5)*.58)*42.,2.))*smoothstep(.22,.32,v)*(1.-smoothstep(.70,.8,v));return clamp(edge*(lines+rune*.85),0.,1.);}
 if(mode<3.5)return clamp(edge*ends*(.24+exp(-pow((v-.5-drift)*3.4,2.))*.76)*(.78+.22*sin(u*18.-clock*9.)),0.,1.);
 if(mode<4.5){float x=u*2.-1.,y=v*2.-1.,r=x*x+y*y;return clamp((exp(-r*10.)+exp(-abs(x)*50.-abs(y)*4.)*.45+exp(-abs(y)*50.-abs(x)*4.)*.45)*(1.-smoothstep(.65,1.,sqrt(r)))*age,0.,1.);}
 if(mode<5.5)return 1.-smoothstep(.80,1.,v);
 return clamp(edge*ends*(exp(-pow((v-.5)*6.,2.))+.2)*(.72+.28*sin(clock*35.+u*12.)),0.,1.);
}
// Fog has its own padded support. Low-frequency advection dissolves mesh
// borders without a screen blur, depth copy or per-frame random values.
float effectMist(float mode,float u,float v,float age,float clock,float base){
 float warp=silkNoise(vec2(u*3.+clock*.12,v*2.-clock*.3),11.)*.6;
 float cloud=clamp(.5+.34*silkNoise(vec2(u*7.+warp,v*3.-clock*.55),19.)+.16*silkNoise(vec2(u*19.-clock*.12,v*9.+warp),31.),0.,1.);
 float density=smoothstep(.20,.80,cloud),support=smoothstep(-.45,-.18,v)*(1.-smoothstep(1.18,1.45,v));
 float ends=smoothstep(0.,.12,u)*(1.-smoothstep(.84,1.,u));
 if(mode<.5)return clamp(base*.22+support*smoothstep(0.,.18,v)*(1.-smoothstep(.55,1.25,v))*(.12+density*.5),0.,1.);
 if(mode>1.5&&mode<2.5){float rings=exp(-pow((v-.12)*5.,2.))+exp(-pow((v-.9)*5.,2.));return clamp(base*.36+rings*support*(.06+density*.38),0.,1.);}
 if(mode>3.5&&mode<4.5){float r=length(vec2(u,v)*2.-1.);return clamp(exp(-r*r*2.7)*(1.-smoothstep(.65,1.7,r))*(.22+density*.64)*age,0.,1.);}
 if(mode>4.5&&mode<5.5)return clamp(1.-smoothstep(.40,1.,v+(cloud-.5)*.22),0.,1.);
 float body=exp(-pow((v-.5+(cloud-.5)*.45)*2.8,2.))*(.10+density*.66);
 float halo=exp(-pow((v-.5)*1.6,2.))*density*.18;
 return clamp((base*.19+(body+halo)*ends*support)*(1.-smoothstep(.55,1.,age)*.45),0.,1.);
}
float arcaneMask(float mode,float u,float v,float age,float clock,float flutter,float mist){
 float border=(mode>4.5&&mode<5.5?1.:smoothstep(0.,.14,v))*(1.-smoothstep(.86,1.,v));if(mode>3.5&&mode<4.5)border*=smoothstep(0.,.14,u)*(1.-smoothstep(.86,1.,u));
 float pad=mode>4.5&&mode<5.5?0.:mist*.9;v=(v-.5)*(1.+pad)+.5;if(mode>3.5&&mode<4.5)u=(u-.5)*(1.+pad)+.5;
 float base=v<0.||v>1.||u<0.||u>1.?0.:arcaneBaseMask(mode,u,v,age,clock,flutter);
 return mist>0.?mix(base,effectMist(mode,u,v,age,clock,base)*border,mist):base;
}
// A two-color material evolves from bright core to colored afterimage. Color
// is an expression parameter, never counted as a new skill or geometry form.
vec3 effectTint(float palette,float phase){
 vec3 a=vec3(.68,.88,1.),b=a;
 if(palette>.5&&palette<1.5){a=vec3(1.,240./255.,187./255.);b=vec3(230.,111.,56.)/255.;}
 else if(palette<2.5&&palette>1.5){a=vec3(217.,255.,227.)/255.;b=vec3(66.,155.,146.)/255.;}
 else if(palette<3.5&&palette>2.5){a=vec3(215.,247.,255.)/255.;b=vec3(83.,125.,222.)/255.;}
 else if(palette<4.5&&palette>3.5){a=vec3(255.,224.,237.)/255.;b=vec3(206.,80.,117.)/255.;}
 else if(palette>4.5){a=vec3(239.,222.,255.)/255.;b=vec3(132.,100.,199.)/255.;}
 return mix(a,b,clamp(phase,0.,1.));
}
float shadowValue(sampler2D map,vec3 p,float bias){vec2 t=1./vec2(textureSize(map,0));float s=0.;for(int i=0;i<4;i++){vec2 o=vec2((i&1)==0?-.9:.9,(i&2)==0?-.9:.9);s+=step(texture(map,p.xy+o*t*1.35).r,p.z-bias);}return s*.25;}
vec3 brdf(vec3 base,vec3 N,vec3 V,vec3 L,float rough,float metal,vec3 radiance){vec3 H=normalize(V+L);float nl=max(dot(N,L),0.),nv=max(dot(N,V),.08),nh=max(dot(N,H),0.),vh=max(dot(V,H),0.);float a=rough*rough,a2=a*a;float d=a2/(PI*pow(nh*nh*(a2-1.)+1.,2.)+.0001);float k=pow(rough+1.,2.)*.125;float g=(nv/(nv*(1.-k)+k))*(nl/(nl*(1.-k)+k));vec3 f0=mix(vec3(.035),base,metal);vec3 F=f0+(1.-f0)*pow(1.-vh,5.);return ((1.-F)*(1.-metal)*base/PI+d*g*F/max(.1,4.*nv*max(nl,.01)))*radiance*nl;}
vec3 localLight(vec3 p,vec3 intensity,vec3 base,vec3 N,vec3 V,float rough,float metal){if(!any(greaterThan(intensity,vec3(0.))))return vec3(0.);vec3 delta=p-vWorld;float d=length(delta);if(d>=7.5)return vec3(0.);float atten=pow(max(0.,1.-d/7.5),2.)/(1.+d*d*.12);return brdf(base,N,V,delta/max(.01,d),rough,metal,intensity*atten);}
void main(){vec3 N=normalize(vNormal),L=normalize(vec3(-.48,.85,.42)),V=normalize(eye-vWorld);float authored=vSurface;bool crafted=authored>=28.&&authored<29.5;bool paved=authored>=29.&&authored<29.5;bool golden=authored>=19.5&&authored<23.5;float surf=crafted?9.:golden?(authored<21.5?9.:authored<22.5?8.:18.):authored,alpha=vInk.a;vec3 pigment=vInk.rgb;
 // Continuous silk surface. UV/erosion travel with the strike, so hitstop also
 // freezes the material. Only material 24 uses this path; no world texture lookup.
 if(authored>23.5&&authored<24.5){
  float u=vLocal.x,v=vLocal.y,age=vLocal.z,flutter=mod(vInk.r,2.),seed=floor(vInk.g),clock=vInk.b,palette=floor(vInk.r/2.),mist=fract(vInk.g)*2.;
  float border=smoothstep(0.,.14,v)*(1.-smoothstep(.86,1.,v));v=(v-.5)*(1.+mist*.9)+.5;
  float warp=sin(u*19.+age*.9)*.055+sin(u*43.-age)*.012+flutter*silkFlow(u,clock,seed)*.16*smoothstep(.05,.65,v);
  float fiber=pow(.5+.5*sin((v+warp)*82.+sin(u*23.)*2.2),7.);
  float core=exp(-pow((v-.16)/max(.115,fwidth(v)*.75),2.));
  float wake=exp(-v*2.9)*(.28+.64*fiber);
  float grain=mix(.5+.5*sin(u*39.+v*16.+sin(u*17.-v*6.)*1.7),.5+.5*silkNoise(vec2(u*13.+clock*.6,v*5.-clock*.7),seed+89.),flutter*.65);
  float erosion=smoothstep(age*.95-.22,age*.95+.06,grain+.18*(1.-v));
  float edge=smoothstep(0.,max(.025,fwidth(v)),v)*(1.-smoothstep(.86,1.,v));
  float ends=smoothstep(0.,.045,u)*(1.-smoothstep(.93,1.,u));
  float base=clamp((core*.9+wake)*erosion*edge*ends,0.,1.);
  alpha*=mist>0.?mix(base,effectMist(1.,u,v,age,clock,base)*border,mist):base;
  if(alpha<.004)discard;
  vec3 light=lin(palette<.5?vec3(1.,240./255.,212./255.):effectTint(palette,age))*(1.4+core*1.6*(1.-mist*.7));
  outColor=vec4(light/(1.+light),alpha);outNormal=vec4(.5,1.,.5,0.);return;
 }
 // Dedicated additive spell batch keeps depth testing but never writes depth.
 if(authored>24.5&&authored<25.5){
  float mode=mod(floor(vInk.r),8.),palette=floor(vInk.r/8.),mist=fract(vInk.r)*2.;alpha*=arcaneMask(mode,vLocal.x,vLocal.y,vLocal.z,vInk.g,vInk.b,mist);
  if(mode<.5){vec3 face=cross(dFdx(vWorld),dFdy(vWorld));float grazing=abs(dot(face,V))/max(.000001,length(face));alpha*=mix(1.,smoothstep(.04,.55,grazing),mist);}
  if(alpha<.003)discard;
  vec3 light=mode>4.5&&mode<5.5?vec3(.008,.014,.023):lin(effectTint(palette,vLocal.z))*2.3;
  outColor=vec4(light/(1.+light),alpha);outNormal=vec4(0.);return;
 }
 // Existing line/debris primitives get a soft local material as well. Other
 // combat needles keep surface 4. No additional meshes, batches or textures.
 if(authored>=26.&&authored<27.5){
  bool dust=authored>=27.;float mist=(authored-(dust?27.:26.))/.49;
  vec2 uv;
  if(dust){vec3 n=abs(vNormal);uv=(n.x>.5?vLocal.yz:n.y>.5?vLocal.xz:vLocal.xy)*2.6;}
  else uv=vec2(length(vLocal.xz)/max(.001,1.-abs(vLocal.y)*2.),vLocal.y*2.);
  float radius=dust?length(uv):uv.x,border=1.-smoothstep(.30,1.,radius),end=dust?1.:1.-smoothstep(.65,1.,abs(uv.y));
  float u=dust?uv.x*.5+.5:uv.y*.5+.5,v=dust?uv.y*.5+.5:uv.x*.5+.5;
  float haze=effectMist(dust?4.:1.,u,v,dust?1.:1.-alpha,(1.-alpha)*2.,exp(-radius*radius*4.));
  alpha*=mix(1.,border*end*(.18+haze*.85),smoothstep(0.,.5,mist));
  if(alpha<.003)discard;vec3 light=lin(pigment)*1.8;outColor=vec4(light/(1.+light),alpha);outNormal=vec4(0.);return;
 }
 if(surf>1.5&&surf<2.5){float d=length(vLocal.xz);alpha*=pow(max(0.,1.-d),2.);if(alpha<.005)discard;outColor=vec4(lin(pigment),alpha);outNormal=vec4(.5,1.,.5,0.);return;}
 float slot=0.,tile=1.7,rough=.86,metal=0.,ao=1.;bool foliage=surf>12.5&&surf<13.5;bool skin=surf>13.5&&surf<14.5;bool water=surf>.5&&surf<1.5;
 if(surf>7.5&&surf<8.5){slot=1.;rough=.81;tile=1.2;}
 else if(surf>8.5&&surf<9.5){slot=2.;rough=.93;tile=1.45;}
 else if(surf>9.5&&surf<10.5){slot=3.;rough=.36;metal=.72;}
 else if(surf>10.5&&surf<11.5){slot=4.;rough=.19;}
 else if(foliage){slot=5.;rough=.95;tile=1.4;}
 else if(skin){slot=6.;rough=.78;tile=3.;}
 else if(surf>14.5&&surf<15.5){slot=7.;rough=.51;tile=2.4;}
 else if(surf>15.5&&surf<16.5){slot=8.;rough=.98;tile=1.8;}
 else if(surf>16.5&&surf<17.5){slot=9.;rough=.96;tile=1.2;}
 else if(surf>17.5&&surf<18.5){slot=10.;rough=.81;tile=2.;}
 else if(surf>18.5&&surf<19.5){slot=11.;rough=.73;}
 vec3 an=abs(N);vec2 uv=an.y>an.x&&an.y>an.z?vWorld.xz:an.z>an.x?vWorld.xy:vWorld.zy;
 uv=fract(uv*tile);vec2 auv=(vec2(mod(slot,4.),floor(slot/4.))+(.025+uv*.95))*.25;vec4 tex=(golden||crafted)?vec4(.59,.59,.59,.9):texture(materialAtlas,auv);vec4 norm=(golden||crafted)?vec4(.5,.5,1.,1.):texture(detailAtlas,auv);pigment*=mix(.72,1.18,tex.r);rough=clamp(rough*mix(.80,1.1,tex.a),.12,1.);ao=mix(.78,1.,norm.a);
 if(golden){float k=floor(authored-20.+.5);vec2 plane=an.y>an.x&&an.y>an.z?vWorld.xz:an.z>an.x?vWorld.xy:vWorld.zy;
  vec2 guv=fract(plane*(k==1.?vec2(.48,.54):k==2.?vec2(.63,.35):vec2(.75)));
  vec4 authoredTex=texture(goldenAtlas,(vec2(mod(k,2.),floor(k/2.))*256.+8.+guv*239.)/512.);
  pigment*=mix(.66,1.34,authoredTex.r);rough=authoredTex.a;norm.xy=authoredTex.gb;
  if(k<1.5&&vWorld.y<.65){float damp=1.-smoothstep(.12,.65,vWorld.y);pigment=mix(pigment,pigment*vec3(.79,.86,.71),damp*.32);if(terrainEnabled>.5)ao*=texture(terrainMap,(vWorld.xz+vec2(48.,55.))/96.).g;}
 }
 if(crafted){vec4 c=texture(craftColor,vLocal.xy);pigment=vInk.rgb*c.rgb;rough=c.a;metal=0.;ao=vLocal.z;
  // Paving reads one color/roughness sample; bevel geometry supplies its normals.
  if(!paved){vec4 d=texture(craftDetail,vLocal.xy);metal=d.b;
  vec3 dp1=dFdx(vWorld),dp2=dFdy(vWorld);vec2 du1=dFdx(vLocal.xy),du2=dFdy(vLocal.xy);float det=du1.x*du2.y-du1.y*du2.x;
  if(abs(det)>1e-10){vec3 T=(dp1*du2.y-dp2*du1.y)/det,B=(dp2*du1.x-dp1*du2.x)/det;T-=N*dot(N,T);B-=N*dot(N,B);if(dot(T,T)>1e-10&&dot(B,B)>1e-10){vec2 r=(d.rg*2.-1.)*.42;N=normalize(normalize(T)*r.x+normalize(B)*r.y+N*sqrt(max(.01,1.-dot(r,r))));}}
  }
 }
 vec2 bump=(norm.xy*2.-1.)*(crafted?0.:1.)*(golden?1.:skin?.035:foliage?.04:.19);if(an.y>an.x&&an.y>an.z)N=normalize(N+vec3(bump.x,0.,bump.y));else if(an.z>an.x)N=normalize(N+vec3(bump.x,bump.y,0.));else N=normalize(N+vec3(0.,bump.y,bump.x));
 if(surf>11.5&&surf<12.5){if(terrainEnabled>.5){vec4 ground=texture(terrainMap,(vWorld.xz+vec2(48.,55.))/96.);float grit=tex.r;vec3 grass=mix(vec3(.33,.40,.22),vec3(.49,.53,.32),ground.b);vec3 soil=mix(vec3(.51,.40,.29),vec3(.71,.61,.44),ground.b);pigment=mix(grass,soil,ground.r)*(.90+grit*.13);ao*=ground.g;rough=.94;}else pigment*=.80;}
 if(water){float wave=sin(vWorld.x*2.3+time*.75)*cos(vWorld.z*1.8-time*.48);N=normalize(N+vec3(sin(vWorld.z*3.+time)*.13,0.,cos(vWorld.x*2.+time)*.1));pigment=mix(vec3(.14,.30,.33),vec3(.32,.49,.47),wave*.5+.5);rough=.19;}
 bool canWet=surf>7.5&&!skin&&!foliage;float w=canWet?wetness*clamp(N.y*.65+.4,.1,1.):0.;rough=mix(rough,max(.19,rough*.34),w);pigment*=1.-w*.21;
 vec3 base=lin(pigment);float shade=0.;if(shadows&&!(surf>3.5&&surf<7.5)){vec3 s=vShadow.xyz/vShadow.w*.5+.5;if(all(greaterThan(s,vec3(0.)))&&all(lessThan(s,vec3(1.)))){float bias=max(.00055,.00105*(1.-dot(N,L)));shade=max(shadowValue(shadowTex,s,bias),shadowValue(dynamicShadow,s,bias));}}
 vec3 hemi=mix(groundColor,skyColor,clamp(N.y*.5+.5,0.,1.));vec3 lit=base*hemi*skyStrength*ao;lit+=brdf(base,N,V,L,rough,metal,sunColor*sunStrength*(1.-shade*.85));
 vec3 reflected=reflect(-V,N);vec3 f0=mix(vec3(.035),base,metal);lit+=mix(groundColor,skyColor,reflected.y*.5+.5)*f0*(1.-rough*.8)*skyStrength*.4;
 if(foliage)lit+=base*sunColor*max(0.,dot(-N,L))*.10*sunStrength;if(skin)lit+=base*vec3(.32,.17,.09)*pow(1.-max(0.,dot(N,V)),3.)*.17;
 if(surf<.5)lit+=base*skyColor*pow(1.-max(0.,dot(N,V)),3.)*.12;
 lit+=localLight(localPos0,localColor0,base,N,V,rough,metal)+localLight(localPos1,localColor1,base,N,V,rough,metal)+localLight(localPos2,localColor2,base,N,V,rough,metal)+localLight(localPos3,localColor3,base,N,V,rough,metal);
 if(surf>3.5&&surf<7.5)lit=lin(pigment)*2.0;
 float fog=1.-exp(-length(vWorld.xz-focus)*fogDensity*(.45+.55*exp(-max(0.,vWorld.y)*.15)));fog*=smoothstep(8.,35.,length(vWorld.xz-focus));lit=mix(lit,lin(fogColor),min(.84,fog));
 // RGB stores a bounded HDR encoding so this path does not require float color attachments.
 outColor=vec4(lit/(1.+lit),alpha);outNormal=vec4(N*.5+.5,1.);
}`;
const RDEPTH=`#version 300 es
precision highp float;void main(){}`;
const RPOSTV=`#version 300 es
precision highp float;out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const RPOSTF=`#version 300 es
precision highp float;in vec2 uv;out vec4 color;uniform sampler2D image;uniform sampler2D depth;uniform sampler2D normals;uniform vec2 texel;uniform float occlusion;uniform float portrait;uniform float bloom;uniform float exposure;
uniform sampler2D dioramaBlur;uniform float dioramaAmount;uniform float dioramaDebug;
${DIORAMA_FOCUS_GLSL}
vec3 decode(vec3 x){return x/max(vec3(.015),1.-x);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec3 c=decode(texture(image,uv).rgb);float d=texture(depth,uv).r;float occ=0.;float coc=0.;float dofCoverage=0.;
 if(dioramaAmount>0.){coc=dioramaCoC(uv,d);vec4 bokeh=texture(dioramaBlur,uv);dofCoverage=bokeh.a*dioramaAmount;c=mix(c,decode(bokeh.rgb),dofCoverage);}
 if(dioramaDebug>.5){color=vec4(mix(vec3(.12,.85,.32),coc>0.?vec3(.2,.45,1.):vec3(1.,.4,.15),abs(coc)),1.);return;}
 if(d<.9999){for(int k=0;k<8;k++){float a=float(k)*2.399963;float r=2.+float(k%4)*3.5;vec2 off=vec2(cos(a),sin(a))*r*texel;float delta=d-texture(depth,uv+off).r;occ+=smoothstep(.0002,.0024,delta)*(1.-smoothstep(.004,.016,delta));}c*=1.-occ*.060*occlusion*(1.-dofCoverage);}
 vec3 glow=vec3(0.);if(bloom>.01)for(int k=0;k<8;k++){float a=float(k)*2.399963;vec3 tap=decode(texture(image,uv+vec2(cos(a),sin(a))*(3.+float(k%3)*3.)*texel).rgb);glow+=max(vec3(0.),tap-.90);}c+=glow*bloom*.125;
 c=aces(c*exposure);c=pow(c,vec3(1./2.2));
 // The display resolve is the only tone map. Keep sharp-region edge AA;
 // blurred regions must not pick up full-resolution edges again.
 vec3 a=aces(decode(texture(image,uv+vec2(texel.x,0.)).rgb)*exposure),b=aces(decode(texture(image,uv-vec2(texel.x,0.)).rgb)*exposure);float contrast=length(a-b);if(contrast>.40)c=mix(c,pow((a+b)*.5,vec3(1./2.2)),.16*(1.-dofCoverage));
 c*=1.-dot(uv-.5,uv-.5)*.10*(1.-min(1.,portrait));color=vec4(c,portrait>1.5?(d<.9999?1.:0.):1.);
}`;
