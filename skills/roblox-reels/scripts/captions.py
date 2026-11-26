# Port of the `captions` skill rules (claude-shorts-skills/skills/captions/SKILL.md): word-synced captions as a
# SEPARATE clip (pure-green + ProRes 4444 alpha) plus captions.json. White UPPERCASE, black outline, hard
# drop shadow down-right, 2-3 words, middle of the capitals at 71.5 % of the height, 3.2 % font size, punctuation
# kept, key words in yellow (--key-color), 5-frame pop 0.85 -> 1.06 -> 1, YouTube Shorts safe-zone check.
import json, re, sys, subprocess, argparse
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('words'); ap.add_argument('outdir')
ap.add_argument('--w', type=int, default=1440); ap.add_argument('--h', type=int, default=2560)
ap.add_argument('--fps', type=int, default=30); ap.add_argument('--frames', type=int, default=1260)
ap.add_argument('--y', type=float, default=0.715); ap.add_argument('--size', type=float, default=0.032)
ap.add_argument('--max-width', type=float, default=0.68); ap.add_argument('--max-words', type=int, default=3)
ap.add_argument('--gap', type=float, default=0.30); ap.add_argument('--hold', type=float, default=0.25)
ap.add_argument('--font', default='/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf')
ap.add_argument('--key-color', default='FFD21F'); ap.add_argument('--keys', default='')
ap.add_argument('--keep', action='append', default=[])
ap.add_argument('--case', choices=['upper', 'lower'], default='upper')  # lower = one-word style from references/direction.md
ap.add_argument('--shout', default='')  # words always UPPERCASE with '!' kept (the refrain), comma-separated
a = ap.parse_args()
W, H = a.w, a.h
words = json.load(open(a.words))
KEYS = set(k.strip().upper() for k in a.keys.split(',') if k.strip())
GLUE = {'the', 'a', 'an', 'of', 'to', 'at', 'my', 'your', 'his', 'her', 'is', 'and', 'with', 'for', 'one', 'that', 'has', 'i', 'so', 'then', 'just', 'way', 'their', 'your', 'you'}
font = ImageFont.truetype(a.font, round(a.size * H))
stroke = max(2, round(a.size * H * 0.13)); shadow = max(2, round(a.size * H * 0.09))
SHOUT = set(k.strip().upper() for k in a.shout.split(',') if k.strip())
def clean(s):
    s = re.sub(r'["“”]', '', s)
    if a.case == 'upper' or re.sub(r'[^A-Za-z]', '', s).upper() in SHOUT: return s.upper()
    return s.lower()
measure = lambda text: font.getlength(text) + 2 * stroke + shadow

keep = [k.lower().split() for k in a.keep]
def in_keep(i):  # never split a kept phrase between i and i+1
    for k in keep:
        for s in range(len(words) - len(k) + 1):
            if [re.sub(r'[^a-z]', '', words[s + j]['w'].lower()) for j in range(len(k))] == k and s <= i < s + len(k) - 1: return True
    return False

# 1) phrases: break after . , ? ! or a pause in the voice (never inside a --keep phrase)
phrases, cur = [], []
for i, w in enumerate(words):
    cur.append(i)
    nxt = words[i + 1] if i + 1 < len(words) else None
    if nxt is None or ((re.search(r'[.,?!]["”]?$', w['w']) or nxt['s'] - w['e'] > a.gap) and not in_keep(i)):
        phrases.append(cur); cur = []
# 2) split each phrase into balanced pieces of <= max-words that fit, never ending on a glue word, never splitting a kept phrase
nm = lambda j: re.sub(r'[^a-z]', '', words[j]['w'].lower())
fits = lambda c: measure(' '.join(clean(words[j]['w']) for j in c)) <= a.max_width * W
def ok_cut(ph, at):  # cut between ph[at-1] and ph[at]
    return nm(ph[at - 1]) not in GLUE and not in_keep(ph[at - 1])
def split(ph):
    n = len(ph)
    if n <= a.max_words and fits(ph): return [ph]
    if any(in_keep(j) for j in ph) and n <= a.max_words + 1 and fits(ph): return [ph]
    best = None
    for k in range(2, n + 1):
        import itertools
        for cuts in itertools.combinations(range(1, n), k - 1):
            parts = [ph[s:e] for s, e in zip((0,) + cuts, cuts + (n,))]
            if any(len(p) > a.max_words + (1 if any(in_keep(j) for j in p[:-1]) else 0) or not fits(p) for p in parts): continue
            bad = sum(0 if ok_cut(ph, c) else 1 for c in cuts) * 10 + sum(1 for p in parts if len(p) == 1) * 3
            spread = max(len(p) for p in parts) - min(len(p) for p in parts)
            score = (bad, spread)
            if best is None or score < best[0]: best = (score, parts)
        if best: return best[1]
    return [[j] for j in ph]
