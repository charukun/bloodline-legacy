// Offline, deterministic, short-range visibility bake. No runtime dependency.
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <vector>
using V=std::array<float,3>;
V add(V a,V b){return {a[0]+b[0],a[1]+b[1],a[2]+b[2]};}
V sub(V a,V b){return {a[0]-b[0],a[1]-b[1],a[2]-b[2]};}
V mul(V a,float b){return {a[0]*b,a[1]*b,a[2]*b};}
float dot(V a,V b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
V cross(V a,V b){return {a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]};}
V norm(V a){return mul(a,1/std::max(1e-8f,std::sqrt(dot(a,a))));}
struct Node {V lo,hi;int left=-1,right=-1,start=0,count=0;};
std::vector<V> positions,normals,centres;std::vector<std::array<uint32_t,3>> faces;std::vector<int> order;std::vector<Node> nodes;
int build(int first,int last){
 Node b;b.lo={1e9f,1e9f,1e9f};b.hi={-1e9f,-1e9f,-1e9f};
 for(int j=first;j<last;j++)for(int i:faces[order[j]])for(int k=0;k<3;k++){b.lo[k]=std::min(b.lo[k],positions[i][k]);b.hi[k]=std::max(b.hi[k],positions[i][k]);}
 int at=nodes.size();nodes.push_back(b);
 if(last-first<=8){nodes[at].start=first;nodes[at].count=last-first;return at;}
 V extent=sub(b.hi,b.lo);int axis=std::max_element(extent.begin(),extent.end())-extent.begin(),mid=(first+last)/2;
 std::nth_element(order.begin()+first,order.begin()+mid,order.begin()+last,[axis](int a,int b){return centres[a][axis]<centres[b][axis];});
 int left=build(first,mid),right=build(mid,last);nodes[at].left=left;nodes[at].right=right;return at;
}
bool box(const Node& n,V o,V d,float limit){float near=0,far=limit;for(int k=0;k<3;k++){if(std::abs(d[k])<1e-8f){if(o[k]<n.lo[k]||o[k]>n.hi[k])return false;continue;}float a=(n.lo[k]-o[k])/d[k],b=(n.hi[k]-o[k])/d[k];near=std::max(near,std::min(a,b));far=std::min(far,std::max(a,b));if(near>far)return false;}return true;}
float ray(V o,V d,int vertex){
 float hit=.14f;int stack[64],top=0;stack[top++]=0;
 while(top){const Node& n=nodes[stack[--top]];if(!box(n,o,d,hit))continue;if(!n.count){stack[top++]=n.left;stack[top++]=n.right;continue;}
  for(int j=n.start;j<n.start+n.count;j++){auto f=faces[order[j]];if(int(f[0])==vertex||int(f[1])==vertex||int(f[2])==vertex)continue;
   V a=positions[f[0]],e1=sub(positions[f[1]],a),e2=sub(positions[f[2]],a),p=cross(d,e2);float det=dot(e1,p);if(std::abs(det)<1e-8f)continue;
   float inv=1/det;V t=sub(o,a);float u=dot(t,p)*inv;if(u<0||u>1)continue;V q=cross(t,e1);float v=dot(d,q)*inv;if(v<0||u+v>1)continue;float distance=dot(e2,q)*inv;if(distance>.0001f&&distance<hit)hit=distance;
  }
 }return hit;
}
int main(){
 uint32_t nv,nf;std::cin.read((char*)&nv,4);std::cin.read((char*)&nf,4);if(!std::cin||nv>100000||nf>200000)return 1;
 positions.resize(nv);normals.resize(nv);faces.resize(nf);std::cin.read((char*)positions.data(),nv*12);std::cin.read((char*)normals.data(),nv*12);std::cin.read((char*)faces.data(),nf*12);if(!std::cin)return 2;
 for(auto f:faces)centres.push_back(mul(add(add(positions[f[0]],positions[f[1]]),positions[f[2]]),1.f/3));order.resize(nf);std::iota(order.begin(),order.end(),0);nodes.reserve(nf/3);build(0,nf);
 std::vector<float> ao(nv,1);
 for(uint32_t i=0;i<nv;i++){V n=norm(normals[i]),u=norm(cross(n,std::abs(n[1])<.9?V{0,1,0}:V{1,0,0})),v=cross(n,u),origin=add(positions[i],mul(n,.004f));float occ=0;
  for(int j=0;j<24;j++){float t=(j+.5f)/24,r=std::sqrt(t),theta=6.28318530718f*j*.61803398875f;V d=add(mul(n,std::sqrt(1-t)),add(mul(u,r*std::cos(theta)),mul(v,r*std::sin(theta))));occ+=std::max(0.f,1-ray(origin,d,i)/.14f);}
  ao[i]=1-.48f*occ/24;
 }
 std::cout.write((char*)ao.data(),nv*4);
}
