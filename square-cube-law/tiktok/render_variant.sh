#!/usr/bin/env bash
# Рендер дизайн-варианта: ./render_variant.sh paper|neon|blueprint  (звук и субтитры — общие из build/)
set -euo pipefail
cd "$(dirname "$0")"
V=$1; FPS=${FPS:-30}; JOBS=${JOBS:-4}; D=variants/$V
[ -f build/mix.wav ] || { node capture.js sfx; python3 audio.py; }
[ -f build/subs.srt ] || python3 srt.py
N=$(python3 -c "import json,math;print(math.ceil(json.load(open('build/timeline.json'))['total']*$FPS))")
Q=$(( (N + JOBS - 1) / JOBS )); pids=()
for ((i=0; i<JOBS; i++)); do
  a=$((i*Q)); b=$(( (i+1)*Q < N ? (i+1)*Q : N ))
  PAGE=$D/index.html node capture.js "$FPS" "$a" "$b" "$D/part$i.mp4" > "$D/render$i.log" 2>&1 & pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done
: > $D/parts.txt; for ((i=0; i<JOBS; i++)); do echo "file 'part$i.mp4'" >> $D/parts.txt; done
ffmpeg -y -v error -f concat -safe 0 -i $D/parts.txt -i build/mix.wav -i build/subs.srt \
  -map 0:v -map 1:a -map 2:s -c:v copy -c:a aac -b:a 256k -c:s mov_text -metadata:s:s:0 language=rus \
  -movflags +faststart -t "$(python3 -c "import json;print(json.load(open('build/timeline.json'))['total'])")" square_cube_law_$V.mp4
rm -f $D/part*.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 square_cube_law_$V.mp4
