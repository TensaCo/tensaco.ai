'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { AuthLayout, StateIcon } from '@/components/AuthLayout'
import f from '@/components/forms.module.css'

export default function Verify() {
  const [state, setState] = useState<{ ok: boolean; error?: string } | null>(null)
  const once = useRef(false)
  useEffect(() => {
    if (once.current) return
    once.current = true
    const token = new URLSearchParams(location.search).get('token') ?? ''
    history.replaceState(null, '', '/verify/')
    api<{ error?: string }>('/api/auth/verify', { method: 'POST', json: { token } })
      .then((r) => setState(r.ok ? { ok: true } : { ok: false, error: r.data.error }))
  }, [])
  if (!state) return <AuthLayout title="Verifying your email…"><p style={{ margin: 0, color: 'var(--muted)' }}>One moment.</p></AuthLayout>
  return state.ok ? (
    <AuthLayout title="Email verified">
      <StateIcon kind="ok" />
      <p style={{ margin: '0 0 20px', color: 'var(--ink-2)' }}>Thank you. Your email address is confirmed.</p>
      <Link href="/" className={`${f.submit} ${f.block}`} style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}>Continue to your account</Link>
    </AuthLayout>
  ) : (
    <AuthLayout title="Link not valid">
      <StateIcon kind="bad" />
      <p style={{ margin: '0 0 20px', color: 'var(--ink-2)' }}>{state.error ?? 'This verification link is invalid or has expired.'}</p>
      <Link href="/" className={`${f.submit} ${f.block}`} style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}>Go to your account</Link>
    </AuthLayout>
  )
}
