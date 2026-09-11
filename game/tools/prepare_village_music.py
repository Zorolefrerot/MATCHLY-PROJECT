#!/usr/bin/env python3
"""Prepare the owner's complete village music; FFmpeg 7.0.2, no network."""
import argparse, hashlib, json, subprocess, tempfile
from pathlib import Path
from prepare_audio import prepare
ROOT = Path(__file__).resolve().parents[2]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
parser=argparse.ArgumentParser();parser.add_argument('--ffmpeg',required=True);parser.add_argument('--source-commit',required=True);args=parser.parse_args()
source=ROOT/'game/audio_sources/village_loop.mp3'
out=ROOT/'game/assets/village_audio';out.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as temp:
    wav=Path(temp)/'village.wav'
    record=prepare(args.ffmpeg,source,wav,'combat_loop',args.source_commit)
    target=out/'village_loop.ogg'
    subprocess.run([args.ffmpeg,'-v','error','-y','-i',str(wav),'-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact','-c:a','libvorbis','-q:a','4',str(target)],check=True)
    record.update(source_repository_path='1001641947.mp3', output='village_loop.ogg', output_sha256=sha(target), output_bytes=target.stat().st_size, codec='vorbis', prepared_pcm_sha256=sha(wav), note='Complete recording with outer silence trim and short fades; no pitch or tempo changes. Original rights not independently verified.')
    (out/'manifest.json').write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(record,indent=2))
