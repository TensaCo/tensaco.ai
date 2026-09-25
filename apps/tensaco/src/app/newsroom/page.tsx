import type { Metadata } from 'next'
import Link from 'next/link'
import { NEWS, formatDate } from '@/data/news'
import s from './newsroom.module.css'

export const metadata: Metadata = { title: 'Newsroom', description: 'Announcements, product releases and research updates from TensaCo.' }

export default function Newsroom() {
  const [lead, ...rest] = NEWS
  return (
    <div className={s.page}>
      <div className="wrap">
        <div className={s.top}><h1 className={s.title}>Newsroom</h1><a href="mailto:hello@tensaco.ai?subject=Media%20inquiry" className={s.media}>Media inquiries</a></div>
        <Link href={`/newsroom/${lead.slug}/`} className={s.feature}>
          <img src={lead.image} alt={lead.imageAlt} />
          <div>
            <span className={s.meta}>Featured · {lead.tag} · {formatDate(lead.date)}</span>
            <h2>{lead.title}</h2>
            <p>{lead.summary}</p>
            <span className="link-arrow">Read the story →</span>
          </div>
        </Link>
        <h2 className={s.h2}>Latest news</h2>
        <div className={s.grid}>
          {rest.map((n) => (
            <Link key={n.slug} href={`/newsroom/${n.slug}/`} className={s.card}>
              <img src={n.image} alt={n.imageAlt} loading="lazy" />
              <span className={s.meta}>{n.tag} · {formatDate(n.date)}</span>
              <h3>{n.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
