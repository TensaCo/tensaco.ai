'use client'
import Link from 'next/link'
import { useState } from 'react'
import { api, fmtDate } from '@/lib/api'
import { Portal, Status, useAccount } from '@/components/portal/Portal'
import f from '@/components/forms.module.css'
import u from '@/components/portal/ui.module.css'

const CATEGORIES = [['general', 'General question'], ['phaser', 'PHASER'], ['tensorcode', 'TensorCode'], ['partnership', 'Partnerships'], ['billing', 'Billing'], ['account', 'Account and access']]

function Inbox() {
  const { account } = useAccount()
  const staff = account.user.role === 'staff'
  const [composing, setComposing] = useState(account.tickets.length === 0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const r = await api<{ id?: number; error?: string }>('/api/support/tickets', { method: 'POST', json: { subject: d.get('subject'), category: d.get('category'), body: d.get('body') } })
    setBusy(false)
    if (r.ok) location.href = `/account/support/ticket/?id=${r.data.id}`
    else setError(r.data.error ?? 'Could not send your message.')
  }
  return (
    <>
      {composing ? (
        <div className={u.panel}>
          <h2>New conversation with customer success</h2>
          <form className={f.form} onSubmit={onSubmit}>
            {error && <p className={f.error} role="alert">{error}</p>}
            <div className={f.row}>
              <div className={f.field}><label htmlFor="subject">Subject</label><input id="subject" name="subject" required maxLength={160} className={f.input} /></div>
              <div className={f.field}><label htmlFor="category">Topic</label><select id="category" name="category" className={f.select}>{CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            </div>
            <div className={f.field}><label htmlFor="body">How can we help?</label><textarea id="body" name="body" required className={f.textarea} /></div>
            <button className={f.submit} disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
          </form>
        </div>
      ) : null}
      <div className={u.panel}>
        <h2>{staff ? 'All conversations' : 'Your conversations'}</h2>
        {account.tickets.length === 0 ? <p className={u.empty}>No conversations yet.</p> : (
          <table className={u.table}>
            <thead><tr><th>Subject</th>{staff && <th>Customer</th>}<th>Topic</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>{account.tickets.map((t) => (
              <tr key={t.id}>
                <td><Link href={`/account/support/ticket/?id=${t.id}`}>{t.subject}</Link></td>
                {staff && <td className={u.muted}>{t.customer}</td>}
                <td className={u.muted}>{CATEGORIES.find(([v]) => v === t.category)?.[1] ?? t.category}</td>
                <td><Status value={t.status} /></td>
                <td className={u.muted}>{fmtDate(t.updatedAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {!composing && <p style={{ marginTop: 20 }}><button className={u.btn} onClick={() => setComposing(true)}>New conversation</button></p>}
    </>
  )
}

export default function Support() {
  return <Portal title="Support inbox"><Inbox /></Portal>
}
