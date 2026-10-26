"""Звуковая дорожка: эмбиент-подложка + синтезированные эффекты + озвучка.

Все звуки генерируются здесь же (numpy), тайминги эффектов берутся из build/sfx.json,
который экспортирует anim.js, — поэтому звук и картинка синхронны по построению.
"""
import json, os, subprocess, wave
import numpy as np

SR = 48000
ROOT = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(ROOT, "build")
rng = np.random.default_rng(42)

tl = json.load(open(f"{B}/timeline.json"))
sfx = json.load(open(f"{B}/sfx.json"))
N = int((tl["total"] + 0.5) * SR)
tt = lambda d: np.arange(int(d * SR)) / SR


def read_wav(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, np.float32).astype(np.float64)


def add(buf, x, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x * gain


def env(n, a, r):
    """Экспоненциальная огибающая: атака a с, затухание с константой r с."""
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-np.maximum(t - a, 0) / r)


def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(X, n)
    return x / (np.abs(x).max() + 1e-9)


def sweep(f0, f1, d, curve=1.0):
    t = tt(d)
    f = f0 + (f1 - f0) * (t / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ---------- эффекты ----------
def s_pop(p):
    d = .18; x = sweep(820 * p, 260 * p, d, .4) * env(int(d * SR), .002, .045)
    return .55 * x + .15 * bandnoise(len(x), 2000, 8000) * env(len(x), .0005, .004)

def s_tick(p):
    d = .09; t = tt(d)
    return .35 * np.sin(2 * np.pi * 2200 * p * t) * env(len(t), .001, .018)

def s_chime(p):
    d = 3.2; t = tt(d); f = 660 * p; x = np.zeros_like(t)
    for k, (m, a, r) in enumerate([(1, 1, 1.4), (2.0, .35, .8), (2.76, .25, .5), (5.4, .12, .25), (8.93, .05, .12)]):
        x += a * np.sin(2 * np.pi * f * m * t + k) * env(len(t), .003, r)
    return .3 * x

def s_whoosh(p):
    d = 1.1; n = int(d * SR); t = np.arange(n) / n
    lo, hi = bandnoise(n, 150, 900), bandnoise(n, 900, 5000 * p)
    shape = np.sin(np.pi * t) ** 2
    return .22 * (lo * (1 - t) + hi * t) * shape

def s_swell(p):
    d = 1.6; n = int(d * SR); t = np.arange(n) / n
    x = .15 * bandnoise(n, 200, 3000) * t ** 2 + .25 * sweep(110 * p, 220 * p, d) * t ** 1.5
    return x * np.minimum(1, (1 - t) * 12)

def s_rise(p):
    d = 1.4; n = int(d * SR); t = np.arange(n) / n
    x = sweep(300 * p, 900 * p, d, 1.5) + .4 * sweep(450 * p, 1350 * p, d, 1.5)
    return .14 * x * np.sin(np.pi * t) ** 1.5

def s_bloom(p):
    d = 2.2; t = tt(d); x = np.zeros_like(t)
    for f in (110, 165, 220, 277.2):
        x += np.sin(2 * np.pi * f * p * t) + .3 * np.sin(4 * np.pi * f * p * t)
    return .1 * x * env(len(t), .35, .7)

def s_shimmer(p):
    out = np.zeros(int(1.6 * SR))
    for k, f in enumerate((1318.5, 1568, 1975.5, 2637)):
        x = np.sin(2 * np.pi * f * p * tt(.9)) * env(int(.9 * SR), .003, .25) * .12
        add(out, x, k * .07)
    return out

def s_thud(p):
    d = .7; t = tt(d)
    x = sweep(95 * p, 38 * p, d, .5) * env(len(t), .003, .18)
    return .9 * x + .25 * bandnoise(len(t), 40, 400) * env(len(t), .001, .05)

def s_crack(p):
    out = np.zeros(int(.4 * SR))
    for k in range(6):
        n = int(.03 * SR)
        add(out, bandnoise(n, 1500, 9000) * env(n, .0003, .006) * (.6 - k * .08), k * .025 + rng.random() * .01)
    return out

def s_splash(p):
    d = 1.2; n = int(d * SR)
    out = .35 * bandnoise(n, 300, 5000) * env(n, .004, .18)
    for k in range(18):
        f = 900 + 2400 * rng.random(); dd = .06
        add(out, np.sin(2 * np.pi * f * tt(dd)) * env(int(dd * SR), .001, .015) * .15,
            .05 + rng.random() * .7)
    return out

def s_boing(p):
    d = .35; t = tt(d)
    f = (380 + 520 * (1 - np.exp(-t / .05))) * p * (1 + .04 * np.sin(2 * np.pi * 28 * t))
    return .22 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .002, .1)

