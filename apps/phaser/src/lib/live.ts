/**
 * A live run of the linear-stack cavity for the page: a random input u ∈ [0, 0.5] injected at the input mirror once every
 * K = 10 round trips, and captures of the field where the page draws it: the angular spectrum at the start of every
 * free-space gap (to draw |E|² at any plane), the light landing on each LCD plane, and the output tap.
 */
import { Cavity, GAPS, PLANES, ROUTE, K_TRIPS, INPUT_AMP, N, createField, mulberry32, type Field, type Observer } from './phaser-sim'

const NN = N * N
const PLANE_OF: (number | -1)[] = ROUTE.map((_, i) => {
  const next = ROUTE[i + 1]
  return next && next.kind === 'element' && next.id.startsWith('lcd') ? Number(next.id.slice(3)) - 1 : -1
})

export class LiveStack {
  readonly cav = new Cavity()
  private rand: () => number
  step = 0
  /** angular spectra at the start of each gap, for the last two trips: spectra[trip % 2][gap] */
  readonly spectra: Field[][] = [GAPS.map(() => createField()), GAPS.map(() => createField())]
  /** which trip each spectra slot holds (-1: none) */
  readonly spectraTrip = [-1, -1]
  /** |E|² arriving at each LCD plane this trip (forward + return pass) */
  readonly planeI = Array.from({ length: PLANES }, () => new Float64Array(NN))
  /** |E|² of the output tap (8 % through the input mirror) and of the injected light */
  readonly tapI = new Float64Array(NN)
  readonly inputI = new Float64Array(NN)
  private slot = 0

  constructor(seed = 20260925) { this.rand = mulberry32(seed) }

  private obs: Observer = {
    spectrum: (gap, f) => { const s = this.spectra[this.slot][gap]; s.re.set(f.re); s.im.set(f.im) },
    after: (index, f) => {
      const p = PLANE_OF[index]
      if (p >= 0) { const I = this.planeI[p]; for (let i = 0; i < NN; i++) I[i] += f.re[i] * f.re[i] + f.im[i] * f.im[i] }
    },
    tap: (f, a) => { const a2 = a * a; for (let i = 0; i < NN; i++) this.tapI[i] = a2 * (f.re[i] * f.re[i] + f.im[i] * f.im[i]) },
  }

  /** one round trip (trip number = this.cav.trip before the call) */
  trip(observe = true) {
    const c = this.cav
    if (c.tripInStep === 0 || c.tripInStep >= K_TRIPS) {
      c.inject(0.5 * this.rand())
      this.step++
      const a2 = 0.08 * INPUT_AMP * INPUT_AMP * c.u * c.u
      for (let i = 0; i < NN; i++) this.inputI[i] = a2 * (c.pattern.re[i] ** 2 + c.pattern.im[i] ** 2)
    }
    if (observe) {
      this.slot = c.trip % 2
      this.spectraTrip[this.slot] = c.trip
      for (const I of this.planeI) I.fill(0)
    }
    c.step(observe ? this.obs : undefined)
  }

  /** run trips quickly; the last two are observed so the page has both spectra slots */
  warm(trips: number) { for (let t = 0; t < trips; t++) this.trip(t >= trips - 2) }
}
