'use client'
import { useRef } from 'react'
import { K_TRIPS, LENGTH, TRIP_TIME } from '@/lib/phaser-sim'
import StackView, { type Annotation } from './StackView'
import type { StackStatus } from './StackScene'
import s from './HeroMachine.module.css'

const TRIP_SECONDS = 3.2 // one displayed round trip (up and back down the stack)
const TOP = LENGTH * 1e3

export const sci = (x: number) => {
  const e = Math.floor(Math.log10(x))
  return `${(x / 10 ** e).toFixed(1)} × 10${String(e).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c] ?? c).join('')}`
}

const NOTES: Annotation[] = [
  { at: [2.9, TOP + 1.2, 2.9], side: 'right', children: <><b>End mirror</b>concave, R 400 mm</> },
  { at: [2.03, 14.4, 2.03], side: 'right', children: <><b>4 LCD phase planes</b>64 × 64 px · 63.5 µm</> },
  { at: [2.9, -0.8, 2.9], side: 'right', children: <><b>Input mirror</b>8 % in and out</> },
]

export default function HeroMachine() {
  const hud = useRef<Record<'trip' | 'step' | 'u' | 'k', HTMLElement | null>>({ trip: null, step: null, u: null, k: null })
  const onStatus = (st: StackStatus) => {
    const h = hud.current
    if (h.trip) h.trip.textContent = String(st.trip).padStart(6, '0')
    if (h.step) h.step.textContent = String(st.step).padStart(4, '0')
    if (h.u) h.u.textContent = st.u.toFixed(3)
    if (h.k) h.k.textContent = `${st.tripInStep}/${K_TRIPS}`
  }
  return (
    <div className={s.stage}>
      <StackView framing="hero" tripSeconds={TRIP_SECONDS} annotations={NOTES} onStatus={onStatus} className={s.view} inset={48} />
      <dl className={s.plate} aria-label="Live simulation status">
        <div><dt>Fig. 1</dt><dd>Live simulation · research model</dd></div>
        <div><dt>λ</dt><dd>650 nm</dd></div>
        <div><dt>Trip</dt><dd><b ref={(el) => { hud.current.trip = el }}>000000</b></dd></div>
        <div><dt>Input</dt><dd><b ref={(el) => { hud.current.step = el }}>0000</b> · u = <b ref={(el) => { hud.current.u = el }}>0.000</b> · trip <b ref={(el) => { hud.current.k = el }}>0/10</b></dd></div>
        <div><dt>Time</dt><dd>{(TRIP_TIME * 1e9).toFixed(2)} ns per round trip, shown {sci(TRIP_SECONDS / TRIP_TIME)}× slower</dd></div>
      </dl>
    </div>
  )
}
