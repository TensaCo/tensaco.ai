import Link from 'next/link'
import s from './Legal.module.css'

export type Section = { id: string; title: string; body: React.ReactNode }

/** Long-form legal page with a table of contents. */
export function Legal({ title, updated, intro, sections }: { title: string; updated: string; intro: React.ReactNode; sections: Section[] }) {
  return (
    <div className={s.page}>
      <div className={`wrap ${s.grid}`}>
        <aside className={s.toc}>
          <nav aria-label="Legal">
            <p>Legal</p>
            <Link href="/legal/terms/">Terms of Use</Link>
            <Link href="/legal/privacy/">Privacy Policy</Link>
            <Link href="/legal/cookies/">Cookie Policy</Link>
          </nav>
          <nav aria-label="On this page">
            <p>On this page</p>
            {sections.map((x, i) => <a key={x.id} href={`#${x.id}`}>{i + 1}. {x.title}</a>)}
          </nav>
        </aside>
        <article className={s.body}>
          <h1>{title}</h1>
          <p className={s.updated}>Last updated {updated}</p>
          <div className={s.intro}>{intro}</div>
          {sections.map((x, i) => (
            <section key={x.id} id={x.id}>
              <h2>{i + 1}. {x.title}</h2>
              {x.body}
            </section>
          ))}
          <p className={s.contact}>TENSACO INC · San Francisco, California · <a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a></p>
        </article>
      </div>
    </div>
  )
}
