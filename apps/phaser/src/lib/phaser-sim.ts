/**
 * A minimal port of the PHASER research simulator (TensaCo/phaser-design, src/core/physics) for exactly one
 * configuration: a linear, back-and-forth cavity with a stack of four programmable transmissive LCD phase planes.
 *
 * The configuration (STACK_CONFIG below) is written in the research simulator's own config language, derived from its
 * "B_4f" linear cavity (research/2026-09-14/arch.ts) and the preset "Transmissive LCD linear cavity"
 * (src/core/runtime/presets.ts): the same realistic LCD, coupler and mirror parameters, the preset's programs (random,
 * seeds 20…23, depth 0.1), and B_4f's grid (2 samples per 63.5 µm pixel). Instead of B_4f's two relay lenses the light is
 * held in by a concave end mirror (R = 400 mm, a stable flat–concave resonator), so the planes can sit evenly along a
 * 24 mm cavity. scripts/validate-sim.ts feeds STACK_CONFIG to the research simulator and compares every trip with this
 * port.
 *
 * Physics, as in the research model: a scalar, monochromatic complex field E(x, y) on a 128 × 128 grid at 31.75 µm
 * (4.06 mm window). The linear-reciprocal route applies the start assembly (input mirror/coupler, gain), goes forward
 * through the planes (front faces), reflects off the end assembly (curved mirror), and comes back through the planes
 * (back faces). Every free-space gap is the angular-spectrum method (exact k_z, carrier removed, air) followed by the
 * absorbing cosine taper. Operation order, constants and the radix-2 FFT are copied from the research code.
 *
 * No DOM here: the page and the validation script both import this file.
 */

// ── configuration ───────────────────────────────────────────────────────────────────────────────────────────────────
export const N = 128 // samples per axis
export const PITCH = 63.5e-6 // LCD pixel pitch
export const DX = PITCH / 2 // 2 samples per pixel
export const LAMBDA = 650e-9
export const PLANES = 4
export const LENGTH = 24e-3 // input mirror → end mirror
export const PLANE_Z = Array.from({ length: PLANES }, (_, i) => ((i + 1) * LENGTH) / (PLANES + 1)) // 4.8 mm apart
export const MIRROR_R = 0.4 // concave end mirror radius of curvature (m): a thin lens f = R/2 in front of a flat mirror
export const K_TRIPS = 10 // round trips per input
export const INPUT_AMP = 6
const AIR_SPEC = { kind: 'air', pressurePa: 101_325, temperatureK: 288.15, attenuationPerM: -Math.log(0.998) } as const
const LCD_PX = { resolution: { x: 64, y: 64 }, pitch: { x: PITCH, y: PITCH }, fillFactor: 0.85, offset: { x: 0, y: 0 } }
const lcd = (i: number) => ({
  kind: 'transmissive-lcd' as const, id: `lcd${i + 1}`, label: `LCD phase plane ${i + 1}`,
  pixels: LCD_PX,
  modulation: { kind: 'phase' as const, phaseRange: 1.8 * Math.PI, levels: 256, response: { kind: 'gamma' as const, gamma: 1.1 } },
  clearTransmission: 0.92,
  surfaces: { front: { transmission: 0.98, reflection: 0.02 }, back: { transmission: 0.96, reflection: 0.04 } },
  polarizerTransmission: 0.95,
  deadZoneTransmission: 0,
  switchingTime: 0.008,
  designWavelength: 650e-9,
  program: { kind: 'random' as const, seed: 20 + i, depth: 0.1 },
})

