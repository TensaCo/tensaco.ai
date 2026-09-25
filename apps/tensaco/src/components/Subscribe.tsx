'use client'
import { useState } from 'react'
import s from './Subscribe.module.css'

/** Email capture: POSTs to /api/subscribe (Worker → D1, arm "tensaco"). `company` is a honeypot people never see. */
export function Subscribe({ source }: { source: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setState('busy')
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: f.get('email'), company: f.get('company'), source }),
      })
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (r.ok && j.ok) setState('done')
      else { setError(j.error ?? 'Something went wrong. Please try again.'); setState('error') }
    } catch {
      setError('Network error. Please try again.')
      setState('error')
    }
  }
  if (state === 'done') return <p className={s.done} role="status">Thank you. You’re subscribed to TensaCo news.</p>
  return (
    <form className={s.form} onSubmit={onSubmit}>
      <label className={s.hidden} htmlFor={`email-${source}`}>Email address</label>
      <input id={`email-${source}`} name="email" type="email" required autoComplete="email" placeholder="you@company.com" className={s.input} />
      <input name="company" type="text" tabIndex={-1} autoComplete="off" className={s.trap} aria-hidden="true" />
      <button type="submit" className={s.button} disabled={state === 'busy'}>{state === 'busy' ? 'Subscribing…' : 'Subscribe'}</button>
      {state === 'error' && <p className={s.error} role="alert">{error}</p>}
      <p className={s.fine}>News from TensaCo. See our <a href="/privacy/">privacy notice</a>. Unsubscribe any time.</p>
    </form>
  )
}
