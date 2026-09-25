'use client'
import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/lib/api'
import { AuthSide } from '@/components/AuthSide'
import f from '@/components/forms.module.css'
import s from '@/components/AuthCard.module.css'

export default function Login() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const r = await api<{ ok?: boolean; error?: string }>('/api/auth/login', { method: 'POST', json: { email: d.get('email'), password: d.get('password') } })
    setBusy(false)
    if (r.ok) {
      const next = new URLSearchParams(location.search).get('next')
      location.href = next && next.startsWith('/') ? next : '/account/'
    } else setError(r.data.error ?? 'Could not log in.')
  }
  return (
    <div className={s.page}>
      <div className={s.panel}>
        <div className={s.card}>
          <h1>Log in</h1>
          <p>Access your TensaCo account.</p>
          <form className={f.form} onSubmit={onSubmit}>
            {error && <p className={f.error} role="alert">{error}</p>}
            <div className={f.field}><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required className={f.input} /></div>
            <div className={f.field}><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className={f.input} /></div>
            <button className={f.submit} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          </form>
          <p className={s.alt}>New to TensaCo? <Link href="/signup/">Create an account</Link></p>
          <p className={s.alt} style={{ marginTop: 8 }}>Forgot your password? Write to <a href="mailto:hello@tensaco.ai?subject=Password%20reset">hello@tensaco.ai</a> from your account email.</p>
        </div>
      </div>
      <AuthSide />
    </div>
  )
}
