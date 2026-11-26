# Direction notes measured from two viral "In this town ... except me" reels

Measured frame by frame (ffmpeg `scdet` for cuts, faster-whisper for words) on two popular reels of this format:
a 14.5 s teaser (720x900, 30 fps) and a 66.5 s full story (720x1280, 24 fps). Use these as the target, not Hat Town's
slower pacing. Copy the grammar, never the story, characters or narration of another creator.

## Numbers
| | 14.5 s teaser | 66.5 s story | Hat Town v1 |
|---|---|---|---|
| Shots | 9 | 71 | ~22 |
| Mean shot | 1.6 s | **0.94 s** | ~1.9 s |
| Shortest / longest | 0.7 / 3.2 s | 0.4 / 1.9 s | |
| Narration pace | 212 wpm | **225 wpm** | ~205 wpm |
| Words | 46 | 249 | 143 |
| Catchphrase refrain | 2 times | 9 times | 0 |
| Caption | 1 word | 1 word | 2-3 words |

## Cutting
- **One shot per phrase (2-5 words).** Cut on the first stressed word of the next phrase, so the picture changes as the new idea is spoken.
- No shot longer than 2 s, except the opening establishing shot (up to 3.2 s) and one breath before the climax.
- Each shot holds still or creeps slowly; the speed comes from the cuts, not from fast camera moves.
- **List beats get one location each:** "the baker ... the mailman ... grandma" is three cuts to three places, each with the character doing the rule in their own setting. Each gets 2-3 quick angles (wide, then medium close-up).
- **Hard reversals cut to a wide:** "Nobody goes outside anymore" plays over an empty street wide, a slow push, a car passing.

## The refrain (sound + picture motif)
- A short chant (here "huss huss huss") is the hero's signature. It plays every time the hero does the thing the town doesn't.
- Picture: the hero from a low angle, a medium shot, dribbling or acting on each beat, one cut per chant beat (3-6 cuts of 0.4-0.7 s).
- Caption: the chant word UPPERCASE with "!", all other words lowercase.
- It returns at the call to action, at the climax (longest version) and as the final button, after the twist.
- In the full story, the refrain shots alternate a low-angle hero close-up with a wide of the empty location.

## Story shape (66 s version)
1. Rule + "except me" (0-3 s), then the refrain at once.
2. Three examples, each sillier, plus one absurd capper ("even the pigeons left").
3. The hero's lonely routine, with a number ("five hundred shots before school"). Refrain.
4. One line of friend dialogue, and the hero's comeback. Refrain.
5. **Inciting letter / challenge** with stakes that hit the whole town.
6. Training montage: one-line gags, one per cut.
7. Game day: the town is in the crowd, still doing the rule. A gag per character (callbacks to step 2).
8. Down and out (a number: "down by twenty"). The hero takes over: longest refrain, a run of quick wins.
9. Last-second shot, a slow-motion insert of the ball and hoop, a win.
10. Twist ending: the town now does the hero's thing ... "except me". The hero now does the town's old rule. Refrain button.

## Look
- Bright daylight, saturated sky blue, white puffy clouds; night only for the teaser's mood.
- Caption: one word at a time, white with a thin black outline, lowercase, centre at ~62 % of the height. The refrain word is uppercase.
- The hero wears one bold colour block (cap + hoodie) and a big letter on the chest, readable at thumbnail size.
- Big scoreboards, signs and TV screens carry the plot (a "DELETE GTA 6?" style dialog, a score) so the story reads with the sound off.

## How to apply in this skill
- `scripts/captions.py ... --max-words 1 --case lower --shout "HUSS"` for the one-word style.
- `tts.py --speed 1.35` lands near 220 wpm with Kokoro af_heart/am_puck.
- Plan shots in `story.ts` from the phrase list, not the sentence list: `W(line, word)` at the start of every phrase.
- Put the refrain on its own script line so `words.py` times each chant beat; cut on every beat.
