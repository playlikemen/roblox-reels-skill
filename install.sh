#!/usr/bin/env bash
# Install or update the skills for Claude Code.
#   curl -fsSL https://raw.githubusercontent.com/playlikemen/roblox-reels-skill/main/install.sh | bash
#   ... | bash -s -- roblox-reels captions      # only some skills
#   SKILLS_DIR=.claude/skills bash install.sh   # into the current project instead of your home folder
set -euo pipefail
REPO="https://github.com/playlikemen/roblox-reels-skill"
CACHE="${ROBLOX_REELS_CACHE:-$HOME/.cache/roblox-reels}"
DEST="${SKILLS_DIR:-$HOME/.claude/skills}"
command -v git >/dev/null || { echo "git is required" >&2; exit 1; }
if [ -d "$CACHE/.git" ]; then git -C "$CACHE" pull -q --ff-only; else mkdir -p "$(dirname "$CACHE")"; git clone -q --depth 1 "$REPO" "$CACHE"; fi
mkdir -p "$DEST"
if [ "$#" -gt 0 ]; then WANT=("$@"); else WANT=(); for d in "$CACHE"/skills/*/; do WANT+=("$(basename "$d")"); done; fi
for s in "${WANT[@]}"; do
  [ -f "$CACHE/skills/$s/SKILL.md" ] || { echo "unknown skill: $s" >&2; exit 1; }
  rm -rf "${DEST:?}/$s"; cp -R "$CACHE/skills/$s" "$DEST/$s"; echo "installed $s -> $DEST/$s"
done
echo "Done ($(git -C "$CACHE" rev-parse --short HEAD)). Start a new Claude Code session to load the skills."
