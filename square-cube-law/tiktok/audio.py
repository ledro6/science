#!/usr/bin/env python3
"""Звук вертикальной версии (TikTok): музыка «tech keynote» + SFX + озвучка → build/mix.wav.

Всё синтезируется здесь (numpy, без сэмплов и сети). Тайминги берутся из build/timeline.json
(сцены и реплики) и build/sfx.json (события эффектов, экспортирует `node capture.js sfx`).

    python3 audio.py                       # обычный прогон → build/mix.wav
    python3 audio.py --sfx build/sfx_test.json
    python3 audio.py --stems /tmp/stems    # дополнительно сохранить стемы voice/music/sfx (после мастер-гейна)

Музыка (~102 BPM, ля минор): Am9 – Fmaj7 – C(add9) – G6. Темп в каждой сцене слегка подстраивается
(±3 BPM), чтобы сцена вмещала целое число долей: сильная доля всегда совпадает со сменой сцены,
перед ней — fill (дробь снэпов + шумовой райзер, kick молчит), на ней — «дроп» (crash + саб-бум).
В strength на слове «Хруст» — брейк музыки (~0.7 с), в outro — каданс и финальный Cmaj9.
"""
import argparse, json, os, subprocess, sys, time, wave
import numpy as np

SR = 48000
ROOT = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(ROOT, "build")
T0 = time.time()


def log(*a):
    print(f"[{time.time() - T0:5.1f}s]", *a, flush=True)


# ============================================================ базовые утилиты
def tt(d):
    return np.arange(int(round(d * SR))) / SR


def place(buf, x, t, gain=1.0, pan=0.0):
    """Добавить x в buf с момента t (с). Моно в стерео-буфер — равномощной панорамой."""
    if gain == 0: return
    i = int(round(t * SR))
    if buf.ndim == 2 and x.ndim == 1:
        a = (pan + 1) * np.pi / 4
        x = np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)
    if i < 0:
        x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if n <= 0: return
    buf[i:i + n] += x[:n] * gain


def adsr(n, a=.002, tau=.2, hold=0.0):
    """Атака a, удержание hold, затем экспоненциальный спад с постоянной tau."""
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-5), 1.0)
    return e * np.exp(-np.maximum(t - a - hold, 0) / tau)


def fades(x, fi=.002, fo=.01):
    n = len(x); a = min(n, int(fi * SR)); b = min(n, int(fo * SR))
    w = np.ones(n)
    if a: w[:a] = np.linspace(0, 1, a)
    if b: w[n - b:] *= np.linspace(1, 0, b)
    return x * (w if x.ndim == 1 else w[:, None])


def _pow2(n):
    return 1 << int(np.ceil(np.log2(max(n, 2))))


def butter_mag(f, lo=None, hi=None, order=2):
    """|H| баттерворт-подобного ФВЧ/ФНЧ (нулевая фаза, применяется в частотной области)."""
    H = np.ones_like(f)
    with np.errstate(divide="ignore"):
        if lo: H *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
        if hi: H *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return H


def ffilt(x, lo=None, hi=None, order=2, H=None):
    """Нуль-фазовый фильтр через FFT всего сигнала (x: (n,) или (n,c))."""
    n = x.shape[0]; m = _pow2(n + 4096)
    f = np.fft.rfftfreq(m, 1 / SR)
    if H is None: H = butter_mag(f, lo, hi, order)
    else: H = H(f)
    X = np.fft.rfft(x, m, axis=0)
    X *= H if x.ndim == 1 else H[:, None]
    return np.fft.irfft(X, m, axis=0)[:n]


def noise(n, seed, lo=None, hi=None, order=2):
    x = np.random.default_rng(seed).standard_normal(n)
    if lo or hi:
        x = ffilt(x, lo, hi, order)
    return x / (np.abs(x).max() + 1e-12)


def svf(x, fc, q, mode="bp"):
    """Переменный во времени state-variable фильтр (TPT/Zavalishin). fc, q — скаляры или массивы."""
    n = len(x)
    fc = np.broadcast_to(np.clip(fc, 20, SR * .45), (n,)).astype(float)
    k = 1.0 / np.broadcast_to(q, (n,)).astype(float)
    g = np.tan(np.pi * fc / SR)
    a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2
    out = np.empty(n); ic1 = ic2 = 0.0
    xs, A1, A2, A3, K = x.tolist(), a1.tolist(), a2.tolist(), a3.tolist(), k.tolist()
    m = {"bp": 0, "lp": 1, "hp": 2}[mode]
    for i in range(n):
        v3 = xs[i] - ic2
        v1 = A1[i] * ic1 + A2[i] * v3
        v2 = ic2 + A2[i] * ic1 + A3[i] * v3
        ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2
        out[i] = v1 if m == 0 else (v2 if m == 1 else xs[i] - K[i] * v1 - v2)
    return out


def sweep_phase(f):
    return 2 * np.pi * np.cumsum(f) / SR


def norm(x, peak):
    return x * (peak / (np.abs(x).max() + 1e-12))


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def follow(target, t_up, t_down, dt):
    """Сглаживание поблочной кривой: рост с постоянной t_up, спад с t_down (с)."""
    cu = np.exp(-dt / max(t_up, 1e-6)); cd = np.exp(-dt / max(t_down, 1e-6))
    out = np.empty(len(target)); g = float(target[0])
    for i, v in enumerate(target.tolist()):
        g = v + (g - v) * (cu if v > g else cd)
        out[i] = g
    return out


def block_view(x, bs):
    nb = int(np.ceil(len(x) / bs))
    pad = np.zeros(nb * bs - len(x))
    return np.concatenate([x, pad]).reshape(nb, bs)


def blocks_to_samples(v, bs, n):
    centers = (np.arange(len(v)) + .5) * bs
    return np.interp(np.arange(n), centers, v)


