# PHASER launch — visual bible

## Thesis the page must leave behind

1. **200–3,000× less energy per step** than an equally capable dense recurrent network, modeled at a million optical
   modes (research Exps. 31, 34). Every repeat carries "modeled"; the receipts say it is extrapolated from 65k simulated
   modes and at parity today. Never quote 10⁶×. Exact allowed sentences: `research/notes/energy-per-multiply.md` §6 and
   REPORT.md Exp. 35 ("What the website can say").
2. **Up to 10 B input steps per second** with time-multiplexed light pulses (modeled, Exp. 32): the speed is the
   demonstrated edge.
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
  (`src/lib/phaser-sim.ts`) of the research's linear stack (arch.ts `stackCavity`, Exps. 30 and 33): a 5 % coupler with
  the clamped gain and its host crystal, four fabricated fused-silica phase plates (64 × 64 px at 20 µm, 1 mm, IBS
  coatings) 5 mm apart, a concave end mirror (R 120 mm); one round trip (0.26 ns) per input. Transmissive LC panels are
  not drawn: the research found a stack of them keeps ~0.5 % per trip. `scripts/validate-sim.ts` hands the same config to
  the research simulator and compares every round trip; rerun it whenever the port changes. Nothing on the page may
  pretend to compute what the model didn't.
- The hero and the machine figure show the real bench assembly at true scale (`hardware.ts`, mm): two stainless cage rods; the four
  etched fused-silica plates (5 × 5 × 1 mm, AR-coated, the etch's pixel relief visible up close) in slim anodised cells on
  cantilever arms; the concave end mirror in a kinematic mount; the gain crystal whose top face is the input-mirror coating;
  an OV3660 camera module on its polyimide flex to an ESP32-S3 dev board. Physically based materials (anodised aluminium,
  stainless, fused silica, dielectric coatings, FR-4, gold), dim darkroom lighting; no floor grid. Light is the only red
  (including the faint red it throws on the parts next to the beam). The camera fits the whole assembly inside the frame on
  every screen (it solves distance and lens shift from a target rectangle). Dozens of wavefronts bounce up and down the
  stack (time-multiplexed, nearly overlapping), each drawn as a few crest sheets. The crests are stylised (true 650 nm crests
  can't be drawn at this scale), but every sheet's cross-section is the simulated |E|² at its plane on its round trip. Don't
  label the crest spacing.
- The machine figure's annotations are hairline leaders to mono labels, stacked so they never overlap. Beside it, one plate's 64 × 64 pixels.
- Figures are never numbered (no "Fig. 1/2/3"): each gets a plain caption below it, with its footnote marker inline at the end.
- The electrons-and-light figure is one illustration with a shallow depth of field (front layer sharp, layers behind
  blurred): light rains down onto one region of a glass slab above (red wave packets whose fringes close up by n = 1.5 inside), and
  below, atoms drawn as points sampled from orbital densities, with electrons struggling to tunnel from cloud to cloud (most
  attempts fall back; each hop shakes the lattice: heat). Labels are leader-line annotations inside it (a list below it on
  phones). Its numbers live in one object (`CARRIER_NUMBERS`): ~1 pJ per MAC on today's chips vs ≤ 0.001 pJ per *equivalent* multiply for PHASER, modeled at 10⁶ modes.
- Slow 15-second drift and faint pointer parallax; no cuts. Page motion is discrete: numbers count once, rules draw once,
  and nothing floats. Simulations pause offscreen. Reduced motion shows one still frame of a warmed-up state.
- The oscilloscope bench (the line about where the energy goes) sits directly under the electrons-and-light figure, with hard
  top and bottom edges. No video on the page fades into black; seams between sections are hard cuts with no black gap.

## Composition rules

1. At least 60 % of every viewport is black or paper.
2. Each section has exactly one hero element: the machine, the chart, the photograph, or the closing line.
3. Hairline spec plates (λ = 650 nm, scale) and leader-line annotations replace labels on imagery; figures are not numbered.
4. Every number sits next to a footnote marker (`<Fn id=…>`, anchors in `Close.tsx` FN); the receipts live on /notes, not inline.
5. Every frame must hold up as a screenshot on its own.

## Generated assets

- **fal `flux-2-max`**: a monochrome night photograph of grid infrastructure (a transmission tower and cooling towers) where
  the only colour is red aviation lights. It rhymes with the beam: the world's red light means *warning*, ours means *compute*.
- **Seedance 2.5 image-to-video** was planned for slow steam and blinking aviation lights. fal's media CDN
  (`*.fal.media`) is unreachable from the build machine, so no video could be downloaded. The same shot is done in WebGL instead
  (`LivingPhoto.tsx`), which is deterministic, a few KB, and loops forever: flow-noise displacement masked to the plume, and
  synced blinking on the red pixels. Stills come through fal's `sync_mode` (inline data URI).
- **Procedural** (three.js and GLSL): the machine, drawn from the live simulation. It is never generated video.
