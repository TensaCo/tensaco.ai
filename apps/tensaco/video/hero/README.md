# Homepage hero loop

The full-screen background video behind the tensaco.ai homepage headline. Silent, 20.8 s, loops without a visible
cut. Files in `public/media/video/`: `home-hero.mp4` (1920×1080, large screens), `home-hero-720.mp4` (1280×720, small
screens), `home-hero.jpg` (poster, the first frame; also what visitors with reduced motion see). Shown by
`src/app/HeroVideo.tsx`.

## The cut

The edit is [`Hero.vid.py`](Hero.vid.py), a CommandAGI video (`commandagi.design.media`): one track of stock clips
from `public/media/video/`, each filling the frame, each dissolving into the next over 0.6 s. Change a shot by editing
`SHOTS` (clip, source in, source out, in seconds); the file also opens in the CommandAGI video editor.

| # | clip | source in–out | picture |
|---|---|---|---|
| 1 | city-skyline-golden-hour | 2.0–5.2 | downtown towers at golden hour, aerial drift |
| 2 | datacenter-servers | 0.5–3.7 | rack-mounted servers, status LEDs |
| 3 | operations-control-room | 1.0–4.4 | operators before a wall of displays |
| 4 | substation-crew | 1.5–4.9 | line crew at an electrical substation |
| 5 | lab-oscilloscope | 0.5–3.7 | engineer probing a circuit |
| 6 | software-team-code-review | 1.0–4.4 | a team reviewing code |
| 7 | office-lobby-walking | 2.5–5.9 | colleagues walking through a lobby |
| 8 | city-skyline-golden-hour | 0.2–2.0 | the skyline again, ending on the frame shot 1 starts from, so the loop is seamless |

All clips are Pexels-licensed stock (authors in `public/media/credits.json`, entry `home-hero`). Keep it to people and
industry; no generated footage, no text in the picture (the page sets the type).

## Rebuild

```bash
FFMPEG_PATH=/path/to/ffmpeg-7 ./build.sh             # render into $WORK/out (default $TMPDIR/tensaco-hero)
FFMPEG_PATH=/path/to/ffmpeg-7 INSTALL=1 ./build.sh   # ...and copy the three files into public/media/video/
```

`build.sh` runs CommandAGI's headless renderer (`packages/applets/video/eval`, checkout at `$COMMANDAGI`, default
`~/Documents/commandagi`) on `Hero.vid.py` for the 1080p master, then encodes the web files with the same ffmpeg:
H.264, no audio track, `+faststart`, CRF 28 (about 5.4 MB at 1080p, 2.6 MB at 720p). The renderer prints one
"audioDecode … (skipped)" line per clip because the stock clips have no sound; that is expected.

If you add or swap a source clip, update the `home-hero` entry in `public/media/credits.json`.
