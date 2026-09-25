/**
 * A minimal port of the PHASER research simulator (TensaCo/phaser-design, src/core/physics) for exactly one
 * configuration: the reservoir of research Experiments 15 and 29, "Apre_lin" (research/2026-09-14/15-reservoir.ts).
 *
 * Physics, as in the research model: a scalar, monochromatic complex field E(x, y) on a 64 × 64 grid at 20 µm (one sample
 * per SLM pixel, a 1.28 mm window). One round trip applies the route
 *
 *   in-coupler · LCOS SLM · global gain · 40 mm · lens R · fold · roof · out-coupler · 100 mm · lens L · 60 mm
 *
 * where every propagation is the angular-spectrum method (exact k_z, carrier removed, air at 15 °C with 0.2 %/m loss)
 * followed by the absorbing cosine taper. The operation order, constants and the radix-2 FFT are copied from the research
 * code so the two agree to rounding error (scripts/validate-sim.ts checks it against the research simulator itself).
 *
 * No DOM here: the page, the validation script and the readout trainer all import this file.
 */

// ── configuration (research/2026-09-14/arch.ts slmRing + 15-reservoir.ts OPS.Apre_lin) ─────────────────────────────
export const N = 64 // samples per axis
export const DX = 20e-6 // m; = SLM pixel pitch (1 sample per pixel)
export const LAMBDA = 650e-9
export const K_TRIPS = 10 // round trips per input step
export const INPUT_AMP = 6
export const BINS = 16 // detector: 16 × 16 bins of 4 × 4 samples
export const SLM = { pixels: 64, pitch: 20e-6, fill: 0.93, reflectivity: 0.75, deadZone: 0.2, levels: 256, gamma: 1.05, designLambda: 633e-9, seed: 3, depth: 0.1 }
export const LENS = { focal: 40e-3, aperture: 1.2e-3, transmission: 0.995 }
export const GAIN = { G0: 1.6, Isat: 0.05 }
export const COUPLER_IN = 0.98 // power retained; the input enters with amplitude √(1 − 0.98)
export const COUPLER_OUT = 0.95 // 5 % tap
export const MIRROR = 0.995
export const BOUNDARY = 0.08
/** the compact route's three free-space segments (m), and where the physical ring puts things along them */
export const SEGMENTS = [40e-3, 100e-3, 60e-3] as const
export const ROUTE_LENGTH = 200e-3
const AIR = { pressurePa: 101_325, temperatureK: 288.15, alpha: -Math.log(0.998) }

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
const AIR_N = 1 + airRefractivityStd(LAMBDA) * ((AIR.pressurePa / 101_325) * (288.15 / AIR.temperatureK))
export const AIR_INDEX = AIR_N
const airGroupIndex = (() => {
  const density = (AIR.pressurePa / 101_325) * (288.15 / AIR.temperatureK)
  const nAt = (l: number) => 1 + airRefractivityStd(l) * density
  const h = LAMBDA * 1e-3
  return nAt(LAMBDA) - LAMBDA * ((nAt(LAMBDA + h) - nAt(LAMBDA - h)) / (2 * h))
})()
/** round-trip time Σ n_g L / c (research: 0.6673 ns) */
export const TRIP_TIME = (airGroupIndex * ROUTE_LENGTH) / 299_792_458

