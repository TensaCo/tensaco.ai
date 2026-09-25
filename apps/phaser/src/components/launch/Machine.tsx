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

const TRIP_SECONDS = 2.4
const TOP = LENGTH * 1e3
const PLATE = 1 // which phase plate the pixel plate shows (0-based)
const PMAX = Math.max(...PLANE_DATA[PLATE].phase)
const EXPOSURE = 1 // |E|² (field units) at 63 % red
const mm = (z: number) => (z * 1e3).toFixed(1)

const NOTES: Annotation[] = [
  { at: [0, TOP + 1.5, 3.2], side: 'right', children: <><b>End mirror</b>Concave, R 120 mm, 99.9 % dielectric coating, in a kinematic mount. Sends the light back down the stack and keeps it from spreading.</> },
  { at: [2.5, PLANE_Z[PLATE] * 1e3, 2.5], side: 'right', children: <><b>2 · Phase plates</b>Four fused-silica plates, 1 mm thick, AR coated. The central 64 × 64 pixels (20 µm) are each etched to their own depth: the program, fixed at fabrication. Crossed twice per round trip.</> },
  { at: [-0.64, (PLANE_Z[1] + PLANE_Z[2]) * 500, 0], side: 'left', children: <><b>3 · Between plates</b>{mm(PLANE_Z[1] - PLANE_Z[0])} mm of air. Diffraction spreads each pixel&apos;s light into its neighbours, so every plate sees a mix of the last.</> },
  { at: [-1.5, 0, 1.5], side: 'left', children: <><b>1 · Input</b>The gain crystal&apos;s top face is the input mirror: u(t) sets the brightness of a fixed light pattern let in through it (5 %) every round trip, and the crystal replaces what each trip loses.</> },
  { at: [-3, -16, 3], side: 'left', children: <><b>4 · Camera</b>5 % of the returning light leaks through that coating onto an OV3660 camera module, read out over its flex cable by an ESP32-S3.</> },
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
              <span>The cavity at true scale: {(N * DX * 1e3).toFixed(2)} mm wide, {TOP} mm between the mirrors. Each wavefront carries the simulated intensity |E|² at its plane.<Fn id="figure" /></span>
              <span className={s.live}>round trip <i ref={(el) => { txt.current.trip = el }}>000000</i></span>
            </figcaption>
          </figure>
          <figure className={s.fig}>
            <canvas ref={plate} className={s.slm} aria-label="One phase plate's 64 by 64 pixels with the light crossing them" />
            <figcaption><span>Phase plate 2, all 64 × 64 pixels. Graphite: its etched phase program. Red: the light crossing it this round trip, up and back.</span></figcaption>
          </figure>
        </div>

        <div className={s.metrics}>
          <div className={s.metric}><span className="num">{(TRIP_TIME * 1e9).toFixed(2)}<small>ns</small><Fn id="machine" /></span><p>per input step: one round trip up the stack and back, glass included.</p></div>
          <div className={s.metric}><span className="num">10<small>B</small><Fn id="steps" /></span><p>input steps per second, modeled: this stack gets there with about 3 light pulses in flight at once, sharing one optical program (a ring needs 13). 3.9 billion per stream without them.</p></div>
          <div className={s.metric}><span className="num">{Math.round((VALID.passiveRetention as number) * 100)}<small>%</small><Fn id="loss" /></span><p>of the light kept each round trip, modeled. The gain replaces the rest every trip.</p></div>
        </div>

        <p className={s.note}>
          Live simulation in your browser of the research&apos;s linear stack of fabricated phase plates (TensaCo/phaser-design,
          Exps. 30 and 33): a scalar field on a {N} × {N} grid at 20 µm, angular-spectrum propagation between thin elements and
          glass slabs, gain clamped just above threshold, one round trip per input. The browser port matches the research simulator
          {VALID.maxFieldRelL2 === 0 ? ' to the last bit' : ` to a relative error of ${VALID.maxFieldRelL2.toExponential(0)}`} over {VALID.trips.toLocaleString('en-US')} round trips.
        </p>
      </div>
    </section>
  )
}
