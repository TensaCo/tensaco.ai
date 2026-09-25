'use client'
import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/lib/api'
import { AuthSide } from '@/components/AuthSide'
import f from '@/components/forms.module.css'
import s from '@/components/AuthCard.module.css'

export default function Signup() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    if (d.get('password') !== d.get('confirm')) { setError('The passwords don’t match.'); return }
    setBusy(true); setError('')
    const r = await api<{ ok?: boolean; error?: string }>('/api/auth/signup', {
      method: 'POST',
      json: { name: d.get('name'), email: d.get('email'), organization: d.get('organization'), password: d.get('password'), company: d.get('company') },
    })
    setBusy(false)
    if (r.ok) location.href = '/account/'
    else setError(r.data.error ?? 'Could not create your account.')
  }
  return (
    <div className={s.page}>
      <div className={s.panel}>
        <div className={s.card}>
          <h1>Create your account</h1>
          <p>One account for support, service requests and applications.</p>
          <form className={f.form} onSubmit={onSubmit}>
            {error && <p className={f.error} role="alert">{error}</p>}
            <div className={f.field}><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required className={f.input} /></div>
            <div className={f.field}><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required className={f.input} /></div>
            <div className={f.field}><label htmlFor="organization">Organization <small>(optional)</small></label><input id="organization" name="organization" autoComplete="organization" className={f.input} /></div>
            <div className={f.row}>
              <div className={f.field}><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className={f.input} /></div>
              <div className={f.field}><label htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required className={f.input} /></div>
            </div>
            <input name="company" tabIndex={-1} autoComplete="off" className={f.trap} aria-hidden="true" />
            <label className={f.check}><input type="checkbox" required /> <span>I agree to the <Link href="/legal/terms/">Terms of Use</Link> and acknowledge the <Link href="/legal/privacy/">Privacy Policy</Link>.</span></label>
            <button className={f.submit} disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
          </form>
          <p className={s.alt}>Already have an account? <Link href="/login/">Log in</Link></p>
        </div>
      </div>
      <AuthSide />
    </div>
  )
}