// ── propagation (src/core/physics/propagation) ──────────────────────────────────────────────────────────────────────
export interface Kernel { re: Float64Array; im: Float64Array }
export function buildKernel(length: number): Kernel {
  const re = new Float64Array(NN), im = new Float64Array(NN)
  const k = (2 * Math.PI * AIR_N) / LAMBDA
  const decay = Math.exp((-AIR.alpha * length) / 2)
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
  const edge = Math.max(1, Math.round(N * BOUNDARY))
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

/** commanded → achieved phase (wrap, stroke, 256-level quantisation, γ calibration, λ_design/λ) */
function achievedPhase(cmd: number): number {
  let u = (((cmd % TAU) + TAU) % TAU) / TAU
  u = Math.min(1, Math.max(0, u))
  u = Math.round(u * (SLM.levels - 1)) / (SLM.levels - 1)
  return Math.pow(u, SLM.gamma) * TAU * (SLM.designLambda / LAMBDA)
}

/** the SLM's program: commanded phase per pixel (preset "random", seed 3, depth 0.1) and the achieved phase */
export const SLM_COMMAND = (() => {
  const rand = mulberry32(SLM.seed)
  const out = new Float64Array(SLM.pixels * SLM.pixels)
  for (let i = 0; i < out.length; i++) out[i] = TAU * SLM.depth * rand()
  return out
})()
export const SLM_PHASE = SLM_COMMAND.map(achievedPhase)

/** per-sample complex reflection of the SLM (pixel map: with 1 sample per pixel every sample is inside a pixel) */
const slmT = (() => {
  const tr = new Float64Array(NN), ti = new Float64Array(NN)
  const fx = Math.sqrt(SLM.fill)
  const amp = Math.sqrt(SLM.reflectivity), dead = Math.sqrt(SLM.deadZone)
  for (let j = 0; j < N; j++) {
    const v = sampleX(j) / SLM.pitch + SLM.pixels / 2
    const py = Math.floor(v)
    const inY = py >= 0 && py < SLM.pixels
    const fracY = Math.abs(v - py - 0.5) <= fx / 2
    for (let i = 0; i < N; i++) {
      const u = sampleX(i) / SLM.pitch + SLM.pixels / 2
      const pxi = Math.floor(u)
      const idx = j * N + i
      if (!inY || pxi < 0 || pxi >= SLM.pixels) { tr[idx] = 0; ti[idx] = 0 }
      else if (!fracY || Math.abs(u - pxi - 0.5) > fx / 2) { tr[idx] = dead; ti[idx] = 0 }
      else {
        const ph = SLM_PHASE[py * SLM.pixels + pxi]
        tr[idx] = amp * Math.cos(ph)
        ti[idx] = amp * Math.sin(ph)
      }
    }
  }
  return { tr, ti }
})()

const lensT = (() => {
  const k = (2 * Math.PI) / LAMBDA
  const tr = new Float64Array(NN), ti = new Float64Array(NN)
  const R = LENS.aperture / 2
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = sampleX(i), y = sampleX(j)
      const r2 = x * x + y * y
      if (r2 > R * R) continue
      const ph = (-k * r2) / (2 * LENS.focal)
      tr[j * N + i] = Math.cos(ph)
      ti[j * N + i] = Math.sin(ph)
    }
  return { tr, ti }
})()

// ── the route ───────────────────────────────────────────────────────────────────────────────────────────────────────
export type StepName = 'in' | 'slm' | 'gain' | 'P40' | 'lensR' | 'fold' | 'roof' | 'out' | 'P100' | 'lensL' | 'P60'
export const ROUTE: StepName[] = ['in', 'slm', 'gain', 'P40', 'lensR', 'fold', 'roof', 'out', 'P100', 'lensL', 'P60']
const KERNELS: Partial<Record<StepName, Kernel>> = { P40: buildKernel(SEGMENTS[0]), P100: buildKernel(SEGMENTS[1]), P60: buildKernel(SEGMENTS[2]) }
const SEGMENT_OF: Partial<Record<StepName, number>> = { P40: 0, P100: 1, P60: 2 }

export interface Observer {
  /** the field right after a route step */
  after?(step: StepName, f: Field): void
  /** the angular spectrum at the start of free-space segment `seg` (0: SLM→lens R, 1: lens R→lens L, 2: lens L→SLM) */
  spectrum?(seg: number, spec: Field): void
  /** the out-coupler's 5 % tap, as an amplitude-scaled copy of the incident field */
  tap?(f: Field, amplitude: number): void
}

/**
 * One round trip, in place. `input` (if given) is added at the input coupler, like the research RunContext's
 * `inputs.take('in')`. Returns the global gain applied this trip.
 */
