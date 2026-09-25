'use client'
import { useState } from 'react'
import { api, fmtDate } from '@/lib/api'
import { Shell, useAccount } from '@/components/Shell'
import f from '@/components/forms.module.css'
import u from '@/components/ui.module.css'

function Profile() {
  const { account, reload } = useAccount()
  const me = account.user
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setBusy(true)
    const r = await api<{ error?: string }>('/api/account/profile', {
      method: 'POST',
      json: { name: d.get('name'), organization: d.get('organization'), notify_updates: d.get('notify_updates') === 'on', subscribed: d.get('subscribed') === 'on' },
    })
    setBusy(false)
    setMsg(r.ok ? { ok: true, text: 'Your changes were saved.' } : { ok: false, text: r.data.error ?? 'Could not save.' })
    if (r.ok) reload()
  }
  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 760 }}>
      {msg && <p className={msg.ok ? f.success : f.error} role="status" style={{ marginBottom: 16 }}>{msg.text}</p>}
      <div className={u.panel}>
        <div className={u.panelHead}><h2>Personal information</h2></div>
        <div className={`${f.form} ${u.pad}`}>
          <div className={f.row}>
            <div className={f.field}><label htmlFor="name">Full name</label><input id="name" name="name" defaultValue={me.name} required className={f.input} /></div>
            <div className={f.field}><label htmlFor="organization">Organization</label><input id="organization" name="organization" defaultValue={me.organization ?? ''} className={f.input} /></div>
          </div>
          <div className={f.field}>
            <label htmlFor="email">Email</label><input id="email" value={me.email} disabled className={f.input} />
            <small>{me.emailVerifiedAt ? `Verified ${fmtDate(me.emailVerifiedAt)}.` : 'Not verified yet.'} To change your email address, contact customer success.</small>
          </div>
        </div>
      </div>
      <div className={u.panel}>
        <div className={u.panelHead}><h2>Email preferences</h2></div>
        <div className={`${f.form} ${u.pad}`}>
          <label className={f.check}><input type="checkbox" name="notify_updates" defaultChecked={me.notifyUpdates} />
            <span><b>Updates on my account activity</b>Replies to my support conversations, and status changes to my service requests and job applications.</span></label>
          <label className={f.check}><input type="checkbox" name="subscribed" defaultChecked={account.subscribed} />
            <span><b>TensaCo news</b>Occasional company and product updates.</span></label>
          <p className={u.muted} style={{ margin: 0, fontSize: 13 }}>Security emails (email verification, password resets and password changes) are always sent.</p>
        </div>
      </div>
      <div className={f.actions} style={{ marginTop: 16 }}>
        <button className={f.submit} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        <span className={u.muted}>Member since {fmtDate(me.createdAt)}</span>
      </div>
    </form>
  )
}

export default function ProfilePage() {
  return <Shell title="Profile" crumbs={[{ label: 'Settings' }, { label: 'Profile' }]} description="Your name, organization and which emails you receive."><Profile /></Shell>
}
