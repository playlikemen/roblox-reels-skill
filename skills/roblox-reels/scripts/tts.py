import sys, numpy as np, soundfile as sf
from kokoro import KPipeline
voice = sys.argv[1]; speed = float(sys.argv[2]); out = sys.argv[3]
lines = [l.strip() for l in open('story/script.txt') if l.strip()]
p = KPipeline(lang_code='a')
sr = 24000; chunks = []
for i, l in enumerate(lines):
    for _, _, a in p(l, voice=voice, speed=speed):
        chunks.append(np.asarray(a))
    # short breath between lines; longer after the twist setup
    gap = 0.12 if i not in (10, 16) else 0.4
    chunks.append(np.zeros(int(sr * gap)))
y = np.concatenate([np.zeros(int(sr*0.05))] + chunks)
y = y / max(1e-6, np.abs(y).max()) * 0.89
sf.write(out, y, sr)
print(out, len(y)/sr)
