import type { Metadata } from 'next'
import { MEDIA } from '@/data/media'
import { NEWS, formatDate } from '@/data/news'
import { Hero } from '@/components/Blocks'
import s from '../pages.module.css'

export const metadata: Metadata = { title: 'Newsroom', description: 'Announcements, product releases and research updates from TensaCo.' }

export default function Newsroom() {
  return (
    <>
      <Hero media={MEDIA.conference} tall={false} eyebrow="Newsroom" title="News and announcements" />
      <section className="section">
        <div className="wrap">
          <ul className={s.newsList}>
            {NEWS.map((n) => (
              <li key={n.title}>
                <a href={n.href}>
                  <span className={s.newsMeta}>{n.tag} · {formatDate(n.date)}</span>
                  <span className={s.newsTitle}>{n.title}</span>
                  <span className={s.newsSummary}>{n.summary}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="note" style={{ marginTop: 40 }}>Media inquiries: <a href="mailto:hello@tensaco.ai?subject=Media%20inquiry">hello@tensaco.ai</a></p>
        </div>
      </section>
    </>
  )
}