/** the research-simulator PhysicsConfig this file implements */
export const STACK_CONFIG = {
  field: { grid: { nx: N, ny: N, dx: DX, dy: DX }, wavelength: LAMBDA, boundary: { kind: 'absorbing' as const, widthFraction: 0.08 } },
  elements: [
    { kind: 'coupler' as const, id: 'in', label: 'input mirror / coupler', retained: { front: 0.92, back: 0.92 }, inputPort: 'in', outputTap: 'readout' },
    { kind: 'gain' as const, id: 'gain', smallSignalGain: 6, saturation: { kind: 'global' as const, saturationIntensity: 0.5 }, noise: { kind: 'none' as const } },
    ...Array.from({ length: PLANES }, (_, i) => lcd(i)),
    { kind: 'lens' as const, id: 'curve', label: 'end-mirror curvature (R = 400 mm)', focalLength: MIRROR_R / 2, apertureDiameter: 4e-3, transmission: { front: 1, back: 1 } },
    { kind: 'mirror' as const, id: 'end', label: 'end mirror', reflectivity: { front: 0.97, back: 0.97 }, parity: 'none' as const },
  ],
  topology: {
    kind: 'linear-reciprocal' as const, length: LENGTH, medium: AIR_SPEC,
    start: { elementIds: ['in', 'gain'] }, end: { elementIds: ['curve', 'end'] },
    items: PLANE_Z.map((z, i) => ({ elementId: `lcd${i + 1}`, position: z })),
  },
  readouts: [],
}

const NN = N * N
const TAU = 2 * Math.PI

// ── randomness (src/core/common/random.ts) ──────────────────────────────────────────────────────────────────────────
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function gaussian(rand: () => number): number {
  let u = 0
  while (u === 0) u = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}

// ── field + FFT (src/core/physics/field) ────────────────────────────────────────────────────────────────────────────
export interface Field { re: Float64Array; im: Float64Array }
export const createField = (): Field => ({ re: new Float64Array(NN), im: new Float64Array(NN) })
export const sampleX = (i: number) => (i - N / 2 + 0.5) * DX

const rev = new Uint32Array(N)
const cosT = new Float64Array(N), sinF = new Float64Array(N), sinI = new Float64Array(N)
for (let i = 1, j = 0; i < N; i++) {
  let bit = N >> 1
  for (; j & bit; bit >>= 1) j ^= bit
  j ^= bit
  rev[i] = j
}
for (let half = 1; half < N; half <<= 1) {
  const stride = N / (2 * half)
  for (let k = 0; k < half; k++) {
    const m = k * stride
    cosT[half + k] = Math.cos((2 * Math.PI * m) / N)
    sinF[half + k] = Math.sin((2 * Math.PI * m) / N)
    sinI[half + k] = -Math.sin((2 * Math.PI * m) / N)
  }
}

function transform(re: Float64Array, im: Float64Array, off: number, inverse: boolean): void {
  const n = N
  for (let i = 1; i < n; i++) {
    const j = rev[i]
    if (i < j) {
      const a = off + i, b = off + j
      let t = re[a]; re[a] = re[b]; re[b] = t
      t = im[a]; im[a] = im[b]; im[b] = t
    }
  }
  const end = off + n
  for (let a = off; a < end; a += 2) {
    const b = a + 1
    const xr = re[b], xi = im[b]
    re[b] = re[a] - xr
    im[b] = im[a] - xi
    re[a] += xr
    im[a] += xi
  }
  const sin = inverse ? sinI : sinF
  for (let half = 2; half < n; half <<= 1) {
    const len = half << 1
    for (let i = off; i < end; i += len) {
      for (let k = 0; k < half; k++) {
        const wr = cosT[half + k], wi = sin[half + k]
        const a = i + k, b = a + half
        const xr = re[b] * wr - im[b] * wi
        const xi = re[b] * wi + im[b] * wr
        re[b] = re[a] - xr
        im[b] = im[a] - xi
        re[a] += xr
        im[a] += xi
      }
    }
  }
  if (inverse) {
    const s = 1 / n
    for (let i = off; i < end; i++) { re[i] *= s; im[i] *= s }
  }
}

const colRe = new Float64Array(N), colIm = new Float64Array(N)
/** separable 2-D FFT in place (rows, then columns); forward unnormalised, inverse ÷ n */
export function fft2(f: Field, inverse = false): void {
  const { re, im } = f
  for (let j = 0; j < N; j++) transform(re, im, j * N, inverse)
  for (let i = 0; i < N; i++) {
    for (let j = 0, k = i; j < N; j++, k += N) { colRe[j] = re[k]; colIm[j] = im[k] }
    transform(colRe, colIm, 0, inverse)
    for (let j = 0, k = i; j < N; j++, k += N) { re[k] = colRe[j]; im[k] = colIm[j] }
  }
}

