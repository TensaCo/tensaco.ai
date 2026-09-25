import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { AGENTS, FOUNDER, TEAM, type Person } from '@/data/team'
import { Media } from '@/components/Media'
import s from './leadership.module.css'

export const metadata: Metadata = { title: 'Leadership', description: 'The people who lead and run TensaCo: its founder and a leadership team of AI agents.' }

const isVp = (p: Person) => /^(VP|Head)/.test(p.shortTitle)
const EXECS = AGENTS.filter((p) => !isVp(p))
const VPS = AGENTS.filter(isVp)
const nameOf = (slug: string | null) => TEAM.find((p) => p.slug === slug)?.name

function PersonCard({ p }: { p: Person }) {
  return (
    <li className={s.card}>
      <div className={s.photo}><img src={p.photo} alt={p.name} loading="lazy" decoding="async" /></div>
      <h3 className={s.name}>{p.name}</h3>
      <p className={s.role}>
        <span>{p.title}</span>
        {p.kind === 'ai-agent' && <span className={s.badge} title="This team member is an autonomous AI agent">AI agent</span>}
      </p>
      <p className={s.line}>{p.card}</p>
      <details className={s.more}>
        <summary>Profile</summary>
        <p>{p.bio}</p>
        <p className={s.meta}>{p.department} · {p.location}{p.reportsTo ? ` · Reports to ${nameOf(p.reportsTo)}` : ''}</p>
      </details>
    </li>
  )
}

export default function Leadership() {
  return (
    <>
      <section className={`${s.hero} on-dark`}>
        <Media asset={MEDIA.execTeam} className={s.heroImg} priority />
        <div className={s.heroShade} />
        <div className={`wrap ${s.heroBody}`}>
          <p className="eyebrow">Company · Leadership</p>
          <h1 className="h1">The people who run TensaCo.</h1>
          <p className={`lead ${s.heroLead}`}>A founder and a leadership team of {AGENTS.length} AI agents, across TensaCo, PHASER and TensorCode.</p>
        </div>
      </section>

      <section className="section">
        <div className={`wrap ${s.founder}`}>
          <img src={FOUNDER.photo} alt={FOUNDER.name} className={s.portrait} />
          <div>
            <p className="eyebrow">{FOUNDER.title}</p>
            <h2 className="h2">{FOUNDER.name}</h2>
            <div className={s.bio}>
              <p>Jacob Valdez founded TensaCo and leads its technology and strategy, from TensorCode’s trainable-program framework to PHASER’s optical computing research.</p>
              <p>He has built AI and software systems as API and Integration Architect and Software Engineer at AGI, Inc., as a software engineer at Breezy, as an applied machine learning engineer at Deepshard, and in humanoid robot prototyping at Human Robots.</p>
              <p>He holds a B.S. in Computer Science from The University of Texas at Arlington.</p>
            </div>
            <div className="btn-row"><a href="https://jvboid.dev" className="btn btn-ghost" style={{ color: 'var(--navy)' }}>jvboid.dev</a><Link href="/contact/" className="btn btn-primary">Contact</Link></div>
          </div>
        </div>
      </section>

      <section className="section mist" id="team">
        <div className="wrap">
          <div className={s.head}>
            <p className="eyebrow">Executive leadership</p>
            <h2 className="h2">Leadership team</h2>
          </div>
          <ul className={s.grid}>{EXECS.map((p) => <PersonCard key={p.slug} p={p} />)}</ul>
          <div className={`${s.head} ${s.head2}`}>
            <p className="eyebrow">Vice presidents</p>
            <h2 className="h3">Running the work day to day</h2>
          </div>
          <ul className={s.grid}>{VPS.map((p) => <PersonCard key={p.slug} p={p} />)}</ul>
        </div>
      </section>

      <section className="section">
        <div className={`wrap ${s.join}`}>
          <div className={s.joinPhoto}><Media asset={MEDIA.screens} /></div>
          <div>
            <p className="eyebrow">Careers</p>
            <h2 className="h2">Work with this team.</h2>
            <p className={s.joinText}>We hire people who want to work on the cost of computation and the accountability of AI, alongside a founder and a team of AI agents.</p>
            <div className="btn-row"><Link href="/careers/" className="btn btn-primary">Open roles</Link><Link href="/company/" className="btn btn-ghost" style={{ color: 'var(--navy)' }}>About TensaCo</Link></div>
          </div>
        </div>
      </section>
    </>
  )
}
