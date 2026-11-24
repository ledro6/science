"""Run after TTS; add 1.2 s for reading 40% at the end of the display scene."""
import json
from pathlib import Path
p=Path(__file__).parent/'build'
tl=json.loads((p/'timeline.json').read_text())
if not tl.get('m5_display_read_hold'):
    at=next(s['end'] for s in tl['scenes'] if s['id']=='display')
    delta=1.2
    for s in tl['scenes']:
        if s['id']=='display':s['end']=round(s['end']+delta,3)
        elif s['start']>=at-.01:
            s['start']=round(s['start']+delta,3);s['end']=round(s['end']+delta,3)
    for l in tl['lines']:
        if l['start']>=at:
            l['start']=round(l['start']+delta,3)
            for w in l['words']:w['t']=round(w['t']+delta,3)
    tl['total']=round(tl['total']+delta,3)
    tl['m5_display_read_hold']=delta
(p/'timeline.json').write_text(json.dumps(tl,ensure_ascii=False,indent=1))
(p/'timeline.js').write_text('window.TL='+json.dumps(tl,ensure_ascii=False)+';')
with (p/'timeline_readable.txt').open('w') as f:
    for l in tl['lines']:
        f.write(f"{l['scene']} {l['key']} {l['start']} → {round(l['start']+l['dur'],2)} | "+' '.join(f"{w['w']}@{w['t']}" for w in l['words'])+'\n')
    for s in tl['scenes']:f.write(str(s)+'\n')
print('duration',tl['total'])
