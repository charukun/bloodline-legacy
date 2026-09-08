/* Stylized metallic/roughness pipeline. All lighting is linear until display resolve.
 * The atlas contains authored color variation, roughness, tangent detail and AO.
 * Four nearest local lights. One cached sun shadow + one moving-actor shadow. */
const RVERT=`#version 300 es
precision highp float;
layout(location=0) in vec3 pos;layout(location=1) in vec3 nor;
layout(location=2) in mat4 model;layout(location=6) in vec4 ink;layout(location=7) in float surface;
uniform mat4 vp;uniform mat4 lightVP;uniform float time;uniform float wind;
out vec3 vWorld;out vec3 vNormal;out vec4 vInk;out float vSurface;out vec4 vShadow;out vec3 vLocal;
void main(){vec4 w=model*vec4(pos,1.);if(surface>12.5&&surface<13.5){float bend=max(0.,pos.y+.35);w.x+=sin(time*1.8+w.z*.72+model[3].x)*.042*bend*wind;w.z+=cos(time*1.1+w.x*.43)*.028*bend*wind;}vWorld=w.xyz;vNormal=normalize(mat3(model)*(nor/max(vec3(.00001),vec3(dot(model[0].xyz,model[0].xyz),dot(model[1].xyz,model[1].xyz),dot(model[2].xyz,model[2].xyz)))));vInk=ink;vSurface=surface;vShadow=lightVP*w;vLocal=pos;gl_Position=vp*w;}`;
const RFRAG=`#version 300 es
precision highp float;
in vec3 vWorld;in vec3 vNormal;in vec4 vInk;in float vSurface;in vec4 vShadow;in vec3 vLocal;
uniform sampler2D shadowTex;uniform sampler2D dynamicShadow;uniform sampler2D materialAtlas;uniform sampler2D detailAtlas;uniform sampler2D terrainMap;
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
float shadowValue(sampler2D map,vec3 p,float bias){vec2 t=1./vec2(textureSize(map,0));float s=0.;for(int i=0;i<4;i++){vec2 o=vec2((i&1)==0?-.9:.9,(i&2)==0?-.9:.9);s+=step(texture(map,p.xy+o*t*1.35).r,p.z-bias);}return s*.25;}
vec3 brdf(vec3 base,vec3 N,vec3 V,vec3 L,float rough,float metal,vec3 radiance){vec3 H=normalize(V+L);float nl=max(dot(N,L),0.),nv=max(dot(N,V),.08),nh=max(dot(N,H),0.),vh=max(dot(V,H),0.);float a=rough*rough,a2=a*a;float d=a2/(PI*pow(nh*nh*(a2-1.)+1.,2.)+.0001);float k=pow(rough+1.,2.)*.125;float g=(nv/(nv*(1.-k)+k))*(nl/(nl*(1.-k)+k));vec3 f0=mix(vec3(.035),base,metal);vec3 F=f0+(1.-f0)*pow(1.-vh,5.);return ((1.-F)*(1.-metal)*base/PI+d*g*F/max(.1,4.*nv*max(nl,.01)))*radiance*nl;}
vec3 localLight(vec3 p,vec3 intensity,vec3 base,vec3 N,vec3 V,float rough,float metal){vec3 delta=p-vWorld;float d=length(delta),atten=pow(max(0.,1.-d/7.5),2.)/(1.+d*d*.12);return brdf(base,N,V,delta/max(.01,d),rough,metal,intensity*atten);}
void main(){vec3 N=normalize(vNormal),L=normalize(vec3(-.48,.85,.42)),V=normalize(eye-vWorld);float surf=vSurface,alpha=vInk.a;vec3 pigment=vInk.rgb;
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
 uv=fract(uv*tile);vec2 auv=(vec2(mod(slot,4.),floor(slot/4.))+(.025+uv*.95))*.25;vec4 tex=texture(materialAtlas,auv);vec4 norm=texture(detailAtlas,auv);pigment*=mix(.72,1.18,tex.r);rough=clamp(rough*mix(.80,1.1,tex.a),.12,1.);ao=mix(.78,1.,norm.a);
 vec2 bump=(norm.xy*2.-1.)*(skin?.035:foliage?.04:.19);if(an.y>an.x&&an.y>an.z)N=normalize(N+vec3(bump.x,0.,bump.y));else if(an.z>an.x)N=normalize(N+vec3(bump.x,bump.y,0.));else N=normalize(N+vec3(0.,bump.y,bump.x));
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
void main(){vec3 c=decode(texture(image,uv).rgb);float d=texture(depth,uv).r;float occ=0.;float coc=0.;
 if(dioramaAmount>0.){coc=dioramaCoC(uv,d);c=mix(c,decode(texture(dioramaBlur,uv).rgb),abs(coc)*dioramaAmount);}
 if(dioramaDebug>.5){color=vec4(mix(vec3(.12,.85,.32),coc>0.?vec3(.2,.45,1.):vec3(1.,.4,.15),abs(coc)),1.);return;}
 if(d<.9999){for(int k=0;k<8;k++){float a=float(k)*2.399963;float r=2.+float(k%4)*3.5;vec2 off=vec2(cos(a),sin(a))*r*texel;float delta=d-texture(depth,uv+off).r;occ+=smoothstep(.0002,.0024,delta)*(1.-smoothstep(.004,.016,delta));}c*=1.-occ*.060*occlusion*(1.-abs(coc)*dioramaAmount);}
 vec3 glow=vec3(0.);if(bloom>.01)for(int k=0;k<8;k++){float a=float(k)*2.399963;vec3 tap=decode(texture(image,uv+vec2(cos(a),sin(a))*(3.+float(k%3)*3.)*texel).rgb);glow+=max(vec3(0.),tap-.90);}c+=glow*bloom*.125;
 c=aces(c*exposure);c=pow(c,vec3(1./2.2));
 // The display resolve is the only tone map. Keep sharp-region edge AA;
 // blurred regions must not pick up full-resolution edges again.
 vec3 a=aces(decode(texture(image,uv+vec2(texel.x,0.)).rgb)*exposure),b=aces(decode(texture(image,uv-vec2(texel.x,0.)).rgb)*exposure);float contrast=length(a-b);if(contrast>.40)c=mix(c,pow((a+b)*.5,vec3(1./2.2)),.16*(1.-abs(coc)*dioramaAmount));
 c*=1.-dot(uv-.5,uv-.5)*.10*(1.-min(1.,portrait));color=vec4(c,portrait>1.5?(d<.9999?1.:0.):1.);
}`;
