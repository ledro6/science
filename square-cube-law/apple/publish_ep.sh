#!/usr/bin/env bash
# Раскладывает готовый выпуск в videos/epNN-<slug>/ (ролик + обложки TikTok и Shorts + субтитры) и заливает в GitHub.
#   ./publish_ep.sh 4
set -euo pipefail
cd "$(dirname "$0")/../.."                       # корень репозитория
N=$1; NN=$(printf %02d "$N")
declare -A SLUG=([1]=kvadrat-kub [2]=kleiber [3]=eksponenta [4]=kepler [5]=obratnye-kvadraty [6]=reynolds [7]=benford [8]=dni-rozhdeniya [9]=ezh [10]=ferma)
D=videos/ep$NN-${SLUG[$N]}; mkdir -p "$D"
if [ "$N" = 1 ]; then
  cp square-cube-law/apple/square_cube_law_apple.mp4 "$D/L3_ep$NN.mp4"
  cp square-cube-law/tiktok/build/subs.srt "$D/L3_ep$NN.srt"
else
  E=square-cube-law/apple/episodes/ep$N
  cp "$E/l3_ep$N.mp4" "$D/L3_ep$NN.mp4"
  cp "$E/build/subs.srt" "$D/L3_ep$NN.srt"
  git add -f "$E/scenes" "$E"/*.json "$E"/*.mjs "$E/script.py" "$E/build/timeline.json" "$E/build/sfx.json" 2>/dev/null || true
fi
# GitHub не принимает файлы > 100 МБ: пережимаем копию до ~90 МБ (битрейт из длительности)
V="$D/L3_ep$NN.mp4"
if [ "$(stat -c %s "$V")" -gt 95000000 ]; then
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
  BR=$(python3 -c "print(int(90e6*8/$DUR/1000) - 300)")k
  ffmpeg -loglevel error -y -i "$V" -map 0 -c:v libx264 -preset medium -b:v $BR -maxrate $BR -bufsize $BR \
    -pix_fmt yuv420p -c:a copy -c:s copy -movflags +faststart "$V.tmp.mp4" && mv "$V.tmp.mp4" "$V"
fi
cp square-cube-law/brand/out/ep$N-tiktok-cover.png "$D/L3_ep$NN-tiktok-cover.png"
cp square-cube-law/brand/out/ep$N-shorts-cover.png "$D/L3_ep$NN-shorts-cover.png"
git add -f "$D" square-cube-law/brand/out/ep$N-*.png
git commit -qm "Выпуск $N: ролик, обложки TikTok и Shorts, субтитры" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BZmGe7xbFacvNdXRrUeCkC"
for i in 1 2 3 4 5; do git push -q -u origin claude/square-cube-law-video-u5qymh && break; sleep $((2**i)); done
echo "published $D"
