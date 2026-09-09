"""Original modal chamber/orchestral scores, sampled offline, deterministic masters.

Usage: python3 tools/audio/author_score.py --soundfont FONT --tsf DIRECTORY
Requires gcc, ffmpeg, numpy and scipy only while authoring (not npm build/client).
"""
import argparse, hashlib, json, math, subprocess, tempfile
from pathlib import Path
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

ROOT=Path(__file__).resolve().parents[2]
RATE=44100
# Degrees and durations in eighth notes: written phrases with rests and cadences.
A=[[(0,2),(2,1),(4,2),(2,1)],[(1,1),(3,1),(4,1),(3,2),(1,1)],
   [(2,2),(4,1),(5,1),(4,1),(2,1)],[(1,2),(0,1),(-1,1),(0,2)],
   [(4,2),(5,1),(7,2),(5,1)],[(4,1),(2,1),(1,1),(2,2),(4,1)],
   [(3,2),(2,1),(1,1),(-1,2)],[(0,3),(None,1),(0,1),(1,1)]]
B=[[(7,3),(6,1),(5,1),(4,1)],[(5,2),(7,1),(8,2),(7,1)],
   [(6,1),(5,1),(4,1),(3,2),(4,1)],[(5,3),(4,2),(None,1)],
   [(7,2),(9,1),(8,1),(7,1),(5,1)],[(6,2),(5,1),(4,2),(2,1)],
   [(3,1),(4,1),(5,1),(3,1),(2,1),(1,1)],[(0,4),(None,2)]]
ROAD=[[(4,3),(7,2),(6,1)],[(5,2),(4,1),(2,3)],[(3,2),(5,1),(7,2),(5,1)],
      [(4,2),(2,1),(1,2),(None,1)],[(2,2),(4,1),(6,3)],[(5,2),(3,1),(2,2),(1,1)],
      [(0,1),(2,1),(3,1),(1,2),(-1,1)],[(0,4),(None,2)]]
LEGACY=[[(0,3),(4,3)],[(5,2),(4,1),(2,2),(None,1)],[(3,4),(2,1),(1,1)],
        [(2,3),(0,2),(None,1)],[(4,3),(7,3)],[(6,2),(5,1),(4,3)],
        [(3,2),(1,2),(-1,2)],[(0,4),(None,2)]]
BATTLE=[[(0,1),(0,1),(4,1),(3,1),(2,2)],[(1,1),(2,1),(3,1),(4,2),(5,1)],
        [(4,2),(2,1),(5,2),(4,1)],[(3,1),(2,1),(1,1),(-1,2),(None,1)],
        [(7,2),(6,1),(4,2),(2,1)],[(5,1),(4,1),(3,1),(2,2),(0,1)],
        [(1,1),(3,1),(4,1),(3,1),(1,1),(-1,1)],[(0,3),(None,1),(4,1),(3,1)]]
TRACKS=[
 dict(id='hearth',title='風待ちの広場',mood='村 · 笛とハープ、弦が広がる祝祭',tonic=62,scale=[0,2,4,5,7,9,10],bpm=82,melody=A,chords=[0,6,3,0,5,3,6,0],level=.76),
 dict(id='road',title='遥かな丘を越えて',mood='旅路 · フィドル、ホルンと大きな弦の旋律',tonic=62,scale=[0,2,3,5,7,9,10],bpm=72,melody=ROAD,chords=[0,3,6,0,5,3,6,0],level=.94),
 dict(id='legacy',title='受け継がれる灯',mood='静謐 · ハープと低い笛から、弦の祈りへ',tonic=67,scale=[0,2,3,5,7,9,10],bpm=60,melody=LEGACY,chords=[0,5,3,6,0,3,6,0],level=.62),
 dict(id='battle',title='血脈の旗のもとに',mood='戦地 · 力強い拍動、フィドルと管弦の応答',tonic=64,scale=[0,2,3,5,7,8,10],bpm=98,melody=BATTLE,chords=[0,5,6,0,3,5,6,0],level=1.),
]

