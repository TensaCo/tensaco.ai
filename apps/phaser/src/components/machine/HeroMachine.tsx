'use client'
import { LENGTH } from '@/lib/phaser-sim'
import StackView, { type Annotation } from './StackView'
import s from './HeroMachine.module.css'

const TRIP_SECONDS = 3.2 // one displayed round trip (up and back down the stack)
const TOP = LENGTH * 1e3

const NOTES: Annotation[] = [
  { at: [0, TOP + 1.5, 3.2], side: 'right', children: <><b>End mirror</b>concave, R 120 mm, kinematic mount</> },
  { at: [2.5, 15, 2.5], side: 'right', children: <><b>Etched phase plates</b>fused silica · 64 × 64 px · 20 µm</> },
  { at: [0.4, 12.5, 0.4], side: 'right', children: <><b>Wavefronts in flight</b>each carrying the simulated field</> },
  { at: [1.5, 0, 1.5], side: 'right', children: <><b>Gain crystal</b>coated as the input mirror, 5 % in and out</> },
  { at: [3, -16, 3], side: 'right', children: <><b>OV3660 camera → ESP32-S3</b>reads the 5 % tap</> },
]

export default function HeroMachine() {
  return (
    <div className={s.stage}>
      <StackView framing="hero" tripSeconds={TRIP_SECONDS} annotations={NOTES} className={s.view} inset={48} />
    </div>
  )
}
