import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { Band, Hero, Split } from '@/components/Blocks'
import s from '../pages.module.css'

export const metadata: Metadata = { title: 'About TensaCo', description: 'TensaCo builds the compute and software that make AI faster, more efficient and accountable.' }

const VALUES = [
  { t: 'Curiosity', d: 'We are driven by a hunger to understand what others have not yet explained, and we follow a hard question until it yields.' },
  { t: 'First principles', d: 'We start from the physics and the mathematics, and aim beyond the limits of existing technology rather than a few percent past them.' },
  { t: 'Human benefit', d: 'Advanced AI should empower people, lead to new discoveries, and strengthen the experience we share.' },
  { t: 'Leverage', d: 'We look for the approach that builds on decades of existing engineering and industry, and multiplies it.' },
]

export default function Company() {
  return (
    <>
      <Hero media={MEDIA.lobby} tall={false} eyebrow="Company" title="Building the foundations of advanced AI."
        lead="TensaCo’s mission is to build artificial superintelligence that empowers people. We start with the constraints that matter most today: the cost of computation and the accountability of AI." />
      <section className="section">
        <div className="wrap">
          <Split media={MEDIA.execTeam} eyebrow="Who we are" title="An AI infrastructure company.">
            <p>TensaCo Inc. develops technology across the AI stack. PHASER is an optical approach to AI acceleration. TensorCode is software for AI that teams can check, correct and own.</p>
            <p>Our work began in 2022 with TensaCode, the framework that became TensorCode, and has grown into hardware research on the energy cost of computation.</p>
          </Split>
        </div>
      </section>
      <section className="section mist">
        <div className="wrap">
          <p className="eyebrow">Our values</p>
          <h2 className="h2" style={{ marginBottom: 48 }}>What guides our work.</h2>
          <div className={s.values}>
            {VALUES.map((v) => <div key={v.t}><h3 className="h3">{v.t}</h3><p>{v.d}</p></div>)}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap grid-3">
          <Link href="/company/leadership/" className={s.tile}><span className="eyebrow">Leadership</span><b>Meet the people leading TensaCo</b><span className="link-arrow">Leadership →</span></Link>
          <Link href="/careers/" className={s.tile}><span className="eyebrow">Careers</span><b>Build what comes next with us</b><span className="link-arrow">Careers →</span></Link>
          <Link href="/newsroom/" className={s.tile}><span className="eyebrow">Newsroom</span><b>Announcements and research updates</b><span className="link-arrow">Newsroom →</span></Link>
        </div>
      </section>
      <Band media={MEDIA.skyline} title="Work with TensaCo.">
        <div className="btn-row"><Link href="/contact/" className="btn btn-primary">Contact us</Link></div>
      </Band>
    </>
  )
}
