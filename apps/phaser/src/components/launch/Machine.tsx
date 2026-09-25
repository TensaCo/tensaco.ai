'use client'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import READOUT from '@/data/reservoir-readout.json'
import VALID from '@/data/sim-validation.json'
import { K_TRIPS, N, SLM_PHASE, TRIP_TIME, readout } from '@/lib/phaser-sim'
import { LiveRing } from '@/lib/live'
import type { RingOverviewHandle } from '../machine/RingOverview'
import { drawGrid, exposure, red, redOver } from './plates'
import s from './Machine.module.css'

const RingOverview = dynamic(() => import('../machine/RingOverview'), { ssr: false, loading: () => null })

const REPO = 'https://github.com/TensaCo/phaser-design'
type Task = { id: string; label: string; kind: 'recall' | 'narma10'; delay?: number; w: number[]; b: number; test: { r2: number; nmse: number } }
const TASKS = READOUT.tasks as Task[]
const TRIPS_PER_SECOND = 25 // display pace: 2.5 inputs per second
const WARM = 200 // input steps run before the first frame (the ring's memory is ~40 inputs)
const PMAX = Math.max(...SLM_PHASE)
const SLOWDOWN = 1 / TRIPS_PER_SECOND / TRIP_TIME
const sup = (n: number) => String(n).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c] ?? c).join('')
const sci = (x: number) => { const e = Math.floor(Math.log10(x)); return `${(x / 10 ** e).toFixed(1)} × 10${sup(e)}` }
const FEAT = (x: number) => Math.log10(x + 1) // the readout's fixed feature transform (Exp. 29)

/** history of the live run: inputs and the detector's features per completed input step */
interface Hist { u: number[]; pred: Record<string, number[]>; narma: number[] }

function narmaNext(h: Hist) {
  // y[t+1] = 0.3 y[t] + 0.05 y[t] Σ_{k=0..9} y[t−k] + 1.5 u[t−9] u[t] + 0.1, aligned as research 15-readout.py
  const y = h.narma, u = h.u, t = u.length - 1
  if (t < 9) { y.push(0); return }
  let sum = 0
  for (let k = t - 9; k <= t; k++) sum += y[k] ?? 0
  const prev = y[t] ?? 0
  y.push(0.3 * prev + 0.05 * prev * sum + 1.5 * u[t - 9] * u[t] + 0.1)
}

