# PHASER launch — visual bible

## Thesis the page must leave behind

1. **~1,000× less energy per step** than a GPU, modeled at one megapixel of optics. Every repeat of this number carries "modeled".
2. **10× bigger model: a GPU pays 100×, light pays 10×.** Dense electronics pay for every connection; light pays for every pixel.
3. **AI is running out of electricity, not chips.** Data centres pass Japan's total electricity use by 2030 (IEA).
4. **Close:** intelligence runs on electrons, which turn into heat. PHASER moves it to light.

Every section answers "why should I care?". Anything that only explains the mechanism is cut.

## Direction: "darkroom instrument"

Monochrome scientific-instrument photography. One saturated colour: **650 nm red, the actual wavelength of the modeled
device.** Red appears **only where light physically exists**: the beam, the wavefront, the red number that is about light,
and the aviation warning lights on the grid. Everything else is ink, paper and graphite.

References and what each contributes:
- Thomas Ruff, *expériences lumineuses*: light as the only subject, drawn as geometry on a dead ground.
- Hiroshi Sugimoto, *Lightning Fields*: full-bleed black with one electrical event.
- Ryoji Ikeda, *data-verse*: tiny monospaced numbers against huge emptiness, motion cut to a beat.
- Burtynsky and the Bechers: industry photographed flat, frontal and without drama. Used for the grid section.
- Teenage Engineering and Nothing: spec plates, tiny labels, one indicator colour.
- NASA schlieren: invisible physics made visible, and everything looks measurable.
- Tokyo TDC editorial: huge numerals beside 10 px captions, vertical side labels, generous margin.

## Palette (tokens)

| token | hex | use |
|---|---|---|
| `--ink` | `#0a0908` | darkroom ground |
| `--ink-2` | `#141210` | raised plates on dark |
| `--paper` | `#e9e5dc` | the one light section (the chart) |
| `--graphite` | `#8a857c` | captions, hairlines on dark |
| `--rule` | `rgba(233,229,220,.12)` | hairlines |
| `--red` | `#ff2a12` | 650 nm on dark |
| `--red-paper` | `#d8200a` | 650 nm on paper (contrast-safe) |

No blue, no gradients, no glass, no glow outside the beam itself.

## Type

- **Archivo** (variable width): display numerals and headlines. Condensed 62–75 width, 600–800 weight, tight tracking.
  Numerals are the page's graphic elements, sized 18–30 vw.
- **IBM Plex Mono**: captions, spec plates, footnotes. 10–12 px, uppercase with +0.12 em tracking for labels.
- Only two scales: huge and tiny. Body copy is rare, 17–19 px Archivo at normal width.

## Motion

- The machine carries the motion, and it is never an animation of an idea. It is the research model running live in the
  browser (`src/lib/phaser-sim.ts`): a port of the TensaCo/phaser-design simulator for the Exp. 15/29 reservoir ("Apre_lin":
  the preset reflective SLM ring, 650 nm, LCOS 64 × 64 px at 20 µm with its random program, f = 40 mm relay, global gain
  clamp, K = 10 round trips per input). `scripts/validate-sim.ts` checks it against the research simulator (bit-identical
  over 32,000 trips); rerun it whenever the port changes. Nothing on the page may pretend to compute what the model didn't.
- The hero is the ring at true proportions (mm), seen with a long lens (22°) from inside the ring, 16 mm from the SLM. The SLM
  shows its phase program in graphite and the light on it in red, one texel per pixel. The beam is the simulated |E|²: a
  cross-section every 1 mm (2 mm on small screens) plus a faint ray-marched volume through the same sections, exposed as
  1 − exp(−I/I₀). A front sweeps the route once per round trip (1.6 s, ≈ 2.4 × 10⁹× slower than the device): sections behind
  it show the new trip. Slow 15-second drift and faint pointer parallax; no cuts.
- The machine section explains the computation with plates drawn from the same live run: the whole ring (Fig. 2), the
  64 × 64 SLM (Fig. 3), one input's ten laps (input, on the SLM, after the relay, detector), the 256 detector bins against the
  readout's weights, and a trace of target vs prediction with a live score. Red = light (plates, bins); graphite = phase and
  inputs; paper white = the digital readout. The readout is always labelled digital and trained offline.
- Page motion is discrete: numbers count once, rules draw once, and nothing floats. The simulations pause offscreen. Reduced
  motion shows one still frame of a warmed-up state.

## Composition rules

1. At least 60 % of every viewport is black or paper.
2. Each section has exactly one hero element: the machine, the chart, the photograph, or the closing line.
3. Hairline spec plates (fig. no., λ = 650 nm, scale) replace labels on imagery.
4. Every number sits next to a footnote marker; the receipts live at the bottom, not inline.
5. Every frame must hold up as a screenshot on its own.

## Generated assets

- **fal `flux-2-max`**: a monochrome night photograph of grid infrastructure (a transmission tower and cooling towers) where
  the only colour is red aviation lights. It rhymes with the beam: the world's red light means *warning*, ours means *compute*.
- **Seedance 2.5 image-to-video** was planned for slow steam and blinking aviation lights. fal's media CDN
  (`*.fal.media`) is unreachable from the build machine, so no video could be downloaded. The same shot is done in WebGL instead
  (`LivingPhoto.tsx`), which is deterministic, a few KB, and loops forever: flow-noise displacement masked to the plume, and
  synced blinking on the red pixels. Stills come through fal's `sync_mode` (inline data URI).
- **Procedural** (three.js and GLSL): the machine, drawn from the live simulation. It is never generated video.
