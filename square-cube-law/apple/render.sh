#!/usr/bin/env bash
# Сборка Apple-версии: звуковые события → микс (общий микшер ../tiktok/audio.py) → кадры 60 fps → mp4.
set -euo pipefail
cd "$(dirname "$0")"
FPS=${FPS:-60}; JOBS=${JOBS:-4}; export SCALE=${SCALE:-1.3333333}   # 1440×2560 (2K)
node capture.js sfx
python3 ../tiktok/audio.py --sfx build/sfx.json --out build/mix.wav
TOT=$(python3 -c "import json;print(json.load(open('build/timeline.json'))['total'])")
N=$(python3 -c "import math;print(math.ceil($TOT*$FPS))")
Q=$(( (N + JOBS - 1) / JOBS )); pids=()
for ((i=0; i<JOBS; i++)); do
  a=$((i*Q)); b=$(( (i+1)*Q < N ? (i+1)*Q : N ))
  node capture.js "$FPS" "$a" "$b" "build/part$i.mp4" > "build/render$i.log" 2>&1 & pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done
: > build/parts.txt; for ((i=0; i<JOBS; i++)); do echo "file 'part$i.mp4'" >> build/parts.txt; done
ffmpeg -y -v error -f concat -safe 0 -i build/parts.txt -i build/mix.wav -i ../tiktok/build/subs.srt \
  -map 0:v -map 1:a -map 2:s -c:v copy -c:a aac -b:a 256k -c:s mov_text -metadata:s:s:0 language=rus \
  -movflags +faststart -t "$TOT" square_cube_law_apple.mp4
ffprobe -v error -show_entries stream=codec_type,duration -of compact square_cube_law_apple.mp4
