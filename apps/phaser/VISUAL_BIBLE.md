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

- The machine carries the motion, and it is never an animation of an idea. It is a live simulation in the browser
  (`src/lib/phaser-sim.ts`) of a linear-stack cavity built with the research simulator (TensaCo/phaser-design): input
  mirror/coupler (8 % in and out) with a clamped gain, four transmissive LCD phase planes (64 × 64 px at 63.5 µm, the
  research's realistic LCD parameters and preset programs) 4.8 mm apart, and a concave end mirror (R 400 mm) 24 mm away;
  128² field at 31.75 µm, angular-spectrum propagation. `scripts/validate-sim.ts` hands the same config to the research
  simulator and compares every round trip (bit-identical over 4,000); rerun it whenever the port changes. Nothing on the page
  may pretend to compute what the model didn't.
- The hero and Fig. 2 show the cavity at true proportions (mm), axis vertical, long lens (22°). Wavefronts bounce up and
  down the stack, three in flight, each drawn as a few crest sheets. The crests are stylised (true 650 nm crests can't be
  drawn at this scale), but every sheet's cross-section is the simulated |E|² at its plane on its round trip, from the model's
  own angular spectrum, so the pattern changes as it passes each plane and reflects. Don't label the crest spacing; the time
  plate states the slow-down. The LCD panels show their phase programs in graphite (per pixel, with the black matrix) and the
  light crossing them in red (per sample); the detector under the input mirror shows the 8 % tap in red.
- Fig. 2's annotations are hairline leaders to mono labels, stacked so they never overlap. Fig. 3 is one plane's 64 × 64 pixels.
- The carriers figures are small live simulations, not device models: an electron wave packet (2-D Schrödinger, split-step)
  crossing a lattice of vibrating ions that push back (Ehrenfest), drawn in paper and graphite; a light packet (2-D wave
  equation) crossing glass, in red. Their pJ numbers live in one object (`CARRIER_NUMBERS`) and always say "modeled".
- Slow 15-second drift and faint pointer parallax; no cuts. Page motion is discrete: numbers count once, rules draw once,
  and nothing floats. Simulations pause offscreen. Reduced motion shows one still frame of a warmed-up state.
- The oscilloscope bench at the end of 02 butts directly against the 03 reel: no black gap, no fade between them.

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
