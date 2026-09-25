'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { CATEGORY_NAMES, Shell } from '@/components/Shell'
import f from '@/components/forms.module.css'
import u from '@/components/ui.module.css'

function Compose() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const r = await api<{ id?: number; error?: string }>('/api/support/tickets', { method: 'POST', json: { subject: d.get('subject'), category: d.get('category'), body: d.get('body') } })
    if (r.ok) location.href = `/support/ticket/?id=${r.data.id}`
    else { setBusy(false); setError(r.data.error ?? 'Could not send your message.') }
  }
  return (
    <div className={u.panel} style={{ maxWidth: 760 }}>
      <form className={`${f.form} ${u.pad}`} onSubmit={onSubmit}>
        {error && <p className={f.error} role="alert">{error}</p>}
        <div className={f.row}>
          <div className={f.field}><label htmlFor="subject">Subject</label><input id="subject" name="subject" required maxLength={160} autoFocus className={f.input} /></div>
          <div className={f.field}><label htmlFor="category">Topic</label><select id="category" name="category" className={f.select}>{Object.entries(CATEGORY_NAMES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <div className={f.field}><label htmlFor="body">Message</label><textarea id="body" name="body" required className={f.textarea} style={{ minHeight: 180 }} /><small>Include what you were trying to do and any identifiers (organization, request number) that help us find it.</small></div>
        <div className={f.actions}><button className={f.submit} disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button><a href="/support/" className={`${u.btn} ${u.ghost}`}>Cancel</a></div>
      </form>
    </div>
  )
}

export default function NewTicket() {
  return <Shell title="New conversation" crumbs={[{ label: 'Support', href: '/support/' }, { label: 'New conversation' }]} description="A member of our customer success team will reply, usually within one business day."><Compose /></Shell>
}
