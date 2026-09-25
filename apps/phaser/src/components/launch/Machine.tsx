'use client'
import dynamic from 'next/dynamic'
import { useMemo, useRef } from 'react'
import VALID from '@/data/sim-validation.json'
import { K_TRIPS, LENGTH, N, PLANE_DATA, PLANE_Z, ROUTE_LENGTH, TRIP_TIME } from '@/lib/phaser-sim'
import { LiveStack } from '@/lib/live'
import type { Annotation } from '../machine/StackView'
import type { StackStatus } from '../machine/StackScene'
import { exposure, redOver } from './plates'
import s from './Machine.module.css'

const StackView = dynamic(() => import('../machine/StackView'), { ssr: false, loading: () => null })

const REPO = 'https://github.com/TensaCo/phaser-design'
const TRIP_SECONDS = 2.4
const TOP = LENGTH * 1e3
const PLATE = 1 // which LCD plane Fig. 3 shows (0-based)
const PMAX = Math.max(...PLANE_DATA[PLATE].phase)
const mm = (z: number) => (z * 1e3).toFixed(1)

const NOTES: Annotation[] = [
  { at: [-2.9, TOP + 1.2, -2.9], side: 'right', children: <><b>End mirror</b>Concave, R 400 mm, 97 % reflective. Sends the light back down the stack and keeps it from spreading.</> },
  { at: [2.03, PLANE_Z[PLATE] * 1e3, 2.03], side: 'right', children: <><b>2 · Phase planes</b>Four LCDs, 64 × 64 pixels at 63.5 µm. Each pixel delays the light by its programmed phase (up to 1.8π, 256 levels). Crossed twice per round trip.</> },
  { at: [-2.03, 12, 0], side: 'left', children: <><b>3 · Between planes</b>{mm(PLANE_Z[0])} mm of air. Diffraction spreads each pixel&apos;s light into its neighbours, so every plane sees a mix of the last.</> },
  { at: [-2.9, -0.8, -2.9], side: 'left', children: <><b>1 · Input</b>u(t) sets the brightness of a fixed light pattern, let in through the input mirror (8 %) once every {K_TRIPS} round trips. Gain here replaces what each trip loses.</> },
  { at: [-2.4, -7, 2.4], side: 'left', children: <><b>4 · Detector</b>8 % of the returning light leaks out through the input mirror every round trip onto a camera.</> },
]

export function MachineSection() {
  const live = useMemo(() => new LiveStack(20260925), [])
  const plate = useRef<HTMLCanvasElement>(null)
  const txt = useRef<Record<'trip' | 'step' | 'u' | 'k', HTMLElement | null>>({ trip: null, step: null, u: null, k: null })

  const onStatus = (st: StackStatus) => {
    const t = txt.current
    if (t.trip) t.trip.textContent = String(st.trip).padStart(6, '0')
    if (t.step) t.step.textContent = String(st.step).padStart(4, '0')
    if (t.u) t.u.textContent = st.u.toFixed(3)
    if (t.k) t.k.textContent = `${st.tripInStep}/${K_TRIPS}`
    const c = plate.current
    if (!c) return
    // one LCD plane at 4 screen px per field sample (2 samples per pixel): graphite phase per pixel, red light per sample
    const cell = 4, W = N * cell
    if (c.width !== W) { c.width = W; c.height = W }
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(N, N)
    const ph = PLANE_DATA[PLATE].phase, I = live.planeI[PLATE]
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i
      const [r, g, b] = redOver(exposure(I[k], 7), ph[(j >> 1) * 64 + (i >> 1)] / PMAX)
      img.data[4 * k] = r; img.data[4 * k + 1] = g; img.data[4 * k + 2] = b; img.data[4 * k + 3] = 255
    }
    const off = document.createElement('canvas'); off.width = off.height = N
    off.getContext('2d')!.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, 0, 0, W, W)
    // the LCD's black matrix: 7.8 % of each 8-px pixel ≈ 0.6 of a 1-px line
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    for (let k = 1; k <= 64; k++) { ctx.fillRect(k * 2 * cell - 1, 0, 1, W); ctx.fillRect(0, k * 2 * cell - 1, W, 1) }
  }

  return (
    <section className={s.sec} id="machine" aria-labelledby="machine-h">
      <div className="wrap">
        <p className="eyebrow">02 / The machine</p>
        <h2 id="machine-h" className={s.h}>Watch the light compute.</h2>
        <p className={s.lede}>
          This is not an animation. It is our research simulator running in your browser, modelling red light bouncing
          between two mirrors through a stack of four pixelated modulators. Every pass through a plane is programmed arithmetic
          on the whole light field at once, and the light makes six billion round trips a second.
        </p>

        <div className={s.row}>
          <figure className={s.fig}>
            <div className={s.stack}>
              <StackView framing="section" tripSeconds={TRIP_SECONDS} annotations={NOTES} onStatus={onStatus} live={live} />
            </div>
            <figcaption>
              <b>Fig. 2</b> The cavity at true scale: 4 mm wide, {TOP} mm between the mirrors. Each wavefront carries the simulated intensity |E|² at its plane.
              <span className={s.live}>trip <i ref={(el) => { txt.current.trip = el }}>000000</i> · input <i ref={(el) => { txt.current.step = el }}>0000</i> · u = <i ref={(el) => { txt.current.u = el }}>0.000</i> · <i ref={(el) => { txt.current.k = el }}>0/10</i></span>
            </figcaption>
          </figure>
          <figure className={s.fig}>
            <canvas ref={plate} className={s.slm} aria-label="One LCD plane's 64 by 64 pixels with the light landing on them" />
            <figcaption><b>Fig. 3</b> Phase plane 2, all 64 × 64 pixels. Graphite: its fixed phase program. Red: the light crossing it this round trip, up and back.</figcaption>
          </figure>
        </div>

        <div className={s.metrics}>
          <div className={s.metric}><span className="num">{(TRIP_TIME * 1e9).toFixed(2)}<small>ns</small></span><p>per round trip: {(ROUTE_LENGTH * 1e3).toFixed(0)} mm up the stack and back.</p></div>
          <div className={s.metric}><span className="num">10<small>B</small></span><p>steps per second from one stack: 67 wavefronts in flight, 10 ps apart, 100 GHz in and out.</p></div>
          <div className={s.metric}><span className="num">16,384</span><p>programmable pixels on the light&apos;s path, each crossed twice per round trip.</p></div>
        </div>

        <p className={s.note}>
          Live simulation in your browser of a linear-stack cavity built with the research simulator (TensaCo/phaser-design): a
          scalar field on a {N} × {N} grid at 31.75 µm, angular-spectrum propagation between thin elements, the research&apos;s
          LCD, coupler and mirror parameters, gain clamped. The browser port matches the research simulator
          {VALID.maxFieldRelL2 === 0 ? ' to the last bit' : ` to a relative error of ${VALID.maxFieldRelL2.toExponential(0)}`} over {VALID.trips.toLocaleString('en-US')} round trips.
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
