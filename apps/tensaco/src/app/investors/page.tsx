import type { Metadata } from 'next'
import { MEDIA } from '@/data/media'
import { Band, Hero, Split, Stats } from '@/components/Blocks'
import { Subscribe } from '@/components/Subscribe'
import s from '../pages.module.css'

export const metadata: Metadata = { title: 'Investor relations', description: 'TensaCo investor information and contact.' }

export default function Investors() {
  return (
    <>
      <Hero media={MEDIA.skyline} tall={false} eyebrow="Investors" title="Investor relations"
        lead="TensaCo addresses the two constraints that will decide the next decade of AI: energy and accountability." />
      <section className="section">
        <div className="wrap">
          <Split media={MEDIA.boardroomPhoto} eyebrow="Investment thesis" title="The bottleneck on AI is shifting from chips to power and trust.">
            <p>Data-centre electricity use is projected to more than double by 2030 (IEA base case), while transformers take over two years to procure and new power plants wait five years or more for a grid connection.</p>
            <p>PHASER targets the energy cost of computation itself. TensorCode addresses the accountability organizations need before they deploy AI in decisions they answer for.</p>
          </Split>
        </div>
      </section>
      <section className="section mist">
        <div className="wrap">
          <p className="eyebrow">Market context</p>
          <h2 className="h2" style={{ marginBottom: 48 }}>The scale of the opportunity.</h2>
          <Stats items={[
            { value: '945 TWh', label: 'data-centre electricity in 2030', note: 'IEA base case (415 TWh in 2024)' },
            { value: '128 wks', label: 'lead time for a large power transformer', note: 'Wood Mackenzie, Q2 2025' },
            { value: '5 yrs+', label: 'median wait to connect new US generation', note: 'LBNL, Queued Up 2026' },
            { value: '$400B+', label: 'AI infrastructure spend by five companies in 2025', note: 'IEA' },
          ]} />
        </div>
      </section>
      <section className="section">
        <div className={`wrap ${s.contactGrid}`}>
          <div>
            <p className="eyebrow">Contact</p>
            <h2 className="h2">Investor inquiries</h2>
            <p className="lead" style={{ marginTop: 16 }}>For investment and partnership discussions, contact us at <a href="mailto:hello@tensaco.ai?subject=Investor%20inquiry">hello@tensaco.ai</a>.</p>
          </div>
          <div>
            <h3 className="h3" style={{ marginBottom: 16 }}>Receive investor and company updates</h3>
            <Subscribe source="investors" />
          </div>
        </div>
      </section>
      <Band media={MEDIA.handshake} title="Build the next decade of AI infrastructure with us." />
    </>
  )
}
