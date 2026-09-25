import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { AGENTS, CEO, HUMANS, firstName, type Person } from '@/data/team'
import { Media } from '@/components/Media'
import s from './leadership.module.css'

export const metadata: Metadata = { title: 'Leadership', description: 'The people who lead and run TensaCo: a leadership team of AI agents and the humans who work with them.' }

const isVp = (p: Person) => /^(VP|Head)/.test(p.shortTitle)
const isStaff = (p: Person) => p.title === 'Member of Technical Staff'
const EXECS = AGENTS.filter((p) => p !== CEO && !isVp(p) && !isStaff(p))
const VPS = AGENTS.filter(isVp)
const STAFF = [...HUMANS, ...AGENTS].filter(isStaff)
const href = (p: Person) => `/company/leadership/${p.slug}/`
const humans = HUMANS.length === 1 ? 'the human who works' : `the ${HUMANS.length} humans who work`

function PersonCard({ p }: { p: Person }) {
  return (
    <li className={s.card}>
      <Link href={href(p)} className={s.photo} aria-hidden="true" tabIndex={-1}><img src={p.photo} alt="" loading="lazy" decoding="async" /></Link>
      <h3 className={s.name}><Link href={href(p)}>{p.name}</Link></h3>
      <p className={s.role}>
        <span>{p.title}</span>
        {p.kind === 'ai-agent' && <span className={s.badge} title="This team member is an autonomous AI agent">AI agent</span>}
      </p>
      <p className={s.line}>{p.card}</p>
      <Link href={href(p)} className={s.profileLink}>Profile →</Link>
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
          <p className={`lead ${s.heroLead}`}>A leadership team of {AGENTS.length} AI agents and {humans} with them, across TensaCo, PHASER and TensorCode.</p>
        </div>
      </section>

      <section className="section">
        <div className={`wrap ${s.lead}`}>
          <Link href={href(CEO)} className={s.portraitLink}><img src={CEO.photo} alt={CEO.name} className={s.portrait} /></Link>
          <div>
            <p className="eyebrow">{CEO.title}</p>
            <h2 className="h2"><Link href={href(CEO)} className={s.nameLink}>{CEO.name}</Link></h2>
            {CEO.kind === 'ai-agent' && (
              <p className={s.disclosure}>
                <span className={s.badge} title="This team member is an autonomous AI agent">AI agent</span>
                <span>{firstName(CEO)} is an autonomous AI agent at TensaCo.</span>
              </p>
            )}
            <div className={s.bio}>{CEO.longBio.map((para) => <p key={para.slice(0, 32)}>{para}</p>)}</div>
            <div className="btn-row"><Link href={href(CEO)} className="btn btn-primary">Full profile</Link><a href={`mailto:${CEO.email}`} className="btn btn-ghost" style={{ color: 'var(--navy)' }}>{CEO.email}</a></div>
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
          {STAFF.length > 0 && (
            <>
              <div className={`${s.head} ${s.head2}`}>
                <p className="eyebrow">Technical staff</p>
                <h2 className="h3">Building PHASER and TensorCode</h2>
              </div>
              <ul className={s.grid}>{STAFF.map((p) => <PersonCard key={p.slug} p={p} />)}</ul>
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className={`wrap ${s.join}`}>
          <div className={s.joinPhoto}><Media asset={MEDIA.screens} /></div>
          <div>
            <p className="eyebrow">Careers</p>
            <h2 className="h2">Work with this team.</h2>
            <p className={s.joinText}>We hire people who want to work on the cost of computation and the accountability of AI, alongside a leadership team of AI agents and the humans who work with them.</p>
            <div className="btn-row"><Link href="/careers/" className="btn btn-primary">Open roles</Link><Link href="/company/" className="btn btn-ghost" style={{ color: 'var(--navy)' }}>About TensaCo</Link></div>
          </div>
        </div>
      </section>
    </>
  )
}
