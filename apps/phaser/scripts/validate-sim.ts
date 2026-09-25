/**
 * Validate the browser port (src/lib/phaser-sim.ts) against the research simulator (TensaCo/phaser-design).
 *
 * The port's STACK_CONFIG (research arch.ts stackCavity with fabricated phase plates and Exp. 33's glass slabs, 128² window,
 * Exp. 30's gain) is handed to the research simulator's CompiledSystem as is. Both run the same input stream (research
 * out/15/inputs_uniform.f64, one input per round trip, K = 1, injected as 6·u·P at the coupler). Compared
 * at checkpoint trips: the circulating field and the input mirror's output tap. Also compared: the compiled route, the
 * round-trip time and the passive power budget. Reports the cavity's physical sanity (gain, beam size, edge power).
 *
 * usage (from apps/phaser):  npx tsx scripts/validate-sim.ts [trips=4000]
 *   PHASER_DESIGN=/path/to/phaser-design (default ~/Documents/phaser-design)
 * writes src/data/sim-validation.json
 */
import { readFileSync, writeFileSync } from 'node:fs'
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

async function main() {
  const trips = Number(process.argv[2] ?? 4000)
  const { AssetStore } = await import(R('src/core/physics/assets.ts'))
  const { CompiledSystem } = await import(R('src/core/physics/system.ts'))
  const { createField, sampleX } = await import(R('src/core/physics/field/grid.ts'))
  const sys = new CompiledSystem(port.STACK_CONFIG, new AssetStore())
  const g = sys.grid
  const warnings: string[] = sys.warnings()
  const route = sys.route.steps.map((s: { kind: string; elementId?: string; side?: string; length?: number }) => (s.kind === 'element' ? `${s.elementId}:${s.side}` : `P${s.length}`))
  const mine = port.ROUTE.map((s) => (s.kind === 'element' ? `${s.id}:${s.side}` : `P${s.length}`))
  if (route.join(',') !== mine.join(',')) throw new Error(`route mismatch:\n research ${route.join(',')}\n port     ${mine.join(',')}`)
  const G0 = (port.STACK_CONFIG.elements.find((e) => e.kind === 'gain') as { smallSignalGain: number }).smallSignalGain
  const budget = sys.powerBudget().reduce((p: number, s: { transmission: number }) => p * s.transmission, 1) / G0
  // passive retention of the dominant mode (as research 33-loss.ts: power iteration, 1500 trips, no gain)
  const passiveCfg = { ...port.STACK_CONFIG, elements: port.STACK_CONFIG.elements.filter((e) => e.kind !== 'gain'), topology: { ...port.STACK_CONFIG.topology, start: { elementIds: port.STACK_CONFIG.topology.start.elementIds.filter((id) => id !== 'gain') } } }
  const passive = new CompiledSystem(passiveCfg, new AssetStore())
  const { mulberry32, gaussian } = await import(R('src/core/common/random.ts'))
  let retention = 0
  {
    const r = mulberry32(5), f = createField(g)
    for (let i = 0; i < f.re.length; i++) { f.re[i] = gaussian(r); f.im[i] = gaussian(r) }
    const NUL = { cycle: 0, inputs: { take: () => null }, taps: { record: () => {} } }
    for (let t = 0; t < 1500; t++) {
      let p0 = 0; for (let i = 0; i < f.re.length; i++) p0 += f.re[i] ** 2 + f.im[i] ** 2
      passive.roundTrip(f, NUL)
      let p1 = 0; for (let i = 0; i < f.re.length; i++) p1 += f.re[i] ** 2 + f.im[i] ** 2
      retention = p1 / p0; const k = 1 / Math.sqrt(p1); for (let i = 0; i < f.re.length; i++) { f.re[i] *= k; f.im[i] *= k }
    }
  }

  const u = new Float64Array(new Uint8Array(readFileSync(R('research/2026-09-14/out/15/inputs_uniform.f64'))).buffer)
  // the input pattern is the port's (research 30-run.ts pattern(101) re-implemented); both simulators get the same one
  const cav = new port.Cavity()
  const Pr = cav.pattern

  const fr = createField(g), inj = createField(g)
  let pending = false
  let tapR: F | null = null, tapP: F | null = null
  const ctx = {
    cycle: 0,
    inputs: { take: (p: string) => (p === 'in' && pending ? ((pending = false), inj) : null) },
    taps: { record: (_t: string, f: F, a: number) => { tapR = { re: f.re.map((v) => v * a), im: f.im.map((v) => v * a) } } },
  }
  const obsP: port.Observer = { tap: (f, a) => { tapP = { re: f.re.map((v) => v * a), im: f.im.map((v) => v * a) } } }
  const checkpoints = new Set([1, 2, 10, 100, 1000, trips])
  const rows: { trip: number; field: number; tap: number; power: number; gain: number; rmsRadiusMm: number; edgeFraction: number }[] = []
  let maxErr = 0
  const t0 = performance.now()
  for (let t = 0; t < trips; t++) {
    if (t % port.K_TRIPS === 0) {
      const s = (t / port.K_TRIPS) % u.length
      for (let i = 0; i < inj.re.length; i++) { inj.re[i] = port.INPUT_AMP * u[s] * Pr.re[i]; inj.im[i] = port.INPUT_AMP * u[s] * Pr.im[i] }
      pending = true
      cav.inject(u[s])
    }
    sys.roundTrip(fr, ctx)
    cav.step(obsP)
    const e = relL2(cav.field, fr)
    maxErr = Math.max(maxErr, e)
    if (checkpoints.has(t + 1)) {
      let p = 0, r2 = 0, edge = 0
      for (let j = 0; j < g.ny; j++) for (let i = 0; i < g.nx; i++) {
        const I = fr.re[j * g.nx + i] ** 2 + fr.im[j * g.nx + i] ** 2
        const rr = sampleX(g, i) ** 2 + sampleX(g, j) ** 2
        p += I; r2 += I * rr
        if (Math.sqrt(rr) > 0.5e-3) edge += I
      }
      rows.push({ trip: t + 1, field: e, tap: relL2(tapP!, tapR!), power: p, gain: cav.gain, rmsRadiusMm: Math.sqrt(r2 / p) * 1e3, edgeFraction: edge / p })
    }
  }
  const out = {
    date: new Date().toISOString().slice(0, 10),
    research: 'TensaCo/phaser-design src/core/physics CompiledSystem, fed src/lib/phaser-sim.ts STACK_CONFIG (arch.ts stackCavity: 4 fabricated phase plates + Exp. 33 glass slabs, 128² window, Exp. 30 gain G0 1.35)',
    trips,
    route: mine.length,
    tripTime: { research: sys.timing().roundTripTime, port: port.TRIP_TIME },
    passiveBudget: { research: budget, port: port.PASSIVE_BUDGET },
    passiveRetention: retention,
    researchWarnings: warnings,
    maxFieldRelL2: maxErr,
    checkpoints: rows,
    seconds: (performance.now() - t0) / 1000,
  }
  console.log(JSON.stringify(out, null, 1))
  writeFileSync(new URL('../src/data/sim-validation.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
}

main().catch((e) => { console.error(e); process.exit(1) })
