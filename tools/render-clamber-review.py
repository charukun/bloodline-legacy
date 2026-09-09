"""Review real runtime geometry/palettes in EGL. This is not browser verification."""
import argparse, importlib.util, sys
from pathlib import Path
from PIL import Image, ImageDraw
sys.path.insert(0,str(Path(__file__).parent))
spec=importlib.util.spec_from_file_location('motion_render',Path(__file__).with_name('render-character-motion.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=argparse.ArgumentParser();p.add_argument('directory');args=p.parse_args();out=Path(args.directory)
sheet=Image.new('RGB',(6*250,3*285),'#242c29');d=ImageDraw.Draw(sheet)
for row,scenario in enumerate(['clamber','vault','ledge']):
 r=m.Render(out/(scenario+'.json'),'-',size=350)
 for col,u in enumerate([0,.15,.3,.45,.68,.92]):
  frames=r.cap['frames'];i=min(range(len(frames)),key=lambda i:abs((frames[i]['p'].get('traversal') or {}).get('progress',-1)-u))
  sheet.paste(r.render(i,yaw=1.5,pitch=.2,height=4.8).resize((250,250)),(col*250,row*285))
  d.text((col*250+5,row*285+254),f'{scenario}  {u:.0%}',fill='white')
sheet.save(out/'review.jpg')
