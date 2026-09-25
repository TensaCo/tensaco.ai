'use client'
import Link from 'next/link'
import { useState } from 'react'
import { api, fmtDate } from '@/lib/api'
import { Portal, SERVICE_NAMES, Status, useAccount } from '@/components/portal/Portal'
import f from '@/components/forms.module.css'
import u from '@/components/portal/ui.module.css'

const SERVICES = [
  { id: 'phaser-compute', note: 'Early access to run workloads on PHASER systems as they come online. Requests join the early-access queue.' },
  { id: 'phaser-research', note: 'Joint research on optical computation: simulation studies, benchmarks and bench experiments.' },
  { id: 'tensorcode-deployment', note: 'Help taking TensorCode programs into production: architecture review, integration and support.' },
  { id: 'tensorcode-training', note: 'Training and retraining TensorCode programs on your reviewed feedback.' },
]

function Services() {
  const { account } = useAccount()
  const [service, setService] = useState(SERVICES[0].id)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const r = await api<{ id?: number; error?: string }>('/api/services/requests', {
      method: 'POST',
      json: { service, organization: d.get('organization'), use_case: d.get('use_case'), scale: d.get('scale'), timeline: d.get('timeline') },
    })
    setBusy(false)
    if (r.ok) location.href = `/account/services/request/?id=${r.data.id}`
    else setError(r.data.error ?? 'Could not submit your request.')
  }
  return (
    <>
      <div className={u.panel}>
        <h2>Request a service</h2>
        <form className={f.form} onSubmit={onSubmit}>
          {error && <p className={f.error} role="alert">{error}</p>}
          <div className={f.field}>
            <label htmlFor="service">Service</label>
            <select id="service" className={f.select} value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => <option key={s.id} value={s.id}>{SERVICE_NAMES[s.id]}</option>)}
            </select>
            <small>{SERVICES.find((s) => s.id === service)?.note}</small>
          </div>
          <div className={f.row}>
            <div className={f.field}><label htmlFor="organization">Organization</label><input id="organization" name="organization" defaultValue={account.user.organization ?? ''} className={f.input} /></div>
            <div className={f.field}><label htmlFor="timeline">Timeline</label>
              <select id="timeline" name="timeline" className={f.select}><option>Exploring</option><option>Within 3 months</option><option>3 to 6 months</option><option>6 to 12 months</option><option>Over a year</option></select>
            </div>
          </div>
          <div className={f.field}><label htmlFor="use_case">What do you want to run or achieve?</label><textarea id="use_case" name="use_case" required className={f.textarea} placeholder="Workload, model sizes, current infrastructure, goals" /></div>
          <div className={f.field}><label htmlFor="scale">Scale <small>(optional)</small></label><input id="scale" name="scale" className={f.input} placeholder="For example: layer widths, requests per second, team size" /></div>
          <button className={f.submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
        </form>
      </div>
      <div className={u.panel}>
        <h2>Your requests</h2>
        {account.requests.length === 0 ? <p className={u.empty}>No requests yet.</p> : (
          <table className={u.table}>
            <thead><tr><th>Service</th><th>Organization</th><th>Status</th><th>Submitted</th></tr></thead>
            <tbody>{account.requests.map((r) => (
              <tr key={r.id}><td><Link href={`/account/services/request/?id=${r.id}`}>{SERVICE_NAMES[r.service]}</Link></td><td className={u.muted}>{r.organization ?? '—'}</td><td><Status value={r.status} /></td><td className={u.muted}>{fmtDate(r.createdAt)}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default function ServicesPage() {
  return <Portal title="Service requests"><Services /></Portal>
}
