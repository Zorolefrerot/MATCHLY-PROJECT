#!/usr/bin/env python3
"""Convert owner-supplied recordings to bounded, offline Godot PCM assets.

Requires FFmpeg 7.x (never installed on Render). Originals are left unchanged.
No time stretching, pitch shifting, internal silence removal or short excerpting.
"""
import argparse
import array
import hashlib
import json
import math
import re
import struct
import subprocess
import sys
import wave
from pathlib import Path
from generate_audio import generate_warning

RATE = 22050
CUES = ('katon', 'raiton', 'futon', 'doton', 'earth_impact', 'melee', 'hit', 'dodge', 'combat_loop')
GAME = Path(__file__).resolve().parents[1]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def rms(values):
    return math.sqrt(sum(x*x for x in values) / max(1, len(values)))

def prepare(ffmpeg, source, destination, cue, source_commit):
    probe = subprocess.run([ffmpeg, '-hide_banner', '-i', str(source)], capture_output=True, text=True)
    codec = re.search(r'Audio: ([^,( ]+)', probe.stderr)
    if not codec:
        raise ValueError(f'No decodable audio stream in {source.name}')
    decoded = subprocess.run([ffmpeg, '-v', 'error', '-i', str(source), '-map', '0:a:0', '-vn', '-ac', '1', '-af', f'aresample={RATE}:async=1:first_pts=0', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'], check=True, capture_output=True).stdout
    samples = array.array('f')
    samples.frombytes(decoded)
    if sys.byteorder != 'little': samples.byteswap()
    if not samples or len(samples) > RATE * 180:
        raise ValueError(f'Empty or unexpectedly long input: {source.name}')
    if not all(math.isfinite(value) for value in samples):
        raise ValueError(f'Invalid audio samples in {source.name}')
    block = round(RATE * .01)
    threshold = 10 ** (-50 / 20)
    active = [i for i in range(0, len(samples), block) if rms(samples[i:i+block]) > threshold]
    if not active:
        raise ValueError(f'Silent input: {source.name}')
    start = max(0, active[0] - round(RATE * .02))
    end = min(len(samples), active[-1] + block + round(RATE * .04))
    result = list(samples[start:end])
    background = cue == 'combat_loop'
    fade_in = min(len(result), round(RATE * (.04 if background else .005)))
    fade_out = min(len(result), round(RATE * (.08 if background else .025)))
    for i in range(fade_in): result[i] *= i / max(1, fade_in-1)
    for i in range(fade_out): result[-1-i] *= i / max(1, fade_out-1)
    ceiling = .58 if background else .72
    target_rms = 10 ** ((-20 if background else -18) / 20)
    gain = min(10 ** (6/20), target_rms / max(rms(result), .000001), ceiling / max(abs(v) for v in result))
    result = [v * gain for v in result]
    destination.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(destination), 'wb') as output:
        output.setnchannels(1); output.setsampwidth(2); output.setframerate(RATE)
        output.writeframes(b''.join(struct.pack('<h', round(v * 32767)) for v in result))
    return {
        'source': 'game/audio_sources/' + source.name,
        'source_repository_path': source.name,
        'source_commit': source_commit,
        'source_sha256': digest(source),
        'detected_codec': codec.group(1),
        'input_seconds': round(len(samples)/RATE, 5),
        'trim_start_seconds': round(start/RATE, 5),
        'trim_end_seconds': round((len(samples)-end)/RATE, 5),
        'duration_seconds': round(len(result)/RATE, 5),
        'gain_db': round(20*math.log10(gain), 3),
        'peak': round(max(abs(v) for v in result), 6),
        'rms': round(rms(result), 6),
        'output': 'game/assets/audio/' + destination.name,
        'output_sha256': digest(destination),
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg', default='ffmpeg')
    parser.add_argument('--source-dir', type=Path, default=GAME / 'audio_sources')
    parser.add_argument('--output-dir', type=Path, default=GAME / 'assets/audio')
    args = parser.parse_args()
    provenance = json.loads((args.source_dir / 'sources.json').read_text())
    for cue in CUES:
        source = args.source_dir / (cue + '.mp3')
        if not source.is_file():
            raise FileNotFoundError(cue + '.mp3')
        if digest(source) != provenance['files'][source.name]['sha256']:
            raise ValueError(f'{source.name}: update sources.json with the new upload provenance first')
    records = {}
    for cue in CUES:
        records[cue] = prepare(args.ffmpeg, args.source_dir/(cue+'.mp3'), args.output_dir/(cue+'.wav'), cue, provenance['commit'])
        print(cue, records[cue]['input_seconds'], '->', records[cue]['duration_seconds'], 'seconds;', records[cue]['gain_db'], 'dB')
    warning = args.output_dir / 'warning.wav'
    generate_warning(warning)
    records['warning'] = {
        'source': 'original synthesis, game/tools/generate_audio.py',
        'duration_seconds': .12,
        'output': 'game/assets/audio/warning.wav',
        'output_sha256': digest(warning),
    }
    version = subprocess.check_output([args.ffmpeg, '-version'], text=True).splitlines()[0]
    manifest = {'version': 1, 'sample_rate': RATE, 'channels': 1, 'bits': 16, 'converter': version, 'clips': records}
    (args.output_dir / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')

if __name__ == '__main__': main()
