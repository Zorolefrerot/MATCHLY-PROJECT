#!/usr/bin/env python3
"""Reproducible mobile textures from owner references; requires Pillow 11.3.0.
Sources remain outside game/. No online service, no AI image generation.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageStat
import hashlib, json, random
ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / 'art_sources/konoha'
OUT = ROOT / 'game/assets/konoha'
OUT.mkdir(parents=True, exist_ok=True)
NAMES = ['images (74).jpeg', 'which-hokage-stone-face-must-have-been-the-hardest-and-v0-f4iawydex35f1.png', 'which-is-more-iconic-v0-5mbvcs0b35md1.jpg']
palace, cliff, house = [Image.open(SOURCES/n).convert('RGB') for n in NAMES]
rng = random.Random(83021)
outputs = []
def palette(image, rect):
    return tuple(round(v) for v in ImageStat.Stat(image.crop(rect)).median)
def clamp(v): return max(0,min(255,round(v)))
def surface(color, size=512, variation=9):
    coarse = Image.new('L',(17,17)); coarse.putdata([rng.randrange(70,185) for _ in range(289)])
    coarse = coarse.resize((size,size),Image.Resampling.BICUBIC)
    result = Image.new('RGB',(size,size))
    result.putdata([tuple(clamp(c+(v-128)*variation/55+rng.uniform(-2,2)) for c in color) for v in coarse.getdata()])
    # Opposite edges match when the texture repeats around a rounded wall.
    pixels=result.load()
    for k in range(size):
        c=tuple((pixels[0,k][i]+pixels[size-1,k][i])//2 for i in range(3));pixels[0,k]=pixels[size-1,k]=c
        c=tuple((pixels[k,0][i]+pixels[k,size-1][i])//2 for i in range(3));pixels[k,0]=pixels[k,size-1]=c
    return result

def save(image, name, description):
    path=OUT/(name+'.png');image.save(path,optimize=True)
    # Explicit Godot import settings: shared lossless textures with mipmaps.
    resource='res://assets/konoha/'+path.name
    imported='res://.godot/imported/'+path.name+'-'+hashlib.md5(resource.encode()).hexdigest()+'.ctex'
    path.with_suffix('.png.import').write_text(f'''[remap]
importer="texture"
type="CompressedTexture2D"
path="{imported}"
metadata={{"vram_texture": false}}

[deps]
source_file="{resource}"
dest_files=PackedStringArray("{imported}")

[params]
compress/mode=0
mipmaps/generate=true
process/fix_alpha_border=true
detect_3d/compress_to=0
''')
    outputs.append(dict(file=path.name,size=image.size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),description=description))

plaster_color=palette(house,(187,238,233,276))
plaster=surface(plaster_color)
# Fine weathering sampled from an actual unwindowed wall patch in the reference.
patch=house.crop((187,238,233,276)).resize((512,512),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
plaster=Image.blend(plaster,patch,.20)
d=ImageDraw.Draw(plaster,'RGBA')
for i in range(70):
    x,y=rng.randrange(512),rng.randrange(512)
    d.line([(x,y),(x+3,y+9),(x-2,y+17)],fill=(65,59,40,22),width=1)
save(plaster,'plaster','Wall palette and subtle surface detail sampled from the provided house; restrained procedural weathering.')
red=surface(palette(palace,(323,258,440,302)),256,5)
save(red,'palace_red','Red plaster sampled from the provided Hokage residence.')
stone=surface(palette(cliff,(8,131,30,185)),256,12)
save(stone,'stone','Stone palette from the provided cliff; procedural low-frequency grain.')
for name,color in [('roof_tiles',palette(house,(195,181,265,209))),('roof_gold',palette(palace,(408,213,465,226)))]:
    roof=surface(color,512,13); d=ImageDraw.Draw(roof,'RGBA')
    # Broad grooves remain readable on mobile; no per-tile geometry.
    for y in range(-64,512,64):
        for x in range(-32,544,32):
            offset=16 if (y//64)%2 else 0
            d.line([(x+offset,y),(x+offset-3,y+28),(x+offset,y+64)],fill=(38,29,20,130),width=2)
            d.line([(x+offset+4,y),(x+offset+2,y+29),(x+offset+4,y+63)],fill=(255,226,172,58),width=2)
        d.line([(0,y+63),(512,y+63)],fill=(48,33,24,125),width=2)
        d.line([(0,y+59),(512,y+59)],fill=(251,215,156,55),width=2)
    save(roof,name,'Roof colors sampled from owner reference, with drawn tile grooves and weathering.')

atlas=Image.new('RGBA',(512,512),(0,0,0,0));d=ImageDraw.Draw(atlas)
# Insets allow mipmapped atlas sampling without pulling in neighbouring cells.
for ox in [0,256]:
    trim=(215,210,183,255) if ox==0 else (93,77,56,255)
    d.rectangle((ox+18,18,ox+237,237), fill=trim)
    d.rectangle((ox+30,29,ox+225,225), fill=(43,65,65,255))
    for x in [ox+38,ox+137]:
        d.rectangle((x,36,x+81,216),fill=(89,118,119,255))
        d.polygon([(x,36),(x+81,36),(x,112)],fill=(146,161,151,255))
    d.rectangle((ox+123,29,ox+132,225),fill=trim)
    if ox:
        for y in [85,145,196]:d.rectangle((ox+30,y,ox+225,y+6),fill=trim)
# Door.
d.rectangle((18,272,237,504),fill=(65,57,42,255))
d.rectangle((30,280,225,504),fill=(130,104,71,255))
for x in range(42,222,30):d.line([(x,282),(x,504)],fill=(76,65,45,255),width=3)
d.rectangle((124,280,132,504),fill=(60,52,39,255))
d.ellipse((142,382,153,393),fill=(214,189,122,255))
# Actual crest crop from the supplied residence, not a separately sourced icon.
crest=palace.crop((348,178,388,214)).resize((194,194),Image.Resampling.LANCZOS).convert('RGBA')
mask=Image.new('L',(194,194));ImageDraw.Draw(mask).ellipse((5,5,189,189),fill=255)
crest.putalpha(mask);atlas.alpha_composite(crest,(287,285))
save(atlas,'details_atlas','Procedural windows/door matching the house reference; lower-right crest is a cropped owner-supplied residence detail.')

# Design choice: keep four heads to match the residence reference.
# The original seven-head upload is preserved; no date/era is imposed.
faces=cliff.crop((0,0,382,225)).convert('RGBA')
# Detect the warm stone skyline rather than keeping the grey city behind it.
mask=Image.new('L',faces.size,0);md=ImageDraw.Draw(mask)
pixels=faces.load(); tops=[]
def warm(x,y):
    r,g,b,_=pixels[x,y]
    return r-b > 20 and g-b > 9
for x in range(faces.width):
    top=next((y for y in range(120) if all(warm(x,y+dy) for dy in range(4))), 100)
    tops.append(top)
for x in range(faces.width):
    neighborhood=sorted(tops[max(0,x-2):min(faces.width,x+3)])
    y=neighborhood[len(neighborhood)//2]
    md.line([(x,y),(x,224)],fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(.55))
faces.putalpha(mask)
# Square storage, restored to the source aspect ratio by the world-space mesh.
faces=faces.resize((512,512),Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(radius=.8,percent=85,threshold=4))
save(faces,'hokage_cliff','Cropped first four faces from the provided seven-face image, with a warm-stone skyline alpha mask. Textured scenery, not sculpted face geometry.')
manifest=dict(source_commit='bc6203d36c5ed53ca9795214627482f42ff056c9',pillow='11.3.0',seed=83021,cliff_crop=[0,0,382,225],head_count=4,
    sources=[dict(file=n,sha256=hashlib.sha256((SOURCES/n).read_bytes()).hexdigest(),size=Image.open(SOURCES/n).size) for n in NAMES],outputs=outputs,
    rights='Owner-provided references; original rights not independently verified. Derived textures are not claimed as wholly original artwork.')
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Prepared',len(outputs),'textures;',sum((OUT/o['file']).stat().st_size for o in outputs),'PNG bytes')
