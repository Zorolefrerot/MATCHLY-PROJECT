#!/usr/bin/env python3
"""Bake the inspected AI-generated monochrome sheet to 16 padded RGBA stamps.
No runtime generation/AI service. Pillow 11.3.0, one shared 1024² GPU atlas.
The source actually has 6 columns / 3 rows; crops below match its inspected layout.
"""
import hashlib, json, math
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT/'art_sources/combat/effects-sheet.png'
OUT = ROOT/'game/assets/vfx/combat'
OUT.mkdir(parents=True, exist_ok=True)
# Reorder the actual generated layout into a stable 4x4 runtime atlas.
CELLS = [('bird',0,0),('seal',1,0),('rocks',2,0),('palms',4,0),
 ('fist',0,1),('flower',1,1),('swarm',2,1),('wolf',3,1),
 ('shadows',4,1),('impact',5,1),('crescent',2,2),('petals',3,2),
 ('giant',0,2),('blades',1,2),('lightning',4,2),('wind',5,2)]
im=Image.open(SOURCE).convert('RGB')
atlas=Image.new('RGBA',(1024,1024))
for i,(name,col,row) in enumerate(CELLS):
 top,bottom=[(3,238),(250,493),(507,768)][row]
 tile=im.crop((round(col*im.width/6)+2,top,round((col+1)*im.width/6)-2,bottom)).resize((224,224),Image.Resampling.LANCZOS)
 sprite=Image.new('RGBA',(256,256))
 for y in range(224):
  for x in range(224):
   r,g,b=tile.getpixel((x,y)); light=(r+g+b)/3
   edge=min(1,min(x,y,223-x,223-y)/36)
   edge=edge*edge*(3-2*edge)
   radial=math.hypot((x-111.5)/125,(y-111.5)/135)
   fade=max(0,min(1,(1.08-radial)/.30))
   edge*=fade*fade*(3-2*fade)
   alpha=round(max(0,min(255,(light-9)*1.15))*edge)
   # White RGB + luminance alpha avoids squaring luminance during blending.
   sprite.putpixel((x+16,y+16),(255,255,255,alpha))
 atlas.paste(sprite,((i%4)*256,(i//4)*256))
path=OUT/'combat_atlas.png';atlas.save(path,optimize=True)
manifest={'source':str(SOURCE.relative_to(ROOT)),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'provenance':'AI-generated source, visually inspected; no external game screenshot',
 'output':'game/assets/vfx/combat/combat_atlas.png','output_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
 'bytes':path.stat().st_size,'size':[1024,1024],'cells':[x[0] for x in CELLS],'cell_size':256,'padding':16,'feather':36,'crop_rows':[[3,238],[250,493],[507,768]],'pillow':'11.3.0'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(path,manifest['bytes'])
