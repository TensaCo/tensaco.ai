'use client'
import dynamic from 'next/dynamic'
import s from './Hero.module.css'

const MachineCanvas = dynamic(() => import('../machine/MachineCanvas'), { ssr: false, loading: () => null })

export function Hero() {
  return (
    <header className={s.hero}>
      <div className={s.canvas} aria-hidden="true" style={{ ['--poster' as string]: `url(/og.jpg)` }}><MachineCanvas global /></div>
      <div className={s.claim}>
        <p className={s.brand}>PHASER</p>
        <h1 className={s.h1}>A neural accelerator that runs at the <span className={s.red}>speed of light.</span></h1>
        <p className={s.sub}>
          Designed around parts the telecom and display industries already make by the million. No new fabs, no exotic
          materials, and no new power plants.
        </p>
      </div>
      <a className={s.scroll} href="#light"><span className="label">Why it matters</span><i /></a>
    </header>
  )
}