chunks = [p for ph in phrases for p in split(ph)]

caps = []
for n, c in enumerate(chunks):
    s = words[c[0]]['s']; e_last = words[c[-1]]['e']
    nxt = words[chunks[n + 1][0]]['s'] if n + 1 < len(chunks) else None
    e = nxt if (nxt is not None and nxt - e_last <= a.gap) else e_last + a.hold
    caps.append({'text': ' '.join(clean(words[j]['w']) for j in c), 'in': round(s, 3), 'out': round(e, 3),
                 'f0': round(s * a.fps), 'f1': round(e * a.fps)})

def draw(cap, scale):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    toks = cap['text'].split()
    big = font if scale == 1 else ImageFont.truetype(a.font, max(4, round(a.size * H * scale)))
    st = max(1, round(stroke * scale)); sh = max(1, round(shadow * scale))
    sp = big.getlength(' ')
    widths = [big.getlength(t) for t in toks]
    total = sum(widths) + sp * (len(toks) - 1)
    asc = big.getbbox('H')  # anchor = middle of the capitals
    cy = a.y * H; top = cy - (asc[1] + asc[3]) / 2
    x = (W - total) / 2
    d = ImageDraw.Draw(img)
    for pass_ in ('shadow', 'text'):
        xx = x
        for t, wdt in zip(toks, widths):
            key = re.sub(r'[^A-Za-z0-9]', '', t).upper() in KEYS
            if pass_ == 'shadow':
                d.text((xx + sh, top + sh), t, font=big, fill=(0, 0, 0, 255), stroke_width=st, stroke_fill=(0, 0, 0, 255))
            else:
                col = tuple(int(a.key_color[i:i + 2], 16) for i in (0, 2, 4)) + (255,) if key else (255, 255, 255, 255)
                d.text((xx, top), t, font=big, fill=col, stroke_width=st, stroke_fill=(0, 0, 0, 255))
            xx += wdt + sp
    return img

# safe-zone check at the pop's 1.06 peak
reach = [1, 0, 1, 0]
for c in caps:
    bb = draw(c, 1.06).getbbox()
    if not bb: continue
    x0, y0, x1, y1 = bb[0] / W, bb[1] / H, bb[2] / W, bb[3] / H
    reach = [min(reach[0], x0), max(reach[1], x1), min(reach[2], y0), max(reach[3], y1)]
    if x1 > 0.84 or y1 > 0.75 or y0 < 0.08: print('WARNING outside the Shorts safe zone:', c['text'])
for c in caps: print(f"{c['in']:6.2f}-{c['out']:6.2f}  {c['text']}")
print(f"reach: {reach[0]*100:.1f}-{reach[1]*100:.1f} % of width, {reach[2]*100:.1f}-{reach[3]*100:.1f} % of height")
json.dump([{k: c[k] for k in ('text', 'in', 'out')} for c in caps], open(f'{a.outdir}/captions.json', 'w'), indent=1)

POP = [0.85, 0.94, 1.03, 1.06, 1.0]
cache = {}
def frame(f):
    for c in caps:
        if c['f0'] <= f < c['f1']:
            sc = POP[f - c['f0']] if f - c['f0'] < len(POP) else 1.0
            k = (c['text'], c['f0'], sc)
            if k not in cache: cache[k] = draw(c, sc).tobytes()
            return cache[k]
    return None
blank = Image.new('RGBA', (W, H), (0, 0, 0, 0)).tobytes()
enc = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(a.fps), '-i', '-']
alpha = subprocess.Popen(enc + ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', f'{a.outdir}/captions_alpha.mov'], stdin=subprocess.PIPE)
green = subprocess.Popen(enc + ['-filter_complex', 'color=0x00FF00:s=%dx%d:r=%d[g];[g][0:v]overlay=format=auto:shortest=1' % (W, H, a.fps), '-c:v', 'libx264', '-crf', '8', '-pix_fmt', 'yuv444p', f'{a.outdir}/captions_green.mp4'], stdin=subprocess.PIPE)
for f in range(a.frames):
    b = frame(f) or blank
    alpha.stdin.write(b); green.stdin.write(b)
alpha.stdin.close(); green.stdin.close(); alpha.wait(); green.wait()
print('wrote', a.outdir, len(caps), 'captions')
