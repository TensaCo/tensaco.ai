'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AuthLayout } from '@/components/AuthLayout'
import f from '@/components/forms.module.css'

export default function Reset() {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    // keep the token out of the address bar (and history) once it is read
    setToken(new URLSearchParams(location.search).get('token') ?? '')
    history.replaceState(null, '', '/reset/')
  }, [])
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    if (d.get('password') !== d.get('confirm')) { setError('The passwords don’t match.'); return }
    setBusy(true); setError('')
    const r = await api<{ error?: string }>('/api/auth/reset', { method: 'POST', json: { token, password: d.get('password') } })
    if (r.ok) location.href = '/?reset=1'
    else { setBusy(false); setError(r.data.error ?? 'Could not reset your password.') }
  }
  if (token === '') {
    return (
      <AuthLayout title="Reset link missing" lede="Open the link from your reset email, or request a new one." below={<Link href="/login/">Back to sign in</Link>}>
        <Link href="/forgot/" className={`${f.submit} ${f.block}`} style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}>Request a new link</Link>
      </AuthLayout>
    )
  }
  return (
    <AuthLayout title="Choose a new password" lede="Signing in with the new password signs out every other session." below={<Link href="/forgot/">Request a new link</Link>}>
      <form className={f.form} onSubmit={onSubmit}>
        {error && <p className={f.error} role="alert">{error}</p>}
        <div className={f.field}><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required autoFocus className={f.input} /><small>At least 10 characters.</small></div>
        <div className={f.field}><label htmlFor="confirm">Confirm new password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required className={f.input} /></div>
        <button className={`${f.submit} ${f.block}`} disabled={busy || token === null}>{busy ? 'Saving…' : 'Set new password'}</button>
      </form>
    </AuthLayout>
  )
}