const angularFrequency = (b: number) => (2 * Math.PI * (b < N / 2 ? b : b - N)) / (N * DX)

// ── medium (src/core/physics/media/media.ts: Edlén air) ─────────────────────────────────────────────────────────────
function airRefractivityStd(lambda: number): number {
  const s2 = (1 / (lambda * 1e6)) ** 2
  return (8342.54 + 2406147 / (130 - s2) + 15998 / (38.9 - s2)) * 1e-8
}
const density = (AIR_SPEC.pressurePa / 101_325) * (288.15 / AIR_SPEC.temperatureK)
const nAt = (l: number) => 1 + airRefractivityStd(l) * density
const AIR_N = nAt(LAMBDA)
const AIR_NG = (() => { const h = LAMBDA * 1e-3; return AIR_N - LAMBDA * ((nAt(LAMBDA + h) - nAt(LAMBDA - h)) / (2 * h)) })()
const ALPHA = AIR_SPEC.attenuationPerM

// ── route (src/core/physics/topology/topology.ts, linear-reciprocal) ────────────────────────────────────────────────
type ElementId = 'in' | 'gain' | 'curve' | 'end' | `lcd${number}`
export type RouteStep =
  | { kind: 'element'; id: ElementId; side: 'front' | 'back'; distance: number }
  | { kind: 'propagate'; length: number; distance: number }
export const ROUTE: RouteStep[] = (() => {
  const t = STACK_CONFIG.topology
  const steps: RouteStep[] = []
  let d = 0
  const prop = (length: number) => { if (length <= 1e-12) return; steps.push({ kind: 'propagate', length, distance: d }); d += length }
  const el = (id: string, side: 'front' | 'back') => steps.push({ kind: 'element', id: id as ElementId, side, distance: d })
  const items = t.items.map((it, k) => ({ it, k })).sort((a, b) => a.it.position - b.it.position || a.k - b.k).map((x) => x.it)
  for (const id of t.start.elementIds) el(id, 'front')
  let cursor = 0
  for (const it of items) { prop(it.position - cursor); el(it.elementId, 'front'); cursor = it.position }
  prop(t.length - cursor)
  for (const id of t.end.elementIds) el(id, 'front')
  cursor = t.length
  for (const it of [...items].reverse()) { prop(cursor - it.position); el(it.elementId, 'back'); cursor = it.position }
  prop(cursor)
  return steps
})()
/** geometric round-trip length (m) and time Σ n_g L / c (s) */
export const ROUTE_LENGTH = ROUTE.reduce((s, r) => s + (r.kind === 'propagate' ? r.length : 0), 0)
export const TRIP_TIME = ROUTE.reduce((s, r) => s + (r.kind === 'propagate' ? AIR_NG * r.length : 0), 0) / 299_792_458
/** propagation steps in route order: the i-th free-space gap of a round trip */
export const GAPS = ROUTE.filter((r): r is Extract<RouteStep, { kind: 'propagate' }> => r.kind === 'propagate')

