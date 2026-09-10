#!/usr/bin/env python3
"""Original eight-frame flame atlas; Python standard library, no external image."""
import math, struct, zlib
from pathlib import Path
W, H, FRAMES = 128, 192, 8

def smooth(a, b, x):
    t = max(0.0, min(1.0, (x-a)/(b-a)))
    return t*t*(3-2*t)

def pixel(x, y, frame):
    height = 1-y/(H-1)
    u = x/(W-1)-.5
    phase = frame*math.tau/FRAMES
    value = 0.0
    for i in range(5):
        tip = .64 + .30*(.5+.5*math.sin(phase+i*2.1))
        if not 0 < height < tip: continue
        t = height/tip
        root = (i-2)*.07
        center = root*(1-t) + .085*math.sin(t*6 + phase+i*1.2)*t
        width = (.115 if i == 2 else .07) * (1-t)**.62 + .004
        tongue = math.exp(-((u-center)/width)**2)*math.sin(math.pi*t)**.38
        value += tongue*(.8 if i == 2 else .55)
    value += .62*math.exp(-((u/.19)**2 + ((height-.20)/.16)**2))
    flow = .06*math.sin(u*73 + height*25-phase*2) + .045*math.sin(u*38-height*42+phase)
    value = max(0, value + flow*smooth(.08,.2,value))
    alpha = smooth(.10,.38,value)*smooth(0,.065,height)
    heat = max(0, min(1, value*.64))
    if heat < .52:
        t = heat/.52
        color = (255, round(35+143*t), round(5+10*t))
    else:
        t = (heat-.52)/.48
        color = (255, round(178+76*t), round(15+150*t*t))
    return bytes((*color, round(255*alpha)))

def chunk(tag, data):
    return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)

raw = bytearray()
for y in range(H):
    raw.append(0)
    for frame in range(FRAMES):
        for x in range(W): raw.extend(pixel(x,y,frame))
png = b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',W*FRAMES,H,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
path = Path(__file__).resolve().parents[1]/'assets/vfx/flame_atlas.png'
path.write_bytes(png)
print(path, len(png), 'bytes')
