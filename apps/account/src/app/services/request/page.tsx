'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { api, fmtDate, fmtDateTime, param } from '@/lib/api'
import { SERVICE_NAMES, Shell, Status, STATUS_NAMES } from '@/components/Shell'
import f from '@/components/forms.module.css'
import u from '@/components/ui.module.css'

type R = {
  request: { id: number; service: string; organization: string | null; useCase: string; scale: string | null; timeline: string | null; status: string; staffNote: string | null; createdAt: string; updatedAt: string }
  customer?: { name: string; email: string }
  staff: boolean
}

function View({ r, reload }: { r: R; reload: () => void }) {
  const q = r.request
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const review = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const x = await api<{ error?: string }>(`/api/services/requests/${q.id}`, { method: 'PATCH', json: { status: d.get('status'), staff_note: d.get('staff_note') } })
    setMsg(x.ok ? { ok: true, text: 'Saved. The customer is emailed when the status or note changes.' } : { ok: false, text: x.data.error ?? 'Could not save.' })
    reload()
  }
  return (
    <div className={u.grid2}>
      <div>
        <div className={u.panel}>
          <div className={u.panelHead}><h2>Request</h2><Status value={q.status} /></div>
          <dl className={u.dl}>
            <dt>Service</dt><dd>{SERVICE_NAMES[q.service] ?? q.service}</dd>
            <dt>Organization</dt><dd>{q.organization ?? '—'}</dd>
            <dt>Timeline</dt><dd>{q.timeline ?? '—'}</dd>
            <dt>Scale</dt><dd>{q.scale ?? '—'}</dd>
            <dt>Use case</dt><dd>{q.useCase}</dd>
          </dl>
        </div>
        {q.staffNote && <div className={u.panel}><div className={u.panelHead}><h2>Note from TensaCo</h2></div><p className={u.pad} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{q.staffNote}</p></div>}
        {r.staff && (
          <div className={u.panel}>
            <div className={u.panelHead}><h2>Review</h2><span className={u.tag}>Staff</span></div>
            <form className={`${f.form} ${u.pad}`} onSubmit={review}>
              {msg && <p className={msg.ok ? f.success : f.error} role="status">{msg.text}</p>}
              <div className={f.field}><label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={q.status} className={f.select}>
                  {['submitted', 'in_review', 'approved', 'waitlisted', 'declined'].map((s) => <option key={s} value={s}>{STATUS_NAMES[s]}</option>)}
                </select>
              </div>
              <div className={f.field}><label htmlFor="staff_note">Note to the customer</label><textarea id="staff_note" name="staff_note" defaultValue={q.staffNote ?? ''} className={f.textarea} /></div>
              <div className={f.actions}><button className={f.submit}>Save</button></div>
            </form>
          </div>
        )}
      </div>
      <div className={u.panel}>
        <div className={u.panelHead}><h2>Details</h2></div>
        <dl className={u.dl}>
          <dt>Reference</dt><dd>#{q.id}</dd>
          <dt>Submitted</dt><dd>{fmtDate(q.createdAt)}</dd>
          <dt>Updated</dt><dd>{fmtDateTime(q.updatedAt)}</dd>
          {r.customer && <><dt>Customer</dt><dd>{r.customer.name}<br /><a href={`mailto:${r.customer.email}`}>{r.customer.email}</a></dd></>}
        </dl>
        <p className={`${u.pad} ${u.muted}`} style={{ margin: 0, borderTop: '1px solid var(--line)' }}>Questions about this request? <Link href="/support/new/">Message customer success</Link>.</p>
      </div>
    </div>
  )
}

export default function RequestPage() {
  const [r, setR] = useState<R | null>(null)
  const [missing, setMissing] = useState(false)
  const load = useCallback(() => { api<R>(`/api/services/requests/${param('id')}`).then((x) => (x.ok ? setR(x.data) : setMissing(x.status !== 401))) }, [])
  useEffect(load, [load])
  const title = r ? SERVICE_NAMES[r.request.service] ?? 'Service request' : missing ? 'Request not found' : 'Service request'
  return (
    <Shell title={title} crumbs={[{ label: 'Service requests', href: '/services/' }, { label: r ? `#${r.request.id}` : '…' }]}>
      {missing ? <div className={u.panel}><p className={u.empty}>This request could not be found. <Link href="/services/">Back to service requests</Link></p></div>
        : !r ? <p className={u.muted}>Loading…</p> : <View r={r} reload={load} />}
    </Shell>
  )
}
