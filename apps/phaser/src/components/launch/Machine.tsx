'use client'
import dynamic from 'next/dynamic'
import { useMemo, useRef } from 'react'
import VALID from '@/data/sim-validation.json'
import { DX, K_TRIPS, LENGTH, N, PLANE_DATA, PLANE_Z, TRIP_TIME } from '@/lib/phaser-sim'
import { LiveStack } from '@/lib/live'
import type { Annotation } from '../machine/StackView'
import type { StackStatus } from '../machine/StackScene'
import { exposure, redOver } from './plates'
import { Fn } from './Close'
import s from './Machine.module.css'

const StackView = dynamic(() => import('../machine/StackView'), { ssr: false, loading: () => null })

const REPO = 'https://github.com/TensaCo/phaser-design'
const TRIP_SECONDS = 2.4
const TOP = LENGTH * 1e3
const PLATE = 1 // which phase plate Fig. 3 shows (0-based)
const PMAX = Math.max(...PLANE_DATA[PLATE].phase)
const EXPOSURE = 1 // |E|² (field units) at 63 % red
const mm = (z: number) => (z * 1e3).toFixed(1)

const NOTES: Annotation[] = [
  { at: [-1.6, TOP + 1.2, -1.6], side: 'right', children: <><b>End mirror</b>Concave, R 120 mm, 99.9 % reflective. Sends the light back down the stack and keeps it from spreading. A programmable reflective SLM can take its place.</> },
  { at: [0.64, PLANE_Z[PLATE] * 1e3, 0.64], side: 'right', children: <><b>2 · Phase plates</b>Four fused-silica plates, 64 × 64 pixels at 20 µm, each pixel etched to its own depth: the program, fixed at fabrication. Crossed twice per round trip.</> },
  { at: [-0.64, (PLANE_Z[1] + PLANE_Z[2]) * 500, 0], side: 'left', children: <><b>3 · Between plates</b>{mm(PLANE_Z[1] - PLANE_Z[0])} mm of air. Diffraction spreads each pixel&apos;s light into its neighbours, so every plate sees a mix of the last.</> },
  { at: [-1.6, -0.8, -1.6], side: 'left', children: <><b>1 · Input</b>u(t) sets the brightness of a fixed light pattern, let in through the coupler (5 %) every round trip. The gain crystal here replaces what each trip loses.</> },
  { at: [-1.1, -6, 1.1], side: 'left', children: <><b>4 · Detector</b>5 % of the returning light leaks out through the coupler every round trip onto a camera.</> },
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
    // one phase plate at 8 screen px per pixel (1 field sample per pixel): graphite etched phase, red light
    const cell = 8, W = N * cell
    if (c.width !== W) { c.width = W; c.height = W }
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(N, N)
    const ph = PLANE_DATA[PLATE].phase, I = live.planeI[PLATE]
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i
      const [r, g, b] = redOver(exposure(I[k], EXPOSURE), ph[k] / PMAX)
      img.data[4 * k] = r; img.data[4 * k + 1] = g; img.data[4 * k + 2] = b; img.data[4 * k + 3] = 255
    }
    const off = document.createElement('canvas'); off.width = off.height = N
    off.getContext('2d')!.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, 0, 0, W, W)
  }

  return (
    <section className={s.sec} id="machine" aria-labelledby="machine-h">
      <div className="wrap">
        <p className="eyebrow">02 / The machine</p>
        <h2 id="machine-h" className={s.h}>Watch the light compute.</h2>
        <p className={s.lede}>
          This is not an animation. It is our research simulator running in your browser, modelling red light bouncing
          between two mirrors through a stack of four etched glass phase plates. Each plate&apos;s pixels are the program; every
          pass transforms the whole light field at once, and the light makes about four billion round trips a second.
        </p>

        <div className={s.row}>
          <figure className={s.fig}>
            <div className={s.stack}>
              <StackView framing="section" tripSeconds={TRIP_SECONDS} annotations={NOTES} onStatus={onStatus} live={live} />
            </div>
            <figcaption>
              <b>Fig. 2</b> The cavity at true scale: {(N * DX * 1e3).toFixed(2)} mm wide, {TOP} mm between the mirrors. Each wavefront carries the simulated intensity |E|² at its plane.<Fn id="figure" />
              <span className={s.live}>trip <i ref={(el) => { txt.current.trip = el }}>000000</i> · input <i ref={(el) => { txt.current.step = el }}>0000</i> · u = <i ref={(el) => { txt.current.u = el }}>0.000</i> · <i ref={(el) => { txt.current.k = el }}>0/10</i></span>
            </figcaption>
          </figure>
          <figure className={s.fig}>
            <canvas ref={plate} className={s.slm} aria-label="One phase plate's 64 by 64 pixels with the light crossing them" />
            <figcaption><b>Fig. 3</b> Phase plate 2, all 64 × 64 pixels. Graphite: its etched phase program. Red: the light crossing it this round trip, up and back.</figcaption>
          </figure>
        </div>

        <div className={s.metrics}>
          <div className={s.metric}><span className="num">{(TRIP_TIME * 1e9).toFixed(2)}<small>ns</small><Fn id="machine" /></span><p>per input step: one round trip up the stack and back, glass included.</p></div>
          <div className={s.metric}><span className="num">10<small>B</small><Fn id="steps" /></span><p>input steps per second, modeled, with 13 light pulses in flight sharing one optical program. 0.75–4 billion per stream without them.</p></div>
          <div className={s.metric}><span className="num">{Math.round((VALID.passiveRetention as number) * 100)}<small>%</small><Fn id="loss" /></span><p>of the light kept each round trip, modeled. The gain replaces the rest every trip.</p></div>
        </div>

        <p className={s.note}>
          Live simulation in your browser of the research&apos;s linear stack of fabricated phase plates (TensaCo/phaser-design,
          Exps. 30 and 33): a scalar field on a {N} × {N} grid at 20 µm, angular-spectrum propagation between thin elements and
          glass slabs, gain clamped just above threshold, one round trip per input. The browser port matches the research simulator
          {VALID.maxFieldRelL2 === 0 ? ' to the last bit' : ` to a relative error of ${VALID.maxFieldRelL2.toExponential(0)}`} over {VALID.trips.toLocaleString('en-US')} round trips.
        </p>
      </div>
      <div className={s.bench}>
        <video className={s.benchVideo} src="/video/broll/lab-oscilloscope.mp4" poster="/video/broll/lab-oscilloscope.jpg" autoPlay muted loop playsInline aria-hidden="true" />
        <div className={`wrap ${s.benchBody}`}>
          <div className={s.close}>
          <p className={s.body}>
            Pushing charge through a wire costs energy every time. Light crossing glass barely loses any: it interferes with itself on
            the way through, and that interference is the arithmetic. It still loses 10–30 % per round trip to mirrors and coatings,
            and PHASER pays to put that back.
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