export function roundTrip(f: Field, input: Field | null, obs?: Observer): number {
  let gain = GAIN.G0
  for (const step of ROUTE) {
    switch (step) {
      case 'in':
        scale(f, Math.sqrt(COUPLER_IN))
        if (input) {
          const a = Math.sqrt(1 - COUPLER_IN)
          for (let i = 0; i < NN; i++) { f.re[i] += a * input.re[i]; f.im[i] += a * input.im[i] }
        }
        break
      case 'slm':
        multiplyComplex(f, slmT.tr, slmT.ti)
        break
      case 'gain': {
        let s = 0
        for (let i = 0; i < NN; i++) s += f.re[i] * f.re[i] + f.im[i] * f.im[i]
        gain = 1 + (GAIN.G0 - 1) / (1 + s / NN / GAIN.Isat)
        scale(f, Math.sqrt(Math.max(0, gain)))
        break
      }
      case 'lensR':
      case 'lensL':
        multiplyComplex(f, lensT.tr, lensT.ti)
        scale(f, Math.sqrt(LENS.transmission))
        break
      case 'fold':
      case 'roof':
        scale(f, Math.sqrt(MIRROR))
        break
      case 'out':
        obs?.tap?.(f, Math.sqrt(1 - COUPLER_OUT))
        scale(f, Math.sqrt(COUPLER_OUT))
        break
      default: {
        fft2(f)
        obs?.spectrum?.(SEGMENT_OF[step]!, f)
        applyKernel(f, KERNELS[step]!)
        fft2(f, true)
        for (let i = 0; i < NN; i++) { f.re[i] *= WINDOW[i]; f.im[i] *= WINDOW[i] }
      }
    }
    obs?.after?.(step, f)
  }
  return gain
}

/** intensity at distance z into a free-space segment, from that segment's starting spectrum (no taper: the model applies
 *  it once, at the end of the segment). `out` receives |E|². */
export function slice(spec: Field, kern: Kernel, work: Field, out: Float32Array | Float64Array): void {
  const { re, im } = spec
  for (let i = 0; i < NN; i++) {
    work.re[i] = re[i] * kern.re[i] - im[i] * kern.im[i]
    work.im[i] = re[i] * kern.im[i] + im[i] * kern.re[i]
  }
  fft2(work, true)
  for (let i = 0; i < NN; i++) out[i] = work.re[i] * work.re[i] + work.im[i] * work.im[i]
}

// ── the reservoir (15-reservoir.ts run(), 29-noise.ts with N_c = ∞) ─────────────────────────────────────────────────
/** the static input pattern: 40 random complex Gaussians (60 µm) over the central 60 % of the window, seed 101 */
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

export const binOf = (i: number) => Math.floor(Math.floor(i / N) / (N / BINS)) * BINS + Math.floor((i % N) / (N / BINS))
const BIN_OF = Int32Array.from({ length: NN }, (_, i) => binOf(i))

/**
 * Streaming reservoir: each input u(t) is injected once (amplitude 6·u·P at the input coupler) and the light makes
 * K = 10 round trips. The detector integrates the binned |E|² of the circulating field after each trip (Exp. 29's
 * noise-free features, in field units).
 */
export class Reservoir {
  readonly field = createField()
  readonly pattern = inputPattern()
  private readonly inj = createField()
  private pending = false
  /** the integrating detector: 256 bins */
  readonly acc = new Float64Array(BINS * BINS)
  trip = 0 // round trips completed
  tripInStep = 0 // 0 … K−1: trips completed in the current input step
  u = 0 // current input
  gain = GAIN.G0

  inject(u: number) {
    this.u = u
    for (let i = 0; i < NN; i++) { this.inj.re[i] = INPUT_AMP * u * this.pattern.re[i]; this.inj.im[i] = INPUT_AMP * u * this.pattern.im[i] }
    this.pending = true
    this.acc.fill(0)
    this.tripInStep = 0
  }

  /** one round trip; accumulates the detector. Returns true when this trip completes an input step. */
  step(obs?: Observer): boolean {
    const input = this.pending ? this.inj : null
    this.pending = false
    this.gain = roundTrip(this.field, input, obs)
    const { re, im } = this.field
    for (let i = 0; i < NN; i++) this.acc[BIN_OF[i]] += re[i] * re[i] + im[i] * im[i]
    this.trip++
    this.tripInStep++
    return this.tripInStep === K_TRIPS
  }

  /** a whole input step without observation: inject, K trips; returns the 256 features (a copy) */
  run(u: number): Float64Array {
    this.inject(u)
    for (let k = 0; k < K_TRIPS; k++) this.step()
    return this.acc.slice()
  }
}

// ── the digital readout ─────────────────────────────────────────────────────────────────────────────────────────────
export interface ReadoutTask { id: string; label: string; kind: 'recall' | 'narma10'; delay?: number; w: number[]; b: number; test: { r2: number; nmse: number } }
/** linear readout on Exp. 29's fixed feature transform log10(x + 1); weights already include the standardisation */
export function readout(acc: ArrayLike<number>, task: { w: number[]; b: number }): number {
  let y = task.b
  for (let i = 0; i < task.w.length; i++) y += task.w[i] * Math.log10(acc[i] + 1)
  return y
}
