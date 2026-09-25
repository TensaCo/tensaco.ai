/**
 * A minimal port of the PHASER research simulator (TensaCo/phaser-design, src/core/physics) for exactly one
 * configuration: the research's linear stack of fabricated phase plates (research/2026-09-14/arch.ts `stackCavity`,
 * Experiments 30 and 33).
 *
 * STACK_CONFIG below is that configuration in the research simulator's own config language, as Exp. 33 builds its
 * "fabricated plates (IBS AR)" case, on Exp. 30's 64² grid: an input/output coupler (5 %) with a clamped global gain and
 * its 10 mm host crystal at the start reflector; four static phase plates (fused silica, 64 × 64 pixels at 20 µm, random
 * programs seeds 3…6, depth 0.1) 5 mm apart, each with its 1 mm substrate as a `slab` (bulk absorption, 0.1 % IBS AR per
 * face, group delay); and a concave end mirror (R = 120 mm, 99.9 %). The gain is Exp. 30's operating point for this stack
 * (global saturation, G0 1.35, I_s 0.05), one round trip per input. scripts/validate-sim.ts hands STACK_CONFIG to the
 * research simulator and compares every round trip with this port.
 *
 * Physics, as in the research model: a scalar, monochromatic complex field E(x, y) on a 64 × 64 grid at 20 µm (1.28 mm
 * window; the 128² window would alias the end mirror's 60 mm lens phase at its edge). The linear-reciprocal route applies the start assembly, goes forward through the plates, reflects off the end
 * assembly, and comes back. Every free-space gap is the angular-spectrum method (exact k_z, carrier removed, air) followed
 * by the absorbing cosine taper. Operation order, constants and the radix-2 FFT are copied from the research code.
 *
 * No DOM here: the page and the validation script both import this file.
 */

// ── configuration ───────────────────────────────────────────────────────────────────────────────────────────────────
export const N = 64 // samples per axis
export const PITCH = 20e-6 // plate pixel pitch
export const DX = PITCH // 1 sample per pixel (Exps. 30, 33)
export const LAMBDA = 650e-9
export const PLANES = 4
export const SPACING = 5e-3
export const LENGTH = (PLANES + 1) * SPACING // input mirror → end mirror, 25 mm
export const PLANE_Z = Array.from({ length: PLANES }, (_, k) => (k + 1) * SPACING)
export const MIRROR_R = 0.12 // end mirror radius of curvature: a thin lens f = R/2 = 60 mm on a flat mirror
export const K_TRIPS = 1 // round trips per input (Exp. 30)
export const INPUT_AMP = 6
const AIR_SPEC = { kind: 'air', pressurePa: 101_325, temperatureK: 288.15, attenuationPerM: -Math.log(0.998) } as const
const PX = { resolution: { x: 64, y: 64 }, pitch: { x: PITCH, y: PITCH }, fillFactor: 1, offset: { x: 0, y: 0 } }
const plate = (k: number) => ({
  kind: 'phase-plate' as const, id: `p${k}`, pixels: PX,
  transmission: { front: 1, back: 1 }, designWavelength: 650e-9,
  program: { kind: 'random' as const, seed: 3 + k, depth: 0.1 },
})
const slab = (id: string, t: number, alpha: number, R: number, n: number, ng: number) => ({
  kind: 'slab' as const, id, thickness: t,
  medium: { kind: 'custom' as const, label: 'glass', refractiveIndex: n, groupIndex: ng, attenuationPerM: alpha },
  surfaceReflectance: { front: R, back: R },
})
const AR_IBS = 0.001 // ion-beam-sputtered V-coat, per surface (Exp. 33)

