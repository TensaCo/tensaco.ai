/**
 * Train the digital linear readouts shipped with the page (src/data/reservoir-readout.json).
 *
 * Features: the Exp. 29 noise-free detector features (256 bins, integrated over the K = 10 trips of each input step),
 * produced by src/lib/phaser-sim.ts, which scripts/validate-sim.ts shows is bit-identical to the research simulator.
 * Inputs: research out/15/inputs_uniform.f64 (3200 i.i.d. uniform u ∈ [0, 0.5]), or the same mulberry32(2024) stream.
 * Protocol: exactly research 15-readout.py ridge_eval on Exp. 29's transform log10(x + 1): standardise on the train
 * split, train on steps 200–2200 with λ ∈ {1e-6, 1e-4, 1e-2, 1} chosen on the last 20 % of train, test on 2200–3200.
 *
 * usage (from apps/phaser):  npx tsx scripts/train-readout.ts
 */
import { writeFileSync } from 'node:fs'
import { mulberry32, Reservoir, BINS } from '../src/lib/phaser-sim'

const STEPS = 3200, WASH = 200, TRAIN = 2200, D = BINS * BINS

// the Exp. 15 input stream (15-reservoir.ts: r = mulberry32(2024); uni[s] = 0.5·r(); bits[s] = r() < 0.5)
const r = mulberry32(2024)
const u = new Float64Array(STEPS)
for (let s = 0; s < STEPS; s++) { u[s] = 0.5 * r(); r() }

const t0 = performance.now()
const res = new Reservoir()
const X: Float64Array[] = []
for (let s = 0; s < STEPS; s++) X.push(res.run(u[s]).map((v) => Math.log10(v + 1)))
console.error(`features: ${((performance.now() - t0) / 1000).toFixed(1)} s`)

function narma10(u: Float64Array) {
  const y = new Float64Array(u.length)
  for (let t = 9; t < u.length - 1; t++) {
    let s = 0
    for (let k = t - 9; k <= t; k++) s += y[k]
    y[t + 1] = 0.3 * y[t] + 0.05 * y[t] * s + 1.5 * u[t - 9] * u[t] + 0.1
  }
  return y
}
const delayed = (k: number) => { const y = new Float64Array(STEPS); for (let t = k; t < STEPS; t++) y[t] = u[t - k]; return y }

/** solve (AᵀA + λI) w = Aᵀy by Cholesky */
function ridge(rows: number[], Z: (s: number) => Float64Array, y: Float64Array, lam: number) {
  const n = D + 1
  const M = new Float64Array(n * n), v = new Float64Array(n)
  for (const s of rows) {
    const a = Z(s)
    for (let i = 0; i < n; i++) {
      const ai = a[i]
      v[i] += ai * y[s]
      for (let j = 0; j <= i; j++) M[i * n + j] += ai * a[j]
    }
  }
  for (let i = 0; i < n; i++) { M[i * n + i] += lam; for (let j = 0; j < i; j++) M[j * n + i] = M[i * n + j] }
  const L = new Float64Array(n * n)
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = M[i * n + j]
    for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k]
    L[i * n + j] = i === j ? Math.sqrt(s) : s / L[j * n + j]
  }
  const z = new Float64Array(n), w = new Float64Array(n)
  for (let i = 0; i < n; i++) { let s = v[i]; for (let k = 0; k < i; k++) s -= L[i * n + k] * z[k]; z[i] = s / L[i * n + i] }
  for (let i = n - 1; i >= 0; i--) { let s = z[i]; for (let k = i + 1; k < n; k++) s -= L[k * n + i] * w[k]; w[i] = s / L[i * n + i] }
  return w
}