# ============================================================ измерения: LUFS и true peak
def _kweight_mag(f):
    z = np.exp(-2j * np.pi * f / SR)
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]; a1 = [1, -1.69065929318241, .73248077421585]
    b2 = [1.0, -2.0, 1.0]; a2 = [1, -1.99004745483398, .99007225036621]
    H = lambda b, a: (b[0] + b[1] * z + b[2] * z * z) / (a[0] + a[1] * z + a[2] * z * z)
    return np.abs(H(b1, a1) * H(b2, a2))


def lufs(x, gate=True):
    """Интегральная громкость по BS.1770-4 (x: (n,2) или моно — тогда считается как центр стерео)."""
    if x.ndim == 1: x = np.stack([x, x], 1)
    y = ffilt(x, H=_kweight_mag)
    p = (y ** 2).sum(1)
    c = np.concatenate([[0], np.cumsum(p)])
    L, hop = int(.4 * SR), int(.1 * SR)
    st = np.arange(0, len(p) - L, hop)
    z = (c[st + L] - c[st]) / L
    lk = -0.691 + 10 * np.log10(z + 1e-20)
    if not gate: return -0.691 + 10 * np.log10(z.mean() + 1e-20)
    z1 = z[lk > -70]
    if not len(z1): return -70.0
    rel = -0.691 + 10 * np.log10(z1.mean()) - 10
    z2 = z[lk > max(rel, -70)]
    return -0.691 + 10 * np.log10(z2.mean())


