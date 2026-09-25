/**
 * Two small simulations for the carriers section. Both are real integrations of their wave equations, in natural units,
 * on coarse grids; they illustrate the physics, not device numbers.
 *
 * Electron: the 2-D time-dependent Schrödinger equation (ħ = m = 1) by split-step Fourier, for a wave packet in a square
 * lattice of ions (attractive Gaussian wells). The ions are classical oscillators coupled to the electron both ways
 * (Ehrenfest): the packet feels the ions' potential and the ions feel the force of the electron's charge density. A perfect
 * lattice would let the wave through; the ions' thermal vibration scatters it, and every ion the electron shakes keeps
 * that energy as vibration: heat. `lattice` tracks the energy the electron has handed to the ions.
 *
 * Photon: the 2-D scalar wave equation (FDTD leapfrog) for a light packet crossing a glass slab (n = 1.5). It slows and
 * its wavelength shortens inside, ~4 % reflects at each face, and the rest passes on coherently; nothing in the model's
 * glass absorbs it.
 */

// ── radix-2 complex FFT on Float64Array rows/columns ────────────────────────────────────────────────────────────────
function fft1(re: Float64Array, im: Float64Array, n: number, inverse: boolean) {
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len
    const wr0 = Math.cos(ang), wi0 = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let wr = 1, wi = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2
        const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi
        const t = wr * wr0 - wi * wi0; wi = wr * wi0 + wi * wr0; wr = t
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n }
}
function fft2(re: Float64Array, im: Float64Array, nx: number, ny: number, inverse: boolean, bufR: Float64Array, bufI: Float64Array) {
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) { bufR[i] = re[j * nx + i]; bufI[i] = im[j * nx + i] }
    fft1(bufR, bufI, nx, inverse)
    for (let i = 0; i < nx; i++) { re[j * nx + i] = bufR[i]; im[j * nx + i] = bufI[i] }
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) { bufR[j] = re[j * nx + i]; bufI[j] = im[j * nx + i] }
    fft1(bufR, bufI, ny, inverse)
    for (let j = 0; j < ny; j++) { re[j * nx + i] = bufR[j]; im[j * nx + i] = bufI[j] }
  }
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r())

// ── electron ────────────────────────────────────────────────────────────────────────────────────────────────────────
export class Electron {
  readonly nx = 128
  readonly ny = 64
  readonly re: Float64Array
  readonly im: Float64Array
  readonly ions: { x0: number; y0: number; x: number; y: number; vx: number; vy: number }[] = []
  private V: Float64Array
  private kin: { c: Float64Array; s: Float64Array }
  private mask: Float64Array
  private bufR = new Float64Array(128)
  private bufI = new Float64Array(128)
  private rand = rng(7)
  readonly spacing = 8
  private depth = 0.6 // well depth
  private sigma = 1.1 // well width
  private M = 4 // ion mass (electron = 1): far lighter than real ions, so the exchange shows within one pass
  private K = 0.08 // ion spring constant
  private kT = 0.01 // thermal energy the ions start with
  private dt = 0.25
  /** energy the electron has given the lattice since launch, and its energy at launch */
  lattice = 0
  launchEnergy = 1
  private ionE0 = 0
  t = 0

