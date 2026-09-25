import type { Metadata } from 'next'
import Link from 'next/link'
import { allPosts, formatDate } from '@/lib/posts'
import { Subscribe } from '@/components/site/Subscribe'
import s from './blog.module.css'

export const metadata: Metadata = { title: 'Blog — PHASER', description: 'Posts about PHASER, the optical neural accelerator.' }

export default function Blog() {
  const posts = allPosts()
  return (
    <main className={s.page}>
      <div className="wrap">
        <p className="eyebrow">Blog</p>
        <h1 className={s.h1}>Latest developments</h1>
        <ol className={s.list}>
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}/`} className={s.card}>
                <time dateTime={p.date}>{formatDate(p.date)}</time>
                <span className={s.title}>{p.title}</span>
                <span className={s.summary}>{p.summary}</span>
              </Link>
            </li>
          ))}
        </ol>
        <section className={s.sub} id="subscribe">
          <h2>Follow the build</h2>
          <Subscribe source="blog" />
        </section>
      </div>
    </main>
  )
}