def compose(track):
 rng=np.random.default_rng(1701+TRACKS.index(track));events=[]
 eighth=60/(track['bpm']*3);bar=6*eighth
 def degree(d):return track['tonic']+track['scale'][d%7]+12*(d//7)
 def cc(ch,key,value,t=0):events.append((t,3,ch,key,int(value)))
 def note(ch,key,start,dur,vel):
  vel=int(np.clip(vel+rng.uniform(-4,4),1,115));start=max(0,start+rng.uniform(-.006,.006))
  events.extend([(start,1,ch,int(key),vel),(start+max(.035,dur),0,ch,int(key),0)])
 # Whistle/flute, harp, solo violin, strings, cello, horns, low strings, choir, pipes.
 for ch,program,vol,pan in [(0,73,100,70),(1,46,83,39),(2,40,70,88),(3,48,70,40),(4,42,79,80),(5,60,57,54),(6,43,80,64),(7,52,40,83),(8,109,30,24),(9,0,68,64)]:
  events.append((0,2,ch,program,0));cc(ch,7,vol);cc(ch,10,pan)
  cc(ch,91,0);cc(ch,93,0)
 sections=[('intro',4,.38),('A',8,.62),('answer',8,.73),('B',8,.96),('bridge',8,.55),('return',8,1.),('coda',4,.44)]
 cues=[];b=0
 for section,bars,strength in sections:
  cues.append({'section':section,'time':round(b*bar,3)})
  for j in range(bars):
   t=b*bar;root=([3,5,6,0][j] if section=='coda' else track['chords'][j%8]);chord=[degree(root-14),degree(root-12),degree(root-10)]
   e=strength*track['level'];grand=section in ['B','return'];quiet=track['id']=='legacy'
   # Broken harp, open fifth bass and inner chord voices. Stagger attacks by milliseconds.
   pattern=[0,1,2,1,3,2] if (j%2==0) else [0,2,1,3,2,1]
   harp=[chord[0]+24,chord[1]+24,chord[2]+24,degree(root+7)]
   for k,v in enumerate(pattern):note(1,harp[v],t+k*eighth,eighth*1.75,42+e*26+(k%3==0)*8)
   for k,n in enumerate(chord):
    note(3,n+12,t+k*.018,bar*.97,28+e*34)
   # Slow expression arches add a bow-like swell rather than constant organ sustain.
   for offset,expr in [(0,57+e*20),(.28,78+e*20),(.82,60+e*24)]:cc(3,11,expr,t+offset*bar)
   note(6,chord[0],t,bar*.94,42+e*20)
   note(4,chord[0]+12,t+bar*.50,bar*.44,30+e*24)
   if section!='intro' and section!='coda':
    phrase=(B[j%8] if grand else track['melody'][j%8])
    if track['id']=='battle' and grand:phrase=[(d+7 if d is not None else None,v) for d,v in track['melody'][j%8]]
    if section=='bridge':phrase=[(d,du) for d,du in LEGACY[(j+2)%8]]
    lead=2 if section in ['answer','bridge'] and not quiet else 0
    offset=0
    for idx,(d,dur) in enumerate(phrase):
     if d is not None:
      n=degree(d);length=eighth*dur*(.87 if lead==2 else .83)
      if idx==0 and j%4==2 and not quiet:
       note(lead,degree(d+1),t+offset*eighth,.055,49+e*16)
       delay=.056
      else:delay=0
      note(lead,n,t+offset*eighth+delay,max(.06,length-delay),53+e*27)
      if grand:note(2 if lead==0 else 0,n-12 if n>76 else n,t+offset*eighth+.022,length,31+e*22)
     offset+=dur
   elif section=='intro' and j>=2:
    note(0,degree([0,4][j-2]),t,bar*.75,48)
   elif section=='coda':
    note(0,degree([4,2,1,0][j]),t,bar*.72,44-j*3)
   # Horns answer a phrase with broad chord tones; full ensemble arrives gradually.
   if grand:
    for n in [chord[0]+24,chord[1]+12]:note(5,n,t+(0 if j%2==0 else bar*.50),bar*(.92 if j%2==0 else .44),35+e*23)
    if track['id'] in ['road','battle']:
     for n in [chord[0]+24,chord[2]+12]:note(7,n,t+.08,bar*.88,27+e*16)
   if track['id']=='road' and section=='bridge' and j in [0,4]:
    note(8,degree(-7),t,bar*3.8,28)
   # Frame-drum character: deep and edge strokes, with restrained hand percussion.
   drum=not quiet and section not in ['intro','coda','bridge']
   if drum:
    for beat,drum_key,vel in [(0,41,51),(3,43,43),(2.5,37,23),(5,37,29)]:note(9,drum_key,t+beat*eighth,.20,(vel+e*19))
    if grand:
     note(9,36,t,.23,58+e*15)
     for beat in [1,2,4,5]:note(9,70,t+beat*eighth,.10,25+e*12)
     if j%4==3:
      for beat,key in [(4,45),(4.5,43),(5,41),(5.5,43)]:note(9,key,t+beat*eighth,.17,40+e*15)
   if grand and j in [0,4]:note(9,49,t,.9,40)
   b+=1
 duration=b*bar+2.4
 # Event ordering places controller/program initialization ahead of notes at time zero.
 events.sort(key=lambda e:(e[0],0 if e[1] in [2,3] else e[1]+1))
 return duration,events,cues

def master(raw,duration):
 x=np.fromfile(raw,dtype=np.float32).reshape(-1,2).astype(np.float64)
 x=sosfilt(butter(2,40,fs=RATE,btype='highpass',output='sos'),x,axis=0)
 rng=np.random.default_rng(212);n=int(RATE*1.65);t=np.arange(n)/RATE
 for channel in range(2):
  ir=rng.normal(0,1,n)*np.exp(-t*4.1)*.002
  ir[:int(RATE*.026)]=0
  ir=sosfilt(butter(2,5200,fs=RATE,output='sos'),ir)
  for delay,gain in [(.031,.11),(.053,.085),(.081,.06),(.117,.042)]:ir[int((delay+channel*.004)*RATE)]+=gain
  x[:,channel]+=.52*fftconvolve(x[:,1-channel].copy(),ir)[:len(x)]
 x[:int(RATE*.018)]*=np.linspace(0,1,int(RATE*.018))[:,None]
 x[-int(RATE*1.4):]*=np.linspace(1,0,int(RATE*1.4))[:,None]**1.5
 peak=np.max(np.abs(x));x*=min(5,.82/max(.0001,peak))
 return x.astype(np.float32)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--soundfont',type=Path,required=True);ap.add_argument('--tsf',type=Path,required=True);args=ap.parse_args()
 out=ROOT/'public/assets/music';out.mkdir(parents=True,exist_ok=True);metadata=[]
 with tempfile.TemporaryDirectory(prefix='bloodline-score-') as tmp:
  tmp=Path(tmp);binary=tmp/'render_score'
  subprocess.run(['gcc','-O2','-I',str(args.tsf),str(ROOT/'tools/audio/render_score.c'),'-lm','-o',str(binary)],check=True)
  for track in TRACKS:
   duration,events,cues=compose(track);event_file=tmp/(track['id']+'.events');raw=tmp/'score.f32';mix=tmp/'master.f32'
   event_file.write_text(str(duration)+'\n'+'\n'.join(' '.join(map(str,e)) for e in events))
   subprocess.run([str(binary),str(args.soundfont),str(event_file),str(raw)],check=True)
   x=master(raw,duration);x.tofile(mix)
   mp3=out/(track['id']+'.mp3')
   subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','f32le','-ar',str(RATE),'-ac','2','-i',str(mix),'-af','loudnorm=I=-19:TP=-1.5:LRA=11','-ar',str(RATE),'-c:a','libmp3lame','-b:a','128k',str(mp3)],check=True)
   metadata.append({k:track[k] for k in ['id','title','mood','bpm'] }|{'file':mp3.name,'duration':round(duration,3),'sections':cues,'bytes':mp3.stat().st_size,'sha256':hashlib.sha256(mp3.read_bytes()).hexdigest()})
   print(track['id'],round(duration,1),'seconds',mp3.stat().st_size,'bytes',flush=True)
 manifest={'version':1,'composer':'Bloodline Legacy original score','source':'Original written modal phrases and arrangement; GeneralUser GS 2.0.3 instrument samples','sampleRate':RATE,'channels':2,'codec':'MP3 128 kbps','tracks':metadata}
 (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':main()
