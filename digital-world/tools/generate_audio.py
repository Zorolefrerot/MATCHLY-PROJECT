#!/usr/bin/env python3
"""Original deterministic score, no samples or third-party music. Python stdlib only."""
import math
import struct
import wave
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "assets/audio"
RATE = 22050
TAU = math.tau


def write(name, samples):
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / (name + ".wav")), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(RATE)
        stream.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32700)) for s in samples))


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def score():
    duration = 32
    samples = [0.0] * (duration * RATE)
    chords = [(48, 55, 62, 64), (45, 52, 59, 60), (41, 48, 55, 57), (43, 50, 57, 59)]
    for index, chord in enumerate(chords):
        for n in range(8 * RATE):
            t = n / RATE
            envelope = min(1, t / 0.6, (8 - t) / 1.2) * 0.043
            pad = sum(math.sin(TAU * hz(note) * t) for note in chord)
            samples[index * 8 * RATE + n] += pad * envelope
    melody = [76, 79, 83, 79, 74, 76, 71, 72, 69, 76, 79, 76, 74, 71, 67, 71]
    for index, note in enumerate(melody):
        for n in range(int(1.9 * RATE)):
            t = n / RATE
            env = (1 - math.exp(-30 * t)) * math.exp(-2.8 * t)
            tone = math.sin(TAU * hz(note) * t) + 0.25 * math.sin(TAU * hz(note) * 2 * t)
            samples[(index * 2) * RATE + n] += 0.09 * tone * env
    write("system_city", samples)


def effect(name, notes, duration=0.35):
    values = []
    for n in range(int(duration * RATE)):
        t = n / RATE
        part = min(len(notes) - 1, int(t / duration * len(notes)))
        f = hz(notes[part])
        values.append(math.sin(TAU * f * t) * math.sin(math.pi * t / duration) * 0.24)
    write(name, values)


if __name__ == "__main__":
    score()
    for name, notes in {"jump": [60, 67, 72], "land": [43, 38], "hit": [41, 37, 32],
                        "interact": [72, 79], "collect": [76, 79, 84],
                        "scan": [60, 64, 67, 72], "success": [60, 64, 67, 72, 76, 79]}.items():
        effect(name, notes, 0.7 if name == "success" else 0.28)
