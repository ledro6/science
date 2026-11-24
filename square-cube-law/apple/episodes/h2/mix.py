"""Compose and mix the original horror score for «Шестой этаж», part 2."""
import importlib.util
from pathlib import Path

import numpy as np

path = Path(__file__).resolve().parents[3] / 'tiktok/audio.py'
spec = importlib.util.spec_from_file_location('l3_audio', path)
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)


def horror_score(timeline, samples):
    sr = audio.SR
    t = np.arange(samples, dtype=np.float32) / sr
    scenes = {s['id']:s for s in timeline['scenes']}
    lines = {line['key']:line for line in timeline['lines']}
    stereo = np.zeros((samples, 2), dtype=np.float32)

    def add(start, seconds, voice, gain, pan=0):
        first = int(start * sr)
        count = min(int(seconds * sr), samples-first)
        if count <= 0:
            return
        x = np.arange(count, dtype=np.float32) / sr
        sig = voice(x) * gain * np.minimum(x/.019, 1)
        sig *= np.minimum((x[-1]-x)/.065, 1)
        stereo[first:first+count, 0] += sig * (1-pan)
        stereo[first:first+count, 1] += sig * (1+pan)

    def keys(x, f):
        return (np.sin(2*np.pi*f*x) + .39*np.sin(2*np.pi*f*2.008*x)
                + .15*np.sin(2*np.pi*f*3.035*x))*np.exp(-2.75*x)

    def bowed(x, f):
        ph = 2*np.pi*f*x + .15*np.sin(2*np.pi*4.9*x)
        return (np.sin(ph)+.44*np.sin(2.001*ph)+.19*np.sin(3.005*ph)) * (
            np.minimum(x/.65, 1) * (.79+.21*np.sin(x*2.27)))

    def hit(x):
        ph=2*np.pi*(53*x+58*(1-np.exp(-7*x))/7)
        return (np.sin(ph)+.38*np.sin(1.99*ph) + .12*np.sin(4*ph))*np.exp(-4.8*x)

    # A repeating minor-second figure changes register and pace at each turn.
    for idx, (name, chord, step, gain) in enumerate([
        ('warning',(110,116.54,164.81),1.15,.075),
        ('voice',(98,103.83,146.83),.91,.10),
        ('mitten',(110,116.54,174.61),.99,.085),
        ('truth',(123.47,130.81,185),.69,.105),
        ('descent',(130.81,138.59,196),.49,.13),
        ('yesterday',(98,103.83,146.83),1.30,.067),
    ]):
        a,b = scenes[name]['start'],scenes[name]['end']
        tail = b-.2
        for k, moment in enumerate(np.arange(a+.28,tail,step)):
            if k%8==7 or (name=='yesterday' and k%5==4):
                continue
            f=chord[(0,1,0,2,0,1,2,1)[k%8]]*(2 if k%6==5 else 1)
            add(moment,1.72,lambda x,f=f:keys(x,f),gain*(1 if k%3==0 else .72),(-1)**k*.24)
        for j,moment in enumerate(np.arange(a+.4,tail-1.7,3.6)):
            f=chord[j%2]*1.5
            add(moment,3.4,lambda x,f=f:bowed(x,f)*np.minimum((3.4-x)/.85,1),gain*.44,(-1)**j*.36)
        if idx<5:
            add(a+.12,1.05,hit,.096 if idx<3 else .145)

    # Same approved h1 instruments/motif, new accents match the childhood reveal.
    reveal=next(w['t'] for w in lines['h212']['words'] if w['w'].startswith('мальчик'))
    add(reveal-.78,.78,lambda x:bowed(x,261.63)*(x/.78)**2,.19)
    add(reveal,1.55,hit,.28)
    final=next(w['t'] for w in lines['h214']['words'] if w['w'].startswith('без'))
    add(final-.63,2.3,lambda x:keys(x,130.81)+.62*keys(x,138.59),.17)
    add(final+.27,2.5,hit,.13)
    end=np.minimum((t[-1]-t)/.5,1)
    stereo*=end[:,None]
    return stereo,[],None


audio.music=horror_score
if __name__=='__main__':
    audio.main()
