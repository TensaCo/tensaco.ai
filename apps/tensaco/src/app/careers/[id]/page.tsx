import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JOBS, jobById } from '@/data/jobs'
import { ApplyForm } from '@/components/ApplyForm'
import s from '../careers.module.css'

export const dynamicParams = false
export function generateStaticParams() { return JOBS.map((j) => ({ id: j.id })) }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const j = jobById((await params).id)
  return j ? { title: `${j.title} — Careers`, description: j.summary } : {}
}

export default async function Job({ params }: { params: Promise<{ id: string }> }) {
  const j = jobById((await params).id)
  if (!j) notFound()
  return (
    <div className={s.page}>
      <div className="wrap">
        <p className={s.crumbs}><Link href="/careers/">Careers</Link> / {j.department}</p>
        <h1 className={s.title}>{j.title}</h1>
        <p className={s.facts}><span>{j.product}</span><span>{j.department}</span><span>{j.location}</span><span>{j.type}</span><span>{j.level}</span></p>
        <div className={s.grid}>
          <article className={s.body}>
            <p className={s.summary}>{j.summary}</p>
            <h2>What you’ll do</h2><ul>{j.responsibilities.map((x) => <li key={x}>{x}</li>)}</ul>
            <h2>What you’ll bring</h2><ul>{j.qualifications.map((x) => <li key={x}>{x}</li>)}</ul>
            <h2>Nice to have</h2><ul>{j.preferred.map((x) => <li key={x}>{x}</li>)}</ul>
            <h2>About TensaCo</h2>
            <p>TensaCo builds the compute and software that make AI faster, more efficient and accountable: PHASER, an optical approach to AI acceleration, and TensorCode, software for AI teams can check, correct and own.</p>
            <p className={s.eeo}>TensaCo is an equal opportunity employer. We consider all qualified applicants without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, age, disability, veteran status, or any other protected characteristic.</p>
          </article>
          <aside className={s.apply} id="apply">
            <h2>Apply for this role</h2>
            <ApplyForm jobId={j.id} jobTitle={j.title} />
          </aside>
        </div>
      </div>
    </div>
  )
}
