#!/usr/bin/env bash
# Render the homepage hero loop from Hero.vid.py with CommandAGI's headless renderer and write the site files.
#   ./build.sh                 render into $WORK/out and report sizes
#   INSTALL=1 ./build.sh       ...and copy home-hero.mp4, home-hero-720.mp4, home-hero.jpg into public/media/video/
# Needs: a CommandAGI checkout ($COMMANDAGI, default ~/Documents/commandagi) with packages/applets/video/eval installed,
# and an ffmpeg 7 with libx264 ($FFMPEG_PATH; the renderer uses the same one).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
COMMANDAGI="${COMMANDAGI:-$HOME/Documents/commandagi}"
FF="${FFMPEG_PATH:-$(command -v ffmpeg)}"
WORK="${WORK:-${TMPDIR:-/tmp}/tensaco-hero}"
OUT="$WORK/out"
SITE="$HERE/../../public/media/video"
POSTER_T="${POSTER_T:-0.0}"   # the first frame: what the loop opens on, so the poster hands over to the video seamlessly
mkdir -p "$OUT"

# 1. The cut itself: Hero.vid.py -> a 1920x1080 30 fps master (silent; the "audioDecode ... (skipped)" lines are the
#    stock clips having no sound track and are harmless).
(cd "$COMMANDAGI/packages/applets/video/eval" && FFMPEG_PATH="$FF" npx tsx src/cli.ts "$HERE/Hero.vid.py" \
  --out "$OUT/master.mp4" --quality high)

# 2. Web encodes: H.264, no audio track, faststart. 1080p for large screens, 720p for small ones.
"$FF" -v error -y -i "$OUT/master.mp4" -an -c:v libx264 -preset slow -crf 28 -maxrate 2.5M -bufsize 5M \
  -profile:v high -pix_fmt yuv420p -g 60 -movflags +faststart "$OUT/home-hero.mp4"
"$FF" -v error -y -i "$OUT/master.mp4" -an -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 28 \
  -maxrate 1.2M -bufsize 2.4M -profile:v high -pix_fmt yuv420p -g 60 -movflags +faststart "$OUT/home-hero-720.mp4"
"$FF" -v error -y -ss "$POSTER_T" -i "$OUT/master.mp4" -frames:v 1 -q:v 4 "$OUT/home-hero.jpg"

ls -la "$OUT"/home-hero*
if [ "${INSTALL:-0}" = 1 ]; then cp "$OUT"/home-hero.mp4 "$OUT"/home-hero-720.mp4 "$OUT"/home-hero.jpg "$SITE/"; echo "installed into $SITE"; fi
