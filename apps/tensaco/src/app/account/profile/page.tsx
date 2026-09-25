'use client'
import { useState } from 'react'
import { api, fmtDate } from '@/lib/api'
import { Portal, useAccount } from '@/components/portal/Portal'
import f from '@/components/forms.module.css'
import u from '@/components/portal/ui.module.css'

function Profile() {
  const { account, reload } = useAccount()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const r = await api<{ error?: string }>('/api/account/profile', { method: 'POST', json: { name: d.get('name'), organization: d.get('organization'), subscribed: d.get('subscribed') === 'on' } })
    setMsg(r.ok ? { ok: true, text: 'Saved.' } : { ok: false, text: r.data.error ?? 'Could not save.' })
    if (r.ok) reload()
  }
  return (
    <div className={u.panel}>
      <h2>Profile</h2>
      <form className={f.form} onSubmit={onSubmit}>
        {msg && <p className={msg.ok ? f.success : f.error} role="status">{msg.text}</p>}
        <div className={f.row}>
          <div className={f.field}><label htmlFor="name">Full name</label><input id="name" name="name" defaultValue={account.user.name} required className={f.input} /></div>
          <div className={f.field}><label htmlFor="organization">Organization</label><input id="organization" name="organization" defaultValue={account.user.organization ?? ''} className={f.input} /></div>
        </div>
        <div className={f.field}><label>Email</label><input value={account.user.email} disabled className={f.input} /><small>To change your email, contact customer success.</small></div>
        <label className={f.check}><input type="checkbox" name="subscribed" defaultChecked={account.subscribed} /> <span>Email me TensaCo news and product updates</span></label>
        <button className={f.submit}>Save changes</button>
        <p className={u.muted}>Member since {fmtDate(account.user.createdAt)}</p>
      </form>
    </div>
  )
}

export default function ProfilePage() {
  return <Portal title="Profile"><Profile /></Portal>
}