// ── propagation (src/core/physics/propagation) ──────────────────────────────────────────────────────────────────────
export interface Kernel { re: Float64Array; im: Float64Array }
/** (k_z − k) per sample, and the evanescent decay rate (for the page's intermediate planes) */
const KZ = (() => {
  const phase = new Float64Array(NN), decay = new Float64Array(NN)
  const k = (2 * Math.PI * AIR_N) / LAMBDA
  for (let j = 0; j < N; j++) {
    const ky = angularFrequency(j)
    for (let i = 0; i < N; i++) {
      const kx = angularFrequency(i)
      const kz2 = k * k - kx * kx - ky * ky
      if (kz2 > 0) phase[j * N + i] = Math.sqrt(kz2) - k
      else decay[j * N + i] = Math.sqrt(-kz2)
    }
  }
  return { phase, decay }
})()
export function buildKernel(length: number): Kernel {
  const re = new Float64Array(NN), im = new Float64Array(NN)
  const k = (2 * Math.PI * AIR_N) / LAMBDA
  const decay = Math.exp((-ALPHA * length) / 2)
  for (let j = 0; j < N; j++) {
    const ky = angularFrequency(j)
    for (let i = 0; i < N; i++) {
      const kx = angularFrequency(i)
      const kz2 = k * k - kx * kx - ky * ky
      const idx = j * N + i
      if (kz2 > 0) {
        const ph = (Math.sqrt(kz2) - k) * length
        re[idx] = Math.cos(ph) * decay
        im[idx] = Math.sin(ph) * decay
      } else {
        re[idx] = Math.exp(-Math.sqrt(-kz2) * length) * decay
      }
    }
  }
  return { re, im }
}
const kernelCache = new Map<number, Kernel>()
const kernelFor = (L: number) => { let k = kernelCache.get(L); if (!k) kernelCache.set(L, (k = buildKernel(L))); return k }

function applyKernel(f: Field, kern: Kernel): void {
  const { re, im } = f
  for (let i = 0; i < NN; i++) {
    const r = re[i] * kern.re[i] - im[i] * kern.im[i]
    im[i] = re[i] * kern.im[i] + im[i] * kern.re[i]
    re[i] = r
  }
}
const WINDOW = (() => {
  const axis = new Float64Array(N)
  const edge = Math.max(1, Math.round(N * STACK_CONFIG.field.boundary.widthFraction))
  for (let i = 0; i < N; i++) {
    const d = Math.min(i, N - 1 - i)
    axis[i] = d >= edge ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * d) / edge)
  }
  const w = new Float64Array(NN)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) w[j * N + i] = axis[i] * axis[j]
  return w
})()

// ── elements (src/core/physics/elements) ────────────────────────────────────────────────────────────────────────────
function scale(f: Field, amplitude: number) {
  if (amplitude === 1) return
  for (let i = 0; i < NN; i++) { f.re[i] *= amplitude; f.im[i] *= amplitude }
}
function multiplyComplex(f: Field, tr: Float64Array, ti: Float64Array) {
  for (let i = 0; i < NN; i++) {
    const r = f.re[i] * tr[i] - f.im[i] * ti[i]
    f.im[i] = f.re[i] * ti[i] + f.im[i] * tr[i]
    f.re[i] = r
  }
}

type Lcd = ReturnType<typeof lcd>
/** commanded → achieved phase (wrap, 1.8π stroke, clip, 256 levels, γ calibration, λ_design/λ) */
function achievedPhase(cmd: number, s: Lcd): number {
  const range = s.modulation.phaseRange
  let u = (((cmd % TAU) + TAU) % TAU) / range
  u = Math.min(1, Math.max(0, u))
  u = Math.round(u * (s.modulation.levels - 1)) / (s.modulation.levels - 1)
  return Math.pow(u, s.modulation.response.gamma) * range * (s.designWavelength / LAMBDA)
}

