import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { NEWS, formatDate } from '@/data/news'
import { Band, Card, Hero, Split, Stats } from '@/components/Blocks'
import { Subscribe } from '@/components/Subscribe'
import { BrandFilm } from './BrandFilm'
import s from './home.module.css'

export default function Home() {
  return (
    <>
      <Hero
        media={MEDIA.homeHero}
        eyebrow="TensaCo Inc."
        title="Intelligence infrastructure for the enterprise."
        lead="TensaCo builds the compute and the software that make AI faster, more efficient and accountable, so organizations can adopt it at scale with confidence."
      >
        <div className="btn-row">
          <a href="#solutions" className="btn btn-primary">Explore our solutions</a>
          <Link href="/contact/" className="btn btn-ghost">Talk to our team</Link>
        </div>
      </Hero>

      <section className="section">
        <div className="wrap">
          <Split media={MEDIA.boardroom} eyebrow="Why TensaCo" title="AI is now a question of energy and trust.">
            <p>
              Every organization is under pressure to put AI to work. Two constraints decide how far it can go: the power it
              takes to run, and whether people can check, correct and stand behind what it does.
            </p>
            <p>TensaCo addresses both, with hardware that changes the cost of computation and software that keeps AI accountable.</p>
            <Link href="/company/" className="link-arrow">About TensaCo →</Link>
          </Split>
        </div>
      </section>

      <section className={`section on-dark ${s.filmSection}`} id="film">
        <div className="wrap">
          <div className={s.filmHead}>
            <div>
              <p className="eyebrow">The TensaCo film</p>
              <h2 className={`h2 ${s.filmTitle}`}>Compute built on light. Software built on trust.</h2>
            </div>
            <p className={s.filmAside}>Thirty seconds on why TensaCo exists, and the two companies building its answer: PHASER and TensorCode.</p>
          </div>
          <BrandFilm />
          <div className={s.filmMeta}>
            <span className="note">Footage and music generated for TensaCo with AI video and music models.</span>
          </div>
        </div>
      </section>

      <section className="section mist" id="solutions">
        <div className="wrap">
          <div className={s.head}>
            <div>
              <p className="eyebrow">Solutions</p>
              <h2 className="h2">Built for practical deployment.</h2>
            </div>
          </div>
          <div className="grid-2">
            <Card media={MEDIA.labOptics} title="PHASER: optical AI acceleration" href="https://phaser.tensaco.ai" cta="Visit phaser.tensaco.ai">
              <p>Neural-network computation performed by light, for AI infrastructure where energy and latency set the limits.</p>
            </Card>
            <Card media={MEDIA.screens} title="TensorCode: accountable AI software" href="https://tensorcode.dev" cta="Visit tensorcode.dev">
              <p>AI your team can check, correct and own: trainable programs with reviewed feedback, reproducible artifacts and full provenance.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="eyebrow">By the numbers</p>
          <h2 className="h2" style={{ marginBottom: 48 }}>What our technology makes possible.</h2>
          <Stats
            items={[
              { value: '~1,000×', label: 'less energy per step than a GPU', note: 'PHASER, modeled at one megapixel of optics' },
              { value: '6.7 ns', label: 'per computation step', note: 'PHASER, simulated' },
              { value: '2', label: 'languages, one file format', note: 'TensorCode: Python and TypeScript' },
              { value: '945 TWh', label: 'data-centre electricity by 2030', note: 'IEA base case, up from 415 TWh in 2024' },
            ]}
          />
        </div>
      </section>

      <Band media={MEDIA.podium} title="The decisions about AI’s future are being made now.">
        <p className="lead" style={{ maxWidth: '38em', marginTop: 20 }}>
          Governments, utilities and enterprises are planning for a decade of AI growth. TensaCo works on the technology that
          determines what that growth costs.
        </p>
        <div className="btn-row"><Link href="/contact/" className="btn btn-ghost">Talk to our team</Link></div>
      </Band>

      <section className="section">
        <div className="wrap">
          <div className={s.head}>
            <div>
              <p className="eyebrow">Newsroom</p>
              <h2 className="h2">Latest from TensaCo.</h2>
            </div>
            <Link href="/newsroom/" className="link-arrow">All news →</Link>
          </div>
          <div className="grid-3">
            {NEWS.slice(0, 3).map((n) => (
              <a key={n.slug} href={`/newsroom/${n.slug}/`} className={s.news}>
                <span className={s.newsMeta}>{n.tag} · {formatDate(n.date)}</span>
                <span className={s.newsTitle}>{n.title}</span>
                <span className="link-arrow">Read more →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section navy on-dark">
        <div className={`wrap ${s.cta}`}>
          <div>
            <h2 className="h2">Stay informed.</h2>
            <p className="lead" style={{ marginTop: 16 }}>Company announcements, product releases and research updates from TensaCo.</p>
          </div>
          <Subscribe source="home" />
        </div>
      </section>
    </>
  )
}