def _tp_kernels(taps=48, os_=4):
    k = np.arange(-taps // 2, taps // 2)
    win = np.kaiser(len(k), 8.0)
    return [np.sinc(k + ph / os_) * win for ph in range(1, os_)]


TPK = _tp_kernels()


def tp_env(x):
    """Пиковая огибающая с 4× передискретизацией (по максимуму каналов), на каждый отсчёт."""
    if x.ndim == 1: x = x[:, None]
    e = np.abs(x).max(1)
    for h in TPK:
        for c in range(x.shape[1]):
            e = np.maximum(e, np.abs(np.convolve(x[:, c], h, "same")))
    return e


def dbfs(v):
    return 20 * np.log10(max(v, 1e-12))


# ============================================================ динамика
def compressor(x, thr_db, ratio, att=.005, rel=.1, knee=6.0, bs=48):
    lv = np.sqrt((block_view(x, bs) ** 2).mean(1) + 1e-12)
    ldb = follow(20 * np.log10(lv), att, rel, bs / SR)
    over = ldb - thr_db
    # мягкое колено
    o = np.where(over <= -knee / 2, 0, np.where(over >= knee / 2, over, (over + knee / 2) ** 2 / (2 * knee)))
    gr = -o * (1 - 1 / ratio)
    return x * blocks_to_samples(10 ** (gr / 20), bs, len(x))


def deesser(x, f0=5500, max_db=6.0, bs=48):
    hf = ffilt(x, lo=f0, order=3)
    lf = x - hf
    lh = 20 * np.log10(np.sqrt((block_view(hf, bs) ** 2).mean(1) + 1e-12))
    lh = follow(lh, .002, .06, bs / SR)
    act = lh > -60
    thr = np.percentile(lh[act], 85) if act.any() else 0
    gr = -np.clip((lh - thr) * .6, 0, max_db)
    return lf + hf * blocks_to_samples(10 ** (gr / 20), bs, len(x))


def limiter(x, ceil_db=-1.3, look=.004, rel=.12, bs=48):
    """True-peak лимитер с заглядыванием вперёд: x (n,2)."""
    c = 10 ** (ceil_db / 20)
    pk = block_view(tp_env(x), bs).max(1)
    need = np.minimum(1.0, c / (pk + 1e-12))
    k = max(1, int(round(look * SR / bs)))
    pad = np.concatenate([np.ones(k), need, np.ones(k)])
    need = np.lib.stride_tricks.sliding_window_view(pad, 2 * k + 1).min(1)
    g = follow(need, rel, 1e-5, bs / SR)            # спад мгновенный, восстановление rel
    gs = blocks_to_samples(g, bs, len(x))
    w = max(1, k * bs // 2)
    gs = np.convolve(gs, np.ones(w) / w, "same")
    y = x * gs[:, None]
    return np.clip(y, -c, c), dbfs(1 / max(g.min(), 1e-9)) if g.min() < 1 else 0.0


# ============================================================ реверберация (свёртка с синтетической ИХ)
def make_ir(secs, seed, predelay=.015, lo=180, dark=4500, early=True):
    n = int(secs * SR); r = np.random.default_rng(seed)
    t = np.arange(n) / SR
    base = r.standard_normal(n)
    bright = ffilt(base, lo=lo, order=2)
    dk = ffilt(base, lo=lo, hi=dark, order=2)
    tau = secs / 6.9
    ir = dk * np.exp(-t / tau) + .5 * (bright - dk) * np.exp(-t / (tau * .45))
    ir *= np.minimum(t / .008, 1)  # плавное нарастание диффузии
    if early:
        for d, a in ((.007, .5), (.013, .35), (.019, .3), (.027, .22), (.034, .18)):
            j = int((d + r.random() * .003) * SR)
            if j < n: ir[j] += a * (1 if r.random() > .5 else -1) * np.abs(ir).max() * 2
    ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
    return ir / np.sqrt((ir ** 2).sum())


def convolve(x, ir):
    n = len(x); m = _pow2(n + len(ir))
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:n]


def reverb_st(x, secs, seed, **kw):
    """Моно или стерео вход → стерео «мокрый» сигнал (декоррелированные ИХ для L/R)."""
    if x.ndim == 1: xl = xr = x
    else: xl, xr = x[:, 0], x[:, 1]
    return np.stack([convolve(xl, make_ir(secs, seed, **kw)), convolve(xr, make_ir(secs, seed + 1, **kw))], 1)


# ============================================================ SFX
def s_pop(p, seed):
    t = tt(.16); n = len(t)
    f = 260 * p + 720 * p * np.exp(-t / .012)
    x = np.sin(sweep_phase(f)) * adsr(n, .0015, .04)
    x += .35 * np.sin(2 * np.pi * 140 * p * t) * adsr(n, .001, .025)
    x += .18 * noise(n, seed, 2500, 9000) * adsr(n, .0003, .0025)
    return norm(fades(x), .5)


def s_tick(p, seed):
    t = tt(.06); n = len(t)
    x = np.sin(2 * np.pi * 2600 * p * t) * adsr(n, .0005, .006)
    x += .45 * np.sin(2 * np.pi * 5300 * p * t + 1) * adsr(n, .0003, .003)
    x += .3 * noise(n, seed, 4000) * adsr(n, .0002, .0012)
    return norm(fades(x), .26)


def s_click(p, seed):
    out = np.zeros(int(.09 * SR))
    for k, (dt, a, fm) in enumerate(((0, 1, 1.0), (.013, .45, 1.35))):
        t = tt(.05); n = len(t)
        x = np.sin(2 * np.pi * 1250 * p * fm * t) * adsr(n, .0004, .007)
        x += .6 * noise(n, seed + k, 1200, 7000) * adsr(n, .0002, .0018)
        x += .3 * np.sin(2 * np.pi * 380 * p * t) * adsr(n, .0005, .01)
        place(out, x, dt, a)
    return norm(fades(out), .32)


def s_chime(p, seed):
    t = tt(3.0); n = len(t); f = 659.26 * p
    parts = [(1, 1, 2.2), (2.0, .45, 1.3), (2.76, .28, .8), (4.07, .14, .45), (5.4, .08, .25), (8.93, .03, .12)]
    L = np.zeros(n); R = np.zeros(n)
    for k, (m, a, r) in enumerate(parts):
        e = adsr(n, .002, r)
        L += a * np.sin(2 * np.pi * f * m * t + k) * e
        R += a * np.sin(2 * np.pi * (f * m + .7 + .3 * k) * t + k * 1.7) * e
    strike = .12 * noise(n, seed, 3000, 10000) * adsr(n, .0003, .004)
    x = np.stack([L + strike, R + strike], 1)
    return norm(fades(x, .001, .2), .34)


def s_whoosh(p, seed):
    d = .95; t = tt(d); n = len(t); pk = .3
    fc = np.where(t < pk, 280 * p * (10 ** (t / pk)), 2800 * p * np.exp(-(t - pk) / .35) + 600 * p)
    x = svf(np.random.default_rng(seed).standard_normal(n), fc, .9) + \
        .5 * svf(np.random.default_rng(seed + 1).standard_normal(n), fc * 1.9, 1.4)
    e = np.where(t < pk, (t / pk) ** 2.2, np.exp(-(t - pk) / .2))
    x = x * e
    pan = np.clip(-.7 + 1.4 * t / d, -1, 1); a = (pan + 1) * np.pi / 4
    st = np.stack([x * np.cos(a), x * np.sin(a)], 1)
    return norm(fades(st, .002, .05), .36)


def s_swell(p, seed):
    d = 1.6; t = tt(d); n = len(t); u = t / d
    x = .6 * noise(n, seed, 2500, 14000) * u ** 3.2
    for m in (45, 52, 57, 60, 64):
        x += .25 * np.sin(2 * np.pi * midi(m) * p * t) * u ** 2.2
        x += .08 * np.sin(4 * np.pi * midi(m) * p * t) * u ** 2.6
    x *= np.minimum(1, (d - t) / .04)
    return norm(x, .36)


def s_rise(p, seed):
    d = 1.05; t = tt(d); n = len(t); u = t / d
    f = 380 * p * 3 ** (u ** 1.4)
    x = np.sin(sweep_phase(f)) + .45 * np.sin(sweep_phase(f * 1.5)) + .2 * np.sin(sweep_phase(f * 2))
    x += .5 * svf(np.random.default_rng(seed).standard_normal(n), f * 3, 2.0)
    e = np.sin(np.pi * np.minimum(u / .85, 1) / 2) ** 2 * np.minimum(1, (d - t) / .12)
    return norm(x * e, .3)


def s_riser(p, seed):
    """Нарастание 1.5 с: пик ровно в конце (t + 1.5) — событие ставится за 1.5 с до акцента."""
    d = 1.5; t = tt(d + .12); n = len(t); u = np.minimum(t / d, 1)
    fc = 350 * p * (9000 / 350) ** (u ** 1.3)
    q = 1 + 4 * u
    nz = svf(np.random.default_rng(seed).standard_normal(n), fc, q) * .9
    f = 110 * p * 8 ** (u ** 1.6)
    ton = np.zeros(n)
    for det in (1.0, 1.007, .994):
        ph = sweep_phase(f * det)
        ton += np.sin(ph) + .4 * np.sin(2 * ph) + .2 * np.sin(3 * ph)
    trem = 1 - .25 * u * (.5 + .5 * np.sin(sweep_phase(6 + 18 * u ** 2)))
    e = u ** 2.4 * trem
    e = np.where(t > d, np.exp(-(t - d) / .025), e)
    x = (nz + .28 * ton) * e
    st = np.stack([x, svf(x, 3000, .7, "lp") * .3 + x * .85], 1)
    return norm(fades(st, .005, .02), .46)


def s_impact(p, seed):
    d = 3.0; t = tt(d); n = len(t)
    f = 30 * p + 70 * p * np.exp(-t / .07)
    sub = np.tanh(1.8 * np.sin(sweep_phase(f))) * adsr(n, .002, .95)
    thump = .6 * np.sin(2 * np.pi * 110 * p * t) * adsr(n, .001, .06)
    atk = .7 * noise(n, seed, 60, 7000) * adsr(n, .0005, .03)
    tailL = noise(n, seed + 1, 40, 900) * adsr(n, .01, 1.0) * .35
    tailR = noise(n, seed + 2, 40, 900) * adsr(n, .01, 1.0) * .35
    air = noise(n, seed + 3, 2500, 9000) * adsr(n, .002, .35) * .12
    m = sub + thump + atk + air
    st = np.stack([m + tailL, m + tailR], 1)
    return norm(fades(st, .0005, .4), .95)


def s_bloom(p, seed):
    d = 2.6; t = tt(d); n = len(t)
    L = np.zeros(n); R = np.zeros(n)
    for j, m in enumerate((57, 60, 64, 67, 71)):
        fr = midi(m) * p
        for h, a in ((1, 1), (2, .3), (3, .1)):
            L += a * np.sin(2 * np.pi * fr * h * t * (1 - .0012) + j)
            R += a * np.sin(2 * np.pi * fr * h * t * (1 + .0012) + 2 * j)
    e = np.minimum(t / .35, 1) ** 2 * np.exp(-np.maximum(t - .35, 0) / .75)
    st = np.stack([L * e, R * e], 1)
    return norm(fades(st, .002, .3), .34)


def s_shimmer(p, seed):
    d = 1.9; out = np.zeros((int(d * SR), 2))
    for k, m in enumerate((88, 91, 95, 100, 103)):
        t = tt(1.2); n = len(t); fr = midi(m) * p
        x = (np.sin(2 * np.pi * fr * t) + .25 * np.sin(2 * np.pi * fr * 2.76 * t)) * adsr(n, .002, .28)
        place(out, x, k * .055, .9 - k * .1, pan=-.6 + .3 * k)
    t = tt(d); n = len(t)
    air = noise(n, seed, 7000, 16000) * np.minimum(t / .1, 1) * np.exp(-t / .35) * .2
    out += np.stack([air, np.roll(air, 300)], 1)
    return norm(fades(out, .001, .2), .3)


def s_thud(p, seed):
    t = tt(.65); n = len(t)
    f = 46 * p + 80 * p * np.exp(-t / .035)
    x = np.tanh(1.5 * np.sin(sweep_phase(f))) * adsr(n, .002, .16)
    x += .35 * noise(n, seed, 40, 350) * adsr(n, .001, .03)
    x += .08 * noise(n, seed + 1, 800, 3000) * adsr(n, .0005, .006)
    return norm(fades(x), .7)


def s_crack(p, seed):
    r = np.random.default_rng(seed)
    out = np.zeros(int(.5 * SR)); tcur = 0.0
    for k in range(7):
        t = tt(.04); n = len(t)
        a = (1.0 if k == 0 else .25 + .45 * r.random()) * (1 - k * .07)
        fr = (1700 + 1500 * r.random()) * p
        x = .8 * noise(n, seed + 10 + k, 1800, 12000) * adsr(n, .0002, .0016)
        x += .5 * np.sin(2 * np.pi * fr * t) * adsr(n, .0003, .007)
        place(out, x, tcur, a)
        tcur += .006 + .016 * r.random()
    t = tt(.2); n = len(t)
    body = .7 * np.sin(2 * np.pi * 170 * p * t) * adsr(n, .001, .045)
    body += .5 * noise(n, seed + 99, 350, 1600) * adsr(n, .0005, .02)
    place(out, body, 0)
    return norm(fades(out, .0002, .05), .62)


def s_splash(p, seed):
    r = np.random.default_rng(seed)
    d = 1.3; t = tt(d); n = len(t)
    out = .7 * noise(n, seed, 1500, 9000) * adsr(n, .004, .08)
    out += .6 * noise(n, seed + 1, 250, 2500) * adsr(n, .006, .22)
    for k in range(16):
        dd = .07; tk = tt(dd); m = len(tk)
        f0 = (600 + 1300 * r.random()) * p
        f = f0 * (1 + .7 * tk / dd)
        drop = np.sin(sweep_phase(f)) * adsr(m, .001, .018)
        place(out, drop, .03 + .8 * r.random() ** 1.4, .35 * (1 - k / 20))
    st = np.stack([out, np.roll(out, 211)], 1)
    return norm(fades(st, .002, .2), .44)


def s_boing(p, seed):
    t = tt(.55); n = len(t)
    f = 230 * p * (1 + .6 * (1 - np.exp(-t / .05))) * (1 + .09 * np.sin(2 * np.pi * 19 * t) * np.exp(-t / .2))
    ph = sweep_phase(f)
    x = (np.sin(ph) + .3 * np.sin(2 * ph)) * adsr(n, .002, .14)
    return norm(fades(x, .001, .05), .4)


def s_fall(p, seed):
    d = 1.5; t = tt(d); n = len(t); u = t / d
    f = 1600 * p * (500 / 1600) ** (u ** 1.2) * (1 + .012 * np.sin(2 * np.pi * 5.5 * t))
    ph = sweep_phase(f)
    x = np.sin(ph) + .15 * np.sin(2 * ph)
    x += .35 * svf(np.random.default_rng(seed).standard_normal(n), f, 3.0)
    e = np.sin(np.pi * u) ** .6
    return norm(x * e, .3)


SFX = dict(pop=s_pop, tick=s_tick, click=s_click, chime=s_chime, whoosh=s_whoosh, swell=s_swell, rise=s_rise,
           riser=s_riser, impact=s_impact, bloom=s_bloom, shimmer=s_shimmer, thud=s_thud, crack=s_crack,
           splash=s_splash, boing=s_boing, fall=s_fall)
# сдвиг начала относительно t события (whoosh чуть «заранее», чтобы пик пришёлся на вход сцены)
SFX_OFFSET = dict(whoosh=-.12)


def render_sfx(events, N):
    out = np.zeros((N, 2)); cache = {}
    skipped = {}
    for k, e in enumerate(events):
        typ = e.get("type"); fn = SFX.get(typ)
        if fn is None:
            skipped[typ] = skipped.get(typ, 0) + 1
            continue
        p = float(e.get("pitch", 1) or 1); g = float(e.get("gain", 1))
        key = (typ, round(p, 3))
        if key not in cache:
            cache[key] = fn(p, 1000 + len(cache) * 7)
        place(out, cache[key], float(e["t"]) + SFX_OFFSET.get(typ, 0), g)
    for typ, c in skipped.items():
        print(f"WARNING: unknown sfx type '{typ}' ×{c} — skipped", file=sys.stderr)
    return out


# ============================================================ музыка
CH = {  # имя: (корень баса MIDI, ноты пэда)
    "Am9": (33, [57, 60, 64, 67, 71]),
    "Fmaj7": (29, [53, 57, 60, 64, 67]),
    "Cadd9": (36, [55, 60, 62, 64, 67]),
    "G6": (31, [55, 59, 62, 64, 67]),
    "Dm9": (38, [53, 57, 60, 64, 65]),
    "Cmaj9": (36, [48, 55, 59, 62, 64, 67, 71]),
}
PROG = ["Am9", "Fmaj7", "Cadd9", "G6"]
OUTRO_PROG = ["Am9", "Fmaj7", "Dm9", "G6"]
BPM = 102

ARR = {  # аранжировка по сценам: hats (8/16), arp (8/16/0), clap, open-hat, уровень «энергии»
    "hook": dict(hats=8, arp=16, clap=True, ohat=True, energy=1.0, arpdir=1),
    "cube": dict(hats=16, arp=16, clap=True, ohat=False, energy=.95, arpdir=1),
    "strength": dict(hats=16, arp=16, clap=True, ohat=True, energy=1.05, arpdir=1),
    "heat": dict(hats=8, arp=8, clap=True, ohat=False, energy=.9, arpdir=1),
    "fall": dict(hats=16, arp=16, clap=True, ohat=True, energy=1.0, arpdir=-1),
}
DEFAULT_ARR = dict(hats=8, arp=16, clap=True, ohat=False, energy=1.0, arpdir=1)


class Inst:
    """Синтезаторы инструментов с кэшем (одинаковые ноты не пересчитываются)."""

    def __init__(self):
        self.c = {}
        self.hatn = noise(SR, 7, 6500, None, 3)
        self.hato = noise(SR, 8, 5000, 16000, 2)

    def _k(self, key, fn):
        if key not in self.c: self.c[key] = fn()
        return self.c[key]

    def kick(self, big=False):
        def f():
            t = tt(.7 if big else .42); n = len(t)
            fr = 44 + 100 * np.exp(-t / (.045 if big else .032))
            body = np.tanh(1.6 * np.sin(sweep_phase(fr))) * adsr(n, .001, .32 if big else .16)
            click = .12 * noise(n, 3, 1500, 8000) * adsr(n, .0003, .003)
            return fades(body + click, .0005, .02)
        return self._k(("kick", big), f)

    def clap(self, bright=1.0):
        def f():
            n = int(.35 * SR); out = np.zeros(n)
            for k, dt in enumerate((0, .008, .017)):
                m = int(.03 * SR)
                place(out, noise(m, 20 + k, 900 * bright, 7000 * bright) * adsr(m, .0003, .005), dt, .8)
            t = tt(.35)
            out += .55 * noise(n, 25, 1000 * bright, 6000 * bright) * adsr(n, .0005, .07) * (t > .017)
            out += .25 * np.sin(2 * np.pi * 210 * t) * adsr(n, .0005, .02)
            return fades(out, .0002, .03) * .7
        return self._k(("clap", round(bright, 2)), f)

    def snap(self, bright=1.0):
        def f():
            n = int(.12 * SR); t = tt(.12)
            x = noise(n, 30, 1500 * bright, 9000) * adsr(n, .0002, .022)
            x += .3 * np.sin(2 * np.pi * 1900 * bright * t) * adsr(n, .0003, .01)
            return fades(x, .0002, .02) * .55
        return self._k(("snap", round(bright, 2)), f)

    def hat(self, open_=False, off=0):
        n = int((.25 if open_ else .05) * SR)
        src = self.hato if open_ else self.hatn
        i = (off * 997) % (len(src) - n)
        return src[i:i + n] * adsr(n, .0005, .09 if open_ else .012)

    def crash(self):
        def f():
            n = int(2.2 * SR); t = tt(2.2)
            x = noise(n, 40, 3500, 15000) * adsr(n, .002, .7) + .4 * noise(n, 41, 1500, 5000) * adsr(n, .002, .25)
            y = noise(n, 42, 3500, 15000) * adsr(n, .002, .7) + .4 * noise(n, 43, 1500, 5000) * adsr(n, .002, .25)
            return fades(np.stack([x, y], 1), .001, .3) * .5
        return self._k("crash", f)

    def boom(self):
        def f():
            t = tt(1.4); n = len(t)
            fr = 34 + 55 * np.exp(-t / .09)
            return fades(np.tanh(1.4 * np.sin(sweep_phase(fr))) * adsr(n, .002, .5), .001, .2)
        return self._k("boom", f)

    def bass(self, m, d):
        def f():
            t = tt(d + .03); n = len(t); fr = midi(m)
            x = np.sin(2 * np.pi * fr * t) + .25 * np.sin(4 * np.pi * fr * t + .5)
            x = np.tanh(2.2 * x) / np.tanh(2.2)
            e = np.minimum(t / .004, 1) * np.clip((d + .03 - t) / .03, 0, 1) * (.75 + .25 * np.exp(-t / .15))
            return x * e
        return self._k(("bass", m, round(d, 3)), f)

    def pluck(self, m, bright=1.0):
        def f():
            t = tt(.6); n = len(t); fr = midi(m); x = np.zeros(n)
            for h in range(1, 10):
                if fr * h > 14000: break
                tau = .3 / (1 + .7 * (h - 1) / bright)
                x += (1 / h) ** 1.05 * np.sin(2 * np.pi * fr * h * t + h) * np.exp(-t / tau)
            return fades(x * np.minimum(t / .002, 1), .0005, .05)
        return self._k(("pluck", m, round(bright, 2)), f)

    def pad_loop(self, name):
        """Длинный (6 с) стерео пэд аккорда; бары берут из него срез + огибающую."""
        def f():
            d = 6.0; t = tt(d); n = len(t)
            L = np.zeros(n); R = np.zeros(n)
            notes = CH[name][1]
            for j, m in enumerate(notes):
                fr = midi(m)
                for v, (det, side) in enumerate(((-.006, 0), (.0, 2), (.006, 1))):
                    x = np.zeros(n)
                    for h in range(1, 7):
                        a = (1 / h) * np.exp(-(h - 1) / 1.8)
                        x += a * np.sin(2 * np.pi * fr * (1 + det) * h * t + 1.3 * h + j + v)
                    lfo = 1 + .15 * np.sin(2 * np.pi * (.11 + .03 * j + .02 * v) * t + j)
                    x *= lfo
                    if side == 0: L += x
                    elif side == 1: R += x
                    else: L += .7 * x; R += .7 * x
            return np.stack([L, R], 1) / len(notes)
        return self._k(("pad", name), f)


def scene_grid(tl):
    """Для каждой сцены: целое число долей при темпе ≈ BPM (сильная доля = начало сцены)."""
    out = []
    for s in tl["scenes"]:
        L = s["end"] - s["start"]
        n = max(4, int(round(L * BPM / 60)))
        out.append(dict(id=s["id"], start=s["start"], end=s["end"], n=n, bt=L / n))
    return out


def find_word(tl, prefix):
    for l in tl["lines"]:
        for w in l.get("words", []):
            if w["w"].lower().startswith(prefix.lower()):
                return w["t"]
    return None


def music(tl, N):
    I = Inst()
    drums = np.zeros((N, 2)); bass = np.zeros(N); pad = np.zeros((N, 2)); arp = np.zeros((N, 2))
    fx = np.zeros((N, 2)); clapbus = np.zeros((N, 2))
    kicks = []
    grid = scene_grid(tl)
    total = tl["total"]

    # брейк на «Хруст»
    brk = None
    tx = find_word(tl, "хруст")
    if tx is not None:
        sc = next((g for g in grid if g["start"] <= tx < g["end"]), None)
        if sc:
            hb = sc["bt"] / 2
            k = int(np.ceil((tx + .55 - sc["start"]) / hb - 1e-6))
            brk = (tx - .1, sc["start"] + k * hb, tx)
    in_break = (lambda t: brk is not None and brk[0] - .005 <= t < brk[1] - .005)

    for si, g in enumerate(grid):
        A = ARR.get(g["id"], DEFAULT_ARR)
        bt, n, st = g["bt"], g["n"], g["start"]
        last = si == len(grid) - 1
        outro = last
        if outro:
            final_beat = max(4, 4 * ((n - 3) // 4))
            prog = OUTRO_PROG
        else:
            prog = PROG
        fill_b = 2 if n >= 12 else 1
        en = A["energy"] if not outro else .9
        # дроп на начале сцены
        place(fx, I.crash(), st, .55 * en)
        place(drums, I.boom(), st, .65 * en)
        r = np.random.default_rng(100 + si)

        for b in range(n):
            tb = st + b * bt
            bar, pos = b // 4, b % 4
            infill = (not outro) and b >= n - fill_b
            lastbeat = (not outro) and b == n - 1
            if outro and b > final_beat: break
            if outro and b == final_beat:
                # финальный аккорд: Cmaj9 — пэд «блум», плак-аккорд, саб, мягкий crash
                rest = total - tb
                Lp = I.pad_loop("Cmaj9"); m = min(len(Lp), int((rest + .2) * SR)); tq = np.arange(m) / SR
                envp = np.minimum(tq / .06, 1) * np.exp(-tq / 1.6)
                place(pad, Lp[:m] * envp[:, None], tb, 1.25)
                for j, mm in enumerate(CH["Cmaj9"][1][1:]):
                    place(arp, I.pluck(mm + 12, 1.3), tb + j * .035, .5, pan=-.5 + .2 * j)
                place(drums, I.boom(), tb, .8); place(fx, I.crash(), tb, .5)
                place(bass, I.bass(36, min(rest, 2.0)) * np.exp(-tt(min(rest, 2.0) + .03) / .8), tb, 1.0)
                break
            chord = prog[bar % 4]
            root, notes = CH[chord]
            breakdown = outro and b >= 8  # вторая половина outro — без ударных, «воздух»

            # --- ударные
            if not breakdown or (outro and b == 8):
                if not lastbeat and not in_break(tb):
                    place(drums, I.kick(), tb, .8 * en); kicks.append(tb)
            if A["clap"] and pos in (1, 3) and not infill and not in_break(tb) and not breakdown:
                place(clapbus, I.clap(), tb, .55 * en, pan=0)
            if not breakdown and not infill:
                sub = A["hats"] // 4
                for h in range(sub):
                    th = tb + h * bt / sub
                    if in_break(th): continue
                    if sub == 2: v = (.35, .75)[h]
                    else: v = (.3, .16, .7, .2)[h]
                    v *= .9 + .2 * r.random()
                    if A["ohat"] and pos == 3 and h == sub - 1 + (0 if sub == 2 else -1) and bar % 2 == 1:
                        place(drums, I.hat(True, b), th, .85 * en, pan=.25)
                    else:
                        place(drums, I.hat(False, b * 4 + h), th, 1.25 * v * en, pan=.3 if h % 2 else -.15)
            # --- fill: дробь снэпов + шумовой райзер перед сменой сцены
            if infill:
                k0 = n - fill_b
                steps = 4 if b < n - 1 else 8
                for h in range(steps):
                    th = tb + h * bt / steps
                    prog_ = ((b - k0) * bt + h * bt / steps) / (fill_b * bt)
                    place(clapbus, I.snap(1 + .6 * prog_), th, (.18 + .5 * prog_ ** 1.5) * en, pan=(-.3, .3)[h % 2])
            # --- бас: «катящиеся» восьмые по корню (5-я ступень в конце такта)
            if not (in_break(tb)):
                for h in range(2):
                    th = tb + h * bt / 2
                    if in_break(th): continue
                    m = root + (7 if (pos == 3 and h == 1) else 0)
                    if breakdown:
                        if h == 0 and pos == 0:
                            place(bass, I.bass(root, bt * 4 - .05), th, .8)
                        continue
                    if lastbeat and h == 1: continue
                    place(bass, I.bass(m, bt / 2 * .82), th, .95 if h == 1 else .8)
            # --- пэд: целый аккорд на такт
            if pos == 0:
                barlen = min(4, n - b) * bt
                Lp = I.pad_loop(chord); m = int((barlen + .35) * SR); tq = np.arange(m) / SR
                envp = np.minimum(tq / .05, 1) * np.clip((barlen + .35 - tq) / .35, 0, 1)
                place(pad, Lp[:m] * envp[:, None], tb, 1.0)
            # --- арпеджио (плаки)
            sub = A["arp"] // 4 if not breakdown else 2
            if sub:
                seq = sorted(notes)
                pat = [0, 2, 4, 1, 3, 2, 4, 3]
                for h in range(sub):
                    th = tb + h * bt / sub
                    if in_break(th): continue
                    step = pos * sub + h
                    idx = pat[step % len(pat)] % len(seq)
                    if A["arpdir"] < 0: idx = len(seq) - 1 - idx
                    m = seq[idx] + 12 + (12 if (step % 8 == 6 and en >= 1) else 0)
                    acc = 1.0 if h == 0 else .65
                    place(arp, I.pluck(m, 1.0 + .3 * (en - .9)), th, .28 * acc, pan=(-.45, .45)[step % 2])

        # райзер к следующей сцене (шум, ~2 доли), а в outro — подводка к финальному аккорду
        if not outro:
            dur = fill_b * bt
            t0 = st + (n - fill_b) * bt
        else:
            dur = 2 * bt; t0 = st + (final_beat - 2) * bt
        u = tt(dur) / dur; nn = len(u)
        rs = svf(np.random.default_rng(300 + si).standard_normal(nn), 500 * (12000 / 500) ** u, 1 + 2 * u) * u ** 2.2
        rs = fades(rs, .005, .01)
        place(fx, np.stack([rs, np.roll(rs, 97)], 1), t0, .22)

    # брейк: «засасывание» перед ним, удар и пауза
    if brk:
        b0, b1, tx_ = brk
        d = .55; u = tt(d) / d
        sw = noise(len(u), 77, 2000, 14000) * u ** 3 * np.minimum(1, (d - u * d) / .02)
        place(fx, np.stack([sw, np.roll(sw, 131)], 1), b0 - d, .3)
        place(drums, I.boom(), tx_, .6)
        place(fx, I.crash(), b1, .45); place(drums, I.kick(True), b1, .9); kicks.append(b1)

    # сайдчейн от kick: «качание» баса/пэда/арпа
    pump = np.ones(N)
    pt = tt(.35); pe = 1 - np.minimum(pt / .004, 1) * np.exp(-pt / .09)
    for tk in kicks:
        i = int(tk * SR); m = min(len(pe), N - i)
        if m > 0: pump[i:i + m] = np.minimum(pump[i:i + m], 1 - (1 - pe[:m]))
    pump_b = 1 - .65 * (1 - pump); pump_p = 1 - .45 * (1 - pump); pump_a = 1 - .25 * (1 - pump)

    bass = ffilt(bass, lo=28, hi=900, order=2) * pump_b
    pad = ffilt(pad, lo=150, hi=5200, order=2) * pump_p[:, None]
    arp = ffilt(arp, lo=250, hi=9000, order=2) * pump_a[:, None]
    # пинг-понг дилей на арпеджио (пунктирная восьмая)
    dly = int(.75 * 60 / BPM * SR)
    a2 = np.zeros_like(arp)
    a2[dly:, 1] += arp[:-dly, 0] * .32
    a2[2 * dly:, 0] += arp[:-2 * dly, 1] * .2
    a2[3 * dly:, 1] += arp[:-3 * dly, 0] * .11
    arp = arp + ffilt(a2, lo=400, hi=5000)

    log("music: stems synthesized")
    send = .25 * arp + .45 * pad + .5 * clapbus + .2 * fx
    wet = reverb_st(send.mean(1), 2.6, 501, predelay=.02, lo=250, dark=5000)
    mus = (np.stack([bass, bass], 1) * .34 + drums * 1.0 + clapbus * 1.1 + pad * .6 + arp * 1.15 + fx * .8 + wet * .45)
    # ФВЧ 32 Гц + мягкая «полка» +3 дБ выше ~5 кГц (воздух, читаемость на телефоне)
    mus = ffilt(mus, H=lambda f: butter_mag(f, lo=32, order=3) * (1 + .41 / (1 + (5000 / np.maximum(f, 1)) ** 2)))

    # брейк: глушим всё, кроме удара на «Хруст» (саб) — плавно, 15 мс
    if brk:
        b0, b1, tx_ = brk
        gate = np.ones(N); i0, i1 = int(b0 * SR), int((b1 - .003) * SR); f_ = int(.015 * SR)
        gate[i0:i1] = 0
        gate[i0 - f_:i0] = np.linspace(1, 0, f_)
        gate[i1:i1 + f_] = np.linspace(0, 1, f_)
        boom = np.zeros((N, 2)); place(boom, I.boom(), tx_, .6)
        mus = mus * gate[:, None] + boom * (1 - gate[:, None])
    # конец ролика: затухание к total
    tt_ = np.arange(N) / SR
    mus *= np.clip((total - tt_) / 1.4, 0, 1)[:, None] ** 1.5
    return mus, grid, brk


# ============================================================ голос
def read_wav(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, np.float32).astype(np.float64)


def voice_track(tl, N):
    v = np.zeros(N)
    for l in tl["lines"]:
        place(v, read_wav(os.path.join(B, "voice", f"{l['key']}.wav")), l["start"])
    v = ffilt(v, lo=75, order=2)
    # лёгкий «присутствие»-подъём 2–5 кГц (+1.5 дБ) и мягкий срез сверху
    v = ffilt(v, H=lambda f: (1 + .19 * np.exp(-((np.log2(np.maximum(f, 1) / 3200)) ** 2) / .5)) * butter_mag(f, hi=15000))
    v /= np.abs(v).max() + 1e-12
    v = compressor(v, thr_db=-22, ratio=3.0, att=.003, rel=.08)
    v = deesser(v)
    v /= np.abs(v).max() + 1e-12
    v = limiter(v[:, None], ceil_db=-4.0, rel=.06)[0][:, 0]   # срезать редкие пики (−4 дБ), чтобы мастер не «качал»
    v /= np.abs(v).max() + 1e-12
    room = reverb_st(v, .55, 901, predelay=.012, lo=300, dark=6000)
    return np.stack([v, v], 1) + room * .1, v


def speech_activity(tl, N):
    act = np.zeros(N)
    for l in tl["lines"]:
        i0 = int(max(0, l["start"] - .06) * SR); i1 = int((l["start"] + l["dur"] + .12) * SR)
        act[i0:i1] = 1
    bs = 48
    a = block_view(act, bs).max(1)
    a = follow(a, .08, .3, bs / SR)
    return blocks_to_samples(a, bs, N)


# ============================================================ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sfx", default=os.path.join(B, "sfx.json"))
    ap.add_argument("--out", default=os.path.join(B, "mix.wav"))
    ap.add_argument("--stems", default=None, help="папка для стемов voice/music/sfx (для проверки)")
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--duck", type=float, default=-9.0, help="дакинг музыки под голос, дБ")
    args = ap.parse_args()

    tl = json.load(open(os.path.join(B, "timeline.json")))
    total = tl["total"]; N = int(round(total * SR))
    events = []
    if os.path.exists(args.sfx):
        events = json.load(open(args.sfx))
    else:
        print(f"WARNING: {args.sfx} not found — mixing without SFX", file=sys.stderr)
    log(f"timeline {total:.2f}s, {len(events)} sfx events from {os.path.relpath(args.sfx, ROOT)}")

    voice, vdry = voice_track(tl, N)
    log("voice processed")
    fx = render_sfx(events, N)
    if np.abs(fx).max() > 0:
        fx = fx + reverb_st(fx, 1.8, 701, predelay=.018, lo=200, dark=6000) * .28
    log("sfx rendered")
    mus, grid, brk = music(tl, N)
    log("music rendered")

    # уровни стемов относительно голоса
    Lv = lufs(voice)
    mus *= 10 ** ((Lv - 5.5 - lufs(mus)) / 20)          # без дакинга музыка на ~5.5 LU тише голоса
    vpk = np.abs(voice).max()
    fx *= .55 * vpk                                      # SFX «чуть под голосом»: пики ~0.2–0.5 от пика голоса
    if np.abs(fx).max() > 0:                             # шина SFX: пики не выше −6 дБ от пика голоса
        fx, _ = limiter(fx, ceil_db=dbfs(.5 * vpk), rel=.08)
    act = speech_activity(tl, N)
    duck = 10 ** (args.duck * act / 20)
    mus_d = mus * duck[:, None]

    # мастер: громкость → true-peak лимитер; две итерации для точного попадания
    mix = voice + mus_d + fx
    g = 10 ** ((args.lufs - lufs(mix)) / 20)
    for it in range(3):
        out, gr = limiter(mix * g, ceil_db=-1.3)
        L = lufs(out)
        if abs(L - args.lufs) < .05: break
        g *= 10 ** ((args.lufs - L) / 20)
    tp = dbfs(tp_env(out).max())
    log(f"master: {L:.2f} LUFS, true peak {tp:.2f} dBTP, max limiter GR {gr:.1f} dB")

    pcm = np.clip(np.round(out * 32767), -32768, 32767).astype("<i2")
    with wave.open(args.out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    log(f"written {args.out} ({N / SR:.2f}s, 48 kHz stereo 16-bit)")

    # отчёт: голос vs музыка во время речи
    vs, ms = voice * g, mus_d * g
    rms = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
    rows = []
    for s in range(int(total)):
        a, b = s * SR, (s + 1) * SR
        if act[a:b].mean() > .8 and rms(vs[a:b]) > -35:
            rows.append(rms(vs[a:b]) - rms(ms[a:b]))
    if rows:
        print(f"voice−music RMS during speech: median {np.median(rows):.1f} dB, min {np.min(rows):.1f} dB "
              f"over {len(rows)} s")
    if brk: print(f"music break: {brk[0]:.2f}–{brk[1]:.2f}s (Хруст @ {brk[2]:.2f})")
    print("grid:", ", ".join(f"{g_['id']} {60 / g_['bt']:.1f}bpm×{g_['n']}" for g_ in grid))

    if args.stems:
        os.makedirs(args.stems, exist_ok=True)
        for name, x in (("voice", vs), ("music", ms), ("sfx", fx * g)):
            with wave.open(os.path.join(args.stems, f"{name}.wav"), "wb") as w:
                w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
                w.writeframes(np.clip(np.round(x * 32767), -32768, 32767).astype("<i2").tobytes())
        log(f"stems → {args.stems}")


if __name__ == "__main__":
    main()