export interface Plane { id: string; command: Float64Array; phase: Float64Array; tr: Float64Array; ti: Float64Array; amp: Record<'front' | 'back', number> }
/** the four LCD planes: per-pixel commanded and achieved phase (64 × 64), and per-sample transmission */
export const PLANE_DATA: Plane[] = STACK_CONFIG.elements.filter((e): e is Lcd => e.kind === 'transmissive-lcd').map((s) => {
  const { x: RX, y: RY } = s.pixels.resolution
  const rand = mulberry32(s.program.seed)
  const command = new Float64Array(RX * RY)
  for (let i = 0; i < command.length; i++) command[i] = TAU * s.program.depth * rand()
  const phase = command.map((c) => achievedPhase(c, s))
  const amp = Math.sqrt(s.clearTransmission)
  const tr = new Float64Array(NN), ti = new Float64Array(NN)
  const fx = Math.sqrt(s.pixels.fillFactor)
  for (let j = 0; j < N; j++) {
    const v = sampleX(j) / s.pixels.pitch.y + RY / 2
    const py = Math.floor(v)
    const inY = py >= 0 && py < RY
    const fracY = Math.abs(v - py - 0.5) <= fx / 2
    for (let i = 0; i < N; i++) {
      const u = sampleX(i) / s.pixels.pitch.x + RX / 2
      const pxi = Math.floor(u)
      const idx = j * N + i
      if (!inY || pxi < 0 || pxi >= RX) { tr[idx] = 0; ti[idx] = 0 }
      else if (!fracY || Math.abs(u - pxi - 0.5) > fx / 2) { tr[idx] = Math.sqrt(s.deadZoneTransmission); ti[idx] = 0 }
      else { const ph = phase[py * RX + pxi]; tr[idx] = amp * Math.cos(ph); ti[idx] = amp * Math.sin(ph) }
    }
  }
  const side = (k: 'front' | 'back') => Math.sqrt(s.surfaces[k].transmission * s.polarizerTransmission)
  return { id: s.id, command, phase, tr, ti, amp: { front: side('front'), back: side('back') } }
})
const PLANE_BY_ID = Object.fromEntries(PLANE_DATA.map((p) => [p.id, p]))

const CURVE = STACK_CONFIG.elements.find((e) => e.id === 'curve') as Extract<(typeof STACK_CONFIG.elements)[number], { kind: 'lens' }>
const curveT = (() => {
  const k = (2 * Math.PI) / LAMBDA
  const tr = new Float64Array(NN), ti = new Float64Array(NN)
  const R = CURVE.apertureDiameter / 2
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = sampleX(i), y = sampleX(j)
      const r2 = x * x + y * y
      if (r2 > R * R) continue
      const ph = (-k * r2) / (2 * CURVE.focalLength)
      tr[j * N + i] = Math.cos(ph)
      ti[j * N + i] = Math.sin(ph)
    }
  return { tr, ti }
})()
const IN = STACK_CONFIG.elements[0] as { retained: { front: number; back: number } }
const GAIN = STACK_CONFIG.elements[1] as { smallSignalGain: number; saturation: { saturationIntensity: number } }
const END = STACK_CONFIG.elements.find((e) => e.id === 'end') as { reflectivity: { front: number } }
/** passive power retained per round trip (uniform illumination, small signal), as CompiledSystem.powerBudget() reports */
export const PASSIVE_RETENTION = (() => {
  let c = 0
  for (let i = 0; i < NN; i++) c += curveT.tr[i] ** 2 + curveT.ti[i] ** 2
  let p = IN.retained.front * END.reflectivity.front * (c / NN) * CURVE.transmission.front
  for (const pl of PLANE_DATA) {
    let m = 0, n = 0
    for (let i = 0; i < NN; i++) { m += pl.tr[i] ** 2 + pl.ti[i] ** 2; n++ }
    p *= (m / n) ** 2 * pl.amp.front ** 2 * pl.amp.back ** 2
  }
  for (const g of GAPS) p *= Math.exp(-ALPHA * g.length)
  return p
})()

export interface Observer {
  /** the field right after route step `index` */
  after?(index: number, f: Field): void
  /** the angular spectrum at the start of free-space gap `gap` (index into GAPS) */
  spectrum?(gap: number, spec: Field): void
  /** the input mirror's output tap (8 %), as an amplitude-scaled view of the incident field */
  tap?(f: Field, amplitude: number): void
}