def s_fall(p):
    d = 1.4; n = int(d * SR); t = np.arange(n) / n
    return .07 * sweep(1700 * p, 700 * p, d) * np.sin(np.pi * t) ** .7

SFX = dict(pop=s_pop, tick=s_tick, chime=s_chime, whoosh=s_whoosh, swell=s_swell, rise=s_rise, bloom=s_bloom,
           shimmer=s_shimmer, thud=s_thud, crack=s_crack, splash=s_splash, boing=s_boing, fall=s_fall)


# ---------- музыка: медленные аккорды + редкие «капли» ----------
def midi(m): return 440 * 2 ** ((m - 69) / 12)

CHORDS = [  # Am9 — Fmaj7 — C(add9) — G6
    [45, 52, 55, 59, 60], [41, 48, 52, 57, 64], [48, 55, 59, 62, 64], [43, 50, 55, 59, 64],
]
BAR = 8.0

def music():
    L = np.zeros(N); R = np.zeros(N)
    nb = int(np.ceil(N / SR / BAR)) + 1
    seg = int((BAR + 3) * SR); t = np.arange(seg) / SR
    fade = np.minimum(t / 2.5, 1) * np.clip((BAR + 3 - t) / 3, 0, 1)
    for b in range(nb):
        ch = CHORDS[b % 4]
        for side, buf, det in ((0, L, 1.0), (1, R, 1.0035)):
            x = np.zeros(seg)
            for j, m in enumerate(ch):
                f = midi(m) * (det if j % 2 else 2 - det)
                lfo = 1 + .25 * np.sin(2 * np.pi * (.07 + .02 * j) * t + j + side)
                for h, a in ((1, 1), (2, .28), (3, .1), (4, .04)):
                    x += a * lfo * np.sin(2 * np.pi * f * h * t + h * j)
            x += .9 * np.sin(2 * np.pi * midi(ch[0] - 12) * t)  # саб
            add(buf, x * fade * .02, b * BAR)
    # «капли» — арпеджио из нот аккорда, мягкий колокольчик
    r = np.random.default_rng(3)
    beat = 60 / 72
    for k in range(int(N / SR / beat)):
        if r.random() < .45: continue
        ch = CHORDS[int(k * beat / BAR) % 4]
        m = ch[r.integers(1, len(ch))] + 24
        d = 2.0; tt_ = np.arange(int(d * SR)) / SR
        x = (np.sin(2 * np.pi * midi(m) * tt_) + .2 * np.sin(4 * np.pi * midi(m) * tt_)) * env(len(tt_), .004, .5) * .022
        pan = r.random()
        add(L, x * (1 - pan * .6), k * beat); add(R, x * (.4 + pan * .6), k * beat)
    return L, R


def reverb(x, secs=2.8, mix=.28):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (secs / 6.9))
    ir[0] = 0
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    wet = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir / np.sqrt((ir ** 2).sum()), m), m)[: len(x)]
    return x + mix * wet


def smooth(x, secs):
    k = max(1, int(secs * SR)); c = np.cumsum(np.insert(x, 0, 0))
    y = (c[k:] - c[:-k]) / k
    return np.concatenate([np.full(k - 1, y[0]), y])


def main():
    # озвучка
    voice = np.zeros(N)
    for l in tl["lines"]:
        add(voice, read_wav(f"{B}/voice/{l['key']}.wav"), l["start"])
    voice /= np.abs(voice).max() + 1e-9
    voice *= .82
    # лёгкая «комната» на голос, чтобы он сидел в миксе
    voice = reverb(voice, 1.0, .06)

    # эффекты
    fx = np.zeros(N)
    for e in sfx:
        add(fx, SFX[e["type"]](e["pitch"]), e["t"], e["gain"])
    fxL, fxR = reverb(fx, 2.2, .35), reverb(fx, 2.3, .35)

    # музыка с дакингом под голос
    mL, mR = music()
    mL, mR = reverb(mL, 3.5, .5), reverb(mR, 3.6, .5)
    act = smooth((np.abs(voice) > .02).astype(float), .25)
    act = smooth(np.maximum(act, 0), .4)
    duck = 1 - .45 * np.clip(act * 2, 0, 1)
    intro = np.minimum(np.arange(N) / SR / 2.0, 1)
    outro = np.clip((tl["total"] + .3 - np.arange(N) / SR) / 3.0, 0, 1)
    mg = duck * intro * outro * 1.0

    L = voice + .55 * fxL + mL * mg
    R = voice + .55 * fxR + mR * mg
    st = np.stack([L, R], 1)
    st = np.tanh(st * 1.1) / np.tanh(1.1)  # мягкий лимитер
    st *= .89 / np.abs(st).max()
    out = f"{B}/mix.wav"
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    print("written", out, st.shape[0] / SR, "s")


if __name__ == "__main__":
    main()
