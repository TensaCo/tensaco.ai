'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api, nextPath } from '@/lib/api'
import { AuthLayout } from '@/components/AuthLayout'
import f from '@/components/forms.module.css'

export default function Login() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { api('/api/auth/me').then((r) => { if (r.ok) location.replace(nextPath()) }) }, [])
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const r = await api<{ error?: string }>('/api/auth/login', { method: 'POST', json: { email: d.get('email'), password: d.get('password') } })
    if (r.ok) location.href = nextPath()
    else { setBusy(false); setError(r.data.error ?? 'Could not sign in.') }
  }
  return (
    <AuthLayout title="Sign in" lede="Use your TensaCo account." below={<>New to TensaCo? <Link href="/signup/">Create an account</Link></>}>
      <form className={f.form} onSubmit={onSubmit}>
        {error && <p className={f.error} role="alert">{error}</p>}
        <div className={f.field}><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required autoFocus className={f.input} /></div>
        <div className={f.field}>
          <div className={f.labelRow}><label htmlFor="password">Password</label><Link href="/forgot/">Forgot password?</Link></div>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={f.input} />
        </div>
        <button className={`${f.submit} ${f.block}`} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  )
}