  constructor() {
    const n = this.nx * this.ny
    this.re = new Float64Array(n); this.im = new Float64Array(n); this.V = new Float64Array(n)
    const c = new Float64Array(n), s = new Float64Array(n)
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const kx = (2 * Math.PI * (i < this.nx / 2 ? i : i - this.nx)) / this.nx
      const ky = (2 * Math.PI * (j < this.ny / 2 ? j : j - this.ny)) / this.ny
      const ph = -0.5 * (kx * kx + ky * ky) * this.dt
      c[j * this.nx + i] = Math.cos(ph); s[j * this.nx + i] = Math.sin(ph)
    }
    this.kin = { c, s }
    this.mask = new Float64Array(n)
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const d = Math.min(i, this.nx - 1 - i, j, this.ny - 1 - j)
      this.mask[j * this.nx + i] = d >= 8 ? 1 : Math.exp(-0.03 * (8 - d) ** 2)
    }
    const a = this.spacing
    for (let y = a / 2; y < this.ny; y += a) for (let x = 28 + a / 2; x < this.nx - 6; x += a) {
      const sd = Math.sqrt(this.kT / this.K)
      this.ions.push({ x0: x, y0: y, x: x + sd * gauss(this.rand), y: y + sd * gauss(this.rand), vx: Math.sqrt(this.kT / this.M) * gauss(this.rand), vy: Math.sqrt(this.kT / this.M) * gauss(this.rand) })
    }
    this.launch()
  }

  private ionEnergy() {
    let e = 0
    for (const o of this.ions) e += 0.5 * this.M * (o.vx * o.vx + o.vy * o.vy) + 0.5 * this.K * ((o.x - o.x0) ** 2 + (o.y - o.y0) ** 2)
    return e
  }

  /** a fresh packet entering from the left, moving right with k = 1.1 (wavelength ≈ 5.7 grid units) */
  launch() {
    const k0 = 1.1, x0 = 16, y0 = this.ny / 2 + (this.rand() - 0.5) * 8, sx = 8, sy = 10
    let norm = 0
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const e = Math.exp(-((i - x0) ** 2) / (4 * sx * sx) - ((j - y0) ** 2) / (4 * sy * sy))
      this.re[j * this.nx + i] = e * Math.cos(k0 * i); this.im[j * this.nx + i] = e * Math.sin(k0 * i)
      norm += e * e
    }
    const s = 1 / Math.sqrt(norm)
    for (let i = 0; i < this.re.length; i++) { this.re[i] *= s; this.im[i] *= s }
    this.launchEnergy = 0.5 * k0 * k0
    this.ionE0 = this.ionEnergy()
    this.lattice = 0
    this.t = 0
  }

  private buildPotential() {
    this.V.fill(0)
    const R = Math.ceil(this.sigma * 3.5), inv = 1 / (2 * this.sigma * this.sigma)
    for (const o of this.ions) {
      const ci = Math.round(o.x), cj = Math.round(o.y)
      for (let j = cj - R; j <= cj + R; j++) {
        if (j < 0 || j >= this.ny) continue
        for (let i = ci - R; i <= ci + R; i++) {
          if (i < 0 || i >= this.nx) continue
          this.V[j * this.nx + i] -= this.depth * Math.exp(-((i - o.x) ** 2 + (j - o.y) ** 2) * inv)
        }
      }
    }
  }

  /** force on each ion from the electron density: F = −∫|ψ|² ∇_R V_ion = −∫|ψ|² · depth·e^{…}·(r − R)/σ² */
  private ionForces(dt: number) {
    const R = Math.ceil(this.sigma * 3.5), inv = 1 / (2 * this.sigma * this.sigma), s2 = this.sigma * this.sigma
    for (const o of this.ions) {
      let fx = 0, fy = 0
      const ci = Math.round(o.x), cj = Math.round(o.y)
      for (let j = cj - R; j <= cj + R; j++) {
        if (j < 0 || j >= this.ny) continue
        for (let i = ci - R; i <= ci + R; i++) {
          if (i < 0 || i >= this.nx) continue
          const k = j * this.nx + i
          const rho = this.re[k] * this.re[k] + this.im[k] * this.im[k]
          const g = this.depth * Math.exp(-((i - o.x) ** 2 + (j - o.y) ** 2) * inv) / s2
          // V = −depth·g(r − R): ∂V/∂R = −depth·g·(r − R)/σ², so F = −∫ρ ∂V/∂R = ∫ρ·depth·g·(r − R)/σ²
          fx += rho * g * (i - o.x); fy += rho * g * (j - o.y)
        }
      }
      o.vx += ((fx - this.K * (o.x - o.x0)) / this.M) * dt
      o.vy += ((fy - this.K * (o.y - o.y0)) / this.M) * dt
      o.x += o.vx * dt; o.y += o.vy * dt
    }
  }

  step(n = 1) {
    const { re, im } = this
    const N = re.length
    for (let s = 0; s < n; s++) {
      this.buildPotential()
      const half = (V: number) => -V * this.dt * 0.5
      for (let i = 0; i < N; i++) { const p = half(this.V[i]), c = Math.cos(p), sn = Math.sin(p); const r = re[i] * c - im[i] * sn; im[i] = re[i] * sn + im[i] * c; re[i] = r }
      fft2(re, im, this.nx, this.ny, false, this.bufR, this.bufI)
      for (let i = 0; i < N; i++) { const c = this.kin.c[i], sn = this.kin.s[i]; const r = re[i] * c - im[i] * sn; im[i] = re[i] * sn + im[i] * c; re[i] = r }
      fft2(re, im, this.nx, this.ny, true, this.bufR, this.bufI)
      for (let i = 0; i < N; i++) { const p = half(this.V[i]), c = Math.cos(p), sn = Math.sin(p); const r = re[i] * c - im[i] * sn; im[i] = re[i] * sn + im[i] * c; re[i] = r }
      this.ionForces(this.dt)
      for (let i = 0; i < N; i++) { re[i] *= this.mask[i]; im[i] *= this.mask[i] }
      this.t += this.dt
    }
    this.lattice = Math.max(0, this.ionEnergy() - this.ionE0)
    let norm = 0
    for (let i = 0; i < N; i++) norm += re[i] * re[i] + im[i] * im[i]
    if (norm < 0.25 || this.t > 260) this.launch()
  }
}

