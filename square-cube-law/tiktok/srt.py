"""Субтитры .srt (по репликам) — для загрузки на платформы/плееры, где нужны отдельные сабы."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
tl = json.load(open(os.path.join(HERE, "build", "timeline.json")))
ts = lambda s: f"{int(s // 3600):02}:{int(s % 3600 // 60):02}:{int(s % 60):02},{int(round(s % 1 * 1000)) % 1000:03}"
with open(os.path.join(HERE, "build", "subs.srt"), "w") as f:
    for i, l in enumerate(tl["lines"], 1):
        f.write(f"{i}\n{ts(l['start'])} --> {ts(l['start'] + l['dur'])}\n{l['text']}\n\n")
