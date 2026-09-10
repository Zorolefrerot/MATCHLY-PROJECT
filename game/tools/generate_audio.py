#!/usr/bin/env python3
"""Original deterministic mono PCM sounds. No downloaded music or anime samples."""
import math, random, struct, wave
from pathlib import Path

RATE = 22050
DEST = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
DEST.mkdir(parents=True, exist_ok=True)
TAU = math.tau

def save(name, samples, peak=.72):
    maximum = max(abs(v) for v in samples) or 1
    gain = peak / maximum
    with wave.open(str(DEST / (name + '.wav')), 'wb') as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(RATE)
        out.writeframes(b''.join(struct.pack('<h', round(v * gain * 32767)) for v in samples))

def effect(name, duration, seed):
    rng = random.Random(seed)
    result = []; low = 0.0
    for i in range(round(duration * RATE)):
        t = i / RATE; x = t / duration
        n = rng.uniform(-1, 1); low = low * .86 + n * .14
        envelope = min(1, t / .009) * (1 - x) ** 2
        if name == 'katon':
            sound = .6 * low + .18 * n + .28 * math.sin(TAU * (135*t-62*t*t))
        elif name == 'raiton':
            sound = .42 * n * (.45 + .55 * math.sin(TAU*37*t)**2) + .22 * math.sin(TAU*(1800*t-850*t*t))
        elif name in ('futon', 'dodge', 'melee'):
            envelope = math.sin(math.pi*x)**1.5
            sound = low * math.sin(TAU*(350*t+140*t*t)) + .11*n
        elif name == 'doton':
            sound = .7 * math.sin(TAU*(88*t-32*t*t)) + .4*low
        elif name == 'earth_impact':
            sound = .6 * math.sin(TAU*(68*t-20*t*t))*math.exp(-t*3) + .7*low + .1*n
        elif name == 'hit':
            sound = .45*n*math.exp(-t*18) + .5*math.sin(TAU*(175*t-170*t*t))
        else:  # Short, restrained attack warning; no voice or siren.
            sound = .55*math.sin(TAU*660*t) + .15*math.sin(TAU*990*t)
        result.append(sound * envelope)
    save(name, result)

for seed, (name, duration) in enumerate([
    ('katon', .62), ('raiton', .40), ('futon', .64), ('doton', .50),
    ('earth_impact', .85), ('melee', .19), ('hit', .20), ('dodge', .27), ('warning', .12)
]):
    effect(name, duration, seed+441)

# Original 16-bar-feel, 32-beat loop: low drums, sparse pentatonic plucks, soft drone.
beat = 60/108
length = round(32*beat*RATE)
music = [0.0] * length
rng = random.Random(20260910)
def mix(start, duration, sample):
    # Wrap note tails into the start, producing a continuous seamless loop.
    for i in range(round(duration*RATE)):
        music[(round(start*RATE)+i) % length] += sample(i/RATE)
for step in range(32):
    if step % 4 in (0, 2):
        mix(step*beat, .42, lambda t: .44*math.sin(TAU*(62*t+1.8*(1-math.exp(-t*30))))*math.exp(-t*13)*min(1,t/.004))
    if step % 4 == 3:
        noise = [rng.uniform(-1, 1) for _ in range(round(.13*RATE))]
        mix(step*beat, .13, lambda t: noise[min(len(noise)-1,round(t*RATE))]*.065*math.exp(-t*36)*min(1,t/.003))
    if step % 2 == 0:
        # D minor pentatonic; intentionally sparse, original melody.
        semitones = [0, 7, 10, 3, 7, 12, 10, 7, 0, 3, 7, 10, 15, 12, 7, 3]
        frequency = 146.832 * 2**(semitones[step//2]/12)
        mix(step*beat, 1.6, lambda t, f=frequency: .095*(math.sin(TAU*f*t)+.25*math.sin(TAU*f*2*t))*math.exp(-t*3.8)*min(1,t/.008))
for i in range(length):
    # Integer loop cycles avoid clicks at the boundary.
    phase = TAU*i/length
    music[i] += .025*math.sin(phase*1305) + .015*math.sin(phase*1956)
save('combat_loop', music, .58)
print('Generated', len(list(DEST.glob('*.wav'))), 'original PCM WAV files.')