export function MachineSection() {
  const [task, setTask] = useState('recall10')
  const taskRef = useRef(task)
  taskRef.current = task
  const live = useMemo(() => new LiveRing(20260925), [])
  const hist = useRef<Hist>({ u: [], pred: Object.fromEntries(TASKS.map((t) => [t.id, []])), narma: [0] })
  const ring = useRef<RingOverviewHandle>(null)
  const cv = useRef<Record<'slm' | 'input' | 'onslm' | 'relay' | 'det' | 'strip' | 'trace', HTMLCanvasElement | null>>({ slm: null, input: null, onslm: null, relay: null, det: null, strip: null, trace: null })
  const txt = useRef<Record<'trip' | 'step' | 'u' | 'r2' | 'k', HTMLElement | null>>({ trip: null, step: null, u: null, r2: null, k: null })
  const root = useRef<HTMLElement>(null)
  const redraw = useRef<() => void>(() => {})

  useEffect(() => {
    const h = hist.current
    live.onStep = (u, f) => {
      h.u.push(u)
      narmaNext(h)
      for (const t of TASKS) h.pred[t.id].push(readout(f, t))
      // the readout's target for step t is aligned with the input injected at step t (features after its K trips)
    }
    let raf = 0, alive = true, visible = false, started = false, acc = 0, last = performance.now(), sinceRing = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

    const draw = (full: boolean) => {
      const c = cv.current, r = live.res
      if (full && c.slm) drawGrid(c.slm, N, 8, (i) => redOver(exposure(live.slmI[i], 0.1), SLM_PHASE[i] / PMAX), 0.28)
      const first = r.tripInStep === 1
      if (c.input) { drawGrid(c.input, N, 3, (i) => red(exposure(live.inputI[i], 0.02))); c.input.style.opacity = first ? '1' : '0.3' }
      if (c.onslm) drawGrid(c.onslm, N, 3, (i) => red(exposure(live.slmI[i], 0.1)))
      if (c.relay) drawGrid(c.relay, N, 3, (i) => red(exposure(live.relayI[i], 0.25)))
      if (c.det) drawGrid(c.det, 16, 12, (i) => red(Math.min(1, FEAT(r.acc[i]) / 1.7)), 0.5)
      drawStrip(); drawTrace()
      const t = txt.current
      if (t.trip) t.trip.textContent = String(r.trip).padStart(7, '0')
      if (t.step) t.step.textContent = String(live.step).padStart(5, '0')
      if (t.u) t.u.textContent = r.u.toFixed(3)
      if (t.k) t.k.textContent = `${r.tripInStep}/${K_TRIPS}`
    }

    const drawStrip = () => {
      const c = cv.current.strip
      if (!c) return
      const W = c.clientWidth, H = c.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
      const ctx = c.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const tk = TASKS.find((t) => t.id === taskRef.current)!
      const bw = W / 256, top = H * 0.62
      // light: the detector's 256 bins (integrated so far this input step)
      ctx.fillStyle = '#ff2a12'
      for (let b = 0; b < 256; b++) {
        const v = Math.min(1, FEAT(live.res.acc[b]) / 1.7)
        ctx.fillRect(b * bw, top - v * (top - 6), Math.max(1, bw - 0.6), v * (top - 6))
      }
      // digital: the readout's 256 weights (sign and size), graphite
      let wmax = 0
      for (const w of tk.w) wmax = Math.max(wmax, Math.abs(w))
      ctx.fillStyle = 'rgba(233,229,220,0.45)'
      const mid = H * 0.82
      for (let b = 0; b < 256; b++) {
        const v = (tk.w[b] / wmax) * (H * 0.16)
        ctx.fillRect(b * bw, v > 0 ? mid - v : mid, Math.max(1, bw - 0.6), Math.max(0.6, Math.abs(v)))
      }
      ctx.fillStyle = 'rgba(233,229,220,0.14)'
      ctx.fillRect(0, top + 0.5, W, 1)
    }

    const drawTrace = () => {
      const c = cv.current.trace
      if (!c) return
      const W = c.clientWidth, H = c.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
      const ctx = c.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const tk = TASKS.find((t) => t.id === taskRef.current)!
      const n = h.u.length
      const SHOW = W < 640 ? 36 : 72 // input steps on the trace
      if (n < SHOW + 60) return
      const i0 = n - SHOW
      const x = (i: number) => ((i - i0 + 0.5) / SHOW) * W
      const target = (i: number) => (tk.kind === 'recall' ? h.u[i - tk.delay!] : h.narma[i])
      const lo = tk.kind === 'recall' ? -0.05 : 0.1, hi = tk.kind === 'recall' ? 0.55 : 0.75
      // lanes: input stream on top, target vs prediction below
      const inTop = 8, inH = H * 0.2, outTop = H * 0.34, outH = H * 0.6
      const yIn = (v: number) => inTop + inH - (v / 0.5) * inH
      const yOut = (v: number) => outTop + outH - ((v - lo) / (hi - lo)) * outH
      ctx.strokeStyle = 'rgba(233,229,220,0.10)'; ctx.lineWidth = 1
      for (const g of [0, 0.25, 0.5].filter((g) => tk.kind === 'recall' || g > 0)) { ctx.beginPath(); ctx.moveTo(0, Math.round(yOut(tk.kind === 'recall' ? g : 0.2 + g)) + 0.5); ctx.lineTo(W, Math.round(yOut(tk.kind === 'recall' ? g : 0.2 + g)) + 0.5); ctx.stroke() }
      // input stems (graphite)
      ctx.strokeStyle = 'rgba(138,133,124,0.9)'
      for (let i = i0; i < n; i++) { ctx.beginPath(); ctx.moveTo(x(i), yIn(0)); ctx.lineTo(x(i), yIn(h.u[i])); ctx.stroke() }
      if (tk.kind === 'recall') {
        // bracket: the input that the latest output recalls
        const a = x(n - 1 - tk.delay!), b = x(n - 1)
        ctx.strokeStyle = 'rgba(233,229,220,0.55)'
        ctx.beginPath(); ctx.moveTo(a, yIn(h.u[n - 1 - tk.delay!]) - 4); ctx.lineTo(a, inTop - 2); ctx.lineTo(b, inTop - 2); ctx.lineTo(b, outTop - 6); ctx.stroke()
        ctx.fillStyle = 'rgba(233,229,220,0.9)'
        ctx.beginPath(); ctx.arc(a, yIn(h.u[n - 1 - tk.delay!]), 2.5, 0, Math.PI * 2); ctx.fill()
      }
      // target (graphite steps) and the readout's prediction (paper line + dots)
      ctx.strokeStyle = 'rgba(138,133,124,1)'; ctx.lineWidth = 1.25
      ctx.beginPath()
      for (let i = i0; i < n; i++) { const X = x(i) - W / SHOW / 2, Y = yOut(target(i)); if (i === i0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); ctx.lineTo(X + W / SHOW, Y) }
      ctx.stroke()
      ctx.strokeStyle = 'rgba(236,232,223,0.85)'; ctx.lineWidth = 1.25
      ctx.beginPath()
      const p = h.pred[tk.id]
      for (let i = i0; i < n; i++) { const Y = yOut(p[i]); if (i === i0) ctx.moveTo(x(i), Y); else ctx.lineTo(x(i), Y) }
      ctx.stroke()
      ctx.fillStyle = '#ece8df'
      for (let i = i0; i < n; i++) { ctx.beginPath(); ctx.arc(x(i), yOut(p[i]), 2, 0, Math.PI * 2); ctx.fill() }
      // live score over the last 200 steps
      const m = Math.min(200, n - 60), a: number[] = [], b: number[] = []
      for (let i = n - m; i < n; i++) { a.push(p[i]); b.push(target(i)) }
      const mean = (v: number[]) => v.reduce((q, w) => q + w, 0) / v.length
      const ma = mean(a), mb = mean(b)
      let sab = 0, saa = 0, sbb = 0, se = 0
      for (let i = 0; i < a.length; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; se += (a[i] - b[i]) ** 2 }
      if (txt.current.r2) txt.current.r2.textContent = tk.kind === 'recall' ? `r² ${(sab * sab / (saa * sbb)).toFixed(2)}` : `NMSE ${(se / sbb).toFixed(2)}`
    }
    redraw.current = () => draw(false)

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!visible || document.hidden) return
      acc += dt * TRIPS_PER_SECOND
      let n = 0
      while (acc >= 1 && n < 3) { live.trip(); acc -= 1; n++; sinceRing++ }
      if (n) {
        draw(true)
        // the 3-D ring recomputes its 50 cross-sections every fourth trip
        if (sinceRing >= 4) { ring.current?.refresh(); sinceRing = 0 }
      }
    }
    const start = () => {
      if (started) return
      started = true
      // warm the ring up in slices so the page stays responsive
      let done = 0
      const chunk = () => {
        if (!alive) return
        const k = Math.min(20, WARM - done)
        live.warm(k); done += k
        if (done < WARM) { setTimeout(chunk, 0); return }
        draw(true); ring.current?.refresh()
        if (!reduced) raf = requestAnimationFrame(tick)
      }
      chunk()
    }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start() }, { rootMargin: '400px 0px' })
    if (root.current) io.observe(root.current)
    const onResize = () => { drawStrip(); drawTrace() }
    window.addEventListener('resize', onResize)
    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', onResize) }
  }, [live])

  useEffect(() => { redraw.current() }, [task])

  const tk = TASKS.find((t) => t.id === task)!
  const recall10 = TASKS.find((t) => t.id === 'recall10')!
  const setCv = (k: keyof typeof cv.current) => (el: HTMLCanvasElement | null) => { cv.current[k] = el }
  const worst = Math.max(...VALID.checkpoints.map((c) => c.field), VALID.featuresMaxRelL2.vsLiveResearch)

  return (
    <section className={s.sec} id="machine" aria-labelledby="machine-h" ref={root}>
      <div className="wrap">
        <p className="eyebrow">02 / The machine</p>
        <h2 id="machine-h" className={s.h}>Watch the light compute.</h2>
        <p className={s.lede}>
          This is not an animation. It is the research simulation of the machine, running in your browser: red light circulating
          a 20 cm ring through a 64 × 64-pixel modulator. Each number you feed it rides the light for ten laps and mixes with
          what came before. A detector reads 256 values; a simple digital readout turns them into an answer.
        </p>

        <div className={s.row}>
          <figure className={s.fig}>
            <div className={s.ring}><RingOverview ref={ring} live={live} /></div>
            <figcaption><b>Fig. 2</b> The ring at true scale: 20 × 80 mm, a 1.3 mm beam. Each cross-section is the simulated |E|² at that point, every 4 mm.</figcaption>
          </figure>
          <figure className={s.fig}>
            <canvas ref={setCv('slm')} className={s.slm} aria-label="The SLM's 64 by 64 pixels with the light landing on them" />
            <figcaption><b>Fig. 3</b> The modulator (LCOS SLM), all 64 × 64 pixels. Graphite: its fixed phase program. Red: the light landing on it this lap.</figcaption>
          </figure>
        </div>

        <div className={s.trip} aria-label="One lap of the ring">
          <p className={s.tripHead}><span className="label">One input, ten laps</span><span className="label">input <b ref={(el) => { txt.current.step = el }}>00000</b> · u = <b ref={(el) => { txt.current.u = el }}>0.000</b> · lap <b ref={(el) => { txt.current.k = el }}>0/10</b> · trip <b ref={(el) => { txt.current.trip = el }}>0000000</b></span></p>
          <ol className={s.planes}>
            <li><canvas ref={setCv('input')} /><span><b>1</b> Input. u(t) sets the brightness of a fixed light pattern, injected once per input.</span></li>
            <li><canvas ref={setCv('onslm')} /><span><b>2</b> On the modulator. Its pixels shift the light's phase.</span></li>
            <li><canvas ref={setCv('relay')} /><span><b>3</b> After 100 mm and a lens. Diffraction has mixed every pixel with its neighbours.</span></li>
            <li><canvas ref={setCv('det')} /><span><b>4</b> Detector. 5 % of the light, summed into 16 × 16 bins over the ten laps.</span></li>
          </ol>
        </div>

        <div className={s.compute}>
          <figure className={s.fig}>
            <canvas ref={setCv('strip')} className={s.strip} aria-label="Detector bins and readout weights" />
            <figcaption><span><span className={s.key} data-k="red" /> 256 detector bins (light)</span><span><span className={s.key} data-k="w" /> × 256 readout weights (digital, trained offline)</span></figcaption>
          </figure>
          <figure className={s.fig}>
            <div className={s.traceHead}>
              <div className={s.tasks} role="tablist" aria-label="Task">
                {TASKS.map((t) => (
                  <button key={t.id} role="tab" aria-selected={t.id === task} onClick={() => setTask(t.id)}>
                    {t.kind === 'recall' ? `${t.delay} back` : 'NARMA10'}
                  </button>
                ))}
              </div>
              <span className="label"><b ref={(el) => { txt.current.r2 = el }}>—</b> live · {tk.kind === 'recall' ? `r² ${tk.test.r2.toFixed(2)}` : `NMSE ${tk.test.nmse.toFixed(2)}`} held-out test</span>
            </div>
            <canvas ref={setCv('trace')} className={s.trace} aria-label="Input stream, target and the readout's prediction" />
            <figcaption className={s.traceCap}>
              {tk.kind === 'recall'
                ? <>Top: the inputs going in. Below: the task, <b>recall the input from {tk.delay} steps ago</b> ({tk.delay! * K_TRIPS} laps, {(tk.delay! * K_TRIPS * TRIP_TIME * 1e9).toFixed(0)} ns earlier). Graphite: the right answer. White: the readout&apos;s answer from the light.</>
                : <>NARMA10, the standard nonlinear memory benchmark: a target built from products of inputs up to ten steps back. Graphite: the right answer. White: the readout&apos;s answer from the light.</>}
            </figcaption>
          </figure>
        </div>

        <div className={s.metrics}>
          <div className={s.metric}><span className="num">6.7<small>ns</small></span><p>per input: ten laps of a 20 cm ring at 0.667 ns each.</p></div>
          <div className={s.metric}><span className="num">150<small>M/s</small></span><p>inputs per second from one ring, with no memory traffic.</p></div>
          <div className={s.metric}><span className="num">{recall10.test.r2.toFixed(2)}<small>r²</small></span><p>recalling the input from ten steps back, on inputs the readout never saw.</p></div>
        </div>

        <dl className={s.spec}>
          <div><dt>λ</dt><dd>650 nm</dd></div>
          <div><dt>SLM</dt><dd>LCOS 64 × 64 · 20 µm · 256 levels</dd></div>
          <div><dt>Lap</dt><dd>200 mm · 0.667 ns</dd></div>
          <div><dt>Per input</dt><dd>K = 10 laps · 6.7 ns</dd></div>
          <div><dt>Detector</dt><dd>5 % tap · 256 bins</dd></div>
          <div><dt>Readout</dt><dd>linear, 257 weights, digital</dd></div>
          <div><dt>Shown</dt><dd>{sci(SLOWDOWN)}× slower</dd></div>
        </dl>
        <p className={s.note}>
          Live simulation in your browser of the research model (TensaCo/phaser-design, Experiments 15 and 29: scalar field on a
          64 × 64 grid, angular-spectrum propagation, the preset SLM ring with its gain clamped). The port matches the research
          simulator to {worst === 0 ? 'the last bit' : `a relative error of ${worst.toExponential(0)}`} over {VALID.trips.toLocaleString('en-US')} laps.
          The readout is a digital linear layer trained offline; memory capacity {READOUT.memoryCapacity.toFixed(0)} inputs, NARMA10 NMSE {TASKS.find((t) => t.id === 'narma10')!.test.nmse.toFixed(2)}.
          No energy saving is claimed for this demo: at this size the research finds it at parity with a digital reservoir of equal
          quality (Exp. 29). What the light adds here is speed.
        </p>
      </div>
      <div className={s.bench}>
        <video className={s.benchVideo} src="/video/broll/lab-oscilloscope.mp4" poster="/video/broll/lab-oscilloscope.jpg" autoPlay muted loop playsInline aria-hidden="true" />
        <div className={`wrap ${s.benchBody}`}>
          <div className={s.close}>
          <p className={s.body}>
            Pushing charge through a wire costs energy every time. Light passing through glass doesn’t: it interferes with itself on the
            way through, and that interference is the arithmetic. PHASER only pays to keep the light going.
          </p>
          <div className={s.cta}>
            <a href={`${REPO}/blob/main/research/2026-09-14/REPORT.md`}>Read the research <span>↗</span></a>
            <a href={`${REPO}/tree/main/research/2026-09-14/out/29`}>See the energy model <span>↗</span></a>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
