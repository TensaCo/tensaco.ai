import Link from 'next/link'
import { allPosts, formatDate } from '@/lib/posts'
import { Subscribe } from '../site/Subscribe'
import s from './Latest.module.css'

export function Latest() {
  const posts = allPosts().slice(0, 3)
  return (
    <section className={s.sec} id="latest" aria-labelledby="latest-h">
      <div className="wrap">
        <p className="eyebrow">Latest developments</p>
        <div className={s.grid}>
          <div>
            <h2 id="latest-h" className={s.h}>From the lab.</h2>
            <ol className={s.list}>
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}/`} className={s.post}>
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                    <span className={s.title}>{p.title}</span>
                    <span className={s.more}>Read →</span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href="/blog/" className={s.all}>All posts</Link>
          </div>
          <div className={s.subscribe} id="subscribe">
            <h3>Get updates as we build it.</h3>
            <p>New results, the first bench prototype, and when there is something you can run.</p>
            <Subscribe source="home" />
          </div>
        </div>
      </div>
    </section>
  )
}
