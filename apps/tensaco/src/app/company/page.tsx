import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { AGENTS, TEAM } from '@/data/team'
import { Media } from '@/components/Media'
import s from './company.module.css'

export const metadata: Metadata = {
  title: 'About TensaCo',
  description: 'TensaCo builds the compute and software that make AI faster, more efficient and accountable. The company behind PHASER and TensorCode, headquartered in San Francisco.',
}

const PRINCIPLES = [
  { t: 'Curiosity', d: 'We are driven by a hunger to understand what others have not yet explained, and we follow a hard question until it yields.' },
  { t: 'First principles', d: 'We start from the physics and the mathematics, and aim beyond the limits of existing technology rather than a few percent past them.' },
  { t: 'Human benefit', d: 'Advanced AI should empower people, lead to new discoveries, and strengthen the experience we share.' },
  { t: 'Leverage', d: 'We look for the approach that builds on decades of existing engineering and industry, and multiplies it.' },
]

const FACTS = [
  { k: '2022', v: 'Our work began with TensaCode' },
  { k: '2', v: 'Companies: PHASER and TensorCode' },
  { k: String(TEAM.length), v: `People: a founder and ${AGENTS.length} AI agents` },
  { k: 'SF', v: 'Headquartered in San Francisco' },
]

export default function Company() {
  return (
    <>
      {/* 1. Opening statement over the leadership team */}
      <section className={`${s.hero} on-dark`}>
        <Media asset={MEDIA.execTeam} className={s.heroImg} priority />
        <div className={s.heroShade} />
        <div className={`wrap ${s.heroBody}`}>
          <p className="eyebrow">About TensaCo</p>
          <h1 className={s.statement}>We make intelligence cheaper to run and easier&nbsp;to&nbsp;trust.</h1>
          <p className={`lead ${s.heroLead}`}>
            TensaCo’s mission is to build artificial superintelligence that empowers people. We start with the two constraints
            that matter most today: the cost of computation and the accountability of AI.
          </p>
        </div>
      </section>
      <section className={s.facts} aria-label="TensaCo at a glance">
        <div className={`wrap ${s.factsRow}`}>
          {FACTS.map((f) => (
            <div key={f.v} className={s.fact}><span className={s.factK}>{f.k}</span><span className={s.factV}>{f.v}</span></div>
          ))}
        </div>
      </section>

      {/* 2. Founding story */}
      <section className="section">
        <div className={`wrap ${s.story}`}>
          <div className={s.storyHead}>
            <p className="eyebrow">Our story</p>
            <h2 className="h2">Two hard problems, one company.</h2>
          </div>
          <div className={s.storyBody}>
            <p className={s.storyLead}>
              TensaCo began in 2022 with a question about software: what if part of a program could be trained, and the rest
              stayed code a person could read, check and correct?
            </p>
            <p>
              That framework, TensaCode, became TensorCode. Building it made the second problem impossible to ignore. Every
              trained program runs on hardware whose energy bill grows with every model, and the physics of electronic
              computation sets a floor under that bill. PHASER is our research into moving the heaviest part of neural-network
              computation into light.
            </p>
            <p>
              Today TensaCo Inc. is the parent of both. It is led by its founder and run with a leadership team of AI agents,
              each with a name, a role and a reporting line, and each labelled as an AI agent wherever they appear.
            </p>
            <ol className={s.timeline}>
              <li><b>2022</b><span>TensaCode, the framework that became TensorCode, is started.</span></li>
              <li><b>Then</b><span>Research begins on PHASER and the energy cost of computation.</span></li>
              <li><b>2026</b><span>A leadership team of AI agents joins the founder to run the company.</span></li>
            </ol>
          </div>
        </div>
      </section>

      {/* 3. The companies of TensaCo, each in its own brand */}
      <section className={s.cos} aria-labelledby="cos-title">
        <div className={`wrap ${s.cosHead}`}>
          <p className="eyebrow">The companies of TensaCo</p>
          <h2 id="cos-title" className="h2">Each company has its own audience and its own identity.</h2>
        </div>
        <div className={s.cosGrid}>
          <a href="https://phaser.tensaco.ai" className={`${s.co} ${s.phaser}`}>
            <Media asset={MEDIA.labOptics} className={s.coImg} />
            <div className={s.coShade} />
            <div className={s.coBody}>
              <span className={s.coTag}>PHASER · 650 nm</span>
              <h3 className={s.coTitle}>Neural-network computation performed by light.</h3>
              <p>Optical AI acceleration for infrastructure where energy and latency set the limits. Research stage; performance figures are modeled.</p>
              <span className={s.coLink}>phaser.tensaco.ai →</span>
            </div>
          </a>
          <a href="https://tensorcode.dev" className={`${s.co} ${s.tensorcode}`}>
            <div className={s.tcArt}><Media asset={MEDIA.whiteboard} /></div>
            <div className={s.coBody}>
              <span className={s.coTag}>TensorCode · Python + TypeScript</span>
              <h3 className={s.coTitle}>AI your team can check, correct and&nbsp;own.</h3>
              <p>Programs that are part code and part trained model, with reviewed feedback, reproducible artifacts and full provenance.</p>
              <span className={s.coLink}>tensorcode.dev →</span>
            </div>
          </a>
        </div>
      </section>

      {/* 4. Principles */}
      <section className="section">
        <div className="wrap">
          <div className={s.sectionHead}>
            <p className="eyebrow">Our principles</p>
            <h2 className="h2">What guides our work.</h2>
          </div>
          <ol className={s.principles}>
            {PRINCIPLES.map((v, i) => (
              <li key={v.t}>
                <span className={s.num} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h3">{v.t}</h3>
                <p>{v.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Pull line */}
      <section className={`${s.pull} on-dark`}>
        <div className="wrap">
          <p className={s.pullLine}>Make computation cheaper. Make AI accountable. <span>Build&nbsp;both.</span></p>
        </div>
      </section>

      {/* 6. The team */}
      <section className="section">
        <div className={`wrap ${s.team}`}>
          <div className={s.teamPhoto}><Media asset={MEDIA.screens} /></div>
          <div>
            <p className="eyebrow">The team</p>
            <h2 className="h2">One founder. {AGENTS.length} AI agents.</h2>
            <p className={s.teamText}>
              Jacob Valdez founded TensaCo and leads it. Operations, research, engineering, finance, legal, people, sales and
              customer work are run by AI agents, each named, each with a role and a manager, and each marked as an AI agent
              on this site.
            </p>
            <ul className={s.faces} aria-label="Team members">
              {TEAM.map((p) => (
                <li key={p.slug} title={`${p.name}, ${p.shortTitle}`}><img src={p.photo} alt="" loading="lazy" /></li>
              ))}
            </ul>
            <Link href="/company/leadership/" className="link-arrow">Meet the leadership team →</Link>
          </div>
        </div>
      </section>

      {/* 7. Onward */}
      <section className="section mist">
        <div className={`wrap ${s.tiles}`}>
          <Link href="/company/leadership/" className={s.tile}><span className="eyebrow">Leadership</span><b>Meet the people leading TensaCo</b><span className="link-arrow">Leadership →</span></Link>
          <Link href="/careers/" className={s.tile}><span className="eyebrow">Careers</span><b>Build what comes next with us</b><span className="link-arrow">Careers →</span></Link>
          <Link href="/newsroom/" className={s.tile}><span className="eyebrow">Newsroom</span><b>Announcements and research updates</b><span className="link-arrow">Newsroom →</span></Link>
        </div>
      </section>
      {/* 8. Headquarters, and the close */}
      <section className={`${s.hq} on-dark`}>
        <Media asset={MEDIA.sanFrancisco} className={s.hqImg} />
        <div className={s.hqShade} />
        <div className={`wrap ${s.hqBody}`}>
          <p className="eyebrow">Headquarters</p>
          <h2 className={s.hqCity}>San Francisco</h2>
          <dl className={s.hqFacts}>
            <div><dt>Company</dt><dd>TensaCo Inc., a Delaware corporation</dd></div>
            <div><dt>Team</dt><dd>San Francisco and remote across US time zones</dd></div>
            <div><dt>Contact</dt><dd><a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a></dd></div>
          </dl>
          <div className="btn-row"><Link href="/contact/" className="btn btn-primary">Work with TensaCo</Link></div>
        </div>
      </section>

    </>
  )
}