/** the research-simulator PhysicsConfig this file implements (arch.ts stackCavity, as Exp. 33 calls it, + Exp. 30 gain) */
export const STACK_CONFIG = {
  field: { grid: { nx: N, ny: N, dx: DX, dy: DX }, wavelength: LAMBDA, boundary: { kind: 'absorbing' as const, widthFraction: 0.08 } },
  elements: [
    { kind: 'coupler' as const, id: 'in', retained: { front: 0.95, back: 0.95 }, inputPort: 'in', outputTap: 'readout' },
    ...Array.from({ length: PLANES }, (_, k) => plate(k)),
    ...Array.from({ length: PLANES }, (_, k) => slab(`g${k}`, 1e-3, 0.01, AR_IBS, 1.457, 1.47)), // fused-silica substrates
    { kind: 'lens' as const, id: 'Lend', focalLength: MIRROR_R / 2, apertureDiameter: N * PITCH, transmission: { front: 1, back: 1 } },
    { kind: 'mirror' as const, id: 'end', reflectivity: { front: 0.999, back: 0.999 }, parity: 'none' as const },
    { kind: 'gain' as const, id: 'gain', smallSignalGain: 1.35, saturation: { kind: 'global' as const, saturationIntensity: 0.05 }, noise: { kind: 'none' as const } },
    slab('gGain', 10e-3, 0.3, 1 - (1 - AR_IBS) ** 2, 1.45, 1.47), // gain-crystal host, passed once per round trip
  ],
  topology: {
    kind: 'linear-reciprocal' as const, length: LENGTH, medium: AIR_SPEC,
    start: { elementIds: ['in', 'gain', 'gGain'] }, end: { elementIds: ['Lend', 'end'] },
    items: Array.from({ length: PLANES }, (_, k) => [{ elementId: `p${k}`, position: (k + 1) * SPACING }, { elementId: `g${k}`, position: (k + 1) * SPACING + 1e-6 }]).flat(),
  },
  readouts: [],
}
type Spec = (typeof STACK_CONFIG.elements)[number]
const EL = Object.fromEntries(STACK_CONFIG.elements.map((e) => [e.id, e])) as Record<string, Spec>

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
export type RouteStep =
  | { kind: 'element'; id: string; side: 'front' | 'back'; distance: number }
  | { kind: 'propagate'; length: number; distance: number }
export const ROUTE: RouteStep[] = (() => {
  const t = STACK_CONFIG.topology
  const steps: RouteStep[] = []
  let d = 0
  const prop = (length: number) => { if (length <= 1e-12) return; steps.push({ kind: 'propagate', length, distance: d }); d += length }
  const el = (id: string, side: 'front' | 'back') => steps.push({ kind: 'element', id, side, distance: d })
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
/** geometric round-trip length in air (m) */
export const ROUTE_LENGTH = ROUTE.reduce((s, r) => s + (r.kind === 'propagate' ? r.length : 0), 0)
/** round-trip time Σ n_g L / c over the air gaps plus every glass slab's internal path, as CompiledSystem.timing() */
export const TRIP_TIME = ROUTE.reduce((s, r) => {
  if (r.kind === 'propagate') return s + AIR_NG * r.length
  const e = EL[r.id]
  return e.kind === 'slab' ? s + e.medium.groupIndex * e.thickness : s
}, 0) / 299_792_458
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

type PlateSpec = ReturnType<typeof plate>
export interface Plane { id: string; phase: Float64Array; tr: Float64Array; ti: Float64Array; amp: Record<'front' | 'back', number> }
/** the four phase plates: per-pixel phase (64 × 64; etched depth fixed at fabrication, scaled by λ_design/λ) and the
 *  per-sample transmission (PhasePlate: fill(1, phase·scale, dead 1)) */
export const PLANE_DATA: Plane[] = STACK_CONFIG.elements.filter((e): e is PlateSpec => e.kind === 'phase-plate').map((s) => {
  const { x: RX, y: RY } = s.pixels.resolution
  const rand = mulberry32(s.program.seed)
  const command = new Float64Array(RX * RY)
  for (let i = 0; i < command.length; i++) command[i] = TAU * s.program.depth * rand()
  const sc = s.designWavelength / LAMBDA
  const phase = command.map((v) => v * sc)
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
      else if (!fracY || Math.abs(u - pxi - 0.5) > fx / 2) { tr[idx] = 1; ti[idx] = 0 }
      else { const ph = phase[py * RX + pxi]; tr[idx] = Math.cos(ph); ti[idx] = Math.sin(ph) }
    }
  }
  return { id: s.id, phase, tr, ti, amp: { front: Math.sqrt(s.transmission.front), back: Math.sqrt(s.transmission.back) } }
})
const PLANE_BY_ID = Object.fromEntries(PLANE_DATA.map((p) => [p.id, p]))

/** slab: a pass crosses both faces; amplitude √((1 − R_f)(1 − R_b)·e^{−αt}) */
const slabAmp = (s: ReturnType<typeof slab>) => Math.sqrt((1 - s.surfaceReflectance.front) * (1 - s.surfaceReflectance.back) * Math.exp(-s.medium.attenuationPerM * s.thickness))

