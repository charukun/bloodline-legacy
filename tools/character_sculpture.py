"""Reference-directed surface authoring; no runtime cost or additional materials."""
import math
import numpy as np
from scipy.interpolate import PchipInterpolator

def unit(x):return x/max(np.linalg.norm(x),1e-9)
def surface(m,fn,tile,weights,region,name,nu=15,nv=12,color=None,closed=False):
 nu=m.steps(nu,5);nv=m.steps(nv,6);verts=[];normals=[];uv=[];faces=[];eps=1e-4
 for j in range(nu+1):
  u=j/nu
  for i in range(nv+1):
   v=i/nv;p=fn(u,v);du=fn(min(1,u+eps),v)-fn(max(0,u-eps),v);dv=fn(u,v+eps)-fn(u,v-eps)
   verts.append(p);normals.append(unit(np.cross(dv,du)));uv.append((v,u))
 for j in range(nu):
  for i in range(nv):
   a=j*(nv+1)+i;b=a+nv+1;faces.extend([[a,a+1,b],[a+1,b+1,b]])
 if closed:
  for j,flip in [(0,False),(nu,True)]:
   k=len(verts);pts=np.array(verts[j*(nv+1):(j+1)*(nv+1)]);verts.append(pts[:-1].mean(axis=0));uv.append((.5,j/nu));normals.append(unit(np.array(normals[j*(nv+1):(j+1)*(nv+1)]).sum(axis=0)))
   for i in range(nv):
    a=j*(nv+1)+i;faces.append([k,a+1,a] if flip else [k,a,a+1])
 m.add(verts,faces,uv,tile,weights,region,color,name,normals=np.array(normals))

def hair_lock(m,points,widths,name,outward=(0,0,1),tone=.98,depth=.032):
 points=np.array(points);w=PchipInterpolator([0,.35,.72,1],widths);ref=unit(np.array(outward,float))
 def fn(t,v):
  s=1-t;c=s**3*points[0]+3*s*s*t*points[1]+3*s*t*t*points[2]+t**3*points[3]
  tangent=unit(3*s*s*(points[1]-points[0])+6*s*t*(points[2]-points[1])+3*t*t*(points[3]-points[2]))
  side=unit(np.cross(tangent,ref));out=unit(np.cross(side,tangent));phi=v*math.tau;envelope=max(.015,math.sin(math.pi*(.05+.95*t)))**.65
  ridge=.0035*math.cos(math.cos(phi)*math.pi*3+.5*t)*max(0,math.sin(phi))**2*envelope
  return c+side*float(w(t))*math.cos(phi)+out*(depth*envelope*math.sin(phi)+ridge)
 surface(m,fn,1,{'head':.94,'hair':.06},1,name,nu=15,nv=11,color=[tone]*3,closed=True)

