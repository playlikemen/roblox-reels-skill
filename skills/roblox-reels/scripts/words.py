import json, re, difflib
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
segs, _ = m.transcribe('story/voice/voice_t.wav', word_timestamps=True, initial_prompt="Pip, baker, mayor, clock tower.")
hw = [w for s in segs for w in s.words]
lines = [l.strip() for l in open('story/script.txt') if l.strip()]
sw = []  # (word, line index)
for li, l in enumerate(lines):
    for t in l.split():
        sw.append((t, li))
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
A = [norm(w) for w, _ in sw]; B = [norm(w.word) for w in hw]
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
times = [None] * len(A)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
        for k in range(i2 - i1):
            times[i1 + k] = (hw[j1 + k].start, hw[j1 + k].end)
    elif tag == 'replace':
        s, e = hw[j1].start, hw[j2 - 1].end
        n = i2 - i1
        for k in range(n):
            times[i1 + k] = (s + (e - s) * k / n, s + (e - s) * (k + 1) / n)
# fill gaps by interpolation
for i, t in enumerate(times):
    if t is None:
        p = next(times[j][1] for j in range(i - 1, -1, -1) if times[j])
        q = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), p + 0.3)
        times[i] = (p, min(q, p + 0.3))
out = [{"w": w, "line": li, "s": round(t[0], 3), "e": round(t[1], 3)} for (w, li), t in zip(sw, times)]
json.dump(out, open('story/voice/words.json', 'w'), indent=0)
print("miss", sum(1 for t in times if t is None), "n", len(out))
for li in range(len(lines)):
    ws = [o for o in out if o['line'] == li]
    print(f"{li:2d} {ws[0]['s']:6.2f}-{ws[-1]['e']:6.2f} {lines[li]}")
print("whisper:", " ".join(w.word.strip() for w in hw))
