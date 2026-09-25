'use client'
import Link from 'next/link'
import { useState } from 'react'
import { api, fmtDate } from '@/lib/api'
import { Shell, useAccount } from '@/components/Shell'
import f from '@/components/forms.module.css'
import u from '@/components/ui.module.css'

function Security() {
  const { account } = useAccount()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [others, setOthers] = useState('')
  const [busy, setBusy] = useState(false)
  const change = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const d = new FormData(form)
    if (d.get('password') !== d.get('confirm')) { setMsg({ ok: false, text: 'The new passwords don’t match.' }); return }
    setBusy(true)
    const r = await api<{ error?: string }>('/api/auth/password', { method: 'POST', json: { current: d.get('current'), password: d.get('password') } })
    setBusy(false)
    if (r.ok) { form.reset(); setMsg({ ok: true, text: 'Password changed. Your other sessions were signed out, and we emailed you a confirmation.' }) }
    else setMsg({ ok: false, text: r.data.error ?? 'Could not change your password.' })
  }
  const signOutOthers = async () => {
    const r = await api('/api/auth/logout-others', { method: 'POST' })
    setOthers(r.ok ? 'Every other session was signed out.' : 'Could not sign out other sessions.')
  }
  return (
    <div style={{ maxWidth: 760 }}>
      <div className={u.panel}>
        <div className={u.panelHead}><h2>Password</h2></div>
        <form className={`${f.form} ${u.pad}`} onSubmit={change}>
          {msg && <p className={msg.ok ? f.success : f.error} role="status">{msg.text}</p>}
          <input type="email" autoComplete="username" value={account.user.email} readOnly hidden />
          <div className={f.field}><label htmlFor="current">Current password</label><input id="current" name="current" type="password" autoComplete="current-password" required className={f.input} /></div>
          <div className={f.row}>
            <div className={f.field}><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className={f.input} /><small>At least 10 characters.</small></div>
            <div className={f.field}><label htmlFor="confirm">Confirm new password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required className={f.input} /></div>
          </div>
          <div className={f.actions}><button className={f.submit} disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button><Link href="/forgot/" className={u.muted}>Forgot your current password?</Link></div>
        </form>
      </div>
      <div className={u.panel}>
        <div className={u.panelHead}><h2>Sessions</h2></div>
        <div className={u.pad}>
          <p style={{ margin: '0 0 14px', color: 'var(--ink-2)' }}>Signed-in sessions last 30 days. If you signed in on a shared or lost device, sign out everywhere else.</p>
          <div className={f.actions}><button className={`${u.btn} ${u.ghost}`} onClick={signOutOthers}>Sign out other sessions</button>{others && <span className={u.muted}>{others}</span>}</div>
        </div>
      </div>
      <div className={u.panel}>
        <div className={u.panelHead}><h2>Email verification</h2></div>
        <p className={u.pad} style={{ margin: 0 }}>{account.user.emailVerifiedAt ? `${account.user.email} was verified on ${fmtDate(account.user.emailVerifiedAt)}.` : `${account.user.email} is not verified yet. Use the link in the banner above to send a new verification email.`}</p>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  return <Shell title="Security" crumbs={[{ label: 'Settings' }, { label: 'Security' }]} description="Your password and signed-in sessions."><Security /></Shell>
}
