import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { JOBS } from '@/data/jobs'
import { Hero, Split, Stats } from '@/components/Blocks'
import { JobBoard } from '@/components/JobBoard'

export const metadata: Metadata = { title: 'Careers', description: 'Open positions at TensaCo across optics, hardware, research and software.' }

export default function Careers() {
  return (
    <>
      <Hero media={MEDIA.atrium} tall={false} eyebrow="Careers" title="Build the infrastructure of advanced AI."
        lead="Join a team working on optical computing and accountable AI, from the physics up.">
        <div className="btn-row"><a href="#openings" className="btn btn-primary">View open positions</a><Link href="/careers/apply/" className="btn btn-ghost">General application</Link></div>
      </Hero>
      <section className="section">
        <div className="wrap">
          <Stats items={[
            { value: String(JOBS.length), label: 'open positions' },
            { value: '6', label: 'departments hiring' },
            { value: '2', label: 'products in development' },
            { value: 'Remote', label: 'first, with lab roles on site' },
          ]} />
        </div>
      </section>
      <section className="section mist" id="openings">
        <div className="wrap">
          <p className="eyebrow">Open positions</p>
          <h2 className="h2" style={{ marginBottom: 32 }}>Find your role.</h2>
          <JobBoard />
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <Split media={MEDIA.engineeringLab} eyebrow="Working at TensaCo" title="Ownership, rigor and pace.">
            <p>Small teams own whole problems, from first-principles modeling to a working system. We value careful measurement, clear writing, and shipping.</p>
            <p>Compensation includes competitive salary and equity. Details for each role are shared early in the process.</p>
          </Split>
        </div>
      </section>
      <section className="section mist">
        <div className="wrap">
          <Split media={MEDIA.networking} reverse eyebrow="Hiring process" title="What to expect.">
            <p><b>1. Application review.</b> A member of the hiring team reads every application.</p>
            <p><b>2. Introductory conversation.</b> A 30-minute call about your work and the role.</p>
            <p><b>3. Technical conversations.</b> Deep dives with the team, grounded in real problems.</p>
            <p><b>4. Decision.</b> We move quickly and tell you where you stand at each step.</p>
          </Split>
        </div>
      </section>
    </>
  )
}
