---
name: roblox-reels
description: Make a 30-60 s vertical (9:16) narrated "In this town, ..." story reel with original blocky characters, rendered in code with three.js inside Remotion - no Roblox Studio, no AI video generator. Covers the rule-story script, local AI voice, word-synced timing, toon 3D world, drawn faces, comic stickers, music and SFX mix, Shorts-safe captions (burned in plus a separate green-screen and alpha clip), frame-by-frame QA and a swipeable reels page. Use when the user asks for a Roblox-style story reel, an "In this town" short, a blocky storytime Short/Reel/TikTok, or says "use the roblox reels skill".
---

# Roblox-style story reels, rendered in code

One skill that joins three others in this repo:

| From | What this skill takes |
|---|---|
| `roblox-in-this-town` | What makes these shorts work: the rule story, the hook, few places revisited, the player camera, faces, stickers |
| `cartoon-3d-short` / `claude-animated-shorts` | The render method: three.js in Remotion, toon shading, ink outlines, glide cameras, synthesized sound, QA |
| `captions` | Word-synced captions kept clear of the Shorts UI, delivered burned in and as separate clips |

Read those skills when you need depth on one area. This file is the short path from idea to finished file.

The characters are original blocky figures. Never use Roblox logos, other creators' avatars, faces, scripts or videos.

## What you need
- Node 20+, ffmpeg, Python 3.10+ with `kokoro`, `faster-whisper`, `soundfile`, `numpy`, `scipy`, `pillow`.
- No GPU needed: Remotion renders with software GL (`--gl=swangle`).

## Workflow
1. **Script** (`story/script.txt`, one sentence per line). Rule stories follow this shape:
   - the rule in the first line, said as if normal ("In this town, ...")
   - one small example with a number, then a huge one
   - "... except me"
   - a named friend, two or three tests that fail
   - the twist that explains a detail planted early
   - a last line that invites a comment
   Write numbers as words. Aim for 110-150 words. Show the user the script and the planted details before building.
2. **Project.** Copy `templates/hat-town/` to a new folder and run `npm install`. It is a full working reel; change the story, keep the machinery.
3. **Voice and word times.** `scripts/tts.py` (Kokoro, local) then `scripts/words.py` (faster-whisper, aligned to the script's own spelling). Target 3.5-4.7 words per second. The voice is the clock: every cut, pop and face change is anchored to a word with `W(line, word)` in `src/hat/story.ts`.
4. **Shot plan** in `story.ts`. One shot per sentence or clause. Per shot: where the camera is, what it looks at, the field of view, and what changes on which word.
5. **Stills before rendering.** `node stills.mjs out/stills/a_ 20,100,300 0.5` (in the project folder; it ships with the template), then `scripts/sheet.sh out/sheet.jpg out/stills/a_*.jpg`. Look at the sheet, fix everything in one pass, re-render only the frames you changed.
6. **Sound.** `scripts/mix.py`: an event table of synthesized pops, dings and thumps on visible events, the music bed ducked under the voice, mastered to -14 LUFS.
7. **Render, captions, QA.** `scripts/build.sh` runs the whole chain and ends with the QA report.
8. **Show it.** `templates/reels-site/` is a swipeable reels page with a small server that supports video seeking. Put the videos in `v/` and list them in `meta.json`.

## Rules that decide whether it looks good
- **A character big and readable in the first second.** The rule must be visible on them with the sound off (here: a block pops onto the hat on the word "lie").
- **One place, revisited.** Fill it with its own people doing what the place is for.
- **Vertical frames are narrow.** At 9:16 the horizontal view is about half the vertical one. For a medium close-up use a field of view of 50 at 7-8 units, not 40 at 5: the tighter one fills the frame with a forehead.
- **Faces toward the camera.** Check every still for backs of heads. For a line of dialogue shoot over the listener's shoulder, offset sideways so the listener's head does not cover the speaker.
- **Keep the lens out of things.** A camera inside a hat stack or a wall renders black. The QA report lists black frames; extras that walk in loops are the usual cause. Move them off the camera path.
- **Every hold creeps in.** No static shot. Glides use smootherstep. Impacts get a 7-frame flip-kick.
- **Big expressions only at turning points.** Calm faces most of the time, blinks, mouth flaps only on quoted lines.
- **Stickers land on the word.** "+1", a number, "???", "!!!". One idea per moment.
- **Hide the twist honestly or not at all.** If a prop would give the ending away, keep it out of frame or hide it until the reveal shot.

## Captions
`scripts/captions.py words.json outdir --w 1440 --h 2560 --frames 1260 --keys "LIE,BLOCK" --keep "clock tower"`
- 2-3 words, uppercase, white with a black outline and a hard shadow, key words in yellow.
- Middle of the capitals at 71.5 % of the height, size 3.2 % of the height.
- Never deliver with a `WARNING outside the Shorts safe zone` line: lower `--max-width` (0.62-0.64 works).
- Outputs `captions_green.mp4`, `captions_alpha.mov` (ProRes 4444) and `captions.json`.

## Rendering notes
- Software GL times out with many tabs at 2K. Use `--concurrency 8` to `16` and `--timeout 240000`.
- If Remotion's own encoder fails, render a JPEG sequence (`--sequence`) and encode with system ffmpeg. `build.sh` does this.
- 1260 frames at 1440x2560 take about 6 minutes on a 64-core machine without a GPU.

## Assets
`assets/audio/`: `numbers-bgm.mp3` (music bed), `in-this-town-huss.mp3` and `huss-huss-huss.mp3` (whooshes). Check that you have the right to use a music track before you post a video with it; swap in your own with the same file name.

## Deliver
`out/final/captioned.mp4` (ready to post), `out/final/clean.mp4`, the caption clips, `audio/cues.md` and the QA report. Tell the user what you did not check.