const LEND = EL.Lend as Extract<Spec, { kind: 'lens' }>
const lensT = (() => {
  const k = (2 * Math.PI) / LAMBDA
  const tr = new Float64Array(NN), ti = new Float64Array(NN)
  const R = LEND.apertureDiameter / 2
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = sampleX(i), y = sampleX(j)
      const r2 = x * x + y * y
      if (r2 > R * R) continue
      const ph = (-k * r2) / (2 * LEND.focalLength)
      tr[j * N + i] = Math.cos(ph)
      ti[j * N + i] = Math.sin(ph)
    }
  return { tr, ti }
})()
const IN = EL.in as Extract<Spec, { kind: 'coupler' }>
const GAIN = EL.gain as Extract<Spec, { kind: 'gain' }>
const END = EL.end as Extract<Spec, { kind: 'mirror' }>
/** passive power retained per round trip (uniform illumination, small signal), as CompiledSystem.powerBudget() reports */
export const PASSIVE_BUDGET = (() => {
  let c = 0
  for (let i = 0; i < NN; i++) c += lensT.tr[i] ** 2 + lensT.ti[i] ** 2
  let p = IN.retained.front * END.reflectivity.front * (c / NN) * LEND.transmission.front
  for (const r of ROUTE) {
    if (r.kind === 'propagate') { p *= Math.exp(-ALPHA * r.length); continue }
    const e = EL[r.id]
    if (e.kind === 'slab') p *= slabAmp(e) ** 2
    else if (e.kind === 'phase-plate') p *= e.transmission[r.side]
  }
  return p
})()

export interface Observer {
  /** the field right after route step `index` */
  after?(index: number, f: Field): void
  /** the angular spectrum at the start of free-space gap `gap` (index into GAPS) */
  spectrum?(gap: number, spec: Field): void
  /** the coupler's output tap (5 %), as an amplitude-scaled view of the incident field */
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
    } else {
      const e = EL[step.id]
      switch (e.kind) {
        case 'coupler': {
          obs?.tap?.(f, Math.sqrt(1 - e.retained[step.side]))
          scale(f, Math.sqrt(e.retained[step.side]))
          if (input && step.side === 'front') {
            const a = Math.sqrt(1 - e.retained.front)
            for (let i = 0; i < NN; i++) { f.re[i] += a * input.re[i]; f.im[i] += a * input.im[i] }
          }
          break
        }
        case 'gain': {
          let s = 0
          for (let i = 0; i < NN; i++) s += f.re[i] * f.re[i] + f.im[i] * f.im[i]
          gain = 1 + (e.smallSignalGain - 1) / (1 + s / NN / e.saturation.saturationIntensity)
          scale(f, Math.sqrt(Math.max(0, gain)))
          break
        }
        case 'slab': scale(f, slabAmp(e)); break
        case 'lens': multiplyComplex(f, lensT.tr, lensT.ti); scale(f, Math.sqrt(e.transmission[step.side])); break
        case 'mirror': scale(f, Math.sqrt(e.reflectivity[step.side])); break
        case 'phase-plate': { const p = PLANE_BY_ID[e.id]; multiplyComplex(f, p.tr, p.ti); scale(f, p.amp[step.side]); break }
      }
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
/** the static input pattern (research 30-run.ts pattern(101)): smooth complex random, 40 Gaussians per 64² window, correlation 3 samples, over the central 60 % of the window */
export function inputPattern(seed = 101, corr = 3): Field {
  const r = mulberry32(seed), f = createField(), L = N * DX * 0.3
  const count = Math.round(40 * (N / 64) ** 2)
  for (let k = 0; k < count; k++) {
    const cx = (r() * 2 - 1) * L, cy = (r() * 2 - 1) * L, a = gaussian(r), b = gaussian(r)
    const R = 4 * corr * DX, i0 = Math.max(0, Math.floor(cx / DX + N / 2 - R / DX)), i1 = Math.min(N - 1, Math.ceil(cx / DX + N / 2 + R / DX))
    const j0 = Math.max(0, Math.floor(cy / DX + N / 2 - R / DX)), j1 = Math.min(N - 1, Math.ceil(cy / DX + N / 2 + R / DX))
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const e = Math.exp(-((sampleX(i) - cx) ** 2 + (sampleX(j) - cy) ** 2) / (2 * (corr * DX) ** 2))
      f.re[j * N + i] += a * e; f.im[j * N + i] += b * e
    }
  }
  let m = 0
  for (let i = 0; i < NN; i++) m = Math.max(m, Math.hypot(f.re[i], f.im[i]))
  for (let i = 0; i < NN; i++) { f.re[i] /= m; f.im[i] /= m }
  return f
}

/** The cavity with an input stream: each input u is injected once (6·u·P at the coupler), then K round trips (K = 1). */
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
