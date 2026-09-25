import Link from 'next/link'
import type { Asset } from '@/data/media'
import { Media } from './Media'
import s from './Blocks.module.css'

/** Full-screen hero over a background video or photo. */
export function Hero({ media, eyebrow, title, lead, children, tall = true }: { media: Asset; eyebrow?: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode; tall?: boolean }) {
  return (
    <section className={`${s.hero} ${tall ? s.tall : ''} on-dark`}>
      <Media asset={media} className={s.bg} priority />
      <div className={s.shade} />
      <div className={`wrap ${s.heroBody}`}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="h1">{title}</h1>
        {lead && <p className={`lead ${s.heroLead}`}>{lead}</p>}
        {children}
      </div>
    </section>
  )
}

/** Media on one side, text on the other. */
export function Split({ media, reverse = false, eyebrow, title, children }: { media: Asset; reverse?: boolean; eyebrow?: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`grid-2 ${reverse ? s.reverse : ''}`}>
      <div className={s.splitMedia}><Media asset={media} /></div>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h2">{title}</h2>
        <div className={s.splitBody}>{children}</div>
      </div>
    </div>
  )
}

/** Photo card with a title, text and a link. */
export function Card({ media, title, children, href, cta = 'Learn more' }: { media: Asset; title: string; children: React.ReactNode; href?: string; cta?: string }) {
  const inner = (
    <>
      <div className={s.cardMedia}><Media asset={media} /></div>
      <div className={s.cardBody}>
        <h3 className="h3">{title}</h3>
        <div className={s.cardText}>{children}</div>
        {href && <span className="link-arrow">{cta} →</span>}
      </div>
    </>
  )
  if (!href) return <div className={s.card}>{inner}</div>
  return href.startsWith('http') ? <a href={href} className={s.card}>{inner}</a> : <Link href={href} className={s.card}>{inner}</Link>
}

/** Full-width band over a photo or video with a call to action. */
export function Band({ media, title, children }: { media: Asset; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className={`${s.band} on-dark`}>
      <Media asset={media} className={s.bg} />
      <div className={s.bandShade} />
      <div className={`wrap ${s.bandBody}`}>
        <h2 className="h2">{title}</h2>
        {children}
      </div>
    </section>
  )
}

/** A row of figures. Every figure carries its qualifier. */
export function Stats({ items }: { items: { value: string; label: string; note?: string }[] }) {
  return (
    <div className={s.stats}>
      {items.map((it) => (
        <div key={it.label}>
          <span className={s.statValue}>{it.value}</span>
          <span className={s.statLabel}>{it.label}</span>
          {it.note && <span className="note">{it.note}</span>}
        </div>
      ))}
    </div>
  )
}
