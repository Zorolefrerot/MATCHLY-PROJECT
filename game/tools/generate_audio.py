#!/usr/bin/env python3
"""Generate only the original warning; never overwrite the owner's nine sounds."""
import argparse
import math
import struct
import wave
from pathlib import Path

RATE = 22050

def generate_warning(destination: Path):
    duration = .12
    samples = []
    for i in range(round(duration * RATE)):
        t = i / RATE
        envelope = min(1, t / .009) * (1 - t / duration) ** 2
        sound = .55 * math.sin(math.tau * 660 * t) + .15 * math.sin(math.tau * 990 * t)
        samples.append(sound * envelope)
    gain = .72 / max(abs(v) for v in samples)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(destination), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(b''.join(struct.pack('<h', round(v * gain * 32767)) for v in samples))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'assets/audio/warning.wav')
    args = parser.parse_args()
    generate_warning(args.output)
    print('Generated original warning only:', args.output)
