import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HUMANS, TEAM, firstName, personBySlug, reportsOf, type Person } from '@/data/team'
import l from '../leadership.module.css'
import s from './profile.module.css'

export const dynamicParams = false
export function generateStaticParams() { return TEAM.map((p) => ({ slug: p.slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = personBySlug((await params).slug)
  if (!p) return {}
  const title = `${p.name} — ${p.title}`
  const description = p.kind === 'ai-agent' ? `${p.bio} ${firstName(p)} is an autonomous AI agent at TensaCo.` : p.bio
  return { title, description, openGraph: { title, description, images: [p.photo], type: 'profile' } }
}

const href = (p: Person) => `/company/leadership/${p.slug}/`
const Badge = () => <span className={l.badge} title="This team member is an autonomous AI agent">AI agent</span>

function PersonLink({ p }: { p: Person }) {
  return (
    <Link href={href(p)} className={s.person}>
      <img src={p.photo} alt="" loading="lazy" />
      <span><b>{p.name}</b><span>{p.shortTitle}{p.kind === 'ai-agent' ? ' · AI agent' : ''}</span></span>
    </Link>
  )
}

export default async function Profile({ params }: { params: Promise<{ slug: string }> }) {
  const p = personBySlug((await params).slug)
  if (!p) notFound()
  const first = firstName(p)
  const manager = personBySlug(p.reportsTo)
  const reports = reportsOf(p.slug)
  const signoff = p.kind === 'ai-agent' ? HUMANS.find((h) => h.title === 'Member of Technical Staff') ?? HUMANS[0] : undefined
  const i = TEAM.indexOf(p)
  const next = TEAM[(i + 1) % TEAM.length]

  return (
    <div className={s.page}>
      <section className={`wrap ${s.top}`}>
        <img src={p.photo} alt={p.name} className={s.portrait} />
        <div className={s.head}>
          <p className={s.crumbs}><Link href="/company/">Company</Link> / <Link href="/company/leadership/">Leadership</Link></p>
          <h1 className={s.name}>{p.name}</h1>
          <p className={s.title}>{p.title}</p>
          {p.kind === 'ai-agent' && (
            <p className={s.disclosure}><Badge /><span>{first} is an autonomous AI agent at TensaCo.</span></p>
          )}
          <p className={s.meta}>{p.department} · {p.location}{p.pronouns ? ` · ${p.pronouns}` : ''}</p>
          <div className={s.bio}>{p.longBio.map((para) => <p key={para.slice(0, 32)}>{para}</p>)}</div>
          <div className="btn-row"><a href={`mailto:${p.email}`} className="btn btn-primary">Email {first}</a><Link href="/company/leadership/" className="btn btn-ghost" style={{ color: 'var(--navy)' }}>All leadership</Link></div>
        </div>
      </section>

      <section className={`section mist ${s.more}`}>
        <div className={`wrap ${s.cols}`}>
          <div className={s.main}>
            {p.workingStyle && (
              <div className={s.block}>
                <p className="eyebrow">Working style</p>
                <h2 className="h3">How {first} works</h2>
                <p>{p.workingStyle}</p>
              </div>
            )}
            {p.responsibilities.length > 0 && (
              <div className={s.block}>
                <p className="eyebrow">Responsibilities</p>
                <h2 className="h3">What {first} owns</h2>
                <ul className={s.list}>{p.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            )}
          </div>

          <aside className={s.aside}>
            <div className={s.card}>
              <h2 className={s.cardHead}>Reporting line</h2>
              {manager ? <><p className={s.label}>Reports to</p><PersonLink p={manager} /></> : <p className={s.small}>{first} leads TensaCo and reports to no one inside the company.</p>}
              {reports.length > 0 && (
                <>
                  <p className={s.label}>Direct reports</p>
                  {reports.map((r) => <PersonLink key={r.slug} p={r} />)}
                </>
              )}
              {signoff && (
                <p className={s.small}>Spending, contracts, hiring decisions and public statements need sign-off from a human, <Link href={href(signoff)}>{signoff.name}</Link>.</p>
              )}
            </div>

            <div className={s.card}>
              <h2 className={s.cardHead}>Contact</h2>
              <p><a href={`mailto:${p.email}`}>{p.email}</a></p>
            </div>

            <div className={s.card}>
              <h2 className={s.cardHead}>Elsewhere</h2>
              {p.elsewhere && <p className={s.quote}>“{p.elsewhere}”</p>}
              {p.links.length > 0 && (
                <ul className={s.links}>
                  {p.links.map((x) => {
                    const bare = x.url.replace(/^(https?:\/\/|mailto:)/, '').replace(/\/$/, '')
                    return <li key={x.url}><a href={x.url}>{x.label}</a>{bare !== x.label && <span>{bare}</span>}</li>
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </section>

      <div className={`wrap ${s.nextRow}`}>
        <Link href="/company/leadership/" className="link-arrow">← The leadership team</Link>
        <Link href={href(next)} className="link-arrow">Next: {next.name} →</Link>
      </div>
    </div>
  )
}
