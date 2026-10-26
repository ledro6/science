#!/usr/bin/env bash
# Все ролики по очереди (каждый на 4 потоках): основной 60 fps, затем дизайн-варианты 30 fps.
set -uo pipefail
cd "$(dirname "$0")"
for job in main paper neon blueprint; do
  s=$(date +%s)
  if [ $job = main ]; then ./render.sh; else ./render_variant.sh $job; fi
  echo "== $job: $(( $(date +%s) - s )) s"
done
