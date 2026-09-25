'use client'
import { LENGTH } from '@/lib/phaser-sim'
import StackView, { type Annotation } from './StackView'
import s from './HeroMachine.module.css'

const TRIP_SECONDS = 3.2 // one displayed round trip (up and back down the stack)
const TOP = LENGTH * 1e3

const NOTES: Annotation[] = [
  { at: [2.9, TOP + 1.2, 2.9], side: 'right', children: <><b>End mirror</b>concave, R 400 mm</> },
  { at: [2.03, 14.4, 2.03], side: 'right', children: <><b>4 LCD phase planes</b>64 × 64 px · 63.5 µm</> },
  { at: [2.9, -0.8, 2.9], side: 'right', children: <><b>Input mirror</b>8 % in and out</> },
]

export default function HeroMachine() {
  return (
    <div className={s.stage}>
      <StackView framing="hero" tripSeconds={TRIP_SECONDS} annotations={NOTES} className={s.view} inset={48} />
    </div>
  )
}