function evalTask(y: Float64Array) {
  const range = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i)
  const tr = range(WASH, TRAIN), cut = WASH + Math.floor(tr.length * 0.8)
  const mu = new Float64Array(D), sd = new Float64Array(D)
  for (const s of tr) for (let i = 0; i < D; i++) mu[i] += X[s][i] / tr.length
  for (const s of tr) for (let i = 0; i < D; i++) sd[i] += (X[s][i] - mu[i]) ** 2 / tr.length
  for (let i = 0; i < D; i++) sd[i] = Math.sqrt(sd[i]) + 1e-12
  const Z = (s: number) => { const a = new Float64Array(D + 1); for (let i = 0; i < D; i++) a[i] = (X[s][i] - mu[i]) / sd[i]; a[D] = 1; return a }
  const pred = (w: Float64Array, s: number) => { const a = Z(s); let p = 0; for (let i = 0; i <= D; i++) p += a[i] * w[i]; return p }
  let best = { err: Infinity, lam: 0 }
  for (const lam of [1e-6, 1e-4, 1e-2, 1]) {
    const w = ridge(range(WASH, cut), Z, y, lam)
    let err = 0
    for (let s = cut; s < TRAIN; s++) err += (pred(w, s) - y[s]) ** 2
    if (err < best.err) best = { err, lam }
  }
  const w = ridge(tr, Z, y, best.lam)
  const te = range(TRAIN, STEPS)
  const p = te.map((s) => pred(w, s)), t = te.map((s) => y[s])
  const mean = (a: number[]) => a.reduce((x, v) => x + v, 0) / a.length
  const mp = mean(p), mt = mean(t)
  let spt = 0, spp = 0, stt = 0, se = 0
  for (let i = 0; i < p.length; i++) { spt += (p[i] - mp) * (t[i] - mt); spp += (p[i] - mp) ** 2; stt += (t[i] - mt) ** 2; se += (p[i] - t[i]) ** 2 }
  const r2 = spt ** 2 / (spp * stt), nmse = se / p.length / (stt / p.length)
  // fold the standardisation into the weights: y = b + Σ w_i · log10(acc_i + 1)
  const wf = Array.from({ length: D }, (_, i) => w[i] / sd[i])
  let b = w[D]
  for (let i = 0; i < D; i++) b -= (w[i] * mu[i]) / sd[i]
  return { r2, nmse, lam: best.lam, w: wf, b }
}

const mc: number[] = []
for (let k = 1; k <= 60; k++) mc.push(evalTask(delayed(k)).r2)
const narma = evalTask(narma10(u))
console.error(`memory capacity Σ_{k=1..60} r² = ${mc.reduce((a, v) => a + v, 0).toFixed(2)} (research Exp. 29 noise-free: 35.1)`)
console.error(`NARMA10 test NMSE = ${narma.nmse.toFixed(3)} (research Exp. 29 noise-free: 0.115)`)
console.error('r² by delay: ' + mc.map((v, i) => `${i + 1}:${v.toFixed(3)}`).join(' '))

const tasks: Record<string, unknown>[] = [5, 10, 20, 30].map((k) => {
  const t = evalTask(delayed(k))
  return { id: `recall${k}`, label: `u(t−${k})`, kind: 'recall', delay: k, w: t.w.map((v) => +v.toPrecision(7)), b: +t.b.toPrecision(9), test: { r2: +t.r2.toFixed(4), nmse: +t.nmse.toFixed(4) } }
})
tasks.push({ id: 'narma10', label: 'NARMA10', kind: 'narma10', w: narma.w.map((v) => +v.toPrecision(7)), b: +narma.b.toPrecision(9), test: { r2: +narma.r2.toFixed(4), nmse: +narma.nmse.toFixed(4) } })
const out = {
  note: 'Digital linear readouts on the Exp. 29 noise-free detector features log10(acc + 1). Trained offline by scripts/train-readout.ts (research 15-readout.py protocol: train steps 200–2200, test 2200–3200 of the Exp. 15 uniform input stream).',
  memoryCapacity: +mc.reduce((a, v) => a + v, 0).toFixed(2),
  mcCurve: mc.map((v) => +v.toFixed(4)),
  tasks,
}
writeFileSync(new URL('../src/data/reservoir-readout.json', import.meta.url), JSON.stringify(out) + '\n')
console.error('wrote src/data/reservoir-readout.json')
