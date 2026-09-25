import s from './Bench.module.css'

const REPO = 'https://github.com/TensaCo/phaser-design'

/** The lab bench: real footage behind the one line about where the energy goes. Hard edges top and bottom. */
export function Bench() {
  return (
    <div className={s.bench}>
      <video className={s.video} src="/video/broll/lab-oscilloscope.mp4" poster="/video/broll/lab-oscilloscope.jpg" autoPlay muted loop playsInline aria-hidden="true" />
      <div className={`wrap ${s.inner}`}>
        <div className={s.close}>
          <p className={s.body}>
            Pushing charge through a wire costs energy every time. Light crossing glass barely loses any: it interferes with itself on
            the way through, and that interference is the arithmetic. It still loses 10–30 % per round trip to mirrors and coatings,
            and PHASER pays to put that back.
          </p>
          <div className={s.cta}>
            <a href={`${REPO}/blob/main/research/2026-09-14/REPORT.md`}>Read the research <span>↗</span></a>
            <a href={`${REPO}/blob/main/research/notes/energy-per-multiply.md`}>See the energy model <span>↗</span></a>
          </div>
        </div>
      </div>
    </div>
  )
}
