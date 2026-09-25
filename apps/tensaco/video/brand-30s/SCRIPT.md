# TensaCo brand film, 30 s

On the tensaco.ai landing page, below "AI is now a question of energy and trust." Files:
`public/media/video/tensaco-brand-30s.mp4` (1920×1080 master), `tensaco-brand-30s-720.mp4` (web), `tensaco-brand-30s.jpg`
(poster).

No voiceover: the music and on-screen type carry it. Claims follow CLAUDE.md: no energy multiples, PHASER described
qualitatively.

## Script and shot list

Music: 120 BPM, 2 s bars. Sparse pulse 0–8 s, drums in at 8 s, full drive 16–24 s (accents at 16 and 20 s), the hit at
24 s, then a resolved chord that rings out to 30 s. Cuts fall on beats.

| time (s) | picture | on screen |
|---|---|---|
| 0–2 | data-center aisle at night, slow push (Veo) | AI is scaling. |
| 2–4 | transmission towers at dusk (Veo) | Its limit is energy. |
| 4–6 | engineer reviewing code, face lit by the screen (Veo) | And trust. |
| 6–8 | navy title card | TENSACO / Two answers. One company. |
| 8–10 | red laser beam through lenses on an optical table (Veo) | COMPUTE / Computation, with light. |
| 10–13 | optical cavity, photonic chip macro, hand aligning a mirror mount (Veo) | Neural-network math, done in an optical cavity. |
| 13–16 | optical cavity, slowed and dimmed (Veo) | **PHASER** (Archivo) / A neural accelerator that runs at the speed of light. / Built from an off-the-shelf supply chain · phaser.tensaco.ai |
| 16–20 | developer typing at night (Veo); push-in on the team photo `team/_group/engineers-reviewing-screens.jpg` | **TensorCode** / Write what you know. Train what you don't. / Part code, part trained model · tensorcode.dev |
| 20–22 | TensaCo team in the SF office (`team/_group/executive-team.jpg` animated with Veo image-to-video) | TENSACO / Faster, more efficient, accountable AI. |
| 22–23 | San Francisco skyline at blue hour (Veo) | Built in San Francisco. |
| 23–24 | quarter-beat montage: laser, servers (stock), chip, grid | |
| 24–30 | the hit: flash to the navy end card, mark + TensaCo wordmark | Intelligence infrastructure for the enterprise. / tensaco.ai |

## Sources

- Footage: generated for TensaCo with Google Veo 3.1 Fast on fal (`fal-ai/veo3.1/fast`, 1080p, 4 s clips; team shots
  with `fal-ai/veo3.1/fast/image-to-video` from `team/_group/`). Prompts, and the takes that were dropped and why, are in
  `prompts.json`.
- Stock: `datacenter-servers` (Pexels, MrColo; see `public/media/credits.json`), and `team-collaboration-hero` only
  as a fallback if the team photo is missing.
- Music: ElevenLabs Music v2.5 on fal (`elevenlabs/music/v2.5`), instrumental, prompt in `prompts.json`.
- Type: Inter Display / Inter 4.1 (OFL); PHASER wordmark in Archivo (OFL).

Poster: the opening data-center frame (0.1 s). Loudness: -16.0 LUFS integrated, -2.8 dBTP true peak.

## Re-cutting

`edit.py` is the whole edit (shot table `SHOTS`, copy `TEXT`). `build.sh [poster_s]` renders the master, normalises the
music to -16 LUFS and writes the 720p version and the poster (`INSTALL=1` copies them into `public/media/video/`). The large source clips are not in the repo; regenerate them from
`prompts.json` or ask for the working folder.
