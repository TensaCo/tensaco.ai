/**
 * Validate the browser port (src/lib/phaser-sim.ts) against the research simulator (TensaCo/phaser-design).
 *
 * Both run the Exp. 15/29 reservoir "Apre_lin" on the same input sequence (research out/15/inputs_uniform.f64, K = 10
 * trips per input). Compared after every checkpoint trip: the circulating field, the out-coupler tap field, and the 256
 * detector features of every input step (also against the research's stored Exp. 29 noise-free features).
 *
 * usage (from apps/phaser):  npx tsx scripts/validate-sim.ts [steps=3200]
 *   PHASER_DESIGN=/path/to/phaser-design (default ~/Documents/phaser-design)
 * writes src/data/sim-validation.json
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import * as port from '../src/lib/phaser-sim'

const RD = process.env.PHASER_DESIGN ?? join(homedir(), 'Documents/phaser-design')
const R = (p: string) => join(RD, p)

type F = { re: Float64Array; im: Float64Array }
const relL2 = (a: F, b: F) => {
  let d = 0, n = 0
  for (let i = 0; i < a.re.length; i++) { d += (a.re[i] - b.re[i]) ** 2 + (a.im[i] - b.im[i]) ** 2; n += b.re[i] ** 2 + b.im[i] ** 2 }
  return Math.sqrt(d / n)
}
const relL2v = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  let d = 0, n = 0
  for (let i = 0; i < a.length; i++) { d += (a[i] - b[i]) ** 2; n += b[i] ** 2 }
  return Math.sqrt(d / n)
}

async function main() {
  const steps = Number(process.argv[2] ?? 3200)
  const { AssetStore } = await import(R('src/core/physics/assets.ts'))
  const { CompiledSystem } = await import(R('src/core/physics/system.ts'))
  const { createField } = await import(R('src/core/physics/field/grid.ts'))
  const res15 = await import(R('research/2026-09-14/15-reservoir.ts'))
  const sys = new CompiledSystem(res15.OPS.Apre_lin.cfg(), new AssetStore())
  const g = sys.grid
  if (g.nx !== port.N || g.dx !== port.DX || sys.wavelength !== port.LAMBDA) throw new Error('grid/wavelength mismatch')
  if (res15.OPS.Apre_lin.inputAmp !== port.INPUT_AMP) throw new Error('input amplitude mismatch')
  const route = sys.route.steps.map((s: { kind: string; elementId?: string; length?: number }) => (s.kind === 'element' ? s.elementId : `P${Math.round(s.length! * 1e3)}`))
  if (route.join(',') !== port.ROUTE.join(',')) throw new Error(`route mismatch: research ${route.join(',')} vs port ${port.ROUTE.join(',')}`)

  const u = new Float64Array(new Uint8Array(readFileSync(R('research/2026-09-14/out/15/inputs_uniform.f64'))).buffer)
  const Pr = res15.inputPattern(g, 101)
  const pRes = new port.Reservoir()
  const patternErr = relL2(pRes.pattern, Pr)

  // research side, driven exactly as 29-noise.ts (N_c = ∞) drives it
  const fr = createField(g), inj = createField(g)
  let pending = false
  let tapR: F | null = null, tapP: F | null = null
  const ctx = {
    cycle: 0,
    inputs: { take: (p: string) => (p === 'in' && pending ? ((pending = false), inj) : null) },
    taps: { record: (_t: string, f: F, a: number) => { tapR = { re: f.re.map((v) => v * a), im: f.im.map((v) => v * a) } } },
  }
  const accR = new Float64Array(256)
  const bin = g.nx / 16
  const obsP: port.Observer = { tap: (f, a) => { tapP = { re: f.re.map((v) => v * a), im: f.im.map((v) => v * a) } } }

  const checkpoints = new Set([1, 2, 10, 100, 1000, 10000, 32000])
  const fieldRows: { trip: number; field: number; tap: number; power: number }[] = []
  let featMax = 0, featWorstStep = -1
  const stored = existsSync(R('research/2026-09-14/out/29/feat_Ncinf_uniform.f64'))
    ? new Float64Array(new Uint8Array(readFileSync(R('research/2026-09-14/out/29/feat_Ncinf_uniform.f64'))).buffer)
    : null
  let storedMax = 0
  const t0 = performance.now()
  let trip = 0
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < inj.re.length; i++) { inj.re[i] = 6 * u[s] * Pr.re[i]; inj.im[i] = 6 * u[s] * Pr.im[i] }
    pending = true
    accR.fill(0)
    pRes.inject(u[s])
    for (let k = 0; k < 10; k++) {
      sys.roundTrip(fr, ctx)
      for (let j = 0; j < g.ny; j++) for (let i = 0; i < g.nx; i++) accR[Math.floor(j / bin) * 16 + Math.floor(i / bin)] += fr.re[j * g.nx + i] ** 2 + fr.im[j * g.nx + i] ** 2
      pRes.step(obsP)
      trip++
      if (checkpoints.has(trip)) {
        let pw = 0
        for (let i = 0; i < fr.re.length; i++) pw += fr.re[i] ** 2 + fr.im[i] ** 2
        fieldRows.push({ trip, field: relL2(pRes.field, fr), tap: relL2(tapP!, tapR!), power: pw })
      }
    }
    const e = relL2v(pRes.acc, accR)
    if (e > featMax) { featMax = e; featWorstStep = s }
    if (stored) storedMax = Math.max(storedMax, relL2v(pRes.acc, stored.subarray(s * 256, s * 256 + 256)))
  }
  const secs = (performance.now() - t0) / 1000
  const out = {
    date: new Date().toISOString().slice(0, 10),
    research: 'TensaCo/phaser-design research/2026-09-14, OPS.Apre_lin (15-reservoir.ts), driven as 29-noise.ts with N_c = ∞',
    steps, trips: trip,
    tripTime: { research: sys.timing().roundTripTime, port: port.TRIP_TIME },
    inputPatternRelL2: patternErr,
    checkpoints: fieldRows,
    featuresMaxRelL2: { vsLiveResearch: featMax, worstStep: featWorstStep, vsStoredExp29: stored ? storedMax : null },
    seconds: secs,
  }
  console.log(JSON.stringify(out, null, 1))
  writeFileSync(new URL('../src/data/sim-validation.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
}

main().catch((e) => { console.error(e); process.exit(1) })