/** One round trip, in place. `input` (if given) is added at the input coupler. Returns the global gain applied. */
export function roundTrip(f: Field, input: Field | null, obs?: Observer): number {
  let gain = GAIN.smallSignalGain, gap = 0
  ROUTE.forEach((step, index) => {
    if (step.kind === 'propagate') {
      fft2(f)
      obs?.spectrum?.(gap++, f)
      applyKernel(f, kernelFor(step.length))
      fft2(f, true)
      for (let i = 0; i < NN; i++) { f.re[i] *= WINDOW[i]; f.im[i] *= WINDOW[i] }
    } else if (step.id === 'in') {
      obs?.tap?.(f, Math.sqrt(1 - IN.retained.front))
      scale(f, Math.sqrt(IN.retained.front))
      if (input) {
        const a = Math.sqrt(1 - IN.retained.front)
        for (let i = 0; i < NN; i++) { f.re[i] += a * input.re[i]; f.im[i] += a * input.im[i] }
      }
    } else if (step.id === 'gain') {
      let s = 0
      for (let i = 0; i < NN; i++) s += f.re[i] * f.re[i] + f.im[i] * f.im[i]
      gain = 1 + (GAIN.smallSignalGain - 1) / (1 + s / NN / GAIN.saturation.saturationIntensity)
      scale(f, Math.sqrt(Math.max(0, gain)))
    } else if (step.id === 'curve') {
      multiplyComplex(f, curveT.tr, curveT.ti)
      scale(f, Math.sqrt(CURVE.transmission.front))
    } else if (step.id === 'end') {
      scale(f, Math.sqrt(END.reflectivity.front))
    } else {
      const p = PLANE_BY_ID[step.id]
      multiplyComplex(f, p.tr, p.ti)
      scale(f, p.amp[step.side])
    }
    obs?.after?.(index, f)
  })
  return gain
}

/** |E|² at distance z into a free-space gap, from that gap's starting spectrum (no taper: the model applies it once,
 *  at the end of the gap). `work` is scratch; `out` receives |E|². */
export function slice(spec: Field, z: number, work: Field, out: Float32Array | Float64Array): void {
  const { re, im } = spec
  const d = Math.exp((-ALPHA * z) / 2)
  for (let i = 0; i < NN; i++) {
    let hr: number, hi: number
    if (KZ.decay[i] === 0) { const ph = KZ.phase[i] * z; hr = Math.cos(ph) * d; hi = Math.sin(ph) * d } else { hr = Math.exp(-KZ.decay[i] * z) * d; hi = 0 }
    work.re[i] = re[i] * hr - im[i] * hi
    work.im[i] = re[i] * hi + im[i] * hr
  }
  fft2(work, true)
  for (let i = 0; i < NN; i++) out[i] = work.re[i] * work.re[i] + work.im[i] * work.im[i]
}

// ── input ───────────────────────────────────────────────────────────────────────────────────────────────────────────
/** the static input pattern (research 15-reservoir.ts inputPattern): 40 random complex Gaussians over the central 60 % */
export function inputPattern(seed = 101, corr = 3): Field {
  const r = mulberry32(seed)
  const f = createField()
  const L = N * DX * 0.3
  for (let k = 0; k < 40; k++) {
    const cx = (r() * 2 - 1) * L, cy = (r() * 2 - 1) * L, a = gaussian(r), b = gaussian(r)
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const e = Math.exp(-((sampleX(i) - cx) ** 2 + (sampleX(j) - cy) ** 2) / (2 * (corr * DX) ** 2))
      f.re[j * N + i] += a * e; f.im[j * N + i] += b * e
    }
  }
  let m = 0
  for (let i = 0; i < NN; i++) m = Math.max(m, Math.hypot(f.re[i], f.im[i]))
  for (let i = 0; i < NN; i++) { f.re[i] /= m; f.im[i] /= m }
  return f
}

/** The cavity with an input stream: each input u is injected once (6·u·P at the input mirror), then K = 10 trips. */
export class Cavity {
  readonly field = createField()
  readonly pattern = inputPattern()
  private readonly inj = createField()
  private pending = false
  trip = 0
  tripInStep = 0
  u = 0
  gain = GAIN.smallSignalGain

  inject(u: number) {
    this.u = u
    for (let i = 0; i < NN; i++) { this.inj.re[i] = INPUT_AMP * u * this.pattern.re[i]; this.inj.im[i] = INPUT_AMP * u * this.pattern.im[i] }
    this.pending = true
    this.tripInStep = 0
  }

  step(obs?: Observer) {
    const input = this.pending ? this.inj : null
    this.pending = false
    this.gain = roundTrip(this.field, input, obs)
    this.trip++
    this.tripInStep++
  }
}
