"""Озвучка + тайминги каждого слова (WordBoundary) для пословных субтитров."""
import asyncio, json, os, subprocess, sys
import certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"  # агентный прокси
import edge_tts
import importlib.util

# python3 tts.py [папка выпуска]  — в папке лежит script.py со SCENES; результат в <папка>/build/
HERE = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("script", os.path.join(HERE, "script.py"))
_mod = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_mod)
SCENES = _mod.SCENES

VOICE, RATE = "ru-RU-SvetlanaNeural", "+8%"
OUT = os.path.join(HERE, "build", "voice")
os.makedirs(OUT, exist_ok=True)


async def synth(key, text):
    mp3, js = f"{OUT}/{key}.mp3", f"{OUT}/{key}.json"
    if not (os.path.exists(js) and os.path.getsize(mp3) > 0):
        # сервис иногда не отдаёт звук для отдельных фраз — пробуем варианты пунктуации
        variants = [text, text.replace(" — ", ", "), text.replace(" — ", " ").rstrip(".") + "!"]
        for attempt in range(15):
            try:
                comm = edge_tts.Communicate(variants[attempt % 3], VOICE, rate=RATE, boundary="WordBoundary",
                                            proxy=os.environ.get("HTTPS_PROXY"))
                audio, words = bytearray(), []
                async for ch in comm.stream():
                    if ch["type"] == "audio": audio += ch["data"]
                    elif ch["type"] == "WordBoundary":
                        words.append({"w": ch["text"], "t": ch["offset"] / 1e7, "d": ch["duration"] / 1e7})
                if audio and words:
                    open(mp3, "wb").write(audio); json.dump(words, open(js, "w"), ensure_ascii=False)
                    break
            except Exception as e:
                print("retry", key, e); await asyncio.sleep(1 + attempt % 4)
        else:
            sys.exit(f"TTS failed: {key}")
    words = json.load(open(js))
    # обрезаем звук ровно от начала первого слова, тайминги слов сдвигаем так же
    t0 = max(0.0, words[0]["t"] - 0.04)
    last = words[-1]["t"] + words[-1]["d"] - t0 + 0.12
    wav = f"{OUT}/{key}.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t0:.3f}", "-i", mp3, "-t", f"{last:.3f}",
                    "-af", "afade=t=out:st=%.3f:d=0.08" % max(0, last - .08), "-ar", "48000", "-ac", "1", wav], check=True)
    return last, [{**w, "t": round(w["t"] - t0, 3), "d": round(w["d"], 3)} for w in words]


async def main():
    t, tl = 0.35, {"scenes": [], "lines": []}
    for si, (scene, lines) in enumerate(SCENES):
        start = 0.0 if si == 0 else max(0.0, t - 0.25)
        for key, text in lines:
            d, words = await synth(key, text)
            tl["lines"].append({"key": key, "scene": scene, "start": round(t, 3), "dur": round(d, 3), "text": text,
                                "words": [{**w, "t": round(w["t"] + t, 3)} for w in words]})
            t += d + 0.22
        t += 0.35
        if scene == "outro": t += 1.6
        tl["scenes"].append({"id": scene, "start": round(start, 3), "end": round(t - 0.25, 3)})
    tl["scenes"][-1]["end"] = round(t, 3)
    tl["total"] = round(t, 3)
    json.dump(tl, open(os.path.join(HERE, "build", "timeline.json"), "w"), ensure_ascii=False, indent=1)
    open(os.path.join(HERE, "build", "timeline.js"), "w").write("window.TL=" + json.dumps(tl, ensure_ascii=False) + ";")
    with open(os.path.join(HERE, "build", "timeline_readable.txt"), "w") as f:
        for l in tl["lines"]:
            f.write(f"{l['scene']} {l['key']} {l['start']} → {round(l['start'] + l['dur'], 2)}  |  " + " ".join(f"{w['w']}@{w['t']}" for w in l["words"]) + "\n")
        for s in tl["scenes"]: f.write(str(s) + "\n")
    print("total", t)

asyncio.run(main())
