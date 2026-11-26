#!/usr/bin/env bash
# Full chain for one reel. Run from the project folder (a copy of templates/hat-town).
#   bash <skill>/scripts/build.sh [voice] [speed]
# Needs: node 20+, ffmpeg, python 3.10+ with kokoro, faster-whisper, soundfile, numpy, scipy, pillow.
set -euo pipefail
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY="${PYTHON:-python3}"; VOICE="${1:-af_heart}"; SPEED="${2:-1.3}"
SCALE="${SCALE:-1.3333}"; CONC="${CONCURRENCY:-8}"; COMP="${COMP:-HatTown}"; FRAMES="${FRAMES:-1260}"
mkdir -p story/voice audio out/captions out/final out/qa

echo "1/7 voice";   "$PY" "$SKILL/scripts/tts.py" "$VOICE" "$SPEED" story/voice/voice.wav
ffmpeg -y -v error -i story/voice/voice.wav -af "silenceremove=stop_periods=-1:stop_duration=0.28:stop_threshold=-45dB:stop_silence=0.22" -ar 48000 story/voice/voice_t.wav
echo "2/7 word times"; "$PY" "$SKILL/scripts/words.py"; cp story/voice/words.json src/hat/words.json
echo "3/7 sound";   for n in numbers-bgm in-this-town-huss huss-huss-huss; do ffmpeg -y -v error -i "$SKILL/assets/audio/$n.mp3" -ac 2 -ar 48000 "audio/$n.wav"; done
"$PY" "$SKILL/scripts/mix.py"
ffmpeg -y -v error -i audio/mix_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 audio/mix.wav
echo "4/7 frames (software GL is slow: keep concurrency <= 16)"
rm -rf out/frames
npx remotion render src/index.ts "$COMP" out/frames --sequence --image-format=jpeg --jpeg-quality=95 --scale "$SCALE" --gl=swangle --concurrency "$CONC" --timeout 240000
echo "5/7 encode"
ffmpeg -y -v error -framerate 30 -i out/frames/element-%04d.jpeg -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart out/final/clean.mp4
echo "6/7 captions"
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 out/final/clean.mp4); H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 out/final/clean.mp4)
"$PY" "$SKILL/scripts/captions.py" story/voice/words.json out/captions --w "$W" --h "$H" --frames "$FRAMES" --max-width 0.64 ${KEYS:+--keys "$KEYS"}
ffmpeg -y -v error -i out/final/clean.mp4 -i out/captions/captions_alpha.mov -filter_complex "[0:v][1:v]overlay=format=auto" -map 0:a:0 -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart out/final/captioned.mp4
echo "7/7 QA"; "$PY" "$SKILL/scripts/short_qa.py" out/final/captioned.mp4 out/qa | head -8
echo "done: out/final/captioned.mp4"
