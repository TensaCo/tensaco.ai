import type { Metadata } from 'next'
import Link from 'next/link'
import { ApplyForm } from '@/components/ApplyForm'
import s from '../careers.module.css'

export const metadata: Metadata = { title: 'General application — Careers', description: 'Introduce yourself to TensaCo.' }

export default function General() {
  return (
    <div className={s.page}>
      <div className="wrap">
        <p className={s.crumbs}><Link href="/careers/">Careers</Link> / General application</p>
        <h1 className={s.title}>General application</h1>
        <div className={s.grid}>
          <article className={s.body}>
            <p className={s.summary}>Don’t see the right role? Tell us about your work. We keep general applications on file and reach out when a position fits.</p>
            <p>We hire across optics and photonics, hardware, research, software and go-to-market.</p>
          </article>
          <aside className={s.apply}><h2>Introduce yourself</h2><ApplyForm jobId="general" jobTitle="a general position" /></aside>
        </div>
      </div>
    </div>
  )
}
