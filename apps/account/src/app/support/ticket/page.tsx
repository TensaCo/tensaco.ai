'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { api, fmtDate, fmtDateTime, param } from '@/lib/api'
import { CATEGORY_NAMES, Shell, Status } from '@/components/Shell'
import f from '@/components/forms.module.css'
import u from '@/components/ui.module.css'

type Thread = {
  ticket: { id: number; userId: number; subject: string; category: string; status: string; createdAt: string; updatedAt: string; customerName: string; customerEmail: string; customerOrg: string | null }
  messages: { id: number; body: string; fromStaff: boolean; createdAt: string; author: string | null }[]
  staff: boolean
}

function View({ t, reload }: { t: Thread; reload: () => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const id = t.ticket.id
  const reply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setBusy(true); setError('')
    const r = await api<{ error?: string }>(`/api/support/tickets/${id}`, { method: 'POST', json: { body: new FormData(form).get('body') } })
    setBusy(false)
    if (r.ok) { form.reset(); reload() } else setError(r.data.error ?? 'Could not send your reply.')
  }
  const setStatus = async (status: string) => { await api(`/api/support/tickets/${id}`, { method: 'PATCH', json: { status } }); reload() }
  return (
    <div className={u.grid2}>
      <div>
        <div className={u.thread}>
          {t.messages.map((m) => (
            <div key={m.id} className={`${u.msg} ${m.fromStaff ? u.staffMsg : ''}`}>
              <div className={u.msgHead}><b>{m.fromStaff ? `${m.author ?? 'TensaCo'} · TensaCo` : m.author ?? 'Customer'}</b><span>{fmtDateTime(m.createdAt)}</span></div>
              <div className={u.msgBody}>{m.body}</div>
            </div>
          ))}
        </div>
        <div className={u.panel}>
          <form className={`${f.form} ${u.pad}`} onSubmit={reply}>
            {error && <p className={f.error} role="alert">{error}</p>}
            <div className={f.field}><label htmlFor="body">{t.staff ? 'Reply to the customer' : 'Reply'}</label><textarea id="body" name="body" required className={f.textarea} />
              {t.staff && <small>The customer is emailed your reply unless they turned update emails off.</small>}</div>
            <div className={f.actions}><button className={f.submit} disabled={busy}>{busy ? 'Sending…' : 'Send reply'}</button></div>
          </form>
        </div>
      </div>
      <div className={u.panel}>
        <div className={u.panelHead}><h2>Details</h2></div>
        <dl className={u.dl}>
          <dt>Status</dt><dd><Status value={t.ticket.status} staff={t.staff} /></dd>
          <dt>Reference</dt><dd>#{t.ticket.id}</dd>
          <dt>Topic</dt><dd>{CATEGORY_NAMES[t.ticket.category] ?? t.ticket.category}</dd>
          <dt>Opened</dt><dd>{fmtDate(t.ticket.createdAt)}</dd>
          <dt>Updated</dt><dd>{fmtDateTime(t.ticket.updatedAt)}</dd>
          {t.staff && <><dt>Customer</dt><dd>{t.ticket.customerName}<br /><a href={`mailto:${t.ticket.customerEmail}`}>{t.ticket.customerEmail}</a>{t.ticket.customerOrg ? <><br />{t.ticket.customerOrg}</> : null}</dd></>}
        </dl>
        <div className={u.pad} style={{ borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {t.ticket.status !== 'resolved'
            ? <button className={`${u.btn} ${u.ghost}`} onClick={() => setStatus('resolved')}>Mark resolved</button>
            : <button className={`${u.btn} ${u.ghost}`} onClick={() => setStatus('open')}>Reopen</button>}
          {t.staff && t.ticket.status === 'open' && <button className={`${u.btn} ${u.ghost}`} onClick={() => setStatus('awaiting_customer')}>Awaiting customer</button>}
        </div>
      </div>
    </div>
  )
}

export default function Ticket() {
  const [t, setT] = useState<Thread | null>(null)
  const [missing, setMissing] = useState(false)
  const load = useCallback(() => { api<Thread>(`/api/support/tickets/${param('id')}`).then((r) => (r.ok ? setT(r.data) : setMissing(r.status !== 401))) }, [])
  useEffect(load, [load])
  const title = t ? t.ticket.subject : missing ? 'Conversation not found' : 'Conversation'
  return (
    <Shell title={title} crumbs={[{ label: 'Support', href: '/support/' }, { label: t ? `#${t.ticket.id}` : '…' }]}>
      {missing ? <div className={u.panel}><p className={u.empty}>This conversation could not be found. <Link href="/support/">Back to Support</Link></p></div>
        : !t ? <p className={u.muted}>Loading…</p> : <View t={t} reload={load} />}
    </Shell>
  )
}
