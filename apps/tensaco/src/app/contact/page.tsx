import type { Metadata } from 'next'
import { MEDIA } from '@/data/media'
import { Hero } from '@/components/Blocks'
import { Subscribe } from '@/components/Subscribe'
import s from '../pages.module.css'

export const metadata: Metadata = { title: 'Contact', description: 'Contact TensaCo.' }

const TOPICS = [
  { t: 'Sales and partnerships', d: 'Evaluate PHASER or TensorCode for your organization.', subject: 'Partnership' },
  { t: 'Investors', d: 'Investment and financing discussions.', subject: 'Investor inquiry' },
  { t: 'Media', d: 'Press and speaking requests.', subject: 'Media inquiry' },
  { t: 'Careers', d: 'Introduce yourself and your work.', subject: 'Careers' },
]

export default function Contact() {
  return (
    <>
      <Hero media={MEDIA.office} tall={false} eyebrow="Contact" title="Talk to TensaCo"
        lead="Tell us what you are working on. We respond to every inquiry." />
      <section className="section">
        <div className="wrap">
          <div className="grid-4">
            {TOPICS.map((t) => (
              <a key={t.t} className={s.tile} href={`mailto:hello@tensaco.ai?subject=${encodeURIComponent(t.subject)}`}>
                <b>{t.t}</b><span>{t.d}</span><span className="link-arrow">hello@tensaco.ai →</span>
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="section mist">
        <div className={`wrap ${s.contactGrid}`}>
          <div>
            <h2 className="h2">Stay informed</h2>
            <p className="lead" style={{ marginTop: 16 }}>Receive company announcements, product releases and research updates.</p>
          </div>
          <Subscribe source="contact" />
        </div>
      </section>
    </>
  )
}
