"""Apply the established L³ voice/SFX mix with an original, subdued drone."""
import importlib.util
from pathlib import Path

import numpy as np

path = Path(__file__).resolve().parents[3] / 'tiktok/audio.py'
spec = importlib.util.spec_from_file_location('l3_audio', path)
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)


def ambience(timeline, samples):
    t = np.arange(samples, dtype=np.float32) / audio.SR
    envelope = np.minimum(t / 2.5, 1) * np.minimum((t[-1] - t) / 2, 1)
    morning = next(s for s in timeline['scenes'] if s['id'] == 'morning')
    quiet = (t >= morning['start'] - .3) & (t < morning['end'] - .3)
    envelope = envelope * (1 - .68 * quiet)
    motor = .46 * np.sin(2 * np.pi * 54 * t + .45 * np.sin(t * 1.4))
    harmonic = .16 * np.sin(2 * np.pi * 109 * t)
    pulse = .45 + .25 * np.sin(t * .57) + .17 * np.sin(t * 1.4)
    left = envelope * pulse * (motor + harmonic + .04 * np.sin(2 * np.pi * 171 * t))
    right = envelope * pulse * (motor + harmonic + .04 * np.sin(2 * np.pi * 172 * t))
    return np.column_stack((left, right)), [], None


audio.music = ambience
if __name__ == '__main__':
    audio.main()
