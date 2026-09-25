'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { api, fmtDate, fmtDateTime } from '@/lib/api'
import { Portal, Status } from '@/components/portal/Portal'
import f from '@/components/forms.module.css'
import u from '@/components/portal/ui.module.css'

type Thread = {
  ticket: { id: number; subject: string; category: string; status: string; createdAt: string; customerName: string; customerEmail: string; customerOrg: string | null }
  messages: { id: number; body: string; fromStaff: boolean; createdAt: string; author: string | null }[]
  staff: boolean
}

function View() {
  const [t, setT] = useState<Thread | null>(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const id = typeof window === 'undefined' ? '' : new URLSearchParams(location.search).get('id') ?? ''
  const load = useCallback(() => { api<Thread>(`/api/support/tickets/${id}`).then((r) => (r.ok ? setT(r.data) : setMissing(true))) }, [id])
  useEffect(load, [load])
  if (missing) return <p className={u.empty}>This conversation could not be found. <Link href="/account/support/">Back to the inbox</Link></p>
  if (!t) return <p className={u.empty}>Loading…</p>
  const reply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const body = new FormData(form).get('body')
    setBusy(true); setError('')
    const r = await api<{ error?: string }>(`/api/support/tickets/${id}`, { method: 'POST', json: { body } })
    setBusy(false)
    if (r.ok) { form.reset(); load() } else setError(r.data.error ?? 'Could not send your reply.')
  }
  const setStatus = async (status: string) => { await api(`/api/support/tickets/${id}`, { method: 'PATCH', json: { status } }); load() }
  return (
    <>
      <h2 style={{ fontSize: 24, margin: '0 0 8px' }}>{t.ticket.subject}</h2>
      <div className={u.meta}>
        <Status value={t.ticket.status} /><span>Opened {fmtDate(t.ticket.createdAt)}</span>
        {t.staff && <span>{t.ticket.customerName} · {t.ticket.customerEmail}{t.ticket.customerOrg ? ` · ${t.ticket.customerOrg}` : ''}</span>}
      </div>
      <div className={u.thread}>
        {t.messages.map((m) => (
          <div key={m.id} className={`${u.msg} ${m.fromStaff ? u.staff : ''}`}>
            <div className={u.msgHead}><b>{m.fromStaff ? `${m.author ?? 'TensaCo'} · TensaCo customer success` : m.author ?? 'You'}</b><span>{fmtDateTime(m.createdAt)}</span></div>
            <div className={u.msgBody}>{m.body}</div>
          </div>
        ))}
      </div>
      <div className={u.panel}>
        <form className={f.form} onSubmit={reply}>
          {error && <p className={f.error} role="alert">{error}</p>}
          <div className={f.field}><label htmlFor="body">{t.staff ? 'Reply as TensaCo' : 'Reply'}</label><textarea id="body" name="body" required className={f.textarea} /></div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className={f.submit} disabled={busy}>{busy ? 'Sending…' : 'Send reply'}</button>
            {t.ticket.status !== 'resolved'
              ? <button type="button" className={`${u.btn} ${u.ghost}`} onClick={() => setStatus('resolved')}>Mark resolved</button>
              : <button type="button" className={`${u.btn} ${u.ghost}`} onClick={() => setStatus('open')}>Reopen</button>}
          </div>
        </form>
      </div>
    </>
  )
}

export default function Ticket() {
  return <Portal title="Support conversation" actions={<Link href="/account/support/" className={`${u.btn} ${u.ghost}`}>All conversations</Link>}><View /></Portal>
}
