"""Субтитры .srt: фразы по таймингам слов (WordBoundary), без точек в конце и без длинных тире."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
tl = json.load(open(os.path.join(HERE, "build", "timeline.json")))
ts = lambda s: f"{int(s // 3600):02}:{int(s % 3600 // 60):02}:{int(s % 60):02},{int(round(s % 1 * 1000)) % 1000:03}"


def phrases(line):
    """Режем реплику на фразы по . ! ? и длинному тире; каждой фразе — тайминг её слов."""
    parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+|\s+—\s+", line["text"]) if p.strip()]
    words, i, out = line["words"], 0, []
    for p in parts:
        n = len(re.findall(r"[0-9A-Za-zА-Яа-яЁё]+(?:-[0-9A-Za-zА-Яа-яЁё]+)*", p))
        ws = words[i:i + n] or words[-1:]
        i += n
        out.append((ws[0]["t"], ws[-1]["t"] + ws[-1]["d"], re.sub(r"[.…]+$", "", p).replace("—", ",").strip()))
    return out


with open(os.path.join(HERE, "build", "subs.srt"), "w") as f:
    k = 0
    for l in tl["lines"]:
        for a, b, text in phrases(l):
            k += 1
            f.write(f"{k}\n{ts(a)} --> {ts(b + .15)}\n{text}\n\n")
