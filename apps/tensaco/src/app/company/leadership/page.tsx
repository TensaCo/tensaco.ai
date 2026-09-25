import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { Hero } from '@/components/Blocks'
import s from '../../pages.module.css'

export const metadata: Metadata = { title: 'Leadership', description: 'The people leading TensaCo.' }

export default function Leadership() {
  return (
    <>
      <Hero media={MEDIA.boardroomPhoto} tall={false} eyebrow="Company · Leadership" title="Leadership" />
      <section className="section">
        <div className={`wrap ${s.person}`}>
          <img src="/media/people/jacob-valdez.jpg" alt="Jacob Valdez" className={s.portrait} />
          <div>
            <p className="eyebrow">Founder and Chief Executive Officer</p>
            <h2 className="h2">Jacob Valdez</h2>
            <div className={s.bio}>
              <p>Jacob Valdez founded TensaCo and leads its technology and strategy, from TensorCode’s trainable-program framework to PHASER’s optical computing research.</p>
              <p>He has built AI and software systems as API and Integration Architect and Software Engineer at AGI, Inc., as a software engineer at Breezy, as an applied machine learning engineer at Deepshard, and in humanoid robot prototyping at Human Robots.</p>
              <p>He holds a B.S. in Computer Science from The University of Texas at Arlington.</p>
            </div>
            <div className="btn-row"><a href="https://jvboid.dev" className="btn btn-ghost" style={{ color: 'var(--navy)' }}>jvboid.dev</a><Link href="/contact/" className="btn btn-primary">Contact</Link></div>
          </div>
        </div>
      </section>
    </>
  )
}