def hair(m):
 # Crown flow branches from the right-hand part and sweeps across the forehead.
 locks=[([[0.1, 2.762, 0.1], [-0.02875, 2.8995, 0.3035], [-0.2435, 2.7495, 0.37], [-0.353, 2.781, 0.24]],
   [0.022, 0.11, 0.067, 0.001]),
  ([[0.0905, 2.76375, 0.18], [0.05525, 2.6965, 0.4405], [-0.172, 2.6545, 0.457], [-0.2585, 2.6515, 0.37]],
   [0.019, 0.104, 0.075, 0.001]),
  ([[0.053, 2.7405, 0.2], [-0.0955, 2.689, 0.437], [-0.29, 2.569, 0.4165], [-0.386, 2.6505, 0.28]],
   [0.018, 0.08, 0.064, 0.001]),
  ([[-0.0965, 2.6765, 0.27], [-0.2155, 2.5655, 0.4365], [-0.3305, 2.459, 0.36], [-0.4265, 2.534, 0.23]],
   [0.018, 0.077, 0.062, 0.001]),
  ([[-0.213, 2.5865, 0.25], [-0.3355, 2.489, 0.337], [-0.3505, 2.3725, 0.3], [-0.46, 2.4205, 0.18]],
   [0.02, 0.079, 0.058, 0.001]),
  ([[-0.27, 2.46, 0.2], [-0.37, 2.4, 0.28], [-0.32, 2.26, 0.24], [-0.43, 2.3, 0.1]], [0.018, 0.066, 0.05, 0.001]),
  ([[0.12, 2.74, 0.15], [0.18, 2.71, 0.42], [0.12, 2.47, 0.43], [0.045, 2.445, 0.34]], [0.021, 0.073, 0.061, 0.001]),
  ([[0.11, 2.7, 0.24], [0.08, 2.6, 0.42], [0.01, 2.43, 0.41], [-0.07, 2.425, 0.31]], [0.017, 0.059, 0.046, 0.001]),
  ([[-0.04, 2.66, 0.29], [-0.03, 2.57, 0.42], [-0.14, 2.41, 0.38], [-0.23, 2.445, 0.28]],
   [0.016, 0.066, 0.04, 0.001]),
  ([[0.16, 2.7735, 0.11], [0.3395, 2.8035, 0.2535], [0.3525, 2.589, 0.307], [0.46, 2.6635, 0.14]],
   [0.02, 0.09, 0.061, 0.001]),
  ([[0.19, 2.72, 0.18], [0.2865, 2.67, 0.36], [0.2265, 2.4485, 0.35], [0.3205, 2.4275, 0.23]],
   [0.018, 0.076, 0.05, 0.001]),
  ([[0.28, 2.61, 0.18], [0.37, 2.55, 0.29], [0.32, 2.38, 0.26], [0.43, 2.42, 0.1]], [0.02, 0.07, 0.045, 0.001]),
  ([[0.33, 2.47, 0.12], [0.4, 2.39, 0.19], [0.31, 2.29, 0.17], [0.41, 2.29, 0.02]], [0.018, 0.058, 0.041, 0.001]),
  ([[0.08, 2.77, 0.01], [0.19, 2.94, 0.08], [0.08, 3.0, 0.13], [-0.03, 2.93, 0.14]], [0.023, 0.049, 0.032, 0.001]),
  ([[0.13, 2.75, -0.01], [0.27, 2.86, 0.07], [0.34, 2.83, 0.11], [0.37, 2.84, 0.05]], [0.019, 0.051, 0.031, 0.001]),
  ([[-0.01, 2.79, 0.02], [-0.19, 2.88, 0.12], [-0.27, 2.8, 0.2], [-0.39, 2.83, 0.1]], [0.019, 0.068, 0.042, 0.001])]
 for i,(p,w) in enumerate(locks):
  hair_lock(m,p,[x*.83 for x in w],'sculpture fringe '+str(i),tone=.92+(i%4)*.025,depth=.020 if i in [6,7,8] else .025)
  if i<13 and not m.lod:
   p=np.array(p,float);p[0]+=[0,.004,0];p[1]+=[-.022,.009,.025];p[2]+=[-.018,.006,.026];p[3]+=[-.017,.028,.008]
   hair_lock(m,p,[x*.31 for x in w],'sculpture split strand '+str(i),tone=1,depth=.010)
 # Short lower tier and crown tier overlap, with visible irregular nape tips.
 for i in range(11):
  a=.95+i*(math.tau-1.90)/10;n=np.array([math.sin(a),.12,math.cos(a)])
  root=[.045*math.sin(a-.20),2.83,-.04+.040*math.cos(a-.20)]
  mid=[.33*math.sin(a-.10),2.82,-.05+.30*math.cos(a-.10)]
  lower=[.42*math.sin(a),2.40,-.05+.34*math.cos(a)]
  tip=[.48*math.sin(a+.10),2.43+.035*math.sin(i*2),-.06+.38*math.cos(a+.10)]
  hair_lock(m,[root,mid,lower,tip],[.018,.080,.072,.001],'sculpture crown '+str(i),n,tone=.91+(i%3)*.025,depth=.026)
  if i%2==0:
   p0=np.array(mid)*.5+np.array(lower)*.5;p1=np.array(lower)+[0,.03,0];p2=np.array(lower)+[0,-.24,0];p3=np.array(tip)+[0,-.20,0]
   hair_lock(m,[p0,p1,p2,p3],[.020,.064,.046,.001],'sculpture nape '+str(i),n,tone=.91,depth=.022)

