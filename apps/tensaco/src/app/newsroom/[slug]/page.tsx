import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NEWS, formatDate, newsBySlug } from '@/data/news'
import s from '../newsroom.module.css'

export const dynamicParams = false
export function generateStaticParams() { return NEWS.map((n) => ({ slug: n.slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const n = newsBySlug((await params).slug)
  return n ? { title: n.title, description: n.summary, openGraph: { title: n.title, description: n.summary, images: [n.image], type: 'article' } } : {}
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const n = newsBySlug((await params).slug)
  if (!n) notFound()
  const more = NEWS.filter((x) => x.slug !== n.slug).slice(0, 3)
  return (
    <div className={s.page}>
      <article className={s.article}>
        <p className={s.crumbs}><Link href="/newsroom/">Newsroom</Link> / {n.tag}</p>
        <h1>{n.title}</h1>
        <p className={s.meta}>{formatDate(n.date)}</p>
        <img className={s.hero} src={n.image} alt={n.imageAlt} />
        {n.body.map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
        <p><a href={n.link.href} className="btn btn-primary">{n.link.label}</a></p>
        <p className={s.contact}>Media contact: <a href="mailto:hello@tensaco.ai?subject=Media%20inquiry">hello@tensaco.ai</a></p>
      </article>
      <div className="wrap">
        <h2 className={s.h2}>More news</h2>
        <div className={s.grid}>
          {more.map((m) => (
            <Link key={m.slug} href={`/newsroom/${m.slug}/`} className={s.card}>
              <img src={m.image} alt={m.imageAlt} loading="lazy" />
              <span className={s.meta}>{m.tag} · {formatDate(m.date)}</span>
              <h3>{m.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
