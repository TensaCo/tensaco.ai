/**
 * A live run of the research reservoir for the page: an i.i.d. input stream u(t) ∈ [0, 0.5] (the Exp. 15 distribution,
 * but a fresh seed, so the page is out-of-sample for the trained readout), K = 10 trips per input, and captures of the
 * field at the planes the page draws.
 */
import { Reservoir, createField, mulberry32, N, K_TRIPS, INPUT_AMP, COUPLER_IN, type Field, type Observer } from './phaser-sim'

const NN = N * N

export class LiveRing {
  readonly res = new Reservoir()
  private rand: () => number
  /** input steps started */
  step = 0
  /** angular spectrum at the start of each free-space segment, this trip */
  readonly spectra: Field[] = [createField(), createField(), createField()]
  /** |E|² landing on the SLM (after the in-coupler), after the 100 mm relay leg (at lens L), and of the injected light */
  readonly slmI = new Float64Array(NN)
  readonly relayI = new Float64Array(NN)
  readonly inputI = new Float64Array(NN)
  /** detector features of the last completed input step */
  readonly features = new Float64Array(256)
  onStep?: (u: number, features: Float64Array) => void

  constructor(seed = 20260925) {
    this.rand = mulberry32(seed)
  }

  private obs: Observer = {
    spectrum: (seg, f) => { this.spectra[seg].re.set(f.re); this.spectra[seg].im.set(f.im) },
    after: (step, f) => {
      if (step === 'in') for (let i = 0; i < NN; i++) this.slmI[i] = f.re[i] * f.re[i] + f.im[i] * f.im[i]
      else if (step === 'P100') for (let i = 0; i < NN; i++) this.relayI[i] = f.re[i] * f.re[i] + f.im[i] * f.im[i]
    },
  }

  /** the next input value (exposed so a page can show what is coming) */
  private next() { return 0.5 * this.rand() }

  /** one round trip; returns true when it completed an input step. `observe` = false skips the captures (warm-up). */
  trip(observe = true): boolean {
    const r = this.res
    if (r.tripInStep === 0 || r.tripInStep >= K_TRIPS) {
      r.inject(this.next())
      this.step++
      const a2 = (1 - COUPLER_IN) * INPUT_AMP * INPUT_AMP * r.u * r.u
      for (let i = 0; i < NN; i++) this.inputI[i] = a2 * (r.pattern.re[i] ** 2 + r.pattern.im[i] ** 2)
    }
    const done = r.step(observe ? this.obs : undefined)
    if (done) {
      this.features.set(r.acc)
      this.onStep?.(r.u, this.features)
    }
    return done
  }

  /** run whole input steps quickly (no captures except on the very last trip) */
  warm(steps: number) {
    for (let s = 0; s < steps; s++) for (let k = 0; k < K_TRIPS; k++) this.trip(s === steps - 1 && k === K_TRIPS - 1)
  }
}
