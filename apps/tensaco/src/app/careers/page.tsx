import type { Metadata } from 'next'
import { MEDIA } from '@/data/media'
import { Card, Hero, Split } from '@/components/Blocks'

export const metadata: Metadata = { title: 'Careers', description: 'Build the foundations of advanced AI with TensaCo.' }

export default function Careers() {
  return (
    <>
      <Hero media={MEDIA.coding} tall={false} eyebrow="Careers" title="Do the most important work of your career."
        lead="We are building a small, senior team across optics, machine learning and software." />
      <section className="section">
        <div className="wrap">
          <Split media={MEDIA.whiteboard} eyebrow="Working at TensaCo" title="Hard problems, real ownership.">
            <p>At TensaCo you work from first principles on problems that matter to the future of AI, with the ownership and pace of a small team.</p>
            <p>We do not have open listings posted at the moment. If your work belongs here, write to us.</p>
            <a href="mailto:hello@tensaco.ai?subject=Careers" className="btn btn-primary" style={{ marginTop: 12 }}>Introduce yourself</a>
          </Split>
        </div>
      </section>
      <section className="section mist">
        <div className="wrap">
          <p className="eyebrow">Areas we hire in</p>
          <h2 className="h2" style={{ marginBottom: 48 }}>Where you could contribute.</h2>
          <div className="grid-3">
            <Card media={MEDIA.labOptics} title="Optics and photonics"><p>Optical systems, spatial light modulators, gain media and precision alignment for PHASER.</p></Card>
            <Card media={MEDIA.electronics} title="Hardware and systems"><p>High-speed electronics, detection and control for optical computing prototypes.</p></Card>
            <Card media={MEDIA.screens} title="Machine learning and software"><p>TensorCode’s Python and TypeScript implementations, training systems and developer experience.</p></Card>
          </div>
        </div>
      </section>
    </>
  )
}
