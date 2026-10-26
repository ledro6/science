#!/usr/bin/env bash
# Полная сборка вертикального ролика: озвучка → кадры (4 потока) → звук → mp4.
set -euo pipefail
cd "$(dirname "$0")"
FPS=${FPS:-60}; JOBS=${JOBS:-4}
[ -f build/timeline.json ] || python3 tts.py
node capture.js sfx
python3 audio.py
N=$(python3 -c "import json,math;print(math.ceil(json.load(open('build/timeline.json'))['total']*$FPS))")
Q=$(( (N + JOBS - 1) / JOBS ))
pids=()
for ((i=0; i<JOBS; i++)); do
  a=$((i*Q)); b=$(( (i+1)*Q < N ? (i+1)*Q : N ))
  node capture.js "$FPS" "$a" "$b" "build/part$i.mp4" > "build/render$i.log" 2>&1 & pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done
: > build/parts.txt
for ((i=0; i<JOBS; i++)); do echo "file 'part$i.mp4'" >> build/parts.txt; done
python3 srt.py
ffmpeg -y -v error -f concat -safe 0 -i build/parts.txt -i build/mix.wav -i build/subs.srt \
  -map 0:v -map 1:a -map 2:s -c:v copy -c:a aac -b:a 256k -c:s mov_text -metadata:s:s:0 language=rus \
  -movflags +faststart -t "$(python3 -c "import json;print(json.load(open('build/timeline.json'))['total'])")" square_cube_law_vertical.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 square_cube_law_vertical.mp4
