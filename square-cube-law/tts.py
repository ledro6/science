import asyncio, json, os, subprocess, sys
import certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"  # агентный прокси
import edge_tts
from script import SCENES

VOICE, RATE = "ru-RU-SvetlanaNeural", "-4%"
OUT = os.path.join(os.path.dirname(__file__), "build", "voice")
os.makedirs(OUT, exist_ok=True)

async def synth(key, text):
    mp3 = f"{OUT}/{key}.mp3"
    if not os.path.exists(mp3) or os.path.getsize(mp3) == 0:
        # сервис иногда не отдаёт звук для отдельных фраз — пробуем варианты пунктуации
        variants = [text, text.replace(" — ", ", "), text.replace(" — ", " ").rstrip(".") + "!"]
        for attempt in range(12):
            try:
                await edge_tts.Communicate(variants[attempt % 3], VOICE, rate=RATE, proxy=os.environ.get("HTTPS_PROXY")).save(mp3)
                if os.path.getsize(mp3) > 0: break
            except Exception as e:
                print("retry", key, e); await asyncio.sleep(1 + attempt)
        else:
            sys.exit(f"TTS failed: {key}")
    wav = f"{OUT}/{key}.wav"
    # обрезаем тишину по краям, 48 кГц моно
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-af",
        "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
        "-ar", "48000", "-ac", "1", wav], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]))
    return d

async def main():
    t, timeline = 0.0, {"scenes": [], "lines": []}
    for si, (scene, lines) in enumerate(SCENES):
        start = t
        t += 1.2 if si else 1.6  # пауза перед сценой
        for key, text in lines:
            d = await synth(key, text)
            timeline["lines"].append({"key": key, "scene": scene, "start": round(t, 3), "dur": round(d, 3), "text": text})
            t += d + 0.45
        t += 1.0
        if scene == "outro": t += 2.5
        timeline["scenes"].append({"id": scene, "start": round(start, 3), "end": round(t, 3)})
    timeline["total"] = round(t, 3)
    json.dump(timeline, open(os.path.join(os.path.dirname(__file__), "build", "timeline.json"), "w"), ensure_ascii=False, indent=1)
    print("total", t)

asyncio.run(main())
