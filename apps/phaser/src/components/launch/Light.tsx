import { Bench } from './Bench'
import { Carriers } from './Carriers'
import { Fn } from './Close'
import s from './Close.module.css'

export function Light() {
  return (
    <section className={`${s.sec} ${s.flush}`} id="light" aria-labelledby="light-h">
      <div className="wrap">
        <p className="eyebrow">01 / The light</p>
        <h2 id="light-h" className={s.h}>
          <span>Intelligence runs on electrons.</span>
          <span className={s.red}>PHASER runs it on light.</span>
        </h2>
        <div className={s.claim}>
          <span className={`num ${s.range}`}>200–3,000×<Fn id="energy" /></span>
          <p>
            <span>less energy per step than an equally capable dense recurrent network, modeled at a million optical modes.</span>
          </p>
        </div>
        <Carriers />
      </div>
      <Bench />
    </section>
  )
}
