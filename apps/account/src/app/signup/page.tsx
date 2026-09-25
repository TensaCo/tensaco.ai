'use client'
import Link from 'next/link'
import { useState } from 'react'
import { api, SITE } from '@/lib/api'
import { AuthLayout } from '@/components/AuthLayout'
import f from '@/components/forms.module.css'

export default function Signup() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    if (d.get('password') !== d.get('confirm')) { setError('The passwords don’t match.'); return }
    setBusy(true); setError('')
    const r = await api<{ error?: string }>('/api/auth/signup', {
      method: 'POST',
      json: { name: d.get('name'), email: d.get('email'), organization: d.get('organization'), password: d.get('password'), company: d.get('company') },
    })
    if (r.ok) location.href = '/?welcome=1'
    else { setBusy(false); setError(r.data.error ?? 'Could not create your account.') }
  }
  return (
    <AuthLayout title="Create your account" lede="One account for support, service requests and job applications."
      below={<>Already have an account? <Link href="/login/">Sign in</Link></>}>
      <form className={f.form} onSubmit={onSubmit}>
        {error && <p className={f.error} role="alert">{error}</p>}
        <div className={f.field}><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required autoFocus className={f.input} /></div>
        <div className={f.field}><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required className={f.input} /><small>We’ll send a link to verify this address.</small></div>
        <div className={f.field}><label htmlFor="organization">Organization <small>(optional)</small></label><input id="organization" name="organization" autoComplete="organization" className={f.input} /></div>
        <div className={f.field}><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className={f.input} /><small>At least 10 characters.</small></div>
        <div className={f.field}><label htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required className={f.input} /></div>
        <input name="company" tabIndex={-1} autoComplete="off" className={f.trap} aria-hidden="true" />
        <label className={f.check}><input type="checkbox" required /> <span>I agree to the <a href={`${SITE}/legal/terms/`}>Terms of Use</a> and acknowledge the <a href={`${SITE}/legal/privacy/`}>Privacy Policy</a>.</span></label>
        <button className={`${f.submit} ${f.block}`} disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthLayout>
  )
}
