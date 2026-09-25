#!/usr/bin/env bash
# Render the TensaCo brand film and write the site files.
#   WORK=/tmp/claude-1000/tensaco-video ./build.sh [poster_time_s]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${WORK:-/tmp/claude-1000/tensaco-video}"
FF="$WORK/bin/ffmpeg"
OUT="$WORK/out"
SITE="$HERE/../../public/media/video"
POSTER_T="${1:-27.0}"
T="-threads 4"

WORK="$WORK" python3 "$HERE/edit.py"   # -> $OUT/video-only.mp4 (near-lossless)

# Music: two-pass EBU R128 loudness normalisation to -16 LUFS, true peak -1.5 dBTP
stats=$("$FF" -hide_banner -i "$WORK/music/m1.mp3" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$stats" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
LN="loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true"
"$FF" -v error -y -i "$WORK/music/m1.mp3" -af "atrim=0:30,$LN,afade=t=out:st=29.5:d=0.5,aresample=48000" -c:a pcm_s16le "$OUT/music-16lufs.wav"

# 1080p master (< ~25 MB) and 720p web version (< 8 MB), H.264 + AAC, faststart
"$FF" -v error -y $T -i "$OUT/video-only.mp4" -i "$OUT/music-16lufs.wav" -map 0:v -map 1:a -t 30 \
  -c:v libx264 -preset slow -crf 20 -maxrate 6M -bufsize 12M -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "$OUT/tensaco-brand-30s.mp4"
"$FF" -v error -y $T -i "$OUT/video-only.mp4" -i "$OUT/music-16lufs.wav" -map 0:v -map 1:a -t 30 \
  -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 23 -maxrate 1.8M -bufsize 3.6M -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart "$OUT/tensaco-brand-30s-720.mp4"
"$FF" -v error -y -ss "$POSTER_T" -i "$OUT/video-only.mp4" -frames:v 1 -vf scale=1920:1080 -q:v 3 "$OUT/tensaco-brand-30s.jpg"

# report: loudness of the final mix and file sizes
"$FF" -hide_banner -i "$OUT/tensaco-brand-30s.mp4" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p'
ls -la "$OUT"/tensaco-brand-30s*
if [ "${INSTALL:-0}" = 1 ]; then cp "$OUT"/tensaco-brand-30s.mp4 "$OUT"/tensaco-brand-30s-720.mp4 "$OUT"/tensaco-brand-30s.jpg "$SITE/"; fi
