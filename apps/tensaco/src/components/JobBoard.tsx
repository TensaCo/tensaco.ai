'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { DEPARTMENTS, JOBS } from '@/data/jobs'
import f from './forms.module.css'
import s from './JobBoard.module.css'

export function JobBoard() {
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [loc, setLoc] = useState('')
  const [type, setType] = useState('')
  const locations = [...new Set(JOBS.map((j) => j.location))]
  const types = [...new Set(JOBS.map((j) => j.type))]
  const shown = useMemo(() => JOBS.filter((j) =>
    (!dept || j.department === dept) && (!loc || j.location === loc) && (!type || j.type === type) &&
    (!q || `${j.title} ${j.summary} ${j.product}`.toLowerCase().includes(q.toLowerCase()))), [q, dept, loc, type])
  return (
    <div>
      <div className={s.filters}>
        <input className={f.input} placeholder="Search roles" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search roles" />
        <select className={f.select} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department"><option value="">All departments</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
        <select className={f.select} value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Location"><option value="">All locations</option>{locations.map((l) => <option key={l}>{l}</option>)}</select>
        <select className={f.select} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <p className={s.count}>{shown.length} open {shown.length === 1 ? 'position' : 'positions'}</p>
      <div className={s.table} role="table">
        <div className={`${s.row} ${s.headRow}`} role="row"><span role="columnheader">Position</span><span role="columnheader">Department</span><span role="columnheader">Location</span><span role="columnheader">Type</span></div>
        {shown.map((j) => (
          <Link key={j.id} href={`/careers/${j.id}/`} className={s.row} role="row">
            <span className={s.title} role="cell">{j.title}<small>{j.product}</small></span>
            <span role="cell">{j.department}</span><span role="cell">{j.location}</span><span role="cell">{j.type}</span>
          </Link>
        ))}
        {shown.length === 0 && <p className={s.none}>No positions match. Try another filter, or send a <Link href="/careers/apply/">general application</Link>.</p>}
      </div>
    </div>
  )
}