def garments(m,body_w,blend_y):
 # The broad scarf is a continuous draped loop with a raised rim, not separate
 # flat triangular patches. Front folds descend diagonally toward the clasp.
 def scarf(t,a):
  angle=a*math.tau;front=max(0,math.cos(angle));y=2.045-.24*t-.067*front*math.sin(t*math.pi/2)+.024*math.sin(angle)
  radius=.193+.044*math.sin(t*math.pi)+.018*math.sin(t*math.pi*3+.4*math.sin(angle))
  return np.array([math.sin(angle)*radius,y,.025+math.cos(angle)*(radius+.035+.037*t)])
 surface(m,scarf,11,'chest',0,'draped scarf loop',nu=13,nv=30,closed=False)
 for edge in [0,1]:
  points=[scarf(edge,a/24) for a in range(25)]
  m.sweep(points,[.009]*25,[.007]*25,11,'chest',rings=28,sides=6,name='scarf rolled seam')
 def tail(u,v):
  return (.085+u*.07+.03*v,1.865-.225*v,.229+.029*math.sin(v*math.pi)+.010*math.sin(u*math.pi*3))
 m.patch(tail,11,body_w,nu=10,nv=9,name='tucked scarf tail')
 # Broad diagonal leather straps are flat on the torso, with rounded edges.
 for points in [[(-.27,1.82,.15),(-.21,1.71,.24),(.035,1.49,.226),(.14,1.43,.208)],[(.23,1.84,.13),(.14,1.63,.252),(-.045,1.43,.228),(-.22,1.29,.196)]]:
  m.sweep(points,[.043,.044,.041,.031],[.008]*4,4,body_w,rings=17,sides=6,name='broad leather shoulder strap')
 # Cloak wraps around the shoulders, then opens beside the left leg.
 def cape(u,v):
  angle=.96+u*(math.tau-1.92);width=.17+.49*(1-math.exp(-v*9))-.08*v
  x=math.sin(angle)*width-.17*v*v;y=2.015-v*(1.10-.28*math.sin(angle))
  z=-.015+math.cos(angle)*(.155+.20*(1-math.exp(-v*8))+.045*math.sin(v*math.pi))
  fold=.023*math.sin(angle*5+v*.8)*math.sin(v*math.pi*.8)
  return np.array([x+fold*math.sin(angle),y,z+fold*math.cos(angle)])
 cw=lambda p:blend_y(p[1],[(1.22,'mantle.tip'),(1.70,'mantle'),(1.94,'chest')])
 m.patch(cape,3,cw,nu=26,nv=17,name='wrapped travelling cloak')
 def lining(u,v):
  angle=.96+u*(math.tau-1.92)
  return cape(u,v)-.012*np.array([math.sin(angle),0,math.cos(angle)])
 m.patch(lining,3,cw,nu=26,nv=17,name='cloak lining',color=[.83]*3,inward=True)
 for side in [0,1]:
  points=[cape(side,i/16) for i in range(17)];m.sweep(points,[.008]*17,[.006]*17,12,cw,rings=19,sides=6,name='cloak opening welt')
 points=[cape(i/24,1) for i in range(25)];m.sweep(points,[.009]*25,[.006]*25,12,cw,rings=28,sides=6,name='cloak hem welt')
 for side in [-1,1]:
  m.sweep([(side*.09,2.02,.09),(side*.19,1.975,.17),(side*.36,1.89,.145),(side*.45,1.79,.015)],[.036,.067,.073,.021],[.028,.042,.047,.014],3,'chest',rings=18,sides=12,name='folded cloak shoulder')
 m.oval((-.12,1.925,.270),.054,.059,.016,6,'chest',name='brass cloak clasp')
 m.oval((-.12,1.925,.288),.041,.045,.012,6,'chest',name='raised clasp face')

 # Fold that carries the clasp over the shoulder and onto the chest.
 def front_fold(u,v):
  return (-.40+u*.36+.10*v,1.975-.08*u-.17*v,.136+.099*u+.032*math.sin(v*math.pi)+.030*v)
 m.patch(front_fold,3,'chest',nu=16,nv=9,name='front cloak drape')
 m.sweep([front_fold(i/12,1) for i in range(13)],[.005]*13,[.004]*13,12,'chest',rings=15,sides=6,name='front cloak stitch welt')
