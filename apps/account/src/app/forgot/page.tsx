'use client'
import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/lib/api'
import { AuthLayout, StateIcon } from '@/components/AuthLayout'
import f from '@/components/forms.module.css'

export default function Forgot() {
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '')
    setBusy(true); setError('')
    const r = await api<{ error?: string }>('/api/auth/forgot', { method: 'POST', json: { email } })
    setBusy(false)
    if (r.ok) setSent(email)
    else setError(r.data.error ?? 'Could not send the reset link.')
  }
  if (sent) {
    return (
      <AuthLayout title="Check your email" below={<Link href="/login/">Back to sign in</Link>}>
        <StateIcon kind="mail" />
        <p style={{ margin: 0, color: 'var(--ink-2)' }}>If an account exists for <b>{sent}</b>, we sent it a link to reset the password. The link expires in 1 hour and works once.</p>
        <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 13 }}>Nothing arrived? Check your spam folder, or write to <a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a>.</p>
      </AuthLayout>
    )
  }
  return (
    <AuthLayout title="Reset your password" lede="Enter your account email and we’ll send you a link to choose a new password." below={<Link href="/login/">Back to sign in</Link>}>
      <form className={f.form} onSubmit={onSubmit}>
        {error && <p className={f.error} role="alert">{error}</p>}
        <div className={f.field}><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required autoFocus className={f.input} /></div>
        <button className={`${f.submit} ${f.block}`} disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
    </AuthLayout>
  )
}
