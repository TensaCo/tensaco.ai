'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { api, fmtDate } from '@/lib/api'
import { Portal, SERVICE_NAMES, Status } from '@/components/portal/Portal'
import f from '@/components/forms.module.css'
import u from '@/components/portal/ui.module.css'

type R = { request: { id: number; service: string; organization: string | null; useCase: string; scale: string | null; timeline: string | null; status: string; staffNote: string | null; createdAt: string; updatedAt: string }; staff: boolean }

function View() {
  const [r, setR] = useState<R | null>(null)
  const [missing, setMissing] = useState(false)
  const id = typeof window === 'undefined' ? '' : new URLSearchParams(location.search).get('id') ?? ''
  const load = useCallback(() => { api<R>(`/api/services/requests/${id}`).then((x) => (x.ok ? setR(x.data) : setMissing(true))) }, [id])
  useEffect(load, [load])
  if (missing) return <p className={u.empty}>This request could not be found. <Link href="/account/services/">Back to service requests</Link></p>
  if (!r) return <p className={u.empty}>Loading…</p>
  const q = r.request
  const review = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    await api(`/api/services/requests/${id}`, { method: 'PATCH', json: { status: d.get('status'), staff_note: d.get('staff_note') } })
    load()
  }
  return (
    <>
      <div className={u.panel}>
        <h2>{SERVICE_NAMES[q.service]}</h2>
        <dl className={u.dl}>
          <dt>Status</dt><dd><Status value={q.status} /></dd>
          <dt>Submitted</dt><dd>{fmtDate(q.createdAt)}</dd>
          <dt>Organization</dt><dd>{q.organization ?? '—'}</dd>
          <dt>Timeline</dt><dd>{q.timeline ?? '—'}</dd>
          <dt>Scale</dt><dd>{q.scale ?? '—'}</dd>
          <dt>Use case</dt><dd>{q.useCase}</dd>
          {q.staffNote && (<><dt>Note from TensaCo</dt><dd>{q.staffNote}</dd></>)}
        </dl>
      </div>
      {r.staff && (
        <div className={u.panel}>
          <h2>Review (staff)</h2>
          <form className={f.form} onSubmit={review}>
            <div className={f.field}><label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={q.status} className={f.select}>
                {['submitted', 'in_review', 'approved', 'waitlisted', 'declined'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className={f.field}><label htmlFor="staff_note">Note to the customer</label><textarea id="staff_note" name="staff_note" defaultValue={q.staffNote ?? ''} className={f.textarea} /></div>
            <button className={f.submit}>Save</button>
          </form>
        </div>
      )}
      <p className={u.muted} style={{ marginTop: 20 }}>Questions about this request? <Link href="/account/support/">Message customer success</Link>.</p>
    </>
  )
}

export default function RequestPage() {
  return <Portal title="Service request" actions={<Link href="/account/services/" className={`${u.btn} ${u.ghost}`}>All requests</Link>}><View /></Portal>
}