// ── photon ──────────────────────────────────────────────────────────────────────────────────────────────────────────
export class Photon {
  readonly nx = 288
  readonly ny = 160
  E: Float64Array
  private P: Float64Array
  private next: Float64Array
  private c2: Float64Array
  private damp: Float64Array
  readonly glass = { x0: 104, x1: 204, n: 1.5 }
  t = 0
  private c = 0.5

  constructor() {
    const n = this.nx * this.ny
    this.E = new Float64Array(n); this.P = new Float64Array(n); this.next = new Float64Array(n)
    this.c2 = new Float64Array(n); this.damp = new Float64Array(n)
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const k = j * this.nx + i
      const nn = i >= this.glass.x0 && i < this.glass.x1 ? this.glass.n : 1
      this.c2[k] = (this.c / nn) ** 2
      const d = Math.min(i, this.nx - 1 - i, j, this.ny - 1 - j)
      this.damp[k] = d >= 16 ? 0 : 0.012 * ((16 - d) / 16) ** 2 * 16
    }
    this.launch()
  }

  launch() {
    const k0 = (2 * Math.PI) / 12, x0 = 44, y0 = this.ny / 2, sx = 10, sy = 22
    const packet = (x: number, y: number) => Math.exp(-((x - x0) ** 2) / (2 * sx * sx) - ((y - y0) ** 2) / (2 * sy * sy)) * Math.cos(k0 * (x - x0))
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const k = j * this.nx + i
      this.E[k] = packet(i, j)
      this.P[k] = packet(i + this.c, j) // one step earlier: the packet moves right at c
    }
    this.t = 0
  }

  step(n = 1) {
    const { nx, ny } = this
    for (let s = 0; s < n; s++) {
      const E = this.E, P = this.P, X = this.next
      for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
        const k = j * nx + i
        const lap = E[k - 1] + E[k + 1] + E[k - nx] + E[k + nx] - 4 * E[k]
        const d = this.damp[k]
        X[k] = (2 * E[k] - (1 - d) * P[k] + this.c2[k] * lap) / (1 + d)
      }
      this.P = E; this.E = X; this.next = P
      this.t++
    }
    if (this.t > 700) this.launch()
  }
}
