'use client'
import { LENGTH } from '@/lib/phaser-sim'
import StackView, { type Annotation } from './StackView'
import s from './HeroMachine.module.css'

const TRIP_SECONDS = 3.2 // one displayed round trip (up and back down the stack)
const TOP = LENGTH * 1e3

const NOTES: Annotation[] = [
  { at: [1.6, TOP + 1.2, 1.6], side: 'right', children: <><b>End mirror</b>concave, R 120 mm</> },
  { at: [0.64, 15, 0.64], side: 'right', children: <><b>Etched phase plates</b>64 × 64 px · 20 µm · 5 mm apart</> },
  { at: [0.4, 12.5, 0.4], side: 'right', children: <><b>Wavefronts in flight</b>each carrying the simulated field</> },
  { at: [1.6, -0.8, 1.6], side: 'right', children: <><b>Input mirror</b>5 % in and out</> },
]

export default function HeroMachine() {
  return (
    <div className={s.stage}>
      <StackView framing="hero" tripSeconds={TRIP_SECONDS} annotations={NOTES} className={s.view} inset={48} />
    </div>
  )
}
