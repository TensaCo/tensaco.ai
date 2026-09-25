import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { Band, Card, Hero } from '@/components/Blocks'

export const metadata: Metadata = { title: 'Solutions', description: 'PHASER optical AI acceleration and TensorCode accountable AI software.' }

export default function Solutions() {
  return (
    <>
      <Hero media={MEDIA.datacenter} tall={false} eyebrow="Solutions" title="Technology for AI at scale."
        lead="Two solutions, each aimed at a constraint that decides how far organizations can take AI: the energy it consumes, and the accountability it requires." />
      <section className="section">
        <div className="wrap grid-2" style={{ alignItems: 'stretch' }}>
          <Card media={MEDIA.labOptics} title="PHASER" href="/solutions/phaser/" cta="Explore PHASER">
            <p><b>Optical AI acceleration.</b> Neural-network computation performed by light circulating through programmable optics. Designed around parts the telecom and display industries already make at scale.</p>
          </Card>
          <Card media={MEDIA.screens} title="TensorCode" href="/solutions/tensorcode/" cta="Explore TensorCode">
            <p><b>Accountable AI software.</b> Build AI features from trainable programs your team can review, correct and retrain, and save them as portable artifacts it owns.</p>
          </Card>
        </div>
      </section>
      <Band media={MEDIA.handshake} title="Looking for the right fit for your organization?">
        <div className="btn-row"><Link href="/contact/" className="btn btn-primary">Contact our team</Link></div>
      </Band>
    </>
  )
}
