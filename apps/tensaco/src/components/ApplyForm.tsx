'use client'
import Link from 'next/link'
import { useState } from 'react'
import f from './forms.module.css'

/** Job application: multipart POST to /api/careers/apply → D1 (applications) + R2 (résumé). */
export function ApplyForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    data.set('job_id', jobId)
    data.set('source', new URLSearchParams(location.search).get('source') ?? 'careers-site')
    setState('busy'); setError('')
    try {
      const r = await fetch('/api/careers/apply', { method: 'POST', body: data, credentials: 'same-origin' })
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (r.ok && j.ok) setState('done')
      else { setError(j.error ?? 'Something went wrong. Please try again.'); setState('error') }
    } catch { setError('Network error. Please try again.'); setState('error') }
  }
  if (state === 'done') {
    return (
      <p className={f.success} role="status">
        Thank you for applying for {jobTitle}. We review every application and will be in touch. Create an account with the same email to <Link href="/signup/">track your application</Link>.
      </p>
    )
  }
  return (
    <form className={f.form} onSubmit={onSubmit} encType="multipart/form-data">
      {state === 'error' && <p className={f.error} role="alert">{error}</p>}
      <div className={f.row}>
        <div className={f.field}><label htmlFor="name">Full name *</label><input id="name" name="name" required autoComplete="name" className={f.input} /></div>
        <div className={f.field}><label htmlFor="email">Email *</label><input id="email" name="email" type="email" required autoComplete="email" className={f.input} /></div>
      </div>
      <div className={f.row}>
        <div className={f.field}><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" autoComplete="tel" className={f.input} /></div>
        <div className={f.field}><label htmlFor="location">Current location</label><input id="location" name="location" autoComplete="address-level2" className={f.input} placeholder="City, country" /></div>
      </div>
      <div className={f.row}>
        <div className={f.field}><label htmlFor="linkedin">LinkedIn profile</label><input id="linkedin" name="linkedin" type="url" className={f.input} placeholder="https://" /></div>
        <div className={f.field}><label htmlFor="website">Website, GitHub or portfolio</label><input id="website" name="website" type="url" className={f.input} placeholder="https://" /></div>
      </div>
      <div className={f.field}><label htmlFor="resume">Résumé / CV * <small>PDF, Word or text, up to 10 MB</small></label><input id="resume" name="resume" type="file" required accept=".pdf,.doc,.docx,.txt,application/pdf" className={f.input} /></div>
      <div className={f.field}>
        <label htmlFor="work_authorization">Are you authorized to work in the United States?</label>
        <select id="work_authorization" name="work_authorization" className={f.select}>
          <option value="">Select…</option><option>Yes</option><option>Yes, but I will need sponsorship in the future</option><option>No, I will need sponsorship</option><option>I am applying from outside the US</option>
        </select>
      </div>
      <div className={f.field}><label htmlFor="cover_letter">Cover letter <small>(optional)</small></label><textarea id="cover_letter" name="cover_letter" className={f.textarea} placeholder="Tell us about work you’re proud of and why this role." /></div>
      <input name="company" tabIndex={-1} autoComplete="off" className={f.trap} aria-hidden="true" />
      <label className={f.check}><input type="checkbox" required /> <span>I agree that TensaCo may process my application data as described in the <Link href="/legal/privacy/">Privacy Policy</Link>.</span></label>
      <button className={f.submit} disabled={state === 'busy'}>{state === 'busy' ? 'Submitting…' : 'Submit application'}</button>
    </form>
  )
}
