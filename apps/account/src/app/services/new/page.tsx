'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { SERVICE_NAMES, Shell, useAccount } from '@/components/Shell'
import f from '@/components/forms.module.css'
import u from '@/components/ui.module.css'

const NOTES: Record<string, string> = {
  'phaser-compute': 'Early access to run workloads on PHASER systems as they come online. Requests join the early-access queue.',
  'phaser-research': 'Joint research on optical computation: simulation studies, benchmarks and bench experiments.',
  'tensorcode-deployment': 'Help taking TensorCode programs into production: architecture review, integration and support.',
  'tensorcode-training': 'Training and retraining TensorCode programs on your reviewed feedback.',
}

function Form() {
  const { account } = useAccount()
  const [service, setService] = useState('phaser-compute')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const r = await api<{ id?: number; error?: string }>('/api/services/requests', {
      method: 'POST', json: { service, organization: d.get('organization'), use_case: d.get('use_case'), scale: d.get('scale'), timeline: d.get('timeline') },
    })
    if (r.ok) location.href = `/services/request/?id=${r.data.id}`
    else { setBusy(false); setError(r.data.error ?? 'Could not submit your request.') }
  }
  return (
    <div className={u.panel} style={{ maxWidth: 760 }}>
      <form className={`${f.form} ${u.pad}`} onSubmit={onSubmit}>
        {error && <p className={f.error} role="alert">{error}</p>}
        <div className={f.field}>
          <label htmlFor="service">Service</label>
          <select id="service" className={f.select} value={service} onChange={(e) => setService(e.target.value)}>
            {Object.entries(SERVICE_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <small>{NOTES[service]}</small>
        </div>
        <div className={f.row}>
          <div className={f.field}><label htmlFor="organization">Organization</label><input id="organization" name="organization" defaultValue={account.user.organization ?? ''} className={f.input} /></div>
          <div className={f.field}><label htmlFor="timeline">Timeline</label>
            <select id="timeline" name="timeline" className={f.select}><option>Exploring</option><option>Within 3 months</option><option>3 to 6 months</option><option>6 to 12 months</option><option>Over a year</option></select>
          </div>
        </div>
        <div className={f.field}><label htmlFor="use_case">What do you want to run or achieve?</label><textarea id="use_case" name="use_case" required className={f.textarea} placeholder="Workload, model sizes, current infrastructure, goals" /></div>
        <div className={f.field}><label htmlFor="scale">Scale <small>(optional)</small></label><input id="scale" name="scale" className={f.input} placeholder="For example: layer widths, requests per second, team size" /></div>
        <div className={f.actions}><button className={f.submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button><a href="/services/" className={`${u.btn} ${u.ghost}`}>Cancel</a></div>
      </form>
    </div>
  )
}

export default function NewRequest() {
  return <Shell title="Request a service" crumbs={[{ label: 'Service requests', href: '/services/' }, { label: 'New request' }]} description="Submitting a request doesn’t commit you to anything. We review each one and reply by email and here."><Form /></Shell>
}
