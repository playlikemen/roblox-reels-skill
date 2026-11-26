# Sound (cartoon-3d-short step 8, simplified): event table -> synthesized SFX + the user's music bed ducked
# under the voice, music drop on the "quiet" beat, -14 LUFS-ish master. Output 48 kHz, exact video length.
import json, numpy as np, soundfile as sf
SR, FPS, TOTAL = 48000, 30, 1260
N = int(TOTAL / FPS * SR)
words = json.load(open('story/voice/words.json'))
lines = {}
for w in words: lines.setdefault(w['line'], []).append(w)
Wf = lambda l, i: round(lines[l][i]['s'] * FPS)
fr = lambda f: int(f / FPS * SR)
def ld(p):
    y, sr = sf.read(p, always_2d=True); assert sr == SR; return y
voice = ld('story/voice/voice_t.wav')[:, 0]
v = np.zeros(N); v[:min(N, len(voice))] = voice[:N]
music = ld('audio/numbers-bgm.wav')
m = np.zeros((N, 2)); m[:] = music[:N]
r = np.random.default_rng(3)
t = lambda d: np.arange(int(d * SR)) / SR
def env(n, a=0.004, d=0.12):
    x = np.arange(n) / SR; return np.minimum(1, x / a) * np.exp(-x / d)
def pop():   # block pop: pitched blip with fast downward chirp
    x = t(0.16); f = 900 * np.exp(-x * 9) + 380
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.002, 0.05)
def ding(p=1320):
    x = t(0.6); return (np.sin(2*np.pi*p*x) + 0.4*np.sin(2*np.pi*p*2.01*x)) * env(len(x), 0.002, 0.18) * 0.6
def thump(p=70):
    x = t(0.45); f = p * (1 + 2 * np.exp(-x * 30)); return np.sin(2*np.pi*np.cumsum(f)/SR) * env(len(x), 0.002, 0.14) * 1.2
def saw(d=0.9):
    x = t(d); n = r.standard_normal(len(x)); g = (np.sin(2*np.pi*5.5*x) > 0).astype(float) * 0.8 + 0.2
    from scipy.signal import butter, lfilter
    b, a = butter(2, [1200 / (SR/2), 5000 / (SR/2)], 'band'); return lfilter(b, a, n) * g * 0.5 * np.minimum(1, x/0.02)
def boing():
    x = t(0.5); f = 220 + 160 * np.sin(2*np.pi*9*x) * np.exp(-x*5); return np.sin(2*np.pi*np.cumsum(f)/SR) * env(len(x), 0.003, 0.2) * 0.6
sfx = np.zeros((N, 2))
def put(sig, f, g=1.0, lead=0):
    s = fr(f) - lead
    if sig.ndim == 1: sig = np.stack([sig, sig], 1)
    e = min(N, s + len(sig)); sfx[s:e] += sig[:e - s] * g
huss1, huss3 = ld('audio/in-this-town-huss.wav'), ld('audio/huss-huss-huss.wav')
cues = []
def cue(name, f, sig, g=1.0):
    put(sig, f, g); cues.append(f"{f:5d}  {f/FPS:6.2f}s  {name}")
for f in [Wf(0, 4), Wf(0, 13), Wf(1, 4), Wf(17, 8)]: cue('block pop +1', f, pop(), 0.8)
cue('ding 6', Wf(2, 4), ding(1320), 0.5); cue('ding 19', Wf(2, 9), ding(990), 0.6)
cue('whoosh up to tower', Wf(3, 3) - 8, huss1, 0.7); cue('thump clock tower', Wf(3, 6), thump(), 0.7)
cue('saw', Wf(4, 7) - 10, saw(0.75), 0.55)
for i in range(4): cue(f'block lands {i}', Wf(4, 8) + 1 + int(i * 1.5) + 16, thump(160 + i * 25), 0.35)
cue('boing ???', Wf(7, 6), boing(), 0.6); cue('ding 0 lies', Wf(6, 5), ding(1760), 0.35)
cue('blip ...', Wf(10, 0), pop() * 0.5, 0.6)
cue('!!!', Wf(14, 2), ding(660), 0.5)
cue('whoosh crane up', Wf(14, 4) - 4, huss3, 0.8); cue('thump clock', Wf(14, 8), thump(55), 0.9)
cue('whoosh fall', Wf(15, 0) - 2, huss1[::-1].copy(), 0.8)
cue('impact reveal', Wf(16, 0) - 2, thump(45), 1.0)
# music: duck to -11 dB under speech, drop to silence on "the whole square went quiet" until "Pip looked up"
vin = np.abs(v); k = int(0.25 * SR)
from scipy.ndimage import maximum_filter1d, uniform_filter1d
act = uniform_filter1d(maximum_filter1d((vin > 0.02).astype(float), k), int(0.1 * SR))
gain = 10 ** ((-7 - 6 * act) / 20)
q0, q1 = fr(Wf(13, 2)), fr(Wf(14, 4) - 2)
ramp = np.ones(N); ramp[q0:q1] = 0
ramp[q0 - fr(6):q0] = np.linspace(1, 0, fr(6)); ramp[q1:q1 + fr(10)] = np.linspace(0, 1, fr(10))
gain *= ramp
fade = np.ones(N); fade[-fr(40):] = np.linspace(1, 0, fr(40))
mix = np.stack([v, v], 1) * 1.0 + m * (gain * fade)[:, None] * 0.55 + sfx * 0.5
sf.write('audio/mix_raw.wav', mix, SR)
open('audio/cues.md', 'w').write("frame  time    event\n" + "\n".join(cues) + "\n")
print("\n".join(cues))
