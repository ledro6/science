#!/usr/bin/env bash
# Сборка выпуска: ./render_ep.sh ep2  → episodes/ep2/l3_ep2.mp4 (1440×2560, 60 fps)
set -euo pipefail
cd "$(dirname "$0")"
export EP=$1; D=episodes/$EP
FPS=${FPS:-60}; JOBS=${JOBS:-4}; export SCALE=${SCALE:-1.3333333}
node capture.js sfx
python3 ../tiktok/audio.py --build $D/build
python3 ../tiktok/srt.py $D
TOT=$(python3 -c "import json;print(json.load(open('$D/build/timeline.json'))['total'])")
N=$(python3 -c "import math;print(math.ceil($TOT*$FPS))")
Q=$(( (N + JOBS - 1) / JOBS )); pids=()
for ((i=0; i<JOBS; i++)); do
  a=$((i*Q)); b=$(( (i+1)*Q < N ? (i+1)*Q : N ))
  node capture.js "$FPS" "$a" "$b" "$D/build/part$i.mp4" > "$D/build/render$i.log" 2>&1 & pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done
: > $D/build/parts.txt; for ((i=0; i<JOBS; i++)); do echo "file 'part$i.mp4'" >> $D/build/parts.txt; done
ffmpeg -y -v error -f concat -safe 0 -i $D/build/parts.txt -i $D/build/mix.wav -i $D/build/subs.srt \
  -map 0:v -map 1:a -map 2:s -c:v copy -c:a aac -b:a 256k -c:s mov_text -metadata:s:s:0 language=rus \
  -movflags +faststart -t "$TOT" $D/l3_$EP.mp4
rm -f $D/build/part*.mp4
ffprobe -v error -show_entries stream=codec_type,width,height,duration -of compact $D/l3_$EP.mp4
