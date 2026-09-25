import type { Metadata } from 'next'
import Link from 'next/link'
import 'katex/dist/katex.min.css'
import { allPosts, formatDate, getPost } from '@/lib/posts'
import { PostBody } from '@/components/blog/PostBody'
import { Subscribe } from '@/components/site/Subscribe'
import s from '../blog.module.css'

export const dynamicParams = false
export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await getPost(slug)
  return {
    title: `${p.title} — PHASER`,
    description: p.summary,
    alternates: p.source ? { canonical: p.source } : undefined,
    openGraph: { title: p.title, description: p.summary, type: 'article', images: p.hero ? [p.hero.src] : undefined },
  }
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await getPost(slug)
  return (
    <main className={s.page}>
      <article className={s.article}>
        <p className="eyebrow"><Link href="/blog/">Blog</Link></p>
        <h1 className={s.postTitle}>{p.title}</h1>
        <p className={s.byline}><time dateTime={p.date}>{formatDate(p.date)}</time> · Jacob Valdez</p>
        {p.hero && <img className={s.hero} src={p.hero.src} alt={p.hero.alt} />}
        <PostBody html={p.html} className={s.prose} />
        {p.source && <p className={s.source}>(copied from <a href={p.source}>{p.source}</a>)</p>}
        <section className={s.sub} id="subscribe">
          <h2>Follow the build</h2>
          <Subscribe source={`post:${p.slug}`} />
        </section>
      </article>
    </main>
  )
}
